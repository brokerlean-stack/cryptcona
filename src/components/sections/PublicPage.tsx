import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
type Section = { title: string; body: string; href?: string };
export default function PublicPage({
  title,
  intro,
  sections,
  image,
  children,
}: {
  title: string;
  intro: string;
  sections: Section[];
  image?: string;
  children?: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main>
        <header className="cc-page-heading">
          <div className="cc-container">
            <p className="cc-kicker">CRYPTCONA BROKER</p>
            <h1>{title}</h1>
            <p>{intro}</p>
          </div>
        </header>
        {image && (
          <img
            src={image}
            alt="Financial markets workspace"
            className="cc-public-image"
          />
        )}
        {children}
        <section className="cc-section">
          <div className="cc-container cc-grid">
            {sections.map((s, i) => (
              <article className="cc-feature" key={s.title}>
                <span className="cc-kicker">0{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
                {s.href && (
                  <Link
                    href={s.href}
                    className="inline-flex gap-2 items-center mt-6 text-sm text-brand-mint"
                  >
                    Explore <ArrowUpRight size={16} />
                  </Link>
                )}
              </article>
            ))}
          </div>
        </section>
        <section className="cc-section light">
          <div className="cc-container cc-section-head">
            <div>
              <h2>Your workspace awaits.</h2>
              <p>Create an account or pick up where you left off.</p>
            </div>
            <div className="cc-actions">
              <Link href="/register" className="cc-button">
                Create account <ArrowUpRight size={16} />
              </Link>
              <Link href="/login" className="cc-button secondary">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
