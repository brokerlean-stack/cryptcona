"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Mail, Loader2, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function ForgotPasswordContent() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to send reset link.");
      }
    } catch (err) {
      setError("Unable to connect to the account service.");
    }
    setLoading(false);
  };

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
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-brand-mint transition-colors mb-8 text-sm font-bold tracking-normal"
          >
            <ArrowLeft size={16} /> Back to Login
          </Link>
          <h1 className="text-4xl font-semibold mb-2 tracking-normal">
            Account <br />
            <span className="brand-text">Reset</span>
          </h1>
          <p className="text-zinc-500 font-medium">
            Verify your email to recover access.
          </p>
        </div>

        <div className="glass p-10 md:p-12 rounded-lg border-white/5 shadow-2xl">
          {success ? (
            <div className="text-center space-y-6 py-4">
              <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-500">
                <CheckCircle size={40} />
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-2">
                  Check Your Inbox
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  If an account exists for{" "}
                  <span className="text-white font-bold">{email}</span>, you
                  will receive a password reset link shortly.
                </p>
              </div>
              <Link
                href="/login"
                className="block w-full py-4 rounded-lg bg-white/5 border border-white/10 text-sm font-semibold tracking-normal hover:bg-white/10 transition-all"
              >
                Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-center text-xs font-bold tracking-normal">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-zinc-500 tracking-normal px-1">
                  Email address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center text-zinc-600 group-focus-within:text-brand-mint transition-colors">
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@company.com"
                    className="w-full bg-[#1a211e] border border-white/5 rounded-lg py-5 pl-14 pr-6 text-sm font-medium focus:outline-none focus:border-brand-mint/30 focus:ring-1 focus:ring-brand-mint/30 transition-all placeholder:text-zinc-700"
                  />
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
                  "Send Reset Link"
                )}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
