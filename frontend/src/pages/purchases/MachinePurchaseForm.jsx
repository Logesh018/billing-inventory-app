import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import { axiosInstance } from '../../lib/axios';

const MachinePurchaseForm = ({ onSubmit, onCancel, initialValues = null, isEditMode = false }) => {
  const [formData, setFormData] = useState({
    machineName: '',
    vendor: '',
    vendorCode: '',
    vendorId: '',
    cost: '',
    gstPercentage: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  const [supplierSuggestions, setSupplierSuggestions] = useState([]);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [totalWithGst, setTotalWithGst] = useState(0);

  useEffect(() => {
    if (initialValues) {
      const machine = initialValues.machinesPurchases?.[0] || initialValues;
      setFormData({
        machineName: machine.machineName || '',
        vendor: machine.vendor || '',
        vendorCode: machine.vendorCode || '',
        vendorId: machine.vendorId || '',
        cost: machine.cost || '',
        gstPercentage: machine.gstPercentage || '',
        purchaseDate: machine.purchaseDate 
          ? new Date(machine.purchaseDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        remarks: machine.remarks || ''
      });
    }
  }, [initialValues]);

  useEffect(() => {
    const cost = parseFloat(formData.cost) || 0;
    const gst = parseFloat(formData.gstPercentage) || 0;
    const gstAmount = cost * (gst / 100);
    setTotalWithGst(cost + gstAmount);
  }, [formData.cost, formData.gstPercentage]);

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
    setFormData(prev => ({
      ...prev,
      vendor: supplier.name,
      vendorId: supplier._id,
      vendorCode: supplier.code || ''
    }));
    setShowSupplierDropdown(false);
    setSupplierSuggestions([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.machineName || !formData.vendor || !formData.cost) {
      alert('Please fill in Machine Name, Vendor, and Cost');
      return;
    }

    const submitData = {
      machinesPurchases: [{
        machineName: formData.machineName,
        vendor: formData.vendor,
        vendorCode: formData.vendorCode || null,
        vendorId: formData.vendorId || null,
        cost: parseFloat(formData.cost),
        gstPercentage: parseFloat(formData.gstPercentage) || 0,
        purchaseDate: formData.purchaseDate,
        remarks: formData.remarks || ''
      }],
      purchaseDate: formData.purchaseDate,
      remarks: formData.remarks || `Machine purchase: ${formData.machineName}`
    };

    onSubmit(submitData);
  };

  const handleNumberFocus = (e) => {
    if (e.target.value === '0') {
      e.target.value = '';
    }
  };

  return (
    <div className="w-full mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-600">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {isEditMode ? 'Edit Machine Purchase' : 'New Machine Purchase'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {isEditMode ? 'Update machine purchase details' : 'Add a new machine to inventory'}
            </p>
          </div>
          {/* ✅ ADDITION: A close button in the header for better UX */}
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close form"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Machine Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.machineName}
                onChange={(e) => setFormData({ ...formData, machineName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter machine name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Purchase Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Vendor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) => {
                  setFormData({ ...formData, vendor: e.target.value });
                  searchSuppliers(e.target.value);
                }}
                onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 200)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search vendor"
                required
              />
              {showSupplierDropdown && supplierSuggestions.length > 0 && (
                <div className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
                  {supplierSuggestions.map((supplier, index) => (
                    <div
                      key={supplier._id || index}
                      className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                      onClick={() => selectSupplier(supplier)}
                    >
                      <div className="font-medium text-gray-700 dark:text-gray-200">{supplier.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {supplier.mobile || supplier.code}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Vendor Code
              </label>
              <input
                type="text"
                value={formData.vendorCode}
                onChange={(e) => setFormData({ ...formData, vendorCode: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Vendor code"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cost (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.cost}
                onFocus={handleNumberFocus}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                onWheel={(e) => e.target.blur()}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter cost"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                GST/Tax (%)
              </label>
              <select
                value={formData.gstPercentage}
                onChange={(e) => setFormData({ ...formData, gstPercentage: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">No GST</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="14">14%</option>
                <option value="18">18%</option>
                <option value="28">28%</option>
              </select>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 dark:bg-opacity-30 rounded-lg p-4 mt-6">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Base Cost</div>
                <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  ₹{parseFloat(formData.cost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
              {formData.gstPercentage && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">GST Amount</div>
                  <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    ₹{((parseFloat(formData.cost || 0) * parseFloat(formData.gstPercentage)) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Total Amount</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ₹{totalWithGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Remarks
            </label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes..."
              rows="3"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-600">
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              <X className="w-4 h-4 mr-1.5" />
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm"
            >
              <Save className="w-4 h-4 mr-1.5" />
              {isEditMode ? 'Update Machine' : 'Save Machine Purchase'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MachinePurchaseForm;

