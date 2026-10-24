# NagarNazar

Campus road intelligence and issue reporting for Ajeenkya DY Patil University, Lohegaon.
Next.js 15 (App Router) + TypeScript, Leaflet map on a dark OpenStreetMap basemap, and a demo backend built from Next.js route handlers.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

For a production build you must set a session secret:

```bash
cp .env.example .env.local     # then fill in SESSION_SECRET (openssl rand -base64 32)
npm run build && npm start
```

## Demo accounts (password `demo1234`)

| Role    | Email                | Can do                                              |
|---------|----------------------|-----------------------------------------------------|
| Student | student@adypu.demo   | Report issues, confirm "still exists" / "fixed"     |
| Admin   | admin@adypu.demo     | Dashboard, change report status                     |

## What works

- **Road health map**: roads coloured by a 0 to 100 quality score, report pins, category and road filters, report detail with photo and votes.
- **Report flow**: pick a spot on the map, attach a photo (resized in the browser), submit. Reports within 30 m of an open one of the same category merge into a confirmation. The category decides the department.
- **Scoring**: every report changes its road's score (severity, confirmations, freshness, traffic exposure, status). See `lib/drqi.ts`.
- **SafeRoute**: Dijkstra over the campus road graph. Fastest minimises time; SafeRoute makes bad surfaces cost up to 3.2x. Walk and Ride speeds. See `lib/graph.ts`.
- **Dashboard** (admin): road table, category counts, prioritised worklist with status changes that update the map live.
- **Auth**: signed, httpOnly, expiring session cookie; passwords hashed with scrypt; role checks on every mutating API route.

## What is simulated

- **YOLOv8 detection**: `simulateDetection` in `lib/store.ts` fakes a label, confidence and severity from the photo bytes. The UI labels it as a demo detector.
- **Image similarity** in duplicate checks: only GPS distance and category are used.
- **Persistence**: all data is in memory and resets when the server restarts.

## Making it real

- **Align the roads**: the road network in `lib/campus-data.ts` uses approximate coordinates. Click the map on the Report page, it prints lat/lng, and paste real values into `NODES`.
- **Database**: `lib/store.ts` is the only file that touches data. Re-implement its exported functions on PostgreSQL and nothing else changes. Move photos to object storage instead of the database.
- **Detection**: replace `simulateDetection` with a call to your YOLOv8 service.
- **Tiles**: the CARTO dark basemap is fine for a demo. For heavy use, pick a tile provider that fits the traffic. URL lives in `lib/config.ts`.

## Structure

```
app/            pages and API route handlers (/api/reports, /api/roads, /api/saferoute, /api/auth/*)
components/     CampusMap (Leaflet), MapExplorer, ReportForm, SafeRouteView, ReportsTable
lib/            store (demo data layer), drqi (scoring), graph (routing), auth, geo, campus-data
```
