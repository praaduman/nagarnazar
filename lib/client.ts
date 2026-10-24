"use client";
import { useCallback, useEffect, useState } from "react";
import type { ReportView, RoadView } from "./types";

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Request failed");
  return data as T;
}

/** Roads and reports for the map, refreshed every 20 seconds and on demand. */
export function useCampusData(pollMs = 20000) {
  const [roads, setRoads] = useState<RoadView[]>([]);
  const [reports, setReports] = useState<ReportView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const [r, p] = await Promise.all([
        api<{ roads: RoadView[] }>("/api/roads"),
        api<{ reports: ReportView[] }>("/api/reports"),
      ]);
      setRoads(r.roads);
      setReports(p.reports);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load map data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
    const t = setInterval(reload, pollMs);
    return () => clearInterval(t);
  }, [reload, pollMs]);

  return { roads, reports, loading, error, reload };
}
