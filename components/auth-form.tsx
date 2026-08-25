"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function AuthForm({
  mode,
}: {
  mode: "login" | "signup";
}) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (
        mode === "signup" &&
        !name.trim()
      ) {
        setError("Enter your name.");
        return;
      }

      if (
        !/^\S+@\S+\.\S+$/.test(
          email.trim()
        )
      ) {
        setError("Enter a valid email address.");
        return;
      }

      if (password.length < 6) {
        setError(
          "Use at least 6 characters for your password."
        );
        return;
      }

      if (mode === "signup") {
        const { data, error } =
          await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: {
                full_name: name.trim(),
              },
            },
          });

        if (error) {
          setError(error.message);
          return;
        }

        /*
         * Your Supabase project has email confirmation enabled.
         * Therefore a new user may not receive a session immediately.
         */
        if (!data.session) {
          setMessage(
            "Account created. Please check your email to confirm your account, then log in."
          );
          return;
        }

        router.replace("/dashboard");
        router.refresh();
        return;
      }

      const { error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) {
        setError(error.message);
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 20,
        background:
          "radial-gradient(circle at 10% 10%,#e6f7ed,transparent 32%)",
      }}
    >
      <form
        onSubmit={submit}
        className="card"
        style={{
          width: "min(100%,440px)",
          padding:
            "clamp(24px,5vw,38px)",
        }}
      >
        <Link
          href="/"
          style={{
            fontWeight: 800,
            fontSize: "1.2rem",
            letterSpacing: "-.04em",
          }}
        >
          spend
          <span style={{ color: "var(--brand)" }}>
            mate
          </span>
        </Link>

        <p
          className="eyebrow"
          style={{ marginTop: 31 }}
        >
          {mode === "signup"
            ? "Get started"
            : "Welcome back"}
        </p>

        <h1
          className="page-title"
          style={{ fontSize: "2rem" }}
        >
          {mode === "signup"
            ? "Start tracking today."
            : "Log in to SpendMate."}
        </h1>

        <p
          className="muted"
          style={{ lineHeight: 1.5 }}
        >
          {mode === "signup"
            ? "A focused place for your money in, money out, and monthly clarity."
            : "Continue your spending story."}
        </p>

        <div
          className="grid"
          style={{ marginTop: 22 }}
        >
          {mode === "signup" && (
            <label>
              <span className="label">
                Name
              </span>

              <input
                className="field"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Your name"
                autoComplete="name"
              />
            </label>
          )}

          <label>
            <span className="label">
              Email
            </span>

            <input
              className="field"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
            />
          </label>

          <label>
            <span className="label">
              Password
            </span>

            <input
              className="field"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="At least 6 characters"
              type="password"
              autoComplete={
                mode === "signup"
                  ? "new-password"
                  : "current-password"
              }
            />
          </label>
        </div>

        {error && (
          <p
            style={{
              color: "var(--danger)",
              fontSize: ".88rem",
            }}
          >
            {error}
          </p>
        )}

        {message && (
          <p
            style={{
              color: "var(--brand)",
              fontSize: ".88rem",
              lineHeight: 1.5,
            }}
          >
            {message}
          </p>
        )}

        <button
          className="btn btn-primary"
          style={{
            width: "100%",
            marginTop: 22,
          }}
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Please wait..."
            : mode === "signup"
              ? "Create account"
              : "Log in"}
        </button>

        {mode === "login" && (
          <Link
            href="/forgot-password"
            style={{
              display: "block",
              fontSize: ".86rem",
              color: "var(--brand)",
              fontWeight: 700,
              textAlign: "center",
              marginTop: 15,
            }}
          >
            Forgot password?
          </Link>
        )}

        <p
          className="muted"
          style={{
            fontSize: ".83rem",
            textAlign: "center",
            marginTop: 22,
          }}
        >
          {mode === "signup"
            ? "Already have an account?"
            : "New to SpendMate?"}{" "}
          <Link
            href={
              mode === "signup"
                ? "/login"
                : "/signup"
            }
            style={{
              color: "var(--brand)",
              fontWeight: 700,
            }}
          >
            {mode === "signup"
              ? "Log in"
              : "Create an account"}
          </Link>
        </p>
      </form>
    </main>
  );
}