import mongoose from "mongoose";
import User from "@/models/User";
import Trade from "@/models/Trade";
import PaperPosition from "@/models/PaperPosition";
import { getConversion, requireQuote, type MarketSnapshot } from "./marketData";
import {
  moneyRound,
  sizedOrderTerms,
  positionProfit,
  exitReason,
} from "./tradingMath";

async function transaction<T>(
  fn: (session: mongoose.ClientSession) => Promise<T>,
) {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(() => fn(session));
  } finally {
    await session.endSession();
  }
}
export async function openPaperPosition(
  userId: string,
  order: any,
  market: MarketSnapshot,
) {
  if (
    typeof order.requestId !== "string" ||
    !/^[a-zA-Z0-9-]{16,80}$/.test(order.requestId)
  )
    throw new Error("A valid order request ID is required");
  if (!["BUY", "SELL"].includes(order.side))
    throw new Error("Choose a direction");
  if (![0, 15, 30, 60, 180].includes(order.duration))
    throw new Error("Choose a supported duration");
  const q = requireQuote(market, order.asset);
  const user = await User.findById(userId).select("currency");
  if (!user) throw new Error("Account not found");
  const fx = await getConversion(user.currency, market);
  const terms = sizedOrderTerms(
    order,
    q.price,
    fx.rate,
    user.currency,
  );
  for (const key of ["stop", "take"]) {
    const n = order[key];
    if (n != null && (!Number.isFinite(n) || n <= 0))
      throw new Error("Exit prices must be positive");
  }
  if (
    order.stop != null &&
    (order.side === "BUY" ? order.stop >= q.price : order.stop <= q.price)
  )
    throw new Error(
      "Stop loss must be below a buy entry or above a sell entry",
    );
  if (
    order.take != null &&
    (order.side === "BUY" ? order.take <= q.price : order.take >= q.price)
  )
    throw new Error(
      "Take profit must be above a buy entry or below a sell entry",
    );
  return transaction(async (session) => {
    // Updating the account serializes concurrent orders and reserves margin atomically.
    const account = await User.findOneAndUpdate(
      { _id: userId, status: "active" },
      { $inc: { tradingRevision: 1 } },
      { new: true, session },
    );
    if (!account) throw new Error("Account is not active");
    const existing = await PaperPosition.findOne({
      userId,
      requestId: order.requestId,
    }).session(session);
    if (existing) return existing;
    if (account.currency !== user.currency)
      throw new Error("Account currency changed. Refresh and retry");
    if (
      (await PaperPosition.countDocuments({ userId, status: "OPEN" }).session(
        session,
      )) >= 12
    )
      throw new Error("Maximum 12 open positions");
    requireQuote(market, order.asset);
    if (terms.margin <= 0 || account.balance < terms.margin)
      throw new Error("Insufficient available account balance for this margin");
    await User.updateOne(
      { _id: userId },
      { $inc: { balance: -terms.margin } },
      { session },
    );
    const now = new Date();
    const [position] = await PaperPosition.create(
      [
        {
          userId,
          requestId: order.requestId,
          asset: order.asset,
          side: order.side,
          lots: terms.lots,
          sizingMode: order.sizingMode || "lots",
          units: terms.units,
          margin: terms.margin,
          currency: user.currency,
          fxRate: fx.rate,
          fxDate: fx.date,
          fxSource: fx.source,
          entry: q.price,
          quoteSource: q.source,
          openedAt: now,
          expiresAt: order.duration
            ? new Date(now.getTime() + order.duration * 1000)
            : null,
          stop: order.stop ?? null,
          take: order.take ?? null,
        },
      ],
      { session },
    );
    await Trade.create(
      [
        {
          userId,
          paperPositionId: position._id,
          asset: order.asset + "/USD",
          type: order.side,
          amount: terms.margin,
          entryPrice: q.price,
          duration: order.duration,
          status: "PENDING",
          currency: user.currency,
          simulation: true,
        },
      ],
      { session },
    );
    return position;
  });
}
export async function closePaperPosition(
  userId: string,
  id: string,
  market: MarketSnapshot,
  automatic = false,
) {
  if (!mongoose.isValidObjectId(id)) throw new Error("Invalid position");
  return transaction(async (session) => {
    const p = await PaperPosition.findOne({ _id: id, userId }).session(session);
    if (!p) throw new Error("Position not found");
    if (p.status === "CLOSED") return p;
    const q = requireQuote(market, p.asset);
    const reason =
      exitReason(p, q.price) || (automatic ? "" : "Closed manually");
    if (!reason) return p;
    const profit = positionProfit(p, q.price);
    const payout = moneyRound(p.margin + profit, p.currency);
    p.status = "CLOSED";
    p.exit = q.price;
    p.pnl = profit;
    p.closedAt = new Date();
    p.reason = reason;
    await p.save({ session });
    const updated = await User.updateOne(
      { _id: userId },
      { $inc: { balance: payout, tradingRevision: 1 } },
      { session },
    );
    if (!updated.matchedCount) throw new Error("Account not found");
    await Trade.updateOne(
      { userId, paperPositionId: p._id },
      {
        $set: {
          exitPrice: q.price,
          payout,
          status: profit > 0 ? "WIN" : profit < 0 ? "LOSS" : "BREAK_EVEN",
        },
      },
      { session },
    );
    return p;
  });
}
export async function settlePaperPositions(
  userId: string,
  market: MarketSnapshot,
) {
  if (market.stale) return;
  const positions = await PaperPosition.find({ userId, status: "OPEN" }).lean();
  for (const p of positions) {
    const q = market.quotes[p.asset as string];
    if (q && exitReason(p, q.price))
      await closePaperPosition(userId, String(p._id), market, true);
  }
}
export async function tradingSnapshot(userId: string, market: MarketSnapshot) {
  return transaction(async (session) => {
    // One snapshot aggregation replaces four sequential database round trips.
    const [row] = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      { $project: { balance: 1, currency: 1, name: 1 } },
      {
        $lookup: {
          from: PaperPosition.collection.name,
          localField: "_id",
          foreignField: "userId",
          as: "ledger",
          pipeline: [
            {
              $facet: {
                positions: [{ $match: { status: "OPEN" } }],
                history: [
                  { $match: { status: "CLOSED" } },
                  { $sort: { closedAt: -1 } },
                  { $limit: 500 },
                ],
                totals: [
                  { $match: { status: "CLOSED" } },
                  {
                    $group: {
                      _id: null,
                      realized: { $sum: "$pnl" },
                      count: { $sum: 1 },
                      wins: { $sum: { $cond: [{ $gt: ["$pnl", 0] }, 1, 0] } },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    ]).session(session);
    if (!row) throw new Error("Account not found");
    const user = row;
    const { positions, history, totals } = row.ledger[0] || {
      positions: [],
      history: [],
      totals: [],
    };
    const margin = moneyRound(
      positions.reduce((n: number, p: any) => n + Number(p.margin), 0),
      user.currency as string,
    );
    const marked = positions.map((p: any) => ({
      ...p,
      id: String(p._id),
      unrealized: market.quotes[p.asset as string]
        ? positionProfit(p, market.quotes[p.asset as string].price)
        : null,
    }));
    const unrealized = marked.every((p: any) => p.unrealized !== null)
      ? moneyRound(
          marked.reduce((n: number, p: any) => n + (p.unrealized || 0), 0),
          user.currency as string,
        )
      : null;
    return {
      currency: user.currency,
      available: user.balance,
      margin,
      unrealized,
      equity:
        unrealized === null
          ? null
          : moneyRound(
              Number(user.balance) + margin + unrealized,
              user.currency as string,
            ),
      realized: totals[0]?.realized || 0,
      winRate: totals[0]?.count
        ? Math.round((totals[0].wins / totals[0].count) * 100)
        : 0,
      positions: marked,
      history: history.map((p: any) => ({ ...p, id: String(p._id) })),
      market,
    };
  });
}
