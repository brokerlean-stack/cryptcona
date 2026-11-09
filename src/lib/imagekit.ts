import ImageKit, { toFile } from "@imagekit/nodejs";
import { randomUUID } from "node:crypto";
import Media from "@/models/Media";

export class ImageUploadError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function imageKitClient() {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const endpoint = process.env.IMAGEKIT_URL_ENDPOINT;
  if (!privateKey || !endpoint?.startsWith("https://"))
    throw new ImageUploadError("Image uploads are not configured. Please contact support.", 503);
  return new ImageKit({ privateKey, maxRetries: 0, timeout: 30000 });
}
export function decodeImage(value: unknown, maxBytes: number) {
  if (typeof value !== "string" || value.length > Math.ceil(maxBytes * 4 / 3) + 100)
    throw new ImageUploadError("Image is too large.");
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) throw new ImageUploadError("Choose a PNG, JPEG or WebP image.");
  const bytes = Buffer.from(match[2], "base64");
  const type = match[1];
  const valid = type === "png" ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    : type === "jpeg" ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  if (!valid || bytes.length > maxBytes) throw new ImageUploadError("Invalid image or file too large.");
  return { bytes, type };
}
export async function storeImage(value: unknown, purpose: "profiles" | "support" | "identity", ownerId: string) {
  const { bytes, type } = decodeImage(value, (purpose === "profiles" ? 1 : 5) * 1024 * 1024);
  const client = imageKitClient();
  try {
    const fileName = `${randomUUID()}.${type === "jpeg" ? "jpg" : type}`;
    const result = await client.files.upload({
      file: await toFile(bytes, fileName, { type: `image/${type}` }),
      fileName, folder: `/cryptcona/${purpose}/${ownerId}`,
      isPrivateFile: purpose !== "profiles", useUniqueFileName: true,
    });
    if (!result.fileId || !result.filePath || !result.url) throw new Error("Incomplete upload response");
    if (purpose === "profiles") return result.url;
    try {
      const media = await Media.create({ ownerId, purpose, fileId: result.fileId, filePath: result.filePath });
      return `/api/media/${media._id}`;
    } catch (error) {
      await client.files.delete(result.fileId).catch(() => {});
      throw error;
    }
  } catch {
    throw new ImageUploadError("Image upload failed. Please try again.", 502);
  }
}
