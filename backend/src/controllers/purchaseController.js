import mongoose from "mongoose";
import Purchase from "../models/purchase.js";
import Product from "../models/products.js";
import Order from "../models/orders.js";
import Production from "../models/production.js"; // Added for completeness

// @desc    Create a new purchase entry (for FOB orders only)
// @route   POST /api/purchases
export const createPurchase = async (req, res) => {
  try {
    const {
      orderId,
      fabricPurchases = [],
      buttonsPurchases = [],
      packetsPurchases = [],
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

    if (order.orderType !== "FOB") {
      return res.status(400).json({ message: "Only FOB orders can have manual purchases" });
    }

    // Validate fabricPurchases structure if provided
    for (const item of fabricPurchases) {
      if (!item.vendor || !item.fabricType || !item.quantity || !item.costPerUnit) {
        return res.status(400).json({ message: "Each fabric purchase requires vendor, fabricType, quantity, and costPerUnit" });
      }
    }

    // Create new purchase based on existing order data
    const newPurchase = new Purchase({
      order: order._id,
      orderDate: order.orderDate,
      PoNo: order.PoNo,
      orderType: order.orderType,
      buyerCode: order.buyerDetails?.code || "N/A",
      orderStatus: order.status || "Pending Purchase",
      products: order.products.map(p => ({
        productName: p.productDetails.name,
        fabricType: p.fabricTypes.map(ft => ft.fabricType).join(", "),
        fabricColor: p.fabricTypes.flatMap(ft => ft.sizes.flatMap(s => s.colors.map(c => c.color))).join(", "),
        sizes: p.fabricTypes.flatMap(ft => 
          ft.sizes.map(s => ({
            size: s.size,
            quantity: s.colors.reduce((sum, col) => sum + col.qty, 0)
          }))
        ),
        productTotalQty: p.fabricTypes.reduce((total, ft) =>
          total + ft.sizes.reduce((sTotal, sz) =>
            sTotal + sz.colors.reduce((cTotal, col) => cTotal + col.qty, 0), 0), 0)
      })),
      totalQty: order.totalQty || 0,
      fabricPurchases,
      buttonsPurchases,
      packetsPurchases,
      remarks: remarks || `Manual purchase for FOB order ${order.PoNo}`,
      status: "Pending",
    });

    const savedPurchase = await newPurchase.save();
    console.log("✅ Manual purchase created:", savedPurchase._id);

    // Link purchase to order
    await Order.findByIdAndUpdate(orderId, {
      purchase: savedPurchase._id,
      status: "Purchase Completed"
    });

    res.status(201).json(savedPurchase);
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
      buttonsPurchases,
      packetsPurchases,
      remarks,
      status,
    } = req.body;

    const purchase = await Purchase.findById(id);
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    // Only allow updates to purchase-specific arrays and status
    if (fabricPurchases !== undefined) purchase.fabricPurchases = fabricPurchases;
    if (buttonsPurchases !== undefined) purchase.buttonsPurchases = buttonsPurchases;
    if (packetsPurchases !== undefined) purchase.packetsPurchases = packetsPurchases;
    if (remarks !== undefined) purchase.remarks = remarks;
    if (status) purchase.status = status;

    const updatedPurchase = await purchase.save();
    console.log("✅ Updated purchase:", updatedPurchase._id);

    // Optionally update order status if purchase is completed
    if (status === "Completed" && purchase.order) {
      await Order.findByIdAndUpdate(purchase.order, { status: "Purchase Completed" });
    }

    res.json(updatedPurchase);
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
      .populate("order", "PoNo orderType status buyerDetails");
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

    // Update purchase status
    purchase.status = "Completed";
    await purchase.save();

    if (purchase.order) {
      const updatedOrder = await Order.findByIdAndUpdate(
        purchase.order._id,
        { status: "Purchase Completed" },
        { new: true }
      );

      // Create production entry if missing
      const existingProduction = await Production.findOne({ order: updatedOrder._id });
      if (!existingProduction) {
        const newProduction = new Production({
          order: updatedOrder._id,
          purchase: purchase._id,
          orderType: updatedOrder.orderType,
          requiredQty: updatedOrder.totalQty || 0,
          currentStage: "Pending Production",
          remarks: `Auto-created after purchase completion`,
        });
        await newProduction.save();
        console.log("✅ Production entry created from completed purchase");
      }

      console.log("✅ Order status updated to Purchase Completed");
    }

    res.json({ message: "Purchase marked as completed successfully" });
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

    // Remove reference from order
    if (purchase.order) {
      await Order.findByIdAndUpdate(purchase.order, { purchase: null, status: "Pending Purchase" });
    }

    await Purchase.findByIdAndDelete(req.params.id);
    res.json({ message: "Purchase deleted successfully" });
  } catch (err) {
    console.error("❌ Error in deletePurchase:", err.message);
    res.status(500).json({ message: err.message });
  }
};