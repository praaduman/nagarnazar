import { z } from "zod";
import { handle, json, HttpError } from "@/lib/http";
import { roadScores } from "@/lib/store";
import { findRoute } from "@/lib/graph";

export const dynamic = "force-dynamic";

const schema = z.object({
  from: z.string(),
  to: z.string(),
  speed: z.enum(["walk", "ride"]).default("walk"),
});

export const GET = handle(async (req: Request) => {
  const sp = new URL(req.url).searchParams;
  const { from, to, speed } = schema.parse({
    from: sp.get("from") ?? "",
    to: sp.get("to") ?? "",
    speed: sp.get("speed") ?? undefined,
  });
  if (from === to) throw new HttpError(400, "Pick two different places.");
  const scores = roadScores();
  const fast = findRoute(from, to, "fast", speed, scores);
  const safe = findRoute(from, to, "safe", speed, scores);
  if (!fast || !safe) throw new HttpError(404, "No route between those places.");
  return json({ fast, safe });
});
