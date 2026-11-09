import PublicPage from "@/components/sections/PublicPage";

export const metadata = {
  title: "An account that fits your next move",
  description:
    "Start with your account details, choose your currency, and manage your preferences as you go.",
};
export default function Page() {
  return (
    <PublicPage
      title="An account that fits your next move"
      intro="Start with your account details, choose your currency, and manage your preferences as you go."
      sections={[
        {
          title: "Your account",
          body: "Create your Cryptcona login and set your preferred account currency.",
          href: "/register",
        },
        {
          title: "Your profile",
          body: "Manage personal details and submit identity documents from your profile.",
          href: "/dashboard/profile",
        },
        {
          title: "Your subscriptions",
          body: "Review the available plans and current pricing inside your workspace.",
          href: "/dashboard/subscription",
        },
      ]}
    ></PublicPage>
  );
}
