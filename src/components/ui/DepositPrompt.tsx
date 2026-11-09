"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

interface DepositPromptProps {
  balance: number;
  currency: string;
}

// Currency symbols map
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  BRL: "R$",
  ZAR: "R",
  MAD: "MAD",
  CAD: "C$",
  AUD: "A$",
  CHF: "CHF",
  INR: "₹",
  SGD: "S$",
  HKD: "HK$",
  NZD: "NZ$",
  KRW: "₩",
  MXN: "$",
  SAR: "﷼",
  AED: "د.إ",
  THB: "฿",
  VND: "₫",
  MYR: "RM",
  IDR: "Rp",
  TRY: "₺",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  PLN: "zł",
  RUB: "₽",
  ARS: "$",
  CLP: "$",
  COP: "$",
  PEN: "S/",
  UYU: "$",
  PAB: "B/.",
  CRC: "₡",
  JMD: "J$",
  PHP: "₱",
  TWD: "NT$",
  ILS: "₪",
  KWD: "د.ك",
  BHD: ".د.ب",
  QAR: "﷼",
  HUF: "Ft",
  CZK: "Kč",
  RON: "lei",
  BGN: "лв",
  HRK: "kn",
  ISK: "kr",
  BTC: "₿",
  NGN: "₦",
  GHS: "GH₵",
  KES: "Ksh",
  UGX: "USh",
  EGP: "E£",
  DZD: "DA",
  TND: "DT",
};

export default function DepositPrompt({
  balance,
  currency,
}: DepositPromptProps) {
  const [visible, setVisible] = useState(false);
  const [targetAmount, setTargetAmount] = useState<string>("500");
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user already dismissed this session
    const wasDismissed = sessionStorage.getItem("deposit_prompt_dismissed");
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    const symbol = CURRENCY_SYMBOLS[currency] || currency + " ";
    setCurrencySymbol(symbol);

    // Fetch exchange rate if not USD
    const fetchRate = async () => {
      try {
        if (currency === "USD") {
          setTargetAmount("500");
        } else {
          const res = await fetch(
            `https://api.exchangerate-api.com/v4/latest/USD`,
          );
          const data = await res.json();
          const rate = data.rates?.[currency];
          if (rate) {
            const converted = Math.ceil(500 * rate);
            setTargetAmount(converted.toLocaleString());
          } else {
            setTargetAmount("500");
            setCurrencySymbol("$");
          }
        }
      } catch {
        setTargetAmount("500");
        setCurrencySymbol("$");
      }

      // Show prompt after a 3-second delay (not instant — less annoying)
      setTimeout(() => {
        setVisible(true);
      }, 3000);
    };

    // Only show if balance < 500 USD equivalent
    if (balance < 500) {
      fetchRate();
    }
  }, [balance, currency]);

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem("deposit_prompt_dismissed", "true");
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-6 right-6 z-[70] max-w-[380px] w-full"
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <div
            className="relative rounded-lg p-6 border border-brand-mint/20 overflow-hidden shadow-2xl"
            style={{
              background:
                "linear-gradient(135deg, #0d1a2e 0%, #0a1225 50%, #0d1a2e 100%)",
            }}
          >
            {/* Glow effect */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-brand-mint/10 blur-3xl -z-10 rounded-full" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-purple/20 blur-3xl -z-10 rounded-full" />

            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
            >
              <X size={14} className="text-zinc-500" />
            </button>

            {/* Icon */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-brand-mint/10 border border-brand-mint/20 flex items-center justify-center">
                <Gift size={24} className="text-brand-mint" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold tracking-normal text-brand-mint">
                    Limited Offer
                  </span>
                  <Sparkles
                    size={12}
                    className="text-brand-mint animate-pulse"
                  />
                </div>
                <p className="text-xs text-zinc-500 font-medium">
                  Exclusive for new traders
                </p>
              </div>
            </div>

            {/* Offer */}
            <h3 className="text-xl font-semibold mb-2 leading-tight">
              Deposit {currencySymbol}
              {targetAmount} & Get{" "}
              <span className="brand-text">500% Bonus</span>
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-5">
              Fund your account now and receive 5x your deposit as trading
              bonus. Start trading with a massive advantage.
            </p>

            {/* CTA */}
            <Link
              href="/dashboard/wallet"
              onClick={handleDismiss}
              className="primary-button w-full py-4 rounded-lg flex items-center justify-center gap-3 text-sm font-semibold tracking-normal shadow-xl shadow-brand-mint/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Claim Bonus Now
              <ArrowRight size={18} />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
