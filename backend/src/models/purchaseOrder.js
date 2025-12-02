// src/models/purchaseOrder.js
import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  rate: { type: Number, required: true },
  amount: { type: Number, required: true },
});

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: { type: String, required: true, unique: true },
    poDate: { type: Date, required: true },

    buyer: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      gstin: { type: String },
    },

    supplier: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      gstin: { type: String },
    },

    items: [itemSchema],

    taxes: {
      cgst: { type: Number, default: 0 },
      sgst: { type: Number, default: 0 },
      igst: { type: Number, default: 0 },
    },

    discount: { type: Number, default: 0 },
    totalValue: { type: Number, required: true },
    roundOff: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },

    pdfUrl: { type: String }, 

  },
  { timestamps: true }
);

export default mongoose.model("PurchaseOrder", purchaseOrderSchema);
