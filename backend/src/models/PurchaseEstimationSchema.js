// models/PurchaseEstimationSchema.js
import mongoose from "mongoose";

const purchaseEstimationSchema = new mongoose.Schema(
  {
    PESNo: {
      type: String,
      unique: true,
    },
    estimationDate: {
      type: Date,
      default: Date.now,
    },
    
    // Estimation Type: "order" or "machine"
    estimationType: {
      type: String,
      enum: ["order", "machine"],
      required: true,
      default: "order",
    },

    // Order Reference (only for order-based estimations)
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    PoNo: {
      type: String,
      default: null,
    },
    orderDate: {
      type: Date,
      default: null,
    },
    orderType: {
      type: String,
      enum: ["FOB", "JOB-Works", null],
      default: null,
    },

    // Buyer Details (copied from order for reference)
    buyerDetails: {
      name: { type: String, default: null },
      code: { type: String, default: null },
      mobile: { type: String, default: null },
      gst: { type: String, default: null },
      email: { type: String, default: null },
      address: { type: String, default: null },
    },

    // Order Products (read-only reference copied from order)
    orderProducts: [
      {
        productName: { type: String },
        fabricType: { type: String },
        colors: [
          {
            color: { type: String },
            sizes: [
              {
                size: { type: String },
                quantity: { type: Number },
              },
            ],
          },
        ],
        productTotalQty: { type: Number },
      },
    ],
    totalOrderQty: { type: Number, default: 0 },

    // NEW: Fabric Cost Estimation (Grouped by Name & Color)
    fabricCostEstimation: [
      {
        fabricName: { type: String, required: true },
        color: { type: String, required: true },
        styles: { type: String }, // Comma-separated styles
        totalMeters: { type: Number, required: true },
        totalQty: { type: Number, required: true },
        grandTotal: { type: Number, required: true },
        details: [
          {
            style: { type: String },
            meter: { type: Number },
            qty: { type: Number },
            total: { type: Number }
          }
        ]
      }
    ],

    // Fabric Purchases (for order-based estimations)
    fabricPurchases: [
      {
        productName: { type: String },
        vendor: { type: String, required: true },
        vendorCode: { type: String },
        vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
        fabricType: { type: String, required: true },
        quantity: { type: Number, required: true },
        unit: { type: String, default: "meters" },
        costPerUnit: { type: Number, required: true },
        gstPercentage: { type: Number, default: 5 },
        totalCost: { type: Number },
        gstAmount: { type: Number },
        totalWithGst: { type: Number },
        colors: [String],
        gsm: String,
        remarks: String,
      },
    ],

    // Accessories Purchases (replaces buttonsPurchases and packetsPurchases)
    accessoriesPurchases: [
      {
        productName: { type: String },
        accessoryType: {
          type: String,
          enum: ["buttons", "packets", "other"],
          required: true
        },
        vendor: { type: String, required: true },
        vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
        size: { type: String, default: "Standard" },
        quantity: { type: Number, required: true },
        unit: { type: String, default: "pieces" },
        costPerUnit: { type: Number, required: true },
        gstPercentage: { type: Number, default: 12 },
        totalCost: { type: Number },
        gstAmount: { type: Number },
        totalWithGst: { type: Number },
        color: String,
        remarks: String,
      },
    ],
    totalAccessoriesCost: { type: Number, default: 0 },
    totalAccessoriesGst: { type: Number, default: 0 },

    // Machine Purchases (for machine-based estimations)
    machinesPurchases: [
      {
        machineName: { type: String, required: true },
        vendor: { type: String, required: true },
        vendorCode: { type: String, default: null },
        vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", default: null },
        cost: { type: Number, required: true },
        gstPercentage: { type: Number, default: 18 },
        totalCost: { type: Number, default: 0 },
        gstAmount: { type: Number, default: 0 },
        totalWithGst: { type: Number, default: 0 },
        remarks: { type: String, default: "" },
      },
    ],

    // Totals for Order-based estimations
    totalFabricCost: { type: Number, default: 0 },
    totalFabricGst: { type: Number, default: 0 },

    // Totals for Machine estimations
    totalMachinesCost: { type: Number, default: 0 },
    totalMachinesGst: { type: Number, default: 0 },

    // Grand Totals
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

// Pre-save hook to generate PESNo and calculate totals
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

  // Calculate totals based on estimation type
  if (this.estimationType === "order") {
    // Calculate fabric totals
    this.fabricPurchases.forEach((item) => {
      item.totalCost = item.quantity * item.costPerUnit;
      item.gstAmount = (item.totalCost * item.gstPercentage) / 100;
      item.totalWithGst = item.totalCost + item.gstAmount;
    });

    // Calculate accessories totals (replaces buttons and packets)
    this.accessoriesPurchases.forEach((item) => {
      item.totalCost = item.quantity * item.costPerUnit;
      item.gstAmount = (item.totalCost * item.gstPercentage) / 100;
      item.totalWithGst = item.totalCost + item.gstAmount;
    });

    // Calculate category totals
    this.totalFabricCost = this.fabricPurchases.reduce(
      (sum, item) => sum + (item.totalCost || 0),
      0
    );

    this.totalAccessoriesCost = this.accessoriesPurchases.reduce(
      (sum, item) => sum + (item.totalCost || 0),
      0
    );

    this.totalFabricGst = this.fabricPurchases.reduce(
      (sum, item) => sum + (item.gstAmount || 0),
      0
    );

    this.totalAccessoriesGst = this.accessoriesPurchases.reduce(
      (sum, item) => sum + (item.gstAmount || 0),
      0
    );

    // Calculate grand totals
    this.grandTotalCost = this.totalFabricCost + this.totalAccessoriesCost;
    this.grandTotalWithGst = this.grandTotalCost + this.totalFabricGst + this.totalAccessoriesGst;

    // Reset machine totals
    this.totalMachinesCost = 0;
    this.totalMachinesGst = 0;
  } else if (this.estimationType === "machine") {
    // Calculate machine totals
    this.machinesPurchases.forEach((item) => {
      item.totalCost = item.cost || 0;
      item.gstAmount = (item.totalCost * item.gstPercentage) / 100;
      item.totalWithGst = item.totalCost + item.gstAmount;
    });

    this.totalMachinesCost = this.machinesPurchases.reduce(
      (sum, item) => sum + (item.totalCost || 0),
      0
    );

    this.totalMachinesGst = this.machinesPurchases.reduce(
      (sum, item) => sum + (item.gstAmount || 0),
      0
    );

    // Calculate grand totals
    this.grandTotalCost = this.totalMachinesCost;
    this.grandTotalWithGst = this.totalMachinesCost + this.totalMachinesGst;

    // Reset order-based totals
    this.totalFabricCost = 0;
    this.totalFabricGst = 0;
    this.totalAccessoriesCost = 0;
    this.totalAccessoriesGst = 0;
  }

  next();
});

// Indexes
purchaseEstimationSchema.index({ PESNo: 1 });
purchaseEstimationSchema.index({ order: 1 });
purchaseEstimationSchema.index({ PoNo: 1 });
purchaseEstimationSchema.index({ estimationType: 1 });
purchaseEstimationSchema.index({ status: 1 });
purchaseEstimationSchema.index({ estimationDate: -1 });
purchaseEstimationSchema.index({ "accessoriesPurchases.vendorId": 1 });

const PurchaseEstimation = mongoose.model(
  "PurchaseEstimation",
  purchaseEstimationSchema
);

export default PurchaseEstimation;