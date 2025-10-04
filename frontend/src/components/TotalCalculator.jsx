import { useMemo } from "react";

export default function TotalCalculator({ formData }) {
  // Calculate totals dynamically
  const { totalQuantity, totalCost, totalWithTax } = useMemo(() => {
    let totalQuantity = 0;
    let totalCost = 0;
    let totalWithTax = 0;

    // Calculate Total Quantity from products
    if (formData.products && Array.isArray(formData.products)) {
      totalQuantity = formData.products.reduce((acc, p) => {
        const sizes = p.sizes || [];
        return acc + sizes.reduce((sum, s) => sum + (Number(s.qty) || 0), 0);
      }, 0);
    }

    // Calculate Total Cost from fabric
    const purchaseKg = Number(formData.purchaseKg) || 0;
    const fabricCostPerKG = Number(formData.fabricCostPerKG) || 0;
    totalCost = purchaseKg * fabricCostPerKG;

    // Calculate Total with Tax (if taxPercentage is provided)
    const taxPercentage = Number(formData.taxPercentage) || 0;
    totalWithTax = totalCost * (1 + taxPercentage / 100);

    return { totalQuantity, totalCost, totalWithTax };
  }, [formData.products, formData.purchaseKg, formData.fabricCostPerKG, formData.taxPercentage]);

  // Determine what to display based on available data
  if (!formData.products && !formData.purchaseKg && !formData.fabricCostPerKG) {
    return <div className="text-gray-500">No data available</div>;
  }

  return (
    <div className="p-2 border rounded bg-gray-50">
      {formData.products && (
        <div className="flex justify-between">
          <span>Total Quantity</span>
          <span>{totalQuantity}</span>
        </div>
      )}
      {(formData.purchaseKg || formData.fabricCostPerKG) && (
        <div className="flex justify-between font-bold mt-1">
          <span>Total Cost</span>
          <span>{totalCost}</span>
        </div>
      )}
      {formData.taxPercentage && (
        <div className="flex justify-between font-bold mt-1">
          <span>Total with Tax ({formData.taxPercentage}%)</span>
          <span>{totalWithTax.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}