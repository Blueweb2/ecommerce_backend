/**
 * Run with: node scripts/drop-variants-sku-index.js
 * Drops the problematic unique index on variants.sku that causes
 * E11000 duplicate key errors when products have no variants.
 */
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ No MongoDB URI found. Set MONGODB_URI in your .env file.");
  process.exit(1);
}

async function run() {
  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected.");

  const db = mongoose.connection.db;
  const collection = db.collection("products");

  const indexes = await collection.indexes();
  console.log("📋 Current indexes:", indexes.map((i) => i.name));

  const target = indexes.find((i) => i.name === "variants.sku_1");

  if (!target) {
    console.log("ℹ️  Index 'variants.sku_1' not found — nothing to drop.");
  } else {
    await collection.dropIndex("variants.sku_1");
    console.log("✅ Dropped index 'variants.sku_1' successfully.");
  }

  await mongoose.disconnect();
  console.log("✅ Done.");
}

run().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
