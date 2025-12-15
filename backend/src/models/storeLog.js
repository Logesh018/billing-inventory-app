// models/storeLog.js
import mongoose from "mongoose";
import { getNextSequence } from "../utils/counterUtils.js";

const { Schema } = mongoose;

// Store Log Item sub-schema (for multiple items per log)
const StoreLogItemSchema = new Schema({
  itemName: { type: String, required: true },
  itemType: { 
    type: String, 
    enum: ["fabric", "accessories", "others"],
    default: "fabric"
  },
  unit: { type: String, default: "kg" },
  takenQty: { type: Number, required: true, min: 0, default: 0 },
  returnedQty: { type: Number, min: 0, default: 0 },
  inHandQty: { type: Number, default: 0 }, // Auto-calculated: takenQty - returnedQty
  returnDate: { type: Date, default: null }, // Date when material was returned
  remarks: { type: String, default: "" }
}, { _id: false });

const StoreLogSchema = new Schema({
  // Auto-generated fields
  serialNo: { type: Number },
  logId: { type: String },

  // References
  storeEntry: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "StoreEntry", 
    required: true 
  },
  order: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Order", 
    required: true 
  },
  purchase: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Purchase", 
    required: true 
  },

  // Denormalized for quick access
  storeId: { type: String, required: true },
  orderId: { type: String, required: true },
  PURNo: { type: String, required: true },
  orderType: { type: String },
  buyerCode: { type: String },

  // Log details
  logDate: { type: Date, required: true },

  // Worker info (free text)
  personName: { type: String, default: "" },
  personRole: { type: String, default: "" },
  department: { type: String, default: "" },

  // Items array - can have multiple items per log
  items: [StoreLogItemSchema],

  // Time tracking (stored as strings like "08:00 AM" or "14:30")
  loginTime: { type: String, default: "" },
  logoutTime: { type: String, default: "" },

  // Production tracking - at log level, not item level
  productCount: { type: Number, default: 0 },

  // Status - manually set, not auto-calculated
  status: {
    type: String,
    enum: ["In Store", "Out", "Completed"],
    default: "In Store"
  },

  // Totals (calculated from items array)
  totalTakenQty: { type: Number, default: 0 },
  totalReturnedQty: { type: Number, default: 0 },
  totalInHandQty: { type: Number, default: 0 },

  remarks: { type: String, default: "" },
}, { timestamps: true });

// Pre-save middleware
StoreLogSchema.pre("save", async function (next) {
  try {
    // Generate serial number and logId
    if (this.isNew && !this.serialNo) {
      const seq = await getNextSequence("storeLogSeq");
      this.serialNo = seq;
      this.logId = `LOG-${seq}`;
      console.log(`✅ Generated Store Log serial #${seq} (${this.logId})`);
    }

    // Calculate inHandQty for each item
    if (this.items && this.items.length > 0) {
      this.items.forEach(item => {
        item.inHandQty = (item.takenQty || 0) - (item.returnedQty || 0);
      });

      // Calculate totals
      this.totalTakenQty = this.items.reduce((sum, item) => sum + (item.takenQty || 0), 0);
      this.totalReturnedQty = this.items.reduce((sum, item) => sum + (item.returnedQty || 0), 0);
      this.totalInHandQty = this.items.reduce((sum, item) => sum + (item.inHandQty || 0), 0);
    }

    // Auto-suggest status based on data only if status is not explicitly set
    // This helps with initial logs but allows manual overrides
    if (!this.isModified('status') || this.isNew) {
      if (this.totalTakenQty > 0 && this.totalReturnedQty === 0 && this.status === "In Store") {
        // Material taken but not returned yet
        this.status = "Out";
      } else if (this.totalReturnedQty > 0 && this.totalInHandQty === 0 && this.status === "Out") {
        // Everything returned - suggest completion
        this.status = "In Store";
      }
    }
    // If status was explicitly modified, respect the user's choice

    next();
  } catch (err) {
    console.error("❌ Error in StoreLog pre-save:", err);
    next(err);
  }
});

// Indexes
StoreLogSchema.index({ storeEntry: 1 });
StoreLogSchema.index({ order: 1 });
StoreLogSchema.index({ purchase: 1 });
StoreLogSchema.index({ storeId: 1 });
StoreLogSchema.index({ orderId: 1 });
StoreLogSchema.index({ PURNo: 1 });
StoreLogSchema.index({ logId: 1 }, { unique: true });
StoreLogSchema.index({ serialNo: 1 }, { unique: true });
StoreLogSchema.index({ logDate: -1 });
StoreLogSchema.index({ status: 1 });
StoreLogSchema.index({ personName: 1 });
StoreLogSchema.index({ department: 1 });

export default mongoose.models.StoreLog || mongoose.model("StoreLog", StoreLogSchema);