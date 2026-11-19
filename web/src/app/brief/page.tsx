import Link from "next/link";
import { PrintButton } from "@/components/print-button";
import { fmt } from "@/lib/format";
import { readSession } from "@/lib/http";
import { readWorkspace } from "@/lib/store";
import { isForecast, isOptimization, isScenario } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BriefPage() {
  const session = await readSession();
  const workspace = readWorkspace(session.caseId);
  const forecast = workspace.runs.find((run) => run.type === "forecast");
  const scenario = workspace.runs.find((run) => run.type === "scenario");
  const optimization = workspace.runs.find((run) => run.type === "optimization");
  const peak = workspace.obs.length ? Math.max(...workspace.obs.map((row) => row.load)) : Number.NaN;

  return (
    <article className="mx-auto max-w-2xl px-6 py-12">
      <div className="no-print mb-8 flex items-center justify-between">
        <Link href="/deliver" className="text-sm text-pine">
          Back to the case
        </Link>
        <PrintButton />
      </div>
      <p className="kicker">Grid Prime brief</p>
      <h1 className="mt-3 font-serif text-5xl leading-none">{workspace.label}</h1>
      <p className="mt-4 text-sm text-muted">
        {session.name} · {session.role}. Engine GRID-CASE-1.0. This brief repeats stored results. It is not an operating order.
      </p>
      <section className="mt-10">
        <h2 className="font-serif text-2xl">What is on file</h2>
        <p className="mt-3 leading-7">
          {workspace.regions.length
            ? `${workspace.regions.join(", ")}.`
            : "No zone has been named."}{" "}
          {workspace.obs.length
            ? `${workspace.obs.length} observations are filed. The highest load is ${fmt(peak)} MW.`
            : "No observations are filed."}{" "}
          {workspace.snapshots[0]
            ? `The newest snapshot is ${workspace.snapshots[0].label}, class ${workspace.snapshots[0].mode}.`
            : ""}
        </p>
      </section>
      <section className="mt-8">
        <h2 className="font-serif text-2xl">Outlook</h2>
        <p className="mt-3 leading-7">
          {forecast && isForecast(forecast.result)
            ? `Forecast ${forecast.id} for ${forecast.region} uses ${String(forecast.inputs.method)}. Peak ${fmt(Math.max(...forecast.result.values))} MW. Residual MAE ${fmt(forecast.result.mae)} MW. Sources: ${forecast.sources.join(", ") || "none"}.`
            : "No forecast is on the case."}
        </p>
        <p className="mt-3 leading-7">
          {scenario && isScenario(scenario.result)
            ? `Stress ${scenario.id} reports mean unserved energy ${fmt(scenario.result.mean)} MWh and a shortfall in ${fmt(scenario.result.prob * 100)} percent of draws. The draws cover one declared event.`
            : "No stress case is on the case."}
        </p>
      </section>
      <section className="mt-8">
        <h2 className="font-serif text-2xl">Portfolio</h2>
        <p className="mt-3 leading-7">
          {optimization && isOptimization(optimization.result)
            ? optimization.result.feasible
              ? `Portfolio ${optimization.id} is feasible. Least cost ${fmt(optimization.result.plans[0].cost)} million dollars, adding ${fmt(optimization.result.plans[0].mw)} MW: ${optimization.result.plans[0].selected.map((item) => item.name).join(", ") || "no options"}.`
              : `Portfolio ${optimization.id} is infeasible under the encoded budget and reserve.`
            : "No portfolio has been compared."}
        </p>
      </section>
      <section className="mt-8">
        <h2 className="font-serif text-2xl">Decisions</h2>
        {workspace.decisions.length ? (
          <ul className="mt-3 grid gap-3">
            {workspace.decisions.map((decision) => (
              <li key={decision.id}>
                {decision.status} · {decision.region} · run {decision.run}
                {decision.reason ? ` · ${decision.reason}` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3">No decision has been recorded.</p>
        )}
      </section>
      <p className="mt-10 text-sm leading-6 text-muted">
        Public series describe balancing-authority demand, not asset-level reliability. Synthetic series are marked and
        are not telemetry. Nothing in this brief authorizes operation of the grid.
      </p>
    </article>
  );
}
