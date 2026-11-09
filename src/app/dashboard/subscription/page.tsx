"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Zap,
  Check,
  ShieldCheck,
  Star,
  Crown,
  Gem,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";

const PLANS = [
  {
    priceKey: "basicVip",
    name: "Core",
    tier: "VIP 1",
    price: 500,
    icon: <Star className="text-blue-400" size={32} />,
    features: [
      "3 Daily VIP Signals",
      "Market updates",
      "Email Trade Alerts",
      "Standard Support",
    ],
    color: "blue",
  },
  {
    priceKey: "silverVip",
    name: "Plus",
    tier: "VIP 2",
    price: 750,
    icon: <ShieldCheck className="text-zinc-300" size={32} />,
    features: [
      "10 Daily VIP Signals",
      "Market updates",
      "SMS + Email Alerts",
      "Priority Support",
      "Account Growth Plan",
    ],
    color: "zinc",
  },
  {
    priceKey: "goldVip",
    name: "Pro",
    tier: "VIP 3",
    price: 2500,
    icon: <Crown className="text-brand-mint" size={32} />,
    features: [
      "Unlimited VIP Signals",
      "Market updates",
      "Real-time Logic Access",
      "Dedicated Manager",
      "VIP Trading Community",
    ],
    color: "gold",
    popular: true,
  },
  {
    priceKey: "diamondVip",
    name: "Private",
    tier: "VIP 4",
    price: 5000,
    icon: <Gem className="text-emerald-400" size={32} />,
    features: [
      "Market reports",
      "Market updates",
      "1-on-1 Mentorship",
      "Direct Support Line",
      "Exclusive Market Re-caps",
    ],
    color: "purple",
  },
];

export default function SubscriptionPage() {
  const { data: session }: any = useSession();
  const router = useRouter();
  const [currency, setCurrency] = useState("USD");
  const [rate, setRate] = useState(1);
  const [plans, setPlans] = useState(PLANS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const data = await res.json();
          const userCurr = data.user.currency || "USD";
          setCurrency(userCurr);

          if (userCurr !== "USD") {
            const rateRes = await fetch(
              `https://api.exchangerate-api.com/v4/latest/USD`,
            );
            const rateData = await rateRes.json();
            if (rateData.rates[userCurr]) {
              setRate(rateData.rates[userCurr]);
            }
          }
        }

        const settingsRes = await fetch("/api/settings/public");
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          setPlans(
            PLANS.map((plan) => ({
              ...plan,
              price: Math.max(
                Number(settings.subscriptionPrices?.[plan.priceKey]) ||
                  plan.price,
                500,
              ),
            })),
          );
        }
      } catch (err) {
        console.error("Failed to load currency data:", err);
      }
      setLoading(false);
    };
    fetchCurrency();
  }, []);

  const formatCurrency = (amount: number) => {
    const converted = Math.ceil(amount * rate);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(converted);
  };

  const handleSubscribe = (amount: number) => {
    const localAmount = Math.ceil(amount * rate);
    router.push(`/dashboard/wallet?amount=${localAmount}&ref=subscription`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-brand-mint" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-mint/10 border border-brand-mint/20 rounded-full text-brand-mint text-xs font-semibold tracking-normal"
        >
          <Zap size={14} /> VIP Signal Intelligence
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl font-semibold tracking-normal"
        >
          Cryptcona <span className="text-brand-mint">Subscriptions</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-zinc-500 text-sm max-w-2xl mx-auto font-medium"
        >
          Compare available plans and choose the level of support for your account.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className={`glass min-w-0 p-6 rounded-lg border-white/5 relative flex flex-col group transition-all duration-500 hover:border-brand-mint/30 ${plan.popular ? "border-brand-mint/40" : ""}`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-mint text-black px-4 py-1.5 rounded-full text-[10px] font-semibold tracking-normal shadow-lg">
                Most Popular
              </div>
            )}

            <div className="mb-8">
              <div className="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-white/5">
                {plan.icon}
              </div>
              <h3 className="text-2xl font-semibold tracking-normal">
                {plan.name}
              </h3>
              <p className="text-[10px] text-zinc-500 font-semibold tracking-normal mt-1">
                {plan.tier} Protocol
              </p>
            </div>

            <div className="flex flex-col gap-2 mb-8">
              <span className="text-2xl break-all font-semibold tracking-normal">
                {formatCurrency(plan.price)}
              </span>
              <span className="text-xs text-zinc-500 font-bold tracking-normal">
                / Monthly
              </span>
            </div>

            <ul className="space-y-4 mb-10 flex-1">
              {plan.features.map((f, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-xs font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors"
                >
                  <Check
                    size={14}
                    className="text-brand-mint shrink-0 mt-0.5"
                  />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.price)}
              className={`w-full py-5 rounded-lg font-semibold tracking-normal text-xs flex items-center justify-center gap-2 group/btn transition-all ${plan.popular ? "bg-brand-mint text-black shadow-xl shadow-brand-mint/20" : "bg-white/5 text-white border border-white/10 hover:bg-white/10"}`}
            >
              Subscribe Now{" "}
              <ArrowRight
                size={16}
                className="group-hover/btn:translate-x-1 transition-transform"
              />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Verification Note */}
      <div className="glass p-8 rounded-lg border-white/5 bg-zinc-900/40 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-brand-mint border border-white/5">
          <ShieldCheck size={24} />
        </div>
        <h4 className="text-sm font-semibold tracking-normal">
          Subscription payments
        </h4>
        <p className="text-[10px] text-zinc-600 font-bold tracking-normal max-w-xl mx-auto leading-relaxed">
          All VIP subscriptions are processed through secure liquidity gateways.
          Your signal access will be activated immediately upon transaction
          verification.
        </p>
      </div>
    </div>
  );
}
