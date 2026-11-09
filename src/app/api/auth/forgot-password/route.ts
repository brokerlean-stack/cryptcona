import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { email: rawEmail } = await req.json();
    const email = rawEmail?.toLowerCase().trim();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await User.findOne({ email });

    // For security, don't reveal if user exists or not
    if (!user) {
      return NextResponse.json(
        {
          message:
            "If an account exists with this email, a reset link has been sent.",
        },
        { status: 200 },
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // Send Email
    await sendPasswordResetEmail(email, resetToken);

    return NextResponse.json(
      {
        message:
          "If an account exists with this email, a reset link has been sent.",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
