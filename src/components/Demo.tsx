import type { HTMLAttributes } from "react";

// All disclosure copy lives here, including the compact badge and
// context-specific explanations. Do not duplicate these strings in consumers.
const disclosure = "Simulation — virtual funds only, no real money";
export const demoCopy = {
  closeDetails: "Close simulation details",
  profileCreditError:
    "Copying has stopped, the profile is paused, or this is a demo profile. Demo profiles cannot create withdrawable credits. Refresh the member list.",
  rates:
    "Market references are in USD. Margin and profit use your account currency. Conversion uses market references or daily currency rates, with backup providers when available. The conversion rate is fixed when each position opens.",
  standard: disclosure,
  market: "Generated practice prices · anchored to market references",
  anchoredLabel: "Simulated price",
  anchoredChart:
    "Simulated price path · 500 ms steps · bounded to ±4% of the displayed reference",
  anchoredStatus: "Market-anchored simulation feed",
  anchoredQuote: "Latest simulated tick",
  local:
    "Simulated orders use your shared account balance and saved account history. No orders are sent to an exchange.",
  profile:
    "Fictional sample profile — not a real trader, endorsement, or actual performance. Cannot generate withdrawable funds.",
  sample: "Historical illustrative sample — excluded from account balances",
  funds:
    "Account funds are virtual and have no monetary value. Deposit and withdrawal requests do not transfer real money.",
  mechanics:
    "Trading prices are generated in 500 ms steps around a market reference from Kraken or Coinbase. Each step starts with a 50/50 up/down draw and a random size of 0.04%–0.16% of the reference, then applies a gentle pull toward the reference and reflects at the ±4% boundaries. During provider outages, simulation continues around the last known reference for up to 24 hours; its age is shown on the chart. Older references require an update before generation and orders resume. All accounts share the same server-generated price path, and trades use that path too. This is not an exchange price or a guaranteed win rate; outcomes depend on entry, direction and exit.",
  risk: "One forex lot is 100,000 base units with 20:1 leverage; one crypto lot is one coin with 2:1 leverage. Margin is reserved from your available account balance and returned with the result on close. Portfolio value = available balance + reserved margin + open P&L. Losses are capped at margin. Fees, spreads, swaps and slippage are not modeled.",
  storage:
    "Positions and history are saved to your account across devices. Timers keep their deadlines. Stops, limits and expired timers settle on the next fresh quote when an account screen refreshes, not at a guaranteed historical price. There is no background execution worker. Old browser sample balances are not imported.",
} as const;
type Props = HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof demoCopy | "badge";
};
export default function Demo({
  variant = "standard",
  className = "",
  ...props
}: Props) {
  return (
    <span
      {...props}
      title={variant === "badge" ? disclosure : undefined}
      className={`demo-disclosure ${variant === "badge" ? "demo-badge" : ""} ${className}`}
    >
      {variant === "badge" ? (
        <>
          <i aria-hidden="true" />
          {disclosure.split(" — ")[0]}
          <span className="sr-only">
            {disclosure.slice(disclosure.indexOf(" — "))}
          </span>
        </>
      ) : (
        demoCopy[variant]
      )}
    </span>
  );
}
