import mongoose from "mongoose";

const BuyerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, unique: true, uppercase: true }, 
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
  gst: { type: String, trim: true, uppercase: true }, // Added uppercase
  email: { 
    type: String, 
    trim: true, 
    lowercase: true,
    validate: {
      validator: function(v) {
        return !v || /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: props => `${props.value} is not a valid email!`
    }
  },
  address: { type: String, trim: true },

  // Additional buyer information
  company: { type: String, trim: true },
  contactPerson: { type: String, trim: true },
  alternatePhone: { type: String, trim: true },

  // Business details
  businessType: { type: String, trim: true },
  paymentTerms: { type: String, trim: true },
  creditLimit: { type: Number, default: 0 },

  // Status
  isActive: { type: Boolean, default: true },

  // Relationship tracking
  totalOrders: { type: Number, default: 0 },
  totalOrderValue: { type: Number, default: 0 },
  lastOrderDate: { type: Date },

}, { timestamps: true });

// Indexes for search functionality
BuyerSchema.index({ name: "text", company: "text" });
BuyerSchema.index({ name: 1 });
BuyerSchema.index({ mobile: 1 });
BuyerSchema.index({ gst: 1 });
BuyerSchema.index({ isActive: 1 });

// Pre-save middleware to format name
BuyerSchema.pre("save", function (next) {
  // Capitalize first letter of name
  if (this.name) {
    this.name = this.name.charAt(0).toUpperCase() + this.name.slice(1);
  }
  next();
});

// Pre-save middleware to generate unique buyer code
BuyerSchema.pre("save", async function (next) {
  if (!this.code) { // Only generate code if not provided
    try {
      // Find the latest buyer with a code starting with "BUY"
      const latestBuyer = await this.constructor
        .findOne({ code: { $regex: "^BUY", $options: "i" } })
        .sort({ code: -1 })
        .select("code");

      let newCodeNumber = 1;
      if (latestBuyer && latestBuyer.code) {
        // Extract the numeric part and increment
        const numericPart = parseInt(latestBuyer.code.replace("BUY", ""), 10);
        if (!isNaN(numericPart)) {
          newCodeNumber = numericPart + 1;
        }
      }

      // Format the code as BUY followed by a padded number (e.g., BUY001)
      this.code = `BUY${newCodeNumber.toString().padStart(3, "0")}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Static method to search buyers by name/company
BuyerSchema.statics.searchByName = function (searchTerm) {
  const regex = new RegExp(searchTerm, 'i'); // Case-insensitive search
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
  }).select('name code mobile gst email address company').limit(10);
};

export default mongoose.model("Buyer", BuyerSchema);