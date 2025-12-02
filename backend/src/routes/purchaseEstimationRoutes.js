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
  getOrderByPoNo,
  getNextPESNo,
  resetPESCounter
} from "../controllers/purchaseEstimationController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// ⚠️ IMPORTANT: Specific routes MUST come BEFORE parameterized routes like /:id

// Search routes (for autocomplete dropdown)
router.get("/search/suppliers", protect, searchSuppliers);
router.get("/search/orders", protect, searchOrders);

// Order details route
router.get("/order/:PoNo", protect, getOrderByPoNo);

// Next PES Number route - MUST be before /:id route
router.get("/next-pes-no", protect, authorize("purchase", "SuperAdmin"), getNextPESNo);

// PDF routes - MUST be before /:id route
router.get("/:id/pdf", protect, authorize("purchase", "SuperAdmin"), getEstimationPDF); 
router.post("/:id/generate-pdf", protect, authorize("purchase", "SuperAdmin"), generateEstimationPDF);

// Main CRUD routes
router.post("/", protect, authorize("purchase", "SuperAdmin"), createPurchaseEstimation);
router.get("/", protect, authorize("purchase", "SuperAdmin"), getPurchaseEstimations);

// ⚠️ Parameterized routes like /:id should come LAST
router.get("/:id", protect, authorize("purchase", "SuperAdmin"), getPurchaseEstimationById);
router.put("/:id", protect, authorize("purchase", "SuperAdmin"), updatePurchaseEstimation);
router.delete("/:id", protect, authorize("purchase", "SuperAdmin"), deletePurchaseEstimation);
router.post("/reset-counter", protect, authorize("SuperAdmin"), resetPESCounter);

export default router;