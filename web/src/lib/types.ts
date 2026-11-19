export const ROLES = ["Analyst", "Reviewer", "Program manager", "Viewer"] as const;
export type Role = (typeof ROLES)[number];
export const CASES = ["reference", "empty"] as const;
export type CaseId = (typeof CASES)[number];

export type Observation = {
  region: string;
  time: string;
  load: number;
  capacity: number | null;
  source: string;
  licensingClass: "synthetic" | "public-api-key";
  spatialResolution: "research-zone" | "balancing-authority";
};

export type Snapshot = {
  id: string;
  label: string;
  count: number;
  mode: "SYNTHETIC" | "PUBLIC";
  date: string;
  sourceId: string;
  licensingClass: Observation["licensingClass"];
  hash: string;
  qualityFlags: string[];
};

export type Risk = {
  id: string;
  region: string;
  name: string;
  p: number;
  loss: number;
};

export type Asset = {
  region: string;
  name: string;
  mw: number;
};

export type Link = {
  id: string;
  from: string;
  to: string;
  note: string;
};

export type RunType = "forecast" | "scenario" | "optimization" | "validation";

export type Run = {
  id: string;
  type: RunType;
  region: string;
  inputs: Record<string, string | number>;
  result: ForecastResult | ScenarioResult | OptimizationResult | ValidationResult;
  time: string;
  engine: string;
  sources: string[];
};

export type ForecastResult = {
  values: number[];
  low: number[];
  high: number[];
  mae: number;
};

export type ScenarioResult = {
  mean: number;
  p95: number;
  prob: number;
  quantiles: number[];
};

export type Portfolio = {
  selected: { name: string; mw: number; cost: number }[];
  cost: number;
  mw: number;
  short: number;
  score: number;
};

export type OptimizationResult = {
  feasible: boolean;
  plans: Portfolio[];
  count: number;
};

export type ValidationResult = {
  metrics: {
    method: string;
    mae: number;
    rmse: number;
    mape: number | null;
    coverage: number;
  }[];
  drift?: {
    earlyMae: number;
    lateMae: number;
    ratio: number;
    drifted: boolean;
  } | null;
};

export type Decision = {
  id: string;
  region: string;
  run: string;
  status: "Submitted" | "Approved" | "Returned";
  reason: string;
  time: string;
  reviewer?: Role;
  reviewed?: string;
};

export type ActionItem = {
  id: string;
  region: string;
  decision: string;
  name: string;
  state: string;
  owner?: string;
  due?: string;
  outcome?: string;
  reassessment?: string;
};

export type AuditEvent = {
  time: string;
  role: Role;
  event: string;
};

export type Workspace = {
  id: CaseId;
  label: string;
  regions: string[];
  obs: Observation[];
  snapshots: Snapshot[];
  risks: Risk[];
  assets: Asset[];
  links: Link[];
  runs: Run[];
  decisions: Decision[];
  actions: ActionItem[];
  audit: AuditEvent[];
};

export type SourceRow = {
  id: string;
  name: string;
  use: string;
  access: string;
  state: string;
  href: string;
};

export type WorkspacePayload = {
  workspace: Workspace;
  session: { role: Role; caseId: CaseId; name: string };
  sources: SourceRow[];
  capabilities: { eia: boolean; groq: boolean };
};

export function isForecast(result: Run["result"]): result is ForecastResult {
  return "values" in result && "mae" in result;
}

export function isScenario(result: Run["result"]): result is ScenarioResult {
  return "quantiles" in result && "prob" in result;
}

export function isOptimization(result: Run["result"]): result is OptimizationResult {
  return "feasible" in result && "plans" in result;
}

export function isValidation(result: Run["result"]): result is ValidationResult {
  return "metrics" in result;
}
