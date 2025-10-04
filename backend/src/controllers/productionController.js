// controllers/productionController.js
import mongoose from "mongoose";
import Production from "../models/production.js";
import Order from "../models/orders.js";
import Purchase from "../models/purchase.js";

// Normalize values to array of strings
const normalizeArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.map(v => (typeof v === "object" ? Object.values(v)[0] : v));
  }
  return [val];
};

// @desc    Create a new production entry
// @route   POST /api/productions
export const createProduction = async (req, res) => {
  try {
    const {
      orderId,
      purchaseId,
      poDate,
      poNo,
      factoryReceivedDate,
      dcNo,
      dcMtr,
      tagMtr,
      cuttingMtr,
      status,
      expectedQty,
      remarks,
    } = req.body;

    console.log("POST /api/productions payload:", req.body);

    // ✅ Validate orderId
    if (!orderId) {
      return res.status(400).json({ message: "orderId is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order ID format" });
    }

    let order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const productionData = {
      order: order._id,
      poDate,
      poNo,
      factoryReceivedDate,
      dcNo,
      dcMtr,
      tagMtr,
      cuttingMtr,
      status,
      requiredQty: order.totalQty || 0, // from order
      expectedQty: expectedQty ? Number(expectedQty) : 0,
      orderType: order.orderType,
      remarks,
    };

    // ✅ If FOB → require purchaseId
    if (order.orderType === "FOB") {
      if (!purchaseId) {
        return res.status(400).json({ message: "purchaseId required for FOB orders" });
      }
      if (!mongoose.Types.ObjectId.isValid(purchaseId)) {
        return res.status(400).json({ message: "Invalid purchase ID format" });
      }

      const purchase = await Purchase.findById(purchaseId);
      if (!purchase) {
        return res.status(404).json({ message: "Purchase not found" });
      }

      productionData.receivedFabric = purchase.fabricType;
      productionData.goodsType = purchase.fabricStyles?.[0] || "";
      productionData.color = purchase.fabricColors?.[0] || "";
    }

    // ✅ If JOB-WORKS → derive from order
    if (order.orderType === "JOB-Works") {
      productionData.receivedFabric = order.fabric?.type;
      productionData.goodsType = order.fabric?.style;
      productionData.color = order.fabric?.color;
    }

    if (remarks !== undefined) production.remarks = remarks;

    // Save Production
    const newProduction = new Production(productionData);
    const savedProduction = await newProduction.save();
    console.log("Saved production:", savedProduction);

    // Update order status
    if (order.orderType === "FOB") {
      order.status = "Pending Purchase";
    } else {
      order.status = "Pending Production";
    }
    await order.save();

    res.status(201).json(savedProduction);
  } catch (err) {
    console.error("Error in createProduction:", err);
    res.status(400).json({ message: err.message, error: err });
  }
};


// @desc    Get all productions
// @route   GET /api/productions
export const getProductions = async (req, res) => {
  try {
    const productions = await Production.find()
      .populate("order")   // make sure to pull all order fields
      .populate("purchase") // optional

      .sort({ createdAt: -1 });

    res.json(productions);
  } catch (err) {
    console.error("Error in getProductions:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get single production by ID
// @route   GET /api/productions/:id
export const getProductionById = async (req, res) => {
  try {
    const production = await Production.findById(req.params.id)
      .populate("order", "buyerDetails orderType totalQty status");

    if (!production) {
      return res.status(404).json({ message: "Production not found" });
    }

    res.json(production);
  } catch (err) {
    console.error("Error in getProductionById:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update production
// @route   PUT /api/productions/:id
export const updateProduction = async (req, res) => {
  try {
    const production = await Production.findById(req.params.id);
    if (!production) {
      return res.status(404).json({ message: "Production not found" });
    }

    Object.assign(production, req.body);

    // shortageMtr = tagMtr - cuttingMtr
    if (req.body.tagMtr !== undefined && req.body.cuttingMtr !== undefined) {
      production.shortageMtr = req.body.tagMtr - req.body.cuttingMtr;
    }

    const updatedProduction = await production.save();
    console.log("Updated production:", updatedProduction);

    res.json(updatedProduction);
  } catch (err) {
    console.error("Error in updateProduction:", err.message);
    res.status(400).json({ message: err.message });
  }
};

// @desc    Mark production as completed and update order
// @route   PATCH /api/productions/:id/complete
export const completeProduction = async (req, res) => {
  try {
    const production = await Production.findById(req.params.id);
    if (!production) {
      return res.status(404).json({ message: "Production not found" });
    }

    const order = await Order.findById(production.order);
    if (order) {
      order.status = "Completed";
      await order.save();
      console.log("Updated order status to Completed for orderId:", order._id);
    }

    res.json({ message: "Production marked as completed successfully" });
  } catch (err) {
    console.error("Error in completeProduction:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete a production
// @route   DELETE /api/productions/:id
export const deleteProduction = async (req, res) => {
  try {
    const production = await Production.findById(req.params.id);
    if (!production) {
      return res.status(404).json({ message: "Production not found" });
    }

    await Production.findByIdAndDelete(req.params.id);
    res.json({ message: "Production deleted successfully" });
  } catch (err) {
    console.error("Error in deleteProduction:", err.message);
    res.status(500).json({ message: err.message });
  }
};
