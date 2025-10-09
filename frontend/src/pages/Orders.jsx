import { useEffect, useState } from "react";
import { getAllOrders, deleteOrder, createOrder, updateOrder } from "../api/orderApi";
import { getAllBuyers } from "../api/buyerApi";
import { Plus, Edit, Trash2 } from "lucide-react";
import DataTable from "../components/UI/DataTable";
import OrdersForm from "../components/Forms/OrdersForm";

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
    if (window.confirm("Are you sure you want to delete this order? This will also delete related purchase/production records.")) {
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

  const truncate = (str, max = 10) => {
    if (!str) return "—";
    return str.length > max ? str.substring(0, max) + "…" : str;
  };

  const filteredOrders = filter === "all" ? orders : orders.filter((o) => o.orderType === filter);

  const columns = [
    {
      key: "orderDate",
      label: "Date",
      width: "60px",
      render: (o) => (
        <div className="text-xs">
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
      width: "90px",
      render: (o) => (
        <div className="font-medium text-xs" title={o.PoNo}>
          {truncate(o.PoNo, 12) || "—"}
        </div>
      )
    },
    {
      key: "buyer",
      label: "Buyer",
      width: "65px",
      render: (o) => (
        <div className="text-xs" title={o.buyerDetails?.name || o.buyer?.name}>
          {truncate(o.buyerDetails?.name || o.buyer?.name, 9) || "—"}
        </div>
      )
    },
    {
      key: "buyerCode",
      label: "Code",
      width: "60px",
      render: (o) => (
        <div className="text-xs" title={o.buyerDetails?.code}>
          {truncate(o.buyerDetails?.code, 8) || "—"}
        </div>
      )
    },
    {
      key: "orderType",
      label: "Type",
      width: "50px",
      render: (o) => (
        <span className={`px-1 py-0.5 rounded text-xs font-medium ${o.orderType === "JOB-Works"
          ? "bg-purple-100 text-purple-700"
          : "bg-blue-100 text-blue-700"
          }`}>
          {o.orderType === "JOB-Works" ? "JOB-Works" : "FOB"}
        </span>
      )
    },
    {
      key: "status",
      label: "Status",
      width: "90px",
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
          "Purchase Completed": "Pur Done",
          "Pending Production": "! Production",
          "In Production": "In Prod",
          "Production Completed": "Prod Done",
          "Completed": "Complete",
        };
        return (
          <span
            className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusStyles[status] || "bg-gray-400 text-white"}`}
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
      width: "85px",
      render: (o) => {
        if (!o.products || o.products.length === 0) {
          return <span className="text-gray-400 text-xs">—</span>;
        }
        const productNames = o.products.map(p => p.productDetails?.name || "Unknown");
        const displayNames = productNames.slice(0, 2);
        const remaining = productNames.length - 2;

        return (
          <div className="text-xs" title={productNames.join(", ")}>
            {displayNames.map((name, idx) => (
              <div key={idx} className="truncate">{truncate(name, 11)}</div>
            ))}
            {remaining > 0 && (
              <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                +{remaining}
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: "fabricType",
      label: "Fabric",
      width: "75px",
      render: (o) => {
        if (!o.products || o.products.length === 0) return <span className="text-gray-400 text-xs">—</span>;

        const allFabrics = o.products.flatMap(p =>
          p.fabricTypes?.map(ft => ft.fabricType) || []
        );
        const uniqueFabrics = [...new Set(allFabrics)];
        const displayFabrics = uniqueFabrics.slice(0, 2);
        const remaining = uniqueFabrics.length - 2;

        return (
          <div className="text-xs" title={uniqueFabrics.join(", ")}>
            {displayFabrics.map((fabric, idx) => (
              <div key={idx} className="truncate">{truncate(fabric, 10)}</div>
            ))}
            {remaining > 0 && (
              <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                +{remaining}
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: "color",
      label: "Color",
      width: "80px",
      render: (o) => {
        if (!o.products || o.products.length === 0) {
          return <span className="text-gray-400 text-xs">—</span>;
        }

        const colorData = {};
        o.products.forEach(p => {
          p.fabricTypes?.forEach(ft => {
            ft.sizes?.forEach(s => {
              s.colors?.forEach(c => {
                if (!colorData[c.color]) {
                  colorData[c.color] = {};
                }
                if (!colorData[c.color][s.size]) {
                  colorData[c.color][s.size] = 0;
                }
                colorData[c.color][s.size] += c.qty || 0;
              });
            });
          });
        });

        const colors = Object.keys(colorData);
        if (colors.length === 0) {
          return <span className="text-gray-400 text-xs">—</span>;
        }

        return (
          <div className="text-xs">
            {colors.map((color, idx) => (
              <div key={idx} className="font-medium text-gray-800 border-b border-l border-r border-gray-200 rounded py-1">
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
      width: "150px",
      render: (o) => {
        if (!o.products || o.products.length === 0) {
          return <span className="text-gray-400 text-xs">—</span>;
        }

        const colorData = {};
        o.products.forEach(p => {
          p.fabricTypes?.forEach(ft => {
            ft.sizes?.forEach(s => {
              s.colors?.forEach(c => {
                if (!colorData[c.color]) {
                  colorData[c.color] = {};
                }
                if (!colorData[c.color][s.size]) {
                  colorData[c.color][s.size] = 0;
                }
                colorData[c.color][s.size] += c.qty || 0;
              });
            });
          });
        });

        const colors = Object.keys(colorData);
        if (colors.length === 0) {
          return <span className="text-gray-400 text-xs">—</span>;
        }

        return (
          <div className="text-xs">
            {colors.map((color, idx) => {
              const colorSizeEntries = Object.entries(colorData[color]).sort((a, b) => {
                const sizeOrder = { XS: 0, S: 1, M: 2, L: 3, XL: 4, XXL: 5 };
                return (sizeOrder[a[0]] || 999) - (sizeOrder[b[0]] || 999);
              });

              const sizeQtyStr = colorSizeEntries
                .map(([size, qty]) => `${size}: ${qty}`)
                .join(", ");

              return (
                <div key={idx} className="text-gray-600 font-mono border-b border-l border-r border-gray-200 py-1">
                  {sizeQtyStr}
                </div>
              );
            })}
          </div>
        );
      }
    },
    // {
    //   key: "sizeQtyTotal",
    //   label: "Size + Qty",
    //   width: "80px",
    //   render: (o) => {
    //     if (!o.products || o.products.length === 0) {
    //       return <span className="text-gray-400 text-xs">—</span>;
    //     }

    //     const sizeMap = {};
    //     o.products.forEach(p => {
    //       p.fabricTypes?.forEach(ft => {
    //         ft.sizes?.forEach(s => {
    //           s.colors?.forEach(c => {
    //             sizeMap[s.size] = (sizeMap[s.size] || 0) + (c.qty || 0);
    //           });
    //         });
    //       });
    //     });

    //     const sizeEntries = Object.entries(sizeMap).sort((a, b) => {
    //       const sizeOrder = { XS: 0, S: 1, M: 2, L: 3, XL: 4, XXL: 5 };
    //       return (sizeOrder[a[0]] || 999) - (sizeOrder[b[0]] || 999);
    //     });

    //     return (
    //       <div className="text-xs font-mono">
    //         {sizeEntries.map(([size, qty], idx) => (
    //           <div key={idx} className="text-gray-600 border-b border-l border-r border-gray-200">{size}: {qty}</div>
    //         ))}
    //       </div>
    //     );
    //   }
    // },
    {
      key: "totalQty",
      label: "Total",
      width: "50px",
      render: (o) => (
        <span className="font-semibold text-blue-600 text-sm">
          {o.totalQty || 0}
        </span>
      )
    }
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
            <div className="w-full">
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