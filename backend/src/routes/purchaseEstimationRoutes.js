// routes/purchaseEstimationRoutes.js
import express from "express";
import {
  createPurchaseEstimation,
  getPurchaseEstimations,
  getPurchaseEstimationById,
  updatePurchaseEstimation,
  deletePurchaseEstimation,
  generateEstimationPDF,
  getEstimationPDF,  
  searchSuppliers,
  searchOrders,
  getOrderByPoNo
} from "../controllers/purchaseEstimationController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Search route (for autocomplete dropdown)
router.get("/search/suppliers", protect, searchSuppliers);

// Add this route for searching orders
router.get("/search/orders", protect, searchOrders);
router.get("/order/:PoNo", protect, getOrderByPoNo);

// PDF routes - GET existing, POST to generate new
router.get("/:id/pdf", protect, authorize("purchase", "SuperAdmin"), getEstimationPDF); 
router.post("/:id/generate-pdf", protect, authorize("purchase", "SuperAdmin"), generateEstimationPDF);

// Main CRUD routes
router.post("/", protect, authorize("purchase", "SuperAdmin"), createPurchaseEstimation);
router.get("/", protect, authorize("purchase", "SuperAdmin"), getPurchaseEstimations);
router.get("/:id", protect, authorize("purchase", "SuperAdmin"), getPurchaseEstimationById);
router.put("/:id", protect, authorize("purchase", "SuperAdmin"), updatePurchaseEstimation);
router.delete("/:id", protect, authorize("purchase", "SuperAdmin"), deletePurchaseEstimation);

export default router;