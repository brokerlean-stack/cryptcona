import mongoose from "mongoose";
const globalDatabase = globalThis as typeof globalThis & {
  cryptconaDatabase?: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};
const cached = (globalDatabase.cryptconaDatabase ||= {
  conn: null,
  promise: null,
});
export default async function dbConnect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Cryptcona database is not configured.");
  if (cached.conn) return cached.conn;
  if (!cached.promise)
    cached.promise = mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB_NAME || "cryptcona_broker",
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
    });
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
}
