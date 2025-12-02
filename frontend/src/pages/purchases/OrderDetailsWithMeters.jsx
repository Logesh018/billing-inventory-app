// OrderDetailsWithMeters.jsx
import React from 'react';

const OrderDetailsWithMeters = ({ 
  selectedOrder, 
  showEstimationFields = false,
  PESNo = "N/A",
  estimationDate = null
}) => {
  const formatArrayField = (field) => {
    if (!field) return '-';
    if (Array.isArray(field)) {
      return field.filter(Boolean).join(', ') || '-';
    }
    return field;
  };

  // ✅ Get the correct products array based on structure
  const getProducts = () => {
    // For PurchaseEstimation - uses orderProducts array
    if (selectedOrder.orderProducts && selectedOrder.orderProducts.length > 0) {
      return selectedOrder.orderProducts;
    }
    // For Purchase/Order - uses products array
    return selectedOrder.products || [];
  };

  const sortedProducts = [...getProducts()].sort((a, b) => {
    // ✅ Handle both structures for fabric
    const fabricA = (
      a.fabricType || 
      a.productDetails?.fabric || 
      a.fabricName || 
      ''
    ).toUpperCase();
    
    const fabricB = (
      b.fabricType || 
      b.productDetails?.fabric || 
      b.fabricName || 
      ''
    ).toUpperCase();
    
    // ✅ Handle both structures for color
    const colorA = (
      a.colors?.[0]?.color || 
      a.productDetails?.color || 
      ''
    ).toUpperCase();
    
    const colorB = (
      b.colors?.[0]?.color || 
      b.productDetails?.color || 
      ''
    ).toUpperCase();
    
    // ✅ Handle both structures for style
    const styleA = String(
      a.style || 
      a.productDetails?.style || 
      ''
    ).toUpperCase();
    
    const styleB = String(
      b.style || 
      b.productDetails?.style || 
      ''
    ).toUpperCase();

    return fabricA.localeCompare(fabricB) || 
           colorA.localeCompare(colorB) || 
           styleA.localeCompare(styleB);
  });

  // ✅ Calculate grand total qty - handle both structures
  const grandTotalQty = sortedProducts.reduce((sum, prod) => {
    // Try colors array structure first (for production/orders/estimations)
    if (prod.colors && Array.isArray(prod.colors)) {
      const colorTotal = prod.colors.reduce(
        (total, colorGroup) =>
          total + (colorGroup.sizes?.reduce((t, s) => t + (s.quantity || s.qty || 0), 0) || 0),
        0
      );
      return sum + colorTotal;
    }
    
    // Try direct sizes array (for purchases)
    if (prod.sizes && Array.isArray(prod.sizes)) {
      const sizeTotal = prod.sizes.reduce((t, s) => t + (s.qty || s.quantity || 0), 0);
      return sum + sizeTotal;
    }
    
    // Fallback to productTotalQty
    return sum + (prod.productTotalQty || 0);
  }, 0);

  return (
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 shadow-sm">
      {/* Header info */}
      <div className={`grid ${showEstimationFields ? 'grid-cols-7' : 'grid-cols-5'} gap-3`}>
        {/* Order ID - Only for Purchase */}
        {showEstimationFields && (
          <div>
            <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Order ID</label>
            <div className="text-xs font-bold text-blue-700">
              {selectedOrder.orderId || '-'}
            </div>
          </div>
        )}
        
        <div>
          <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Order Date</label>
          <div className="text-xs font-medium text-gray-900">
            {selectedOrder.orderDate ? new Date(selectedOrder.orderDate).toLocaleDateString('en-IN') : '-'}
          </div>
        </div>
        
        {/* Buyer Code */}
        <div>
          <label className="block text-[10px] font-medium text-gray-600 mb-0.5">
            {showEstimationFields ? 'Buyer ID/Code' : 'Buyer Code'}
          </label>
          <div className="text-xs font-medium text-gray-900">
            {selectedOrder.buyerDetails?.code || selectedOrder.buyerCode || '-'}
          </div>
        </div>

        {/* Estimation ID (PESNo) - Only for Purchase */}
        {showEstimationFields && (
          <div>
            <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Estimation ID</label>
            <div className={`text-xs font-bold ${PESNo === 'N/A' ? 'text-gray-500' : 'text-green-700'}`}>
              {PESNo}
            </div>
          </div>
        )}

        {/* Estimation Date - Only for Purchase */}
        {showEstimationFields && (
          <div>
            <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Estimation Date</label>
            <div className="text-xs font-medium text-gray-900">
              {estimationDate ? new Date(estimationDate).toLocaleDateString('en-IN') : '-'}
            </div>
          </div>
        )}
        
        <div>
          <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Order Type</label>
          <div
            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              selectedOrder.orderType === 'JOB-Works'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {selectedOrder.orderType || '-'}
          </div>
        </div>
        
        <div>
          <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Status</label>
          <div className="text-xs font-medium text-gray-900">{selectedOrder.status || selectedOrder.orderStatus || '-'}</div>
        </div>
      </div>

      {/* Table */}
      {sortedProducts.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-300">
          {/* Table header */}
          <div
            className="grid gap-3 mb-1.5"
            style={{
              gridTemplateColumns: '2fr 0.8fr 0.8fr 0.8fr 2fr 0.6fr',
            }}
          >
            <label className="text-[10px] font-medium text-gray-600">Product</label>
            <label className="text-[10px] font-medium text-gray-600">Fabric</label>
            <label className="text-[10px] font-medium text-gray-600">Style</label>
            <label className="text-[10px] font-medium text-gray-600">Color</label>
            <label className="text-[10px] font-medium text-gray-600">Size & Qty</label>
            <label className="text-[10px] font-medium text-gray-600 text-center">Total Qty</label>
          </div>

          {/* Table body */}
          {sortedProducts.map((prod, idx) => {
            // ✅ Calculate product total - handle both structures
            let productTotal = 0;
            let sizeQtyPairs = [];

            // Try colors array structure (for production/orders/estimations)
            if (prod.colors && Array.isArray(prod.colors)) {
              productTotal = prod.colors.reduce(
                (sum, colorGroup) =>
                  sum + (colorGroup.sizes?.reduce((sSum, s) => sSum + (s.quantity || s.qty || 0), 0) || 0),
                0
              );
              sizeQtyPairs = prod.colors.flatMap((colorGroup) =>
                colorGroup.sizes?.map((s) => `${s.size}:${s.quantity || s.qty}`) || []
              );
            } 
            // Try direct sizes array (for purchases)
            else if (prod.sizes && Array.isArray(prod.sizes)) {
              productTotal = prod.sizes.reduce((sum, s) => sum + (s.qty || s.quantity || 0), 0);
              sizeQtyPairs = prod.sizes.map((s) => `${s.size}:${s.qty || s.quantity}`);
            }
            // Fallback to productTotalQty
            else {
              productTotal = prod.productTotalQty || 0;
            }

            // ✅ FIXED: Handle fabric from both structures
            const fabric = 
              prod.fabricType ||           // PurchaseEstimation structure
              prod.productDetails?.fabric || // Purchase/Order structure
              prod.fabricName ||            // Alternative field
              '-';
            
            // ✅ FIXED: Handle style from both structures
            const style = formatArrayField(
              prod.style ||                  // PurchaseEstimation structure (direct)
              prod.productDetails?.style     // Purchase/Order structure (nested)
            );
            
            // ✅ FIXED: Handle color from both structures
            const firstColor = 
              prod.colors?.[0]?.color ||     // Colors array structure
              prod.productDetails?.color ||  // Purchase/Order structure
              '-';

            // ✅ FIXED: Handle product name from both structures
            const productName = 
              prod.productName ||            // PurchaseEstimation structure
              prod.productDetails?.name ||   // Purchase/Order structure
              '-';

            return (
              <div
                key={idx}
                className={`relative grid gap-3 py-1.5 ${idx > 0 ? 'border-t border-gray-200' : ''}`}
                style={{
                  gridTemplateColumns: '2fr 0.8fr 0.8fr 0.8fr 2fr 0.6fr',
                }}
              >
                <div className="text-[10px] font-semibold text-gray-900">
                  {productName}
                </div>
                <div className="text-[10px] text-gray-800">{fabric}</div>
                <div className="text-[10px] text-gray-800">{style}</div>
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
              </div>
            );
          })}

          {/* Grand Total Qty Row */}
          <div 
            className="grid border-t border-gray-300 pt-2 mt-1" 
            style={{ gridTemplateColumns: '2fr 0.8fr 0.8fr 0.8fr 2fr 0.6fr' }}
          >
            <div className="col-span-4"></div>
            <div className="text-[10px] text-right pr-2 text-gray-600 font-semibold">Grand Qty:</div>
            <div className="text-[10px] text-center text-blue-600 font-bold">{grandTotalQty}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsWithMeters;