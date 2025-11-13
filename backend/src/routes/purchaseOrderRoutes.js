// src/routes/purchaseOrderRoutes.js
import express from "express";
import {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
  deletePurchaseOrder,
  searchSuppliersForPO,
  generatePurchaseOrderPDF,  
  downloadPurchaseOrderPDF
} from "../controllers/purchaseOrderController.js";
const router = express.Router();

// Create new Purchase Order
router.post("/", createPurchaseOrder);

// Get all Purchase Orders
router.get("/", getPurchaseOrders);

// Get Purchase Order by ID
router.get("/:id", getPurchaseOrderById);

// Update Purchase Order
router.put("/:id", updatePurchaseOrder);

// Delete Purchase Order
router.delete("/:id", deletePurchaseOrder);

// Generate PDF for Purchase Order (returns URL)
router.post("/:id/generate-pdf", generatePurchaseOrderPDF);

// Download PDF for Purchase Order (returns buffer)
router.get("/:id/download-pdf", downloadPurchaseOrderPDF);

// Search suppliers (autocomplete)
router.get("/search/suppliers", searchSuppliersForPO);


export default router;
