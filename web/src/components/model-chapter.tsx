"use client";

import { useMemo, useState } from "react";
import { EIA_RESPONDENTS } from "@/lib/respondents";
import { download, fmt, toCsv } from "@/lib/format";
import { inZone } from "@/lib/narrative";
import { Chapter } from "./chapter";
import { Field, FormError, QuietButton, Submit, useFormError } from "./forms";
import { useWorkspace } from "./providers";

const SECTIONS = [
  { id: "sources", label: "Sources", detail: "Where a series is allowed to come from" },
  { id: "series", label: "Series", detail: "The hours actually on the case" },
  { id: "system", label: "System", detail: "Zones, transfers, resources, contingencies" },
];

export function ModelChapter() {
  const { payload, zone, mutate } = useWorkspace();
  const [section, setSection] = useState("sources");
  if (!payload) return <p className="text-muted">Opening the case file.</p>;
  const canWrite = payload.session.role !== "Viewer";
  const workspace = payload.workspace;
  const observations = inZone(workspace.obs, zone);
  const regions = zone === "all" ? workspace.regions : workspace.regions.filter((item) => item === zone);

  return (
    <Chapter
      number="01"
      title="Model"
      lede="File the system before anyone forecasts it. A national total is not a feeder, and a synthetic hour is not telemetry."
      sections={SECTIONS}
      current={section}
      onChange={setSection}
    >
      {section === "sources" ? (
        <Sources
          canWrite={canWrite}
          eia={payload.capabilities.eia}
          sources={payload.sources}
          snapshots={workspace.snapshots}
          mutate={mutate}
        />
      ) : null}
      {section === "series" ? <Series observations={observations} /> : null}
      {section === "system" ? (
        <System
          canWrite={canWrite}
          regions={regions}
          assets={inZone(workspace.assets, zone)}
          risks={inZone(workspace.risks, zone)}
          snapshots={workspace.snapshots}
          links={workspace.links.filter((link) => zone === "all" || link.from === zone || link.to === zone)}
          allRegions={workspace.regions}
          mutate={mutate}
        />
      ) : null}
    </Chapter>
  );
}

function Sources({
  canWrite,
  eia,
  sources,
  snapshots,
  mutate,
}: {
  canWrite: boolean;
  eia: boolean;
  sources: { id: string; name: string; use: string; access: string; state: string; href: string }[];
  snapshots: { id: string; sourceId: string; label: string; hash: string; date: string; qualityFlags: string[] }[];
  mutate: (url: string, body?: unknown) => Promise<void>;
}) {
  const form = useFormError();
  const [respondent, setRespondent] = useState("CISO");
  return (
    <div className="grid gap-10">
      <div>
        <h2 className="font-serif text-3xl">What may enter the case</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
          EIA hourly demand is a balancing-authority total. It does not include available capacity, asset health, or a
          private dispatch schedule. PJM and ERCOT direct feeds stay out until their redistribution terms are cleared.
        </p>
        <ul className="mt-6 border-t border-line">
          {sources.map((source) => (
            <li key={source.id} className="grid gap-1 border-b border-line py-4 sm:grid-cols-[1fr_9rem]">
              <div>
                {source.href ? (
                  <a className="underline decoration-line underline-offset-4" href={source.href}>
                    {source.name}
                  </a>
                ) : (
                  <div>{source.name}</div>
                )}
                <p className="text-sm text-muted">{source.use}</p>
                <p className="text-sm text-muted">{source.access}</p>
              </div>
              <div className="text-sm">{source.state}</div>
            </li>
          ))}
        </ul>
        <h2 className="mt-8 font-serif text-3xl">Versions on this case</h2>
        {snapshots.length ? (
          <ul className="mt-4 border-t border-line">
            {snapshots.map((snapshot) => (
              <li key={snapshot.id} className="border-b border-line py-3 text-sm">
                <div>
                  {snapshot.sourceId} · {snapshot.label}
                </div>
                <p className="text-muted">
                  {snapshot.id} · {snapshot.hash} · {snapshot.date.replace(".000Z", "Z")}
                </p>
                <p className="text-muted">{snapshot.qualityFlags.join(", ")}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">No snapshot has been filed.</p>
        )}
      </div>
      <form
        className="grid max-w-md gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          form.run(() => mutate("/api/v2/ingestion-runs", { mode: "eia", respondent }));
        }}
      >
        <h2 className="font-serif text-3xl">Pull a public demand series</h2>
        <Field label="EIA respondent">
          <select className="control" value={respondent} onChange={(event) => setRespondent(event.target.value)}>
            {EIA_RESPONDENTS.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </Field>
        <p className="text-sm text-muted">
          {eia
            ? "The server will request hourly demand and file it as a public snapshot. Capacity will stay empty because this feed does not report it."
            : "EIA_API_KEY is not set. The pull will refuse rather than invent a series."}
        </p>
        <Submit disabled={!canWrite}>File EIA demand</Submit>
        <FormError message={form.message} />
      </form>
      <SyntheticImport canWrite={canWrite} mutate={mutate} />
    </div>
  );
}

function SyntheticImport({
  canWrite,
  mutate,
}: {
  canWrite: boolean;
  mutate: (url: string, body?: unknown) => Promise<void>;
}) {
  const form = useFormError();
  return (
    <form
      className="grid max-w-md gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const input = event.currentTarget.elements.namedItem("file");
        form.run(async () => {
          if (!(input instanceof HTMLInputElement) || !input.files?.[0]) {
            throw new Error("Choose a JSON file of synthetic observations.");
          }
          const observations = JSON.parse(await input.files[0].text());
          await mutate("/api/v2/ingestion-runs", {
            mode: "synthetic",
            label: input.files[0].name,
            observations,
          });
          input.value = "";
        });
      }}
    >
      <h2 className="font-serif text-3xl">Or file a synthetic series</h2>
      <p className="text-sm leading-6 text-muted">
        JSON array of region, UTC time, load MW, and capacity MW. These rows are marked synthetic and are not a
        substitute for utility telemetry.
      </p>
      <input name="file" type="file" accept="application/json,.json" className="text-sm" />
      <div className="flex flex-wrap gap-3">
        <Submit disabled={!canWrite}>Validate and file</Submit>
        <QuietButton
          onClick={() =>
            download(
              "sample-grid.json",
              JSON.stringify(
                [{ region: "Example research zone", time: "2026-01-01T00:00:00.000Z", load: 110, capacity: 150 }],
                null,
                2,
              ),
            )
          }
        >
          Sample file
        </QuietButton>
      </div>
      <FormError message={form.message} />
    </form>
  );
}

function Series({
  observations,
}: {
  observations: {
    region: string;
    time: string;
    load: number;
    capacity: number | null;
    source: string;
    spatialResolution: string;
    licensingClass: string;
  }[];
}) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const filtered = useMemo(
    () => observations.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase())),
    [observations, query],
  );
  const visible = expanded ? filtered : filtered.slice(0, 16);
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl">Hours on file</h2>
          <p className="mt-2 text-sm text-muted">{filtered.length.toLocaleString("en-US")} in this reading.</p>
        </div>
        <QuietButton
          onClick={() =>
            download(
              "observations.csv",
              toCsv(filtered as unknown as Record<string, unknown>[]),
              "text/csv",
            )
          }
        >
          Export this reading
        </QuietButton>
      </div>
      <input
        className="control mt-6 max-w-sm"
        placeholder="Find a zone, hour, or source"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="mt-4 overflow-x-auto">
        <table className="data">
          <thead>
            <tr>
              <th>Zone</th>
              <th>Hour</th>
              <th>Load MW</th>
              <th>Capacity MW</th>
              <th>Resolution</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={`${row.region}-${row.time}-${row.source}`}>
                <td>{row.region}</td>
                <td>{row.time.replace(".000Z", "Z")}</td>
                <td>{fmt(row.load)}</td>
                <td>{fmt(row.capacity)}</td>
                <td>{row.spatialResolution === "balancing-authority" ? "Balancing authority" : "Research zone"}</td>
                <td>
                  {row.source}
                  <div className="text-xs text-muted">{row.licensingClass}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!filtered.length ? <p className="mt-4 text-sm text-muted">Nothing in this reading matches.</p> : null}
      {filtered.length > 16 ? (
        <button type="button" className="mt-4 text-sm text-pine" onClick={() => setExpanded((value) => !value)}>
          {expanded ? "Show fewer hours" : `Show all ${filtered.length} hours`}
        </button>
      ) : null}
    </div>
  );
}

function System({
  canWrite,
  regions,
  assets,
  risks,
  snapshots,
  links,
  allRegions,
  mutate,
}: {
  canWrite: boolean;
  regions: string[];
  assets: { region: string; name: string; mw: number }[];
  risks: { id: string; region: string; name: string; p: number; loss: number }[];
  snapshots: { id: string; label: string; count: number; mode: string; date: string; licensingClass: string }[];
  links: { id: string; from: string; to: string; note: string }[];
  allRegions: string[];
  mutate: (url: string, body?: unknown) => Promise<void>;
}) {
  const zoneForm = useFormError();
  const linkForm = useFormError();
  const assetForm = useFormError();
  const riskForm = useFormError();
  return (
    <div className="grid gap-12">
      <form
        className="grid max-w-md gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const formElement = event.currentTarget;
          const data = new FormData(formElement);
          zoneForm.run(async () => {
            await mutate("/api/v2/zones", { region: data.get("region") });
            formElement.reset();
          });
        }}
      >
        <h2 className="font-serif text-3xl">Name a zone</h2>
        <Field label="Zone">
          <input name="region" className="control" />
        </Field>
        <Submit disabled={!canWrite}>Add the zone</Submit>
        <FormError message={zoneForm.message} />
      </form>
      <div>
        <h2 className="font-serif text-3xl">Stated transfers</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
          A transfer names two zones you are willing to connect in the case. It is not a line rating, a power flow, or a
          dispatch path.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {allRegions.map((region) => (
            <div key={region} className="border border-line bg-sheet p-4">
              <div className="font-serif text-xl">{region}</div>
              <ul className="mt-2 text-sm text-muted">
                {links
                  .filter((link) => link.from === region)
                  .map((link) => (
                    <li key={link.id}>Toward {link.to}</li>
                  ))}
                {!links.some((link) => link.from === region) ? <li>No transfer leaves this zone.</li> : null}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <form
        className="grid max-w-md gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const formElement = event.currentTarget;
          const data = new FormData(formElement);
          linkForm.run(async () => {
            await mutate("/api/v2/links", { from: data.get("from"), to: data.get("to"), note: data.get("note") });
            formElement.reset();
          });
        }}
      >
        <Field label="From">
          <select name="from" className="control">
            {allRegions.map((region) => (
              <option key={region}>{region}</option>
            ))}
          </select>
        </Field>
        <Field label="To">
          <select name="to" className="control">
            {allRegions.map((region) => (
              <option key={region}>{region}</option>
            ))}
          </select>
        </Field>
        <Field label="What it represents">
          <input name="note" className="control" placeholder="Research transfer, not a rating" />
        </Field>
        <Submit disabled={!canWrite || allRegions.length < 2}>State the transfer</Submit>
        <FormError message={linkForm.message} />
      </form>
      <List
        title="Transfers in this reading"
        headers={["From", "To", "Statement"]}
        rows={links.map((link) => [link.from, link.to, link.note])}
      />
      <form
        className="grid max-w-md gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          assetForm.run(() =>
            mutate("/api/v2/assets", {
              region: data.get("region"),
              name: data.get("name"),
              mw: Number(data.get("mw")),
            }),
          );
        }}
      >
        <h2 className="font-serif text-3xl">State a resource</h2>
        <ZoneSelect regions={regions} />
        <Field label="Abstraction">
          <input name="name" className="control" placeholder="Thermal equivalent" />
        </Field>
        <Field label="Capacity MW">
          <input name="mw" type="number" className="control" defaultValue={100} />
        </Field>
        <Submit disabled={!canWrite || !regions.length}>Add the resource</Submit>
        <FormError message={assetForm.message} />
      </form>
      <List
        title="Resources in this reading"
        rows={assets.map((asset) => [asset.region, asset.name, fmt(asset.mw)])}
        headers={["Zone", "Resource", "MW"]}
      />
      <form
        className="grid max-w-md gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          riskForm.run(() =>
            mutate("/api/v2/risks", {
              region: data.get("region"),
              name: data.get("name"),
              p: Number(data.get("p")),
              loss: Number(data.get("loss")),
            }),
          );
        }}
      >
        <h2 className="font-serif text-3xl">State a contingency</h2>
        <p className="text-sm leading-6 text-muted">
          Expected consequence is probability times the stated impact. Overlapping events are not added into a
          certified reliability index.
        </p>
        <ZoneSelect regions={regions} />
        <Field label="Event">
          <input name="name" className="control" />
        </Field>
        <Field label="Probability, 0 to 1">
          <input name="p" type="number" step="0.01" className="control" defaultValue={0.1} />
        </Field>
        <Field label="Consequence MWh">
          <input name="loss" type="number" className="control" defaultValue={100} />
        </Field>
        <Submit disabled={!canWrite || !regions.length}>Register the event</Submit>
        <FormError message={riskForm.message} />
      </form>
      <List
        title="Contingencies in this reading"
        headers={["Zone", "Event", "Probability", "MWh", "Expected MWh"]}
        rows={risks.map((risk) => [risk.region, risk.name, fmt(risk.p), fmt(risk.loss), fmt(risk.p * risk.loss)])}
      />
      <List
        title="Snapshots"
        headers={["Id", "Label", "Rows", "Class", "Filed"]}
        rows={snapshots.map((snapshot) => [
          snapshot.id,
          snapshot.label,
          String(snapshot.count),
          snapshot.mode,
          snapshot.date.replace(".000Z", "Z"),
        ])}
      />
    </div>
  );
}

function ZoneSelect({ regions }: { regions: string[] }) {
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

function List({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) {
  return (
    <div>
      <h2 className="font-serif text-3xl">{title}</h2>
      {rows.length ? (
        <div className="mt-4 overflow-x-auto">
          <table className="data">
            <thead>
              <tr>
                {headers.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${title}-${index}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">Nothing filed in this reading.</p>
      )}
    </div>
  );
}
