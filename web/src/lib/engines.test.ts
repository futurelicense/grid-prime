import assert from "node:assert/strict";
import test from "node:test";
import { calcForecast, isRegularHourly, scenarioCalc, seriesDrift, solve } from "./engines";

test("seasonal naive repeats the prior day", () => {
  const loads = Array.from({ length: 48 }, (_, index) => index + 1);
  const forecast = calcForecast(loads, "Seasonal naive", 24);
  assert.equal(forecast.values[0], 25);
  assert.equal(forecast.values[23], 48);
  assert.ok(forecast.low.every((value, index) => value <= forecast.high[index]));
});

test("hourly regularity rejects gaps", () => {
  const start = Date.parse("2026-01-01T00:00:00.000Z");
  const times = Array.from({ length: 48 }, (_, index) => new Date(start + index * 3_600_000).toISOString());
  assert.equal(isRegularHourly(times), true);
  times[10] = new Date(start + 10 * 3_600_000 + 60_000).toISOString();
  assert.equal(isRegularHourly(times), false);
});

test("a zero budget cannot buy a reserve gap", () => {
  const result = solve({ budget: 0, base: 600, peak: 650, reserve: 15 });
  assert.equal(result.feasible, false);
  assert.equal(result.plans.length, 0);
});

test("a funded case returns only feasible portfolios", () => {
  const result = solve({ budget: 80, base: 600, peak: 650, reserve: 15 });
  assert.equal(result.feasible, true);
  for (const plan of result.plans) {
    assert.ok(plan.cost <= 80);
    assert.ok(600 + plan.mw >= 650 * 1.15);
  }
  assert.ok(result.plans[0].cost <= result.plans.at(-1)!.cost);
});

test("drift compares an earlier day with the latest day", () => {
  const calm = Array.from({ length: 72 }, (_, index) => 100 + (index % 24));
  const calmDrift = seriesDrift(calm);
  assert.ok(calmDrift);
  assert.equal(calmDrift.drifted, false);
  const shifted = calm.map((value, index) => (index >= 48 ? value + 80 : value));
  const moved = seriesDrift(shifted);
  assert.ok(moved);
  assert.equal(moved.drifted, true);
  assert.equal(seriesDrift(calm.slice(0, 48)), null);
});

test("scenario draws are stable for a seed", () => {
  const input = { demand: 650, capacity: 720, growth: 10, derate: 15, noise: 40, duration: 8, seed: 42 };
  const a = scenarioCalc(input);
  const b = scenarioCalc(input);
  assert.deepEqual(a, b);
  assert.ok(a.prob >= 0 && a.prob <= 1);
});
