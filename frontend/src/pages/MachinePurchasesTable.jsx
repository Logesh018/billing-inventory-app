import React from "react";
import DataTable from "../components/UI/DataTable";
import { Edit, Trash2 } from "lucide-react";

export default function MachinePurchasesTable({ machines, onEdit, onDelete, isAdmin }) {
  console.log("MachinePurchasesTable received machines:", machines); // Debug log

  const columns = [
    { 
      key: "purchaseDate", 
      label: "Date", 
      width: "80px",
      render: (m) => {
        console.log("Rendering date for machine:", m); // Debug log
        return (
          <div className="text-xs">
            {m.purchaseDate ? new Date(m.purchaseDate).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit'
            }) : "—"}
          </div>
        );
      }
    },
    { 
      key: "PURNo", 
      label: "PUR-No", 
      width: "80px",
      render: (m) => <span className="font-medium text-xs">{m.PURNo || "—"}</span>
    },
    { 
      key: "machineName", 
      label: "Machine Name", 
      width: "150px",
      render: (m) => <span className="font-medium text-xs">{m.machineName || "—"}</span>
    },
    { 
      key: "vendor", 
      label: "Vendor", 
      width: "120px",
      render: (m) => <span className="text-xs">{m.vendor || "—"}</span>
    },
    { 
      key: "vendorCode", 
      label: "Vendor Code", 
      width: "90px",
      render: (m) => <span className="text-xs text-gray-600">{m.vendorCode || "—"}</span>
    },
    { 
      key: "cost", 
      label: "Cost", 
      width: "90px",
      render: (m) => (
        <span className="text-xs font-medium">
          ₹{(m.cost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    { 
      key: "gstPercentage", 
      label: "GST %", 
      width: "60px",
      render: (m) => (
        <span className="text-xs text-gray-600">
          {m.gstPercentage ? `${m.gstPercentage}%` : "—"}
        </span>
      )
    },
    { 
      key: "totalWithGst", 
      label: "Total Amount", 
      width: "100px",
      render: (m) => (
        <span className="text-xs font-semibold text-green-600">
          ₹{(m.totalWithGst || m.cost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    { 
      key: "remarks", 
      label: "Remarks", 
      width: "150px",
      render: (m) => (
        <span className="text-xs text-gray-500 truncate" title={m.remarks}>
          {m.remarks || "—"}
        </span>
      )
    }
  ];

  const actions = isAdmin ? [
    {
      label: "Edit",
      icon: Edit,
      className: "bg-blue-500 text-white hover:bg-blue-600",
      onClick: (machine) => onEdit && onEdit(machine),
    },
    {
      label: "Delete",
      icon: Trash2,
      className: "bg-red-500 text-white hover:bg-red-600",
      onClick: (machine) => onDelete && onDelete(machine),
    },
  ] : [];

  if (!machines || machines.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <div className="text-gray-500 text-lg mb-2">No machine purchases found</div>
        <div className="text-gray-400 text-sm">
          Click "New Purchase" to add your first machine
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <DataTable 
        columns={columns} 
        data={machines} 
        actions={actions}
        className="text-xs compact-table" 
      />
    </div>
  );
}