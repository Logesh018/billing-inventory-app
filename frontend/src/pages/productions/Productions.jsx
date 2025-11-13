import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getProductions, createProduction, updateProduction, deleteProduction } from "../../api/productionApi";
import { getPurchases } from "../../api/purchaseApi";
import { getAllOrders } from "../../api/orderApi";
import DataTable from "../../components/UI/DataTable";
import ProductionForm from "./ProductionForm";
import { Plus, Edit, Trash2 } from "lucide-react";
import { showConfirm, showLoading, dismissAndSuccess, dismissAndError } from "../../utils/toast";

export default function Production() {
  const { user, hasAccess } = useAuth();
  const [productions, setProductions] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editProduction, setEditProduction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("All Production");

  const isAdmin = user?.role === "Admin" || user?.role === "SuperAdmin";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchProductions(),
          fetchPurchases(),
          fetchOrders(),
        ]);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load production data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [hasAccess]);

  const fetchProductions = async () => {
    try {
      const res = await getProductions();
      const allProductions = (Array.isArray(res.data) ? res.data : [])
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setProductions(allProductions);
      setError(null);
    } catch (err) {
      console.error("Error fetching productions", err);
      setError("Failed to fetch productions");
      setProductions([]);
    }
  };

  const fetchPurchases = async () => {
    try {
      const res = await getPurchases();
      setPurchases(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching purchases", err);
      setPurchases([]);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await getAllOrders();
      setOrders(Array.isArray(res.orders) ? res.orders : res);
    } catch (err) {
      console.error("Error fetching orders", err);
      setOrders([]);
    }
  };

  const handleDelete = async (id) => {
    showConfirm(
      "Are you sure you want to delete this production record? This action cannot be undone.",
      async () => {
        const toastId = showLoading("Deleting production...");
        try {
          await deleteProduction(id);
          await fetchProductions();
          dismissAndSuccess(toastId, "Production deleted successfully!");
        } catch (err) {
          console.error("Error deleting production", err);
          dismissAndError(toastId, `Failed to delete: ${err.response?.data?.message || err.message}`);
        }
      }
    );
  };

  const handleFormSubmit = async (data) => {
    const toastId = showLoading(editProduction ? "Updating production..." : "Creating production...");
    try {
      if (editProduction) {
        await updateProduction(editProduction._id, data);
      } else {
        await createProduction(data);
      }
      setShowForm(false);
      setEditProduction(null);
      await fetchProductions();
      dismissAndSuccess(toastId, editProduction ? "Production updated successfully!" : "Production created successfully!");
    } catch (err) {
      console.error("Error saving production", err);
      dismissAndError(toastId, `Failed to save: ${err.response?.data?.message || err.message}`);
    }
  };

  const tabs = [
    { key: "All Production", label: "All Production", count: productions.length },
    { key: "Cutting", label: "Cutting", count: productions.filter(p => p.status === "Cutting").length },
    { key: "Stitching", label: "Stitching", count: productions.filter(p => p.status === "Stitching").length },
    { key: "Trimming", label: "Trimming", count: productions.filter(p => p.status === "Trimming").length },
    { key: "QC", label: "QC", count: productions.filter(p => p.status === "QC").length },
    { key: "Ironing", label: "Ironing", count: productions.filter(p => p.status === "Ironing").length },
    { key: "Packing", label: "Packing", count: productions.filter(p => p.status === "Packing").length },
    { key: "Production Completed", label: "Completed", count: productions.filter(p => p.status === "Production Completed").length },
  ];

  const filteredData = activeTab === "All Production"
    ? productions
    : productions.filter(p => p.status === activeTab);

  const truncate = (str, max = 10) => {
    if (!str) return "—";
    return str.length > max ? str.substring(0, max) + "…" : str;
  };

  const columns = [
    {
      key: "orderDate",
      label: "Date",
      width: "5%",
      render: (p) => (
        <div className="text-[10px] leading-tight">
          {p.orderDate ? new Date(p.orderDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
          }) : "—"}
        </div>
      )
    },
    {
      key: "PoNo",
      label: "PO No",
      width: "8%",
      render: (p) => (
        <div className="font-medium text-[10px] leading-tight break-words">
          {p.PoNo || "—"}
        </div>
      )
    },
    {
      key: "buyerCode",
      label: "Buyer",
      width: "5%",
      render: (p) => (
        <div className="text-[10px] leading-tight break-words">
          {p.buyerCode || "—"}
        </div>
      )
    },
    {
      key: "orderType",
      label: "Type",
      width: "4%",
      render: (o) => (
        <span className={`px-1 py-0.5 rounded text-[8px] font-medium inline-block ${o.orderType === "JOB-Works"
          ? "bg-purple-100 text-purple-700"
          : o.orderType === "Own-Orders"
            ? "bg-teal-100 text-teal-700"
            : "bg-blue-100 text-blue-700"
          }`}>
          {o.orderType === "JOB-Works" ? "JOB" : o.orderType === "Own-Orders" ? "OWN" : "FOB"}
        </span>
      )
    },
    {
      key: "status",
      label: "Status",
      width: "5%",
      render: (p) => {
        const status = p.status === "Pending Production" ? "Pending" : p.status || "Pending";
        const styles = {
          "Pending": "bg-red-500 text-white",
          "Factory Received": "bg-blue-500 text-white",
          "Cutting": "bg-blue-500 text-white",
          "Stitching": "bg-yellow-500 text-white",
          "Trimming": "bg-yellow-600 text-white",
          "QC": "bg-orange-500 text-white",
          "Ironing": "bg-purple-500 text-white",
          "Packing": "bg-indigo-500 text-white",
          "Production Completed": "bg-green-500 text-white",
        };
        return (
          <span className={`px-1 py-0.5 rounded text-[9px] font-medium inline-block ${styles[status] || "bg-gray-100 text-gray-700"}`}>
            {status}
          </span>
        );
      }
    },
    {
      key: "products",
      label: "Products",
      width: "14%",
      render: (p) => {
        if (!p.products || p.products.length === 0) {
          return <span className="text-gray-400 text-[10px]">—</span>;
        }
        const productNames = p.products.map(prod => prod.productName);

        return (
          <div className="space-y-1">
            {productNames.map((name, idx) => (
              <div
                key={idx}
                className="px-1 py-1 border border-gray-300 rounded text-[9px] leading-tight break-words"
              >
                <div className="font-medium text-gray-800">{truncate(name, 200)}</div>
              </div>
            ))}
          </div>
        );
      }
    },
    {
      key: "fabricType",
      label: "Fabric",
      width: "8%",
      render: (p) => {
        if (p.receivedFabric) {
          return (
            <div className="space-y-1">
              <div className="px-1 py-1 border border-gray-300 rounded text-[9px] leading-tight break-words">
                {truncate(p.receivedFabric, 15)}
              </div>
            </div>
          );
        }

        if (!p.products || p.products.length === 0) {
          return <span className="text-gray-400 text-[10px]">—</span>;
        }

        const types = [...new Set(p.products.map(prod => prod.fabricType).filter(Boolean))];

        return (
          <div className="space-y-1">
            {types.map((type, idx) => (
              <div
                key={idx}
                className="px-1 py-1 border border-gray-300 rounded text-[9px] leading-tight break-words"
              >
                {truncate(type, 15)}
              </div>
            ))}
          </div>
        );
      }
    },
    {
      key: "style",
      label: "Style",
      width: "10%",
      render: (p) => {
        if (!p.products || p.products.length === 0) {
          return <span className="text-gray-400 text-[9px]">—</span>;
        }

        return (
          <div className="space-y-1">
            {p.products.map((prod, i) => (
              <div
                key={i}
                className="px-1 py-1 border border-gray-300 rounded text-[9px] leading-tight break-words"
              >
                {prod.productDetails?.style || "—"}
              </div>
            ))}
          </div>
        );
      }
    },
    {
      key: "color",
      label: "Color",
      width: "7%",
      render: (p) => {
        if (!p.products || p.products.length === 0) {
          return <span className="text-gray-400 text-[9px]">—</span>;
        }

        const colorData = {};
        p.products.forEach(product => {
          if (product.colors && Array.isArray(product.colors)) {
            product.colors.forEach(colorEntry => {
              if (!colorData[colorEntry.color]) colorData[colorEntry.color] = {};
              colorEntry.sizes?.forEach(s => {
                if (!colorData[colorEntry.color][s.size]) colorData[colorEntry.color][s.size] = 0;
                colorData[colorEntry.color][s.size] += s.quantity || 0;
              });
            });
          }
        });

        const colors = Object.keys(colorData);

        return (
          <div className="space-y-1">
            {colors.map((color, idx) => (
              <div
                key={idx}
                className="px-1 py-1 border border-gray-300 rounded text-[9px] leading-tight break-words font-medium"
              >
                {color}
              </div>
            ))}
          </div>
        );
      }
    },
    {
      key: "sizeQtyByColor",
      label: "Size & Qty",
      width: "16%",
      render: (p) => {
        if (!p.products || p.products.length === 0) {
          return <span className="text-gray-400 text-[8px]">—</span>;
        }

        const colorData = {};
        p.products.forEach(product => {
          if (product.colors && Array.isArray(product.colors)) {
            product.colors.forEach(colorEntry => {
              if (!colorData[colorEntry.color]) colorData[colorEntry.color] = {};
              colorEntry.sizes?.forEach(s => {
                if (!colorData[colorEntry.color][s.size]) colorData[colorEntry.color][s.size] = 0;
                colorData[colorEntry.color][s.size] += s.quantity || 0;
              });
            });
          }
        });

        const colors = Object.keys(colorData);

        return (
          <div className="space-y-1">
            {colors.map((color, idx) => {
              const sizeQtyStr = Object.entries(colorData[color])
                .sort(([a], [b]) => {
                  const order = { XS: 0, S: 1, M: 2, L: 3, XL: 4, XXL: 5 };
                  return (order[a] || 999) - (order[b] || 999);
                })
                .map(([size, qty]) => `${size}:${qty}`)
                .join(", ");

              return (
                <div
                  key={idx}
                  className="py-1 border border-gray-300 rounded text-gray-600 font-mono font-semibold text-[9px] leading-tight break-words"
                >
                  {sizeQtyStr}
                </div>
              );
            })}
          </div>
        );
      }
    },
    {
      key: "totalQty",
      label: "Total",
      width: "4%",
      render: (p) => (
        <span className="font-semibold text-blue-600 text-[10px]">
          {p.totalQty || 0}
        </span>
      )
    }
  ];

  const actions = isAdmin
    ? [
        {
          label: "Edit",
          icon: Edit,
          className: "bg-blue-500 text-white hover:bg-blue-600",
          onClick: (production) => {
            setEditProduction(production);
            setShowForm(true);
          },
        },
        {
          label: "Delete",
          icon: Trash2,
          className: "bg-red-500 text-white hover:bg-red-600",
          onClick: (production) => handleDelete(production._id),
        },
      ]
    : [];

  const productionFields = [
    { name: "orderId", label: "Order", type: "text", required: true },
    {
      name: "status", label: "Status", type: "select", options: [
        "Pending",
        "Factory Received",
        "Cutting",
        "Stitching",
        "Trimming",
        "QC",
        "Ironing",
        "Packing",
        "Production Completed"
      ]
    },
    { name: "factoryReceivedDate", label: "Factory Received Date", type: "date" },
    { name: "dcNumber", label: "DC Number", type: "text" },
    { name: "dcMtr", label: "DC MTR", type: "number" },
    { name: "tagMtr", label: "Tag MTR", type: "number" },
    { name: "cuttingMtr", label: "Cutting MTR", type: "number" },
    { name: "expectedQty", label: "Expected Quantity", type: "number" },
    { name: "remarks", label: "Remarks", type: "textarea" },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading productions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showForm ? (
        <ProductionForm
          fields={productionFields}
          initialValues={editProduction || {
            orderId: "",
            status: "Pending",
            factoryReceivedDate: "",
            dcNumber: "",
            dcMtr: 0,
            tagMtr: 0,
            cuttingMtr: 0,
            expectedQty: 0,
            remarks: "",
          }}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditProduction(null);
          }}
          submitLabel={editProduction ? "Update Production" : "Create Production"}
          returnTo="/production"
          orders={orders}
          purchases={purchases}
        />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Production Management</h1>
              <p className="text-gray-600 text-sm mt-1">
                Track and manage production stages from cutting to packing
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => {
                  setShowForm(true);
                  setEditProduction(null);
                }}
                className="flex items-center bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" /> New Production
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="border-b border-gray-200">
            <div className="flex space-x-4">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-2 px-3 text-sm font-medium rounded-t-lg transition-colors ${activeTab === tab.key
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

          {filteredData.length > 0 ? (
            <div className="w-full overflow-x-hidden">
              <DataTable
                columns={columns}
                data={filteredData}
                actions={actions}
              />
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-gray-500 text-lg mb-2">No productions found</div>
              <div className="text-gray-400 text-sm mb-4">
                {activeTab === "All Production"
                  ? "Create your first production entry to get started"
                  : `No productions with status "${activeTab}" found`
                }
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Production
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}