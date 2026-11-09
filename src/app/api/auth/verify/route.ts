import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { sendWelcomeEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    await dbConnect();
    let { email, code } = await req.json();
    email = email?.toLowerCase().trim();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and verification code are required" },
        { status: 400 },
      );
    }

    const user = await User.findOne({
      email,
      verificationCode: code,
      verificationCodeExpiry: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 400 },
      );
    }

    // Mark user as verified
    user.isVerified = true;
    user.status = "active";
    user.verificationCode = undefined;
    user.verificationCodeExpiry = undefined;
    await user.save();

    // Send welcome email after successful verification
    await sendWelcomeEmail(user.email, user.name);

    return NextResponse.json(
      {
        success: true,
        message: "Account verified successfully",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Verification Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
