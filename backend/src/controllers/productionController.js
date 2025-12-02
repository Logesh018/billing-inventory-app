import mongoose from "mongoose";
import Production from "../models/production.js";
import Order from "../models/orders.js";
import Purchase from "../models/purchase.js";

// @desc    Create a new production entry
// @route   POST /api/productions
export const createProduction = async (req, res) => {
  try {
    const {
      orderId,
      purchaseId,
      poDate,
      poNumber,
      factoryReceivedDate,
      status,
      productionDetails, 
      remarks,
    } = req.body;

    console.log("POST /api/productions payload:", req.body);

    if (!orderId) {
      return res.status(400).json({ message: "orderId is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order ID format" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const existingProduction = await Production.findOne({ order: order._id });
    if (existingProduction) {
      return res.status(400).json({
        message: "Production already exists for this order",
        productionId: existingProduction._id
      });
    }

    // Transform products to match Production structure (color -> sizes)
    const productionProducts = order.products.map(p => ({
      productName: p.productDetails?.name || "Unknown Product",
      fabricType: p.productDetails?.fabricType || "N/A",
     
      style: Array.isArray(p.productDetails?.style)
        ? p.productDetails.style.join(", ")
        : (p.productDetails?.style || ""),
      colors: [{
        color: p.productDetails?.color || "N/A",
        sizes: (p.sizes || []).map(s => ({
          size: s.size,
          quantity: s.qty  // Production uses 'quantity', not 'qty'
        }))
      }],
      productTotalQty: (p.sizes || []).reduce((sum, s) => sum + (s.qty || 0), 0)
    }));

    const productionData = {
      order: order._id,
      orderDate: order.orderDate,
      PoNo: order.PoNo,
      orderType: order.orderType,
      buyerCode: order.buyerDetails?.code || "N/A",
      buyerName: order.buyerDetails?.name || "N/A",
      products: productionProducts,
      totalQty: order.totalQty || 0,
      poDate,
      poNumber,
      factoryReceivedDate,
      status: status || "Pending Production",
      remarks,
      productionDetails: productionDetails || [], 
    };

    // If FOB/Own-Orders → require purchaseId and get purchase data
    if (order.orderType === "FOB" || order.orderType === "Own-Orders") {
      if (!purchaseId) {
        return res.status(400).json({ message: "purchaseId required for FOB/Own-Orders" });
      }
      if (!mongoose.Types.ObjectId.isValid(purchaseId)) {
        return res.status(400).json({ message: "Invalid purchase ID format" });
      }

      const purchase = await Purchase.findById(purchaseId)
        .populate("fabricPurchases.vendorId", "name code")
        .populate("accessoriesPurchases.vendorId", "name code");

      if (!purchase) {
        return res.status(404).json({ message: "Purchase not found" });
      }

      productionData.purchase = purchase._id;
      productionData.fabricPurchases = purchase.fabricPurchases || [];
      productionData.accessoriesPurchases = purchase.accessoriesPurchases || [];
      productionData.totalFabricCost = purchase.totalFabricCost || 0;
      productionData.totalAccessoriesCost = purchase.totalAccessoriesCost || 0;
      productionData.totalFabricGst = purchase.totalFabricGst || 0;
      productionData.totalAccessoriesGst = purchase.totalAccessoriesGst || 0;
      productionData.grandTotalCost = purchase.grandTotalCost || 0;
      productionData.grandTotalWithGst = purchase.grandTotalWithGst || 0;
    }

    // If JOB-Works → accessories only
    if (order.orderType === "JOB-Works") {
      if (purchaseId) {
        const purchase = await Purchase.findById(purchaseId)
          .populate("accessoriesPurchases.vendorId", "name code");

        if (purchase) {
          productionData.purchase = purchase._id;
          productionData.accessoriesPurchases = purchase.accessoriesPurchases || [];
          productionData.totalAccessoriesCost = purchase.totalAccessoriesCost || 0;
          productionData.totalAccessoriesGst = purchase.totalAccessoriesGst || 0;
        }
      }
    }

    const newProduction = new Production(productionData);
    const savedProduction = await newProduction.save();
    console.log("✅ Saved production:", savedProduction._id);

    await Order.findByIdAndUpdate(orderId, {
      status: "Pending Production",
      production: savedProduction._id
    });

    res.status(201).json(savedProduction);
  } catch (err) {
    console.error("❌ Error in createProduction:", err);
    res.status(400).json({ message: err.message, error: err });
  }
};

export const getProductions = async (req, res) => {
  try {
    const productions = await Production.find()
      .populate("order", "buyerDetails orderType totalQty status")
      .populate("purchase", "PoNo status")
      .populate("fabricPurchases.vendorId", "name code")
      .populate("accessoriesPurchases.vendorId", "name code")
      .sort({ createdAt: -1 });

    res.json(productions);
  } catch (err) {
    console.error("Error in getProductions:", err.message);
    res.status(500).json({ message: err.message });
  }
};

export const getProductionById = async (req, res) => {
  try {
    const production = await Production.findById(req.params.id)
      .populate("order", "buyerDetails orderType totalQty status")
      .populate("purchase", "PoNo status")
      .populate("fabricPurchases.vendorId", "name code")
      .populate("accessoriesPurchases.vendorId", "name code");

    if (!production) {
      return res.status(404).json({ message: "Production not found" });
    }

    res.json(production);
  } catch (err) {
    console.error("Error in getProductionById:", err.message);
    res.status(500).json({ message: err.message });
  }
};

export const updateProduction = async (req, res) => {
  try {
    const production = await Production.findById(req.params.id);
    if (!production) {
      return res.status(404).json({ message: "Production not found" });
    }

  
    if (req.body.productionDetails) {
      production.productionDetails = req.body.productionDetails;
    }

    
    if (req.body.cuttingDetails) {
      production.cuttingDetails = req.body.cuttingDetails;
    }

   
    if (req.body.stitchingDetails) {
      production.stitchingDetails = req.body.stitchingDetails;
    }

    // Update other fields
    Object.assign(production, req.body);


    const updatedProduction = await production.save();
    console.log("Updated production:", updatedProduction);

    res.json(updatedProduction);
  } catch (err) {
    console.error("Error in updateProduction:", err.message);
    res.status(400).json({ message: err.message });
  }
};


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