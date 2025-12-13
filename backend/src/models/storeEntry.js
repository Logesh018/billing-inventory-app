// models/storeEntry.js
import mongoose from "mongoose";
import { getNextSequence } from "../utils/counterUtils.js";

const { Schema } = mongoose;

// Store Entry Item sub-schema
const StoreEntryItemSchema = new Schema({
  itemType: {
    type: String,
    enum: ["fabric", "accessories", "others"],
    required: true
  },
  itemName: { type: String, required: true },
  supplierId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Supplier",
    default: null 
  },
  supplierName: { type: String, required: true },
  supplierCode: { type: String, default: "" },
  invoiceNo: { type: String, default: "" },
  invoiceDate: { type: Date, default: null },
  hsn: { type: String, default: "" },
  unit: { 
    type: String, 
    required: true,
    enum: ["kg", "mtr", "qty", "piece", "pieces", "packet"]
  },
  purchaseQty: { type: Number, default: 0 },
  invoiceQty: { type: Number, required: true, min: 0 },
  storeInQty: { type: Number, required: true, min: 0 },
  shortage: { type: Number, default: 0 },
  surplus: { type: Number, default: 0 },
  remarks: { type: String, default: "" },
}, { _id: false });

const StoreEntrySchema = new Schema({
  // Auto-generated fields - NOW NULLABLE until form submission
  serialNo: { type: Number, default: null },
  storeId: { type: String, default: null },

  // References
  purchase: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Purchase", 
    required: true 
  },
  order: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Order", 
    required: true 
  },
  purchaseEstimation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PurchaseEstimation",
    default: null
  },

  // Order & Purchase Info (denormalized for quick access)
  orderId: { type: String, required: true },
  orderDate: { type: Date, default: null },
  PoNo: { type: String, default: null },
  orderType: { type: String, enum: ["FOB", "JOB-Works", "Own-Orders"], default: null },
  buyerCode: { type: String, default: null },
  
  PURNo: { type: String, required: true },
  purchaseDate: { type: Date, default: null },
  PESNo: { type: String, default: "N/A" },
  estimationDate: { type: Date, default: null },

  // Store Entry specific fields
  storeEntryDate: { type: Date, default: null }, // User will enter this
  
  // Items array - one entry per purchased item
  entries: [StoreEntryItemSchema],

  // Totals (calculated)
  totalInvoiceQty: { type: Number, default: 0 },
  totalStoreInQty: { type: Number, default: 0 },
  totalShortage: { type: Number, default: 0 },
  totalSurplus: { type: Number, default: 0 },

  status: {
    type: String,
    enum: ["Pending", "Completed"],
    default: "Pending"
  },

  remarks: { type: String, default: "" },
}, { timestamps: true });

// Pre-save middleware
StoreEntrySchema.pre("save", async function (next) {
  try {
    // ✅ NEW: Only generate Store ID when status is "Completed" and doesn't have one yet
    if (!this.storeId && this.status === "Completed") {
      const seq = await getNextSequence("storeEntrySeq");
      this.serialNo = seq;
      this.storeId = `STR-${seq}`;
      console.log(`✅ Generated Store Entry serial #${seq} (${this.storeId})`);
    }

    // Calculate shortage/surplus for each entry
    if (this.entries && this.entries.length > 0) {
      this.entries.forEach(entry => {
        const invoiceQty = entry.invoiceQty || 0;
        const storeInQty = entry.storeInQty || 0;
        
        if (invoiceQty > storeInQty) {
          entry.shortage = invoiceQty - storeInQty;
          entry.surplus = 0;
        } else if (storeInQty > invoiceQty) {
          entry.surplus = storeInQty - invoiceQty;
          entry.shortage = 0;
        } else {
          entry.shortage = 0;
          entry.surplus = 0;
        }
      });

      // Calculate totals
      this.totalInvoiceQty = this.entries.reduce((sum, e) => sum + (e.invoiceQty || 0), 0);
      this.totalStoreInQty = this.entries.reduce((sum, e) => sum + (e.storeInQty || 0), 0);
      this.totalShortage = this.entries.reduce((sum, e) => sum + (e.shortage || 0), 0);
      this.totalSurplus = this.entries.reduce((sum, e) => sum + (e.surplus || 0), 0);
    }

    next();
  } catch (err) {
    console.error("❌ Error in StoreEntry pre-save:", err);
    next(err);
  }
});

// Indexes
StoreEntrySchema.index({ purchase: 1 }, { unique: true }); // One store entry per purchase
StoreEntrySchema.index({ order: 1 });
StoreEntrySchema.index({ storeId: 1 }, { sparse: true }); // Sparse index (allows null)
StoreEntrySchema.index({ serialNo: 1 }, { sparse: true }); // Sparse index (allows null)
StoreEntrySchema.index({ storeEntryDate: -1 });
StoreEntrySchema.index({ orderId: 1 });
StoreEntrySchema.index({ PURNo: 1 });
StoreEntrySchema.index({ status: 1 });

export default mongoose.models.StoreEntry || mongoose.model("StoreEntry", StoreEntrySchema);