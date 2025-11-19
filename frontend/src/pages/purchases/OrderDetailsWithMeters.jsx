const OrderDetailsWithMeters = ({ selectedOrder, meterValues, onMeterChange }) => {
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

  // Compute grouped total meters
  const calculateGroupedTotalMeters = () => {
    const grouped = {};
    sortedProducts.forEach((prod, idx) => {
      const key = getFabricColorKey(prod);
      const productTotal =
        prod.colors?.reduce(
          (sum, colorGroup) =>
            sum + (colorGroup.sizes?.reduce((sSum, s) => sSum + (s.quantity || 0), 0) || 0),
          0
        ) || 0;

      const meters = parseFloat(meterValues[idx]) || 0;
      const totalMeters = productTotal * meters;

      if (!grouped[key]) {
        grouped[key] = {
          fabricType: prod.fabricType,
          color: prod.colors?.[0]?.color,
          totalMeters: 0,
          products: [],
        };
      }

      grouped[key].totalMeters += totalMeters;
      grouped[key].products.push(idx);
    });
    return grouped;
  };

  const groupedMeters = calculateGroupedTotalMeters();

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
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 shadow-sm">
      {/* Header info */}
      <div className="grid grid-cols-5 gap-3">
        <div>
          <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Order Date</label>
          <div className="text-xs font-medium text-gray-900">
            {selectedOrder.orderDate ? new Date(selectedOrder.orderDate).toLocaleDateString('en-IN') : '-'}
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-medium text-gray-600 mb-0.5">PO Number</label>
          <div className="text-xs font-bold text-gray-900">{selectedOrder.PoNo || '-'}</div>
        </div>
        <div>
          <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Order Type</label>
          <div
            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${selectedOrder.orderType === 'JOB-Works'
              ? 'bg-purple-100 text-purple-800'
              : 'bg-blue-100 text-blue-800'
              }`}
          >
            {selectedOrder.orderType || '-'}
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Buyer Code</label>
          <div className="text-xs font-medium text-gray-900">
            {selectedOrder.buyerDetails?.code || selectedOrder.buyerCode || '-'}
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Status</label>
          <div className="text-xs font-medium text-gray-900">{selectedOrder.status || '-'}</div>
        </div>
      </div>

      {/* Table */}
      {sortedProducts.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-300">
          {/* Table header */}
          <div
            className="grid gap-3 mb-1.5"
            style={{
              gridTemplateColumns: '2fr 0.8fr 0.8fr 0.8fr 2fr 0.6fr 0.6fr 0.8fr',
            }}
          >
            <label className="text-[10px] font-medium text-gray-600">Product</label>
            <label className="text-[10px] font-medium text-gray-600">Fabric</label>
            <label className="text-[10px] font-medium text-gray-600">Style</label>
            <label className="text-[10px] font-medium text-gray-600">Color</label>
            <label className="text-[10px] font-medium text-gray-600">Size & Qty</label>
            <label className="text-[10px] font-medium text-gray-600 text-center">Total Qty</label>
            <label className="text-[10px] font-medium text-gray-600 text-center">Meters</label>
            <label className="text-[10px] font-medium text-gray-600 text-center">Total Meters</label>
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
            const meters = parseFloat(meterValues[idx]) || 0;
            const totalMeters = productTotal * meters;

            const fabricColorKey = getFabricColorKey(prod);
            const group = groupedMeters[fabricColorKey];
            const groupIndexes = group?.products || [];
            const isGrouped = groupIndexes.length > 1;

            const midIndex = isGrouped
              ? groupIndexes[Math.floor(groupIndexes.length / 2)]
              : null;
            const showGroupTotal = isGrouped && idx === midIndex;
            const groupTotalMeters = group?.totalMeters || 0;

            return (
              <div
                key={idx}
                className={`relative grid gap-3 py-1.5 ${idx > 0 ? 'border-t border-gray-200' : ''}`}
                style={{
                  gridTemplateColumns: '2fr 0.8fr 0.8fr 0.8fr 2fr 0.6fr 0.6fr 0.8fr',
                }}
              >
                <div className="text-[10px] font-semibold text-gray-900">{prod.productName || '-'}</div>
                <div className="text-[10px] text-gray-800">{prod.fabricType || ''}</div>
                <div className="text-[10px] text-gray-800">{prod.style || '-'}</div>
                <div className="text-[10px] text-gray-800">{firstColor}</div>
                <div className="text-[10px] text-gray-800 font-mono">
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
                <div className="text-[10px] font-bold text-blue-600 text-center">{productTotal}</div>
                <div className="flex justify-center">
                  <input
                    type="number"
                    step="0.01"
                    value={meterValues[idx] || ''}
                    onChange={(e) => onMeterChange(idx, e.target.value)}
                    className="w-full px-1 py-0.5 text-[10px] text-center border border-gray-300 bg-white text-gray-900 rounded focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                    placeholder="0.00"
                  />
                </div>

                {/* Total Meters Column */}
                <div className="text-[10px] font-bold text-center">
                  {showGroupTotal ? (
                    <div className="absolute right-4 -top-3 bg-green-100 text-green-700 px-2 py-1 rounded border border-green-300 shadow-sm z-10">
                      {groupTotalMeters.toFixed(2)}
                    </div>
                  ) : !isGrouped ? (
                    <div className="text-purple-600">{totalMeters.toFixed(2)}</div>
                  ) : null}
                </div>
              </div>
            );
          })}

          {/* Grand Total Qty Row */}
          <div className="grid" style={{ gridTemplateColumns: '2fr 0.8fr 0.8fr 0.8fr 2fr 0.6fr 0.6fr 0.8fr' }}>
            <div className="col-span-4"></div>
            <div className="text-[9px] text-right pr-2 text-gray-600 font-semibold">Grand Qty:</div>
            <div className="text-[9px] text-center text-blue-600 font-bold">{grandTotalQty}</div>
            <div></div>
            <div></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsWithMeters;