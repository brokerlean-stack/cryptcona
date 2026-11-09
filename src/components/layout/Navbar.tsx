"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import Brand from "./Brand";
import Demo from "@/components/Demo";
const links = [
  ["Markets", "/markets"],
  ["Crypto", "/crypto"],
  ["Forex", "/forex"],
  ["Platform", "/platform"],
  ["Accounts", "/accounts"],
  ["About", "/company"],
];
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const { data: session } = useSession();
  return (
    <header className="cc-nav">
      <div className="cc-nav-inner">
        <Brand />
        <Demo variant="badge" />
        <nav className="cc-nav-links" aria-label="Main navigation">
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              aria-current={path === href ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="cc-nav-actions">
          {session ? (
            <>
              <Link
                href={session.user.role === "admin" ? "/admin" : "/dashboard"}
                className="cc-button"
              >
                Open workspace <ArrowUpRight size={16} />
              </Link>
              <button onClick={() => signOut({ callbackUrl: "/" })}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login">Sign in</Link>
              <Link href="/register" className="cc-button">
                Get started <ArrowUpRight size={16} />
              </Link>
            </>
          )}
        </div>
        <button
          className="cc-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <nav className="cc-mobile-nav" aria-label="Mobile navigation">
          {links.map(([label, href]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
          <Link href={session ? "/dashboard" : "/login"}>
            {session ? "My workspace" : "Sign in"}
          </Link>
          <Link href="/register" className="cc-button">
            Create account
          </Link>
        </nav>
      )}
    </header>
  );
}
