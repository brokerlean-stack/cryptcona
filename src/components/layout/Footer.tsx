import Link from "next/link";
import Brand from "./Brand";
import Demo from "@/components/Demo";
export default function Footer() {
  return (
    <footer className="cc-footer">
      <div className="cc-container">
        <div className="cc-footer-top">
          <Brand />
          <div className="cc-footer-links">
            <Link href="/markets">Markets</Link>
            <Link href="/platform">Platform</Link>
            <Link href="/company">About Cryptcona</Link>
            <Link href="/faq">Help & FAQ</Link>
            <Link href="/terms">Terms & conditions</Link>
            <Link href="/dashboard/support">Contact support</Link>
          </div>
        </div>
        <div className="cc-footer-bottom">
          <p>
            <Demo />
          </p>
          <p style={{ marginTop: 12 }}>
            © {new Date().getFullYear()} Cryptcona Broker. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
