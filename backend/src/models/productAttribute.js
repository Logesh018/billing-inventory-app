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
  
  source: {
    type: String,
    enum: ["system", "user"],
    default: "system"
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  usageCount: {
    type: Number,
    default: 0
  },
  
  createdBy: {
    type: String,
    default: "system"
  }
  
}, { timestamps: true });

ProductAttributeSchema.index({ attributeType: 1, value: 1 }, { unique: true });
ProductAttributeSchema.index({ attributeType: 1, isActive: 1 });
ProductAttributeSchema.index({ usageCount: -1 });
ProductAttributeSchema.statics.getValuesByType = function(attributeType) {
  return this.find({ 
    attributeType, 
    isActive: true 
  })
  .select('value usageCount')
  .sort({ usageCount: -1, value: 1 })
  .lean();
};

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

ProductAttributeSchema.statics.addOrGetAttribute = async function(attributeType, value, source = "user") {
  const normalizedValue = value.trim();
  
  if (!normalizedValue) {
    throw new Error("Value cannot be empty");
  }
  
  let attribute = await this.findOne({
    attributeType,
    value: { $regex: new RegExp(`^${normalizedValue}$`, 'i') }
  });
  
  if (attribute) {
    if (!attribute.isActive) {
      attribute.isActive = true;
      await attribute.save();
    }
    return attribute;
  }
  
  attribute = await this.create({
    attributeType,
    value: normalizedValue,
    source
  });
  
  return attribute;
};

ProductAttributeSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  return this.save();
};

ProductAttributeSchema.pre("save", function(next) {
  if (this.value) {
    this.value = this.value
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  next();
});

export default mongoose.model("ProductAttribute", ProductAttributeSchema);