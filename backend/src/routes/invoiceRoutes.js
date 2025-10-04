// // routes/invoiceRoutes.js
// import express from "express";
// import {
//   createInvoice,
//   getInvoices,
//   getInvoiceById,
//   updateInvoice,
//   deleteInvoice,
//   downloadInvoicePDF,
//   generateInvoicePDF,
//   updateInvoiceStatus,
//   addPayment,
//   getInvoiceStats,
// } from "../controllers/invoiceController.js";
// import { protect, authorize } from "../middleware/authMiddleware.js";

// console.log("✅ Invoice routes file loaded!");

// const router = express.Router();

// // Main CRUD routes
// router.post("/", protect, authorize("invoice", "SuperAdmin", "Admin"), createInvoice);
// router.get("/", protect, authorize("invoice", "SuperAdmin", "Admin", "Employee"), getInvoices);
// router.get("/stats", protect, authorize("invoice", "SuperAdmin", "Admin"), getInvoiceStats);
// router.get("/:id", protect, authorize("invoice", "SuperAdmin", "Admin", "Employee"), getInvoiceById);
// router.put("/:id", protect, authorize("invoice", "SuperAdmin", "Admin"), updateInvoice);
// router.delete("/:id", protect, authorize("invoice", "SuperAdmin"), deleteInvoice);

// // PDF operations
// router.get("/:id/download", protect, downloadInvoicePDF);
// router.post("/:id/generate-pdf", protect, authorize("invoice", "SuperAdmin", "Admin"), generateInvoicePDF);

// // Status and payment operations
// router.patch("/:id/status", protect, authorize("invoice", "SuperAdmin", "Admin"), updateInvoiceStatus);
// router.post("/:id/payments", protect, authorize("invoice", "SuperAdmin", "Admin"), addPayment);

// export default router;


// routes/invoiceRoutes.js - Backward compatibility routes
import express from "express";
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  downloadInvoicePDF,
  generateInvoicePDF,
  updateInvoiceStatus,
  addPayment,
  getInvoiceStats,
} from "../controllers/documentController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const invoiceRouter = express.Router();

// Backward compatibility - all invoice-specific routes
invoiceRouter.post("/", protect, authorize("invoice", "SuperAdmin", "Admin"), createInvoice);
invoiceRouter.get("/", protect, authorize("invoice", "SuperAdmin", "Admin", "Employee"), getInvoices);
invoiceRouter.get("/stats", protect, authorize("invoice", "SuperAdmin", "Admin"), getInvoiceStats);
invoiceRouter.get("/:id", protect, authorize("invoice", "SuperAdmin", "Admin", "Employee"), getInvoiceById);
invoiceRouter.put("/:id", protect, authorize("invoice", "SuperAdmin", "Admin"), updateInvoice);
invoiceRouter.delete("/:id", protect, authorize("invoice", "SuperAdmin"), deleteInvoice);

// PDF operations
invoiceRouter.get("/:id/download", protect, downloadInvoicePDF);
invoiceRouter.post("/:id/generate-pdf", protect, authorize("invoice", "SuperAdmin", "Admin"), generateInvoicePDF);

// Status and payment operations
invoiceRouter.patch("/:id/status", protect, authorize("invoice", "SuperAdmin", "Admin"), updateInvoiceStatus);
invoiceRouter.post("/:id/payments", protect, authorize("invoice", "SuperAdmin", "Admin"), addPayment);

export { invoiceRouter };