import { handle, json } from "@/lib/http";
import { endSession } from "@/lib/auth";

export const POST = handle(async () => {
  await endSession();
  return json({ ok: true });
});
