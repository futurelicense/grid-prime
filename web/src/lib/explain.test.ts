import assert from "node:assert/strict";
import test from "node:test";
import { claimsMatchRun, localExplanation } from "./explain";
import type { Run } from "./types";

const run: Run = {
  id: "run-1",
  type: "forecast",
  region: "Test zone",
  inputs: { method: "Seasonal naive", h: 2 },
  result: { values: [10, 12], low: [8, 9], high: [14, 16], mae: 1.5 },
  time: "2026-01-01T00:00:00.000Z",
  engine: "GRID-CASE-1.0",
  sources: ["SYN-001"],
};

test("local forecast explanation cites stored numbers", () => {
  const explanation = localExplanation(run);
  assert.equal(explanation.mode, "local");
  assert.equal(claimsMatchRun(run, explanation.claims), true);
});

test("a claim the run does not contain is rejected", () => {
  assert.equal(claimsMatchRun(run, [{ metric: "Invented MW", value: 999 }]), false);
});
