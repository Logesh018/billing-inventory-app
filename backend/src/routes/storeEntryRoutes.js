// routes/storeEntryRoutes.js
import express from "express";
import {
  createStoreEntry,
  getStoreEntries,
  getStoreEntryById,
  getStoreEntryByPurchaseId,
  updateStoreEntry,
  deleteStoreEntry,
  checkStoreEntryExists,
  getPendingPurchasesForStoreEntry
} from "../controllers/storeEntryController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes (with auth)
router.get("/", protect, getStoreEntries);
router.get("/pending-purchases", protect, getPendingPurchasesForStoreEntry); // NEW
router.get("/check/:purchaseId", protect, checkStoreEntryExists);
router.get("/purchase/:purchaseId", protect, getStoreEntryByPurchaseId);
router.get("/:id", protect, getStoreEntryById);

// Admin/SuperAdmin routes
router.post("/", protect, authorize("Admin", "SuperAdmin"), createStoreEntry);
router.put("/:id", protect, authorize("Admin", "SuperAdmin"), updateStoreEntry);
router.delete("/:id", protect, authorize("Admin", "SuperAdmin"), deleteStoreEntry);

export default router;