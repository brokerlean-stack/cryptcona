import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import dbConnect from "@/lib/db";
import Deposit from "@/models/Deposit";

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json();
    await dbConnect();

    await Deposit.findByIdAndUpdate(id, { status: "REJECTED" });

    return NextResponse.json({ success: true, message: "Deposit rejected" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
