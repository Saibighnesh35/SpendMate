"use client";
import Link from "next/link";
import { useState } from "react";

export default function Page() {
  const [sent, setSent] = useState(false);
  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}><div className="card" style={{ width: "min(100%,430px)", padding: 32 }}>
    <Link href="/" style={{ fontWeight: 800 }}>spend<span style={{ color: "var(--brand)" }}>mate</span></Link>
    <h1 className="page-title" style={{ fontSize: "2rem", marginTop: 30 }}>Reset password</h1>
    <p className="muted">Enter your email and we’ll send a reset link when Supabase authentication is configured.</p>
    {sent ? <p style={{ padding: 13, borderRadius: 10, background: "var(--brand-soft)" }}>If that address is registered, a reset link is on its way.</p> : <form onSubmit={(event) => { event.preventDefault(); setSent(true); }}><input className="field" type="email" required placeholder="you@example.com" /><button className="btn btn-primary" style={{ width: "100%", marginTop: 14 }}>Send reset link</button></form>}
    <Link href="/login" style={{ display: "block", marginTop: 20, color: "var(--brand)", fontWeight: 700, fontSize: ".88rem" }}>← Back to log in</Link>
  </div></main>;
}
