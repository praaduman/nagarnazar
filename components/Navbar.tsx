"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

const LINKS = [
  { href: "/map", label: "Road Health Map" },
  { href: "/report", label: "Report an Issue" },
  { href: "/saferoute", label: "SafeRoute" },
];

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const links = [...LINKS];
  if (user?.role === "admin") links.push({ href: "/dashboard", label: "Dashboard" });
  if (user?.role === "student") links.push({ href: "/my-reports", label: "My Reports" });

  return (
    <header className="site-header">
      <div className="wrap">
        <nav className="nav" aria-label="Main">
          <Link href="/" className="logo">
            <span className="dot" />
            NagarNazar
          </Link>
          <ul className="navlinks">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} aria-current={pathname === l.href ? "page" : undefined} className={pathname === l.href ? "on" : ""}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="navcta">
            {loading ? null : user ? (
              <>
                <span className="who" title={user.email}>
                  {user.name}
                  <small>{user.role}</small>
                </span>
                <button
                  className="btn btn-ghost"
                  onClick={async () => {
                    await logout();
                    router.push("/");
                    router.refresh();
                  }}
                >
                  Log out
                </button>
              </>
            ) : (
              <Link href="/login" className="btn btn-ghost">
                Log in
              </Link>
            )}
            <Link href="/report" className="btn btn-primary">
              Report Issue
            </Link>
          </div>
        </nav>
        <ul className="navlinks-mobile">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className={pathname === l.href ? "on" : ""}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
