import { useState, useEffect } from "react";
import {
  FormContainer,
  FormSection,
  FormGrid,
  FormInput,
  FormSelect,
} from "../../components/UI/FormComponents";
import OrderDetailsReadOnly from "./OrderDetailsReadOnly";

export default function ProductionForm({
  onSubmit,
  onClose = () => { },
  initialValues = {},
}) {
  const [formData, setFormData] = useState({
    orderId: "",
    poDate: new Date().toISOString().split("T")[0],
    poNumber: "",
    factoryReceivedDate: "",
    status: "Pending Production",
    remarks: "",
    productionDetails: [], // Array of production details per product
  });

  const [loading, setLoading] = useState(false);

  // Initialize form for editing
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      // Initialize production details from products
      const productionDetails = (initialValues.products || []).map((product, idx) => {
        // Check if we have existing production details
        const existingDetail = initialValues.productionDetails?.[idx];
        
        return {
          productName: product.productName || "",
          fabricType: product.fabricType || "",
          receivedFabric: existingDetail?.receivedFabric || product.fabricType || "",
          measurementUnit: existingDetail?.measurementUnit || "Meters",
          dcMtr: existingDetail?.dcMtr || 0,
          tagMtr: existingDetail?.tagMtr || 0,
          cuttingMtr: existingDetail?.cuttingMtr || 0,
          shortageMtr: existingDetail?.shortageMtr || 0,
          color: product.colors?.[0]?.color || "",
        };
      });

      setFormData({
        orderId: initialValues.order || "",
        poDate: initialValues.poDate
          ? new Date(initialValues.poDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        poNumber: initialValues.poNumber || initialValues.PoNo || "",
        factoryReceivedDate: initialValues.factoryReceivedDate
          ? new Date(initialValues.factoryReceivedDate).toISOString().split("T")[0]
          : "",
        status: initialValues.status || "Pending Production",
        remarks: initialValues.remarks || "",
        productionDetails: productionDetails,
      });
    }
  }, [initialValues]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleProductionDetailChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedDetails = [...prev.productionDetails];
      updatedDetails[index] = {
        ...updatedDetails[index],
        [field]: value,
      };

      // Auto-calculate shortage
      if (field === "tagMtr" || field === "cuttingMtr") {
        const tagMtr = field === "tagMtr" ? parseFloat(value) || 0 : parseFloat(updatedDetails[index].tagMtr) || 0;
        const cuttingMtr = field === "cuttingMtr" ? parseFloat(value) || 0 : parseFloat(updatedDetails[index].cuttingMtr) || 0;
        updatedDetails[index].shortageMtr = tagMtr - cuttingMtr;
      }

      return { ...prev, productionDetails: updatedDetails };
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const requiredFields = ["orderId", "poDate", "status"];

      for (const field of requiredFields) {
        if (!formData[field]?.toString().trim()) {
          alert(`Please fill in: ${field.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}`);
          return;
        }
      }

      // Prepare payload
      const payload = {
        ...formData,
        productionDetails: formData.productionDetails.map(detail => ({
          ...detail,
          dcMtr: parseFloat(detail.dcMtr) || 0,
          tagMtr: parseFloat(detail.tagMtr) || 0,
          cuttingMtr: parseFloat(detail.cuttingMtr) || 0,
          shortageMtr: parseFloat(detail.shortageMtr) || 0,
        })),
      };

      await onSubmit(payload);
    } catch (error) {
      console.error("Error saving production:", error);
      alert("Failed to save production. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Extract unique suppliers from production document
  const getUniqueSuppliers = () => {
    const suppliersMap = new Map();

    // Collect all unique suppliers from fabric, buttons, and packets purchases
    if (initialValues.fabricPurchases) {
      initialValues.fabricPurchases.forEach(item => {
        if (item.vendor || item.vendorId) {
          const key = `${item.vendor || item.vendorId?.name}-${item.vendorCode || item.vendorId?.code || ""}`;
          if (!suppliersMap.has(key)) {
            suppliersMap.set(key, {
              name: item.vendor || item.vendorId?.name || "N/A",
              code: item.vendorCode || item.vendorId?.code || "N/A"
            });
          }
        }
      });
    }

    if (initialValues.accessoriesPurchases) {
      initialValues.accessoriesPurchases.forEach(item => {
        if (item.vendor || item.vendorId) {
          const key = `${item.vendor || item.vendorId?.name}-${item.vendorCode || item.vendorId?.code || ""}`;
          if (!suppliersMap.has(key)) {
            suppliersMap.set(key, {
              name: item.vendor || item.vendorId?.name || "N/A",
              code: item.vendorCode || item.vendorId?.code || "N/A"
            });
          }
        }
      });
    }

    return Array.from(suppliersMap.values());
  };

  const totalInfo = initialValues
    ? `${initialValues.orderType} • Order: ${initialValues.PoNo || "N/A"} • Buyer: ${initialValues.buyerName || "N/A"}`
    : "Create new production";

  const handleCancel = () => {
    onClose();
  };

  return (
    <FormContainer
    // need to change the heading to Edit Production.
      title={initialValues._id ? "Production" : "Create Production"}
      onClose={handleCancel}
      onSubmit={handleSubmit}
      loading={loading}
      submitText={initialValues._id ? "Update Production" : "Create Production"}
      totalInfo={totalInfo}
    >
      {/* Order Information */}
      <FormSection title="Order Information" color="blue">
        <FormGrid columns={3} gap={4}>
          <FormInput
            label="PO Date*"
            type="date"
            value={formData.poDate}
            onChange={(value) => handleInputChange("poDate", value)}
          />
          <FormInput
            label="PO Number*"
            value={formData.poNumber}
            onChange={(value) => handleInputChange("poNumber", value)}
            placeholder="Enter PO number"
          />
          <FormInput
            label="Factory Received Date"
            type="date"
            value={formData.factoryReceivedDate}
            onChange={(value) => handleInputChange("factoryReceivedDate", value)}
          />
        </FormGrid>

        {initialValues && Object.keys(initialValues).length > 0 && (
          <div className="flex gap-4 text-xs text-gray-600 bg-blue-50 p-2 rounded mt-2">
            {/* Buyer Details */}
            <div className="flex-1">
              <div className="font-semibold text-blue-700 mb-1">Buyer Details</div>
              <div className="border border-gray-200 rounded overflow-hidden">
                <div className="grid grid-cols-4 bg-gray-100 text-gray-700 font-medium text-xs">
                  <div className="p-1 border-r border-gray-200">Name</div>
                  <div className="p-1 border-r border-gray-200">Code</div>
                  <div className="p-1 border-r border-gray-200">Type</div>
                  <div className="p-1">Total Qty</div>
                </div>
                <div className="grid grid-cols-4 border-t border-gray-200">
                  <div className="p-1 border-r border-gray-200">{initialValues.buyerName || "N/A"}</div>
                  <div className="p-1 border-r border-gray-200">{initialValues.buyerCode || "N/A"}</div>
                  <div className="p-1 border-r border-gray-200">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${initialValues.orderType === "FOB"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-purple-100 text-purple-800"
                        }`}
                    >
                      {initialValues.orderType}
                    </span>
                  </div>
                  <div className="p-1">{initialValues.totalQty || "N/A"}</div>
                </div>
              </div>
            </div>

            {/* Supplier Details */}
            <div className="flex-1 border-l border-blue-200 pl-4">
              <div className="font-semibold text-blue-700 mb-1">Supplier Details</div>
              {getUniqueSuppliers().length > 0 ? (
                <div className="border border-gray-200 rounded overflow-hidden">
                  <div className="grid grid-cols-2 bg-gray-100 text-gray-700 font-medium text-xs">
                    <div className="p-1 border-r border-gray-200">Name</div>
                    <div className="p-1">Code</div>
                  </div>
                  {getUniqueSuppliers().slice(0, 3).map((supplier, idx) => (
                    <div key={idx} className="grid grid-cols-2 border-t border-gray-200">
                      <div className="p-1 border-r border-gray-200 truncate" title={supplier.name}>
                        {supplier.name}
                      </div>
                      <div className="p-1 truncate" title={supplier.code}>
                        {supplier.code}
                      </div>
                    </div>
                  ))}
                  {getUniqueSuppliers().length > 3 && (
                    <div className="text-center text-xs text-gray-500 p-1 border-t border-gray-200">
                      +{getUniqueSuppliers().length - 3} more
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500 italic">
                  No supplier information available
                </div>
              )}
            </div>
          </div>
        )}

        {/* Order Details Read Only Component */}
        {initialValues && initialValues.products && initialValues.products.length > 0 && (
          <div className="mt-4">
            <OrderDetailsReadOnly selectedOrder={initialValues} />
          </div>
        )}
      </FormSection>

      {/* Production Details - One row per product */}
      {formData.productionDetails && formData.productionDetails.length > 0 && (
        <FormSection title="Production Details" color="green">
          <div className="space-y-3">
            {/* Header Row */}
            <div className="grid grid-cols-8 gap-2 text-xs font-semibold text-gray-700 bg-gray-100 p-2 rounded">
              <div>Product</div>
              <div>Fabric Type</div>
              <div>Received Fabric</div>
              <div>Unit</div>
              <div>DC</div>
              <div>Tag</div>
              <div>Cutting</div>
              <div>Shortage</div>
            </div>

            {/* Data Rows */}
            {formData.productionDetails.map((detail, index) => (
              <div key={index} className="grid grid-cols-8 gap-2 items-center">
                {/* Product Name - Read Only */}
                <div className="text-xs font-medium text-gray-800 p-2 bg-gray-50 rounded border border-gray-200">
                  {detail.productName}
                </div>

                {/* Fabric Type - Read Only */}
                <div className="text-xs text-gray-700 p-2 bg-gray-50 rounded border border-gray-200">
                  {detail.fabricType}
                </div>

                {/* Received Fabric - Editable */}
                <FormInput
                  value={detail.receivedFabric}
                  onChange={(value) => handleProductionDetailChange(index, "receivedFabric", value)}
                  placeholder="Fabric"
                />

                {/* Measurement Unit - Dropdown */}
                <FormSelect
                  value={detail.measurementUnit}
                  onChange={(value) => handleProductionDetailChange(index, "measurementUnit", value)}
                  options={[
                    { value: "Meters", label: "Meters" },
                    { value: "KG", label: "KG" },
                    { value: "Qty", label: "Qty" },
                    { value: "Pcs", label: "Pcs" },
                  ]}
                />

                {/* DC Meters */}
                <FormInput
                  type="number"
                  step="0.01"
                  value={detail.dcMtr}
                  onChange={(value) => handleProductionDetailChange(index, "dcMtr", value)}
                  placeholder="0.00"
                />

                {/* Tag Meters */}
                <FormInput
                  type="number"
                  step="0.01"
                  value={detail.tagMtr}
                  onChange={(value) => handleProductionDetailChange(index, "tagMtr", value)}
                  placeholder="0.00"
                />

                {/* Cutting Meters */}
                <FormInput
                  type="number"
                  step="0.01"
                  value={detail.cuttingMtr}
                  onChange={(value) => handleProductionDetailChange(index, "cuttingMtr", value)}
                  placeholder="0.00"
                />

                {/* Shortage Meters - Read Only (Auto-calculated) */}
                <div className="text-xs font-semibold text-purple-600 p-2 bg-purple-50 rounded border border-purple-200 text-center">
                  {(detail.shortageMtr || 0).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </FormSection>
      )}

      {/* Status & Remarks */}
      <FormSection title="Status & Notes" color="purple">
        <FormGrid columns={2}>
          <FormSelect
            label="Status*"
            value={formData.status}
            onChange={(value) => handleInputChange("status", value)}
            options={[
              { value: "Pending Production", label: "Pending Production" },
              { value: "Cutting", label: "Cutting" },
              { value: "Stitching", label: "Stitching" },
              { value: "Trimming", label: "Trimming" },
              { value: "QC", label: "QC" },
              { value: "Ironing", label: "Ironing" },
              { value: "Packing", label: "Packing" },
              { value: "Production Completed", label: "Production Completed" },
            ]}
          />
          <FormInput
            label="Remarks"
            value={formData.remarks}
            onChange={(value) => handleInputChange("remarks", value)}
            placeholder="Any notes or instructions..."
          />
        </FormGrid>
      </FormSection>
    </FormContainer>
  );
}