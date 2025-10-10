import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { axiosInstance } from '../../lib/axios';

// FabricColorRows component (unchanged)
const FabricColorRows = ({ item, onUpdate, disabled, onAddItemToPurchaseList, onRemoveItemForm }) => {
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

    const kg = newColors[index].kg === '' ? 0 : parseFloat(newColors[index].kg) || 0;
    const costPerKg = newColors[index].costPerKg === '' ? 0 : parseFloat(newColors[index].costPerKg) || 0;
    newColors[index].total = kg * costPerKg;

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
      {item.colors.length > 0 && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-32">
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Color</label>
            <input
              type="text"
              value={item.colors[0].color}
              onChange={(e) => updateColorRow(0, 'color', e.target.value)}
              placeholder="Color"
              className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-1 focus:ring-blue-400 h-9"
              disabled={disabled}
            />
          </div>
          <div className="w-24">
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{unitLabel}</label>
            <input
              type="number"
              value={item.colors[0].kg}
              onFocus={handleNumberFocus}
              onChange={(e) => updateColorRow(0, 'kg', e.target.value)}
              placeholder={unitLabel}
              onWheel={(e) => e.target.blur()}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-1 focus:ring-blue-400 h-9"
              disabled={disabled}
            />
          </div>
          <div className="w-24">
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{costLabel}</label>
            <input
              type="number"
              value={item.colors[0].costPerKg}
              onFocus={handleNumberFocus}
              onChange={(e) => updateColorRow(0, 'costPerKg', e.target.value)}
              placeholder={costLabel}
              onWheel={(e) => e.target.blur()}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-1 focus:ring-blue-400 h-9"
              disabled={disabled}
            />
          </div>
          <div className="w-24">
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Total</label>
            <div className="px-2 py-1.5 text-xs bg-green-50 dark:bg-green-900 dark:bg-opacity-30 border border-green-200 dark:border-green-800 rounded text-green-700 dark:text-green-400 font-medium text-center h-9 flex items-center justify-center">
              ₹{item.colors[0].total || 0}
            </div>
          </div>
          <button
            type="button"
            onClick={addColorRow}
            className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 dark:hover:bg-opacity-30 rounded text-sm px-2 py-1.5 border border-blue-200 dark:border-blue-800 h-9 flex items-center justify-center mb-0"
            disabled={disabled}
            title="Add Color"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => removeColorRow(0)}
            className="text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-30 rounded text-sm px-1.5 py-1 h-9 flex items-center justify-center mb-0"
            disabled={item.colors.length === 1 || disabled}
            title="Remove Color"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <div className="ml-auto flex gap-2">
            {!item.isCompleted && (
              <button
                type="button"
                onClick={() => onAddItemToPurchaseList(item.id)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors font-medium h-9 flex items-center"
              >
                Add to Purchase
              </button>
            )}

            {item.isCompleted && (
              <div className="px-3 py-2 bg-green-100 dark:bg-green-900 dark:bg-opacity-30 text-green-700 dark:text-green-400 text-sm rounded-lg font-medium h-9 flex items-center">
                Added ✓
              </div>
            )}

            <button
              type="button"
              onClick={() => onRemoveItemForm(item.id)}
              className="text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-30 rounded-full p-1.5 transition-colors h-9"
              title="Remove Item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
                className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-1 focus:ring-blue-400 h-9"
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
                className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-1 focus:ring-blue-400 h-9"
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
                className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-1 focus:ring-blue-400 h-9"
                disabled={disabled}
              />
            </div>
            <div className="w-24 px-2 py-1.5 text-xs bg-green-50 dark:bg-green-900 dark:bg-opacity-30 border border-green-200 dark:border-green-800 rounded text-green-700 dark:text-green-400 font-medium text-center h-9 flex items-center justify-center">
              ₹{color.total || 0}
            </div>
            <div className="w-10"></div>
            <button
              type="button"
              onClick={() => removeColorRow(index)}
              className="text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-30 rounded text-sm px-1.5 py-1 h-9 flex items-center justify-center"
              disabled={disabled}
              title="Remove Color"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

// ItemForm component (unchanged)
const ItemForm = ({ item, onUpdateItemForm, onUpdateFabricColors, onAddItemToPurchaseList, onRemoveItemForm }) => {
  const [supplierSuggestions, setSupplierSuggestions] = useState([]);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  const handleNumberFocus = (e) => {
    if (e.target.value === '0') {
      e.target.value = '';
    }
  };

  const totalKg = item.type === 'fabric' ? item.totalKg :
    item.type === 'buttons' ? (item.qty || 0) :
      (item.pieces || 0);
  const totalCost = item.totalCost || 0;

  const gstAmount = totalCost * (item.gstPercentage / 100);
  const totalWithGst = totalCost + gstAmount;

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

  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow ${item.isCompleted ? 'opacity-60' : ''} w-full`}>
      <div className="flex flex-wrap items-end gap-2 mb-1">
        <div className="w-20">
          <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Type</label>
          <select
            value={item.type}
            onChange={(e) => onUpdateItemForm(item.id, 'type', e.target.value)}
            className="w-full text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-400 h-9"
            disabled={item.isCompleted}
          >
            <option value="fabric">Fabric</option>
            <option value="buttons">Buttons</option>
            <option value="packets">Packets</option>
          </select>
        </div>

        <div className="w-35">
          <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Item Name</label>
          <input
            type="text"
            value={item.itemName}
            onChange={(e) => onUpdateItemForm(item.id, 'itemName', e.target.value)}
            placeholder="Item Name"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-1 focus:ring-blue-400 h-9"
            disabled={item.isCompleted}
          />
        </div>

        {item.type === 'fabric' && (
          <div className="w-20">
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">GSM</label>
            <input
              type="text"
              value={item.gsm}
              onChange={(e) => onUpdateItemForm(item.id, 'gsm', e.target.value)}
              placeholder="GSM"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-1 focus:ring-blue-400 h-9"
              disabled={item.isCompleted}
            />
          </div>
        )}

        <div className="w-30 relative">
          <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Supplier</label>
          <input
            type="text"
            value={item.vendor}
            onChange={(e) => {
              onUpdateItemForm(item.id, 'vendor', e.target.value);
              searchSuppliers(e.target.value);
            }}
            onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 200)}
            placeholder="Search supplier"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-1 focus:ring-blue-400 h-9"
            disabled={item.isCompleted}
          />
          {showSupplierDropdown && supplierSuggestions.length > 0 && (
            <div className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
              {supplierSuggestions.map((supplier, index) => (
                <div
                  key={supplier._id || index}
                  className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-xs text-gray-700 dark:text-gray-200"
                  onClick={() => selectSupplier(supplier)}
                >
                  <div className="font-medium text-gray-700 dark:text-gray-200">{supplier.name}</div>
                  <div className="text-gray-500 dark:text-gray-400">{supplier.mobile || supplier.code}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-20">
          <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Code</label>
          <input
            type="text"
            value={item.vendorCode || ''}
            onChange={(e) => onUpdateItemForm(item.id, 'vendorCode', e.target.value)}
            placeholder="Code"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-1 focus:ring-blue-400 h-9"
            disabled={item.isCompleted}
          />
        </div>

        <div className="w-20">
          <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Unit</label>
          <select
            value={item.purchaseUnit}
            onChange={(e) => onUpdateItemForm(item.id, 'purchaseUnit', e.target.value)}
            className="w-full text-xs border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-400 h-9"
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

        {item.type === 'fabric' && (
          <>
            <div className="w-16">
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Total {item.purchaseUnit === 'kg' ? 'KG' : item.purchaseUnit === 'meter' ? 'Mtr' : 'Pcs'}</label>
              <div className="px-2 py-1.5 text-xs bg-blue-50 dark:bg-blue-900 dark:bg-opacity-30 border border-blue-200 dark:border-blue-800 rounded text-blue-700 dark:text-blue-400 font-medium text-center h-9 flex items-center justify-center">
                {totalKg || 0}
              </div>
            </div>
            <div className="w-20">
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Amount</label>
              <div className="px-2 py-1.5 text-xs bg-green-50 dark:bg-green-900 dark:bg-opacity-30 border border-green-200 dark:border-green-800 rounded text-green-700 dark:text-green-400 font-medium text-center h-9 flex items-center justify-center">
                ₹{totalCost || 0}
              </div>
            </div>
            <div className="w-16">
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">GST</label>
              <select
                value={item.gstPercentage || ''}
                onChange={(e) => onUpdateItemForm(item.id, 'gstPercentage', parseFloat(e.target.value) || 0)}
                className="w-full text-xs border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-1 py-1.5 focus:ring-1 focus:ring-blue-400 h-9"
                disabled={item.isCompleted}
              >
                <option value="">Select</option>
                <option value="5">5%</option>
                <option value="14">14%</option>
                <option value="18">18%</option>
              </select>
            </div>
            <div className="w-20">
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Total + GST</label>
              <div className="px-2 py-1.5 text-xs bg-purple-50 dark:bg-purple-900 dark:bg-opacity-30 border border-purple-200 dark:border-purple-800 rounded text-purple-700 dark:text-purple-400 font-medium text-center h-9 flex items-center justify-center">
                ₹{totalWithGst.toFixed(2) || 0}
              </div>
            </div>
          </>
        )}

        {(item.type === 'buttons' || item.type === 'packets') && (
          <div className="w-16">
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              {item.type === 'buttons' ? 'Qty' : 'Pcs'}
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
              placeholder={item.type === 'buttons' ? 'Qty' : 'Pcs'}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-1 focus:ring-blue-400 h-9"
              disabled={item.isCompleted}
            />
          </div>
        )}

        {(item.type === 'buttons' || item.type === 'packets') && (
          <div className="w-18">
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
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
              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-1 focus:ring-blue-400 h-9"
              disabled={item.isCompleted}
            />
          </div>
        )}

        {(item.type === 'buttons' || item.type === 'packets') && (
          <>
            <div className="w-20">
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Amount</label>
              <div className="px-2 py-1.5 text-xs bg-green-50 dark:bg-green-900 dark:bg-opacity-30 border border-green-200 dark:border-green-800 rounded text-green-700 dark:text-green-400 font-medium text-center h-9 flex items-center justify-center">
                ₹{totalCost || 0}
              </div>
            </div>
            <div className="w-16">
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">GST</label>
              <select
                value={item.gstPercentage || ''}
                onChange={(e) => onUpdateItemForm(item.id, 'gstPercentage', parseFloat(e.target.value) || 0)}
                className="w-full text-xs border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-1 py-1.5 focus:ring-1 focus:ring-blue-400 h-9"
                disabled={item.isCompleted}
              >
                <option value="">Select</option>
                <option value="5">5%</option>
                <option value="14">14%</option>
                <option value="18">18%</option>
              </select>
            </div>
            <div className="w-22">
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Total + GST</label>
              <div className="px-2 py-1.5 text-xs bg-purple-50 dark:bg-purple-900 dark:bg-opacity-30 border border-purple-200 dark:border-purple-800 rounded text-purple-700 dark:text-purple-400 font-medium text-center h-9 flex items-center justify-center">
                ₹{totalWithGst.toFixed(2) || 0}
              </div>
            </div>
          </>
        )}

        <div className="ml-auto flex gap-4">
          {item.type !== 'fabric' && !item.isCompleted && (
            <button
              type="button"
              onClick={() => onAddItemToPurchaseList(item.id)}
              className="px-3 py-2 mt-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors font-medium h-9 flex items-center"
            >
              Add to Purchase
            </button>
          )}

          {item.type !== 'fabric' && item.isCompleted && (
            <div className="px-3 py-2 mt-1 bg-green-100 dark:bg-green-900 dark:bg-opacity-30 text-green-700 dark:text-green-400 text-sm rounded-lg font-medium h-9 flex items-center">
              Added ✓
            </div>
          )}

          {item.type !== 'fabric' && (
            <button
              type="button"
              onClick={() => onRemoveItemForm(item.id)}
              className="text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-30 rounded-full p-1.5 transition-colors h-9"
              title="Remove Item"
            >
              <Trash2 className="w-4 h-4 mt-1" />
            </button>
          )}
        </div>
      </div>

      {item.type === 'fabric' && (
        <FabricColorRows
          item={item}
          onUpdate={(colors) => onUpdateFabricColors(item.id, colors)}
          disabled={item.isCompleted}
          onAddItemToPurchaseList={onAddItemToPurchaseList}
          onRemoveItemForm={onRemoveItemForm}
        />
      )}
    </div>
  );
};

// Purchase Items Section Component
const PurchaseItemsSection = ({ purchaseItems, setPurchaseItems, initialValues }) => {
  const [activeItems, setActiveItems] = useState([]);

  useEffect(() => {
    if (initialValues && (initialValues.fabricPurchases || initialValues.buttonsPurchases || initialValues.packetsPurchases)) {
      const items = [];

      if (initialValues.fabricPurchases && initialValues.fabricPurchases.length > 0) {
        initialValues.fabricPurchases.forEach(fabric => {
          const colors = fabric.colors.map(color => ({
            id: Date.now() + Math.random(),
            color: color,
            kg: (fabric.quantity / fabric.colors.length).toFixed(2),
            costPerKg: fabric.costPerUnit,
            total: (fabric.quantity / fabric.colors.length) * fabric.costPerUnit
          }));

          items.push({
            id: Date.now() + Math.random(),
            type: 'fabric',
            itemName: fabric.productName,
            gsm: fabric.gsm || '',
            vendor: fabric.vendor,
            vendorCode: fabric.vendorCode || '',
            supplierId: fabric.vendorId,
            purchaseUnit: fabric.purchaseMode || 'kg',
            totalKg: fabric.quantity,
            totalCost: fabric.totalCost,
            gstPercentage: fabric.gstPercentage || 0,
            colors: colors,
            isCompleted: true
          });
        });
      }

      if (initialValues.buttonsPurchases && initialValues.buttonsPurchases.length > 0) {
        initialValues.buttonsPurchases.forEach(button => {
          items.push({
            id: Date.now() + Math.random(),
            type: 'buttons',
            itemName: button.productName,
            vendor: button.vendor,
            vendorCode: button.vendorCode || '',
            supplierId: button.vendorId,
            purchaseUnit: button.purchaseMode || 'pieces',
            qty: button.quantity,
            costPerQty: button.costPerUnit,
            totalCost: button.totalCost,
            gstPercentage: button.gstPercentage || 0,
            isCompleted: true
          });
        });
      }

      if (initialValues.packetsPurchases && initialValues.packetsPurchases.length > 0) {
        initialValues.packetsPurchases.forEach(packet => {
          items.push({
            id: Date.now() + Math.random(),
            type: 'packets',
            itemName: packet.productName,
            vendor: packet.vendor,
            vendorCode: packet.vendorCode || '',
            supplierId: packet.vendorId,
            purchaseUnit: packet.purchaseMode || 'piece',
            pieces: packet.quantity,
            costPerPiece: packet.costPerUnit,
            totalCost: packet.totalCost,
            gstPercentage: packet.gstPercentage || 0,
            isCompleted: true
          });
        });
      }

      setPurchaseItems(items);
    }
  }, [initialValues]);

  const createNewItemForm = () => ({
    id: Date.now(),
    type: 'fabric',
    itemName: '',
    gsm: '',
    vendor: '',
    vendorCode: '',
    supplierId: '',
    purchaseUnit: 'kg',
    totalKg: 0,
    totalCost: 0,
    gstPercentage: 0,
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
    <div className="space-y-3 w-full">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Purchase Items</h3>
        <button
          type="button"
          onClick={addNewItemForm}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors font-medium shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Item
        </button>
      </div>

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

      {purchaseItems.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-5 shadow-sm">
          <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">Added Items</h4>

          <div className="flex flex-wrap gap-3 mb-4">
            {purchaseItems.map((item) => (
              <div key={item.id} className="inline-flex items-center bg-white dark:bg-gray-800 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow">
                <div className="mr-3">
                  {item.type === 'fabric' && (
                    <div>
                      <div className="font-medium text-sm text-gray-800 dark:text-gray-200">{item.itemName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-bold">
                        {item.totalKg} KG • <span className="text-green-500 dark:text-green-400">₹{item.totalCost.toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        GSM: {item.gsm} | {item.colors?.length} colors
                      </div>
                    </div>
                  )}
                  {item.type === 'buttons' && (
                    <div>
                      <div className="font-medium text-sm text-gray-800 dark:text-gray-200">{item.itemName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-bold">
                        {item.qty} qty • <span className="text-green-500 dark:text-green-400">₹{item.totalCost.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  {item.type === 'packets' && (
                    <div>
                      <div className="font-medium text-sm text-gray-800 dark:text-gray-200">{item.itemName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {item.pieces} pcs • ₹{item.totalCost.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeFromPurchaseList(item.id)}
                  className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-30 rounded-lg transition-colors"
                  title="Remove Item"
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
    fabricPurchases: [],
    buttonsPurchases: [],
    packetsPurchases: [],
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
      const itemTotal = item.totalCost || 0;
      const gstAmount = itemTotal * (item.gstPercentage / 100 || 0);
      return sum + itemTotal + gstAmount;
    }, 0);
    setGrandTotal(total);
  }, [purchaseItems]);

  // Extract colors from products
  const getProductColors = () => {
    if (!formData.products || formData.products.length === 0) return '';

    const allColors = new Set();
    formData.products.forEach(product => {
      if (product.colors && Array.isArray(product.colors)) {
        product.colors.forEach(colorEntry => {
          allColors.add(colorEntry.color);
        });
      }
    });

    return Array.from(allColors).join(', ');
  };

  // In PurchaseForm.jsx, fix the handleSubmit function's purchaseMode mapping

  const handleSubmit = () => {
    const fabricPurchases = purchaseItems
      .filter(item => item.type === 'fabric')
      .map(item => {
        const itemTotal = item.totalCost || 0;
        const gstAmount = itemTotal * (item.gstPercentage / 100 || 0);
        return {
          productName: item.itemName,
          fabricType: item.itemName,
          vendor: item.vendor,
          vendorCode: item.vendorCode,
          vendorId: item.supplierId,
          purchaseMode: item.purchaseUnit || 'kg', // This is correct for fabric
          quantity: item.totalKg,
          costPerUnit: item.totalCost / (item.totalKg || 1),
          totalCost: item.totalCost,
          gstPercentage: item.gstPercentage || 0,
          totalWithGst: itemTotal + gstAmount,
          colors: item.colors?.map(c => c.color) || [],
          gsm: item.gsm,
          remarks: item.remarks || ''
        };
      });

    const buttonsPurchases = purchaseItems
      .filter(item => item.type === 'buttons')
      .map(item => {
        const itemTotal = item.totalCost || 0;
        const gstAmount = itemTotal * (item.gstPercentage / 100 || 0);

        // FIX: Map purchaseUnit to valid enum values for buttons
        let purchaseMode = 'pieces'; // default
        if (item.purchaseUnit === 'qty') {
          purchaseMode = 'qty';
        } else if (item.purchaseUnit === 'piece' || item.purchaseUnit === 'pieces') {
          purchaseMode = 'pieces';
        }

        return {
          productName: item.itemName,
          size: 'Standard',
          vendor: item.vendor,
          vendorCode: item.vendorCode,
          vendorId: item.supplierId,
          purchaseMode: purchaseMode, // Fixed mapping
          quantity: parseFloat(item.qty) || 0,
          costPerUnit: parseFloat(item.costPerQty) || 0,
          totalCost: item.totalCost,
          gstPercentage: item.gstPercentage || 0,
          totalWithGst: itemTotal + gstAmount,
          buttonType: 'Standard',
          color: '',
          remarks: item.remarks || ''
        };
      });

    const packetsPurchases = purchaseItems
      .filter(item => item.type === 'packets')
      .map(item => {
        const itemTotal = item.totalCost || 0;
        const gstAmount = itemTotal * (item.gstPercentage / 100 || 0);

        // FIX: Map purchaseUnit to valid enum values for packets
        let purchaseMode = 'piece'; // default
        if (item.purchaseUnit === 'packet') {
          purchaseMode = 'packet';
        } else if (item.purchaseUnit === 'piece' || item.purchaseUnit === 'pieces') {
          purchaseMode = 'piece';
        }

        return {
          productName: item.itemName,
          size: 'Standard',
          vendor: item.vendor,
          vendorCode: item.vendorCode,
          vendorId: item.supplierId,
          purchaseMode: purchaseMode, // Fixed mapping
          quantity: parseFloat(item.pieces) || 0,
          costPerUnit: parseFloat(item.costPerPiece) || 0,
          totalCost: item.totalCost,
          gstPercentage: item.gstPercentage || 0,
          totalWithGst: itemTotal + gstAmount,
          packetType: 'Standard',
          remarks: item.remarks || ''
        };
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
    <div className="w-full mx-auto bg-white dark:bg-gray-800">
      <div className="space-y-2">
        <div className="flex items-center justify-between pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {isEditMode ? 'Edit Purchase' : 'Create Purchase Entry'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {isEditMode ? 'Update purchase details' : 'Add purchase details for materials and accessories'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              <X className="w-4 h-4 mr-1.5" />
              Cancel
            </button>
          </div>
        </div>

        {/* Order Details (Read-only) - Horizontal Layout with Colors */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4 shadow-sm">
          <div className="grid grid-cols-7 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Order Date</label>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {formData.orderDate ? new Date(formData.orderDate).toLocaleDateString('en-IN') : '-'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">PO Number</label>
              <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{formData.PoNo || '-'}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Order Type</label>
              <div className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${formData.orderType === 'JOB-Works'
                  ? 'bg-purple-100 dark:bg-purple-900 dark:bg-opacity-50 text-purple-800 dark:text-purple-300'
                  : 'bg-blue-100 dark:bg-blue-900 dark:bg-opacity-50 text-blue-800 dark:text-blue-300'
                }`}>
                {formData.orderType || '-'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Buyer Code</label>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{formData.buyerCode || '-'}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Status</label>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{formData.orderStatus || '-'}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Total Qty</label>
              <div className="text-sm font-bold text-blue-600 dark:text-blue-400">{formData.totalQty || 0}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Colors</label>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100" title={getProductColors()}>
                {getProductColors() || '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Purchase Items Section */}
        <PurchaseItemsSection
          purchaseItems={purchaseItems}
          setPurchaseItems={setPurchaseItems}
          grandTotal={grandTotal}
          initialValues={initialValues}
        />

        {/* General Remarks and Grand Total */}
        <div className="flex justify-between pt-4">
          <div className="w-2/3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Remarks</label>
            <input
              type="text"
              value={formData.remarks || ''}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Additional notes..."
            />
          </div>
          <div className="bg-white dark:bg-gray-700 rounded-lg px-6 py-3 border border-gray-200 dark:border-gray-600 shadow-sm min-w-[180px]">
            <div className="text-sm text-gray-600 dark:text-gray-300">Grand Total</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">₹{grandTotal.toLocaleString()}</div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-600">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium"
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