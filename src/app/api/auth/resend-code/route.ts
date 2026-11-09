import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { sendVerificationEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json(
        { error: "Account is already verified" },
        { status: 400 },
      );
    }

    // Generate new 6-digit Verification Code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.verificationCode = verificationCode;
    user.verificationCodeExpiry = verificationCodeExpiry;
    await user.save();

    // Send Verification Email
    await sendVerificationEmail(email, verificationCode);

    return NextResponse.json(
      {
        success: true,
        message: "New verification code sent to your email.",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Resend Code Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
