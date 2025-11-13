import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getPurchases, createPurchase, updatePurchase, deletePurchase } from "../../api/purchaseApi";
import PurchaseForm from "./PurchaseForm";
import DataTable from "../../components/UI/DataTable";
import { Plus, Edit, Trash2, ShoppingCart } from "lucide-react";
import { getMachinePurchases, createMachinePurchase, deleteMachinePurchase } from "../../api/machinePurchaseApi";
import MachinePurchasesTable from "./MachinePurchasesTable";
import MachinePurchaseForm from "./MachinePurchaseForm";
import { showSuccess, showError, showWarning, showConfirm, showLoading, dismissAndSuccess, dismissAndError } from "../../utils/toast"

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
      const nonMachinePurchases = (Array.isArray(res.data) ? res.data : [])
        .filter(p => {
          const hasMaterials =
            (p.fabricPurchases && p.fabricPurchases.length > 0) ||
            (p.buttonsPurchases && p.buttonsPurchases.length > 0) ||
            (p.packetsPurchases && p.packetsPurchases.length > 0);

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
      const machineData = res.data?.data || res.data;
      setMachinePurchases(Array.isArray(machineData) ? machineData : []);
    } catch (err) {
      console.error("Error fetching machine purchases:", err);
      setMachinePurchases([]);
    }
  };

  const handleDelete = async (id) => {
    showConfirm(
      "Are you sure you want to delete this purchase? This action cannot be undone.",
      async () => {
        const toastId = showLoading("Deleting purchase...");
        try {
          await deletePurchase(id);
          await fetchPurchases();
          dismissAndSuccess(toastId, "Purchase deleted successfully!");
        } catch (error) {
          console.error("Error deleting purchase:", error);
          dismissAndError(toastId, `Failed to delete: ${error.response?.data?.message || error.message}`);
        }
      }
    );
  };

  const handleMachineDelete = async (machine) => {
    showConfirm(
      `Are you sure you want to delete machine purchase "${machine.machineName}"? This action cannot be undone.`,
      async () => {
        const toastId = showLoading("Deleting machine purchase...");
        try {
          await deleteMachinePurchase(machine.purchaseId);
          await fetchMachinePurchases();
          dismissAndSuccess(toastId, "Machine purchase deleted successfully!");
        } catch (error) {
          console.error("Error deleting machine purchase:", error);
          dismissAndError(toastId, `Failed to delete: ${error.response?.data?.message || error.message}`);
        }
      }
    );
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
        showWarning("Please add at least one purchase item (fabric, buttons, or packets)");
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
      showSuccess(editPurchase ? "Purchase updated successfully!" : "Purchase created successfully!");
    } catch (error) {
      console.error("Error saving purchase:", error);

      if (error.response?.status === 400 && error.response?.data?.message?.includes("already exists")) {
        showError("This order already has a purchase. The form has been populated with existing data. Please update the values and try again.");
      } else {
        showError(`Failed to save purchase: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMachineSubmit = async (data) => {
    const toastId = showLoading("Saving machine purchase...");
    try {
      await createMachinePurchase(data);
      setShowMachineForm(false);
      setEditMachine(null);
      await fetchMachinePurchases();
      dismissAndSuccess(toastId, "Machine purchase saved successfully!");
    } catch (error) {
      console.error("Error creating machine purchase:", error);
      dismissAndError(toastId, `Failed to save: ${error.response?.data?.message || error.message}`);
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
      showError("Failed to load purchase data");
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
      key: "PURNo",
      label: "PUR",
      width: "5%",
      render: (p) => <span className="font-medium text-[10px]">{p.PURNo || "—"}</span>
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
      render: (p) => (
        <span className={`px-1 py-0.5 rounded text-[8px] font-medium inline-block ${p.orderType === "JOB-Works"
          ? "bg-purple-100 text-purple-700"
          : p.orderType === "Own-Orders"
            ? "bg-teal-100 text-teal-700"
            : "bg-blue-100 text-blue-700"
          }`}>
          {p.orderType === "JOB-Works" ? "JOB" : p.orderType === "Own-Orders" ? "OWN" : "FOB"}
        </span>
      )
    },
    {
      key: "status",
      label: "Status",
      width: "5%",
      render: (p) => {
        const status = p.status || "Pending";
        const styles = {
          Pending: "bg-red-500 text-white",
          Partial: "bg-orange-100 text-orange-700",
          Completed: "bg-green-500 text-white",
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

        return (
          <div className="space-y-1">
            {p.products.map((prod, i) => (
              <div
                key={i}
                className="px-1 py-1 border border-gray-300 rounded text-[9px] leading-tight"
              >
                <div className="font-medium text-gray-800 break-words">
                  {prod.productDetails?.name || "—"}
                </div>
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
        if (!p.products || p.products.length === 0) {
          return <span className="text-gray-400 text-[10px]">—</span>;
        }

        return (
          <div className="space-y-1">
            {p.products.map((prod, i) => (
              <div
                key={i}
                className="px-1 py-1 border border-gray-300 rounded text-[9px] leading-tight break-words"
              >
                {prod.productDetails?.fabricType || "—"}
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

        return (
          <div className="space-y-1">
            {p.products.map((prod, i) => (
              <div
                key={i}
                className="px-1 py-1 border border-gray-300 rounded text-[9px] leading-tight break-words"
              >
                {prod.productDetails?.color || "—"}
              </div>
            ))}
          </div>
        );
      }
    },
    {
      key: "sizeQty",
      label: "Size & Qty",
      width: "16%",
      render: (p) => {
        if (!p.products || p.products.length === 0) {
          return <span className="text-gray-400 text-[8px]">—</span>;
        }

        return (
          <div className="space-y-1">
            {p.products.map((prod, i) => {
              const sizeQtyStr = prod.sizes
                ?.map(s => `${s.size}:${s.qty}`)
                .join(", ") || "—";
              return (
                <div
                  key={i}
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
                <Plus className="w-4 h-4 mr-2" /> New Machine Purchase
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
              {[
                { key: "all", label: "All Purchases", count: purchases.length },
                { key: "pending", label: "Pending", count: purchases.filter(p => p.status === "Pending" || !p.status).length },
                { key: "completed", label: "Completed", count: purchases.filter(p => p.status === "Completed").length },
                { key: "machines", label: "Machines", count: machinePurchases.length }
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
              <div className="w-full overflow-x-hidden">
                <DataTable
                  columns={columns}
                  data={filteredPurchases}
                  actions={actions}
                />
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



