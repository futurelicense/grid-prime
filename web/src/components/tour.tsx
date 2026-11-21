"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { TourScene } from "./tour-scenes";

const STOPS = [
  {
    kicker: "What this is",
    title: "A file for checking a grid plan.",
    body: "The hours go in. A forecast and a budget test come out. A person signs what remains.",
    note: "This is a planning review. It does not run power plants or switch equipment.",
  },
  {
    kicker: "Where you start",
    title: "Open the example, or start blank.",
    body: "The example is already started, and the hours are marked synthetic. A blank file has no zones and no hours.",
    note: "Your name and your seat are chosen at sign-in. You can change seat later. The file stays.",
  },
  {
    kicker: "01 · Model",
    title: "Write down the region you can speak for.",
    body: "Name the zones, file the hours, and state the resources and the transfers you are willing to assume.",
    note: "A forecast needs 48 consecutive hours in that zone.",
  },
  {
    kicker: "02 · Predict",
    title: "See the next day, and how yesterday scored.",
    body: "The program draws the next day from the hours on the file and keeps a band around it.",
    note: "The program computes the hours. A reading may explain a stored number. It cannot replace one.",
  },
  {
    kicker: "03 · Optimize",
    title: "Keep the option that fits.",
    body: "Anything short of the reserve, or over the budget, stays off the plan. The cheapest one that fits can be sent on.",
    note: "An option that misses the budget or the reserve stays off the plan.",
  },
  {
    kicker: "04 · Deliver",
    title: "A person decides, in writing.",
    body: "The file passes from the person who built it, to the person who decides, to the person who records what happened.",
    note: "Change seat when the work changes hands.",
  },
] as const;

export function TourLaunch({
  label,
  variant = "button",
  entered = false,
}: {
  label: string;
  variant?: "button" | "quiet" | "link";
  entered?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const stop = STOPS[step];
  const last = step === STOPS.length - 1;

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "ArrowRight") setStep((current) => Math.min(current + 1, STOPS.length - 1));
      if (event.key === "ArrowLeft") setStep((current) => Math.max(current - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, step]);

  const className =
    variant === "link" ? "bg-transparent p-0 text-sm text-pine" : variant === "quiet" ? "btn quiet" : "btn";

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => {
          setStep(0);
          setOpen(true);
        }}
      >
        {label}
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden bg-[#1d1a16]/45 p-3 sm:items-center sm:p-6"
          onClick={() => setOpen(false)}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="box-border flex max-h-[92vh] w-full min-h-0 min-w-0 max-w-4xl flex-col bg-sheet p-5 shadow-none outline-none sm:p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4">
              <p className="kicker">
                {stop.kicker} · {step + 1} of {STOPS.length}
              </p>
              <button type="button" className="text-sm text-muted" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            <h2 id={titleId} className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">
              {stop.title}
            </h2>
            <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
              <TourScene step={step} />
              <p className="mt-4 leading-7">{stop.body}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{stop.note}</p>
            </div>
            <div className="mt-4 flex gap-1.5" aria-hidden>
              {STOPS.map((item, index) => (
                <span key={item.kicker} className={`h-1 flex-1 ${index <= step ? "bg-pine" : "bg-line"}`} />
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <button type="button" className="btn quiet" disabled={step === 0} onClick={() => setStep((current) => current - 1)}>
                Back
              </button>
              {last ? (
                <Link href={entered ? "/case" : "/login"} className="btn" onClick={() => setOpen(false)}>
                  {entered ? "Open your case" : "Open a case"}
                </Link>
              ) : (
                <button type="button" className="btn" onClick={() => setStep((current) => current + 1)}>
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
