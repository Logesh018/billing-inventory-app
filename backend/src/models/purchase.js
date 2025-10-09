// models/PurchaseSchema.js
import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * Counter Schema for atomic sequence generation (PUR numbers).
 * We keep it simple and local to this file for self-containment.
 */
const CounterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});
const Counter = mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

const PurchaseSchema = new Schema({
  // Order Reference Fields (optional now — machine purchases won't have these)
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
  orderDate: { type: Date, default: null },
  PoNo: { type: String, default: null },

  // PUR serial (auto-generated for all purchases: PUR-1, PUR-2, ...)
  PURNo: { type: String, unique: true, index: true },

  // Order type/buyer fields — optional for machine-only purchases
  orderType: { type: String, enum: ["FOB", "JOB-Works"], default: null },
  buyerCode: { type: String, default: null },
  orderStatus: { type: String, default: null },

  // Products from Order (kept for order-linked purchases)
  products: [
    {
      productName: { type: String, required: true },
      fabricType: { type: String, default: "" },
      colors: [
        {
          color: { type: String, required: true },
          sizes: [
            {
              size: { type: String, required: true },
              quantity: { type: Number, required: true },
            },
          ],
        },
      ],
      productTotalQty: { type: Number, required: true },
    },
  ],

  // totalQty from order (optional)
  totalQty: { type: Number, default: 0 },

  // Purchase Date (can be different from order date)
  purchaseDate: { type: Date, default: Date.now },

  // Fabric / Buttons / Packets (existing logic preserved)
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

  buttonsPurchases: [
    {
      productName: { type: String, required: true },
      size: { type: String, required: true },
      vendor: { type: String, required: true },
      vendorCode: { type: String },
      vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
      purchaseMode: {
        type: String,
        enum: ["qty", "pieces"],
        default: "pieces",
      },
      quantity: { type: Number, required: true },
      costPerUnit: { type: Number, required: true },
      totalCost: { type: Number, default: 0 },
      gstPercentage: { type: Number, default: 0 },
      totalWithGst: { type: Number, default: 0 },
      buttonType: String,
      color: String,
      remarks: String,
    },
  ],

  packetsPurchases: [
    {
      productName: { type: String, required: true },
      size: { type: String, required: true },
      vendor: { type: String, required: true },
      vendorCode: { type: String },
      vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
      purchaseMode: {
        type: String,
        enum: ["piece", "packet"],
        default: "piece",
      },
      quantity: { type: Number, required: true },
      costPerUnit: { type: Number, required: true },
      totalCost: { type: Number, default: 0 },
      gstPercentage: { type: Number, default: 0 },
      totalWithGst: { type: Number, default: 0 },
      packetType: String,
      remarks: String,
    },
  ],

  // NEW: Machines purchases (array) — not linked to order/production
  machinesPurchases: [
    {
      machineName: { type: String, required: true },
      vendor: { type: String, required: true },
      vendorCode: { type: String, default: null },
      vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", default: null },
      cost: { type: Number, required: true },
      gstPercentage: { type: Number, default: 0 },
      totalCost: { type: Number, default: 0 }, // mirrors cost (for single-item machinesTotal)
      totalWithGst: { type: Number, default: 0 },
      purchaseDate: { type: Date, default: Date.now }, // per-item date if desired
      remarks: { type: String, default: "" },
    },
  ],

  // Total Purchase Costs (existing)
  totalFabricCost: { type: Number, default: 0 },
  totalButtonsCost: { type: Number, default: 0 },
  totalPacketsCost: { type: Number, default: 0 },

  totalFabricGst: { type: Number, default: 0 },
  totalButtonsGst: { type: Number, default: 0 },
  totalPacketsGst: { type: Number, default: 0 },

  // NEW: Totals for machines
  totalMachinesCost: { type: Number, default: 0 },
  totalMachinesGst: { type: Number, default: 0 },

  // Grand totals (include machines)
  grandTotalCost: { type: Number, default: 0 },
  grandTotalWithGst: { type: Number, default: 0 },

  // Purchase Status
  status: {
    type: String,
    enum: ["Pending", "Completed"],
    default: "Pending",
  },

  // General remarks
  remarks: { type: String, default: "" },
}, { timestamps: true });

/**
 * Pre-save middleware:
 * - Generate unique PURNo using a counters collection (atomic findOneAndUpdate).
 * - Calculate totals for fabric/buttons/packets (existing).
 * - Calculate totals for machinesPurchases.
 * - Include machines totals in grand totals.
 */
PurchaseSchema.pre("save", async function (next) {
  try {
    // Generate PURNo atomically if not present
    if (!this.PURNo) {
      // Use Counter document with _id: 'purchaseSeq'
      const counter = await Counter.findOneAndUpdate(
        { _id: "purchaseSeq" },
        { $inc: { seq: 1 } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      const seq = counter.seq;
      this.PURNo = `PUR-${seq}`;
    }

    // Fabric totals
    this.totalFabricCost = (this.fabricPurchases || []).reduce((acc, f) => {
      f.totalCost = (f.quantity || 0) * (f.costPerUnit || 0);
      f.totalWithGst = f.totalCost + (f.totalCost * ((f.gstPercentage || 0) / 100));
      return acc + (f.totalCost || 0);
    }, 0);

    this.totalFabricGst = (this.fabricPurchases || []).reduce((acc, f) => {
      return acc + ((f.totalCost || 0) * ((f.gstPercentage || 0) / 100));
    }, 0);

    // Buttons totals
    this.totalButtonsCost = (this.buttonsPurchases || []).reduce((acc, b) => {
      b.totalCost = (b.quantity || 0) * (b.costPerUnit || 0);
      b.totalWithGst = b.totalCost + (b.totalCost * ((b.gstPercentage || 0) / 100));
      return acc + (b.totalCost || 0);
    }, 0);

    this.totalButtonsGst = (this.buttonsPurchases || []).reduce((acc, b) => {
      return acc + ((b.totalCost || 0) * ((b.gstPercentage || 0) / 100));
    }, 0);

    // Packets totals
    this.totalPacketsCost = (this.packetsPurchases || []).reduce((acc, p) => {
      p.totalCost = (p.quantity || 0) * (p.costPerUnit || 0);
      p.totalWithGst = p.totalCost + (p.totalCost * ((p.gstPercentage || 0) / 100));
      return acc + (p.totalCost || 0);
    }, 0);

    this.totalPacketsGst = (this.packetsPurchases || []).reduce((acc, p) => {
      return acc + ((p.totalCost || 0) * ((p.gstPercentage || 0) / 100));
    }, 0);

    // Machines totals (NEW)
    this.totalMachinesCost = (this.machinesPurchases || []).reduce((acc, m) => {
      // treat 'cost' as base; totalCost mirrors cost, then GST applied
      m.totalCost = (m.cost || 0);
      m.totalWithGst = m.totalCost + (m.totalCost * ((m.gstPercentage || 0) / 100));
      return acc + (m.totalCost || 0);
    }, 0);

    this.totalMachinesGst = (this.machinesPurchases || []).reduce((acc, m) => {
      return acc + ((m.totalCost || 0) * ((m.gstPercentage || 0) / 100));
    }, 0);

    // Grand totals include machines
    this.grandTotalCost = (this.totalFabricCost || 0) + (this.totalButtonsCost || 0) + (this.totalPacketsCost || 0) + (this.totalMachinesCost || 0);
    this.grandTotalWithGst = (this.grandTotalCost || 0) + (this.totalFabricGst || 0) + (this.totalButtonsGst || 0) + (this.totalPacketsGst || 0) + (this.totalMachinesGst || 0);

    // If any purchases arrays contain items, mark as Completed; otherwise keep as Pending
    const hasItems =
      (this.fabricPurchases && this.fabricPurchases.length > 0) ||
      (this.buttonsPurchases && this.buttonsPurchases.length > 0) ||
      (this.packetsPurchases && this.packetsPurchases.length > 0) ||
      (this.machinesPurchases && this.machinesPurchases.length > 0);

    this.status = hasItems ? "Completed" : this.status || "Pending";

    next();
  } catch (err) {
    next(err);
  }
});

// Indexes for queries
PurchaseSchema.index({ order: 1 });
PurchaseSchema.index({ PoNo: 1 });
PurchaseSchema.index({ buyerCode: 1 });
PurchaseSchema.index({ purchaseDate: -1 });
PurchaseSchema.index({ status: 1 });
PurchaseSchema.index({ orderType: 1 });
PurchaseSchema.index({ "fabricPurchases.vendorId": 1 });
PurchaseSchema.index({ "buttonsPurchases.vendorId": 1 });
PurchaseSchema.index({ "packetsPurchases.vendorId": 1 });
PurchaseSchema.index({ "machinesPurchases.vendorId": 1 });
PurchaseSchema.index({ PURNo: 1 });

export default mongoose.models.Purchase || mongoose.model("Purchase", PurchaseSchema);
