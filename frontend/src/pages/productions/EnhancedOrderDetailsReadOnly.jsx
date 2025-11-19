const EnhancedOrderDetailsReadOnly = ({ selectedOrder, stageName }) => {
  // Determine if we should show production details based on stage
  const showProductionDetails = stageName !== "Pending Production";

  const sortedProducts = [...(selectedOrder.products || [])].sort((a, b) => {
    const fabricA = a.fabricType?.toUpperCase() || '';
    const fabricB = b.fabricType?.toUpperCase() || '';
    const colorA = a.colors?.[0]?.color?.toUpperCase() || '';
    const colorB = b.colors?.[0]?.color?.toUpperCase() || '';
    const styleA = a.style?.toUpperCase() || '';
    const styleB = b.style?.toUpperCase() || '';

    return fabricA.localeCompare(fabricB) || colorA.localeCompare(colorB) || styleA.localeCompare(styleB);
  });

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
      {/* Header info - same as before */}
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

      {/* Products Table with conditional production details */}
      {sortedProducts.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-300">
          {/* Table header - conditionally show production columns */}
          <div
            className="grid gap-3 mb-1.5"
            style={{
              gridTemplateColumns: showProductionDetails 
                ? '2fr 0.8fr 0.8fr 0.8fr 2fr 0.6fr 0.6fr 0.6fr 0.6fr 0.6fr'
                : '2fr 0.8fr 0.8fr 0.8fr 2fr 0.6fr',
            }}
          >
            <label className="text-[10px] font-medium text-gray-600">Product</label>
            <label className="text-[10px] font-medium text-gray-600">Fabric</label>
            <label className="text-[10px] font-medium text-gray-600">Style</label>
            <label className="text-[10px] font-medium text-gray-600">Color</label>
            <label className="text-[10px] font-medium text-gray-600">Size & Qty</label>
            <label className="text-[10px] font-medium text-gray-600 text-center">Total Qty</label>
            
            {/* Show previous stage production details */}
            {showProductionDetails && (
              <>
                <label className="text-[10px] font-medium text-blue-600">Unit</label>
                <label className="text-[10px] font-medium text-blue-600">DC</label>
                <label className="text-[10px] font-medium text-blue-600">Tag</label>
                <label className="text-[10px] font-medium text-blue-600">Shortage</label>
              </>
            )}
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
            
            // Get production detail for this product
            const prodDetail = selectedOrder.productionDetails?.[idx];

            return (
              <div
                key={idx}
                className={`relative grid gap-3 py-1.5 ${idx > 0 ? 'border-t border-gray-200' : ''}`}
                style={{
                  gridTemplateColumns: showProductionDetails
                    ? '2fr 0.8fr 0.8fr 0.8fr 2fr 0.6fr 0.6fr 0.6fr 0.6fr 0.6fr'
                    : '2fr 0.8fr 0.8fr 0.8fr 2fr 0.6fr',
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

                {/* Show production details from previous stage */}
                {showProductionDetails && prodDetail && (
                  <>
                    <div className="text-[10px] text-blue-700 font-medium text-center">
                      {prodDetail.measurementUnit || 'Meters'}
                    </div>
                    <div className="text-[10px] text-blue-700 text-center">
                      {prodDetail.dcMtr || 0}
                    </div>
                    <div className="text-[10px] text-blue-700 text-center">
                      {prodDetail.tagMtr || 0}
                    </div>
                    <div className="text-[10px] text-purple-600 font-semibold text-center">
                      {prodDetail.shortageMtr || 0}
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {/* Grand Total Row */}
          <div 
            className="grid pt-2 border-t border-gray-300" 
            style={{ 
              gridTemplateColumns: showProductionDetails
                ? '2fr 0.8fr 0.8fr 0.8fr 2fr 0.6fr 0.6fr 0.6fr 0.6fr 0.6fr'
                : '2fr 0.8fr 0.8fr 0.8fr 2fr 0.6fr'
            }}
          >
            <div className="col-span-4"></div>
            <div className="text-[9px] text-right pr-2 text-gray-600 font-semibold">Grand Qty:</div>
            <div className="text-[9px] text-center text-blue-600 font-bold">{grandTotalQty}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedOrderDetailsReadOnly;