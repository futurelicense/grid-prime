import Link from "next/link";
import { PublicWorkflow } from "./workflow";

const STAGES = [
  {
    n: "01",
    name: "Model",
    leave: "A described system",
    text: "Name the zones you can actually speak for. File public demand or a clearly marked synthetic series, then state resources and contingencies.",
  },
  {
    n: "02",
    name: "Predict",
    leave: "An outlook with a band",
    text: "Forecast from consecutive hours only. Add one declared stress event. Score the last day against a seasonal baseline before anyone calls it skill.",
  },
  {
    n: "03",
    name: "Optimize",
    leave: "A feasible portfolio",
    text: "Compare planning options inside a budget and a reserve. If nothing fits, the case says so and leaves the constraints alone.",
  },
  {
    n: "04",
    name: "Deliver",
    leave: "A signed decision",
    text: "A reviewer accepts or returns the plan and writes the reason. Groq may explain a stored number. It may not invent one.",
  },
];

const ROLES = [
  { name: "Analyst", text: "Builds the record: series, forecasts, stress cases, and portfolios." },
  { name: "Reviewer", text: "Accepts or returns a plan. The reason stays on the decision." },
  { name: "Program manager", text: "Records what was observed after a plan was accepted." },
  { name: "Viewer", text: "Reads the case. The file does not change." },
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
            How to use
          </a>
          <a href="#method" className="hidden text-muted sm:inline">
            Method
          </a>
          <a href="#roles" className="hidden text-muted sm:inline">
            Roles
          </a>
          <Link href={entered ? "/case" : "/login"} className="btn">
            {entered ? `Open case, ${name}` : "Sign in"}
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl items-end gap-12 px-6 pb-16 pt-8 lg:grid-cols-[1.15fr_0.85fr] lg:pb-24 lg:pt-14">
        <div>
          <p className="kicker">Grid reliability planning</p>
          <h1 className="mt-4 max-w-xl font-serif text-5xl leading-[0.95] sm:text-6xl lg:text-7xl">
            A case file for the grid you can describe.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-muted">
            Public demand, labeled synthetic hours, and human review. Model, predict, optimize, then deliver a decision
            someone has to sign.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={entered ? "/case" : "/login"} className="btn">
              {entered ? "Continue into the case" : "Enter the case file"}
            </Link>
            <a href="#workflow" className="btn quiet">
              See how to use it
            </a>
          </div>
        </div>

        <aside className="border border-line bg-sheet p-6 sm:p-8">
          <p className="kicker">What a case holds</p>
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
          <p className="mt-2 text-sm leading-6 text-muted">
            Not a control room. Nothing here dispatches generation or switches equipment.
          </p>
        </aside>
      </section>

      <PublicWorkflow />

      <section id="method" className="border-t border-line bg-ink text-[#f6f3ec]">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
          <p className="kicker text-[#c8bfb0]">The method</p>
          <h2 className="mt-3 max-w-lg font-serif text-4xl leading-tight sm:text-5xl">
            Evidence moves. A person decides.
          </h2>
          <div className="mt-12 grid gap-px bg-[#3a342c] sm:grid-cols-2">
            {STAGES.map((stage) => (
              <article key={stage.n} className="bg-ink p-6 sm:p-8">
                <div className="text-sm text-[#c8bfb0]">{stage.n}</div>
                <h3 className="mt-2 font-serif text-3xl">{stage.name}</h3>
                <p className="mt-3 max-w-md text-sm leading-6 text-[#d9d0c3]">{stage.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="roles" className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
        <div className="max-w-xl">
          <p className="kicker">Who signs in</p>
          <h2 className="mt-3 font-serif text-4xl leading-tight">Four seats. One record.</h2>
          <p className="mt-4 leading-7 text-muted">
            You choose a seat at sign-in. The case enforces it: a viewer cannot file a forecast, and only a reviewer can
            accept a plan.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.map((role) => (
            <article key={role.name} className="border border-line bg-sheet p-5">
              <h3 className="font-serif text-2xl">{role.name}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{role.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <h2 className="font-serif text-3xl">Start from a reference case, or a blank one.</h2>
            <p className="mt-3 max-w-xl leading-7 text-muted">
              The reference case already holds three research zones and a synthetic hourly series, so the method is
              visible immediately. An empty case waits for a zone and a file you are willing to label.
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
