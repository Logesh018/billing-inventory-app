import React, { useState, useEffect } from 'react';
import { BuyerSearchInput } from '../../components/Forms/SearchInputs';

export default function NoteForm({ noteType, onSubmit, onClose, initialValues = {} }) {
  // Basic note data
  const [formData, setFormData] = useState({
    noteNumber: "",
    noteDate: new Date().toISOString().split('T')[0],
    referenceType: "invoice",
    referenceNumber: "",
    referenceDate: new Date().toISOString().split('T')[0],
    reason: "",
    reasonDescription: "",
    partyDetails: {
      name: "",
      address: "",
      gst: "",
      state: "Tamil Nadu",
    }
  });

  // Items
  const [items, setItems] = useState([
    {
      description: "",
      hsnCode: "",
      quantity: 1,
      rate: 0,
      taxRate: 5,
    }
  ]);

  // Additional charges
  const [additionalCharges, setAdditionalCharges] = useState({
    description: "",
    amount: 0,
    hsnCode: "9997",
    taxRate: 18,
  });

  const [loading, setLoading] = useState(false);

  // Initialize form for editing
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setFormData({
        noteNumber: initialValues.noteNumber || "",
        noteDate: initialValues.noteDate
          ? new Date(initialValues.noteDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        referenceType: initialValues.referenceType || "invoice",
        referenceNumber: initialValues.referenceNumber || "",
        referenceDate: initialValues.referenceDate
          ? new Date(initialValues.referenceDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        reason: initialValues.reason || "",
        reasonDescription: initialValues.reasonDescription || "",
        partyDetails: {
          name: initialValues.partyDetails?.name || "",
          address: initialValues.partyDetails?.address || "",
          gst: initialValues.partyDetails?.gst || "",
          state: initialValues.partyDetails?.state || "Tamil Nadu",
        }
      });

      if (initialValues.items && initialValues.items.length > 0) {
        setItems(initialValues.items);
      }

      if (initialValues.additionalCharges) {
        setAdditionalCharges(initialValues.additionalCharges);
      }
    }
  }, [initialValues]);

  // Form handlers
  const handleFormChange = (field, value) => {
    if (field.startsWith('partyDetails.')) {
      const partyField = field.replace('partyDetails.', '');
      setFormData(prev => ({
        ...prev,
        partyDetails: { ...prev.partyDetails, [partyField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handlePartySelect = (party) => {
    setFormData(prev => ({
      ...prev,
      partyDetails: {
        name: party.name || "",
        address: party.address || "",
        gst: party.gst || "",
        state: party.state || "Tamil Nadu",
      }
    }));
  };

  // Item handlers
  const handleAddItem = () => {
    setItems([...items, {
      description: "",
      hsnCode: "",
      quantity: 1,
      rate: 0,
      taxRate: 5,
    }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length > 1) {
      const updated = [...items];
      updated.splice(index, 1);
      setItems(updated);
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  // Additional charges handlers
  const handleAdditionalChargesChange = (field, value) => {
    setAdditionalCharges(prev => ({ ...prev, [field]: value }));
  };

  // Calculate totals
  const calculateTotals = () => {
    // Calculate items subtotal and tax
    let itemsSubtotal = 0;
    let itemsTax = 0;

    items.forEach(item => {
      const qty = parseFloat(item.quantity || 0);
      const rate = parseFloat(item.rate || 0);
      const amount = qty * rate;
      itemsSubtotal += amount;

      const taxRate = parseFloat(item.taxRate || 0);
      const tax = (amount * taxRate) / 100;
      itemsTax += tax;
    });

    const itemsCgst = itemsTax / 2;
    const itemsSgst = itemsTax / 2;

    // Additional charges
    const additionalAmount = parseFloat(additionalCharges.amount || 0);
    const additionalTaxRate = parseFloat(additionalCharges.taxRate || 0);
    const additionalTax = (additionalAmount * additionalTaxRate) / 100;
    const additionalCgst = additionalTax / 2;
    const additionalSgst = additionalTax / 2;

    const totalCgst = itemsCgst + additionalCgst;
    const totalSgst = itemsSgst + additionalSgst;
    const totalTax = totalCgst + totalSgst;

    const totalBeforeRound = itemsSubtotal + totalTax + additionalAmount;
    const grandTotal = Math.round(totalBeforeRound);
    const roundOff = grandTotal - totalBeforeRound;

    return {
      subtotal: itemsSubtotal.toFixed(2),
      itemsCgst: itemsCgst.toFixed(2),
      itemsSgst: itemsSgst.toFixed(2),
      additionalCgst: additionalCgst.toFixed(2),
      additionalSgst: additionalSgst.toFixed(2),
      cgst: totalCgst.toFixed(2),
      sgst: totalSgst.toFixed(2),
      totalTax: totalTax.toFixed(2),
      roundOff: roundOff.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
    };
  };

  const totals = calculateTotals();

  // Submit handler
  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validation
      if (!formData.partyDetails.name.trim()) {
        alert("Party name is required");
        return;
      }

      if (!formData.referenceNumber.trim()) {
        alert("Reference number is required");
        return;
      }

      if (!formData.reason) {
        alert("Reason is required");
        return;
      }

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.description.trim()) {
          alert(`Item ${i + 1}: Description is required`);
          return;
        }
        if (item.quantity <= 0) {
          alert(`Item ${i + 1}: Quantity must be greater than 0`);
          return;
        }
        if (item.rate <= 0) {
          alert(`Item ${i + 1}: Rate must be greater than 0`);
          return;
        }
      }

      // Prepare submit data
      const submitData = {
        noteType: noteType,
        noteNumber: formData.noteNumber.trim() || undefined,
        noteDate: formData.noteDate,
        referenceType: formData.referenceType,
        referenceNumber: formData.referenceNumber.trim(),
        referenceDate: formData.referenceDate,
        reason: formData.reason,
        reasonDescription: formData.reasonDescription.trim(),
        partyDetails: {
          name: formData.partyDetails.name.trim(),
          address: formData.partyDetails.address.trim(),
          gst: formData.partyDetails.gst.trim(),
          state: formData.partyDetails.state.trim(),
        },
        items: items.map(item => ({
          description: item.description.trim(),
          hsnCode: item.hsnCode.trim(),
          quantity: parseFloat(item.quantity),
          rate: parseFloat(item.rate),
          taxRate: parseFloat(item.taxRate),
        })),
        additionalCharges: parseFloat(additionalCharges.amount) > 0 ? {
          description: additionalCharges.description.trim() || "Packing, Ship & Handling",
          amount: parseFloat(additionalCharges.amount),
          hsnCode: additionalCharges.hsnCode.trim(),
          taxRate: parseFloat(additionalCharges.taxRate),
        } : undefined,
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error("Error submitting note:", error);
      alert("Failed to save note. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Reason options based on note type
  const reasonOptions = noteType === 'credit' ? [
    { value: "goods-returned", label: "Goods Returned" },
    { value: "shortage-in-supply", label: "Shortage in Supply" },
    { value: "overcharged-amount", label: "Overcharged Amount" },
    { value: "discount-allowed", label: "Discount Allowed" },
    { value: "quality-issue", label: "Quality Issue" },
    { value: "damaged-goods", label: "Damaged Goods" },
    { value: "other", label: "Other" },
  ] : [
    { value: "undercharged-amount", label: "Undercharged Amount" },
    { value: "additional-charges", label: "Additional Charges" },
    { value: "price-difference", label: "Price Difference" },
    { value: "penalty-charges", label: "Penalty Charges" },
    { value: "other", label: "Other" },
  ];

  const referenceTypeOptions = [
    { value: "invoice", label: "Invoice" },
    { value: "proforma", label: "Proforma Invoice" },
    { value: "purchase-order", label: "Purchase Order" },
    { value: "other", label: "Other" },
  ];

  const taxRateOptions = [5, 12, 18, 28];
  const stateOptions = ["Tamil Nadu", "Andhra Pradesh", "Karnataka", "Kerala", "Telangana", "Maharashtra", "Gujarat", "Delhi", "Other"];

  const noteTitle = noteType === 'credit' ? 'Credit Note' : 'Debit Note';
  const noteColor = noteType === 'credit' ? 'green' : 'red';

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
      <div className="text-center mb-3">
        <h1 className="text-xl font-bold text-gray-800">
          {initialValues._id ? `Edit ${noteTitle}` : `Create ${noteTitle}`}
        </h1>
      </div>

      {/* Note Details Section */}
      <div className="mb-4">
        <h3 className={`text-sm font-semibold text-gray-700 mb-2 flex items-center`}>
          <div className={`w-1 h-4 bg-${noteColor}-500 rounded mr-2`}></div>
          {noteTitle} Details
        </h3>
        <div className="grid grid-cols-4 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Note Number</label>
            <input
              placeholder="Auto-generated"
              className="w-full border border-gray-300 text-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
              value={formData.noteNumber}
              onChange={(e) => handleFormChange('noteNumber', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Note Date*</label>
            <input
              type="date"
              className="w-full border border-gray-300 text-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
              value={formData.noteDate}
              onChange={(e) => handleFormChange('noteDate', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Reference Type*</label>
            <select
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
              value={formData.referenceType}
              onChange={(e) => handleFormChange('referenceType', e.target.value)}
            >
              {referenceTypeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Reference Number*</label>
            <input
              placeholder="INV/2025/001"
              className="w-full border border-gray-300 text-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
              value={formData.referenceNumber}
              onChange={(e) => handleFormChange('referenceNumber', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Reference Date</label>
            <input
              type="date"
              className="w-full border border-gray-300 text-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
              value={formData.referenceDate}
              onChange={(e) => handleFormChange('referenceDate', e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Reason*</label>
            <select
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
              value={formData.reason}
              onChange={(e) => handleFormChange('reason', e.target.value)}
            >
              <option value="">Select Reason</option>
              {reasonOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Reason Description</label>
          <textarea
            placeholder="Additional details about the reason..."
            rows="2"
            className="w-full border border-gray-300 text-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
            value={formData.reasonDescription}
            onChange={(e) => handleFormChange('reasonDescription', e.target.value)}
          />
        </div>
      </div>

      {/* Party Details Section */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
          <div className="w-1 h-4 bg-blue-500 rounded mr-2"></div>
          Party Details
        </h3>
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-3">
            <BuyerSearchInput
              label="Party Name*"
              value={formData.partyDetails.name}
              onChange={(value) => handleFormChange('partyDetails.name', value)}
              onSelect={handlePartySelect}
              placeholder="Party name"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">GST Number</label>
            <input
              placeholder="33AAFCI5192R1ZY"
              className="w-full border border-gray-300 text-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
              value={formData.partyDetails.gst}
              onChange={(e) => handleFormChange('partyDetails.gst', e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
            <select
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
              value={formData.partyDetails.state}
              onChange={(e) => handleFormChange('partyDetails.state', e.target.value)}
            >
              {stateOptions.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
          <div className="col-span-5">
            <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
            <textarea
              placeholder="Party address"
              rows="1"
              className="w-full border border-gray-300 text-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
              value={formData.partyDetails.address}
              onChange={(e) => handleFormChange('partyDetails.address', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center">
            <div className="w-1 h-4 bg-purple-500 rounded mr-2"></div>
            Items
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddItem}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded px-3 py-1 text-xs font-medium"
            >
              + Add Item
            </button>
            {items.length > 1 && (
              <button
                onClick={() => handleRemoveItem(items.length - 1)}
                className="bg-red-500 hover:bg-red-600 text-white rounded px-3 py-1 text-xs font-medium"
              >
                Remove Item
              </button>
            )}
            <div className={`bg-${noteColor}-100 text-${noteColor}-800 px-3 py-1 rounded text-xs font-semibold`}>
              Total: ₹{totals.grandTotal}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-700 text-left w-2/5">Description</th>
                <th className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-700 text-center w-20">HSN Code</th>
                <th className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-700 text-center w-16">Quantity</th>
                <th className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-700 text-center w-20">Rate (₹)</th>
                <th className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-700 text-center w-16">GST %</th>
                <th className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-700 text-center w-24">Amount (₹)</th>
                <th className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-700 text-center w-20">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const itemAmount = (parseFloat(item.quantity || 0) * parseFloat(item.rate || 0)).toFixed(2);
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-2 py-1">
                      <input
                        placeholder="Item description"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <input
                        placeholder="HSN"
                        className="w-full border border-gray-300 text-gray-800 rounded px-1 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-purple-400"
                        value={item.hsnCode}
                        onChange={(e) => handleItemChange(index, 'hsnCode', e.target.value)}
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <input
                        type="number"
                        min="1"
                        placeholder="1"
                        className="w-full border border-gray-300 text-gray-800 rounded px-1 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full border border-gray-300 text-gray-800 rounded px-1 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <select
                        className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-purple-400 bg-white"
                        value={item.taxRate}
                        onChange={(e) => handleItemChange(index, 'taxRate', e.target.value)}
                      >
                        {taxRateOptions.map(rate => (
                          <option key={rate} value={rate}>{rate}%</option>
                        ))}
                      </select>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center font-semibold text-gray-800">
                      ₹{itemAmount}
                    </td>
                    <td className="border border-gray-300 px-1 py-1 text-center">
                      <button
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length <= 1}
                        className="bg-red-400 hover:bg-red-500 text-white rounded px-2 py-0.5 text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Additional Charges Section */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
          <div className="w-1 h-4 bg-orange-500 rounded mr-2"></div>
          Additional Charges (Optional)
        </h3>
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-5">
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <input
              placeholder="Packing, Ship & Handling"
              className="w-full border border-gray-300 text-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
              value={additionalCharges.description}
              onChange={(e) => handleAdditionalChargesChange('description', e.target.value)}
            />
          </div>
          <div className="col-span-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">HSN Code</label>
            <input
              placeholder="9997"
              className="w-full border border-gray-300 text-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
              value={additionalCharges.hsnCode}
              onChange={(e) => handleAdditionalChargesChange('hsnCode', e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">GST %</label>
            <select
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-orange-400 bg-white"
              value={additionalCharges.taxRate}
              onChange={(e) => handleAdditionalChargesChange('taxRate', e.target.value)}
            >
              {taxRateOptions.map(rate => (
                <option key={rate} value={rate}>{rate}%</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Amount (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              className="w-full border border-gray-300 text-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
              value={additionalCharges.amount}
              onChange={(e) => handleAdditionalChargesChange('amount', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tax Summary */}
      <div className="mb-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded border border-gray-200 p-2">
            <div className="text-xs font-medium text-gray-700 mb-2">Items Tax</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">CGST:</span>
                <span>₹{totals.itemsCgst}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">SGST:</span>
                <span>₹{totals.itemsSgst}</span>
              </div>
            </div>
          </div>

          {parseFloat(additionalCharges.amount) > 0 && (
            <div className="bg-gray-50 rounded border border-gray-200 p-2">
              <div className="text-xs font-medium text-gray-700 mb-2">Additional Tax</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">CGST:</span>
                  <span>₹{totals.additionalCgst}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">SGST:</span>
                  <span>₹{totals.additionalSgst}</span>
                </div>
              </div>
            </div>
          )}

          <div className={`bg-gradient-to-br from-${noteColor}-50 to-${noteColor}-100 rounded border-2 border-${noteColor}-300 p-2`}>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-700">Subtotal:</span>
                <span className="font-medium">₹{totals.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Total Tax:</span>
                <span className="font-medium">₹{totals.totalTax}</span>
              </div>
              {parseFloat(additionalCharges.amount) > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>Additional:</span>
                  <span className="font-medium">₹{additionalCharges.amount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-700">Round Off:</span>
                <span className="font-medium">₹{totals.roundOff}</span>
              </div>
              <div className={`flex justify-between text-base font-bold text-${noteColor}-600 border-t-2 border-${noteColor}-400 pt-1 mt-1`}>
                <span>Grand Total:</span>
                <span>₹{totals.grandTotal}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-600">
          {items.length} item{items.length !== 1 ? 's' : ''} • ₹{totals.grandTotal}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="bg-gray-500 hover:bg-gray-600 text-white rounded px-4 py-1.5 text-xs font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className={`bg-${noteColor}-600 hover:bg-${noteColor}-700 text-white rounded px-4 py-1.5 text-xs font-medium disabled:opacity-50 flex items-center gap-1`}
          >
            {loading ? "Saving..." : initialValues._id ? `Update ${noteTitle}` : `Generate ${noteTitle}`}
          </button>
        </div>
      </div>
    </div>
  );
}