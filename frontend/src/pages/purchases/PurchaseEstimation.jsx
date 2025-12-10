import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getPurchaseEstimations,
  createPurchaseEstimation,
  updatePurchaseEstimation,
  deletePurchaseEstimation,
  getEstimationPDF,
  generateEstimationPDF
} from "../../api/purchaseEstimationApi";
import PurchaseEstimationForm from "./PurchaseEstimationForm.jsx";
import DataTable from "../../components/UI/DataTable.jsx";
import { Plus, Edit, Trash2, FileText, Eye } from "lucide-react";
import { showConfirm, showError, showSuccess, showWarning, showLoading, dismissAndSuccess, dismissAndError } from "../../utils/toast.jsx";

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

        // Calculate total quantity for the product
        const productTotalQty = (p.sizes || []).reduce((sum, s) => sum + (s.qty || 0), 0);

        return (
          <div
            key={i}
            className="px-1 py-0 border border-gray-200 rounded text-[8px] font-semibold leading-tight break-words min-h-[20px] flex items-center justify-center"
          >
            {value}
            {key === 'totalQty' &&
              <div className="font-semibold text-blue-700">{productTotalQty}</div>
            }
          </div>
        );
      })}
    </div>
  );
};

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
      console.error("❌ CLIENT: Error fetching estimations", err);
      setError("Failed to fetch estimations");
      setEstimations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    showConfirm(
      "Are you sure you want to delete this estimation? This action cannot be undone.",
      async () => {
        const toastId = showLoading("Deleting estimation...");
        try {
          await deletePurchaseEstimation(id);
          await fetchEstimations();
          dismissAndSuccess(toastId, "Estimation deleted successfully!");
        } catch (error) {
          console.error("❌ CLIENT: Error deleting estimation:", error);
          dismissAndError(toastId, `Failed to delete: ${error.response?.data?.message || error.message}`);
        }
      }
    );
  };

  // Fast PDF viewing - checks if PDF exists first
  const handleViewPDF = async (estimation) => {
    try {
      // If PDF URL exists in the estimation object, open it immediately
      if (estimation.pdfUrl) {
        console.log("✅ CLIENT: Opening existing PDF:", estimation.pdfUrl);
        window.open(estimation.pdfUrl, '_blank');
        return;
      }

      // If no PDF URL, check the server (in case it was generated but state is stale)
      console.log("🔍 CLIENT: Checking if PDF exists on server...");
      const response = await getEstimationPDF(estimation._id);

      if (response.data.pdfUrl) {
        console.log("✅ CLIENT: PDF found on server, opening:", response.data.pdfUrl);
        window.open(response.data.pdfUrl, '_blank');
        // Refresh to update the UI
        await fetchEstimations();
      }
    } catch (error) {
      // If PDF doesn't exist, offer to generate it
      if (error.response?.data?.needsGeneration) {
        showConfirm(
          "PDF has not been generated yet. Would you like to generate it now? This may take a few seconds.",
          async () => {
            await handleGeneratePDF(estimation);
          }
        );
      } else {
        console.error("❌ CLIENT: Error viewing PDF:", error);
        showError(`Failed to view PDF: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  // Generate PDF (slower operation)
  const handleGeneratePDF = async (estimation) => {
    try {
      setGeneratingPDF(estimation._id);
      console.log("🔄 CLIENT: Generating PDF for estimation:", estimation.PESNo);

      const response = await generateEstimationPDF(estimation._id);

      // Open PDF in new tab immediately after generation
      if (response.data.pdfUrl) {
        console.log("✅ CLIENT: PDF generated successfully, opening:", response.data.pdfUrl);
        window.open(response.data.pdfUrl, '_blank');
      }

      // Refresh estimations to get updated status
      await fetchEstimations();

      // Show success message
      showSuccess("PDF generated and finalized successfully!");
    } catch (error) {
      console.error("❌ CLIENT: Error generating PDF:", error);
      showError(`Failed to generate PDF: ${error.response?.data?.message || error.message}`);
    } finally {
      setGeneratingPDF(null);
    }
  };

  const handleFormSubmit = async (data) => {
    console.log('\n📥 CLIENT: handleFormSubmit called');
    console.log('📦 CLIENT: Received data from form:', JSON.stringify(data, null, 2));

    if (isSubmitting) {
      console.log("⚠️ CLIENT: Already submitting, ignoring duplicate request");
      return;
    }

    try {
      setIsSubmitting(true);

      // ✅ FIXED: Check for purchaseItems instead of old field names
      if (!data.purchaseItems || data.purchaseItems.length === 0) {
        console.log("❌ CLIENT: No purchase items found");
        showWarning("Please add at least one purchase item");
        return;
      }

      console.log(`✅ CLIENT: Found ${data.purchaseItems.length} purchase items`);

      // ✅ FIXED: Send data in the correct format expected by the backend
      const payload = {
        estimationDate: data.estimationDate,
        remarks: data.remarks || "",
        PoNo: data.PoNo || null,
        orderId: data.orderId || null,
        purchaseItems: data.purchaseItems,
        fabricCostEstimation: data.fabricCostEstimation || [],
      };

      console.log("📤 CLIENT: Submitting estimation payload:", JSON.stringify(payload, null, 2));

      if (editEstimation && editEstimation._id) {
        console.log("📝 CLIENT: Updating existing estimation:", editEstimation._id);
        await updatePurchaseEstimation(editEstimation._id, payload);
        showSuccess("Estimation updated successfully!");
      } else {
        console.log("📝 CLIENT: Creating new estimation");
        await createPurchaseEstimation(payload);
        showSuccess("Estimation created successfully!");
      }

      setShowForm(false);
      setEditEstimation(null);
      await fetchEstimations();
    } catch (error) {
      console.error("❌ CLIENT: Error saving estimation:", error);
      console.error("❌ CLIENT: Error response:", error.response?.data);
      showError(`Failed to save estimation: ${error.response?.data?.message || error.message}`);
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

  const columns = [
    {
      key: "serialNo",
      label: "S No",
      width: "4%",
      render: (e) => (
        <div className="font-mono text-[9px] font-semibold text-gray-700">
          {e.sNo}
        </div>
      )
    },
    {
      key: "PoNo",
      label: "ODR ID",
      width: "5%",
      render: (e) => (
        <div className="font-medium text-[9px] leading-tight break-words">
          <div className="text-gray-800 font-semibold text-[9px] mt-0.5">{e.PoNo || "—"}</div>
        </div>
      )
    },
    {
      key: "orderDate",
      label: "ODR Date",
      width: "6%",
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
      key: "buyer",
      label: "BUYER ID",
      width: "7%",
      render: (e) => (
        <div className="text-[9px] leading-tight break-words" title={e.buyerDetails?.name || e.buyer?.name}>
          <div className="font-semibold text-gray-800">{e.buyerDetails?.code || "—"}</div>
        </div>
      )
    },
    {
      key: "PESNo",
      label: "EST ID",
      width: "5%",
      render: (e) => (
        <div className="font-medium text-[9px] leading-tight break-words">
          <div className="text-gray-800 font-semibold text-[9px] mt-0.5">{e.PESNo || "—"}</div>
        </div>
      )
    },
    {
      key: "estimationDate",
      label: "EST Date",
      width: "5%",
      render: (e) => (
        <div className="text-[9px] font-semibold leading-tight">
          {e.estimationDate ? new Date(e.estimationDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
          }) : "—"}
        </div>
      )
    },
    {
      key: "orderType",
      label: "ODR Type",
      width: "5%",
      render: (e) => (
        <span className={`px-1 py-0.5 rounded text-[9px] font-medium inline-block ${e.orderType === "JOB-Works"
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
      key: "products",
      label: "Product",
      width: "8%",
      render: (e) => {
        if (!e.orderProducts || e.orderProducts.length === 0) {
          return <span className="text-gray-400 text-xs">—</span>;
        }

        const productNames = e.orderProducts.map(prod => prod.productName);

        return (
          <div className="text-xs" title={productNames.join(", ")}>
            {productNames.map((name, idx) => (
              <div key={idx} className="truncate">{name}</div>
            ))}
          </div>
        );
      }
    },
    {
      key: "color",
      label: "Color",
      width: "6%",
      render: (e) => {
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
      width: "15%",
      render: (e) => {
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
      width: "6%",
      render: (e) => {
        return (
          <span className="font-semibold text-blue-600 text-sm">
            {e.totalOrderQty || 0}
          </span>
        );
      }
    },
    {
      key: "status",
      label: "Status",
      width: "6%",
      render: (e) => {
        const status = e.status || "Draft";
        const statusStyles = {
          "Draft": "bg-yellow-100 text-yellow-700",
          "Finalized": "bg-green-500 text-white",
        };
        return (
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusStyles[status] || "bg-gray-100 text-gray-700"}`}>
            {status}
          </span>
        );
      }
    },
    {
      key: "pdfUrl",
      label: "PDF",
      width: "3%",
      render: (e) => (
        <div className="text-center">
          {e.pdfUrl ? (
            <FileText className="w-4 h-4 text-green-600 mx-auto" />
          ) : (
            <span className="text-gray-400 text-xs">—</span>
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
          initialValues={editEstimation}
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
            <div className="w-full overflow-x-hidden">
              <DataTable
                columns={columns}
                data={filteredEstimations}
                actions={actions}
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