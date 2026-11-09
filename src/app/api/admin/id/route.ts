import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ADMIN_EMAIL } from "@/lib/adminConstants";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const admin = await User.findOne({ email: ADMIN_EMAIL });
    if (!admin)
      return NextResponse.json({ error: "Support account unavailable" }, { status: 404 });
    return NextResponse.json({ id: admin._id });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
