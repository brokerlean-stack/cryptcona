import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Message from "@/models/Message";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const userId = (session.user as any).id;

    // Fetch unread messages for the user
    const unreadMessages = await Message.find({
      receiverId: userId,
      isRead: false,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Map to expected AppNotification format
    const notifications = unreadMessages.map((msg: any) => ({
      id: msg._id.toString(),
      title: "New Message",
      message:
        msg.content.length > 50
          ? msg.content.substring(0, 50) + "..."
          : msg.content,
      read: msg.isRead,
      createdAt: msg.createdAt.toISOString(),
    }));

    return NextResponse.json(notifications);
  } catch (error: any) {
    console.error("Notifications API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
