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

    const { PoNo } = req.body;
    if (!PoNo || !PoNo.trim()) {
      return res.status(400).json({ message: "PO Number is required" });
    }

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

      // Check if product exists with same name+style+color+fabricType combination
      const existingProduct = await Product.findOne({
        name: productData.productDetails.name,
        style: productData.productDetails.style,
        color: productData.productDetails.color,
        fabricType: productData.productDetails.fabricType,
      });

      if (existingProduct) {
        product = existingProduct;
        console.log("✅ Using existing product:", product._id);
      } else {
        // Create new product - different combination
        product = new Product({
          name: productData.productDetails.name,
          style: productData.productDetails.style,
          color: productData.productDetails.color,
          fabricType: productData.productDetails.fabricType,
          hsn: "",
          category: "Garment", // Add default category
        });

        const savedProduct = await product.save();
        product = savedProduct;
        console.log("✅ New product variant created:", savedProduct._id);
      }

      const productDetails = {
        name: product.name || productData.productDetails.name,
        style: product.style || productData.productDetails.style,
        color: product.color || productData.productDetails.color,
        fabricType: product.fabricType || productData.productDetails.fabricType,
      };

      const sizes = productData.sizes.map(sizeData => ({
        size: sizeData.size.trim(),
        qty: parseInt(sizeData.qty) || 0,
      }));

      processedProducts.push({
        product: product._id,
        productDetails,
        sizes,
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

    // ✅ FIXED: Update product statistics
    for (const productData of processedProducts) {
      const totalQty = productData.sizes.reduce((sum, size) => sum + size.qty, 0);

      await Product.findByIdAndUpdate(productData.product, {
        $inc: {
          totalOrders: 1,
          totalQuantityOrdered: totalQty
        },
        lastOrderedDate: new Date()
      });
    }

    // ✅ FIXED: Create purchase products structure
    const purchaseProducts = processedProducts.map(p => ({
      product: p.product,  // Include the ObjectId reference
      productDetails: {
        name: p.productDetails.name,
        style: p.productDetails.style,
        color: p.productDetails.color,
        fabricType: p.productDetails.fabricType,
      },
      sizes: p.sizes.map(s => ({
        size: s.size,
        qty: s.qty  // Use 'qty' not 'quantity' to match PurchaseSchema
      })),
      productTotalQty: p.sizes.reduce((sum, s) => sum + s.qty, 0),
    }));

    // Create EMPTY purchase (status = "Pending")
    const newPurchase = new Purchase({
      order: savedOrder._id,
      orderDate: savedOrder.orderDate,
      PoNo: savedOrder.PoNo,
      orderType: savedOrder.orderType,
      buyerCode: savedOrder.buyerDetails.code,
      orderStatus: "Pending Purchase",
      products: purchaseProducts,  // Now matches PurchaseSchema structure
      totalQty: savedOrder.totalQty,
      remarks: `Pending purchase details for ${orderType} order`,
      status: "Pending",
      fabricPurchases: [],
      buttonsPurchases: [],
      packetsPurchases: [],
    });
    const savedPurchase = await newPurchase.save();
    console.log(`✅ ${orderType} Purchase placeholder created:`, savedPurchase._id);

    // Link purchase to order
    await Order.findByIdAndUpdate(savedOrder._id, {
      purchase: savedPurchase._id
    });

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

    if (orderType && ["FOB", "JOB-Works", "Own-Orders"].includes(orderType)) {
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