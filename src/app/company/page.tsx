import PublicPage from "@/components/sections/PublicPage";

export const metadata = {
  title: "About Cryptcona",
  description:
    "A focused home for your trading life. Cryptcona brings your markets, account activity, and support into one connected workspace.",
};
export default function Page() {
  return (
    <PublicPage
      title="About Cryptcona"
      intro="A focused home for your trading life. Cryptcona brings your markets, account activity, and support into one connected workspace."
      sections={[
        {
          title: "A clear overview",
          body: "Follow your balance, deposits, and trading results without losing sight of the details.",
          href: "/dashboard",
        },
        {
          title: "A connected account",
          body: "Manage funding, identity documents, and preferences from your own workspace.",
          href: "/accounts",
        },
        {
          title: "A direct conversation",
          body: "Keep your support messages and account questions together.",
          href: "/dashboard/chat",
        },
      ]}
      image="/trading-team.png"
    ></PublicPage>
  );
}
