// controllers/machinePurchaseController.js - SIMPLIFIED VERSION
import mongoose from "mongoose";
import Purchase from "../models/purchase.js";

/**
 * Helper to validate machine items
 */
const validateMachineItems = (machines) => {
  if (!Array.isArray(machines) || machines.length === 0) {
    return "machinesPurchases must be a non-empty array";
  }
  for (const m of machines) {
    if (!m.machineName || !m.vendor || (m.cost === undefined || m.cost === null)) {
      return "Each machine must include machineName, vendor and cost";
    }
    if (m.vendorId && !mongoose.Types.ObjectId.isValid(m.vendorId)) {
      return "Invalid vendorId";
    }
  }
  return null;
};

/**
 * Create a new machine purchase
 * Route: POST /api/machines
 */
export const createMachinePurchase = async (req, res) => {
  try {
    const { machinesPurchases = [], purchaseDate, remarks } = req.body;

    const validationError = validateMachineItems(machinesPurchases);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const purchaseDoc = new Purchase({
      order: null,
      orderDate: null,
      PoNo: null,
      orderType: null,
      buyerCode: null,
      orderStatus: null,
      fabricPurchases: [],
      buttonsPurchases: [],
      packetsPurchases: [],
      machinesPurchases,
      purchaseDate: purchaseDate || Date.now(),
      remarks: remarks || `Machine purchase (${machinesPurchases.length} item(s))`,
    });

    const saved = await purchaseDoc.save();

    return res.status(201).json({ 
      message: "Machine purchase created", 
      purchase: saved 
    });
  } catch (err) {
    console.error("createMachinePurchase error:", err);
    return res.status(400).json({ message: err.message });
  }
};

/**
 * Get all machine purchases - SIMPLIFIED to return flattened array directly
 * Route: GET /api/machines
 */
export const getAllMachinePurchases = async (req, res) => {
  try {
    console.log("🔍 getAllMachinePurchases called");
    
    // Query: only purchases having at least one machine item
    const filter = { "machinesPurchases.0": { $exists: true } };

    const purchases = await Purchase.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    console.log(`📦 Found ${purchases.length} purchase documents with machines`);

    // Flatten the machine purchases array
    const flattenedMachines = [];
    purchases.forEach(purchase => {
      console.log(`📦 Processing purchase ${purchase.PURNo} with ${purchase.machinesPurchases.length} machines`);
      
      purchase.machinesPurchases.forEach(machine => {
        flattenedMachines.push({
          _id: machine._id,
          purchaseId: purchase._id,
          PURNo: purchase.PURNo,
          purchaseDate: machine.purchaseDate || purchase.purchaseDate,
          machineName: machine.machineName,
          vendor: machine.vendor,
          vendorCode: machine.vendorCode,
          vendorId: machine.vendorId,
          cost: machine.cost,
          gstPercentage: machine.gstPercentage,
          totalCost: machine.totalCost,
          totalWithGst: machine.totalWithGst,
          remarks: machine.remarks,
          createdAt: purchase.createdAt,
          updatedAt: purchase.updatedAt
        });
      });
    });

    console.log(`📦 Returning ${flattenedMachines.length} flattened machine items`);
    console.log("📦 First item:", flattenedMachines[0]);

    // Return flattened array directly in 'data' property
    return res.status(200).json({
      success: true,
      count: flattenedMachines.length,
      data: flattenedMachines
    });
  } catch (err) {
    console.error("getAllMachinePurchases error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/**
 * Get single machine purchase by purchase document id
 * Route: GET /api/machines/:id
 */
export const getMachinePurchaseById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const purchase = await Purchase.findById(id).lean();
    if (!purchase) return res.status(404).json({ message: "Purchase not found" });

    if (!purchase.machinesPurchases || purchase.machinesPurchases.length === 0) {
      return res.status(404).json({ message: "No machinesPurchases found for this purchase" });
    }

    return res.status(200).json({ purchase });
  } catch (err) {
    console.error("getMachinePurchaseById error:", err);
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Update machine purchase document
 * Route: PUT /api/machines/:id
 */
export const updateMachinePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const { machinesPurchases, purchaseDate, remarks } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const purchase = await Purchase.findById(id);
    if (!purchase) return res.status(404).json({ message: "Purchase not found" });

    if (!purchase.machinesPurchases || purchase.machinesPurchases.length === 0) {
      return res.status(400).json({ message: "This purchase does not contain machine items" });
    }

    if (machinesPurchases !== undefined) {
      const validationError = validateMachineItems(machinesPurchases);
      if (validationError) return res.status(400).json({ message: validationError });
      purchase.machinesPurchases = machinesPurchases;
    }

    if (purchaseDate !== undefined) purchase.purchaseDate = purchaseDate;
    if (remarks !== undefined) purchase.remarks = remarks;

    const updated = await purchase.save();
    return res.status(200).json({ 
      message: "Machine purchase updated", 
      purchase: updated 
    });
  } catch (err) {
    console.error("updateMachinePurchase error:", err);
    return res.status(400).json({ message: err.message });
  }
};

/**
 * Delete machine purchase
 * Route: DELETE /api/machines/:id
 */
export const deleteMachinePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const purchase = await Purchase.findById(id);
    if (!purchase) return res.status(404).json({ message: "Purchase not found" });

    if (!purchase.machinesPurchases || purchase.machinesPurchases.length === 0) {
      return res.status(400).json({ message: "This purchase does not contain machine items" });
    }

    await Purchase.findByIdAndDelete(id);
    return res.status(200).json({ 
      success: true,
      message: "Machine purchase deleted" 
    });
  } catch (err) {
    console.error("deleteMachinePurchase error:", err);
    return res.status(500).json({ message: err.message });
  }
};