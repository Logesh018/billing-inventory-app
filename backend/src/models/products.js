import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  hsn: { type: String, required: false, trim: true },

  style: { type: String, trim: true },
  color: { type: String, trim: true },
  fabricType: { type: String, trim: true },

  // Product details
  category: { type: String, trim: true },
  subcategory: { type: String, trim: true },
  description: { type: String, trim: true },

  fabricConfigurations: [{
    fabricType: { type: String, trim: true, required: true }, // "Airtex", "Single Jersey", etc.
    // Sizes available for this fabric type
    availableSizes: [{
      type: String,
      enum: ["XS", "S", "M", "L", "XL", "XXL", "Free Size", "Custom"]
    }],

    // Common colors for this fabric type
    availableColors: [{ type: String, trim: true }],

    // Fabric-specific details
    gsm: { type: String, trim: true },
  }],

  // Default configurations (fallback when no fabric type is selected)
  availableSizes: [{
    type: String,
    enum: ["XS", "S", "M", "L", "XL", "XXL", "Free Size", "Custom"]
  }],

  availableColors: [{ type: String, trim: true }],

  // Manufacturing details  
  fabricType: { type: String, trim: true },
  gsm: { type: String, trim: true },
  gender: { type: String, enum: ["Male", "Female", "Unisex"] },

  // Status
  isActive: { type: Boolean, default: true },

  // Usage tracking
  totalOrders: { type: Number, default: 0 },
  totalQuantityOrdered: { type: Number, default: 0 },
  lastOrderedDate: { type: Date },

}, { timestamps: true });

// Indexes for search functionality
ProductSchema.index({ name: "text", category: "text", description: "text" });
ProductSchema.index({ name: 1 });
ProductSchema.index({ hsn: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ isActive: 1 });

ProductSchema.index(
  { name: 1, style: 1, color: 1, fabricType: 1 },
  {
    unique: true,
    partialFilterExpression: {
      style: { $exists: true, $ne: "" },
      color: { $exists: true, $ne: "" },
      fabricType: { $exists: true, $ne: "" }
    }
  }
);

// Pre-save middleware to format data
ProductSchema.pre("save", function (next) {
  // Capitalize first letter of name
  if (this.name) {
    this.name = this.name.charAt(0).toUpperCase() + this.name.slice(1);
  }

  // Uppercase HSN code
  if (this.hsn) {
    this.hsn = this.hsn.toUpperCase();
  }

  next();
});

// Static method to search products by name
ProductSchema.statics.searchByName = function (searchTerm) {
  const regex = new RegExp(searchTerm, 'i'); // Case-insensitive search
  return this.find({
    $and: [
      { isActive: true },
      {
        $or: [
          { name: regex },
          { category: regex },
          { hsn: regex }
        ]
      }
    ]
  }).select('name hsn category availableSizes availableColors fabricConfigurations').limit(10);
};

// New method to get configuration for a specific fabric type
ProductSchema.methods.getConfigurationForFabric = function (fabricType) {
  if (!fabricType) {
    return {
      sizes: this.availableSizes || [],
      colors: this.availableColors || []
    };
  }

  const config = this.fabricConfigurations.find(
    f => f.fabricType.toLowerCase() === fabricType.toLowerCase()
  );

  if (config) {
    return {
      sizes: config.availableSizes || this.availableSizes || [],
      colors: config.availableColors || this.availableColors || []
    };
  }

  // Return defaults if fabric type not found
  return {
    sizes: this.availableSizes || [],
    colors: this.availableColors || []
  };
};

export default mongoose.model("Product", ProductSchema);