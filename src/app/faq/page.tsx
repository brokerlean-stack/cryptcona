import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
export const metadata = { title: "Help & FAQ" };
const questions = [
  [
    "How do I get started?",
    "Create your account, choose your account currency, and sign in to your Cryptcona workspace.",
  ],
  [
    "Where are payment instructions?",
    "Open Wallet, choose a configured payment method, and review the payment details before transferring funds. Submit your receipt for review.",
  ],
  [
    "How do I track a withdrawal?",
    "Submit your request in Wallet and follow its status in Activity. Contact support if you need help with a request.",
  ],
  [
    "How do I update my account?",
    "Open Preferences for account settings, or Profile & verification for identity documents.",
  ],
  [
    "How do I contact support?",
    "Open Messages in your account to speak with your support team.",
  ],
  [
    "Can I reset my password?",
    "Use Forgot your password on the sign-in screen. A reset link will be sent to your registered email address.",
  ],
];
export default function FAQ() {
  return (
    <>
      <Navbar />
      <main>
        <header className="cc-page-heading">
          <div className="cc-container">
            <p className="cc-kicker">HELP CENTER</p>
            <h1>A little clarity goes a long way.</h1>
            <p>Answers to common account and funding questions.</p>
          </div>
        </header>
        <section className="cc-section">
          <div className="cc-container max-w-4xl">
            {questions.map(([q, a]) => (
              <details key={q} className="border-b border-white/15 py-6">
                <summary className="font-medium text-lg">{q}</summary>
                <p className="pt-4">{a}</p>
              </details>
            ))}
            <Link href="/dashboard/chat" className="cc-button mt-8">
              Contact support
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
