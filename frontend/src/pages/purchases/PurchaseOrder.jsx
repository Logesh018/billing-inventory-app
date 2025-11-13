import { useEffect, useState, useCallback } from "react";
import { Plus, Edit, Trash2, Download, Eye, FileText } from "lucide-react";
import { axiosInstance } from "../../lib/axios";
import DataTable from "../../components/UI/DataTable";
import PurchaseOrderForm from "./PurchaseOrderForm";

export default function PurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editPO, setEditPO] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all purchase orders
  const fetchPurchaseOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get("/purchase-orders");
      setPurchaseOrders(Array.isArray(data.data) ? data.data : []);
      setError(null);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      setError("Failed to fetch purchase orders");
      setPurchaseOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

  // Delete purchase order
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this purchase order?")) {
      try {
        await axiosInstance.delete(`/purchase-orders/${id}`);
        fetchPurchaseOrders();
      } catch (error) {
        console.error("Error deleting purchase order:", error);
        alert(`Failed to delete: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  // Handle form submission (create/update)
  const handleFormSubmit = async () => {
    setShowForm(false);
    setEditPO(null);
    fetchPurchaseOrders();
  };

  // Generate and download PDF
  const handleDownloadPDF = async (po) => {
    try {
      if (po.pdfUrl) {
        // Direct download from Cloudinary URL
        const link = document.createElement('a');
        link.href = po.pdfUrl;
        link.download = `PO-${po.poNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Generate PDF first, then download
        const { data } = await axiosInstance.get(`/purchase-orders/${po._id}/download-pdf`, {
          responseType: 'blob'
        });
        
        const blob = new Blob([data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `PO-${po.poNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        // Refresh to get updated pdfUrl
        fetchPurchaseOrders();
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF");
    }
  };

  // View PDF in new tab
  const handleViewPDF = async (po) => {
    try {
      if (po.pdfUrl) {
        window.open(`${po.pdfUrl}#view=FitH`, "_blank");
      } else {
        // Generate PDF first
        const { data } = await axiosInstance.post(`/purchase-orders/${po._id}/generate-pdf`);
        if (data.success && data.data.pdfUrl) {
          window.open(`${data.data.pdfUrl}#view=FitH`, "_blank");
          fetchPurchaseOrders(); // Refresh to update pdfUrl
        } else {
          alert("Failed to generate PDF");
        }
      }
    } catch (error) {
      console.error("Error viewing PDF:", error);
      alert("Failed to view PDF");
    }
  };

  // Define table columns
  const columns = [
    {
      key: "poNumber",
      label: "NILA PO Number",
      width: "120px",
      render: (po) => (
        <div className="font-medium text-blue-600">
          {po.poNumber}
        </div>
      )
    },
    {
      key: "supplier",
      label: "Supplier",
      width: "180px",
      render: (po) => (
        <div className="text-left pl-2">
          <div className="font-medium">{po.supplier?.name}</div>
          <div className="text-xs text-gray-500 truncate">
            {po.supplier?.gstin || "No GSTIN"}
          </div>
        </div>
      )
    },
    {
      key: "poDate",
      label: "PO Date",
      width: "100px",
      render: (po) => new Date(po.poDate).toLocaleDateString('en-IN')
    },
    {
      key: "items",
      label: "Items",
      width: "80px",
      render: (po) => (
        <span className="font-medium">{po.items?.length || 0}</span>
      )
    },
    {
      key: "totalValue",
      label: "Total Value",
      width: "120px",
      render: (po) => (
        <div className="text-right pr-2 font-semibold">
          ₹{po.totalValue?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      )
    },
    {
      key: "grandTotal",
      label: "Grand Total",
      width: "130px",
      render: (po) => (
        <div className="text-right pr-2 font-bold text-green-600">
          ₹{po.grandTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      )
    },
    {
      key: "pdfUrl",
      label: "PDF",
      width: "60px",
      render: (po) => (
        <div className="text-center">
          {po.pdfUrl ? (
            <FileText className="w-4 h-4 text-green-600 mx-auto" />
          ) : (
            <span className="text-gray-400 text-xs">-</span>
          )}
        </div>
      )
    },
  ];

  // Define table actions
  const actions = [
    {
      label: "View PDF",
      icon: Eye,
      className: "bg-blue-500 text-white hover:bg-blue-600",
      onClick: handleViewPDF,
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
      onClick: (po) => {
        setEditPO(po);
        setShowForm(true);
      },
    },
    {
      label: "Delete",
      icon: Trash2,
      className: "bg-red-500 text-white hover:bg-red-600",
      onClick: (po) => handleDelete(po._id),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading purchase orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {showForm ? (
        <PurchaseOrderForm
          onCancel={() => {
            setShowForm(false);
            setEditPO(null);
          }}
          onSuccess={handleFormSubmit}
          initialData={editPO}
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Purchase Orders</h1>
              <p className="text-gray-600 mt-1">
                Create and manage purchase orders with suppliers
              </p>
            </div>
            <button
              onClick={() => {
                setShowForm(true);
                setEditPO(null);
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" /> Create Purchase Order
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Summary Cards */}
          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Total POs</div>
              <div className="text-2xl font-bold text-gray-800">
                {purchaseOrders.length}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Total Value</div>
              <div className="text-2xl font-bold text-blue-600">
                ₹{purchaseOrders.reduce((sum, po) => sum + (po.totalValue || 0), 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">With PDFs</div>
              <div className="text-2xl font-bold text-green-600">
                {purchaseOrders.filter(po => po.pdfUrl).length}
              </div>
            </div>
          </div> */}

          {/* Purchase Orders Table */}
          {purchaseOrders.length > 0 ? (
            <DataTable
              columns={columns}
              data={purchaseOrders}
              actions={actions}
            />
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-gray-500 text-lg mb-2">No purchase orders found</div>
              <div className="text-gray-400 text-sm mb-4">
                Create your first purchase order to get started
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Purchase Order
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}