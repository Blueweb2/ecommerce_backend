/**
 * Run with: node scripts/migrate-variants.js
 * Migrates existing products with broken variant attributes (e.g., attributes: {})
 * by reconstructing the correct attribute values from the variant's SKU pattern
 * and product attribute definitions.
 */
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ No MongoDB URI found. Set MONGODB_URI in your .env file.");
  process.exit(1);
}

const ATTRIBUTE_CODE_MAP = {
  color: {
    red: "RD",
    blue: "BL",
    black: "BK",
  },
  size: {
    small: "SM",
    medium: "MD",
    large: "LG",
  },
};

function getAttributeCode(attrName, attrValue) {
  const map = ATTRIBUTE_CODE_MAP[attrName.toLowerCase()];
  if (!map) return attrValue.substring(0, 2).toUpperCase();

  return (
    map[attrValue.toLowerCase()] ||
    attrValue.substring(0, 2).toUpperCase()
  );
}

async function run() {
  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected.");

  const db = mongoose.connection.db;
  const productsCollection = db.collection("products");

  const products = await productsCollection.find({}).toArray();
  console.log(`📋 Total products fetched: ${products.length}`);

  let updatedCount = 0;

  for (const product of products) {
    if (!product.variants || !Array.isArray(product.variants) || product.variants.length === 0) {
      continue;
    }

    let productUpdated = false;
    const updatedVariants = product.variants.map((variant) => {
      const currentAttrs = variant.attributes || {};
      const hasAttrs = Object.keys(currentAttrs).length > 0;

      // If it's broken (empty) and product actually has attributes
      if (!hasAttrs && product.attributes && product.attributes.length > 0 && variant.sku) {
        console.log(`🔍 Reconstructing attributes for product: ${product.name} (${product._id}), Variant SKU: ${variant.sku}`);
        
        const skuParts = variant.sku.toUpperCase().split("-");
        const reconstructed = {};

        for (const attr of product.attributes) {
          const attrName = attr.name.trim().toLowerCase();
          const attrValues = attr.values || [];
          let matchedValue = null;

          // 1. Try mapping using getAttributeCode
          for (const val of attrValues) {
            const code = getAttributeCode(attrName, val).toUpperCase();
            if (skuParts.includes(code)) {
              matchedValue = val.toLowerCase().trim();
              break;
            }
          }

          // 2. Try exact val match in SKU parts
          if (!matchedValue) {
            for (const val of attrValues) {
              const valUpper = val.toUpperCase().trim();
              if (skuParts.includes(valUpper)) {
                matchedValue = val.toLowerCase().trim();
                break;
              }
            }
          }

          // 3. Try fuzzy/substring match
          if (!matchedValue) {
            for (const val of attrValues) {
              const valClean = val.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
              for (const part of skuParts) {
                if (part === valClean || valClean.startsWith(part) || part.startsWith(valClean)) {
                  matchedValue = val.toLowerCase().trim();
                  break;
                }
              }
              if (matchedValue) break;
            }
          }

          if (matchedValue) {
            reconstructed[attrName] = matchedValue;
          }
        }

        if (Object.keys(reconstructed).length > 0) {
          console.log(`   💡 Reconstructed attributes:`, reconstructed);
          variant.attributes = reconstructed;
          productUpdated = true;
        } else {
          console.log(`   ⚠️ Could not reconstruct attributes for SKU: ${variant.sku}`);
        }
      } else if (hasAttrs) {
        // Normalize existing attributes just in case
        const normalized = {};
        for (const [k, v] of Object.entries(currentAttrs)) {
          normalized[k.trim().toLowerCase()] = String(v).trim().toLowerCase();
        }
        if (JSON.stringify(currentAttrs) !== JSON.stringify(normalized)) {
          variant.attributes = normalized;
          productUpdated = true;
        }
      }

      return variant;
    });

    if (productUpdated) {
      await productsCollection.updateOne(
        { _id: product._id },
        { $set: { variants: updatedVariants } }
      );
      console.log(`✅ Updated product: ${product.name} (${product._id})`);
      updatedCount++;
    }
  }

  console.log(`🎉 Migration finished. Updated ${updatedCount} products.`);
  await mongoose.disconnect();
  console.log("🔌 Disconnected from MongoDB.");
}

run().catch((err) => {
  console.error("❌ Migration error:", err);
  process.exit(1);
});
