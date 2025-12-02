// controllers/purchaseEstimationController.js
import mongoose from "mongoose";
import PurchaseEstimation from "../models/PurchaseEstimationSchema.js";
import Order from "../models/orders.js";
import Supplier from "../models/supplier.js";
import Purchase from "../models/purchase.js"; 
import { pdfService } from "../services/pdfService.js";
import { cloudinaryService } from "../services/cloudinaryService.js";

const transformOrderProductsForEstimation = (orderProducts) => {
  console.log('\n🔄 SERVER: Transforming order products for estimation...');
  
  return orderProducts.map((p, index) => {
    console.log(`\n📦 SERVER: Processing product ${index + 1}:`, {
      productName: p.productDetails?.name || p.productName,
      fabricType: p.productDetails?.fabric || p.fabricType,
      style: p.productDetails?.style || p.style
    });

    const productName = p.productDetails?.name || p.productName || "Unknown Product";

    
    const fabricType =
      p.productDetails?.fabric ||
      p.productDetails?.fabricType ||
      p.fabricType ||
      "N/A";

    
    let style = p.productDetails?.style || p.style || "";
    
    console.log(`   📝 SERVER: Original style value:`, style);
    console.log(`   📝 SERVER: Style is array?:`, Array.isArray(style));
    
    if (Array.isArray(style)) {
      style = style.join(", "); // Convert ["Cut & Sew", "F/s"] → "Cut & Sew, F/s"
      console.log(`   ✅ SERVER: Converted style array to string:`, style);
    }
    
    console.log(`   ✅ SERVER: Final style value (string):`, style);

    const colorMap = new Map();
    if (p.sizes && Array.isArray(p.sizes)) {
      const productColor = p.productDetails?.color || p.color || "N/A";
      p.sizes.forEach(sizeEntry => {
        if (!colorMap.has(productColor)) {
          colorMap.set(productColor, []);
        }
        colorMap.get(productColor).push({
          size: sizeEntry.size,
          quantity: sizeEntry.qty || sizeEntry.quantity || 0
        });
      });
    }

    if (colorMap.size === 0 && p.fabricTypes && Array.isArray(p.fabricTypes)) {
      p.fabricTypes.forEach(fabricType => {
        fabricType.sizes?.forEach(sizeEntry => {
          sizeEntry.colors?.forEach(colorEntry => {
            if (!colorMap.has(colorEntry.color)) {
              colorMap.set(colorEntry.color, []);
            }
            colorMap.get(colorEntry.color).push({
              size: sizeEntry.size,
              quantity: colorEntry.qty || 0
            });
          });
        });
      });
    }

    const colors = Array.from(colorMap.entries()).map(([color, sizes]) => ({
      color: color,
      sizes: sizes
    }));

    const productTotalQty = colors.reduce((total, colorGroup) =>
      total + (colorGroup.sizes?.reduce((sum, s) => sum + (s.quantity || 0), 0) || 0), 0
    );

    const transformedProduct = {
      productName: productName,
      fabricType: fabricType,
      style: style, 
      colors: colors,
      productTotalQty: productTotalQty
    };

    console.log(`   🎯 SERVER: Transformed product:`, JSON.stringify(transformedProduct, null, 2));

    return transformedProduct;
  });
};


// @desc    Search Orders by PoNo for dropdown
// @route   GET /api/purchase-estimations/search/orders
export const searchOrders = async (req, res) => {
  try {
    console.log('\n🔍 SERVER: searchOrders called');
    const { q } = req.query;
    console.log(`📝 SERVER: Search query: "${q}"`);

    if (!q || q.length < 2) {
      console.log('⚠️  SERVER: Query too short, returning empty array');
      return res.status(200).json([]);
    }

    const orders = await Order.find({
      PoNo: new RegExp(q, 'i')
    })
      .select('PoNo orderDate orderType buyerDetails totalQty status')
      .limit(10)
      .lean();

    console.log(`✅ SERVER: Found ${orders.length} orders`);

    const results = orders.map(order => ({
      _id: order._id,
      PoNo: order.PoNo,
      buyerName: order.buyerDetails?.name || "N/A",
      buyerCode: order.buyerDetails?.code || "N/A",
      orderDate: order.orderDate,
      orderType: order.orderType,
      totalQty: order.totalQty,
      status: order.status
    }));

    console.log('📤 SERVER: Sending results:', JSON.stringify(results, null, 2));
    res.status(200).json(results);
  } catch (error) {
    console.error("❌ SERVER ERROR in searchOrders:", error.message);
    res.status(500).json({
      message: "Error searching orders",
      error: error.message
    });
  }
};

// @desc    Get Order Details by PoNo for estimation form
// @route   GET /api/purchase-estimations/order/:PoNo
export const getOrderByPoNo = async (req, res) => {
  try {
    console.log('\n🔍 SERVER: getOrderByPoNo called');
    const { PoNo } = req.params;
    console.log(`📝 SERVER: Fetching order with PoNo: "${PoNo}"`);

    const order = await Order.findOne({ PoNo })
      .populate("buyer", "name code mobile gst email address")
      .populate("products.product", "name hsn")
      .lean();

    if (!order) {
      console.log('❌ SERVER: Order not found');
      return res.status(404).json({ message: "Order not found" });
    }

    console.log('✅ SERVER: Order found, transforming products...');
    const estimationProducts = transformOrderProductsForEstimation(order.products);

    const orderDetails = {
      _id: order._id,
      PoNo: order.PoNo,
      orderDate: order.orderDate,
      orderType: order.orderType,
      buyerDetails: order.buyerDetails,
      products: estimationProducts,
      totalQty: order.totalQty,
      status: order.status
    };

    console.log('📤 SERVER: Sending order details');
    res.status(200).json(orderDetails);
  } catch (error) {
    console.error("❌ SERVER ERROR in getOrderByPoNo:", error.message);
    res.status(500).json({
      message: "Error fetching order details",
      error: error.message
    });
  }
};

// @desc    Create a new purchase estimation
// @route   POST /api/purchase-estimations
export const createPurchaseEstimation = async (req, res) => {
  try {
    console.log('\n🚀 ========== CREATE PURCHASE ESTIMATION START ==========');
    console.log('📥 SERVER: Received POST /api/purchase-estimations');
    console.log('📦 SERVER: Request body:', JSON.stringify(req.body, null, 2));

    const {
      orderId,
      PoNo,
      purchaseItems = [],
      fabricCostEstimation = [],
      remarks,
      estimationDate,
    } = req.body;

    console.log('\n📊 SERVER: Extracted data:');
    console.log(`   orderId: ${orderId}`);
    console.log(`   PoNo: ${PoNo}`);
    console.log(`   purchaseItems count: ${purchaseItems.length}`);
    console.log(`   estimationDate: ${estimationDate}`);
    console.log(`   remarks: ${remarks}`);

    // More detailed validation
    console.log('\n🔍 SERVER: Starting validation...');
    
    if (!purchaseItems || purchaseItems.length === 0) {
      console.log('❌ SERVER VALIDATION FAILED: purchaseItems is empty or undefined');
      console.log('   purchaseItems value:', purchaseItems);
      return res.status(400).json({
        message: "At least one purchase item is required"
      });
    }

    console.log(`✅ SERVER: purchaseItems array has ${purchaseItems.length} items`);

    // Check if each purchase item has valid data
    for (let i = 0; i < purchaseItems.length; i++) {
      const item = purchaseItems[i];
      console.log(`\n🔎 SERVER: Validating item ${i + 1}/${purchaseItems.length}:`);
      console.log('   Item data:', JSON.stringify(item, null, 2));

      if (!item.vendor) {
        console.log(`❌ SERVER VALIDATION FAILED: Item ${i + 1} - vendor is missing`);
        return res.status(400).json({
          message: `Vendor is required for purchase item ${i + 1}`
        });
      }
      console.log(`   ✓ Vendor: "${item.vendor}"`);

      if (!item.items || item.items.length === 0) {
        console.log(`❌ SERVER VALIDATION FAILED: Item ${i + 1} - has no item rows`);
        return res.status(400).json({
          message: `Purchase item ${i + 1} must have at least one item row`
        });
      }
      console.log(`   ✓ Has ${item.items.length} item rows`);

      for (let j = 0; j < item.items.length; j++) {
        const row = item.items[j];
        console.log(`   🔎 Row ${j + 1}:`, {
          itemName: row.itemName,
          quantity: row.quantity,
          costPerUnit: row.costPerUnit
        });

        if (!row.itemName || !row.quantity || !row.costPerUnit) {
          console.log(`❌ SERVER VALIDATION FAILED: Item ${i + 1}, Row ${j + 1} - missing required fields`);
          console.log('      Missing:', {
            itemName: !row.itemName,
            quantity: !row.quantity,
            costPerUnit: !row.costPerUnit
          });
          return res.status(400).json({
            message: `Item name, quantity, and cost per unit are required for item ${i + 1}, row ${j + 1}`
          });
        }
        console.log(`   ✓ Row ${j + 1} valid`);
      }

      if (item.vendorId && !mongoose.Types.ObjectId.isValid(item.vendorId)) {
        console.log(`❌ SERVER VALIDATION FAILED: Invalid supplier ID format: ${item.vendorId}`);
        return res.status(400).json({ message: "Invalid supplier ID format" });
      }
      if (item.vendorId) {
        console.log(`   ✓ vendorId: ${item.vendorId}`);
      }
    }

    console.log('\n✅ SERVER: All validation checks passed!');

    let estimationData = {
      estimationDate: estimationDate || Date.now(),
      remarks: remarks || "",
      status: "Draft",
      purchaseItems,
      fabricCostEstimation,
    };

    // If order is referenced, fetch and attach order details
    if (orderId || PoNo) {
      console.log('\n🔍 SERVER: Fetching order details...');
      let order;
      if (orderId) {
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
          console.log('❌ SERVER: Invalid order ID format');
          return res.status(400).json({ message: "Invalid order ID format" });
        }
        order = await Order.findById(orderId).populate("buyer").lean();
      } else {
        order = await Order.findOne({ PoNo }).populate("buyer").lean();
      }

      if (!order) {
        console.log('❌ SERVER: Order not found');
        return res.status(404).json({ message: "Order not found" });
      }

      console.log(`✅ SERVER: Order found - ${order.PoNo}`);
      const orderProducts = transformOrderProductsForEstimation(order.products);

      estimationData = {
        ...estimationData,
        order: order._id,
        PoNo: order.PoNo,
        orderDate: order.orderDate,
        orderType: order.orderType,
        buyerDetails: order.buyerDetails,
        orderProducts: orderProducts,
        totalOrderQty: order.totalQty,
      };
    }

    console.log('\n💾 SERVER: Creating new estimation...');
    console.log('   Estimation data:', JSON.stringify(estimationData, null, 2));

    // Create new purchase estimation
    const newEstimation = new PurchaseEstimation(estimationData);
    const savedEstimation = await newEstimation.save();

    console.log("✅ SERVER: Purchase Estimation created successfully!");
    console.log(`   PESNo: ${savedEstimation.PESNo}`);
    console.log(`   ID: ${savedEstimation._id}`);

   
    if (savedEstimation.order) {
      console.log('\n🔗 SERVER: Updating related Purchase document...');
      const purchase = await Purchase.findOne({ order: savedEstimation.order });

      if (purchase) {
        purchase.purchaseEstimation = savedEstimation._id;
        purchase.PESNo = savedEstimation.PESNo;
        purchase.estimationDate = savedEstimation.estimationDate;
        await purchase.save();

        console.log(`✅ SERVER: Updated Purchase ${purchase.PURNo} with PESNo: ${savedEstimation.PESNo}`);
      } else {
        console.log("⚠️  SERVER: No Purchase document found for this order");
      }
    }

    console.log('\n📤 SERVER: Sending success response');
    console.log('🚀 ========== CREATE PURCHASE ESTIMATION END ==========\n');

    res.status(201).json({
      message: "Purchase estimation created successfully",
      estimation: savedEstimation
    });
  } catch (err) {
    console.error("\n❌ SERVER FATAL ERROR in createPurchaseEstimation:");
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    console.error("Stack trace:", err.stack);

    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      console.error("Validation errors:", errors);
      return res.status(400).json({
        message: "Validation failed",
        errors: errors
      });
    }

    res.status(400).json({ message: err.message });
  }
};

// @desc    Get all purchase estimations with filtering
// @route   GET /api/purchase-estimations
export const getPurchaseEstimations = async (req, res) => {
  try {
    console.log('\n🔍 SERVER: getPurchaseEstimations called');
    const { status, PoNo } = req.query;
    console.log('   Query params:', { status, PoNo });

    const filter = {};

    if (status && ["Draft", "Finalized"].includes(status)) {
      filter.status = status;
    }

    if (PoNo) {
      filter.PoNo = new RegExp(PoNo, 'i');
    }

    const estimations = await PurchaseEstimation.find(filter)
      .populate("order", "PoNo orderType status")
      .populate("purchaseItems.vendorId", "name code")
      .sort({ createdAt: -1 });

    console.log(`✅ SERVER: Fetched ${estimations.length} estimations`);
    res.json(estimations);
  } catch (err) {
    console.error("❌ SERVER ERROR in getPurchaseEstimations:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get single purchase estimation by ID
// @route   GET /api/purchase-estimations/:id
export const getPurchaseEstimationById = async (req, res) => {
  try {
    console.log('\n🔍 SERVER: getPurchaseEstimationById called');
    console.log('   ID:', req.params.id);

    const estimation = await PurchaseEstimation.findById(req.params.id)
      .populate("order", "PoNo orderType status buyerDetails products")
      .populate("purchaseItems.vendorId", "name code mobile");

    if (!estimation) {
      console.log('❌ SERVER: Estimation not found');
      return res.status(404).json({ message: "Purchase Estimation not found" });
    }

    console.log(`✅ SERVER: Found estimation ${estimation.PESNo}`);
    res.json(estimation);
  } catch (err) {
    console.error("❌ SERVER ERROR in getPurchaseEstimationById:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get next available PESNo
// @route   GET /api/purchase-estimations/next-pes-no
export const getNextPESNo = async (req, res) => {
  try {
    console.log('\n🔍 SERVER: getNextPESNo called');
    const { peekNextSequence } = await import("../utils/counterUtils.js");
    const seqNumber = await peekNextSequence("purchaseEstimationSeq");
    const PESNo = `PES-${String(seqNumber).padStart(4, "0")}`;

    console.log("✅ SERVER: Peeked next PESNo (not incremented):", PESNo);

    res.status(200).json({ PESNo });
  } catch (error) {
    console.error("❌ SERVER ERROR in getNextPESNo:", error.message);
    res.status(500).json({
      message: "Error generating PESNo",
      error: error.message
    });
  }
};

// @desc    Update a purchase estimation
// @route   PUT /api/purchase-estimations/:id
export const updatePurchaseEstimation = async (req, res) => {
  try {
    console.log('\n🔄 SERVER: updatePurchaseEstimation called');
    console.log('   ID:', req.params.id);
    console.log('   Update data:', JSON.stringify(req.body, null, 2));

    const { id } = req.params;
    const {
      purchaseItems,
      fabricCostEstimation,
      remarks,
      estimationDate,
      status,
    } = req.body;

    const estimation = await PurchaseEstimation.findById(id);
    if (!estimation) {
      console.log('❌ SERVER: Estimation not found');
      return res.status(404).json({ message: "Purchase Estimation not found" });
    }

    // Update fields
    if (purchaseItems !== undefined) {
      // Validate purchase items
      for (const item of purchaseItems) {
        if (!item.vendor || !item.items || item.items.length === 0) {
          console.log('❌ SERVER: Invalid purchase items in update');
          return res.status(400).json({
            message: "Each purchase item requires vendor and at least one item row"
          });
        }
      }
      estimation.purchaseItems = purchaseItems;
    }

    if (fabricCostEstimation !== undefined) {
      estimation.fabricCostEstimation = fabricCostEstimation;
    }

    if (remarks !== undefined) estimation.remarks = remarks;
    if (estimationDate !== undefined) estimation.estimationDate = estimationDate;
    if (status !== undefined) estimation.status = status;

    const updatedEstimation = await estimation.save();
    console.log("✅ SERVER: Updated purchase estimation:", updatedEstimation.PESNo);

   
    if (updatedEstimation.order && estimationDate !== undefined) {
      const purchase = await Purchase.findOne({ order: updatedEstimation.order });

      if (purchase) {
        purchase.estimationDate = updatedEstimation.estimationDate;
        await purchase.save();
        console.log(`✅ SERVER: Updated Purchase ${purchase.PURNo} estimation date`);
      }
    }

    res.json({
      message: "Purchase Estimation updated successfully",
      estimation: updatedEstimation
    });
  } catch (err) {
    console.error("❌ SERVER ERROR in updatePurchaseEstimation:", err.message);

    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        message: "Validation failed",
        errors: errors
      });
    }

    res.status(400).json({ message: err.message });
  }
};

// @desc    Delete a purchase estimation
// @route   DELETE /api/purchase-estimations/:id
export const deletePurchaseEstimation = async (req, res) => {
  try {
    console.log('\n🗑️  SERVER: deletePurchaseEstimation called');
    console.log('   ID:', req.params.id);

    const estimation = await PurchaseEstimation.findById(req.params.id);
    if (!estimation) {
      console.log('❌ SERVER: Estimation not found');
      return res.status(404).json({ message: "Purchase Estimation not found" });
    }

    // Delete PDF from Cloudinary if exists
    if (estimation.pdfPublicId) {
      await cloudinaryService.deletePDF(estimation.pdfPublicId);
      console.log("✅ SERVER: PDF deleted from Cloudinary:", estimation.pdfPublicId);
    }

   
    if (estimation.order) {
      const purchase = await Purchase.findOne({ order: estimation.order });

      if (purchase) {
        purchase.purchaseEstimation = null;
        purchase.PESNo = "N/A";
        purchase.estimationDate = null;
        await purchase.save();
        console.log(`✅ SERVER: Reset PESNo to N/A in Purchase ${purchase.PURNo}`);
      }
    }

    // Now delete the estimation
    await PurchaseEstimation.findByIdAndDelete(req.params.id);
    console.log('✅ SERVER: Estimation deleted');
    res.json({ message: "Purchase Estimation deleted successfully" });
  } catch (err) {
    console.error("❌ SERVER ERROR in deletePurchaseEstimation:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get or Generate PDF for purchase estimation
// @route   GET /api/purchase-estimations/:id/pdf
export const getEstimationPDF = async (req, res) => {
  try {
    console.log('\n📄 SERVER: getEstimationPDF called');
    console.log('   ID:', req.params.id);

    const estimation = await PurchaseEstimation.findById(req.params.id);

    if (!estimation) {
      console.log('❌ SERVER: Estimation not found');
      return res.status(404).json({ message: "Purchase Estimation not found" });
    }

    if (estimation.pdfUrl) {
      console.log("✅ SERVER: PDF already exists, returning URL:", estimation.pdfUrl);
      return res.json({
        message: "PDF retrieved successfully",
        pdfUrl: estimation.pdfUrl,
        alreadyExists: true
      });
    }

    console.log('⚠️  SERVER: PDF not generated yet');
    return res.status(404).json({
      message: "PDF not generated yet. Please generate it first.",
      needsGeneration: true
    });
  } catch (err) {
    console.error("❌ SERVER ERROR in getEstimationPDF:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Generate PDF for purchase estimation
// @route   POST /api/purchase-estimations/:id/generate-pdf
export const generateEstimationPDF = async (req, res) => {
  try {
    console.log('\n📄 SERVER: generateEstimationPDF called');
    console.log('   ID:', req.params.id);

    const estimation = await PurchaseEstimation.findById(req.params.id)
      .populate("order", "PoNo orderType buyerDetails")
      .populate("purchaseItems.vendorId", "name code mobile");

    if (!estimation) {
      console.log('❌ SERVER: Estimation not found');
      return res.status(404).json({ message: "Purchase Estimation not found" });
    }

    if (estimation.pdfUrl) {
      console.log("✅ SERVER: PDF already exists:", estimation.pdfUrl);
      return res.json({
        message: "PDF already exists",
        pdfUrl: estimation.pdfUrl,
        estimation: estimation
      });
    }

    console.log("🔄 SERVER: Generating PDF for estimation:", estimation.PESNo);

    const documentData = {
      documentType: 'purchase-estimation',
      documentNo: estimation.PESNo,
      documentDate: estimation.estimationDate,
      businessDetails: {
        name: process.env.BUSINESS_NAME || "Your Business Name",
        address: process.env.BUSINESS_ADDRESS || "Business Address",
        city: process.env.BUSINESS_CITY || "City",
        state: process.env.BUSINESS_STATE || "State",
        pincode: process.env.BUSINESS_PINCODE || "000000",
        phone: process.env.BUSINESS_PHONE || "",
        email: process.env.BUSINESS_EMAIL || "",
        gst: process.env.BUSINESS_GST || "",
      },
      remarks: estimation.remarks || '',
      status: estimation.status || 'Draft',
      PoNo: estimation.PoNo,
      orderDate: estimation.orderDate,
      orderType: estimation.orderType,
      buyerDetails: estimation.buyerDetails,
      orderProducts: estimation.orderProducts,
      totalOrderQty: estimation.totalOrderQty,
      purchaseItems: estimation.purchaseItems,
      fabricCostEstimation: estimation.fabricCostEstimation,
      grandTotalCost: estimation.grandTotalCost,
      totalCgst: estimation.totalCgst,
      totalSgst: estimation.totalSgst,
      totalIgst: estimation.totalIgst,
      grandTotalWithGst: estimation.grandTotalWithGst,
    };

    const pdfResult = await pdfService.generateDocumentPDF(documentData);

    estimation.pdfUrl = pdfResult.url;
    estimation.pdfPublicId = pdfResult.publicId;
    estimation.status = "Finalized";
    await estimation.save();

    console.log("✅ SERVER: PDF generated and uploaded:", pdfResult.url);

    res.json({
      message: "PDF generated successfully",
      pdfUrl: pdfResult.url,
      estimation: estimation
    });
  } catch (err) {
    console.error("❌ SERVER ERROR in generateEstimationPDF:", err.message);
    res.status(500).json({ message: "Failed to generate PDF: " + err.message });
  }
};

// @desc    Search Suppliers for dropdown (autocomplete)
// @route   GET /api/purchase-estimations/search/suppliers
export const searchSuppliers = async (req, res) => {
  try {
    console.log('\n🔍 SERVER: searchSuppliers called');
    const { q } = req.query;
    console.log(`   Search query: "${q}"`);

    if (!q || q.length < 2) {
      console.log('   Query too short, returning empty array');
      return res.status(200).json([]);
    }

    const suppliers = await Supplier.searchByName(q);

    console.log(`✅ SERVER: Found ${suppliers.length} suppliers`);
    res.status(200).json(suppliers);
  } catch (error) {
    console.error("❌ SERVER ERROR in searchSuppliers:", error.message);
    res.status(500).json({
      message: "Error searching suppliers",
      error: error.message
    });
  }
};

export const resetPESCounter = async (req, res) => {
  try {
    console.log('\n🔄 SERVER: resetPESCounter called');
    const { resetSequence } = await import("../utils/counterUtils.js");
    await resetSequence("purchaseEstimationSeq");

    console.log("✅ SERVER: Reset PES counter to 0");

    res.status(200).json({
      message: "Counter reset successfully",
      nextPESNo: "PES-0001"
    });
  } catch (error) {
    console.error("❌ SERVER ERROR in resetPESCounter:", error.message);
    res.status(500).json({
      message: "Error resetting counter",
      error: error.message
    });
  }
};