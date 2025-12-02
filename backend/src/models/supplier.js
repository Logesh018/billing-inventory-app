import mongoose from "mongoose";

const SupplierSchema = new mongoose.Schema({
  // Basic Information
  name: { type: String, required: true, trim: true },
  code: { type: String, unique: true, uppercase: true },
  company: { type: String, trim: true },
  companyType: { 
    type: String, 
    enum: ["Proprietorship", "Partnership", "Private Limited", "Public Limited", "LLP", ""],
    default: ""
  },
  industryType: { type: String, trim: true },
  industrySector: { type: String, trim: true },
  gst: { type: String, trim: true, uppercase: true },

  // Contact Information
  mobile: { 
    type: String, 
    required: true, 
    trim: true,
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid 10-digit mobile number!`
    }
  },
  alternateMobile: { type: String, trim: true },
  landline: { type: String, trim: true },
  email: { 
    type: String, 
    trim: true, 
    lowercase: true,
    validate: {
      validator: function(v) {
        return !v || /^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(v);
      },
      message: props => `${props.value} is not a valid email!`
    }
  },
  alternateEmail: { 
    type: String, 
    trim: true, 
    lowercase: true,
    validate: {
      validator: function(v) {
        return !v || /^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(v);
      },
      message: props => `${props.value} is not a valid email!`
    }
  },
  website: { type: String, trim: true },

  // Address Details
  doorNoStreet: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  pincode: { 
    type: String, 
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^\d{6}$/.test(v);
      },
      message: props => `${props.value} is not a valid 6-digit pincode!`
    }
  },
  country: { type: String, trim: true, default: "India" },
  address: { type: String, trim: true }, 

  // Point of Contact
  pocName: { type: String, trim: true },
  pocEmail: { 
    type: String, 
    trim: true, 
    lowercase: true,
    validate: {
      validator: function(v) {
        return !v || /^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(v);
      },
      message: props => `${props.value} is not a valid email!`
    }
  },
  pocContactEmail: { 
    type: String, 
    trim: true, 
    lowercase: true,
    validate: {
      validator: function(v) {
        return !v || /^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(v);
      },
      message: props => `${props.value} is not a valid email!`
    }
  },
  pocDesignation: { type: String, trim: true },

  // Business Details
  paymentType: { 
    type: String, 
    enum: ["Cash", "Credit", "Bank Transfer", "Cheque", "UPI", ""],
    default: ""
  },
  totalRequirements: { type: Number, default: 0 },
  
  // Vendor Goods
  vendorGoods: {
    category: {
      type: String,
      enum: ["Fabrics", "Accessories"],
      required: true
    },
    accessoryName: { 
      type: String,
      trim: true
    }
  },

  // Others
  remarks: { type: String, trim: true },
  isActive: { type: Boolean, default: true },

  // Relationship tracking
  totalPurchases: { type: Number, default: 0 },
  totalPurchaseValue: { type: Number, default: 0 },
  lastPurchaseDate: { type: Date },

}, { timestamps: true });

// Indexes for search functionality
SupplierSchema.index({ name: "text", company: "text" });
SupplierSchema.index({ name: 1 });
SupplierSchema.index({ mobile: 1 });
SupplierSchema.index({ gst: 1 });
SupplierSchema.index({ isActive: 1 });
SupplierSchema.index({ city: 1 });
SupplierSchema.index({ state: 1 });
SupplierSchema.index({ "vendorGoods.category": 1 });

// Pre-save middleware to format name
SupplierSchema.pre("save", function (next) {
  if (this.name) {
    this.name = this.name.charAt(0).toUpperCase() + this.name.slice(1);
  }
  next();
});

// Pre-save middleware to generate unique supplier code
SupplierSchema.pre("save", async function (next) {
  if (!this.code) {
    try {
      const latestSupplier = await this.constructor
        .findOne({ code: { $regex: "^SUP", $options: "i" } })
        .sort({ code: -1 })
        .select("code");

      let newCodeNumber = 1;
      if (latestSupplier && latestSupplier.code) {
        const numericPart = parseInt(latestSupplier.code.replace("SUP", ""), 10);
        if (!isNaN(numericPart)) {
          newCodeNumber = numericPart + 1;
        }
      }

      this.code = `SUP${newCodeNumber.toString().padStart(3, "0")}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Static method to search suppliers by name/company
SupplierSchema.statics.searchByName = function (searchTerm) {
  const regex = new RegExp(searchTerm, 'i');
  return this.find({
    $and: [
      { isActive: true },
      {
        $or: [
          { name: regex },
          { company: regex }
        ]
      }
    ]
  }).select('name code mobile gst email company city state vendorGoods').limit(10);
};

export default mongoose.model("Supplier", SupplierSchema)