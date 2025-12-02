import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { axiosInstance } from '../../lib/axios';

const ItemForm = ({ 
  item, 
  onUpdateItemForm, 
  onRemoveItemForm, 
  onAddItemRow, 
  onRemoveItemRow, 
  onUpdateItemRow,
  showStateField = false, 
  showGstTypeToggle = false,
  rowIndex = 0
}) => {
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
      const endpoint = showStateField 
        ? '/purchase-estimations/search/suppliers'
        : '/purchases/search/suppliers';
      
      const { data } = await axiosInstance.get(`${endpoint}?q=${searchTerm}`);
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
    onUpdateItemForm(item.id, 'vendorState', supplier.state || '');
    const gstType = supplier.state === 'Tamil Nadu' ? 'CGST+SGST' : 'IGST';
    onUpdateItemForm(item.id, 'gstType', gstType);

    setShowSupplierDropdown(false);
    setSupplierSuggestions([]);
  };

  const calculateRowTotal = (row) => {
    const quantity = parseFloat(row.quantity) || 0;
    const cost = parseFloat(row.costPerUnit) || 0;
    return quantity * cost;
  };

  const calculateGST = (amount, gstPercentage, gstType) => {
    if (showGstTypeToggle && gstType === "CGST+SGST") {
      const halfGst = (amount * gstPercentage) / 200;
      return {
        cgst: halfGst,
        sgst: halfGst,
        igst: 0,
        total: halfGst + halfGst
      };
    } else {
      return {
        cgst: 0,
        sgst: 0,
        igst: (amount * gstPercentage) / 100,
        total: (amount * gstPercentage) / 100
      };
    }
  };

  const itemTotal = item.items.reduce((sum, row) => sum + calculateRowTotal(row), 0);
  const itemTotalWithGst = item.items.reduce((sum, row) => {
    const rowTotal = calculateRowTotal(row);
    const gstPercentage = row.gstPercentage || 5;
    const gstType = item.gstType || "CGST+SGST";
    const gstCalc = calculateGST(rowTotal, gstPercentage, gstType);
    return sum + rowTotal + gstCalc.total;
  }, 0);

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow w-full">
      {/* Supplier Row */}
      <div className="flex flex-wrap items-end gap-2 mb-3 pb-3 border-b border-gray-200">
        <div className={showStateField ? "w-40" : "w-32"} style={{ position: 'relative' }}>
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
                  <div className="text-gray-500">
                    {supplier.code} • {supplier.state || 'N/A'}
                  </div>
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
            readOnly
            className="w-full px-2 py-1.5 text-sm border border-gray-300 bg-gray-100 text-gray-700 rounded focus:ring-1 focus:ring-blue-400 h-9"
          />
        </div>

        <div className="w-24">
          <label className="text-xs text-gray-500 block mb-1">State</label>
          <input
            type="text"
            value={item.vendorState || ''}
            readOnly
            className="w-full px-2 py-1.5 text-sm border border-gray-300 bg-gray-100 text-gray-700 rounded focus:ring-1 focus:ring-blue-400 h-9"
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

      {/* Header Row */}
      {item.items.length > 0 && (
        <div className="flex items-center gap-1 pb-1.5 border-b border-gray-300 bg-gray-50 px-2 rounded-t">
          <div className="w-8 text-xs text-gray-600 font-medium text-center">S.No</div>
          
          {/* Purchase-specific fields */}
          {!showGstTypeToggle && (
            <>
              <div className="mr-5 ml-4 w-20 text-xs text-gray-600 font-medium">Inv. Date</div>
              <div className="w-20 text-xs text-gray-600 font-medium">Inv. No</div>
              <div className="w-16 text-xs text-gray-600 font-medium">HSN</div>
            </>
          )}
          
          <div className="w-16 text-xs text-gray-600 font-medium">Type</div>
          <div className="w-28 text-xs text-gray-600 font-medium">Item Name</div>
          <div className="w-12 text-xs text-gray-600 font-medium">GSM</div>
          <div className="w-16 text-xs text-gray-600 font-medium">Color</div>
          <div className="w-14 text-xs text-gray-600 font-medium">Unit</div>
          <div className="w-14 text-xs text-gray-600 font-medium text-right">Qty</div>
          <div className="w-14 text-xs text-gray-600 font-medium text-right">₹/Unit</div>
          <div className="w-16 text-xs text-gray-600 font-medium text-right">Total</div>
          <div className=" w-12 text-xs text-gray-600 font-medium text-center">GST%</div>
          {item.gstType === 'CGST+SGST' ? (
            <>
              <div className="w-16 text-xs text-gray-600 font-medium text-right">CGST</div>
              <div className="w-16 text-xs text-gray-600 font-medium text-right">SGST</div>
            </>
          ) : (
            <div className="w-16 text-xs text-gray-600 font-medium text-right">IGST</div>
          )}
          <div className=" w-20 text-xs text-gray-600 font-medium text-right">Total+GST</div>
          <div className="w-3"></div>
        </div>
      )}

      {/* Item Rows */}
      {item.items.map((row, rowIndex) => {
        const rowTotal = calculateRowTotal(row);
        const gstPercentage = parseFloat(row.gstPercentage) || 5;
        const gstType = item.gstType || "CGST+SGST";
        const gstCalc = calculateGST(rowTotal, gstPercentage, gstType);
        const rowTotalWithGst = rowTotal + gstCalc.total;

        return (
          <div key={row.id} className="flex items-center gap-1 py-1 hover:bg-gray-50 px-2">
            {/* S.No */}
            <div className="w-8">
              <div className="text-xs bg-gray-100 border border-gray-200 rounded px-1 py-1.5 text-gray-700 font-medium text-center h-8">
                {rowIndex + 1}
              </div>
            </div>

            {/* Purchase-specific fields: Invoice Date, Invoice No, HSN */}
            {!showGstTypeToggle && (
              <>
                <div className="w-20">
                  <input
                    type="date"
                    value={row.invoiceDate || ''}
                    onChange={(e) => onUpdateItemRow(item.id, row.id, 'invoiceDate', e.target.value)}
                    className="w-full px-1 py-1.5 text-xs border border-gray-300 bg-white text-gray-900 rounded h-8"
                  />
                </div>
                <div className="w-20">
                  <input
                    type="text"
                    value={row.invoiceNo || ''}
                    onChange={(e) => onUpdateItemRow(item.id, row.id, 'invoiceNo', e.target.value)}
                    placeholder="Inv #"
                    className="w-full px-1 py-1.5 text-xs border border-gray-300 bg-white text-gray-900 rounded h-8"
                  />
                </div>
                <div className="w-16">
                  <input
                    type="text"
                    value={row.hsn || ''}
                    onChange={(e) => onUpdateItemRow(item.id, row.id, 'hsn', e.target.value)}
                    placeholder="HSN"
                    className="w-full px-1 py-1.5 text-xs border border-gray-300 bg-white text-gray-900 rounded h-8"
                  />
                </div>
              </>
            )}

            {/* Type */}
            <div className="w-16">
              <select
                value={row.type}
                onChange={(e) => onUpdateItemRow(item.id, row.id, 'type', e.target.value)}
                className="w-full text-xs border border-gray-300 bg-white text-gray-900 rounded px-1 py-1.5 h-8"
              >
                <option value="fabric">Fabric</option>
                <option value="accessories">Acces.</option>
                {showGstTypeToggle && <option value="others">Others</option>}
              </select>
            </div>

            {/* Item Name */}
            <div className="w-28">
              <input
                type="text"
                value={row.itemName}
                onChange={(e) => onUpdateItemRow(item.id, row.id, 'itemName', e.target.value)}
                placeholder={row.type === 'accessories' ? 'Button/Packet' : 'Item name'}
                className="w-full px-1.5 py-1.5 text-xs border border-gray-300 bg-white text-gray-900 rounded h-8"
              />
            </div>

            {/* GSM */}
            <div className="w-12">
              {row.type === 'fabric' ? (
                <input
                  type="text"
                  value={row.gsm || ''}
                  onChange={(e) => onUpdateItemRow(item.id, row.id, 'gsm', e.target.value)}
                  placeholder="GSM"
                  className="w-full px-1 py-1.5 text-xs border border-gray-300 bg-white text-gray-900 rounded h-8"
                />
              ) : (
                <div className="h-8 bg-gray-50 border border-gray-200 rounded"></div>
              )}
            </div>

            {/* Color */}
            <div className="w-16">
              <input
                type="text"
                value={row.color || ''}
                onChange={(e) => onUpdateItemRow(item.id, row.id, 'color', e.target.value)}
                placeholder="Color"
                className="w-full px-1 py-1.5 text-xs border border-gray-300 bg-white text-gray-900 rounded h-8"
              />
            </div>

            {/* Unit */}
            <div className="w-14">
              <select
                value={row.purchaseUnit}
                onChange={(e) => onUpdateItemRow(item.id, row.id, 'purchaseUnit', e.target.value)}
                className="w-full text-xs border border-gray-300 bg-white text-gray-900 rounded px-0.5 py-1.5 h-8"
              >
                {row.type === 'fabric' ? (
                  <>
                    <option value="kg">KG</option>
                    <option value="meter">Mtr</option>
                    <option value="piece">Pcs</option>
                  </>
                ) : (
                  <>
                    <option value="qty">Qty</option>
                    <option value="piece">Pcs</option>
                    <option value="packet">Pkt</option>
                  </>
                )}
              </select>
            </div>

            {/* Quantity */}
            <div className="w-14">
              <input
                type="number"
                value={row.quantity || ''}
                onFocus={handleNumberFocus}
                onChange={(e) => onUpdateItemRow(item.id, row.id, 'quantity', e.target.value)}
                placeholder="0"
                className="w-full px-1 py-1.5 text-xs border border-gray-300 bg-white text-gray-900 rounded text-right h-8"
              />
            </div>

            {/* Cost Per Unit */}
            <div className="w-14">
              <input
                type="number"
                value={row.costPerUnit || ''}
                onFocus={handleNumberFocus}
                onChange={(e) => onUpdateItemRow(item.id, row.id, 'costPerUnit', e.target.value)}
                placeholder="0"
                className="w-full px-1 py-1.5 text-xs border border-gray-300 bg-white text-gray-900 rounded text-right h-8"
              />
            </div>

            {/* Total */}
            <div className="w-16">
              <div className="px-1 py-1.5 text-xs bg-green-50 border border-green-200 rounded text-green-700 font-medium text-right h-8 flex items-center justify-end">
                ₹{rowTotal.toFixed(showGstTypeToggle ? 0 : 2)}
              </div>
            </div>

            {/* GST% */}
            <div className="w-12">
              {showGstTypeToggle && row.customGstInput ? (
                <input
                  type="number"
                  value={row.gstPercentage || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    onUpdateItemRow(item.id, row.id, 'gstPercentage', value);
                  }}
                  onBlur={() => {
                    if (!row.gstPercentage) {
                      onUpdateItemRow(item.id, row.id, 'customGstInput', false);
                      onUpdateItemRow(item.id, row.id, 'gstPercentage', 5);
                    }
                  }}
                  placeholder="%"
                  autoFocus
                  className="w-full px-1 py-1.5 text-xs border border-blue-400 bg-white text-gray-900 rounded text-center h-8"
                />
              ) : (
                <select
                  value={row.gstPercentage || 5}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'others') {
                      onUpdateItemRow(item.id, row.id, 'customGstInput', true);
                      onUpdateItemRow(item.id, row.id, 'gstPercentage', '');
                    } else {
                      onUpdateItemRow(item.id, row.id, 'gstPercentage', parseFloat(value) || 0);
                    }
                  }}
                  className="w-full text-xs border border-gray-300 bg-white text-gray-900 rounded px-0.5 py-1.5 h-8"
                >
                  <option value="5">5</option>
                  <option value="0">0</option>
                  {!showGstTypeToggle && <option value="14">14</option>}
                  {showGstTypeToggle && <option value="12">12</option>}
                  <option value="18">18</option>
                  {showGstTypeToggle && (
                    <>
                      <option value="28">28</option>
                      <option value="others">+</option>
                    </>
                  )}
                </select>
              )}
            </div>

            {/* CGST & SGST or IGST */}
            {gstType === 'CGST+SGST' ? (
              <>
                <div className="w-16">
                  <div className="px-1 py-1.5 text-xs bg-blue-50 border border-blue-200 rounded text-blue-700 font-medium text-right h-8 flex items-center justify-end">
                    ₹{gstCalc.cgst.toFixed(showGstTypeToggle ? 0 : 2)}
                  </div>
                </div>
                <div className="w-16">
                  <div className="px-1 py-1.5 text-xs bg-blue-50 border border-blue-200 rounded text-blue-700 font-medium text-right h-8 flex items-center justify-end">
                    ₹{gstCalc.sgst.toFixed(showGstTypeToggle ? 0 : 2)}
                  </div>
                </div>
              </>
            ) : (
              <div className="w-16">
                <div className="px-1 py-1.5 text-xs bg-purple-50 border border-purple-200 rounded text-purple-700 font-medium text-right h-8 flex items-center justify-end">
                  ₹{gstCalc.igst.toFixed(showGstTypeToggle ? 0 : 2)}
                </div>
              </div>
            )}

            {/* Total + GST */}
            <div className="w-20">
              <div className={`px-1 py-1.5 text-xs rounded font-medium text-right h-8 flex items-center justify-end ${
                showGstTypeToggle 
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold'
                  : 'bg-purple-50 border border-purple-200 text-purple-700'
              }`}>
                ₹{rowTotalWithGst.toFixed(showGstTypeToggle ? 0 : 2)}
              </div>
            </div>

            {/* Remove Button */}
            {item.items.length > 1 && (
              <button
                type="button"
                onClick={() => onRemoveItemRow(item.id, row.id)}
                className="ml-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded p-1.5 transition-colors h-8 w-8 flex items-center justify-center"
                title="Remove"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      })}

      {/* Item Grand Total */}
      {item.items.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 flex justify-end space-x-5 items-center flex-wrap">
          <div className="text-sm">
            <span className="text-gray-600">Item Total: </span>
            <span className="font-bold text-green-600">₹{itemTotal.toFixed(2)}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">With GST: </span>
            <span className="font-bold text-purple-600">₹{itemTotalWithGst.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const PurchaseItemsSection = ({ 
  purchaseItems, 
  setPurchaseItems,
  showStateField = false,
  showGstTypeToggle = false,
  purchaseDate = '',
  onPurchaseDateChange = () => {},
  showPurchaseDate = false // ✅ NEW: Control Purchase Date visibility (like Invoice fields)
}) => {
  const createNewItemRow = () => ({
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
    invoiceDate: '',
    invoiceNo: '',
    hsn: '',
  });

  const createNewItemForm = () => ({
    id: Date.now(),
    vendor: '',
    vendorCode: '',
    vendorState: '',
    supplierId: '',
    gstType: 'CGST+SGST',
    items: [createNewItemRow()]
  });

  // Initialize with one item form by default
  React.useEffect(() => {
    if (purchaseItems.length === 0) {
      setPurchaseItems([createNewItemForm()]);
    }
  }, []);

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

  return (
    <div className="space-y-3 w-full p-2">
      {/* Header with optional Purchase Date and Add Item button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-800">Purchase Items</h3>
          
          {/* ✅ Purchase Date Field - Only show if showPurchaseDate is true */}
          {showPurchaseDate && (
            <div className="w-44">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Purchase Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={purchaseDate || ''}
                onChange={(e) => onPurchaseDateChange(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                required
              />
            </div>
          )}
        </div>

        {/* Add Item Button */}
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
          {purchaseItems.map((item, index) => (
            <ItemForm
              key={item.id}
              item={item}
              index={index}
              rowIndex={index}
              onUpdateItemForm={updateItemForm}
              onRemoveItemForm={removeItemForm}
              onAddItemRow={addItemRow}
              onRemoveItemRow={removeItemRow}
              onUpdateItemRow={updateItemRow}
              showStateField={showStateField}
              showGstTypeToggle={showGstTypeToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default PurchaseItemsSection;