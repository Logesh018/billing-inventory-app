import mongoose from "mongoose";

const ProductAttributeSchema = new mongoose.Schema({
  attributeType: {
    type: String,
    required: true,
    enum: ["category", "list", "type", "style", "fabric"],
    lowercase: true,
    trim: true
  },
  
  value: {
    type: String,
    required: true,
    trim: true
  },
  
  // Track if this was predefined or user-added
  source: {
    type: String,
    enum: ["system", "user"],
    default: "system"
  },
  
  // For soft delete functionality
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Track usage
  usageCount: {
    type: Number,
    default: 0
  },
  
  // Who added this (optional - for future user tracking)
  createdBy: {
    type: String,
    default: "system"
  }
  
}, { timestamps: true });

// Compound unique index: same value cannot exist twice for same type
ProductAttributeSchema.index({ attributeType: 1, value: 1 }, { unique: true });

// Index for fast queries by type
ProductAttributeSchema.index({ attributeType: 1, isActive: 1 });

// Index for sorting by usage
ProductAttributeSchema.index({ usageCount: -1 });

// Static method to get all values for a specific attribute type
ProductAttributeSchema.statics.getValuesByType = function(attributeType) {
  return this.find({ 
    attributeType, 
    isActive: true 
  })
  .select('value usageCount')
  .sort({ usageCount: -1, value: 1 }) // Sort by usage, then alphabetically
  .lean();
};

// Static method to search values by type and search term
ProductAttributeSchema.statics.searchByTypeAndTerm = function(attributeType, searchTerm) {
  const regex = new RegExp(searchTerm, 'i');
  return this.find({
    attributeType,
    isActive: true,
    value: regex
  })
  .select('value usageCount')
  .sort({ usageCount: -1, value: 1 })
  .limit(20)
  .lean();
};

// Static method to add or get existing attribute
ProductAttributeSchema.statics.addOrGetAttribute = async function(attributeType, value, source = "user") {
  // Normalize the value
  const normalizedValue = value.trim();
  
  if (!normalizedValue) {
    throw new Error("Value cannot be empty");
  }
  
  // Check if it already exists (case-insensitive)
  let attribute = await this.findOne({
    attributeType,
    value: { $regex: new RegExp(`^${normalizedValue}$`, 'i') }
  });
  
  if (attribute) {
    // If it exists but was deactivated, reactivate it
    if (!attribute.isActive) {
      attribute.isActive = true;
      await attribute.save();
    }
    return attribute;
  }
  
  // Create new attribute
  attribute = await this.create({
    attributeType,
    value: normalizedValue,
    source
  });
  
  return attribute;
};

// Method to increment usage count
ProductAttributeSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  return this.save();
};

// Pre-save middleware to capitalize value properly
ProductAttributeSchema.pre("save", function(next) {
  if (this.value) {
    // Capitalize first letter of each word
    this.value = this.value
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  next();
});

export default mongoose.model("ProductAttribute", ProductAttributeSchema);