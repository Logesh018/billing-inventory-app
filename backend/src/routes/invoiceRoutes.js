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