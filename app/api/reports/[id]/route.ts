import { z } from "zod";
import { handle, json, readJson } from "@/lib/http";
import { getReport, setStatus } from "@/lib/store";
import { getSession, requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export const GET = handle(async (_req: Request, { params }: Ctx) => {
  const { id } = await params;
  const user = await getSession();
  return json({ report: getReport(id, user?.id) });
});

const patchSchema = z.object({ status: z.enum(["open", "in_progress", "resolved"]) });

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  await requireUser("admin");
  const { id } = await params;
  const { status } = patchSchema.parse(await readJson(req));
  return json({ report: setStatus(id, status) });
});
