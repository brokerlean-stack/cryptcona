import PublicPage from "@/components/sections/PublicPage";
import MarketBoard from "@/components/sections/MarketBoard";
export const metadata = {
  title: "Markets, in perspective",
  description: "Find your focus across digital assets and currency markets.",
};
export default function Page() {
  return (
    <PublicPage
      title="Markets, in perspective"
      intro="Find your focus across digital assets and currency markets."
      sections={[
        {
          title: "Digital assets",
          body: "Explore crypto reference prices and available trading instruments.",
          href: "/crypto",
        },
        {
          title: "Currency pairs",
          body: "See forex charts inside the trading workspace.",
          href: "/forex",
        },
        {
          title: "Your watch",
          body: "Return to your workspace to follow trading activity.",
          href: "/dashboard/trading",
        },
      ]}
    >
      <MarketBoard />
    </PublicPage>
  );
}
