"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Loader2, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [timer, setTimer] = useState(180);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verified || loading) return;
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (res.ok) {
        setVerified(true);
        setSuccessMessage("IDENTITY VERIFIED. ENTERING TERMINAL...");
        window.location.href = "/dashboard/trading";
      } else {
        setError(data.error || "Verification failed");
        setLoading(false);
      }
    } catch (err) {
      setError("Unable to connect to the account service.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setResending(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMessage("A fresh code has been sent!");
        setTimer(180);
        setCanResend(false);
      } else {
        setError(data.error || "Resend failed");
      }
    } catch (err) {
      setError("Unable to connect to the account service.");
    }
    setResending(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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
          <div className="relative w-16 h-16 mx-auto mb-6 overflow-hidden rounded-lg border border-brand-mint/30 shadow-2xl">
            <Image
              src="/brand/cryptcona-mark.svg"
              alt="Logo"
              fill
              className="object-cover"
            />
          </div>
          <h1 className="text-4xl font-semibold mb-2 tracking-normal">
            Security <br />
            <span className="brand-text">Verification</span>
          </h1>
          <p className="text-zinc-500 font-medium text-sm">
            We&apos;ve sent a 6-digit code to <br />{" "}
            <span className="text-white font-bold">{email}</span>
          </p>
        </div>

        <form
          onSubmit={handleVerify}
          className="glass p-10 md:p-12 rounded-lg border-white/5 shadow-2xl space-y-8"
        >
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-center text-xs font-bold tracking-normal">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg text-center text-xs font-bold tracking-normal flex items-center justify-center gap-2">
              {verified && <CheckCircle size={16} />}
              {successMessage}
            </div>
          )}

          <div className="space-y-4">
            <label className="text-[10px] font-semibold text-zinc-500 tracking-normal block text-center">
              Enter 6-Digit Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              disabled={verified}
              className="w-full bg-[#1a211e] border border-white/5 rounded-lg py-6 text-center text-3xl font-semibold tracking-normal focus:outline-none focus:border-brand-mint/30 focus:ring-1 focus:ring-brand-mint/30 transition-all placeholder:text-zinc-800 text-white disabled:opacity-50"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || verified || code.length !== 6}
            className="primary-button w-full h-16 rounded-lg flex items-center justify-center gap-3 text-lg group shadow-2xl shadow-brand-mint/20 disabled:opacity-50"
          >
            {loading || verified ? (
              <>
                <Loader2 className="animate-spin" size={22} />{" "}
                {verified ? "Redirecting..." : "Verifying..."}
              </>
            ) : (
              <>
                Verify Account <ShieldCheck size={22} />
              </>
            )}
          </button>

          <div className="pt-6 border-t border-white/5 text-center">
            <p className="text-xs text-zinc-500 font-medium leading-relaxed">
              Didn&apos;t receive the code? Check your spam folder or <br />
              <button
                type="button"
                onClick={handleResend}
                disabled={!canResend || resending || verified}
                className={`font-bold transition-all mt-2 ${canResend && !verified ? "text-brand-mint hover:underline cursor-pointer" : "text-zinc-600 cursor-not-allowed"}`}
              >
                {resending ? (
                  <Loader2 className="animate-spin inline mr-2" size={14} />
                ) : null}
                {canResend ? "Resend Code" : `Resend in ${formatTime(timer)}`}
              </button>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
