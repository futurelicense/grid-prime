import Link from "next/link";
import { TourLaunch } from "./tour";
import styles from "./landing.module.css";

const stages = [
  { name: "Model", title: "Build the grid’s starting point.", text: "Define regions, demand, resources, transfers, and contingencies. Keep public and synthetic observations tied to their sources.", output: "A documented planning baseline", icon: "⌘" },
  { name: "Predict", title: "Understand tomorrow’s demand.", text: "Forecast the next day, inspect the uncertainty band, and score the method against the previous day before using the outlook.", output: "A forecast you can examine", icon: "∿" },
  { name: "Optimize", title: "Find a resource plan that fits.", text: "Compare resource portfolios against your budget and reserve requirements. Identify the least-cost option that meets the modeled constraints.", output: "A feasible portfolio for review", icon: "≋" },
  { name: "Deliver", title: "Turn analysis into a recorded decision.", text: "Send the plan for human review. Capture acceptance or return, the reviewer’s rationale, and the outcomes recorded afterward.", output: "A decision with an evidence trail", icon: "✓" },
];

export function Landing({ entered, name }: { entered: boolean; name: string }) {
  const destination = entered ? "/case" : "/login";
  return (
    <div className={styles.landing}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="GRID-PRIME home"><span className={styles.brandMark} aria-hidden="true">▦</span> GRID-PRIME</Link>
        <nav aria-label="Main navigation"><a href="#capabilities">Capabilities</a><a href="#how-it-works">How it works</a><Link href={destination} className={styles.smallButton}>{entered ? "Open workspace" : "Enter platform"}</Link></nav>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>GRID RELIABILITY & RESOURCE PLANNING</p>
            <h1>Understand the grid.<br /><span>Plan what comes next.</span></h1>
            <p className={styles.intro}>GRID-PRIME helps planning teams model electricity demand, forecast the next day, compare resource options, and record the decisions behind a grid plan.</p>
            <div className={styles.actions}><Link href={destination} className={styles.primary}>{entered ? `Continue, ${name}` : "Explore the platform"}</Link><TourLaunch label="Take a guided tour" variant="quiet" entered={entered} /></div>
            <p className={styles.heroNote}>For researchers, grid planners, and decision reviewers.</p>
          </div>
          <div className={styles.preview} aria-label="Illustrative grid planning workflow">
            <div className={styles.previewHeader}><span>PLANNING WORKSPACE</span><span className={styles.demo}>Illustrative example</span></div>
            <div className={styles.previewTitle}><span>Tomorrow, in perspective.</span><span>24-hour outlook</span></div>
            <div className={styles.chart}>
              <div className={styles.chartLabels}><span>Demand</span><span>Forecast</span></div>
              <svg viewBox="0 0 520 180" role="img" aria-label="Illustration of historical demand continuing into a forecast with an uncertainty band">
                <defs><linearGradient id="demand-fill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#6de0b8" stopOpacity=".25"/><stop offset="1" stopColor="#6de0b8" stopOpacity="0"/></linearGradient></defs>
                <path d="M0 40H520 M0 90H520 M0 140H520" stroke="#ffffff12" fill="none"/>
                <path d="M0 131L35 123L70 137L105 115L140 120L175 82L210 92L245 61L280 80L315 51L350 60L350 180H0Z" fill="url(#demand-fill)"/>
                <path d="M350 40L385 24L420 33L455 65L490 74L520 63V114L490 121L455 106L420 81L385 76L350 80Z" fill="#6de0b824"/>
                <path d="M0 131L35 123L70 137L105 115L140 120L175 82L210 92L245 61L280 80L315 51L350 60" stroke="#72e2b8" strokeWidth="3" fill="none"/>
                <path d="M350 60L385 50L420 57L455 85L490 97L520 89" stroke="#72e2b8" strokeWidth="3" strokeDasharray="6 5" fill="none"/>
                <path d="M350 10V170" stroke="#ffffff40" strokeDasharray="3 5"/>
              </svg>
              <div className={styles.chartAxis}><span>Historical observations</span><span>Next day</span></div>
            </div>
            <div className={styles.previewSteps}>{["Model", "Predict", "Optimize", "Deliver"].map((step) => <span key={step}>{step}</span>)}</div>
            <div className={styles.previewResult}><span className={styles.check} aria-hidden="true">✓</span><div><strong>From forecast to reviewed plan</strong><p>Demand, budget, reserves, and rationale in one case.</p></div></div>
            <p className={styles.previewNote}>Concept illustration · synthetic data · no live grid telemetry</p>
          </div>
        </section>

        <section className={styles.valueStrip} aria-label="Platform focus"><span>One connected planning workflow</span><strong>Source-aware data</strong><strong>Reproducible analysis</strong><strong>Human-reviewed decisions</strong></section>

        <section id="capabilities" className={styles.capabilities}>
          <div className={styles.sectionHeading}><p className={styles.eyebrow}>WHAT GRID-PRIME DOES</p><h2>Four stages.<br />One clearer planning decision.</h2><p>Follow a case from the underlying observations to the resource plan your team can review and explain.</p></div>
          <div className={styles.stageGrid}>{stages.map((stage) => <article key={stage.name} className={styles.stage}><span className={styles.stageIcon} aria-hidden="true">{stage.icon}</span><p className={styles.stageName}>{stage.name}</p><h3>{stage.title}</h3><p>{stage.text}</p><div className={styles.output}>{stage.output}</div></article>)}</div>
        </section>

        <section id="how-it-works" className={styles.workflow}>
          <div><p className={styles.eyebrow}>FROM QUESTION TO EVIDENCE</p><h2>“Which resource plan meets our needs and our budget?”</h2><p>Use GRID-PRIME to structure that question, test the assumptions, and keep the reasoning available for the next person.</p><TourLaunch label="See the workflow" entered={entered} /></div>
          <ol className={styles.flowList}><li><strong>Start with a case</strong><p>Explore the reference case with three research zones and labeled synthetic hours, or create a blank case.</p></li><li><strong>Run the analysis</strong><p>File demand observations, produce a forecast, and compare portfolios against the budget and reserve you set.</p></li><li><strong>Review and follow through</strong><p>Use analyst, reviewer, and program-manager seats to record the plan, the decision, and subsequent observations.</p></li></ol>
        </section>

        <section className={styles.boundary}><span aria-hidden="true">⊞</span><div><h2>Built for planning and research.</h2><p>This research platform uses public and synthetic evidence for analytical decision support. Results depend on the data and assumptions in each case; the platform does not control grid equipment or dispatch generation.</p></div></section>

        <section className={styles.finalCta}><p className={styles.eyebrow}>PUT THE WORKFLOW TO WORK</p><h2>Make your next grid plan<br />easier to examine.</h2><p>Start with the example. Follow the evidence. Record the decision.</p><Link href={destination} className={styles.primary}>{entered ? "Return to your workspace" : "Open your first case"}</Link></section>
      </main>
      <footer className={styles.footer}><Link href="/" className={styles.brand}>GRID-PRIME</Link><p>Model · Predict · Optimize · Deliver</p><a href="#capabilities">Explore capabilities</a></footer>
    </div>
  );
}
