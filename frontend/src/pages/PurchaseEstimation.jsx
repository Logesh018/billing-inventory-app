import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getPurchaseEstimations,
  createPurchaseEstimation,
  updatePurchaseEstimation,
  deletePurchaseEstimation,
  getEstimationPDF,  // ← NEW - Fast check
  generateEstimationPDF
} from "../api/purchaseEstimationApi";
import PurchaseEstimationForm from "../components/Forms/PurchaseEstimationForm";
import DataTable from "../components/UI/DataTable";
import { Plus, Edit, Trash2, FileText, Printer, Eye } from "lucide-react";

export default function PurchaseEstimation() {
  const { user } = useAuth();
  const [estimations, setEstimations] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editEstimation, setEditEstimation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(null);

  const isAdmin = user?.role === "Admin" || user?.role === "SuperAdmin";

  useEffect(() => {
    fetchEstimations();
  }, []);

  const fetchEstimations = async () => {
    try {
      setLoading(true);
      const res = await getPurchaseEstimations();
      const data = Array.isArray(res.data) ? res.data : [];
      setEstimations(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setError(null);
    } catch (err) {
      console.error("Error fetching estimations", err);
      setError("Failed to fetch estimations");
      setEstimations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this estimation? This action cannot be undone.")) {
      try {
        await deletePurchaseEstimation(id);
        await fetchEstimations();
      } catch (error) {
        console.error("Error deleting estimation:", error);
        alert(`Failed to delete estimation: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  // NEW: Fast PDF viewing - checks if PDF exists first
  const handleViewPDF = async (estimation) => {
    try {
      // If PDF URL exists in the estimation object, open it immediately
      if (estimation.pdfUrl) {
        console.log("✅ Opening existing PDF:", estimation.pdfUrl);
        window.open(estimation.pdfUrl, '_blank');
        return;
      }

      // If no PDF URL, check the server (in case it was generated but state is stale)
      console.log("🔍 Checking if PDF exists on server...");
      const response = await getEstimationPDF(estimation._id);

      if (response.data.pdfUrl) {
        console.log("✅ PDF found on server, opening:", response.data.pdfUrl);
        window.open(response.data.pdfUrl, '_blank');
        // Refresh to update the UI
        await fetchEstimations();
      }
    } catch (error) {
      // If PDF doesn't exist, offer to generate it
      if (error.response?.data?.needsGeneration) {
        const shouldGenerate = window.confirm(
          "PDF has not been generated yet. Would you like to generate it now? This may take a few seconds."
        );

        if (shouldGenerate) {
          await handleGeneratePDF(estimation);
        }
      } else {
        console.error("Error viewing PDF:", error);
        alert(`Failed to view PDF: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  // Generate PDF (slower operation)
  const handleGeneratePDF = async (estimation) => {
    try {
      setGeneratingPDF(estimation._id);
      console.log("🔄 Generating PDF for estimation:", estimation.PESNo);

      const response = await generateEstimationPDF(estimation._id);

      // Open PDF in new tab immediately after generation
      if (response.data.pdfUrl) {
        console.log("✅ PDF generated successfully, opening:", response.data.pdfUrl);
        window.open(response.data.pdfUrl, '_blank');
      }

      // Refresh estimations to get updated status
      await fetchEstimations();

      // Show success message
      alert("PDF generated and finalized successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(`Failed to generate PDF: ${error.response?.data?.message || error.message}`);
    } finally {
      setGeneratingPDF(null);
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
        estimationDate: data.estimationDate,
        fabricPurchases: data.fabricPurchases || [],
        buttonsPurchases: data.buttonsPurchases || [],
        packetsPurchases: data.packetsPurchases || [],
        remarks: data.remarks,
      };

      console.log("📤 Submitting estimation payload:", payload);

      if (editEstimation && editEstimation._id) {
        console.log("📝 Updating existing estimation:", editEstimation._id);
        await updatePurchaseEstimation(editEstimation._id, payload);
      } else {
        console.log("📝 Creating new estimation");
        await createPurchaseEstimation(payload);
      }

      setShowForm(false);
      setEditEstimation(null);
      await fetchEstimations();
    } catch (error) {
      console.error("Error saving estimation:", error);
      alert(`Failed to save estimation: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEstimations = filter === "all"
    ? estimations
    : estimations.filter((e) => {
      const status = e.status;
      if (filter === "draft") return status === "Draft" || !status;
      if (filter === "finalized") return status === "Finalized";
      return true;
    });

  const truncate = (str, max = 10) => {
    if (!str) return "—";
    return str.length > max ? str.substring(0, max) + "…" : str;
  };

  const columns = [
    {
      key: "estimationDate",
      label: "Date",
      width: "80px",
      render: (e) => (
        <div className="text-xs">
          {e.estimationDate ? new Date(e.estimationDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
          }) : "—"}
        </div>
      )
    },
    {
      key: "PESNo",
      label: "PES No",
      width: "80px",
      render: (e) => <span className="font-medium text-xs text-blue-600">{e.PESNo || "—"}</span>
    },
    {
      key: "status",
      label: "Status",
      width: "80px",
      render: (e) => {
        const status = e.status || "Draft";
        const styles = {
          Draft: "bg-yellow-100 text-yellow-700",
          Finalized: "bg-green-500 text-white",
        };
        return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${styles[status] || "bg-gray-100 text-gray-700"}`}>
            {status}
          </span>
        );
      }
    },
    {
      key: "items",
      label: "Items",
      width: "100px",
      render: (e) => {
        const fabricCount = e.fabricPurchases?.length || 0;
        const buttonsCount = e.buttonsPurchases?.length || 0;
        const packetsCount = e.packetsPurchases?.length || 0;
        const totalItems = fabricCount + buttonsCount + packetsCount;

        return (
          <div className="text-xs">
            <div className="font-semibold text-gray-800">{totalItems} items</div>
            <div className="text-gray-500 text-[10px]">
              {fabricCount > 0 && `${fabricCount} Fabric`}
              {buttonsCount > 0 && ` ${buttonsCount} Btns`}
              {packetsCount > 0 && ` ${packetsCount} Pkts`}
            </div>
          </div>
        );
      }
    },
    {
      key: "vendors",
      label: "Vendors",
      width: "120px",
      render: (e) => {
        const vendors = new Set();

        e.fabricPurchases?.forEach(f => vendors.add(f.vendor));
        e.buttonsPurchases?.forEach(b => vendors.add(b.vendor));
        e.packetsPurchases?.forEach(p => vendors.add(p.vendor));

        const vendorList = Array.from(vendors);

        return (
          <div className="text-xs" title={vendorList.join(", ")}>
            {vendorList.length > 0 ? (
              vendorList.slice(0, 2).map((vendor, idx) => (
                <div key={idx} className="truncate text-gray-700">
                  {truncate(vendor, 15)}
                </div>
              ))
            ) : (
              <span className="text-gray-400">—</span>
            )}
            {vendorList.length > 2 && (
              <div className="text-[10px] text-blue-600">+{vendorList.length - 2} more</div>
            )}
          </div>
        );
      }
    },
    {
      key: "totalCost",
      label: "Subtotal",
      width: "90px",
      render: (e) => (
        <div className="text-right">
          <span className="font-semibold text-gray-800 text-xs">
            ₹{(e.grandTotalCost || 0).toLocaleString()}
          </span>
        </div>
      )
    },
    {
      key: "gst",
      label: "GST",
      width: "80px",
      render: (e) => {
        const totalGst = (e.totalFabricGst || 0) + (e.totalButtonsGst || 0) + (e.totalPacketsGst || 0);
        return (
          <div className="text-right">
            <span className="text-green-600 text-xs font-medium">
              ₹{totalGst.toLocaleString()}
            </span>
          </div>
        );
      }
    },
    {
      key: "grandTotal",
      label: "Grand Total",
      width: "100px",
      render: (e) => (
        <div className="text-right">
          <span className="font-bold text-blue-600 text-sm">
            ₹{(e.grandTotalWithGst || 0).toLocaleString()}
          </span>
        </div>
      )
    },
    {
      key: "remarks",
      label: "Remarks",
      width: "120px",
      render: (e) => (
        <div className="text-xs text-gray-600" title={e.remarks}>
          {truncate(e.remarks, 20) || "—"}
        </div>
      )
    },
    {
      key: "pdfStatus",
      label: "PDF",
      width: "60px",
      render: (e) => (
        <div className="text-center">
          {e.pdfUrl ? (
            <FileText className="w-4 h-4 text-green-600 mx-auto" title="PDF Available" />
          ) : (
            <span className="text-gray-400 text-[10px]">Not generated</span>
          )}
        </div>
      )
    }
  ];

  const actions = isAdmin ? [
    {
      label: "View PDF",
      icon: Eye,
      className: "bg-blue-500 text-white hover:bg-blue-600",
      onClick: (estimation) => handleViewPDF(estimation),
      // Show for all estimations - will offer to generate if doesn't exist
    },
    {
      label: "Generate PDF",
      icon: Printer,
      className: "bg-purple-500 text-white hover:bg-purple-600",
      onClick: (estimation) => handleGeneratePDF(estimation),
      disabled: (estimation) => generatingPDF === estimation._id || estimation.status === "Finalized",
      // Only show if not finalized yet
    },
    {
      label: "Edit",
      icon: Edit,
      className: "bg-orange-500 text-white hover:bg-orange-600",
      onClick: (estimation) => {
        setEditEstimation(estimation);
        setShowForm(true);
      },
      disabled: (estimation) => estimation.status === "Finalized",
    },
    {
      label: "Delete",
      icon: Trash2,
      className: "bg-red-500 text-white hover:bg-red-600",
      onClick: (estimation) => handleDelete(estimation._id),
    },
  ] : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading estimations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showForm ? (
        <PurchaseEstimationForm
          initialValues={editEstimation || {
            estimationDate: new Date().toISOString().split('T')[0],
            fabricPurchases: [],
            buttonsPurchases: [],
            packetsPurchases: [],
            remarks: "",
          }}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditEstimation(null);
          }}
          submitLabel={editEstimation ? "Update Estimation" : "Create Estimation"}
          isEditMode={!!editEstimation}
        />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Purchase Estimation</h1>
              <p className="text-gray-600 text-sm mt-1">
                Create and manage purchase cost estimations
              </p>
            </div>

            {isAdmin && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" /> New Estimation
              </button>
            )}
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

          <div className="border-b border-gray-200">
            <div className="flex space-x-4 overflow-x-auto pb-2">
              {[
                { key: "all", label: "All", count: estimations.length },
                { key: "draft", label: "Draft", count: estimations.filter(e => e.status === "Draft" || !e.status).length },
                { key: "finalized", label: "Finalized", count: estimations.filter(e => e.status === "Finalized").length },
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

          {filteredEstimations.length > 0 ? (
            <div className="w-full">
              <DataTable
                columns={columns}
                data={filteredEstimations}
                actions={actions}
                className="text-xs compact-table"
              />
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <div className="text-gray-500 text-lg mb-2">No estimations found</div>
              <div className="text-gray-400 text-sm mb-4">
                {filter === "all" ? "No estimations created yet" : `No ${filter} estimations`}
              </div>
              {isAdmin && filter === "all" && (
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-2" /> Create First Estimation
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}