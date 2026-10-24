import type { LatLng, RouteResult } from "./types";
import { NODES, ROADS } from "./campus-data";
import { haversine } from "./geo";

interface Edge {
  to: string;
  roadId: string;
  length: number;
  coords: [LatLng, LatLng];
}

const adjacency: Record<string, Edge[]> = {};
for (const road of ROADS) {
  for (const [a, b] of road.edges) {
    const length = haversine(NODES[a].ll, NODES[b].ll);
    (adjacency[a] ??= []).push({ to: b, roadId: road.id, length, coords: [NODES[a].ll, NODES[b].ll] });
    (adjacency[b] ??= []).push({ to: a, roadId: road.id, length, coords: [NODES[b].ll, NODES[a].ll] });
  }
}

export const SPEEDS = { walk: 1.4, ride: 4.2 } as const; // metres per second
export type Speed = keyof typeof SPEEDS;

/** Fastest ignores surface quality. SafeRoute makes a bad surface cost up to 3.2x its travel time. */
const SAFETY_PENALTY = 2.2;

export function findRoute(
  from: string,
  to: string,
  mode: "fast" | "safe",
  speed: Speed,
  scores: Record<string, number>,
): RouteResult | null {
  if (!NODES[from] || !NODES[to]) return null;
  const dist: Record<string, number> = { [from]: 0 };
  const prev: Record<string, { node: string; edge: Edge } | undefined> = {};
  const todo = new Set(Object.keys(NODES));

  while (todo.size) {
    let u: string | null = null;
    for (const n of todo) if (dist[n] !== undefined && (u === null || dist[n] < dist[u])) u = n;
    if (u === null) break;
    todo.delete(u);
    if (u === to) break;
    for (const e of adjacency[u] ?? []) {
      const seconds = e.length / SPEEDS[speed];
      const quality = (scores[e.roadId] ?? 100) / 100;
      const cost = mode === "fast" ? seconds : seconds * (1 + (1 - quality) * SAFETY_PENALTY);
      if (dist[u] + cost < (dist[e.to] ?? Infinity)) {
        dist[e.to] = dist[u] + cost;
        prev[e.to] = { node: u, edge: e };
      }
    }
  }
  if (dist[to] === undefined) return null;

  const edges: Edge[] = [];
  for (let n = to; n !== from; ) {
    const p = prev[n];
    if (!p) return null;
    edges.unshift(p.edge);
    n = p.node;
  }

  const coords: LatLng[] = edges.length ? [edges[0].coords[0]] : [NODES[from].ll];
  let distanceM = 0;
  let weighted = 0;
  let worst: { roadId: string; score: number } | null = null;
  const roadIds: string[] = [];
  for (const e of edges) {
    coords.push(e.coords[1]);
    distanceM += e.length;
    const s = scores[e.roadId] ?? 100;
    weighted += s * e.length;
    if (!worst || s < worst.score) worst = { roadId: e.roadId, score: s };
    if (roadIds[roadIds.length - 1] !== e.roadId) roadIds.push(e.roadId);
  }
  const name = (id: string) => ROADS.find((r) => r.id === id)?.name ?? id;
  return {
    coords,
    distanceM: Math.round(distanceM),
    durationMin: Math.max(1, Math.round(distanceM / SPEEDS[speed] / 60)),
    avgScore: distanceM ? Math.round(weighted / distanceM) : 100,
    roads: roadIds.map(name),
    worstRoad: worst ? { name: name(worst.roadId), score: worst.score } : null,
  };
}
