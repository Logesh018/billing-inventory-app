import express from "express";
import {
  createBuyer,
  getAllBuyers,
  getBuyerById,
  updateBuyer,
  deleteBuyer,
} from "../controllers/buyerController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, authorize("buyer", "SuperAdmin"), createBuyer);
router.get("/", protect, authorize("buyer", "SuperAdmin"), getAllBuyers);
router.get("/:id", protect, authorize("buyer", "SuperAdmin"), getBuyerById);
router.put("/:id", protect, authorize("buyer", "SuperAdmin"), updateBuyer);
router.delete("/:id", protect, authorize("buyer", "SuperAdmin"), deleteBuyer);

export default router;
