"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  BarChart3,
  CirclePlus,
  House,
  ReceiptText,
  Settings,
} from "lucide-react";
import { useSpendMate } from "./demo-provider";

const links = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/transactions", label: "Transactions", icon: ReceiptText },
  { href: "/add", label: "Add", icon: CirclePlus },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/settings", label: "Profile", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { user } = useSpendMate();

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <>
      <header
        style={{
          background: "#fff",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div
          className="shell"
          style={{
            paddingTop: 14,
            paddingBottom: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href="/dashboard"
            style={{
              fontWeight: 800,
              fontSize: "1.2rem",
              letterSpacing: "-.04em",
            }}
          >
            spend<span style={{ color: "var(--brand)" }}>mate</span>
          </Link>

          <nav
            className="desktop-nav"
            style={{ display: "flex", gap: 6 }}
          >
            {links.map(({ href, label }) => (
              <Link
                key={href}
                className={`nav-link ${path === href ? "active" : ""}`}
                href={href}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div
            className="desktop-nav"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
            }}
          >
            <span className="muted" style={{ fontSize: ".9rem" }}>
              {user.name}
            </span>

            <button
              className="btn btn-secondary"
              style={{
                padding: "8px 10px",
                fontSize: ".8rem",
              }}
              onClick={() => router.push("/settings")}
            >
              Settings
            </button>
          </div>
        </div>
      </header>

      <main className="shell">{children}</main>

      <nav
        className="mobile-nav"
        style={{
          position: "fixed",
          zIndex: 10,
          bottom: 0,
          left: 0,
          right: 0,
          justifyContent: "space-around",
          padding: "9px 5px calc(9px + env(safe-area-inset-bottom))",
          background: "#fff",
          borderTop: "1px solid var(--line)",
        }}
      >
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            style={{
              display: "grid",
              placeItems: "center",
              gap: 3,
              color: path === href ? "var(--brand)" : "var(--muted)",
              fontSize: ".68rem",
              fontWeight: 700,
            }}
          >
            <Icon size={path === href ? 23 : 20} />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}