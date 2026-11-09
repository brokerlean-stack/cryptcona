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

    const { userId, status } = await req.json();

    if (!userId || !status) {
      return NextResponse.json(
        { error: "User ID and status are required" },
        { status: 400 },
      );
    }

    await dbConnect();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    user.verificationStatus = status;
    if (status === "verified") {
      user.isVerified = true;
    } else if (status === "rejected") {
      user.isVerified = false;
    }

    await user.save();
    return NextResponse.json({ message: `User KYC marked as ${status}` });
  } catch (error: any) {
    console.error("KYC Status Update Error:", error);
    return NextResponse.json(
      { error: error.message || "Error updating KYC" },
      { status: 500 },
    );
  }
}
