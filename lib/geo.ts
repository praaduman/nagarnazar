import type { LatLng } from "./types";
import { ROADS, NODES } from "./campus-data";

const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;

export function haversine(a: LatLng, b: LatLng): number {
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Distance from point p to segment a-b in metres (local flat approximation is fine at campus scale).
function distToSegment(p: LatLng, a: LatLng, b: LatLng): number {
  const k = Math.cos(rad(p[0])) * 111320;
  const toXY = (q: LatLng): [number, number] => [(q[1] - p[1]) * k, (q[0] - p[0]) * 110540];
  const [ax, ay] = toXY(a);
  const [bx, by] = toXY(b);
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, (-ax * dx - ay * dy) / len2));
  return Math.hypot(ax + t * dx, ay + t * dy);
}

export function nearestRoad(p: LatLng): { roadId: string; roadName: string; distance: number } {
  let best = { roadId: ROADS[0].id, roadName: ROADS[0].name, distance: Infinity };
  for (const road of ROADS) {
    for (const [a, b] of road.edges) {
      const d = distToSegment(p, NODES[a].ll, NODES[b].ll);
      if (d < best.distance) best = { roadId: road.id, roadName: road.name, distance: d };
    }
  }
  return best;
}

export function pointAlongRoad(roadId: string, t: number): LatLng {
  const road = ROADS.find((r) => r.id === roadId);
  if (!road) throw new Error(`Unknown road ${roadId}`);
  const scaled = Math.min(0.999, Math.max(0, t)) * road.edges.length;
  const idx = Math.floor(scaled);
  const f = scaled - idx;
  const [a, b] = road.edges[idx];
  const A = NODES[a].ll;
  const B = NODES[b].ll;
  return [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f];
}
