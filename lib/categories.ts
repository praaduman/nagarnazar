import type { CategoryId, Impact } from "./types";

export const CATEGORIES: Record<
  CategoryId,
  { label: string; short: string; department: string; weight: number }
> = {
  pothole: { label: "Pothole / Road Damage", short: "Road damage", department: "Civil & Maintenance", weight: 1 },
  safety: { label: "Public Safety Hazard", short: "Safety hazard", department: "Campus Security", weight: 0.8 },
  streetlight: { label: "Broken Streetlight", short: "Streetlight out", department: "Electrical Section", weight: 0.5 },
  property: { label: "Damaged Public Property", short: "Damaged property", department: "Estate Office", weight: 0.4 },
  waste: { label: "Overflowing Waste Bin", short: "Waste bin", department: "Housekeeping", weight: 0.3 },
  environment: { label: "Environment", short: "Environment", department: "Horticulture & Environment Cell", weight: 0.2 },
};

export const CATEGORY_IDS = Object.keys(CATEGORIES) as CategoryId[];

export const IMPACT_SEVERITY: Record<Impact, number> = { minor: 3, moderate: 6, severe: 9 };
