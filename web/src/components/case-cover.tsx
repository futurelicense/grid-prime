"use client";

import Link from "next/link";
import { caseFlags, caseStages, nextStep, workflowCursor } from "@/lib/narrative";
import { useWorkspace } from "./providers";
import { TourLaunch } from "./tour";
import { CaseWorkflow } from "./workflow";

export function CaseCover() {
  const { payload } = useWorkspace();
  if (!payload) return <p className="text-muted">Opening the case file.</p>;
  const stages = caseStages(payload.workspace);
  const next = nextStep(payload.workspace);
  const flags = caseFlags(payload.workspace);
  const synthetic = payload.workspace.obs.filter((row) => row.licensingClass === "synthetic").length;
  const published = payload.workspace.obs.filter((row) => row.licensingClass === "public-api-key").length;

  return (
    <div className="max-w-3xl">
      <p className="kicker">
        {payload.session.name} · {payload.workspace.label}
      </p>
      <h1 className="mt-3 font-serif text-5xl leading-[0.95] sm:text-6xl">
        One file, from the hours to the signature.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
        File the region and the demand. Forecast the next day. Keep the option that fits the budget. A person accepts
        or returns it and writes why.
      </p>
      <div className="mt-6">
        <TourLaunch label="Take the tour" variant="quiet" entered />
      </div>
      <p className="mt-4 text-sm text-muted">
        {`${synthetic.toLocaleString("en-US")} synthetic hours on file${
          published ? ` · ${published.toLocaleString("en-US")} public hours` : ""
        }. Engine GRID-CASE-1.0. `}
        {payload.capabilities.groq ? "Groq can explain a stored run." : "Explanations stay local until a Groq key is set."}
      </p>
      {flags.length ? (
        <ul className="mt-4 max-w-xl border-t border-line text-sm">
          {flags.map((flag) => (
            <li key={flag} className="border-b border-line py-2">
              {flag}
            </li>
          ))}
        </ul>
      ) : null}
      <CaseWorkflow current={workflowCursor(payload.workspace)} />
      <p className="kicker mt-14">What is already on file</p>
      <ol className="mt-4 border-t border-line">
        {stages.map((stage) => (
          <li key={stage.href} className="grid gap-3 border-b border-line py-6 sm:grid-cols-[4rem_1fr_auto] sm:items-end">
            <div className="font-serif text-3xl text-pine">{stage.no}</div>
            <div>
              <h2 className="font-serif text-3xl">{stage.name}</h2>
              <p className="mt-1 text-sm text-muted">{stage.duty}</p>
              <p className="mt-3 text-sm leading-6">{stage.sentence}</p>
            </div>
            <Link href={stage.href} className="text-sm text-pine">
              Open
            </Link>
          </li>
        ))}
      </ol>
      <Link href={next.href} className="btn mt-8">
        {next.label}
      </Link>
    </div>
  );
}
