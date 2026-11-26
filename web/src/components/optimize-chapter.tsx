"use client";

import { fmt } from "@/lib/format";
import { inZone } from "@/lib/narrative";
import { CANDIDATES } from "@/lib/engines";
import { isOptimization } from "@/lib/types";
import { Chapter } from "./chapter";
import { Field, FormError, Submit, useFormError } from "./forms";
import { useWorkspace } from "./providers";

export function OptimizeChapter() {
  const { payload, zone, mutate } = useWorkspace();
  const form = useFormError();
  if (!payload) return <p className="text-muted">Opening the case file.</p>;
  const canWrite = payload.session.role !== "Viewer";
  const regions = zone === "all" ? payload.workspace.regions : payload.workspace.regions.filter((item) => item === zone);
  const run = inZone(payload.workspace.runs, zone).find((item) => item.type === "optimization");
  const result = run && isOptimization(run.result) ? run.result : null;
  const alreadySent = run ? payload.workspace.decisions.some((decision) => decision.run === run.id) : false;

  return (
    <Chapter
      number="3"
      title="What fits"
      lede="An option stays only when it meets the budget and the reserve you set. If none does, the file says so."
      sections={[{ id: "portfolio", label: "Portfolio", detail: "Six planning options, exact comparison" }]}
      current="portfolio"
      onChange={() => undefined}
    >
      <div className="grid gap-8">
        <div className="overflow-x-auto">
          <table className="data">
            <thead>
              <tr>
                <th>Option</th>
                <th>Equivalent MW</th>
                <th>Cost, $ million</th>
              </tr>
            </thead>
            <tbody>
              {CANDIDATES.map((option) => (
                <tr key={option.name}>
                  <td>{option.name}</td>
                  <td>{option.mw}</td>
                  <td>{option.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-sm text-muted">
            Equivalent firm megawatts and illustrative costs. Storage duration and network feasibility are not in this
            comparison.
          </p>
        </div>
        <form
          className="grid max-w-md gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            form.run(() =>
              mutate("/api/v2/optimization-runs", {
                region: data.get("region"),
                budget: Number(data.get("budget")),
                base: Number(data.get("base")),
                peak: Number(data.get("peak")),
                reserve: Number(data.get("reserve")),
              }),
            );
          }}
        >
          <Field label="Zone">
            <select name="region" className="control">
              {regions.map((region) => (
                <option key={region}>{region}</option>
              ))}
            </select>
          </Field>
          <Field label="Budget, $ million">
            <input name="budget" type="number" className="control" defaultValue={40} />
          </Field>
          <Field label="Existing capacity MW">
            <input name="base" type="number" className="control" defaultValue={600} />
          </Field>
          <Field label="Peak demand MW">
            <input name="peak" type="number" className="control" defaultValue={650} />
          </Field>
          <Field label="Required planning margin percent">
            <input name="reserve" type="number" className="control" defaultValue={15} />
          </Field>
          <Submit disabled={!canWrite || !regions.length}>Compare portfolios</Submit>
          <FormError message={form.message} />
        </form>
        {result && run ? (
          <div className="border-t border-line pt-6">
            {result.feasible ? (
              <>
                <p className="font-serif text-3xl">Least cost {fmt(result.plans[0].cost)} million</p>
                <p className="mt-2 text-sm leading-6">
                  Adds {fmt(result.plans[0].mw)} MW. {result.count} portfolios meet the encoded constraints. This is not
                  a power-flow study.
                </p>
                <table className="data mt-4">
                  <thead>
                    <tr>
                      <th>Selected</th>
                      <th>Cost</th>
                      <th>Added MW</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.plans.map((plan, index) => (
                      <tr key={index}>
                        <td>{plan.selected.map((item) => item.name).join("; ") || "None"}</td>
                        <td>{fmt(plan.cost)}</td>
                        <td>{fmt(plan.mw)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  type="button"
                  className="btn mt-6"
                  disabled={!canWrite || alreadySent}
                  onClick={() => form.run(() => mutate("/api/v2/optimization-runs", { runId: run.id }))}
                >
                  {alreadySent ? "Already sent for review" : "Send the least-cost plan for review"}
                </button>
              </>
            ) : (
              <p className="max-w-xl text-lg leading-8">
                No portfolio meets the budget and the required capacity. Revise the assumptions. The case will not
                relax them silently.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </Chapter>
  );
}
