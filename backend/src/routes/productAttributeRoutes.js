import express from "express";
import {
  getAttributesByType,
  searchAttributes,
  addAttribute,
  updateAttribute,
  deleteAttribute,
  incrementAttributeUsage,
  getAttributesSummary
} from "../controllers/productAttributeController.js";

const router = express.Router();

/**
 * @route   GET /api/product-attributes/summary
 * @desc    Get summary of all attribute types with counts
 * @access  Public
 */
router.get("/summary", getAttributesSummary);

/**
 * @route   GET /api/product-attributes/search
 * @desc    Search attributes by type and search term
 * @query   type (category|list|type|style|fabric), q (search term)
 * @access  Public
 * @example /api/product-attributes/search?type=fabric&q=air
 */
router.get("/search", searchAttributes);

/**
 * @route   GET /api/product-attributes
 * @desc    Get all attributes by type
 * @query   type (category|list|type|style|fabric)
 * @access  Public
 * @example /api/product-attributes?type=category
 */
router.get("/", getAttributesByType);

/**
 * @route   POST /api/product-attributes
 * @desc    Add a new attribute value (user's "Others" functionality)
 * @body    { attributeType: "fabric", value: "Airtex" }
 * @access  Public (or add authentication middleware if needed)
 */
router.post("/", addAttribute);

/**
 * @route   PUT /api/product-attributes/:id
 * @desc    Update an attribute (mainly for deactivating)
 * @body    { isActive: false } or { value: "New Value" }
 * @access  Public (or add authentication/authorization)
 */
router.put("/:id", updateAttribute);

/**
 * @route   DELETE /api/product-attributes/:id
 * @desc    Delete an attribute (only user-added, not system)
 * @access  Public (or add admin authentication)
 */
router.delete("/:id", deleteAttribute);

/**
 * @route   POST /api/product-attributes/:id/increment-usage
 * @desc    Increment usage count for tracking
 * @access  Public
 */
router.post("/:id/increment-usage", incrementAttributeUsage);

export default router;