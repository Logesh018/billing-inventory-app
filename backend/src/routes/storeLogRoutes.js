// routes/storeLogRoutes.js
import express from "express";
import {
  createStoreLog,
  getStoreLogs,
  getStoreLogById,
  getStoreLogsByStoreEntry,
  getAvailableStock,
  updateStoreLog,
  deleteStoreLog
} from "../controllers/storeLogController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes (with auth)
router.get("/", protect, getStoreLogs);
router.get("/store-entry/:storeEntryId", protect, getStoreLogsByStoreEntry);
router.get("/available-stock/:storeEntryId", protect, getAvailableStock);
router.get("/:id", protect, getStoreLogById);

// Admin/SuperAdmin routes
router.post("/", protect, authorize("Admin", "SuperAdmin"), createStoreLog);
router.put("/:id", protect, authorize("Admin", "SuperAdmin"), updateStoreLog);
router.delete("/:id", protect, authorize("Admin", "SuperAdmin"), deleteStoreLog);

export default router;