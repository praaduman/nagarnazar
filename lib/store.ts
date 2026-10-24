import type {
  CategoryId, Detection, Impact, LatLng, ReportView, RoadView, SessionUser, Status, Vote, Role,
} from "./types";
import { CATEGORIES, IMPACT_SEVERITY } from "./categories";
import { ROADS, roadPaths } from "./campus-data";
import { haversine, nearestRoad, pointAlongRoad } from "./geo";
import { band, reportPenalty, roadScore } from "./drqi";
import { hashPassword, verifyPassword } from "./password";
import { HttpError } from "./http";

/**
 * Demo data layer. Everything lives in memory and resets when the server restarts.
 * This file is the only place that touches data, so swapping it for PostgreSQL later
 * means re-implementing these exported functions and nothing else.
 */

interface ReportRecord {
  id: string;
  title: string;
  category: CategoryId;
  description: string;
  roadId: string;
  lat: number;
  lng: number;
  severity: number;
  status: Status;
  createdAt: number;
  updatedAt: number;
  reporterId: string;
  votes: Record<string, Vote>;
  photo: { mime: string; data: Buffer } | null;
  detection: Detection | null;
}

interface UserRecord extends SessionUser {
  passwordHash: string;
}

interface DB {
  reports: Map<string, ReportRecord>;
  users: UserRecord[];
  seq: number;
}

const g = globalThis as unknown as { __nagarnazar?: DB };
const db = (): DB => (g.__nagarnazar ??= seed());

// ---------- seed ----------

const DAY = 864e5;
const PHRASES: Record<CategoryId, string[]> = {
  pothole: [
    "Deep pothole, bikes swerve around it.",
    "Surface cracked and breaking up near the edge.",
    "Water collects here after rain and hides the hole.",
    "Loose gravel and a widening crack.",
  ],
  streetlight: ["Light has been out for a week, very dark at night.", "Flickering pole, goes off after 9 pm."],
  waste: ["Bin overflowing onto the road.", "Waste not collected since the weekend."],
  property: ["Broken railing along the footpath.", "Damaged signboard hanging loose."],
  safety: ["Open drain cover right at the turn.", "Exposed wiring near the pole base."],
  environment: ["Fallen branch blocking half the lane.", "Stagnant water, mosquitoes around the corner."],
};

// roadId, category, severity, ageDays, status, confirmations, position along road
type Row = [string, CategoryId, number, number, Status, number, number];
const SEED_ROWS: Row[] = [
  ["hostel-link-road", "pothole", 8, 3, "open", 7, 0.1],
  ["hostel-link-road", "pothole", 7, 6, "open", 5, 0.35],
  ["hostel-link-road", "pothole", 9, 2, "open", 6, 0.6],
  ["hostel-link-road", "streetlight", 6, 9, "open", 3, 0.5],
  ["hostel-link-road", "safety", 7, 4, "open", 4, 0.8],
  ["hostel-link-road", "pothole", 6, 12, "in_progress", 3, 0.9],
  ["hostel-link-road", "waste", 4, 5, "open", 2, 0.25],
  ["sports-complex-road", "pothole", 7, 5, "open", 4, 0.2],
  ["sports-complex-road", "pothole", 6, 8, "in_progress", 3, 0.55],
  ["sports-complex-road", "streetlight", 5, 10, "open", 2, 0.7],
  ["sports-complex-road", "property", 5, 14, "open", 2, 0.4],
  ["sports-complex-road", "pothole", 8, 4, "open", 5, 0.1],
  ["sports-complex-road", "safety", 7, 6, "open", 4, 0.3],
  ["sports-complex-road", "pothole", 7, 9, "open", 3, 0.85],
  ["sports-complex-road", "waste", 5, 3, "open", 2, 0.95],
  ["library-bypass", "pothole", 6, 5, "open", 3, 0.3],
  ["library-bypass", "streetlight", 5, 8, "open", 2, 0.6],
  ["library-bypass", "property", 4, 10, "open", 1, 0.05],
  ["admin-block-road", "pothole", 5, 6, "open", 2, 0.1],
  ["admin-block-road", "property", 4, 9, "open", 1, 0.5],
  ["library-bypass", "pothole", 5, 7, "in_progress", 3, 0.15],
  ["library-bypass", "waste", 4, 3, "open", 2, 0.45],
  ["library-bypass", "pothole", 4, 16, "open", 1, 0.75],
  ["library-bypass", "environment", 3, 4, "open", 1, 0.9],
  ["admin-block-road", "streetlight", 4, 20, "resolved", 3, 0.3],
  ["admin-block-road", "pothole", 5, 18, "in_progress", 2, 0.6],
  ["admin-block-road", "waste", 3, 2, "open", 1, 0.8],
  ["gate-road", "pothole", 3, 25, "resolved", 4, 0.2],
  ["gate-road", "streetlight", 3, 6, "open", 1, 0.7],
  ["north-lane", "pothole", 5, 11, "open", 2, 0.4],
  ["north-lane", "property", 3, 13, "open", 1, 0.7],
  ["hostel-approach", "pothole", 5, 9, "open", 2, 0.3],
  ["hostel-approach", "waste", 4, 6, "open", 2, 0.7],
];

function seed(): DB {
  const now = Date.now();
  const users: UserRecord[] = [
    { id: "u-admin", name: "Estate Office", email: "admin@adypu.demo", role: "admin", passwordHash: hashPassword("demo1234") },
    { id: "u-student", name: "Aarav Sharma", email: "student@adypu.demo", role: "student", passwordHash: hashPassword("demo1234") },
    { id: "u-riya", name: "Riya Patil", email: "riya@adypu.demo", role: "student", passwordHash: hashPassword("demo1234") },
  ];
  const state: DB = { reports: new Map(), users, seq: 0 };

  SEED_ROWS.forEach(([roadId, category, severity, age, status, confirms, t], i) => {
    const [lat, lng] = pointAlongRoad(roadId, t);
    const road = ROADS.find((r) => r.id === roadId)!;
    const votes: Record<string, Vote> = {};
    for (let v = 0; v < confirms; v++) votes[`seed-${i}-${v}`] = "exists";
    if (status === "resolved") votes[`seed-${i}-fix`] = "fixed";
    const id = `NN-${String(++state.seq).padStart(4, "0")}`;
    const phrases = PHRASES[category];
    state.reports.set(id, {
      id,
      title: `${CATEGORIES[category].short} on ${road.name}`,
      category,
      description: phrases[i % phrases.length],
      roadId,
      lat,
      lng,
      severity,
      status,
      createdAt: now - age * DAY,
      updatedAt: now - Math.max(0, age - 1) * DAY,
      reporterId: i < 3 ? "u-student" : i % 2 ? "u-riya" : "seed-user",
      votes,
      photo: null,
      detection: null,
    });
  });
  return state;
}

// ---------- users ----------

export function authenticate(email: string, password: string): SessionUser | null {
  const u = db().users.find((x) => x.email === email.trim().toLowerCase());
  if (!u || !verifyPassword(password, u.passwordHash)) return null;
  return { id: u.id, name: u.name, email: u.email, role: u.role };
}

export function getUser(id: string): SessionUser | null {
  const u = db().users.find((x) => x.id === id);
  return u ? { id: u.id, name: u.name, email: u.email, role: u.role } : null;
}

// ---------- views ----------

function toView(r: ReportRecord, viewerId?: string): ReportView {
  const road = ROADS.find((x) => x.id === r.roadId)!;
  const values = Object.values(r.votes);
  const confirmations = values.filter((v) => v === "exists").length;
  const scorable = { ...r, confirmations };
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    description: r.description,
    roadId: r.roadId,
    roadName: road.name,
    lat: r.lat,
    lng: r.lng,
    severity: r.severity,
    status: r.status,
    department: CATEGORIES[r.category].department,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    confirmations,
    fixedVotes: values.length - confirmations,
    hasPhoto: !!r.photo,
    detection: r.detection,
    mine: !!viewerId && r.reporterId === viewerId,
    myVote: (viewerId && r.votes[viewerId]) || null,
    priority: Math.round(reportPenalty(scorable, road.exposure) * 10) / 10,
  };
}

export function listReports(viewerId?: string, filter: { status?: Status; category?: CategoryId; roadId?: string } = {}): ReportView[] {
  return [...db().reports.values()]
    .filter((r) => (!filter.status || r.status === filter.status) && (!filter.category || r.category === filter.category) && (!filter.roadId || r.roadId === filter.roadId))
    .map((r) => toView(r, viewerId))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function getReport(id: string, viewerId?: string): ReportView {
  const r = db().reports.get(id);
  if (!r) throw new HttpError(404, "Report not found.");
  return toView(r, viewerId);
}

export function getPhoto(id: string) {
  return db().reports.get(id)?.photo ?? null;
}

export function listRoads(): RoadView[] {
  const reports = [...db().reports.values()];
  return ROADS.map((road) => {
    const mine = reports.filter((r) => r.roadId === road.id).map((r) => toView(r));
    const active = mine.filter((r) => r.status !== "resolved");
    const score = roadScore(mine.map((r) => ({ ...r, confirmations: r.confirmations })), road.exposure);
    const worstStatus: RoadView["worstStatus"] = active.some((r) => r.status === "open")
      ? "open"
      : active.length
        ? "in_progress"
        : "clear";
    return {
      id: road.id,
      name: road.name,
      paths: roadPaths(road),
      score,
      band: band(score),
      activeReports: active.length,
      confirmations: active.reduce((s, r) => s + r.confirmations, 0),
      worstStatus,
    };
  });
}

export function roadScores(): Record<string, number> {
  return Object.fromEntries(listRoads().map((r) => [r.id, r.score]));
}

export function stats() {
  const all = listReports();
  const active = all.filter((r) => r.status !== "resolved");
  const roads = listRoads();
  const byCategory = (Object.keys(CATEGORIES) as CategoryId[])
    .map((c) => ({ category: c, count: active.filter((r) => r.category === c).length }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count);
  return {
    open: all.filter((r) => r.status === "open").length,
    inProgress: all.filter((r) => r.status === "in_progress").length,
    resolved: all.filter((r) => r.status === "resolved").length,
    avgScore: Math.round(roads.reduce((s, r) => s + r.score, 0) / roads.length),
    categoriesInUse: new Set(all.map((r) => r.category)).size,
    byCategory,
  };
}

// ---------- mutations ----------

export interface NewReport {
  category: CategoryId;
  description: string;
  lat: number;
  lng: number;
  impact: Impact;
  photo?: string;
}

const DETECTION_LABELS = ["Pothole", "Alligator cracking", "Edge break", "Surface wear"];

/** Stand-in for the YOLOv8 service: deterministic from the image bytes, clearly flagged as simulated. */
function simulateDetection(bytes: Buffer): Detection {
  let h = 2166136261;
  const step = Math.max(1, Math.floor(bytes.length / 512));
  for (let i = 0; i < bytes.length; i += step) h = Math.imul(h ^ bytes[i], 16777619) >>> 0;
  return {
    label: DETECTION_LABELS[h % DETECTION_LABELS.length],
    confidence: Math.round((0.72 + ((h >>> 8) % 24) / 100) * 100) / 100,
    severity: 3 + ((h >>> 4) % 7),
    simulated: true,
  };
}

function parsePhoto(dataUrl: string) {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) throw new HttpError(400, "Photo must be a JPEG, PNG or WebP image.");
  const data = Buffer.from(m[2], "base64");
  if (data.length > 450_000) throw new HttpError(413, "Photo is too large. Try a smaller image.");
  return { mime: m[1], data };
}

export function createReport(user: SessionUser, input: NewReport): { report: ReportView; merged: boolean } {
  const state = db();
  const photo = input.photo ? parsePhoto(input.photo) : null; // validate before anything else
  const point: LatLng = [input.lat, input.lng];
  const hit = nearestRoad(point);
  if (hit.distance > 120) {
    throw new HttpError(422, "That spot is too far from any campus road. Tap closer to a road on the map.");
  }

  // Duplicate check: same category, still unresolved, within 30 m. Treated as a confirmation.
  const dup = [...state.reports.values()].find(
    (r) => r.category === input.category && r.status !== "resolved" && haversine(point, [r.lat, r.lng]) < 30,
  );
  if (dup) {
    dup.votes[user.id] = "exists";
    dup.updatedAt = Date.now();
    return { report: toView(dup, user.id), merged: true };
  }

  const detection = photo && input.category === "pothole" ? simulateDetection(photo.data) : null;
  const id = `NN-${String(++state.seq).padStart(4, "0")}`;
  const now = Date.now();
  const rec: ReportRecord = {
    id,
    title: `${CATEGORIES[input.category].short} on ${hit.roadName}`,
    category: input.category,
    description: input.description,
    roadId: hit.roadId,
    lat: input.lat,
    lng: input.lng,
    severity: detection?.severity ?? IMPACT_SEVERITY[input.impact],
    status: "open",
    createdAt: now,
    updatedAt: now,
    reporterId: user.id,
    votes: { [user.id]: "exists" },
    photo,
    detection,
  };
  state.reports.set(id, rec);
  return { report: toView(rec, user.id), merged: false };
}

export function castVote(user: SessionUser, id: string, vote: Vote): ReportView {
  const r = db().reports.get(id);
  if (!r) throw new HttpError(404, "Report not found.");
  if (r.status === "resolved") throw new HttpError(409, "This report is already resolved.");
  r.votes[user.id] = vote;
  r.updatedAt = Date.now();
  return toView(r, user.id);
}

export function setStatus(id: string, status: Status): ReportView {
  const r = db().reports.get(id);
  if (!r) throw new HttpError(404, "Report not found.");
  r.status = status;
  r.updatedAt = Date.now();
  return toView(r);
}

export type { Role };
