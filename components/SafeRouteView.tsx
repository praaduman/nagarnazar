"use client";
import { useEffect, useMemo, useState } from "react";
import CampusMap from "./CampusMap";
import { api, useCampusData } from "@/lib/client";
import { PLACES } from "@/lib/campus-data";
import type { RouteResult } from "@/lib/types";

interface Pair {
  fast: RouteResult;
  safe: RouteResult;
}

export default function SafeRouteView() {
  const { roads } = useCampusData(60000);
  const [from, setFrom] = useState("hostel");
  const [to, setTo] = useState("gate");
  const [speed, setSpeed] = useState<"walk" | "ride">("walk");
  const [show, setShow] = useState<"fast" | "safe">("safe");
  const [pair, setPair] = useState<Pair | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setError(null);
    api<Pair>(`/api/saferoute?from=${from}&to=${to}&speed=${speed}`)
      .then((p) => live && setPair(p))
      .catch((e) => {
        if (!live) return;
        setPair(null);
        setError(e instanceof Error ? e.message : "Could not find a route.");
      });
    return () => {
      live = false;
    };
  }, [from, to, speed]);

  const same = pair && pair.fast.avgScore === pair.safe.avgScore && pair.fast.distanceM === pair.safe.distanceM;
  const routes = useMemo(() => (pair ? { [show]: pair[show].coords } : undefined), [pair, show]);
  const extraMin = pair ? pair.safe.durationMin - pair.fast.durationMin : 0;

  return (
    <div className="map-panel">
      <div className="map-toolbar">
        <div className="route-pick">
          <select aria-label="From" value={from} onChange={(e) => setFrom(e.target.value)}>
            {PLACES.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <span aria-hidden>to</span>
          <select aria-label="To" value={to} onChange={(e) => setTo(e.target.value)}>
            {PLACES.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="toggle-group">
            <button className={speed === "walk" ? "active" : ""} onClick={() => setSpeed("walk")}>Walk</button>
            <button className={speed === "ride" ? "active" : ""} onClick={() => setSpeed("ride")}>Ride</button>
          </div>
        </div>
        <div className="toggle-group">
          <button className={show === "fast" ? "active" : ""} onClick={() => setShow("fast")}>Fastest</button>
          <button className={show === "safe" ? "active" : ""} onClick={() => setShow("safe")}>SafeRoute</button>
        </div>
      </div>

      <div className="map-stage">
        <CampusMap roads={roads} routes={routes} height={420} />
      </div>

      {error && <p className="form-error pad" role="alert">{error}</p>}

      {pair && (
        <div className="route-cards">
          <div className={`route-card${show === "fast" ? " on" : ""}`}>
            <span className="swatch" style={{ background: "#eceee9" }} />
            <h3>Fastest</h3>
            <p className="big">{pair.fast.durationMin} min <small>{pair.fast.distanceM} m</small></p>
            <p className="muted">Average road health {pair.fast.avgScore}</p>
            {pair.fast.worstRoad && <p className="muted">Worst stretch: {pair.fast.worstRoad.name} ({pair.fast.worstRoad.score})</p>}
          </div>
          <div className={`route-card${show === "safe" ? " on" : ""}`}>
            <span className="swatch" style={{ background: "#4fb4ff" }} />
            <h3>SafeRoute</h3>
            <p className="big">{pair.safe.durationMin} min <small>{pair.safe.distanceM} m</small></p>
            <p className="muted">Average road health {pair.safe.avgScore}</p>
            {pair.safe.worstRoad && <p className="muted">Worst stretch: {pair.safe.worstRoad.name} ({pair.safe.worstRoad.score})</p>}
          </div>
          <p className="route-note">
            {same
              ? "The fastest route is already the best surface for this trip."
              : `SafeRoute adds ${extraMin > 0 ? `${extraMin} min` : "a little distance"} and lifts average road health from ${pair.fast.avgScore} to ${pair.safe.avgScore}.`}
          </p>
        </div>
      )}
    </div>
  );
}
