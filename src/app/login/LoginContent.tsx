"use client";
import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import Brand from "@/components/layout/Brand";
export default function LoginContent() {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [show, setShow] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Unable to sign in. Check your credentials and try again.");
        return;
      }
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      window.location.href =
        session?.user?.role === "admin" ? "/admin" : "/dashboard/trading";
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="cc-auth">
      <section className="cc-auth-brand">
        <Brand />
        <div>
          <h2>
            Your markets.
            <br />
            Your next move.
          </h2>
          <p>
            One workspace for your portfolio, trading activity, and the
            conversations that matter.
          </p>
          <img
            className="cc-auth-photo"
            src="/trading-team.png"
            alt="Trading workspace"
          />
        </div>
        <p>Cryptcona Broker</p>
      </section>
      <section className="cc-auth-form">
        <div>
          <p className="cc-kicker">WELCOME BACK</p>
          <h1>Sign in to Cryptcona</h1>
          <p>Continue to your trading workspace.</p>
          <form onSubmit={submit}>
            {error && (
              <div role="alert" className="cc-error">
                {error}
              </div>
            )}
            <label className="cc-field">
              Email address
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>
            <label className="cc-field">
              Password
              <div className="relative">
                <input
                  style={{ paddingRight: 48 }}
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3"
                  aria-label={show ? "Hide password" : "Show password"}
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </label>
            <Link href="/forgot-password" className="text-sm text-brand-mint">
              Forgot your password?
            </Link>
            <button disabled={loading} className="cc-button">
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Sign in <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
          <p>
            New to Cryptcona?{" "}
            <Link href="/register" className="text-brand-mint">
              Create an account
            </Link>
          </p>
          <Link href="/" className="block mt-10 text-sm text-zinc-400">
            Back to website
          </Link>
        </div>
      </section>
    </main>
  );
}
