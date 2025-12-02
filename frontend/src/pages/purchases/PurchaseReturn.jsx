import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { 
  getPurchaseReturns, 
  createPurchaseReturn, 
  updatePurchaseReturnStatus, 
  deletePurchaseReturn 
} from "../../api/purchaseReturnApi";
import PurchaseReturnForm from "./PurchaseReturnForm";
import DataTable from "../../components/UI/DataTable";
import { Plus, Edit, Trash2, FileText, Eye, Download } from "lucide-react";
import { showSuccess, showError, showWarning, showConfirm, showLoading, dismissAndSuccess, dismissAndError } from "../../utils/toast";

// Helper function to render product details cleanly
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

export default function PurchaseReturn() {
  const { user } = useAuth();
  const [returns, setReturns] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editReturn, setEditReturn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = user?.role === "Admin" || user?.role === "SuperAdmin";

  useEffect(() => {
    fetchReturns();
  }, [filter]);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const params = filter !== "all" ? { status: capitalizeFirst(filter) } : {};
      const res = await getPurchaseReturns(params);
      const data = Array.isArray(res.data) ? res.data : [];
      setReturns(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setError(null);
    } catch (err) {
      console.error("❌ CLIENT: Error fetching returns", err);
      setError("Failed to fetch purchase returns");
      setReturns([]);
    } finally {
      setLoading(false);
    }
  };

  const capitalizeFirst = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  const handleDelete = async (id) => {
    showConfirm(
      "Are you sure you want to delete this purchase return? This will also delete the linked debit note.",
      async () => {
        const toastId = showLoading("Deleting purchase return...");
        try {
          await deletePurchaseReturn(id);
          await fetchReturns();
          dismissAndSuccess(toastId, "Purchase return deleted successfully!");
        } catch (error) {
          console.error("❌ CLIENT: Error deleting return:", error);
          dismissAndError(toastId, `Failed to delete: ${error.response?.data?.message || error.message}`);
        }
      }
    );
  };

  const handleStatusChange = async (returnId, newStatus) => {
    const toastId = showLoading(`Updating status to ${newStatus}...`);
    try {
      await updatePurchaseReturnStatus(returnId, newStatus);
      await fetchReturns();
      dismissAndSuccess(toastId, `Status updated to ${newStatus}!`);
    } catch (error) {
      console.error("❌ CLIENT: Error updating status:", error);
      dismissAndError(toastId, `Failed to update: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleFormSubmit = async (data) => {
    if (isSubmitting) {
      console.log("⚠️ CLIENT: Already submitting, ignoring duplicate request");
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("📤 CLIENT: Submitting purchase return:", data);

      if (editReturn && editReturn._id) {
        console.log("📝 CLIENT: Updating existing return:", editReturn._id);
        // Note: Update functionality can be added later if needed
        showWarning("Edit functionality coming soon");
      } else {
        console.log("📝 CLIENT: Creating new return");
        await createPurchaseReturn(data);
        showSuccess("Purchase return created successfully!");
      }

      setShowForm(false);
      setEditReturn(null);
      await fetchReturns();
    } catch (error) {
      console.error("❌ CLIENT: Error saving return:", error);
      showError(`Failed to save: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDebitNote = (returnData) => {
    if (returnData.debitNote?.pdfUrl) {
      window.open(returnData.debitNote.pdfUrl, '_blank');
    } else {
      showWarning("Debit note PDF not available");
    }
  };

  const filteredReturns = returns;

  const columns = [
    {
      key: "serialNo",
      label: "S.NO",
      width: "3%",
      render: (r) => (
        <div className="font-mono text-[9px] font-semibold text-gray-700">
          {r.serialNo || "—"}
        </div>
      )
    },
    {
      key: "PURTNo",
      label: "RETURN ID",
      width: "6%",
      render: (r) => (
        <div className="font-medium text-[9px] leading-tight break-words">
          <div className="text-orange-800 font-semibold text-[9px] mt-0.5">{r.PURTNo || "—"}</div>
        </div>
      )
    },
    {
      key: "returnDate",
      label: "RETURN DATE",
      width: "5%",
      render: (r) => (
        <div className="text-[9px] font-semibold leading-tight">
          {r.returnDate ? new Date(r.returnDate).toLocaleDateString('en-IN', {
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
      render: (r) => (
        <div className="font-medium text-[9px] leading-tight break-words">
          <div className="text-gray-800 font-semibold text-[9px] mt-0.5">{r.PURNo || "—"}</div>
        </div>
      )
    },
    {
      key: "purchaseDate",
      label: "P DATE",
      width: "5%",
      render: (r) => (
        <div className="text-[9px] font-semibold leading-tight">
          {r.purchaseDate ? new Date(r.purchaseDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
          }) : "—"}
        </div>
      )
    },
    {
      key: "PoNo",
      label: "ODR ID",
      width: "6%",
      render: (r) => (
        <div className="font-medium text-[9px] leading-tight break-words">
          <div className="text-gray-800 font-semibold text-[9px] mt-0.5">{r.PoNo || "—"}</div>
        </div>
      )
    },
    {
      key: "orderType",
      label: "O Type",
      width: "5%",
      render: (r) => (
        <span className={`px-1 py-0.5 rounded text-[9px] font-medium inline-block ${
          r.orderType === "JOB-Works"
            ? "bg-purple-100 text-purple-700"
            : r.orderType === "Own-Orders"
            ? "bg-teal-100 text-teal-700"
            : "bg-blue-100 text-blue-700"
        }`}>
          {r.orderType === "JOB-Works" ? "JOB" : r.orderType === "Own-Orders" ? "OWN" : "FOB"}
        </span>
      )
    },
    {
      key: "vendor",
      label: "VENDOR",
      width: "8%",
      render: (r) => (
        <div className="text-[9px] leading-tight break-words">
          <div className="font-semibold text-gray-800">{r.vendor?.name || "—"}</div>
          <div className="text-gray-500 text-[8px]">{r.vendor?.code || ""}</div>
        </div>
      )
    },
    {
      key: "returnItems",
      label: "RETURN ITEMS",
      width: "15%",
      render: (r) => {
        if (!r.returnItems || r.returnItems.length === 0)
          return <span className="text-gray-400 text-[9px]">—</span>;

        return (
          <div className="space-y-1">
            {r.returnItems.map((item, i) => (
              <div
                key={i}
                className="px-1 py-1 border border-gray-200 rounded text-[8px] leading-tight break-words bg-orange-50"
              >
                <div className="font-semibold text-gray-800">{item.itemName}</div>
                <div className="text-gray-600">
                  Qty: {item.returnQuantity} {item.purchaseUnit} • 
                  Reason: {item.returnReason?.replace(/-/g, ' ')}
                </div>
              </div>
            ))}
          </div>
        );
      }
    },
    {
      key: "totalReturn",
      label: "RETURN VALUE",
      width: "8%",
      render: (r) => (
        <div className="text-right">
          <div className="text-[9px] text-gray-600">Base: ₹{(r.totalReturnValue || 0).toFixed(2)}</div>
          <div className="text-[10px] font-bold text-orange-600">
            Total: ₹{(r.totalReturnWithGst || 0).toFixed(2)}
          </div>
        </div>
      )
    },
    {
      key: "debitNote",
      label: "DEBIT NOTE",
      width: "7%",
      render: (r) => (
        <div className="text-[9px] leading-tight">
          {r.debitNoteNumber ? (
            <>
              <div className="font-semibold text-red-600">{r.debitNoteNumber}</div>
              {r.debitNote?.pdfUrl && (
                <FileText className="w-3 h-3 text-green-600 mx-auto mt-0.5" />
              )}
            </>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </div>
      )
    },
    {
      key: "status",
      label: "STATUS",
      width: "7%",
      render: (r) => (
        <select
          value={r.status || "Pending"}
          onChange={(e) => handleStatusChange(r._id, e.target.value)}
          className={`w-full text-white px-1 py-0.5 rounded text-[9px] font-medium ${
            r.status === "Approved"
              ? "bg-green-500"
              : r.status === "Rejected"
              ? "bg-red-500"
              : r.status === "Completed"
              ? "bg-blue-500"
              : "bg-yellow-500"
          }`}
        >
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Completed">Completed</option>
        </select>
      )
    },
  ];

  const actions = isAdmin ? [
    {
      label: "View Debit Note",
      icon: Eye,
      className: "bg-red-500 text-white hover:bg-red-600",
      onClick: handleViewDebitNote,
      disabled: (r) => !r.debitNote?.pdfUrl
    },
    {
      label: "Delete",
      icon: Trash2,
      className: "bg-red-500 text-white hover:bg-red-600",
      onClick: (returnData) => handleDelete(returnData._id),
    },
  ] : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading purchase returns...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showForm ? (
        <PurchaseReturnForm
          initialValues={editReturn}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditReturn(null);
          }}
          submitLabel={editReturn ? "Update Return" : "Create Return"}
          isEditMode={!!editReturn}
          isSubmitting={isSubmitting}
        />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Purchase Return Management</h1>
              <p className="text-gray-600 text-sm mt-1">
                Manage goods returns and generate debit notes automatically
              </p>
            </div>

            {isAdmin && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" /> New Return
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
                { key: "all", label: "All Returns", count: returns.length },
                { key: "pending", label: "Pending", count: returns.filter(r => r.status === "Pending").length },
                { key: "approved", label: "Approved", count: returns.filter(r => r.status === "Approved").length },
                { key: "rejected", label: "Rejected", count: returns.filter(r => r.status === "Rejected").length },
                { key: "completed", label: "Completed", count: returns.filter(r => r.status === "Completed").length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`py-2 px-3 text-sm font-medium rounded-t-lg transition-colors ${
                    filter === tab.key
                      ? "bg-white text-orange-600 border-t-2 border-orange-500"
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

          {filteredReturns.length > 0 ? (
            <div className="w-full overflow-x-hidden">
              <DataTable
                columns={columns}
                data={filteredReturns}
                actions={actions}
              />
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-gray-500 text-lg mb-2">No purchase returns found</div>
              <div className="text-gray-400 text-sm mb-4">
                {filter === "all" 
                  ? "No returns created yet" 
                  : `No ${filter} returns`
                }
              </div>
              {isAdmin && filter === "all" && (
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-2" /> Create First Return
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}