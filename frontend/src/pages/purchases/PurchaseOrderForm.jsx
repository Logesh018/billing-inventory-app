import { useState } from "react";
import { Save, Plus, X, Search } from "lucide-react";
import { axiosInstance } from "../../lib/axios";
import { POSupplierSearchInput } from "../../components/Forms/SearchInputs";

const PurchaseOrderForm = ({ onCancel, onSuccess }) => {
  const [formData, setFormData] = useState({
    poNumber: "",
    poDate: new Date().toISOString().split('T')[0],
    supplier: { _id: "", name: "", address: "", gstin: "" },
    items: [
      { product: "", quantity: "", rate: "", gst: 5, amount: 0 },
    ],
    roundOff: 0,
    totalValue: 0,
    grandTotal: 0,
  });

  const [supplierSuggestions, setSupplierSuggestions] = useState([]);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");

  // Search suppliers from API
  const searchSuppliers = async (searchTerm) => {
    if (searchTerm.length < 2) {
      setSupplierSuggestions([]);
      setShowSupplierDropdown(false);
      return;
    }

    try {
      const { data } = await axiosInstance.get(`/purchase-orders/search/suppliers?q=${searchTerm}`);
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
    setFormData(prev => ({
      ...prev,
      supplier: {
        _id: supplier._id,
        name: supplier.name,
        address: supplier.address || "NO address",
        gstin: supplier.gst || "NO GST"
      }
    }));
    setSupplierSearch(supplier.name);
    setShowSupplierDropdown(false);
    setSupplierSuggestions([]);
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;

    const qty = parseFloat(updatedItems[index].quantity) || 0;
    const rate = parseFloat(updatedItems[index].rate) || 0;
    const gst = parseFloat(updatedItems[index].gst) || 0;

    const subtotal = qty * rate;
    const totalWithGst = subtotal + subtotal * (gst / 100);
    updatedItems[index].amount = totalWithGst;

    calculateTotals(updatedItems);
  };

  const calculateTotals = (items) => {
    const totalValue = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const roundOff = parseFloat(formData.roundOff || 0);
    const grandTotal = totalValue + roundOff;

    setFormData(prev => ({ ...prev, items, totalValue, grandTotal }));
  };

  const handleRoundOffChange = (value) => {
    const roundOff = parseFloat(value) || 0;
    const grandTotal = formData.totalValue + roundOff;
    setFormData({ ...formData, roundOff, grandTotal });
  };

  const addItemRow = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { product: "", quantity: "", rate: "", gst: 5, amount: 0 },
      ],
    });
  };

  const removeItemRow = (index) => {
    const updated = formData.items.filter((_, i) => i !== index);
    calculateTotals(updated);
  };

  const handleNewSupplier = () => {
    // Navigate to create supplier page - adjust this based on your routing
    if (window.location.pathname.includes('/purchase-orders')) {
      window.location.href = '/suppliers?action=create';
    } else {
      // If using React Router, use navigate
      // navigate('/suppliers?action=create');
      alert("Please navigate to Suppliers page to create a new supplier");
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.supplier._id) {
      alert("Please select a supplier");
      return;
    }
    if (!formData.poNumber.trim()) {
      alert("Please enter PO Number");
      return;
    }
    if (!formData.items.some(item => item.product.trim())) {
      alert("Please add at least one item");
      return;
    }
    try {
      const payload = {
        poNumber: formData.poNumber,
        poDate: formData.poDate,

        // Buyer details (your company - NILA TEXGARMENTS)
        buyer: {
          name: "NILA TEXGARMENTS",
          address: "31/4, Kamaraj Nagar, Gandhi Nagar, Karamadai, Mettupalayam, Coimbatore 641104 TN",
          gstin: "33AAVFN6955C1ZX"
        },

        // Supplier details (nested object structure)
        supplier: {
          name: formData.supplier.name,
          address: formData.supplier.address,
          gstin: formData.supplier.gstin
        },

        // Items with correct field names
        items: formData.items
          .filter(item => item.product.trim())
          .map(item => ({
            description: item.product,  // Changed from 'product' to 'description'
            quantity: parseFloat(item.quantity) || 0,
            rate: parseFloat(item.rate) || 0,
            amount: item.amount
          })),

        totalValue: formData.totalValue,
        roundOff: formData.roundOff,
        grandTotal: formData.grandTotal
      };

      console.log("Submitting payload:", JSON.stringify(payload, null, 2));

      await axiosInstance.post('/purchase-orders', payload);

      alert("Purchase Order created successfully!");
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error creating purchase order:", error);
      alert(`Failed to create Purchase Order: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div className="flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 overflow-hidden">
      <div className="w-full max-w-6xl bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="p-6 space-y-4">
          {/* Row 1: Heading */}
          <div className="text-center pb-3 border-b-2 border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">NILA PURCHASE ORDER</h1>
          </div>

          {/* Row 2: Company Details & Cancel Button */}
          <div className="flex justify-between items-start">
            <div className="w-[40%] border-2 border-blue-600 bg-blue-50 rounded-lg p-3">
              <h3 className="font-bold text-blue-700 text-base mb-1">NILA TEXGARMENTS</h3>
              <p className="text-xs leading-relaxed text-gray-700">
                31/4, Kamaraj Nagar, Gandhi Nagar,<br />
                Karamadai, Mettupalayam, Coimbatore 641104 TN
              </p>
              <p className="text-xs font-semibold mt-1.5 text-gray-800">GSTIN: 33AAVFN6955C1ZX</p>
            </div>

            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors font-medium flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>

          {/* Row 3: Supplier Details, PO No, Date */}
          <div className="flex gap-4 items-start">
            {/* Supplier Details */}
            <div className="w-[40%] border-2 border-blue-600 bg-blue-50 rounded-lg p-3 relative">
              {/* Row 1: New Supplier Button */}
              <div className="flex justify-end mb-3">
                <button
                  onClick={handleNewSupplier}
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] rounded transition-colors font-medium shadow-sm"
                >
                  + New Supplier
                </button>
              </div>

              {/* Row 2: Supplier Name */}
              <div className="flex items-center mb-2 gap-2">
                <label className="text-xs font-semibold text-blue-700 w-[80px]">Supplier:</label>
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search supplier..."
                    value={supplierSearch}
                    onChange={(e) => {
                      setSupplierSearch(e.target.value);
                      searchSuppliers(e.target.value);
                    }}
                    onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 200)}
                    className="w-full text-xs border border-blue-300 rounded px-2 py-1 bg-white focus:outline-none focus:border-blue-600"
                  />
                  {showSupplierDropdown && supplierSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                      {supplierSuggestions.map((supplier) => (
                        <div
                          key={supplier._id}
                          className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-xs"
                          onClick={() => selectSupplier(supplier)}
                        >
                          <div className="font-semibold text-gray-800">{supplier.name}</div>
                          <div className="text-gray-500">{supplier.code || supplier.mobile}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Row 3: Address */}
              <div className="flex items-start mb-2 gap-2">
                <label className="text-xs font-semibold text-blue-700 w-[80px] pt-1">Address:</label>
                <textarea
                  placeholder="Supplier Address"
                  value={formData.supplier.address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      supplier: { ...formData.supplier, address: e.target.value },
                    })
                  }
                  rows={2}
                  className="flex-1 text-xs border border-blue-300 rounded px-2 py-1 bg-white focus:outline-none focus:border-blue-600 resize-none"
                />
              </div>

              {/* Row 4: GST */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-blue-700 w-[80px]">GSTIN:</label>
                <input
                  type="text"
                  placeholder="GST Number"
                  value={formData.supplier.gstin}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      supplier: { ...formData.supplier, gstin: e.target.value.toUpperCase() },
                    })
                  }
                  className="flex-1 text-xs border border-blue-300 rounded px-2 py-1 bg-white focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>


            {/* PO No & Date */}
            <div className="flex-1 flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-700 mb-1">PO No:</label>
                <input
                  type="text"
                  placeholder="PO/2526/001"
                  value={formData.poNumber}
                  onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Date:</label>
                <input
                  type="date"
                  value={formData.poDate}
                  onChange={(e) => setFormData({ ...formData, poDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Description of Goods Heading & Add Item Button */}
          <div className="flex justify-between items-center pt-2">
            <h3 className="font-bold text-sm text-gray-800">Description of Goods</h3>
            <button
              onClick={addItemRow}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors font-medium shadow-sm flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add Item
            </button>
          </div>

          {/* Row 5: Items Table */}
          <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 border-b-2 border-gray-200">
              <div className="grid grid-cols-[2fr_0.8fr_0.8fr_0.8fr_1fr_40px] gap-2 px-3 py-2 text-xs font-semibold text-gray-700">
                <div>Product</div>
                <div className="text-center">Qty</div>
                <div className="text-center">Rate</div>
                <div className="text-center">GST %</div>
                <div className="text-right">Amount</div>
                <div></div>
              </div>
            </div>

            <div className="max-h-[200px] overflow-y-auto bg-white">
              <div className="space-y-1 p-2">
                {formData.items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-[2fr_0.8fr_0.8fr_0.8fr_1fr_40px] gap-2 items-center"
                  >
                    <input
                      type="text"
                      placeholder="Product description"
                      value={item.product}
                      onChange={(e) => handleItemChange(index, "product", e.target.value)}
                      className="px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    <input
                      type="number"
                      placeholder="0"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                      className="text-center px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    <input
                      type="number"
                      placeholder="0"
                      value={item.rate}
                      onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                      className="text-center px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    <select
                      value={item.gst}
                      onChange={(e) => handleItemChange(index, "gst", e.target.value)}
                      className="text-center px-1 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                    >
                      <option value="5">5%</option>
                      <option value="14">14%</option>
                      <option value="18">18%</option>
                    </select>
                    <div className="text-right px-2 py-1.5 text-xs bg-green-50 border border-green-200 rounded font-semibold text-green-700">
                      ₹{item.amount.toFixed(2)}
                    </div>
                    {formData.items.length > 1 && (
                      <button
                        onClick={() => removeItemRow(index)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded p-1 transition-colors"
                        title="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rows 6-8: Totals (Right Aligned) */}
          <div className="flex justify-end">
            <div className="w-80 space-y-2 pt-2">
              {/* Row 6: Total Value */}
              <div className="flex justify-between items-center text-xs border-b border-gray-200 pb-2">
                <span className="font-medium text-gray-700">Total Value:</span>
                <span className="font-semibold text-gray-900 text-sm">₹{formData.totalValue.toFixed(2)}</span>
              </div>

              {/* Row 7: Round Off */}
              <div className="flex justify-between items-center text-xs border-b border-gray-200 pb-2">
                <span className="font-medium text-gray-700">Round Off:</span>
                <input
                  type="number"
                  value={formData.roundOff}
                  onChange={(e) => handleRoundOffChange(e.target.value)}
                  className="w-32 text-right px-3 py-1 text-xs border-2 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Row 8: Grand Total */}
              <div className="flex justify-between items-center pt-2 border-t-2 border-green-600">
                <span className="font-bold text-sm text-gray-800">Grand Total:</span>
                <span className="font-bold text-xl text-green-600">₹{formData.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t-2 border-gray-200">
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold text-sm shadow-lg flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Purchase Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderForm;