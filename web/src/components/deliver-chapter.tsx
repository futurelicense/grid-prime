"use client";

import Link from "next/link";
import { useState } from "react";
import { download, fmt } from "@/lib/format";
import { caseFlags, inZone } from "@/lib/narrative";
import type { Explanation } from "@/lib/explain";
import type { Run } from "@/lib/types";
import { isForecast, isOptimization, isScenario } from "@/lib/types";
import { Chapter } from "./chapter";
import { Field, FormError, QuietButton, Submit, useFormError } from "./forms";
import { useWorkspace } from "./providers";

const SECTIONS = [
  { id: "situation", label: "Where it stands", detail: "What this file can support right now." },
  { id: "review", label: "Accept or return", detail: "A reviewer writes the reason. The number does not decide." },
  { id: "outcomes", label: "What happened", detail: "After acceptance, record what was observed." },
  { id: "explain", label: "Read a number", detail: "A reading describes a stored result, or it abstains." },
  { id: "record", label: "The record", detail: "The activity, the export, and the brief." },
];

export function DeliverChapter() {
  const { payload, zone, mutate, refresh } = useWorkspace();
  const [section, setSection] = useState("situation");
  if (!payload) return <p className="text-muted">Opening the case file.</p>;
  const role = payload.session.role;
  const workspace = payload.workspace;
  const observations = inZone(workspace.obs, zone);
  const runs = inZone(workspace.runs, zone);
  const decisions = inZone(workspace.decisions, zone);
  const actions = inZone(workspace.actions, zone);

  return (
    <Chapter
      number="4"
      title="Who agreed"
      lede="A person accepts or returns the plan and writes why. Later, someone records what happened."
      sections={SECTIONS}
      current={section}
      onChange={setSection}
    >
      {section === "situation" ? (
        <Situation observations={observations} runs={runs} decisions={decisions} flags={caseFlags(workspace)} />
      ) : null}
      {section === "review" ? <Review decisions={decisions} role={role} mutate={mutate} /> : null}
      {section === "outcomes" ? <Outcomes actions={actions} role={role} mutate={mutate} /> : null}
      {section === "explain" ? (
        <Explain runs={runs} groq={payload.capabilities.groq} refresh={refresh} />
      ) : null}
      {section === "record" ? (
        <Record
          role={role}
          audit={workspace.audit}
          workspace={workspace}
          mutate={mutate}
        />
      ) : null}
    </Chapter>
  );
}

function Situation({
  observations,
  runs,
  decisions,
  flags,
}: {
  observations: { load: number; capacity: number | null }[];
  runs: Run[];
  decisions: { status: string }[];
  flags: string[];
}) {
  const peak = observations.length ? Math.max(...observations.map((row) => row.load)) : Number.NaN;
  const margins = observations
    .filter((row) => row.capacity != null && row.load > 0)
    .map((row) => (100 * ((row.capacity as number) - row.load)) / row.load);
  const forecast = runs.find((run) => run.type === "forecast");
  const forecastPeak =
    forecast && isForecast(forecast.result) ? Math.max(...forecast.result.values) : Number.NaN;
  const waiting = decisions.filter((decision) => decision.status === "Submitted").length;
  return (
    <div className="max-w-2xl">
      <h2 className="font-serif text-4xl leading-tight">
        {Number.isFinite(peak) ? `${fmt(peak)} MW is the highest load in this reading.` : "This reading has no load on file."}
      </h2>
      <p className="mt-4 leading-7">
        {margins.length
          ? `The thinnest hour with a stated capacity sits at a ${fmt(Math.min(...margins))} percent margin. That is an observation gap, not a reserve study.`
          : "No capacity is attached to this reading, so the case will not invent a margin."}{" "}
        {Number.isFinite(forecastPeak)
          ? `The latest forecast peaks at ${fmt(forecastPeak)} MW.`
          : "Predict has not filed an outlook for this reading."}{" "}
        {waiting
          ? `${waiting} plan${waiting === 1 ? " is" : "s are"} waiting for a person.`
          : "Nothing is waiting for review in this reading."}
      </p>
      {flags.length ? (
        <ul className="mt-6 border-t border-line">
          {flags.map((flag) => (
            <li key={flag} className="border-b border-line py-3 text-sm">
              {flag}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 text-sm text-muted">No open flag on this case.</p>
      )}
    </div>
  );
}

function Review({
  decisions,
  role,
  mutate,
}: {
  decisions: { id: string; region: string; run: string; status: string; reason: string }[];
  role: string;
  mutate: (url: string, body?: unknown) => Promise<void>;
}) {
  const form = useFormError();
  return (
    <div>
      <h2 className="font-serif text-3xl">Decision record</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
        Approval here is a planning review. It does not authorize switching, dispatch, or construction.
      </p>
      <div className="mt-6 grid gap-6">
        {decisions.map((decision) => (
          <article key={decision.id} className="border-t border-line pt-4">
            <p className="font-serif text-2xl">{decision.status}</p>
            <p className="text-sm text-muted">
              {decision.region} · run {decision.run}
            </p>
            {decision.reason ? <p className="mt-2 text-sm leading-6">{decision.reason}</p> : null}
            {decision.status === "Submitted" && role === "Reviewer" ? (
              <form
                className="mt-4 grid max-w-md gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  const data = new FormData(event.currentTarget);
                  form.run(() =>
                    mutate("/api/v2/reviews", {
                      decisionId: decision.id,
                      status: data.get("status"),
                      reason: data.get("reason"),
                    }),
                  );
                }}
              >
                <Field label="Why">
                  <textarea name="reason" className="control min-h-24" />
                </Field>
                <div className="flex gap-3">
                  <button className="btn" name="status" value="Approved" type="submit">
                    Accept
                  </button>
                  <button className="btn quiet" name="status" value="Returned" type="submit">
                    Return
                  </button>
                </div>
              </form>
            ) : null}
          </article>
        ))}
        {!decisions.length ? <p className="text-sm text-muted">No decision in this reading.</p> : null}
        <FormError message={form.message} />
      </div>
    </div>
  );
}

function Outcomes({
  actions,
  role,
  mutate,
}: {
  actions: {
    id: string;
    region: string;
    name: string;
    state: string;
    owner?: string;
    due?: string;
    outcome?: string;
    reassessment?: string;
  }[];
  role: string;
  mutate: (url: string, body?: unknown) => Promise<void>;
}) {
  const form = useFormError();
  return (
    <div className="grid gap-6">
      <h2 className="font-serif text-3xl">After acceptance</h2>
      {actions.map((action) => (
        <article key={action.id} className="border-t border-line pt-4">
          <p>{action.name}</p>
          <p className="text-sm text-muted">
            {action.region} · {action.state}
            {action.owner ? ` · ${action.owner}` : ""}
            {action.due ? ` · due ${action.due}` : ""}
          </p>
          {action.outcome ? <p className="mt-2 text-sm leading-6">{action.outcome}</p> : null}
          {action.reassessment ? <p className="mt-2 text-sm leading-6">Reassessment: {action.reassessment}</p> : null}
          {!action.outcome && role !== "Viewer" ? (
            <form
              className="mt-3 grid max-w-md gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                form.run(() =>
                  mutate("/api/v2/actions", {
                    id: action.id,
                    owner: data.get("owner"),
                    due: data.get("due"),
                    progress: data.get("progress"),
                  }),
                );
              }}
            >
              <Field label="Owner">
                <input name="owner" className="control" defaultValue={action.owner ?? ""} />
              </Field>
              <Field label="Due date">
                <input name="due" type="date" className="control" defaultValue={action.due ?? ""} />
              </Field>
              <Field label="Progress">
                <select name="progress" className="control" defaultValue={action.state === "Under way" ? "Under way" : "Planned"}>
                  <option>Planned</option>
                  <option>Under way</option>
                </select>
              </Field>
              <Submit>Save the assignment</Submit>
            </form>
          ) : null}
          {role === "Program manager" ? (
            <form
              className="mt-3 grid max-w-md gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                form.run(() => mutate("/api/v2/outcomes", { id: action.id, outcome: data.get("outcome") }));
              }}
            >
              <Field label="What was observed">
                <textarea name="outcome" className="control min-h-20" />
              </Field>
              <Submit>Record the outcome</Submit>
            </form>
          ) : null}
          {role === "Program manager" && action.outcome ? (
            <form
              className="mt-3 grid max-w-md gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                form.run(() => mutate("/api/v2/reassessments", { id: action.id, note: data.get("note") }));
              }}
            >
              <Field label="What the next look should examine">
                <textarea name="note" className="control min-h-20" defaultValue={action.reassessment ?? ""} />
              </Field>
              <Submit>Ask for a reassessment</Submit>
            </form>
          ) : null}
        </article>
      ))}
      {!actions.length ? <p className="text-sm text-muted">Accepted plans create an action. None are in this reading.</p> : null}
      <FormError message={form.message} />
    </div>
  );
}

function Explain({
  runs,
  groq,
  refresh,
}: {
  runs: { id: string; type: string; region: string }[];
  groq: boolean;
  refresh: () => Promise<void>;
}) {
  const form = useFormError();
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  return (
    <div className="grid max-w-xl gap-4">
      <h2 className="font-serif text-3xl">Explain a stored run</h2>
      <p className="text-sm leading-6 text-muted">
        {groq
          ? "Groq may phrase the result. If it cites a number that is not in the run, the case discards the answer and shows the local sentence."
          : "No Groq key is on the server. The explanation is computed from the stored result and does not leave the machine."}
      </p>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          form.run(async () => {
            const response = await fetch("/api/v2/ai/explain", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ runId: data.get("runId") }),
            });
            const body = await response.json();
            if (!response.ok) throw new Error(body.error || "No explanation was filed.");
            setExplanation(body.explanation);
            await refresh();
          });
        }}
      >
        <Field label="Run">
          <select name="runId" className="control">
            {runs.map((run) => (
              <option key={run.id} value={run.id}>
                {run.type} · {run.region} · {run.id}
              </option>
            ))}
          </select>
        </Field>
        <Submit disabled={!runs.length}>Explain</Submit>
        <FormError message={form.message} />
      </form>
      {explanation ? (
        <div className="border-t border-line pt-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            {explanation.mode === "groq" ? "Groq" : "Local"} {explanation.abstained ? "· abstained" : ""}
          </p>
          <p className="mt-3 leading-7">{explanation.summary}</p>
          {explanation.note ? <p className="mt-2 text-sm text-clay">{explanation.note}</p> : null}
          {explanation.claims.length ? (
            <ul className="mt-4 text-sm">
              {explanation.claims.map((claim) => (
                <li key={claim.metric}>
                  {claim.metric}: {fmt(claim.value)}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-4 text-sm text-muted">{explanation.limits}</p>
        </div>
      ) : null}
    </div>
  );
}

function Record({
  role,
  audit,
  workspace,
  mutate,
}: {
  role: string;
  audit: { time: string; role: string; event: string }[];
  workspace: unknown;
  mutate: (url: string, body?: unknown, method?: "POST" | "DELETE") => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const form = useFormError();
  const canWrite = role !== "Viewer";
  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap gap-3">
        <QuietButton onClick={() => download("grid-prime-case.json", JSON.stringify(workspace, null, 2))}>
          Download the case
        </QuietButton>
        <QuietButton
          onClick={() => {
            void fetch("/api/v2/reports/evidence")
              .then((response) => response.json())
              .then((pack) => download("grid-prime-evidence.json", JSON.stringify(pack, null, 2)));
          }}
        >
          Download the evidence pack
        </QuietButton>
        <Link href="/brief" className="btn quiet">
          Open the brief
        </Link>
      </div>
      <div>
        <h2 className="font-serif text-3xl">Activity</h2>
        <table className="data mt-4">
          <thead>
            <tr>
              <th>When</th>
              <th>Session</th>
              <th>What was filed</th>
            </tr>
          </thead>
          <tbody>
            {audit.slice(0, 20).map((event, index) => (
              <tr key={`${event.time}-${index}`}>
                <td>{event.time.replace(".000Z", "Z")}</td>
                <td>{event.role}</td>
                <td>{event.event}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!audit.length ? <p className="mt-3 text-sm text-muted">No activity yet.</p> : null}
      </div>
      <div>
        {confirming ? (
          <div className="grid max-w-md gap-3">
            <p>Reset replaces this case with its original seed. The other case is left alone.</p>
            <div className="flex gap-3">
              <button
                type="button"
                className="btn"
                disabled={!canWrite}
                onClick={() =>
                  form.run(async () => {
                    await mutate("/api/v2/workspace", undefined, "DELETE");
                    setConfirming(false);
                  })
                }
              >
                Reset this case
              </button>
              <QuietButton onClick={() => setConfirming(false)}>Keep it</QuietButton>
            </div>
            <FormError message={form.message} />
          </div>
        ) : (
          <QuietButton onClick={() => setConfirming(true)} disabled={!canWrite}>
            Reset this case
          </QuietButton>
        )}
      </div>
    </div>
  );
}
