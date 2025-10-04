// controllers/documentController.js
import mongoose from "mongoose";
import Document from "../models/document.js";
import Buyer from "../models/buyer.js";
import Product from "../models/products.js";
import { pdfService } from "../services/pdfService.js";
import { cloudinaryService } from "../services/cloudinaryService.js";

// Get business configuration
const getBusinessConfig = () => ({
  name: process.env.BUSINESS_NAME || "Your Business Name",
  address: process.env.BUSINESS_ADDRESS || "123 Business Street",
  city: process.env.BUSINESS_CITY || "City",
  state: process.env.BUSINESS_STATE || "State",
  pincode: process.env.BUSINESS_PINCODE || "123456",
  gst: process.env.BUSINESS_GST || "",
  email: process.env.BUSINESS_EMAIL || "info@business.com",
  phone: process.env.BUSINESS_PHONE || "+91 1234567890",
  website: process.env.BUSINESS_WEBSITE || "www.business.com",
  logo: process.env.BUSINESS_LOGO || "",
});

// Generic create document function
const createDocument = async (req, res) => {
  try {
    console.log("Full request body:", JSON.stringify(req.body, null, 2)); // Debug log

    const { documentType, customer: customerData, items, ...documentData } = req.body;

    if (!documentType) {
      return res.status(400).json({ message: "documentType is required to create a document." });
    }

    console.log("Extracted customerData:", customerData); // Debug log
    console.log("Items received:", items); // Debug log

    // Handle different customer data structures from different forms
    let customer;
    let customerDetails;
    let actualCustomerData = customerData;

    // Check if customer data is nested differently (common issue)
    if (!customerData && req.body.customerDetails) {
      actualCustomerData = req.body.customerDetails;
      console.log("Using customerDetails instead:", actualCustomerData);
    }

    // Handle case where customer data might be in a different property name
    if (!actualCustomerData) {
      // Check for common alternative property names
      const possibleCustomerKeys = ['client', 'buyer', 'clientDetails', 'buyerDetails'];
      for (const key of possibleCustomerKeys) {
        if (req.body[key]) {
          actualCustomerData = req.body[key];
          console.log(`Found customer data in ${key}:`, actualCustomerData);
          break;
        }
      }
    }

    if (!actualCustomerData) {
      console.error("No customer data found in any expected property");
      return res.status(400).json({
        message: "Customer data is required",
        receivedKeys: Object.keys(req.body),
        expectedKeys: ['customer', 'customerDetails', 'buyer', 'client']
      });
    }

    // Validate required customer fields
    if (!actualCustomerData.name || !actualCustomerData.name.trim()) {
      return res.status(400).json({ message: "Customer name is required" });
    }
    if (!actualCustomerData.mobile || !actualCustomerData.mobile.trim()) {
      return res.status(400).json({ message: "Customer mobile is required" });
    }

    // Handle existing customer vs new customer
    if (actualCustomerData._id && mongoose.Types.ObjectId.isValid(actualCustomerData._id)) {
      // Existing customer
      customer = await Buyer.findById(actualCustomerData._id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      customerDetails = {
        name: customer.name,
        email: customer.email || "",
        mobile: customer.mobile || "",
        address: customer.address || "",
        gst: customer.gst || "",
        company: customer.company || "",
      };
      console.log("Using existing customer:", customer._id);
    } else {
      // New customer - create one
      try {
        customer = new Buyer({
          name: actualCustomerData.name.trim(),
          email: actualCustomerData.email?.trim() || "",
          mobile: actualCustomerData.mobile.trim(),
          address: actualCustomerData.address?.trim() || "",
          gst: actualCustomerData.gst?.trim() || "",
          company: actualCustomerData.company?.trim() || "",
        });

        const savedCustomer = await customer.save();
        console.log(`✅ New customer created:`, savedCustomer._id);

        customerDetails = {
          name: savedCustomer.name,
          email: savedCustomer.email || "",
          mobile: savedCustomer.mobile || "",
          address: savedCustomer.address || "",
          gst: savedCustomer.gst || "",
          company: savedCustomer.company || "",
        };
      } catch (customerError) {
        console.error("Error creating customer:", customerError);
        return res.status(400).json({
          message: "Failed to create customer",
          error: customerError.message
        });
      }
    }

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "At least one item is required" });
    }

    // Process items
    const processedItems = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (!item) {
        return res.status(400).json({ message: `Item ${i + 1} is invalid` });
      }

      // Validate required item fields
      if (!item.productDetails?.name || !item.productDetails.name.trim()) {
        return res.status(400).json({ message: `Item ${i + 1}: Product name is required` });
      }

      if (!item.quantity || item.quantity <= 0) {
        return res.status(400).json({ message: `Item ${i + 1}: Valid quantity is required` });
      }

      if (!item.unitPrice || item.unitPrice < 0) {
        return res.status(400).json({ message: `Item ${i + 1}: Valid unit price is required` });
      }

      let product = null;

      // Check if product already exists
      if (item.product?._id && mongoose.Types.ObjectId.isValid(item.product._id)) {
        product = await Product.findById(item.product._id);
        if (!product) {
          console.warn(`Product with ID ${item.product._id} not found, will create new one`);
        }
      }

      // Create new product if not found
      if (!product) {
        try {
          const newProduct = new Product({
            name: item.productDetails.name.trim(),
            hsn: item.productDetails.hsn?.trim() || "",
            description: item.productDetails.description?.trim() || "",
          });

          const savedProduct = await newProduct.save();
          console.log("✅ New product created:", savedProduct._id);
          product = savedProduct;
        } catch (productError) {
          console.error(`Error creating product for item ${i + 1}:`, productError);
          return res.status(400).json({
            message: `Failed to create product for item ${i + 1}`,
            error: productError.message
          });
        }
      }

      processedItems.push({
        product: product._id,
        productDetails: {
          name: item.productDetails.name.trim(),
          description: item.productDetails.description?.trim() || "",
          hsn: item.productDetails.hsn?.trim() || product.hsn || "",
          specifications: item.productDetails.specifications?.trim() || "",
        },
        quantity: parseInt(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
        discount: parseFloat(item.discount || 0),
        discountType: item.discountType || "percentage",
        taxRate: parseFloat(item.taxRate || 18),
        // Include additional fields for estimations
        laborCost: parseFloat(item.laborCost || 0),
        materialCost: parseFloat(item.materialCost || 0),
      });
    }

    // Generate document number if not provided
    let documentNo = documentData.documentNo;
    if (!documentNo || !documentNo.trim()) {
      try {
        documentNo = await Document.generateDocumentNumber(documentType);
      } catch (error) {
        console.error("Error generating document number:", error);
        // Fallback document number
        const timestamp = Date.now();
        const prefix = documentType.toUpperCase().substring(0, 3);
        documentNo = `${prefix}-${timestamp}`;
      }
    }

    // Set type-specific defaults
    const typeDefaults = {
      invoice: {
        dueDate: documentData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paymentTerms: documentData.paymentTerms || "Net 30",
      },
      proforma: {
        validUntil: documentData.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paymentTerms: documentData.paymentTerms || "50% Advance, 50% on Delivery",
      },
      estimation: {
        validUntil: documentData.validUntil || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        estimatedDelivery: documentData.estimatedDelivery || new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        warranty: documentData.warranty || "1 Year Manufacturing Defects",
      }
    };

    // Create the document
    const document = new Document({
      documentType,
      documentNo,
      documentDate: documentData.documentDate ? new Date(documentData.documentDate) : new Date(),
      ...typeDefaults[documentType],
      customer: customer._id,
      customerDetails,
      items: processedItems,
      businessDetails: getBusinessConfig(),
      notes: documentData.notes?.trim() || "",
      template: documentData.template || "modern",
      customization: documentData.customization || {
        primaryColor: documentType === 'estimation' ? '#059669' : '#2563eb',
        secondaryColor: '#64748b',
        fontFamily: 'Inter',
        showLogo: true,
        showGST: true,
      },
      createdBy: req.user?.id,
    });

    const savedDocument = await document.save();
    console.log(`✅ ${documentType} created:`, savedDocument._id);

    // Generate PDF
    try {
      const pdfResult = await pdfService.generateDocumentPDF(savedDocument);
      savedDocument.pdfUrl = pdfResult.url;
      savedDocument.pdfPublicId = pdfResult.publicId;
      await savedDocument.save();
      console.log("✅ PDF generated and uploaded:", pdfResult.url);
    } catch (pdfError) {
      console.error("❌ PDF generation failed:", pdfError);
      // Document is still saved, just without PDF
    }

    // Return populated document
    const populatedDocument = await Document.findById(savedDocument._id)
      .populate("customer", "name email mobile company")
      .populate("items.product", "name hsn");

    res.status(201).json(populatedDocument);
  } catch (error) {
    console.error(`❌ Error creating ${req.body.documentType || 'document'}:`, error);
    res.status(500).json({
      message: `Error creating ${req.body.documentType || 'document'}`,
      error: error.message
    });
  }
};

// Generic get documents function
const getDocuments = async (req, res) => {
  try {
    const {
      documentType,
      status,
      customer,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    const filter = {};
    if (documentType) filter.documentType = documentType;
    if (status) filter.status = status;
    if (customer) filter.customer = customer;

    if (startDate || endDate) {
      filter.documentDate = {};
      if (startDate) filter.documentDate.$gte = new Date(startDate);
      if (endDate) filter.documentDate.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const documents = await Document.find(filter)
      .populate("customer", "name email mobile company")
      .populate("originalDocument", "documentType documentNo")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Document.countDocuments(filter);

    res.json({
      documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(`❌ Error fetching documents:`, error);
    res.status(500).json({ message: `Error fetching documents` });
  }
};

// Functions for backward compatibility
const createInvoice = (req, res) => {
  req.body.documentType = 'invoice';
  return createDocument(req, res);
};

const createProforma = (req, res) => {
  req.body.documentType = 'proforma';
  return createDocument(req, res);
};

const createEstimation = (req, res) => {
  req.body.documentType = 'estimation';
  return createDocument(req, res);
};

const getInvoices = (req, res) => {
  req.query.documentType = 'invoice';
  return getDocuments(req, res);
};

const getProformas = (req, res) => {
  req.query.documentType = 'proforma';
  return getDocuments(req, res);
};

const getEstimations = (req, res) => {
  req.query.documentType = 'estimation';
  return getDocuments(req, res);
};

// Get single document by ID
const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate("customer")
      .populate("items.product")
      .populate("originalDocument", "documentType documentNo")
      .populate("convertedTo.documentId", "documentType documentNo");

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Track view
    if (!document.viewedAt) {
      document.viewedAt = new Date();
      if (document.status === "Sent") {
        document.status = "Viewed";
      }
      await document.save();
    }

    res.json(document);
  } catch (error) {
    console.error("❌ Error fetching document:", error);
    res.status(500).json({ message: "Error fetching document" });
  }
};

// Backward compatibility
const getInvoiceById = getDocumentById;

// Update document
const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Handle customer update separately
    if (updateData.customer) {
      let customer;
      let customerDetails;

      // Case 1: Customer is an existing ID
      if (updateData.customer._id && mongoose.Types.ObjectId.isValid(updateData.customer._id)) {
        customer = await Buyer.findById(updateData.customer._id);
        if (!customer) {
          return res.status(404).json({ message: "Customer not found" });
        }
        customerDetails = {
          name: customer.name,
          email: customer.email || "",
          mobile: customer.mobile || "",
          address: customer.address || "",
          gst: customer.gst || "",
          company: customer.company || "",
        };
        document.customer = customer._id;
      } else {
        // Case 2: New customer or updated details
        const customerData = updateData.customer;
        if (!customerData.name || !customerData.name.trim()) {
          return res.status(400).json({ message: "Customer name is required" });
        }
        if (!customerData.mobile || !customerData.mobile.trim()) {
          return res.status(400).json({ message: "Customer mobile is required" });
        }

        // Check if a buyer with the same name and mobile exists
        customer = await Buyer.findOne({
          name: customerData.name.trim(),
          mobile: customerData.mobile.trim(),
        });

        if (!customer) {
          // Create new customer
          customer = new Buyer({
            name: customerData.name.trim(),
            email: customerData.email?.trim() || "",
            mobile: customerData.mobile.trim(),
            address: customerData.address?.trim() || "",
            gst: customerData.gst?.trim() || "",
            company: customerData.company?.trim() || "",
          });
          await customer.save();
          console.log(`✅ New customer created: ${customer._id}`);
        } else {
          // Update existing customer
          customer.email = customerData.email?.trim() || customer.email;
          customer.address = customerData.address?.trim() || customer.address;
          customer.gst = customerData.gst?.trim() || customer.gst;
          customer.company = customerData.company?.trim() || customer.company;
          await customer.save();
          console.log(`✅ Customer updated: ${customer._id}`);
        }

        customerDetails = {
          name: customer.name,
          email: customer.email || "",
          mobile: customer.mobile || "",
          address: customer.address || "",
          gst: customer.gst || "",
          company: customer.company || "",
        };
        document.customer = customer._id;
      }

      // Update customerDetails in the document
      document.customerDetails = customerDetails;
    }

    // Update other document fields
    Object.keys(updateData).forEach((key) => {
      if (key !== "customer" && updateData[key] !== undefined) {
        document[key] = updateData[key];
      }
    });

    const updatedDocument = await document.save();

    // Regenerate PDF if content changed
    if (updateData.items || updateData.customer || updateData.customerDetails || updateData.businessDetails) {
      try {
        // Delete old PDF
        if (document.pdfPublicId) {
          await cloudinaryService.deletePDF(document.pdfPublicId);
        }

        // Generate new PDF
        const pdfResult = await pdfService.generateDocumentPDF(updatedDocument);
        updatedDocument.pdfUrl = pdfResult.url;
        updatedDocument.pdfPublicId = pdfResult.publicId;
        await updatedDocument.save();
      } catch (pdfError) {
        console.error("❌ PDF regeneration failed:", pdfError);
      }
    }

    const populatedDocument = await Document.findById(updatedDocument._id)
      .populate("customer", "name email mobile")
      .populate("items.product", "name hsn");

    res.json(populatedDocument);
  } catch (error) {
    console.error("❌ Error updating document:", error);
    res.status(500).json({ message: "Error updating document", error: error.message });
  }
};

// Backward compatibility
const updateInvoice = updateDocument;

// Convert document to another type
const convertDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { documentType: newDocumentType, ...additionalData } = req.body;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const newDocument = await document.convertTo(newDocumentType, additionalData);

    try {
      const pdfResult = await pdfService.generateDocumentPDF(newDocument);
      newDocument.pdfUrl = pdfResult.url;
      newDocument.pdfPublicId = pdfResult.publicId;
      await newDocument.save();
    } catch (pdfError) {
      console.error("❌ PDF generation failed:", pdfError);
    }

    const populatedDocument = await Document.findById(newDocument._id)
      .populate("customer", "name email mobile")
      .populate("items.product", "name hsn")
      .populate("originalDocument", "documentType documentNo");

    res.status(201).json({
      message: `Successfully converted ${document.documentType} to ${newDocumentType}`,
      originalDocument: {
        _id: document._id,
        documentType: document.documentType,
        documentNo: document.documentNo
      },
      newDocument: populatedDocument
    });
  } catch (error) {
    console.error("❌ Error converting document:", error);
    res.status(500).json({
      message: "Error converting document",
      error: error.message
    });
  }
};

// Delete document
const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Delete PDF from Cloudinary
    if (document.pdfPublicId) {
      try {
        await cloudinaryService.deletePDF(document.pdfPublicId);
        console.log("✅ PDF deleted from cloud storage");
      } catch (error) {
        console.error("❌ Failed to delete PDF from cloud:", error);
      }
    }

    // Delete document
    await Document.findByIdAndDelete(id);

    res.json({ message: `${document.documentType} deleted successfully` });
  } catch (error) {
    console.error("❌ Error deleting document:", error);
    res.status(500).json({ message: "Error deleting document" });
  }
};

// Backward compatibility
const deleteInvoice = deleteDocument;

// Download PDF
const downloadDocumentPDF = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (!document.pdfUrl) {
      // Generate PDF on demand
      const pdfResult = await pdfService.generateDocumentPDF(document);
      document.pdfUrl = pdfResult.url;
      document.pdfPublicId = pdfResult.publicId;
      await document.save();
    }

    // Redirect to PDF URL
    res.redirect(document.pdfUrl);
  } catch (error) {
    console.error("❌ Error downloading PDF:", error);
    res.status(500).json({ message: "Error downloading PDF" });
  }
};

// Backward compatibility
const downloadInvoicePDF = downloadDocumentPDF;

// Generate/Regenerate PDF
const generateDocumentPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const { template = "modern" } = req.body;

    const document = await Document.findById(id)
      .populate("customer")
      .populate("items.product");

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Delete existing PDF
    if (document.pdfPublicId) {
      await cloudinaryService.deletePDF(document.pdfPublicId);
    }

    // Generate new PDF
    const pdfResult = await pdfService.generateDocumentPDF(document, template);

    // Update document
    document.pdfUrl = pdfResult.url;
    document.pdfPublicId = pdfResult.publicId;
    if (template !== document.template) {
      document.template = template;
    }
    await document.save();

    res.json({
      message: "PDF generated successfully",
      pdfUrl: pdfResult.url,
      template
    });
  } catch (error) {
    console.error("❌ Error generating PDF:", error);
    res.status(500).json({ message: "Error generating PDF" });
  }
};

// Backward compatibility
const generateInvoicePDF = generateDocumentPDF;

// Update document status
const updateDocumentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const validStatuses = {
      invoice: ["Draft", "Sent", "Viewed", "Partially Paid", "Paid", "Overdue", "Cancelled"],
      proforma: ["Draft", "Sent", "Viewed", "Accepted", "Rejected", "Expired", "Cancelled", "Converted"],
      estimation: ["Draft", "Sent", "Viewed", "Under Review", "Approved", "Rejected", "Expired", "Cancelled", "Converted"]
    };

    const allowedStatuses = validStatuses[document.documentType] || validStatuses.invoice;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status for this document type",
        validStatuses: allowedStatuses
      });
    }

    const updatedDocument = await Document.findByIdAndUpdate(
      id,
      {
        status,
        ...(status === "Sent" && { sentAt: new Date() }),
        ...(status === "Accepted" && { acceptedAt: new Date() })
      },
      { new: true }
    ).populate("customer", "name email");

    res.json({
      message: "Document status updated",
      document: {
        _id: updatedDocument._id,
        documentType: updatedDocument.documentType,
        documentNo: updatedDocument.documentNo,
        status: updatedDocument.status,
        customer: updatedDocument.customer
      }
    });
  } catch (error) {
    console.error("❌ Error updating status:", error);
    res.status(500).json({ message: "Error updating document status" });
  }
};

// Backward compatibility
const updateInvoiceStatus = updateDocumentStatus;

// Add payment to invoice (only applicable to invoices)
const addPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const paymentData = req.body;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (document.documentType !== 'invoice') {
      return res.status(400).json({ message: "Payments can only be added to invoices" });
    }

    await document.addPayment(paymentData);

    res.json({
      message: "Payment added successfully",
      document: {
        _id: document._id,
        documentType: document.documentType,
        documentNo: document.documentNo,
        status: document.status,
        amountPaid: document.amountPaid,
        balanceAmount: document.balanceAmount
      }
    });
  } catch (error) {
    console.error("❌ Error adding payment:", error);
    res.status(500).json({ message: "Error adding payment" });
  }
};

// Get document statistics
const getDocumentStats = async (req, res) => {
  try {
    const { documentType } = req.query;

    const matchFilter = documentType ? { documentType } : {};

    const stats = await Document.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            documentType: "$documentType",
            status: "$status"
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$grandTotal" }
        }
      }
    ]);

    const totalDocuments = await Document.countDocuments(matchFilter);
    const totalRevenue = await Document.aggregate([
      { $match: matchFilter },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } }
    ]);

    const overdue = await Document.countDocuments({
      documentType: "invoice",
      status: { $nin: ["Paid", "Cancelled"] },
      dueDate: { $lt: new Date() },
      ...matchFilter
    });

    const expired = await Document.countDocuments({
      documentType: { $in: ["estimation", "proforma"] },
      status: { $nin: ["Converted", "Accepted", "Rejected", "Cancelled"] },
      validUntil: { $lt: new Date() },
      ...matchFilter
    });

    const groupedStats = {};
    stats.forEach(stat => {
      const docType = stat._id.documentType;
      if (!groupedStats[docType]) {
        groupedStats[docType] = {};
      }
      groupedStats[docType][stat._id.status] = {
        count: stat.count,
        totalAmount: stat.totalAmount
      };
    });

    res.json({
      totalDocuments,
      totalRevenue: totalRevenue[0]?.total || 0,
      overdue,
      expired,
      documentTypeBreakdown: groupedStats,
      statusBreakdown: stats
    });
  } catch (error) {
    console.error("❌ Error fetching stats:", error);
    res.status(500).json({ message: "Error fetching statistics" });
  }
};

// Backward compatibility
const getInvoiceStats = (req, res) => {
  req.query.documentType = 'invoice';
  return getDocumentStats(req, res);
};

// Get conversion history for a document
const getConversionHistory = async (req, res) => {
  try {
    const { id } = req.params;

    // Step 1: Find the requested document and populate related fields
    const document = await Document.findById(id)
      .populate("originalDocument", "documentType documentNo documentDate")
      .populate("convertedTo.documentId", "documentType documentNo documentDate status");

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Step 2: Find the root document of the conversion chain
    let rootDocument = document;
    const conversionChain = [];

    while (rootDocument.originalDocument) {
      rootDocument = await Document.findById(rootDocument.originalDocument._id)
        .populate("originalDocument", "documentType documentNo documentDate")
        .populate("convertedTo.documentId", "documentType documentNo documentDate status");
    }

    // Step 3: Recursively build the full conversion chain
    const buildChain = async (doc) => {
      conversionChain.push({
        _id: doc._id,
        documentType: doc.documentType,
        documentNo: doc.documentNo,
        documentDate: doc.documentDate,
        status: doc.status,
        convertedTo: doc.convertedTo
      });

      for (const conversion of doc.convertedTo) {
        const convertedDoc = await Document.findById(conversion.documentId)
          .populate("convertedTo.documentId", "documentType documentNo documentDate status");
        if (convertedDoc) {
          await buildChain(convertedDoc);
        }
      }
    };

    await buildChain(rootDocument);

    // Step 4: Send the response
    res.json({
      currentDocument: {
        _id: document._id,
        documentType: document.documentType,
        documentNo: document.documentNo
      },
      conversionChain
    });
  } catch (error) {
    console.error("❌ Error fetching conversion history:", error);
    res.status(500).json({ message: "Error fetching conversion history" });
  }
};

export {
  createDocument,
  getDocuments,
  createInvoice,
  createProforma,
  createEstimation,
  getInvoices,
  getProformas,
  getEstimations,
  getDocumentById,
  getInvoiceById,
  updateDocument,
  updateInvoice,
  deleteDocument,
  deleteInvoice,
  downloadDocumentPDF,
  downloadInvoicePDF,
  generateDocumentPDF,
  generateInvoicePDF,
  updateDocumentStatus,
  updateInvoiceStatus,
  addPayment,
  getDocumentStats,
  getInvoiceStats,
  convertDocument,
  getConversionHistory,
};