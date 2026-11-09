import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { profileDetails } from "@/lib/profileValidation";
import { storeImage, ImageUploadError } from "@/lib/imagekit";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { name, phone, profilePhoto, country, password } = await req.json();
    let details;
    try { details = profileDetails({ name, phone }); }
    catch (error: any) { return NextResponse.json({ error: error.message }, { status: 400 }); }
    if (country !== undefined && (typeof country !== "string" || country.length > 100))
      return NextResponse.json({ error: "Invalid country" }, { status: 400 });
    if (password && (typeof password !== "string" || password.length < 8 || password.length > 72))
      return NextResponse.json({ error: "Password must contain 8 to 72 characters." }, { status: 400 });

    await dbConnect();
    const user = await User.findById(userId);
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    Object.assign(user, details);
    if (profilePhoto !== undefined) user.profilePhoto = await storeImage(profilePhoto, "profiles", userId);
    if (country) user.country = country;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      profile: { name: user.name, phone: user.phone, profilePhoto: user.profilePhoto },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e instanceof ImageUploadError ? e.message : "Unable to save your profile. Please try again." }, { status: e instanceof ImageUploadError ? e.status : 500 });
  }
}
