import PublicPage from "@/components/sections/PublicPage";

export const metadata = {
  title: "The Cryptcona workspace",
  description:
    "Move from market discovery to account management in a single connected experience.",
};
export default function Page() {
  return (
    <PublicPage
      title="The Cryptcona workspace"
      intro="Move from market discovery to account management in a single connected experience."
      sections={[
        {
          title: "Trading",
          body: "Explore assets and charts, then review your orders and results.",
          href: "/dashboard/trading",
        },
        {
          title: "Funding",
          body: "Manage deposits, payment receipts, and withdrawal requests.",
          href: "/dashboard/wallet",
        },
        {
          title: "Activity",
          body: "Keep a clear record of account transactions and trading outcomes.",
          href: "/dashboard/history",
        },
      ]}
    ></PublicPage>
  );
}
