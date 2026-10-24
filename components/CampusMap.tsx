"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { Map as LMap, LayerGroup } from "leaflet";
import type { LatLng, ReportView, RoadView } from "@/lib/types";
import { CAMPUS, TILES } from "@/lib/config";
import { BAND_COLOR, BAND_LABEL, severityBand } from "@/lib/drqi";
import { CATEGORIES } from "@/lib/categories";

type Leaflet = typeof import("leaflet");

export interface MapRoutes {
  fast?: LatLng[];
  safe?: LatLng[];
}

interface Props {
  roads: RoadView[];
  reports?: ReportView[];
  mode?: "health" | "plain";
  routes?: MapRoutes;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  picker?: { value: LatLng | null; onChange: (ll: LatLng) => void };
  height?: number | string;
  scrollZoom?: boolean;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export default function CampusMap({
  roads,
  reports = [],
  mode = "health",
  routes,
  selectedId,
  onSelect,
  picker,
  height = 460,
  scrollZoom = false,
}: Props) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LMap | null>(null);
  const LRef = useRef<Leaflet | null>(null);
  const layers = useRef<Record<"roads" | "routes" | "pins" | "picker", LayerGroup> | null>(null);
  const fitted = useRef(false);
  const onSelectRef = useRef(onSelect);
  const pickerRef = useRef(picker);
  const [ready, setReady] = useState(false);

  onSelectRef.current = onSelect;
  pickerRef.current = picker;

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    let map: LMap | undefined;
    let ro: ResizeObserver | undefined;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !box.current) return;
      map = L.map(box.current, { center: CAMPUS.center, zoom: CAMPUS.zoom, scrollWheelZoom: scrollZoom });
      L.tileLayer(TILES.url, { attribution: TILES.attribution, maxZoom: 19, subdomains: "abcd" }).addTo(map);
      const order = ["roads", "routes", "pins", "picker"] as const;
      const made = {} as Record<(typeof order)[number], LayerGroup>;
      order.forEach((name, i) => {
        map!.createPane(name).style.zIndex = String(410 + i * 10);
        made[name] = L.layerGroup().addTo(map!);
      });
      layers.current = made;
      map.on("click", (e) => pickerRef.current?.onChange([e.latlng.lat, e.latlng.lng]));
      ro = new ResizeObserver(() => map?.invalidateSize());
      ro.observe(box.current);
      mapRef.current = map;
      LRef.current = L;
      setReady(true);
    })();
    return () => {
      cancelled = true;
      ro?.disconnect();
      map?.remove();
      mapRef.current = null;
      layers.current = null;
      fitted.current = false;
      setReady(false);
    };
  }, [scrollZoom]);

  // Roads, coloured by quality score.
  useEffect(() => {
    if (!ready || !layers.current) return;
    const L = LRef.current!;
    const lg = layers.current.roads;
    lg.clearLayers();
    roads.forEach((road) => {
      const color = mode === "health" ? BAND_COLOR[road.band] : "#7a828a";
      const tip =
        `<div class="t-name">${esc(road.name)}</div>` +
        `<div class="t-row"><span>Road health</span><span class="t-score" style="color:${BAND_COLOR[road.band]}">${road.score} · ${BAND_LABEL[road.band]}</span></div>` +
        `<div class="t-row"><span>Active reports</span><span>${road.activeReports}</span></div>`;
      road.paths.forEach((path) => {
        L.polyline(path, { pane: "roads", color: "#0b0d10", weight: 13, opacity: 0.9, lineCap: "round", interactive: false }).addTo(lg);
        const line = L.polyline(path, { pane: "roads", color, weight: 7, lineCap: "round" }).addTo(lg);
        line.bindTooltip(tip, { sticky: true, className: "nn-tip", opacity: 1 });
        line.on("mouseover", () => line.setStyle({ weight: 10 }));
        line.on("mouseout", () => line.setStyle({ weight: 7 }));
      });
    });
    if (!fitted.current && roads.length) {
      const pts = roads.flatMap((r) => r.paths.flat());
      mapRef.current!.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 18 });
      fitted.current = true;
    }
  }, [ready, roads, mode]);

  // Report pins.
  useEffect(() => {
    if (!ready || !layers.current) return;
    const L = LRef.current!;
    const lg = layers.current.pins;
    lg.clearLayers();
    reports.forEach((r) => {
      const color = r.status === "resolved" ? "#6d747c" : BAND_COLOR[severityBand(r.severity)];
      const selected = r.id === selectedId;
      const ring = L.circleMarker([r.lat, r.lng], {
        pane: "pins", radius: selected ? 15 : 12, color: selected ? "#ffb020" : color, weight: 2,
        opacity: selected ? 1 : 0.55, fillColor: color, fillOpacity: 0.12,
      }).addTo(lg);
      L.circleMarker([r.lat, r.lng], {
        pane: "pins", radius: 5, color: "#0b0d10", weight: 1.5, fillColor: color, fillOpacity: 1, interactive: false,
      }).addTo(lg);
      ring.bindTooltip(
        `<div class="t-name">${esc(r.title)}</div>` +
          `<div class="t-row"><span>Category</span><span>${esc(CATEGORIES[r.category].short)}</span></div>` +
          `<div class="t-row"><span>Severity</span><span class="t-score" style="color:${color}">${r.severity}/10</span></div>` +
          `<div class="t-row"><span>Confirmations</span><span>${r.confirmations}</span></div>`,
        { className: "nn-tip", direction: "top", offset: [0, -8], opacity: 1 },
      );
      ring.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectRef.current?.(r.id);
      });
    });
  }, [ready, reports, selectedId]);

  // SafeRoute overlays.
  useEffect(() => {
    if (!ready || !layers.current) return;
    const L = LRef.current!;
    const lg = layers.current.routes;
    lg.clearLayers();
    const bounds: LatLng[] = [];
    if (routes?.fast) {
      L.polyline(routes.fast, { pane: "routes", color: "#eceee9", weight: 5, dashArray: "1 10", lineCap: "round", interactive: false }).addTo(lg);
      bounds.push(...routes.fast);
    }
    if (routes?.safe) {
      L.polyline(routes.safe, { pane: "routes", color: "#4fb4ff", weight: 5, dashArray: "1 10", dashOffset: "5", lineCap: "round", interactive: false }).addTo(lg);
      bounds.push(...routes.safe);
    }
    if (bounds.length) mapRef.current!.fitBounds(L.latLngBounds(bounds), { padding: [70, 70], maxZoom: 18 });
  }, [ready, routes]);

  // Location picker marker.
  useEffect(() => {
    if (!ready || !layers.current) return;
    const L = LRef.current!;
    const lg = layers.current.picker;
    lg.clearLayers();
    if (picker?.value) {
      L.circleMarker(picker.value, { pane: "picker", radius: 18, color: "#ffb020", weight: 1.5, fillOpacity: 0, interactive: false }).addTo(lg);
      L.circleMarker(picker.value, { pane: "picker", radius: 7, color: "#181205", weight: 2, fillColor: "#ffb020", fillOpacity: 1, interactive: false }).addTo(lg);
    }
  }, [ready, picker?.value]);

  return (
    <div
      ref={box}
      className={`campus-map${picker ? " is-picking" : ""}`}
      style={{ height }}
      role="application"
      aria-label="Campus road health map"
    />
  );
}
