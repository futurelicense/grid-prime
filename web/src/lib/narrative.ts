import { ENGINE } from "./engines";
import type { Workspace } from "./types";
import { isForecast, isOptimization, isScenario, isValidation } from "./types";

export function caseStages(workspace: Workspace) {
  const forecast = workspace.runs.find((run) => run.type === "forecast");
  const scenario = workspace.runs.find((run) => run.type === "scenario");
  const optimization = workspace.runs.find((run) => run.type === "optimization");
  const pending = workspace.decisions.filter((decision) => decision.status === "Submitted").length;
  const forecastText =
    forecast && isForecast(forecast.result)
      ? `Latest outlook peaks at ${Math.round(Math.max(...forecast.result.values)).toLocaleString("en-US")} MW.`
      : "No forecast has been filed.";
  const scenarioText =
    scenario && isScenario(scenario.result)
      ? `Latest stress case puts mean unserved energy at ${Math.round(scenario.result.mean).toLocaleString("en-US")} MWh.`
      : "No stress case has been filed.";
  const portfolioText =
    optimization && isOptimization(optimization.result)
      ? optimization.result.feasible
        ? `A feasible portfolio is on file at ${optimization.result.plans[0].cost} million dollars.`
        : "The latest portfolio is infeasible. The constraints were left as entered."
      : "No portfolio has been compared.";

  return [
    {
      href: "/model",
      no: "01",
      name: "Model",
      duty: "Describe the system, the series, and the contingencies you are willing to state.",
      sentence: workspace.obs.length
        ? `${workspace.regions.length} zones, ${workspace.obs.length} observations, and ${workspace.risks.length} contingencies are on file.`
        : "Nothing has been filed. Name a zone and bring in a series before asking for an outlook.",
    },
    {
      href: "/predict",
      no: "02",
      name: "Predict",
      duty: "Produce a short-horizon demand outlook and a declared stress case.",
      sentence: `${forecastText} ${scenarioText}`,
    },
    {
      href: "/optimize",
      no: "03",
      name: "Optimize",
      duty: "Compare resource packages that meet the budget and the planning reserve.",
      sentence: portfolioText,
    },
    {
      href: "/deliver",
      no: "04",
      name: "Deliver",
      duty: "A person accepts or returns the plan. The reason stays with the result.",
      sentence: workspace.decisions.length
        ? `${workspace.decisions.length} decision${workspace.decisions.length === 1 ? "" : "s"} on the record${pending ? `, ${pending} still waiting` : ""}.`
        : "No plan has been sent for review.",
    },
  ];
}

export function evidencePack(workspace: Workspace) {
  return {
    engine: ENGINE,
    case: workspace.label,
    zones: workspace.regions,
    transfers: workspace.links,
    snapshots: workspace.snapshots.map((snapshot) => ({
      id: snapshot.id,
      sourceId: snapshot.sourceId,
      label: snapshot.label,
      count: snapshot.count,
      mode: snapshot.mode,
      licensingClass: snapshot.licensingClass,
      hash: snapshot.hash,
      qualityFlags: snapshot.qualityFlags,
      filed: snapshot.date,
    })),
    runs: workspace.runs.map((run) => ({
      id: run.id,
      type: run.type,
      region: run.region,
      time: run.time,
      engine: run.engine,
      sources: run.sources,
      inputs: run.inputs,
      result: run.result,
    })),
    decisions: workspace.decisions,
    actions: workspace.actions,
    flags: caseFlags(workspace),
  };
}

export function caseFlags(workspace: Workspace) {
  const flags: string[] = [];
  const pending = workspace.decisions.filter((decision) => decision.status === "Submitted").length;
  if (pending) flags.push(`${pending} plan${pending === 1 ? "" : "s"} waiting for a reviewer.`);
  const optimization = workspace.runs.find((run) => run.type === "optimization");
  if (optimization && isOptimization(optimization.result) && !optimization.result.feasible) {
    flags.push("The latest portfolio is infeasible. The constraints were left as entered.");
  }
  const validation = workspace.runs.find((run) => run.type === "validation");
  if (validation && isValidation(validation.result) && validation.result.drift?.drifted) {
    flags.push("Seasonal error on the latest day is higher than on the earlier day.");
  }
  const open = workspace.actions.filter((action) => !action.outcome).length;
  if (open) flags.push(`${open} accepted action${open === 1 ? "" : "s"} still without an observed outcome.`);
  const unassigned = workspace.actions.filter((action) => !action.owner || !action.due).length;
  if (unassigned) flags.push(`${unassigned} action${unassigned === 1 ? " needs" : "s need"} an owner and a due date.`);
  const reassessment = workspace.actions.filter((action) => action.reassessment).length;
  if (reassessment) flags.push(`${reassessment} reassessment${reassessment === 1 ? "" : "s"} asked for after an outcome.`);
  return flags;
}

export function nextStep(workspace: Workspace) {
  if (!workspace.obs.length) return { href: "/model", label: "File the system" };
  if (!workspace.runs.some((run) => run.type === "forecast")) return { href: "/predict", label: "File an outlook" };
  if (!workspace.runs.some((run) => run.type === "optimization")) return { href: "/optimize", label: "Compare portfolios" };
  if (!workspace.decisions.length) return { href: "/deliver", label: "Open the decision" };
  return { href: "/deliver", label: "Read the decision record" };
}

/** 1-based step the case is waiting on. 0 means the recorded path is complete. */
export function workflowCursor(workspace: Workspace) {
  if (!workspace.regions.length || !workspace.obs.length) return 2;
  if (!workspace.runs.some((run) => run.type === "forecast")) return 3;
  if (!workspace.runs.some((run) => run.type === "optimization")) return 4;
  const latest = workspace.decisions[0];
  if (!latest) return 4;
  if (latest.status === "Submitted") return 5;
  if (latest.status === "Returned") return 4;
  const waiting = workspace.actions.some((action) => !action.outcome);
  if (latest.status === "Approved" && (waiting || !workspace.actions.length)) return 6;
  return 0;
}

export function inZone<T extends { region: string }>(rows: T[], zone: string) {
  if (zone === "all") return rows;
  return rows.filter((row) => row.region === zone);
}
