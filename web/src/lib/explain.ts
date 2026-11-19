import type { ForecastResult, OptimizationResult, Reading, Run, ScenarioResult } from "./types";
import { isForecast, isOptimization, isScenario } from "./types";

export type Explanation = Reading;

const LIMITS =
  "Advisory draft. Independent review is required. This is not a dispatch instruction or a certified adequacy study.";

export function localExplanation(run: Run): Explanation {
  if (isForecast(run.result)) {
    const peak = Math.max(...run.result.values);
    const method = String(run.inputs.method || "The stored method");
    const first = run.result.values[0];
    return {
      summary: `${method} filed ${run.result.values.length} hours. Peak projected demand is ${round(peak)} MW. Historical residual MAE is ${round(run.result.mae)} MW. Hour 1 is ${round(first)} MW, and its stored band runs from ${round(run.result.low[0])} to ${round(run.result.high[0])} MW.`,
      claims: [
        { metric: "Peak forecast MW", value: peak },
        { metric: "Residual MAE MW", value: run.result.mae },
        { metric: "Hour 1 MW", value: first },
        { metric: "Hour 1 lower MW", value: run.result.low[0] },
        { metric: "Hour 1 upper MW", value: run.result.high[0] },
      ],
      abstained: false,
      limits: LIMITS,
      mode: "local",
    };
  }
  if (isScenario(run.result)) {
    return {
      summary: `Under the assumed event, mean unserved energy is ${round(run.result.mean)} MWh and the modeled shortfall probability is ${round(run.result.prob * 100)} percent.`,
      claims: [
        { metric: "Mean unserved energy MWh", value: run.result.mean },
        { metric: "Shortfall probability", value: run.result.prob },
      ],
      abstained: false,
      limits: LIMITS,
      mode: "local",
    };
  }
  if (isOptimization(run.result)) {
    if (!run.result.feasible) {
      return {
        summary: "No portfolio satisfies the encoded budget and capacity constraints.",
        claims: [],
        abstained: false,
        limits: LIMITS,
        mode: "local",
      };
    }
    const plan = run.result.plans[0];
    return {
      summary: `The least-cost encoded feasible portfolio costs ${round(plan.cost)} million dollars and adds ${round(plan.mw)} MW. It is not a power-flow or dispatch result.`,
      claims: [
        { metric: "Minimum cost $m", value: plan.cost },
        { metric: "Added MW", value: plan.mw },
      ],
      abstained: false,
      limits: LIMITS,
      mode: "local",
    };
  }
  return {
    summary: "This run stores benchmark metrics. Compare methods against the seasonal-naive row before treating an error as skill.",
    claims: [],
    abstained: false,
    limits: LIMITS,
    mode: "local",
  };
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function collectNumbers(value: unknown, into: number[]) {
  if (typeof value === "number" && Number.isFinite(value)) into.push(value);
  else if (value && typeof value === "object") {
    for (const child of Object.values(value)) collectNumbers(child, into);
  }
}

export function claimsMatchRun(run: Run, claims: { metric: string; value: number }[]) {
  const numbers: number[] = [];
  collectNumbers(run.inputs, numbers);
  collectNumbers(run.result, numbers);
  return claims.every((claim) =>
    numbers.some((value) => Math.abs(value - claim.value) <= Math.max(0.01, Math.abs(value) * 1e-6)),
  );
}

export async function explainRun(run: Run): Promise<Explanation> {
  const fallback = localExplanation(run);
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return fallback;

  const payload = {
    runId: run.id,
    type: run.type,
    region: run.region,
    engine: run.engine,
    sources: run.sources,
    inputs: run.inputs,
    result: shrink(run.result),
  };

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: instructions(run),
          },
          { role: "user", content: JSON.stringify({ ...payload, alignment: alignment(run) }) },
        ],
      }),
    });
    if (!response.ok) {
      return { ...fallback, mode: "fallback", note: "Groq did not answer. The local explanation is shown." };
    }
    const json = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return { ...fallback, mode: "fallback", note: "Groq returned an empty answer." };
    const parsed = JSON.parse(content) as {
      summary?: string;
      claims?: { metric?: string; value?: number }[];
      abstained?: boolean;
    };
    const claims = Array.isArray(parsed.claims)
      ? parsed.claims
          .filter((claim) => claim && typeof claim.metric === "string" && typeof claim.value === "number")
          .map((claim) => ({ metric: claim.metric as string, value: claim.value as number }))
      : [];
    if (parsed.abstained || !claimsMatchRun(run, claims) || typeof parsed.summary !== "string") {
      return {
        ...fallback,
        mode: "fallback",
        note: "Groq abstained or cited a number that is not in the run. The local explanation is shown.",
      };
    }
    return {
      summary: parsed.summary,
      claims,
      abstained: false,
      limits: LIMITS,
      mode: "groq",
    };
  } catch {
    return { ...fallback, mode: "fallback", note: "Groq was unreachable. The local explanation is shown." };
  }
}

function instructions(run: Run) {
  const shared =
    "Use only numbers present in the JSON. Do not invent measurements, dispatch orders, or outage-avoided claims. Return JSON with keys summary (string), claims (array of {metric, value} where value is a number copied from the JSON), abstained (boolean), limits (string). If you cannot cite a number, set abstained true and explain why in summary.";
  if (run.type === "forecast") {
    return `You read a demand forecast that GRID-CASE-1.0 already computed. You do not forecast or replace a number. Seasonal naive copies each hour from 24 hours earlier. Exponential smoothing sets every future hour to one stored level, updated as 0.3 times each observation plus 0.7 times the prior level. The band is the point plus the 5th and 95th percentile of past residuals, floored at zero, and may sit above or below the point. Explain this run's method, horizon, peak, residual MAE, and the first hour's point and band. ${shared}`;
  }
  return `You explain one stored GRID-PRIME analytical run for a human reviewer. ${shared}`;
}

function alignment(run: Run) {
  if (!isForecast(run.result)) return null;
  const method = String(run.inputs.method);
  return {
    engine: run.engine,
    method,
    horizonHours: run.result.values.length,
    rule:
      method === "Seasonal naive"
        ? "Each forecast hour copies the load from 24 hours earlier."
        : "Every forecast hour is the final smoothed level.",
  };
}

function shrink(result: ForecastResult | ScenarioResult | OptimizationResult | Run["result"]) {
  if (isForecast(result)) {
    return {
      peak: Math.max(...result.values),
      mae: result.mae,
      values: result.values,
      low: result.low,
      high: result.high,
    };
  }
  if (isScenario(result)) {
    return { mean: result.mean, p95: result.p95, prob: result.prob };
  }
  if (isOptimization(result)) {
    return {
      feasible: result.feasible,
      count: result.count,
      best: result.plans[0] ? { cost: result.plans[0].cost, mw: result.plans[0].mw } : null,
    };
  }
  return result;
}
