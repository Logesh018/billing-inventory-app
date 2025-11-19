import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, FileText, Package } from 'lucide-react';
import { axiosInstance } from '../../lib/axios';
import OrderDetailsWithMeters from './OrderDetailsWithMeters';

const ItemForm = ({ item, onUpdateItemForm, onRemoveItemForm, onAddItemRow, onRemoveItemRow, onUpdateItemRow }) => {
  const [supplierSuggestions, setSupplierSuggestions] = useState([]);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  const handleNumberFocus = (e) => {
    if (e.target.value === '0') {
      e.target.value = '';
    }
  };

  const searchSuppliers = async (searchTerm) => {
    if (searchTerm.length < 2) {
      setSupplierSuggestions([]);
      setShowSupplierDropdown(false);
      return;
    }

    try {
      const { data } = await axiosInstance.get(`/purchase-estimations/search/suppliers?q=${searchTerm}`);
      const uniqueSuppliers = data.filter(
        (supplier, index, self) =>
          index === self.findIndex(
            (s) =>
              (s._id && s._id === supplier._id) ||
              (s.name === supplier.name && s.mobile === supplier.mobile)
          )
      );
      setSupplierSuggestions(uniqueSuppliers);
      setShowSupplierDropdown(true);
    } catch (error) {
      console.error("Error searching suppliers:", error);
      setSupplierSuggestions([]);
      setShowSupplierDropdown(false);
    }
  };

  const selectSupplier = (supplier) => {
    onUpdateItemForm(item.id, 'vendor', supplier.name);
    onUpdateItemForm(item.id, 'supplierId', supplier._id);
    onUpdateItemForm(item.id, 'vendorCode', supplier.code || '');
    setShowSupplierDropdown(false);
    setSupplierSuggestions([]);
  };

  const calculateRowTotal = (row) => {
    const quantity = parseFloat(row.quantity) || 0;
    const cost = parseFloat(row.costPerUnit) || 0;
    return quantity * cost;
  };

  const calculateTotalWithGst = (total, gst) => {
    const gstAmount = total * (gst / 100);
    return total + gstAmount;
  };

  const itemGrandTotal = item.items.reduce((sum, row) => sum + calculateRowTotal(row), 0);
  const itemGrandTotalWithGst = item.items.reduce((sum, row) => {
    const rowTotal = calculateRowTotal(row);
    return sum + calculateTotalWithGst(rowTotal, row.gstPercentage || 0);
  }, 0);

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow w-full">
      {/* Supplier Row */}
      <div className="flex flex-wrap items-end gap-2 mb-3 pb-3 border-b border-gray-200">
        <div className="w-32 relative">
          <label className="text-xs text-gray-500 block mb-1">Supplier</label>
          <input
            type="text"
            value={item.vendor}
            onChange={(e) => {
              onUpdateItemForm(item.id, 'vendor', e.target.value);
              searchSuppliers(e.target.value);
            }}
            onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 200)}
            placeholder="Search supplier"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 bg-white text-gray-900 rounded focus:ring-1 focus:ring-blue-400 h-9"
          />
          {showSupplierDropdown && supplierSuggestions.length > 0 && (
            <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
              {supplierSuggestions.map((supplier, index) => (
                <div
                  key={supplier._id || index}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-xs text-gray-700"
                  onClick={() => selectSupplier(supplier)}
                >
                  <div className="font-medium text-gray-700">{supplier.name}</div>
                  <div className="text-gray-500">{supplier.mobile || supplier.code}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-20">
          <label className="text-xs text-gray-500 block mb-1">Code</label>
          <input
            type="text"
            value={item.vendorCode || ''}
            onChange={(e) => onUpdateItemForm(item.id, 'vendorCode', e.target.value)}
            placeholder="Code"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 bg-white text-gray-900 rounded focus:ring-1 focus:ring-blue-400 h-9"
          />
        </div>

        <button
          type="button"
          onClick={() => onAddItemRow(item.id)}
          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded text-xs font-medium transition-colors h-9 flex items-center gap-1"
          title="Add Row"
        >
          <Plus className="w-3 h-3" />
          Row
        </button>

        <div className="ml-auto">
          <button
            type="button"
            onClick={() => onRemoveItemForm(item.id)}
            className="text-red-500 hover:bg-red-50 rounded-full p-2 transition-colors"
            title="Remove Item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Item Rows */}
      <div className="space-y-2">
        {item.items.map((row) => {
          const rowTotal = calculateRowTotal(row);
          const rowTotalWithGst = calculateTotalWithGst(rowTotal, row.gstPercentage || 0);

          return (
            <div key={row.id} className="flex items-end gap-2 flex-nowrap">
              <div className="w-20">
                <label className="text-xs text-gray-500 block mb-1">Type</label>
                <select
                  value={row.type}
                  onChange={(e) => onUpdateItemRow(item.id, row.id, 'type', e.target.value)}
                  className="w-full text-sm border border-gray-300 bg-white text-gray-900 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-400 h-9"
                >
                  <option value="fabric">Fabric</option>
                  <option value="accessories">Accessories</option>
                </select>
              </div>

              <div className="w-32">
                <label className="text-xs text-gray-500 block mb-1">Item Name</label>
                <input
                  type="text"
                  value={row.itemName}
                  onChange={(e) => onUpdateItemRow(item.id, row.id, 'itemName', e.target.value)}
                  placeholder="Item Name"
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 bg-white text-gray-900 rounded focus:ring-1 focus:ring-blue-400 h-9"
                />
              </div>

              {row.type === 'fabric' && (
                <div className="w-16">
                  <label className="text-xs text-gray-500 block mb-1">GSM</label>
                  <input
                    type="text"
                    value={row.gsm || ''}
                    onChange={(e) => onUpdateItemRow(item.id, row.id, 'gsm', e.target.value)}
                    placeholder="GSM"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 bg-white text-gray-900 rounded focus:ring-1 focus:ring-blue-400 h-9"
                  />
                </div>
              )}

              {row.type === 'accessories' && (
                <div className="w-20">
                  <label className="text-xs text-gray-500 block mb-1">Acc. Type</label>
                  <select
                    value={row.accessoryType || 'other'}
                    onChange={(e) => onUpdateItemRow(item.id, row.id, 'accessoryType', e.target.value)}
                    className="w-full text-xs border border-gray-300 bg-white text-gray-900 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-400 h-9"
                  >
                    <option value="buttons">Buttons</option>
                    <option value="packets">Packets</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}

              <div className="w-24">
                <label className="text-xs text-gray-500 block mb-1">Color</label>
                <input
                  type="text"
                  value={row.color || ''}
                  onChange={(e) => onUpdateItemRow(item.id, row.id, 'color', e.target.value)}
                  placeholder="Color"
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 bg-white text-gray-900 rounded focus:ring-1 focus:ring-blue-400 h-9"
                />
              </div>

              <div className="w-20">
                <label className="text-xs text-gray-500 block mb-1">Unit</label>
                <select
                  value={row.purchaseUnit}
                  onChange={(e) => onUpdateItemRow(item.id, row.id, 'purchaseUnit', e.target.value)}
                  className="w-full text-xs border border-gray-300 bg-white text-gray-900 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-400 h-9"
                >
                  {row.type === 'fabric' ? (
                    <>
                      <option value="kg">per KG</option>
                      <option value="meter">per Meter</option>
                      <option value="piece">per Piece</option>
                    </>
                  ) : (
                    <>
                      <option value="qty">per Qty</option>
                      <option value="piece">per Piece</option>
                      <option value="packet">per Packet</option>
                    </>
                  )}
                </select>
              </div>

              <div className="w-16">
                <label className="text-xs text-gray-500 block mb-1">
                  {row.type === 'fabric'
                    ? (row.purchaseUnit === 'kg' ? 'KG' : row.purchaseUnit === 'meter' ? 'Mtr' : 'Pcs')
                    : (row.purchaseUnit === 'qty' ? 'Qty' : row.purchaseUnit === 'packet' ? 'Pkts' : 'Pcs')
                  }
                </label>
                <input
                  type="number"
                  value={row.quantity || ''}
                  onFocus={handleNumberFocus}
                  onChange={(e) => onUpdateItemRow(item.id, row.id, 'quantity', e.target.value)}
                  placeholder="Qty"
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 bg-white text-gray-900 rounded focus:ring-1 focus:ring-blue-400 h-9"
                />
              </div>

              <div className="w-20">
                <label className="text-xs text-gray-500 block mb-1">
                  {row.type === 'fabric'
                    ? (row.purchaseUnit === 'kg' ? '₹/KG' : row.purchaseUnit === 'meter' ? '₹/Mtr' : '₹/Pc')
                    : (row.purchaseUnit === 'qty' ? '₹/Qty' : row.purchaseUnit === 'packet' ? '₹/Pkt' : '₹/Pc')
                  }
                </label>
                <input
                  type="number"
                  value={row.costPerUnit || ''}
                  onFocus={handleNumberFocus}
                  onChange={(e) => onUpdateItemRow(item.id, row.id, 'costPerUnit', e.target.value)}
                  placeholder="Cost"
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 bg-white text-gray-900 rounded focus:ring-1 focus:ring-blue-400 h-9"
                />
              </div>

              <div className="w-20">
                <label className="text-xs text-gray-500 block mb-1">Total</label>
                <div className="px-2 py-1.5 text-xs bg-green-50 border border-green-200 rounded text-green-700 font-medium text-center h-9 flex items-center justify-center">
                  ₹{rowTotal.toFixed(2)}
                </div>
              </div>

              <div className="w-16">
                <label className="text-xs text-gray-500 block mb-1">GST</label>
                <select
                  value={row.gstPercentage || ''}
                  onChange={(e) => onUpdateItemRow(item.id, row.id, 'gstPercentage', parseFloat(e.target.value) || 0)}
                  className="w-full text-xs border border-gray-300 bg-white text-gray-900 rounded px-1 py-1.5 focus:ring-1 focus:ring-blue-400 h-9"
                >
                  <option value="">Select</option>
                  <option value="5">5%</option>
                  <option value="14">14%</option>
                  <option value="18">18%</option>
                </select>
              </div>

              <div className="w-20">
                <label className="text-xs text-gray-500 block mb-1">Total + GST</label>
                <div className="px-2 py-1.5 text-xs bg-purple-50 border border-purple-200 rounded text-purple-700 font-medium text-center h-9 flex items-center justify-center">
                  ₹{rowTotalWithGst.toFixed(2)}
                </div>
              </div>

              {item.items.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveItemRow(item.id, row.id)}
                  className="ml-1 text-red-400 hover:text-red-600 p-2 transition-colors h-9"
                  title="Remove Row"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Item Grand Total */}
      {item.items.length > 1 && (
        <div className="mt-3 pt-3 border-t border-gray-200 flex justify-end gap-4">
          <div className="text-sm">
            <span className="text-gray-600">Item Total: </span>
            <span className="font-bold text-green-600">₹{itemGrandTotal.toFixed(2)}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">With GST: </span>
            <span className="font-bold text-purple-600">₹{itemGrandTotalWithGst.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const PurchaseItemsSection = ({ purchaseItems, setPurchaseItems, estimationType }) => {
  const createNewItemRow = () => ({
    id: Date.now() + Math.random(),
    type: 'fabric',
    itemName: '',
    gsm: '',
    accessoryType: 'other',
    color: '',
    purchaseUnit: 'kg',
    quantity: '',
    costPerUnit: '',
    gstPercentage: 0
  });

  const createNewItemForm = () => ({
    id: Date.now(),
    vendor: '',
    vendorCode: '',
    supplierId: '',
    items: [createNewItemRow()]
  });

  const addNewItemForm = () => {
    setPurchaseItems([...purchaseItems, createNewItemForm()]);
  };

  const updateItemForm = (id, field, value) => {
    setPurchaseItems(prevItems => prevItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeItemForm = (itemId) => {
    setPurchaseItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const addItemRow = (itemId) => {
    setPurchaseItems(prevItems => prevItems.map(item =>
      item.id === itemId
        ? { ...item, items: [...item.items, createNewItemRow()] }
        : item
    ));
  };

  const removeItemRow = (itemId, rowId) => {
    setPurchaseItems(prevItems => prevItems.map(item =>
      item.id === itemId
        ? { ...item, items: item.items.filter(row => row.id !== rowId) }
        : item
    ));
  };

  const updateItemRow = (itemId, rowId, field, value) => {
    setPurchaseItems(prevItems => prevItems.map(item =>
      item.id === itemId
        ? {
          ...item,
          items: item.items.map(row =>
            row.id === rowId ? { ...row, [field]: value } : row
          )
        }
        : item
    ));
  };

  if (estimationType === 'machine') {
    return null;
  }

  return (
    <div className="space-y-3 w-full p-2">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Purchase Items</h3>
        <button
          type="button"
          onClick={addNewItemForm}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors font-medium shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Item
        </button>
      </div>

      {purchaseItems.length > 0 && (
        <div className="space-y-4">
          {purchaseItems.map((item) => (
            <ItemForm
              key={item.id}
              item={item}
              onUpdateItemForm={updateItemForm}
              onRemoveItemForm={removeItemForm}
              onAddItemRow={addItemRow}
              onRemoveItemRow={removeItemRow}
              onUpdateItemRow={updateItemRow}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const PurchaseEstimationForm = ({ initialValues, onSubmit, onCancel, submitLabel, isEditMode }) => {
  const [estimationType, setEstimationType] = useState('order');
  const [formData, setFormData] = useState({
    estimationDate: new Date().toISOString().split('T')[0],
    PoNo: '',
    remarks: '',
    ...initialValues
  });

  const [purchaseItems, setPurchaseItems] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);

  const [orderSuggestions, setOrderSuggestions] = useState([]);
  const [showOrderDropdown, setShowOrderDropdown] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [meterValues, setMeterValues] = useState({});

  useEffect(() => {
    const total = purchaseItems.reduce((sum, item) => {
      return sum + item.items.reduce((itemSum, row) => {
        const rowTotal = (parseFloat(row.quantity) || 0) * (parseFloat(row.costPerUnit) || 0);
        const gstAmount = rowTotal * ((row.gstPercentage || 0) / 100);
        return itemSum + rowTotal + gstAmount;
      }, 0);
    }, 0);
    setGrandTotal(total);
  }, [purchaseItems]);

  useEffect(() => {
    if (selectedOrder && selectedOrder.products) {
      const initialMeters = {};
      selectedOrder.products.forEach((prod, idx) => {
        const style = prod.style?.toUpperCase() || '';
        let defaultMeter = 1.35;

        if (style.includes('L/S') || style.includes('LONG')) {
          defaultMeter = 1.75;
        }

        initialMeters[idx] = defaultMeter;
      });
      setMeterValues(initialMeters);
    }
  }, [selectedOrder]);

  const searchOrders = async (searchTerm) => {
    if (searchTerm.length < 2) {
      setOrderSuggestions([]);
      setShowOrderDropdown(false);
      return;
    }

    try {
      const response = await axiosInstance.get(`/purchase-estimations/search/orders?q=${encodeURIComponent(searchTerm)}`);
      setOrderSuggestions(Array.isArray(response.data) ? response.data : []);
      setShowOrderDropdown(true);
    } catch (error) {
      console.error("Error searching orders:", error);
      setOrderSuggestions([]);
      setShowOrderDropdown(false);
    }
  };

  const fetchOrderDetails = async (PoNo) => {
    setOrderLoading(true);
    try {
      const response = await axiosInstance.get(`/purchase-estimations/order/${encodeURIComponent(PoNo)}`);
      setSelectedOrder(response.data);
      setFormData(prev => ({ ...prev, PoNo: response.data.PoNo }));
      setShowOrderDropdown(false);
      setOrderSuggestions([]);
    } catch (error) {
      console.error("Error fetching order details:", error);
      alert('Failed to fetch order details');
    } finally {
      setOrderLoading(false);
    }
  };

  const handleEstimationTypeChange = (type) => {
    if (purchaseItems.length > 0) {
      const confirm = window.confirm('Changing estimation type will clear all items. Continue?');
      if (!confirm) return;
    }

    setEstimationType(type);
    setPurchaseItems([]);

    if (type === 'machine') {
      setSelectedOrder(null);
      setFormData(prev => ({ ...prev, PoNo: '' }));
    }
  };

  const handleMeterChange = (idx, value) => {
    setMeterValues(prev => ({
      ...prev,
      [idx]: value
    }));
  };

  const handleSubmit = () => {
    if (purchaseItems.length === 0) {
      alert('Please add at least one item');
      return;
    }

    const fabricPurchases = [];
    const accessoriesPurchases = [];

    purchaseItems.forEach(item => {
      item.items.forEach(row => {
        const quantity = parseFloat(row.quantity) || 0;
        const costPerUnit = parseFloat(row.costPerUnit) || 0;
        const totalCost = quantity * costPerUnit;
        const gstAmount = totalCost * ((row.gstPercentage || 0) / 100);

        if (row.type === 'fabric') {
          fabricPurchases.push({
            productName: row.itemName,
            fabricType: row.itemName,
            vendor: item.vendor,
            vendorCode: item.vendorCode || '',
            vendorId: item.supplierId || null,
            quantity: quantity,
            unit: row.purchaseUnit || 'kg',
            costPerUnit: costPerUnit,
            gstRate: row.gstPercentage || 0,
            totalCost: totalCost,
            gstAmount: gstAmount,
            totalWithGst: totalCost + gstAmount,
            colors: row.color ? [row.color] : [],
            gsm: row.gsm || '',
            remarks: ''
          });
        } else if (row.type === 'accessories') {
          accessoriesPurchases.push({
            productName: row.itemName,
            accessoryType: row.accessoryType || 'other',
            size: 'Standard',
            vendor: item.vendor,
            vendorCode: item.vendorCode || '',
            vendorId: item.supplierId || null,
            quantity: quantity,
            unit: row.purchaseUnit || 'pieces',
            costPerUnit: costPerUnit,
            gstRate: row.gstPercentage || 0,
            totalCost: totalCost,
            gstAmount: gstAmount,
            totalWithGst: totalCost + gstAmount,
            color: row.color || '',
            remarks: ''
          });
        }
      });
    });

    const submitData = {
      estimationType: estimationType,
      estimationDate: formData.estimationDate,
      remarks: formData.remarks,
      PoNo: formData.PoNo || null,
      orderId: selectedOrder?._id || null,
      fabricPurchases,
      accessoriesPurchases,
      grandTotalCost: grandTotal
    };

    console.log("Submit data:", submitData);
    onSubmit(submitData);
  };

  return (
    <div className="w-full mx-auto bg-white p-5 rounded-2xl">
      <div className="space-y-2">
        <div className="flex items-center justify-between pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {isEditMode ? 'Edit Purchase Estimation' : 'Create Purchase Estimation'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {estimationType === 'order' ? 'Create estimation for order materials' : 'Create estimation for machine purchase'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <X className="w-4 h-4 mr-1.5" />
              Cancel
            </button>
          </div>
        </div>

        {/* Estimation Type Selection */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 shadow-sm">
          <label className="block text-xs font-medium text-gray-700 mb-2">Estimation Type</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleEstimationTypeChange('order')}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all text-sm ${estimationType === 'order'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              disabled={isEditMode}
            >
              <FileText className="w-4 h-4 mr-1.5" />
              Order Estimation
            </button>
            <button
              type="button"
              onClick={() => handleEstimationTypeChange('machine')}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all text-sm ${estimationType === 'machine'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              disabled={isEditMode}
            >
              <Package className="w-4 h-4 mr-1.5" />
              Machine Estimation
            </button>
          </div>
        </div>

        {/* Estimation Date and Order Search */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Estimation Date</label>
              <input
                type="date"
                value={formData.estimationDate}
                onChange={(e) => setFormData({ ...formData, estimationDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {estimationType === 'order' && (
              <div className="relative">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Order Number (PoNo)
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
                  placeholder="Search by PoNo..."
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
            )}
          </div>
        </div>

        {orderLoading && (
          <div className="flex justify-center items-center py-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">Loading order details...</span>
          </div>
        )}

        {/* Order Details Display (Read-only) */}
        {estimationType === 'order' && selectedOrder && (
          <OrderDetailsWithMeters
            selectedOrder={selectedOrder}
            meterValues={meterValues}
            onMeterChange={handleMeterChange}
          />
        )}

        <PurchaseItemsSection
          purchaseItems={purchaseItems}
          setPurchaseItems={setPurchaseItems}
          estimationType={estimationType}
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
            onClick={onCancel}
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
  );
};

export default PurchaseEstimationForm;