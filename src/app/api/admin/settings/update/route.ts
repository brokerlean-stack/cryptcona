import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import dbConnect from "@/lib/db";
import Setting from "@/models/Setting";

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json().catch(() => null);
    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { key, value, description, create } = payload;
    if (
      typeof key !== "string" ||
      !/^[a-z][a-z0-9_]{0,119}$/.test(key) ||
      typeof value !== "string" ||
      value.length > 10000 ||
      (description !== undefined &&
        (typeof description !== "string" ||
          !description.trim() ||
          description.length > 100))
    ) {
      return NextResponse.json(
        { error: "Invalid setting name or details" },
        { status: 400 },
      );
    }
    if (
      key.startsWith("payment_") &&
      (!/^payment_[a-z0-9]+(?:_[a-z0-9]+)*$/.test(key) ||
        (create && (!value.trim() || !description?.trim())))
    ) {
      return NextResponse.json(
        { error: "Enter a valid payment method name and details" },
        { status: 400 },
      );
    }

    await dbConnect();

    const update = {
      value: value.trim(),
      ...(description !== undefined ? { description: description.trim() } : {}),
    };
    const setting = create
      ? await Setting.create({ key, ...update })
      : await Setting.findOneAndUpdate(
          { key },
          { $set: update },
          { upsert: true, new: true, runValidators: true },
        );

    return NextResponse.json({
      success: true,
      message: "Setting updated",
      setting,
    });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === 11000) {
      return NextResponse.json(
        {
          error:
            "This payment method already exists. Edit the existing method.",
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Unable to save settings. Please try again." },
      { status: 500 },
    );
  }
}
