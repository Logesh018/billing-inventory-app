// controllers/storeEntryController.js
import mongoose from "mongoose";
import StoreEntry from "../models/storeEntry.js";
import Purchase from "../models/purchase.js";
import Order from "../models/orders.js";

/**
 * @desc    Create a new Store Entry from a Purchase
 * @route   POST /api/store-entries
 * @access  Private (Admin/SuperAdmin)
 */
export const createStoreEntry = async (req, res) => {
  try {
    const { purchaseId, storeEntryDate, entries, remarks } = req.body;

    console.log("📦 Creating Store Entry for Purchase:", purchaseId);

    // Validation
    if (!purchaseId || !storeEntryDate || !entries || entries.length === 0) {
      return res.status(400).json({
        message: "purchaseId, storeEntryDate, and entries are required"
      });
    }

    // Find purchase
    const purchase = await Purchase.findById(purchaseId).populate("order");
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    // Check if purchase is completed
    if (purchase.status !== "Completed") {
      return res.status(400).json({
        message: "Cannot create Store Entry. Purchase is not completed yet.",
        purchaseStatus: purchase.status
      });
    }

    // Check if Store Entry already exists for this purchase
    const existingEntry = await StoreEntry.findOne({ purchase: purchaseId });
    if (existingEntry) {
      return res.status(400).json({
        message: "Store Entry already exists for this purchase",
        existingStoreId: existingEntry.storeId,
        existingEntryId: existingEntry._id
      });
    }

    // Validate entries - at least one item must have storeInQty > 0
    const hasValidEntry = entries.some(e => (e.storeInQty || 0) > 0);
    if (!hasValidEntry) {
      return res.status(400).json({
        message: "At least one item must have Store In Qty greater than 0"
      });
    }

    // Get order details
    const order = purchase.order || await Order.findById(purchase.order);
    if (!order) {
      return res.status(404).json({ message: "Associated order not found" });
    }

    // Create Store Entry
    const newStoreEntry = new StoreEntry({
      purchase: purchase._id,
      order: order._id,
      purchaseEstimation: purchase.purchaseEstimation || null,

      // Order info
      orderId: order.orderId,
      orderDate: order.orderDate,
      PoNo: order.PoNo,
      orderType: order.orderType,
      buyerCode: order.buyerDetails?.code || "N/A",

      // Purchase info
      PURNo: purchase.PURNo,
      purchaseDate: purchase.purchaseDate,
      PESNo: purchase.PESNo || "N/A",
      estimationDate: purchase.estimationDate || null,

      // Store Entry data
      storeEntryDate: new Date(storeEntryDate),
      entries: entries.map(e => ({
        itemType: e.itemType,
        itemName: e.itemName,
        supplierId: e.supplierId || null,
        supplierName: e.supplierName,
        supplierCode: e.supplierCode || "",
        invoiceNo: e.invoiceNo || "",
        invoiceDate: e.invoiceDate ? new Date(e.invoiceDate) : null,
        hsn: e.hsn || "",
        unit: e.unit,
        purchaseQty: e.purchaseQty || 0,
        invoiceQty: parseFloat(e.invoiceQty) || 0,
        storeInQty: parseFloat(e.storeInQty) || 0,
        remarks: e.remarks || ""
      })),

      remarks: remarks || "",
      status: "Completed"
    });

    const savedStoreEntry = await newStoreEntry.save();
    console.log("✅ Store Entry created:", savedStoreEntry.storeId);

    // Update Purchase with store entry reference
    await Purchase.findByIdAndUpdate(purchase._id, {
      storeEntry: savedStoreEntry._id
    });

    // 🆕 AUTO-CREATE INITIAL STORE LOG (only if status is Completed)
    if (savedStoreEntry.status === "Completed") {
      try {
        const { createInitialStoreLog } = await import("./storeLogController.js");
        const initialLog = await createInitialStoreLog(savedStoreEntry._id);
        console.log("✅ Initial store log created:", initialLog.logId);
      } catch (logErr) {
        console.error("⚠️ Failed to create initial store log:", logErr);
        // Don't fail the store entry creation if log creation fails
      }
    }

    res.status(201).json({
      message: "Store Entry created successfully",
      storeEntry: savedStoreEntry
    });

  } catch (err) {
    console.error("❌ Error in createStoreEntry:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * @desc    Get all Store Entries
 * @route   GET /api/store-entries
 * @access  Private
 */
export const getStoreEntries = async (req, res) => {
  try {
    const { status, orderId, purchaseId } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (orderId) filter.orderId = orderId;
    if (purchaseId) filter.purchase = purchaseId;

    const storeEntries = await StoreEntry.find(filter)
      .populate("purchase", "PURNo purchaseDate status")
      .populate("order", "orderId PoNo orderType buyerDetails")
      .populate("entries.supplierId", "name code")
      .sort({ createdAt: -1 });

    res.json(storeEntries);
  } catch (err) {
    console.error("❌ Error in getStoreEntries:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * @desc    Get single Store Entry by ID
 * @route   GET /api/store-entries/:id
 * @access  Private
 */
export const getStoreEntryById = async (req, res) => {
  try {
    const storeEntry = await StoreEntry.findById(req.params.id)
      .populate("purchase", "PURNo purchaseDate status")
      .populate("order", "orderId PoNo orderType buyerDetails products")
      .populate("entries.supplierId", "name code");

    if (!storeEntry) {
      return res.status(404).json({ message: "Store Entry not found" });
    }

    res.json(storeEntry);
  } catch (err) {
    console.error("❌ Error in getStoreEntryById:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * @desc    Get Store Entry by Purchase ID
 * @route   GET /api/store-entries/purchase/:purchaseId
 * @access  Private
 */
export const getStoreEntryByPurchaseId = async (req, res) => {
  try {
    const { purchaseId } = req.params;

    const storeEntry = await StoreEntry.findOne({ purchase: purchaseId })
      .populate("purchase", "PURNo purchaseDate status")
      .populate("order", "orderId PoNo orderType buyerDetails products")
      .populate("entries.supplierId", "name code");

    if (!storeEntry) {
      return res.status(404).json({
        message: "No Store Entry found for this purchase",
        exists: false
      });
    }

    res.json({ exists: true, storeEntry });
  } catch (err) {
    console.error("❌ Error in getStoreEntryByPurchaseId:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * @desc    Update a Store Entry
 * @route   PUT /api/store-entries/:id
 * @access  Private (Admin/SuperAdmin)
 */
export const updateStoreEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { storeEntryDate, entries, remarks } = req.body;

    const storeEntry = await StoreEntry.findById(id);
    if (!storeEntry) {
      return res.status(404).json({ message: "Store Entry not found" });
    }

    // Update fields
    if (storeEntryDate !== undefined) {
      storeEntry.storeEntryDate = new Date(storeEntryDate);
    }

    if (entries !== undefined) {
      // Validate - at least one item must have storeInQty > 0
      const hasValidEntry = entries.some(e => (e.storeInQty || 0) > 0);
      if (!hasValidEntry) {
        return res.status(400).json({
          message: "At least one item must have Store In Qty greater than 0"
        });
      }

      storeEntry.entries = entries.map(e => ({
        itemType: e.itemType,
        itemName: e.itemName,
        supplierId: e.supplierId || null,
        supplierName: e.supplierName,
        supplierCode: e.supplierCode || "",
        invoiceNo: e.invoiceNo || "",
        invoiceDate: e.invoiceDate ? new Date(e.invoiceDate) : null,
        hsn: e.hsn || "",
        unit: e.unit,
        purchaseQty: e.purchaseQty || 0,
        invoiceQty: parseFloat(e.invoiceQty) || 0,
        storeInQty: parseFloat(e.storeInQty) || 0,
        remarks: e.remarks || ""
      }));
    }

    if (remarks !== undefined) {
      storeEntry.remarks = remarks;
    }

    const updatedStoreEntry = await storeEntry.save();
    console.log("✅ Store Entry updated:", updatedStoreEntry.storeId);

    res.json({
      message: "Store Entry updated successfully",
      storeEntry: updatedStoreEntry
    });

  } catch (err) {
    console.error("❌ Error in updateStoreEntry:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * @desc    Delete a Store Entry
 * @route   DELETE /api/store-entries/:id
 * @access  Private (Admin/SuperAdmin)
 */
export const deleteStoreEntry = async (req, res) => {
  try {
    const storeEntry = await StoreEntry.findById(req.params.id);
    if (!storeEntry) {
      return res.status(404).json({ message: "Store Entry not found" });
    }

    // Remove reference from Purchase
    if (storeEntry.purchase) {
      await Purchase.findByIdAndUpdate(storeEntry.purchase, {
        $unset: { storeEntry: 1 }
      });
    }

    await StoreEntry.findByIdAndDelete(req.params.id);
    console.log("✅ Store Entry deleted:", storeEntry.storeId);

    res.json({ message: "Store Entry deleted successfully" });
  } catch (err) {
    console.error("❌ Error in deleteStoreEntry:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * @desc    Check if Store Entry exists for a purchase
 * @route   GET /api/store-entries/check/:purchaseId
 * @access  Private
 */
export const checkStoreEntryExists = async (req, res) => {
  try {
    const { purchaseId } = req.params;

    const storeEntry = await StoreEntry.findOne({ purchase: purchaseId })
      .select("storeId serialNo storeEntryDate");

    if (storeEntry) {
      return res.json({
        exists: true,
        storeEntry: {
          id: storeEntry._id,
          storeId: storeEntry.storeId,
          serialNo: storeEntry.serialNo,
          storeEntryDate: storeEntry.storeEntryDate
        }
      });
    }

    res.json({ exists: false });
  } catch (err) {
    console.error("❌ Error in checkStoreEntryExists:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * @desc    Get completed purchases that don't have store entries yet
 * @route   GET /api/store-entries/pending-purchases
 * @access  Private
 */
export const getPendingPurchasesForStoreEntry = async (req, res) => {
  try {
    const completedPurchases = await Purchase.find({
      status: "Completed",
      storeEntry: null
    })
      .populate("order", "orderId PoNo orderType orderDate buyerDetails products totalQty")
      .populate("purchaseItems.vendorId", "name code") // Make sure this path is correct
      .populate("fabricPurchases.vendorId", "name code") // Add old format support
      .populate("accessoriesPurchases.vendorId", "name code") // Add old format support
      .sort({ purchaseDate: -1 });

    console.log(`✅ Found ${completedPurchases.length} purchases ready for store entry`);

    // Log the first purchase to see its structure
    if (completedPurchases.length > 0) {
      console.log("📦 Sample purchase structure:", JSON.stringify(completedPurchases[0], null, 2));
    }

    res.json(completedPurchases);
  } catch (err) {
    console.error("❌ Error in getPendingPurchasesForStoreEntry:", err);
    res.status(500).json({ message: err.message });
  }
};