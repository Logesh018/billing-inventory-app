import { useEffect, useState, useCallback } from "react";
import {
  getAllDocuments,
  deleteDocument,
  createDocument,
  updateDocument,
  downloadDocumentPDF,
  updateDocumentStatus,
} from "../../api/documentApi";
import { Plus, Edit, Trash2, Download, Eye, FileText } from "lucide-react";
import DataTable from "../../components/UI/DataTable";
import InvoiceForm from "./InvoiceForm";


export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editInvoice, setEditInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Wrap with useCallback
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const filters = filter !== "all" ? { status: filter } : {};
      const res = await getAllDocuments("invoice", filters);
      const invoicesData = res.documents;
      setInvoices(Array.isArray(invoicesData) ? invoicesData : []);
      setError(null);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setError("Failed to fetch invoices");
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this invoice? This will also delete the associated PDF file.")) {
      try {
        await deleteDocument(id);
        fetchInvoices();
      } catch (error) {
        console.error("Error deleting invoice:", error);
        alert(`Failed to delete invoice: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const handleFormSubmit = async (data) => {
    try {
      if (editInvoice) {
        // For updates, use updateDocument (no documentType needed)
        await updateDocument(editInvoice._id, data);
      } else {
        // For creation, pass documentType as FIRST parameter, data as SECOND
        // Option 1: Use the generic createDocument correctly
        await createDocument("invoice", data);

        // Option 2: Or use the specific createInvoice helper (cleaner)
        // await createInvoice(data);
      }
      setShowForm(false);
      setEditInvoice(null);
      fetchInvoices();
    } catch (error) {
      console.error("Error saving invoice:", error);
      alert(`Failed to save invoice: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDownloadPDF = async (invoice) => {
    try {
      if (invoice.pdfUrl) {
        // Direct download from URL
        const link = document.createElement('a');
        link.href = invoice.pdfUrl;
        link.download = `invoice-${invoice.documentNo}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Generate and download
        await downloadDocumentPDF(invoice._id);
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF");
    }
  };

  const handleStatusChange = async (invoiceId, newStatus) => {
    try {
      await updateDocumentStatus(invoiceId, newStatus);
      fetchInvoices();
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      "Draft": "bg-gray-500",
      "Sent": "bg-blue-500",
      "Viewed": "bg-indigo-500",
      "Partially Paid": "bg-yellow-500",
      "Paid": "bg-green-500",
      "Overdue": "bg-red-500",
      "Cancelled": "bg-gray-600"
    };
    return colors[status] || "bg-gray-500";
  };

  const columns = [
    {
      key: "documentNo",
      label: "Invoice #",
      render: (invoice) => (
        <div className="font-medium text-blue-600">
          {invoice.documentNo}
        </div>
      )
    },
    {
      key: "customerDetails",
      label: "Customer",
      render: (invoice) => (
        <div>
          <div className="font-medium">{invoice.customerDetails?.name}</div>
          <div className="text-sm text-gray-500">{invoice.customerDetails?.company}</div>
        </div>
      )
    },
    {
      key: "documentDate",
      label: "Date",
      render: (invoice) => new Date(invoice.documentDate).toLocaleDateString('en-IN')
    },
    {
      key: "dueDate",
      label: "Due Date",
      render: (invoice) => {
        const dueDate = new Date(invoice.dueDate);
        const isOverdue = dueDate < new Date() && !["Paid", "Cancelled"].includes(invoice.status);
        return (
          <span className={isOverdue ? "text-red-600 font-medium" : ""}>
            {dueDate.toLocaleDateString('en-IN')}
          </span>
        );
      }
    },
    {
      key: "grandTotal",
      label: "Amount",
      render: (invoice) => (
        <div className="text-right">
          <div className="font-semibold">₹{invoice.grandTotal.toLocaleString()}</div>
          {invoice.balanceAmount > 0 && (
            <div className="text-sm text-red-600">
              Balance: ₹{invoice.balanceAmount.toLocaleString()}
            </div>
          )}
        </div>
      )
    },
    {
      key: "status",
      label: "Status",
      render: (invoice) => (
        <select
          className={`text-white px-2 py-1 rounded text-xs font-medium ${getStatusColor(invoice.status)}`}
          value={invoice.status}
          onChange={(e) => handleStatusChange(invoice._id, e.target.value)}
        >
          <option value="Draft">Draft</option>
          <option value="Sent">Sent</option>
          <option value="Viewed">Viewed</option>
          <option value="Partially Paid">Partially Paid</option>
          <option value="Paid">Paid</option>
          <option value="Overdue">Overdue</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      ),
    },
    {
      key: "pdfUrl",
      label: "PDF",
      render: (invoice) => (
        <div className="text-center">
          {invoice.pdfUrl ? (
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
      onClick: (invoice) => {
        console.log("PDF URL:", invoice.pdfUrl);
        if (invoice.pdfUrl) {
          window.open(`${invoice.pdfUrl}#view=FitH`, "_blank");
        } else {
          alert("PDF not generated for this invoice.");
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
      label: "Edit",
      icon: Edit,
      className: "bg-orange-500 text-white hover:bg-orange-600",
      onClick: (invoice) => {
        setEditInvoice(invoice);
        setShowForm(true);
      },
    },
    {
      label: "Delete",
      icon: Trash2,
      className: "bg-red-500 text-white hover:bg-red-600",
      onClick: (invoice) => handleDelete(invoice._id),
    },
  ];

  const statusFilters = [
    { key: "all", label: "All Invoices", count: invoices.length },
    { key: "Draft", label: "Draft", count: invoices.filter(i => i.status === "Draft").length },
    { key: "Sent", label: "Sent", count: invoices.filter(i => i.status === "Sent").length },
    { key: "Paid", label: "Paid", count: invoices.filter(i => i.status === "Paid").length },
    { key: "Overdue", label: "Overdue", count: invoices.filter(i => i.status === "Overdue").length },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading invoices...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showForm ? (
        <InvoiceForm
          onSubmit={handleFormSubmit}
          initialValues={editInvoice || {}}
          onClose={() => {
            setShowForm(false);
            setEditInvoice(null);
          }}
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Invoice Management</h1>
              <p className="text-gray-600 mt-1">
                Create, manage, and track your invoices
              </p>
            </div>
            <button
              onClick={() => {
                setShowForm(true);
                setEditInvoice(null);
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" /> Create Invoice
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

          {/* Invoices Table */}
          {invoices.length > 0 ? (
            <DataTable
              columns={columns}
              data={invoices}
              actions={actions}
            />
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-gray-500 text-lg mb-2">No invoices found</div>
              <div className="text-gray-400 text-sm mb-4">
                {filter === "all"
                  ? "Create your first invoice to get started"
                  : `No ${filter} invoices found`
                }
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Invoice
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}


