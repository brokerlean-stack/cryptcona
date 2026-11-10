"use client";
import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { ArrowRight, Loader2 } from "lucide-react";
import Brand from "@/components/layout/Brand";
import Demo from "@/components/Demo";
const COUNTRIES = [
  { label: "United States", value: "US" },
  { label: "United Kingdom", value: "GB" },
  { label: "South Africa", value: "ZA" },
  { label: "Morocco", value: "MA" },
  { label: "Germany", value: "DE" },
  { label: "France", value: "FR" },
  { label: "Italy", value: "IT" },
  { label: "Spain", value: "ES" },
  { label: "Canada", value: "CA" },
  { label: "Mexico", value: "MX" },
  { label: "Brazil", value: "BR" },
  { label: "Argentina", value: "AR" },
  { label: "Japan", value: "JP" },
  { label: "China", value: "CN" },
  { label: "India", value: "IN" },
  { label: "South Korea", value: "KR" },
  { label: "Singapore", value: "SG" },
  { label: "Australia", value: "AU" },
  { label: "New Zealand", value: "NZ" },
  { label: "Netherlands", value: "NL" },
  { label: "Switzerland", value: "CH" },
  { label: "Sweden", value: "SE" },
  { label: "Norway", value: "NO" },
  { label: "Portugal", value: "PT" },
  { label: "Austria", value: "AT" },
  { label: "Belgium", value: "BE" },
  { label: "Greece", value: "GR" },
  { label: "Poland", value: "PL" },
  { label: "Ireland", value: "IE" },
  { label: "Denmark", value: "DK" },
  { label: "Finland", value: "FI" },
  { label: "Czech Republic", value: "CZ" },
  { label: "Hungary", value: "HU" },
  { label: "United Arab Emirates", value: "AE" },
  { label: "Saudi Arabia", value: "SA" },
  { label: "Qatar", value: "QA" },
  { label: "Turkey", value: "TR" },
  { label: "Israel", value: "IL" },
  { label: "Malaysia", value: "MY" },
  { label: "Indonesia", value: "ID" },
  { label: "Thailand", value: "TH" },
  { label: "Vietnam", value: "VN" },
  { label: "Philippines", value: "PH" },
  { label: "Chile", value: "CL" },
  { label: "Colombia", value: "CO" },
  { label: "Peru", value: "PE" },
  { label: "Panama", value: "PA" },
  { label: "Costa Rica", value: "CR" },
  { label: "Iceland", value: "IS" },
  { label: "Russia", value: "RU" },
  { label: "Ukraine", value: "UA" },
].sort((a, b) => a.label.localeCompare(b.label));

const CURRENCIES = [
  { label: "US Dollar (USD)", value: "USD" },
  { label: "Euro (EUR)", value: "EUR" },
  { label: "British Pound (GBP)", value: "GBP" },
  { label: "Brazilian Real (BRL)", value: "BRL" },
  { label: "South African Rand (ZAR)", value: "ZAR" },
  { label: "Moroccan Dirham (MAD)", value: "MAD" },
  { label: "Japanese Yen (JPY)", value: "JPY" },
  { label: "Canadian Dollar (CAD)", value: "CAD" },
  { label: "Australian Dollar (AUD)", value: "AUD" },
  { label: "Swiss Franc (CHF)", value: "CHF" },
  { label: "Chinese Yuan (CNY)", value: "CNY" },
  { label: "Indian Rupee (INR)", value: "INR" },
  { label: "Singapore Dollar (SGD)", value: "SGD" },
  { label: "Hong Kong Dollar (HKD)", value: "HKD" },
  { label: "New Zealand Dollar (NZD)", value: "NZD" },
  { label: "Korean Won (KRW)", value: "KRW" },
  { label: "Mexican Peso (MXN)", value: "MXN" },
  { label: "Saudi Riyal (SAR)", value: "SAR" },
  { label: "UAE Dirham (AED)", value: "AED" },
  { label: "Thai Baht (THB)", value: "THB" },
  { label: "Vietnamese Dong (VND)", value: "VND" },
  { label: "Malaysian Ringgit (MYR)", value: "MYR" },
  { label: "Indonesian Rupiah (IDR)", value: "IDR" },
  { label: "Turkish Lira (TRY)", value: "TRY" },
  { label: "Swedish Krona (SEK)", value: "SEK" },
  { label: "Norwegian Krone (NOK)", value: "NOK" },
  { label: "Danish Krone (DKK)", value: "DKK" },
  { label: "Polish Zloty (PLN)", value: "PLN" },
  { label: "Russian Ruble (RUB)", value: "RUB" },
  { label: "Argentine Peso (ARS)", value: "ARS" },
  { label: "Chilean Peso (CLP)", value: "CLP" },
  { label: "Colombian Peso (COP)", value: "COP" },
  { label: "Peruvian Sol (PEN)", value: "PEN" },
  { label: "Uruguayan Peso (UYU)", value: "UYU" },
  { label: "Panamanian Balboa (PAB)", value: "PAB" },
  { label: "Costa Rican Colon (CRC)", value: "CRC" },
  { label: "Jamaican Dollar (JMD)", value: "JMD" },
  { label: "Philippine Peso (PHP)", value: "PHP" },
  { label: "New Taiwan Dollar (TWD)", value: "TWD" },
  { label: "Israeli Shekel (ILS)", value: "ILS" },
  { label: "Kuwaiti Dinar (KWD)", value: "KWD" },
  { label: "Bahraini Dinar (BHD)", value: "BHD" },
  { label: "Qatari Riyal (QAR)", value: "QAR" },
  { label: "Hungarian Forint (HUF)", value: "HUF" },
  { label: "Czech Koruna (CZK)", value: "CZK" },
  { label: "Romanian Leu (RON)", value: "RON" },
  { label: "Bulgarian Lev (BGN)", value: "BGN" },
  { label: "Croatian Kuna (HRK)", value: "HRK" },
  { label: "Icelandic Krona (ISK)", value: "ISK" },
  { label: "Bitcoin (BTC)", value: "BTC" },
].sort((a, b) => a.label.localeCompare(b.label));

export default function RegisterContent() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "",
    currency: "",
    profitGoal: "",
    acceptTerms: false,
  });
  const [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Unable to create your account.");
      const login = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      window.location.href = login?.error ? "/login" : "/dashboard/trading";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to connect.");
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
            Your next chapter
            <br />
            starts here.
          </h2>
          <p>
            Create your Cryptcona account and bring your trading activity into
            focus.
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
          <p className="cc-kicker">GET STARTED</p>
          <h1>Create your account</h1>
          <p>Your details. Your workspace.</p>
          <form onSubmit={submit}>
            {error && (
              <div role="alert" className="cc-error">
                {error}
              </div>
            )}
            {(
              [
                { key: "name", label: "Full name", type: "text" },
                { key: "email", label: "Email address", type: "email" },
                { key: "password", label: "Password", type: "password" },
                {
                  key: "confirmPassword",
                  label: "Confirm password",
                  type: "password",
                },
              ] as const
            ).map(({ key, label, type }) => (
              <label className="cc-field" key={key}>
                {label}
                <input
                  type={type}
                  required
                  minLength={type === "password" ? 8 : undefined}
                  autoComplete={
                    key === "name"
                      ? "name"
                      : key === "email"
                        ? "email"
                        : "new-password"
                  }
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </label>
            ))}
            <div className="grid grid-cols-2 gap-4">
              <label className="cc-field">
                Country
                <select
                  required
                  className="bg-card-bg p-3 rounded-md border border-white/20 min-w-0"
                  value={form.country}
                  onChange={(e) =>
                    setForm({ ...form, country: e.target.value })
                  }
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="cc-field">
                Currency
                <select
                  required
                  className="bg-card-bg p-3 rounded-md border border-white/20 min-w-0"
                  value={form.currency}
                  onChange={(e) =>
                    setForm({ ...form, currency: e.target.value })
                  }
                >
                  <option value="">Select currency</option>
                  {CURRENCIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="cc-field">
              Profit goal (optional, in your account currency)
              <input aria-label="Profit goal" type="number" min="0.01" max="1000000000000" step="0.01" value={form.profitGoal} onChange={e => setForm({...form, profitGoal:e.target.value})} placeholder="For example, 1000" />
            </label>
            <label className="flex gap-3 items-start text-xs text-zinc-400">
              <input
                type="checkbox"
                required
                checked={form.acceptTerms}
                onChange={e => setForm({...form, acceptTerms:e.target.checked})}
                className="mt-1 accent-emerald-400"
              />
              <span>I accept the <Link href="/terms" target="_blank" className="text-brand-mint underline">terms and conditions</Link>, including the optional goal disclosures. <Demo /></span>
            </label>
            <button disabled={loading} className="cc-button">
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Create account <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
          <p>
            Already registered?{" "}
            <Link href="/login" className="text-brand-mint">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
