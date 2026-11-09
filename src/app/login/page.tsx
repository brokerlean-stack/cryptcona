import { Metadata } from "next";
import LoginContent from "./LoginContent";

export const metadata: Metadata = {
  title: "Login | Secure Institutional Terminal Access",
  description:
    "Securely access your Cryptcona Broker Cryptcona trading account. Enter your credentials to manage your portfolio and execute trades.",
  keywords: ["login trading", "institutional terminal access", "secure login"],
  alternates: {
    canonical: "https://cryptcona.pro/login",
  },
};

export default function LoginPage() {
  return <LoginContent />;
}
