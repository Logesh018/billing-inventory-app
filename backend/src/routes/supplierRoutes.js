import express from "express";
import {
  createSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} from "../controllers/supplierController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, authorize("supplier", "SuperAdmin"), createSupplier);
router.get("/", protect, authorize("supplier", "SuperAdmin"), getAllSuppliers);
router.get("/:id", protect, authorize("supplier", "SuperAdmin"), getSupplierById);
router.put("/:id", protect, authorize("supplier", "SuperAdmin"), updateSupplier);
router.delete("/:id", protect, authorize("supplier", "SuperAdmin"), deleteSupplier);

export default router;