"use client";
import Demo from "@/components/Demo";
import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Save,
  Trash2,
  Pencil,
  ArrowLeft,
  RefreshCw,
  Upload,
} from "lucide-react";
import {
  type CopyProfileView,
  type CopyFollower,
  type PerformanceWeek,
  weekReturn,
  weekStart,
} from "@/lib/copyTrading";
import {
  amountLabel,
  percentLabel,
} from "@/components/copy-trading/ProfileCard";
import { parseProfitAmount } from "@/lib/profitAmount";
type Draft = Omit<CopyProfileView, "_id"> & { _id?: string };
const blank = (): Draft => ({
  name: "",
  bio: "",
  region: "",
  photo: "",
  currency: "USD",
  active: true,
  weeks: [],
});
export default function CopyTradingAdmin() {
  const [profiles, setProfiles] = useState<CopyProfileView[]>([]),
    [followers, setFollowers] = useState<CopyFollower[]>([]),
    [draft, setDraft] = useState<Draft | null>(null),
    [selectedId, setSelectedId] = useState(""),
    [memberId, setMemberId] = useState(""),
    [amount, setAmount] = useState(""),
    [note, setNote] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [message, setMessage] = useState<{ text: string; error: boolean } | null>(
      null,
    );
  const request = useRef<{ signature: string; id: string } | null>(null);
  const lock = useRef(false);
  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/copy-trading", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfiles(data.profiles);
      setFollowers(data.followers);
    } catch (e) {
      setMessage({
        text: e instanceof Error ? e.message : "Unable to load profiles.",
        error: true,
      });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  const selected = profiles.find((p) => p._id === selectedId);
  const members = followers.filter((f) => f.copyProfileId === selectedId);
  const member = members.find((f) => f._id === memberId);
  async function upload(file?: File) {
    if (!file || !draft) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 1024 * 1024
    ) {
      setMessage({
        text: "Choose a PNG, JPEG or WebP photo under 1 MB.",
        error: true,
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setDraft((current) =>
        current ? { ...current, photo: String(reader.result) } : null,
      );
    reader.onerror = () =>
      setMessage({ text: "The photo could not be read.", error: true });
    reader.readAsDataURL(file);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft || lock.current) return;
    lock.current = true;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/copy-trading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDraft(null);
      setSelectedId(data.profile._id);
      setMemberId("");
      setMessage({ text: "Trader profile saved.", error: false });
      await load();
    } catch (e) {
      setMessage({
        text: e instanceof Error ? e.message : "Unable to save profile.",
        error: true,
      });
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function editWeek(index: number, key: keyof PerformanceWeek, value: string) {
    setDraft((current) =>
      current
        ? {
            ...current,
            weeks: current.weeks.map((w, i) =>
              i === index
                ? {
                    ...w,
                    [key]:
                      key === "week"
                        ? value
                        : value === ""
                          ? NaN
                          : Number(value),
                  }
                : w,
            ),
          }
        : null,
    );
  }
  async function credit(e: React.FormEvent) {
    e.preventDefault();
    if (!member || !selected || lock.current) return;
    const parsed = parseProfitAmount(amount);
    if (parsed === null || !note.trim()) {
      setMessage({
        text: "Enter a positive amount and a credit note.",
        error: true,
      });
      return;
    }
    const payload = {
      userId: member._id,
      profileId: selected._id,
      copySessionId: member.copySessionId,
      amount: parsed,
      note: note.trim(),
    };
    const signature = JSON.stringify(payload);
    if (request.current?.signature !== signature)
      request.current = { signature, id: crypto.randomUUID() };
    lock.current = true;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/copy-trading/credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, requestId: request.current.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({
        text:
          amountLabel(data.amount, data.currency) +
          " credited to " +
          member.name +
          ".",
        error: false,
      });
      setAmount("");
      setNote("");
      request.current = null;
      await load();
    } catch (e) {
      setMessage({
        text:
          e instanceof Error
            ? e.message
            : "Unable to confirm credit. Retry with the same details to check it safely.",
        error: true,
      });
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-medium">Trader profiles</h2>
          <p className="text-sm text-zinc-400 mt-2">
            Trader profiles, reported performance, and member credits.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            className="cc-icon-button"
            title="Refresh copy trading"
            aria-label="Refresh copy trading"
            disabled={busy || loading}
            onClick={load}
          >
            <RefreshCw size={17} />
          </button>
          {!draft && (
            <button
              className="cc-button"
              onClick={() => {
                setDraft(blank());
                setMessage(null);
              }}
            >
              <Plus size={17} />
              Create profile
            </button>
          )}
        </div>
      </header>
      {message && (
        <p
          role={message.error ? "alert" : "status"}
          className={message.error ? "cc-error" : "text-sm text-brand-mint"}
        >
          {message.text}
        </p>
      )}
      {draft ? (
        <form onSubmit={save} className="space-y-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={busy}
              aria-label="Back to profiles"
              className="cc-icon-button"
              onClick={() => setDraft(null)}
            >
              <ArrowLeft size={17} />
            </button>
            <h3 className="text-lg">
              {draft._id ? "Edit profile" : "New trader profile"}
            </h3>
          </div>
          <fieldset disabled={busy} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-5">
              <label className="cc-field">
                Trader name
                <input
                  required
                  maxLength={80}
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </label>
              <label className="cc-field">
                Region
                <input
                  required
                  maxLength={80}
                  value={draft.region}
                  onChange={(e) =>
                    setDraft({ ...draft, region: e.target.value })
                  }
                  placeholder="e.g. West Africa"
                />
              </label>
              <label className="cc-field md:col-span-2">
                Bio
                <textarea
                  aria-label="Bio"
                  required
                  maxLength={1500}
                  rows={4}
                  className="copy-input"
                  value={draft.bio}
                  onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                />
              </label>
              <label className="cc-field">
                Performance currency
                <select
                  aria-label="Performance currency"
                  className="copy-input"
                  value={draft.currency}
                  onChange={(e) =>
                    setDraft({ ...draft, currency: e.target.value })
                  }
                >
                  {[
                    "USD",
                    "EUR",
                    "GBP",
                    "NGN",
                    "ZAR",
                    "CAD",
                    "AUD",
                    "JPY",
                    "INR",
                    "BRL",
                    "CHF",
                    "AED",
                  ].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-3 text-sm self-end py-3">
                <input
                  type="checkbox"
                  checked={draft.active}
                  onChange={(e) =>
                    setDraft({ ...draft, active: e.target.checked })
                  }
                  className="accent-emerald-400 w-4 h-4"
                />
                Available for copying
              </label>
            </div>
            <div className="flex gap-5 flex-wrap items-center">
              {draft.photo && (
                <img
                  src={draft.photo}
                  alt="Profile photo preview"
                  className="copy-avatar"
                />
              )}
              <label className="cc-field">
                <span className="inline-flex gap-2 items-center">
                  <Upload size={16} />
                  Profile photo
                </span>
                <input
                  type="file"
                  aria-label="Profile photo"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => void upload(e.target.files?.[0])}
                />
                <span className="text-xs text-zinc-400">
                  PNG, JPEG or WebP. Maximum 1 MB.
                </span>
              </label>
            </div>
            <section className="border-y border-white/10 py-6">
              <div className="flex justify-between gap-4 flex-wrap mb-4">
                <h3 className="text-lg">Reported weekly results</h3>
                <button
                  type="button"
                  className="cc-button secondary"
                  disabled={draft.weeks.length >= 52}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      weeks: [
                        ...draft.weeks,
                        {
                          week: weekStart().toISOString().slice(0, 10),
                          capital: 0,
                          profit: 0,
                        },
                      ],
                    })
                  }
                >
                  <Plus size={15} />
                  Add week
                </button>
              </div>
              <p className="text-xs text-zinc-400 mb-5">
                Week starting Monday (UTC). Profit can be negative. Returns are
                calculated from starting capital and displayed as admin-reported
                performance.
              </p>
              {draft.weeks.map((w, i) => (
                <div key={i} className="copy-week-row">
                  <label className="cc-field">
                    Week starting
                    <input
                      type="date"
                      required
                      value={w.week}
                      onChange={(e) => editWeek(i, "week", e.target.value)}
                    />
                  </label>
                  <label className="cc-field">
                    Starting capital
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={Number.isFinite(w.capital) ? w.capital : ""}
                      onChange={(e) => editWeek(i, "capital", e.target.value)}
                    />
                  </label>
                  <label className="cc-field">
                    Profit / loss
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={Number.isFinite(w.profit) ? w.profit : ""}
                      onChange={(e) => editWeek(i, "profit", e.target.value)}
                    />
                  </label>
                  <span className="text-sm text-brand-mint self-end py-4">
                    {Number.isFinite(weekReturn(w))
                      ? percentLabel(weekReturn(w))
                      : "-"}
                  </span>
                  <button
                    type="button"
                    className="cc-icon-button self-end mb-2"
                    aria-label={"Remove week " + (i + 1)}
                    title="Remove week"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        weeks: draft.weeks.filter((_, index) => index !== i),
                      })
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </section>
            <button className="cc-button" disabled={!draft.photo}>
              <Save size={17} />
              {busy ? "Saving..." : "Save profile"}
            </button>
          </fieldset>
        </form>
      ) : (
        <>
          <div className="copy-grid">
            {profiles.map((p) => (
              <article
                className={
                  "copy-card " +
                  (selectedId === p._id ? "copy-card-selected" : "")
                }
                key={p._id}
              >
                <div className="flex items-center gap-4">
                  <img src={p.photo} alt={p.name} className="copy-avatar" />
                  <div className="min-w-0">
                    <h3 className="font-medium text-lg break-words">
                      {p.name}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-2">
                      {p.region} · {p.active ? "Available" : "Paused"}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-zinc-400 mt-5">
                  {followers.filter((f) => f.copyProfileId === p._id).length}{" "}
                  members · {p.weeks.length} reported weeks
                </p>
                <div className="cc-actions">
                  <button
                    type="button"
                    className="cc-button secondary"
                    onClick={() => {
                      setSelectedId(p._id);
                      setMemberId("");
                    }}
                  >
                    View members
                  </button>
                  <button
                    type="button"
                    className="cc-icon-button"
                    title={"Edit " + p.name}
                    aria-label={"Edit " + p.name}
                    onClick={() => {
                      setDraft({ ...p, weeks: p.weeks.map((w) => ({ ...w })) });
                      setMessage(null);
                    }}
                  >
                    <Pencil size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
          {!profiles.length && (
            <p className="cc-empty">
              {loading
                ? "Loading profiles..."
                : "No trader profiles yet. Create your first profile."}
            </p>
          )}
          {selected && (
            <section className="border-t border-white/15 pt-6">
              <h3 className="text-xl mb-2">{selected.name} / Members</h3>
              {selected.isDemo && <p className="cc-error"><Demo variant="profile" /></p>}
              {!selected.active && (
                <p className="text-sm text-amber-300 my-3">
                  This profile is paused. Profit credits are unavailable until
                  it is reactivated.
                </p>
              )}
              {members.length ? (
                <>
                  <div className="cc-table-wrap">
                    <table className="cc-table">
                      <thead>
                        <tr>
                          <th>Member</th>
                          <th>Account balance</th>
                          <th>Copying since</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((m) => (
                          <tr key={m._id}>
                            <td>
                              {m.name}
                              <span className="block text-xs text-zinc-400">
                                {m.email}
                              </span>
                            </td>
                            <td>{amountLabel(m.balance, m.currency)}</td>
                            <td>
                              {new Date(m.copyStartedAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <form onSubmit={credit} className="mt-6 space-y-4 max-w-xl">
                    <h4 className="font-medium">Credit member profit</h4>
                    <p className="text-xs text-zinc-400">
                      This adds an administrator credit in the member&apos;s
                      account currency. It does not change the profile&apos;s
                      reported performance.
                    </p>
                    <fieldset
                      disabled={busy || !selected.active || selected.isDemo}
                      className="space-y-4"
                    >
                      <label className="cc-field">
                        Member
                        <select
                          aria-label="Member"
                          required
                          className="copy-input"
                          value={memberId}
                          onChange={(e) => setMemberId(e.target.value)}
                        >
                          <option value="">Select a member</option>
                          {members.map((m) => (
                            <option key={m._id} value={m._id}>
                              {m.name} ({m.currency})
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="cc-field">
                        Profit amount{" "}
                        {member ? "(" + member.currency + ")" : ""}
                        <input
                          required
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                        />
                      </label>
                      <label className="cc-field">
                        Credit note
                        <input
                          required
                          maxLength={300}
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="e.g. Weekly copy-trading credit"
                        />
                      </label>
                      <button className="cc-button" disabled={!member}>
                        <Plus size={16} />
                        {busy ? "Crediting..." : "Credit profit"}
                      </button>
                    </fieldset>
                  </form>
                </>
              ) : (
                <p className="cc-empty">No members are copying this profile.</p>
              )}
            </section>
          )}
        </>
      )}
    </section>
  );
}
