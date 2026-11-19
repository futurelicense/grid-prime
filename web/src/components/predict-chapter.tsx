"use client";

import { useState } from "react";
import { fmt } from "@/lib/format";
import { inZone } from "@/lib/narrative";
import type { ForecastResult, Run, ScenarioResult } from "@/lib/types";
import { isForecast, isScenario, isValidation } from "@/lib/types";
import { Chapter } from "./chapter";
import { Field, FormError, Submit, useFormError } from "./forms";
import { useWorkspace } from "./providers";
import { SeriesPlot } from "./series-plot";

const SECTIONS = [
  { id: "forecast", label: "Outlook", detail: "A short demand forecast with a residual band" },
  { id: "stress", label: "Stress", detail: "One declared event, two thousand draws" },
  { id: "holdout", label: "Holdout", detail: "The last day, scored only from earlier hours" },
];

export function PredictChapter() {
  const { payload, zone, mutate } = useWorkspace();
  const [section, setSection] = useState("forecast");
  if (!payload) return <p className="text-muted">Opening the case file.</p>;
  const canWrite = payload.session.role !== "Viewer";
  const regions = zone === "all" ? payload.workspace.regions : payload.workspace.regions.filter((item) => item === zone);
  const runs = inZone(payload.workspace.runs, zone);
  const forecast = runs.find((run) => run.type === "forecast");
  const scenario = runs.find((run) => run.type === "scenario");
  const validation = runs.find((run) => run.type === "validation");

  return (
    <Chapter
      number="02"
      title="Predict"
      lede="The case engine computes the numbers. A later explanation may describe them. It may not replace them."
      sections={SECTIONS}
      current={section}
      onChange={setSection}
    >
      {section === "forecast" ? (
        <ForecastForm canWrite={canWrite} regions={regions} run={forecast} mutate={mutate} />
      ) : null}
      {section === "stress" ? (
        <StressForm canWrite={canWrite} regions={regions} run={scenario} mutate={mutate} />
      ) : null}
      {section === "holdout" ? (
        <HoldoutForm canWrite={canWrite} regions={regions} run={validation} mutate={mutate} />
      ) : null}
    </Chapter>
  );
}

function ForecastForm({
  canWrite,
  regions,
  run,
  mutate,
}: {
  canWrite: boolean;
  regions: string[];
  run?: Run;
  mutate: (url: string, body?: unknown) => Promise<void>;
}) {
  const form = useFormError();
  const result = run && isForecast(run.result) ? run.result : null;
  return (
    <div className="grid gap-8">
      <form
        className="grid max-w-md gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          form.run(() =>
            mutate("/api/v2/forecast-runs", {
              region: data.get("region"),
              method: data.get("method"),
              horizon: Number(data.get("horizon")),
            }),
          );
        }}
      >
        <h2 className="font-serif text-3xl">Demand outlook</h2>
        <p className="text-sm leading-6 text-muted">
          Needs 48 consecutive hourly observations. Seasonal naive repeats the hour from a day earlier. Exponential
          smoothing holds the last level. The band is the 5th to 95th percentile of past residuals, not a guarantee.
        </p>
        <ZoneField regions={regions} />
        <Field label="Method">
          <select name="method" className="control">
            <option>Seasonal naive</option>
            <option>Exponential smoothing</option>
          </select>
        </Field>
        <Field label="Horizon, 1 to 24 hours">
          <input name="horizon" type="number" min={1} max={24} defaultValue={24} className="control" />
        </Field>
        <Submit disabled={!canWrite || !regions.length}>File the forecast</Submit>
        <FormError message={form.message} />
      </form>
      {result && run ? <ForecastReading run={run} result={result} /> : <p className="text-sm text-muted">No forecast in this reading yet.</p>}
    </div>
  );
}

function ForecastReading({ run, result }: { run: Run; result: ForecastResult }) {
  return (
    <div className="border-t border-line pt-6">
      <p className="font-serif text-2xl">
        Peak {fmt(Math.max(...result.values))} MW
        <span className="text-base text-muted"> · residual MAE {fmt(result.mae)} MW · {String(run.inputs.method)}</span>
      </p>
      <p className="mt-2 text-sm text-muted">
        Run {run.id} · {run.engine} · sources {run.sources.join(", ") || "entered assumptions"}
      </p>
      <div className="mt-4">
        <SeriesPlot
          band={{ low: result.low, high: result.high }}
          series={[{ name: "Forecast MW", values: result.values, stroke: "#1e4a38" }]}
        />
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="data">
          <thead>
            <tr>
              <th>Hour</th>
              <th>Point MW</th>
              <th>Lower</th>
              <th>Upper</th>
            </tr>
          </thead>
          <tbody>
            {result.values.map((value, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{fmt(value)}</td>
                <td>{fmt(result.low[index])}</td>
                <td>{fmt(result.high[index])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StressForm({
  canWrite,
  regions,
  run,
  mutate,
}: {
  canWrite: boolean;
  regions: string[];
  run?: Run;
  mutate: (url: string, body?: unknown) => Promise<void>;
}) {
  const form = useFormError();
  const result = run && isScenario(run.result) ? run.result : null;
  return (
    <div className="grid gap-8">
      <form
        className="grid max-w-md gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          form.run(() =>
            mutate("/api/v2/scenarios", {
              region: data.get("region"),
              demand: Number(data.get("demand")),
              capacity: Number(data.get("capacity")),
              growth: Number(data.get("growth")),
              derate: Number(data.get("derate")),
              noise: Number(data.get("noise")),
              duration: Number(data.get("duration")),
              seed: Number(data.get("seed")),
            }),
          );
        }}
      >
        <h2 className="font-serif text-3xl">One stress event</h2>
        <p className="text-sm leading-6 text-muted">
          Two thousand seeded draws vary demand uniformly. There is no network power flow and no weather feed in this
          calculation. The result is for this event only.
        </p>
        <ZoneField regions={regions} />
        <Field label="Demand MW">
          <input name="demand" type="number" className="control" defaultValue={650} />
        </Field>
        <Field label="Available capacity MW">
          <input name="capacity" type="number" className="control" defaultValue={720} />
        </Field>
        <Field label="Demand growth percent">
          <input name="growth" type="number" className="control" defaultValue={10} />
        </Field>
        <Field label="Capacity derating percent">
          <input name="derate" type="number" className="control" defaultValue={15} />
        </Field>
        <Field label="Demand noise MW">
          <input name="noise" type="number" className="control" defaultValue={40} />
        </Field>
        <Field label="Duration hours">
          <input name="duration" type="number" className="control" defaultValue={8} />
        </Field>
        <Field label="Random seed">
          <input name="seed" type="number" className="control" defaultValue={42} />
        </Field>
        <Submit disabled={!canWrite || !regions.length}>Run the draws</Submit>
        <FormError message={form.message} />
      </form>
      {result && run ? <StressReading run={run} result={result} /> : <p className="text-sm text-muted">No stress case in this reading yet.</p>}
    </div>
  );
}

function StressReading({ run, result }: { run: Run; result: ScenarioResult }) {
  const duration = Number(run.inputs.duration);
  return (
    <div className="border-t border-line pt-6">
      <p className="font-serif text-2xl">Mean unserved energy {fmt(result.mean)} MWh</p>
      <p className="mt-2 text-sm leading-6">
        P95 {fmt(result.p95)} MWh. Shortfall in {fmt(result.prob * 100)} percent of draws. Expected shortfall hours{" "}
        {fmt(result.prob * duration)}, for this single event.
      </p>
      <div className="mt-4">
        <SeriesPlot series={[{ name: "Quantile MWh", values: result.quantiles, stroke: "#8c3b2a" }]} />
      </div>
    </div>
  );
}

function HoldoutForm({
  canWrite,
  regions,
  run,
  mutate,
}: {
  canWrite: boolean;
  regions: string[];
  run?: Run;
  mutate: (url: string, body?: unknown) => Promise<void>;
}) {
  const form = useFormError();
  const metrics = run && "metrics" in run.result ? run.result.metrics : null;
  return (
    <div className="grid gap-8">
      <form
        className="grid max-w-md gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          form.run(() => mutate("/api/v2/validation-runs", { region: data.get("region") }));
        }}
      >
        <h2 className="font-serif text-3xl">Last day held out</h2>
        <p className="text-sm leading-6 text-muted">
          The last 24 hours are scored from earlier observations only. A synthetic score does not establish accuracy on
          a real grid. Report the seasonal-naive row even when the other method loses.
        </p>
        <ZoneField regions={regions} />
        <Submit disabled={!canWrite || !regions.length}>Score the holdout</Submit>
        <FormError message={form.message} />
      </form>
      {metrics && run ? (
        <div>
          <p className="text-sm text-muted">Cutoff {String(run.inputs.cutoff)} · run {run.id}</p>
          <table className="data mt-4">
            <thead>
              <tr>
                <th>Method</th>
                <th>MAE MW</th>
                <th>RMSE MW</th>
                <th>MAPE %</th>
                <th>Coverage %</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => (
                <tr key={metric.method}>
                  <td>{metric.method}</td>
                  <td>{fmt(metric.mae)}</td>
                  <td>{fmt(metric.rmse)}</td>
                  <td>{fmt(metric.mape)}</td>
                  <td>{fmt(metric.coverage)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {run && isValidation(run.result) && run.result.drift ? (
            <p className="mt-4 max-w-xl text-sm leading-6">
              Seasonal error on the earlier day is {fmt(run.result.drift.earlyMae)} MW. On the latest day it is{" "}
              {fmt(run.result.drift.lateMae)} MW.{" "}
              {run.result.drift.drifted
                ? "The later day has moved far enough that the case marks drift. Score again after the series changes."
                : "The later day stays within the earlier seasonal error."}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted">No holdout in this reading yet.</p>
      )}
    </div>
  );
}

function ZoneField({ regions }: { regions: string[] }) {
  return (
    <Field label="Zone">
      <select name="region" className="control">
        {regions.map((region) => (
          <option key={region}>{region}</option>
        ))}
      </select>
    </Field>
  );
}
