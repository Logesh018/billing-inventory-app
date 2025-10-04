// pages/Estimations/Estimations.jsx
import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Download, Eye, FileText, ArrowRight, Calculator } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import DataTable from "../components/UI/DataTable";
import EstimationForm from "./EstimationForm";


const getAllEstimations = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.keys(filters).forEach(key => {
    if (filters[key]) params.append(key, filters[key]);
  });

  const url = params.toString()
    ? `/documents?documentType=estimation&${params}`
    : "/documents?documentType=estimation";

  const { data } = await axiosInstance.get(url);
  return data;
};

const createEstimation = async (data) => {
  const { data: result } = await axiosInstance.post("/documents", {
    ...data,
    documentType: 'estimation'
  });
  return result;
};

const updateEstimation = async (id, data) => {
  const { data: result } = await axiosInstance.put(`/documents/${id}`, data);
  return result;
};

const deleteEstimation = async (id) => {
  await axiosInstance.delete(`/documents/${id}`);
};

const downloadEstimationPDF = async (id) => {
  const response = await axiosInstance.get(`/documents/${id}/download`, {
    responseType: 'blob'
  });

  // Open PDF in new tab
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  window.open(url, '_blank');
};

const updateEstimationStatus = async (id, status) => {
  const { data } = await axiosInstance.patch(`/documents/${id}/status`, { status });
  return data;
};

const convertEstimationToProforma = async (id) => {
  const { data } = await axiosInstance.post(`/documents/${id}/convert`, {
    documentType: 'proforma'
  });
  return data;
};

const convertEstimationToInvoice = async (id) => {
  const { data } = await axiosInstance.post(`/documents/${id}/convert`, {
    documentType: 'invoice'
  });
  return data;
};

export default function Estimations() {
  const [estimations, setEstimations] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editEstimation, setEditEstimation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEstimations();
  }, [filter]);

  const fetchEstimations = async () => {
    try {
      setLoading(true);
      const filters = filter !== "all" ? { status: filter } : {};
      const res = await getAllEstimations(filters);
      const estimationsData = res.documents || res;
      setEstimations(Array.isArray(estimationsData) ? estimationsData : []);
      setError(null);
    } catch (error) {
      console.error("Error fetching estimations:", error);
      setError("Failed to fetch estimations");
      setEstimations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this estimation? This will also delete the associated PDF file.")) {
      try {
        await deleteEstimation(id);
        fetchEstimations();
      } catch (error) {
        console.error("Error deleting estimation:", error);
        alert(`Failed to delete estimation: ${error.message}`);
      }
    }
  };

  const handleFormSubmit = async (data) => {
    try {
      if (editEstimation) {
        await updateEstimation(editEstimation._id, data);
      } else {
        await createEstimation(data);
      }
      setShowForm(false);
      setEditEstimation(null);
      fetchEstimations();
    } catch (error) {
      console.error("Error saving estimation:", error);
      alert(`Failed to save estimation: ${error.message}`);
    }
  };

  const handleDownloadPDF = async (estimation) => {
    try {
      if (estimation.pdfUrl) {
        window.open(estimation.pdfUrl, '_blank');
      } else {
        await downloadEstimationPDF(estimation._id);
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF");
    }
  };

  const handleStatusChange = async (estimationId, newStatus) => {
    try {
      await updateEstimationStatus(estimationId, newStatus);
      fetchEstimations();
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  const handleConvertToProforma = async (estimation) => {
    if (window.confirm(`Convert this estimation (${estimation.documentNo}) to a proforma invoice?`)) {
      try {
        const result = await convertEstimationToProforma(estimation._id);
        alert(`Successfully converted to proforma: ${result.newDocument.documentNo}`);
        fetchEstimations();
      } catch (error) {
        console.error("Error converting to proforma:", error);
        alert("Failed to convert to proforma");
      }
    }
  };

  const handleConvertToInvoice = async (estimation) => {
    if (window.confirm(`Convert this estimation (${estimation.documentNo}) directly to an invoice?`)) {
      try {
        const result = await convertEstimationToInvoice(estimation._id);
        alert(`Successfully converted to invoice: ${result.newDocument.documentNo}`);
        fetchEstimations();
      } catch (error) {
        console.error("Error converting to invoice:", error);
        alert("Failed to convert to invoice");
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      "Draft": "bg-gray-500",
      "Sent": "bg-blue-500",
      "Viewed": "bg-indigo-500",
      "Under Review": "bg-yellow-500",
      "Approved": "bg-green-500",
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
      label: "Quotation #",
      render: (estimation) => (
        <div className="font-medium text-green-600">
          {estimation.documentNo}
        </div>
      )
    },
    {
      key: "customer",
      label: "Customer",
      render: (estimation) => (
        <div>
          <div className="font-medium">{estimation.customerDetails?.name}</div>
          <div className="text-sm text-gray-500">{estimation.customerDetails?.company}</div>
        </div>
      )
    },
    {
      key: "documentDate",
      label: "Date",
      render: (estimation) => new Date(estimation.documentDate).toLocaleDateString('en-IN')
    },
    {
      key: "validUntil",
      label: "Valid Until",
      render: (estimation) => {
        const validUntil = new Date(estimation.validUntil);
        const isExpired = validUntil < new Date() && !["Approved", "Converted", "Cancelled"].includes(estimation.status);
        return (
          <span className={isExpired ? "text-red-600 font-medium" : ""}>
            {validUntil.toLocaleDateString('en-IN')}
          </span>
        );
      }
    },
    {
      key: "estimatedDelivery",
      label: "Est. Delivery",
      render: (estimation) => estimation.estimatedDelivery
        ? new Date(estimation.estimatedDelivery).toLocaleDateString('en-IN')
        : "Not specified"
    },
    {
      key: "grandTotal",
      label: "Amount",
      render: (estimation) => (
        <div className="text-right">
          <div className="font-semibold">₹{estimation.grandTotal.toLocaleString()}</div>
          {estimation.warranty && (
            <div className="text-xs text-gray-500">{estimation.warranty}</div>
          )}
        </div>
      )
    },
    {
      key: "status",
      label: "Status",
      render: (estimation) => (
        <select
          className={`text-white px-2 py-1 rounded text-xs font-medium ${getStatusColor(estimation.status)}`}
          value={estimation.status}
          onChange={(e) => handleStatusChange(estimation._id, e.target.value)}
        >
          <option value="Draft">Draft</option>
          <option value="Sent">Sent</option>
          <option value="Viewed">Viewed</option>
          <option value="Under Review">Under Review</option>
          <option value="Approved">Approved</option>
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
      render: (estimation) => (
        <div className="text-center">
          {estimation.pdfUrl ? (
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
      onClick: (estimation) => {
        console.log("View estimation:", estimation);
      },
    },
    {
      label: "Download",
      icon: Download,
      className: "bg-green-500 text-white hover:bg-green-600",
      onClick: handleDownloadPDF,
    },
    {
      label: "Convert to Proforma",
      icon: Calculator,
      className: "bg-indigo-500 text-white hover:bg-indigo-600",
      onClick: handleConvertToProforma,
      show: (estimation) => estimation.status === "Approved"
    },
    {
      label: "Convert to Invoice",
      icon: ArrowRight,
      className: "bg-purple-500 text-white hover:bg-purple-600",
      onClick: handleConvertToInvoice,
      show: (estimation) => estimation.status === "Approved"
    },
    {
      label: "Edit",
      icon: Edit,
      className: "bg-orange-500 text-white hover:bg-orange-600",
      onClick: (estimation) => {
        setEditEstimation(estimation);
        setShowForm(true);
      },
    },
    {
      label: "Delete",
      icon: Trash2,
      className: "bg-red-500 text-white hover:bg-red-600",
      onClick: (estimation) => handleDelete(estimation._id),
    },
  ];

  const statusFilters = [
    { key: "all", label: "All Estimations", count: estimations.length },
    { key: "Draft", label: "Draft", count: estimations.filter(e => e.status === "Draft").length },
    { key: "Sent", label: "Sent", count: estimations.filter(e => e.status === "Sent").length },
    { key: "Under Review", label: "Under Review", count: estimations.filter(e => e.status === "Under Review").length },
    { key: "Approved", label: "Approved", count: estimations.filter(e => e.status === "Approved").length },
    { key: "Expired", label: "Expired", count: estimations.filter(e => e.status === "Expired").length },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading estimations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showForm ? (
        <EstimationForm
          onSubmit={handleFormSubmit}
          initialValues={editEstimation || {}}
          onClose={() => {
            setShowForm(false);
            setEditEstimation(null);
          }}
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Estimation & Quotation Management</h1>
              <p className="text-gray-600 mt-1">
                Create, manage, and track your estimates and quotations
              </p>
            </div>
            <button
              onClick={() => {
                setShowForm(true);
                setEditEstimation(null);
              }}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" /> Create Estimation
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
                    ? "border-green-500 text-green-600"
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

          {/* Estimations Table */}
          {estimations.length > 0 ? (
            <DataTable
              columns={columns}
              data={estimations}
              actions={actions}
            />
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-gray-500 text-lg mb-2">No estimations found</div>
              <div className="text-gray-400 text-sm mb-4">
                {filter === "all"
                  ? "Create your first estimation to get started"
                  : `No ${filter} estimations found`
                }
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Estimation
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}