import mongoose from "mongoose";

const SupplierSchema = new mongoose.Schema({
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
  gst: { type: String, trim: true, uppercase: true },
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

  // Additional supplier information
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

// Pre-save middleware to format name
SupplierSchema.pre("save", function (next) {
  // Capitalize first letter of name
  if (this.name) {
    this.name = this.name.charAt(0).toUpperCase() + this.name.slice(1);
  }
  next();
});

// Pre-save middleware to generate unique supplier code
SupplierSchema.pre("save", async function (next) {
  if (!this.code) { // Only generate code if not provided
    try {
      // Find the latest supplier with a code starting with "SUP"
      const latestSupplier = await this.constructor
        .findOne({ code: { $regex: "^SUP", $options: "i" } })
        .sort({ code: -1 })
        .select("code");

      let newCodeNumber = 1;
      if (latestSupplier && latestSupplier.code) {
        // Extract the numeric part and increment
        const numericPart = parseInt(latestSupplier.code.replace("SUP", ""), 10);
        if (!isNaN(numericPart)) {
          newCodeNumber = numericPart + 1;
        }
      }

      // Format the code as SUP followed by a padded number (e.g., SUP001)
      this.code = `SUP${newCodeNumber.toString().padStart(3, "0")}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Static method to search suppliers by name/company
SupplierSchema.statics.searchByName = function (searchTerm) {
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
  }).select('name code').limit(10); // Only return name and code for search
};

export default mongoose.model("Supplier", SupplierSchema);