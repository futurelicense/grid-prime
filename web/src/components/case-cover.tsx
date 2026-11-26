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
  const cursor = workflowCursor(payload.workspace);
  const flags = caseFlags(payload.workspace);
  const synthetic = payload.workspace.obs.filter((row) => row.licensingClass === "synthetic").length;
  const published = payload.workspace.obs.filter((row) => row.licensingClass === "public-api-key").length;

  return (
    <div className="max-w-3xl">
      <p className="kicker">
        {payload.session.name} · {payload.workspace.label}
      </p>
      <h1 className="mt-3 font-serif text-5xl leading-[0.95] sm:text-6xl">Where this file stands.</h1>
      <p className="mt-6 max-w-2xl text-lg leading-8">
        {cursor === 0
          ? "This file has a signed plan and a recorded outcome. Reopen any step."
          : "Follow the four steps in order. The marked one is what this file is waiting on."}
      </p>
      <ol className="mt-8 grid gap-3 sm:grid-cols-2">
        {stages.map((stage) => {
          const waiting = cursor !== 0 && stage.href === next.href;
          return (
            <li key={stage.href} className={`border p-4 ${waiting ? "border-pine bg-moss" : "border-line bg-sheet"}`}>
              <p className="text-xs text-muted">
                Step {stage.no.replace(/^0/, "")}
                {waiting ? " · waiting here" : ""}
              </p>
              <h2 className="mt-1 font-serif text-2xl">{stage.name}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{stage.duty}</p>
              <p className="mt-2 text-sm leading-6">{stage.sentence}</p>
              <Link href={stage.href} className="mt-3 inline-block text-sm text-pine">
                Open
              </Link>
            </li>
          );
        })}
      </ol>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={next.href} className="btn">
          {next.label}
        </Link>
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
      <CaseWorkflow current={cursor} />
    </div>
  );
}
