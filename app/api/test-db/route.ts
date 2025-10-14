import { connectToDatabase } from "@/database/mongoose";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET() {
  try {
    // Attempt to connect to the database
    await connectToDatabase();

    // Get database information
    const dbName = mongoose.connection.db?.databaseName;
    const collections = await mongoose.connection.db
      ?.listCollections()
      .toArray();
    const readyState = mongoose.connection.readyState;

    const states = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };

    return NextResponse.json({
      success: true,
      message: "✅ Database connected successfully",
      details: {
        database: dbName || "N/A",
        collections: collections?.map((c) => c.name) || [],
        collectionCount: collections?.length || 0,
        readyState: readyState,
        status: states[readyState as keyof typeof states],
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "❌ Database connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
