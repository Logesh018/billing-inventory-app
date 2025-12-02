import { useEffect, useState } from "react";

export default function BuyerForm({ onSubmit, onClose, initialValues = {} }) {
  const [formData, setFormData] = useState({
    // Basic Information
    name: "",
    code: "",
    company: "",
    companyType: "",
    industryType: "",
    industrySector: "",
    gst: "",
    
    // Contact Information
    mobile: "",
    alternateMobile: "",
    landline: "",
    email: "",
    alternateEmail: "",
    website: "",
    
    // Address Details
    pincode: "",
    city: "",
    state: "",
    country: "India",
    doorNoStreet: "",
    
    // Point of Contact
    pocName: "",
    pocEmail: "",
    pocContactEmail: "",
    pocDesignation: "",
    
    // Business Details
    paymentType: "",
    creditLimit: 0,
    
    // Others
    remarks: "",
    isActive: true
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setFormData({
        name: initialValues.name || "",
        code: initialValues.code || "",
        company: initialValues.company || "",
        companyType: initialValues.companyType || "",
        industryType: initialValues.industryType || "",
        industrySector: initialValues.industrySector || "",
        gst: initialValues.gst || "",
        mobile: initialValues.mobile || "",
        alternateMobile: initialValues.alternateMobile || "",
        landline: initialValues.landline || "",
        email: initialValues.email || "",
        alternateEmail: initialValues.alternateEmail || "",
        website: initialValues.website || "",
        pincode: initialValues.pincode || "",
        city: initialValues.city || "",
        state: initialValues.state || "",
        country: initialValues.country || "India",
        doorNoStreet: initialValues.doorNoStreet || "",
        pocName: initialValues.pocName || "",
        pocEmail: initialValues.pocEmail || "",
        pocContactEmail: initialValues.pocContactEmail || "",
        pocDesignation: initialValues.pocDesignation || "",
        paymentType: initialValues.paymentType || "",
        creditLimit: initialValues.creditLimit || 0,
        remarks: initialValues.remarks || "",
        isActive: initialValues.isActive !== undefined ? initialValues.isActive : true
      });
    }
  }, [initialValues]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = "Buyer name is required";
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
    } else if (!/^\d{10}$/.test(formData.mobile.trim())) {
      newErrors.mobile = "Mobile number must be 10 digits";
    }

    // Email validations
    if (formData.email && !/^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (formData.alternateEmail && !/^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(formData.alternateEmail)) {
      newErrors.alternateEmail = "Invalid email format";
    }

    if (formData.pocEmail && !/^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(formData.pocEmail)) {
      newErrors.pocEmail = "Invalid email format";
    }

    if (formData.pocContactEmail && !/^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(formData.pocContactEmail)) {
      newErrors.pocContactEmail = "Invalid email format";
    }

    // Pincode validation
    if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = "Pincode must be 6 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Error submitting buyer:", error);
      alert(`Failed to save buyer: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              {initialValues._id ? "Edit Buyer" : "Create New Buyer"}
            </h1>
          </div>

          <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
            {/* Basic Information */}
            <div>
              <h3 className="text-base font-semibold text-gray-700 mb-3 flex items-center">
                <div className="w-1 h-5 bg-blue-500 rounded mr-2"></div>
                Basic Information
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buyer Name*
                  </label>
                  <input
                    placeholder="Enter buyer name"
                    className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                      errors.name
                        ? 'border-red-500 focus:ring-red-400'
                        : 'border-gray-300 focus:ring-blue-400'
                    }`}
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buyer Code
                  </label>
                  <input
                    placeholder="Auto-generated if empty"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={formData.code}
                    onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for auto-code</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    placeholder="Company name"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={formData.company}
                    onChange={(e) => handleChange('company', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Type
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={formData.companyType}
                    onChange={(e) => handleChange('companyType', e.target.value)}
                  >
                    <option value="">Select type</option>
                    <option value="Proprietorship">Proprietorship</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Private Limited">Private Limited</option>
                    <option value="Public Limited">Public Limited</option>
                    <option value="LLP">LLP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry Type
                  </label>
                  <input
                    placeholder="e.g., Textile, Retail"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={formData.industryType}
                    onChange={(e) => handleChange('industryType', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry Sector
                  </label>
                  <input
                    placeholder="e.g., Fashion, Apparel"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={formData.industrySector}
                    onChange={(e) => handleChange('industrySector', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GSTIN
                  </label>
                  <input
                    placeholder="GST number"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={formData.gst}
                    onChange={(e) => handleChange('gst', e.target.value.toUpperCase())}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-base font-semibold text-gray-700 mb-3 flex items-center">
                <div className="w-1 h-5 bg-green-500 rounded mr-2"></div>
                Contact Information
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number*
                  </label>
                  <input
                    placeholder="10-digit number"
                    className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                      errors.mobile
                        ? 'border-red-500 focus:ring-red-400'
                        : 'border-gray-300 focus:ring-green-400'
                    }`}
                    value={formData.mobile}
                    onChange={(e) => handleChange('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  />
                  {errors.mobile && (
                    <p className="text-xs text-red-500 mt-1">{errors.mobile}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alternate Mobile No
                  </label>
                  <input
                    placeholder="10-digit number"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    value={formData.alternateMobile}
                    onChange={(e) => handleChange('alternateMobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Landline No
                  </label>
                  <input
                    placeholder="Landline number"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    value={formData.landline}
                    onChange={(e) => handleChange('landline', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email ID
                  </label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                      errors.email
                        ? 'border-red-500 focus:ring-red-400'
                        : 'border-gray-300 focus:ring-green-400'
                    }`}
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value.toLowerCase())}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alternate Email
                  </label>
                  <input
                    type="email"
                    placeholder="alternate@example.com"
                    className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                      errors.alternateEmail
                        ? 'border-red-500 focus:ring-red-400'
                        : 'border-gray-300 focus:ring-green-400'
                    }`}
                    value={formData.alternateEmail}
                    onChange={(e) => handleChange('alternateEmail', e.target.value.toLowerCase())}
                  />
                  {errors.alternateEmail && (
                    <p className="text-xs text-red-500 mt-1">{errors.alternateEmail}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    placeholder="www.example.com"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    value={formData.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Address Details */}
            <div>
              <h3 className="text-base font-semibold text-gray-700 mb-3 flex items-center">
                <div className="w-1 h-5 bg-purple-500 rounded mr-2"></div>
                Address Details
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Door No & Street Name
                  </label>
                  <input
                    placeholder="Enter door number and street"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={formData.doorNoStreet}
                    onChange={(e) => handleChange('doorNoStreet', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    placeholder="City"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    placeholder="State"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pincode
                  </label>
                  <input
                    placeholder="6-digit pincode"
                    className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                      errors.pincode
                        ? 'border-red-500 focus:ring-red-400'
                        : 'border-gray-300 focus:ring-purple-400'
                    }`}
                    value={formData.pincode}
                    onChange={(e) => handleChange('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                  {errors.pincode && (
                    <p className="text-xs text-red-500 mt-1">{errors.pincode}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    placeholder="Country"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={formData.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Point of Contact */}
            <div>
              <h3 className="text-base font-semibold text-gray-700 mb-3 flex items-center">
                <div className="w-1 h-5 bg-orange-500 rounded mr-2"></div>
                Point of Contact
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    placeholder="Contact person name"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    value={formData.pocName}
                    onChange={(e) => handleChange('pocName', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Designation
                  </label>
                  <input
                    placeholder="Designation"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    value={formData.pocDesignation}
                    onChange={(e) => handleChange('pocDesignation', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="poc@example.com"
                    className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                      errors.pocEmail
                        ? 'border-red-500 focus:ring-red-400'
                        : 'border-gray-300 focus:ring-orange-400'
                    }`}
                    value={formData.pocEmail}
                    onChange={(e) => handleChange('pocEmail', e.target.value.toLowerCase())}
                  />
                  {errors.pocEmail && (
                    <p className="text-xs text-red-500 mt-1">{errors.pocEmail}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    placeholder="contact@example.com"
                    className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                      errors.pocContactEmail
                        ? 'border-red-500 focus:ring-red-400'
                        : 'border-gray-300 focus:ring-orange-400'
                    }`}
                    value={formData.pocContactEmail}
                    onChange={(e) => handleChange('pocContactEmail', e.target.value.toLowerCase())}
                  />
                  {errors.pocContactEmail && (
                    <p className="text-xs text-red-500 mt-1">{errors.pocContactEmail}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Business Details */}
            <div>
              <h3 className="text-base font-semibold text-gray-700 mb-3 flex items-center">
                <div className="w-1 h-5 bg-indigo-500 rounded mr-2"></div>
                Business Details
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Type
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    value={formData.paymentType}
                    onChange={(e) => handleChange('paymentType', e.target.value)}
                  >
                    <option value="">Select payment type</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit">Credit</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Credit Limit (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    value={formData.creditLimit}
                    onChange={(e) => handleChange('creditLimit', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            {/* Others */}
            <div>
              <h3 className="text-base font-semibold text-gray-700 mb-3 flex items-center">
                <div className="w-1 h-5 bg-gray-500 rounded mr-2"></div>
                Others
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks
                  </label>
                  <textarea
                    placeholder="Additional notes or remarks"
                    rows="3"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                    value={formData.remarks}
                    onChange={(e) => handleChange('remarks', e.target.value)}
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => handleChange('isActive', e.target.checked)}
                      className="rounded w-4 h-4"
                    />
                    <span className="font-medium">Active Buyer</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="bg-gray-500 hover:bg-gray-600 text-white rounded-lg px-6 py-2 text-sm font-medium disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2 text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {loading ? "Saving..." : initialValues._id ? "Update Buyer" : "Create Buyer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}