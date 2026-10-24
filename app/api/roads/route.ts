import { handle, json } from "@/lib/http";
import { listRoads } from "@/lib/store";

export const dynamic = "force-dynamic";

export const GET = handle(async () => json({ roads: listRoads() }));
