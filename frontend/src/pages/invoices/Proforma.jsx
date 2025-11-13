// pages/Proforma/Proforma.jsx
import { useEffect, useState, useCallback } from "react";
import { Plus, Edit, Trash2, Download, Eye, FileText, ArrowRight } from "lucide-react";
import DataTable from "../../components/UI/DataTable";
import ProformaForm from "./ProformaForm";
import {
  getAllDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  downloadDocumentPDF,
  updateDocumentStatus,
  convertProformaToInvoice
} from "../../api/documentApi";

export default function Proforma() {
  const [proformas, setProformas] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editProforma, setEditProforma] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProformas = useCallback(async () => {
    try {
      setLoading(true);
      const filters = filter !== "all" ? { status: filter } : {};
      const res = await getAllDocuments('proforma', filters);
      const proformasData = res.documents || res;
      setProformas(Array.isArray(proformasData) ? proformasData : []);
      setError(null);
    } catch (error) {
      console.error("Error fetching proformas:", error);
      setError("Failed to fetch proformas");
      setProformas([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchProformas();
  }, [fetchProformas]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this proforma? This will also delete the associated PDF file.")) {
      try {
        await deleteDocument(id);
        fetchProformas();
      } catch (error) {
        console.error("Error deleting proforma:", error);
        alert(`Failed to delete proforma: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const handleFormSubmit = async (data) => {
    try {
      if (editProforma) {
        await updateDocument(editProforma._id, data);
      } else {
        await createDocument('proforma', data);
      }
      setShowForm(false);
      setEditProforma(null);
      fetchProformas();
    } catch (error) {
      console.error("Error saving proforma:", error);
      alert(`Failed to save proforma: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDownloadPDF = async (proforma) => {
    try {
      if (proforma.pdfUrl) {
        window.open(proforma.pdfUrl, '_blank');
      } else {
        await downloadDocumentPDF(proforma._id);
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF");
    }
  };

  const handleStatusChange = async (proformaId, newStatus) => {
    try {
      await updateDocumentStatus(proformaId, newStatus);
      fetchProformas();
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  const handleConvertToInvoice = async (proforma) => {
    if (window.confirm(`Convert this proforma (${proforma.documentNo}) to an invoice?`)) {
      try {
        console.log("Converting proforma to invoice:", proforma._id);
        const result = await convertProformaToInvoice(proforma._id);
        console.log("Conversion result:", result);
        alert(`Successfully converted to invoice: ${result.newDocument.documentNo}`);
        fetchProformas();
      } catch (error) {
        console.error("Error converting to invoice:", error);
        alert(`Failed to convert to invoice: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      "Draft": "bg-gray-500",
      "Sent": "bg-blue-500",
      "Viewed": "bg-indigo-500",
      "Accepted": "bg-green-500",
      "Rejected": "bg-red-500",
      "Expired": "bg-orange-500",
      "Cancelled": "bg-gray-600",
      "Converted": "bg-purple-500"
    };
    return colors[status] || "bg-gray-500";
  };

  const columns = [
    {
      key: "documentNo",
      label: "Proforma #",
      render: (proforma) => (
        <div className="font-medium text-blue-600">
          {proforma.documentNo}
        </div>
      )
    },
    {
      key: "customer",
      label: "Customer",
      render: (proforma) => (
        <div>
          <div className="font-medium">{proforma.customerDetails?.name}</div>
          <div className="text-sm text-gray-500">{proforma.customerDetails?.company}</div>
        </div>
      )
    },
    {
      key: "documentDate",
      label: "Date",
      render: (proforma) => new Date(proforma.documentDate).toLocaleDateString('en-IN')
    },
    {
      key: "validUntil",
      label: "Valid Until",
      render: (proforma) => {
        const validUntil = new Date(proforma.validUntil);
        const isExpired = validUntil < new Date() && !["Accepted", "Converted", "Cancelled"].includes(proforma.status);
        return (
          <span className={isExpired ? "text-red-600 font-medium" : ""}>
            {validUntil.toLocaleDateString('en-IN')}
          </span>
        );
      }
    },
    {
      key: "grandTotal",
      label: "Amount",
      render: (proforma) => (
        <div className="text-right">
          <div className="font-semibold">₹{proforma.grandTotal.toLocaleString()}</div>
        </div>
      )
    },
    {
      key: "status",
      label: "Status",
      render: (proforma) => (
        <select
          className={`text-white px-2 py-1 rounded text-xs font-medium ${getStatusColor(proforma.status)}`}
          value={proforma.status}
          onChange={(e) => handleStatusChange(proforma._id, e.target.value)}
        >
          <option value="Draft">Draft</option>
          <option value="Sent">Sent</option>
          <option value="Viewed">Viewed</option>
          <option value="Accepted">Accepted</option>
          <option value="Rejected">Rejected</option>
          <option value="Expired">Expired</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Converted">Converted</option>
        </select>
      ),
    },
    {
      key: "pdfUrl",
      label: "PDF",
      render: (proforma) => (
        <div className="text-center">
          {proforma.pdfUrl ? (
            <FileText className="w-4 h-4 text-green-600 mx-auto" />
          ) : (
            <span className="text-gray-400 text-xs">Not generated</span>
          )}
        </div>
      )
    },
  ];

  const actions = [
    {
      label: "View",
      icon: Eye,
      className: "bg-blue-500 text-white hover:bg-blue-600",
      onClick: (proforma) => {
        if (proforma.pdfUrl) {
          window.open(`${proforma.pdfUrl}#view=FitH`, "_blank");
        } else {
          alert("PDF not generated for this proforma.");
        }
      },
    },
    {
      label: "Download",
      icon: Download,
      className: "bg-green-500 text-white hover:bg-green-600",
      onClick: handleDownloadPDF,
    },
    {
      label: "Convert to Invoice",
      icon: ArrowRight,
      className: "bg-purple-500 text-white hover:bg-purple-600",
      onClick: handleConvertToInvoice,
      show: (proforma) => proforma.status === "Accepted"
    },
    {
      label: "Edit",
      icon: Edit,
      className: "bg-orange-500 text-white hover:bg-orange-600",
      onClick: (proforma) => {
        setEditProforma(proforma);
        setShowForm(true);
      },
    },
    {
      label: "Delete",
      icon: Trash2,
      className: "bg-red-500 text-white hover:bg-red-600",
      onClick: (proforma) => handleDelete(proforma._id),
    },
  ];

  const statusFilters = [
    { key: "all", label: "All Proformas", count: proformas.length },
    { key: "Draft", label: "Draft", count: proformas.filter(p => p.status === "Draft").length },
    { key: "Sent", label: "Sent", count: proformas.filter(p => p.status === "Sent").length },
    { key: "Accepted", label: "Accepted", count: proformas.filter(p => p.status === "Accepted").length },
    { key: "Expired", label: "Expired", count: proformas.filter(p => p.status === "Expired").length },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading proformas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showForm ? (
        <ProformaForm
          onSubmit={handleFormSubmit}
          initialValues={editProforma || {}}
          onClose={() => {
            setShowForm(false);
            setEditProforma(null);
          }}
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Proforma Invoice Management</h1>
              <p className="text-gray-600 mt-1">
                Create, manage, and track your proforma invoices
              </p>
            </div>
            <button
              onClick={() => {
                setShowForm(true);
                setEditProforma(null);
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" /> Create Proforma
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Filter Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex space-x-8">
              {statusFilters.map((statusFilter) => (
                <button
                  key={statusFilter.key}
                  onClick={() => setFilter(statusFilter.key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${filter === statusFilter.key
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                >
                  {statusFilter.label}
                  <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                    {statusFilter.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Proformas Table */}
          {proformas.length > 0 ? (
            <DataTable
              columns={columns}
              data={proformas}
              actions={actions}
            />
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-gray-500 text-lg mb-2">No proformas found</div>
              <div className="text-gray-400 text-sm mb-4">
                {filter === "all"
                  ? "Create your first proforma to get started"
                  : `No ${filter} proformas found`
                }
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Proforma
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}



