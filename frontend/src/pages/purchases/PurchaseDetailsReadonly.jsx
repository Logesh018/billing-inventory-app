import React from 'react';

const PurchaseDetailsReadonly = ({ purchase }) => {
  if (!purchase) return null;

  const formatArrayField = (field) => {
    if (!field) return '-';
    if (Array.isArray(field)) {
      return field.filter(Boolean).join(', ') || '-';
    }
    return field;
  };

  // Get products from purchase
  const getProducts = () => {
    if (purchase.products && purchase.products.length > 0) {
      return purchase.products;
    }
    return [];
  };

  const products = getProducts();

  // Sort products
  const sortedProducts = [...products].sort((a, b) => {
    const fabricA = (a.productDetails?.fabric || '').toUpperCase();
    const fabricB = (b.productDetails?.fabric || '').toUpperCase();
    const colorA = (a.productDetails?.color || '').toUpperCase();
    const colorB = (b.productDetails?.color || '').toUpperCase();

    return fabricA.localeCompare(fabricB) || colorA.localeCompare(colorB);
  });

  // Calculate grand total
  const grandTotalQty = sortedProducts.reduce((sum, prod) => {
    if (prod.sizes && Array.isArray(prod.sizes)) {
      const sizeTotal = prod.sizes.reduce((t, s) => t + (s.qty || s.quantity || 0), 0);
      return sum + sizeTotal;
    }
    return sum + (prod.productTotalQty || 0);
  }, 0);

  // Check if using new or old structure
  const hasNewStructure = purchase.purchaseItems && purchase.purchaseItems.length > 0;
  const hasOldStructure = (purchase.fabricPurchases && purchase.fabricPurchases.length > 0) ||
    (purchase.accessoriesPurchases && purchase.accessoriesPurchases.length > 0);

  return (
    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 shadow-sm border-2 border-blue-300">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">
          Original Purchase Details (Read-only)
        </h3>

        {/* Header Info - 2 rows with 5 columns each */}
        <div className="grid grid-cols-5 gap-3 mb-3">
          {/* Row 1 */}
          <div>
            <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Purchase ID</label>
            <div className="text-xs font-bold text-blue-700">
              {purchase.PURNo || '-'}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Purchase Date</label>
            <div className="text-xs font-medium text-gray-900">
              {purchase.purchaseDate
                ? new Date(purchase.purchaseDate).toLocaleDateString('en-IN')
                : '-'}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Order ID</label>
            <div className="text-xs font-bold text-blue-700">
              {purchase.orderId || '-'}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Order Date</label>
            <div className="text-xs font-medium text-gray-900">
              {purchase.orderDate
                ? new Date(purchase.orderDate).toLocaleDateString('en-IN')
                : '-'}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Buyer Code</label>
            <div className="text-xs font-medium text-gray-900">
              {purchase.buyerCode || '-'}
            </div>
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-5 gap-3 mb-3">
          <div>
            <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Estimation ID</label>
            <div className={`text-xs font-bold ${purchase.PESNo === 'N/A' ? 'text-gray-500' : 'text-green-700'}`}>
              {purchase.PESNo || 'N/A'}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Estimation Date</label>
            <div className="text-xs font-medium text-gray-900">
              {purchase.estimationDate
                ? new Date(purchase.estimationDate).toLocaleDateString('en-IN')
                : '-'}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Order Type</label>
            <div
              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                purchase.orderType === 'JOB-Works'
                  ? 'bg-purple-100 text-purple-800'
                  : purchase.orderType === 'Own-Orders'
                    ? 'bg-teal-100 text-teal-800'
                    : 'bg-blue-100 text-blue-800'
              }`}
            >
              {purchase.orderType || '-'}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Status</label>
            <div className="text-xs font-medium text-gray-900">
              {purchase.status || purchase.orderStatus || '-'}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Total Qty</label>
            <div className="text-xs font-bold text-blue-600">
              {purchase.totalQty || 0} units
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      {sortedProducts.length > 0 && (
        <div className="mt-3 pt-3 border-t border-blue-300">
          {/* Table Header */}
          <div
            className="grid gap-2 mb-1.5 text-[10px] font-medium text-gray-700"
            style={{
              gridTemplateColumns: '2fr 0.7fr 0.7fr 2fr 0.6fr 0.6fr',
            }}
          >
            <label>Product</label>
            <label>Fabric</label>
            <label>Color</label>
            <label>Size & Qty</label>
            <label className="text-center">Total Qty</label>
            <label className="text-center font-bold text-blue-700">Grand Qty</label>
          </div>

          {/* Table Body */}
          {sortedProducts.map((prod, idx) => {
            // Calculate product total
            let productTotal = 0;
            let sizeQtyPairs = [];

            if (prod.sizes && Array.isArray(prod.sizes)) {
              productTotal = prod.sizes.reduce((sum, s) => sum + (s.qty || s.quantity || 0), 0);
              sizeQtyPairs = prod.sizes.map((s) => `${s.size}:${s.qty || s.quantity}`);
            } else {
              productTotal = prod.productTotalQty || 0;
            }

            const fabric = prod.productDetails?.fabric || '-';
            const color = prod.productDetails?.color || '-';
            const productName = prod.productDetails?.name || '-';

            return (
              <div
                key={idx}
                className={`grid gap-2 py-1.5 text-[10px] ${idx > 0 ? 'border-t border-blue-200' : ''}`}
                style={{
                  gridTemplateColumns: '2fr 0.7fr 0.7fr 2fr 0.6fr 0.6fr',
                }}
              >
                <div className="font-semibold text-gray-900">{productName}</div>
                <div className="text-gray-800">{fabric}</div>
                <div className="text-gray-800">{color}</div>
                <div className="text-gray-800 font-mono">
                  {sizeQtyPairs.length > 0 ? (
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                      {sizeQtyPairs.map((pair, i) => (
                        <span key={i} className="whitespace-nowrap">
                          {pair}
                          {i < sizeQtyPairs.length - 1 ? ',' : ''}
                        </span>
                      ))}
                    </div>
                  ) : (
                    '-'
                  )}
                </div>
                <div className="font-bold text-blue-600 text-center">{productTotal}</div>
                {idx === 0 && (
                  <div
                    className="text-center text-blue-700 font-bold text-sm"
                    style={{ gridRow: `span ${sortedProducts.length}` }}
                  >
                    {grandTotalQty}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Purchase Details - NEW STRUCTURE */}
      {hasNewStructure && (
        <div className="mt-4 pt-3 border-t border-blue-300">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Purchase Details:</h4>
          
          <div className="space-y-3">
            {purchase.purchaseItems.map((vendorItem, vIdx) => (
              <div key={vIdx}>
                {/* Vendor Header */}
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-blue-200">
                  <div>
                    <span className="text-xs font-semibold text-gray-800">
                      Vendor: {vendorItem.vendor || 'N/A'}
                    </span>
                    <span className="text-[10px] text-gray-600 ml-2">
                      ({vendorItem.vendorCode}) • {vendorItem.vendorState}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-green-600">
                    ₹{(vendorItem.itemTotalWithGst || 0).toLocaleString()}
                  </div>
                </div>

                {/* Items Table */}
                {vendorItem.items && vendorItem.items.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[9px] border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-2 py-1 text-left font-medium text-gray-700">Item</th>
                          <th className="border border-gray-200 px-2 py-1 text-left font-medium text-gray-700">Invoice No</th>
                          <th className="border border-gray-200 px-2 py-1 text-left font-medium text-gray-700">Invoice Date</th>
                          <th className="border border-gray-200 px-2 py-1 text-left font-medium text-gray-700">HSN</th>
                          <th className="border border-gray-200 px-2 py-1 text-center font-medium text-gray-700">GSM</th>
                          <th className="border border-gray-200 px-2 py-1 text-center font-medium text-gray-700">Color</th>
                          <th className="border border-gray-200 px-2 py-1 text-right font-medium text-gray-700">Qty & Unit</th>
                          <th className="border border-gray-200 px-2 py-1 text-right font-medium text-gray-700">Rate</th>
                          <th className="border border-gray-200 px-2 py-1 text-right font-medium text-gray-700">Product Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendorItem.items.map((item, iIdx) => (
                          <tr key={iIdx} className="hover:bg-gray-50">
                            <td className="border border-gray-200 px-2 py-1 font-medium text-gray-800">
                              {item.itemName}
                            </td>
                            <td className="border border-gray-200 px-2 py-1 text-gray-700">
                              {item.invoiceNo || '-'}
                            </td>
                            <td className="border border-gray-200 px-2 py-1 text-gray-600">
                              {item.invoiceDate 
                                ? new Date(item.invoiceDate).toLocaleDateString('en-IN', { 
                                    day: '2-digit', 
                                    month: '2-digit',
                                    year: '2-digit'
                                  }) 
                                : '-'}
                            </td>
                            <td className="border border-gray-200 px-2 py-1 text-gray-600">
                              {item.hsn || '-'}
                            </td>
                            <td className="border border-gray-200 px-2 py-1 text-center text-gray-600">
                              {item.gsm || '-'}
                            </td>
                            <td className="border border-gray-200 px-2 py-1 text-center text-gray-600">
                              {item.color || '-'}
                            </td>
                            <td className="border border-gray-200 px-2 py-1 text-right font-semibold text-blue-600">
                              {item.quantity} {item.purchaseUnit}
                            </td>
                            <td className="border border-gray-200 px-2 py-1 text-right text-gray-700">
                              ₹{item.costPerUnit}
                            </td>
                            <td className="border border-gray-200 px-2 py-1 text-right font-bold text-gray-800">
                              ₹{(item.quantity * item.costPerUnit).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Purchase Grand Total */}
          <div className="mt-3 bg-blue-100 rounded-lg p-3 border border-blue-300">
            <div className="flex justify-between items-center">
              <div className="text-sm font-semibold text-gray-800">Purchase Grand Total:</div>
              <div className="text-lg font-bold text-blue-700">
                ₹{(purchase.grandTotalWithGst || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Details - OLD STRUCTURE */}
      {hasOldStructure && !hasNewStructure && (
        <div className="mt-4 pt-3 border-t border-blue-300">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Purchase Details:</h4>
          <p className="text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded mb-2 border border-amber-200">
            ⚠️ This is old format purchase document.
          </p>

          {/* Fabric Purchases */}
          {purchase.fabricPurchases && purchase.fabricPurchases.length > 0 && (
            <div className="mb-3">
              <div className="text-[9px] font-semibold text-gray-600 mb-1">Fabric Purchases</div>
              <div className="overflow-x-auto">
                <table className="w-full text-[9px] border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-2 py-1 text-left font-medium text-gray-700">Item</th>
                      <th className="border border-gray-200 px-2 py-1 text-left font-medium text-gray-700">Vendor</th>
                      <th className="border border-gray-200 px-2 py-1 text-center font-medium text-gray-700">GSM</th>
                      <th className="border border-gray-200 px-2 py-1 text-center font-medium text-gray-700">Color</th>
                      <th className="border border-gray-200 px-2 py-1 text-right font-medium text-gray-700">Qty & Unit</th>
                      <th className="border border-gray-200 px-2 py-1 text-right font-medium text-gray-700">Rate</th>
                      <th className="border border-gray-200 px-2 py-1 text-right font-medium text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchase.fabricPurchases.map((fabric, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-2 py-1 font-medium text-gray-800">
                          {fabric.productName || fabric.fabricType}
                        </td>
                        <td className="border border-gray-200 px-2 py-1 text-gray-700">
                          {fabric.vendor} ({fabric.vendorCode})
                        </td>
                        <td className="border border-gray-200 px-2 py-1 text-center text-gray-600">
                          {fabric.gsm || '-'}
                        </td>
                        <td className="border border-gray-200 px-2 py-1 text-center text-gray-600">
                          {formatArrayField(fabric.colors)}
                        </td>
                        <td className="border border-gray-200 px-2 py-1 text-right font-semibold text-blue-600">
                          {fabric.quantity} {fabric.purchaseMode}
                        </td>
                        <td className="border border-gray-200 px-2 py-1 text-right text-gray-700">
                          ₹{fabric.costPerUnit}
                        </td>
                        <td className="border border-gray-200 px-2 py-1 text-right font-bold text-gray-800">
                          ₹{(fabric.totalWithGst || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Accessories Purchases */}
          {purchase.accessoriesPurchases && purchase.accessoriesPurchases.length > 0 && (
            <div className="mb-3">
              <div className="text-[9px] font-semibold text-gray-600 mb-1">Accessories Purchases</div>
              <div className="overflow-x-auto">
                <table className="w-full text-[9px] border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-2 py-1 text-left font-medium text-gray-700">Item</th>
                      <th className="border border-gray-200 px-2 py-1 text-left font-medium text-gray-700">Vendor</th>
                      <th className="border border-gray-200 px-2 py-1 text-center font-medium text-gray-700">Type</th>
                      <th className="border border-gray-200 px-2 py-1 text-center font-medium text-gray-700">Color</th>
                      <th className="border border-gray-200 px-2 py-1 text-right font-medium text-gray-700">Qty & Unit</th>
                      <th className="border border-gray-200 px-2 py-1 text-right font-medium text-gray-700">Rate</th>
                      <th className="border border-gray-200 px-2 py-1 text-right font-medium text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchase.accessoriesPurchases.map((accessory, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-2 py-1 font-medium text-gray-800">
                          {accessory.productName}
                        </td>
                        <td className="border border-gray-200 px-2 py-1 text-gray-700">
                          {accessory.vendor} ({accessory.vendorCode})
                        </td>
                        <td className="border border-gray-200 px-2 py-1 text-center text-gray-600">
                          {accessory.accessoryType}
                        </td>
                        <td className="border border-gray-200 px-2 py-1 text-center text-gray-600">
                          {accessory.color || '-'}
                        </td>
                        <td className="border border-gray-200 px-2 py-1 text-right font-semibold text-blue-600">
                          {accessory.quantity} {accessory.purchaseMode}
                        </td>
                        <td className="border border-gray-200 px-2 py-1 text-right text-gray-700">
                          ₹{accessory.costPerUnit}
                        </td>
                        <td className="border border-gray-200 px-2 py-1 text-right font-bold text-gray-800">
                          ₹{(accessory.totalWithGst || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Purchase Grand Total */}
          <div className="mt-3 bg-blue-100 rounded-lg p-3 border border-blue-300">
            <div className="flex justify-between items-center">
              <div className="text-sm font-semibold text-gray-800">Purchase Grand Total:</div>
              <div className="text-lg font-bold text-blue-700">
                ₹{(purchase.grandTotalWithGst || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseDetailsReadonly;