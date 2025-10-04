// controllers/invoiceController.js
import mongoose from "mongoose";
import Invoice from "../models/invoice.js";
import Buyer from "../models/buyer.js";
import Product from "../models/products.js";
import { pdfService } from "../services/pdfService.js";
import { cloudinaryService } from "../services/cloudinaryService.js";

// Get business configuration (you can create a separate model for this)
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

// Create Invoice
export const createInvoice = async (req, res) => {
  try {
    const { customer: customerData, items, ...invoiceData } = req.body;

    // Handle customer - create if new or find existing
    let customer;
    let customerDetails;

    if (customerData._id) {
      // Existing customer
      customer = await Buyer.findById(customerData._id);
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
    } else {
      // New customer - create
      customer = new Buyer({
        name: customerData.name,
        email: customerData.email,
        mobile: customerData.mobile,
        address: customerData.address,
        gst: customerData.gst,
        company: customerData.company,
      });

      const savedCustomer = await customer.save();
      console.log("✅ New customer created:", savedCustomer._id);

      customerDetails = {
        name: savedCustomer.name,
        email: savedCustomer.email || "",
        mobile: savedCustomer.mobile || "",
        address: savedCustomer.address || "",
        gst: savedCustomer.gst || "",
        company: savedCustomer.company || "",
      };
    }

    // Process items and handle products
    const processedItems = [];
    for (const item of items) {
      let product;

      if (item.product?._id) {
        // Existing product
        product = await Product.findById(item.product._id);
        if (!product) {
          return res.status(400).json({
            message: `Product not found: ${item.productDetails?.name}`
          });
        }
      } else if (item.productDetails?.name) {
        // Create new product if needed
        product = new Product({
          name: item.productDetails.name,
          hsn: item.productDetails.hsn || "",
          description: item.productDetails.description || "",
        });

        const savedProduct = await product.save();
        console.log("✅ New product created:", savedProduct._id);
        product = savedProduct;
      }

      processedItems.push({
        product: product?._id,
        productDetails: {
          name: item.productDetails.name,
          description: item.productDetails.description || "",
          hsn: item.productDetails.hsn || product?.hsn || "",
        },
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        discountType: item.discountType || "percentage",
        taxRate: item.taxRate || 18,
      });
    }

    // Generate invoice number if not provided
    const invoiceNo = invoiceData.invoiceNo || await Invoice.generateInvoiceNumber();

    // Create invoice
    const invoice = new Invoice({
      invoiceNo,
      invoiceDate: invoiceData.invoiceDate || new Date(),
      dueDate: invoiceData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
      customer: customer._id,
      customerDetails,
      items: processedItems,
      businessDetails: getBusinessConfig(),
      paymentTerms: invoiceData.paymentTerms || "Net 30",
      notes: invoiceData.notes || "",
      template: invoiceData.template || "modern",
      customization: invoiceData.customization || {},
      createdBy: req.user?.id, // Assuming you have user authentication
    });

    const savedInvoice = await invoice.save();
    console.log("✅ Invoice created:", savedInvoice._id);

    // Generate PDF
    try {
      const pdfResult = await pdfService.generateInvoicePDF(savedInvoice);

      // Update invoice with PDF URL
      savedInvoice.pdfUrl = pdfResult.url;
      savedInvoice.pdfPublicId = pdfResult.publicId;
      await savedInvoice.save();

      console.log("✅ PDF generated and uploaded:", pdfResult.url);
    } catch (pdfError) {
      console.error("❌ PDF generation failed:", pdfError);
      // Invoice is still saved, just without PDF
    }

    // Populate and return
    const populatedInvoice = await Invoice.findById(savedInvoice._id)
      .populate("customer", "name email mobile")
      .populate("items.product", "name hsn");

    res.status(201).json(populatedInvoice);
  } catch (error) {
    console.error("❌ Error creating invoice:", error.message);
    res.status(500).json({
      message: "Error creating invoice",
      error: error.message
    });
  }
};

// Get all invoices
export const getInvoices = async (req, res) => {
  try {
    const {
      status,
      customer,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    const filter = {};

    // Apply filters
    if (status) filter.status = status;
    if (customer) filter.customer = customer;

    if (startDate || endDate) {
      filter.invoiceDate = {};
      if (startDate) filter.invoiceDate.$gte = new Date(startDate);
      if (endDate) filter.invoiceDate.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const invoices = await Invoice.find(filter)
      .populate("customer", "name email mobile company")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Invoice.countDocuments(filter);

    res.json({
      invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("❌ Error fetching invoices:", error);
    res.status(500).json({ message: "Error fetching invoices" });
  }
};

// Get single invoice
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("customer")
      .populate("items.product");

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Track view
    if (!invoice.viewedAt) {
      invoice.viewedAt = new Date();
      if (invoice.status === "Sent") {
        invoice.status = "Viewed";
      }
      await invoice.save();
    }

    res.json(invoice);
  } catch (error) {
    console.error("❌ Error fetching invoice:", error);
    res.status(500).json({ message: "Error fetching invoice" });
  }
};

// Update invoice
export const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { customer, customerDetails, ...otherInvoiceData } = req.body;

    // Log the request body for debugging
    console.log('Request body:', req.body);

    // Step 1: Find the invoice
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Step 2: Handle the customer reference
    let customerId = null;
    if (customer) {
      if (mongoose.Types.ObjectId.isValid(customer)) {
        // If customer is a valid ObjectId, verify it exists
        const buyer = await Buyer.findById(customer);
        if (!buyer) {
          return res.status(400).json({ message: 'Buyer not found' });
        }
        customerId = customer;
      } else if (typeof customer === 'object' && customer.email) {
        // If customer is an object, find or create a Buyer
        let buyer = await Buyer.findOne({ email: customer.email });
        if (!buyer) {
          buyer = new Buyer({
            name: customer.name,
            email: customer.email,
            mobile: customer.mobile,
            address: customer.address,
            gst: customer.gst,
            company: customer.company,
          });
          await buyer.save();
        }
        customerId = buyer._id;
      } else {
        return res.status(400).json({ message: 'Invalid customer data' });
      }
    }

    // Step 3: Prepare update data
    const updateData = {
      ...otherInvoiceData,
      customer: customerId, // Set customer to Buyer _id (or null if not required)
      customerDetails: customerDetails || (customer && typeof customer === 'object' ? {
        name: customer.name,
        email: customer.email,
        mobile: customer.mobile,
        address: customer.address,
        gst: customer.gst,
        company: customer.company,
      } : invoice.customerDetails), // Preserve existing customerDetails if not updated
    };

    // Step 4: Update invoice fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        invoice[key] = updateData[key];
      }
    });

    // Step 5: Save the updated invoice
    const updatedInvoice = await invoice.save();

    // Step 6: Regenerate PDF if content changed
    if (updateData.items || updateData.customerDetails || updateData.businessDetails) {
      try {
        // Delete old PDF
        if (invoice.pdfPublicId) {
          await cloudinaryService.deletePDF(invoice.pdfPublicId);
        }

        // Generate new PDF
        const pdfResult = await pdfService.generateInvoicePDF(updatedInvoice);
        updatedInvoice.pdfUrl = pdfResult.url;
        updatedInvoice.pdfPublicId = pdfResult.publicId;
        await updatedInvoice.save();
      } catch (pdfError) {
        console.error('❌ PDF regeneration failed:', pdfError);
      }
    }

    // Step 7: Populate and return the updated invoice
    const populatedInvoice = await Invoice.findById(updatedInvoice._id)
      .populate('customer', 'name email mobile')
      .populate('items.product', 'name hsn');

    res.json(populatedInvoice);
  } catch (error) {
    console.error('❌ Error updating invoice:', error);
    res.status(500).json({ message: 'Error updating invoice', error: error.message });
  }
};

// Delete invoice
export const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Delete PDF from Cloudinary
    if (invoice.pdfPublicId) {
      try {
        await cloudinaryService.deletePDF(invoice.pdfPublicId);
        console.log("✅ PDF deleted from cloud storage");
      } catch (error) {
        console.error("❌ Failed to delete PDF from cloud:", error);
      }
    }

    // Delete invoice
    await Invoice.findByIdAndDelete(id);

    res.json({ message: "Invoice deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting invoice:", error);
    res.status(500).json({ message: "Error deleting invoice" });
  }
};

// Download PDF
export const downloadInvoicePDF = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (!invoice.pdfUrl) {
      // Generate PDF on demand
      const pdfResult = await pdfService.generateInvoicePDF(invoice);
      invoice.pdfUrl = pdfResult.url;
      invoice.pdfPublicId = pdfResult.publicId;
      await invoice.save();
    }

    // Redirect to PDF URL or serve the PDF
    res.redirect(invoice.pdfUrl);
  } catch (error) {
    console.error("❌ Error downloading PDF:", error);
    res.status(500).json({ message: "Error downloading PDF" });
  }
};

// Generate/Regenerate PDF
export const generateInvoicePDF = async (req, res) => {
  try {
    const { id } = req.params;
    const { template = "modern" } = req.body;

    const invoice = await Invoice.findById(id)
      .populate("customer")
      .populate("items.product");

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Delete existing PDF
    if (invoice.pdfPublicId) {
      await cloudinaryService.deletePDF(invoice.pdfPublicId);
    }

    // Generate new PDF
    const pdfResult = await pdfService.generateInvoicePDF(invoice, template);

    // Update invoice
    invoice.pdfUrl = pdfResult.url;
    invoice.pdfPublicId = pdfResult.publicId;
    if (template !== invoice.template) {
      invoice.template = template;
    }
    await invoice.save();

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

// Update invoice status
export const updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "Draft", "Sent", "Viewed", "Partially Paid",
      "Paid", "Overdue", "Cancelled"
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
        validStatuses
      });
    }

    const invoice = await Invoice.findByIdAndUpdate(
      id,
      {
        status,
        ...(status === "Sent" && { sentAt: new Date() })
      },
      { new: true }
    ).populate("customer", "name email");

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.json({
      message: "Invoice status updated",
      invoice: {
        _id: invoice._id,
        invoiceNo: invoice.invoiceNo,
        status: invoice.status,
        customer: invoice.customer
      }
    });
  } catch (error) {
    console.error("❌ Error updating status:", error);
    res.status(500).json({ message: "Error updating invoice status" });
  }
};

// Add payment to invoice
export const addPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const paymentData = req.body;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    await invoice.addPayment(paymentData);

    res.json({
      message: "Payment added successfully",
      invoice: {
        _id: invoice._id,
        invoiceNo: invoice.invoiceNo,
        status: invoice.status,
        amountPaid: invoice.amountPaid,
        balanceAmount: invoice.balanceAmount
      }
    });
  } catch (error) {
    console.error("❌ Error adding payment:", error);
    res.status(500).json({ message: "Error adding payment" });
  }
};

// Get invoice statistics
export const getInvoiceStats = async (req, res) => {
  try {
    const stats = await Invoice.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$grandTotal" }
        }
      }
    ]);

    const totalInvoices = await Invoice.countDocuments();
    const totalRevenue = await Invoice.aggregate([
      { $group: { _id: null, total: { $sum: "$grandTotal" } } }
    ]);

    const overdue = await Invoice.countDocuments({
      status: { $nin: ["Paid", "Cancelled"] },
      dueDate: { $lt: new Date() }
    });

    res.json({
      totalInvoices,
      totalRevenue: totalRevenue[0]?.total || 0,
      overdue,
      statusBreakdown: stats
    });
  } catch (error) {
    console.error("❌ Error fetching stats:", error);
    res.status(500).json({ message: "Error fetching statistics" });
  }
};