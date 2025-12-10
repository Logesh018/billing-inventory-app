// models/PurchaseReturnSchema.js
import mongoose from "mongoose";
import { getNextSequence } from "../utils/counterUtils.js";

const purchaseReturnItemSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true
  },
  itemType: {
    type: String,
    enum: ["fabric", "accessories", "others"],
    default: "fabric"
  },
  gsm: {
    type: String,
    default: ""
  },
  color: {
    type: String,
    default: ""
  },
  purchaseUnit: {
    type: String,
    required: true
  },
  // ✅ NEW: Add vendor info per item (for multi-vendor support)
  vendor: {
    type: String,
    required: true
  },
  vendorCode: {
    type: String,
    default: ""
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Supplier",
    default: null
  },
  vendorState: {
    type: String,
    default: ""
  },
  // Original purchase details
  originalQuantity: {
    type: Number,
    required: true
  },
  originalCostPerUnit: {
    type: Number,
    required: true
  },
  // Invoice details
  invoiceNo: {
    type: String,
    default: ""
  },
  invoiceDate: {
    type: Date,
    default: null
  },
  hsn: {
    type: String,
    default: ""
  },
  // Return details
  returnQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  returnReason: {
    type: String,
    enum: [
      'damaged-goods',
      'quality-issue',
      'wrong-item',
      'excess-quantity',
      'defective',
      'not-as-described',
      'other'
    ],
    required: true
  },
  reasonDescription: {
    type: String,
    default: ""
  },
  // Financial
  returnValue: {
    type: Number,
    default: 0
  },
  gstPercentage: {
    type: Number,
    default: 5
  },
  gstType: {
    type: String,
    enum: ["CGST+SGST", "IGST"],
    default: "CGST+SGST"
  },
  cgstAmount: {
    type: Number,
    default: 0
  },
  sgstAmount: {
    type: Number,
    default: 0
  },
  igstAmount: {
    type: Number,
    default: 0
  },
  returnValueWithGst: {
    type: Number,
    default: 0
  }
}, { _id: false });

const purchaseReturnSchema = new mongoose.Schema({
  // Return Number (Auto-generated)
  PURTNo: {
    type: String,
    unique: true
  },
  
  serialNo: {
    type: Number
  },

  // Return Date
  returnDate: {
    type: Date,
    required: true,
    default: Date.now
  },

  // Reference to Original Purchase
  purchase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Purchase",
    required: true
  },
  PURNo: {
    type: String,
    required: true
  },
  purchaseDate: {
    type: Date
  },

  // Order Reference (copied from purchase)
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    default: null
  },
  PoNo: {
    type: String,
    default: null
  },
  orderType: {
    type: String,
    enum: ["FOB", "JOB-Works", "Own-Orders", null],
    default: null
  },

  // Return Items (now includes vendor info per item)
  returnItems: [purchaseReturnItemSchema],

  // Financial Summary
  totalReturnValue: {
    type: Number,
    default: 0
  },
  totalCgst: {
    type: Number,
    default: 0
  },
  totalSgst: {
    type: Number,
    default: 0
  },
  totalIgst: {
    type: Number,
    default: 0
  },
  totalReturnWithGst: {
    type: Number,
    default: 0
  },

  // Link to Debit Note
  debitNote: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Note",
    default: null
  },
  debitNoteNumber: {
    type: String,
    default: null
  },

  // Additional Information
  remarks: {
    type: String,
    default: ""
  },

  // Created by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  }
}, {
  timestamps: true
});

// Helper function to calculate GST
const calculateGST = (amount, gstPercentage, gstType) => {
  if (gstType === "CGST+SGST") {
    const halfGst = (amount * gstPercentage) / 200;
    return {
      cgst: halfGst,
      sgst: halfGst,
      igst: 0
    };
  } else {
    return {
      cgst: 0,
      sgst: 0,
      igst: (amount * gstPercentage) / 100
    };
  }
};

// Pre-save hook: Generate PURTNo and calculate totals
purchaseReturnSchema.pre("save", async function (next) {
  // Generate PURTNo and serial number
  if (this.isNew && !this.PURTNo) {
    try {
      const seqNumber = await getNextSequence("purchaseReturnSeq");
      this.serialNo = seqNumber;
      this.PURTNo = `PURT-${String(seqNumber).padStart(4, "0")}`;
      console.log("✅ SCHEMA: Generated PURTNo:", this.PURTNo);
    } catch (error) {
      console.error("❌ SCHEMA ERROR: Error generating PURTNo:", error);
      return next(error);
    }
  }

  // Calculate return values for each item
  let totalReturn = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  this.returnItems.forEach((item) => {
    // Calculate return value (quantity * cost per unit)
    item.returnValue = item.returnQuantity * item.originalCostPerUnit;
    totalReturn += item.returnValue;

    // ✅ FIX: Determine GST type based on vendor state
    const gstType = item.vendorState === "Tamil Nadu" ? "CGST+SGST" : "IGST";
    item.gstType = gstType;

    // Calculate GST
    const gstCalc = calculateGST(item.returnValue, item.gstPercentage, gstType);
    
    item.cgstAmount = gstCalc.cgst;
    item.sgstAmount = gstCalc.sgst;
    item.igstAmount = gstCalc.igst;
    
    totalCgst += gstCalc.cgst;
    totalSgst += gstCalc.sgst;
    totalIgst += gstCalc.igst;

    item.returnValueWithGst = item.returnValue + gstCalc.cgst + gstCalc.sgst + gstCalc.igst;
  });

  this.totalReturnValue = totalReturn;
  this.totalCgst = totalCgst;
  this.totalSgst = totalSgst;
  this.totalIgst = totalIgst;
  this.totalReturnWithGst = totalReturn + totalCgst + totalSgst + totalIgst;

  console.log("✅ SCHEMA: Calculated return totals:", {
    totalReturnValue: this.totalReturnValue,
    totalCgst: this.totalCgst,
    totalSgst: this.totalSgst,
    totalIgst: this.totalIgst,
    totalReturnWithGst: this.totalReturnWithGst
  });

  next();
});

// Indexes
purchaseReturnSchema.index({ PURTNo: 1 }, { unique: true });
purchaseReturnSchema.index({ purchase: 1 });
purchaseReturnSchema.index({ PURNo: 1 });
purchaseReturnSchema.index({ order: 1 });
purchaseReturnSchema.index({ PoNo: 1 });
purchaseReturnSchema.index({ returnDate: -1 });
purchaseReturnSchema.index({ "returnItems.vendorId": 1 });
purchaseReturnSchema.index({ debitNote: 1 });
purchaseReturnSchema.index({ serialNo: 1 });

const PurchaseReturn = mongoose.model("PurchaseReturn", purchaseReturnSchema);

export default PurchaseReturn;