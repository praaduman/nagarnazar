import { handle, json } from "@/lib/http";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const GET = handle(async () => json({ user: await getSession() }));
