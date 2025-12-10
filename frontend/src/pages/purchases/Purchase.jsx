import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getPurchases, createPurchase, updatePurchase, deletePurchase } from "../../api/purchaseApi";
import PurchaseForm from "./PurchaseForm";
import DataTable from "../../components/UI/DataTable";
import { Plus, Edit, Trash2, ShoppingCart } from "lucide-react";
import { getMachinePurchases, createMachinePurchase, deleteMachinePurchase } from "../../api/machinePurchaseApi";
import MachinePurchasesTable from "./MachinePurchasesTable";
import MachinePurchaseForm from "./MachinePurchaseForm";
import { useFormNavigation } from "../../utils/FormExitModal";
import { showSuccess, showError, showWarning, showConfirm, showLoading, dismissAndSuccess, dismissAndError } from "../../utils/toast";

// Helper function to render product details cleanly
const renderProductDetails = (products, key, isArray = false) => {
  if (!products || products.length === 0)
    return <span className="text-gray-400 text-[9px]">—</span>;

  return (
    <div className="space-y-1.5">
      {products.map((p, i) => {
        let value = p.productDetails?.[key];

        // Handle array fields like 'type' or 'style'
        if (isArray) {
          value = Array.isArray(value) ? value.join(", ") : value || "—";
        } else {
          value = value || "—";
        }

        return (
          <div
            key={i}
            className="px-1 py-0 border border-gray-200 rounded text-[8px] font-semibold leading-tight break-words min-h-[20px] flex items-center justify-center"
          >
            {value}
          </div>
        );
      })}
    </div>
  );
};

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
  const { setIsFormOpen, registerFormClose, unregisterFormClose } = useFormNavigation();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = user?.role === "Admin" || user?.role === "SuperAdmin";

  useEffect(() => {
    fetchPurchases();
    fetchMachinePurchases();
  }, [hasAccess]);

  useEffect(() => {
    const isAnyFormOpen = showForm || showMachineForm;

    if (isAnyFormOpen) {
      setIsFormOpen(true);
      registerFormClose(() => {
        setShowForm(false);
        setEditPurchase(null);
        setSelectedOrder(null);
        setShowMachineForm(false);
        setEditMachine(null);
      });
    } else {
      setIsFormOpen(false);
      unregisterFormClose();
    }
    return () => {
      unregisterFormClose();
    };
  }, [showForm, showMachineForm, setIsFormOpen, registerFormClose, unregisterFormClose]);

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
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      const hasPurchaseItems =
        (data.purchaseItems && data.purchaseItems.length > 0 &&
          data.purchaseItems.some(item => item.items && item.items.length > 0));

      if (!hasPurchaseItems) {
        showWarning("Please add at least one purchase item");
        return;
      }

      // ✅ FIX: Use purchaseItems in payload
      const payload = {
        orderId: data.orderId,
        purchaseDate: data.purchaseDate,
        purchaseItems: data.purchaseItems || [], // ✅ NEW FORMAT
        remarks: data.remarks,
      };

      console.log("📤 Submitting purchase payload:", payload);

      if (editPurchase && editPurchase._id) {
        await updatePurchase(editPurchase._id, payload);
        showSuccess("Purchase updated successfully!");
      } else {
        const response = await createPurchase(payload);

        if (response.data.wasUpdated) {
          showSuccess("Existing purchase updated successfully!");
        } else {
          showSuccess("Purchase created successfully!");
        }
      }

      setShowForm(false);
      setEditPurchase(null);
      setSelectedOrder(null);
      setIsFormOpen(false);
      await fetchPurchases();

    } catch (error) {
      console.error("Error saving purchase:", error);
      showError(`Failed to save purchase: ${error.response?.data?.message || error.message}`);
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
          orderId: purchase.orderId,  // ✅ FIXED: Use purchase.orderId directly
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
      key: "serialNo",
      label: "S.NO",
      width: "3%",
      render: (p) => (
        <div className="font-mono text-[9px] font-semibold text-gray-700">
          {p.serialNo || "—"}
        </div>
      )
    },
    {
      key: "PURNo",
      label: "PUR ID",
      width: "5%",
      render: (p) => (
        <div className="font-medium text-[9px] leading-tight break-words">
          <div className="text-gray-800 font-semibold text-[9px] mt-0.5">{p.PURNo || "—"}</div>
        </div>
      )
    },
    {
      key: "purchaseDate",
      label: "P DATE",
      width: "5%",
      render: (p) => (
        <div className="text-[9px] font-semibold leading-tight">
          {p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
          }) : "—"}
        </div>
      )
    },
    {
      key: "orderId",
      label: "ODR ID",
      width: "6%",
      render: (p) => (
        <div className="font-medium text-[9px] leading-tight break-words">
          <div className="text-gray-800 font-semibold text-[9px] mt-0.5">{p.order?.orderId || p.orderId || "—"}</div>
        </div>
      )
    },
    {
      key: "orderDate",
      label: "O DATE",
      width: "5%",
      render: (p) => (
        <div className="text-[9px] font-semibold leading-tight">
          {p.order?.orderDate ? new Date(p.order.orderDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
          }) : p.orderDate ? new Date(p.orderDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
          }) : "—"}
        </div>
      )
    },
    {
      key: "orderType",
      label: "O Type",
      width: "5%",
      render: (p) => (
        <span className={`px-1 py-0.5 rounded text-[9px] font-medium inline-block ${p.orderType === "JOB-Works"
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
      key: "buyerId",
      label: "BUYER ID",
      width: "6%",
      render: (p) => (
        <div className="text-[9px] leading-tight break-words">
          <div className="font-semibold text-gray-800">{p.order?.buyerDetails?.code || p.buyerCode || "—"}</div>
        </div>
      )
    },
    {
      key: "estimationId",
      label: "EST ID",
      width: "6%",
      render: (p) => (
        <div className="font-medium text-[9px] leading-tight break-words">
          <div className="text-gray-800 font-semibold text-[9px] mt-0.5">
            {p.PESNo || "—"}
          </div>
        </div>
      )
    },
    {
      key: "estimationDate",
      label: "EST DATE",
      width: "6%",
      render: (p) => (
        <div className="text-[9px] font-semibold leading-tight">
          {p.estimationDate ? new Date(p.estimationDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
          }) : "—"}
        </div>
      )
    },
    {
      key: "products",
      label: "PRODUCT",
      width: "12%",
      render: (p) => renderProductDetails(p.products || p.order?.products, 'name'),
    },
    {
      key: "fabric",
      label: "FABRIC",
      width: "8%",
      render: (p) => renderProductDetails(p.products || p.order?.products, 'fabric'), // Changed from 'fabricType'
    },
    {
      key: "color",
      label: "COLOR",
      width: "6%",
      render: (p) => renderProductDetails(p.products || p.order?.products, 'color'),
    },
    {
      key: "sizeQty",
      label: "Size & Qty",
      width: "15%",
      render: (p) => {
        const products = p.products || p.order?.products;
        if (!products || products.length === 0)
          return <span className="text-gray-800 text-[9px]">—</span>;

        return (
          <div className="space-y-1.5">
            {products.map((product, i) => (
              <div
                key={i}
                className="px-0.5 py-1 border border-gray-200 rounded text-gray-800 font-mono text-[8px] leading-tight break-words min-h-[15px] flex items-center"
              >
                {product.sizes?.map((s) => `${s.size}:${s.qty}`).join(", ") || "—"}
              </div>
            ))}
          </div>
        );
      },
    },
    {
      key: "totalQty",
      label: "TOTAL",
      width: "5%",
      render: (p) => {
        const products = p.products || p.order?.products;
        if (!products || products.length === 0) {
          return (
            <div className="flex flex-col justify-end">
              <span className="font-extrabold text-green-600 text-[10px] bg-green-50 p-1 rounded-sm text-center mt-auto">
                {p.totalQty || p.order?.totalQty || 0}
              </span>
            </div>
          );
        }
        return (
          <div className="flex flex-col">
            <div className="space-y-2 mt-1 mb-1">
              {products.map((prod, i) => {
                const productTotal = (prod.sizes || []).reduce((sum, s) => sum + (s.qty || 0), 0);
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
              {p.totalQty || p.order?.totalQty || 0}
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      label: "STATUS",
      width: "7%",
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