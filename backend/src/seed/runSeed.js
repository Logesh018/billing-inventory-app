// Simple seed runner - guaranteed to work
import mongoose from "mongoose";
import ProductAttribute from "../models/productAttribute.js";

console.log("🚀 Starting seed script...\n");

// Your MongoDB URI
const MONGODB_URI = "mongodb+srv://linzzzo183:7AJjEL58aij8ciqa@billing.qtk1n48.mongodb.net/?retryWrites=true&w=majority&appName=billing";

// Predefined values
const predefinedAttributes = {
  list: ["T-Shirt", "Shorts", "Pant", "Kurtha", "Top", "Shirt", "Others"],
  category: ["Men", "Women", "Kids", "Others"],
  type: [
    "Polo", "RNeck", "Regular Fit", "Comfort Fit", "Jogger", "Cargo",
    "Baggy", "Capri", "Hoodies", "Sweat Shirts", "Chinees Collar",
    "VNeck", "Long", "Short", "Casual", "Formal", "Slim Fit", "Others"
  ],
  style: ["F/S", "H/S", "3/4", "Tipping", "Cut & Sew", "Sports", "Others"],
  fabric: [
    "Airtex", "Single Jercy", "L.Single Jercy", "F.Terry-R", "F.Tery-UR",
    "Interlock", "Mars", "Tencil", "Slub Jercy", "Lycra Jercy",
    "Ultra NS", "Taiwan", "Crass Cargo", "Others"
  ]
};

async function runSeed() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected!\n");

    let totalInserted = 0;
    let totalSkipped = 0;

    // Loop through each type
    for (const [attributeType, values] of Object.entries(predefinedAttributes)) {
      console.log(`\n📦 Processing ${attributeType}...`);

      for (const value of values) {
        // Check if exists
        const existing = await ProductAttribute.findOne({
          attributeType,
          value: { $regex: new RegExp(`^${value}$`, 'i') }
        });

        if (existing) {
          console.log(`  ⏭️  Skipped: ${value}`);
          totalSkipped++;
          continue;
        }

        // Create new
        await ProductAttribute.create({
          attributeType,
          value,
          source: "system",
          isActive: true,
          usageCount: 0,
          createdBy: "system"
        });

        console.log(`  ✅ Inserted: ${value}`);
        totalInserted++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("🎉 Seeding completed!");
    console.log(`✅ Total inserted: ${totalInserted}`);
    console.log(`⏭️  Total skipped: ${totalSkipped}`);
    console.log("=".repeat(50) + "\n");

    // Show summary
    console.log("📊 Database summary:");
    for (const attributeType of Object.keys(predefinedAttributes)) {
      const count = await ProductAttribute.countDocuments({ 
        attributeType, 
        isActive: true 
      });
      console.log(`  ${attributeType}: ${count} values`);
    }

    await mongoose.connection.close();
    console.log("\n👋 Connection closed");
    process.exit(0);

  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
}

// Run it!
runSeed();