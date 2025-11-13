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
  company: { type: String, trim: true },
  
  vendorGoods: {
    type: {
      category: {
        type: String,
        enum: ["Fabrics", "Accessories"],
        required: true
      },
      details: { 
        type: String,
        trim: true
      }
    },
    required: true
  },

  isActive: { type: Boolean, default: true },
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
  }).select('name code').limit(10);
};

export default mongoose.model("Supplier", SupplierSchema);
