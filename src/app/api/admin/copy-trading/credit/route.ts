import { NextResponse } from "next/server";
import { demoCopy } from '@/components/Demo';
import { getAdminSession } from "@/lib/adminAuth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Deposit from "@/models/Deposit";
import CopyProfile from "@/models/CopyProfile";
import CopyCredit from "@/models/CopyCredit";
import { parseProfitAmount } from "@/lib/profitAmount";
import { objectIdPattern } from "@/lib/copyTrading";
export async function POST(req: Request) {
  const admin = await getAdminSession();
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const amount = parseProfitAmount(body?.amount);
  if (
    !body ||
    amount === null ||
    amount > 1e12 ||
    typeof body.userId !== "string" ||
    !objectIdPattern.test(body.userId) ||
    typeof body.profileId !== "string" ||
    !objectIdPattern.test(body.profileId) ||
    typeof body.copySessionId !== "string" ||
    !body.copySessionId ||
    typeof body.requestId !== "string" ||
    !/^[a-f0-9-]{36}$/i.test(body.requestId) ||
    typeof body.note !== "string" ||
    !body.note.trim() ||
    body.note.length > 300
  )
    return NextResponse.json(
      { error: "Enter a valid member, amount and credit note." },
      { status: 400 },
    );
  const reply = (credit: Record<string, unknown>) => {
    const matches =
      String(credit.userId) === body.userId &&
      String(credit.profileId) === body.profileId &&
      String(credit.adminId) === admin.user.id &&
      credit.copySessionId === body.copySessionId &&
      credit.amount === amount &&
      credit.note === body.note.trim();
    return matches
      ? NextResponse.json({
          success: true,
          amount: credit.amount,
          currency: credit.currency,
          balance: credit.balanceAfter,
        })
      : NextResponse.json(
          { error: "This request was already used for a different credit." },
          { status: 409 },
        );
  };
  try {
    const connection = await dbConnect();
    await CopyCredit.init();
    const existing = await CopyCredit.findOne({ requestId: body.requestId });
    if (existing) return reply(existing.toObject());
    const transaction = await connection.startSession();
    try {
      const result = await transaction.withTransaction(async () => {
        const profile = await CopyProfile.findOneAndUpdate(
          { _id: body.profileId, active: true, isDemo: { $ne: true } },
          { $inc: { revision: 1 } },
          { new: true, session: transaction },
        );
        if (!profile) throw new Error("PROFILE_UNAVAILABLE");
        const user = await User.findOneAndUpdate(
          {
            _id: body.userId,
            copyProfileId: body.profileId,
            copySessionId: body.copySessionId,
            status: { $ne: "suspended" },
          },
          { $inc: { balance: amount } },
          { new: true, session: transaction },
        );
        if (!user) throw new Error("COPY_STOPPED");
        const [credit] = await CopyCredit.create(
          [
            {
              requestId: body.requestId,
              userId: user._id,
              profileId: profile._id,
              copySessionId: body.copySessionId,
              profileName: profile.name,
              amount,
              currency: user.currency || "USD",
              note: body.note.trim(),
              adminId: admin.user.id,
              balanceAfter: user.balance,
            },
          ],
          { session: transaction },
        );
        await Deposit.create(
          [
            {
              userId: user._id,
              amountLocal: amount,
              currency: user.currency || "USD",
              method: "COPY_PROFIT_CREDIT",
              status: "APPROVED",
              copyProfileId: profile._id,
              copyProfileName: profile.name,
              copyCreditId: credit._id,
              creditNote: body.note.trim(),
              creditedBy: admin.user.id,
            },
          ],
          { session: transaction },
        );
        return credit.toObject();
      });
      return reply(result);
    } finally {
      await transaction.endSession();
    }
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      const existing = await CopyCredit.findOne({ requestId: body.requestId });
      if (existing) return reply(existing.toObject());
    }
    if (
      error instanceof Error &&
      ["COPY_STOPPED", "PROFILE_UNAVAILABLE"].includes(error.message)
    )
      return NextResponse.json(
        {
          error:
            demoCopy.profileCreditError,
        },
        { status: 409 },
      );
    return NextResponse.json(
      {
        error:
          "Credit was not confirmed. Retry this request to check its status safely.",
      },
      { status: 500 },
    );
  }
}
