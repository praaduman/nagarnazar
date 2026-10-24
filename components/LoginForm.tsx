"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/client";
import { useAuth } from "./AuthProvider";
import type { SessionUser } from "@/lib/types";

const DEMO = [
  { label: "Student", email: "student@adypu.demo", hint: "Report issues, confirm or mark fixed" },
  { label: "Admin", email: "admin@adypu.demo", hint: "Dashboard, change report status" },
];

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const { refresh } = useAuth();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { user } = await api<{ user: SessionUser }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      await refresh();
      const next = params.get("next");
      const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
      router.push(safeNext ?? (user.role === "admin" ? "/dashboard" : "/report"));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-grid">
      <form className="form-card" onSubmit={submit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="pw">Password</label>
          <input id="pw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? "Logging in" : "Log in"}</button>
      </form>

      <div className="form-card">
        <h3>Demo accounts</h3>
        <p className="muted">Both use the password <b>demo1234</b>. Pick one to fill the form.</p>
        <div className="demo-list">
          {DEMO.map((d) => (
            <button key={d.email} type="button" className="demo-acct" onClick={() => { setEmail(d.email); setPassword("demo1234"); }}>
              <b>{d.label}</b>
              <span>{d.email}</span>
              <small>{d.hint}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
