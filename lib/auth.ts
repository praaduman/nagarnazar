import crypto from "node:crypto";
import { cookies } from "next/headers";
import type { Role, SessionUser } from "./types";
import { getUser } from "./store";
import { HttpError } from "./http";

const COOKIE = "nn_session";
const TTL_SECONDS = 60 * 60 * 8;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set in production. See .env.example.");
  }
  return "dev-only-secret-do-not-use-in-production";
}

const sign = (payload: string) => crypto.createHmac("sha256", secret()).update(payload).digest("base64url");

function createToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: Date.now() + TTL_SECONDS * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function readToken(token: string): string | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
  try {
    const { uid, exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof uid === "string" && typeof exp === "number" && exp > Date.now() ? uid : null;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  const uid = token ? readToken(token) : null;
  return uid ? getUser(uid) : null;
}

export async function startSession(user: SessionUser) {
  (await cookies()).set(COOKIE, createToken(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_SECONDS,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function requireUser(role?: Role): Promise<SessionUser> {
  const user = await getSession();
  if (!user) throw new HttpError(401, "Please log in first.");
  if (role && user.role !== role) throw new HttpError(403, "You don't have access to this.");
  return user;
}
