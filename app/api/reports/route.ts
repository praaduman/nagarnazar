import { z } from "zod";
import { handle, json, readJson } from "@/lib/http";
import { createReport, listReports } from "@/lib/store";
import { getSession, requireUser } from "@/lib/auth";
import { CATEGORY_IDS } from "@/lib/categories";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: Request) => {
  const sp = new URL(req.url).searchParams;
  const filter = z
    .object({
      status: z.enum(["open", "in_progress", "resolved"]).optional(),
      category: z.enum(CATEGORY_IDS as [string, ...string[]]).optional(),
      roadId: z.string().optional(),
    })
    .parse({
      status: sp.get("status") ?? undefined,
      category: sp.get("category") ?? undefined,
      roadId: sp.get("roadId") ?? undefined,
    });
  const user = await getSession();
  return json({ reports: listReports(user?.id, filter as never) });
});

const createSchema = z.object({
  category: z.enum(CATEGORY_IDS as [string, ...string[]]),
  description: z.string().trim().max(500, "Notes can be up to 500 characters.").default(""),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  impact: z.enum(["minor", "moderate", "severe"]),
  photo: z.string().max(650_000).optional(),
});

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const input = createSchema.parse(await readJson(req));
  const result = createReport(user, input as never);
  return json(result, result.merged ? 200 : 201);
});
