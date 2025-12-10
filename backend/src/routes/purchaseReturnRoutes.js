// routes/purchaseReturnRoutes.js
import express from "express";
import {
  getPurchaseForReturn,
  createPurchaseReturn,
  getPurchaseReturns,
  getPurchaseReturnById,
  // updatePurchaseReturnStatus,
  deletePurchaseReturn,
  getNextPURTNo
} from "../controllers/purchaseReturnController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route   GET /api/purchase-returns/next-purt-no
 * @desc    Get next available PURTNo (preview)
 * @access  Private
 */
router.get("/next-purt-no", protect, getNextPURTNo);

/**
 * @route   GET /api/purchase-returns/purchase/:PURNo
 * @desc    Get purchase details by PURNo for return form
 * @access  Private
 * 
 * Returns purchase data needed to create a return
 */
router.get("/purchase/:PURNo", protect, authorize("purchase", "SuperAdmin"), getPurchaseForReturn);

/**
 * @route   POST /api/purchase-returns
 * @desc    Create a new purchase return
 * @access  Private
 * 
 * Body example:
 * {
 *   "PURNo": "PUR-7",
 *   "returnDate": "2025-12-02",
 *   "returnItems": [
 *     {
 *       "itemName": "Mars",
 *       "originalQuantity": 400,
 *       "returnQuantity": 50,
 *       "originalCostPerUnit": 200,
 *       "returnReason": "damaged-goods",
 *       "purchaseUnit": "kg"
 *     }
 *   ],
 *   "remarks": "Fabric had defects",
 *   "generateDebitNote": true
 * }
 */
router.post("/", protect, authorize("purchase", "SuperAdmin"), createPurchaseReturn);

/**
 * @route   GET /api/purchase-returns
 * @desc    Get all purchase returns with optional filters
 * @access  Private
 * 
 * Query params:
 * - status (Pending/Approved/Rejected/Completed)
 * - PURNo
 * - PoNo
 */
router.get("/", protect, authorize("purchase", "SuperAdmin"), getPurchaseReturns);

/**
 * @route   GET /api/purchase-returns/:id
 * @desc    Get single purchase return by ID
 * @access  Private
 */
router.get("/:id", protect, authorize("purchase", "SuperAdmin"), getPurchaseReturnById);

/**
 * @route   PATCH /api/purchase-returns/:id/status
 * @desc    Update purchase return status
 * @access  Private
 * 
 * Body: { "status": "Approved" | "Rejected" | "Completed" }
 */
// router.patch("/:id/status", protect, authorize("purchase", "SuperAdmin"), updatePurchaseReturnStatus);

/**
 * @route   DELETE /api/purchase-returns/:id
 * @desc    Delete a purchase return
 * @access  Private
 */
router.delete("/:id", protect, authorize("purchase", "SuperAdmin"), deletePurchaseReturn);

export default router;