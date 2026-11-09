"use client";
import { MapPin, ArrowUpRight, Check } from "lucide-react";
import Demo from "@/components/Demo";
import {
  type CopyProfileView,
  weekReturn,
  cumulativeReturn,
} from "@/lib/copyTrading";
export function amountLabel(amount: number, currency: string) {
  return (
    currency +
    " " +
    amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}
export function percentLabel(value: number) {
  return Number.isFinite(value)
    ? (value > 0 ? "+" : "") +
        value.toLocaleString(undefined, { maximumFractionDigits: 2 }) +
        "%"
    : "Unavailable";
}
export default function ProfileCard({
  profile,
  selected,
  onOpen,
}: {
  profile: CopyProfileView;
  selected?: boolean;
  onOpen: () => void;
}) {
  const latest = profile.weeks[0];
  return (
    <article className="copy-card">
      {profile.isDemo && <div className="mb-3"><Demo variant="badge" /></div>}
      <div className="flex items-start gap-4">
        <img src={profile.photo} alt={profile.name} className="copy-avatar" />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-medium break-words">{profile.name}</h2>
          <p className="flex items-center gap-1 text-xs text-zinc-400 mt-2">
            <MapPin size={13} className="shrink-0" />
            {profile.region}
          </p>
        </div>
        {selected && (
          <span className="text-brand-mint" title="Your selected profile">
            <Check size={18} />
          </span>
        )}
      </div>
      <p className="copy-bio">{profile.bio}</p>
      <dl className="grid grid-cols-2 gap-4 border-y border-white/10 py-4 my-5">
        <div>
          <dt className="text-xs text-zinc-400">Latest weekly return</dt>
          <dd
            className={
              "text-xl mt-2 " +
              (latest && latest.profit < 0
                ? "text-rose-400"
                : "text-brand-mint")
            }
          >
            {latest ? percentLabel(weekReturn(latest)) : "No history"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-400">Reported total return</dt>
          <dd className="text-xl mt-2">
            {profile.weeks.length
              ? percentLabel(cumulativeReturn(profile.weeks))
              : "No history"}
          </dd>
        </div>
      </dl>
      <div className="flex items-center justify-between gap-3 text-xs text-zinc-400">
        <span>
          {profile.active
            ? selected
              ? "Copying selected"
              : "Available to copy"
            : "Profile paused"}
        </span>
        <button className="cc-button secondary" onClick={onOpen}>
          View profile <ArrowUpRight size={16} />
        </button>
      </div>
    </article>
  );
}
export function PerformanceTable({ profile }: { profile: CopyProfileView }) {
  return (
    <div className="mt-6">
      <h3 className="font-medium mb-2">{profile.isDemo ? "Sample weekly performance" : "Weekly performance"}</h3>
      {profile.isDemo && <p className="cc-error mb-4"><Demo variant="profile" /></p>}
      <p className="text-xs text-zinc-400 mb-4">
        Results reported by the account team in {profile.currency}. Returns are calculated
        from each week&apos;s starting capital. Past results do not guarantee
        future returns.
      </p>
      {profile.weeks.length ? (
        <div className="cc-table-wrap">
          <table className="cc-table">
            <thead>
              <tr>
                <th>Week of (UTC)</th>
                <th>Starting capital</th>
                <th>Profit / loss</th>
                <th>Return</th>
              </tr>
            </thead>
            <tbody>
              {profile.weeks.map((w) => (
                <tr key={w.week}>
                  <td>{w.week}</td>
                  <td>{amountLabel(w.capital, profile.currency)}</td>
                  <td
                    className={
                      w.profit < 0 ? "text-rose-400" : "text-brand-mint"
                    }
                  >
                    {amountLabel(w.profit, profile.currency)}
                  </td>
                  <td>{percentLabel(weekReturn(w))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="cc-empty">No weekly results have been reported.</p>
      )}
    </div>
  );
}
