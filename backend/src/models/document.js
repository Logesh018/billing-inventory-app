// models/document.js (renamed from invoice.js)
import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema({
  // Document Identification
  documentType: { 
    type: String, 
    enum: ["invoice", "proforma", "estimation"], 
    required: true,
    default: "invoice"
  },
  documentNo: { type: String, required: true }, // Generic field for all document numbers
  
  // Legacy fields for backward compatibility (will be deprecated)
  invoiceNo: { type: String }, // Keep for existing invoices
  
  // Document dates
  documentDate: { type: Date, required: true },
  dueDate: { type: Date }, // Not required for estimations
  validUntil: { type: Date }, // For proformas and estimations
  
  // Conversion tracking
  originalDocument: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Document" 
  }, // Reference to original document when converted
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

  // Document Items
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

  // Tax Details (for Indian GST compliance)
  taxDetails: {
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
  },

  // Business Information
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
    logo: { type: String },
  },

  // Document Status
  status: {
    type: String,
    enum: [
      // Common statuses
      "Draft", "Sent", "Viewed", "Accepted", "Rejected", "Cancelled",
      // Invoice specific
      "Partially Paid", "Paid", "Overdue",
      // Estimation/Proforma specific
      "Under Review", "Approved", "Expired", "Converted"
    ],
    default: "Draft"
  },
  
  // Payment fields (mainly for invoices)
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

  // Additional Fields
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
  acceptedAt: { type: Date },
  
}, { timestamps: true });

// Pre-save middleware to calculate totals
DocumentSchema.pre("save", function (next) {
  // Set legacy invoiceNo for backward compatibility
  if (this.documentType === "invoice" && this.documentNo) {
    this.invoiceNo = this.documentNo;
  }

  // Calculate line totals for each item
  this.items.forEach(item => {
    let itemSubtotal = item.quantity * item.unitPrice;
    
    // Apply discount
    let discountAmount = 0;
    if (item.discountType === "percentage") {
      discountAmount = (itemSubtotal * item.discount) / 100;
    } else {
      discountAmount = item.discount;
    }
    itemSubtotal -= discountAmount;
    
    // Calculate tax
    const taxAmount = (itemSubtotal * item.taxRate) / 100;
    
    // Set line total
    item.lineTotal = itemSubtotal + taxAmount;
  });

  // Calculate document totals
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

  // GST calculation (customize based on business rules)
  this.taxDetails.cgst = this.totalTax / 2;
  this.taxDetails.sgst = this.totalTax / 2;
  this.taxDetails.igst = 0;

  this.grandTotal = subtotalAfterDiscount + this.totalTax;
  this.balanceAmount = this.grandTotal - this.amountPaid;

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
DocumentSchema.statics.generateDocumentNumber = async function(documentType) {
  const currentYear = new Date().getFullYear();
  const prefixes = {
    invoice: `INV-${currentYear}-`,
    proforma: `PRO-${currentYear}-`,
    estimation: `EST-${currentYear}-`
  };
  
  const prefix = prefixes[documentType];
  if (!prefix) throw new Error(`Invalid document type: ${documentType}`);
  
  // Find the latest document of this type for current year
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
DocumentSchema.statics.generateInvoiceNumber = async function() {
  return this.generateDocumentNumber('invoice');
};

// Instance methods
DocumentSchema.methods.markAsPaid = function() {
  if (this.documentType !== 'invoice') {
    throw new Error('Only invoices can be marked as paid');
  }
  this.status = "Paid";
  this.amountPaid = this.grandTotal;
  this.balanceAmount = 0;
  return this.save();
};

DocumentSchema.methods.addPayment = function(paymentData) {
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
DocumentSchema.methods.convertTo = async function(newDocumentType, additionalData = {}) {
  const validConversions = {
    estimation: ['proforma', 'invoice'],
    proforma: ['invoice'],
    invoice: [] // Invoices typically don't convert to other types
  };

  if (!validConversions[this.documentType].includes(newDocumentType)) {
    throw new Error(`Cannot convert ${this.documentType} to ${newDocumentType}`);
  }

  // Generate new document number
  const newDocumentNo = await this.constructor.generateDocumentNumber(newDocumentType);

  // Create new document data
  const newDocumentData = {
    documentType: newDocumentType,
    documentNo: newDocumentNo,
    documentDate: new Date(),
    originalDocument: this._id,
    convertedFrom: this.documentType,
    
    // Copy all relevant fields
    customer: this.customer,
    customerDetails: this.customerDetails,
    items: this.items.map(item => ({...item.toObject(), _id: undefined})),
    businessDetails: this.businessDetails,
    notes: this.notes,
    template: this.template,
    customization: this.customization,
    createdBy: this.createdBy,
    
    // Document type specific fields
    ...(newDocumentType === 'invoice' && {
      dueDate: additionalData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paymentTerms: additionalData.paymentTerms || this.paymentTerms || "Net 30"
    }),
    ...(newDocumentType === 'proforma' && {
      validUntil: additionalData.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }),
    
    ...additionalData
  };

  // Create new document
  const newDocument = new this.constructor(newDocumentData);
  const savedDocument = await newDocument.save();

  // Update original document's conversion tracking
  this.convertedTo.push({
    documentType: newDocumentType,
    documentId: savedDocument._id,
    convertedAt: new Date()
  });
  
  // Update status if needed
  if (this.status === 'Draft' || this.status === 'Sent') {
    this.status = 'Converted';
  }
  
  await this.save();

  return savedDocument;
};

// Export with backward compatibility
const Document = mongoose.model("Document", DocumentSchema);

// For backward compatibility, also export as Invoice
export { Document as Invoice };
export default Document;