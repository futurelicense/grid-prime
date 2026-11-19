import type { ForecastResult, OptimizationResult, Portfolio, ScenarioResult, ValidationResult } from "./types";

export const ENGINE = "GRID-CASE-1.0";

export const CANDIDATES: Portfolio["selected"] = [
  { name: "Firm capacity contract", mw: 90, cost: 22 },
  { name: "Demand flexibility program", mw: 40, cost: 8 },
  { name: "Storage planning option", mw: 55, cost: 18 },
  { name: "Resource availability upgrade", mw: 30, cost: 7 },
  { name: "Distributed generation package", mw: 45, cost: 14 },
  { name: "Additional import capacity concept", mw: 70, cost: 20 },
];

export function average(values: number[]) {
  if (!values.length) return Number.NaN;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function quantile(values: number[], p: number) {
  if (!values.length) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) * p)];
}

export function isRegularHourly(times: string[]) {
  if (times.length < 48) return false;
  for (let i = 1; i < times.length; i += 1) {
    if (Date.parse(times[i]) - Date.parse(times[i - 1]) !== 3_600_000) return false;
  }
  return true;
}

/** Seasonal naive and exponential smoothing, ported from the research prototype. */
export function calcForecast(loads: number[], method: string, horizon: number): ForecastResult {
  const residuals: number[] = [];
  let level = loads[0];
  for (let i = 1; i < loads.length; i += 1) {
    const prediction = method === "Seasonal naive" ? loads[i - 24] : level;
    if (Number.isFinite(prediction)) residuals.push(loads[i] - prediction);
    level = 0.3 * loads[i] + 0.7 * level;
  }
  const values = Array.from({ length: horizon }, (_, i) =>
    method === "Seasonal naive" ? loads[loads.length - 24 + i] : level,
  );
  const lowQ = quantile(residuals, 0.05);
  const highQ = quantile(residuals, 0.95);
  return {
    values,
    low: values.map((value) => Math.max(0, value + lowQ)),
    high: values.map((value) => Math.max(0, value + highQ)),
    mae: average(residuals.map((value) => Math.abs(value))),
  };
}

export function rng(seed: number) {
  let x = seed >>> 0;
  return () => {
    x = (Math.imul(1664525, x) + 1013904223) >>> 0;
    return x / 4294967296;
  };
}

export function scenarioCalc(input: {
  demand: number;
  capacity: number;
  growth: number;
  derate: number;
  noise: number;
  duration: number;
  seed: number;
}): ScenarioResult {
  const random = rng(input.seed);
  const trials = Array.from({ length: 2000 }, () => {
    const demand = input.demand * (1 + input.growth / 100) + (random() * 2 - 1) * input.noise;
    const available = input.capacity * (1 - input.derate / 100);
    return Math.max(0, demand - available) * input.duration;
  });
  return {
    mean: average(trials),
    p95: quantile(trials, 0.95),
    prob: trials.filter((value) => value > 0).length / trials.length,
    quantiles: Array.from({ length: 21 }, (_, i) => quantile(trials, i / 20)),
  };
}

export function solve(
  input: { budget: number; base: number; peak: number; reserve: number },
  options = CANDIDATES,
): OptimizationResult {
  const target = input.peak * (1 + input.reserve / 100);
  const plans: Portfolio[] = [];
  for (let mask = 0; mask < 2 ** options.length; mask += 1) {
    const selected = options.filter((_, index) => mask & (1 << index));
    const cost = selected.reduce((sum, option) => sum + option.cost, 0);
    const mw = selected.reduce((sum, option) => sum + option.mw, 0);
    const short = Math.max(0, target - input.base - mw);
    if (cost <= input.budget && short === 0) {
      plans.push({ selected, cost, mw, short, score: cost });
    }
  }
  plans.sort((a, b) => a.score - b.score || b.mw - a.mw);
  return { feasible: plans.length > 0, plans: plans.slice(0, 8), count: plans.length };
}

/** Compare seasonal-naive error on an earlier day with the latest day. */
export function seriesDrift(loads: number[]) {
  if (loads.length < 72) return null;
  const dayError = (start: number) =>
    average(Array.from({ length: 24 }, (_, index) => Math.abs(loads[start + index] - loads[start + index - 24])));
  const earlyMae = dayError(24);
  const lateMae = dayError(loads.length - 24);
  const ratio = earlyMae === 0 ? (lateMae === 0 ? 1 : Number.POSITIVE_INFINITY) : lateMae / earlyMae;
  return {
    earlyMae,
    lateMae,
    ratio,
    drifted: !Number.isFinite(ratio) || ratio > 1.25,
  };
}

export function holdout(loads: number[], cutoff: string): ValidationResult {
  const train = loads.slice(0, -24);
  const actual = loads.slice(-24);
  const metrics = ["Seasonal naive", "Exponential smoothing"].map((method) => {
    const forecast = calcForecast(train, method, 24);
    const errors = actual.map((value, index) => value - forecast.values[index]);
    return {
      method,
      mae: average(errors.map((value) => Math.abs(value))),
      rmse: Math.sqrt(average(errors.map((value) => value * value))),
      mape: actual.every((value) => value > 0)
        ? 100 * average(errors.map((value, index) => Math.abs(value / actual[index])))
        : null,
      coverage:
        100 *
        average(
          actual.map(
            (value, index) =>
              Number(value >= forecast.low[index] && value <= forecast.high[index]),
          ),
        ),
    };
  });
  void cutoff;
  return { metrics, drift: seriesDrift(loads) };
}
