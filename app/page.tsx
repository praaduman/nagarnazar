import Link from "next/link";
import MapExplorer from "@/components/MapExplorer";
import { stats } from "@/lib/store";
import { CAMPUS } from "@/lib/config";

export const dynamic = "force-dynamic";

export default function Home() {
  const s = stats();
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <div className="hero-top">
            <div>
              <div className="eyebrow-line">{CAMPUS.name}, campus pilot</div>
              <h1>See your campus roads before you ride them.</h1>
              <p className="hero-sub">
                NagarNazar turns scattered pothole complaints into a live, navigable road health layer, scored, verified and routed automatically.
              </p>
            </div>
            <div className="hero-stats">
              <div className="stat"><div className="num">{s.avgScore}</div><div className="lbl">Avg road health</div></div>
              <div className="stat"><div className="num">{s.open + s.inProgress}</div><div className="lbl">Open reports</div></div>
              <div className="stat"><div className="num">{s.categoriesInUse}</div><div className="lbl">Categories</div></div>
            </div>
          </div>
          <MapExplorer compact />
          <div className="hero-actions">
            <Link href="/report" className="btn btn-primary">Report an issue</Link>
            <Link href="/map" className="btn btn-ghost">Open the full map</Link>
          </div>
        </div>
      </section>

      <div className="lane" />

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <h2>One pipeline, three jobs that used to be separate.</h2>
            <p>Detection, scoring and routing feed the same live layer instead of three disconnected tools.</p>
          </div>
          <div className="feat-grid">
            <div className="feat">
              <div className="f-index">Detect</div>
              <h3>YOLOv8 severity check</h3>
              <p>Every road photo is scored for damage type and severity before it reaches the map. In this demo the detector is simulated.</p>
            </div>
            <div className="feat">
              <div className="f-index">Score</div>
              <h3>Dynamic Road Quality Index</h3>
              <p>A 0 to 100 score per road, recalculated from severity, confirmations, freshness and traffic as new evidence arrives.</p>
            </div>
            <div className="feat">
              <div className="f-index">Route</div>
              <h3>SafeRoute Optimizer</h3>
              <p>The index feeds navigation, so a rider can trade a few minutes for a noticeably better surface.</p>
              <Link href="/saferoute" className="inline-link">Try SafeRoute</Link>
            </div>
          </div>
        </div>
      </section>

      <div className="lane" />

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <h2>Report an issue in under 60 seconds.</h2>
            <p>Photo, category and location. The rest is automatic.</p>
          </div>
          <div className="steps-row">
            <div className="step"><div className="s-num">01</div><div><h4>Duplicate check</h4><p>Reports within 30 m of an open one of the same type merge into a confirmation.</p></div></div>
            <div className="step"><div className="s-num">02</div><div><h4>Auto-routed to the right department</h4><p>A category lookup sends the report straight to the team responsible.</p></div></div>
            <div className="step"><div className="s-num">03</div><div><h4>Tracked until resolved</h4><p>Open, In Progress, Resolved. Others confirm it still exists or report it fixed.</p></div></div>
          </div>
          <div className="hero-actions">
            <Link href="/report" className="btn btn-primary">Report an issue</Link>
            <Link href="/login" className="btn btn-ghost">Demo log in</Link>
          </div>
        </div>
      </section>
    </>
  );
}
