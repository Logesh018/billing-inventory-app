import express from "express";
import {
  createProduct,
  searchProducts, 
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, authorize("product", "purchase"), getProducts);

// Add the search route BEFORE the /:id route
router.get('/search', protect, searchProducts);

router.post("/", protect, authorize("product", "purchase"), createProduct);
router.get("/:id", protect, authorize("product", "purchase"), getProductById);
router.put("/:id", protect, authorize("product", "purchase"), updateProduct);
router.delete("/:id", protect, authorize("product", "purchase"), deleteProduct);

export default router;