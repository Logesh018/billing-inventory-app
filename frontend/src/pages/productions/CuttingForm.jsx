
import { useState, useEffect } from "react";
import {
  FormContainer,
  FormSection,
  FormGrid,
  FormInput,
} from "../../components/UI/FormComponents";
import EnhancedOrderDetailsReadOnly from "./EnhancedOrderDetailsReadOnly";

export default function CuttingForm({
  onSubmit,
  onClose = () => { },
  initialValues = {},
}) {
  const [formData, setFormData] = useState({
    cuttingDetails: [],
    remarks: "",
  });

  const [loading, setLoading] = useState(false);

  // Initialize form
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      // Initialize cutting details from products
      const cuttingDetails = (initialValues.products || []).map((product, idx) => {
        const existingDetail = initialValues.cuttingDetails?.[idx];
        
        return {
          productName: product.productName || "",
          fabricType: product.fabricType || "",
          color: product.colors?.[0]?.color || "",
          meterPerProduct: existingDetail?.meterPerProduct || 0,
          productPerLay: existingDetail?.productPerLay || 0,
          meterPerLay: existingDetail?.meterPerLay || 0,
          totalLays: existingDetail?.totalLays || 0,
          totalMetersUsed: existingDetail?.totalMetersUsed || 0,
          totalProductsCut: existingDetail?.totalProductsCut || 0,
        };
      });

      setFormData({
        cuttingDetails: cuttingDetails,
        remarks: initialValues.remarks || "",
      });
    }
  }, [initialValues]);

  const handleCuttingDetailChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedDetails = [...prev.cuttingDetails];
      updatedDetails[index] = {
        ...updatedDetails[index],
        [field]: parseFloat(value) || 0,
      };

      // Auto-calculate totals
      const detail = updatedDetails[index];
      detail.totalMetersUsed = detail.meterPerLay * detail.totalLays;
      detail.totalProductsCut = detail.productPerLay * detail.totalLays;

      return { ...prev, cuttingDetails: updatedDetails };
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validate that at least one cutting detail has data
      const hasData = formData.cuttingDetails.some(detail => 
        detail.meterPerProduct > 0 || detail.productPerLay > 0 || 
        detail.meterPerLay > 0 || detail.totalLays > 0
      );

      if (!hasData) {
        alert("Please fill in at least one cutting detail");
        setLoading(false);
        return;
      }

      // ✅ Prepare payload with next stage status
      const payload = {
        cuttingDetails: formData.cuttingDetails,
        remarks: formData.remarks,
        status: "Cutting", // ✅ Move to Cutting stage (will be visible in Stitching next)
      };

      await onSubmit(payload);
    } catch (error) {
      console.error("Error saving cutting details:", error);
      alert("Failed to save cutting details. Please try again.");
      setLoading(false);
    }
  };

  const totalInfo = initialValues
    ? `${initialValues.orderType} • Order: ${initialValues.PoNo || "N/A"} • Buyer: ${initialValues.buyerName || "N/A"}`
    : "Cutting Stage";

  return (
    <FormContainer
      title="Cutting Details"
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={loading}
      submitText="Save Cutting Details"
      totalInfo={totalInfo}
    >
      {/* Order Information with Production Details */}
      <FormSection title="Order & Production Information" color="blue">
        {initialValues && Object.keys(initialValues).length > 0 && (
          <EnhancedOrderDetailsReadOnly 
            selectedOrder={initialValues} 
            stageName="Cutting"
          />
        )}
      </FormSection>

      {/* Cutting Details - One row per product */}
      {formData.cuttingDetails && formData.cuttingDetails.length > 0 && (
        <FormSection title="Cutting Details" color="green">
          <div className="space-y-3">
            {/* Header Row */}
            <div className="grid grid-cols-10 gap-2 text-xs font-semibold text-gray-700 bg-gray-100 p-2 rounded">
              <div className="col-span-2">Product</div>
              <div>Fabric Type</div>
              <div>Color</div>
              <div>Meter/Product</div>
              <div>Product/Lay</div>
              <div>Meter/Lay</div>
              <div>Total Lays</div>
              <div>Total Meters</div>
              <div>Total Products</div>
            </div>

            {/* Data Rows */}
            {formData.cuttingDetails.map((detail, index) => (
              <div key={index} className="grid grid-cols-10 gap-2 items-center">
                {/* Product Name - Read Only */}
                <div className="col-span-2 text-xs font-medium text-gray-800 p-2 bg-gray-50 rounded border border-gray-200">
                  {detail.productName}
                </div>

                {/* Fabric Type - Read Only */}
                <div className="text-xs text-gray-700 p-2 bg-gray-50 rounded border border-gray-200">
                  {detail.fabricType}
                </div>

                {/* Color - Read Only */}
                <div className="text-xs text-gray-700 p-2 bg-gray-50 rounded border border-gray-200">
                  {detail.color}
                </div>

                {/* Meter/Product - Editable */}
                <FormInput
                  type="number"
                  step="0.01"
                  value={detail.meterPerProduct}
                  onChange={(value) => handleCuttingDetailChange(index, "meterPerProduct", value)}
                  placeholder="0.00"
                />

                {/* Product/Lay - Editable */}
                <FormInput
                  type="number"
                  step="1"
                  value={detail.productPerLay}
                  onChange={(value) => handleCuttingDetailChange(index, "productPerLay", value)}
                  placeholder="0"
                />

                {/* Meter/Lay - Editable */}
                <FormInput
                  type="number"
                  step="0.01"
                  value={detail.meterPerLay}
                  onChange={(value) => handleCuttingDetailChange(index, "meterPerLay", value)}
                  placeholder="0.00"
                />

                {/* Total Lays - Editable */}
                <FormInput
                  type="number"
                  step="1"
                  value={detail.totalLays}
                  onChange={(value) => handleCuttingDetailChange(index, "totalLays", value)}
                  placeholder="0"
                />

                {/* Total Meters Used - Read Only (Auto-calculated) */}
                <div className="text-xs font-semibold text-blue-600 p-2 bg-blue-50 rounded border border-blue-200 text-center">
                  {detail.totalMetersUsed.toFixed(2)}
                </div>

                {/* Total Products Cut - Read Only (Auto-calculated) */}
                <div className="text-xs font-semibold text-green-600 p-2 bg-green-50 rounded border border-green-200 text-center">
                  {detail.totalProductsCut}
                </div>
              </div>
            ))}
          </div>
        </FormSection>
      )}

      {/* Remarks */}
      <FormSection title="Remarks" color="purple">
        <FormInput
          label="Additional Notes"
          value={formData.remarks}
          onChange={(value) => setFormData(prev => ({ ...prev, remarks: value }))}
          placeholder="Any notes or instructions..."
        />
      </FormSection>
    </FormContainer>
  );
}