"use client";
import { useState } from "react";
import DashboardNavbar from "@/components/layout/DashboardNavbar";
import Sidebar from "@/components/layout/Sidebar";
import { TradingAccountProvider } from "@/components/simulation/useTradingAccount";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <TradingAccountProvider>
      <div>
        <DashboardNavbar
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />
        <Sidebar
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />
        <main className="cc-account-main">{children}</main>
      </div>
    </TradingAccountProvider>
  );
}
