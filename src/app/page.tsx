import Link from "next/link";
import {
  ArrowUpRight,
  Wallet,
  ChartNoAxesCombined,
  ShieldCheck,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
const features = [
  {
    icon: ChartNoAxesCombined,
    title: "Follow your markets",
    copy: "Explore currency pairs and digital assets from one trading workspace.",
  },
  {
    icon: Wallet,
    title: "Manage your funds",
    copy: "Review payment instructions, submit deposits, and track withdrawals.",
  },
  {
    icon: ShieldCheck,
    title: "Keep your account in order",
    copy: "Manage verification, account preferences, and support conversations.",
  },
];
export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <section className="cc-hero">
          <img src="/wall-street.png" alt="Financial district architecture" />
          <div className="cc-container">
            <div className="cc-eyebrow">A new perspective on the markets</div>
            <h1>
              Cryptcona
              <br />
              Broker
            </h1>
            <p>
              Your markets. Your next move. A connected workspace for trading,
              funding, and following your portfolio.
            </p>
            <div className="cc-actions">
              <Link className="cc-button" href="/register">
                Open an account <ArrowUpRight size={18} />
              </Link>
              <Link className="cc-button secondary" href="/markets">
                Explore markets
              </Link>
            </div>
          </div>
        </section>
        <section className="cc-section light">
          <div className="cc-container">
            <div className="cc-section-head">
              <div>
                <p className="cc-kicker" style={{ color: "#26734b" }}>
                  THE CRYPTCONA WORKSPACE
                </p>
                <h2>
                  Everything in view.
                  <br />
                  Every move, connected.
                </h2>
              </div>
              <Link href="/platform" className="cc-button secondary">
                Meet your workspace <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="cc-grid">
              {features.map(({ icon: Icon, title, copy }) => (
                <div className="cc-feature" key={title}>
                  <Icon size={26} />
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="cc-section">
          <div className="cc-container">
            <div className="cc-section-head">
              <div>
                <p className="cc-kicker">FIND YOUR FOCUS</p>
                <h2>One account. More perspective.</h2>
              </div>
              <Link href="/markets">
                All markets <ArrowUpRight size={16} className="inline" />
              </Link>
            </div>
            {[
              [
                "01 / Digital assets",
                "Crypto",
                "Bitcoin, Ethereum, and other digital markets.",
                "/crypto",
              ],
              [
                "02 / Currency pairs",
                "Forex",
                "Major and cross-currency pairs in one place.",
                "/forex",
              ],
              [
                "03 / Your activity",
                "Portfolio",
                "Balances, trading history, and account activity.",
                "/dashboard",
              ],
            ].map(([index, title, copy, href]) => (
              <Link key={href} href={href} className="cc-market-row">
                <div>
                  <span className="cc-kicker">{index}</span>
                  <h3>{title}</h3>
                </div>
                <p>{copy}</p>
                <ArrowUpRight size={24} />
              </Link>
            ))}
          </div>
        </section>
        <section className="cc-section">
          <div className="cc-container cc-section-head">
            <div>
              <p className="cc-kicker">YOUR NEXT CHAPTER</p>
              <h2>Make room for your next move.</h2>
            </div>
            <Link href="/register" className="cc-button">
              Create your account <ArrowUpRight size={18} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
