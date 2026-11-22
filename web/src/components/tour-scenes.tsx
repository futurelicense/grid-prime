"use client";

import { useId, useState, type ReactNode } from "react";

const INK = "#1d1a16";
const MUTED = "#655f56";
const LINE = "#d3cbbd";
const PINE = "#1e4a38";
const MOSS = "#d5e6dc";
const CLAY = "#8c3b2a";

function demand(hour: number) {
  return 46 + 28 * Math.sin(((hour % 24) - 7) * Math.PI / 12);
}

export function TourScene({ step }: { step: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-paper p-3 sm:p-4">
      {step === 0 ? <Overview /> : null}
      {step === 1 ? <Start /> : null}
      {step === 2 ? <ModelScene /> : null}
      {step === 3 ? <PredictScene /> : null}
      {step === 4 ? <OptimizeScene /> : null}
      {step === 5 ? <DeliverScene /> : null}
    </div>
  );
}

function Overview() {
  return (
    <div className="grid items-stretch gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <Panel kicker="1" title="Hours" caption="What the region used">
        <Bars />
      </Panel>
      <Panel kicker="2" title="Forecast" caption="The next day">
        <ForecastMini />
      </Panel>
      <Panel kicker="3" title="Options" caption="Inside the budget">
        <OptionsMini />
      </Panel>
      <Panel kicker="4" title="Signature" caption="A person decides">
        <SignatureMini />
      </Panel>
    </div>
  );
}

function Start() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="border border-pine bg-sheet p-4">
        <p className="font-serif text-2xl">Example</p>
        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted">Already started</p>
        <div className="mt-4 flex gap-2 text-xs">
          {["Lone Star", "Midwest", "Atlantic"].map((zone) => (
            <span key={zone} className="border border-line bg-paper px-2 py-1">
              {zone}
            </span>
          ))}
        </div>
        <Bars />
        <p className="text-sm text-pine">Labeled synthetic hours</p>
      </div>
      <div className="border border-dashed border-line bg-sheet p-4">
        <p className="font-serif text-2xl">Blank</p>
        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted">Nothing filed</p>
        <div className="mt-4 space-y-2">
          <div className="h-px bg-line" />
          <div className="h-px bg-line" />
          <div className="h-px bg-line" />
        </div>
        <p className="mt-6 text-sm text-muted">The first zone and the first hour are yours.</p>
      </div>
    </div>
  );
}

function ModelScene() {
  const zones = ["Lone Star", "Midwest", "Atlantic"];
  return (
    <div>
      <div className="grid items-center gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
        {zones.map((zone, index) => (
          <div key={zone} className="contents">
            <div className={`border bg-sheet p-3 ${index === 0 ? "border-pine" : "border-line"}`}>
              <p className="font-serif text-xl">{zone}</p>
              <p className="mt-1 text-xs text-muted">{index === 0 ? "Hours filed here" : "Named, not yet forecast"}</p>
            </div>
            {index < zones.length - 1 ? (
              <div className="text-center text-[10px] uppercase tracking-[0.12em] text-muted">
                <span className="hidden sm:inline">stated →</span>
                <span className="sm:hidden">stated transfer</span>
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-3 grid gap-3 border border-line bg-sheet p-3 sm:grid-cols-[1.4fr_0.8fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted">Hourly demand on the file</p>
          <Bars />
        </div>
        <div className="text-sm">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">Also on the file</p>
          <p className="mt-2">Resources</p>
          <p>One contingency</p>
          <p className="mt-2 text-pine">Public, or marked synthetic</p>
        </div>
      </div>
    </div>
  );
}

function PredictScene() {
  const history = Array.from({ length: 24 }, (_, hour) => demand(hour));
  const future = Array.from({ length: 25 }, (_, hour) => demand(hour + 23));
  const width = 520;
  const height = 168;
  const xAt = (index: number) => 28 + index * ((width - 40) / 47);
  const yAt = (value: number) => 20 + (78 - value) * 1.45;
  const historyPath = history.map((value, index) => `${index === 0 ? "M" : "L"} ${xAt(index)} ${yAt(value)}`).join(" ");
  const futurePath = future
    .map((value, index) => `${index === 0 ? "M" : "L"} ${xAt(index + 23)} ${yAt(value)}`)
    .join(" ");
  const band =
    future
      .map((value, index) => `${index === 0 ? "M" : "L"} ${xAt(index + 23)} ${yAt(value + 8)}`)
      .join(" ") +
    " " +
    future
      .map((value, index) => `L ${xAt(47 - index)} ${yAt(future[24 - index] - 7)}`)
      .join(" ") +
    " Z";

  return (
    <div className="bg-sheet p-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full">
        <text x="28" y="16" fill={MUTED} fontSize="11">
          Filed hours
        </text>
        <text x="292" y="16" fill={PINE} fontSize="11">
          Forecast
        </text>
        <path d={band} fill={MOSS} />
        <path d={historyPath} fill="none" stroke={INK} strokeWidth="2.4" />
        <path d={futurePath} fill="none" stroke={PINE} strokeWidth="2.4" strokeDasharray="5 4" />
        <line x1={xAt(23)} y1="24" x2={xAt(23)} y2="148" stroke={LINE} />
        <text x={xAt(23) - 14} y="162" fill={MUTED} fontSize="11">
          now
        </text>
      </svg>
      <div className="mt-1 flex flex-wrap gap-4 px-2 pb-1 text-xs text-muted">
        <span>Solid line · hours on the file</span>
        <span className="text-pine">Dashed line · the next day</span>
        <span>Shade · uncertainty band</span>
      </div>
    </div>
  );
}

function OptimizeScene() {
  const [budget, setBudget] = useState(16);
  const budgetId = useId();
  const rows = [
    { name: "Upgrade", mw: 30, cost: 7 },
    { name: "Flexibility", mw: 40, cost: 8 },
    { name: "Storage", mw: 55, cost: 18 },
    { name: "Firm capacity", mw: 90, cost: 22 },
  ];
  const selected = rows.find(row => row.mw >= 40 && row.cost <= budget);
  return (
    <div className="bg-sheet p-3">
      <div className="border-b border-line pb-3 text-sm">
        <div className="flex flex-wrap justify-between gap-2"><label htmlFor={budgetId} className="font-semibold">Try a budget</label><span>${budget}m · Need 40 MW</span></div>
        <input id={budgetId} type="range" min="0" max="24" step="2" value={budget} onChange={event => setBudget(Number(event.target.value))} aria-valuetext={`${budget} million dollars`} className="mt-3 min-h-8 w-full accent-pine" />
        <div className="flex justify-between text-sm text-muted"><span>$0m</span><span>$24m</span></div>
      </div>
      <ul className="mt-3 space-y-2" aria-label="Illustrative resource options">
        {rows.map(row => {
          const feasible = row.mw >= 40 && row.cost <= budget;
          const chosen = row === selected;
          const mark = row.mw < 40 ? "Below reserve" : row.cost > budget ? "Over budget" : chosen ? "Least-cost fit" : "Feasible";
          return <li key={row.name} className={`flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded px-2 py-2 text-sm ${chosen ? "bg-moss" : ""}`}>
            <span className="font-semibold">{row.name}</span><span>{row.mw} MW · ${row.cost}m</span>
            <span className={feasible ? "text-pine" : "text-clay"}>{mark}</span>
          </li>;
        })}
      </ul>
      <p role="status" aria-live="polite" aria-atomic="true" className="mt-3 border-t border-line pt-3 text-sm font-semibold text-pine">{selected ? `${selected.name} meets the 40 MW requirement for $${selected.cost}m.` : "No option meets both constraints. Try a budget of at least $8m."}</p>
      <p className="mt-2 text-sm text-muted">Explore this example freely. It does not change your case.</p>
    </div>
  );
}

function DeliverScene() {
  const seats = [
    { role: "Analyst", act: "Files the plan", live: false },
    { role: "Reviewer", act: "Writes the reason", live: true },
    { role: "Program manager", act: "Records what happened", live: false },
  ];
  return (
    <div>
      <div className="grid items-stretch gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
        {seats.map((seat, index) => (
          <div key={seat.role} className="contents">
            <div className={`bg-sheet p-3 ${seat.live ? "border-2 border-pine" : "border border-line"}`}>
              <p className="text-xs uppercase tracking-[0.14em] text-muted">{seat.role}</p>
              <p className="mt-2 font-serif text-xl">{seat.act}</p>
              {seat.live ? <SignatureMini /> : <div className="mt-3 h-10 border border-dashed border-line" />}
            </div>
            {index < seats.length - 1 ? <FlowArrow /> : null}
          </div>
        ))}
      </div>
      <p className="mt-3 border border-dashed border-line px-3 py-2 text-sm text-muted">
        Viewer · the same file, with no pen
      </p>
    </div>
  );
}

function Panel({
  kicker,
  title,
  caption,
  children,
}: {
  kicker: string;
  title: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <div className="border border-line bg-sheet p-3">
      <p className="text-xs text-pine">{kicker}</p>
      <p className="font-serif text-xl">{title}</p>
      <p className="text-xs text-muted">{caption}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex items-center justify-center text-pine">
      <span className="sm:hidden">↓</span>
      <span className="hidden sm:inline">→</span>
    </div>
  );
}

function Bars() {
  const hours = Array.from({ length: 18 }, (_, index) => demand((index / 17) * 23));
  const max = Math.max(...hours);
  return (
    <svg viewBox="0 0 180 64" className="mt-2 h-16 w-full">
      {hours.map((value, index) => {
        const height = 8 + (value / max) * 48;
        return <rect key={index} x={4 + index * 10} y={60 - height} width="6" height={height} fill={INK} />;
      })}
    </svg>
  );
}

function ForecastMini() {
  const coords = Array.from({ length: 16 }, (_, index) => [8 + index * 10, 52 - demand(index) * 0.45] as const);
  const line = (from: number, to: number) =>
    coords
      .slice(from, to)
      .map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x} ${y}`)
      .join(" ");
  return (
    <svg viewBox="0 0 168 64" className="mt-2 h-16 w-full">
      <path d={line(0, 9)} fill="none" stroke={INK} strokeWidth="2" />
      <path d={line(8, 16)} fill="none" stroke={PINE} strokeWidth="2" strokeDasharray="4 3" />
    </svg>
  );
}

function OptionsMini() {
  return (
    <svg viewBox="0 0 140 64" className="mt-2 h-16 w-full">
      <line x1="4" y1="16" x2="132" y2="16" stroke={LINE} />
      <rect x="16" y="28" width="28" height="28" fill={MOSS} stroke={PINE} />
      <rect x="56" y="8" width="28" height="48" fill="none" stroke={CLAY} />
      <rect x="96" y="4" width="28" height="52" fill="none" stroke={CLAY} />
    </svg>
  );
}

function SignatureMini() {
  return (
    <svg viewBox="0 0 140 48" className="mt-2 h-12 w-full">
      <rect x="1" y="1" width="138" height="46" fill="#f7f4ee" stroke={LINE} />
      <path d="M18 30 C 30 12, 42 36, 58 22 S 86 14, 112 26" fill="none" stroke={PINE} strokeWidth="1.8" />
    </svg>
  );
}
