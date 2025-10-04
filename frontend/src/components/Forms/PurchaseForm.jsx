import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';

// Move FabricColorRows outside of any parent component
const FabricColorRows = ({ item, onUpdate, disabled }) => {
  const addColorRow = () => {
    const newColors = [...item.colors, { id: Date.now(), color: '', kg: '', costPerKg: '', total: 0 }];
    onUpdate(newColors);
  };

  const removeColorRow = (index) => {
    if (item.colors.length > 1) {
      const newColors = item.colors.filter((_, i) => i !== index);
      onUpdate(newColors);
    }
  };

  const updateColorRow = (index, field, value) => {
    const newColors = [...item.colors];
    newColors[index] = { ...newColors[index], [field]: value };
    if (field === 'kg' || field === 'costPerKg') {
      const kg = parseFloat(newColors[index].kg) || 0;
      const costPerKg = parseFloat(newColors[index].costPerKg) || 0;
      newColors[index].total = kg * costPerKg;
    }
    onUpdate(newColors);
  };

  const handleNumberFocus = (e) => {
    if (e.target.value === '0') {
      e.target.value = '';
    }
  };

  const unitLabel = item.purchaseUnit === 'kg' ? 'KG' : item.purchaseUnit === 'meter' ? 'Mtr' : 'Piece';
  const costLabel = item.purchaseUnit === 'kg' ? '₹/KG' : item.purchaseUnit === 'meter' ? '₹/Mtr' : '₹/Piece';

  return (
    <div className="space-y-2 mt-3">
      {/* First color row - all inline */}
      {item.colors.length > 0 && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-32">
            <label className="text-xs text-gray-500 block mb-1">Color</label>
            <input
              type="text"
              value={item.colors[0].color}
              onChange={(e) => updateColorRow(0, 'color', e.target.value)}
              placeholder="Color"
              className="w-full px-2 py-1.5 text-xs border rounded focus:ring-1 focus:ring-blue-400 h-9"
              disabled={disabled}
            />
          </div>
          <div className="w-24">
            <label className="text-xs text-gray-500 block mb-1">{unitLabel}</label>
            <input
              type="number"
              value={item.colors[0].kg}
              onFocus={handleNumberFocus}
              onChange={(e) => updateColorRow(0, 'kg', e.target.value)}
              placeholder={unitLabel}
              className="w-full px-2 py-1.5 text-xs border rounded focus:ring-1 focus:ring-blue-400 h-9"
              disabled={disabled}
            />
          </div>
          <div className="w-24">
            <label className="text-xs text-gray-500 block mb-1">{costLabel}</label>
            <input
              type="number"
              value={item.colors[0].costPerKg}
              onFocus={handleNumberFocus}
              onChange={(e) => updateColorRow(0, 'costPerKg', e.target.value)}
              placeholder={costLabel}
              className="w-full px-2 py-1.5 text-xs border rounded focus:ring-1 focus:ring-blue-400 h-9"
              disabled={disabled}
            />
          </div>
          <div className="w-24">
            <label className="text-xs text-gray-500 block mb-1">Total</label>
            <div className="px-2 py-1.5 text-xs bg-green-50 border border-green-200 rounded text-green-700 font-medium text-center h-9 flex items-center justify-center">
              ₹{item.colors[0].total || 0}
            </div>
          </div>
          <button
            type="button"
            onClick={addColorRow}
            className="text-blue-600 hover:bg-blue-50 rounded text-sm px-2 py-1.5 border border-blue-200 h-9 flex items-center justify-center mb-0"
            disabled={disabled}
            title="Add Color"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => removeColorRow(0)}
            className="text-red-500 hover:bg-red-50 rounded text-sm px-1.5 py-1 h-9 flex items-center justify-center mb-0"
            disabled={item.colors.length === 1 || disabled}
          >
            ×
          </button>
        </div>
      )}

      {/* Additional color rows */}
      {item.colors.slice(1).map((color, idx) => {
        const index = idx + 1;
        return (
          <div key={color.id} className="flex flex-wrap items-end gap-2">
            <div className="w-32">
              <input
                type="text"
                value={color.color}
                onChange={(e) => updateColorRow(index, 'color', e.target.value)}
                placeholder="Color"
                className="w-full px-2 py-1.5 text-xs border rounded focus:ring-1 focus:ring-blue-400 h-9"
                disabled={disabled}
              />
            </div>
            <div className="w-24">
              <input
                type="number"
                value={color.kg}
                onFocus={handleNumberFocus}
                onChange={(e) => updateColorRow(index, 'kg', e.target.value)}
                placeholder={unitLabel}
                className="w-full px-2 py-1.5 text-xs border rounded focus:ring-1 focus:ring-blue-400 h-9"
                disabled={disabled}
              />
            </div>
            <div className="w-24">
              <input
                type="number"
                value={color.costPerKg}
                onFocus={handleNumberFocus}
                onChange={(e) => updateColorRow(index, 'costPerKg', e.target.value)}
                placeholder={costLabel}
                className="w-full px-2 py-1.5 text-xs border rounded focus:ring-1 focus:ring-blue-400 h-9"
                disabled={disabled}
              />
            </div>
            <div className="w-24 px-2 py-1.5 text-xs bg-green-50 border border-green-200 rounded text-green-700 font-medium text-center h-9 flex items-center justify-center">
              ₹{color.total || 0}
            </div>
            <div className="w-10"></div>
            <button
              type="button"
              onClick={() => removeColorRow(index)}
              className="text-red-500 hover:bg-red-50 rounded text-sm px-1.5 py-1 h-9 flex items-center justify-center"
              disabled={disabled}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
};

// Move ItemForm outside of any parent component
const ItemForm = ({ item, onUpdateItemForm, onUpdateFabricColors, onAddItemToPurchaseList, onRemoveItemForm }) => {
  const handleNumberFocus = (e) => {
    if (e.target.value === '0') {
      e.target.value = '';
    }
  };

  // Calculate total KG and total cost for display
  const totalKg = item.type === 'fabric' ? item.totalKg :
    item.type === 'buttons' ? (item.qty || 0) :
      (item.pieces || 0);
  const totalCost = item.totalCost || 0;

  return (
    <div className={`border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow ${item.isCompleted ? 'opacity-60' : ''} w-full`}>
      {/* All fields in a single horizontal row */}
      <div className="flex flex-wrap items-end gap-2 mb-3">
        {/* Item Type */}
        <div className="w-25">
          <label className="text-xs text-gray-500 block mb-1">Item Type</label>
          <select
            value={item.type}
            onChange={(e) => onUpdateItemForm(item.id, 'type', e.target.value)}
            className="w-full text-sm border rounded px-3 py-1.5 focus:ring-1 focus:ring-blue-400 h-9"
            disabled={item.isCompleted}
          >
            <option value="fabric">Fabric</option>
            <option value="buttons">Buttons</option>
            <option value="packets">Packets</option>
          </select>
        </div>

        {/* Item/Fabric Name */}
        <div className="w-40">
          <label className="text-xs text-gray-500 block mb-1">Item / Fabric Name</label>
          <input
            type="text"
            value={item.itemName}
            onChange={(e) => onUpdateItemForm(item.id, 'itemName', e.target.value)}
            placeholder="Item Name"
            className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-400 h-9"
            disabled={item.isCompleted}
          />
        </div>

        {/* GSM (Fabric only) */}
        {item.type === 'fabric' && (
          <div className="w-24">
            <label className="text-xs text-gray-500 block mb-1">GSM</label>
            <input
              type="text"
              value={item.gsm}
              onChange={(e) => onUpdateItemForm(item.id, 'gsm', e.target.value)}
              placeholder="GSM"
              className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-400 h-9"
              disabled={item.isCompleted}
            />
          </div>
        )}

        {/* Vendor */}
        <div className="w-40">
          <label className="text-xs text-gray-500 block mb-1">Vendor</label>
          <input
            type="text"
            value={item.vendor}
            onChange={(e) => onUpdateItemForm(item.id, 'vendor', e.target.value)}
            placeholder="Vendor"
            className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-400 h-9"
            disabled={item.isCompleted}
          />
        </div>

        {/* Unit Type */}
        <div className="w-25">
          <label className="text-xs text-gray-500 block mb-1">Unit Type</label>
          <select
            value={item.purchaseUnit}
            onChange={(e) => onUpdateItemForm(item.id, 'purchaseUnit', e.target.value)}
            className="w-full text-xs border rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-400 h-9"
            disabled={item.isCompleted}
          >
            {item.type === 'fabric' ? (
              <>
                <option value="kg">per KG</option>
                <option value="meter">per Meter</option>
                <option value="piece">per Piece</option>
              </>
            ) : item.type === 'buttons' ? (
              <>
                <option value="qty">per Qty</option>
                <option value="piece">per Piece</option>
              </>
            ) : (
              <>
                <option value="piece">per Piece</option>
                <option value="packet">per Packet</option>
              </>
            )}
          </select>
        </div>

        {/* Total indicators right next to Unit Type for fabric */}
        {item.type === 'fabric' && (
          <>
            <div className="w-24">
              <label className="text-xs text-gray-500 block mb-1">Total {item.purchaseUnit === 'kg' ? 'KG' : item.purchaseUnit === 'meter' ? 'Meters' : 'Pieces'}</label>
              <div className="px-2 py-1.5 text-xs bg-blue-50 border border-blue-200 rounded text-blue-700 font-medium text-center h-9 flex items-center justify-center">
                {totalKg || 0}
              </div>
            </div>
            <div className="w-28">
              <label className="text-xs text-gray-500 block mb-1">Total Amount</label>
              <div className="px-2 py-1.5 text-xs bg-green-50 border border-green-200 rounded text-green-700 font-medium text-center h-9 flex items-center justify-center">
                ₹{totalCost || 0}
              </div>
            </div>
          </>
        )}

        {/* Quantity/Pieces - for buttons/packets only */}
        {(item.type === 'buttons' || item.type === 'packets') && (
          <div className="w-24">
            <label className="text-xs text-gray-500 block mb-1">
              {item.type === 'buttons' ? 'Quantity' : 'Pieces'}
            </label>
            <input
              type="number"
              value={item.type === 'buttons' ? item.qty : item.pieces}
              onFocus={handleNumberFocus}
              onChange={(e) => onUpdateItemForm(
                item.id,
                item.type === 'buttons' ? 'qty' : 'pieces',
                e.target.value
              )}
              placeholder={item.type === 'buttons' ? 'Qty' : 'Pieces'}
              className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-400 h-9"
              disabled={item.isCompleted}
            />
          </div>
        )}

        {/* Cost per Unit - for buttons/packets only */}
        {(item.type === 'buttons' || item.type === 'packets') && (
          <div className="w-28">
            <label className="text-xs text-gray-500 block mb-1">
              {item.purchaseUnit === 'qty' ? 'Cost/Qty' :
                item.purchaseUnit === 'packet' ? 'Cost/Packet' : 'Cost/Piece'}
            </label>
            <input
              type="number"
              value={item.type === 'buttons' ? item.costPerQty : item.costPerPiece}
              onFocus={handleNumberFocus}
              onChange={(e) => onUpdateItemForm(
                item.id,
                item.type === 'buttons' ? 'costPerQty' : 'costPerPiece',
                e.target.value
              )}
              placeholder="Cost"
              className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-400 h-9"
              disabled={item.isCompleted}
            />
          </div>
        )}

        {/* Total - for buttons/packets only (removed one of the totals as requested) */}
        {(item.type === 'buttons' || item.type === 'packets') && (
          <div className="w-28">
            <label className="text-xs text-gray-500 block mb-1">Total Amount</label>
            <div className="px-2 py-1.5 text-xs bg-green-50 border border-green-200 rounded text-green-700 font-medium text-center h-9 flex items-center justify-center">
              ₹{totalCost || 0}
            </div>
          </div>
        )}

        {/* Add to Purchase Button */}
        {!item.isCompleted && (
          <button
            type="button"
            onClick={() => onAddItemToPurchaseList(item.id)}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium h-9 flex items-center"
          >
            Add to Purchase
          </button>
        )}

        {item.isCompleted && (
          <div className="px-4 py-2 bg-green-100 text-green-700 text-sm rounded-lg font-medium h-9 flex items-center">
            Added to Purchase ✓
          </div>
        )}

        {/* Remove Button */}
        <button
          type="button"
          onClick={() => onRemoveItemForm(item.id)}
          className="text-red-500 hover:bg-red-50 rounded-full p-1.5 transition-colors ml-auto mb-0 h-9"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Fabric-specific color rows */}
      {item.type === 'fabric' && (
        <FabricColorRows
          item={item}
          onUpdate={(colors) => onUpdateFabricColors(item.id, colors)}
          disabled={item.isCompleted}
        />
      )}
    </div>
  );
};

// Purchase Items Section Component
const PurchaseItemsSection = ({ purchaseItems, setPurchaseItems, grandTotal }) => {
  const [activeItems, setActiveItems] = useState([]);

  const createNewItemForm = () => ({
    id: Date.now(),
    type: 'fabric',
    itemName: '',
    gsm: '',
    vendor: '',
    purchaseUnit: 'kg',
    totalKg: 0,
    totalCost: 0,
    qty: '',
    costPerQty: '',
    pieces: '',
    costPerPiece: '',
    colors: [{ id: Date.now(), color: '', kg: '', costPerKg: '', total: 0 }],
    isCompleted: false
  });

  const addNewItemForm = () => {
    if (activeItems.length >= 2) {
      const completedItemIndex = activeItems.findIndex(item => item.isCompleted);

      if (completedItemIndex !== -1) {
        setActiveItems(prevItems => {
          const newItems = [...prevItems];
          newItems[completedItemIndex] = createNewItemForm();
          return newItems;
        });
      } else {
        alert('You can only work with 2 items at a time. Please complete or remove an existing item first.');
      }
    } else {
      setActiveItems([...activeItems, createNewItemForm()]);
    }
  };

  const updateItemForm = (id, field, value) => {
    setActiveItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };

        if (item.type === 'buttons' && (field === 'qty' || field === 'costPerQty')) {
          updated.totalCost = (parseFloat(updated.qty) || 0) * (parseFloat(updated.costPerQty) || 0);
        } else if (item.type === 'packets' && (field === 'pieces' || field === 'costPerPiece')) {
          updated.totalCost = (parseFloat(updated.pieces) || 0) * (parseFloat(updated.costPerPiece) || 0);
        }

        return updated;
      }
      return item;
    }));
  };

  const updateFabricColors = (itemId, colors) => {
    setActiveItems(prevItems => prevItems.map(item => {
      if (item.id === itemId && item.type === 'fabric') {
        const totalKg = colors.reduce((sum, color) => sum + (parseFloat(color.kg) || 0), 0);
        const totalCost = colors.reduce((sum, color) => sum + (color.total || 0), 0);
        return { ...item, colors, totalKg, totalCost };
      }
      return item;
    }));
  };

  const addItemToPurchaseList = (itemId) => {
    const item = activeItems.find(i => i.id === itemId);
    if (!item || !item.itemName || !item.vendor) {
      alert('Please fill in Item Name and Vendor');
      return;
    }

    if (item.type === 'fabric' && item.colors.some(color => !color.color)) {
      alert('Please fill in all color names');
      return;
    }

    const purchaseItem = { ...item, id: Date.now() };
    setPurchaseItems(prev => [...prev, purchaseItem]);

    setActiveItems(prevItems => prevItems.map(i =>
      i.id === itemId ? { ...i, isCompleted: true } : i
    ));
  };

  const removeItemForm = (itemId) => {
    setActiveItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const removeFromPurchaseList = (itemId) => {
    setPurchaseItems(prev => prev.filter(item => item.id !== itemId));
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Purchase Items</h3>
        <button
          type="button"
          onClick={addNewItemForm}
          className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Item
        </button>
      </div>

      {/* Active Item Forms - Now displayed vertically */}
      {activeItems.length > 0 && (
        <div className="space-y-4">
          {activeItems.map((item) => (
            <ItemForm
              key={item.id}
              item={item}
              onUpdateItemForm={updateItemForm}
              onUpdateFabricColors={updateFabricColors}
              onAddItemToPurchaseList={addItemToPurchaseList}
              onRemoveItemForm={removeItemForm}
            />
          ))}
        </div>
      )}

      {/* Added Items Summary */}
      {purchaseItems.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-5 shadow-sm">
          <h4 className="text-base font-semibold text-gray-800 mb-4">Added Items</h4>

          <div className="flex flex-wrap gap-3 mb-4">
            {purchaseItems.map((item) => (
              <div key={item.id} className="inline-flex items-center bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="mr-3">
                  {item.type === 'fabric' && (
                    <div>
                      <div className="font-medium text-sm">{item.itemName}</div>
                      <div className="text-xs text-gray-500 font-bold">
                        {item.totalKg} KG • <span className="text-green-500">₹{item.totalCost.toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        GSM: {item.gsm} | {item.colors?.length} colors
                      </div>
                    </div>
                  )}
                  {item.type === 'buttons' && (
                    <div>
                      <div className="font-medium text-sm">{item.itemName}</div>
                      <div className="text-xs text-gray-500 font-bold">
                        {item.qty} qty • <span className="text-green-500">₹{item.totalCost.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  {item.type === 'packets' && (
                    <div>
                      <div className="font-medium text-sm">{item.itemName}</div>
                      <div className="text-xs text-gray-500">
                        {item.pieces} pcs • ₹{item.totalCost.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeFromPurchaseList(item.id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const PurchaseForm = ({ initialValues, onSubmit, onCancel, submitLabel }) => {
  const [formData, setFormData] = useState({
    orderId: '',
    orderDate: '',
    PoNo: '',
    orderType: '',
    buyerCode: '',
    orderStatus: '',
    products: [],
    totalQty: 0,
    fabricPurchases: [],
    buttonsPurchases: [],
    packetsPurchases: [],
    remarks: '',
    ...initialValues
  });

  const [purchaseItems, setPurchaseItems] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);

  useEffect(() => {
    const total = purchaseItems.reduce((sum, item) => sum + (item.totalCost || 0), 0);
    setGrandTotal(total);
  }, [purchaseItems]);

  const handleSubmit = () => {
    const fabricPurchases = purchaseItems
      .filter(item => item.type === 'fabric')
      .map(item => ({
        productName: item.itemName,
        fabricType: item.itemName,
        vendor: item.vendor,
        purchaseMode: item.purchaseUnit || 'kg',
        quantity: item.totalKg,
        costPerUnit: item.totalCost / (item.totalKg || 1),
        totalCost: item.totalCost,
        colors: item.colors?.map(c => c.color) || [],
        gsm: item.gsm,
        remarks: item.remarks || ''
      }));

    const buttonsPurchases = purchaseItems
      .filter(item => item.type === 'buttons')
      .map(item => ({
        productName: item.itemName,
        size: 'Standard',
        vendor: item.vendor,
        purchaseMode: item.purchaseUnit || 'pieces',
        quantity: parseFloat(item.qty) || 0,
        costPerUnit: parseFloat(item.costPerQty) || 0,
        totalCost: item.totalCost,
        buttonType: 'Standard',
        color: '',
        remarks: item.remarks || ''
      }));

    const packetsPurchases = purchaseItems
      .filter(item => item.type === 'packets')
      .map(item => ({
        productName: item.itemName,
        size: 'Standard',
        vendor: item.vendor,
        purchaseMode: item.purchaseUnit || 'piece',
        quantity: parseFloat(item.pieces) || 0,
        costPerUnit: parseFloat(item.costPerPiece) || 0,
        totalCost: item.totalCost,
        packetType: 'Standard',
        remarks: item.remarks || ''
      }));

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
    <div className="w-full mx-auto bg-white">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Purchase Form</h2>
            <p className="text-sm text-gray-600 mt-1">Add purchase details for materials and accessories</p>
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

        {/* Order Details (Read-only) - Horizontal Layout */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 shadow-sm">
          <div className="grid grid-cols-6 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Order Date</label>
              <div className="text-sm font-medium text-gray-900">{formData.orderDate ? new Date(formData.orderDate).toLocaleDateString('en-IN') : '-'}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">PO Number</label>
              <div className="text-sm font-bold text-gray-900">{formData.PoNo || '-'}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Order Type</label>
              <div className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${formData.orderType === 'JOB-Works' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`}>
                {formData.orderType || '-'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Buyer Code</label>
              <div className="text-sm font-medium text-gray-900">{formData.buyerCode || '-'}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <div className="text-sm font-medium text-gray-900">{formData.orderStatus || '-'}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Total Qty</label>
              <div className="text-sm font-bold text-blue-600">{formData.totalQty || 0}</div>
            </div>
          </div>
        </div>

        {/* Purchase Items Section */}
        <PurchaseItemsSection
          purchaseItems={purchaseItems}
          setPurchaseItems={setPurchaseItems}
          grandTotal={grandTotal}
        />

        {/* General Remarks and Grand Total */}
        <div className="flex justify-between pt-4">
          <div className="w-2/3">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Remarks</label>
            <input
              type="text"
              value={formData.remarks || ''}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Additional notes..."
            />
          </div>
          <div className="bg-white rounded-lg px-6 py-3 border border-gray-200 shadow-sm min-w-[180px]">
            <div className="text-sm text-gray-600">Grand Total</div>
            <div className="text-2xl font-bold text-green-600">₹{grandTotal.toLocaleString()}</div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t">
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
            className="flex items-center px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
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