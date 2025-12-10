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
      .lean();

    if (!purchase) {
      console.log('❌ SERVER: Purchase not found');
      return res.status(404).json({ message: "Purchase not found" });
    }

    // Manually populate vendorId only if it's a valid ObjectId
    if (purchase.purchaseItems && purchase.purchaseItems.length > 0) {
      for (const vendorItem of purchase.purchaseItems) {
        if (vendorItem.vendorId && mongoose.Types.ObjectId.isValid(vendorItem.vendorId)) {
          try {
            const Supplier = mongoose.model("Supplier");
            const supplier = await Supplier.findById(vendorItem.vendorId).select("name code state").lean();
            if (supplier) {
              vendorItem.vendorId = supplier;
            }
          } catch (err) {
            console.warn(`⚠️ SERVER: Failed to populate vendorId for item:`, err.message);
          }
        }
      }
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
      purchase = await Purchase.findById(purchaseId).populate("order");
    } else {
      purchase = await Purchase.findOne({ PURNo }).populate("order");
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

    // Validate return items
    console.log('\n🔍 SERVER: Validating return items...');
    for (const returnItem of returnItems) {
      if (!returnItem.itemName || returnItem.returnQuantity <= 0) {
        return res.status(400).json({
          message: "Each return item must have itemName and valid returnQuantity"
        });
      }
      // ✅ NEW: Validate vendor info
      if (!returnItem.vendor) {
        return res.status(400).json({
          message: "Each return item must have vendor information"
        });
      }
    }

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
      returnItems: returnItems, // ✅ Now includes vendor info per item
      remarks: remarks || "",
      createdBy: req.user?._id || null
    };

    const newPurchaseReturn = new PurchaseReturn(purchaseReturnData);
    const savedReturn = await newPurchaseReturn.save();

    console.log("✅ SERVER: Purchase Return created successfully!");
    console.log(`   PURTNo: ${savedReturn.PURTNo}`);
    console.log(`   ID: ${savedReturn._id}`);

    // ✅ IMPROVED: Generate Debit Note with proper multi-vendor handling
    let debitNote = null;
    if (generateDebitNote) {
      console.log('\n📝 SERVER: Auto-generating Debit Note...');

      try {
        // Import noteService to use its note number generation
        const { noteService } = await import("../services/noteService.js");

        // Group items by vendor for better understanding
        const vendorGroups = {};
        savedReturn.returnItems.forEach(item => {
          const vendorKey = item.vendor;
          if (!vendorGroups[vendorKey]) {
            vendorGroups[vendorKey] = {
              vendor: item.vendor,
              vendorCode: item.vendorCode,
              vendorState: item.vendorState,
              items: [],
              totalCgst: 0,
              totalSgst: 0,
              totalIgst: 0
            };
          }
          vendorGroups[vendorKey].items.push(item);
          vendorGroups[vendorKey].totalCgst += item.cgstAmount || 0;
          vendorGroups[vendorKey].totalSgst += item.sgstAmount || 0;
          vendorGroups[vendorKey].totalIgst += item.igstAmount || 0;
        });

        // Get primary vendor (first one) for Note party details
        const primaryVendor = Object.values(vendorGroups)[0];

        // Determine if inter-state or intra-state
        const isInterState = primaryVendor.vendorState !== 'Tamil Nadu';
        console.log(`   Primary Vendor: ${primaryVendor.vendor}`);
        console.log(`   Vendor State: ${primaryVendor.vendorState}`);
        console.log(`   GST Type: ${isInterState ? 'IGST' : 'CGST+SGST'}`);

        // ✅ FIX: Generate note number
        const noteNumber = await noteService.generateNoteNumber('debit');
        console.log(`   Generated Note Number: ${noteNumber}`);

        // Transform return items to debit note items
        const debitNoteItems = savedReturn.returnItems.map(item => ({
          description: `${item.itemName}${item.gsm ? ` (${item.gsm} GSM)` : ''}${item.color ? ` - ${item.color}` : ''} - RETURN (${item.vendor})`,
          hsnCode: item.hsn || "",
          quantity: item.returnQuantity,
          rate: item.originalCostPerUnit,
          amount: item.returnValue, // ✅ Base value WITHOUT GST
          taxRate: item.gstPercentage
        }));

        // ✅ IMPORTANT: Use correct tax amounts based on GST type
        let taxes;
        if (isInterState) {
          // IGST only
          taxes = {
            cgst: 0,
            sgst: 0,
            igst: savedReturn.totalIgst || 0
          };
        } else {
          // CGST + SGST
          taxes = {
            cgst: savedReturn.totalCgst || 0,
            sgst: savedReturn.totalSgst || 0,
            igst: 0
          };
        }

        console.log('   Tax Breakdown:', {
          cgst: taxes.cgst,
          sgst: taxes.sgst,
          igst: taxes.igst,
          total: taxes.cgst + taxes.sgst + taxes.igst
        });

        // ✅ FIX: Try to get vendor address from Supplier model
        let vendorAddress = "Address not available";
        if (savedReturn.returnItems[0]?.vendorId) {
          try {
            const Supplier = mongoose.model("Supplier");
            const supplier = await Supplier.findById(savedReturn.returnItems[0].vendorId)
              .select("address city state pincode")
              .lean();

            if (supplier && supplier.address) {
              vendorAddress = supplier.address;
              if (supplier.city) vendorAddress += `, ${supplier.city}`;
              if (supplier.state) vendorAddress += `, ${supplier.state}`;
              if (supplier.pincode) vendorAddress += ` - ${supplier.pincode}`;
            }
            console.log(`   Vendor Address: ${vendorAddress}`);
          } catch (err) {
            console.warn(`⚠️ SERVER: Could not fetch vendor address:`, err.message);
          }
        }

        // Create Debit Note
        const debitNoteData = {
          noteType: 'debit',
          noteNumber: noteNumber, // ✅ FIX: Add generated note number
          noteDate: savedReturn.returnDate || Date.now(),
          referenceType: 'purchase-order',
          referenceNumber: purchase.PURNo,
          referenceDate: purchase.purchaseDate,
          reason: 'goods-returned',
          reasonDescription: `Purchase return for ${purchase.PURNo}. ${remarks || ''}`.trim(),

          // Party details (vendor/supplier)
          partyDetails: {
            name: primaryVendor.vendor,
            address: vendorAddress, // ✅ FIX: Use actual or fallback address
            gst: primaryVendor.vendorCode || "",
            state: primaryVendor.vendorState || "Tamil Nadu"
          },

          // Items with return details
          items: debitNoteItems,

          // Financial totals
          subtotal: savedReturn.totalReturnValue,
          taxes: taxes,
          roundOff: 0,
          grandTotal: Math.round(savedReturn.totalReturnWithGst),

          // Link to Purchase Return
          purchaseReturn: savedReturn._id,
          PURTNo: savedReturn.PURTNo,
          isAutoGenerated: true,
          status: 'issued' // Auto-generated notes are immediately issued
        };

        console.log('📋 Debit Note Data:', {
          noteNumber: debitNoteData.noteNumber,
          noteType: debitNoteData.noteType,
          party: debitNoteData.partyDetails.name,
          partyAddress: debitNoteData.partyDetails.address,
          partyState: debitNoteData.partyDetails.state,
          items: debitNoteData.items.length,
          subtotal: debitNoteData.subtotal,
          taxes: debitNoteData.taxes,
          grandTotal: debitNoteData.grandTotal
        });

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
          // Continue even if PDF generation fails
        }

        // Update Purchase Return with Debit Note reference
        savedReturn.debitNote = debitNote._id;
        savedReturn.debitNoteNumber = debitNote.noteNumber;
        await savedReturn.save();

        console.log(`✅ SERVER: Linked Debit Note ${debitNote.noteNumber} to Return ${savedReturn.PURTNo}`);
      } catch (debitNoteError) {
        console.error("❌ SERVER: Error creating Debit Note:", debitNoteError);
        console.error("Stack trace:", debitNoteError.stack);
        // Continue even if debit note creation fails - Purchase Return is still saved
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
    const { PURNo, PoNo } = req.query;
    console.log('   Query params:', { PURNo, PoNo });

    const filter = {};

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
      .populate("debitNote", "noteNumber pdfUrl")
      .populate("createdBy", "name email");

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