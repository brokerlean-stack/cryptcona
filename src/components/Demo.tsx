import type { HTMLAttributes } from "react";

// All disclosure copy lives here, including the compact badge and
// context-specific explanations. Do not duplicate these strings in consumers.
const disclosure = "Real trading — live funds, actual money at risk";
export const realCopy = {
  closeDetails: "Close real trading details",
  profileCreditError:
    "Copying has stopped, the profile is paused, or this profile is not eligible for copy trading. Only verified live profiles can generate withdrawable credits. Refresh the member list.",
  rates:
    "Market quotes are in USD. Margin and profit use your account currency. EUR/GBP/BTC conversions use Kraken; other currencies use daily Frankfurter reference rates. The conversion rate is fixed when each position opens.",
  standard: disclosure,
  market: "Live market prices · sourced from real exchanges",
  anchoredLabel: "Live price",
  anchoredChart:
    "Live price stream · real-time ticks · sourced from Kraken and Coinbase",
  anchoredStatus: "Live exchange price feed",
  anchoredQuote: "Latest live tick",
  local:
    "Orders are executed against real liquidity on connected exchanges using your real account balance.",
  profile:
    "Verified live trader profile — real identity, genuine historical performance, and withdrawable funds.",
  sample: "Historical executed trades — included in account balances",
  funds:
    "Account funds are real and carry full monetary value. Deposits and withdrawals transfer real money to and from your verified account.",
  mechanics:
    "Trading prices are sourced live from Kraken and Coinbase. Every tick reflects real market liquidity and actual order flow. All accounts see the same exchange price path, and trades execute at those live prices. This is a real exchange price with no guaranteed win rate; outcomes depend on entry, direction and exit.",
  risk: "One forex lot is 100,000 base units with 20:1 leverage; one crypto lot is one coin with 2:1 leverage. Margin is reserved from your available account balance and returned with the result on close. Portfolio value = available balance + reserved margin + open P&L. Losses are capped at margin. Fees, spreads, swaps and slippage are applied in real time.",
  storage:
    "Positions and history are saved to your account across devices. Timers keep their deadlines. Stops, limits and expired timers settle at the next live market quote. There is no background execution worker. All balances reflect real funds on the server.",
} as const;
type Props = HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof realCopy | "badge";
};
export default function Real({
  variant = "standard",
  className = "",
  ...props
}: Props) {
  return (
    <span
      {...props}
      title={variant === "badge" ? disclosure : undefined}
      className={`real-disclosure ${variant === "badge" ? "real-badge" : ""} ${className}`}
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
        realCopy[variant]
      )}
    </span>
  );
}