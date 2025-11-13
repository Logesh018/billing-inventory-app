import { useEffect, useState } from "react";
import { getAllOrders, deleteOrder, createOrder, updateOrder } from "../api/orderApi";
import { getAllBuyers } from "../api/buyerApi";
import { Plus, Edit, Trash2 } from "lucide-react";
import DataTable from "../components/UI/DataTable";
import OrdersForm from "../pages/orders/OrdersForm";
import { showConfirm } from "../utils/toast";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchOrders(), fetchBuyers()]);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await getAllOrders();
      const ordersData = res.orders || res;
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setError(null);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to fetch orders");
      setOrders([]);
    }
  };

  const fetchBuyers = async () => {
    try {
      const res = await getAllBuyers();
      setBuyers(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error("Error fetching buyers:", error);
      setBuyers([]);
    }
  };

  const handleDelete = async (id) => {
    if (showConfirm("Are you sure you want to delete this order? This will also delete related purchase/production records.")) {
      try {
        await deleteOrder(id);
        await fetchOrders();
      } catch (error) {
        console.error("Error deleting order:", error);
        alert(`Failed to delete order: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const handleFormSubmit = async (data) => {
    try {
      if (editOrder) {
        await updateOrder(editOrder._id, data);
      } else {
        await createOrder(data);
      }
      setShowForm(false);
      setEditOrder(null);
      await fetchOrders();
    } catch (error) {
      console.error("Error saving order:", error);
      alert(`Failed to save order: ${error.response?.data?.message || error.message}`);
    }
  };

  const filteredOrders = filter === "all" ? orders : orders.filter((o) => o.orderType === filter);

  const columns = [
    {
      key: "orderDate",
      label: "Date",
      width: "5%",
      render: (o) => (
        <div className="text-[10px] leading-tight">
          {o.orderDate ? new Date(o.orderDate).toLocaleDateString('en-IN', {
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
      render: (o) => (
        <div className="font-medium text-[10px] leading-tight break-words">
          {o.PoNo || "—"}
        </div>
      )
    },
    {
      key: "buyer",
      label: "Buyer",
      width: "7%",
      render: (o) => (
        <div className="text-[9px] leading-tight break-words" title={o.buyerDetails?.name || o.buyer?.name}>
          {o.buyerDetails?.name || o.buyer?.name || "—"}
        </div>
      )
    },
    {
      key: "buyerCode",
      label: "Code",
      width: "4%",
      render: (o) => (
        <div className="text-[9px] leading-tight break-words">
          {o.buyerDetails?.code || "—"}
        </div>
      )
    },
    {
      key: "orderType",
      label: "Type",
      width: "5%",
      render: (o) => (
        <span className={`px-1 py-0.5 rounded text-[9px] font-medium inline-block ${o.orderType === "JOB-Works"
          ? "bg-purple-100 text-purple-700"
          : "bg-blue-100 text-blue-700"
          }`}>
          {o.orderType === "JOB-Works" ? "JOB Works" : "FOB"}
        </span>
      )
    },
    {
      key: "status",
      label: "Status",
      width: "7%",
      render: (o) => {
        const status = o.status || 'Pending';
        const statusStyles = {
          "Pending Purchase": "bg-red-500 text-white",
          "Purchase Completed": "bg-green-600 text-white",
          "Pending Production": "bg-blue-700 text-white",
          "In Production": "bg-purple-600 text-white",
          "Production Completed": "bg-green-700 text-white",
          "Completed": "bg-gray-600 text-white",
        };
        const shortStatus = {
          "Pending Purchase": "! Purchase",
          "Purchase Completed": "Purchase ✓",
          "Pending Production": "! Production",
          "In Production": "Prod→",
          "Production Completed": "Production ✓",
          "Completed": "Done",
        };
        return (
          <span
            className={`px-1 py-0.5 rounded text-[9px] leading-tight break-words inline-block ${statusStyles[status] || "bg-gray-400 text-white"}`}
            title={status}
          >
            {shortStatus[status] || status}
          </span>
        );
      }
    },
    {
      key: "products",
      label: "Products",
      width: "11%",
      render: (o) => {
        if (!o.products || o.products.length === 0)
          return <span className="text-gray-400 text-[9px]">—</span>;

        return (
          <div className="border border-gray-300 rounded overflow-hidden">
            {o.products.map((p, i) => (
              <div
                key={i}
                className="px-1 py-1 border-b border-gray-200 last:border-0 text-[8px] leading-tight"
              >
                <div className="font-medium text-gray-800 break-words">
                  {p.productDetails?.name || "—"}
                </div>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      key: "fabricType",
      label: "Fabric",
      width: "7%",
      render: (o) => {
        if (!o.products || o.products.length === 0)
          return <span className="text-gray-400 text-[9px]">—</span>;

        return (
          <div className="border border-gray-300 rounded overflow-hidden">
            {o.products.map((p, i) => (
              <div
                key={i}
                className="px-1 py-1 border-b border-gray-200 last:border-0 text-[8px] leading-tight break-words"
              >
                {p.productDetails?.fabricType || "—"}
              </div>
            ))}
          </div>
        );
      },
    },
    {
      key: "style",
      label: "Style",
      width: "8%",
      render: (o) => {
        if (!o.products || o.products.length === 0)
          return <span className="text-gray-400 text-[9px]">—</span>;

        return (
          <div className="border border-gray-300 rounded overflow-hidden">
            {o.products.map((p, i) => (
              <div
                key={i}
                className="px-1 py-1 border-b border-gray-200 last:border-0 text-[8px] leading-tight break-words"
              >
                {p.productDetails?.style || "—"}
              </div>
            ))}
          </div>
        );
      },
    },
    {
      key: "color",
      label: "Color",
      width: "7%",
      render: (o) => {
        if (!o.products || o.products.length === 0)
          return <span className="text-gray-400 text-[9px]">—</span>;

        return (
          <div className="border border-gray-300 rounded overflow-hidden">
            {o.products.map((p, i) => (
              <div
                key={i}
                className="px-0 py-1 border-b border-gray-200 last:border-0 text-[9px] leading-tight break-words"
              >
                {p.productDetails?.color || "—"}
              </div>
            ))}
          </div>
        );
      },
    },
    {
      key: "sizeQty",
      label: "Size & Qty",
      width: "15%",
      render: (o) => {
        if (!o.products || o.products.length === 0)
          return <span className="text-gray-400 text-[10px]">—</span>;

        return (
          <div className="border border-gray-300 rounded overflow-hidden">
            {o.products.map((p, i) => (
              <div
                key={i}
                className="py-1 border-b border-gray-200 text-gray-600 font-mono font-medium last:border-0 text-[9px] leading-tight break-words"
              >
                {p.sizes?.map((s) => `${s.size}:${s.qty}`).join(", ") || "—"}
              </div>
            ))}
          </div>
        );
      },
    },
    {
      key: "totalQty",
      label: "Total",
      width: "4%",
      render: (o) => (
        <span className="font-semibold text-blue-600 text-[10px]">
          {o.totalQty || 0}
        </span>
      )
    },
    // {
    //   key: "actions",
    //   label: "Actions",
    //   width: "7%",
    //   render: () => null // Actions handled by DataTable
    // }
  ];

  const actions = [
    {
      label: "Edit",
      icon: Edit,
      className: "bg-blue-500 text-white hover:bg-blue-600",
      onClick: (order) => {
        setEditOrder(order);
        setShowForm(true);
      },
    },
    {
      label: "Delete",
      icon: Trash2,
      className: "bg-red-500 text-white hover:bg-red-600",
      onClick: (order) => handleDelete(order._id),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showForm ? (
        <OrdersForm
          onSubmit={handleFormSubmit}
          initialValues={editOrder || {}}
          buyers={buyers}
          onClose={() => {
            setShowForm(false);
            setEditOrder(null);
          }}
        />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Orders Management</h1>
              <p className="text-gray-600 text-sm mt-1">Manage FOB and JOB-WORKS orders</p>
            </div>
            <button
              onClick={() => {
                setShowForm(true);
                setEditOrder(null);
              }}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-sm text-sm"
            >
              <Plus className="w-4 h-4 mr-1" /> Create Order
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
                { key: "all", label: "All Orders", count: orders.length },
                { key: "FOB", label: "FOB", count: orders.filter(o => o.orderType === "FOB").length },
                { key: "JOB-Works", label: "JOB-WORKS", count: orders.filter(o => o.orderType === "JOB-Works").length }
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

          {filteredOrders.length > 0 ? (
            <div className="w-full overflow-x-hidden">
              <DataTable
                columns={columns}
                data={filteredOrders}
                actions={actions}
              />
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-gray-500 text-lg mb-2">No orders found</div>
              <div className="text-gray-400 text-sm mb-4">
                {filter === "all"
                  ? "Create your first order to get started"
                  : `No ${filter} orders found`
                }
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Order
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}



