import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FloatingSupport from "@/components/ui/FloatingSupport";
import { AuthProvider } from "@/components/providers/AuthProvider";
const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
export const metadata: Metadata = {
  metadataBase: new URL("https://cryptcona.pro"),
  title: {
    default: "Cryptcona Broker | Your markets. Your next move.",
    template: "%s | Cryptcona Broker",
  },
  description:
    "Your connected workspace for trading, funding, and following your portfolio.",
  icons: { icon: "/brand/cryptcona-mark.svg" },
  openGraph: {
    siteName: "Cryptcona Broker",
    title: "Cryptcona Broker",
    url: "https://cryptcona.pro",
    images: ["/wall-street.png"],
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={sans.variable + " " + mono.variable + " antialiased"}>
        <AuthProvider>
          {children}
          <FloatingSupport />
        </AuthProvider>
      </body>
    </html>
  );
}
