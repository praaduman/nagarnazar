import type { Band, CategoryId, Status } from "./types";
import { CATEGORIES } from "./categories";

export interface Scorable {
  category: CategoryId;
  severity: number;
  status: Status;
  createdAt: number;
  confirmations: number;
}

const K = 0.6;
const SOFTNESS = 45; // bigger = scores fall more slowly as reports pile up

/** How many index points one report takes off its road. Resolved reports cost nothing. */
export function reportPenalty(r: Scorable, exposure: number, now = Date.now()): number {
  if (r.status === "resolved") return 0;
  const ageDays = Math.max(0, (now - r.createdAt) / 864e5);
  const freshness = Math.max(0.35, Math.pow(0.5, ageDays / 21)); // half-life of three weeks
  const evidence = 1 + Math.min(r.confirmations, 6) * 0.2;
  const progress = r.status === "in_progress" ? 0.7 : 1;
  return CATEGORIES[r.category].weight * r.severity * freshness * evidence * exposure * progress * K;
}

export function roadScore(reports: Scorable[], exposure: number, now = Date.now()): number {
  const penalty = reports.reduce((s, r) => s + reportPenalty(r, exposure, now), 0);
  // Smooth decay: no road ever hits a hard 0, and each extra report matters a bit less.
  return Math.max(0, Math.min(100, Math.round(100 * Math.exp(-penalty / SOFTNESS))));
}

export function band(score: number): Band {
  if (score >= 80) return "good";
  if (score >= 55) return "fair";
  if (score >= 30) return "poor";
  return "critical";
}

export const BAND_COLOR: Record<Band, string> = {
  good: "#4fb47c",
  fair: "#e8c547",
  poor: "#f0883e",
  critical: "#e1503c",
};

export const BAND_LABEL: Record<Band, string> = {
  good: "Good",
  fair: "Fair",
  poor: "Poor",
  critical: "Critical",
};

export const severityBand = (s: number): Band => (s >= 8 ? "critical" : s >= 6 ? "poor" : s >= 4 ? "fair" : "good");
