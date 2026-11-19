"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWorkspace } from "./providers";

const STAGES = [
  ["/model", "01", "Model", "System"],
  ["/predict", "02", "Predict", "Outlook"],
  ["/optimize", "03", "Optimize", "Portfolio"],
  ["/deliver", "04", "Deliver", "Decision"],
] as const;

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
              <span className="text-muted">Case </span>
              <select
                className="quiet-select"
                value={payload?.session.caseId ?? "reference"}
                onChange={(event) => setSession({ caseId: event.target.value as "reference" | "empty" })}
              >
                <option value="reference">Reference</option>
                <option value="empty">Empty</option>
              </select>
            </label>
            <label>
              <span className="text-muted">Reading </span>
              <select className="quiet-select" value={zone} onChange={(event) => setZone(event.target.value)}>
                <option value="all">All zones</option>
                {workspace?.regions.map((region) => (
                  <option key={region}>{region}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <nav className="mx-auto grid max-w-5xl grid-cols-2 border-t border-line sm:grid-cols-4">
          {STAGES.map(([href, number, name, product]) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`border-line px-5 py-3 sm:border-l first:border-l-0 ${active ? "bg-paper" : "bg-sheet"}`}
              >
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span>{number}</span>
                  <span className={`h-1.5 w-1.5 rounded-full ${ready[href] ? "bg-pine" : "bg-line"}`} aria-hidden />
                  <span>{product}</span>
                </div>
                <div className={`mt-1 font-serif text-2xl ${active ? "text-pine" : ""}`}>{name}</div>
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">
        {error ? <p className="mb-6 text-clay">{error}</p> : null}
        {children}
      </main>
      <footer className="mx-auto flex max-w-5xl flex-wrap justify-between gap-3 px-6 pb-10 text-sm text-muted">
        <span>Planning review only.</span>
        <span className="flex gap-4">
          <Link href="/#workflow" className="text-pine">
            How to use this
          </Link>
          <Link href="/" className="text-pine">
            About Grid Prime
          </Link>
        </span>
      </footer>
    </div>
  );
}
