// controllers/storeLogController.js
import mongoose from "mongoose";
import StoreLog from "../models/storeLog.js";
import StoreEntry from "../models/storeEntry.js";
import Order from "../models/orders.js";
import Purchase from "../models/purchase.js";

/**
 * @desc    Create initial store log when store entry is completed
 * @route   POST /api/store-logs/create-initial
 * @access  Private (called internally from store entry creation)
 */
export const createInitialStoreLog = async (storeEntryId) => {
  try {
    console.log("📝 Creating initial store log for Store Entry:", storeEntryId);

    const storeEntry = await StoreEntry.findById(storeEntryId)
      .populate("order")
      .populate("purchase");

    if (!storeEntry) {
      throw new Error("Store Entry not found");
    }

    // Create initial log with "In Store" status
    const initialLog = new StoreLog({
      storeEntry: storeEntry._id,
      order: storeEntry.order._id,
      purchase: storeEntry.purchase._id,
      storeId: storeEntry.storeId,
      orderId: storeEntry.orderId,
      PURNo: storeEntry.PURNo,
      orderType: storeEntry.orderType,
      buyerCode: storeEntry.buyerCode,
      logDate: storeEntry.storeEntryDate,
      items: [], // Empty - will be filled when worker takes material
      status: "In Store",
      remarks: `Initial entry - Materials received in warehouse`
    });

    await initialLog.save();
    console.log("✅ Initial store log created:", initialLog.logId);

    return initialLog;
  } catch (err) {
    console.error("❌ Error creating initial store log:", err);
    throw err;
  }
};

/**
 * @desc    Create a new Store Log (worker taking/returning material)
 * @route   POST /api/store-logs
 * @access  Private (Admin/SuperAdmin)
 */
export const createStoreLog = async (req, res) => {
  try {
    const {
      storeEntryId,
      logDate,
      personName,
      personRole,
      department,
      items,
      loginTime,
      logoutTime,
      productCount,
      status,
      remarks
    } = req.body;

    console.log("📝 Creating store log for Store Entry:", storeEntryId);

    // Validation
    if (!storeEntryId || !logDate) {
      return res.status(400).json({
        message: "storeEntryId and logDate are required"
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        message: "At least one item is required"
      });
    }

    // Find store entry
    const storeEntry = await StoreEntry.findById(storeEntryId)
      .populate("order")
      .populate("purchase");

    if (!storeEntry) {
      return res.status(404).json({ message: "Store Entry not found" });
    }

    // Validate stock availability for each item
    for (const item of items) {
      if (item.takenQty > 0) {
        const availableStock = await calculateAvailableStock(
          storeEntryId,
          item.itemName
        );

        if (item.takenQty > availableStock) {
          return res.status(400).json({
            message: `Insufficient stock for ${item.itemName}. Available: ${availableStock}, Requested: ${item.takenQty}`
          });
        }
      }
    }

    // Create new store log
    const newStoreLog = new StoreLog({
      storeEntry: storeEntry._id,
      order: storeEntry.order._id,
      purchase: storeEntry.purchase._id,
      storeId: storeEntry.storeId,
      orderId: storeEntry.orderId,
      PURNo: storeEntry.PURNo,
      orderType: storeEntry.orderType,
      buyerCode: storeEntry.buyerCode,
      logDate: new Date(logDate),
      personName: personName || "",
      personRole: personRole || "",
      department: department || "",
      items: items.map(item => ({
        itemName: item.itemName,
        itemType: item.itemType || "fabric",
        unit: item.unit || "kg",
        takenQty: parseFloat(item.takenQty) || 0,
        returnedQty: parseFloat(item.returnedQty) || 0,
        remarks: item.remarks || ""
      })),
      loginTime: loginTime || "",
      logoutTime: logoutTime || "",
      productCount: parseInt(productCount) || 0,
      status: status || "Out",
      remarks: remarks || ""
    });

    const savedStoreLog = await newStoreLog.save();
    console.log("✅ Store log created:", savedStoreLog.logId);

    res.status(201).json({
      message: "Store log created successfully",
      storeLog: savedStoreLog
    });

  } catch (err) {
    console.error("❌ Error in createStoreLog:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Calculate available stock for an item in a store entry
 * Takes into account current log being edited
 */
const calculateAvailableStock = async (storeEntryId, itemName, excludeLogId = null) => {
  try {
    // Get store entry to find initial stock
    const storeEntry = await StoreEntry.findById(storeEntryId);
    if (!storeEntry) return 0;

    // Find the item in store entry
    const storeItem = storeEntry.entries.find(e => e.itemName === itemName);
    if (!storeItem) return 0;

    const initialStock = storeItem.storeInQty || 0;

    // Get all logs for this store entry and item (excluding current log if editing)
    const query = { storeEntry: storeEntryId };
    if (excludeLogId) {
      query._id = { $ne: excludeLogId };
    }
    const logs = await StoreLog.find(query);

    let totalTaken = 0;
    let totalReturned = 0;

    logs.forEach(log => {
      const logItem = log.items.find(i => i.itemName === itemName);
      if (logItem) {
        totalTaken += logItem.takenQty || 0;
        totalReturned += logItem.returnedQty || 0;
      }
    });

    const availableStock = initialStock - totalTaken + totalReturned;
    return availableStock >= 0 ? availableStock : 0;

  } catch (err) {
    console.error("Error calculating available stock:", err);
    return 0;
  }
};

/**
 * @desc    Get all Store Logs
 * @route   GET /api/store-logs
 * @access  Private
 */
export const getStoreLogs = async (req, res) => {
  try {
    const { status, orderId, storeId, PURNo } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (orderId) filter.orderId = orderId;
    if (storeId) filter.storeId = storeId;
    if (PURNo) filter.PURNo = PURNo;

    const storeLogs = await StoreLog.find(filter)
      .populate("storeEntry", "storeId storeEntryDate")
      .populate("order", "orderId PoNo orderType")
      .populate("purchase", "PURNo purchaseDate")
      .sort({ createdAt: -1 });

    res.json(storeLogs);
  } catch (err) {
    console.error("❌ Error in getStoreLogs:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * @desc    Get single Store Log by ID
 * @route   GET /api/store-logs/:id
 * @access  Private
 */
export const getStoreLogById = async (req, res) => {
  try {
    const storeLog = await StoreLog.findById(req.params.id)
      .populate("storeEntry", "storeId storeEntryDate entries")
      .populate("order", "orderId PoNo orderType buyerDetails")
      .populate("purchase", "PURNo purchaseDate");

    if (!storeLog) {
      return res.status(404).json({ message: "Store Log not found" });
    }

    res.json(storeLog);
  } catch (err) {
    console.error("❌ Error in getStoreLogById:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * @desc    Get all Store Logs for a specific Store Entry
 * @route   GET /api/store-logs/store-entry/:storeEntryId
 * @access  Private
 */
export const getStoreLogsByStoreEntry = async (req, res) => {
  try {
    const { storeEntryId } = req.params;

    const storeLogs = await StoreLog.find({ storeEntry: storeEntryId })
      .sort({ logDate: -1, createdAt: -1 });

    res.json(storeLogs);
  } catch (err) {
    console.error("❌ Error in getStoreLogsByStoreEntry:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * @desc    Get available stock for a store entry
 * @route   GET /api/store-logs/available-stock/:storeEntryId
 * @access  Private
 */
export const getAvailableStock = async (req, res) => {
  try {
    const { storeEntryId } = req.params;

    const storeEntry = await StoreEntry.findById(storeEntryId);
    if (!storeEntry) {
      return res.status(404).json({ message: "Store Entry not found" });
    }

    const stockData = [];

    for (const item of storeEntry.entries) {
      const available = await calculateAvailableStock(storeEntryId, item.itemName);
      stockData.push({
        itemName: item.itemName,
        itemType: item.itemType,
        unit: item.unit,
        initialStock: item.storeInQty,
        availableStock: available
      });
    }

    res.json({
      storeId: storeEntry.storeId,
      orderId: storeEntry.orderId,
      stockData
    });

  } catch (err) {
    console.error("❌ Error in getAvailableStock:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * @desc    Update a Store Log
 * @route   PUT /api/store-logs/:id
 * @access  Private (Admin/SuperAdmin)
 */
export const updateStoreLog = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      logDate,
      personName,
      personRole,
      department,
      items,
      loginTime,
      logoutTime,
      productCount,
      status,
      remarks
    } = req.body;

    const storeLog = await StoreLog.findById(id);
    if (!storeLog) {
      return res.status(404).json({ message: "Store Log not found" });
    }

    // Update fields - allow partial updates
    if (logDate !== undefined) storeLog.logDate = new Date(logDate);
    if (personName !== undefined) storeLog.personName = personName;
    if (personRole !== undefined) storeLog.personRole = personRole;
    if (department !== undefined) storeLog.department = department;
    if (loginTime !== undefined) storeLog.loginTime = loginTime;
    if (logoutTime !== undefined) storeLog.logoutTime = logoutTime;
    if (productCount !== undefined) storeLog.productCount = parseInt(productCount) || 0;
    if (status !== undefined) storeLog.status = status;
    if (remarks !== undefined) storeLog.remarks = remarks;

    // Only validate and update items if they are provided
    if (items !== undefined && items.length > 0) {
      // Validate stock availability for increased quantities
      for (const newItem of items) {
        const oldItem = storeLog.items.find(i => i.itemName === newItem.itemName);
        const oldTakenQty = oldItem ? oldItem.takenQty : 0;
        const additionalQty = (newItem.takenQty || 0) - oldTakenQty;

        if (additionalQty > 0) {
          // Calculate available stock excluding this log's current quantities
          const availableStock = await calculateAvailableStock(
            storeLog.storeEntry,
            newItem.itemName,
            storeLog._id
          );

          if (additionalQty > availableStock) {
            return res.status(400).json({
              message: `Insufficient stock for ${newItem.itemName}. Available: ${availableStock}, Additional requested: ${additionalQty}`
            });
          }
        }
      }

      storeLog.items = items.map(item => ({
        itemName: item.itemName,
        itemType: item.itemType || "fabric",
        unit: item.unit || "kg",
        takenQty: parseFloat(item.takenQty) || 0,
        returnedQty: parseFloat(item.returnedQty) || 0,
        remarks: item.remarks || ""
      }));
    }

    const updatedStoreLog = await storeLog.save();
    console.log("✅ Store log updated:", updatedStoreLog.logId);

    res.json({
      message: "Store log updated successfully",
      storeLog: updatedStoreLog
    });

  } catch (err) {
    console.error("❌ Error in updateStoreLog:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * @desc    Delete a Store Log
 * @route   DELETE /api/store-logs/:id
 * @access  Private (Admin/SuperAdmin)
 */
export const deleteStoreLog = async (req, res) => {
  try {
    const storeLog = await StoreLog.findById(req.params.id);
    if (!storeLog) {
      return res.status(404).json({ message: "Store Log not found" });
    }

    await StoreLog.findByIdAndDelete(req.params.id);
    console.log("✅ Store log deleted:", storeLog.logId);

    res.json({ message: "Store log deleted successfully" });
  } catch (err) {
    console.error("❌ Error in deleteStoreLog:", err);
    res.status(500).json({ message: err.message });
  }
};

export { calculateAvailableStock };