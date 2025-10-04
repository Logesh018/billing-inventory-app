import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getPurchases, createPurchase, updatePurchase, deletePurchase } from "../api/purchaseApi";
import PurchaseForm from "../components/Forms/PurchaseForm";
import DataTable from "../components/UI/DataTable";
import { Plus, Edit, Trash2 } from "lucide-react";

export default function Purchase() {
  const { user, hasAccess } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editPurchase, setEditPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAdmin = user?.role === "Admin" || user?.role === "SuperAdmin";

  useEffect(() => {
    fetchPurchases();
  }, [hasAccess]);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await getPurchases();
      const allPurchases = (Array.isArray(res.data) ? res.data : [])
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setPurchases(allPurchases);
      setError(null);
    } catch (err) {
      console.error("Error fetching purchases", err);
      setError("Failed to fetch purchases");
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this purchase? This action cannot be undone.")) {
      try {
        await deletePurchase(id);
        await fetchPurchases();
      } catch (error) {
        console.error("Error deleting purchase:", error);
        alert(`Failed to delete purchase: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const handleFormSubmit = async (data) => {
    try {
      const payload = {
        orderId: data.orderId,
        fabricPurchases: data.fabricPurchases || [],
        buttonsPurchases: data.buttonsPurchases || [],
        packetsPurchases: data.packetsPurchases || [],
        remarks: data.remarks,
      };

      // if (!payload.orderId) {
      //   alert("Order is required");
      //   return;
      // }

      if (editPurchase) {
        await updatePurchase(editPurchase._id, payload);
      } else {
        await createPurchase(payload);
      }
      setShowForm(false);
      setEditPurchase(null);
      await fetchPurchases();
    } catch (error) {
      console.error("Error saving purchase:", error);
      alert(`Failed to save purchase: ${error.response?.data?.message || error.message}`);
    }
  };

  const filteredPurchases = filter === "all"
    ? purchases
    : purchases.filter((p) => {
      const status = p.order?.status;
      if (filter === "pending") return status === "Pending Purchase";
      if (filter === "completed") return status === "Purchase Completed";
      return true;
    });

  const truncate = (str, max = 10) => {
    if (!str) return "—";
    return str.length > max ? str.substring(0, max) + "…" : str;
  };

  const columns = [
    {
      key: "orderDate",
      label: "Date",
      width: "65px",
      render: (p) => (
        <div className="text-xs">
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
      width: "75px",
      render: (p) => (
        <div className="font-medium text-xs" title={p.PoNo}>
          {truncate(p.PoNo, 12) || "—"}
        </div>
      )
    },
    {
      key: "buyerCode",
      label: "Buyer",
      width: "60px",
      render: (p) => (
        <div className="text-xs" title={p.buyerCode}>
          {truncate(p.buyerCode, 8) || "—"}
        </div>
      )
    },
    {
      key: "orderType",
      label: "Type",
      width: "60px",
      render: (p) => (
        <span className={`px-1 py-0.5 rounded text-xs font-medium ${p.orderType === "JOB-Works"
          ? "bg-purple-100 text-purple-700"
          : "bg-blue-100 text-blue-700"
          }`}>
          {p.orderType === "JOB-Works" ? "JOB-Works" : "FOB"}
        </span>
      )
    },
    {
      key: "status",
      label: "Status",
      width: "65px",
      render: (p) => {
        const status = p.status || "Pending";
        const styles = {
          Pending: "bg-red-500 text-white",
          Partial: "bg-orange-100 text-orange-700",
          Completed: "bg-green-500 text-white",
        };
        return (
          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-700"}`}>
            {status}
          </span>
        );
      }
    },
    {
      key: "products",
      label: "Products",
      width: "85px",
      render: (p) => {
        if (!p.products || p.products.length === 0) {
          return <span className="text-gray-400 text-xs">—</span>;
        }
        const productNames = p.products.map(prod => prod.productName);

        return (
          <div className="text-xs" title={productNames.join(", ")}>
            {productNames.map((name, idx) => (
              <div key={idx} className="truncate">{truncate(name, 11)}</div>
            ))}
          </div>
        );
      }
    },
    {
      key: "fabricType",
      label: "Fabric",
      width: "75px",
      render: (p) => {
        if (!p.products || p.products.length === 0) return <span className="text-gray-400 text-xs">—</span>;
        const types = [...new Set(p.products.map(prod => prod.fabricType))];

        return (
          <div className="text-xs" title={types.join(", ")}>
            {types.map((type, idx) => (
              <div key={idx} className="truncate">{truncate(type, 10)}</div>
            ))}
          </div>
        );
      }
    },
    {
      key: "color",
      label: "Color",
      width: "80px",
      render: (p) => {
        if (!p.products || p.products.length === 0) {
          return <span className="text-gray-400 text-xs">—</span>;
        }

        // Collect all color data with their sizes and quantities from products
        const colorData = {};

        p.products.forEach(product => {
          // Parse colors from fabricColor string
          const colors = product.fabricColor?.split(',').map(c => c.trim()) || [];

          // For each color, map it to sizes
          colors.forEach(color => {
            if (!colorData[color]) {
              colorData[color] = {};
            }

            // Add sizes for this product
            product.sizes?.forEach(s => {
              if (!colorData[color][s.size]) {
                colorData[color][s.size] = 0;
              }
              // Distribute quantity evenly among colors (this is an approximation)
              colorData[color][s.size] += Math.floor(s.quantity / colors.length);
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
              <div key={idx} className="font-medium border-b border-l border-r border-gray-200 text-gray-800 py-1">
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
      render: (p) => {
        if (!p.products || p.products.length === 0) {
          return <span className="text-gray-400 text-xs">—</span>;
        }

        const colorData = {};

        p.products.forEach(product => {
          const colors = product.fabricColor?.split(',').map(c => c.trim()) || [];

          colors.forEach(color => {
            if (!colorData[color]) {
              colorData[color] = {};
            }

            product.sizes?.forEach(s => {
              if (!colorData[color][s.size]) {
                colorData[color][s.size] = 0;
              }
              colorData[color][s.size] += Math.floor(s.quantity / colors.length);
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
    {
      key: "sizeQtyTotal",
      label: "Size + Qty",
      width: "80px",
      render: (p) => {
        if (!p.products || p.products.length === 0) return <span className="text-gray-400 text-xs">—</span>;

        // Aggregate sizes from ALL products
        const allSizes = p.products.flatMap(product =>
          product.sizes?.map(s => ({ size: s.size, quantity: s.quantity })) || []
        );

        if (allSizes.length === 0) return <span className="text-gray-400 text-xs">—</span>;

        // Group by size in case there are duplicates across products
        const sizeMap = {};
        allSizes.forEach(({ size, quantity }) => {
          sizeMap[size] = (sizeMap[size] || 0) + quantity;
        });

        const sizeEntries = Object.entries(sizeMap).sort((a, b) => {
          const sizeOrder = { XS: 0, S: 1, M: 2, L: 3, XL: 4, XXL: 5 };
          return (sizeOrder[a[0]] || 999) - (sizeOrder[b[0]] || 999);
        });

        return (
          <div className="text-xs font-mono">
            {sizeEntries.map(([size, qty], idx) => (
              <div key={idx} className="text-gray-600 border-b border-l border-r border-gray-200">{size}: {qty}</div>
            ))}
          </div>
        );
      }
    },
    {
      key: "totalQty",
      label: "Total",
      width: "60px",
      render: (p) => (
        <span className="font-semibold text-blue-600 text-sm">
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
        onClick: (purchase) => {
          setEditPurchase(purchase);
          setShowForm(true);
        },
      },
      {
        label: "Delete",
        icon: Trash2,
        className: "bg-red-500 text-white hover:bg-red-600",
        onClick: (purchase) => handleDelete(purchase._id),
      },
    ]
    : [];

  const purchaseFields = [
    { name: "orderId", label: "Order", type: "text", required: true },
    {
      name: "fabricPurchases",
      label: "Fabric Purchases",
      type: "array",
      itemFields: [
        { name: "fabricType", label: "Fabric Type", type: "text", required: true },
        { name: "vendor", label: "Vendor", type: "text", required: true },
        { name: "quantity", label: "Quantity", type: "number", required: true },
        { name: "costPerUnit", label: "Cost/Unit", type: "number", required: true },
        { name: "colors", label: "Colors", type: "array", itemFields: [{ name: "", label: "Color", type: "text" }] },
        { name: "gsm", label: "GSM", type: "text" },
        { name: "remarks", label: "Remarks", type: "text" },
      ],
    },
    { name: "remarks", label: "General Remarks", type: "textarea" },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading purchases...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showForm ? (
        <PurchaseForm
          fields={purchaseFields}
          initialValues={editPurchase || {
            orderId: "",
            fabricPurchases: [],
            buttonsPurchases: [],
            packetsPurchases: [],
            remarks: "",
          }}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditPurchase(null);
          }}
          submitLabel={editPurchase ? "Update Purchase" : "Create Purchase"}
          returnTo="/purchase"
        />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Purchase Management</h1>
              <p className="text-gray-600 text-sm mt-1">Manage fabric, button & packet purchases for FOB and JOB-Works orders</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => {
                  setShowForm(true);
                  setEditPurchase(null);
                }}
                className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-sm text-sm"
              >
                <Plus className="w-4 h-4 mr-1" /> Create Purchase
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="border-b border-gray-200">
            <div className="flex space-x-4 overflow-x-auto pb-2">
              {[
                { key: "all", label: "All", count: purchases.length },
                { key: "pending", label: "Pending", count: purchases.filter(p => p.status === "Pending" || !p.status).length },
                { key: "completed", label: "Completed", count: purchases.filter(p => p.status === "Completed").length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`whitespace-nowrap py-2 px-3 text-sm font-medium rounded-t-lg transition-colors ${filter === tab.key
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

          {filteredPurchases.length > 0 ? (
            <div className="w-full">
              <DataTable
                columns={columns}
                data={filteredPurchases}
                actions={actions}
                className="text-xs compact-table"
              />
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-gray-500 text-lg mb-2">No purchases found</div>
              <div className="text-gray-400 text-sm mb-4">
                {filter === "all" ? "Create your first purchase to get started" : `No ${filter} purchases`}
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Purchase
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}