import Order from "../models/orders.js";
import Buyer from "../models/buyer.js";
import Product from "../models/products.js";
import Purchase from "../models/purchase.js";
import Production from "../models/production.js";

import { pdfService } from "../services/pdfService.js";
import { cloudinaryService } from "../services/cloudinaryService.js";

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

    // ✅ DEBUG: Log incoming data structure
    console.log("📥 Received order data:");
    console.log("Products array:", JSON.stringify(productsData, null, 2));
    console.log("First product:", productsData[0]);
    console.log("First product.productDetails type:", typeof productsData[0]?.productDetails);
    console.log("First product.productDetails:", productsData[0]?.productDetails);

    const { PoNo } = req.body;
    if (!PoNo || !PoNo.trim()) {
      return res.status(400).json({ message: "PO Number is required" });
    }

    // ✅ Validate products data structure
    if (!Array.isArray(productsData) || productsData.length === 0) {
      return res.status(400).json({ message: "Products array is required" });
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
      // ✅ Validate productData structure
      if (!productData.productDetails) {
        return res.status(400).json({
          message: "Each product must have productDetails"
        });
      }

      let product;

      // Find or create product
      const existingProduct = await Product.findOrCreateProduct({
        name: productData.productDetails.name,
        category: productData.productDetails.category || "Garment",
        type: Array.isArray(productData.productDetails.type)
          ? productData.productDetails.type
          : [],
        style: Array.isArray(productData.productDetails.style)
          ? productData.productDetails.style
          : [],
        fabric: productData.productDetails.fabric,
        color: productData.productDetails.color,
      });

      product = existingProduct;
      console.log(`✅ Using/Created product:`, product._id);

      // ✅ CRITICAL FIX: Ensure productDetails is an OBJECT, not an array
      const productDetails = {
        category: productData.productDetails.category || product.category || "",
        name: productData.productDetails.name || product.name || "",
        type: Array.isArray(productData.productDetails.type)
          ? productData.productDetails.type
          : (product.type || []),
        style: Array.isArray(productData.productDetails.style)
          ? productData.productDetails.style
          : (product.style || []),
        fabric: productData.productDetails.fabric || product.fabric || "",
        color: productData.productDetails.color || product.color || "",
      };

      // ✅ Validate sizes
      if (!Array.isArray(productData.sizes) || productData.sizes.length === 0) {
        return res.status(400).json({
          message: `Product "${productDetails.name}" must have at least one size`
        });
      }

      const sizes = productData.sizes.map(sizeData => ({
        size: sizeData.size.trim(),
        qty: parseInt(sizeData.qty) || 0,
      }));

      // ✅ Push correctly structured product
      processedProducts.push({
        product: product._id,
        productDetails: productDetails, // This is an OBJECT
        sizes: sizes,
      });
    }

    console.log("🔍 FINAL CHECK before creating Order:");
    console.log("processedProducts structure:");
    processedProducts.forEach((p, i) => {
      console.log(`Product ${i}:`);
      console.log(`  - product ID: ${p.product}`);
      console.log(`  - productDetails type: ${typeof p.productDetails}`);
      console.log(`  - productDetails is array?: ${Array.isArray(p.productDetails)}`);
      console.log(`  - productDetails value:`, JSON.stringify(p.productDetails, null, 2));
      console.log(`  - type field:`, p.productDetails.type);
      console.log(`  - style field:`, p.productDetails.style);
    });

    // If productDetails is somehow an array, this will catch it:
    processedProducts.forEach((p, i) => {
      if (Array.isArray(p.productDetails)) {
        console.error(`❌ ERROR: Product ${i} has productDetails as ARRAY!`);
        console.error(`This should be an OBJECT, not an array!`);
        throw new Error("productDetails must be an object, not an array");
      }
    });

    // ✅ Create order with validated data
    const order = new Order({
      orderDate: new Date(orderDate),
      PoNo,
      orderType,
      buyer: buyer._id,
      buyerDetails,
      products: processedProducts, // Array of products with object productDetails
    });

    const savedOrder = await order.save();
    console.log("✅ New order created:", savedOrder._id);
    console.log("✅ Global Order Serial:", savedOrder.orderId);

    // Update buyer statistics
    await Buyer.findByIdAndUpdate(buyer._id, {
      $inc: { totalOrders: 1 },
      lastOrderDate: new Date()
    });

    // Update product statistics
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

    // Create purchase products structure
    const purchaseProducts = processedProducts.map(p => ({
      product: p.product,
      productDetails: {
        category: p.productDetails.category,
        name: p.productDetails.name,
        type: p.productDetails.type,
        style: p.productDetails.style,
        fabric: p.productDetails.fabric,
        color: p.productDetails.color,
      },
      sizes: p.sizes.map(s => ({
        size: s.size,
        qty: s.qty
      })),
      productTotalQty: p.sizes.reduce((sum, s) => sum + s.qty, 0),
    }));

    // Create EMPTY purchase
    const newPurchase = new Purchase({
      order: savedOrder._id,
      orderId: savedOrder.orderId,
      orderDate: savedOrder.orderDate,
      PoNo: savedOrder.PoNo,
      purchaseDate: null, 
      orderType: savedOrder.orderType,
      buyerCode: savedOrder.buyerDetails.code,
      orderStatus: "Pending Purchase",
      products: purchaseProducts,
      totalQty: savedOrder.totalQty,
      remarks: `Pending purchase details for ${orderType} order`,
      status: "Pending",
      fabricPurchases: [],
      buttonsPurchases: [],
      packetsPurchases: [],
    });

    const savedPurchase = await newPurchase.save();
    console.log(`✅ ${orderType} Purchase placeholder created:`, savedPurchase._id);
    console.log(`✅ Purchase Date set to: ${savedPurchase.purchaseDate}`);

    // Link purchase to order
    await Order.findByIdAndUpdate(savedOrder._id, {
      purchase: savedPurchase._id
    });

    try {
      const pdfResult = await pdfService.generateOrderPDF(savedOrder);
      savedOrder.pdfUrl = pdfResult.url;
      savedOrder.pdfPublicId = pdfResult.publicId;
      await savedOrder.save();
      console.log("✅ Order PDF generated:", pdfResult.url);
    } catch (pdfError) {
      console.error("❌ Order PDF generation failed:", pdfError);
      // Order is still saved, just without PDF
    }

    // Populate and return
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate("buyer", "name code mobile gst email")
      .populate("products.product", "name hsn")
      .populate("purchase")
      .populate("production");

    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error("❌ Error in createOrder:", error.message);
    console.error("❌ Full error:", error);
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

// Generate/Regenerate Order PDF
export const generateOrderPDF = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate("buyer", "name code mobile gst email address company")
      .populate("products.product", "name hsn");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Delete existing PDF if any
    if (order.pdfPublicId) {
      try {
        await cloudinaryService.deletePDF(order.pdfPublicId);
        console.log("✅ Old PDF deleted");
      } catch (error) {
        console.error("❌ Failed to delete old PDF:", error);
      }
    }

    // Generate new PDF
    console.log(`📄 Generating PDF for Order: ${order.orderId}`);
    const pdfResult = await pdfService.generateOrderPDF(order);

    // Update order with PDF details
    order.pdfUrl = pdfResult.url;
    order.pdfPublicId = pdfResult.publicId;
    await order.save();

    console.log("✅ Order PDF generated successfully:", pdfResult.url);

    res.json({
      message: "Order PDF generated successfully",
      pdfUrl: pdfResult.url,
      order: {
        _id: order._id,
        orderId: order.orderId,
        PoNo: order.PoNo,
        orderType: order.orderType
      }
    });
  } catch (error) {
    console.error("❌ Error generating Order PDF:", error);
    res.status(500).json({
      message: "Error generating Order PDF",
      error: error.message
    });
  }
};

// Download Order PDF
export const downloadOrderPDF = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (!order.pdfUrl) {
      // Generate PDF on demand
      const populatedOrder = await Order.findById(id)
        .populate("buyer", "name code mobile gst email address company")
        .populate("products.product", "name hsn");

      const pdfResult = await pdfService.generateOrderPDF(populatedOrder);
      order.pdfUrl = pdfResult.url;
      order.pdfPublicId = pdfResult.publicId;
      await order.save();

      console.log("✅ PDF generated on-demand for order:", order.orderId);
    }

    // Redirect to PDF URL
    res.redirect(order.pdfUrl);
  } catch (error) {
    console.error("❌ Error downloading Order PDF:", error);
    res.status(500).json({
      message: "Error downloading Order PDF",
      error: error.message
    });
  }
};