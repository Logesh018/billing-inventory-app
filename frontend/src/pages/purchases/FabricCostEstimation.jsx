import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X } from 'lucide-react';

const FabricCostEstimation = ({ fabricEstimations, setFabricEstimations, orderProducts }) => {
  const [fabricRows, setFabricRows] = useState([]);

  const createNewFabricRow = () => ({
    id: Date.now() + Math.random(),
    fabricName: '',
    color: '',
    style: '',
    meter: '',
    qty: '',
    total: 0
  });

  useEffect(() => {
    if (fabricRows.length === 0) {
      setFabricRows([createNewFabricRow()]);
    }
  }, []);

  // Calculate grouped estimations whenever fabricRows change
  useEffect(() => {
    const grouped = groupFabricsByNameAndColor(fabricRows);
    setFabricEstimations(grouped);
  }, [fabricRows]);

  const groupFabricsByNameAndColor = (rows) => {
    const validRows = rows.filter(row => 
      row.fabricName && row.color && row.meter && row.qty
    );

    const groupedMap = new Map();

    validRows.forEach(row => {
      const key = `${row.fabricName.toLowerCase()}-${row.color.toLowerCase()}`;
      const total = parseFloat(row.meter || 0) * parseFloat(row.qty || 0);

      if (groupedMap.has(key)) {
        const existing = groupedMap.get(key);
        existing.totalMeters += parseFloat(row.meter || 0);
        existing.totalQty += parseFloat(row.qty || 0);
        existing.grandTotal += total;
        existing.styles.add(row.style);
        existing.details.push({
          style: row.style,
          meter: parseFloat(row.meter || 0),
          qty: parseFloat(row.qty || 0),
          total: total
        });
      } else {
        groupedMap.set(key, {
          fabricName: row.fabricName,
          color: row.color,
          totalMeters: parseFloat(row.meter || 0),
          totalQty: parseFloat(row.qty || 0),
          grandTotal: total,
          styles: new Set([row.style]),
          details: [{
            style: row.style,
            meter: parseFloat(row.meter || 0),
            qty: parseFloat(row.qty || 0),
            total: total
          }]
        });
      }
    });

    return Array.from(groupedMap.values()).map(group => ({
      ...group,
      styles: Array.from(group.styles).filter(s => s).join(', ')
    }));
  };

  const addFabricRow = () => {
    setFabricRows([...fabricRows, createNewFabricRow()]);
  };

  const removeFabricRow = (id) => {
    if (fabricRows.length > 1) {
      setFabricRows(fabricRows.filter(row => row.id !== id));
    }
  };

  const updateFabricRow = (id, field, value) => {
    setFabricRows(prevRows => 
      prevRows.map(row => {
        if (row.id === id) {
          const updated = { ...row, [field]: value };
          
          // Auto-calculate total
          if (field === 'meter' || field === 'qty') {
            const meter = parseFloat(field === 'meter' ? value : updated.meter) || 0;
            const qty = parseFloat(field === 'qty' ? value : updated.qty) || 0;
            updated.total = meter * qty;
          }
          
          return updated;
        }
        return row;
      })
    );
  };

  const handleNumberFocus = (e) => {
    if (e.target.value === '0') {
      e.target.value = '';
    }
  };

  const groupedEstimations = groupFabricsByNameAndColor(fabricRows);

  return (
    <div className="space-y-4 w-full p-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Fabric Cost Estimation</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Fabrics with same name & color will be grouped together</p>
        </div>
        <button
          type="button"
          onClick={addFabricRow}
          className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors font-medium shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Row
        </button>
      </div>

      {/* Input Rows */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Fabric Name</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Color</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Style</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Meter</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Qty</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Total</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {fabricRows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.fabricName}
                      onChange={(e) => updateFabricRow(row.id, 'fabricName', e.target.value)}
                      placeholder="Fabric Name"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-1 focus:ring-green-400"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.color}
                      onChange={(e) => updateFabricRow(row.id, 'color', e.target.value)}
                      placeholder="Color"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-1 focus:ring-green-400"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.style}
                      onChange={(e) => updateFabricRow(row.id, 'style', e.target.value)}
                      placeholder="Style"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-1 focus:ring-green-400"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={row.meter}
                      onFocus={handleNumberFocus}
                      onChange={(e) => updateFabricRow(row.id, 'meter', e.target.value)}
                      placeholder="0"
                      className="w-20 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-1 focus:ring-green-400"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={row.qty}
                      onFocus={handleNumberFocus}
                      onChange={(e) => updateFabricRow(row.id, 'qty', e.target.value)}
                      placeholder="0"
                      className="w-20 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-1 focus:ring-green-400"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="px-2 py-1.5 text-sm bg-blue-50 dark:bg-blue-900 dark:bg-opacity-30 border border-blue-200 dark:border-blue-800 rounded text-blue-700 dark:text-blue-400 font-medium text-center">
                      {row.total.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {fabricRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFabricRow(row.id)}
                        className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 p-1 transition-colors"
                        title="Remove Row"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grouped Summary */}
      {groupedEstimations.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-600 rounded-lg border border-green-200 dark:border-gray-600 p-4">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Grouped Estimation (Purchase Requirements)
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-green-100 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Fabric Name</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Color</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Styles</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">Total Meters</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">Total Qty</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">Grand Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-200 dark:divide-gray-600 bg-white dark:bg-gray-800">
                {groupedEstimations.map((group, index) => (
                  <tr key={index} className="hover:bg-green-50 dark:hover:bg-gray-700">
                    <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-100">{group.fabricName}</td>
                    <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">{group.color}</td>
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 italic">{group.styles || 'N/A'}</td>
                    <td className="px-3 py-2 text-sm text-right font-medium text-gray-900 dark:text-gray-100">{group.totalMeters.toFixed(2)}</td>
                    <td className="px-3 py-2 text-sm text-right font-medium text-gray-900 dark:text-gray-100">{group.totalQty.toFixed(0)}</td>
                    <td className="px-3 py-2 text-sm text-right font-bold text-green-600 dark:text-green-400">{group.grandTotal.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="bg-green-100 dark:bg-gray-700 font-bold">
                  <td colSpan="3" className="px-3 py-2 text-sm text-right text-gray-700 dark:text-gray-300">Overall Total:</td>
                  <td className="px-3 py-2 text-sm text-right text-gray-900 dark:text-gray-100">
                    {groupedEstimations.reduce((sum, g) => sum + g.totalMeters, 0).toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-sm text-right text-gray-900 dark:text-gray-100">
                    {groupedEstimations.reduce((sum, g) => sum + g.totalQty, 0).toFixed(0)}
                  </td>
                  <td className="px-3 py-2 text-sm text-right text-green-700 dark:text-green-400">
                    {groupedEstimations.reduce((sum, g) => sum + g.grandTotal, 0).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FabricCostEstimation;