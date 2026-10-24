import Link from "next/link";
import { redirect } from "next/navigation";
import PageHead from "@/components/PageHead";
import ReportsTable from "@/components/ReportsTable";
import StatusPill from "@/components/StatusPill";
import { getSession } from "@/lib/auth";
import { listReports, listRoads, stats } from "@/lib/store";
import { BAND_COLOR } from "@/lib/drqi";
import { CATEGORIES } from "@/lib/categories";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard | NagarNazar" };

export default async function Dashboard() {
  const user = await getSession();
  if (!user) redirect("/login?next=/dashboard");
  if (user.role !== "admin") {
    return (
      <div className="wrap page narrow">
        <PageHead title="Admin only" sub="The dashboard is for the estate and maintenance team." />
        <p className="muted">You're logged in as {user.name}. <Link href="/my-reports">See your own reports</Link> or log in with the admin demo account.</p>
      </div>
    );
  }

  const s = stats();
  const roads = [...listRoads()].sort((a, b) => a.score - b.score);
  const reports = listReports(user.id);

  return (
    <div className="wrap page">
      <PageHead title="One dashboard for every department." sub="A prioritised, evidence-backed worklist instead of scattered complaints." />

      <div className="tiles">
        <div className="tile"><div className="num">{s.open}</div><div className="lbl">Open</div></div>
        <div className="tile"><div className="num">{s.inProgress}</div><div className="lbl">In progress</div></div>
        <div className="tile"><div className="num">{s.resolved}</div><div className="lbl">Resolved</div></div>
        <div className="tile"><div className="num">{s.avgScore}</div><div className="lbl">Avg road health</div></div>
      </div>

      <div className="dash-grid">
        <div className="dash-cell">
          <table>
            <thead><tr><th>Road</th><th>Health</th><th>Active</th><th>Status</th></tr></thead>
            <tbody>
              {roads.map((r) => (
                <tr key={r.id}>
                  <td className="rd-name">{r.name}</td>
                  <td>
                    <span className="score-bar"><i style={{ width: `${r.score}%`, background: BAND_COLOR[r.band] }} /></span>
                    {r.score}
                  </td>
                  <td>{r.activeReports}</td>
                  <td><StatusPill status={r.worstStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="dash-cell">
          {s.byCategory.map((c) => (
            <div className="cat-row" key={c.category}>
              <span>{CATEGORIES[c.category].label}</span>
              <span className="cat-count">{c.count}</span>
            </div>
          ))}
        </div>
      </div>

      <h2 className="subhead">Worklist</h2>
      <ReportsTable initial={reports} />
    </div>
  );
}
