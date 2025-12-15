import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getStoreLogs, deleteStoreLog } from "../../api/storeLogApi";
import StoreLogForm from "./StoreLogForm";
import DataTable from "../../components/UI/DataTable";
import { Plus, Edit, Trash2, FileText, Filter } from "lucide-react";
import { useFormNavigation } from "../../utils/FormExitModal";
import { showSuccess, showError, showConfirm, showLoading, dismissAndSuccess, dismissAndError } from "../../utils/toast";

export default function StoreLog() {
  const { user } = useAuth();
  const [storeLogs, setStoreLogs] = useState([]);
  const [filter, setFilter] = useState("all");
  const [filterType, setFilterType] = useState("status"); // "status", "order", "store"
  const [filterValue, setFilterValue] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editLog, setEditLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setIsFormOpen, registerFormClose, unregisterFormClose } = useFormNavigation();

  // Extract unique values for filters
  const [uniqueOrders, setUniqueOrders] = useState([]);
  const [uniqueStores, setUniqueStores] = useState([]);

  const isAdmin = user?.role === "Admin" || user?.role === "SuperAdmin";

  useEffect(() => {
    fetchStoreLogs();
  }, []);

  useEffect(() => {
    if (showForm) {
      setIsFormOpen(true);
      registerFormClose(() => {
        setShowForm(false);
        setEditLog(null);
      });
    } else {
      setIsFormOpen(false);
      unregisterFormClose();
    }
    return () => {
      unregisterFormClose();
    };
  }, [showForm, setIsFormOpen, registerFormClose, unregisterFormClose]);

  const fetchStoreLogs = async () => {
    try {
      setLoading(true);
      const res = await getStoreLogs();
      const data = Array.isArray(res.data) ? res.data : [];
      setStoreLogs(data);

      // Extract unique order IDs and store IDs for filters
      const orders = [...new Set(data.map(log => log.orderId).filter(Boolean))];
      const stores = [...new Set(data.map(log => log.storeId).filter(Boolean))];
      setUniqueOrders(orders);
      setUniqueStores(stores);

      setError(null);
    } catch (err) {
      console.error("Error fetching store logs:", err);
      setError("Failed to fetch store logs");
      setStoreLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    showConfirm(
      "Are you sure you want to delete this store log? This action cannot be undone.",
      async () => {
        const toastId = showLoading("Deleting store log...");
        try {
          await deleteStoreLog(id);
          await fetchStoreLogs();
          dismissAndSuccess(toastId, "Store log deleted successfully!");
        } catch (error) {
          console.error("Error deleting store log:", error);
          dismissAndError(toastId, `Failed to delete: ${error.response?.data?.message || error.message}`);
        }
      }
    );
  };

  const handleFormSubmit = async () => {
    try {
      await fetchStoreLogs();
      setShowForm(false);
      setEditLog(null);
      setIsFormOpen(false);
      showSuccess(editLog ? "Store log updated successfully!" : "Store log created successfully!");
    } catch (error) {
      console.error("Error in form submit:", error);
      showError(`Failed to save: ${error.response?.data?.message || error.message}`);
    }
  };

  // Apply filters
  const getFilteredLogs = () => {
    let filtered = storeLogs;

    // Apply status filter
    if (filter !== "all") {
      filtered = filtered.filter((log) => {
        if (filter === "inStore") return log.status === "In Store";
        if (filter === "out") return log.status === "Out";
        if (filter === "completed") return log.status === "Completed";
        return true;
      });
    }

    // Apply order/store filter
    if (filterType === "order" && filterValue) {
      filtered = filtered.filter(log => log.orderId === filterValue);
    } else if (filterType === "store" && filterValue) {
      filtered = filtered.filter(log => log.storeId === filterValue);
    }

    return filtered;
  };

  const filteredLogs = getFilteredLogs();

  const columns = [
    {
      key: "serialNo",
      label: "S.NO",
      width: "3%",
      render: (log) => (
        <div className="font-mono text-[9px] font-semibold text-gray-700">
          {log.serialNo || "—"}
        </div>
      )
    },
    {
      key: "logId",
      label: "LOG ID",
      width: "5%",
      render: (log) => (
        <div className="font-medium text-[9px] leading-tight break-words">
          <div className="text-gray-800 font-semibold text-[9px]">{log.logId || "—"}</div>
        </div>
      )
    },
    {
      key: "logDate",
      label: "LOG DATE",
      width: "6%",
      render: (log) => (
        <div className="text-[9px] font-semibold leading-tight">
          {log.logDate ? new Date(log.logDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
          }) : "—"}
        </div>
      )
    },
    {
      key: "personName",
      label: "PERSON",
      width: "9%",
      render: (log) => (
        <div className="text-[9px] leading-tight">
          <div className="font-semibold text-gray-800">{log.personName || "—"}</div>
          {log.department && (
            <div className="text-gray-600 text-[8px] mt-0.5">{log.department}</div>
          )}
        </div>
      )
    },
    {
      key: "items",
      label: "ITEMS",
      width: "10%",
      render: (log) => {
        if (!log.items || log.items.length === 0) {
          return <span className="text-gray-400 text-[9px]">—</span>;
        }
        return (
          <div className="space-y-1">
            {log.items.map((item, i) => (
              <div key={i} className="text-[8px] leading-tight">
                <span className="font-semibold text-gray-800">{item.itemName}</span>
                <span className="text-gray-600 ml-1">({item.unit})</span>
              </div>
            ))}
          </div>
        );
      }
    },
    {
      key: "orderId",
      label: "ORDER ID",
      width: "6%",
      render: (log) => (
        <div className="font-medium text-[9px] leading-tight break-words">
          <div className="text-gray-800 font-semibold text-[9px]">{log.orderId || "—"}</div>
        </div>
      )
    },
    {
      key: "PURNo",
      label: "PUR ID",
      width: "5%",
      render: (log) => (
        <div className="font-medium text-[9px] leading-tight break-words">
          <div className="text-gray-800 font-semibold text-[9px]">{log.PURNo || "—"}</div>
        </div>
      )
    },
    {
      key: "storeId",
      label: "STORE ID",
      width: "5%",
      render: (log) => (
        <div className="font-medium text-[9px] leading-tight break-words">
          <div className="text-gray-800 font-semibold text-[9px]">{log.storeId || "—"}</div>
        </div>
      )
    },
    {
      key: "unit",
      label: "UNIT",
      width: "5%",
      render: (item) => (
        <div className="font-medium text-[9px] leading-tight break-words">
         {item.items.map((item, i) => (
              <div key={i} className="text-[8px] leading-tight">
                {/* <span className="font-semibold text-gray-800">{item.itemName}</span> */}
                <span className="text-gray-800 font-medium text-[9px] uppercase">{item.unit}</span>
              </div>
            ))}
        </div>
      )
    },
    {
      key: "takenQty",
      label: "TAKEN",
      width: "5%",
      render: (log) => (
        <div className="text-[9px] font-bold text-orange-600 text-center">
          {log.totalTakenQty?.toLocaleString() || 0}
        </div>
      )
    },
    {
      key: "returnedQty",
      label: "RETURNED",
      width: "6%",
      render: (log) => (
        <div className="text-[9px] font-bold text-blue-600 text-center">
          {log.totalReturnedQty?.toLocaleString() || 0}
        </div>
      )
    },
    {
      key: "inHandQty",
      label: "IN HAND",
      width: "6%",
      render: (log) => (
        <div className="text-[9px] font-bold text-green-600 text-center">
          {log.totalInHandQty?.toLocaleString() || 0}
        </div>
      )
    },
    // {
    //   key: "loginTime",
    //   label: "LOGIN",
    //   width: "5%",
    //   render: (log) => (
    //     <div className="text-[9px] font-semibold text-gray-700 text-center">
    //       {log.loginTime || "—"}
    //     </div>
    //   )
    // },
    // {
    //   key: "logoutTime",
    //   label: "LOGOUT",
    //   width: "5%",
    //   render: (log) => (
    //     <div className="text-[9px] font-semibold text-gray-700 text-center">
    //       {log.logoutTime || "—"}
    //     </div>
    //   )
    // },
    {
      key: "productCount",
      label: "PRODUCED",
      width: "5%",
      render: (log) => (
        <div className="text-[9px] font-bold text-purple-600 text-center">
          {log.productCount || 0}
        </div>
      )
    },
    {
      key: "status",
      label: "STATUS",
      width: "7%",
      render: (log) => {
        const status = log.status || "In Store";
        const styles = {
          "In Store": "bg-blue-500 text-white",
          "Out": "bg-orange-500 text-white",
          "Completed": "bg-green-500 text-white",
        };
        return (
          <span className={`px-2 py-1 rounded text-[9px] font-medium inline-block ${styles[status] || "bg-gray-100 text-gray-700"}`}>
            {status}
          </span>
        );
      }
    }
  ];

  const actions = isAdmin ? [
    {
      label: "Edit",
      icon: Edit,
      className: "bg-blue-500 text-white hover:bg-blue-600",
      onClick: (log) => {
        setEditLog(log);
        setShowForm(true);
      },
    },
    {
      label: "Delete",
      icon: Trash2,
      className: "bg-red-500 text-white hover:bg-red-600",
      onClick: (log) => handleDelete(log._id),
    },
  ] : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading store logs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showForm ? (
        <StoreLogForm
          initialValues={editLog}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditLog(null);
          }}
          isEditMode={!!editLog}
        />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Store Log Management</h1>
              <p className="text-gray-600 text-sm mt-1">
                Track daily worker material usage and production activities
              </p>
            </div>

            {isAdmin && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" /> New Store Log
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Filters Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>

              {/* Status Tabs */}
              <div className="flex space-x-2">
                {[
                  { key: "all", label: "All", count: storeLogs.length },
                  { key: "inStore", label: "In Store", count: storeLogs.filter(l => l.status === "In Store").length },
                  { key: "out", label: "Out", count: storeLogs.filter(l => l.status === "Out").length },
                  { key: "completed", label: "Completed", count: storeLogs.filter(l => l.status === "Completed").length }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`py-1.5 px-3 text-xs font-medium rounded-lg transition-colors ${
                      filter === tab.key
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {tab.label}
                    <span className="ml-1.5 bg-white bg-opacity-30 py-0.5 px-1.5 rounded-full text-xs">
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Order/Store Filter */}
              <div className="flex items-center gap-2 ml-auto">
                <select
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value);
                    setFilterValue("");
                  }}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="status">All Records</option>
                  <option value="order">By Order ID</option>
                  <option value="store">By Store ID</option>
                </select>

                {filterType === "order" && (
                  <select
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Order</option>
                    {uniqueOrders.map(orderId => (
                      <option key={orderId} value={orderId}>{orderId}</option>
                    ))}
                  </select>
                )}

                {filterType === "store" && (
                  <select
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Store</option>
                    {uniqueStores.map(storeId => (
                      <option key={storeId} value={storeId}>{storeId}</option>
                    ))}
                  </select>
                )}

                {(filterType === "order" || filterType === "store") && filterValue && (
                  <button
                    onClick={() => setFilterValue("")}
                    className="px-3 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 rounded-lg"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {filteredLogs.length > 0 ? (
            <div className="w-full overflow-x-hidden">
              <DataTable
                columns={columns}
                data={filteredLogs}
                actions={actions}
              />
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <div className="text-gray-500 text-lg mb-2">No store logs found</div>
              <div className="text-gray-400 text-sm mb-4">
                {filter === "all" && !filterValue 
                  ? "Create your first store log to get started" 
                  : `No ${filter !== "all" ? filter : ""} logs found with current filters`}
              </div>
              {isAdmin && filter === "all" && !filterValue && (
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Create Store Log
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}