import mongoose from "mongoose";

const BuyerSchema = new mongoose.Schema({
  // Category Classification 
  buyerCategory: {
    type: String,
    enum: ["Regular", "YAS"],
    default: "Regular",
    required: true
  },
  yasBuyerType: {
    type: String,
    enum: ["Distributors", "Agents", "Direct Retailer", "Yas Shop", "Yas Online Store", ""],
    default: ""
  },

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
  creditLimit: { type: Number, default: 0 },

  contactPerson: { type: String, trim: true },
  alternatePhone: { type: String, trim: true },
  businessType: { type: String, trim: true },
  paymentTerms: { type: String, trim: true },

  // Others
  remarks: { type: String, trim: true },
  isActive: { type: Boolean, default: true },

  // Relationship tracking
  totalOrders: { type: Number, default: 0 },
  totalOrderValue: { type: Number, default: 0 },
  lastOrderDate: { type: Date },

}, { timestamps: true });

// Indexes
BuyerSchema.index({ name: "text", company: "text" });
BuyerSchema.index({ name: 1 });
BuyerSchema.index({ mobile: 1 });
BuyerSchema.index({ gst: 1 });
BuyerSchema.index({ isActive: 1 });
BuyerSchema.index({ city: 1 });
BuyerSchema.index({ state: 1 });
BuyerSchema.index({ buyerCategory: 1 });

// Validation: yasBuyerType should only be set for YAS buyers
BuyerSchema.pre("validate", function (next) {
  if (this.buyerCategory === "Regular" && this.yasBuyerType) {
    this.yasBuyerType = "";
  }
  if (this.buyerCategory === "YAS" && !this.yasBuyerType) {
    return next(new Error("YAS Buyer Type is required for YAS buyers"));
  }
  next();
});

// Pre-save middleware to format name
BuyerSchema.pre("save", function (next) {
  if (this.name) {
    this.name = this.name.charAt(0).toUpperCase() + this.name.slice(1);
  }
  next();
});

// Pre-save middleware to generate unique buyer code based on category
BuyerSchema.pre("save", async function (next) {
  if (!this.code) {
    try {
      const prefix = this.buyerCategory === "YAS" ? "YAS" : "BUY";
      
      const latestBuyer = await this.constructor
        .findOne({ 
          code: { $regex: `^${prefix}`, $options: "i" },
          buyerCategory: this.buyerCategory 
        })
        .sort({ code: -1 })
        .select("code");

      let newCodeNumber = 1;
      if (latestBuyer && latestBuyer.code) {
        const numericPart = parseInt(latestBuyer.code.replace(prefix, ""), 10);
        if (!isNaN(numericPart)) {
          newCodeNumber = numericPart + 1;
        }
      }

      this.code = `${prefix}${newCodeNumber.toString().padStart(3, "0")}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Static method to search buyers by name/company with category filter
BuyerSchema.statics.searchByName = function (searchTerm, category = null) {
  const regex = new RegExp(searchTerm, 'i');
  const query = {
    $and: [
      { isActive: true },
      {
        $or: [
          { name: regex },
          { company: regex }
        ]
      }
    ]
  };
  
  if (category) {
    query.$and.push({ buyerCategory: category });
  }
  
  return this.find(query)
    .select('name code mobile gst email address company city state buyerCategory yasBuyerType')
    .limit(10);
};

export default mongoose.model("Buyer", BuyerSchema);