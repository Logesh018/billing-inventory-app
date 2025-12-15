import { useState, useEffect } from 'react';
import { Search, Save, X, Plus, Trash2, AlertCircle, Package, History } from 'lucide-react';
import { getStoreEntries } from '../../api/storeEntryApi';
import { createStoreLog, updateStoreLog, getStoreLogsByStoreEntry, getAvailableStock, getStoreLogById } from '../../api/storeLogApi';
import { showError, showWarning, showSuccess, showLoading, dismissAndSuccess, dismissAndError } from '../../utils/toast';

const StoreLogForm = ({ initialValues, onSubmit, onCancel, isEditMode }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [storeEntries, setStoreEntries] = useState([]);
  const [selectedStoreEntry, setSelectedStoreEntry] = useState(null);
  const [availableStock, setAvailableStock] = useState([]);
  const [previousLogs, setPreviousLogs] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreviousLogs, setShowPreviousLogs] = useState(false);
  const [isLoadingEditData, setIsLoadingEditData] = useState(false);

  const [formData, setFormData] = useState({
    logDate: new Date().toISOString().split('T')[0],
    personName: '',
    personRole: '',
    department: '',
    loginTime: '',
    logoutTime: '',
    items: [
      {
        itemName: '',
        itemType: 'fabric',
        unit: 'kg',
        takenQty: 0,
        returnedQty: 0,
        inHandQty: 0,
        returnDate: '',
        productCount: 0,
        status: 'Out',
        remarks: ''
      }
    ]
  });

  useEffect(() => {
    fetchStoreEntries();
  }, []);

  useEffect(() => {
    if (isEditMode && initialValues) {
      loadEditData();
    }
  }, [isEditMode, initialValues]);

  const loadEditData = async () => {
    setIsLoadingEditData(true);
    try {
      const logRes = await getStoreLogById(initialValues._id);
      const logData = logRes.data;

      setFormData({
        logDate: logData.logDate 
          ? new Date(logData.logDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        personName: logData.personName || '',
        personRole: logData.personRole || '',
        department: logData.department || '',
        loginTime: logData.loginTime || '',
        logoutTime: logData.logoutTime || '',
        items: logData.items?.length > 0 ? logData.items.map(item => ({
          itemName: item.itemName || '',
          itemType: item.itemType || 'fabric',
          unit: item.unit || 'kg',
          takenQty: item.takenQty || 0,
          returnedQty: item.returnedQty || 0,
          inHandQty: item.inHandQty || 0,
          returnDate: item.returnDate 
            ? new Date(item.returnDate).toISOString().split('T')[0]
            : '',
          productCount: logData.productCount || 0,
          status: logData.status || 'Out',
          remarks: item.remarks || ''
        })) : [
          {
            itemName: '',
            itemType: 'fabric',
            unit: 'kg',
            takenQty: 0,
            returnedQty: 0,
            inHandQty: 0,
            returnDate: '',
            productCount: 0,
            status: 'Out',
            remarks: ''
          }
        ]
      });

      if (logData.storeEntry) {
        const storeEntryId = typeof logData.storeEntry === 'object' 
          ? logData.storeEntry._id 
          : logData.storeEntry;
        await loadStoreEntryById(storeEntryId);
      }
    } catch (error) {
      console.error("Error loading edit data:", error);
      showError("Failed to load log data");
    } finally {
      setIsLoadingEditData(false);
    }
  };

  const fetchStoreEntries = async () => {
    try {
      const res = await getStoreEntries({ status: 'Completed' });
      setStoreEntries(res.data || []);
    } catch (error) {
      console.error("Error fetching store entries:", error);
      setStoreEntries([]);
    }
  };

  const loadStoreEntryById = async (storeEntryId) => {
    try {
      const entry = storeEntries.find(e => e._id === storeEntryId);
      if (entry) {
        setSelectedStoreEntry(entry);
        await loadAvailableStock(storeEntryId);
        await loadPreviousLogs(storeEntryId);
      } else {
        await fetchStoreEntries();
        const allEntries = await getStoreEntries();
        const foundEntry = allEntries.data.find(e => e._id === storeEntryId);
        if (foundEntry) {
          setSelectedStoreEntry(foundEntry);
          await loadAvailableStock(storeEntryId);
          await loadPreviousLogs(storeEntryId);
        }
      }
    } catch (error) {
      console.error("Error loading store entry:", error);
    }
  };

  const handleSearchStoreEntry = async () => {
    if (!searchQuery.trim()) {
      showWarning("Please select a Store Entry");
      return;
    }

    setIsSearching(true);
    const toastId = showLoading("Loading...");

    try {
      const entry = storeEntries.find(e => e.storeId === searchQuery);

      if (!entry) {
        dismissAndError(toastId, "Store entry not found");
        return;
      }

      setSelectedStoreEntry(entry);
      await loadAvailableStock(entry._id);
      await loadPreviousLogs(entry._id);
      
      dismissAndSuccess(toastId, `Store entry ${entry.storeId} loaded!`);
    } catch (error) {
      console.error("Error searching store entry:", error);
      dismissAndError(toastId, "Error loading store entry");
    } finally {
      setIsSearching(false);
    }
  };

  const loadAvailableStock = async (storeEntryId) => {
    try {
      const res = await getAvailableStock(storeEntryId);
      setAvailableStock(res.data.stockData || []);
    } catch (error) {
      console.error("Error loading available stock:", error);
      setAvailableStock([]);
    }
  };

  const loadPreviousLogs = async (storeEntryId) => {
    try {
      const res = await getStoreLogsByStoreEntry(storeEntryId);
      setPreviousLogs(res.data || []);
    } catch (error) {
      console.error("Error loading previous logs:", error);
      setPreviousLogs([]);
    }
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          itemName: '',
          itemType: 'fabric',
          unit: 'kg',
          takenQty: 0,
          returnedQty: 0,
          inHandQty: 0,
          returnDate: '',
          productCount: 0,
          status: 'Out',
          remarks: ''
        }
      ]
    });
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length === 1) {
      showWarning("At least one item is required");
      return;
    }
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: updatedItems });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;

    if (field === 'itemName' && value) {
      const stockItem = availableStock.find(s => s.itemName === value);
      if (stockItem) {
        updatedItems[index].itemType = stockItem.itemType || 'fabric';
        updatedItems[index].unit = stockItem.unit || 'kg';
      }
    }

    if (field === 'takenQty' || field === 'returnedQty') {
      const takenQty = parseFloat(updatedItems[index].takenQty) || 0;
      const returnedQty = parseFloat(updatedItems[index].returnedQty) || 0;
      updatedItems[index].inHandQty = takenQty - returnedQty;
    }

    setFormData({ ...formData, items: updatedItems });
  };

  const getAvailableStockForItem = (itemName) => {
    const stockItem = availableStock.find(s => s.itemName === itemName);
    return stockItem ? stockItem.availableStock : 0;
  };

  const handleSubmit = async () => {
    if (!selectedStoreEntry) {
      showError("Please select a store entry first");
      return;
    }

    if (!formData.logDate) {
      showError("Please select Log Date");
      return;
    }

    if (!isEditMode) {
      const hasValidItem = formData.items.some(item => 
        item.itemName && (parseFloat(item.takenQty) > 0 || parseFloat(item.returnedQty) > 0)
      );

      if (!hasValidItem) {
        showError("Please add at least one item with quantity");
        return;
      }

      for (const item of formData.items) {
        if (item.itemName && parseFloat(item.takenQty) > 0) {
          const available = getAvailableStockForItem(item.itemName);
          if (parseFloat(item.takenQty) > available) {
            showError(`Insufficient stock for ${item.itemName}. Available: ${available}, Requested: ${item.takenQty}`);
            return;
          }
        }
      }
    } else {
      for (const item of formData.items) {
        if (item.itemName && parseFloat(item.takenQty) > 0) {
          const originalItem = initialValues.items?.find(i => i.itemName === item.itemName);
          const originalTakenQty = originalItem ? originalItem.takenQty : 0;
          const additionalQty = parseFloat(item.takenQty) - originalTakenQty;

          if (additionalQty > 0) {
            const available = getAvailableStockForItem(item.itemName);
            if (additionalQty > available) {
              showError(`Insufficient stock for ${item.itemName}. Available: ${available}, Additional requested: ${additionalQty}`);
              return;
            }
          }
        }
      }
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    const toastId = showLoading(isEditMode ? "Updating store log..." : "Creating store log...");

    try {
      const totalProductCount = formData.items.reduce((sum, item) => sum + (parseInt(item.productCount) || 0), 0);
      const firstItemStatus = formData.items[0]?.status || 'Out';

      const payload = {
        storeEntryId: typeof selectedStoreEntry === 'object' 
          ? selectedStoreEntry._id 
          : selectedStoreEntry,
        logDate: formData.logDate,
        personName: formData.personName,
        personRole: formData.personRole,
        department: formData.department,
        loginTime: formData.loginTime,
        logoutTime: formData.logoutTime,
        productCount: totalProductCount,
        status: firstItemStatus,
        items: formData.items
          .filter(item => item.itemName)
          .map(item => ({
            itemName: item.itemName,
            itemType: item.itemType || 'fabric',
            unit: item.unit || 'kg',
            takenQty: parseFloat(item.takenQty) || 0,
            returnedQty: parseFloat(item.returnedQty) || 0,
            returnDate: item.returnDate || null,
            remarks: item.remarks || ''
          })),
        remarks: ''
      };

      if (isEditMode && initialValues?._id) {
        await updateStoreLog(initialValues._id, payload);
        dismissAndSuccess(toastId, "Store log updated successfully!");
      } else {
        await createStoreLog(payload);
        dismissAndSuccess(toastId, "Store log created successfully!");
      }

      onSubmit();
    } catch (error) {
      console.error("Error saving store log:", error);
      dismissAndError(toastId, error.response?.data?.message || "Failed to save store log");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingEditData) {
    return (
      <div className="w-full mx-auto bg-white p-5 rounded-2xl">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading log data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto bg-white p-5 rounded-2xl">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {isEditMode ? 'Edit Store Log' : 'Create Store Log'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {isEditMode ? 'Update worker material usage log' : 'Record worker material take/return activity'}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            <X className="w-4 h-4 mr-1.5" />
            Cancel
          </button>
        </div>

        {/* Search Section */}
        {!isEditMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
              <Search className="w-4 h-4 mr-2 text-blue-600" />
              Select Store Entry
            </h3>
            <div className="flex gap-3">
              <div className="flex-1">
                <select
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  disabled={isSearching}
                >
                  <option value="">Select Store Entry...</option>
                  {storeEntries.map(entry => (
                    <option key={entry._id} value={entry.storeId}>
                      {entry.storeId} - Order: {entry.orderId} - {entry.orderType}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSearchStoreEntry}
                disabled={isSearching || !searchQuery}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors flex items-center"
              >
                <Search className="w-4 h-4 mr-2" />
                {isSearching ? 'Loading...' : 'Load'}
              </button>
            </div>
          </div>
        )}

        {/* Store Entry Info */}
        {selectedStoreEntry && (
          <>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                    <Package className="w-4 h-4 mr-2 text-green-600" />
                    Store Entry Details
                  </h3>
                  <div className="grid grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-gray-600">Store ID:</span>
                      <div className="font-semibold text-gray-800">{selectedStoreEntry.storeId}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Order ID:</span>
                      <div className="font-semibold text-gray-800">{selectedStoreEntry.orderId}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Purchase ID:</span>
                      <div className="font-semibold text-gray-800">{selectedStoreEntry.PURNo}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Order Type:</span>
                      <div className="font-semibold text-gray-800">{selectedStoreEntry.orderType}</div>
                    </div>
                  </div>
                </div>
                {previousLogs.length > 0 && (
                  <button
                    onClick={() => setShowPreviousLogs(!showPreviousLogs)}
                    className="ml-4 px-3 py-1.5 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 text-xs font-medium flex items-center"
                  >
                    <History className="w-3 h-3 mr-1.5" />
                    {showPreviousLogs ? 'Hide' : 'Show'} Previous Logs ({previousLogs.length})
                  </button>
                )}
              </div>
            </div>

            {/* Previous Logs */}
            {showPreviousLogs && previousLogs.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Previous Logs</h3>
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-2 py-2 text-left">Log ID</th>
                        <th className="px-2 py-2 text-left">Date</th>
                        <th className="px-2 py-2 text-left">Person</th>
                        <th className="px-2 py-2 text-left">Department</th>
                        <th className="px-2 py-2 text-left">Items</th>
                        <th className="px-2 py-2 text-right">Taken</th>
                        <th className="px-2 py-2 text-right">Returned</th>
                        <th className="px-2 py-2 text-right">In Hand</th>
                        <th className="px-2 py-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {previousLogs.map((log, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-2 py-2 font-medium">{log.logId}</td>
                          <td className="px-2 py-2">{new Date(log.logDate).toLocaleDateString('en-IN')}</td>
                          <td className="px-2 py-2">{log.personName || '—'}</td>
                          <td className="px-2 py-2">{log.department || '—'}</td>
                          <td className="px-2 py-2">
                            {log.items?.map(item => item.itemName).join(', ') || '—'}
                          </td>
                          <td className="px-2 py-2 text-right font-semibold text-orange-600">
                            {log.totalTakenQty || 0}
                          </td>
                          <td className="px-2 py-2 text-right font-semibold text-blue-600">
                            {log.totalReturnedQty || 0}
                          </td>
                          <td className="px-2 py-2 text-right font-semibold text-green-600">
                            {log.totalInHandQty || 0}
                          </td>
                          <td className="px-2 py-2 text-center">
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              log.status === 'Completed' ? 'bg-green-100 text-green-700' :
                              log.status === 'Out' ? 'bg-orange-100 text-orange-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Available Stock */}
            {/* {availableStock.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 text-yellow-600" />
                  Available Stock
                </h3>
                <div className="grid grid-cols-4 gap-3 text-xs">
                  {availableStock.map((stock, idx) => (
                    <div key={idx} className="bg-white rounded px-3 py-2 border border-yellow-200">
                      <div className="font-semibold text-gray-800">{stock.itemName}</div>
                      <div className="text-gray-600 mt-1">
                        Available: <span className="font-bold text-green-600">{stock.availableStock} {stock.unit}</span>
                      </div>
                      <div className="text-gray-500 text-[10px]">
                        Initial: {stock.initialStock} {stock.unit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )} */}

            {/* Store Log Form */}
            <div className="flex items-center justify-between mt-6 mb-3">
              <h3 className="text-lg font-bold text-gray-800">Store Log Entry</h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Item
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-4">
              {/* Worker Details Header */}
              <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold text-gray-600 uppercase border-b pb-2">
                <div className="col-span-2">Log Date</div>
                <div className="col-span-2">Log ID</div>
                <div className="col-span-2">Person Name</div>
                <div className="col-span-2">Person Role</div>
                <div className="col-span-2.5">Department</div>
                {/* <div className="col-span-1.5">Login Time</div>
                <div className="col-span-1.5">Logout Time</div> */}
              </div>

              {/* Worker Details Row */}
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-2">
                  <input
                    type="date"
                    value={formData.logDate}
                    onChange={(e) => setFormData({ ...formData, logDate: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-xs"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    value={isEditMode ? initialValues?.logId : 'Auto'}
                    readOnly
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-gray-100 text-gray-600"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    value={formData.personName}
                    onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-xs"
                    placeholder="Worker name"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    value={formData.personRole}
                    onChange={(e) => setFormData({ ...formData, personRole: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-xs"
                    placeholder="e.g., Tailor"
                  />
                </div>
                <div className="col-span-2.5">
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-xs"
                    placeholder="e.g., Cutting"
                  />
                </div>
                {/* <div className="col-span-1.5">
                  <input
                    type="time"
                    value={formData.loginTime}
                    onChange={(e) => setFormData({ ...formData, loginTime: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>
                <div className="col-span-1.5">
                  <input
                    type="time"
                    value={formData.logoutTime}
                    onChange={(e) => setFormData({ ...formData, logoutTime: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div> */}
              </div>

              {/* Material Items Header */}
              <div className="pt-4 border-t">
                {/* <h4 className="text-xs font-semibold text-gray-700 mb-3">Material Items</h4> */}
                <div className="grid grid-cols-13 gap-2 text-[10px] font-semibold text-gray-600 uppercase">
                  <div className="col-span-0.5"></div>
                  <div className="col-span-2">Item Name</div>
                  <div className="col-span-0.5">Unit</div>
                  <div className="col-span-1">Taken Qty</div>
                  <div className="col-span-1 text-[10px]">Return Qty</div>
                  <div className="col-span-1">In Hand</div>
                  <div className="col-span-1.5 text-[9px]">Return Date</div>
                  <div className="col-span-1 text-[9px]">Prod. Count</div>
                  <div className="col-span-1.5">Status</div>
                  <div className="col-span-2">Item Remarks</div>
                  <div className="col-span-0.5"></div>
                </div>
              </div>

              {/* Items Rows */}
              <div className="space-y-2">
                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-13 gap-2 items-center">
                    <div className="col-span-0.5 flex items-center justify-center">
                      <span className="text-xs font-semibold text-gray-700">{index + 1}</span>
                    </div>
                    <div className="col-span-2">
                      <select
                        value={item.itemName}
                        onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select item...</option>
                        {availableStock.map((stock, idx) => (
                          <option key={idx} value={stock.itemName}>
                            {stock.itemName} ({stock.availableStock} {stock.unit})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-0.5">
                      <input
                        type="text"
                        value={item.unit}
                        readOnly
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-gray-50 text-center"
                      />
                    </div>
                    <div className="col-span-1">
                      <input
                        type="number"
                        value={item.takenQty}
                        onChange={(e) => handleItemChange(index, 'takenQty', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="col-span-1">
                      <input
                        type="number"
                        value={item.returnedQty}
                        onChange={(e) => handleItemChange(index, 'returnedQty', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="col-span-1">
                      <input
                        type="number"
                        value={item.inHandQty}
                        readOnly
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-green-50 font-semibold text-green-700"
                      />
                    </div>
                    <div className="col-span-1.5">
                      <input
                        type="date"
                        value={item.returnDate}
                        onChange={(e) => handleItemChange(index, 'returnDate', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-1">
                      <input
                        type="number"
                        value={item.productCount}
                        onChange={(e) => handleItemChange(index, 'productCount', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500"
                        min="0"
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-1.5">
                      <select
                        value={item.status}
                        onChange={(e) => handleItemChange(index, 'status', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="In Store">In Store</option>
                        <option value="Out">Out</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={item.remarks}
                        onChange={(e) => handleItemChange(index, 'remarks', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500"
                        placeholder="Notes..."
                      />
                    </div>
                    <div className="col-span-0.5 flex justify-center items-center">
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:text-red-700"
                          title="Remove Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedStoreEntry}
                className="flex items-center px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 mr-1.5" />
                {isSubmitting ? 'Saving...' : isEditMode ? 'Update Store Log' : 'Create Store Log'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StoreLogForm;