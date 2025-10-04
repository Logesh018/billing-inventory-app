import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, User } from "lucide-react";
import { axiosInstance } from "../../../lib/axios";

// Buyer API with axiosInstance
const buyerApi = {
  getAll: async () => {
    const { data } = await axiosInstance.get("/buyers");
    return data;
  },
  create: async (buyerData) => {
    const { data } = await axiosInstance.post("/buyers", buyerData);
    return data;
  },
  update: async (id, buyerData) => {
    const { data } = await axiosInstance.put(`/buyers/${id}`, buyerData);
    return data;
  },
  delete: async (id) => {
    const { data } = await axiosInstance.delete(`/buyers/${id}`);
    return data;
  }
};

function BuyerForm({ onSubmit, onClose, initialValues = {} }) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    mobile: "",
    gst: "",
    email: "",
    address: "",
    company: "",
    contactPerson: "",
    alternatePhone: "",
    businessType: "",
    paymentTerms: "",
    creditLimit: 0,
    isActive: true
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setFormData({
        name: initialValues.name || "",
        code: initialValues.code || "",
        mobile: initialValues.mobile || "",
        gst: initialValues.gst || "",
        email: initialValues.email || "",
        address: initialValues.address || "",
        company: initialValues.company || "",
        contactPerson: initialValues.contactPerson || "",
        alternatePhone: initialValues.alternatePhone || "",
        businessType: initialValues.businessType || "",
        paymentTerms: initialValues.paymentTerms || "",
        creditLimit: initialValues.creditLimit || 0,
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

    if (!formData.name.trim()) {
      newErrors.name = "Buyer name is required";
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
    } else if (!/^\d{10}$/.test(formData.mobile.trim())) {
      newErrors.mobile = "Mobile number must be 10 digits";
    }

    if (formData.email && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-3">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <div className="text-center mb-3">
            <h1 className="text-xl font-bold text-gray-800">
              {initialValues._id ? "Edit Buyer" : "Create New Buyer"}
            </h1>
          </div>

          {/* Basic Information */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <div className="w-1 h-4 bg-blue-500 rounded mr-2"></div>
              Basic Information
            </h3>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Buyer Name*
                </label>
                <input
                  placeholder="Enter buyer name"
                  className={`w-full border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 ${
                    errors.name 
                      ? 'border-red-500 focus:ring-red-400' 
                      : 'border-gray-300 focus:ring-blue-400'
                  }`}
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Buyer Code
                </label>
                <input
                  placeholder="Auto-generated if empty"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                />
                <p className="text-xs text-gray-500 mt-0.5">Leave empty for auto-code</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Mobile*
                </label>
                <input
                  placeholder="10-digit number"
                  className={`w-full border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 ${
                    errors.mobile 
                      ? 'border-red-500 focus:ring-red-400' 
                      : 'border-gray-300 focus:ring-blue-400'
                  }`}
                  value={formData.mobile}
                  onChange={(e) => handleChange('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                />
                {errors.mobile && (
                  <p className="text-xs text-red-500 mt-0.5">{errors.mobile}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Alternate Phone
                </label>
                <input
                  placeholder="Alternate number"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                  value={formData.alternatePhone}
                  onChange={(e) => handleChange('alternatePhone', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <div className="w-1 h-4 bg-green-500 rounded mr-2"></div>
              Contact Details
            </h3>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  className={`w-full border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 ${
                    errors.email 
                      ? 'border-red-500 focus:ring-red-400' 
                      : 'border-gray-300 focus:ring-green-400'
                  }`}
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value.toLowerCase())}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-0.5">{errors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  GST Number
                </label>
                <input
                  placeholder="GST number"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-400"
                  value={formData.gst}
                  onChange={(e) => handleChange('gst', e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Contact Person
                </label>
                <input
                  placeholder="Contact person name"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-400"
                  value={formData.contactPerson}
                  onChange={(e) => handleChange('contactPerson', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                placeholder="Complete address"
                rows="2"
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-400"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
              />
            </div>
          </div>

          {/* Business Information */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <div className="w-1 h-4 bg-purple-500 rounded mr-2"></div>
              Business Information
            </h3>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  placeholder="Company name"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
                  value={formData.company}
                  onChange={(e) => handleChange('company', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Business Type
                </label>
                <input
                  placeholder="e.g., Retail, Wholesale"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
                  value={formData.businessType}
                  onChange={(e) => handleChange('businessType', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Payment Terms
                </label>
                <input
                  placeholder="e.g., 30 days, COD"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
                  value={formData.paymentTerms}
                  onChange={(e) => handleChange('paymentTerms', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Credit Limit (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
                  value={formData.creditLimit}
                  onChange={(e) => handleChange('creditLimit', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleChange('isActive', e.target.checked)}
                className="rounded"
              />
              <span className="font-medium">Active Buyer</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
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
              className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-1.5 text-xs font-medium disabled:opacity-50"
            >
              {loading ? "Saving..." : initialValues._id ? "Update Buyer" : "Create Buyer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DataTable({ columns, data, actions }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                style={{ width: col.width }}
              >
                {col.label}
              </th>
            ))}
            {actions && actions.length > 0 && (
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              {columns.map((col) => (
                <td key={col.key} className="px-3 py-2 whitespace-nowrap">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
              {actions && actions.length > 0 && (
                <td className="px-3 py-2 whitespace-nowrap text-center">
                  <div className="flex gap-1 justify-center">
                    {actions.map((action, idx) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => action.onClick(row)}
                          className={`p-1.5 rounded text-xs ${action.className}`}
                          title={action.label}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </button>
                      );
                    })}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Buyers() {
  const [buyers, setBuyers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editBuyer, setEditBuyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBuyers();
  }, []);

  const fetchBuyers = async () => {
    try {
      setLoading(true);
      const data = await buyerApi.getAll();
      setBuyers(Array.isArray(data) ? data : []);
      setError(null);
    } catch (error) {
      console.error("Error fetching buyers:", error);
      setError("Failed to fetch buyers");
      setBuyers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this buyer?")) {
      try {
        await buyerApi.delete(id);
        await fetchBuyers();
      } catch (error) {
        console.error("Error deleting buyer:", error);
        alert(`Failed to delete buyer: ${error.message}`);
      }
    }
  };

  const handleFormSubmit = async (data) => {
    try {
      if (editBuyer) {
        await buyerApi.update(editBuyer._id, data);
      } else {
        await buyerApi.create(data);
      }
      setShowForm(false);
      setEditBuyer(null);
      await fetchBuyers();
    } catch (error) {
      console.error("Error saving buyer:", error);
      throw error;
    }
  };

  const truncate = (str, max = 20) => {
    if (!str) return "—";
    return str.length > max ? str.substring(0, max) + "…" : str;
  };

  const filteredBuyers = filter === "all" 
    ? buyers 
    : filter === "active" 
    ? buyers.filter(b => b.isActive) 
    : buyers.filter(b => !b.isActive);

  const columns = [
    {
      key: "name",
      label: "Buyer Name",
      width: "180px",
      render: (b) => (
        <div>
          <div className="font-medium text-sm text-gray-800" title={b.name}>
            {truncate(b.name, 20)}
          </div>
          {b.company && (
            <div className="text-xs text-gray-500" title={b.company}>
              {truncate(b.company, 20)}
            </div>
          )}
        </div>
      )
    },
    {
      key: "code",
      label: "Code",
      width: "80px",
      render: (b) => (
        <span className="font-mono text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {b.code || "—"}
        </span>
      )
    },
    {
      key: "contact",
      label: "Contact",
      width: "150px",
      render: (b) => (
        <div className="text-xs">
          <div className="font-medium text-gray-800">{b.mobile}</div>
          {b.email && (
            <div className="text-gray-500" title={b.email}>
              {truncate(b.email, 20)}
            </div>
          )}
        </div>
      )
    },
    {
      key: "gst",
      label: "GST",
      width: "120px",
      render: (b) => (
        <div className="font-mono text-xs text-gray-700" title={b.gst}>
          {b.gst ? truncate(b.gst, 15) : "—"}
        </div>
      )
    },
    {
      key: "business",
      label: "Business",
      width: "120px",
      render: (b) => (
        <div className="text-xs">
          {b.businessType ? (
            <div className="text-gray-700">{truncate(b.businessType, 15)}</div>
          ) : (
            <span className="text-gray-400">—</span>
          )}
          {b.paymentTerms && (
            <div className="text-gray-500 text-xs">{truncate(b.paymentTerms, 15)}</div>
          )}
        </div>
      )
    },
    {
      key: "orders",
      label: "Orders",
      width: "80px",
      render: (b) => (
        <div className="text-center">
          <div className="font-semibold text-gray-800 text-sm">{b.totalOrders || 0}</div>
          {b.lastOrderDate && (
            <div className="text-xs text-gray-500">
              {new Date(b.lastOrderDate).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short'
              })}
            </div>
          )}
        </div>
      )
    },
    {
      key: "creditLimit",
      label: "Credit",
      width: "90px",
      render: (b) => (
        <div className="text-xs text-gray-700">
          {b.creditLimit > 0 ? `₹${b.creditLimit.toLocaleString('en-IN')}` : "—"}
        </div>
      )
    },
    {
      key: "status",
      label: "Status",
      width: "80px",
      render: (b) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          b.isActive 
            ? "bg-green-100 text-green-700" 
            : "bg-gray-100 text-gray-700"
        }`}>
          {b.isActive ? "Active" : "Inactive"}
        </span>
      )
    }
  ];

  const actions = [
    {
      label: "Edit",
      icon: Edit,
      className: "bg-blue-500 text-white hover:bg-blue-600",
      onClick: (buyer) => {
        setEditBuyer(buyer);
        setShowForm(true);
      },
    },
    {
      label: "Delete",
      icon: Trash2,
      className: "bg-red-500 text-white hover:bg-red-600",
      onClick: (buyer) => handleDelete(buyer._id),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading buyers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showForm ? (
        <BuyerForm
          onSubmit={handleFormSubmit}
          initialValues={editBuyer || {}}
          onClose={() => {
            setShowForm(false);
            setEditBuyer(null);
          }}
        />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Buyers Management</h1>
              <p className="text-gray-600 text-sm mt-1">Manage your customer database</p>
            </div>
            <button
              onClick={() => {
                setShowForm(true);
                setEditBuyer(null);
              }}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-sm text-sm"
            >
              <Plus className="w-4 h-4 mr-1" /> Create Buyer
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="border-b border-gray-200">
            <div className="flex space-x-4">
              {[
                { key: "all", label: "All Buyers", count: buyers.length },
                { key: "active", label: "Active", count: buyers.filter(b => b.isActive).length },
                { key: "inactive", label: "Inactive", count: buyers.filter(b => !b.isActive).length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`py-2 px-3 text-sm font-medium rounded-t-lg transition-colors ${
                    filter === tab.key
                      ? "bg-white text-green-600 border-t-2 border-green-500"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                  <span className="ml-1 bg-gray-100 text-gray-800 py-0.5 px-1.5 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {filteredBuyers.length > 0 ? (
            <div className="w-full">
              <DataTable
                columns={columns}
                data={filteredBuyers}
                actions={actions}
              />
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <div className="text-gray-500 text-lg mb-2">No buyers found</div>
              <div className="text-gray-400 text-sm mb-4">
                {filter === "all"
                  ? "Create your first buyer to get started"
                  : `No ${filter} buyers found`
                }
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Buyer
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}