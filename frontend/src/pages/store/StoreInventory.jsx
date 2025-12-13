import { useEffect, useState } from "react";
import { getStoreEntries } from "../../api/storeEntryApi";
import { getStoreLogs } from "../../api/storeLogApi";
import DataTable from "../../components/UI/DataTable";
import { Package, Filter, AlertTriangle, CheckCircle, TrendingDown } from "lucide-react";

export default function StoreInventory() {
  const [inventoryData, setInventoryData] = useState([]);
  const [filter, setFilter] = useState("all"); // all, low, available, outOfStock
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);

      // Fetch all store entries
      const entriesRes = await getStoreEntries({ status: 'Completed' });
      const storeEntries = entriesRes.data || [];

      // Fetch all store logs
      const logsRes = await getStoreLogs();
      const storeLogs = logsRes.data || [];

      // Build inventory data by processing each store entry
      const inventory = [];

      for (const entry of storeEntries) {
        // Get all logs for this store entry
        const entryLogs = storeLogs.filter(log => log.storeId === entry.storeId);

        // Process each item in the store entry
        for (const item of entry.entries) {
          // Calculate taken and returned quantities for this specific item
          let totalTaken = 0;
          let totalReturned = 0;

          entryLogs.forEach(log => {
            const logItem = log.items?.find(i => i.itemName === item.itemName);
            if (logItem) {
              totalTaken += logItem.takenQty || 0;
              totalReturned += logItem.returnedQty || 0;
            }
          });

          // Calculate available stock
          const availableStock = (item.storeInQty || 0) - totalTaken + totalReturned;

          // Determine stock status
          let stockStatus = 'available';
          if (availableStock <= 0) {
            stockStatus = 'outOfStock';
          } else if (availableStock < (item.storeInQty * 0.2)) { // Less than 20% of initial stock
            stockStatus = 'low';
          }

          inventory.push({
            _id: `${entry._id}-${item.itemName}`,
            storeId: entry.storeId,
            storeEntryDate: entry.storeEntryDate,
            orderId: entry.orderId,
            PURNo: entry.PURNo,
            orderType: entry.orderType,
            buyerCode: entry.buyerCode,
            itemName: item.itemName,
            itemType: item.itemType,
            unit: item.unit,
            supplierName: item.supplierName,
            supplierCode: item.supplierCode,
            invoiceNo: item.invoiceNo,
            invoiceDate: item.invoiceDate,
            hsn: item.hsn,
            initialStock: item.storeInQty,
            totalTaken,
            totalReturned,
            availableStock,
            stockStatus,
            shortage: item.shortage || 0,
            surplus: item.surplus || 0
          });
        }
      }

      setInventoryData(inventory);
      setError(null);
    } catch (err) {
      console.error("Error fetching inventory data:", err);
      setError("Failed to fetch inventory data");
      setInventoryData([]);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const getFilteredInventory = () => {
    let filtered = inventoryData;

    // Apply status filter
    if (filter !== "all") {
      filtered = filtered.filter(item => item.stockStatus === filter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.storeId.toLowerCase().includes(query) ||
        item.orderId.toLowerCase().includes(query) ||
        item.itemName.toLowerCase().includes(query) ||
        item.supplierName.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const filteredInventory = getFilteredInventory();

  // Calculate summary stats
  const stats = {
    totalItems: inventoryData.length,
    available: inventoryData.filter(i => i.stockStatus === 'available').length,
    low: inventoryData.filter(i => i.stockStatus === 'low').length,
    outOfStock: inventoryData.filter(i => i.stockStatus === 'outOfStock').length,
    totalValue: inventoryData.reduce((sum, i) => sum + i.availableStock, 0)
  };

  const columns = [
    {
      key: "storeId",
      label: "STORE ID",
      width: "6%",
      render: (item) => (
        <div className="font-medium text-[9px] leading-tight break-words">
          <div className="text-gray-800 font-semibold text-[9px]">{item.storeId}</div>
          <div className="text-gray-600 text-[8px] mt-0.5">{item.orderId}</div>
        </div>
      )
    },
    {
      key: "storeEntryDate",
      label: "ENTRY DATE",
      width: "5%",
      render: (item) => (
        <div className="text-[9px] font-semibold leading-tight">
          {item.storeEntryDate ? new Date(item.storeEntryDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
          }) : "—"}
        </div>
      )
    },
    {
      key: "itemName",
      label: "ITEM NAME",
      width: "10%",
      render: (item) => (
        <div className="text-[9px] leading-tight">
          <div className="font-semibold text-gray-800">{item.itemName}</div>
          {/* <div className="text-gray-600 text-[8px] mt-0.5">HSN: {item.hsn || "—"}</div> */}
        </div>
      )
    },
    {
      key: "itemType",
      label: "TYPE",
      width: "5%",
      render: (item) => (
        <span className={`px-2 py-1 rounded text-[9px] font-medium inline-block ${
          item.itemType === 'fabric' ? 'bg-blue-100 text-blue-700' :
          item.itemType === 'accessories' ? 'bg-purple-100 text-purple-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {item.itemType}
        </span>
      )
    },
    {
      key: "supplier",
      label: "SUPPLIER",
      width: "8%",
      render: (item) => (
        <div className="text-[9px] leading-tight">
          <div className="font-semibold text-gray-800">{item.supplierName}</div>
          {item.supplierCode && (
            <div className="text-gray-600 text-[8px] mt-0.5">{item.supplierCode}</div>
          )}
        </div>
      )
    },
    {
      key: "invoice",
      label: "INVOICE",
      width: "8%",
      render: (item) => (
        <div className="text-[9px] leading-tight">
          <div className="font-semibold text-gray-800">{item.invoiceNo || "—"}</div>
          {item.invoiceDate && (
            <div className="text-gray-600 text-[8px] mt-0.5">
              {new Date(item.invoiceDate).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
              })}
            </div>
          )}
        </div>
      )
    },
    {
      key: "initialStock",
      label: "INITIAL",
      width: "6%",
      render: (item) => (
        <div className="text-[9px] leading-tight text-center">
          <div className="font-bold text-blue-700">{item.initialStock.toLocaleString()}</div>
          <div className="text-gray-600 text-[8px] mt-0.5">{item.unit}</div>
        </div>
      )
    },
    {
      key: "totalTaken",
      label: "TAKEN",
      width: "6%",
      render: (item) => (
        <div className="text-[9px] leading-tight text-center">
          <div className="font-bold text-orange-600">{item.totalTaken.toLocaleString()}</div>
          <div className="text-gray-600 text-[8px] mt-0.5">{item.unit}</div>
        </div>
      )
    },
    {
      key: "totalReturned",
      label: "RETURNED",
      width: "6%",
      render: (item) => (
        <div className="text-[9px] leading-tight text-center">
          <div className="font-bold text-blue-600">{item.totalReturned.toLocaleString()}</div>
          <div className="text-gray-600 text-[8px] mt-0.5">{item.unit}</div>
        </div>
      )
    },
    {
      key: "availableStock",
      label: "AVAILABLE",
      width: "7%",
      render: (item) => (
        <div className="text-[9px] leading-tight text-center">
          <div className={`font-bold text-lg ${
            item.availableStock <= 0 ? 'text-red-600' :
            item.stockStatus === 'low' ? 'text-orange-600' :
            'text-green-600'
          }`}>
            {item.availableStock.toLocaleString()}
          </div>
          <div className="text-gray-600 text-[8px] mt-0.5 font-semibold">{item.unit}</div>
        </div>
      )
    },
    {
      key: "stockStatus",
      label: "STATUS",
      width: "7%",
      render: (item) => {
        const statusConfig = {
          available: { 
            label: "Available", 
            icon: CheckCircle, 
            className: "bg-green-500 text-white" 
          },
          low: { 
            label: "Low Stock", 
            icon: AlertTriangle, 
            className: "bg-orange-500 text-white" 
          },
          outOfStock: { 
            label: "Out of Stock", 
            icon: TrendingDown, 
            className: "bg-red-500 text-white" 
          }
        };
        
        const config = statusConfig[item.stockStatus];
        const Icon = config.icon;
        
        return (
          <div className="flex items-center justify-center">
            <span className={`px-2 py-1 rounded text-[9px] font-medium inline-flex items-center ${config.className}`}>
              <Icon className="w-3 h-3 mr-1" />
              {config.label}
            </span>
          </div>
        );
      }
    },
    {
      key: "orderInfo",
      label: "ORDER",
      width: "6%",
      render: (item) => (
        <div className="text-[9px] leading-tight">
          <div className="text-gray-600 text-[8px]">Type:</div>
          <div className="font-semibold text-gray-800">{item.orderType}</div>
          <div className="text-gray-600 text-[8px] mt-0.5">Buyer: {item.buyerCode}</div>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading inventory data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Store Inventory</h1>
          <p className="text-gray-600 text-sm mt-1">
            Real-time warehouse stock levels and availability
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Summary Cards
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-600 mb-1">Total Items</div>
              <div className="text-2xl font-bold text-gray-800">{stats.totalItems}</div>
            </div>
            <Package className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-green-700 mb-1">Available</div>
              <div className="text-2xl font-bold text-green-700">{stats.available}</div>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-orange-700 mb-1">Low Stock</div>
              <div className="text-2xl font-bold text-orange-700">{stats.low}</div>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-red-700 mb-1">Out of Stock</div>
              <div className="text-2xl font-bold text-red-700">{stats.outOfStock}</div>
            </div>
            <TrendingDown className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-blue-700 mb-1">Total Available</div>
              <div className="text-2xl font-bold text-blue-700">{stats.totalValue.toFixed(0)}</div>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div> */}

      {/* Filters Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex space-x-2">
            {[
              { key: "all", label: "All Items", count: stats.totalItems },
              { key: "available", label: "Available", count: stats.available },
              { key: "low", label: "Low Stock", count: stats.low },
              { key: "outOfStock", label: "Out of Stock", count: stats.outOfStock }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`py-1.5 px-3 text-xs font-medium rounded-lg transition-colors ${
                  filter === tab.key
                    ? "bg-blue-600 text-white"
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

          {/* Search Box */}
          <div className="ml-auto flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Store ID, Order ID, Item..."
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-64"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="px-3 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 rounded-lg"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      {filteredInventory.length > 0 ? (
        <div className="w-full overflow-x-hidden">
          <DataTable
            columns={columns}
            data={filteredInventory}
            actions={[]}
          />
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <div className="text-gray-500 text-lg mb-2">No inventory items found</div>
          <div className="text-gray-400 text-sm mb-4">
            {filter === "all" && !searchQuery
              ? "No items in inventory yet"
              : `No items matching "${searchQuery || filter}" filter`}
          </div>
        </div>
      )}
    </div>
  );
}