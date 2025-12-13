import { useState, useEffect } from 'react';
import { Save, X, AlertCircle, CheckCircle, Package } from 'lucide-react';
import { createStoreEntry, updateStoreEntry } from '../../api/storeEntryApi';
import { showError, showWarning, showSuccess, showLoading, dismissAndSuccess, dismissAndError } from '../../utils/toast';
import OrderDetailsWithMeters from '../purchases/OrderDetailsWithMeters';

const StoreEntryForm = ({ purchaseData, initialValues, onSubmit, onCancel, isEditMode }) => {
  const [purchaseInfo, setPurchaseInfo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    storeEntryDate: new Date().toISOString().split('T')[0],
    entries: [],
    remarks: ''
  });

  // Load data on mount
  useEffect(() => {
    if (purchaseData && !isEditMode) {
      // CREATE MODE: Load from purchaseData prop
      loadFromPurchaseData(purchaseData);
    } else if (isEditMode && initialValues) {
      // EDIT MODE: Load from existing store entry
      loadFromExistingEntry(initialValues);
    }
  }, [purchaseData, initialValues, isEditMode]);

  const loadFromPurchaseData = (purchase) => {
    console.log("📦 Loading purchase data:", purchase);
    setPurchaseInfo(purchase);

    // Pre-populate entries from purchase.purchaseItems
    const prepopulatedEntries = [];

    // NEW FORMAT: Check if purchaseItems exists and has data
    if (purchase.purchaseItems && Array.isArray(purchase.purchaseItems) && purchase.purchaseItems.length > 0) {
      purchase.purchaseItems.forEach(purchaseItem => {
        // Handle items array safely
        const items = purchaseItem.items || [];
        items.forEach(item => {
          prepopulatedEntries.push({
            itemType: item.type || 'fabric',
            itemName: item.itemName || 'Unknown Item',
            supplierId: purchaseItem.vendorId?._id || purchaseItem.vendorId || null,
            supplierName: purchaseItem.vendor || 'Unknown Vendor',
            supplierCode: purchaseItem.vendorCode || '',
            unit: item.purchaseUnit || 'kg',
            purchaseQty: item.quantity || 0,
            invoiceNo: item.invoiceNo || '',
            invoiceDate: item.invoiceDate || null,
            hsn: item.hsn || '',
            invoiceQty: item.quantity || 0, // Default to purchase quantity
            storeInQty: 0, // User must enter
            shortage: 0,
            surplus: 0,
            remarks: ''
          });
        });
      });
    }

    // OLD FORMAT FALLBACK: fabricPurchases and accessoriesPurchases
    if (prepopulatedEntries.length === 0) {
      if (purchase.fabricPurchases && Array.isArray(purchase.fabricPurchases) && purchase.fabricPurchases.length > 0) {
        purchase.fabricPurchases.forEach(fabric => {
          prepopulatedEntries.push({
            itemType: 'fabric',
            itemName: fabric.fabricType || 'Unknown Fabric',
            supplierId: fabric.vendorId?._id || fabric.vendorId || null,
            supplierName: fabric.vendor || 'Unknown Vendor',
            supplierCode: fabric.vendorCode || '',
            unit: fabric.purchaseMode || 'kg',
            purchaseQty: fabric.quantity || 0,
            invoiceNo: fabric.invoiceNo || '',
            invoiceDate: fabric.invoiceDate || null,
            hsn: '',
            invoiceQty: fabric.quantity || 0,
            storeInQty: 0,
            shortage: 0,
            surplus: 0,
            remarks: fabric.remarks || ''
          });
        });
      }

      if (purchase.accessoriesPurchases && Array.isArray(purchase.accessoriesPurchases) && purchase.accessoriesPurchases.length > 0) {
        purchase.accessoriesPurchases.forEach(acc => {
          prepopulatedEntries.push({
            itemType: 'accessories',
            itemName: acc.productName || 'Unknown Accessory',
            supplierId: acc.vendorId?._id || acc.vendorId || null,
            supplierName: acc.vendor || 'Unknown Vendor',
            supplierCode: acc.vendorCode || '',
            unit: acc.purchaseMode || 'pieces',
            purchaseQty: acc.quantity || 0,
            invoiceNo: acc.invoiceNo || '',
            invoiceDate: acc.invoiceDate || null,
            hsn: '',
            invoiceQty: acc.quantity || 0,
            storeInQty: 0,
            shortage: 0,
            surplus: 0,
            remarks: acc.remarks || ''
          });
        });
      }
    }

    // If still no entries found, show warning
    if (prepopulatedEntries.length === 0) {
      console.warn("⚠️ No purchase items found in purchase data");
      showWarning("No purchase items found. Please check purchase data.");
    }

    console.log(`✅ Loaded ${prepopulatedEntries.length} items from purchase`);
    
    setFormData({ 
      ...formData, 
      entries: prepopulatedEntries,
      storeEntryDate: new Date().toISOString().split('T')[0]
    });
  };

  const loadFromExistingEntry = (entry) => {
    setFormData({
      storeEntryDate: entry.storeEntryDate 
        ? new Date(entry.storeEntryDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      entries: entry.entries || [],
      remarks: entry.remarks || ''
    });

    // Mock purchase info for display
    setPurchaseInfo({
      _id: entry.purchase,
      PURNo: entry.PURNo,
      purchaseDate: entry.purchaseDate,
      orderId: entry.orderId,
      orderDate: entry.orderDate,
      PoNo: entry.PoNo,
      orderType: entry.orderType,
      buyerCode: entry.buyerCode,
      PESNo: entry.PESNo,
      estimationDate: entry.estimationDate,
      status: 'Completed',
      order: {
        orderId: entry.orderId,
        orderDate: entry.orderDate,
        PoNo: entry.PoNo,
        orderType: entry.orderType,
        buyerDetails: { code: entry.buyerCode },
        products: []
      }
    });
  };

  const handleEntryChange = (index, field, value) => {
    const updatedEntries = [...formData.entries];
    updatedEntries[index][field] = value;

    // Auto-calculate shortage/surplus
    if (field === 'invoiceQty' || field === 'storeInQty') {
      const invoiceQty = parseFloat(updatedEntries[index].invoiceQty) || 0;
      const storeInQty = parseFloat(updatedEntries[index].storeInQty) || 0;

      if (invoiceQty > storeInQty) {
        updatedEntries[index].shortage = parseFloat((invoiceQty - storeInQty).toFixed(2));
        updatedEntries[index].surplus = 0;
      } else if (storeInQty > invoiceQty) {
        updatedEntries[index].surplus = parseFloat((storeInQty - invoiceQty).toFixed(2));
        updatedEntries[index].shortage = 0;
      } else {
        updatedEntries[index].shortage = 0;
        updatedEntries[index].surplus = 0;
      }
    }

    setFormData({ ...formData, entries: updatedEntries });
  };

  const handleSubmit = async () => {
    // Validation
    if (!purchaseInfo) {
      showError("Purchase data not loaded");
      return;
    }

    if (!formData.storeEntryDate) {
      showError("Please select Store Entry Date");
      return;
    }

    if (formData.entries.length === 0) {
      showError("No items found to create store entry");
      return;
    }

    const hasValidEntry = formData.entries.some(e => (parseFloat(e.storeInQty) || 0) > 0);
    if (!hasValidEntry) {
      showError("Please enter Store In Qty for at least one item");
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    const toastId = showLoading(isEditMode ? "Updating store entry..." : "Creating store entry...");

    try {
      const payload = {
        purchaseId: purchaseInfo._id,
        storeEntryDate: formData.storeEntryDate,
        entries: formData.entries.map(e => ({
          itemType: e.itemType,
          itemName: e.itemName,
          supplierId: e.supplierId,
          supplierName: e.supplierName,
          supplierCode: e.supplierCode,
          invoiceNo: e.invoiceNo,
          invoiceDate: e.invoiceDate,
          hsn: e.hsn,
          unit: e.unit,
          purchaseQty: e.purchaseQty,
          invoiceQty: parseFloat(e.invoiceQty) || 0,
          storeInQty: parseFloat(e.storeInQty) || 0,
          remarks: e.remarks
        })),
        remarks: formData.remarks
      };

      if (isEditMode && initialValues?._id) {
        await updateStoreEntry(initialValues._id, payload);
        dismissAndSuccess(toastId, "Store entry updated successfully!");
      } else {
        await createStoreEntry(payload);
        dismissAndSuccess(toastId, "Store entry created successfully!");
      }

      onSubmit();
    } catch (error) {
      console.error("Error saving store entry:", error);
      dismissAndError(toastId, error.response?.data?.message || "Failed to save store entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotals = () => {
    const totalInvoiceQty = formData.entries.reduce((sum, e) => sum + (parseFloat(e.invoiceQty) || 0), 0);
    const totalStoreInQty = formData.entries.reduce((sum, e) => sum + (parseFloat(e.storeInQty) || 0), 0);
    const totalShortage = formData.entries.reduce((sum, e) => sum + (e.shortage || 0), 0);
    const totalSurplus = formData.entries.reduce((sum, e) => sum + (e.surplus || 0), 0);

    return { totalInvoiceQty, totalStoreInQty, totalShortage, totalSurplus };
  };

  const totals = calculateTotals();

  if (!purchaseInfo) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading purchase data...</div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto bg-white p-5 rounded-2xl">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {isEditMode ? 'Edit Store Entry' : 'Create Store Entry'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {isEditMode ? 'Update store entry details' : 'Record material receipt in warehouse'}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            <X className="w-4 h-4 mr-1.5" />
            Cancel
          </button>
        </div>

        {/* Purchase Status Alert */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start">
          <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-800">
              ✅ Purchase is Completed - Ready for Store Entry
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Purchase: {purchaseInfo.PURNo} | Order: {purchaseInfo.orderId}
            </p>
          </div>
        </div>

        {/* Warning if no items */}
        {formData.entries.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-800">
                ⚠️ No Purchase Items Found
              </p>
              <p className="text-xs text-gray-600 mt-1">
                This purchase doesn't have any items. Please check the purchase data.
              </p>
            </div>
          </div>
        )}

        {/* Order & Purchase Details */}
        <OrderDetailsWithMeters
          selectedOrder={purchaseInfo.order || {
            orderId: purchaseInfo.orderId,
            orderDate: purchaseInfo.orderDate,
            PoNo: purchaseInfo.PoNo,
            orderType: purchaseInfo.orderType,
            buyerDetails: { code: purchaseInfo.buyerCode },
            products: []
          }}
          showEstimationFields={true}
          PESNo={purchaseInfo.PESNo}
          estimationDate={purchaseInfo.estimationDate}
        />

        {/* Purchase Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Purchase Details</h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Purchase ID</label>
              <div className="text-sm font-semibold text-gray-800">{purchaseInfo.PURNo}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Purchase Date</label>
              <div className="text-sm font-semibold text-gray-800">
                {purchaseInfo.purchaseDate ? new Date(purchaseInfo.purchaseDate).toLocaleDateString('en-IN') : '—'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Estimation ID</label>
              <div className="text-sm font-semibold text-gray-800">{purchaseInfo.PESNo || 'N/A'}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Estimation Date</label>
              <div className="text-sm font-semibold text-gray-800">
                {purchaseInfo.estimationDate ? new Date(purchaseInfo.estimationDate).toLocaleDateString('en-IN') : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Store Entry Date */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Store Entry Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Store Entry Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.storeEntryDate}
                onChange={(e) => setFormData({ ...formData, storeEntryDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                required
              />
            </div>
          </div>
        </div>

        {/* Items Table - Only show if there are entries */}
        {formData.entries.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
              <Package className="w-4 h-4 mr-2 text-blue-600" />
              Purchase Items ({formData.entries.length})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700">SI</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700">Type</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700">Item Name</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700">Supplier</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700">Unit</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700">Purchase Qty</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700">Invoice No</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700">Invoice Date</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700">Invoice Qty</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700">Store In Qty</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700">Diff</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {formData.entries.map((entry, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-2 py-2 text-gray-700 font-medium">{index + 1}</td>
                      <td className="px-2 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          entry.itemType === 'fabric' ? 'bg-blue-100 text-blue-700' :
                          entry.itemType === 'accessories' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {entry.itemType}
                        </span>
                      </td>
                      <td className="px-2 py-2 font-medium text-gray-800">{entry.itemName}</td>
                      <td className="px-2 py-2 text-gray-700">{entry.supplierName}</td>
                      <td className="px-2 py-2 text-gray-700 font-mono">{entry.unit}</td>
                      <td className="px-2 py-2 text-gray-700 font-semibold">{entry.purchaseQty}</td>
                      <td className="px-2 py-2">
                        <div className="w-full px-2 py-1 text-xs text-gray-700 min-h-[30px] flex items-center">
                          {entry.invoiceNo || '—'}
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <div className="w-full px-2 py-1 text-xs text-gray-700 min-h-[30px] flex items-center">
                          {entry.invoiceDate ? new Date(entry.invoiceDate).toLocaleDateString('en-IN') : '—'}
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={entry.invoiceQty}
                          onChange={(e) => handleEntryChange(index, 'invoiceQty', e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-xs font-semibold"
                          min="0"
                          step="0.01"
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={entry.storeInQty}
                          onChange={(e) => handleEntryChange(index, 'storeInQty', e.target.value)}
                          className="w-20 px-2 py-1 border border-blue-400 rounded text-xs font-semibold bg-blue-50"
                          min="0"
                          step="0.01"
                          placeholder="Enter"
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                      </td>
                      <td className="px-2 py-2">
                        {entry.shortage > 0 && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">
                            -{entry.shortage}
                          </span>
                        )}
                        {entry.surplus > 0 && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">
                            +{entry.surplus}
                          </span>
                        )}
                        {entry.shortage === 0 && entry.surplus === 0 && entry.storeInQty > 0 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            ✓
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={entry.remarks}
                          onChange={(e) => handleEntryChange(index, 'remarks', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          placeholder="Notes"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                  <tr className="font-bold">
                    <td colSpan="8" className="px-2 py-2 text-right text-gray-700">TOTALS:</td>
                    <td className="px-2 py-2 text-blue-700">{totals.totalInvoiceQty.toFixed(2)}</td>
                    <td className="px-2 py-2 text-green-700">{totals.totalStoreInQty.toFixed(2)}</td>
                    <td className="px-2 py-2">
                      {totals.totalShortage > 0 && (
                        <span className="text-red-700">-{totals.totalShortage.toFixed(2)}</span>
                      )}
                      {totals.totalSurplus > 0 && (
                        <span className="text-green-700">+{totals.totalSurplus.toFixed(2)}</span>
                      )}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* General Remarks
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">General Remarks</label>
          <textarea
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            rows="2"
            placeholder="Additional notes..."
          />
        </div> */}

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || formData.entries.length === 0}
            className="flex items-center px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-1.5" />
            {isSubmitting ? 'Saving...' : isEditMode ? 'Update Store Entry' : 'Create Store Entry'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoreEntryForm;