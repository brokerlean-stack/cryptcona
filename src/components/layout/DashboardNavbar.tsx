"use client";
import Link from "next/link";
import { Menu, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import NotificationBell from "@/components/ui/NotificationBell";
import Demo from "@/components/Demo";
import UserAvatar from "@/components/ui/UserAvatar";
export default function DashboardNavbar({
  mobileMenuOpen,
  setMobileMenuOpen,
}: {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (value: boolean) => void;
}) {
  const { data: session } = useSession();
  return (
    <header className="cc-account-header">
      <div className="cc-account-brand flex items-center gap-3">
        <button
          className="cc-mobile-toggle cc-icon-button"
          aria-label="Toggle navigation"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu size={20} />
        </button>
        <Link href="/dashboard" className="font-semibold tracking-tight text-lg">cryptcona</Link>
      </div>
      <div className="cc-account-actions">
        <Demo variant="badge" />
        <span className="hidden sm:block text-sm text-zinc-400">
          {session?.user?.name}
        </span>
        {session?.user?.role === "admin" && (
          <Link href="/admin" className="hidden sm:block text-sm text-brand-mint">
            Admin
          </Link>
        )}
        <NotificationBell fetchUrl="/api/user/notifications" />
        <Link href="/dashboard/profile" aria-label="Edit profile and photo" className="cc-profile-avatar w-9 h-9 shrink-0 rounded-full border border-white/15 bg-white/5 flex items-center justify-center text-brand-mint font-semibold">
          <UserAvatar name={session?.user?.name} photo={session?.user?.image} alt="Account profile photo" />
        </Link>
        <button
          className="cc-icon-button"
          title="Sign out"
          aria-label="Sign out"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}
