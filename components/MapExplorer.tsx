"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import CampusMap from "./CampusMap";
import StatusPill from "./StatusPill";
import { useAuth } from "./AuthProvider";
import { api, useCampusData } from "@/lib/client";
import { BAND_COLOR, BAND_LABEL, severityBand } from "@/lib/drqi";
import { CATEGORIES, CATEGORY_IDS } from "@/lib/categories";
import { timeAgo } from "@/lib/format";
import type { CategoryId, ReportView, Vote } from "@/lib/types";

export default function MapExplorer({ compact = false }: { compact?: boolean }) {
  const { roads, reports, loading, error, reload } = useCampusData();
  const { user } = useAuth();
  const [mode, setMode] = useState<"health" | "plain">("health");
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [roadId, setRoadId] = useState<string | "all">("all");
  const [showResolved, setShowResolved] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);

  const visible = useMemo(
    () =>
      reports.filter(
        (r) =>
          (showResolved || r.status !== "resolved") &&
          (category === "all" || r.category === category) &&
          (roadId === "all" || r.roadId === roadId),
      ),
    [reports, showResolved, category, roadId],
  );
  const selected = reports.find((r) => r.id === selectedId) ?? null;
  const activeCount = reports.filter((r) => r.status !== "resolved").length;
  const worstFirst = [...roads].sort((a, b) => a.score - b.score);

  async function vote(r: ReportView, v: Vote) {
    setVoteError(null);
    try {
      await api(`/api/reports/${r.id}/vote`, { method: "POST", body: JSON.stringify({ vote: v }) });
      await reload();
    } catch (e) {
      setVoteError(e instanceof Error ? e.message : "Could not save your vote.");
    }
  }

  return (
    <div className="map-panel" id="map">
      <div className="map-toolbar">
        <div className="live">
          <span className="pulse" />
          {loading ? "Loading road health layer" : error ? "Offline, retrying" : `Live road health layer, ${activeCount} active reports`}
        </div>
        <div className="toolbar-right">
          {!compact && (
            <>
              <select aria-label="Filter by category" value={category} onChange={(e) => setCategory(e.target.value as CategoryId | "all")}>
                <option value="all">All categories</option>
                {CATEGORY_IDS.map((c) => (
                  <option key={c} value={c}>{CATEGORIES[c].label}</option>
                ))}
              </select>
              <label className="check">
                <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
                Show resolved
              </label>
            </>
          )}
          <div className="toggle-group">
            <button className={mode === "health" ? "active" : ""} onClick={() => setMode("health")}>Road Health</button>
            <button className={mode === "plain" ? "active" : ""} onClick={() => setMode("plain")}>Plain</button>
          </div>
        </div>
      </div>

      <div className="map-stage">
        <CampusMap
          roads={roads}
          reports={visible}
          mode={mode}
          selectedId={selectedId}
          onSelect={setSelectedId}
          height={compact ? 460 : "clamp(480px, 68vh, 720px)"}
        />
        {selected && (
          <aside className="detail" aria-live="polite">
            <button className="detail-close" aria-label="Close details" onClick={() => setSelectedId(null)}>×</button>
            <div className="detail-id">{selected.id}</div>
            <h3>{selected.title}</h3>
            <div className="detail-meta">
              <StatusPill status={selected.status} />
              <span style={{ color: BAND_COLOR[severityBand(selected.severity)] }}>
                Severity {selected.severity}/10, {BAND_LABEL[severityBand(selected.severity)]}
              </span>
            </div>
            {selected.hasPhoto && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="detail-photo" src={`/api/reports/${selected.id}/photo`} alt={`Photo for ${selected.title}`} />
            )}
            {selected.description && <p className="detail-desc">{selected.description}</p>}
            <dl className="detail-list">
              <dt>Road</dt><dd>{selected.roadName}</dd>
              <dt>Routed to</dt><dd>{selected.department}</dd>
              <dt>Reported</dt><dd>{timeAgo(selected.createdAt)}</dd>
              <dt>Confirmed</dt><dd>{selected.confirmations} still exists, {selected.fixedVotes} say fixed</dd>
              {selected.detection && (
                <>
                  <dt>Detector</dt>
                  <dd>{selected.detection.label}, {Math.round(selected.detection.confidence * 100)}% (demo detector)</dd>
                </>
              )}
            </dl>
            {selected.status !== "resolved" &&
              (user ? (
                <div className="vote-row">
                  <button className={`btn btn-ghost${selected.myVote === "exists" ? " picked" : ""}`} onClick={() => vote(selected, "exists")}>Still exists</button>
                  <button className={`btn btn-ghost${selected.myVote === "fixed" ? " picked" : ""}`} onClick={() => vote(selected, "fixed")}>It's fixed</button>
                </div>
              ) : (
                <p className="detail-login"><Link href="/login">Log in</Link> to confirm or mark this as fixed.</p>
              ))}
            {voteError && <p className="form-error" role="alert">{voteError}</p>}
          </aside>
        )}
      </div>

      <div className="legend">
        <span className="lg-title">Road health score</span>
        <div className="chip"><span className="sw" style={{ background: BAND_COLOR.good }} />80 to 100 Good</div>
        <div className="chip"><span className="sw" style={{ background: BAND_COLOR.fair }} />55 to 79 Fair</div>
        <div className="chip"><span className="sw" style={{ background: BAND_COLOR.poor }} />30 to 54 Poor</div>
        <div className="chip"><span className="sw" style={{ background: BAND_COLOR.critical }} />0 to 29 Critical</div>
      </div>

      {!compact && (
        <div className="road-strip">
          <button className={`road-chip${roadId === "all" ? " on" : ""}`} onClick={() => setRoadId("all")}>All roads</button>
          {worstFirst.map((r) => (
            <button key={r.id} className={`road-chip${roadId === r.id ? " on" : ""}`} onClick={() => setRoadId(roadId === r.id ? "all" : r.id)}>
              <i style={{ background: BAND_COLOR[r.band] }} />
              {r.name}
              <b>{r.score}</b>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
