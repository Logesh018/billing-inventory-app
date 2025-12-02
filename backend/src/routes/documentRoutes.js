// routes/documentRoutes.js - Updated version
import express from "express";
import {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  downloadDocumentPDF,
  generateDocumentPDF,
  updateDocumentStatus,
  addPayment,
  getDocumentStats,
  convertDocument, 
  getConversionHistory, 
} from "../controllers/documentController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Generic document routes (handles all document types)
router.post("/", protect, authorize("document", "SuperAdmin", "Admin"), createDocument);
router.get("/", protect, authorize("document", "SuperAdmin", "Admin", "Employee"), getDocuments);
router.get("/stats", protect, authorize("document", "SuperAdmin", "Admin"), getDocumentStats);
router.get("/:id", protect, authorize("document", "SuperAdmin", "Admin", "Employee"), getDocumentById);
router.put("/:id", protect, authorize("document", "SuperAdmin", "Admin"), updateDocument);
router.delete("/:id", protect, authorize("document", "SuperAdmin"), deleteDocument);

// PDF operations
router.get("/:id/download", protect, downloadDocumentPDF);
router.post("/:id/generate-pdf", protect, authorize("document", "SuperAdmin", "Admin"), generateDocumentPDF);

// Status and payment operations
router.patch("/:id/status", protect, authorize("document", "SuperAdmin", "Admin"), updateDocumentStatus);
router.post("/:id/payments", protect, authorize("document", "SuperAdmin", "Admin"), addPayment);

// Document conversion - ✅ Use the imported function instead of inline code
router.post("/:id/convert", protect, authorize("document", "SuperAdmin", "Admin"), convertDocument);

// Conversion history
router.get("/:id/history", protect, authorize("document", "SuperAdmin", "Admin"), getConversionHistory);

export default router;