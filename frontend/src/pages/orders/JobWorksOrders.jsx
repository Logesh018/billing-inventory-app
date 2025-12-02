import { useEffect, useState } from "react";
import { getAllOrders, deleteOrder, createOrder, updateOrder, generateOrderPDF } from "../../api/orderApi";
import { getAllBuyers } from "../../api/buyerApi";
import { Plus, Edit, Trash2, Eye, FileText } from "lucide-react";
import DataTable from "../../components/UI/DataTable";
import OrdersForm from "./OrdersForm";
import { useFormNavigation } from "../../utils/FormExitModal";
import { showConfirm, showError, showLoading, dismissAndSuccess, dismissAndError, } from "../../utils/toast";

// Helper function – same as in FOBOrders.jsx
const renderProductDetails = (products, key, isArray = false) => {
  if (!products || products.length === 0)
    return <span className="text-gray-400 text-[9px]">—</span>;

  return (
    <div className="space-y-1.5">
      {products.map((p, i) => {
        let value = p.productDetails?.[key];
        if (isArray) {
          value = Array.isArray(value) ? value.join(", ") : value || "—";
        } else {
          value = value || "—";
        }
        const productTotalQty = (p.sizes || []).reduce(
          (sum, s) => sum + (s.qty || 0),
          0
        );
        return (
          <div
            key={i}
            className="px-1 py-0 border border-gray-200 rounded text-[8px] font-semibold leading-tight break-words min-h-[20px] flex items-center justify-center"
          >
            {value}
            {key === "totalQty" && (
              <div className="font-semibold text-blue-700">
                {productTotalQty}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default function JOBWorksOrders() {
  const [orders, setOrders] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingPDF, setGeneratingPDF] = useState(null);
  const { setIsFormOpen } = useFormNavigation();

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
      const jobWorksOrders = Array.isArray(ordersData)
        ? ordersData.filter((o) => o.orderType === "JOB-Works")
        : [];
      setOrders(jobWorksOrders);
      setError(null);
    } catch (error) {
      console.error("Error fetching JOB-Works orders:", error);
      setError("Failed to fetch JOB-Works orders");
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
    showConfirm(
      "Are you sure you want to delete this JOB-Works order? This will also delete related purchase/production records.",
      async () => {
        const toastId = showLoading("Deleting order...");
        try {
          await deleteOrder(id);
          await fetchOrders();
          dismissAndSuccess(toastId, "Order deleted successfully!");
        } catch (error) {
          console.error("Error deleting order:", error);
          dismissAndError(
            toastId,
            `Failed to delete order: ${error.response?.data?.message || error.message}`
          );
        }
      }
    );
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
      setIsFormOpen(false);
      await fetchOrders();
    } catch (error) {
      console.error("Error saving order:", error);
      alert(`Failed to save order: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleViewPDF = async (order) => {
    try {
      if (order.pdfUrl) {
        window.open(order.pdfUrl, "_blank");
        return;
      }

      setGeneratingPDF(order._id);
      const toastId = showLoading(`Generating PDF for Order ${order.orderId || order.PoNo}...`);

      const response = await generateOrderPDF(order._id);

      if (response.pdfUrl) {
        window.open(response.pdfUrl, "_blank");
      }

      await fetchOrders();
      dismissAndSuccess(toastId, "PDF generated and opened successfully!");
    } catch (error) {
      console.error("Error viewing/generating PDF:", error);
      showError(`Failed to view PDF: ${error.response?.data?.message || error.message}`);
    } finally {
      setGeneratingPDF(null);
    }
  };

  const columns = [
    {
      key: "serialNo",
      label: "S No",
      width: "4%",
      render: (o) => (
        <div className="font-mono text-[9px] font-semibold text-gray-700">
          {o.serialNo || "—"}
        </div>
      ),
    },
    {
      key: "orderDate",
      label: "Date",
      width: "5%",
      render: (o) => (
        <div className="text-[9px] font-semibold leading-tight">
          {o.orderDate
            ? new Date(o.orderDate).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
            })
            : "—"}
        </div>
      ),
    },
    {
      key: "O ID",
      label: "O ID",
      width: "5%",
      render: (o) => (
        <div className="font-medium text-[9px] leading-tight break-words">
          <div className="text-gray-800 font-semibold text-[9px] mt-0.5">
            {o.orderId || "—"}
          </div>
        </div>
      ),
    },
    {
      key: "PoNo",
      label: "B PoNo",
      width: "7%",
      render: (o) => (
        <div className="font-medium text-[9px] leading-tight break-words">
          <div className="font-bold text-gray-800">{o.PoNo || "—"}</div>
        </div>
      ),
    },
    {
      key: "buyer",
      label: "Buyer",
      width: "7%",
      render: (o) => (
        <div
          className="text-[9px] leading-tight break-words"
          title={o.buyerDetails?.name || o.buyer?.name}
        >
          <div className="font-semibold text-gray-800">
            {o.buyerDetails?.name || o.buyer?.name || "—"}
          </div>
          <div className="text-gray-500 font-semibold text-[8px] mt-0.5">
            {o.buyerDetails?.code || "—"}
          </div>
        </div>
      ),
    },
    {
      key: "orderType",
      label: "O Type",
      width: "5%",
      render: (o) => (
        <span
          className={`px-1 py-0.5 rounded text-[9px] font-medium inline-block ${o.orderType === "JOB-Works"
            ? "bg-purple-100 text-purple-700"
            : o.orderType === "Own-Orders"
              ? "bg-teal-100 text-teal-700"
              : "bg-blue-100 text-blue-700"
            }`}
        >
          {o.orderType === "JOB-Works" ? "JOB" : o.orderType === "Own-Orders" ? "OWN" : "FOB"}
        </span>
      ),
    },
    {
      key: "products",
      label: "Products",
      width: "8%",
      render: (o) => renderProductDetails(o.products, "name"),
    },
    {
      key: "fabric",
      label: "Fabric",
      width: "7%",
      render: (o) => renderProductDetails(o.products, "fabric"),
    },
    {
      key: "style",
      label: "P Style",
      width: "8%",
      render: (o) => renderProductDetails(o.products, "style", true),
    },
    {
      key: "color",
      label: "Color",
      width: "6%",
      render: (o) => renderProductDetails(o.products, "color"),
    },
    {
      key: "sizeQty",
      label: "Size & Qty",
      width: "15%",
      render: (o) => {
        if (!o.products || o.products.length === 0)
          return <span className="text-gray-800 text-[9px]">—</span>;

        return (
          <div className="space-y-1.5">
            {o.products.map((p, i) => (
              <div
                key={i}
                className="px-0.5 py-1 border border-gray-200 rounded text-gray-800 font-mono text-[8px] leading-tight break-words min-h-[15px] flex items-center"
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
      width: "6%",
      render: (o) => {
        if (!o.products || o.products.length === 0) {
          return (
            <div className="flex flex-col justify-end">
              <span className="font-extrabold text-green-600 text-[10px] bg-green-50 p-1 rounded-sm text-center mt-auto">
                {o.totalQty || 0}
              </span>
            </div>
          );
        }
        return (
          <div className="flex flex-col">
            <div className="space-y-2 mt-1 mb-1">
              {o.products.map((p, i) => {
                const productTotal = (p.sizes || []).reduce(
                  (sum, s) => sum + (s.qty || 0),
                  0
                );
                return (
                  <div
                    key={i}
                    className="px-1 pt-1.5 text-center font-bold text-blue-700 text-[9px] leading-tight min-h-[15px] flex items-center justify-center"
                  >
                    {productTotal}
                  </div>
                );
              })}
            </div>

            <div className="font-semibold text-green-600 text-[9px] bg-green-50 rounded-sm text-center">
              {o.totalQty || 0}
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      width: "6%",
      render: (o) => {
        const status = o.status || "Pending";
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
          "Purchase Completed": "P-Done",
          "Pending Production": "! Production",
          "In Production": "! Production",
          "Production Completed": "Prod-Done",
          "Completed": "Completed",
        };
        return (
          <span
            className={`px-1 py-0.5 rounded text-[8px] leading-tight break-words inline-block text-center w-full ${statusStyles[status] || "bg-gray-400 text-white"
              }`}
            title={status}
          >
            {shortStatus[status] || status}
          </span>
        );
      },
    },
    {
      key: "pdfUrl",
      label: "PDF",
      width: "3%",
      render: (order) => (
        <div className="text-center">
          {order.pdfUrl ? (
            <FileText className="w-4 h-4 text-green-600 mx-auto" />
          ) : (
            <span className="text-gray-400 text-xs">—</span>
          )}
        </div>
      ),
    },
  ];

  const actions = [
    {
      label: "View PDF",
      icon: Eye,
      className: "bg-blue-500 text-white hover:bg-blue-600",
      onClick: handleViewPDF,
      disabled: (order) => generatingPDF === order._id,
    },
    {
      label: "Edit",
      icon: Edit,
      className: "bg-orange-500 text-white hover:bg-orange-600",
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
        <div className="text-lg text-gray-600">Loading JOB-Works orders...</div>
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
          defaultOrderType="JOB-Works"
          onClose={() => {
            setShowForm(false);
            setEditOrder(null);
          }}
        />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-800">JOB-Works Orders Management</h1>
              <p className="text-gray-600 text-sm mt-1">Manage Job-Works orders</p>
            </div>
            <button
              onClick={() => {
                setShowForm(true);
                setEditOrder(null);
              }}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-sm text-sm"
            >
              <Plus className="w-4 h-4 mr-1" /> Create JOB-Works Order
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {generatingPDF && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
              Generating PDF... This may take a few seconds.
            </div>
          )}

          {orders.length > 0 ? (
            <div className="w-full overflow-x-hidden">
              <DataTable columns={columns} data={orders} actions={actions} />
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-gray-500 text-lg mb-2">No JOB-Works orders found</div>
              <div className="text-gray-400 text-sm mb-4">
                Create your first JOB-Works order to get started
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First JOB-Works Order
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}