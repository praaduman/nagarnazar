import type { Status } from "./types";

export function timeAgo(ts: number): string {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return `${d} day${d > 1 ? "s" : ""} ago`;
}

export const STATUS_LABEL: Record<Status, string> = { open: "Open", in_progress: "In Progress", resolved: "Resolved" };
export const STATUS_CLASS: Record<Status, string> = { open: "st-open", in_progress: "st-prog", resolved: "st-res" };
