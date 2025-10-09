import express from "express";
import {
  createPurchase,
  completePurchase,
  getPurchases,
  getPurchaseById,
  updatePurchase,
  deletePurchase,
  searchSuppliers, // ADD THIS IMPORT
} from "../controllers/purchaseController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Search route (for autocomplete dropdown) - ADD THIS
router.get("/search/suppliers", protect, searchSuppliers);

// Main CRUD routes
router.post("/", protect, authorize("purchase", "orders", "SuperAdmin"), createPurchase);
router.get("/", protect, authorize("purchase", "SuperAdmin"), getPurchases);
router.get("/:id", protect, authorize("purchase", "SuperAdmin"), getPurchaseById);
router.put("/:id", protect, authorize("purchase", "SuperAdmin"), updatePurchase);
router.patch("/:id/complete", protect, authorize("purchase", "SuperAdmin"), completePurchase);
router.delete("/:id", protect, authorize("purchase", "SuperAdmin"), deletePurchase);

export default router;