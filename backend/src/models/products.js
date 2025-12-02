import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  // Basic Product Information
  name: { type: String, required: true, trim: true },
  hsn: { type: String, required: false, trim: true },

  // ⭐ NEW STRUCTURE - Matches Order Product Details
  category: { type: String, trim: true },              // Men, Women, Kids
  type: [{ type: String, trim: true }],                // ⭐ ARRAY: Multiple types allowed
  style: [{ type: String, trim: true }],                 // F/S, H/S, 3/4, etc.
  fabric: { type: String, trim: true },                // Airtex, Single Jercy, etc.
  color: { type: String, trim: true },

  // DEPRECATED (keep for backward compatibility, but use new fields above)
  fabricType: { type: String, trim: true },            // Old field - mapped to 'fabric'

  // Additional Product Details
  subcategory: { type: String, trim: true },
  description: { type: String, trim: true },
  gsm: { type: String, trim: true },
  gender: { type: String, enum: ["Male", "Female", "Unisex"] },

  // Fabric Configurations (keeping this for advanced use cases)
  fabricConfigurations: [{
    fabricType: { type: String, trim: true, required: true },
    availableSizes: [{
      type: String,
      enum: ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Free Size", "Custom"]
    }],
    availableColors: [{ type: String, trim: true }],
    gsm: { type: String, trim: true },
  }],

  // Default configurations
  availableSizes: [{
    type: String,
    enum: ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Free Size", "Custom"]
  }],
  availableColors: [{ type: String, trim: true }],

  // Status
  isActive: { type: Boolean, default: true },

  // Usage tracking
  totalOrders: { type: Number, default: 0 },
  totalQuantityOrdered: { type: Number, default: 0 },
  lastOrderedDate: { type: Date },

}, { timestamps: true });

// ⭐ UPDATED INDEX: Now includes new fields
ProductSchema.index({
  name: 1,
  style: 1,
  color: 1,
  fabric: 1,
  category: 1
});

// Text search index
ProductSchema.index({ name: "text", category: "text", description: "text" });

// Other indexes
ProductSchema.index({ name: 1 });
ProductSchema.index({ hsn: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ isActive: 1 });

// Compound unique index for product variants
ProductSchema.index(
  { name: 1, style: 1, color: 1, fabric: 1 },
  {
    unique: true,
    partialFilterExpression: {
      style: { $exists: true, $ne: "" },
      color: { $exists: true, $ne: "" },
      fabric: { $exists: true, $ne: "" }
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

  // ⭐ NEW: Map fabricType to fabric for backward compatibility
  if (this.fabricType && !this.fabric) {
    this.fabric = this.fabricType;
  }
  if (this.fabric && !this.fabricType) {
    this.fabricType = this.fabric;
  }

  // ⭐ NEW: Ensure type is always an array
  if (this.type && !Array.isArray(this.type)) {
    this.type = [this.type];
  }

  next();
});

// ⭐ UPDATED: Static method to search products by name
ProductSchema.statics.searchByName = function (searchTerm) {
  const regex = new RegExp(searchTerm, 'i');
  return this.find({
    $and: [
      { isActive: true },
      {
        $or: [
          { name: regex },
          { category: regex },
          { hsn: regex },
          { style: regex },
          { fabric: regex },
          { color: regex }
        ]
      }
    ]
  })
    .select('name hsn category type style fabric color availableSizes availableColors fabricConfigurations')
    .limit(10);
};

// Method to get configuration for a specific fabric type
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

  return {
    sizes: this.availableSizes || [],
    colors: this.availableColors || []
  };
};

// ⭐ NEW: Method to check if product matches given attributes
ProductSchema.methods.matchesAttributes = function (attributes) {
  const { name, category, type, style, fabric, color } = attributes;

  let matches = true;

  if (name && this.name.toLowerCase() !== name.toLowerCase()) matches = false;
  if (category && this.category?.toLowerCase() !== category.toLowerCase()) matches = false;
  if (style && this.style?.toLowerCase() !== style.toLowerCase()) matches = false;
  if (fabric && this.fabric?.toLowerCase() !== fabric.toLowerCase()) matches = false;
  if (color && this.color?.toLowerCase() !== color.toLowerCase()) matches = false;

  // For type (array), check if all provided types are included
  if (type && Array.isArray(type)) {
    const productTypes = this.type || [];
    const allTypesMatch = type.every(t =>
      productTypes.some(pt => pt.toLowerCase() === t.toLowerCase())
    );
    if (!allTypesMatch) matches = false;
  }

  return matches;
};

// ⭐ NEW: Static method to find or create product
ProductSchema.statics.findOrCreateProduct = async function (productData) {
  const { name, category, type, style, fabric, color } = productData;

  // Build query
  const query = {
    name,
    style,
    color,
    fabric
  };

  if (category) query.category = category;

  // For type array, we need special handling
  let existingProduct;

  if (type && Array.isArray(type) && type.length > 0) {
    // Find product with exact same types
    existingProduct = await this.findOne({
      ...query,
      type: { $size: type.length, $all: type }
    });
  } else {
    existingProduct = await this.findOne(query);
  }

  if (existingProduct) {
    return existingProduct;
  }

  // Create new product
  const newProduct = await this.create({
    name,
    category: category || "Garment",
    type: type || [],
    style,
    fabric,
    color,
    fabricType: fabric,
    hsn: "",
    isActive: true
  });

  return newProduct;
};

export default mongoose.model("Product", ProductSchema);