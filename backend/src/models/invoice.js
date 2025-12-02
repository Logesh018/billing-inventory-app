// models/invoice.js
import mongoose from "mongoose";

const InvoiceSchema = new mongoose.Schema({
  // Invoice Identification
  invoiceNo: { type: String, required: true, unique: true },
  invoiceDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  
  // Customer Information
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Buyer" }, // Reference existing buyers
  customerDetails: {
    name: { type: String, required: true },
    email: { type: String },
    mobile: { type: String },
    address: { type: String },
    gst: { type: String },
    company: { type: String },
  },

  // Invoice Items
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      productDetails: {
        name: { type: String, required: true },
        description: { type: String },
        hsn: { type: String },
      },
      quantity: { type: Number, required: true, min: 1 },
      unitPrice: { type: Number, required: true, min: 0 },
      discount: { type: Number, default: 0, min: 0 }, // Percentage or amount
      discountType: { type: String, enum: ["percentage", "amount"], default: "percentage" },
      taxRate: { type: Number, default: 18 }, // GST rate in percentage
      lineTotal: { type: Number, default: 0 }, // Calculated field
    }
  ],

  // Totals and Calculations
  subtotal: { type: Number, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  totalTax: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },

  // Tax Details (for Indian GST compliance)
  taxDetails: {
    cgst: { type: Number, default: 0 }, // Central GST
    sgst: { type: Number, default: 0 }, // State GST
    igst: { type: Number, default: 0 }, // Integrated GST
  },

  // Business Information (configurable)
  businessDetails: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    gst: { type: String },
    email: { type: String },
    phone: { type: String },
    website: { type: String },
    logo: { type: String }, // URL to logo
  },

  // Invoice Status and Payment
  status: {
    type: String,
    enum: ["Draft", "Sent", "Viewed", "Partially Paid", "Paid", "Overdue", "Cancelled"],
    default: "Draft"
  },
  
  paymentTerms: { type: String, default: "Net 30" },
  paymentMethod: { type: String },
  
  // Payment Tracking
  payments: [
    {
      date: { type: Date, required: true },
      amount: { type: Number, required: true },
      method: { type: String },
      reference: { type: String },
      notes: { type: String }
    }
  ],
  
  amountPaid: { type: Number, default: 0 },
  balanceAmount: { type: Number, default: 0 },

  // PDF Storage
  pdfUrl: { type: String }, // Cloudinary URL
  pdfPublicId: { type: String }, // Cloudinary public ID for deletion

  notes: { type: String },
  internalNotes: { type: String },
  
  // Template and Design
  template: { type: String, default: "modern" },
  customization: {
    primaryColor: { type: String, default: "#2563eb" },
    secondaryColor: { type: String, default: "#64748b" },
    fontFamily: { type: String, default: "Inter" },
    showLogo: { type: Boolean, default: true },
    showGST: { type: Boolean, default: true },
  },

  // Metadata
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  sentAt: { type: Date },
  viewedAt: { type: Date },
  
}, { timestamps: true });

// Pre-save middleware to calculate totals
InvoiceSchema.pre("save", function (next) {
  this.items.forEach(item => {
    let itemSubtotal = item.quantity * item.unitPrice;
    
    let discountAmount = 0;
    if (item.discountType === "percentage") {
      discountAmount = (itemSubtotal * item.discount) / 100;
    } else {
      discountAmount = item.discount;
    }
    itemSubtotal -= discountAmount;
    const taxAmount = (itemSubtotal * item.taxRate) / 100;
    item.lineTotal = itemSubtotal + taxAmount;
  });

  this.subtotal = this.items.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice);
  }, 0);

  this.totalDiscount = this.items.reduce((sum, item) => {
    let discountAmount = 0;
    if (item.discountType === "percentage") {
      discountAmount = ((item.quantity * item.unitPrice) * item.discount) / 100;
    } else {
      discountAmount = item.discount;
    }
    return sum + discountAmount;
  }, 0);

  const subtotalAfterDiscount = this.subtotal - this.totalDiscount;

  this.totalTax = this.items.reduce((sum, item) => {
    const itemSubtotal = (item.quantity * item.unitPrice) - 
      (item.discountType === "percentage" 
        ? ((item.quantity * item.unitPrice) * item.discount) / 100
        : item.discount);
    return sum + ((itemSubtotal * item.taxRate) / 100);
  }, 0);

  this.taxDetails.cgst = this.totalTax / 2;
  this.taxDetails.sgst = this.totalTax / 2;
  this.taxDetails.igst = 0; 

  this.grandTotal = subtotalAfterDiscount + this.totalTax;
  this.balanceAmount = this.grandTotal - this.amountPaid;

  next();
});

// Indexes for better query performance
InvoiceSchema.index({ invoiceNo: 1 });
InvoiceSchema.index({ customer: 1 });
InvoiceSchema.index({ invoiceDate: -1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ dueDate: 1 });
InvoiceSchema.index({ createdAt: -1 });

// Static methods
InvoiceSchema.statics.generateInvoiceNumber = async function() {
  const currentYear = new Date().getFullYear();
  const prefix = `INV-${currentYear}-`;
  
  // Find the latest invoice for current year
  const latestInvoice = await this.findOne({
    invoiceNo: { $regex: `^${prefix}` }
  }).sort({ invoiceNo: -1 });

  let nextNumber = 1;
  if (latestInvoice) {
    const lastNumber = parseInt(latestInvoice.invoiceNo.replace(prefix, ''));
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
};

// Instance methods
InvoiceSchema.methods.markAsPaid = function() {
  this.status = "Paid";
  this.amountPaid = this.grandTotal;
  this.balanceAmount = 0;
  return this.save();
};

InvoiceSchema.methods.addPayment = function(paymentData) {
  this.payments.push(paymentData);
  this.amountPaid += paymentData.amount;
  
  if (this.amountPaid >= this.grandTotal) {
    this.status = "Paid";
    this.balanceAmount = 0;
  } else if (this.amountPaid > 0) {
    this.status = "Partially Paid";
    this.balanceAmount = this.grandTotal - this.amountPaid;
  }
  
  return this.save();
};

export default mongoose.model("Invoice", InvoiceSchema);