import { calcForecast, ENGINE, holdout, isRegularHourly, scenarioCalc, solve } from "./engines";
import { ApiError } from "./http";
import { hashPayload } from "./seed";
import type { Observation, Role, Workspace } from "./types";
import { isOptimization } from "./types";

function now() {
  return new Date().toISOString();
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function audit(workspace: Workspace, role: Role, event: string) {
  workspace.audit.unshift({ time: now(), role, event });
}

function requireRegion(workspace: Workspace, region: string) {
  if (!workspace.regions.includes(region)) throw new ApiError(400, "Choose a zone that is already on the case.");
  return region;
}

export function seriesFor(workspace: Workspace, region: string) {
  return workspace.obs
    .filter((row) => row.region === region)
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function importSynthetic(
  workspace: Workspace,
  role: Role,
  incoming: unknown,
  label: string,
) {
  if (!Array.isArray(incoming) || !incoming.length) {
    throw new ApiError(400, "Expected a nonempty array of observations.");
  }
  const keys = new Set(workspace.obs.map((row) => `${row.region}|${row.time}`));
  const id = `SYN-${uid()}`;
  const clean: Observation[] = incoming.map((row) => {
    const item = row as Partial<Observation>;
    const region = typeof item.region === "string" ? item.region.trim() : "";
    const timeOk = typeof item.time === "string" && item.time.endsWith("Z") && Number.isFinite(Date.parse(item.time));
    const loadOk = typeof item.load === "number" && Number.isFinite(item.load) && item.load >= 0;
    const capacityOk = typeof item.capacity === "number" && Number.isFinite(item.capacity) && item.capacity >= 0;
    if (!region || !timeOk || !loadOk || !capacityOk) {
      throw new ApiError(400, "Each row needs a region, a UTC timestamp, and nonnegative load and capacity.");
    }
    const time = new Date(item.time as string).toISOString();
    const key = `${region}|${time}`;
    if (keys.has(key)) throw new ApiError(400, `Duplicate observation ${key}.`);
    keys.add(key);
    return {
      region,
      time,
      load: item.load as number,
      capacity: item.capacity as number,
      source: id,
      licensingClass: "synthetic",
      spatialResolution: "research-zone",
    };
  });
  workspace.obs.push(...clean);
  workspace.regions = [...new Set([...workspace.regions, ...clean.map((row) => row.region)])];
  workspace.snapshots.unshift({
    id,
    label,
    count: clean.length,
    mode: "SYNTHETIC",
    date: now(),
    sourceId: "synthetic",
    licensingClass: "synthetic",
    hash: hashPayload(clean),
    qualityFlags: ["synthetic", "non-operational"],
  });
  audit(workspace, role, `Imported synthetic snapshot ${id}`);
}

export function fileEia(
  workspace: Workspace,
  role: Role,
  pulled: { region: string; rows: Observation[]; hash: string },
) {
  const keys = new Set(workspace.obs.map((row) => `${row.region}|${row.time}`));
  const fresh = pulled.rows.filter((row) => !keys.has(`${row.region}|${row.time}`));
  if (!fresh.length) throw new ApiError(400, "Those EIA hours are already on the case.");
  workspace.obs.push(...fresh);
  if (!workspace.regions.includes(pulled.region)) workspace.regions.push(pulled.region);
  const id = fresh[0].source;
  workspace.snapshots.unshift({
    id,
    label: `EIA hourly demand · ${pulled.region}`,
    count: fresh.length,
    mode: "PUBLIC",
    date: now(),
    sourceId: "eia",
    licensingClass: "public-api-key",
    hash: pulled.hash,
    qualityFlags: ["eia-rto-demand", "hourly-period-stored-as-utc-wall-time", "capacity-not-in-source"],
  });
  audit(workspace, role, `Imported EIA snapshot ${id}`);
}

export function addZone(workspace: Workspace, role: Role, region: string) {
  if (workspace.regions.includes(region)) throw new ApiError(400, "That zone is already on the case.");
  workspace.regions.push(region);
  audit(workspace, role, `Created zone ${region}`);
}

export function addAsset(workspace: Workspace, role: Role, region: string, name: string, mw: number) {
  requireRegion(workspace, region);
  if (mw <= 0) throw new ApiError(400, "Capacity must be greater than zero.");
  workspace.assets.push({ region, name, mw });
  audit(workspace, role, `Added resource ${name}`);
}

export function addLink(workspace: Workspace, role: Role, from: string, to: string, note: string) {
  requireRegion(workspace, from);
  requireRegion(workspace, to);
  if (from === to) throw new ApiError(400, "A transfer needs two different zones.");
  const text = note.trim();
  if (text.length < 8) throw new ApiError(400, "Say what the transfer represents. A line rating is not inferred.");
  workspace.links.push({ id: uid(), from, to, note: text });
  audit(workspace, role, `Stated transfer ${from} to ${to}`);
}

export function datasetVersions(workspace: Workspace, sourceId: string) {
  const versions = workspace.snapshots.filter((snapshot) => snapshot.sourceId === sourceId);
  if (!versions.length) throw new ApiError(404, "No version of that dataset is on the case.");
  return versions;
}

export function addRisk(workspace: Workspace, role: Role, region: string, name: string, p: number, loss: number) {
  requireRegion(workspace, region);
  if (p < 0 || p > 1 || loss < 0) throw new ApiError(400, "Probability must be from 0 to 1 and consequence cannot be negative.");
  workspace.risks.push({ id: uid(), region, name, p, loss });
  audit(workspace, role, `Registered contingency ${name}`);
}

export function runForecast(workspace: Workspace, role: Role, region: string, method: string, horizon: number) {
  requireRegion(workspace, region);
  if (method !== "Seasonal naive" && method !== "Exponential smoothing") {
    throw new ApiError(400, "Choose seasonal naive or exponential smoothing.");
  }
  if (!Number.isInteger(horizon) || horizon < 1 || horizon > 24) {
    throw new ApiError(400, "Horizon must be a whole number of hours from 1 to 24.");
  }
  const rows = seriesFor(workspace, region);
  if (!isRegularHourly(rows.map((row) => row.time))) {
    throw new ApiError(400, "This zone needs at least 48 consecutive hourly records.");
  }
  const result = calcForecast(rows.map((row) => row.load), method, horizon);
  const id = uid();
  workspace.runs.unshift({
    id,
    type: "forecast",
    region,
    inputs: { method, h: horizon },
    result,
    time: now(),
    engine: ENGINE,
    sources: [...new Set(rows.map((row) => row.source))],
  });
  audit(workspace, role, `Forecast run ${id}`);
}

export function runScenario(
  workspace: Workspace,
  role: Role,
  region: string,
  input: { demand: number; capacity: number; growth: number; derate: number; noise: number; duration: number; seed: number },
) {
  requireRegion(workspace, region);
  if (
    input.demand < 0 ||
    input.capacity < 0 ||
    input.growth < -100 ||
    input.derate < 0 ||
    input.derate > 100 ||
    input.noise < 0 ||
    input.duration <= 0 ||
    !Number.isInteger(input.seed)
  ) {
    throw new ApiError(400, "Check the scenario bounds. Derating is 0–100 percent and the seed is a whole number.");
  }
  const id = uid();
  workspace.runs.unshift({
    id,
    type: "scenario",
    region,
    inputs: input,
    result: scenarioCalc(input),
    time: now(),
    engine: ENGINE,
    sources: [...new Set(seriesFor(workspace, region).map((row) => row.source))],
  });
  audit(workspace, role, `Scenario run ${id}`);
}

export function runOptimization(
  workspace: Workspace,
  role: Role,
  region: string,
  input: { budget: number; base: number; peak: number; reserve: number },
) {
  requireRegion(workspace, region);
  if (Object.values(input).some((value) => value < 0)) {
    throw new ApiError(400, "Budget, capacity, demand, and reserve must be nonnegative.");
  }
  const id = uid();
  workspace.runs.unshift({
    id,
    type: "optimization",
    region,
    inputs: input,
    result: solve(input),
    time: now(),
    engine: ENGINE,
    sources: [...new Set(seriesFor(workspace, region).map((row) => row.source))],
  });
  audit(workspace, role, `Optimization run ${id}`);
}

export function submitPlan(workspace: Workspace, role: Role, runId: string) {
  const run = workspace.runs.find((item) => item.id === runId && item.type === "optimization");
  if (!run || !isOptimization(run.result) || !run.result.feasible) {
    throw new ApiError(400, "Only a feasible portfolio can be sent for review.");
  }
  if (workspace.decisions.some((item) => item.run === runId)) {
    throw new ApiError(400, "That portfolio is already in the decision record.");
  }
  workspace.decisions.unshift({
    id: uid(),
    region: run.region,
    run: runId,
    status: "Submitted",
    reason: "",
    time: now(),
  });
  audit(workspace, role, `Submitted plan ${runId}`);
}

export function reviewDecision(workspace: Workspace, role: Role, id: string, status: "Approved" | "Returned", reason: string) {
  const decision = workspace.decisions.find((item) => item.id === id);
  if (!decision || decision.status !== "Submitted") throw new ApiError(400, "That decision is not waiting for review.");
  if (!reason.trim()) throw new ApiError(400, "Write the reason for the review.");
  decision.status = status;
  decision.reason = reason.trim();
  decision.reviewer = role;
  decision.reviewed = now();
  if (status === "Approved") {
    workspace.actions.push({
      id: uid(),
      region: decision.region,
      decision: id,
      name: "Evaluate the candidate portfolio in a research review",
      state: "Planned",
    });
  }
  audit(workspace, role, `Review ${id} ${status}`);
}

export function recordOutcome(workspace: Workspace, role: Role, id: string, outcome: string) {
  const action = workspace.actions.find((item) => item.id === id);
  if (!action) throw new ApiError(400, "That action is not on the case.");
  if (!outcome.trim()) throw new ApiError(400, "Write the outcome before recording it.");
  action.outcome = outcome.trim();
  action.state = "Outcome recorded";
  audit(workspace, role, `Recorded outcome ${id}`);
}

export function assignAction(workspace: Workspace, role: Role, id: string, owner: string, due: string, progress: string) {
  const action = workspace.actions.find((item) => item.id === id);
  if (!action) throw new ApiError(400, "That action is not on the case.");
  if (action.outcome) throw new ApiError(400, "An outcome is already on this action.");
  const name = owner.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 80) throw new ApiError(400, "Name the owner in 2 to 80 characters.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) throw new ApiError(400, "Choose a due date.");
  if (progress !== "Planned" && progress !== "Under way") {
    throw new ApiError(400, "Progress is Planned or Under way until an outcome is recorded.");
  }
  action.owner = name;
  action.due = due;
  action.state = progress;
  audit(workspace, role, `Assigned action ${id} to ${name}`);
}

export function recordReassessment(workspace: Workspace, role: Role, id: string, note: string) {
  const action = workspace.actions.find((item) => item.id === id);
  if (!action) throw new ApiError(400, "That action is not on the case.");
  if (!action.outcome) throw new ApiError(400, "Record what was observed before asking for a reassessment.");
  const text = note.trim();
  if (text.length < 8) throw new ApiError(400, "Write what the next look at the case should examine.");
  action.reassessment = text;
  audit(workspace, role, `Requested reassessment ${id}`);
}

export function runValidation(workspace: Workspace, role: Role, region: string) {
  requireRegion(workspace, region);
  const rows = seriesFor(workspace, region);
  if (rows.length < 72 || !isRegularHourly(rows.map((row) => row.time))) {
    throw new ApiError(400, "Holdout needs 72 consecutive hourly observations.");
  }
  const cutoff = rows.at(-25)!.time;
  const id = uid();
  workspace.runs.unshift({
    id,
    type: "validation",
    region,
    inputs: { cutoff },
    result: holdout(rows.map((row) => row.load), cutoff),
    time: now(),
    engine: ENGINE,
    sources: [...new Set(rows.map((row) => row.source))],
  });
  audit(workspace, role, `Validation run ${id}`);
}
