"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Loader2, CheckCircle, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="glass p-10 text-center space-y-6 rounded-lg border-white/5 shadow-2xl">
        <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-500">
          <ShieldAlert size={40} />
        </div>
        <h3 className="text-2xl font-semibold">Invalid Link</h3>
        <p className="text-zinc-400 text-sm">
          This reset link is missing or malformed.
        </p>
        <Link
          href="/forgot-password"
          title="Return to password recovery"
          className="block w-full py-4 rounded-lg bg-white/5 border border-white/10 text-sm font-semibold tracking-normal hover:bg-white/10 transition-all text-white no-underline"
        >
          Request New Link
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setError(data.error || "Failed to reset password.");
      }
    } catch (err) {
      setError("Unable to connect to the account service.");
    }
    setLoading(false);
  };

  return (
    <div className="glass p-10 md:p-12 rounded-lg border-white/5 shadow-2xl">
      {success ? (
        <div className="text-center space-y-6 py-4">
          <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-500">
            <CheckCircle size={40} />
          </div>
          <div>
            <h3 className="text-2xl font-semibold mb-2">Password Updated</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Your account credentials have been updated. Redirecting to
              login...
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-center text-xs font-bold tracking-normal">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-zinc-500 tracking-normal px-1">
                New Secure Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-5 flex items-center text-zinc-600 group-focus-within:text-brand-mint transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-[#1a211e] border border-white/5 rounded-lg py-5 pl-14 pr-6 text-sm font-medium focus:outline-none focus:border-brand-mint/30 focus:ring-1 focus:ring-brand-mint/30 transition-all placeholder:text-zinc-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-zinc-500 tracking-normal px-1">
                Confirm Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-5 flex items-center text-zinc-600 group-focus-within:text-brand-mint transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-[#1a211e] border border-white/5 rounded-lg py-5 pl-14 pr-6 text-sm font-medium focus:outline-none focus:border-brand-mint/30 focus:ring-1 focus:ring-brand-mint/30 transition-all placeholder:text-zinc-700"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="primary-button w-full h-16 rounded-lg flex items-center justify-center gap-3 text-lg group shadow-2xl shadow-brand-mint/20 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={22} />
            ) : (
              "Update Credentials"
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-purple/20 blur-[150px] -z-10 rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-mint/10 blur-[150px] -z-10 rounded-full" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl font-semibold mb-2 tracking-normal">
            Access <br />
            <span className="brand-text">Recovery</span>
          </h1>
          <p className="text-zinc-500 font-medium">
            Create a new secure trading key.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="glass p-20 flex flex-col items-center justify-center rounded-lg border-white/5 shadow-2xl">
              <Loader2
                className="animate-spin text-brand-mint mb-4"
                size={40}
              />
              <p className="text-zinc-500 font-bold tracking-normal text-[10px]">
                Initializing...
              </p>
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
