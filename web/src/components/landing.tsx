import Link from "next/link";
import { PublicWorkflow } from "./workflow";

const STAGES = [
  { n: "01", name: "Model", leave: "Describe the zones and the hours." },
  { n: "02", name: "Predict", leave: "Forecast demand and test it." },
  { n: "03", name: "Optimize", leave: "Keep the plan that fits the budget." },
  { n: "04", name: "Deliver", leave: "A person accepts or returns it." },
];

export function Landing({ entered, name }: { entered: boolean; name: string }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
        <Link href="/" className="font-serif text-2xl leading-none">
          Grid Prime
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <a href="#workflow" className="hidden text-muted sm:inline">
            How a case moves
          </a>
          <Link href={entered ? "/case" : "/login"} className="btn">
            {entered ? `Open case, ${name}` : "Sign in"}
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl items-end gap-12 px-6 pb-16 pt-8 lg:grid-cols-[1.15fr_0.85fr] lg:pb-24 lg:pt-14">
        <div>
          <p className="kicker">Grid planning research</p>
          <h1 className="mt-4 max-w-xl font-serif text-5xl leading-[0.95] sm:text-6xl lg:text-7xl">
            Check a grid plan before anyone acts on it.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-ink">
            Grid Prime is one case file. You describe a region, the engine forecasts demand and tests a portfolio, and a
            person signs the decision.
          </p>
          <p className="mt-4 max-w-lg leading-7 text-muted">
            Public hours stay public. Synthetic hours stay labeled. Nothing here dispatches generation or switches
            equipment.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={entered ? "/case" : "/login"} className="btn">
              {entered ? "Continue into the case" : "Open a case"}
            </Link>
            <a href="#workflow" className="btn quiet">
              How a case moves
            </a>
          </div>
        </div>

        <aside className="border border-line bg-sheet p-6 sm:p-8">
          <p className="kicker">Four stages, in order</p>
          <ol className="mt-6">
            {STAGES.map((stage, index) => (
              <li key={stage.n} className={`grid grid-cols-[3rem_1fr] gap-3 py-4 ${index ? "border-t border-line" : ""}`}>
                <span className="font-serif text-2xl text-pine">{stage.n}</span>
                <div>
                  <div className="font-serif text-2xl">{stage.name}</div>
                  <div className="text-sm text-muted">{stage.leave}</div>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-sm leading-6 text-muted">That is the whole platform. The steps below say who does each part.</p>
        </aside>
      </section>

      <PublicWorkflow />

      <section className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <h2 className="font-serif text-3xl">Start from a reference case, or a blank one.</h2>
            <p className="mt-3 max-w-xl leading-7 text-muted">
              The reference case already has three zones and a labeled hourly series, so you can read a finished file.
              An empty case starts with nothing on it.
            </p>
          </div>
          <Link href={entered ? "/case" : "/login"} className="btn w-fit">
            {entered ? "Return to your case" : "Sign in and choose a case"}
          </Link>
        </div>
      </section>

      <footer className="border-t border-line px-6 py-8 text-sm text-muted">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3">
          <span>Grid Prime</span>
          <span>Public and synthetic evidence. Planning review only.</span>
        </div>
      </footer>
    </div>
  );
}
