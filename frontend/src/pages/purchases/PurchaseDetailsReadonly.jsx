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
        
        {/* Header Info */}
        <div className="grid grid-cols-7 gap-3 mb-3">
          {/* Purchase ID */}
          <div>
            <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Purchase ID</label>
            <div className="text-xs font-bold text-blue-700">
              {purchase.PURNo || '-'}
            </div>
          </div>

          {/* Purchase Date */}
          <div>
            <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Purchase Date</label>
            <div className="text-xs font-medium text-gray-900">
              {purchase.purchaseDate 
                ? new Date(purchase.purchaseDate).toLocaleDateString('en-IN')
                : '-'}
            </div>
          </div>

          {/* Order ID */}
          <div>
            <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Order ID</label>
            <div className="text-xs font-bold text-blue-700">
              {purchase.orderId || '-'}
            </div>
          </div>
          
          {/* Order Date */}
          <div>
            <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Order Date</label>
            <div className="text-xs font-medium text-gray-900">
              {purchase.orderDate 
                ? new Date(purchase.orderDate).toLocaleDateString('en-IN')
                : '-'}
            </div>
          </div>
          
          {/* Buyer Code */}
          <div>
            <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Buyer Code</label>
            <div className="text-xs font-medium text-gray-900">
              {purchase.buyerCode || '-'}
            </div>
          </div>

          {/* Estimation ID (PESNo) */}
          <div>
            <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Estimation ID</label>
            <div className={`text-xs font-bold ${purchase.PESNo === 'N/A' ? 'text-gray-500' : 'text-green-700'}`}>
              {purchase.PESNo || 'N/A'}
            </div>
          </div>

          {/* Estimation Date */}
          <div>
            <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Estimation Date</label>
            <div className="text-xs font-medium text-gray-900">
              {purchase.estimationDate 
                ? new Date(purchase.estimationDate).toLocaleDateString('en-IN')
                : '-'}
            </div>
          </div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-3 gap-3">
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
              gridTemplateColumns: '2fr 0.7fr 0.7fr 2fr 0.6fr',
            }}
          >
            <label>Product</label>
            <label>Fabric</label>
            <label>Color</label>
            <label>Size & Qty</label>
            <label className="text-center">Total Qty</label>
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
                  gridTemplateColumns: '2fr 0.7fr 0.7fr 2fr 0.6fr',
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
              </div>
            );
          })}

          {/* Grand Total Row */}
          <div 
            className="grid border-t border-blue-300 pt-2 mt-2 text-[10px]" 
            style={{ gridTemplateColumns: '2fr 0.7fr 0.7fr 2fr 0.6fr' }}
          >
            <div className="col-span-3"></div>
            <div className="text-right pr-2 text-gray-700 font-semibold">Grand Qty:</div>
            <div className="text-center text-blue-700 font-bold">{grandTotalQty}</div>
          </div>
        </div>
      )}

      {/* Purchase Items Summary - NEW STRUCTURE */}
      {hasNewStructure && (
        <div className="mt-4 pt-3 border-t border-blue-300">
          <div className="text-[10px] font-medium text-gray-700 mb-2">Purchased Items Summary</div>
          <div className="space-y-2">
            {purchase.purchaseItems.map((vendorItem, vIdx) => (
              <div key={vIdx} className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-xs font-semibold text-gray-800">
                      {vendorItem.vendor || 'Vendor'}
                    </div>
                    <div className="text-[10px] text-gray-600">
                      {vendorItem.vendorCode} • {vendorItem.vendorState}
                    </div>
                  </div>
                  <div className="text-xs font-bold text-green-600">
                    ₹{(vendorItem.itemTotalWithGst || 0).toLocaleString()}
                  </div>
                </div>

                {vendorItem.items && vendorItem.items.length > 0 && (
                  <div className="space-y-1">
                    <div className="grid grid-cols-12 gap-1 text-[9px] font-medium text-gray-600 border-b pb-1">
                      <div className="col-span-1">Invoice No</div>
                      <div className="col-span-1">Invoice Date</div>
                      <div className="col-span-1">HSN</div>
                      <div className="col-span-3">Item Name</div>
                      <div className="col-span-1 text-center">GSM</div>
                      <div className="col-span-1 text-center">Color</div>
                      <div className="col-span-2 text-right">Qty & Unit</div>
                      <div className="col-span-2 text-right">Amount</div>
                    </div>
                    {vendorItem.items.map((item, iIdx) => (
                      <div 
                        key={iIdx} 
                        className="grid grid-cols-12 gap-1 text-[10px] text-gray-700 py-1"
                      >
                        <div className="col-span-1 truncate" title={item.invoiceNo || '-'}>
                          {item.invoiceNo || '-'}
                        </div>
                        <div className="col-span-1 text-gray-600">
                          {item.invoiceDate ? new Date(item.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit' }) : '-'}
                        </div>
                        <div className="col-span-1 text-gray-600">
                          {item.hsn || '-'}
                        </div>
                        <div className="col-span-3 font-medium">
                          {item.itemName}
                        </div>
                        <div className="col-span-1 text-center text-gray-500">
                          {item.gsm ? `${item.gsm}` : '-'}
                        </div>
                        <div className="col-span-1 text-center text-gray-500">
                          {item.color || '-'}
                        </div>
                        <div className="col-span-2 text-right font-semibold text-blue-600">
                          {item.quantity} {item.purchaseUnit}
                        </div>
                        <div className="col-span-2 text-right text-gray-700">
                          @ ₹{item.costPerUnit} = ₹{(item.quantity * item.costPerUnit).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Grand Total */}
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

      {/* Purchase Items Summary - OLD STRUCTURE */}
      {hasOldStructure && !hasNewStructure && (
        <div className="mt-4 pt-3 border-t border-blue-300">
          <div className="text-[10px] font-medium text-gray-700 mb-2">Purchased Items Summary (Legacy Format)</div>
          
          {/* Fabric Purchases */}
          {purchase.fabricPurchases && purchase.fabricPurchases.length > 0 && (
            <div className="mb-3">
              <div className="text-[9px] font-semibold text-gray-600 mb-1">Fabric Purchases</div>
              <div className="space-y-1">
                {purchase.fabricPurchases.map((fabric, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-2 border border-blue-200">
                    <div className="grid grid-cols-12 gap-1 text-[10px]">
                      <div className="col-span-3 font-medium text-gray-800">
                        {fabric.productName || fabric.fabricType}
                      </div>
                      <div className="col-span-1 text-center text-gray-600">
                        {fabric.gsm ? `${fabric.gsm} GSM` : '-'}
                      </div>
                      <div className="col-span-2 text-center text-gray-600">
                        {formatArrayField(fabric.colors)}
                      </div>
                      <div className="col-span-2 text-right font-semibold text-blue-600">
                        {fabric.quantity} {fabric.purchaseMode}
                      </div>
                      <div className="col-span-2 text-right text-gray-700">
                        @ ₹{fabric.costPerUnit}
                      </div>
                      <div className="col-span-2 text-right font-bold text-green-600">
                        ₹{(fabric.totalWithGst || 0).toFixed(2)}
                      </div>
                    </div>
                    <div className="text-[9px] text-gray-500 mt-1">
                      Vendor: {fabric.vendor} ({fabric.vendorCode})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accessories Purchases */}
          {purchase.accessoriesPurchases && purchase.accessoriesPurchases.length > 0 && (
            <div className="mb-3">
              <div className="text-[9px] font-semibold text-gray-600 mb-1">Accessories Purchases</div>
              <div className="space-y-1">
                {purchase.accessoriesPurchases.map((accessory, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-2 border border-blue-200">
                    <div className="grid grid-cols-12 gap-1 text-[10px]">
                      <div className="col-span-3 font-medium text-gray-800">
                        {accessory.productName}
                      </div>
                      <div className="col-span-2 text-center text-gray-600">
                        {accessory.accessoryType}
                      </div>
                      <div className="col-span-1 text-center text-gray-600">
                        {accessory.color || '-'}
                      </div>
                      <div className="col-span-2 text-right font-semibold text-blue-600">
                        {accessory.quantity} {accessory.purchaseMode}
                      </div>
                      <div className="col-span-2 text-right text-gray-700">
                        @ ₹{accessory.costPerUnit}
                      </div>
                      <div className="col-span-2 text-right font-bold text-green-600">
                        ₹{(accessory.totalWithGst || 0).toFixed(2)}
                      </div>
                    </div>
                    <div className="text-[9px] text-gray-500 mt-1">
                      Vendor: {accessory.vendor} ({accessory.vendorCode})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grand Total */}
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