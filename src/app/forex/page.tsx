import PublicPage from "@/components/sections/PublicPage";

export const metadata = {
  title: "Currency markets",
  description:
    "Explore major currency pairs and cross-market opportunities in your trading workspace.",
};
export default function Page() {
  return (
    <PublicPage
      title="Currency markets"
      intro="Explore major currency pairs and cross-market opportunities in your trading workspace."
      sections={[
        {
          title: "Major pairs",
          body: "Follow widely traded pairs such as EUR/USD and GBP/USD.",
          href: "/dashboard/trading",
        },
        {
          title: "Market context",
          body: "Review charts and price movements before making your next decision.",
          href: "/dashboard/trading",
        },
        {
          title: "Account perspective",
          body: "Your account balance and activity remain visible in your chosen currency.",
          href: "/dashboard",
        },
      ]}
    ></PublicPage>
  );
}
