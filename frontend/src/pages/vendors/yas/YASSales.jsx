import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, User } from "lucide-react";
import { axiosInstance } from "../../../lib/axios";
import YASSalesForm from "./YASSalesForm";

// YAS Sales API
const yasSalesApi = {
  getAll: async () => {
    const { data } = await axiosInstance.get("/buyers?category=YAS");
    return data;
  },
  create: async (buyerData) => {
    const { data } = await axiosInstance.post("/buyers", {
      ...buyerData,
      buyerCategory: "YAS"
    });
    return data;
  },
  update: async (id, buyerData) => {
    const { data } = await axiosInstance.put(`/buyers/${id}`, {
      ...buyerData,
      buyerCategory: "YAS"
    });
    return data;
  },
  delete: async (id) => {
    const { data } = await axiosInstance.delete(`/buyers/${id}`);
    return data;
  },
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
            <tr key={row._id || index} className="hover:bg-gray-50">
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

export default function YASSales() {
  const [yasBuyers, setYasBuyers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editBuyer, setEditBuyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchYASSales();
  }, []);

  const fetchYASSales = async () => {
    try {
      setLoading(true);
      const data = await yasSalesApi.getAll();
      setYasBuyers(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error("Error fetching YAS sales:", err);
      setError("Failed to fetch YAS sales buyers");
      setYasBuyers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this YAS buyer?")) return;

    try {
      await yasSalesApi.delete(id);
      await fetchYASSales();
    } catch (err) {
      console.error("Error deleting YAS buyer:", err);
      alert(`Failed to delete YAS buyer: ${err.message || err}`);
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editBuyer) {
        await yasSalesApi.update(editBuyer._id, formData);
      } else {
        await yasSalesApi.create(formData);
      }
      setShowForm(false);
      setEditBuyer(null);
      await fetchYASSales();
    } catch (err) {
      console.error("Error saving YAS buyer:", err);
      throw err;
    }
  };

  const truncate = (str, max = 20) => {
    if (!str) return "—";
    return str.length > max ? str.substring(0, max) + "…" : str;
  };

  const filteredBuyers = yasBuyers.filter((b) => {
    if (filter === "active") return b.isActive;
    if (filter === "inactive") return !b.isActive;
    if (filter !== "all") return b.yasBuyerType === filter;
    return true;
  });

  const columns = [
    {
      key: "name",
      label: "Buyer Name",
      width: "160px",
      render: (b) => (
        <div>
          <div className="font-medium text-sm text-gray-800" title={b.name}>
            {truncate(b.name, 18)}
          </div>
          {b.company && (
            <div className="text-xs text-gray-500" title={b.company}>
              {truncate(b.company, 18)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "code",
      label: "Code",
      width: "80px",
      render: (b) => (
        <span className="font-mono text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
          {b.code || "—"}
        </span>
      ),
    },
    {
      key: "yasBuyerType",
      label: "Buyer Type",
      width: "130px",
      render: (b) => (
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
          {b.yasBuyerType || "—"}
        </span>
      ),
    },
    {
      key: "contact",
      label: "Contact",
      width: "140px",
      render: (b) => (
        <div className="text-xs">
          <div className="font-medium text-gray-800">{b.mobile || "—"}</div>
          {b.email && (
            <div className="text-gray-500" title={b.email}>
              {truncate(b.email, 18)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "location",
      label: "Location",
      width: "120px",
      render: (b) => (
        <div className="text-xs text-gray-700">
          {b.city && b.state ? `${b.city}, ${b.state}` : b.city || b.state || "—"}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      width: "80px",
      render: (b) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            b.isActive
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {b.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
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

  const buyerTypeStats = {
    all: yasBuyers.length,
    active: yasBuyers.filter(b => b.isActive).length,
    inactive: yasBuyers.filter(b => !b.isActive).length,
    Distributors: yasBuyers.filter(b => b.yasBuyerType === "Distributors").length,
    Agents: yasBuyers.filter(b => b.yasBuyerType === "Agents").length,
    "Direct Retailer": yasBuyers.filter(b => b.yasBuyerType === "Direct Retailer").length,
    "Yas Shop": yasBuyers.filter(b => b.yasBuyerType === "Yas Shop").length,
    "Yas Online Store": yasBuyers.filter(b => b.yasBuyerType === "Yas Online Store").length,
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading YAS sales buyers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showForm ? (
        <YASSalesForm
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowForm(false);
            setEditBuyer(null);
          }}
          initialValues={editBuyer || {}}
        />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                YAS Sales Management
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Manage YAS store buyers and distributors
              </p>
            </div>
            <button
              onClick={() => {
                setEditBuyer(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm text-sm font-medium"
            >
              <Plus className="w-5 h-5" />
              Create YAS Buyer
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="border-b border-gray-200">
            <div className="flex space-x-4 overflow-x-auto">
              {[
                { key: "all", label: "All Buyers", count: buyerTypeStats.all },
                { key: "active", label: "Active", count: buyerTypeStats.active },
                { key: "inactive", label: "Inactive", count: buyerTypeStats.inactive },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`py-2 px-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    filter === tab.key
                      ? "border-purple-500 text-purple-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}{" "}
                  <span className="ml-2 bg-gray-200 text-gray-700 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {filteredBuyers.length > 0 ? (
            <DataTable columns={columns} data={filteredBuyers} actions={actions} />
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-medium mb-2">
                No YAS buyers found
              </p>
              <p className="text-gray-500 mb-6">
                {filter === "all"
                  ? "Get started by creating your first YAS buyer"
                  : `No ${filter} YAS buyers at the moment`}
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-5 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Create First YAS Buyer
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}