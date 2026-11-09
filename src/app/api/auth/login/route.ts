import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    await dbConnect();
    let { email, password } = await req.json();
    email = email?.toLowerCase().trim();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return NextResponse.json(
        { error: "Invalid account credentials" },
        { status: 401 },
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid account credentials" },
        { status: 401 },
      );
    }

    // Return user data (excluding password)
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      balance: user.balance,
      currency: user.currency,
      country: user.country,
      group: "Elite", // Hardcoded for branding
    };

    return NextResponse.json(
      {
        success: true,
        message: "Login successful",
        user: userData,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
