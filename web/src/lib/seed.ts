import { createHash } from "crypto";
import type { CaseId, Workspace } from "./types";

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function hashPayload(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);
}

export function seedWorkspace(id: CaseId): Workspace {
  const blank = id === "empty";
  const regions = blank ? [] : ["Lone Star research zone", "Midwest research zone", "Atlantic research zone"];
  const now = new Date().toISOString();
  const obs = regions.flatMap((region, index) =>
    Array.from({ length: 72 }, (_, hour) => ({
      region,
      time: new Date(Date.UTC(2026, 0, 1, hour)).toISOString(),
      load: Math.round(
        470 +
          index * 160 +
          100 * Math.sin(((hour % 24) - 7) * Math.PI / 12) +
          hour * 0.6 +
          16 * Math.sin(hour * 3.7),
      ),
      capacity: 720 + index * 160,
      source: "SYN-001",
      licensingClass: "synthetic" as const,
      spatialResolution: "research-zone" as const,
    })),
  );
  return {
    id,
    label: blank ? "Empty case" : "Reference case",
    regions,
    obs,
    snapshots: blank
      ? []
      : [
          {
            id: "SYN-001",
            label: "Seeded hourly observations",
            count: obs.length,
            mode: "SYNTHETIC",
            date: now,
            sourceId: "synthetic",
            licensingClass: "synthetic",
            hash: hashPayload(obs.map((row) => [row.region, row.time, row.load, row.capacity])),
            qualityFlags: ["synthetic", "non-operational"],
          },
        ],
    risks: blank
      ? []
      : regions.flatMap((region) => [
          { id: uid(), region, name: "Peak demand stress", p: 0.15, loss: 120 },
          { id: uid(), region, name: "Resource availability loss", p: 0.08, loss: 200 },
        ]),
    assets: blank
      ? []
      : regions.flatMap((region, index) => [
          { region, name: "Thermal equivalent", mw: 450 + index * 100 },
          { region, name: "Renewable equivalent", mw: 170 + index * 40 },
          { region, name: "Firm import equivalent", mw: 100 + index * 20 },
        ]),
    links: blank
      ? []
      : [
          {
            id: "link-ls-mw",
            from: regions[0],
            to: regions[1],
            note: "Stated research transfer. Not a line rating.",
          },
          {
            id: "link-mw-at",
            from: regions[1],
            to: regions[2],
            note: "Stated research transfer. Not a line rating.",
          },
        ],
    runs: [],
    decisions: [],
    actions: [],
    audit: [],
  };
}
