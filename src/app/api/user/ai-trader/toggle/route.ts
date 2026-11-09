import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { active } = await req.json();

    await dbConnect();
    const user = await User.findById(userId);
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    user.aiTraderActive = active;
    await user.save();

    return NextResponse.json({
      success: true,
      aiTraderActive: user.aiTraderActive,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
