import { Metadata } from "next";
import RegisterContent from "./RegisterContent";

export const metadata: Metadata = {
  title: "Apply for Access | Institutional Trading Registration",
  description:
    "Join the elite group of traders at Cryptcona Broker. Apply for your institutional account today and gain access to AI-powered trading.",
  keywords: [
    "register trading account",
    "institutional trader application",
    "cryptcona signup",
  ],
  alternates: {
    canonical: "https://cryptcona.pro/register",
  },
};

export default function RegisterPage() {
  return <RegisterContent />;
}
