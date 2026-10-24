import Link from "next/link";
import { redirect } from "next/navigation";
import PageHead from "@/components/PageHead";
import StatusPill from "@/components/StatusPill";
import { getSession } from "@/lib/auth";
import { listReports } from "@/lib/store";
import { CATEGORIES } from "@/lib/categories";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "My reports | NagarNazar" };

export default async function MyReports() {
  const user = await getSession();
  if (!user) redirect("/login?next=/my-reports");
  const mine = listReports(user.id).filter((r) => r.mine);

  return (
    <div className="wrap page narrow">
      <PageHead title="My reports" sub="Follow what happened to the issues you reported." />
      {mine.length === 0 ? (
        <div className="form-card">
          <h3>No reports yet</h3>
          <p className="muted">Spotted something on campus? It takes under a minute.</p>
          <Link href="/report" className="btn btn-primary">Report an issue</Link>
        </div>
      ) : (
        <ul className="my-list">
          {mine.map((r) => (
            <li key={r.id} className="my-item">
              <div>
                <b>{r.title}</b>
                <small>{r.id}, {CATEGORIES[r.category].label}, {timeAgo(r.createdAt)}</small>
                <small>Routed to {r.department}. {r.confirmations} confirmations.</small>
              </div>
              <StatusPill status={r.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
