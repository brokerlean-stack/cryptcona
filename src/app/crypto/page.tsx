import PublicPage from "@/components/sections/PublicPage";
import MarketBoard from "@/components/sections/MarketBoard";
export const metadata = {
  title: "Digital assets",
  description:
    "Explore cryptocurrency markets and keep your activity connected to your account.",
};
export default function Page() {
  return (
    <PublicPage
      title="Digital assets"
      intro="Explore cryptocurrency markets and keep your activity connected to your account."
      sections={[
        {
          title: "Discover",
          body: "Follow reference prices for leading digital assets.",
          href: "/markets",
        },
        {
          title: "Trade",
          body: "Open the trading workspace to explore available assets and charts.",
          href: "/dashboard/trading",
        },
        {
          title: "Review",
          body: "Track your trading activity and account balance.",
          href: "/dashboard",
        },
      ]}
    >
      <MarketBoard />
    </PublicPage>
  );
}
