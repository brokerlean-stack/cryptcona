import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { parseProfitAmount } from "@/lib/profitAmount";

export async function POST(req: Request) {
  try {
    await dbConnect();
    let { name, email, password, country, currency, profitGoal, acceptTerms } = await req.json();
    if (typeof email !== "string" || typeof password !== "string" || password.length < 8)
      return NextResponse.json({ error: "Enter a valid email and a password of at least 8 characters." }, { status: 400 });
    const target = profitGoal === undefined || profitGoal === "" ? 0 : parseProfitAmount(profitGoal);
    if (target === null || target > 1e12) return NextResponse.json({ error: "Enter a positive profit goal with at most two decimals, or leave it blank." }, { status: 400 });
    if (acceptTerms !== true) return NextResponse.json({ error: "Please accept the terms and conditions." }, { status: 400 });
    email = email.toLowerCase().trim();

    // 1. Validation
    if (!name || !email || !password || !country || !currency) {
      return NextResponse.json(
        { error: "All institutional fields are required" },
        { status: 400 },
      );
    }

    // 2. Check existence
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Account with this email already exists" },
        { status: 400 },
      );
    }

    // 3. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create User directly and activate the account
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      country,
      currency,
      balance: 0,
      isVerified: true,
      status: "active",
      verificationStatus: "unverified",
      role: "user",
      profitGoal: target,
      profitGoalBaseline: 0,
      termsVersion: "2026-11-07",
      termsAcceptedAt: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully.",
        userId: user._id,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Registration Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
