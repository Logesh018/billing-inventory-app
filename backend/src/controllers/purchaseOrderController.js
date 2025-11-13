// src/controllers/purchaseOrderController.js
import PurchaseOrder from "../models/purchaseOrder.js";
import supplier from "../models/supplier.js";
import { pdfService } from "../services/pdfService.js";

// Create a new Purchase Order
export const createPurchaseOrder = async (req, res) => {
  try {
    const purchaseOrder = new PurchaseOrder(req.body);
    await purchaseOrder.save();
    res.status(201).json({
      success: true,
      message: "Purchase Order created successfully",
      data: purchaseOrder,
    });
  } catch (error) {
    console.error("Error creating Purchase Order:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get all Purchase Orders
export const getPurchaseOrders = async (req, res) => {
  try {
    const orders = await PurchaseOrder.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get Purchase Order by ID
export const getPurchaseOrderById = async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Purchase Order not found" });
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Update Purchase Order
export const updatePurchaseOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Purchase Order not found" });
    res.status(200).json({
      success: true,
      message: "Purchase Order updated successfully",
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Delete Purchase Order
export const deletePurchaseOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findByIdAndDelete(req.params.id);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Purchase Order not found" });
    res
      .status(200)
      .json({ success: true, message: "Purchase Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Search suppliers for Purchase Orders (autocomplete)
// @route   GET /api/purchase-orders/search/suppliers?q=...
export const searchSuppliersForPO = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(200).json([]);
    }

    // Use a case-insensitive search on name or company
    const regex = new RegExp(q.trim(), "i");

    const suppliers = await supplier.find(
      {
        isActive: true,
        $or: [{ name: regex }, { company: regex }],
      },
      "name code address gst mobile email"
    ).limit(10);

    console.log(`🔍 Found ${suppliers.length} suppliers for "${q}"`);
    console.log("Suppliers returned to frontend:", suppliers);

    res.status(200).json(suppliers);
  } catch (error) {
    console.error("❌ Error searching suppliers for Purchase Orders:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const generatePurchaseOrderPDF = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: "Purchase Order not found"
      });
    }

    console.log(`📄 Generating PDF for Purchase Order: ${purchaseOrder.poNumber}`);

    const pdfResult = await pdfService.generatePurchaseOrderPDF(purchaseOrder);

    // Update the purchase order with PDF URL
    purchaseOrder.pdfUrl = pdfResult.url;
    await purchaseOrder.save();

    res.status(200).json({
      success: true,
      message: "PDF generated successfully",
      data: {
        pdfUrl: pdfResult.url,
        publicId: pdfResult.publicId,
      },
    });
  } catch (error) {
    console.error("❌ Error generating Purchase Order PDF:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate PDF",
      error: error.message
    });
  }
};

// Download PDF for Purchase Order (returns buffer)
export const downloadPurchaseOrderPDF = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: "Purchase Order not found"
      });
    }

    console.log(`📥 Downloading PDF for Purchase Order: ${purchaseOrder.poNumber}`);

    const pdfResult = await pdfService.generatePurchaseOrderPDF(purchaseOrder);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="PO-${purchaseOrder.poNumber}.pdf"`);
    res.send(pdfResult.buffer);
  } catch (error) {
    console.error("❌ Error downloading Purchase Order PDF:", error);
    res.status(500).json({
      success: false,
      message: "Failed to download PDF",
      error: error.message
    });
  }
};