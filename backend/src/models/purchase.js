// models/purchase.js
import mongoose from "mongoose";
import { getNextSequence } from "../utils/counterUtils.js";

const { Schema } = mongoose;

// ProductDetails sub-schema
const PurchaseProductDetailsSchema = new Schema({
  category: { type: String },
  name: { type: String, required: true },
  type: [{ type: String }],
  style: [{ type: String }],
  fabric: { type: String, required: true },
  fabricType: { type: String },
  color: { type: String, required: true },
}, { _id: false });

const PurchaseSchema = new Schema({
  // Order Reference Fields
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
  orderDate: { type: Date, default: null },
  orderId: { type: String, default: null },
  PoNo: { type: String, default: null },

  serialNo: { type: Number },
  PURNo: { type: String },

  purchaseDate: { type: Date, default: null },
  purchaseEstimation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PurchaseEstimation",
    default: null
  },
  PESNo: {
    type: String,
    default: "N/A"
  },
  estimationDate: {
    type: Date,
    default: null
  },

  orderType: { type: String, enum: ["FOB", "JOB-Works", "Own-Orders"], default: null },
  buyerCode: { type: String, default: null },
  orderStatus: { type: String, default: null },

  products: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      productDetails: {
        type: PurchaseProductDetailsSchema,
        default: {}
      },
      sizes: [
        {
          size: { type: String, required: true },
          qty: { type: Number, required: true, min: 1 },
        }
      ],
      productTotalQty: { type: Number, default: 0 },
    },
  ],

  totalQty: { type: Number, default: 0 },

  purchaseItems: [
    {
      vendor: { type: String, required: true },
      vendorCode: { type: String },
      vendorState: { type: String },
      vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },

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
          gstPercentage: { type: Number, default: 5 },
          totalCost: { type: Number },

          invoiceDate: { type: Date, default: null },
          invoiceNo: { type: String, default: "" },
          hsn: { type: String, default: "" },
        }
      ],

      itemTotal: { type: Number, default: 0 },
      cgstAmount: { type: Number, default: 0 },
      sgstAmount: { type: Number, default: 0 },
      igstAmount: { type: Number, default: 0 },
      itemTotalWithGst: { type: Number, default: 0 },
    }
  ],

  fabricPurchases: [
    {
      productName: { type: String, required: true },
      fabricType: { type: String, required: true },
      vendor: { type: String, required: true },
      vendorCode: { type: String },
      vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
      purchaseMode: {
        type: String,
        enum: ["kg", "meters", "piece"],
        default: "kg",
      },
      quantity: { type: Number, required: true },
      costPerUnit: { type: Number, required: true },
      totalCost: { type: Number, default: 0 },
      gstPercentage: { type: Number, default: 0 },
      totalWithGst: { type: Number, default: 0 },
      colors: [String],
      gsm: String,
      remarks: String,
    },
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
    },
  ],

  totalAccessoriesCost: { type: Number, default: 0 },
  totalAccessoriesGst: { type: Number, default: 0 },

  machinesPurchases: [
    {
      machineName: { type: String, required: true },
      vendor: { type: String, required: true },
      vendorCode: { type: String, default: null },
      vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", default: null },
      cost: { type: Number, required: true },
      gstPercentage: { type: Number, default: 0 },
      totalCost: { type: Number, default: 0 },
      totalWithGst: { type: Number, default: 0 },
      purchaseDate: { type: Date, default: Date.now },
      remarks: { type: String, default: "" },
    },
  ],

  totalFabricCost: { type: Number, default: 0 },
  totalFabricGst: { type: Number, default: 0 },
  totalMachinesCost: { type: Number, default: 0 },
  totalMachinesGst: { type: Number, default: 0 },

  grandTotalCost: { type: Number, default: 0 },
  totalCgst: { type: Number, default: 0 },
  totalSgst: { type: Number, default: 0 },
  totalIgst: { type: Number, default: 0 },
  grandTotalWithGst: { type: Number, default: 0 },

  status: {
    type: String,
    enum: ["Pending", "Completed"],
    default: "Pending",
  },

  remarks: { type: String, default: "" },
}, { timestamps: true });

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

PurchaseSchema.pre("save", async function (next) {
  try {
    // Generate serial number
    if (this.isNew && !this.serialNo) {
      const seq = await getNextSequence("purchaseSeq");
      this.serialNo = seq;
      this.PURNo = `PUR-${seq}`;
      console.log(`✅ Generated Purchase serial #${seq} (${this.PURNo})`);
    }

    const hasPurchaseItems =
      (this.fabricPurchases && this.fabricPurchases.length > 0) ||
      (this.accessoriesPurchases && this.accessoriesPurchases.length > 0) ||
      (this.purchaseItems && this.purchaseItems.length > 0);

    if (this.isNew && !this.purchaseDate && hasPurchaseItems) {
      this.purchaseDate = new Date();
      console.log("✅ Auto-set purchaseDate for purchase with items");
    }

    if (!this.isNew && !this.purchaseDate && hasPurchaseItems && this.isModified('fabricPurchases', 'accessoriesPurchases', 'purchaseItems')) {
      this.purchaseDate = new Date();
      console.log("✅ Auto-set purchaseDate for updated purchase with items");
    }

    if (this.purchaseItems && this.purchaseItems.length > 0) {
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

        // Calculate GST for this item
        let itemCgst = 0;
        let itemSgst = 0;
        let itemIgst = 0;

        purchaseItem.items.forEach((row) => {
          const rowTotal = row.totalCost || 0;
          const gstPercentage = row.gstPercentage || 0;
          const gstType = purchaseItem.gstType || "CGST+SGST";

          const gstCalc = calculateGST(rowTotal, gstPercentage, gstType);
          itemCgst += gstCalc.cgst;
          itemSgst += gstCalc.sgst;
          itemIgst += gstCalc.igst;
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
    }

    // OLD: Maintain backward compatibility with old structure
    this.totalFabricCost = (this.fabricPurchases || []).reduce((acc, f) => {
      f.totalCost = (f.quantity || 0) * (f.costPerUnit || 0);
      f.totalWithGst = f.totalCost + (f.totalCost * ((f.gstPercentage || 0) / 100));
      return acc + (f.totalCost || 0);
    }, 0);

    this.totalFabricGst = (this.fabricPurchases || []).reduce((acc, f) => {
      return acc + ((f.totalCost || 0) * ((f.gstPercentage || 0) / 100));
    }, 0);

    this.totalAccessoriesCost = (this.accessoriesPurchases || []).reduce((acc, a) => {
      a.totalCost = (a.quantity || 0) * (a.costPerUnit || 0);
      a.totalWithGst = a.totalCost + (a.totalCost * ((a.gstPercentage || 0) / 100));
      return acc + (a.totalCost || 0);
    }, 0);

    this.totalAccessoriesGst = (this.accessoriesPurchases || []).reduce((acc, a) => {
      return acc + ((a.totalCost || 0) * ((a.gstPercentage || 0) / 100));
    }, 0);

    this.totalMachinesCost = (this.machinesPurchases || []).reduce((acc, m) => {
      m.totalCost = (m.cost || 0);
      m.totalWithGst = m.totalCost + (m.totalCost * ((m.gstPercentage || 0) / 100));
      return acc + (m.totalCost || 0);
    }, 0);

    this.totalMachinesGst = (this.machinesPurchases || []).reduce((acc, m) => {
      return acc + ((m.totalCost || 0) * ((m.gstPercentage || 0) / 100));
    }, 0);

    if (!this.purchaseItems || this.purchaseItems.length === 0) {
      this.grandTotalCost = (this.totalFabricCost || 0) + (this.totalAccessoriesCost || 0) + (this.totalMachinesCost || 0);
      this.grandTotalWithGst = (this.grandTotalCost || 0) + (this.totalFabricGst || 0) + (this.totalAccessoriesGst || 0) + (this.totalMachinesGst || 0);
    }

    // Determine status
    const hasItems =
      (this.purchaseItems && this.purchaseItems.length > 0) ||
      (this.fabricPurchases && this.fabricPurchases.length > 0) ||
      (this.accessoriesPurchases && this.accessoriesPurchases.length > 0) ||
      (this.machinesPurchases && this.machinesPurchases.length > 0);

    this.status = hasItems ? "Completed" : this.status || "Pending";

    next();
  } catch (err) {
    console.error("❌ Error in Purchase pre-save:", err);
    next(err);
  }
});

// Indexes
PurchaseSchema.index({ order: 1 });
PurchaseSchema.index({ PoNo: 1 });
PurchaseSchema.index({ buyerCode: 1 });
PurchaseSchema.index({ purchaseDate: -1 });
PurchaseSchema.index({ status: 1 });
PurchaseSchema.index({ orderType: 1 });
PurchaseSchema.index({ "fabricPurchases.vendorId": 1 });
PurchaseSchema.index({ "accessoriesPurchases.vendorId": 1 });
PurchaseSchema.index({ "machinesPurchases.vendorId": 1 });
PurchaseSchema.index({ "purchaseItems.vendorId": 1 });
PurchaseSchema.index({ serialNo: 1 }, { unique: true });
PurchaseSchema.index({ PURNo: 1 }, { unique: true });
PurchaseSchema.index({ purchaseEstimation: 1 });
PurchaseSchema.index({ PESNo: 1 });

export default mongoose.models.Purchase || mongoose.model("Purchase", PurchaseSchema);