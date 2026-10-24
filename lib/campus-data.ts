import type { LatLng } from "./types";

/**
 * Demo road network. These coordinates are approximate placeholders around the
 * campus centre. To match real roads, click the map in the Report form (it shows
 * lat/lng) and paste the real values here. Nothing else needs to change.
 */
export const NODES: Record<string, { name?: string; ll: LatLng }> = {
  gate: { name: "Main Gate", ll: [18.6188, 73.9098] },
  j1: { ll: [18.6202, 73.9112] },
  admin: { name: "Admin Block", ll: [18.6196, 73.9128] },
  j2: { ll: [18.6214, 73.9126] },
  library: { name: "Library", ll: [18.6222, 73.9138] },
  canteen: { name: "Canteen", ll: [18.6208, 73.9142] },
  sports: { name: "Sports Complex", ll: [18.6204, 73.916] },
  j3: { ll: [18.623, 73.9112] },
  hostel: { name: "Hostels", ll: [18.6242, 73.91] },
  j4: { ll: [18.6232, 73.915] },
};

export interface RoadDef {
  id: string;
  name: string;
  exposure: number; // how busy the road is (feeds the quality index)
  edges: [string, string][];
}

export const ROADS: RoadDef[] = [
  { id: "gate-road", name: "Gate Road", exposure: 1.3, edges: [["gate", "j1"], ["j1", "j2"]] },
  { id: "hostel-link-road", name: "Hostel Link Road", exposure: 1.2, edges: [["j3", "j1"]] },
  { id: "hostel-approach", name: "Hostel Approach", exposure: 1.0, edges: [["hostel", "j3"]] },
  { id: "north-lane", name: "North Lane", exposure: 0.8, edges: [["j3", "j2"]] },
  { id: "library-bypass", name: "Library Bypass", exposure: 1.0, edges: [["j2", "library"], ["library", "j4"], ["j2", "canteen"]] },
  { id: "admin-block-road", name: "Admin Block Road", exposure: 0.9, edges: [["j1", "admin"], ["admin", "canteen"]] },
  { id: "sports-complex-road", name: "Sports Complex Road", exposure: 1.0, edges: [["canteen", "sports"], ["sports", "j4"]] },
];

export const PLACES = Object.entries(NODES)
  .filter(([, n]) => n.name)
  .map(([id, n]) => ({ id, name: n.name as string }));

export const roadPaths = (r: RoadDef): LatLng[][] =>
  r.edges.map(([a, b]) => [NODES[a].ll, NODES[b].ll]);
