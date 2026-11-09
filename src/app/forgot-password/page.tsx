import { Metadata } from "next";
import ForgotPasswordContent from "./ForgotPasswordContent";

export const metadata: Metadata = {
  title: "Forgot Password | Account recovery",
  description:
    "Recover access to your Cryptcona Broker account. Enter your email address to receive a secure password reset link.",
  keywords: ["forgot password", "account recovery", "trading login help"],
  alternates: {
    canonical: "https://cryptcona.pro/forgot-password",
  },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordContent />;
}
