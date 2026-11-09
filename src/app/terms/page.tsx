import Link from "next/link";
import Demo from "@/components/Demo";
export default function TermsPage() {
  return (
    <main className="cc-container py-12 max-w-3xl space-y-8">
      <h1 className="text-3xl">Workspace terms</h1>
      <p className="text-zinc-400">Updated 7 November 2026</p>
      <p>
        <Demo />
      </p>
      <section className="space-y-3">
        <h2 className="text-xl">Trading mechanics</h2>
        <p>
          <Demo variant="mechanics" />
        </p>
        <p>
          <Demo variant="risk" />
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl">Practice capital</h2>
        <p>
          <Demo variant="funds" />
        </p>
        <p>
          Optional account goals are personal progress trackers. They do not
          promise earnings or restrict access to funds. For help with account
          settings,{" "}
          <Link
            href="/dashboard/chat?topic=profit-goal"
            className="text-brand-mint underline"
          >
            contact support
          </Link>
          .
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl">Sample profiles</h2>
        <p>
          <Demo variant="profile" />
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl">Storage and account access</h2>
        <p>
          <Demo variant="local" />
        </p>
        <p>
          <Demo variant="storage" />
        </p>
        <p>
          Sign-in, trading history, wallet entries and support use the same
          account service. Available funds are shared across account screens.
        </p>
      </section>
      <Link href="/dashboard" className="cc-button">
        Open workspace
      </Link>
    </main>
  );
}
