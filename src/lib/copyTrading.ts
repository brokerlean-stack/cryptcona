export type PerformanceWeek = { week: string; capital: number; profit: number };
export type CopyProfileView = {
  _id: string;
  name: string;
  bio: string;
  region: string;
  photo: string;
  currency: string;
  active: boolean;
  isDemo?: boolean;
  weeks: PerformanceWeek[];
};
export type CopyFollower = {
  _id: string;
  name: string;
  email: string;
  currency: string;
  balance: number;
  copyProfileId: string;
  copyStartedAt: string;
  copySessionId: string;
};
export const objectIdPattern = /^[a-f0-9]{24}$/i;
export function weekReturn(week: PerformanceWeek) {
  return week.capital > 0 ? (week.profit / week.capital) * 100 : 0;
}
export function cumulativeReturn(weeks: PerformanceWeek[]) {
  return (
    (weeks.reduce((total, w) => total * (1 + weekReturn(w) / 100), 1) - 1) * 100
  );
}
export function weekStart(now = new Date()) {
  const date = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date;
}
export function validateProfile(input: unknown, existingPhoto?: string): {
  value?: Omit<CopyProfileView, "_id">;
  error?: string;
} {
  if (!input || typeof input !== "object") return { error: "Invalid profile." };
  const p = input as Record<string, unknown>;
  for (const [key, max] of [
    ["name", 80],
    ["bio", 1500],
    ["region", 80],
  ] as const) {
    if (typeof p[key] !== "string" || !p[key].trim() || p[key].length > max)
      return { error: "Enter a valid " + key + "." };
  }
  if (typeof p.currency !== "string" || !/^[A-Z]{3}$/.test(p.currency))
    return { error: "Choose a valid profile currency." };
  if (typeof p.active !== "boolean")
    return { error: "Invalid profile status." };
  if (
    typeof p.photo !== "string" ||
    p.photo.length > 1500000 ||
    !(existingPhoto && p.photo === existingPhoto) &&
    !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(p.photo)
  )
    return { error: "Upload a PNG, JPEG or WebP photo under 1 MB." };
  if (!Array.isArray(p.weeks) || p.weeks.length > 52)
    return { error: "A maximum of 52 weekly results is allowed." };
  const dates = new Set<string>();
  const weeks: PerformanceWeek[] = [];
  for (const row of p.weeks) {
    if (!row || typeof row !== "object")
      return { error: "Invalid weekly result." };
    const { week, capital, profit } = row;
    if (
      typeof week !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(week) ||
      !Number.isFinite(Date.parse(week)) ||
      new Date(week).toISOString().slice(0, 10) !== week ||
      new Date(week).getUTCDay() !== 1 ||
      new Date(week) > weekStart() ||
      dates.has(week)
    )
      return {
        error: "Use unique Mondays for weekly results, with no future weeks.",
      };
    if (
      typeof capital !== "number" ||
      !Number.isFinite(capital) ||
      capital <= 0 ||
      capital > 1e12 ||
      typeof profit !== "number" ||
      !Number.isFinite(profit) ||
      Math.abs(profit) > 1e12 ||
      profit < -capital
    )
      return {
        error:
          "Enter valid capital and profit amounts. Loss cannot exceed capital.",
      };
    if (
      Math.abs(capital * 100 - Math.round(capital * 100)) > 0.001 ||
      Math.abs(profit * 100 - Math.round(profit * 100)) > 0.001
    )
      return {
        error: "Use at most two decimal places for performance amounts.",
      };
    dates.add(week);
    weeks.push({ week, capital, profit });
  }
  return {
    value: {
      name: (p.name as string).trim(),
      bio: (p.bio as string).trim(),
      region: (p.region as string).trim(),
      photo: p.photo,
      currency: p.currency,
      active: p.active,
      weeks: weeks.sort((a, b) => b.week.localeCompare(a.week)),
    },
  };
}
