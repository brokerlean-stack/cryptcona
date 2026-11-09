"use client";
import { useState, useEffect, useRef } from "react";
import { Search, RefreshCw, X, Copy, Square } from "lucide-react";
import ProfileCard, {
  PerformanceTable,
  amountLabel,
} from "@/components/copy-trading/ProfileCard";
import { type CopyProfileView } from "@/lib/copyTrading";
type Credit = {
  _id: string;
  profileName: string;
  amount: number;
  currency: string;
  note: string;
  createdAt: string;
};
type Data = {
  profiles: CopyProfileView[];
  subscription: { profileId: string | null; startedAt: string | null };
  credits: Credit[];
  weeklyCredited: number;
  totalCredited: number;
  currency: string;
};
export default function CopyTradingPage() {
  const [data, setData] = useState<Data | null>(null),
    [query, setQuery] = useState(""),
    [region, setRegion] = useState(""),
    [selected, setSelected] = useState<CopyProfileView | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/copy-trading", { cache: "no-store" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setData(result);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load profiles.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  useEffect(() => {
    if (selected) dialog.current?.showModal();
    else dialog.current?.close();
  }, [selected]);
  async function activate(profileId: string | null) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/copy-trading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setSelected(null);
      setNotice(
        profileId
          ? "Copy profile activated."
          : "Copying stopped. Your credited earnings remain in your balance.",
      );
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update copying.");
    } finally {
      setBusy(false);
    }
  }
  const active = data?.profiles.find(
    (p) => p._id === data.subscription.profileId,
  );
  const filtered =
    data?.profiles.filter(
      (p) =>
        (p.active || p._id === active?._id) &&
        (!region || p.region === region) &&
        (p.name + " " + p.bio + " " + p.region)
          .toLowerCase()
          .includes(query.toLowerCase()),
    ) || [];
  return (
    <div>
      <header className="cc-section-head">
        <div>
          <p className="cc-kicker">FOLLOW A TRADER</p>
          <h1 className="text-3xl font-medium">Copy trading</h1>
          <p className="mt-3 text-sm text-zinc-400">
            Find a profile, review its results, and choose who to follow.
          </p>
        </div>
        <button
          className="cc-icon-button"
          onClick={refresh}
          disabled={loading}
          aria-label="Refresh profiles"
          title="Refresh profiles"
        >
          <RefreshCw size={18} />
        </button>
      </header>
      {error && !selected && (
        <p role="alert" className="cc-error mb-5">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-brand-mint mb-5">
          {notice}
        </p>
      )}
      <div className="copy-summary">
        <div>
          <p className="text-xs text-zinc-400">Your selected trader</p>
          <h2 className="text-xl mt-2">{active?.name || "No active copy"}</h2>
          <p className="text-xs text-zinc-400 mt-2">
            {active
              ? active.active
                ? "Copying enabled"
                : "Profile paused by the account team"
              : "Choose a profile below"}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-400">Credited this week (UTC)</p>
          <p className="text-xl mt-2 text-brand-mint">
            {amountLabel(data?.weeklyCredited || 0, data?.currency || "USD")}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-400">Total copy credits</p>
          <p className="text-xl mt-2">
            {amountLabel(data?.totalCredited || 0, data?.currency || "USD")}
          </p>
        </div>
        {active && (
          <button
            className="cc-button secondary self-center"
            disabled={busy}
            onClick={() => activate(null)}
          >
            <Square size={15} />
            Stop copying
          </button>
        )}
      </div>
      <p className="text-xs text-zinc-400 leading-6 my-6">
        Copying is managed by the account team. Account credits are added manually;
        selecting a profile does not execute market orders or move your
        funds. Only one profile can be active at a time.
      </p>
      <div className="copy-toolbar">
        <label className="copy-search">
          <Search size={18} />
          <input
            aria-label="Search traders"
            placeholder="Search name, region or strategy"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          aria-label="Filter by region"
          className="copy-input"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        >
          <option value="">All regions</option>
          {Array.from(new Set(data?.profiles.map((p) => p.region) || []))
            .sort()
            .map((r) => (
              <option key={r}>{r}</option>
            ))}
        </select>
      </div>
      <div className="copy-grid">
        {filtered.map((p) => (
          <ProfileCard
            key={p._id}
            profile={p}
            selected={active?._id === p._id}
            onOpen={() => setSelected(p)}
          />
        ))}
      </div>
      {!filtered.length && (
        <div className="cc-empty">
          {loading
            ? "Loading trader profiles..."
            : data?.profiles.length
              ? "No matching profiles."
              : "No trader profiles are available yet."}
        </div>
      )}
      <section className="mt-10">
        <h2 className="text-lg font-medium mb-4">Your copy earnings</h2>
        <p className="text-xs text-zinc-400 mb-4">
          Account credits added manually by the account team. Latest 100 entries.
        </p>
        {data?.credits.length ? (
          <div className="cc-table-wrap">
            <table className="cc-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Profile</th>
                  <th>Amount credited</th>
                  <th>Credit note</th>
                </tr>
              </thead>
              <tbody>
                {data.credits.map((c) => (
                  <tr key={c._id}>
                    <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td>{c.profileName}</td>
                    <td className="text-brand-mint">
                      {amountLabel(c.amount, c.currency)}
                    </td>
                    <td>{c.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="cc-empty">No copy-trading credits yet.</p>
        )}
      </section>
      <dialog
        ref={dialog}
        className="copy-dialog"
        onCancel={() => {
          if (!busy) setSelected(null);
        }}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4 min-w-0">
                <img
                  className="copy-avatar"
                  src={selected.photo}
                  alt={selected.name}
                />
                <div className="min-w-0">
                  <h2 className="text-2xl break-words">{selected.name}</h2>
                  <p className="text-sm text-zinc-400 mt-2">
                    {selected.region}
                  </p>
                </div>
              </div>
              <button
                disabled={busy}
                aria-label="Close profile"
                className="cc-icon-button"
                onClick={() => setSelected(null)}
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm leading-7 text-zinc-300 whitespace-pre-wrap mt-6">
              {selected.bio}
            </p>
            <PerformanceTable profile={selected} />
            {error && (
              <p className="cc-error mt-4" role="alert">
                {error}
              </p>
            )}
            <div className="border-t border-white/10 pt-5 mt-5">
              {active && active._id !== selected._id && (
                <p className="text-sm text-zinc-400 mb-4">
                  Activating this profile replaces {active.name}. Existing
                  credits stay in your account.
                </p>
              )}
              {active?._id === selected._id ? (
                <button
                  className="cc-button secondary"
                  disabled={busy}
                  onClick={() => activate(null)}
                >
                  <Square size={16} />
                  Stop copying
                </button>
              ) : (
                <button
                  className="cc-button"
                  disabled={busy || !selected.active}
                  onClick={() => activate(selected._id)}
                >
                  <Copy size={16} />
                  {busy
                    ? "Activating..."
                    : selected.active
                      ? selected.isDemo ? "Try profile" : "Copy trader"
                      : "Profile paused"}
                </button>
              )}
            </div>
          </>
        )}
      </dialog>
    </div>
  );
}
