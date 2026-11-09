import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, code } = await req.json();

    await dbConnect();
    const user = await User.findById(userId);
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    user.withdrawalCode = code;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Withdrawal code updated successfully",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
