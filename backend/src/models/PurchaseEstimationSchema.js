// models/PurchaseEstimationSchema.js
import mongoose from "mongoose";
import { getNextSequence } from "../utils/counterUtils.js";

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

    // Order Reference (optional - only for order-based estimations)
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    PoNo: {
      type: String,
      default: null,
    },
    orderId: {
      type: String,
      default: null,
    },
    orderDate: {
      type: Date,
      default: null,
    },
    orderType: {
      type: String,
      enum: ["FOB", "JOB-Works", "Own-Orders", null],
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
        style: { type: String }, 
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

    // Fabric Cost Estimation 
    fabricCostEstimation: [
      {
        fabricName: { type: String, required: true },
        color: { type: String, required: true },
        styles: { type: String },
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

    // Purchase Items 
    purchaseItems: [
      {
        vendor: { type: String, required: true },
        vendorCode: { type: String },
        vendorState: { type: String },
        vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },

        // GST settings at item level
        gstPercentage: { type: Number, default: 0 },
        gstType: {
          type: String,
          enum: ["CGST+SGST", "IGST"],
          default: "CGST+SGST"
        },

        items: [
          {
            type: {
              type: String,
              enum: ["fabric", "accessories", "others"],
              required: true,
              default: "fabric"
            },
            itemName: { type: String, required: true },
            gsm: { type: String },
            accessoryType: {
              type: String,
              enum: ["buttons", "packets", "other"],
            },
            otherType: { type: String },
            color: { type: String },
            purchaseUnit: { type: String, required: true },
            quantity: { type: Number, required: true },
            costPerUnit: { type: Number, required: true },
            gstPercentage: { type: Number, default: 0 },
            totalCost: { type: Number },
          }
        ],

        // Item-level totals
        itemTotal: { type: Number, default: 0 },
        cgstAmount: { type: Number, default: 0 },
        sgstAmount: { type: Number, default: 0 },
        igstAmount: { type: Number, default: 0 },
        itemTotalWithGst: { type: Number, default: 0 },
      }
    ],

    // Grand Totals
    grandTotalCost: { type: Number, default: 0 },
    totalCgst: { type: Number, default: 0 },
    totalSgst: { type: Number, default: 0 },
    totalIgst: { type: Number, default: 0 },
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

// Helper function to calculate GST
const calculateGST = (amount, gstPercentage, gstType) => {
  if (gstType === "CGST+SGST") {
    const halfGst = (amount * gstPercentage) / 200; // Divide by 200 to get half of GST%
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

// Pre-save hook to generate PESNo and calculate totals
purchaseEstimationSchema.pre("save", async function (next) {
  if (this.isNew && !this.PESNo) {
    try {
      const seqNumber = await getNextSequence("purchaseEstimationSeq");
      this.PESNo = `PES-${String(seqNumber).padStart(4, "0")}`;
      console.log("✅ SCHEMA: Generated PESNo:", this.PESNo);
    } catch (error) {
      console.error("❌ SCHEMA ERROR: Error generating PESNo:", error);
      return next(error);
    }
  }

  // Calculate totals for each purchase item
  let grandTotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  this.purchaseItems.forEach((purchaseItem) => {
    purchaseItem.items.forEach((row) => {
      row.totalCost = row.quantity * row.costPerUnit;
    });

    purchaseItem.itemTotal = purchaseItem.items.reduce(
      (sum, row) => sum + (row.totalCost || 0),
      0
    );

    let itemCgst = 0;
    let itemSgst = 0;
    let itemIgst = 0;

    purchaseItem.items.forEach((row) => {
      const rowTotal = row.totalCost || 0;
      const gstPercentage = row.gstPercentage || 0;
      const gstType = purchaseItem.gstType || "CGST+SGST";

      if (gstType === "CGST+SGST") {
        const halfGst = (rowTotal * gstPercentage) / 200;
        itemCgst += halfGst;
        itemSgst += halfGst;
      } else {
        itemIgst += (rowTotal * gstPercentage) / 100;
      }
    });

    purchaseItem.cgstAmount = itemCgst;
    purchaseItem.sgstAmount = itemSgst;
    purchaseItem.igstAmount = itemIgst;
    purchaseItem.itemTotalWithGst = purchaseItem.itemTotal + itemCgst + itemSgst + itemIgst;
    
    // Add to grand totals
    grandTotal += purchaseItem.itemTotal;
    totalCgst += itemCgst;
    totalSgst += itemSgst;
    totalIgst += itemIgst;
  });
  
  this.grandTotalCost = grandTotal;
  this.totalCgst = totalCgst;
  this.totalSgst = totalSgst;
  this.totalIgst = totalIgst;
  this.grandTotalWithGst = grandTotal + totalCgst + totalSgst + totalIgst;
  
  console.log("✅ SCHEMA: Calculated totals:", {
    grandTotalCost: this.grandTotalCost,
    totalCgst: this.totalCgst,
    totalSgst: this.totalSgst,
    totalIgst: this.totalIgst,
    grandTotalWithGst: this.grandTotalWithGst
  });
  
  next();
});

// Indexes
purchaseEstimationSchema.index({ PESNo: 1 }, { unique: true });
purchaseEstimationSchema.index({ order: 1 });
purchaseEstimationSchema.index({ PoNo: 1 });
purchaseEstimationSchema.index({ status: 1 });
purchaseEstimationSchema.index({ estimationDate: -1 });
purchaseEstimationSchema.index({ "purchaseItems.vendorId": 1 });

const PurchaseEstimation = mongoose.model(
  "PurchaseEstimation",
  purchaseEstimationSchema
);

export default PurchaseEstimation;