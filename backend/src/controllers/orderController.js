import Order from "../models/orders.js";
import Buyer from "../models/buyer.js";
import Product from "../models/products.js";
import Purchase from "../models/purchase.js";
import Production from "../models/production.js";


export const getCurrentFinancialYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const fyStart = month >= 3 ? year : year - 1;
  const fyEnd = fyStart + 1;
  return `${String(fyStart).slice(-2)}${String(fyEnd).slice(-2)}`;
};

export const createOrder = async (req, res) => {
  try {
    const {
      orderDate,
      orderType,
      buyer: buyerData,
      products: productsData
    } = req.body;

    const financialYear = getCurrentFinancialYear();
    const lastOrder = await Order.findOne().sort({ createdAt: -1 });
    let nextNumber = 1;
    if (lastOrder?.PoNo) {
      const match = lastOrder.PoNo.match(/PO\/(\d{4})\/(\d+)$/);
      if (match && match[1] === financialYear) {
        nextNumber = parseInt(match[2], 10) + 1;
      }
    }
    const PoNo = `PO/${financialYear}/${String(nextNumber).padStart(4, '0')}`; // e.g., "PO/2526/0001"

    let buyer;
    let buyerDetails;

    if (buyerData._id) {
      buyer = await Buyer.findById(buyerData._id);
      if (!buyer) {
        return res.status(404).json({ message: "Buyer not found" });
      }
      buyerDetails = {
        name: buyer.name,
        code: buyer.code,
        mobile: buyer.mobile,
        gst: buyer.gst,
        email: buyer.email,
        address: buyer.address,
      };
    } else {
      buyer = new Buyer({
        name: buyerData.name,
        mobile: buyerData.mobile,
        gst: buyerData.gst,
        email: buyerData.email,
        address: buyerData.address,
      });

      const savedBuyer = await buyer.save();
      console.log("✅ New buyer created:", savedBuyer._id);

      buyerDetails = {
        name: savedBuyer.name,
        code: savedBuyer.code,
        mobile: savedBuyer.mobile,
        gst: savedBuyer.gst,
        email: savedBuyer.email,
        address: savedBuyer.address,
      };
    }

    const processedProducts = [];

    for (const productData of productsData) {
      let product;
      let productDetails;

      if (productData.product?._id) {
        product = await Product.findById(productData.product._id);
        if (!product) {
          return res.status(400).json({
            message: `Product not found: ${productData.product.name}`
          });
        }
        productDetails = {
          name: product.name,
          hsn: product.hsn,
        };
      } else {
        product = new Product({
          name: productData.productDetails.name,
          hsn: productData.productDetails.hsn,
        });

        const savedProduct = await product.save();
        console.log("✅ New product created:", savedProduct._id);

        productDetails = {
          name: savedProduct.name,
          hsn: savedProduct.hsn,
        };
      }

      const fabricTypes = productData.fabricTypes.map(fabricData => ({
        fabricType: fabricData.fabricType,
        sizes: fabricData.sizes.map(sizeData => ({
          size: sizeData.size.trim(),
          colors: sizeData.colors.map(colorData => ({
            color: colorData.color,
            qty: parseInt(colorData.qty) || 0,
          })),
        })),
      }));

      processedProducts.push({
        product: product._id,
        productDetails,
        fabricTypes,
      });
    }

    const order = new Order({
      orderDate: new Date(orderDate),
      PoNo,
      orderType,
      buyer: buyer._id,
      buyerDetails,
      products: processedProducts,
    });

    const savedOrder = await order.save();
    console.log("✅ New order created:", savedOrder._id);

    await Buyer.findByIdAndUpdate(buyer._id, {
      $inc: { totalOrders: 1 },
      lastOrderDate: new Date()
    });

    for (const productData of processedProducts) {
      let totalQty = 0;
      productData.fabricTypes.forEach(fabric => {
        fabric.sizes.forEach(size => {
          size.colors.forEach(color => {
            totalQty += color.qty;
          });
        });
      });

      await Product.findByIdAndUpdate(productData.product, {
        $inc: {
          totalOrders: 1,
          totalQuantityOrdered: totalQty
        },
        lastOrderedDate: new Date()
      });
    }

    // In orderController.js - Replace the auto-purchase creation section

    // Auto-create EMPTY Purchase entry for BOTH FOB and JOB-Works orders
    // This creates a placeholder that will be filled when user completes the purchase form
    const purchaseProductsMap = new Map();

    for (const product of processedProducts) {
      const productName = product.productDetails.name;

      if (!purchaseProductsMap.has(productName)) {
        purchaseProductsMap.set(productName, {
          productName: productName,
          fabricType: orderType === "JOB-Works" ? "N/A" : null,
          colors: new Map(),
          productTotalQty: 0
        });
      }

      const productEntry = purchaseProductsMap.get(productName);

      product.fabricTypes.forEach(fabricType => {
        if (orderType !== "JOB-Works" && !productEntry.fabricType) {
          productEntry.fabricType = fabricType.fabricType;
        }

        fabricType.sizes.forEach(size => {
          size.colors.forEach(color => {
            if (!productEntry.colors.has(color.color)) {
              productEntry.colors.set(color.color, []);
            }

            productEntry.colors.get(color.color).push({
              size: size.size,
              quantity: color.qty
            });

            productEntry.productTotalQty += color.qty;
          });
        });
      });
    }

    // Convert map to array with proper nested structure
    const purchaseProducts = Array.from(purchaseProductsMap.values()).map(entry => ({
      productName: entry.productName,
      fabricType: entry.fabricType || "N/A",
      colors: Array.from(entry.colors.entries()).map(([color, sizes]) => ({
        color: color,
        sizes: sizes
      })),
      productTotalQty: entry.productTotalQty,
    }));

    // Create EMPTY purchase (status = "Pending")
    // This will be updated when user fills the purchase form
    const newPurchase = new Purchase({
      order: savedOrder._id,
      orderDate: savedOrder.orderDate,
      PoNo: savedOrder.PoNo,
      orderType: savedOrder.orderType,
      buyerCode: savedOrder.buyerDetails.code,
      orderStatus: "Pending Purchase",
      products: purchaseProducts,
      totalQty: savedOrder.totalQty,
      remarks: `Pending purchase details for ${orderType} order`,
      status: "Pending", // ALWAYS start as Pending
      // Leave these arrays empty - user will fill them
      fabricPurchases: [],
      buttonsPurchases: [],
      packetsPurchases: [],
    });

    const savedPurchase = await newPurchase.save();
    console.log(`✅ ${orderType} Purchase placeholder created:`, savedPurchase._id, "- Status: Pending");

    // Link purchase to order
    await Order.findByIdAndUpdate(savedOrder._id, {
      purchase: savedPurchase._id
    });

    // DON'T create production here - it will be created when purchase is completed

    // Populate and return
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate("buyer", "name code mobile gst email")
      .populate("products.product", "name hsn")
      .populate("purchase")
      .populate("production");

    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error("❌ Error in createOrder:", error.message);
    res.status(500).json({
      message: "Error creating order",
      error: error.message
    });
  }
};

// Get all Orders with filtering and search
export const getOrders = async (req, res) => {
  try {
    const {
      orderType,
      status,
      buyerName,
      PoNo,
      page = 1,
      limit = 50
    } = req.query;

    const filter = {};

    if (orderType && ["FOB", "JOB-Works"].includes(orderType)) {
      filter.orderType = orderType;
    }

    if (status) {
      filter.status = status;
    }

    if (PoNo) {
      filter.PoNo = new RegExp(PoNo, 'i');
    }

    let query = Order.find(filter)
      .populate("buyer", "name code mobile gst company")
      .populate("products.product", "name hsn category")
      .sort({ createdAt: -1 });

    if (buyerName) {
      const buyers = await Buyer.find({
        name: new RegExp(buyerName, 'i')
      }).select('_id');

      if (buyers.length > 0) {
        filter.buyer = { $in: buyers.map(b => b._id) };
      }
    }

    const skip = (page - 1) * limit;
    const orders = await query.skip(skip).limit(parseInt(limit));
    const total = await Order.countDocuments(filter);

    console.log(`Fetched ${orders.length} orders`);

    res.status(200).json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("❌ Error in getOrders:", error.message);
    res.status(500).json({
      message: "Error fetching orders",
      error: error.message
    });
  }
};

// Get Single Order
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("buyer", "name code mobile gst email")
      .populate("products.product")
      .populate("purchase")
      .populate("production")
      .populate("invoice");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    console.log("Fetched order:", order._id);
    res.status(200).json(order);
  } catch (error) {
    console.error("❌ Error in getOrderById:", error.message);
    res.status(500).json({
      message: "Error fetching order",
      error: error.message
    });
  }
};

// Update Order
export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (updateData.buyer && updateData.buyerDetails) {
      const buyer = await Buyer.findById(updateData.buyer);
      if (!buyer) {
        return res.status(404).json({ message: "Buyer not found" });
      }
      order.buyerDetails = {
        name: updateData.buyerDetails.name,
        code: buyer.code,
        mobile: updateData.buyerDetails.mobile,
        gst: updateData.buyerDetails.gst,
        email: updateData.buyerDetails.email,
        address: updateData.buyerDetails.address,
      };
      if (updateData.buyer !== order.buyer.toString()) {
        order.buyer = updateData.buyer;
      }
    }

    if (updateData.products) {
      order.products = updateData.products;
    }

    const allowedUpdates = ['orderDate', 'PoNo', 'orderType', 'status'];
    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        order[field] = updateData[field];
      }
    });

    const updatedOrder = await order.save();

    const populatedOrder = await Order.findById(updatedOrder._id)
      .populate("buyer", "name code mobile gst")
      .populate("products.product", "name hsn");

    console.log("Updated order:", order._id);
    res.status(200).json(populatedOrder);
  } catch (error) {
    console.error("❌ Error in updateOrder:", error.message);
    res.status(500).json({
      message: "Error updating order",
      error: error.message
    });
  }
};

// Update Order Status
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "Pending Purchase",
      "Purchase Completed",
      "Pending Production",
      "Factory Received",
      "In Production",
      "Production Completed",
      "Ready for Delivery",
      "Delivered",
      "Completed"
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
        validStatuses
      });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("buyer", "name code mobile");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    console.log(`Updated order status: ${id} -> ${status}`);
    res.status(200).json({ message: "Order status updated", order });
  } catch (error) {
    console.error("❌ Error in updateOrderStatus:", error.message);
    res.status(500).json({
      message: "Error updating order status",
      error: error.message
    });
  }
};

// Delete Order
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    await Purchase.findOneAndDelete({ order: id });
    await Production.findOneAndDelete({ order: id });

    await Order.findByIdAndDelete(id);

    console.log("Deleted order & related documents:", id);
    res.status(200).json({
      message: "Order and related documents deleted successfully"
    });
  } catch (error) {
    console.error("❌ Error in deleteOrder:", error.message);
    res.status(500).json({
      message: "Error deleting order",
      error: error.message
    });
  }
};

// Get Orders by Buyer
export const getOrdersByBuyer = async (req, res) => {
  try {
    const { buyerId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const orders = await Order.find({ buyer: buyerId })
      .populate("buyer", "name code mobile gst")
      .populate("products.product", "name hsn")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments({ buyer: buyerId });

    console.log(`Fetched ${orders.length} orders for buyer:`, buyerId);

    res.status(200).json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("❌ Error in getOrdersByBuyer:", error.message);
    res.status(500).json({
      message: "Error fetching buyer orders",
      error: error.message
    });
  }
};

// Search Buyers for dropdown (autocomplete)
export const searchBuyers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(200).json([]);
    }

    const buyers = await Buyer.searchByName(q);
    console.log(`Found ${buyers.length} buyers for query: "${q}"`);

    res.status(200).json(buyers);
  } catch (error) {
    console.error("❌ Error in searchBuyers:", error.message);
    res.status(500).json({
      message: "Error searching buyers",
      error: error.message
    });
  }
};

// Search Products for dropdown (autocomplete)
export const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(200).json([]);
    }

    const products = await Product.searchByName(q);
    console.log(`Found ${products.length} products for query: "${q}"`);

    res.status(200).json(products);
  } catch (error) {
    console.error("❌ Error in searchProducts:", error.message);
    res.status(500).json({
      message: "Error searching products",
      error: error.message
    });
  }
};

// Get Product Configuration
export const getProductConfiguration = async (req, res) => {
  try {
    const { productId, fabricType } = req.query;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const configuration = product.getConfigurationForFabric(fabricType);

    res.status(200).json({
      productId,
      fabricType: fabricType || 'default',
      ...configuration
    });
  } catch (error) {
    console.error("❌ Error in getProductConfiguration:", error.message);
    res.status(500).json({
      message: "Error fetching product configuration",
      error: error.message
    });
  }
};