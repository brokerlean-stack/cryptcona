import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminUser } from "@/lib/adminAuth";
import { imageKitClient } from "@/lib/imagekit";
import dbConnect from "@/lib/db";
import Media from "@/models/Media";
import { objectIdPattern } from "@/lib/copyTrading";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const { id } = await context.params;
  if (!objectIdPattern.test(id)) return new Response("Not found", { status: 404 });
  try {
    await dbConnect();
    const media = await Media.findById(id);
    if (!media || (!isAdminUser(session.user) && String(media.ownerId) !== session.user.id))
      return new Response("Not found", { status: 404 });
    const url = imageKitClient().helper.buildSrc({
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!, src: media.filePath,
      signed: true, expiresIn: 60,
    });
    const upstream = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15000) });
    if (!upstream.ok) return new Response("Image unavailable", { status: 502 });
    return new Response(upstream.body, { headers: {
      "Content-Type": upstream.headers.get("content-type") || "application/octet-stream",
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
    } });
  } catch { return new Response("Image unavailable", { status: 502 }); }
}
