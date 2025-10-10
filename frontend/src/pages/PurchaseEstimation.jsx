import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getPurchaseEstimations,
  createPurchaseEstimation,
  updatePurchaseEstimation,
  deletePurchaseEstimation,
  getEstimationPDF,
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

  // Fast PDF viewing - checks if PDF exists first
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
        (data.packetsPurchases && data.packetsPurchases.length > 0) ||
        (data.machinesPurchases && data.machinesPurchases.length > 0);

      if (!hasPurchaseItems) {
        alert("Please add at least one purchase item (fabric, buttons, packets, or machine)");
        return;
      }

      // Create the payload with all the required fields
      const payload = {
        estimationType: data.estimationType,
        estimationDate: data.estimationDate,
        fabricPurchases: data.fabricPurchases || [],
        buttonsPurchases: data.buttonsPurchases || [],
        packetsPurchases: data.packetsPurchases || [],
        machinesPurchases: data.machinesPurchases || [],
        remarks: data.remarks,
      };

      // Add order-specific fields if it's an order estimation
      if (data.estimationType === 'order') {
        payload.PoNo = data.PoNo || null;
        payload.order = data.order || null;
        payload.orderDate = data.orderDate || null;
        payload.orderType = data.orderType || null;
        payload.buyerDetails = data.buyerDetails || null;
        payload.orderProducts = data.orderProducts || [];
        payload.totalOrderQty = data.totalOrderQty || 0;
      }

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
      width: "65px",
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
      label: "PES-No",
      width: "60px",
      render: (e) => <span className="font-medium text-xs">{e.PESNo || "—"}</span>
    },
    {
      key: "PoNo",
      label: "PO No",
      width: "75px",
      render: (e) => (
        <div className="font-medium text-[11px]" title={e.PoNo}>
          {truncate(e.PoNo, 12) || "—"}
        </div>
      )
    },
    {
      key: "buyerCode",
      label: "Buyer",
      width: "60px",
      render: (e) => (
        <div className="text-[11px]" title={e.buyerDetails?.code}>
          {truncate(e.buyerDetails?.code, 8) || "—"}
        </div>
      )
    },
    {
      key: "orderType",
      label: "Type",
      width: "60px",
      render: (e) => {
        if (e.estimationType === "machine") {
          return (
            <span className="px-1 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
              Machine
            </span>
          );
        }
        return (
          <span className={`px-1 py-0.5 rounded text-xs font-medium ${e.orderType === "JOB-Works"
            ? "bg-purple-100 text-purple-700"
            : "bg-blue-100 text-blue-700"
            }`}>
            {e.orderType === "JOB-Works" ? "JOB-Works" : "FOB"}
          </span>
        );
      }
    },
    {
      key: "status",
      label: "Status",
      width: "65px",
      render: (e) => {
        const status = e.status || "Draft";
        const styles = {
          Draft: "bg-yellow-100 text-yellow-700",
          Finalized: "bg-green-500 text-white",
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
      render: (e) => {
        if (e.estimationType === "machine") {
          return (
            <div className="text-xs">
              <div className="truncate">Machine</div>
            </div>
          );
        }

        if (!e.orderProducts || e.orderProducts.length === 0) {
          return <span className="text-gray-400 text-xs">—</span>;
        }

        const productNames = e.orderProducts.map(prod => prod.productName);

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
      render: (e) => {
        if (e.estimationType === "machine") {
          return <span className="text-gray-400 text-xs">—</span>;
        }

        if (!e.orderProducts || e.orderProducts.length === 0) return <span className="text-gray-400 text-xs">—</span>;

        const types = [...new Set(e.orderProducts.map(prod => prod.fabricType))];

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
      render: (e) => {
        if (e.estimationType === "machine") {
          return <span className="text-gray-400 text-xs">—</span>;
        }

        if (!e.orderProducts || e.orderProducts.length === 0) {
          return <span className="text-gray-400 text-xs">—</span>;
        }

        const colorData = {};

        e.orderProducts.forEach(product => {
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
      render: (e) => {
        if (e.estimationType === "machine") {
          return <span className="text-gray-400 text-xs">—</span>;
        }

        if (!e.orderProducts || e.orderProducts.length === 0) {
          return <span className="text-gray-400 text-xs">—</span>;
        }

        const colorData = {};

        e.orderProducts.forEach(product => {
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
      render: (e) => {
        if (e.estimationType === "machine") {
          const machineCount = e.machinesPurchases?.length || 0;
          return (
            <span className="font-semibold text-blue-600 text-sm">
              {machineCount || 0}
            </span>
          );
        }

        return (
          <span className="font-semibold text-blue-600 text-sm">
            {e.totalOrderQty || 0}
          </span>
        );
      }
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
            estimationType: 'order',
            estimationDate: new Date().toISOString().split('T')[0],
            fabricPurchases: [],
            buttonsPurchases: [],
            packetsPurchases: [],
            machinesPurchases: [],
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