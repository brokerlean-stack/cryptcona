import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import dbConnect from "@/lib/db";
import CopyProfile from "@/models/CopyProfile";
import User from "@/models/User";
import { storeImage, ImageUploadError } from "@/lib/imagekit";
import { objectIdPattern, validateProfile } from "@/lib/copyTrading";

export async function GET() {
  if (!(await getAdminSession()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await dbConnect();
    const [profiles, followers] = await Promise.all([
      CopyProfile.find().sort({ createdAt: -1 }).lean(),
      User.find({ copyProfileId: { $ne: null } })
        .select(
          "name email balance currency copyProfileId copyStartedAt copySessionId",
        )
        .lean(),
    ]);
    return NextResponse.json({ profiles, followers });
  } catch {
    return NextResponse.json(
      { error: "Unable to load copy trading." },
      { status: 500 },
    );
  }
}
export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid profile." }, { status: 400 });
  if (
    body._id !== undefined &&
    (typeof body._id !== "string" || !objectIdPattern.test(body._id))
  )
    return NextResponse.json({ error: "Invalid profile ID." }, { status: 400 });
  try {
    await dbConnect();
    const existing = body._id ? await CopyProfile.findById(body._id) : null;
    if (body._id && !existing) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    const { value, error } = validateProfile(body, existing?.photo);
    if (error || !value) return NextResponse.json({ error }, { status: 400 });
    if (value.photo.startsWith("data:")) value.photo = await storeImage(value.photo, "profiles", session.user.id);
    const data = { ...value, updatedBy: session.user.id };
    const profile = body._id
      ? await CopyProfile.findByIdAndUpdate(
          body._id,
          { $set: data, $inc: { revision: 1 } },
          { new: true, runValidators: true },
        )
      : await CopyProfile.create(data);
    if (!profile)
      return NextResponse.json(
        { error: "Profile not found." },
        { status: 404 },
      );
    return NextResponse.json({ profile });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof ImageUploadError ? error.message : "Unable to save profile." },
      { status: error instanceof ImageUploadError ? error.status : 500 },
    );
  }
}
