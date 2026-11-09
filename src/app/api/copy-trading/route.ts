import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomUUID } from "node:crypto";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import CopyProfile from "@/models/CopyProfile";
import CopyCredit from "@/models/CopyCredit";
import User from "@/models/User";
import { objectIdPattern, weekStart } from "@/lib/copyTrading";
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await dbConnect();
    const user = await User.findById(session.user.id).select(
      "copyProfileId copyStartedAt copySessionId currency",
    );
    if (!user)
      return NextResponse.json(
        { error: "Account not found." },
        { status: 404 },
      );
    const [profiles, credits, totals] = await Promise.all([
      CopyProfile.find({ $or: [{ active: true }, { _id: user.copyProfileId }] })
        .select("-updatedBy -revision")
        .sort({ name: 1 })
        .lean(),
      CopyCredit.find({ userId: user._id })
        .select("profileName amount currency note createdAt")
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      CopyCredit.aggregate([
        { $match: { userId: user._id } },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
            weekly: {
              $sum: {
                $cond: [{ $gte: ["$createdAt", weekStart()] }, "$amount", 0],
              },
            },
          },
        },
      ]),
    ]);
    return NextResponse.json({
      profiles,
      credits,
      subscription: {
        profileId: user.copyProfileId,
        startedAt: user.copyStartedAt,
      },
      currency: user.currency,
      totalCredited: totals[0]?.total || 0,
      weeklyCredited: totals[0]?.weekly || 0,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load copy trading." },
      { status: 500 },
    );
  }
}
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (
    !body ||
    typeof body !== "object" ||
    !("profileId" in body) ||
    (body.profileId !== null &&
      (typeof body.profileId !== "string" ||
        !objectIdPattern.test(body.profileId)))
  )
    return NextResponse.json(
      { error: "Choose a valid profile." },
      { status: 400 },
    );
  const connection = await dbConnect().catch(() => null);
  if (!connection)
    return NextResponse.json(
      { error: "Unable to connect to your account." },
      { status: 503 },
    );
  const transaction = await connection.startSession();
  try {
    const result = await transaction.withTransaction(async () => {
      const user = await User.findById(session.user.id).session(transaction);
      if (!user || user.status === "suspended")
        return { error: "Account unavailable.", status: 403 };
      if (body.profileId) {
        // Serialize activation against profile pauses and credit operations.
        const profile = await CopyProfile.findOneAndUpdate(
          { _id: body.profileId, active: true },
          { $inc: { revision: 1 } },
          { session: transaction, new: true },
        );
        if (!profile)
          return { error: "This profile is no longer available.", status: 409 };
      }
      if (String(user.copyProfileId || "") === String(body.profileId || ""))
        return { success: true };
      user.copyProfileId = body.profileId;
      user.copyStartedAt = body.profileId ? new Date() : null;
      user.copySessionId = body.profileId ? randomUUID() : null;
      await user.save({ session: transaction });
      return { success: true };
    });
    return NextResponse.json(result, { status: result?.status || 200 });
  } catch {
    return NextResponse.json(
      { error: "Unable to update your copy status." },
      { status: 500 },
    );
  } finally {
    await transaction.endSession();
  }
}
