import { useEffect, useState, useCallback } from "react";
import { Plus, Edit, Trash2, Download, Eye, FileText } from "lucide-react";
import DataTable from "../../components/UI/DataTable";
import NoteForm from "./NoteForm";
import * as noteApi from "../../api/noteApi";

export default function CreditNote() {
  const [creditNotes, setCreditNotes] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editNote, setEditNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCreditNotes = useCallback(async () => {
    try {
      setLoading(true);
      const filters = { noteType: 'credit' };
      if (filter !== "all") {
        filters.status = filter;
      }
      
      const response = await noteApi.getNotes(filters);
      const notesData = response.data || response;
      setCreditNotes(Array.isArray(notesData) ? notesData : []);
      setError(null);
    } catch (error) {
      console.error("Error fetching credit notes:", error);
      setError(error.response?.data?.message || error.message || "Failed to fetch credit notes");
      setCreditNotes([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchCreditNotes();
  }, [fetchCreditNotes]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to cancel this credit note?")) {
      try {
        await noteApi.deleteNote(id);
        fetchCreditNotes();
      } catch (error) {
        console.error("Error deleting credit note:", error);
        alert(`Failed to delete credit note: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const handleFormSubmit = async (data) => {
    try {
      if (editNote) {
        await noteApi.updateNote(editNote._id, data);
      } else {
        await noteApi.createNote(data);
      }
      setShowForm(false);
      setEditNote(null);
      fetchCreditNotes();
    } catch (error) {
      console.error("Error saving credit note:", error);
      alert(`Failed to save credit note: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDownloadPDF = async (note) => {
    try {
      await noteApi.downloadNotePDF(note);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert(error.message || "Failed to download PDF");
    }
  };

  const handleStatusChange = async (noteId, newStatus) => {
    try {
      await noteApi.updateNoteStatus(noteId, newStatus);
      fetchCreditNotes();
    } catch (error) {
      console.error("Error updating status:", error);
      alert(error.response?.data?.message || "Failed to update status");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      "draft": "bg-gray-500",
      "issued": "bg-green-500",
      "cancelled": "bg-red-600"
    };
    return colors[status] || "bg-gray-500";
  };

  const columns = [
    {
      key: "noteNumber",
      label: "Credit Note #",
      render: (note) => (
        <div className="font-medium text-green-600">
          {note.noteNumber}
        </div>
      )
    },
    {
      key: "partyDetails",
      label: "Party",
      render: (note) => (
        <div>
          <div className="font-medium">{note.partyDetails?.name}</div>
          <div className="text-sm text-gray-500">{note.partyDetails?.gst}</div>
        </div>
      )
    },
    {
      key: "referenceNumber",
      label: "Reference",
      render: (note) => (
        <div>
          <div className="font-medium">{note.referenceNumber}</div>
          <div className="text-sm text-gray-500 capitalize">{note.referenceType}</div>
        </div>
      )
    },
    {
      key: "reason",
      label: "Reason",
      render: (note) => {
        const reasonLabels = {
          'goods-returned': 'Goods Returned',
          'shortage-in-supply': 'Shortage',
          'overcharged-amount': 'Overcharged',
          'discount-allowed': 'Discount',
          'quality-issue': 'Quality Issue',
          'damaged-goods': 'Damaged Goods',
          'other': 'Other'
        };
        return (
          <div className="text-sm">
            {reasonLabels[note.reason] || note.reason}
          </div>
        );
      }
    },
    {
      key: "noteDate",
      label: "Date",
      render: (note) => new Date(note.noteDate).toLocaleDateString('en-IN')
    },
    {
      key: "grandTotal",
      label: "Amount",
      render: (note) => (
        <div className="text-right">
          <div className="font-semibold text-green-600">₹{note.grandTotal.toLocaleString()}</div>
        </div>
      )
    },
    {
      key: "status",
      label: "Status",
      render: (note) => (
        <select
          className={`text-white px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(note.status)}`}
          value={note.status}
          onChange={(e) => handleStatusChange(note._id, e.target.value)}
        >
          <option value="draft">Draft</option>
          <option value="issued">Issued</option>
          <option value="cancelled">Cancelled</option>
        </select>
      ),
    },
    {
      key: "pdfUrl",
      label: "PDF",
      render: (note) => (
        <div className="text-center">
          {note.pdfUrl ? (
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
      onClick: (note) => {
        if (note.pdfUrl) {
          window.open(`${note.pdfUrl}#view=FitH`, "_blank");
        } else {
          alert("PDF not generated for this credit note.");
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
      onClick: (note) => {
        setEditNote(note);
        setShowForm(true);
      },
    },
    {
      label: "Delete",
      icon: Trash2,
      className: "bg-red-500 text-white hover:bg-red-600",
      onClick: (note) => handleDelete(note._id),
    },
  ];

  const statusFilters = [
    { key: "all", label: "All Credit Notes", count: creditNotes.length },
    { key: "draft", label: "Draft", count: creditNotes.filter(n => n.status === "draft").length },
    { key: "issued", label: "Issued", count: creditNotes.filter(n => n.status === "issued").length },
    { key: "cancelled", label: "Cancelled", count: creditNotes.filter(n => n.status === "cancelled").length },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading credit notes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showForm ? (
        <NoteForm
          noteType="credit"
          onSubmit={handleFormSubmit}
          initialValues={editNote || {}}
          onClose={() => {
            setShowForm(false);
            setEditNote(null);
          }}
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Credit Note Management</h1>
              <p className="text-gray-600 mt-1">
                Create and manage credit notes for returns, discounts, and adjustments
              </p>
            </div>
            <button
              onClick={() => {
                setShowForm(true);
                setEditNote(null);
              }}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" /> Create Credit Note
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
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    filter === statusFilter.key
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

          {/* Credit Notes Table */}
          {creditNotes.length > 0 ? (
            <DataTable
              columns={columns}
              data={creditNotes}
              actions={actions}
            />
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-gray-500 text-lg mb-2">No credit notes found</div>
              <div className="text-gray-400 text-sm mb-4">
                {filter === "all"
                  ? "Create your first credit note to get started"
                  : `No ${filter} credit notes found`
                }
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Credit Note
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}