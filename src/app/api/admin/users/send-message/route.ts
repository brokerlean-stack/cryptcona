import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { sendCustomTemplateEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, subject, title, body } = await req.json();

    if (!userId || !subject || !title || !body) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    await dbConnect();
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await sendCustomTemplateEmail(user.email, subject, title, body);

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
