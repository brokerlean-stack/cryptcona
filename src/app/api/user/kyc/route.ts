import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { storeImage, decodeImage, ImageUploadError } from "@/lib/imagekit";
import { profileDetails } from "@/lib/profileValidation";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { frontImage, backImage, selfieImage, name, phone } = await req.json();
    let details;
    try { details = profileDetails({ name, phone }); }
    catch (error: any) { return NextResponse.json({ error: error.message }, { status: 400 }); }

    if (!frontImage || !backImage || !selfieImage) {
      return NextResponse.json(
        { error: "All 3 documents are required" },
        { status: 400 },
      );
    }

    await dbConnect();

    const user = await User.findById((session.user as any).id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    Object.assign(user, details);
    if (!user.name || !user.phone) return NextResponse.json({ error: "Add your full name and phone number before submitting verification." }, { status: 400 });
    if (user.verificationStatus === "pending" || (user.verificationStatus === "verified" && (user.kycFront || user.kycBack || user.kycSelfie))) return NextResponse.json({ error: "Verification has already been submitted." }, { status: 409 });
    for (const image of [frontImage, backImage, selfieImage]) decodeImage(image, 5 * 1024 * 1024);
    const urls = [];
    for (const image of [frontImage, backImage, selfieImage]) urls.push(await storeImage(image, "identity", String(user._id)));
    [user.kycFront, user.kycBack, user.kycSelfie] = urls;
    user.verificationStatus = "pending";

    await user.save();

    return NextResponse.json({
      message: "KYC documents submitted successfully. Status is now pending.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error instanceof ImageUploadError ? error.message : "Error saving documents" },
      { status: error instanceof ImageUploadError ? error.status : 500 },
    );
  }
}
