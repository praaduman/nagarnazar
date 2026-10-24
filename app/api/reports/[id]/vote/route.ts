import { z } from "zod";
import { handle, json, readJson } from "@/lib/http";
import { castVote } from "@/lib/store";
import { requireUser } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };
const schema = z.object({ vote: z.enum(["exists", "fixed"]) });

export const POST = handle(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const { vote } = schema.parse(await readJson(req));
  return json({ report: castVote(user, id, vote) });
});
