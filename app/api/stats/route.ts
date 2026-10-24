import { handle, json } from "@/lib/http";
import { stats } from "@/lib/store";

export const dynamic = "force-dynamic";

export const GET = handle(async () => json(stats()));
