"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { CATEGORIES } from "@/lib/categories";
import { BAND_COLOR, severityBand } from "@/lib/drqi";
import { STATUS_LABEL, timeAgo } from "@/lib/format";
import type { ReportView, Status } from "@/lib/types";

export default function ReportsTable({ initial }: { initial: ReportView[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [filter, setFilter] = useState<"active" | "all" | "resolved">("active");
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const shown = rows
    .filter((r) => (filter === "all" ? true : filter === "resolved" ? r.status === "resolved" : r.status !== "resolved"))
    .sort((a, b) => Number(a.status === "resolved") - Number(b.status === "resolved") || b.priority - a.priority);

  async function setStatus(id: string, status: Status) {
    setError(null);
    setSavingId(id);
    try {
      const { report } = await api<{ report: ReportView }>(`/api/reports/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...report } : r)));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the status.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <div className="table-head">
        <div className="toggle-group">
          {(["active", "resolved", "all"] as const).map((f) => (
            <button key={f} className={filter === f ? "active" : ""} onClick={() => setFilter(f)}>
              {f === "active" ? "Needs action" : f === "resolved" ? "Resolved" : "All"}
            </button>
          ))}
        </div>
        <span className="muted">{shown.length} reports, highest priority first</span>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="table-scroll">
        <table>
          <thead>
            <tr><th>ID</th><th>Issue</th><th>Severity</th><th>Evidence</th><th>Department</th><th>Age</th><th>Status</th></tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id}>
                <td className="rd-name">{r.id}</td>
                <td>
                  <span className="rd-name">{CATEGORIES[r.category].short}</span>
                  <br />
                  <small>{r.roadName}</small>
                </td>
                <td style={{ color: BAND_COLOR[severityBand(r.severity)], fontWeight: 600 }}>{r.severity}/10</td>
                <td><small>{r.confirmations} still exists<br />{r.fixedVotes} say fixed</small></td>
                <td><small>{r.department}</small></td>
                <td><small suppressHydrationWarning>{timeAgo(r.createdAt)}</small></td>
                <td>
                  <select
                    aria-label={`Status for ${r.id}`}
                    className={`status-select st-${r.status}`}
                    value={r.status}
                    disabled={savingId === r.id}
                    onChange={(e) => setStatus(r.id, e.target.value as Status)}
                  >
                    {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                      <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {!shown.length && <tr><td colSpan={7} className="empty">Nothing here. Reports that match this view will show up as they come in.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
