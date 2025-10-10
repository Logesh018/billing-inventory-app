import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, FileText, Package } from 'lucide-react';
import { axiosInstance } from '../../lib/axios';

// FabricColorRows component (reused from PurchaseForm)
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
            <label className="text-xs text-gray-500 block mb-1">Color</label>
            <input
              type="text"
              value={item.colors[0].color}
              onChange={(e) => updateColorRow(0, 'color', e.target.value)}
              placeholder="Color"
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-400 h-9"
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
              onWheel={(e) => e.target.blur()}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-400 h-9"
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
              onWheel={(e) => e.target.blur()}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-400 h-9"
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
                Add to Estimation
              </button>
            )}

            {item.isCompleted && (
              <div className="px-3 py-2 bg-green-100 text-green-700 text-sm rounded-lg font-medium h-9 flex items-center">
                Added ✓
              </div>
            )}

            <button
              type="button"
              onClick={() => onRemoveItemForm(item.id)}
              className="text-red-500 hover:bg-red-50 rounded-full p-1.5 transition-colors h-9"
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
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-400 h-9"
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
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-400 h-9"
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
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-400 h-9"
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

// ItemForm component for Fabric/Buttons/Packets
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

  return (
    <div className={`border border-gray-200 rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow ${item.isCompleted ? 'opacity-60' : ''} w-full`}>
      <div className="flex flex-wrap items-end gap-2 mb-1">
        <div className="w-20">
          <label className="text-xs text-gray-500 block mb-1">Type</label>
          <select
            value={item.type}
            onChange={(e) => onUpdateItemForm(item.id, 'type', e.target.value)}
            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-400 h-9"
            disabled={item.isCompleted}
          >
            <option value="fabric">Fabric</option>
            <option value="buttons">Buttons</option>
            <option value="packets">Packets</option>
          </select>
        </div>

        <div className="w-35">
          <label className="text-xs text-gray-500 block mb-1">Item Name</label>
          <input
            type="text"
            value={item.itemName}
            onChange={(e) => onUpdateItemForm(item.id, 'itemName', e.target.value)}
            placeholder="Item Name"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-400 h-9"
            disabled={item.isCompleted}
          />
        </div>

        {item.type === 'fabric' && (
          <div className="w-20">
            <label className="text-xs text-gray-500 block mb-1">GSM</label>
            <input
              type="text"
              value={item.gsm}
              onChange={(e) => onUpdateItemForm(item.id, 'gsm', e.target.value)}
              placeholder="GSM"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-400 h-9"
              disabled={item.isCompleted}
            />
          </div>
        )}

        <div className="w-30 relative">
          <label className="text-xs text-gray-500 block mb-1">Vendor</label>
          <input
            type="text"
            value={item.vendor}
            onChange={(e) => {
              onUpdateItemForm(item.id, 'vendor', e.target.value);
              searchSuppliers(e.target.value);
            }}
            onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 200)}
            placeholder="Search vendor"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-400 h-9"
            disabled={item.isCompleted}
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
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-400 h-9"
            disabled={item.isCompleted}
          />
        </div>

        <div className="w-20">
          <label className="text-xs text-gray-500 block mb-1">Unit</label>
          <select
            value={item.purchaseUnit}
            onChange={(e) => onUpdateItemForm(item.id, 'purchaseUnit', e.target.value)}
            className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-400 h-9"
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
                <option value="pieces">per Piece</option>
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
              <label className="text-xs text-gray-500 block mb-1">Total {item.purchaseUnit === 'kg' ? 'KG' : item.purchaseUnit === 'meter' ? 'Mtr' : 'Pcs'}</label>
              <div className="px-2 py-1.5 text-xs bg-blue-50 border border-blue-200 rounded text-blue-700 font-medium text-center h-9 flex items-center justify-center">
                {totalKg || 0}
              </div>
            </div>
            <div className="w-20">
              <label className="text-xs text-gray-500 block mb-1">Amount</label>
              <div className="px-2 py-1.5 text-xs bg-green-50 border border-green-200 rounded text-green-700 font-medium text-center h-9 flex items-center justify-center">
                ₹{totalCost || 0}
              </div>
            </div>
            <div className="w-16">
              <label className="text-xs text-gray-500 block mb-1">GST</label>
              <select
                value={item.gstPercentage || ''}
                onChange={(e) => onUpdateItemForm(item.id, 'gstPercentage', parseFloat(e.target.value) || 0)}
                className="w-full text-xs border border-gray-300 rounded px-1 py-1.5 focus:ring-1 focus:ring-blue-400 h-9"
                disabled={item.isCompleted}
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
                ₹{totalWithGst.toFixed(2) || 0}
              </div>
            </div>
          </>
        )}

        {(item.type === 'buttons' || item.type === 'packets') && (
          <div className="w-16">
            <label className="text-xs text-gray-500 block mb-1">
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
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-400 h-9"
              disabled={item.isCompleted}
            />
          </div>
        )}

        {(item.type === 'buttons' || item.type === 'packets') && (
          <div className="w-18">
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
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-400 h-9"
              disabled={item.isCompleted}
            />
          </div>
        )}

        {(item.type === 'buttons' || item.type === 'packets') && (
          <>
            <div className="w-20">
              <label className="text-xs text-gray-500 block mb-1">Amount</label>
              <div className="px-2 py-1.5 text-xs bg-green-50 border border-green-200 rounded text-green-700 font-medium text-center h-9 flex items-center justify-center">
                ₹{totalCost || 0}
              </div>
            </div>
            <div className="w-16">
              <label className="text-xs text-gray-500 block mb-1">GST</label>
              <select
                value={item.gstPercentage || ''}
                onChange={(e) => onUpdateItemForm(item.id, 'gstPercentage', parseFloat(e.target.value) || 0)}
                className="w-full text-xs border border-gray-300 rounded px-1 py-1.5 focus:ring-1 focus:ring-blue-400 h-9"
                disabled={item.isCompleted}
              >
                <option value="">Select</option>
                <option value="5">5%</option>
                <option value="14">14%</option>
                <option value="18">18%</option>
              </select>
            </div>
            <div className="w-22">
              <label className="text-xs text-gray-500 block mb-1">Total + GST</label>
              <div className="px-2 py-1.5 text-xs bg-purple-50 border border-purple-200 rounded text-purple-700 font-medium text-center h-9 flex items-center justify-center">
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
              Add to Estimation
            </button>
          )}

          {item.type !== 'fabric' && item.isCompleted && (
            <div className="px-3 py-2 mt-1 bg-green-100 text-green-700 text-sm rounded-lg font-medium h-9 flex items-center">
              Added ✓
            </div>
          )}

          {item.type !== 'fabric' && (
            <button
              type="button"
              onClick={() => onRemoveItemForm(item.id)}
              className="text-red-500 hover:bg-red-50 rounded-full p-1.5 transition-colors h-9"
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

// Machine Item Form Component
const MachineItemForm = ({ item, onUpdateItemForm, onAddItemToPurchaseList, onRemoveItemForm }) => {
  const [supplierSuggestions, setSupplierSuggestions] = useState([]);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  const handleNumberFocus = (e) => {
    if (e.target.value === '0') {
      e.target.value = '';
    }
  };

  const cost = parseFloat(item.cost) || 0;
  const gstAmount = cost * (item.gstPercentage / 100 || 0);
  const totalWithGst = cost + gstAmount;

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

  return (
    <div className={`border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow ${item.isCompleted ? 'opacity-60' : ''}`}>
      <div className="flex flex-wrap items-end gap-3 mb-2">
        <div className="w-48">
          <label className="text-xs text-gray-500 block mb-1">Machine Name</label>
          <input
            type="text"
            value={item.machineName}
            onChange={(e) => onUpdateItemForm(item.id, 'machineName', e.target.value)}
            placeholder="Enter machine name"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-400"
            disabled={item.isCompleted}
          />
        </div>

        <div className="w-40 relative">
          <label className="text-xs text-gray-500 block mb-1">Vendor</label>
          <input
            type="text"
            value={item.vendor}
            onChange={(e) => {
              onUpdateItemForm(item.id, 'vendor', e.target.value);
              searchSuppliers(e.target.value);
            }}
            onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 200)}
            placeholder="Search vendor"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-400"
            disabled={item.isCompleted}
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

        <div className="w-28">
          <label className="text-xs text-gray-500 block mb-1">Vendor Code</label>
          <input
            type="text"
            value={item.vendorCode || ''}
            onChange={(e) => onUpdateItemForm(item.id, 'vendorCode', e.target.value)}
            placeholder="Code"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-400"
            disabled={item.isCompleted}
          />
        </div>

        <div className="w-32">
          <label className="text-xs text-gray-500 block mb-1">Cost (₹)</label>
          <input
            type="number"
            value={item.cost}
            onFocus={handleNumberFocus}
            onChange={(e) => onUpdateItemForm(item.id, 'cost', e.target.value)}
            onWheel={(e) => e.target.blur()}
            placeholder="Enter cost"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-400"
            disabled={item.isCompleted}
          />
        </div>

        <div className="w-24">
          <label className="text-xs text-gray-500 block mb-1">GST %</label>
          <select
            value={item.gstPercentage || ''}
            onChange={(e) => onUpdateItemForm(item.id, 'gstPercentage', parseFloat(e.target.value) || 0)}
            className="w-full text-sm border border-gray-300 rounded px-2 py-2 focus:ring-1 focus:ring-blue-400"
            disabled={item.isCompleted}
          >
            <option value="">No GST</option>
            <option value="5">5%</option>
            <option value="12">12%</option>
            <option value="14">14%</option>
            <option value="18">18%</option>
            <option value="28">28%</option>
          </select>
        </div>

        <div className="w-32">
          <label className="text-xs text-gray-500 block mb-1">Total Cost</label>
          <div className="px-3 py-2 text-sm bg-green-50 border border-green-200 rounded text-green-700 font-medium text-center">
            ₹{cost.toFixed(2)}
          </div>
        </div>

        <div className="w-32">
          <label className="text-xs text-gray-500 block mb-1">Total + GST</label>
          <div className="px-3 py-2 text-sm bg-purple-50 border border-purple-200 rounded text-purple-700 font-medium text-center">
            ₹{totalWithGst.toFixed(2)}
          </div>
        </div>

        <div className="ml-auto flex gap-2">
          {!item.isCompleted && (
            <button
              type="button"
              onClick={() => onAddItemToPurchaseList(item.id)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors font-medium"
            >
              Add to Estimation
            </button>
          )}

          {item.isCompleted && (
            <div className="px-4 py-2 bg-green-100 text-green-700 text-sm rounded-lg font-medium">
              Added ✓
            </div>
          )}

          <button
            type="button"
            onClick={() => onRemoveItemForm(item.id)}
            className="text-red-500 hover:bg-red-50 rounded-full p-2 transition-colors"
            title="Remove Machine"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-3">
        <label className="text-xs text-gray-500 block mb-1">Remarks</label>
        <textarea
          value={item.remarks || ''}
          onChange={(e) => onUpdateItemForm(item.id, 'remarks', e.target.value)}
          placeholder="Additional notes..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-400"
          rows="2"
          disabled={item.isCompleted}
        />
      </div>
    </div>
  );
};

// Main Purchase Estimation Form Component
const PurchaseEstimationForm = ({ initialValues, onSubmit, onCancel, submitLabel, isEditMode }) => {
  const [estimationType, setEstimationType] = useState('order'); // 'order' or 'machine'
  const [formData, setFormData] = useState({
    estimationDate: new Date().toISOString().split('T')[0],
    PoNo: '',
    remarks: '',
    ...initialValues
  });

  const [purchaseItems, setPurchaseItems] = useState([]);
  const [activeItems, setActiveItems] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);

  // Order search states
  const [orderSuggestions, setOrderSuggestions] = useState([]);
  const [showOrderDropdown, setShowOrderDropdown] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setFormData({
        estimationDate: initialValues.estimationDate ? new Date(initialValues.estimationDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        PoNo: initialValues.PoNo || '',
        remarks: initialValues.remarks || '',
      });

      // Set estimation type
      if (initialValues.estimationType) {
        setEstimationType(initialValues.estimationType);
      }

      // Load order details if available
      if (initialValues.order) {
        setSelectedOrder({
          _id: initialValues.order,
          PoNo: initialValues.PoNo,
          buyerDetails: initialValues.buyerDetails,
          orderProducts: initialValues.orderProducts,
          totalOrderQty: initialValues.totalOrderQty,
          orderDate: initialValues.orderDate,
          orderType: initialValues.orderType
        });
      }

      // Load existing items if editing
      const items = [];

      if (initialValues.machinesPurchases && initialValues.machinesPurchases.length > 0) {
        initialValues.machinesPurchases.forEach(machine => {
          items.push({
            id: Date.now() + Math.random(),
            type: 'machine',
            machineName: machine.machineName,
            vendor: machine.vendor,
            vendorCode: machine.vendorCode || '',
            supplierId: machine.vendorId,
            cost: machine.cost,
            gstPercentage: machine.gstPercentage || 0,
            remarks: machine.remarks || '',
            isCompleted: true
          });
        });
      }

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
            purchaseUnit: fabric.unit || 'kg',
            totalKg: fabric.quantity,
            totalCost: fabric.totalCost,
            gstPercentage: fabric.gstRate || 0,
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
            purchaseUnit: button.unit || 'pieces',
            qty: button.quantity,
            costPerQty: button.costPerUnit,
            totalCost: button.totalCost,
            gstPercentage: button.gstRate || 0,
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
            purchaseUnit: packet.unit || 'piece',
            pieces: packet.quantity,
            costPerPiece: packet.costPerUnit,
            totalCost: packet.totalCost,
            gstPercentage: packet.gstRate || 0,
            isCompleted: true
          });
        });
      }

      setPurchaseItems(items);
    }
  }, [initialValues]);

  useEffect(() => {
    const total = purchaseItems.reduce((sum, item) => {
      if (item.type === 'machine') {
        const cost = parseFloat(item.cost) || 0;
        const gstAmount = cost * (item.gstPercentage / 100 || 0);
        return sum + cost + gstAmount;
      } else {
        const itemTotal = item.totalCost || 0;
        const gstAmount = itemTotal * (item.gstPercentage / 100 || 0);
        return sum + itemTotal + gstAmount;
      }
    }, 0);
    setGrandTotal(total);
  }, [purchaseItems]);

  // Search orders by PoNo
  // Search orders by PoNo
  const searchOrders = async (searchTerm) => {
    if (searchTerm.length < 2) {
      setOrderSuggestions([]);
      setShowOrderDropdown(false);
      return;
    }

    try {
      const response = await axiosInstance.get(`/purchase-estimations/search/orders?q=${encodeURIComponent(searchTerm)}`);
      console.log("Search orders response:", response); // Debug log

      // Check if the response is HTML (which indicates an error)
      if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
        throw new Error("Invalid API response. The endpoint might not be correctly configured.");
      }

      // Ensure data is an array
      setOrderSuggestions(Array.isArray(response.data) ? response.data : []);
      setShowOrderDropdown(true);
    } catch (error) {
      console.error("Error searching orders:", error);
      setOrderSuggestions([]);
      setShowOrderDropdown(false);

      // More detailed error message
      let errorMessage = 'Failed to search orders';
      if (error.response) {
        errorMessage += `: ${error.response.status} ${error.response.statusText}`;
        if (error.response.data && error.response.data.message) {
          errorMessage += ` - ${error.response.data.message}`;
        }
      } else if (error.request) {
        errorMessage += ': No response received from server';
      } else {
        errorMessage += `: ${error.message}`;
      }

      console.error(errorMessage);
    }
  };

  // Fetch order details
  const fetchOrderDetails = async (PoNo) => {
    setOrderLoading(true);
    try {
      console.log("Fetching order details for PoNo:", PoNo); // Debug log

      // Check if PoNo is valid
      if (!PoNo || PoNo.trim() === '') {
        throw new Error("Invalid PoNo");
      }

      const response = await axiosInstance.get(`/purchase-estimations/order/${encodeURIComponent(PoNo)}`);
      console.log("Order details response:", response); // Debug log

      // Check if the response is HTML (which indicates an error)
      if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
        throw new Error("Invalid API response. The endpoint might not be correctly configured.");
      }

      if (!response.data) {
        throw new Error("No order data received");
      }

      setSelectedOrder(response.data);
      setFormData(prev => ({ ...prev, PoNo: response.data.PoNo }));
      setShowOrderDropdown(false);
      setOrderSuggestions([]);
    } catch (error) {
      console.error("Error fetching order details:", error);

      // More detailed error message
      let errorMessage = 'Failed to fetch order details';
      if (error.response) {
        errorMessage += `: ${error.response.status} ${error.response.statusText}`;
        if (error.response.data && error.response.data.message) {
          errorMessage += ` - ${error.response.data.message}`;
        }
      } else if (error.request) {
        errorMessage += ': No response received from server';
      } else {
        errorMessage += `: ${error.message}`;
      }

      alert(errorMessage);
    } finally {
      setOrderLoading(false);
    }
  };

  const createNewItemForm = () => {
    if (estimationType === 'machine') {
      return {
        id: Date.now(),
        type: 'machine',
        machineName: '',
        vendor: '',
        vendorCode: '',
        supplierId: '',
        cost: '',
        gstPercentage: 18,
        remarks: '',
        isCompleted: false
      };
    } else {
      return {
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
      };
    }
  };

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

        if (item.type === 'machine' && field === 'cost') {
          // No additional calculation needed for machine
        } else if (item.type === 'buttons' && (field === 'qty' || field === 'costPerQty')) {
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

    if (!item) return;

    // Validation based on item type
    if (item.type === 'machine') {
      if (!item.machineName || !item.vendor || !item.cost) {
        alert('Please fill in Machine Name, Vendor, and Cost');
        return;
      }
    } else {
      if (!item.itemName || !item.vendor) {
        alert('Please fill in Item Name and Vendor');
        return;
      }

      if (item.type === 'fabric' && item.colors.some(color => !color.color)) {
        alert('Please fill in all color names');
        return;
      }
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

  const handleEstimationTypeChange = (type) => {
    if (activeItems.length > 0 || purchaseItems.length > 0) {
      const confirm = window.confirm('Changing estimation type will clear all items. Continue?');
      if (!confirm) return;
    }

    setEstimationType(type);
    setActiveItems([]);
    setPurchaseItems([]);

    if (type === 'machine') {
      setSelectedOrder(null);
      setFormData(prev => ({ ...prev, PoNo: '' }));
    }
  };

  const handleSubmit = () => {
    if (purchaseItems.length === 0) {
      alert('Please add at least one item');
      return;
    }

    let submitData = {
      estimationType: estimationType, // Add this line
      estimationDate: formData.estimationDate,
      remarks: formData.remarks,
    };

    if (estimationType === 'machine') {
      // Machine estimation submission
      const machinesPurchases = purchaseItems
        .filter(item => item.type === 'machine')
        .map(item => {
          const cost = parseFloat(item.cost) || 0;
          const gstAmount = cost * (item.gstPercentage / 100 || 0);
          return {
            machineName: item.machineName,
            vendor: item.vendor,
            vendorCode: item.vendorCode || null,
            vendorId: item.supplierId || null,
            cost: cost,
            gstRate: item.gstPercentage || 0,
            totalCost: cost,
            gstAmount: gstAmount,
            totalWithGst: cost + gstAmount,
            remarks: item.remarks || ''
          };
        });

      submitData.machinesPurchases = machinesPurchases;
      submitData.grandTotalCost = grandTotal;
    } else {
      // Order estimation submission
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
            quantity: item.totalKg,
            unit: item.purchaseUnit || 'kg',
            costPerUnit: item.totalCost / (item.totalKg || 1),
            totalCost: item.totalCost,
            gstRate: item.gstPercentage || 0,
            gstAmount: gstAmount,
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

          let unit = 'pieces';
          if (item.purchaseUnit === 'qty') {
            unit = 'qty';
          } else if (item.purchaseUnit === 'piece' || item.purchaseUnit === 'pieces') {
            unit = 'pieces';
          }

          return {
            productName: item.itemName,
            size: 'Standard',
            vendor: item.vendor,
            vendorCode: item.vendorCode,
            vendorId: item.supplierId,
            quantity: parseFloat(item.qty) || 0,
            unit: unit,
            costPerUnit: parseFloat(item.costPerQty) || 0,
            totalCost: item.totalCost,
            gstRate: item.gstPercentage || 0,
            gstAmount: gstAmount,
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

          let unit = 'piece';
          if (item.purchaseUnit === 'packet') {
            unit = 'packet';
          } else if (item.purchaseUnit === 'piece' || item.purchaseUnit === 'pieces') {
            unit = 'piece';
          }

          return {
            productName: item.itemName,
            size: 'Standard',
            vendor: item.vendor,
            vendorCode: item.vendorCode,
            vendorId: item.supplierId,
            quantity: parseFloat(item.pieces) || 0,
            unit: unit,
            costPerUnit: parseFloat(item.costPerPiece) || 0,
            totalCost: item.totalCost,
            gstRate: item.gstPercentage || 0,
            gstAmount: gstAmount,
            totalWithGst: itemTotal + gstAmount,
            packetType: 'Standard',
            remarks: item.remarks || ''
          };
        });

      submitData.PoNo = formData.PoNo || null;
      submitData.order = selectedOrder?._id || null;
      submitData.orderDate = selectedOrder?.orderDate || null;
      submitData.orderType = selectedOrder?.orderType || null;
      submitData.buyerDetails = selectedOrder?.buyerDetails || null;
      submitData.orderProducts = selectedOrder?.products || [];
      submitData.totalOrderQty = selectedOrder?.totalOrderQty || 0;
      submitData.fabricPurchases = fabricPurchases;
      submitData.buttonsPurchases = buttonsPurchases;
      submitData.packetsPurchases = packetsPurchases;
      submitData.grandTotalCost = grandTotal;
    }

    console.log("Submit data:", submitData); // Add this line for debugging
    onSubmit(submitData);
  };

  return (
    <div className="w-full mx-auto bg-white">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {isEditMode ? 'Edit Purchase Estimation' : 'Create Purchase Estimation'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {isEditMode ? 'Update estimation details' : 'Create a new purchase cost estimation'}
            </p>
          </div>
        </div>

        {/* Estimation Type Selection */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-3">Estimation Type</label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => handleEstimationTypeChange('order')}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${estimationType === 'order'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              disabled={isEditMode}
            >
              <FileText className="w-5 h-5 mr-2" />
              Order Estimation
            </button>
            <button
              type="button"
              onClick={() => handleEstimationTypeChange('machine')}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${estimationType === 'machine'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              disabled={isEditMode}
            >
              <Package className="w-5 h-5 mr-2" />
              Machine Estimation
            </button>
          </div>
        </div>

        {/* Estimation Date and Order/Machine Details */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Estimation Date</label>
              <input
                type="date"
                value={formData.estimationDate}
                onChange={(e) => setFormData({ ...formData, estimationDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {estimationType === 'order' && (
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  PoNo (Order Number)
                </label>
                <input
                  type="text"
                  value={formData.PoNo}
                  onChange={(e) => {
                    setFormData({ ...formData, PoNo: e.target.value });
                    searchOrders(e.target.value);
                  }}
                  onBlur={() => setTimeout(() => setShowOrderDropdown(false), 200)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Search by PoNo..."
                />
                {showOrderDropdown && Array.isArray(orderSuggestions) && orderSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
                    {orderSuggestions.map((order) => (
                      <div
                        key={order._id}
                        className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                        onClick={() => fetchOrderDetails(order.PoNo)}
                      >
                        <div className="font-medium text-gray-800">{order.PoNo}</div>
                        <div className="text-sm text-gray-600">
                          {order.buyerName} • {new Date(order.orderDate).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {estimationType === 'machine' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Remarks</label>
                <input
                  type="text"
                  value={formData.remarks || ''}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Optional notes..."
                />
              </div>
            )}
          </div>
        </div>

        {orderLoading && (
          <div className="flex justify-center items-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading order details...</span>
          </div>
        )}

        {/*  Order Details Display (Read-only) */}
        {estimationType === 'order' && selectedOrder && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <div className="text-xs text-gray-600">Buyer Name</div>
                <div className="font-medium text-gray-800">
                  {selectedOrder.buyerDetails?.name || selectedOrder.buyer?.name || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Buyer Code</div>
                <div className="font-medium text-gray-800">
                  {selectedOrder.buyerDetails?.code || selectedOrder.buyer?.code || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Order Date</div>
                <div className="font-medium text-gray-800">
                  {selectedOrder.orderDate ? new Date(selectedOrder.orderDate).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Total Qty</div>
                <div className="font-medium text-gray-800">
                  {selectedOrder.totalOrderQty || selectedOrder.totalQty || 'N/A'}
                </div>
              </div>
            </div>

            <div className="border-t border-green-200 pt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Products</h4>
              <div className="space-y-2">
                {selectedOrder.products && selectedOrder.products.length > 0 ? (
                  selectedOrder.products.map((product, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-3 border border-green-100">
                      <div className="font-medium text-gray-800 mb-2">
                        {product.productName} - {product.fabricType}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        {product.colors && product.colors.length > 0 ? (
                          product.colors.map((colorObj, colorIdx) => (
                            <div key={colorIdx} className="bg-gray-50 rounded p-2">
                              <div className="font-medium text-gray-700">{colorObj.color}</div>
                              <div className="text-gray-600 mt-1">
                                {colorObj.sizes && colorObj.sizes.length > 0
                                  ? colorObj.sizes.map(s => `${s.size}: ${s.quantity}`).join(', ')
                                  : 'N/A'}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-4 text-gray-500">No color information available</div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500">No products found for this order</div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Purchase Items Section */}
        <div className="space-y-3 w-full">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              {estimationType === 'machine' ? 'Machine Items' : 'Purchase Items'}
            </h3>
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
                <React.Fragment key={item.id}>
                  {item.type === 'machine' ? (
                    <MachineItemForm
                      item={item}
                      onUpdateItemForm={updateItemForm}
                      onAddItemToPurchaseList={addItemToPurchaseList}
                      onRemoveItemForm={removeItemForm}
                    />
                  ) : (
                    <ItemForm
                      item={item}
                      onUpdateItemForm={updateItemForm}
                      onUpdateFabricColors={updateFabricColors}
                      onAddItemToPurchaseList={addItemToPurchaseList}
                      onRemoveItemForm={removeItemForm}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Purchase Items List */}
          {purchaseItems.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Estimation Items</h3>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vendor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        GST
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {purchaseItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.type === 'machine' ? item.machineName : item.itemName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.vendor}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.type === 'machine' ? '1' :
                            item.type === 'fabric' ? `${item.totalKg} ${item.purchaseUnit}` :
                              item.type === 'buttons' ? `${item.qty} ${item.purchaseUnit}` :
                                `${item.pieces} ${item.purchaseUnit}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ₹{item.type === 'machine' ? item.cost : item.totalCost}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.gstPercentage}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ₹{item.type === 'machine' ?
                            (parseFloat(item.cost) * (1 + (item.gstPercentage / 100 || 0))).toFixed(2) :
                            (item.totalCost * (1 + (item.gstPercentage / 100 || 0))).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            type="button"
                            onClick={() => removeFromPurchaseList(item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                        Grand Total:
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        ₹{grandTotal.toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Remarks Section */}
          {estimationType === 'order' && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Remarks</label>
              <textarea
                value={formData.remarks || ''}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Additional notes..."
                rows="3"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <X className="w-4 h-4 mr-1.5" />
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm"
            >
              <Save className="w-4 h-4 mr-1.5" />
              {submitLabel || 'Save Estimation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseEstimationForm;