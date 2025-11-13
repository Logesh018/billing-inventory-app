import mongoose from "mongoose";
import Purchase from "../models/purchase.js";
import Product from "../models/products.js";
import Order from "../models/orders.js";
import Production from "../models/production.js";
import Supplier from "../models/supplier.js";

const transformOrderProductsForProduction = (orderProducts) => {
  return orderProducts.map(p => ({
    productName: p.productDetails?.name || "Unknown Product",
    fabricType: p.productDetails?.fabricType || "N/A",
    style: p.productDetails?.style || "",
    colors: [{
      color: p.productDetails?.color || "N/A",
      sizes: (p.sizes || []).map(s => ({
        size: s.size,
        quantity: s.qty  // Production uses 'quantity', not 'qty'
      }))
    }],
    productTotalQty: (p.sizes || []).reduce((sum, s) => sum + (s.qty || 0), 0)
  }));
};

// ==========================================
// Note: This helper is specifically for Production schema
// Production schema uses a flattened structure with:
// - productName (not nested productDetails)
// - colors array with sizes inside
// - sizes use 'quantity' field (not 'qty')
// ==========================================

export const createPurchase = async (req, res) => {
  try {
    const {
      orderId,
      fabricPurchases = [],
      accessoriesPurchases = [],
      remarks,
    } = req.body;

    console.log("POST /api/purchases payload:", req.body);

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

    // Allow both FOB and JOB-Works orders
    if (order.orderType !== "FOB" && order.orderType !== "JOB-Works" && order.orderType !== "Own-Orders") {
      return res.status(400).json({ message: "Invalid order type for purchase" });
    }


    // Check if purchase already exists for this order
    const existingPurchase = await Purchase.findOne({ order: orderId });
    if (existingPurchase) {
      return res.status(400).json({
        message: "Purchase already exists for this order. Please update the existing purchase instead.",
        purchaseId: existingPurchase._id
      });
    }

    // Validate fabricPurchases structure if provided
    for (const item of fabricPurchases) {
      if (!item.vendor || !item.fabricType || !item.quantity || !item.costPerUnit) {
        return res.status(400).json({
          message: "Each fabric purchase requires vendor, fabricType, quantity, and costPerUnit"
        });
      }

      if (item.vendorId && !mongoose.Types.ObjectId.isValid(item.vendorId)) {
        return res.status(400).json({ message: "Invalid supplier ID format" });
      }
    }

    // Validate accessoriesPurchases structure if provided
    for (const item of accessoriesPurchases) {
      if (!item.vendor || !item.productName || !item.accessoryType || !item.quantity || !item.costPerUnit) {
        return res.status(400).json({
          message: "Each accessory purchase requires vendor, productName, accessoryType, quantity, and costPerUnit"
        });
      }

      if (item.vendorId && !mongoose.Types.ObjectId.isValid(item.vendorId)) {
        return res.status(400).json({ message: "Invalid supplier ID format" });
      }
    }

    const purchaseProducts = order.products.map(p => ({
      productName: p.productDetails?.name || "Unknown Product",
      fabricType: p.productDetails?.fabricType || "N/A",
      style: p.productDetails?.style || "",
      colors: [{
        color: p.productDetails?.color || "N/A",
        sizes: (p.sizes || []).map(s => ({
          size: s.size,
          quantity: s.qty
        }))
      }],
      productTotalQty: (p.sizes || []).reduce((sum, s) => sum + (s.qty || 0), 0)
    }));


    const hasPurchaseItems =
      (fabricPurchases && fabricPurchases.length > 0) ||
      (accessoriesPurchases && accessoriesPurchases.length > 0);

    // Create new purchase
    const newPurchase = new Purchase({
      order: order._id,
      orderDate: order.orderDate,
      PoNo: order.PoNo,
      orderType: order.orderType,
      buyerCode: order.buyerDetails?.code || "N/A",
      orderStatus: order.status || "Pending Purchase",
      products: purchaseProducts,
      totalQty: order.totalQty || 0,
      fabricPurchases,
      accessoriesPurchases, // replaces buttonsPurchases and packetsPurchases
      remarks: remarks || `Purchase for ${order.orderType} order ${order.PoNo}`,
      status: hasPurchaseItems ? "Completed" : "Pending",
    });

    const savedPurchase = await newPurchase.save();
    console.log("✅ Purchase created:", savedPurchase._id, "- Status:", savedPurchase.status);

    // Link purchase to order
    await Order.findByIdAndUpdate(orderId, {
      purchase: savedPurchase._id,
      status: hasPurchaseItems ? "Purchase Completed" : "Pending Purchase"
    });

    // Only create production if purchase is completed
    if (hasPurchaseItems) {
      // Check if production already exists
      const existingProduction = await Production.findOne({ order: orderId });

      if (!existingProduction) {
        console.log("🔄 Creating production for completed purchase...");

        // ✅ Use the helper function to properly transform products
        const productionProducts = transformOrderProductsForProduction(order.products);

        // Create production with order data
        const productionData = {
          order: order._id,
          orderDate: order.orderDate,
          PoNo: order.PoNo,
          orderType: order.orderType,
          buyerCode: order.buyerDetails?.code || "N/A",
          buyerName: order.buyerDetails?.name || "N/A",
          products: productionProducts,
          totalQty: order.totalQty || 0,
          requiredQty: order.totalQty || 0,
          status: "Pending Production",
          purchase: savedPurchase._id
        };

        // Add purchase-specific data based on order type
        if (order.orderType === "FOB" || order.orderType === "Own-Orders") {
          productionData.fabricPurchases = savedPurchase.fabricPurchases || [];
          productionData.accessoriesPurchases = savedPurchase.accessoriesPurchases || [];
          productionData.totalFabricCost = savedPurchase.totalFabricCost || 0;
          productionData.totalAccessoriesCost = savedPurchase.totalAccessoriesCost || 0;
          productionData.totalFabricGst = savedPurchase.totalFabricGst || 0;
          productionData.totalAccessoriesGst = savedPurchase.totalAccessoriesGst || 0;
          productionData.grandTotalCost = savedPurchase.grandTotalCost || 0;
          productionData.grandTotalWithGst = savedPurchase.grandTotalWithGst || 0;

          if (savedPurchase.fabricPurchases && savedPurchase.fabricPurchases.length > 0) {
            const firstFabric = savedPurchase.fabricPurchases[0];
            productionData.receivedFabric = firstFabric.fabricType;
            productionData.goodsType = firstFabric.productName;
            productionData.color = firstFabric.colors?.join(", ") || "";
          }
        } else if (order.orderType === "JOB-Works") {
          productionData.accessoriesPurchases = savedPurchase.accessoriesPurchases || [];
          productionData.totalAccessoriesCost = savedPurchase.totalAccessoriesCost || 0;
          productionData.totalAccessoriesGst = savedPurchase.totalAccessoriesGst || 0;

          if (order.products && order.products.length > 0) {
            const firstProduct = order.products[0];
            productionData.receivedFabric = firstProduct.productDetails?.fabricType || "N/A";
            productionData.goodsType = firstProduct.productDetails?.name || "";
            productionData.color = firstProduct.productDetails?.color || "";
          }
        }

        const newProduction = new Production(productionData);
        await newProduction.save();
        console.log("✅ Production created automatically:", newProduction._id);

        // Link production to order
        await Order.findByIdAndUpdate(orderId, {
          production: newProduction._id,
          status: "Pending Production"
        });
      } else {
        console.log("⚠️ Production already exists, skipping creation");
      }
    }

    res.status(201).json({
      message: hasPurchaseItems
        ? "Purchase created and marked as completed"
        : "Purchase placeholder created - please add purchase items",
      purchase: savedPurchase
    });
  } catch (err) {
    console.error("❌ Error in createPurchase:", err);
    res.status(400).json({ message: err.message });
  }
};

// @desc    Get all purchases
// @route   GET /api/purchases
export const getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .populate("order", "PoNo orderType status buyerDetails")
      .populate("fabricPurchases.vendorId", "name code")
      .populate("accessoriesPurchases.vendorId", "name code")  
      .sort({ createdAt: -1 });
    res.json(purchases);
  } catch (err) {
    console.error("❌ Error in getPurchases:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update a purchase
// @route   PUT /api/purchases/:id
export const updatePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fabricPurchases,
      accessoriesPurchases,
      remarks,
    } = req.body;

    const purchase = await Purchase.findById(id);
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    const wasCompleted = purchase.status === "Completed";

    // Update purchase-specific arrays
    if (fabricPurchases !== undefined) purchase.fabricPurchases = fabricPurchases;
    if (accessoriesPurchases !== undefined) purchase.accessoriesPurchases = accessoriesPurchases;
    if (remarks !== undefined) purchase.remarks = remarks;

    // Determine if purchase has items and should be marked as completed
    const hasItems =
      (purchase.fabricPurchases && purchase.fabricPurchases.length > 0) ||
      (purchase.accessoriesPurchases && purchase.accessoriesPurchases.length > 0);

    // Update status based on whether there are purchase items
    purchase.status = hasItems ? "Completed" : "Pending";

    const updatedPurchase = await purchase.save();
    console.log("✅ Updated purchase:", updatedPurchase._id, "Status:", updatedPurchase.status);

    // Get the order for production creation
    const order = await Order.findById(purchase.order);
    if (!order) {
      return res.status(404).json({ message: "Associated order not found" });
    }

    // Update order status if purchase is now completed
    if (updatedPurchase.status === "Completed" && !wasCompleted) {
      await Order.findByIdAndUpdate(purchase.order, {
        status: "Purchase Completed"
      });
      console.log("✅ Order status updated to Purchase Completed");
    } else if (updatedPurchase.status === "Pending" && wasCompleted) {
      // If purchase was completed but now has no items, set back to Pending Purchase
      await Order.findByIdAndUpdate(purchase.order, {
        status: "Pending Purchase"
      });
      console.log("⚠️ Order status reverted to Pending Purchase");
    }

    // Check if production already exists
    let production = await Production.findOne({ order: purchase.order });

    // Only create/update production if purchase is completed
    if (updatedPurchase.status === "Completed") {
      if (!production) {
        console.log("🔄 Creating production for completed purchase...");
        const productionProducts = transformOrderProductsForProduction(order.products);

        const productionData = {
          order: order._id,
          orderDate: order.orderDate,
          PoNo: order.PoNo,
          orderType: order.orderType,
          buyerCode: order.buyerDetails?.code || "N/A",
          buyerName: order.buyerDetails?.name || "N/A",
          products: productionProducts,
          totalQty: order.totalQty || 0,
          requiredQty: order.totalQty || 0,
          status: "Pending Production",
          purchase: updatedPurchase._id
        };

        // For FOB/Own-Orders
        if (order.orderType === "FOB" || order.orderType === "Own-Orders") {
          productionData.fabricPurchases = updatedPurchase.fabricPurchases || [];
          productionData.accessoriesPurchases = updatedPurchase.accessoriesPurchases || [];
          productionData.totalFabricCost = updatedPurchase.totalFabricCost || 0;
          productionData.totalAccessoriesCost = updatedPurchase.totalAccessoriesCost || 0;
          productionData.totalFabricGst = updatedPurchase.totalFabricGst || 0;
          productionData.totalAccessoriesGst = updatedPurchase.totalAccessoriesGst || 0;
          productionData.grandTotalCost = updatedPurchase.grandTotalCost || 0;
          productionData.grandTotalWithGst = updatedPurchase.grandTotalWithGst || 0;

          if (updatedPurchase.fabricPurchases && updatedPurchase.fabricPurchases.length > 0) {
            const firstFabric = updatedPurchase.fabricPurchases[0];
            productionData.receivedFabric = firstFabric.fabricType;
            productionData.goodsType = firstFabric.productName;
            productionData.color = firstFabric.colors?.join(", ") || "";
          }
        }
        // For JOB-Works
        else if (order.orderType === "JOB-Works") {
          productionData.accessoriesPurchases = updatedPurchase.accessoriesPurchases || [];
          productionData.totalAccessoriesCost = updatedPurchase.totalAccessoriesCost || 0;
          productionData.totalAccessoriesGst = updatedPurchase.totalAccessoriesGst || 0;

          if (order.products && order.products.length > 0) {
            const firstProduct = order.products[0];
            productionData.receivedFabric = firstProduct.productDetails?.fabricType || "N/A";
            productionData.goodsType = firstProduct.productDetails?.name || "";
            productionData.color = firstProduct.productDetails?.color || "";
          }
        }

        production = new Production(productionData);
        await production.save();
        console.log("✅ Production created:", production._id);

        await Order.findByIdAndUpdate(order._id, {
          production: production._id,
          status: "Pending Production"
        });
      }
      else {
        // Update existing production
        console.log("🔄 Updating existing production:", production._id);

        if (updatedPurchase.orderType === "FOB" || updatedPurchase.orderType === "Own-Orders") {
          production.fabricPurchases = updatedPurchase.fabricPurchases || [];
          production.accessoriesPurchases = updatedPurchase.accessoriesPurchases || [];
          production.totalFabricCost = updatedPurchase.totalFabricCost || 0;
          production.totalAccessoriesCost = updatedPurchase.totalAccessoriesCost || 0;
          production.totalFabricGst = updatedPurchase.totalFabricGst || 0;
          production.totalAccessoriesGst = updatedPurchase.totalAccessoriesGst || 0;
          production.grandTotalCost = updatedPurchase.grandTotalCost || 0;
          production.grandTotalWithGst = updatedPurchase.grandTotalWithGst || 0;
        } else {
          production.accessoriesPurchases = updatedPurchase.accessoriesPurchases || [];
          production.totalAccessoriesCost = updatedPurchase.totalAccessoriesCost || 0;
          production.totalAccessoriesGst = updatedPurchase.totalAccessoriesGst || 0;
        }

        await production.save();
        console.log("✅ Production updated with new purchase data");
      }
    } else if (production && updatedPurchase.status === "Pending") {
      console.log("⚠️ Purchase is pending but production exists. Consider if production should be removed.");
    }

    res.json({
      purchase: updatedPurchase,
      production: production || null,
      message: production
        ? "Purchase updated and production created/updated"
        : "Purchase updated - production will be created when completed"
    });
  } catch (err) {
    console.error("❌ Error in updatePurchase:", err.message);
    res.status(400).json({ message: err.message });
  }
};

// @desc    Get single purchase by ID
// @route   GET /api/purchases/:id
export const getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate("order", "PoNo orderType status buyerDetails")
      .populate("fabricPurchases.vendorId", "name code")
      .populate("accessoriesPurchases.vendorId", "name code")
    if (!purchase) return res.status(404).json({ message: "Purchase not found" });
    res.json(purchase);
  } catch (err) {
    console.error("❌ Error in getPurchaseById:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Mark a purchase as completed and update order status
// @route   PATCH /api/purchases/:id/complete
export const completePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id).populate("order");

    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    console.log("🔄 Completing purchase:", purchase._id);

    // Update purchase status first
    purchase.status = "Completed";
    const savedPurchase = await purchase.save();

    console.log("✅ Purchase status updated to Completed:", savedPurchase._id);

    // Update order status
    if (purchase.order) {
      await Order.findByIdAndUpdate(
        purchase.order._id,
        { status: "Purchase Completed" }
      );
      console.log("✅ Order status updated to Purchase Completed");
    }

    res.json({
      message: "Purchase marked as completed successfully",
      purchaseId: savedPurchase._id
    });
  } catch (err) {
    console.error("❌ Error in completePurchase:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete a purchase
// @route   DELETE /api/purchases/:id
export const deletePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    // Remove associated production if exists
    const production = await Production.findOne({ purchase: purchase._id });
    if (production) {
      await Production.findByIdAndDelete(production._id);
      console.log("✅ Associated production deleted:", production._id);
    }

    // Remove reference from order
    if (purchase.order) {
      await Order.findByIdAndUpdate(purchase.order, {
        purchase: null,
        production: null,
        status: "Pending Purchase"
      });
    }

    await Purchase.findByIdAndDelete(req.params.id);
    res.json({ message: "Purchase and associated production deleted successfully" });
  } catch (err) {
    console.error("❌ Error in deletePurchase:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// Search Suppliers for dropdown (autocomplete)
export const searchSuppliers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(200).json([]);
    }

    const suppliers = await Supplier.searchByName(q);

    console.log(`Found ${suppliers.length} suppliers for query: "${q}"`);
    console.log("🔍 Suppliers returned to frontend:", suppliers);
    res.status(200).json(suppliers);
  } catch (error) {
    console.error("❌ Error in searchSuppliers:", error.message);
    res.status(500).json({
      message: "Error searching suppliers",
      error: error.message
    });
  }
};