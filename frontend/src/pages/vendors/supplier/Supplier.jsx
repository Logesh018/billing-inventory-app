import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import { axiosInstance } from "../../../lib/axios";
import SupplierForm from "./SupplierForm";

// Supplier API with axiosInstance
const supplierApi = {
  getAll: async () => {
    const { data } = await axiosInstance.get("/suppliers");
    return data;
  },
  create: async (supplierData) => {
    const { data } = await axiosInstance.post("/suppliers", supplierData);
    return data;
  },
  update: async (id, supplierData) => {
    const { data } = await axiosInstance.put(`/suppliers/${id}`, supplierData);
    return data;
  },
  delete: async (id) => {
    const { data } = await axiosInstance.delete(`/suppliers/${id}`);
    return data;
  }
};

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

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const data = await supplierApi.getAll();
      setSuppliers(Array.isArray(data) ? data : []);
      setError(null);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      setError("Failed to fetch suppliers");
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      try {
        await supplierApi.delete(id);
        await fetchSuppliers();
      } catch (error) {
        console.error("Error deleting supplier:", error);
        alert(`Failed to delete supplier: ${error.message}`);
      }
    }
  };

  const handleFormSubmit = async (data) => {
    try {
      if (editSupplier) {
        await supplierApi.update(editSupplier._id, data);
      } else {
        await supplierApi.create(data);
      }
      setShowForm(false);
      setEditSupplier(null);
      await fetchSuppliers();
    } catch (error) {
      console.error("Error saving supplier:", error);
      throw error;
    }
  };

  const truncate = (str, max = 20) => {
    if (!str) return "—";
    return str.length > max ? str.substring(0, max) + "…" : str;
  };

  const filteredSuppliers = filter === "all"
    ? suppliers
    : filter === "active"
      ? suppliers.filter(s => s.isActive)
      : suppliers.filter(s => !s.isActive);

  const columns = [
    {
      key: "serialNo",
      label: "S.No",
      width: "20px",
      render: (s) => (
        <span className="font-mono text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {s.serialNo || "—"}
        </span>
      ),
    },
    {
      key: "name",
      label: "Supplier Name",
      width: "180px",
      render: (s) => (
        <div>
          <div className="font-medium text-sm text-gray-800" title={s.name}>
            {truncate(s.name, 20)}
          </div>
          {s.company && (
            <div className="text-xs text-gray-500" title={s.company}>
              {truncate(s.company, 20)}
            </div>
          )}
        </div>
      )
    },
    {
      key: "code",
      label: "Code",
      width: "80px",
      render: (s) => (
        <span className="font-mono text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {s.code || "—"}
        </span>
      )
    },
    {
      key: "contact",
      label: "Contact",
      width: "150px",
      render: (s) => (
        <div className="text-xs">
          <div className="font-medium text-gray-800">{s.mobile}</div>
          {s.email && (
            <div className="text-gray-500" title={s.email}>
              {truncate(s.email, 20)}
            </div>
          )}
        </div>
      )
    },
    {
      key: "gst",
      label: "GST",
      width: "120px",
      render: (s) => (
        <div className="font-mono text-xs text-gray-700" title={s.gst}>
          {s.gst ? truncate(s.gst, 25) : "—"}
        </div>
      )
    },
    {
      key: "location",
      label: "Location",
      width: "120px",
      render: (s) => (
        <div className="text-xs text-gray-700">
          {s.city && s.state ? `${s.city}, ${s.state}` : s.city || s.state || "—"}
        </div>
      )
    },
    {
      key: "vendorGoods",
      label: "Vendor Goods",
      width: "140px",
      render: (s) => (
        <div className="text-xs text-gray-800">
          {s.vendorGoods?.category === "Accessories"
            ? `${s.vendorGoods.category} - ${s.vendorGoods.accessoryName || ""}`
            : s.vendorGoods?.category || "—"}
        </div>
      )
    },
    {
      key: "purchases",
      label: "Purchases",
      width: "80px",
      render: (s) => (
        <div className="text-center">
          <div className="font-semibold text-gray-800 text-sm">{s.totalPurchases || 0}</div>
          {s.lastPurchaseDate && (
            <div className="text-xs text-gray-500">
              {new Date(s.lastPurchaseDate).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short'
              })}
            </div>
          )}
        </div>
      )
    },
    {
      key: "status",
      label: "Status",
      width: "80px",
      render: (s) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${s.isActive
          ? "bg-green-100 text-green-700"
          : "bg-gray-100 text-gray-700"
          }`}>
          {s.isActive ? "Active" : "Inactive"}
        </span>
      )
    }
  ];

  const actions = [
    {
      label: "Edit",
      icon: Edit,
      className: "bg-blue-500 text-white hover:bg-blue-600",
      onClick: (supplier) => {
        setEditSupplier(supplier);
        setShowForm(true);
      },
    },
    {
      label: "Delete",
      icon: Trash2,
      className: "bg-red-500 text-white hover:bg-red-600",
      onClick: (supplier) => handleDelete(supplier._id),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading suppliers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showForm ? (
        <SupplierForm
          onSubmit={handleFormSubmit}
          initialValues={editSupplier || {}}
          onClose={() => {
            setShowForm(false);
            setEditSupplier(null);
          }}
        />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Suppliers Management</h1>
              <p className="text-gray-600 text-sm mt-1">Manage your supplier database</p>
            </div>
            <button
              onClick={() => {
                setShowForm(true);
                setEditSupplier(null);
              }}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-sm text-sm"
            >
              <Plus className="w-4 h-4 mr-1" /> Create Supplier
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
                { key: "all", label: "All Suppliers", count: suppliers.length },
                { key: "active", label: "Active", count: suppliers.filter(s => s.isActive).length },
                { key: "inactive", label: "Inactive", count: suppliers.filter(s => !s.isActive).length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`py-2 px-3 text-sm font-medium rounded-t-lg transition-colors ${filter === tab.key
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

          {filteredSuppliers.length > 0 ? (
            <div className="w-full">
              <DataTable
                columns={columns}
                data={filteredSuppliers}
                actions={actions}
              />
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <div className="text-gray-500 text-lg mb-2">No suppliers found</div>
              <div className="text-gray-400 text-sm mb-4">
                {filter === "all"
                  ? "Create your first supplier to get started"
                  : `No ${filter} suppliers found`
                }
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Supplier
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}