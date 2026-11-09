import { Metadata } from "next";
import VerifyContent from "./VerifyContent";

export const metadata: Metadata = {
  title: "Verify Identity | Secure Account Activation",
  description:
    "Multi-factor authentication for Cryptcona Broker accounts. Enter your security code to verify your identity.",
  keywords: [
    "account verification",
    "secure trading access",
    "2FA",
    "account security",
  ],
  alternates: {
    canonical: "https://cryptcona.pro/verify",
  },
};

import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="animate-spin text-brand-mint" size={40} />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
