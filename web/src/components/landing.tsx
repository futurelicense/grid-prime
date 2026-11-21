import Link from "next/link";
import { TourLaunch } from "./tour";
import { PublicWorkflow } from "./workflow";

const QUESTIONS = [
  {
    n: "01",
    name: "Model",
    ask: "What are we planning?",
    text: "The zones, the hourly demand, the resources, and what could go wrong.",
  },
  {
    n: "02",
    name: "Predict",
    ask: "What demand is coming?",
    text: "A forecast for the next day, and a score of how that method did on the last day.",
  },
  {
    n: "03",
    name: "Optimize",
    ask: "What fits the budget?",
    text: "Resource options compared with the money and the reserve you set.",
  },
  {
    n: "04",
    name: "Deliver",
    ask: "Who agreed, and why?",
    text: "A person accepts or returns the plan in writing. Later, someone records what happened.",
  },
];

export function Landing({ entered, name }: { entered: boolean; name: string }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
        <Link href="/" className="font-serif text-2xl leading-none">
          Grid Prime
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <span className="hidden sm:inline">
            <TourLaunch label="Tour" variant="link" entered={entered} />
          </span>
          <Link href={entered ? "/case" : "/login"} className="btn">
            {entered ? `Open case, ${name}` : "Sign in"}
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-3xl px-6 pb-16 pt-10 lg:pb-24 lg:pt-16">
        <p className="kicker">Grid planning, on one file</p>
        <h1 className="mt-4 font-serif text-5xl leading-[0.95] sm:text-6xl lg:text-7xl">
          Check the plan before anyone spends the money.
        </h1>
        <p className="mt-6 text-lg leading-8">
          You file how much electricity a region has been using. Grid Prime forecasts the next day and tests which
          options fit the budget. A person on the team accepts or returns that plan and writes why.
        </p>
        <p className="mt-4 leading-7 text-muted">
          This is a planning review. It does not run power plants or switch equipment.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <TourLaunch label="Take the tour" entered={entered} />
          <Link href={entered ? "/case" : "/login"} className="btn quiet">
            {entered ? "Continue into the case" : "Open a case"}
          </Link>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
          <p className="kicker">What you do here</p>
          <h2 className="mt-3 max-w-xl font-serif text-4xl leading-tight sm:text-5xl">Four questions. Then a signature.</h2>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2">
            {QUESTIONS.map((item) => (
              <li key={item.n} className="border border-line bg-sheet p-6">
                <p className="text-sm text-muted">
                  {item.n} · {item.name}
                </p>
                <h3 className="mt-2 font-serif text-3xl">{item.ask}</h3>
                <p className="mt-3 max-w-md text-sm leading-6 text-muted">{item.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <PublicWorkflow />

      <section className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <h2 className="font-serif text-3xl">Try the example, or start from a blank file.</h2>
            <p className="mt-3 max-w-xl leading-7 text-muted">
              The example opens with three research zones and labeled synthetic hours, so the path is visible on a file
              that is already started. A blank file waits for the first zone.
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
          <span>Planning review. Public and synthetic evidence.</span>
        </div>
      </footer>
    </div>
  );
}
