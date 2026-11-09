"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ChartNoAxesCombined,
  Wallet,
  History,
  UserRound,
  Settings,
  MessageSquare,
  Radio,
  LifeBuoy,
  X,
  Copy,
} from "lucide-react";
const links = [
  ["Overview", "/dashboard", LayoutDashboard],
  ["Trading", "/dashboard/trading", ChartNoAxesCombined],
  ["Copy trading", "/dashboard/copy-trading", Copy],
  ["Wallet", "/dashboard/wallet", Wallet],
  ["Activity", "/dashboard/history", History],
  ["Subscriptions", "/dashboard/subscription", Radio],
  ["Profile & verification", "/dashboard/profile", UserRound],
  ["Preferences", "/dashboard/settings", Settings],
  ["Messages", "/dashboard/chat", MessageSquare],
] as const;
export default function Sidebar({
  mobileMenuOpen,
  setMobileMenuOpen,
}: {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (value: boolean) => void;
}) {
  const path = usePathname();
  return (
    <aside className={"cc-sidebar" + (mobileMenuOpen ? " open" : "")}>
      <div className="flex justify-between items-center">
        <p className="cc-sidebar-label">YOUR WORKSPACE</p>
        <button
          className="cc-mobile-toggle cc-icon-button"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
        >
          <X size={18} />
        </button>
      </div>
      <nav aria-label="Account navigation">
        {links.map(([label, href, Icon]) => (
          <Link
            key={href}
            href={href}
            aria-current={path === href ? "page" : undefined}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto border-t border-white/10 pt-4">
        <Link href="/dashboard/support">
          <LifeBuoy size={18} />
          Help & support
        </Link>
        <Link href="/">Back to Cryptcona</Link>
      </div>
    </aside>
  );
}
