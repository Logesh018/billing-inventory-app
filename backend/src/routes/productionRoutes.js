import express from "express";
import {
  createProduction,
  getProductions,
  getProductionById,
  updateProduction,
  deleteProduction,
  completeProduction, 
} from "../controllers/productionController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, authorize("production", "SuperAdmin"), createProduction);
router.get("/", protect, authorize("production", "SuperAdmin"), getProductions);
router.get("/:id", protect, authorize("production", "SuperAdmin"), getProductionById);
router.put("/:id", protect, authorize("production", "SuperAdmin"), updateProduction);
router.patch("/:id/complete", protect, authorize("production", "SuperAdmin"), completeProduction); // ADD THIS ROUTE
router.delete("/:id", protect, authorize("production", "SuperAdmin"), deleteProduction);

export default router;