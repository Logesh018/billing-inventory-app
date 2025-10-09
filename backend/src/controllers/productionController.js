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
      poNo,
      factoryReceivedDate,
      dcNo,
      dcMtr,
      tagMtr,
      cuttingMtr,
      status,
      expectedQty,
      receivedFabric,
      goodsType,
      color,
      measurementUnit,
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

    // FIX: Transform products to match Purchase structure (color -> sizes)
    const productionProducts = order.products.map(p => {
      const colorMap = new Map();

      // Build color-to-sizes mapping from Order structure
      p.fabricTypes?.forEach(fabricType => {
        fabricType.sizes?.forEach(sizeEntry => {
          sizeEntry.colors?.forEach(colorEntry => {
            if (!colorMap.has(colorEntry.color)) {
              colorMap.set(colorEntry.color, []);
            }
            colorMap.get(colorEntry.color).push({
              size: sizeEntry.size,
              quantity: colorEntry.qty
            });
          });
        });
      });

      return {
        productName: p.productDetails?.name || "Unknown Product",
        fabricType: p.fabricTypes?.map(ft => ft.fabricType).join(", ") || "N/A",
        // Use color-based structure like Purchase
        colors: Array.from(colorMap.entries()).map(([color, sizes]) => ({
          color: color,
          sizes: sizes
        })),
        productTotalQty: p.fabricTypes?.reduce((total, ft) =>
          total + (ft.sizes?.reduce((sTotal, sz) =>
            sTotal + (sz.colors?.reduce((cTotal, col) => cTotal + (col.qty || 0), 0) || 0), 0) || 0), 0) || 0
      };
    });

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
      poNumber: poNo,
      factoryReceivedDate,
      dcNumber: dcNo,
      dcMtr,
      tagMtr,
      cuttingMtr,
      measurementUnit: measurementUnit || 'Meters',
      status: status || "Pending Production",
      requiredQty: order.totalQty || 0,
      expectedQty: expectedQty ? Number(expectedQty) : 0,
      remarks,
      receivedFabric: receivedFabric || '',
      goodsType: goodsType || '',
      color: color || '',
    };

    // If FOB → require purchaseId and get purchase data
    if (order.orderType === "FOB") {
      if (!purchaseId) {
        return res.status(400).json({ message: "purchaseId required for FOB orders" });
      }
      if (!mongoose.Types.ObjectId.isValid(purchaseId)) {
        return res.status(400).json({ message: "Invalid purchase ID format" });
      }

      const purchase = await Purchase.findById(purchaseId)
        .populate("fabricPurchases.vendorId", "name code")
        .populate("buttonsPurchases.vendorId", "name code")
        .populate("packetsPurchases.vendorId", "name code");

      if (!purchase) {
        return res.status(404).json({ message: "Purchase not found" });
      }

      productionData.purchase = purchase._id;
      productionData.fabricPurchases = purchase.fabricPurchases || [];
      productionData.buttonsPurchases = purchase.buttonsPurchases || [];
      productionData.packetsPurchases = purchase.packetsPurchases || [];
      productionData.totalFabricCost = purchase.totalFabricCost || 0;
      productionData.totalButtonsCost = purchase.totalButtonsCost || 0;
      productionData.totalPacketsCost = purchase.totalPacketsCost || 0;
      productionData.totalFabricGst = purchase.totalFabricGst || 0;
      productionData.totalButtonsGst = purchase.totalButtonsGst || 0;
      productionData.totalPacketsGst = purchase.totalPacketsGst || 0;
      productionData.grandTotalCost = purchase.grandTotalCost || 0;
      productionData.grandTotalWithGst = purchase.grandTotalWithGst || 0;

      if (!receivedFabric && purchase.fabricPurchases && purchase.fabricPurchases.length > 0) {
        const firstFabric = purchase.fabricPurchases[0];
        productionData.receivedFabric = firstFabric.fabricType;
        productionData.goodsType = firstFabric.productName;
        productionData.color = firstFabric.colors && firstFabric.colors.length > 0
          ? firstFabric.colors.join(", ")
          : "";
      }
    }

    if (order.orderType === "JOB-Works") {
      if (!receivedFabric && order.products && order.products.length > 0) {
        const firstProduct = order.products[0];
        if (firstProduct.fabricTypes && firstProduct.fabricTypes.length > 0) {
          const firstFabric = firstProduct.fabricTypes[0];
          productionData.receivedFabric = firstFabric.fabricType;
          productionData.goodsType = firstProduct.productDetails?.name || "";

          const colors = new Set();
          firstFabric.sizes?.forEach(size => {
            size.colors?.forEach(color => {
              colors.add(color.color);
            });
          });
          productionData.color = Array.from(colors).join(", ");
        }
      }

      if (purchaseId) {
        const purchase = await Purchase.findById(purchaseId)
          .populate("buttonsPurchases.vendorId", "name code")
          .populate("packetsPurchases.vendorId", "name code");

        if (purchase) {
          productionData.purchase = purchase._id;
          productionData.buttonsPurchases = purchase.buttonsPurchases || [];
          productionData.packetsPurchases = purchase.packetsPurchases || [];
          productionData.totalButtonsCost = purchase.totalButtonsCost || 0;
          productionData.totalPacketsCost = purchase.totalPacketsCost || 0;
          productionData.totalButtonsGst = purchase.totalButtonsGst || 0;
          productionData.totalPacketsGst = purchase.totalPacketsGst || 0;
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

// Keep all other functions the same...
export const getProductions = async (req, res) => {
  try {
    const productions = await Production.find()
      .populate("order", "buyerDetails orderType totalQty status")
      .populate("purchase", "PoNo status")
      .populate("fabricPurchases.vendorId", "name code")
      .populate("buttonsPurchases.vendorId", "name code")
      .populate("packetsPurchases.vendorId", "name code")
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
      .populate("buttonsPurchases.vendorId", "name code")
      .populate("packetsPurchases.vendorId", "name code");

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

    Object.assign(production, req.body);

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