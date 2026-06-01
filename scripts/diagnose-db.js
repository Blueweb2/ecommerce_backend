const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;

async function run() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  const productsCollection = db.collection("products");

  const products = await productsCollection.find({}).toArray();
  for (const p of products) {
    if (p.variants && p.variants.length > 0) {
      console.log(`Product: ${p.name}`);
      console.log(`  Attributes:`, JSON.stringify(p.attributes));
      console.log(`  Variants:`);
      for (const v of p.variants) {
        console.log(`    SKU: ${v.sku}, stock: ${v.stock}, attributes:`, JSON.stringify(v.attributes));
      }
    }
  }
  await mongoose.disconnect();
}

run().catch(console.error);
