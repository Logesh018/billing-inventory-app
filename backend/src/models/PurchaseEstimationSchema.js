// models/PurchaseEstimationSchema.js
import mongoose from "mongoose";

const purchaseEstimationSchema = new mongoose.Schema(
  {
    PESNo: {
      type: String,
      unique: true,
      // Don't set required: true here since we'll generate it
    },
    estimationDate: {
      type: Date,
      default: Date.now,
    },
    fabricPurchases: [
      {
        vendor: { type: String, required: true },
        vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
        fabricType: { type: String, required: true },
        quantity: { type: Number, required: true },
        unit: { type: String, default: "meters" },
        costPerUnit: { type: Number, required: true },
        gstRate: { type: Number, default: 5 },
        totalCost: { type: Number },
        gstAmount: { type: Number },
        totalWithGst: { type: Number },
      },
    ],
    buttonsPurchases: [
      {
        vendor: { type: String, required: true },
        vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
        quantity: { type: Number, required: true },
        unit: { type: String, default: "pieces" },
        costPerUnit: { type: Number, required: true },
        gstRate: { type: Number, default: 12 },
        totalCost: { type: Number },
        gstAmount: { type: Number },
        totalWithGst: { type: Number },
      },
    ],
    packetsPurchases: [
      {
        vendor: { type: String, required: true },
        vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
        quantity: { type: Number, required: true },
        unit: { type: String, default: "pieces" },
        costPerUnit: { type: Number, required: true },
        gstRate: { type: Number, default: 18 },
        totalCost: { type: Number },
        gstAmount: { type: Number },
        totalWithGst: { type: Number },
      },
    ],
    totalFabricCost: { type: Number, default: 0 },
    totalButtonsCost: { type: Number, default: 0 },
    totalPacketsCost: { type: Number, default: 0 },
    totalFabricGst: { type: Number, default: 0 },
    totalButtonsGst: { type: Number, default: 0 },
    totalPacketsGst: { type: Number, default: 0 },
    grandTotalCost: { type: Number, default: 0 },
    grandTotalWithGst: { type: Number, default: 0 },
    remarks: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Draft", "Finalized"],
      default: "Draft",
    },
    pdfUrl: { type: String },
    pdfPublicId: { type: String },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate PESNo
purchaseEstimationSchema.pre("save", async function (next) {
  if (this.isNew && !this.PESNo) {
    try {
      // Find the last estimation to get the highest number
      const lastEstimation = await this.constructor
        .findOne({}, { PESNo: 1 })
        .sort({ createdAt: -1 })
        .lean();

      let nextNumber = 1;
      if (lastEstimation && lastEstimation.PESNo) {
        // Extract number from PESNo (e.g., "PES-0001" -> 1)
        const match = lastEstimation.PESNo.match(/PES-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }

      // Generate new PESNo with zero padding (e.g., PES-0001)
      this.PESNo = `PES-${String(nextNumber).padStart(4, "0")}`;
      console.log("✅ Generated PESNo:", this.PESNo);
    } catch (error) {
      console.error("❌ Error generating PESNo:", error);
      return next(error);
    }
  }

  // Calculate totals for each purchase item
  this.fabricPurchases.forEach((item) => {
    item.totalCost = item.quantity * item.costPerUnit;
    item.gstAmount = (item.totalCost * item.gstRate) / 100;
    item.totalWithGst = item.totalCost + item.gstAmount;
  });

  this.buttonsPurchases.forEach((item) => {
    item.totalCost = item.quantity * item.costPerUnit;
    item.gstAmount = (item.totalCost * item.gstRate) / 100;
    item.totalWithGst = item.totalCost + item.gstAmount;
  });

  this.packetsPurchases.forEach((item) => {
    item.totalCost = item.quantity * item.costPerUnit;
    item.gstAmount = (item.totalCost * item.gstRate) / 100;
    item.totalWithGst = item.totalCost + item.gstAmount;
  });

  // Calculate category totals
  this.totalFabricCost = this.fabricPurchases.reduce(
    (sum, item) => sum + (item.totalCost || 0),
    0
  );
  this.totalButtonsCost = this.buttonsPurchases.reduce(
    (sum, item) => sum + (item.totalCost || 0),
    0
  );
  this.totalPacketsCost = this.packetsPurchases.reduce(
    (sum, item) => sum + (item.totalCost || 0),
    0
  );

  this.totalFabricGst = this.fabricPurchases.reduce(
    (sum, item) => sum + (item.gstAmount || 0),
    0
  );
  this.totalButtonsGst = this.buttonsPurchases.reduce(
    (sum, item) => sum + (item.gstAmount || 0),
    0
  );
  this.totalPacketsGst = this.packetsPurchases.reduce(
    (sum, item) => sum + (item.gstAmount || 0),
    0
  );

  // Calculate grand totals
  this.grandTotalCost =
    this.totalFabricCost + this.totalButtonsCost + this.totalPacketsCost;
  this.grandTotalWithGst =
    this.grandTotalCost +
    this.totalFabricGst +
    this.totalButtonsGst +
    this.totalPacketsGst;

  next();
});

const PurchaseEstimation = mongoose.model(
  "PurchaseEstimation",
  purchaseEstimationSchema
);

export default PurchaseEstimation;