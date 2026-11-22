"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useId, useRef, useState } from "react";
import { TourScene } from "./tour-scenes";
import styles from "./tour.module.css";

const STOPS = [
  { label: "Overview", kicker: "Your planning workflow", title: "From demand data to a decision you can explain.", body: "GRID-PRIME brings grid modeling, next-day forecasting, resource comparison, and human review into one case. This tour shows how those pieces connect.", tasks: ["Establish the demand and resources in a region.", "Test a forecast and compare feasible resource plans.", "Keep the reviewer’s decision and the recorded outcome."], outcome: "One case connecting evidence, assumptions, analysis, and review.", note: "The illustrations use synthetic examples. GRID-PRIME supports planning and research; it does not control grid equipment." },
  { label: "Start", kicker: "Choose your starting point", title: "Explore an example before building your own case.", body: "At sign-in, choose a name, a role, and either the reference case or a blank case. The reference case is the quickest way to learn the workflow.", tasks: ["Choose the Analyst seat to prepare data and run analysis.", "Open the example to explore three research zones and synthetic demand hours.", "Use a blank case when you are ready to enter your own zones and data."], outcome: "A case workspace with a clear starting point.", note: "You can change seats later as the case moves from analysis to review and outcome tracking." },
  { label: "Model", kicker: "Model · establish the baseline", title: "Describe the system behind your plan.", body: "Define the zones, hourly demand, resources, and assumed transfers. State the contingency you want the plan to account for.", tasks: ["Add or inspect a zone and its hourly demand observations.", "Check source labels so public and synthetic data stay distinguishable.", "Review the resources, transfers, and contingency assumptions."], outcome: "A documented baseline for forecasting and resource comparison.", note: "Forecasting requires at least 48 consecutive hourly observations for the selected zone. Check for missing hours first." },
  { label: "Predict", kicker: "Predict · inspect the outlook", title: "Forecast tomorrow. Check the method against yesterday.", body: "Generate a next-day demand outlook from the case observations. Read the forecast alongside its uncertainty band and the method’s backtest score.", tasks: ["Select a zone with enough consecutive demand observations.", "Run the forecast and inspect the next 24 hours and stored band.", "Review the previous-day score before relying on the outlook."], outcome: "A stored forecast and an accuracy check to inform the next stage.", note: "The chart is illustrative. A forecast and its band depend on the model and the data; they are not guaranteed demand limits." },
  { label: "Optimize", kicker: "Optimize · compare the trade-offs", title: "See how the budget changes what is feasible.", body: "Resource plans must satisfy both the budget and reserve requirements. Try the illustrative budget below, then use your case’s own constraints in the workspace.", tasks: ["Set the budget and required reserve for the case.", "Compare cost and capacity, including why an option is excluded.", "Send the least-cost feasible plan for human review."], outcome: "A constraint-checked resource portfolio, or an explanation that none fits.", note: "This simplified example compares individual options. The workspace evaluates portfolios using the case data and modeled constraints." },
  { label: "Deliver", kicker: "Deliver · review and follow through", title: "Keep the decision and the reasoning together.", body: "The analyst prepares the plan. A reviewer accepts or returns it with a written reason. A program manager records subsequent observations.", tasks: ["Switch to Reviewer and inspect the plan and its assumptions.", "Accept or return the plan and record the rationale.", "Use the Program manager seat to record outcomes after acceptance."], outcome: "A review decision linked to the analysis and subsequent observations.", note: "Ready to try it? Open the reference case as an Analyst and begin with Model. Viewers can inspect a case without editing it." },
] as const;

export function TourLaunch({ label, variant = "button", entered = false }: { label: string; variant?: "button" | "quiet" | "link"; entered?: boolean }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const titleId = useId();
  const bodyId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const stop = STOPS[step];
  const last = step === STOPS.length - 1;

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.showModal();
    return () => {
      dialog?.close();
      document.body.style.overflow = previous;
      triggerRef.current?.focus();
    };
  }, [open]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 0 }); }, [step]);

  const className = variant === "link" ? "bg-transparent p-0 text-sm text-pine" : variant === "quiet" ? "btn quiet" : "btn";

  return <>
    <button ref={triggerRef} type="button" className={className} aria-haspopup="dialog" onClick={() => { setStep(0); setOpen(true); }}>{label}</button>
    {open ? createPortal(
      <dialog ref={dialogRef} className={styles.dialog} aria-labelledby={titleId} aria-describedby={bodyId} onCancel={() => setOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) setOpen(false); } }}>
        <div className={styles.frame}>
          <header className={styles.header}><div><span className={styles.brand}>GRID-PRIME</span><span className={styles.tourLabel}>Guided tour</span></div><button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label="Close guided tour">Close <span aria-hidden="true">×</span></button></header>
          <nav className={styles.steps} aria-label="Tour steps">{STOPS.map((item, index) => <button key={item.label} type="button" aria-current={index === step ? "step" : undefined} onClick={() => setStep(index)}><span aria-hidden="true">{index < step ? "✓" : index + 1}</span>{item.label}</button>)}</nav>
          <div ref={scrollRef} className={styles.scroll}>
            <div className={styles.content}>
              <div className={styles.copy}>
                <p className={styles.eyebrow}>{stop.kicker}</p>
                <h2 id={titleId}>{stop.title}</h2>
                <p id={bodyId} className={styles.description}>{stop.body}</p>
                <ul className={styles.tasks}>{stop.tasks.map(task => <li key={task}>{task}</li>)}</ul>
              </div>
              <div className={styles.visual}><p className={styles.exampleLabel}>Illustrative walkthrough · synthetic example</p><TourScene key={step} step={step} /><div className={styles.outcome}><span>What you get</span><p>{stop.outcome}</p></div></div>
            </div>
            <p className={styles.note}>{stop.note}</p>
          </div>
          <footer className={styles.footer}>
            <div className={styles.progress} role="status" aria-live="polite" aria-atomic="true">Step {step + 1} of {STOPS.length}<span>{stop.label}</span></div>
            <div className={styles.controls}><button type="button" className={styles.back} disabled={step === 0} onClick={() => setStep(current => current - 1)}>Back</button>{last ? <Link href={entered ? "/case" : "/login"} className={styles.next} onClick={() => setOpen(false)}>{entered ? "Open your case" : "Get started"}</Link> : <button type="button" className={styles.next} onClick={() => setStep(current => current + 1)}>Next: {STOPS[step + 1].label}</button>}</div>
          </footer>
        </div>
      </dialog>, document.body) : null}
  </>;
}
