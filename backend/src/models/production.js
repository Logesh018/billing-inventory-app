import mongoose from "mongoose";

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
    enum: ["FOB", "JOB-Works","Own-Orders"],
    required: true
  },
  buyerCode: { type: String },
  buyerName: { type: String },

  products: [
    {
      productName: { type: String },
      fabricType: { type: String },
      style: {type: String},
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

  // ✅ NEW: Production details per product
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

  // ✅ DEPRECATED: Keep for backward compatibility but not used in new forms
  dcNumber: { type: String },
  dcMtr: { type: Number, default: 0 },
  tagMtr: { type: Number, default: 0 },
  cuttingMtr: { type: Number, default: 0 },
  shortageMtr: { type: Number, default: 0 },
  measurementUnit: {
    type: String,
    enum: ["Meters", "KG", "Qty", "Pcs"],
    default: "Meters"
  },
  receivedFabric: { type: String },
  goodsType: { type: String },
  color: { type: String },
  requiredQty: { type: Number, default: 0 },
  expectedQty: { type: Number, default: 0 },

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

// ✅ Pre-save hook to calculate shortage for each production detail
ProductionSchema.pre("save", function (next) {
  // Calculate shortage for each production detail
  if (this.productionDetails && this.productionDetails.length > 0) {
    this.productionDetails.forEach(detail => {
      if (detail.tagMtr !== undefined && detail.cuttingMtr !== undefined) {
        detail.shortageMtr = detail.tagMtr - detail.cuttingMtr;
      }
    });
  }

  // Backward compatibility for old single-level fields
  if (this.tagMtr !== undefined && this.cuttingMtr !== undefined) {
    this.shortageMtr = this.tagMtr - this.cuttingMtr;
  }
  
  next();
});

ProductionSchema.index({ order: 1 });
ProductionSchema.index({ purchase: 1 });
ProductionSchema.index({ PoNo: 1 });
ProductionSchema.index({ buyerCode: 1 });
ProductionSchema.index({ status: 1 });
ProductionSchema.index({ orderType: 1 });
ProductionSchema.index({ orderDate: -1 });

export default mongoose.model("Production", ProductionSchema);