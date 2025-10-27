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
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      autoIndex: false, // Disable autoIndex to prevent startup failures with unique indexes
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log(
      `✅ Connected to MongoDB successfully (${
        process.env.NODE_ENV || "development"
      })`
    );

    // Sync indexes after successful connection
    // This ensures indexes defined in models are created in the database
    try {
      await mongoose.syncIndexes();
      console.log("✅ Indexes synchronized successfully");
    } catch (syncError) {
      console.error("⚠️ Warning: Index sync encountered issues:", syncError);
      // Don't throw - connection is still valid, indexes will be handled by initialization script
    }
  } catch (err) {
    cached.promise = null;
    console.error("❌ MongoDB connection error:", err);
    throw err;
  }

  return cached.conn;
};
