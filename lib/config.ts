import type { LatLng } from "./types";

// Campus centre (from public coordinates for ADYPU, Lohegaon). Tweak freely.
export const CAMPUS = {
  name: "Ajeenkya DY Patil University",
  area: "Lohegaon, Pune",
  center: [18.621, 73.9118] as LatLng,
  zoom: 17,
};

// Dark basemap built on OpenStreetMap data. Swap the URL to change the look.
export const TILES = {
  url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
};

export const PROJECT = {
  name: "NagarNazar",
  tagline: "Community-Powered Road Intelligence & Campus Issue Reporting Platform",
  team: ["Praduman Singh", "Dhiraj Mahajan", "Praglbh Singh", "Shobhit Kumar"],
  guide: "Dr. B.K.C. Ganesh",
};
