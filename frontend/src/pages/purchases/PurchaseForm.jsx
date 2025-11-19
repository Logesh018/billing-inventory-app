import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { axiosInstance } from '../../lib/axios';

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
      const { data } = await axiosInstance.get(`/purchases/search/suppliers?q=${searchTerm}`);
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

      {/* Item Rows  */}
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

const PurchaseItemsSection = ({ purchaseItems, setPurchaseItems }) => {
  const createNewItemRow = () => ({
    id: Date.now() + Math.random(),
    type: 'fabric',
    itemName: '',
    gsm: '',
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

  useEffect(() => {
  if (purchaseItems.length === 0) {
    setPurchaseItems([createNewItemForm()]);
  }
}, []);


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

const PurchaseForm = ({ initialValues, onSubmit, onCancel, submitLabel, isEditMode }) => {
  const [formData, setFormData] = useState({
    orderId: '',
    orderDate: '',
    PoNo: '',
    orderType: '',
    buyerCode: '',
    orderStatus: '',
    products: [],
    totalQty: 0,
    remarks: '',
    ...initialValues
  });

  const [purchaseItems, setPurchaseItems] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setFormData({
        orderId: initialValues.order?._id || initialValues.orderId || '',
        orderDate: initialValues.orderDate || '',
        PoNo: initialValues.PoNo || '',
        orderType: initialValues.orderType || '',
        buyerCode: initialValues.buyerCode || '',
        orderStatus: initialValues.status || initialValues.orderStatus || '',
        products: initialValues.products || [],
        totalQty: initialValues.totalQty || 0,
        remarks: initialValues.remarks || '',
      });
    }
  }, [initialValues]);

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

  const handleSubmit = () => {
    const fabricPurchases = [];
    const buttonsPurchases = [];
    const packetsPurchases = [];

    purchaseItems.forEach(item => {
      item.items.forEach(row => {
        const rowTotal = (parseFloat(row.quantity) || 0) * (parseFloat(row.costPerUnit) || 0);
        const gstAmount = rowTotal * ((row.gstPercentage || 0) / 100);
        const totalWithGst = rowTotal + gstAmount;

        const purchaseData = {
          productName: row.itemName,
          vendor: item.vendor,
          vendorCode: item.vendorCode,
          vendorId: item.supplierId,
          purchaseMode: row.purchaseUnit,
          quantity: parseFloat(row.quantity) || 0,
          costPerUnit: parseFloat(row.costPerUnit) || 0,
          totalCost: rowTotal,
          gstPercentage: row.gstPercentage || 0,
          totalWithGst: totalWithGst,
          remarks: ''
        };

        if (row.type === 'fabric') {
          purchaseData.fabricType = row.itemName;
          purchaseData.gsm = row.gsm;
          purchaseData.colors = [row.color];
          fabricPurchases.push(purchaseData);
        } else if (row.purchaseUnit === 'packet') {
          purchaseData.packetType = 'Standard';
          packetsPurchases.push(purchaseData);
        } else {
          purchaseData.buttonType = 'Standard';
          purchaseData.color = row.color;
          buttonsPurchases.push(purchaseData);
        }
      });
    });

    const submitData = {
      ...formData,
      fabricPurchases,
      buttonsPurchases,
      packetsPurchases,
      grandTotalCost: grandTotal
    };

    onSubmit(submitData);
  };

  return (
    <div className="w-full mx-auto bg-white p-5 rounded-2xl">
      <div className="space-y-2">
        <div className="flex items-center justify-between pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {isEditMode ? 'Edit Purchase' : 'Create Purchase Entry'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {isEditMode ? 'Update purchase details' : 'Add purchase details for materials and accessories'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              <X className="w-4 h-4 mr-1.5" />
              Cancel
            </button>
          </div>
        </div>

        {/* Order Details (Read-only) */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 shadow-sm">
          {/* Order Info Row */}
          <div className="grid grid-cols-5 gap-3">
            <div>
              <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Order Date</label>
              <div className="text-xs font-medium text-gray-900">
                {formData.orderDate ? new Date(formData.orderDate).toLocaleDateString('en-IN') : '-'}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-600 mb-0.5">PO Number</label>
              <div className="text-xs font-bold text-gray-900">{formData.PoNo || '-'}</div>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Order Type</label>
              <div className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${formData.orderType === 'JOB-Works'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-blue-100 text-blue-800'
                }`}>
                {formData.orderType || '-'}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Buyer Code</label>
              <div className="text-xs font-medium text-gray-900">{formData.buyerCode || '-'}</div>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Status</label>
              <div className="text-xs font-medium text-gray-900">{formData.orderStatus || '-'}</div>
            </div>
          </div>

          {/* Products Details Section */}
          {formData.products && formData.products.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-300">
              {/* Product Labels - Single Row */}
              <div className="grid gap-3 mb-1.5" style={{ gridTemplateColumns: '2fr 0.8fr 0.8fr 0.8fr 2fr 0.6fr' }}>
                <label className="text-[10px] font-medium text-gray-600">Product</label>
                <label className="text-[10px] font-medium text-gray-600">Fabric</label>
                <label className="text-[10px] font-medium text-gray-600">Style</label>
                <label className="text-[10px] font-medium text-gray-600">Color</label>
                <label className="text-[10px] font-medium text-gray-600">Size & Qty</label>
                <label className="text-[10px] font-medium text-gray-600 text-center">Total Qty</label>
              </div>

              {/* Product Data Rows */}
              {formData.products.map((prod, idx) => {
                const productTotal = prod.sizes?.reduce((sum, s) => sum + (s.qty || 0), 0) || 0;
                const sizeQtyPairs = prod.sizes?.map(s => `${s.size}:${s.qty}`) || [];
                return (
                  <div
                    key={idx}
                    className={`grid gap-3 py-1.5 ${idx > 0 ? 'border-t border-gray-200' : ''}`}
                    style={{ gridTemplateColumns: '2fr 0.8fr 0.8fr 0.8fr 2fr 0.6fr' }}
                  >
                    <div className="text-[10px] font-semibold text-gray-900 break-words leading-tight">
                      {prod.productDetails?.name || '-'}
                    </div>
                    <div className="text-[10px] text-gray-800 break-words leading-tight">
                      {prod.productDetails?.fabricType || '-'}
                    </div>
                    <div className="text-[10px] text-gray-800 break-words leading-tight">
                      {prod.productDetails?.style || '-'}
                    </div>
                    <div className="text-[10px] text-gray-800 break-words leading-tight">
                      {prod.productDetails?.color || '-'}
                    </div>
                    <div className="text-[10px] text-gray-800 font-mono leading-tight">
                      {sizeQtyPairs.length > 0 ? (
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                          {sizeQtyPairs.map((pair, i) => (
                            <span key={i} className="whitespace-nowrap">{pair}{i < sizeQtyPairs.length - 1 ? ',' : ''}</span>
                          ))}
                        </div>
                      ) : '-'}
                    </div>
                    <div className="text-[10px] font-bold text-blue-600 text-center">
                      {productTotal}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <PurchaseItemsSection
          purchaseItems={purchaseItems}
          setPurchaseItems={setPurchaseItems}
        />

        {/* General Remarks and Grand Total */}
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

        {/* Form Actions */}
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
            {submitLabel || 'Save Purchase'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseForm;