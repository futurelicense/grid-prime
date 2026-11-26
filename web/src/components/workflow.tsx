import Link from "next/link";

export const WORKFLOW = [
  {
    n: "01",
    seat: "Anyone",
    where: "Sign in",
    title: "Open a case and take a seat",
    short: "Name yourself, choose a seat, and open the reference case or an empty one.",
    href: "/login",
  },
  {
    n: "02",
    seat: "Analyst",
    where: "Model",
    title: "File only what you can describe",
    short: "File public or synthetic hours, then state the zones, the transfers, the resources, and the contingencies.",
    href: "/model",
  },
  {
    n: "03",
    seat: "Analyst",
    where: "Predict",
    title: "Produce an outlook, then test it",
    short: "File an outlook, add one stress event, and score the last day before calling it skill.",
    href: "/predict",
  },
  {
    n: "04",
    seat: "Analyst",
    where: "Optimize",
    title: "Keep only a portfolio that fits",
    short: "Compare portfolios inside your budget and reserve, then send the least-cost plan.",
    href: "/optimize",
  },
  {
    n: "05",
    seat: "Reviewer",
    where: "Deliver",
    title: "Accept or return, and write why",
    short: "Change to Reviewer, then accept or return the plan and leave the reason on it.",
    href: "/deliver",
  },
  {
    n: "06",
    seat: "Program manager",
    where: "Deliver",
    title: "Record what was observed",
    short: "After acceptance, record the outcome. Anyone may read the situation or the brief.",
    href: "/deliver",
  },
] as const;

export function PublicWorkflow() {
  return (
    <section id="workflow" className="border-t border-line bg-sheet">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[0.72fr_1.28fr] lg:py-20">
        <div className="lg:sticky lg:top-8 lg:self-start">
          <p className="kicker">Who does what</p>
          <h2 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">Four people can share the file.</h2>
          <p className="mt-4 leading-7 text-muted">
            The analyst files the hours, the forecast, and the options. The reviewer accepts or returns the plan and
            writes why. The program manager records what happened later. The viewer can read every page and cannot
            change the file.
          </p>
        </div>
        <ol>
          {WORKFLOW.map((step) => (
            <li key={step.n} className="grid grid-cols-[3.25rem_1fr] gap-4 border-t border-line py-6 last:border-b">
              <span className="font-serif text-3xl text-pine">{step.n}</span>
              <div>
                <p className="kicker">
                  {step.seat} · {step.where}
                </p>
                <h3 className="mt-1 font-serif text-2xl">{step.title}</h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted">{step.short}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function CaseWorkflow({ current }: { current: number }) {
  return (
    <section className="mt-12">
      <p className="kicker">Who does each part</p>
      <h2 className="mt-2 font-serif text-3xl">The same path, by seat.</h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
        {current === 0
          ? "This case already has an accepted plan and a recorded outcome. You can reopen any stage."
          : "The marked step is the one this case is waiting on. Change seat when the work changes hands."}
      </p>
      <ol className="mt-6 border-t border-line">
        {WORKFLOW.map((step, index) => {
          const active = current === index + 1;
          return (
            <li
              key={step.n}
              className={`grid gap-3 border-b border-line py-4 sm:grid-cols-[3rem_1fr_auto] sm:items-center ${active ? "bg-moss px-3" : ""}`}
            >
              <span className="font-serif text-2xl text-pine">{step.n}</span>
              <div>
                <p className="text-xs text-muted">
                  {active ? "Waiting here · " : ""}
                  {step.seat} · {step.where}
                </p>
                <p className="mt-1 font-serif text-xl">{step.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted">{step.short}</p>
              </div>
              <Link href={index === 0 ? "/login?switch=1" : step.href} className="text-sm text-pine">
                {index === 0 ? "Change seat" : "Open"}
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
