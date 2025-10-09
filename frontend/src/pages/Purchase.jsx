import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getPurchases, createPurchase, updatePurchase, deletePurchase } from "../api/purchaseApi";
import PurchaseForm from "../components/Forms/PurchaseForm";
import DataTable from "../components/UI/DataTable";
import { Plus, Edit, Trash2, ShoppingCart } from "lucide-react";
import { getMachinePurchases, createMachinePurchase, deleteMachinePurchase } from "../api/machinePurchaseApi";
import MachinePurchasesTable from "../pages/MachinePurchasesTable";
import MachinePurchaseForm from "../components/Forms/MachinePurchaseForm";

export default function Purchase() {
  const { user, hasAccess } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editPurchase, setEditPurchase] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [machinePurchases, setMachinePurchases] = useState([]);
  const [showMachineForm, setShowMachineForm] = useState(false);
  const [editMachine, setEditMachine] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = user?.role === "Admin" || user?.role === "SuperAdmin";

  useEffect(() => {
    fetchPurchases();
    fetchMachinePurchases();
  }, [hasAccess]);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await getPurchases();
      // Filter out machine-only purchases (they should only appear in machines tab)
      const nonMachinePurchases = (Array.isArray(res.data) ? res.data : [])
        .filter(p => {
          // Include if it has fabric, buttons, or packets
          const hasMaterials = 
            (p.fabricPurchases && p.fabricPurchases.length > 0) ||
            (p.buttonsPurchases && p.buttonsPurchases.length > 0) ||
            (p.packetsPurchases && p.packetsPurchases.length > 0);
          
          // Exclude if it ONLY has machines
          const onlyMachines = 
            (p.machinesPurchases && p.machinesPurchases.length > 0) &&
            !hasMaterials;
          
          return !onlyMachines;
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setPurchases(nonMachinePurchases);
      setError(null);
    } catch (err) {
      console.error("Error fetching purchases", err);
      setError("Failed to fetch purchases");
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMachinePurchases = async () => {
    try {
      const res = await getMachinePurchases();
      // The API returns { data: [...] }, so we extract it
      const machineData = res.data?.data || res.data;
      setMachinePurchases(Array.isArray(machineData) ? machineData : []);
    } catch (err) {
      console.error("Error fetching machine purchases:", err);
      setMachinePurchases([]);
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

  const handleMachineDelete = async (machine) => {
    if (window.confirm(`Are you sure you want to delete machine purchase "${machine.machineName}"? This action cannot be undone.`)) {
      try {
        // Delete using the purchase document ID
        await deleteMachinePurchase(machine.purchaseId);
        await fetchMachinePurchases();
      } catch (error) {
        console.error("Error deleting machine purchase:", error);
        alert(`Failed to delete machine purchase: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const handleFormSubmit = async (data) => {
    if (isSubmitting) {
      console.log("⚠️ Already submitting, ignoring duplicate request");
      return;
    }

    try {
      setIsSubmitting(true);

      const hasPurchaseItems =
        (data.fabricPurchases && data.fabricPurchases.length > 0) ||
        (data.buttonsPurchases && data.buttonsPurchases.length > 0) ||
        (data.packetsPurchases && data.packetsPurchases.length > 0);

      if (!hasPurchaseItems) {
        alert("Please add at least one purchase item (fabric, buttons, or packets)");
        return;
      }

      const payload = {
        orderId: data.orderId,
        fabricPurchases: data.fabricPurchases || [],
        buttonsPurchases: data.buttonsPurchases || [],
        packetsPurchases: data.packetsPurchases || [],
        remarks: data.remarks,
      };

      console.log("📤 Submitting purchase payload:", payload);

      if (editPurchase && editPurchase._id) {
        console.log("📝 Updating existing purchase:", editPurchase._id);
        await updatePurchase(editPurchase._id, payload);
      } else if (selectedOrder && selectedOrder._id) {
        try {
          const existingPurchaseResponse = await getPurchases();
          const existingPurchase = existingPurchaseResponse.data.find(
            p => p.order?._id === selectedOrder.orderId || p.order === selectedOrder.orderId
          );

          if (existingPurchase) {
            console.log("📝 Found existing purchase, updating:", existingPurchase._id);
            await updatePurchase(existingPurchase._id, payload);
          } else {
            console.log("📝 No existing purchase found, creating new one");
            await createPurchase(payload);
          }
        } catch (error) {
          console.error("Error finding existing purchase:", error);
          throw error;
        }
      } else {
        console.log("📝 Creating new purchase (fallback)");
        await createPurchase(payload);
      }

      setShowForm(false);
      setEditPurchase(null);
      setSelectedOrder(null);
      await fetchPurchases();
    } catch (error) {
      console.error("Error saving purchase:", error);

      if (error.response?.status === 400 && error.response?.data?.message?.includes("already exists")) {
        alert("This order already has a purchase. The form has been populated with existing data. Please update the values and try again.");
      } else {
        alert(`Failed to save purchase: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMachineSubmit = async (data) => {
    try {
      await createMachinePurchase(data);
      setShowMachineForm(false);
      setEditMachine(null);
      await fetchMachinePurchases();
    } catch (error) {
      console.error("Error creating machine purchase:", error);
      alert(`Failed to save machine purchase: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleCreatePurchaseForOrder = async (purchase) => {
    try {
      const existingPurchaseResponse = await getPurchases();
      const existingPurchase = existingPurchaseResponse.data.find(
        p => (p.order?._id === purchase._id || p.order === purchase._id)
      );

      if (existingPurchase) {
        console.log("📝 Loading existing purchase for editing:", existingPurchase._id);
        setEditPurchase(existingPurchase);
        setSelectedOrder(null);
      } else {
        setSelectedOrder({
          _id: purchase._id,
          orderId: purchase.order?._id || purchase._id,
          orderDate: purchase.orderDate,
          PoNo: purchase.PoNo,
          orderType: purchase.orderType,
          buyerCode: purchase.buyerCode,
          orderStatus: purchase.status,
          products: purchase.products,
          totalQty: purchase.totalQty,
        });
        setEditPurchase(null);
      }

      setShowForm(true);
    } catch (error) {
      console.error("Error loading purchase:", error);
      alert("Failed to load purchase data");
    }
  };

  const filteredPurchases = filter === "all"
    ? purchases
    : purchases.filter((p) => {
      const status = p.status;
      if (filter === "pending") return status === "Pending" || !status;
      if (filter === "completed") return status === "Completed";
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
      key: "PURNo",
      label: "PUR-No",
      width: "60px",
      render: (p) => <span className="font-medium text-xs">{p.PURNo || "—"}</span>
    },
    {
      key: "PoNo",
      label: "PO No",
      width: "75px",
      render: (p) => (
        <div className="font-medium text-[11px]" title={p.PoNo}>
          {truncate(p.PoNo, 12) || "—"}
        </div>
      )
    },
    {
      key: "buyerCode",
      label: "Buyer",
      width: "60px",
      render: (p) => (
        <div className="text-[11px]" title={p.buyerCode}>
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
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${styles[status] || "bg-gray-100 text-gray-700"}`}>
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
      width: "70px",
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
      width: "70px",
      render: (p) => {
        if (!p.products || p.products.length === 0) {
          return <span className="text-gray-400 text-xs">—</span>;
        }

        const colorData = {};

        p.products.forEach(product => {
          if (product.colors && Array.isArray(product.colors)) {
            product.colors.forEach(colorEntry => {
              if (!colorData[colorEntry.color]) {
                colorData[colorEntry.color] = {};
              }

              colorEntry.sizes?.forEach(s => {
                if (!colorData[colorEntry.color][s.size]) {
                  colorData[colorEntry.color][s.size] = 0;
                }
                colorData[colorEntry.color][s.size] += s.quantity || 0;
              });
            });
          }
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
          if (product.colors && Array.isArray(product.colors)) {
            product.colors.forEach(colorEntry => {
              if (!colorData[colorEntry.color]) {
                colorData[colorEntry.color] = {};
              }

              colorEntry.sizes?.forEach(s => {
                if (!colorData[colorEntry.color][s.size]) {
                  colorData[colorEntry.color][s.size] = 0;
                }
                colorData[colorEntry.color][s.size] += s.quantity || 0;
              });
            });
          }
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

  const actions = isAdmin ? [
    {
      label: "Create Purchase",
      icon: ShoppingCart,
      className: "bg-green-500 text-white hover:bg-green-600",
      onClick: (purchase) => handleCreatePurchaseForOrder(purchase),
    },
    {
      label: "Edit",
      icon: Edit,
      className: "bg-blue-500 text-white hover:bg-blue-600",
      onClick: (purchase) => {
        setEditPurchase(purchase);
        setSelectedOrder(null);
        setShowForm(true);
      },
    },
    {
      label: "Delete",
      icon: Trash2,
      className: "bg-red-500 text-white hover:bg-red-600",
      onClick: (purchase) => handleDelete(purchase._id),
    },
  ] : [];

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
          initialValues={editPurchase || selectedOrder || {
            orderId: "",
            orderDate: "",
            PoNo: "",
            orderType: "",
            buyerCode: "",
            orderStatus: "",
            products: [],
            totalQty: 0,
            fabricPurchases: [],
            buttonsPurchases: [],
            packetsPurchases: [],
            remarks: "",
          }}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditPurchase(null);
            setSelectedOrder(null);
          }}
          submitLabel={editPurchase ? "Update Purchase" : "Create Purchase"}
          returnTo="/purchase"
          isEditMode={!!editPurchase}
          isSubmitting={isSubmitting}
        />
      ) : showMachineForm ? (
        <MachinePurchaseForm
          initialValues={editMachine}
          isEditMode={!!editMachine}
          onSubmit={handleMachineSubmit}
          onCancel={() => {
            setShowMachineForm(false);
            setEditMachine(null);
          }}
        />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Purchase Management</h1>
              <p className="text-gray-600 text-sm mt-1">
                {filter === "machines" 
                  ? "Manage machine purchases and equipment inventory"
                  : "Manage fabric, button & packet purchases for FOB and JOB-Works orders"}
              </p>
            </div>

            {filter === "machines" && (
              <button
                onClick={() => setShowMachineForm(true)}
                className="flex items-center bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" /> New Purchase
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
                { key: "completed", label: "Completed", count: purchases.filter(p => p.status === "Completed").length },
                { key: "machines", label: "Machines", count: machinePurchases.length }
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

          {filter === "machines" ? (
            <MachinePurchasesTable 
              machines={machinePurchases}
              onEdit={(machine) => {
                setEditMachine(machine);
                setShowMachineForm(true);
              }}
              onDelete={handleMachineDelete}
              isAdmin={isAdmin}
            />
          ) : (
            filteredPurchases.length > 0 ? (
              <div className="w-full">
                <DataTable columns={columns} data={filteredPurchases} actions={actions} className="text-xs compact-table" />
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <div className="text-gray-500 text-lg mb-2">No purchases found</div>
                <div className="text-gray-400 text-sm mb-4">
                  {filter === "all" ? "No orders available for purchase" : `No ${filter} purchases`}
                </div>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}