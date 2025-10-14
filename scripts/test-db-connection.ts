// IMPORTANT: Load environment variables FIRST, before any other imports
import { readFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
const envFile = readFileSync(envPath, "utf-8");

const loadedVars: string[] = [];

envFile.split("\n").forEach((line) => {
  const trimmedLine = line.trim();
  // Skip empty lines and comments
  if (!trimmedLine || trimmedLine.startsWith("#")) return;

  const [key, ...valueParts] = trimmedLine.split("=");
  const value = valueParts.join("=").trim();

  if (key && value) {
    process.env[key.trim()] = value;
    loadedVars.push(key.trim());
  }
});

console.log("✅ Loaded environment variables from .env.local");
console.log(`   Variables found: ${loadedVars.join(", ")}`);
console.log(
  `   MONGODB_URI is ${process.env.MONGODB_URI ? "SET ✓" : "NOT SET ✗"}\n`
);

// NOW import the database module (after env vars are loaded)
import { connectToDatabase } from "../database/mongoose";
import mongoose from "mongoose";

async function testConnection() {
  console.log("🔍 Testing database connection...\n");

  try {
    // Test 1: Connect to database
    console.log("Test 1: Attempting to connect to MongoDB...");
    const connection = await connectToDatabase();

    if (connection) {
      console.log("✅ Test 1 PASSED: Successfully connected to MongoDB\n");
    }

    // Test 2: Check connection state
    console.log("Test 2: Verifying connection state...");
    const readyState = mongoose.connection.readyState;
    const states = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };

    console.log(
      `Connection state: ${states[readyState as keyof typeof states]}`
    );

    if (readyState === 1) {
      console.log("✅ Test 2 PASSED: Connection is active\n");
    } else {
      console.log("❌ Test 2 FAILED: Connection is not active\n");
      process.exit(1);
    }

    // Test 3: Check database name
    console.log("Test 3: Checking database name...");
    const dbName = mongoose.connection.db?.databaseName;
    console.log(`Database name: ${dbName || "N/A"}`);

    if (dbName) {
      console.log("✅ Test 3 PASSED: Database name retrieved\n");
    } else {
      console.log("⚠️  Test 3 WARNING: Could not retrieve database name\n");
    }

    // Test 4: List collections (if any)
    console.log("Test 4: Listing collections...");
    const collections = await mongoose.connection.db
      ?.listCollections()
      .toArray();

    if (collections && collections.length > 0) {
      console.log(`Found ${collections.length} collection(s):`);
      collections.forEach((col) => console.log(`  - ${col.name}`));
      console.log("✅ Test 4 PASSED: Collections retrieved\n");
    } else {
      console.log(
        "ℹ️  No collections found (this is normal for a new database)\n"
      );
    }

    // All tests passed
    console.log(
      "✅ ALL TESTS PASSED! Database connection is working properly.\n"
    );

    // Clean up
    await mongoose.connection.close();
    console.log("🔌 Connection closed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ DATABASE CONNECTION TEST FAILED\n");
    console.error("Error details:", error);
    process.exit(1);
  }
}

// Run the test
testConnection();
