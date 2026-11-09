"use client";

import { useState } from "react";
import { CreditCard, Loader2, Plus, Save } from "lucide-react";
import {
  getEditablePaymentSettings,
  paymentMethodKey,
  type PaymentSetting,
} from "@/lib/paymentMethods";

export default function PaymentMethodsEditor({
  settings,
  onSaved,
}: {
  settings: PaymentSetting[];
  onSaved: (setting: PaymentSetting) => void;
}) {
  const [methods, setMethods] = useState(() =>
    getEditablePaymentSettings(settings),
  );
  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [status, setStatus] = useState<{ error: boolean; text: string } | null>(
    null,
  );
  const inputClass =
    "w-full min-w-0 rounded-lg border border-white/15 bg-black/30 p-3 text-sm text-white focus:outline-none focus:border-brand-mint";

  async function save(setting: PaymentSetting, create = false) {
    if (saving) return;
    if (
      !setting.description?.trim() ||
      (create && !String(setting.value).trim())
    ) {
      setStatus({
        error: true,
        text: "Enter a method name and payment details.",
      });
      return;
    }
    if (
      create &&
      (setting.key === "payment_" || methods.some((m) => m.key === setting.key))
    ) {
      setStatus({
        error: true,
        text: "Choose a different name. This method already exists or its name is invalid.",
      });
      return;
    }
    setSaving(setting.key);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/settings/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...setting, create }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Unable to save payment method.");
      setMethods((current) =>
        create
          ? [...current, data.setting]
          : current.map((m) => (m.key === setting.key ? data.setting : m)),
      );
      onSaved(data.setting);
      if (create) {
        setName("");
        setDetails("");
      }
      setStatus({ error: false, text: "Payment method saved." });
    } catch (error) {
      setStatus({
        error: true,
        text:
          error instanceof Error
            ? error.message
            : "Unable to save payment method.",
      });
    } finally {
      setSaving(null);
    }
  }

  return (
    <section className="space-y-6 border-b border-white/10 pb-8">
      <h3 className="flex items-center gap-2 text-xl font-bold">
        <CreditCard size={22} />
        Payment Methods
      </h3>
      {status && (
        <p
          role={status.error ? "alert" : "status"}
          className={
            status.error ? "text-sm text-red-400" : "text-sm text-green-400"
          }
        >
          {status.text}
        </p>
      )}
      {methods.map((method) => (
        <form
          key={method.key}
          onSubmit={(e) => {
            e.preventDefault();
            void save(method);
          }}
          className="space-y-3 border-b border-white/10 pb-6"
        >
          <label className="block text-sm text-zinc-300">
            Method name
            <input
              required
              maxLength={100}
              disabled={saving !== null}
              className={`${inputClass} mt-2`}
              value={method.description || method.key.slice(8)}
              onChange={(e) =>
                setMethods((current) =>
                  current.map((m) =>
                    m.key === method.key
                      ? { ...m, description: e.target.value }
                      : m,
                  ),
                )
              }
            />
          </label>
          <label className="block text-sm text-zinc-300">
            Payment details
            <textarea
              rows={4}
              maxLength={10000}
              disabled={saving !== null}
              className={`${inputClass} mt-2 resize-y`}
              value={String(method.value ?? "")}
              onChange={(e) =>
                setMethods((current) =>
                  current.map((m) =>
                    m.key === method.key ? { ...m, value: e.target.value } : m,
                  ),
                )
              }
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-zinc-400">
              {String(method.value).trim() ? "Configured" : "Not configured"}
            </span>
            <button
              disabled={saving !== null}
              className="flex items-center gap-2 rounded-lg bg-brand-mint px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
            >
              {saving === method.key ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Save
            </button>
          </div>
        </form>
      ))}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save(
            { key: paymentMethodKey(name), description: name, value: details },
            true,
          );
        }}
        className="space-y-3"
      >
        <h4 className="text-lg font-bold">Add Payment Method</h4>
        <label className="block text-sm text-zinc-300">
          Method name
          <input
            required
            maxLength={100}
            disabled={saving !== null}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`${inputClass} mt-2`}
          />
        </label>
        <label className="block text-sm text-zinc-300">
          Payment details
          <textarea
            required
            rows={4}
            maxLength={10000}
            disabled={saving !== null}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className={`${inputClass} mt-2 resize-y`}
          />
        </label>
        <button
          disabled={saving !== null}
          className="flex items-center gap-2 rounded-lg bg-brand-mint px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
        >
          <Plus size={16} />
          Add Method
        </button>
      </form>
    </section>
  );
}
