import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getProductions, createProduction, updateProduction, deleteProduction } from "../api/productionApi";
import { getPurchases } from "../api/purchaseApi";
import { getAllOrders } from "../api/orderApi"; 
import DataTable from "../components/UI/DataTable";
import ProductionForm from "../components/Forms/ProductionForm"; 
import { Plus, Edit, Trash2 } from "lucide-react";

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
      setProductions(Array.isArray(res.data) ? res.data : []);
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
      const res = await getAllOrders(); // FIXED: Was using getProductions() — wrong!
      setOrders(Array.isArray(res.orders) ? res.orders : res);
    } catch (err) {
      console.error("Error fetching orders", err);
      setOrders([]);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? This will delete the production record permanently.")) return;
    try {
      await deleteProduction(id);
      await fetchProductions();
    } catch (err) {
      console.error("Error deleting production", err);
      alert(`Failed to delete: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleFormSubmit = async (data) => {
    try {
      if (editProduction) {
        await updateProduction(editProduction._id, data);
      } else {
        await createProduction(data);
      }
      setShowForm(false);
      setEditProduction(null);
      await fetchProductions();
    } catch (err) {
      console.error("Error saving production", err);
      alert(`Failed to save: ${err.response?.data?.message || err.message}`);
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

  const columns = [
    {
      key: "order.orderDate",
      label: "Order Date",
      render: (p) => {
        const date = p.order?.orderDate;
        if (!date) return "N/A";
        return new Date(date).toLocaleDateString('en-IN');
      },
    },
    {
      key: "order.orderType",
      label: "Order Type",
      render: (p) => (
        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
          p.order?.orderType === "FOB"
            ? "bg-blue-100 text-blue-800"
            : "bg-green-100 text-green-800"
        }`}>
          {p.order?.orderType || "N/A"}
        </span>
      ),
    },
    {
      key: "poDate",
      label: "PO Date",
      render: (p) => {
        const date = p.poDate;
        if (!date) return "N/A";
        return new Date(date).toLocaleDateString('en-IN');
      },
    },
    {
      key: "receivedFabric",
      label: "Received Fabric",
      render: (p) => {
        const order = p.order || {};
        const purchase = purchases.find(pr => pr.order?._id?.toString() === order._id?.toString()) || {};
        const isFob = order.orderType === "FOB";
        return p.receivedFabric || (isFob ? purchase.fabricType : order.fabric?.type) || "N/A";
      },
    },
    {
      key: "goodsType",
      label: "Goods Type",
      render: (p) => {
        const order = p.order || {};
        const purchase = purchases.find(pr => pr.order?._id?.toString() === order._id?.toString()) || {};
        const isFob = order.orderType === "FOB";
        return p.goodsType || (isFob ? purchase.fabricStyles?.[0] : order.fabric?.style) || "N/A";
      },
    },
    {
      key: "color",
      label: "Color",
      render: (p) => {
        const order = p.order || {};
        const purchase = purchases.find(pr => pr.order?._id?.toString() === order._id?.toString()) || {};
        const isFob = order.orderType === "FOB";
        return p.color || (isFob ? purchase.fabricColors?.[0] : order.fabric?.color) || "N/A";
      },
    },
    {
      key: "status",
      label: "Status",
      render: (p) => {
        const status = p.status || "Pending Production";
        const statusStyles = {
          "Pending Production": "bg-red-500 text-white",
          "Factory Received": "bg-sky-400 text-white",
          "Cutting": "bg-blue-500 text-white",
          "Stitching": "bg-yellow-500 text-white",
          "Trimming": "bg-yellow-600 text-white",
          "QC": "bg-orange-500 text-white",
          "Ironing": "bg-purple-500 text-white",
          "Packing": "bg-indigo-500 text-white",
          "Production Completed": "bg-green-700 text-white",
        };
        const style = statusStyles[status] || "bg-gray-400 text-white";
        return (
          <span className={`inline-flex ${style} text-xs px-2 py-1 rounded-full font-semibold`}>
            {status}
          </span>
        );
      },
    },
    {
      key: "requiredQty",
      label: "Required Qty",
      render: (p) => (
        <span className="font-semibold text-blue-600">
          {p.requiredQty || "N/A"}
        </span>
      ),
    },
    {
      key: "remarks",
      label: "Remarks",
      render: (p) => p.remarks || <span className="text-gray-500">No remarks</span>,
    },
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading productions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showForm ? (
        <ProductionForm
          onSubmit={handleFormSubmit}
          initialValues={editProduction || {}}
          onClose={() => {
            setShowForm(false);
            setEditProduction(null);
          }}
          orders={orders}
          purchases={purchases}
        />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Production Management</h1>
            {isAdmin && (
              <button
                onClick={() => {
                  setShowForm(true);
                  setEditProduction(null);
                }}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" /> Create Production
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="border-b border-gray-200">
            <div className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.key
                      ? "border-green-500 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {filteredData.length > 0 ? (
            <DataTable 
              columns={columns} 
              data={filteredData} 
              actions={actions} 
            />
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