export type LatLng = [number, number];
export type Role = "student" | "admin";
export type CategoryId =
  | "pothole"
  | "streetlight"
  | "waste"
  | "property"
  | "safety"
  | "environment";
export type Status = "open" | "in_progress" | "resolved";
export type Vote = "exists" | "fixed";
export type Impact = "minor" | "moderate" | "severe";
export type Band = "good" | "fair" | "poor" | "critical";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface RoadView {
  id: string;
  name: string;
  paths: LatLng[][];
  score: number;
  band: Band;
  activeReports: number;
  confirmations: number;
  worstStatus: Status | "clear";
}

export interface Detection {
  label: string;
  confidence: number;
  severity: number;
  simulated: true;
}

export interface ReportView {
  id: string;
  title: string;
  category: CategoryId;
  description: string;
  roadId: string;
  roadName: string;
  lat: number;
  lng: number;
  severity: number;
  status: Status;
  department: string;
  createdAt: number;
  updatedAt: number;
  confirmations: number;
  fixedVotes: number;
  hasPhoto: boolean;
  detection: Detection | null;
  mine: boolean;
  myVote: Vote | null;
  priority: number;
}

export interface RouteResult {
  coords: LatLng[];
  distanceM: number;
  durationMin: number;
  avgScore: number;
  roads: string[];
  worstRoad: { name: string; score: number } | null;
}
