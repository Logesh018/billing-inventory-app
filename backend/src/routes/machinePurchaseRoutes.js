import express from "express";
import {
  createMachinePurchase,
  getAllMachinePurchases,
  getMachinePurchaseById,
  updateMachinePurchase,
  deleteMachinePurchase,
} from "../controllers/machinePurchaseController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();
// CREATE a new machine purchase
router.post("/", protect, authorize("purchase", "SuperAdmin"), createMachinePurchase);

// READ all machine purchases (paginated)
router.get("/", protect, authorize("purchase", "SuperAdmin"), getAllMachinePurchases);

// READ single machine purchase by ID
router.get("/:id", protect, authorize("purchase", "SuperAdmin"), getMachinePurchaseById);

// UPDATE a machine purchase
router.put("/:id", protect, authorize("purchase", "SuperAdmin"), updateMachinePurchase);

// DELETE a machine purchase
router.delete("/:id", protect, authorize("purchase", "SuperAdmin"), deleteMachinePurchase);

export default router;
