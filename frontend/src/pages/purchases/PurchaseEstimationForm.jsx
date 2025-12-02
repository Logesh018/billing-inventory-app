import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, FileText, Package, AlertTriangle } from 'lucide-react';
import { axiosInstance } from '../../lib/axios';
import OrderDetailsWithMeters from "./OrderDetailsWithMeters";
import PurchaseItemsSection from './PurchaseItemsSection';


const PurchaseEstimationForm = ({ initialValues, onSubmit, onCancel, submitLabel, isEditMode }) => {
  const [formData, setFormData] = useState({
    estimationDate: new Date().toISOString().split('T')[0],
    PoNo: '',
    remarks: '',
    PESNo: initialValues?.PESNo || '',
    ...initialValues
  });

  const [purchaseItems, setPurchaseItems] = useState(
    initialValues?.purchaseItems && initialValues.purchaseItems.length > 0
      ? initialValues.purchaseItems.map(item => ({
        ...item,
        id: item.id || Date.now() + Math.random(),
        items: item.items.map(row => ({
          ...row,
          id: row.id || Date.now() + Math.random()
        }))
      }))
      : [{
        id: Date.now(),
        vendor: '',
        vendorCode: '',
        vendorState: '',
        supplierId: '',
        gstType: 'CGST+SGST',
        items: [{
          id: Date.now() + Math.random(),
          type: 'fabric',
          itemName: '',
          gsm: '',
          accessoryType: 'other',
          otherType: '',
          color: '',
          purchaseUnit: 'kg',
          quantity: '',
          costPerUnit: '',
          gstPercentage: 5,
          customGstInput: false,
        }]
      }]
  );

  const [grandTotal, setGrandTotal] = useState(0);
  const [orderSuggestions, setOrderSuggestions] = useState([]);
  const [showOrderDropdown, setShowOrderDropdown] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [nextPESNo, setNextPESNo] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // Fetch the next PESNo when component mounts
  useEffect(() => {
    const fetchNextPESNo = async () => {
      if (!isEditMode) {
        try {
          const response = await axiosInstance.get('/purchase-estimations/next-pes-no');
          console.log('✅ CLIENT: Fetched next PESNo:', response.data.PESNo);
          setNextPESNo(response.data.PESNo);
        } catch (error) {
          console.error('❌ CLIENT: Error fetching next PESNo:', error);
        }
      }
    };

    fetchNextPESNo();
  }, [isEditMode]);

  useEffect(() => {
    // Don't mark as changed on initial load
    const timer = setTimeout(() => {
      setHasUnsavedChanges(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [formData, purchaseItems]);

  useEffect(() => {
    const total = purchaseItems.reduce((sum, item) => {
      return sum + item.items.reduce((itemSum, row) => {
        const rowTotal = (parseFloat(row.quantity) || 0) * (parseFloat(row.costPerUnit) || 0);
        const gstPercentage = row.gstPercentage || 0;
        const gstType = row.gstType || 'CGST+SGST';

        let gstAmount = 0;
        if (gstType === 'CGST+SGST') {
          gstAmount = rowTotal * (gstPercentage / 100);
        } else {
          gstAmount = rowTotal * (gstPercentage / 100);
        }

        return itemSum + rowTotal + gstAmount;
      }, 0);
    }, 0);
    setGrandTotal(total);
  }, [purchaseItems]);

  const searchOrders = async (searchTerm) => {
    if (searchTerm.length < 2) {
      setOrderSuggestions([]);
      setShowOrderDropdown(false);
      return;
    }
    try {
      const response = await axiosInstance.get(`/purchase-estimations/search/orders?q=${encodeURIComponent(searchTerm)}`);
      console.log('✅ CLIENT: Order search results:', response.data);
      setOrderSuggestions(Array.isArray(response.data) ? response.data : []);
      setShowOrderDropdown(true);
    } catch (error) {
      console.error('❌ CLIENT: Error searching orders:', error);
      setOrderSuggestions([]);
      setShowOrderDropdown(false);
    }
  };

  const fetchOrderDetails = async (PoNo) => {
    setOrderLoading(true);
    try {
      const response = await axiosInstance.get(`/purchase-estimations/order/${encodeURIComponent(PoNo)}`);
      console.log('✅ CLIENT: Fetched order details:', response.data);
      setSelectedOrder(response.data);
      setFormData(prev => ({ ...prev, PoNo: response.data.PoNo }));
      setShowOrderDropdown(false);
      setOrderSuggestions([]);
    } catch (error) {
      console.error('❌ CLIENT: Error fetching order details:', error);
      alert('Failed to fetch order details');
    } finally {
      setOrderLoading(false);
    }
  };

  // Handle cancel with confirmation
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

  const cancelExit = () => {
    setShowExitModal(false);
  };

  const handleSubmit = () => {
    console.log('\n🔍 ========== SUBMIT VALIDATION START ==========');
    console.log('📦 Current purchaseItems state:', JSON.stringify(purchaseItems, null, 2));

    // Check if purchaseItems has valid items with actual data
    const hasValidItems = purchaseItems.some(item => {
      console.log(`\n🔎 Checking item - Vendor: "${item.vendor}"`);
      console.log(`   Items array length: ${item.items?.length || 0}`);
      
      if (item.items) {
        item.items.forEach((row, index) => {
          console.log(`   Row ${index + 1}:`, {
            itemName: row.itemName,
            quantity: row.quantity,
            costPerUnit: row.costPerUnit
          });
        });
      }

      const isValid = item.vendor &&
        item.items &&
        item.items.some(row =>
          row.itemName &&
          row.quantity &&
          row.costPerUnit
        );
      
      console.log(`   ✓ Item valid: ${isValid}`);
      return isValid;
    });

    console.log(`\n📊 Validation result - hasValidItems: ${hasValidItems}`);

    if (!hasValidItems) {
      console.error('❌ VALIDATION FAILED: No valid items found');
      alert('Please add at least one complete item with vendor, item name, quantity, and cost');
      return;
    }

    console.log('✅ Validation passed - transforming data...\n');

    const transformedPurchaseItems = purchaseItems.map((item, itemIndex) => {
      console.log(`🔄 Transforming item ${itemIndex + 1}:`, item.vendor);
      
      return {
        vendor: item.vendor,
        vendorCode: item.vendorCode || '',
        vendorState: item.vendorState || '',
        vendorId: item.supplierId || null,
        gstType: item.gstType || 'CGST+SGST',
        items: item.items.map((row, rowIndex) => {
          console.log(`   Row ${rowIndex + 1}:`, {
            type: row.type,
            itemName: row.itemName,
            quantity: parseFloat(row.quantity) || 0,
            costPerUnit: parseFloat(row.costPerUnit) || 0
          });
          
          return {
            type: row.type,
            itemName: row.itemName,
            gsm: row.gsm || '',
            accessoryType: row.accessoryType || 'other',
            otherType: row.otherType || '',
            color: row.color || '',
            purchaseUnit: row.purchaseUnit,
            quantity: parseFloat(row.quantity) || 0,
            costPerUnit: parseFloat(row.costPerUnit) || 0,
            gstPercentage: parseFloat(row.gstPercentage) || 0,
          };
        })
      };
    });

    const submitData = {
      estimationDate: formData.estimationDate,
      remarks: formData.remarks,
      PoNo: formData.PoNo || null,
      orderId: selectedOrder?._id || null,
      purchaseItems: transformedPurchaseItems,
      fabricCostEstimation: [],
    };

    console.log('\n📤 Final submit data:', JSON.stringify(submitData, null, 2));
    console.log('🔍 ========== SUBMIT VALIDATION END ==========\n');

    // Mark as saved so modal doesn't show on successful submit
    setHasUnsavedChanges(false);
    onSubmit(submitData);
  };

  return (
    <>
      <div className="w-full mx-auto bg-white p-5 rounded-2xl">
        <div className="space-y-2">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {isEditMode ? 'Edit Purchase Estimation' : 'Create Purchase Estimation'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Create estimation for order materials
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

          {/* Estimation Date and Order Search */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 shadow-sm">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Estimation Date</label>
                <input
                  type="date"
                  value={formData.estimationDate}
                  onChange={(e) => setFormData({ ...formData, estimationDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="relative">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Order (ID)
                </label>
                <input
                  type="text"
                  value={formData.PoNo}
                  onChange={(e) => {
                    setFormData({ ...formData, PoNo: e.target.value });
                    searchOrders(e.target.value);
                  }}
                  onBlur={() => setTimeout(() => setShowOrderDropdown(false), 200)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search by Order ID..."
                />
                {showOrderDropdown && orderSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
                    {orderSuggestions.map((order) => (
                      <div
                        key={order._id}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                        onClick={() => fetchOrderDetails(order.PoNo)}
                      >
                        <div className="font-medium text-sm text-gray-800">{order.PoNo}</div>
                        <div className="text-xs text-gray-600">
                          {order.buyerName} • {new Date(order.orderDate).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* PESNo Display */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  P. Estimation(ID)
                </label>
                <input
                  type="text"
                  value={isEditMode ? formData.PESNo : (nextPESNo || 'Loading...')}
                  readOnly
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${(isEditMode && formData.PESNo) || nextPESNo
                    ? 'bg-blue-50 border-blue-300 text-blue-800 font-semibold'
                    : 'bg-gray-100 border-gray-300 text-gray-500'
                    }`}
                  placeholder="Auto-generated on save"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {isEditMode
                    ? "Estimation ID (Read-only)"
                    : nextPESNo
                      ? `Preview - Will be assigned on save`
                      : "Generating preview..."
                  }
                </div>
              </div>

            </div>
          </div>

          {orderLoading && (
            <div className="flex justify-center items-center py-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Loading order details...</span>
            </div>
          )}

          {/* Order Details Display (Read-only) - Simplified without meter calculations */}
          {selectedOrder && (
            <OrderDetailsWithMeters selectedOrder={selectedOrder} />
          )}

          <PurchaseItemsSection
            purchaseItems={purchaseItems}
            setPurchaseItems={setPurchaseItems}
            showStateField={true}
            showGstTypeToggle={true}
          />

          <div className="flex justify-between pt-4">
            <div className="w-2/3">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Remarks</label>
              <input
                type="text"
                value={formData.remarks || ''}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Additional notes..."
              />
            </div>
            <div className="bg-white rounded-lg px-6 py-3 border border-gray-200 shadow-sm min-w-[180px]">
              <div className="text-sm text-gray-600">Grand Total</div>
              <div className="text-2xl font-bold text-green-600">₹{grandTotal.toLocaleString()}</div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancelClick}
              className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium shadow-sm"
            >
              <Save className="w-4 h-4 mr-1.5" />
              {submitLabel || 'Save Estimation'}
            </button>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={cancelExit}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
            {/* Close button */}
            <button
              onClick={cancelExit}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="p-6">
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-orange-600" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
                Close Form?
              </h2>

              {/* Message */}
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to close this form? Any unsaved changes will be lost.
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={cancelExit}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Stay on Form
                </button>
                <button
                  onClick={confirmExit}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Close Form
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PurchaseEstimationForm;