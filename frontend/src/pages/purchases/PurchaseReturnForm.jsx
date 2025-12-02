import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, X, AlertTriangle, Save } from 'lucide-react';
import { getPurchaseForReturn, getNextPURTNo } from '../../api/purchaseReturnApi';
import PurchaseDetailsReadonly from './PurchaseDetailsReadonly';

const PurchaseReturnForm = ({ initialValues, onSubmit, onCancel, submitLabel, isEditMode, isSubmitting }) => {
  const [formData, setFormData] = useState({
    returnDate: new Date().toISOString().split('T')[0],
    remarks: '',
    generateDebitNote: true,
    ...initialValues
  });

  const [PURNo, setPURNo] = useState('');
  const [purchaseData, setPurchaseData] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nextPURTNo, setNextPURTNo] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // Fetch next PURTNo
  useEffect(() => {
    const fetchNextPURTNo = async () => {
      if (!isEditMode) {
        try {
          const response = await getNextPURTNo();
          setNextPURTNo(response.data.PURTNo);
        } catch (error) {
          console.error('❌ CLIENT: Error fetching next PURTNo:', error);
        }
      }
    };

    fetchNextPURTNo();
  }, [isEditMode]);

  // Track unsaved changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasUnsavedChanges(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [formData, returnItems]);

  // Fetch purchase details
  const handleFetchPurchase = async () => {
    if (!PURNo || PURNo.trim() === '') {
      alert('Please enter a Purchase ID (PURNo)');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 CLIENT: Fetching purchase with PURNo:', PURNo.trim());
      const response = await getPurchaseForReturn(PURNo.trim());
      
      console.log('📦 CLIENT: Raw response:', response);
      console.log('📦 CLIENT: Response data:', response.data);
      
      const purchase = response.data;
      
      if (typeof purchase === 'string' && purchase.includes('<!doctype html>')) {
        console.error('❌ CLIENT: Received HTML instead of JSON - API endpoint not found');
        alert('Error: Cannot connect to backend API. Please check:\n1. Backend server is running\n2. API routes are registered correctly');
        setPurchaseData(null);
        setReturnItems([]);
        return;
      }
      
      console.log('✅ CLIENT: Fetched purchase:', purchase);
      setPurchaseData(purchase);

      // Initialize return items from purchase
      const initialReturnItems = [];
      
      // NEW STRUCTURE: Check purchaseItems first
      if (purchase.purchaseItems && purchase.purchaseItems.length > 0) {
        console.log('📦 CLIENT: Using NEW purchaseItems structure');
        purchase.purchaseItems.forEach(vendorItem => {
          vendorItem.items.forEach(item => {
            initialReturnItems.push({
              id: Date.now() + Math.random(),
              itemName: item.itemName,
              itemType: item.type,
              gsm: item.gsm || '',
              color: item.color || '',
              purchaseUnit: item.purchaseUnit,
              originalQuantity: item.quantity,
              originalCostPerUnit: item.costPerUnit,
              invoiceNo: item.invoiceNo || '',
              invoiceDate: item.invoiceDate || '',
              hsn: item.hsn || '',
              returnQuantity: 0,
              returnReason: 'damaged-goods',
              reasonDescription: '',
              gstPercentage: item.gstPercentage || 5
            });
          });
        });
      }
      // OLD STRUCTURE: Fall back to fabricPurchases and accessoriesPurchases
      else {
        console.log('📦 CLIENT: Using OLD fabricPurchases/accessoriesPurchases structure');
        
        // Process fabricPurchases
        if (purchase.fabricPurchases && purchase.fabricPurchases.length > 0) {
          purchase.fabricPurchases.forEach(fabric => {
            initialReturnItems.push({
              id: Date.now() + Math.random(),
              itemName: fabric.productName || fabric.fabricType || 'Fabric',
              itemType: 'fabric',
              gsm: fabric.gsm || '',
              color: Array.isArray(fabric.colors) ? fabric.colors.join(', ') : (fabric.colors || ''),
              purchaseUnit: fabric.purchaseMode || 'kg',
              originalQuantity: fabric.quantity || 0,
              originalCostPerUnit: fabric.costPerUnit || 0,
              invoiceNo: '',
              invoiceDate: '',
              hsn: '',
              returnQuantity: 0,
              returnReason: 'damaged-goods',
              reasonDescription: '',
              gstPercentage: fabric.gstPercentage || 5
            });
          });
        }

        // Process accessoriesPurchases
        if (purchase.accessoriesPurchases && purchase.accessoriesPurchases.length > 0) {
          purchase.accessoriesPurchases.forEach(accessory => {
            initialReturnItems.push({
              id: Date.now() + Math.random(),
              itemName: accessory.productName || 'Accessory',
              itemType: 'accessories',
              gsm: '',
              color: accessory.color || '',
              purchaseUnit: accessory.purchaseMode || 'pieces',
              originalQuantity: accessory.quantity || 0,
              originalCostPerUnit: accessory.costPerUnit || 0,
              invoiceNo: '',
              invoiceDate: '',
              hsn: '',
              returnQuantity: 0,
              returnReason: 'damaged-goods',
              reasonDescription: '',
              gstPercentage: accessory.gstPercentage || 5
            });
          });
        }
      }

      console.log('📦 CLIENT: Initialized return items:', initialReturnItems);
      setReturnItems(initialReturnItems);

      if (initialReturnItems.length === 0) {
        alert('⚠️ No purchase items found in this purchase to return!');
      }
    } catch (error) {
      console.error('❌ CLIENT: Error fetching purchase:', error);
      alert(error.response?.data?.message || 'Failed to fetch purchase details');
      setPurchaseData(null);
      setReturnItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnItemChange = (id, field, value) => {
    setReturnItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleRemoveReturnItem = (id) => {
    setReturnItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const calculateTotals = () => {
    let totalValue = 0;
    let totalCgst = 0;
    let totalSgst = 0;

    returnItems.forEach(item => {
      if (item.returnQuantity > 0) {
        const itemValue = item.returnQuantity * item.originalCostPerUnit;
        totalValue += itemValue;

        const gst = (itemValue * item.gstPercentage) / 100;
        totalCgst += gst / 2;
        totalSgst += gst / 2;
      }
    });

    return {
      totalValue: totalValue.toFixed(2),
      totalCgst: totalCgst.toFixed(2),
      totalSgst: totalSgst.toFixed(2),
      totalWithGst: (totalValue + totalCgst + totalSgst).toFixed(2)
    };
  };

  const totals = calculateTotals();

  const handleCancelClick = () => {
    if (hasUnsavedChanges) {
      setShowExitModal(true);
    } else {
      onCancel();
    }
  };

  const confirmExit = () => {
    setShowExitModal(false);
    setHasUnsavedChanges(false);
    onCancel();
  };

  const handleSubmit = () => {
    console.log('\n🔍 CLIENT: ========== SUBMIT VALIDATION START ==========');

    if (!purchaseData) {
      alert('Please fetch purchase details first');
      return;
    }

    const itemsToReturn = returnItems.filter(item => item.returnQuantity > 0);

    if (itemsToReturn.length === 0) {
      alert('Please add at least one item to return (quantity > 0)');
      return;
    }

    // Validate quantities
    for (const item of itemsToReturn) {
      if (item.returnQuantity > item.originalQuantity) {
        alert(`Return quantity for "${item.itemName}" cannot exceed original quantity (${item.originalQuantity})`);
        return;
      }
    }

    const submitData = {
      purchaseId: purchaseData._id,
      PURNo: purchaseData.PURNo,
      returnDate: formData.returnDate,
      returnItems: itemsToReturn.map(item => ({
        itemName: item.itemName,
        itemType: item.itemType,
        gsm: item.gsm,
        color: item.color,
        purchaseUnit: item.purchaseUnit,
        originalQuantity: item.originalQuantity,
        originalCostPerUnit: item.originalCostPerUnit,
        returnQuantity: parseFloat(item.returnQuantity),
        returnReason: item.returnReason,
        reasonDescription: item.reasonDescription || '',
        gstPercentage: item.gstPercentage
      })),
      remarks: formData.remarks,
      generateDebitNote: formData.generateDebitNote
    };

    console.log('📤 CLIENT: Final submit data:', JSON.stringify(submitData, null, 2));
    console.log('🔍 CLIENT: ========== SUBMIT VALIDATION END ==========\n');

    setHasUnsavedChanges(false);
    onSubmit(submitData);
  };

  const reasonOptions = [
    { value: 'damaged-goods', label: 'Damaged Goods' },
    { value: 'quality-issue', label: 'Quality Issue' },
    { value: 'wrong-item', label: 'Wrong Item' },
    { value: 'excess-quantity', label: 'Excess Quantity' },
    { value: 'defective', label: 'Defective' },
    { value: 'not-as-described', label: 'Not As Described' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <>
      <div className="w-full mx-auto bg-white p-5 rounded-2xl">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {isEditMode ? 'Edit Purchase Return' : 'Create Purchase Return'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Return goods and auto-generate debit note
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancelClick}
                className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                <X className="w-4 h-4 mr-1.5" />
                Cancel
              </button>
            </div>
          </div>

          {/* Return Details Section */}
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Return Details</h3>
            
            <div className="grid grid-cols-4 gap-3">
              {/* Return Date */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Return Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.returnDate}
                  onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* PURNo Input */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Purchase ID (PURNo) <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={PURNo}
                    onChange={(e) => setPURNo(e.target.value)}
                    placeholder="PUR-10"
                    disabled={purchaseData !== null}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
                  />
                  {!purchaseData && (
                    <button
                      type="button"
                      onClick={handleFetchPurchase}
                      disabled={loading}
                      className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* PURTNo Display */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Return ID (PURTNo)
                </label>
                <input
                  type="text"
                  value={isEditMode ? formData.PURTNo : (nextPURTNo || 'Loading...')}
                  readOnly
                  className={`w-full px-3 py-2 text-sm border rounded-lg ${
                    nextPURTNo || (isEditMode && formData.PURTNo)
                      ? 'bg-orange-50 border-orange-300 text-orange-800 font-semibold'
                      : 'bg-gray-100 border-gray-300 text-gray-500'
                  }`}
                  placeholder="Auto-generated"
                />
              </div>

              {/* Generate Debit Note */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Auto-Generate Debit Note
                </label>
                <div className="flex items-center h-10">
                  <input
                    type="checkbox"
                    checked={formData.generateDebitNote}
                    onChange={(e) => setFormData({ ...formData, generateDebitNote: e.target.checked })}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Yes, generate automatically
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              <span className="ml-3 text-gray-600">Fetching purchase details...</span>
            </div>
          )}

          {/* Purchase Details (Read-only) */}
          {purchaseData && (
            <PurchaseDetailsReadonly purchase={purchaseData} />
          )}

          {/* Return Items Section */}
          {purchaseData && returnItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Return Items Entry</h3>
                <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded text-sm font-semibold">
                  Total Return Value: ₹{totals.totalWithGst}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-2 py-2 text-left font-semibold text-gray-700">Invoice No</th>
                      <th className="border px-2 py-2 text-center font-semibold text-gray-700">Invoice Date</th>
                      <th className="border px-2 py-2 text-center font-semibold text-gray-700">HSN</th>
                      <th className="border px-2 py-2 text-left font-semibold text-gray-700">Item Name</th>
                      <th className="border px-2 py-2 text-center font-semibold text-gray-700">GSM</th>
                      <th className="border px-2 py-2 text-center font-semibold text-gray-700">Color</th>
                      <th className="border px-2 py-2 text-center font-semibold text-gray-700">Unit</th>
                      <th className="border px-2 py-2 text-center font-semibold text-gray-700">Original Qty</th>
                      <th className="border px-2 py-2 text-center font-semibold text-gray-700">Return Qty</th>
                      <th className="border px-2 py-2 text-center font-semibold text-gray-700">Rate (₹)</th>
                      <th className="border px-2 py-2 text-left font-semibold text-gray-700">Return Reason</th>
                      <th className="border px-2 py-2 text-left font-semibold text-gray-700">Description</th>
                      <th className="border px-2 py-2 text-right font-semibold text-gray-700">Value (₹)</th>
                      <th className="border px-2 py-2 text-center font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnItems.map((item) => {
                      const itemValue = (item.returnQuantity * item.originalCostPerUnit).toFixed(2);
                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="border px-2 py-2 text-gray-700">{item.invoiceNo || '—'}</td>
                          <td className="border px-2 py-2 text-center text-gray-600">
                            {item.invoiceDate ? new Date(item.invoiceDate).toLocaleDateString('en-IN') : '—'}
                          </td>
                          <td className="border px-2 py-2 text-center text-gray-600">{item.hsn || '—'}</td>
                          <td className="border px-2 py-2 font-semibold text-gray-800">{item.itemName}</td>
                          <td className="border px-2 py-2 text-center text-gray-600">{item.gsm || '—'}</td>
                          <td className="border px-2 py-2 text-center text-gray-600">{item.color || '—'}</td>
                          <td className="border px-2 py-2 text-center text-gray-600">{item.purchaseUnit}</td>
                          <td className="border px-2 py-2 text-center font-semibold text-blue-600">
                            {item.originalQuantity}
                          </td>
                          <td className="border px-2 py-2">
                            <input
                              type="number"
                              min="0"
                              max={item.originalQuantity}
                              step="0.01"
                              value={item.returnQuantity}
                              onChange={(e) => handleReturnItemChange(item.id, 'returnQuantity', e.target.value)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-orange-500"
                            />
                          </td>
                          <td className="border px-2 py-2 text-center text-gray-700">
                            ₹{item.originalCostPerUnit}
                          </td>
                          <td className="border px-2 py-2">
                            <select
                              value={item.returnReason}
                              onChange={(e) => handleReturnItemChange(item.id, 'returnReason', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-orange-500"
                            >
                              {reasonOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="border px-2 py-2">
                            <input
                              type="text"
                              value={item.reasonDescription}
                              onChange={(e) => handleReturnItemChange(item.id, 'reasonDescription', e.target.value)}
                              placeholder="Optional..."
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-orange-500"
                            />
                          </td>
                          <td className="border px-2 py-2 text-right font-semibold text-orange-600">
                            ₹{itemValue}
                          </td>
                          <td className="border px-2 py-2 text-center">
                            <button
                              onClick={() => handleRemoveReturnItem(item.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-orange-50 font-semibold">
                      <td colSpan="12" className="border px-2 py-2 text-right">Subtotal:</td>
                      <td className="border px-2 py-2 text-right text-gray-800">₹{totals.totalValue}</td>
                      <td className="border"></td>
                    </tr>
                    <tr className="bg-orange-50">
                      <td colSpan="12" className="border px-2 py-2 text-right">CGST:</td>
                      <td className="border px-2 py-2 text-right text-gray-600">₹{totals.totalCgst}</td>
                      <td className="border"></td>
                    </tr>
                    <tr className="bg-orange-50">
                      <td colSpan="12" className="border px-2 py-2 text-right">SGST:</td>
                      <td className="border px-2 py-2 text-right text-gray-600">₹{totals.totalSgst}</td>
                      <td className="border"></td>
                    </tr>
                    <tr className="bg-orange-100 font-bold text-base">
                      <td colSpan="12" className="border px-2 py-3 text-right">Grand Total:</td>
                      <td className="border px-2 py-3 text-right text-orange-600">₹{totals.totalWithGst}</td>
                      <td className="border"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Remarks */}
          {purchaseData && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows="3"
                placeholder="Additional notes about the return..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
              />
            </div>
          )}

          {/* Submit Buttons */}
          {purchaseData && (
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleCancelClick}
                disabled={isSubmitting}
                className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Submitting...' : (submitLabel || 'Create Return')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowExitModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <button
              onClick={() => setShowExitModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Close Form?</h2>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to close? Any unsaved changes will be lost.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowExitModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
              >
                Stay
              </button>
              <button
                onClick={confirmExit}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PurchaseReturnForm;