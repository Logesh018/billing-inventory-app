// models/document.js
import mongoose from "mongoose";
import { numberToWords } from "../services/numberToWords.js";

const DocumentSchema = new mongoose.Schema({
  documentType: {
    type: String,
    enum: ["invoice", "proforma", "estimation"],
    required: true,
    default: "invoice"
  },
  documentNo: { type: String, required: true },
  invoiceNo: { type: String },

  // Document dates
  documentDate: { type: Date, required: true },
  dueDate: { type: Date },
  validUntil: { type: Date },

  originalDocument: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Document"
  },
  convertedFrom: {
    type: String,
    enum: ["estimation", "proforma", "invoice"]
  },
  convertedTo: [{
    documentType: { type: String, enum: ["estimation", "proforma", "invoice"] },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document" },
    convertedAt: { type: Date, default: Date.now }
  }],

  // Customer Information
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Buyer" },
  customerDetails: {
    name: { type: String },
    email: { type: String },
    mobile: { type: String },
    address: { type: String },
    gst: { type: String },
    company: { type: String },
  },

  // Document Items with Colors and Sizes 
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      productDetails: {
        name: { type: String, required: true },
        description: { type: String },
        hsn: { type: String },
      },
      colors: [
        {
          colorName: { type: String, required: true }, // e.g., "White", "Black"
          sizes: [
            {
              sizeName: { type: String, required: true }, // e.g., "S", "M", "L", "XL"
              quantity: { type: Number, required: true, min: 0 },
              unitPrice: { type: Number, required: true, min: 0 },
            }
          ]
        }
      ],
     
      quantity: { type: Number, min: 0 },
      unitPrice: { type: Number, min: 0 },
      discount: { type: Number, default: 0, min: 0 },
      discountType: { type: String, enum: ["percentage", "amount"], default: "percentage" },
      taxRate: { type: Number, default: 18 },
      lineTotal: { type: Number, default: 0 },
    }
  ],

  // Totals and Calculations
  subtotal: { type: Number, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  totalTax: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },

  // Additional Charges and Metadata
  transportationCharges: { type: Number, default: 0 },
  transportationHsn: { type: String, default: "9966" },
  transportationTaxRate: { type: Number, default: 18 },
  amountInWords: { type: String },
  orderNo: { type: String },
  placeOfSupply: { type: String },

  // Tax Details (for Indian GST compliance)
  taxDetails: {
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    transportationCgst: { type: Number, default: 0 },
    transportationSgst: { type: Number, default: 0 },
  },

  // Business Information
  businessDetails: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    gst: { type: String },
    pan: { type: String },
    email: { type: String },
    phone: { type: String },
    website: { type: String },
    logo: { type: String },
    bankName: { type: String },
    accountNumber: { type: String },
    ifsc: { type: String },
    branch: { type: String },
  },

  // Document Status
  status: {
    type: String,
    enum: [
      "Draft", "Sent", "Viewed", "Accepted", "Rejected", "Cancelled",
      "Partially Paid", "Paid", "Overdue",
      "Under Review", "Approved", "Expired", "Converted"
    ],
    default: "Draft"
  },

  // Payment fields
  paymentTerms: { type: String, default: "Net 30" },
  paymentMethod: { type: String },
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
  pdfUrl: { type: String },
  pdfPublicId: { type: String },

  // Template and Design
  template: { type: String, default: "modern" },
  customization: {
    primaryColor: { type: String, default: "#2563eb" },
    secondaryColor: { type: String, default: "#64748b" },
    fontFamily: { type: String, default: "Inter" },
    showLogo: { type: Boolean, default: true },
    showGST: { type: Boolean, default: true },
  },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  sentAt: { type: Date },
  viewedAt: { type: Date },
  acceptedAt: { type: Date },

}, { timestamps: true });

// Pre-save middleware to calculate totals
DocumentSchema.pre("save", function (next) {
  // Set legacy invoiceNo for backward compatibility
  if (this.documentType === "invoice" && this.documentNo) {
    this.invoiceNo = this.documentNo;
  }

  // Calculate totals
  this.subtotal = 0;
  this.totalDiscount = 0;
  this.totalTax = 0;

  this.items.forEach(item => {
    let itemSubtotal = 0;

    // Check if item has colors/sizes (new format)
    if (item.colors && item.colors.length > 0) {
      // Calculate from colors and sizes
      item.colors.forEach(color => {
        if (color.sizes && color.sizes.length > 0) {
          color.sizes.forEach(size => {
            itemSubtotal += (size.quantity || 0) * (size.unitPrice || 0);
          });
        }
      });

      // Set legacy quantity and unitPrice for backward compatibility
      let totalQty = 0;
      item.colors.forEach(color => {
        color.sizes.forEach(size => {
          totalQty += size.quantity || 0;
        });
      });
      item.quantity = totalQty;
      item.unitPrice = totalQty > 0 ? itemSubtotal / totalQty : 0;
    } else {
      // Legacy calculation (no colors/sizes)
      itemSubtotal = (item.quantity || 0) * (item.unitPrice || 0);
    }

    this.subtotal += itemSubtotal;

    // Apply discount
    let discountAmount = 0;
    if (item.discountType === "percentage") {
      discountAmount = (itemSubtotal * (item.discount || 0)) / 100;
    } else {
      discountAmount = item.discount || 0;
    }
    this.totalDiscount += discountAmount;

    // Calculate tax on discounted amount
    const taxableAmount = itemSubtotal - discountAmount;
    const taxAmount = (taxableAmount * (item.taxRate || 0)) / 100;
    this.totalTax += taxAmount;

    // Set line total
    item.lineTotal = taxableAmount + taxAmount;
  });

  const subtotalAfterDiscount = this.subtotal - this.totalDiscount;

  // GST calculation for items (CGST + SGST = Total Tax)
  this.taxDetails.cgst = this.totalTax / 2;
  this.taxDetails.sgst = this.totalTax / 2;
  this.taxDetails.igst = 0; // Assuming intra-state (same state transactions)

  // Transportation charges tax calculation (dynamic rate)
  const transportCharges = this.transportationCharges || 0;
  const transportTaxRate = this.transportationTaxRate || 18;
  if (transportCharges > 0) {
    const transportTax = (transportCharges * transportTaxRate) / 100;
    this.taxDetails.transportationCgst = transportTax / 2;
    this.taxDetails.transportationSgst = transportTax / 2;
  } else {
    this.taxDetails.transportationCgst = 0;
    this.taxDetails.transportationSgst = 0;
  }

  const transportationTax = this.taxDetails.transportationCgst + this.taxDetails.transportationSgst;
  this.grandTotal = subtotalAfterDiscount + this.totalTax + transportCharges + transportationTax;

  this.grandTotal = Math.round(this.grandTotal);

  try {
    this.amountInWords = numberToWords(this.grandTotal);
  } catch (error) {
    console.error("Error converting amount to words:", error);
    this.amountInWords = "";
  }

  this.balanceAmount = this.grandTotal - (this.amountPaid || 0);

  next();
});

// Indexes for better performance
DocumentSchema.index({ documentNo: 1 });
DocumentSchema.index({ documentType: 1, documentNo: 1 }, { unique: true });
DocumentSchema.index({ customer: 1 });
DocumentSchema.index({ documentDate: -1 });
DocumentSchema.index({ status: 1 });
DocumentSchema.index({ dueDate: 1 });
DocumentSchema.index({ createdAt: -1 });
DocumentSchema.index({ originalDocument: 1 });

// Static methods for number generation
DocumentSchema.statics.generateDocumentNumber = async function (documentType) {
  const currentYear = new Date().getFullYear();
  const prefixes = {
    invoice: `INV-${currentYear}-`,
    proforma: `PRO-${currentYear}-`,
    estimation: `EST-${currentYear}-`
  };

  const prefix = prefixes[documentType];
  if (!prefix) throw new Error(`Invalid document type: ${documentType}`);

  const latestDocument = await this.findOne({
    documentType,
    documentNo: { $regex: `^${prefix}` }
  }).sort({ documentNo: -1 });

  let nextNumber = 1;
  if (latestDocument) {
    const lastNumber = parseInt(latestDocument.documentNo.replace(prefix, ''));
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
};

// Backward compatibility method
DocumentSchema.statics.generateInvoiceNumber = async function () {
  return this.generateDocumentNumber('invoice');
};

// Instance methods
DocumentSchema.methods.markAsPaid = function () {
  if (this.documentType !== 'invoice') {
    throw new Error('Only invoices can be marked as paid');
  }
  this.status = "Paid";
  this.amountPaid = this.grandTotal;
  this.balanceAmount = 0;
  return this.save();
};

DocumentSchema.methods.addPayment = function (paymentData) {
  if (this.documentType !== 'invoice') {
    throw new Error('Only invoices can have payments');
  }

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

// Conversion methods
DocumentSchema.methods.convertTo = async function (newDocumentType, additionalData = {}) {
  const validConversions = {
    estimation: ['proforma', 'invoice'],
    proforma: ['invoice'],
    invoice: []
  };

  if (!validConversions[this.documentType].includes(newDocumentType)) {
    throw new Error(`Cannot convert ${this.documentType} to ${newDocumentType}`);
  }

  const newDocumentNo = await this.constructor.generateDocumentNumber(newDocumentType);

  const newDocumentData = {
    documentType: newDocumentType,
    documentNo: newDocumentNo,
    documentDate: new Date(),
    originalDocument: this._id,
    convertedFrom: this.documentType,
    customer: this.customer,
    customerDetails: this.customerDetails,
    items: this.items.map(item => ({ ...item.toObject(), _id: undefined })),
    businessDetails: this.businessDetails,
    notes: this.notes,
    template: this.template,
    customization: this.customization,
    createdBy: this.createdBy,
    orderNo: this.orderNo,
    placeOfSupply: this.placeOfSupply,
    transportationCharges: this.transportationCharges,

    ...(newDocumentType === 'invoice' && {
      dueDate: additionalData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paymentTerms: additionalData.paymentTerms || this.paymentTerms || "Net 30"
    }),
    ...(newDocumentType === 'proforma' && {
      validUntil: additionalData.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }),

    ...additionalData
  };

  const newDocument = new this.constructor(newDocumentData);
  const savedDocument = await newDocument.save();

  this.convertedTo.push({
    documentType: newDocumentType,
    documentId: savedDocument._id,
    convertedAt: new Date()
  });

  if (this.status === 'Draft' || this.status === 'Sent') {
    this.status = 'Converted';
  }
  await this.save();
  return savedDocument;
};

const Document = mongoose.model("Document", DocumentSchema);

export { Document as Invoice };
export default Document;