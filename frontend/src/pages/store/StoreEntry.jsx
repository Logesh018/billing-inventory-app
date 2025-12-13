import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getStoreEntries, deleteStoreEntry, getPendingPurchasesForStoreEntry } from "../../api/storeEntryApi";
import StoreEntryForm from "./StoreEntryForm";
import DataTable from "../../components/UI/DataTable";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import { useFormNavigation } from "../../utils/FormExitModal";
import { showSuccess, showError, showConfirm, showLoading, dismissAndSuccess, dismissAndError } from "../../utils/toast";

export default function StoreEntry() {
  const { user } = useAuth();
  const [storeEntries, setStoreEntries] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null); // NEW: For create mode
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setIsFormOpen, registerFormClose, unregisterFormClose } = useFormNavigation();

  const isAdmin = user?.role === "Admin" || user?.role === "SuperAdmin";

  useEffect(() => {
    fetchStoreEntriesAndPending();
  }, []);

  useEffect(() => {
    if (showForm) {
      setIsFormOpen(true);
      registerFormClose(() => {
        setShowForm(false);
        setEditEntry(null);
        setSelectedPurchase(null);
      });
    } else {
      setIsFormOpen(false);
      unregisterFormClose();
    }
    return () => {
      unregisterFormClose();
    };
  }, [showForm, setIsFormOpen, registerFormClose, unregisterFormClose]);

  const fetchStoreEntriesAndPending = async () => {
    try {
      setLoading(true);

      // Fetch completed store entries
      const entriesRes = await getStoreEntries({ status: 'Completed' });
      const completedEntries = Array.isArray(entriesRes.data) ? entriesRes.data : [];

      // Fetch pending purchases (completed purchases without store entries)
      const pendingRes = await getPendingPurchasesForStoreEntry();
      const pendingPurchases = Array.isArray(pendingRes.data) ? pendingRes.data : [];

      // Merge data: pending purchases appear as "Pending" entries
      const mergedData = [
        ...pendingPurchases.map(p => ({
          _id: p._id,
          isPending: true, // Flag to identify pending
          purchaseData: p, // Store full purchase data for form
          // Display fields
          serialNo: null,
          storeId: null,
          PURNo: p.PURNo,
          purchaseDate: p.purchaseDate,
          orderId: p.orderId || p.order?.orderId,
          orderDate: p.orderDate || p.order?.orderDate,
          PoNo: p.PoNo,
          orderType: p.orderType,
          buyerCode: p.buyerCode || p.order?.buyerDetails?.code,
          PESNo: p.PESNo,
          estimationDate: p.estimationDate,
          entries: [], // Empty for pending
          totalStoreInQty: 0,
          totalShortage: 0,
          totalSurplus: 0,
          status: "Pending",
          storeEntryDate: null
        })),
        ...completedEntries
      ];

      setStoreEntries(mergedData);
      setError(null);
    } catch (err) {
      console.error("Error fetching store entries:", err);
      setError("Failed to fetch store entries");
      setStoreEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    showConfirm(
      "Are you sure you want to delete this store entry? This action cannot be undone.",
      async () => {
        const toastId = showLoading("Deleting store entry...");
        try {
          await deleteStoreEntry(id);
          await fetchStoreEntriesAndPending();
          dismissAndSuccess(toastId, "Store entry deleted successfully!");
        } catch (error) {
          console.error("Error deleting store entry:", error);
          dismissAndError(toastId, `Failed to delete: ${error.response?.data?.message || error.message}`);
        }
      }
    );
  };

  const handleCreateStoreEntry = (entry) => {
    // Open form with purchase data pre-filled
    setSelectedPurchase(entry.purchaseData);
    setEditEntry(null);
    setShowForm(true);
  };

  const handleFormSubmit = async () => {
    try {
      await fetchStoreEntriesAndPending();
      setShowForm(false);
      setEditEntry(null);
      setSelectedPurchase(null);
      setIsFormOpen(false);
      showSuccess(editEntry ? "Store entry updated successfully!" : "Store entry created successfully!");
    } catch (error) {
      console.error("Error in form submit:", error);
      showError(`Failed to save: ${error.response?.data?.message || error.message}`);
    }
  };

  const filteredEntries = filter === "all"
    ? storeEntries
    : storeEntries.filter((e) => {
      if (filter === "completed") return e.status === "Completed";
      if (filter === "pending") return e.status === "Pending";
      return true;
    });

  const columns = [
    {
      key: "serialNo",
      label: "S.NO",
      width: "3%",
      render: (e) => (
        <div className="font-mono text-[9px] font-semibold text-gray-700">
          {e.serialNo || "—"}
        </div>
      )
    },
    {
      key: "storeId",
      label: "STORE ID",
      width: "5%",
      render: (e) => (
        <div className="font-medium text-[9px] leading-tight break-words">
          <div className="text-gray-800 font-semibold text-[9px]">{e.storeId || "—"}</div>
        </div>
      )
    },
    {
      key: "storeEntryDate",
      label: "ENTRY DATE",
      width: "5%",
      render: (e) => (
        <div className="text-[9px] font-semibold leading-tight">
          {e.storeEntryDate ? new Date(e.storeEntryDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
          }) : "—"}
        </div>
      )
    },
    {
      key: "PURNo",
      label: "PUR ID",
      width: "5%",
      render: (e) => (
        <div className="font-medium text-[9px] leading-tight break-words">
          <div className="text-gray-800 font-semibold text-[9px]">{e.PURNo || "—"}</div>
        </div>
      )
    },
    {
      key: "purchaseDate",
      label: "P DATE",
      width: "5%",
      render: (e) => (
        <div className="text-[9px] font-semibold leading-tight">
          {e.purchaseDate ? new Date(e.purchaseDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
          }) : "—"}
        </div>
      )
    },
    {
      key: "orderId",
      label: "ORDER ID",
      width: "6%",
      render: (e) => (
        <div className="font-medium text-[9px] leading-tight break-words">
          <div className="text-gray-800 font-semibold text-[9px]">{e.orderId || "—"}</div>
        </div>
      )
    },
    {
      key: "orderDate",
      label: "O DATE",
      width: "5%",
      render: (e) => (
        <div className="text-[9px] font-semibold leading-tight">
          {e.orderDate ? new Date(e.orderDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
          }) : "—"}
        </div>
      )
    },
    {
      key: "orderType",
      label: "O TYPE",
      width: "5%",
      render: (e) => (
        <span className={`px-1 py-0.5 rounded text-[9px] font-medium inline-block ${
          e.orderType === "JOB-Works"
            ? "bg-purple-100 text-purple-700"
            : e.orderType === "Own-Orders"
            ? "bg-teal-100 text-teal-700"
            : "bg-blue-100 text-blue-700"
        }`}>
          {e.orderType === "JOB-Works" ? "JOB" : e.orderType === "Own-Orders" ? "OWN" : "FOB"}
        </span>
      )
    },
    {
      key: "buyerCode",
      label: "BUYER",
      width: "5%",
      render: (e) => (
        <div className="text-[9px] font-semibold leading-tight">
          {e.buyerCode || "—"}
        </div>
      )
    },
    {
      key: "itemsCount",
      label: "ITEMS",
      width: "4%",
      render: (e) => (
        <div className="text-center">
          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[9px] font-semibold">
            {e.entries?.length || 0}
          </span>
        </div>
      )
    },
    {
      key: "totalStoreInQty",
      label: "STORE QTY",
      width: "6%",
      render: (e) => (
        <div className="text-[9px] font-bold text-green-600 text-center">
          {e.totalStoreInQty?.toLocaleString() || "—"}
        </div>
      )
    },
    {
      key: "shortage",
      label: "SHORTAGE",
      width: "5%",
      render: (e) => (
        <div className={`text-[9px] font-bold text-center ${
          e.totalShortage > 0 ? "text-red-600" : "text-gray-400"
        }`}>
          {e.totalShortage > 0 ? e.totalShortage.toLocaleString() : "—"}
        </div>
      )
    },
    {
      key: "surplus",
      label: "SURPLUS",
      width: "5%",
      render: (e) => (
        <div className={`text-[9px] font-bold text-center ${
          e.totalSurplus > 0 ? "text-green-600" : "text-gray-400"
        }`}>
          {e.totalSurplus > 0 ? e.totalSurplus.toLocaleString() : "—"}
        </div>
      )
    },
    {
      key: "status",
      label: "STATUS",
      width: "6%",
      render: (e) => {
        const status = e.status || "Pending";
        const styles = {
          Pending: "bg-orange-500 text-white",
          Completed: "bg-green-500 text-white",
        };
        return (
          <span className={`px-2 py-1 rounded text-[9px] font-medium inline-block ${styles[status] || "bg-gray-100 text-gray-700"}`}>
            {status}
          </span>
        );
      }
    }
  ];

  // Conditional actions based on entry status
  const getActionsForEntry = (entry) => {
    if (!isAdmin) return [];

    if (entry.isPending) {
      // Pending entry - show "Create Store Entry" button only
      return [
        {
          label: "Create Store Entry",
          icon: Package,
          className: "bg-green-500 text-white hover:bg-green-600",
          onClick: () => handleCreateStoreEntry(entry)
        }
      ];
    } else {
      // Completed entry - show Edit and Delete buttons
      return [
        {
          label: "Edit",
          icon: Edit,
          className: "bg-blue-500 text-white hover:bg-blue-600",
          onClick: () => {
            setEditEntry(entry);
            setSelectedPurchase(null);
            setShowForm(true);
          }
        },
        {
          label: "Delete",
          icon: Trash2,
          className: "bg-red-500 text-white hover:bg-red-600",
          onClick: () => handleDelete(entry._id)
        }
      ];
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading store entries...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showForm ? (
        <StoreEntryForm
          purchaseData={selectedPurchase} // NEW: Pass purchase data for create mode
          initialValues={editEntry} // Pass existing data for edit mode
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditEntry(null);
            setSelectedPurchase(null);
          }}
          isEditMode={!!editEntry}
        />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Store Entry Management</h1>
              <p className="text-gray-600 text-sm mt-1">
                Track and manage warehouse material receipts and inventory intake
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="border-b border-gray-200">
            <div className="flex space-x-4">
              {[
                { key: "all", label: "All Entries", count: storeEntries.length },
                { key: "pending", label: "Pending", count: storeEntries.filter(e => e.status === "Pending").length },
                { key: "completed", label: "Completed", count: storeEntries.filter(e => e.status === "Completed").length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`py-2 px-3 text-sm font-medium rounded-t-lg transition-colors ${
                    filter === tab.key
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

          {filteredEntries.length > 0 ? (
            <div className="w-full overflow-x-hidden">
              <DataTable
                columns={columns}
                data={filteredEntries}
                actions={getActionsForEntry}
                dynamicActions={true}
              />
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <div className="text-gray-500 text-lg mb-2">No store entries found</div>
              <div className="text-gray-400 text-sm mb-4">
                {filter === "all" 
                  ? "Complete a purchase to create store entries" 
                  : `No ${filter} entries`}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}