import mongoose from "mongoose";
import ProductAttribute from "../models/productAttribute.js";

// Your client's predefined values
const predefinedAttributes = {
  // Product List (what you call "Product")
  list: [
    "T-Shirt",
    "Shorts",
    "Pant",
    "Kurtha",
    "Top",
    "Shirt",
    "Others"
  ],
  
  // Product Category
  category: [
    "Men",
    "Women",
    "Kids",
    "Others"
  ],
  
  // Product Type (can be multiple)
  type: [
    "Polo",
    "RNeck",
    "Regular Fit",
    "Comfort Fit",
    "Jogger",
    "Cargo",
    "Baggy",
    "Capri",
    "Hoodies",
    "Sweat Shirts",
    "Chinees Collar",
    "VNeck",
    "Long",
    "Short",
    "Casual",
    "Formal",
    "Slim Fit",
    "Others"
  ],
  
  // Product Style
  style: [
    "F/S",
    "H/S",
    "3/4",
    "Tipping",
    "Cut & Sew",
    "Sports",
    "Others"
  ],
  
  // Fabric
  fabric: [
    "Airtex",
    "Single Jercy",
    "L.Single Jercy",
    "F.Terry-R",
    "F.Tery-UR",
    "Interlock",
    "Mars",
    "Tencil",
    "Slub Jercy",
    "Lycra Jercy",
    "Ultra NS",
    "Taiwan",
    "Crass Cargo",
    "Others"
  ]
};

/**
 * Seed product attributes into the database
 * This will run once to populate initial data
 */
export const seedProductAttributes = async () => {
  try {
    console.log("🌱 Starting product attributes seeding...");
    
    let totalInserted = 0;
    let totalSkipped = 0;
    
    // Loop through each attribute type
    for (const [attributeType, values] of Object.entries(predefinedAttributes)) {
      console.log(`\n📦 Processing ${attributeType}...`);
      
      for (const value of values) {
        try {
          // Check if already exists (case-insensitive)
          const existing = await ProductAttribute.findOne({
            attributeType,
            value: { $regex: new RegExp(`^${value}$`, 'i') }
          });
          
          if (existing) {
            console.log(`  ⏭️  Skipped: ${value} (already exists)`);
            totalSkipped++;
            continue;
          }
          
          // Insert new attribute
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
          
        } catch (error) {
          // Handle duplicate key errors gracefully
          if (error.code === 11000) {
            console.log(`  ⏭️  Skipped: ${value} (duplicate)`);
            totalSkipped++;
          } else {
            console.error(`  ❌ Error inserting ${value}:`, error.message);
          }
        }
      }
    }
    
    console.log("\n" + "=".repeat(50));
    console.log("🎉 Seeding completed!");
    console.log(`✅ Total inserted: ${totalInserted}`);
    console.log(`⏭️  Total skipped: ${totalSkipped}`);
    console.log("=".repeat(50) + "\n");
    
    // Display summary by type
    console.log("📊 Current database summary:");
    for (const attributeType of Object.keys(predefinedAttributes)) {
      const count = await ProductAttribute.countDocuments({ 
        attributeType, 
        isActive: true 
      });
      console.log(`  ${attributeType}: ${count} values`);
    }
    
    return { success: true, inserted: totalInserted, skipped: totalSkipped };
    
  } catch (error) {
    console.error("❌ Error seeding product attributes:", error);
    throw error;
  }
};

/**
 * Clear all product attributes (use with caution!)
 */
export const clearProductAttributes = async () => {
  try {
    const result = await ProductAttribute.deleteMany({});
    console.log(`🗑️  Deleted ${result.deletedCount} product attributes`);
    return result;
  } catch (error) {
    console.error("❌ Error clearing product attributes:", error);
    throw error;
  }
};

/**
 * Reset and reseed (clear + seed)
 */
export const resetAndReseed = async () => {
  try {
    console.log("🔄 Resetting product attributes...\n");
    await clearProductAttributes();
    await seedProductAttributes();
    console.log("✅ Reset complete!\n");
  } catch (error) {
    console.error("❌ Error during reset:", error);
    throw error;
  }
};

// If this file is run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  // Connect to MongoDB - Use your actual connection string
  const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb+srv://linzzzo183:7AJjEL58aij8ciqa@billing.qtk1n48.mongodb.net/?retryWrites=true&w=majority&appName=billing";
  mongoose.connect(MONGODB_URI)
    .then(async () => {
      console.log("✅ Connected to MongoDB\n");
      
      // Check command line argument
      const command = process.argv[2];
      
      if (command === "reset") {
        await resetAndReseed();
      } else if (command === "clear") {
        await clearProductAttributes();
      } else {
        await seedProductAttributes();
      }
      
      await mongoose.connection.close();
      console.log("👋 Database connection closed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ MongoDB connection error:", error);
      process.exit(1);
    });
}

export default seedProductAttributes;