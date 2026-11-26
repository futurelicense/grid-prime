"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { nextStep } from "@/lib/narrative";
import { useWorkspace } from "./providers";
import { TourLaunch } from "./tour";

const STAGES = [
  { href: "/model", n: "1", ask: "What was used", line: "Put the region and the hours on the file." },
  { href: "/predict", n: "2", ask: "The next day", line: "See the forecast drawn from those hours." },
  { href: "/optimize", n: "3", ask: "What fits", line: "Keep the option that meets the budget and the reserve." },
  { href: "/deliver", n: "4", ask: "Who agreed", line: "A person accepts or returns the plan and writes why." },
] as const;

function Place({
  pathname,
  line,
  waiting,
}: {
  pathname: string;
  line?: string;
  waiting: { href: string; label: string } | null;
}) {
  if (!line && pathname !== "/case") return null;
  const elsewhere = waiting && waiting.href !== pathname;
  return (
    <div className="border-t border-line bg-paper">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-3 text-sm">
        <p className="max-w-xl leading-6">
          {pathname === "/case"
            ? "This page is the whole file. The four steps above are the path."
            : line}
        </p>
        {elsewhere ? (
          <Link href={waiting.href} className="text-pine">
            This file is waiting on: {waiting.label}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { payload, zone, setZone, setSession, leave, error } = useWorkspace();
  const workspace = payload?.workspace;
  const ready = {
    "/model": Boolean(workspace && workspace.obs.length && workspace.regions.length),
    "/predict": Boolean(workspace?.runs.some((run) => run.type === "forecast" || run.type === "scenario")),
    "/optimize": Boolean(workspace?.runs.some((run) => run.type === "optimization")),
    "/deliver": Boolean(workspace?.decisions.length),
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-sheet">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/case" className="block">
            <div className="kicker">Grid Prime</div>
            <div className="mt-1 font-serif text-2xl leading-none">Case file</div>
          </Link>
          {payload ? (
            <div className="flex items-center gap-4 text-sm">
              <div className="text-right">
                <div className="font-medium">{payload.session.name}</div>
                <div className="text-xs text-muted">{payload.session.role}</div>
              </div>
              <Link href="/login?switch=1" className="hidden text-pine sm:inline">
                Change seat
              </Link>
              <button type="button" className="btn quiet" onClick={() => void leave()}>
                Sign out
              </button>
            </div>
          ) : null}
        </div>
        <div className="border-t border-line">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-2 text-sm">
            <label>
              <span className="text-muted">File </span>
              <select
                className="quiet-select"
                value={payload?.session.caseId ?? "reference"}
                onChange={(event) => setSession({ caseId: event.target.value as "reference" | "empty" })}
              >
                <option value="reference">Example</option>
                <option value="empty">Blank</option>
              </select>
            </label>
            <label>
              <span className="text-muted">Zone </span>
              <select className="quiet-select" value={zone} onChange={(event) => setZone(event.target.value)}>
                <option value="all">All zones</option>
                {workspace?.regions.map((region) => (
                  <option key={region}>{region}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <nav className="mx-auto grid max-w-5xl grid-cols-2 border-t border-line sm:grid-cols-4" aria-label="The four steps">
          {STAGES.map((stage) => {
            const active = pathname === stage.href;
            return (
              <Link
                key={stage.href}
                href={stage.href}
                aria-current={active ? "page" : undefined}
                className={`border-line px-5 py-3 sm:border-l first:border-l-0 ${active ? "bg-paper" : "bg-sheet"}`}
              >
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span>Step {stage.n}</span>
                  {payload ? (
                    <>
                      <span className={`h-1.5 w-1.5 rounded-full ${ready[stage.href] ? "bg-pine" : "bg-line"}`} aria-hidden />
                      <span>{ready[stage.href] ? "On file" : "Not yet"}</span>
                    </>
                  ) : null}
                </div>
                <div className={`mt-1 font-serif text-2xl ${active ? "text-pine" : ""}`}>{stage.ask}</div>
              </Link>
            );
          })}
        </nav>
        <Place pathname={pathname} line={STAGES.find((stage) => stage.href === pathname)?.line} waiting={workspace ? nextStep(workspace) : null} />
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">
        {error ? <p className="mb-6 text-clay">{error}</p> : null}
        {children}
      </main>
      <footer className="mx-auto flex max-w-5xl flex-wrap justify-between gap-3 px-6 pb-10 text-sm text-muted">
        <span>Planning review only.</span>
        <span className="flex gap-4">
          <TourLaunch label="Take the tour" variant="link" entered />
          <Link href="/" className="text-pine">
            About Grid Prime
          </Link>
        </span>
      </footer>
    </div>
  );
}
