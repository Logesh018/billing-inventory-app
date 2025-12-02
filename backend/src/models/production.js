// models/production.js
import mongoose from "mongoose";
import { getNextSequence } from "../utils/counterUtils.js";

const ProductionSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true
  },
  purchase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Purchase"
  },
  orderDate: { type: Date },
  PoNo: { type: String },
  orderType: {
    type: String,
    enum: ["FOB", "JOB-Works", "Own-Orders"],
    required: true
  },
  buyerCode: { type: String },
  buyerName: { type: String },

  // 🔴 CHANGE: Removed unique: true (Moved to bottom)
  serialNo: { type: Number },

  products: [
    {
      productName: { type: String },
      fabricType: { type: String },
      style: { type: String },
      colors: [
        {
          color: { type: String, required: true },
          sizes: [
            {
              size: { type: String, required: true },
              quantity: { type: Number, required: true },
            }
          ]
        }
      ],
      productTotalQty: { type: Number },
    }
  ],
  totalQty: { type: Number },

  poDate: { type: Date },
  poNumber: { type: String },
  factoryReceivedDate: { type: Date },

  // Production details per product (Store IN stage)
  productionDetails: [
    {
      productName: { type: String },
      fabricType: { type: String },
      receivedFabric: { type: String },
      measurementUnit: {
        type: String,
        enum: ["Meters", "KG", "Qty", "Pcs"],
        default: "Meters"
      },
      dcMtr: { type: Number, default: 0 },
      tagMtr: { type: Number, default: 0 },
      cuttingMtr: { type: Number, default: 0 },
      shortageMtr: { type: Number, default: 0 },
      color: { type: String },
    }
  ],

  // Cutting details per product
  cuttingDetails: [
    {
      productName: { type: String },
      fabricType: { type: String },
      color: { type: String },
      meterPerProduct: { type: Number, default: 0 },
      productPerLay: { type: Number, default: 0 },
      meterPerLay: { type: Number, default: 0 },
      totalLays: { type: Number, default: 0 },
      totalMetersUsed: { type: Number, default: 0 },
      totalProductsCut: { type: Number, default: 0 },
    }
  ],

  // Stitching details (for future)
  stitchingDetails: [
    {
      productName: { type: String },
      // Add stitching-specific fields here later
    }
  ],

  // Trimming details (for future)
  trimmingDetails: [
    {
      productName: { type: String },
      // Add trimming-specific fields here later
    }
  ],

  status: {
    type: String,
    enum: [
      "Pending Production",
      "Cutting",
      "Stitching",
      "Trimming",
      "QC",
      "Ironing",
      "Packing",
      "Production Completed",
    ],
    default: "Pending Production",
  },

  fabricPurchases: [
    {
      productName: { type: String, required: true },
      fabricType: { type: String, required: true },
      vendor: { type: String, required: true },
      vendorCode: { type: String },
      vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
      purchaseMode: { type: String, enum: ["kg", "meters", "piece"] },
      quantity: { type: Number, required: true },
      costPerUnit: { type: Number, required: true },
      totalCost: { type: Number, default: 0 },
      gstPercentage: { type: Number, default: 0 },
      totalWithGst: { type: Number, default: 0 },
      colors: [String],
      gsm: String,
      remarks: String,
    }
  ],

  accessoriesPurchases: [
    {
      productName: { type: String, required: true },
      accessoryType: {
        type: String,
        enum: ["buttons", "packets", "other"],
        required: true
      },
      size: { type: String, default: "Standard" },
      vendor: { type: String, required: true },
      vendorCode: { type: String },
      vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
      purchaseMode: {
        type: String,
        enum: ["qty", "pieces", "piece", "packet"],
        default: "pieces",
      },
      quantity: { type: Number, required: true },
      costPerUnit: { type: Number, required: true },
      totalCost: { type: Number, default: 0 },
      gstPercentage: { type: Number, default: 0 },
      totalWithGst: { type: Number, default: 0 },
      color: String,
      remarks: String,
    }
  ],

  totalFabricCost: { type: Number, default: 0 },
  totalAccessoriesCost: { type: Number, default: 0 },
  totalFabricGst: { type: Number, default: 0 },
  totalAccessoriesGst: { type: Number, default: 0 },
  grandTotalCost: { type: Number, default: 0 },
  grandTotalWithGst: { type: Number, default: 0 },

  remarks: { type: String, maxlength: 500 },

  workflowHistory: [
    {
      stage: { type: String },
      status: { type: String },
      date: { type: Date, default: Date.now },
      notes: { type: String },
    },
  ],

}, { timestamps: true });

// ... (Your pre-save middleware remains EXACTLY the same) ...
ProductionSchema.pre("save", async function (next) {
  if (this.isNew && !this.serialNo) {
    try {
      const seq = await getNextSequence("productionSeq");
      this.serialNo = seq;
      console.log(`✅ Generated Production serial #${seq}`);
    } catch (error) {
      console.error("❌ Error generating Production serial:", error);
      return next(error);
    }
  }

  if (this.productionDetails && this.productionDetails.length > 0) {
    this.productionDetails.forEach(detail => {
      if (detail.tagMtr !== undefined && detail.cuttingMtr !== undefined) {
        detail.shortageMtr = detail.tagMtr - detail.cuttingMtr;
      }
    });
  }

  if (this.cuttingDetails && this.cuttingDetails.length > 0) {
    this.cuttingDetails.forEach(detail => {
      if (detail.meterPerLay !== undefined && detail.totalLays !== undefined) {
        detail.totalMetersUsed = detail.meterPerLay * detail.totalLays;
      }
      
      if (detail.productPerLay !== undefined && detail.totalLays !== undefined) {
        detail.totalProductsCut = detail.productPerLay * detail.totalLays;
      }
    });
  }
  
  next();
});

// Indexes
ProductionSchema.index({ order: 1 });
ProductionSchema.index({ purchase: 1 });
ProductionSchema.index({ PoNo: 1 });
ProductionSchema.index({ buyerCode: 1 });
ProductionSchema.index({ status: 1 });
ProductionSchema.index({ orderType: 1 });
ProductionSchema.index({ orderDate: -1 });

// 🔴 CHANGE: Added { unique: true } here instead of in the schema definition
ProductionSchema.index({ serialNo: 1 }, { unique: true });

export default mongoose.model("Production", ProductionSchema);