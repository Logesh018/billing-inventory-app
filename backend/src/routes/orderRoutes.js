import express from "express";
import Order from "../models/orders.js";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  getOrdersByBuyer,
  searchBuyers,
  searchProducts,
  getCurrentFinancialYear,
  generateOrderPDF,
  downloadOrderPDF 
} from "../controllers/orderController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

console.log("✅ Order routes file loaded!");

const router = express.Router();

// Search routes (for autocomplete dropdowns)
router.get("/search/buyers", protect, searchBuyers);
router.get("/search/products", protect, searchProducts);

// GET /api/orders/next-po-no
router.get('/next-po-no', async (req, res) => {
  try {
    const financialYear = getCurrentFinancialYear();
    const lastOrder = await Order.findOne().sort({ createdAt: -1 });
    let nextNumber = 1;
    if (lastOrder?.PoNo) {
      const match = lastOrder.PoNo.match(/PO\/(\d{4})\/(\d+)$/);
      if (match && match[1] === financialYear) {
        nextNumber = parseInt(match[2], 10) + 1;
      }
    }
    const nextPoNo = `PO/${financialYear}/${String(nextNumber).padStart(4, '0')}`;
    res.json({ nextPoNo });
  } catch (error) {
    console.error("Error fetching next PO No:", error);
    res.status(500).json({ message: "Failed to generate next PO number" });
  }
});

// Main CRUD routes
router.post("/", protect, authorize("order", "SuperAdmin"), createOrder);
router.get("/", protect, authorize("order", "SuperAdmin", "Admin"), getOrders);
router.get("/buyer/:buyerId", protect, authorize("order", "SuperAdmin", "Admin"), getOrdersByBuyer);
router.get("/:id", protect, authorize("order", "SuperAdmin", "Admin", "Employee"), getOrderById);
router.put("/:id", protect, authorize("order", "SuperAdmin", "Admin"), updateOrder);
router.patch("/:id/status", protect, authorize("order", "SuperAdmin", "Admin"), updateOrderStatus);
router.delete("/:id", protect, authorize("order", "SuperAdmin"), deleteOrder);

// PDF operations
router.get("/:id/download-pdf", protect, authorize("order", "SuperAdmin", "Admin", "Employee"), downloadOrderPDF);
router.post("/:id/generate-pdf", protect, authorize("order", "SuperAdmin", "Admin"), generateOrderPDF);

export default router;