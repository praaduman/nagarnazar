"use client";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import CampusMap from "./CampusMap";
import { useAuth } from "./AuthProvider";
import { api, useCampusData } from "@/lib/client";
import { CATEGORIES, CATEGORY_IDS } from "@/lib/categories";
import { nearestRoad } from "@/lib/geo";
import type { CategoryId, Impact, LatLng, ReportView } from "@/lib/types";

interface Result {
  report: ReportView;
  merged: boolean;
}

async function shrinkImage(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  for (const [max, q] of [[800, 0.72], [640, 0.55], [480, 0.4]] as const) {
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale);
    c.height = Math.round(bmp.height * scale);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    const url = c.toDataURL("image/jpeg", q);
    if (url.length < 600_000) return url;
  }
  throw new Error("That photo is too large to upload.");
}

export default function ReportForm() {
  const { user, loading: authLoading } = useAuth();
  const { roads, reports, reload } = useCampusData(60000);
  const [category, setCategory] = useState<CategoryId>("pothole");
  const [impact, setImpact] = useState<Impact>("moderate");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<{ url: string; name: string } | null>(null);
  const [point, setPoint] = useState<LatLng | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const near = useMemo(() => (point ? nearestRoad(point) : null), [point]);
  const tooFar = !!near && near.distance > 120;
  const active = useMemo(() => reports.filter((r) => r.status !== "resolved"), [reports]);

  async function onPhoto(file?: File) {
    if (!file) return;
    setError(null);
    try {
      setPhoto({ url: await shrinkImage(file), name: file.name });
    } catch (e) {
      setError(e instanceof Error && e.message.includes("large") ? e.message : "Couldn't read that image. Try a JPEG or PNG.");
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) return setError("This browser can't share your location. Tap the map instead.");
    navigator.geolocation.getCurrentPosition(
      (p) => setPoint([p.coords.latitude, p.coords.longitude]),
      () => setError("Location was blocked. Tap the map to set the spot instead."),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!point) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api<Result>("/api/reports", {
        method: "POST",
        body: JSON.stringify({ category, impact, description: notes, lat: point[0], lng: point[1], photo: photo?.url }),
      });
      setResult(res);
      setNotes("");
      setPhoto(null);
      setPoint(null);
      if (fileRef.current) fileRef.current.value = "";
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit the report.");
    } finally {
      setBusy(false);
    }
  }

  if (authLoading) return <div className="form-card skeleton" aria-busy="true" />;

  if (!user) {
    return (
      <div className="form-card">
        <h3>Log in to report</h3>
        <p className="muted">Reports are tied to a campus account so duplicates can be merged and each report can be followed up.</p>
        <p className="muted">Demo accounts are on the login page.</p>
        <Link className="btn btn-primary" href="/login?next=/report">Go to log in</Link>
      </div>
    );
  }

  return (
    <div className="flow">
      <form className="form-card" onSubmit={submit}>
        <div className="field">
          <label htmlFor="cat">Category</label>
          <select id="cat" value={category} onChange={(e) => setCategory(e.target.value as CategoryId)}>
            {CATEGORY_IDS.map((c) => (
              <option key={c} value={c}>{CATEGORIES[c].label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="impact">How bad is it?</label>
          <select id="impact" value={impact} onChange={(e) => setImpact(e.target.value as Impact)}>
            <option value="minor">Minor, an annoyance</option>
            <option value="moderate">Moderate, slows people down</option>
            <option value="severe">Severe, someone could get hurt</option>
          </select>
          {category === "pothole" && photo && <p className="hint">The demo detector will score this from your photo instead.</p>}
        </div>

        <div className="field">
          <label htmlFor="photo">Photo</label>
          <input id="photo" ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onPhoto(e.target.files?.[0])} />
          <button type="button" className={`photo-drop${photo ? " filled" : ""}`} onClick={() => fileRef.current?.click()}>
            {photo ? `${photo.name} attached. Tap to replace` : "Tap to take or attach a photo"}
          </button>
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="photo-preview" src={photo.url} alt="Selected photo preview" />
          )}
        </div>

        <div className="field">
          <label htmlFor="notes">Notes (optional)</label>
          <textarea id="notes" rows={3} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Deep pothole near the hostel gate, gets worse after rain" />
        </div>

        <div className="field">
          <label>Location</label>
          {point && near ? (
            <div className={`geo-row${tooFar ? " warn" : ""}`}>
              <span className="dot2" />
              {tooFar
                ? "That spot is far from any campus road. Tap closer to a road."
                : `Location captured: ${near.roadName}, ${Math.round(near.distance)} m from the road line (${point[0].toFixed(5)}, ${point[1].toFixed(5)})`}
            </div>
          ) : (
            <div className="geo-row muted">Tap the map to drop a pin, or use your location.</div>
          )}
          <button type="button" className="btn btn-ghost small" onClick={useMyLocation}>Use my location</button>
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="submit-row">
          <button className="btn btn-primary" disabled={!point || tooFar || busy}>{busy ? "Submitting" : "Submit report"}</button>
          {!point && <span className="hint">Pick a location first.</span>}
        </div>

        {result && (
          <div className="result" role="status">
            {result.merged ? (
              <p><b>Merged with {result.report.id}.</b> A matching report was already open within 30 m, so your report was added as a confirmation. That keeps the map clean and raises the issue's priority.</p>
            ) : (
              <p><b>Report {result.report.id} submitted.</b> Routed to {result.report.department}. Severity {result.report.severity}/10, and {result.report.roadName} health is updating.</p>
            )}
            {result.report.detection && (
              <p className="muted">Demo detector: {result.report.detection.label}, {Math.round(result.report.detection.confidence * 100)}% confidence.</p>
            )}
            <Link href="/map">See it on the map</Link>
          </div>
        )}
      </form>

      <div className="picker-col">
        <CampusMap
          roads={roads}
          reports={active}
          height={440}
          picker={{ value: point, onChange: setPoint }}
          scrollZoom
        />
        <ol className="step-list compact">
          <li className="step"><div className="s-num">01</div><div><h4>Duplicate check</h4><p>If an open report of the same type sits within 30 m, yours becomes a confirmation instead of a new pin.</p></div></li>
          <li className="step"><div className="s-num">02</div><div><h4>Auto-routed</h4><p>The category decides the department. {CATEGORIES[category].label} goes to {CATEGORIES[category].department}.</p></div></li>
          <li className="step"><div className="s-num">03</div><div><h4>Tracked until resolved</h4><p>Status moves through Open, In Progress and Resolved. Others can confirm it still exists or report it fixed.</p></div></li>
        </ol>
      </div>
    </div>
  );
}
