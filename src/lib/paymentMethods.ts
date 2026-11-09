export type PaymentSetting = {
  key: string;
  value: unknown;
  description?: string;
};
export type PaymentMethod = {
  id: string;
  key: string;
  name: string;
  details: string;
};

export const defaultPaymentSettings: PaymentSetting[] = [
  { key: "payment_btc", value: "", description: "Bitcoin" },
  { key: "payment_eth", value: "", description: "Ethereum" },
  { key: "payment_usdt", value: "", description: "USDT (TRC20)" },
  { key: "payment_bank", value: "", description: "Bank Transfer" },
  { key: "payment_pix", value: "", description: "Pix" },
];

export function paymentMethodKey(name: string) {
  return `payment_${name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")}`;
}

export function getPaymentMethods(settings: PaymentSetting[]): PaymentMethod[] {
  return settings
    .filter(
      (s) =>
        /^payment_[a-z0-9_]+$/.test(s.key) &&
        typeof s.value === "string" &&
        s.value.trim(),
    )
    .map((s) => ({
      id: s.key.slice(8).toUpperCase(),
      key: s.key,
      name:
        s.description?.trim() ||
        defaultPaymentSettings.find((d) => d.key === s.key)?.description ||
        s.key.slice(8).replace(/_/g, " "),
      details: (s.value as string).trim(),
    }));
}

export function getEditablePaymentSettings(
  settings: PaymentSetting[],
): PaymentSetting[] {
  return [
    ...defaultPaymentSettings.map((d) => ({
      ...d,
      ...settings.find((s) => s.key === d.key),
    })),
    ...settings.filter(
      (s) =>
        s.key.startsWith("payment_") &&
        !defaultPaymentSettings.some((d) => d.key === s.key),
    ),
  ].map((s) => ({
    ...s,
    description:
      s.description?.trim() ||
      defaultPaymentSettings.find((d) => d.key === s.key)?.description ||
      s.key.slice(8).replace(/_/g, " "),
  }));
}
