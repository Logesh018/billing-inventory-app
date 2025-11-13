// models/PurchaseSchema.js
import mongoose from "mongoose";

const { Schema } = mongoose;
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

  orderType: { type: String, enum: ["FOB", "JOB-Works", "Own-Orders"], default: null },
  buyerCode: { type: String, default: null },
  orderStatus: { type: String, default: null },

  products: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },

      productDetails: {
        name: { type: String, required: true },
        style: { type: String, required: true },
        color: { type: String, required: true },
        fabricType: { type: String, required: true },
      },

      // Simplified sizes structure (no fabricTypes wrapper)
      sizes: [
        {
          size: { type: String, required: true },
          qty: { type: Number, required: true, min: 1 },
        }
      ],

      productTotalQty: { type: Number, default: 0 },
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

  // Machines purchases (array) — not linked to order/production
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

  totalFabricGst: { type: Number, default: 0 },

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

    // Accessories totals (replaces buttons and packets)
    this.totalAccessoriesCost = (this.accessoriesPurchases || []).reduce((acc, a) => {
      a.totalCost = (a.quantity || 0) * (a.costPerUnit || 0);
      a.totalWithGst = a.totalCost + (a.totalCost * ((a.gstPercentage || 0) / 100));
      return acc + (a.totalCost || 0);
    }, 0);

    this.totalAccessoriesGst = (this.accessoriesPurchases || []).reduce((acc, a) => {
      return acc + ((a.totalCost || 0) * ((a.gstPercentage || 0) / 100));
    }, 0);

    // Machines totals
    this.totalMachinesCost = (this.machinesPurchases || []).reduce((acc, m) => {
      m.totalCost = (m.cost || 0);
      m.totalWithGst = m.totalCost + (m.totalCost * ((m.gstPercentage || 0) / 100));
      return acc + (m.totalCost || 0);
    }, 0);

    this.totalMachinesGst = (this.machinesPurchases || []).reduce((acc, m) => {
      return acc + ((m.totalCost || 0) * ((m.gstPercentage || 0) / 100));
    }, 0);

    // Grand totals (fabric + accessories + machines)
    this.grandTotalCost = (this.totalFabricCost || 0) + (this.totalAccessoriesCost || 0) + (this.totalMachinesCost || 0);
    this.grandTotalWithGst = (this.grandTotalCost || 0) + (this.totalFabricGst || 0) + (this.totalAccessoriesGst || 0) + (this.totalMachinesGst || 0);

    // Update status based on items
    const hasItems =
      (this.fabricPurchases && this.fabricPurchases.length > 0) ||
      (this.accessoriesPurchases && this.accessoriesPurchases.length > 0) ||
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
PurchaseSchema.index({ "accessoriesPurchases.vendorId": 1 });
PurchaseSchema.index({ "machinesPurchases.vendorId": 1 });
PurchaseSchema.index({ PURNo: 1 });

export default mongoose.models.Purchase || mongoose.model("Purchase", PurchaseSchema);
