import { z } from "zod";
import { handle, json, readJson, HttpError } from "@/lib/http";
import { authenticate } from "@/lib/store";
import { startSession } from "@/lib/auth";

const schema = z.object({ email: z.string().min(3, "Enter your email."), password: z.string().min(1, "Enter your password.") });

export const POST = handle(async (req: Request) => {
  const { email, password } = schema.parse(await readJson(req));
  const user = authenticate(email, password);
  if (!user) throw new HttpError(401, "Email or password is incorrect.");
  await startSession(user);
  return json({ user });
});
