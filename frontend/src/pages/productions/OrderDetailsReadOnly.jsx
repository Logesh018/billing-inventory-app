const OrderDetailsReadOnly = ({ selectedOrder }) => {
  // Helper: Extract fabric-color key
  const getFabricColorKey = (product) => {
    const fabricType = product.fabricType?.trim().toUpperCase() || '';
    const color = product.colors?.[0]?.color?.trim().toUpperCase() || '';
    return `${fabricType}-${color}`;
  };

  // Sort products by fabricType, color, then style
  const sortedProducts = [...(selectedOrder.products || [])].sort((a, b) => {
    const fabricA = a.fabricType?.toUpperCase() || '';
    const fabricB = b.fabricType?.toUpperCase() || '';
    const colorA = a.colors?.[0]?.color?.toUpperCase() || '';
    const colorB = b.colors?.[0]?.color?.toUpperCase() || '';
    const styleA = a.style?.toUpperCase() || '';
    const styleB = b.style?.toUpperCase() || '';

    return fabricA.localeCompare(fabricB) || colorA.localeCompare(colorB) || styleA.localeCompare(styleB);
  });

  // Calculate grand total qty
  const grandTotalQty = sortedProducts.reduce((sum, prod) => {
    const productTotal =
      prod.colors?.reduce(
        (total, colorGroup) =>
          total + (colorGroup.sizes?.reduce((t, s) => t + (s.quantity || 0), 0) || 0),
        0
      ) || 0;
    return sum + productTotal;
  }, 0);

  return (
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-3 shadow-sm">
      {/* Header info */}
      <div className="grid grid-cols-5 gap-3">
        <div>
          <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-300 mb-0.5">Order Date</label>
          <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
            {selectedOrder.orderDate ? new Date(selectedOrder.orderDate).toLocaleDateString('en-IN') : '-'}
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-300 mb-0.5">PO Number</label>
          <div className="text-xs font-bold text-gray-900 dark:text-gray-100">{selectedOrder.PoNo || '-'}</div>
        </div>
        <div>
          <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-300 mb-0.5">Order Type</label>
          <div
            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${selectedOrder.orderType === 'JOB-Works'
              ? 'bg-purple-100 dark:bg-purple-900 dark:bg-opacity-50 text-purple-800 dark:text-purple-300'
              : 'bg-blue-100 dark:bg-blue-900 dark:bg-opacity-50 text-blue-800 dark:text-blue-300'
              }`}
          >
            {selectedOrder.orderType || '-'}
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-300 mb-0.5">Buyer Code</label>
          <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
            {selectedOrder.buyerDetails?.code || selectedOrder.buyerCode || '-'}
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-300 mb-0.5">Status</label>
          <div className="text-xs font-medium text-gray-900 dark:text-gray-100">{selectedOrder.status || '-'}</div>
        </div>
      </div>

      {/* Table - WITHOUT Meters and Total Meters columns */}
      {sortedProducts.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
          {/* Table header */}
          <div
            className="grid gap-3 mb-1.5"
            style={{
              gridTemplateColumns: '2fr 0.8fr 0.8fr 0.8fr 2fr 0.6fr',
            }}
          >
            <label className="text-[10px] font-medium text-gray-600 dark:text-gray-300">Product</label>
            <label className="text-[10px] font-medium text-gray-600 dark:text-gray-300">Fabric</label>
            <label className="text-[10px] font-medium text-gray-600 dark:text-gray-300">Style</label>
            <label className="text-[10px] font-medium text-gray-600 dark:text-gray-300">Color</label>
            <label className="text-[10px] font-medium text-gray-600 dark:text-gray-300">Size & Qty</label>
            <label className="text-[10px] font-medium text-gray-600 dark:text-gray-300 text-center">Total Qty</label>
          </div>

          {/* Table body */}
          {sortedProducts.map((prod, idx) => {
            const productTotal =
              prod.colors?.reduce(
                (sum, colorGroup) =>
                  sum + (colorGroup.sizes?.reduce((sSum, s) => sSum + (s.quantity || 0), 0) || 0),
                0
              ) || 0;

            const sizeQtyPairs =
              prod.colors?.flatMap((colorGroup) =>
                colorGroup.sizes?.map((s) => `${s.size}:${s.quantity}`) || []
              ) || [];

            const firstColor = prod.colors?.[0]?.color || '-';

            return (
              <div
                key={idx}
                className={`relative grid gap-3 py-1.5 ${idx > 0 ? 'border-t border-gray-200 dark:border-gray-600' : ''}`}
                style={{
                  gridTemplateColumns: '2fr 0.8fr 0.8fr 0.8fr 2fr 0.6fr',
                }}
              >
                <div className="text-[10px] font-semibold text-gray-900 dark:text-gray-100">{prod.productName || '-'}</div>
                <div className="text-[10px] text-gray-800 dark:text-gray-200">{prod.fabricType || ''}</div>
                <div className="text-[10px] text-gray-800 dark:text-gray-200">{prod.style || '-'}</div>
                <div className="text-[10px] text-gray-800 dark:text-gray-200">{firstColor}</div>
                <div className="text-[10px] text-gray-800 dark:text-gray-200 font-mono">
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
                <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 text-center">{productTotal}</div>
              </div>
            );
          })}

          {/* Grand Total Qty Row */}
          <div className="grid pt-2 border-t border-gray-300 dark:border-gray-600" style={{ gridTemplateColumns: '2fr 0.8fr 0.8fr 0.8fr 2fr 0.6fr' }}>
            <div className="col-span-4"></div>
            <div className="text-[9px] text-right pr-2 text-gray-600 dark:text-gray-300 font-semibold">Grand Qty:</div>
            <div className="text-[9px] text-center text-blue-600 dark:text-blue-400 font-bold">{grandTotalQty}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsReadOnly;