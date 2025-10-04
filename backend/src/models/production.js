import mongoose from "mongoose";

const productionSchema = new mongoose.Schema(
  {
    // Always linked to an Order
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    // Linked to Purchase only for FOB
    purchase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchase",
    },

    // PO Info
    poDate: { type: Date }, // From Purchase if FOB, manual if JOB-WORKS
    poNumber: { type: String }, // From Purchase if FOB, manual if JOB-WORKS

    // Factory Info
    factoryReceivedDate: { type: Date },
    dcNumber: { type: String },

    // Fabric Info
    receivedFabric: { type: String }, // From Purchase if FOB, from Orders if JOB-WORKS
    goodsType: { type: String }, // fabricStyle (from Orders always)
    orderType: {
      type: String,
      enum: ["FOB", "JOB-Works"],
      required: true,
    },
    color: { type: String }, // From Orders if JOB-WORKS, from Purchase if FOB

    // Quantity
    requiredQty: { type: Number, default: 0 }, // totalQty from Orders
    expectedQty: { type: Number, default: 0 },
    dcMtr: { type: Number, default: 0 },
    tagMtr: { type: Number, default: 0 },
    cuttingMtr: { type: Number, default: 0 },

    // Auto-calculated in frontend (TagMtr - CuttingMtr)
    shortageMtr: { type: Number, default: 0 },

    // Production Status
    status: {
      type: String,
      enum: [
        "Pending Production",
        "Factory Received",
        "In Production",
        "Cutting",
        "Stitching",
        "Trimming",
        "QC",
        "Ironing",
        "Packing",
        "Completed",
      ],
      default: "Pending Production",
    },

    remarks: { type: String, maxlength: 200 },

    // Workflow History
    workflowHistory: [
      {
        stage: String, // e.g. Cutting, Stitching, etc.
        status: String, // e.g. Pending, Ongoing, Completed
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Production = mongoose.model("Production", productionSchema);
export default Production;
