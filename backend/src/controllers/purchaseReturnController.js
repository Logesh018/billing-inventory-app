// controllers/purchaseReturnController.js
import mongoose from "mongoose";
import PurchaseReturn from "../models/PurchaseReturnSchema.js";
import Purchase from "../models/purchase.js";
import Note from "../models/Note.js";
import { pdfService } from "../services/pdfService.js";

/**
 * @desc    Get purchase details by PURNo for return form
 * @route   GET /api/purchase-returns/purchase/:PURNo
 */
export const getPurchaseForReturn = async (req, res) => {
  try {
    console.log('\n🔍 SERVER: getPurchaseForReturn called');
    const { PURNo } = req.params;
    console.log(`📝 SERVER: Fetching purchase with PURNo: "${PURNo}"`);

    const purchase = await Purchase.findOne({ PURNo })
      .populate("order", "PoNo orderType orderDate")
      .populate("purchaseItems.vendorId", "name code state")
      .lean();

    if (!purchase) {
      console.log('❌ SERVER: Purchase not found');
      return res.status(404).json({ message: "Purchase not found" });
    }

    console.log(`✅ SERVER: Purchase found - ${purchase.PURNo}`);
    
    // Check if return already exists
    const existingReturn = await PurchaseReturn.findOne({ purchase: purchase._id });
    if (existingReturn) {
      console.log(`⚠️  SERVER: Return already exists for this purchase: ${existingReturn.PURTNo}`);
      return res.status(400).json({
        message: "Purchase return already exists for this purchase",
        existingReturn: existingReturn
      });
    }

    res.status(200).json(purchase);
  } catch (error) {
    console.error("❌ SERVER ERROR in getPurchaseForReturn:", error.message);
    res.status(500).json({
      message: "Error fetching purchase details",
      error: error.message
    });
  }
};

/**
 * @desc    Create a new purchase return
 * @route   POST /api/purchase-returns
 */
export const createPurchaseReturn = async (req, res) => {
  try {
    console.log('\n🚀 ========== CREATE PURCHASE RETURN START ==========');
    console.log('📥 SERVER: Received POST /api/purchase-returns');
    console.log('📦 SERVER: Request body:', JSON.stringify(req.body, null, 2));

    const {
      purchaseId,
      PURNo,
      returnDate,
      returnItems,
      remarks,
      generateDebitNote = true
    } = req.body;

    // Validation
    if (!purchaseId && !PURNo) {
      console.log('❌ SERVER: Purchase ID or PURNo is required');
      return res.status(400).json({
        message: "Purchase ID or PURNo is required"
      });
    }

    if (!returnItems || returnItems.length === 0) {
      console.log('❌ SERVER: No return items provided');
      return res.status(400).json({
        message: "At least one return item is required"
      });
    }

    // Fetch purchase
    console.log('\n🔍 SERVER: Fetching purchase...');
    let purchase;
    if (purchaseId) {
      if (!mongoose.Types.ObjectId.isValid(purchaseId)) {
        return res.status(400).json({ message: "Invalid purchase ID format" });
      }
      purchase = await Purchase.findById(purchaseId)
        .populate("order")
        .populate("purchaseItems.vendorId");
    } else {
      purchase = await Purchase.findOne({ PURNo })
        .populate("order")
        .populate("purchaseItems.vendorId");
    }

    if (!purchase) {
      console.log('❌ SERVER: Purchase not found');
      return res.status(404).json({ message: "Purchase not found" });
    }

    console.log(`✅ SERVER: Purchase found - ${purchase.PURNo}`);

    // Check if return already exists
    const existingReturn = await PurchaseReturn.findOne({ purchase: purchase._id });
    if (existingReturn) {
      console.log(`❌ SERVER: Return already exists: ${existingReturn.PURTNo}`);
      return res.status(400).json({
        message: "Purchase return already exists for this purchase",
        existingReturn: existingReturn
      });
    }

    // Validate return items against purchase items
    console.log('\n🔍 SERVER: Validating return items...');
    for (const returnItem of returnItems) {
      if (!returnItem.itemName || returnItem.returnQuantity <= 0) {
        return res.status(400).json({
          message: "Each return item must have itemName and valid returnQuantity"
        });
      }
    }

    // Get vendor details from first purchase item
    const firstPurchaseItem = purchase.purchaseItems?.[0];
    const vendorDetails = {
      name: firstPurchaseItem?.vendor || "N/A",
      code: firstPurchaseItem?.vendorCode || "",
      vendorId: firstPurchaseItem?.vendorId?._id || null,
      state: firstPurchaseItem?.vendorState || ""
    };

    // Create Purchase Return
    console.log('\n💾 SERVER: Creating purchase return...');
    const purchaseReturnData = {
      returnDate: returnDate || Date.now(),
      purchase: purchase._id,
      PURNo: purchase.PURNo,
      purchaseDate: purchase.purchaseDate,
      order: purchase.order?._id || null,
      PoNo: purchase.PoNo || null,
      orderType: purchase.orderType || null,
      vendor: vendorDetails,
      returnItems: returnItems,
      remarks: remarks || "",
      status: "Pending",
      createdBy: req.user?._id || null
    };

    const newPurchaseReturn = new PurchaseReturn(purchaseReturnData);
    const savedReturn = await newPurchaseReturn.save();

    console.log("✅ SERVER: Purchase Return created successfully!");
    console.log(`   PURTNo: ${savedReturn.PURTNo}`);
    console.log(`   ID: ${savedReturn._id}`);

    // Generate Debit Note automatically
    let debitNote = null;
    if (generateDebitNote) {
      console.log('\n📝 SERVER: Auto-generating Debit Note...');
      
      try {
        // Transform return items to debit note items
        const debitNoteItems = savedReturn.returnItems.map(item => ({
          description: `${item.itemName}${item.gsm ? ` (${item.gsm} GSM)` : ''}${item.color ? ` - ${item.color}` : ''} - RETURN`,
          hsnCode: "",
          quantity: item.returnQuantity,
          rate: item.originalCostPerUnit,
          amount: item.returnValueWithGst,
          taxRate: item.gstPercentage
        }));

        // Create Debit Note
        const debitNoteData = {
          noteType: 'debit',
          referenceType: 'purchase-order',
          referenceNumber: purchase.PURNo,
          referenceDate: purchase.purchaseDate,
          reason: 'goods-returned',
          reasonDescription: `Purchase return for ${purchase.PURNo}. ${remarks || ''}`,
          partyDetails: {
            name: vendorDetails.name,
            address: "",
            gst: "",
            state: vendorDetails.state || "Tamil Nadu"
          },
          items: debitNoteItems,
          subtotal: savedReturn.totalReturnValue,
          taxes: {
            cgst: savedReturn.totalCgst,
            sgst: savedReturn.totalSgst,
            igst: savedReturn.totalIgst
          },
          roundOff: 0,
          grandTotal: Math.round(savedReturn.totalReturnWithGst),
          // Link to Purchase Return
          purchaseReturn: savedReturn._id,
          PURTNo: savedReturn.PURTNo,
          isAutoGenerated: true
        };

        debitNote = new Note(debitNoteData);
        await debitNote.save();

        console.log(`✅ SERVER: Debit Note created: ${debitNote.noteNumber}`);

        // Generate PDF for Debit Note
        try {
          const pdfResult = await pdfService.generateNotePDF(debitNote);
          debitNote.pdfUrl = pdfResult.url;
          debitNote.pdfPublicId = pdfResult.publicId;
          await debitNote.save();
          console.log("✅ SERVER: Debit Note PDF generated:", pdfResult.url);
        } catch (pdfError) {
          console.error("❌ SERVER: PDF generation failed:", pdfError);
        }

        // Update Purchase Return with Debit Note reference
        savedReturn.debitNote = debitNote._id;
        savedReturn.debitNoteNumber = debitNote.noteNumber;
        await savedReturn.save();

        console.log(`✅ SERVER: Linked Debit Note ${debitNote.noteNumber} to Return ${savedReturn.PURTNo}`);
      } catch (debitNoteError) {
        console.error("❌ SERVER: Error creating Debit Note:", debitNoteError);
        // Continue even if debit note creation fails
      }
    }

    console.log('\n📤 SERVER: Sending success response');
    console.log('🚀 ========== CREATE PURCHASE RETURN END ==========\n');

    res.status(201).json({
      message: "Purchase return created successfully",
      purchaseReturn: savedReturn,
      debitNote: debitNote ? {
        _id: debitNote._id,
        noteNumber: debitNote.noteNumber,
        pdfUrl: debitNote.pdfUrl
      } : null
    });
  } catch (err) {
    console.error("\n❌ SERVER FATAL ERROR in createPurchaseReturn:");
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

/**
 * @desc    Get all purchase returns with filtering
 * @route   GET /api/purchase-returns
 */
export const getPurchaseReturns = async (req, res) => {
  try {
    console.log('\n🔍 SERVER: getPurchaseReturns called');
    const { status, PURNo, PoNo } = req.query;
    console.log('   Query params:', { status, PURNo, PoNo });

    const filter = {};

    if (status && ["Pending", "Approved", "Rejected", "Completed"].includes(status)) {
      filter.status = status;
    }

    if (PURNo) {
      filter.PURNo = new RegExp(PURNo, 'i');
    }

    if (PoNo) {
      filter.PoNo = new RegExp(PoNo, 'i');
    }

    const returns = await PurchaseReturn.find(filter)
      .populate("purchase", "PURNo purchaseDate")
      .populate("order", "PoNo orderType")
      .populate("debitNote", "noteNumber pdfUrl")
      .populate("vendor.vendorId", "name code")
      .sort({ createdAt: -1 });

    console.log(`✅ SERVER: Fetched ${returns.length} purchase returns`);
    res.json(returns);
  } catch (err) {
    console.error("❌ SERVER ERROR in getPurchaseReturns:", err.message);
    res.status(500).json({ message: err.message });
  }
};

/**
 * @desc    Get single purchase return by ID
 * @route   GET /api/purchase-returns/:id
 */
export const getPurchaseReturnById = async (req, res) => {
  try {
    console.log('\n🔍 SERVER: getPurchaseReturnById called');
    console.log('   ID:', req.params.id);

    const purchaseReturn = await PurchaseReturn.findById(req.params.id)
      .populate("purchase", "PURNo purchaseDate purchaseItems")
      .populate("order", "PoNo orderType orderDate")
      .populate("debitNote", "noteNumber pdfUrl status")
      .populate("vendor.vendorId", "name code mobile")
      .populate("createdBy", "name email")
      .populate("approvedBy", "name email");

    if (!purchaseReturn) {
      console.log('❌ SERVER: Purchase return not found');
      return res.status(404).json({ message: "Purchase return not found" });
    }

    console.log(`✅ SERVER: Found purchase return ${purchaseReturn.PURTNo}`);
    res.json(purchaseReturn);
  } catch (err) {
    console.error("❌ SERVER ERROR in getPurchaseReturnById:", err.message);
    res.status(500).json({ message: err.message });
  }
};

/**
 * @desc    Update purchase return status
 * @route   PATCH /api/purchase-returns/:id/status
 */
export const updatePurchaseReturnStatus = async (req, res) => {
  try {
    console.log('\n🔄 SERVER: updatePurchaseReturnStatus called');
    const { id } = req.params;
    const { status } = req.body;

    if (!["Pending", "Approved", "Rejected", "Completed"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status"
      });
    }

    const purchaseReturn = await PurchaseReturn.findById(id);
    if (!purchaseReturn) {
      return res.status(404).json({ message: "Purchase return not found" });
    }

    purchaseReturn.status = status;

    if (status === "Approved") {
      purchaseReturn.approvedBy = req.user?._id || null;
      purchaseReturn.approvedAt = Date.now();
    }

    await purchaseReturn.save();

    console.log(`✅ SERVER: Updated return ${purchaseReturn.PURTNo} status to ${status}`);

    res.json({
      message: "Purchase return status updated successfully",
      purchaseReturn: purchaseReturn
    });
  } catch (err) {
    console.error("❌ SERVER ERROR in updatePurchaseReturnStatus:", err.message);
    res.status(400).json({ message: err.message });
  }
};

/**
 * @desc    Delete a purchase return
 * @route   DELETE /api/purchase-returns/:id
 */
export const deletePurchaseReturn = async (req, res) => {
  try {
    console.log('\n🗑️  SERVER: deletePurchaseReturn called');
    console.log('   ID:', req.params.id);

    const purchaseReturn = await PurchaseReturn.findById(req.params.id);
    if (!purchaseReturn) {
      return res.status(404).json({ message: "Purchase return not found" });
    }

    // Delete linked Debit Note if exists
    if (purchaseReturn.debitNote) {
      console.log(`🗑️  SERVER: Deleting linked Debit Note: ${purchaseReturn.debitNoteNumber}`);
      await Note.findByIdAndDelete(purchaseReturn.debitNote);
    }

    await PurchaseReturn.findByIdAndDelete(req.params.id);
    console.log('✅ SERVER: Purchase return deleted');
    
    res.json({ message: "Purchase return deleted successfully" });
  } catch (err) {
    console.error("❌ SERVER ERROR in deletePurchaseReturn:", err.message);
    res.status(500).json({ message: err.message });
  }
};

/**
 * @desc    Get next available PURTNo
 * @route   GET /api/purchase-returns/next-purt-no
 */
export const getNextPURTNo = async (req, res) => {
  try {
    console.log('\n🔍 SERVER: getNextPURTNo called');
    const { peekNextSequence } = await import("../utils/counterUtils.js");
    const seqNumber = await peekNextSequence("purchaseReturnSeq");
    const PURTNo = `PURT-${String(seqNumber).padStart(4, "0")}`;

    console.log("✅ SERVER: Peeked next PURTNo:", PURTNo);

    res.status(200).json({ PURTNo });
  } catch (error) {
    console.error("❌ SERVER ERROR in getNextPURTNo:", error.message);
    res.status(500).json({
      message: "Error generating PURTNo",
      error: error.message
    });
  }
};