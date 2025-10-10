// controllers/purchaseEstimationController.js
import mongoose from "mongoose";
import PurchaseEstimation from "../models/PurchaseEstimationSchema.js";
import Order from "../models/orders.js";
import Supplier from "../models/supplier.js";
import { pdfService } from "../services/pdfService.js";
import { cloudinaryService } from "../services/cloudinaryService.js";

// Helper function to transform Order products to Purchase Estimation format
const transformOrderProductsForEstimation = (orderProducts) => {
  return orderProducts.map(p => {
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
      colors: Array.from(colorMap.entries()).map(([color, sizes]) => ({
        color: color,
        sizes: sizes
      })),
      productTotalQty: p.fabricTypes?.reduce((total, ft) =>
        total + (ft.sizes?.reduce((sTotal, sz) =>
          sTotal + (sz.colors?.reduce((cTotal, col) => cTotal + (col.qty || 0), 0) || 0), 0) || 0), 0) || 0
    };
  });
};

// @desc    Search Orders by PoNo for dropdown
// @route   GET /api/purchase-estimations/search/orders
export const searchOrders = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(200).json([]);
    }

    // Search for orders by PoNo
    const orders = await Order.find({
      PoNo: new RegExp(q, 'i')
    })
      .select('PoNo orderDate orderType buyerDetails totalQty status')
      .limit(10)
      .lean();

    console.log(`Found ${orders.length} orders for query: "${q}"`);
    
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

    res.status(200).json(results);
  } catch (error) {
    console.error("❌ Error in searchOrders:", error.message);
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
    const { PoNo } = req.params;

    const order = await Order.findOne({ PoNo })
      .populate("buyer", "name code mobile gst email address")
      .populate("products.product", "name hsn")
      .lean();

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Transform products to estimation format
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

    console.log("✅ Fetched order details for PoNo:", PoNo);
    res.status(200).json(orderDetails);
  } catch (error) {
    console.error("❌ Error in getOrderByPoNo:", error.message);
    res.status(500).json({
      message: "Error fetching order details",
      error: error.message
    });
  }
};

// @desc    Create a new purchase estimation (Order-based or Machine-based)
// @route   POST /api/purchase-estimations
export const createPurchaseEstimation = async (req, res) => {
  try {
    const {
      estimationType,
      orderId,
      PoNo,
      fabricPurchases = [],
      buttonsPurchases = [],
      packetsPurchases = [],
      machinesPurchases = [],
      remarks,
      estimationDate,
    } = req.body;

    console.log("POST /api/purchase-estimations payload:", req.body);

    // Validate estimation type
    if (!estimationType || !["order", "machine"].includes(estimationType)) {
      return res.status(400).json({
        message: "estimationType is required and must be 'order' or 'machine'"
      });
    }

    let estimationData = {
      estimationType,
      estimationDate: estimationDate || Date.now(),
      remarks: remarks || "",
      status: "Draft",
    };

    // Handle Order-based estimation
    if (estimationType === "order") {
      if (!orderId && !PoNo) {
        return res.status(400).json({
          message: "orderId or PoNo is required for order-based estimation"
        });
      }

      // Fetch order
      let order;
      if (orderId) {
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
          return res.status(400).json({ message: "Invalid order ID format" });
        }
        order = await Order.findById(orderId).populate("buyer").lean();
      } else {
        order = await Order.findOne({ PoNo }).populate("buyer").lean();
      }

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Validate that at least one purchase item exists
      const hasItems =
        (fabricPurchases && fabricPurchases.length > 0) ||
        (buttonsPurchases && buttonsPurchases.length > 0) ||
        (packetsPurchases && packetsPurchases.length > 0);

      if (!hasItems) {
        return res.status(400).json({
          message: "At least one purchase item (fabric, buttons, or packets) is required for order estimation"
        });
      }

      // Validate fabricPurchases
      for (const item of fabricPurchases) {
        if (!item.vendor || !item.fabricType || !item.quantity || !item.costPerUnit) {
          return res.status(400).json({
            message: "Each fabric purchase requires vendor, fabricType, quantity, and costPerUnit"
          });
        }
        if (item.vendorId && !mongoose.Types.ObjectId.isValid(item.vendorId)) {
          return res.status(400).json({ message: "Invalid supplier ID format in fabric purchases" });
        }
      }

      // Validate buttonsPurchases
      for (const item of buttonsPurchases) {
        if (!item.vendor || !item.quantity || !item.costPerUnit) {
          return res.status(400).json({
            message: "Each button purchase requires vendor, quantity, and costPerUnit"
          });
        }
        if (item.vendorId && !mongoose.Types.ObjectId.isValid(item.vendorId)) {
          return res.status(400).json({ message: "Invalid supplier ID format in button purchases" });
        }
      }

      // Validate packetsPurchases
      for (const item of packetsPurchases) {
        if (!item.vendor || !item.quantity || !item.costPerUnit) {
          return res.status(400).json({
            message: "Each packet purchase requires vendor, quantity, and costPerUnit"
          });
        }
        if (item.vendorId && !mongoose.Types.ObjectId.isValid(item.vendorId)) {
          return res.status(400).json({ message: "Invalid supplier ID format in packet purchases" });
        }
      }

      // Transform order products
      const orderProducts = transformOrderProductsForEstimation(order.products);

      // Populate estimation data with order details
      estimationData = {
        ...estimationData,
        order: order._id,
        PoNo: order.PoNo,
        orderDate: order.orderDate,
        orderType: order.orderType,
        buyerDetails: order.buyerDetails,
        orderProducts: orderProducts,
        totalOrderQty: order.totalQty,
        fabricPurchases,
        buttonsPurchases,
        packetsPurchases,
      };
    }
    // Handle Machine-based estimation
    else if (estimationType === "machine") {
      // Validate machine purchases
      if (!machinesPurchases || machinesPurchases.length === 0) {
        return res.status(400).json({
          message: "At least one machine purchase is required for machine estimation"
        });
      }

      for (const item of machinesPurchases) {
        if (!item.machineName || !item.vendor || item.cost === undefined || item.cost === null) {
          return res.status(400).json({
            message: "Each machine purchase requires machineName, vendor, and cost"
          });
        }
        if (item.vendorId && !mongoose.Types.ObjectId.isValid(item.vendorId)) {
          return res.status(400).json({ message: "Invalid supplier ID format in machine purchases" });
        }
      }

      estimationData.machinesPurchases = machinesPurchases;
    }

    // Create new purchase estimation - PESNo will be auto-generated by pre-save hook
    const newEstimation = new PurchaseEstimation(estimationData);
    const savedEstimation = await newEstimation.save();
    
    console.log("✅ Purchase Estimation created:", savedEstimation.PESNo, "Type:", savedEstimation.estimationType);

    res.status(201).json({
      message: `${estimationType === "order" ? "Order" : "Machine"} estimation created successfully`,
      estimation: savedEstimation
    });
  } catch (err) {
    console.error("❌ Error in createPurchaseEstimation:", err);
    
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

// @desc    Get all purchase estimations with filtering
// @route   GET /api/purchase-estimations
export const getPurchaseEstimations = async (req, res) => {
  try {
    const { estimationType, status, PoNo } = req.query;

    const filter = {};
    
    if (estimationType && ["order", "machine"].includes(estimationType)) {
      filter.estimationType = estimationType;
    }
    
    if (status && ["Draft", "Finalized"].includes(status)) {
      filter.status = status;
    }
    
    if (PoNo) {
      filter.PoNo = new RegExp(PoNo, 'i');
    }

    const estimations = await PurchaseEstimation.find(filter)
      .populate("order", "PoNo orderType status")
      .populate("fabricPurchases.vendorId", "name code")
      .populate("buttonsPurchases.vendorId", "name code")
      .populate("packetsPurchases.vendorId", "name code")
      .populate("machinesPurchases.vendorId", "name code")
      .sort({ createdAt: -1 });
    
    console.log(`✅ Fetched ${estimations.length} estimations`);
    res.json(estimations);
  } catch (err) {
    console.error("❌ Error in getPurchaseEstimations:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get single purchase estimation by ID
// @route   GET /api/purchase-estimations/:id
export const getPurchaseEstimationById = async (req, res) => {
  try {
    const estimation = await PurchaseEstimation.findById(req.params.id)
      .populate("order", "PoNo orderType status buyerDetails products")
      .populate("fabricPurchases.vendorId", "name code mobile")
      .populate("buttonsPurchases.vendorId", "name code mobile")
      .populate("packetsPurchases.vendorId", "name code mobile")
      .populate("machinesPurchases.vendorId", "name code mobile");
    
    if (!estimation) {
      return res.status(404).json({ message: "Purchase Estimation not found" });
    }
    
    res.json(estimation);
  } catch (err) {
    console.error("❌ Error in getPurchaseEstimationById:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update a purchase estimation
// @route   PUT /api/purchase-estimations/:id
export const updatePurchaseEstimation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fabricPurchases,
      buttonsPurchases,
      packetsPurchases,
      machinesPurchases,
      remarks,
      estimationDate,
      status,
    } = req.body;

    const estimation = await PurchaseEstimation.findById(id);
    if (!estimation) {
      return res.status(404).json({ message: "Purchase Estimation not found" });
    }

    // Update based on estimation type
    if (estimation.estimationType === "order") {
      // Validate and update order-based purchases
      if (fabricPurchases !== undefined) {
        for (const item of fabricPurchases) {
          if (!item.vendor || !item.fabricType || !item.quantity || !item.costPerUnit) {
            return res.status(400).json({
              message: "Each fabric purchase requires vendor, fabricType, quantity, and costPerUnit"
            });
          }
        }
        estimation.fabricPurchases = fabricPurchases;
      }

      if (buttonsPurchases !== undefined) {
        for (const item of buttonsPurchases) {
          if (!item.vendor || !item.quantity || !item.costPerUnit) {
            return res.status(400).json({
              message: "Each button purchase requires vendor, quantity, and costPerUnit"
            });
          }
        }
        estimation.buttonsPurchases = buttonsPurchases;
      }

      if (packetsPurchases !== undefined) {
        for (const item of packetsPurchases) {
          if (!item.vendor || !item.quantity || !item.costPerUnit) {
            return res.status(400).json({
              message: "Each packet purchase requires vendor, quantity, and costPerUnit"
            });
          }
        }
        estimation.packetsPurchases = packetsPurchases;
      }
    } else if (estimation.estimationType === "machine") {
      // Validate and update machine purchases
      if (machinesPurchases !== undefined) {
        for (const item of machinesPurchases) {
          if (!item.machineName || !item.vendor || item.cost === undefined) {
            return res.status(400).json({
              message: "Each machine purchase requires machineName, vendor, and cost"
            });
          }
        }
        estimation.machinesPurchases = machinesPurchases;
      }
    }

    if (remarks !== undefined) estimation.remarks = remarks;
    if (estimationDate !== undefined) estimation.estimationDate = estimationDate;
    if (status !== undefined) estimation.status = status;

    const updatedEstimation = await estimation.save();
    console.log("✅ Updated purchase estimation:", updatedEstimation.PESNo);

    res.json({
      message: "Purchase Estimation updated successfully",
      estimation: updatedEstimation
    });
  } catch (err) {
    console.error("❌ Error in updatePurchaseEstimation:", err.message);
    
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
    const estimation = await PurchaseEstimation.findById(req.params.id);
    if (!estimation) {
      return res.status(404).json({ message: "Purchase Estimation not found" });
    }

    // Delete PDF from Cloudinary if exists
    if (estimation.pdfPublicId) {
      await cloudinaryService.deletePDF(estimation.pdfPublicId);
      console.log("✅ PDF deleted from Cloudinary:", estimation.pdfPublicId);
    }

    await PurchaseEstimation.findByIdAndDelete(req.params.id);
    res.json({ message: "Purchase Estimation deleted successfully" });
  } catch (err) {
    console.error("❌ Error in deletePurchaseEstimation:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get or Generate PDF for purchase estimation
// @route   GET /api/purchase-estimations/:id/pdf
export const getEstimationPDF = async (req, res) => {
  try {
    const estimation = await PurchaseEstimation.findById(req.params.id);

    if (!estimation) {
      return res.status(404).json({ message: "Purchase Estimation not found" });
    }

    // If PDF already exists, return it immediately
    if (estimation.pdfUrl) {
      console.log("✅ PDF already exists, returning URL:", estimation.pdfUrl);
      return res.json({
        message: "PDF retrieved successfully",
        pdfUrl: estimation.pdfUrl,
        alreadyExists: true
      });
    }

    // If no PDF exists, return error asking to generate it
    return res.status(404).json({ 
      message: "PDF not generated yet. Please generate it first.",
      needsGeneration: true 
    });
  } catch (err) {
    console.error("❌ Error in getEstimationPDF:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Generate PDF for purchase estimation (separate endpoint)
// @route   POST /api/purchase-estimations/:id/generate-pdf
export const generateEstimationPDF = async (req, res) => {
  try {
    const estimation = await PurchaseEstimation.findById(req.params.id)
      .populate("order", "PoNo orderType buyerDetails")
      .populate("fabricPurchases.vendorId", "name code mobile")
      .populate("buttonsPurchases.vendorId", "name code mobile")
      .populate("packetsPurchases.vendorId", "name code mobile")
      .populate("machinesPurchases.vendorId", "name code mobile");

    if (!estimation) {
      return res.status(404).json({ message: "Purchase Estimation not found" });
    }

    // If PDF already exists, just return it (don't regenerate)
    if (estimation.pdfUrl) {
      console.log("✅ PDF already exists:", estimation.pdfUrl);
      return res.json({
        message: "PDF already exists",
        pdfUrl: estimation.pdfUrl,
        estimation: estimation
      });
    }

    console.log("🔄 Generating PDF for estimation:", estimation.PESNo, "Type:", estimation.estimationType);

    // Prepare document data for PDF service based on estimation type
    const documentData = {
      documentType: estimation.estimationType === "machine" 
        ? 'machine-purchase-estimation' 
        : 'order-purchase-estimation',
      documentNo: estimation.PESNo,
      documentDate: estimation.estimationDate,
      estimationType: estimation.estimationType,
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
    };

    // Add order-specific data if order-based estimation
    if (estimation.estimationType === "order") {
      documentData.PoNo = estimation.PoNo;
      documentData.orderDate = estimation.orderDate;
      documentData.orderType = estimation.orderType;
      documentData.buyerDetails = estimation.buyerDetails;
      documentData.orderProducts = estimation.orderProducts;
      documentData.totalOrderQty = estimation.totalOrderQty;
      documentData.fabricPurchases = estimation.fabricPurchases || [];
      documentData.buttonsPurchases = estimation.buttonsPurchases || [];
      documentData.packetsPurchases = estimation.packetsPurchases || [];
      documentData.totalFabricCost = estimation.totalFabricCost || 0;
      documentData.totalButtonsCost = estimation.totalButtonsCost || 0;
      documentData.totalPacketsCost = estimation.totalPacketsCost || 0;
      documentData.totalFabricGst = estimation.totalFabricGst || 0;
      documentData.totalButtonsGst = estimation.totalButtonsGst || 0;
      documentData.totalPacketsGst = estimation.totalPacketsGst || 0;
    } 
    // Add machine-specific data if machine estimation
    else if (estimation.estimationType === "machine") {
      documentData.machinesPurchases = estimation.machinesPurchases || [];
      documentData.totalMachinesCost = estimation.totalMachinesCost || 0;
      documentData.totalMachinesGst = estimation.totalMachinesGst || 0;
    }

    documentData.grandTotalCost = estimation.grandTotalCost || 0;
    documentData.grandTotalWithGst = estimation.grandTotalWithGst || 0;

    // Generate PDF
    const pdfResult = await pdfService.generateDocumentPDF(documentData);

    // Update estimation with PDF URL
    estimation.pdfUrl = pdfResult.url;
    estimation.pdfPublicId = pdfResult.publicId;
    estimation.status = "Finalized";
    await estimation.save();

    console.log("✅ PDF generated and uploaded:", pdfResult.url);

    res.json({
      message: "PDF generated successfully",
      pdfUrl: pdfResult.url,
      estimation: estimation
    });
  } catch (err) {
    console.error("❌ Error in generateEstimationPDF:", err.message);
    res.status(500).json({ message: "Failed to generate PDF: " + err.message });
  }
};

// @desc    Search Suppliers for dropdown (autocomplete)
// @route   GET /api/purchase-estimations/search/suppliers
export const searchSuppliers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(200).json([]);
    }

    const suppliers = await Supplier.searchByName(q);

    console.log(`Found ${suppliers.length} suppliers for query: "${q}"`);
    res.status(200).json(suppliers);
  } catch (error) {
    console.error("❌ Error in searchSuppliers:", error.message);
    res.status(500).json({
      message: "Error searching suppliers",
      error: error.message
    });
  }
};