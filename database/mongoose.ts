import mongoose from "mongoose";

declare global {
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export const connectToDatabase = async () => {
  // Read MONGODB_URI at runtime, not at module load time
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) throw new Error("MONGODB_URI must be set within .env");

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
  }

  try {
    cached.conn = await cached.promise;
    console.log(
      `✅ Connected to MongoDB successfully (${
        process.env.NODE_ENV || "development"
      })`
    );
  } catch (err) {
    cached.promise = null;
    console.error("❌ MongoDB connection error:", err);
    throw err;
  }

  return cached.conn;
};
