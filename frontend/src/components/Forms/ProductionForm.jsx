import { useState, useEffect } from "react";
import {
  FormContainer,
  FormSection,
  FormGrid,
  FormInput,
  FormSelect,
  // SearchableInput, // Not used directly in ProductionForm, but kept for context if it were
} from "../UI/FormComponents";

export default function ProductionForm({
  onSubmit,
  onClose = () => {}, // FIX: Provide a default no-op function for onClose
  initialValues = {},
  orders = [],
  purchases = [],
}) {
  const [formData, setFormData] = useState({
    orderId: "",
    poDate: new Date().toISOString().split("T")[0],
    poNumber: "",
    factoryReceivedDate: "",
    receivedFabric: "",
    goodsType: "",
    color: "",
    requiredQty: "",
    expectedQty: "0",
    dcMtr: "0",
    tagMtr: "0",
    cuttingMtr: "0",
    shortageMtr: "0",
    measurementUnit: "Meters",
    status: "Pending Production",
    remarks: "",
  });

  const [loading, setLoading] = useState(false);

  // Initialize form for editing
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setFormData({
        orderId: initialValues.order || "",
        poDate: initialValues.poDate
          ? new Date(initialValues.poDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        poNumber: initialValues.poNumber || initialValues.PoNo || "",
        factoryReceivedDate: initialValues.factoryReceivedDate
          ? new Date(initialValues.factoryReceivedDate).toISOString().split("T")[0]
          : "",
        receivedFabric: initialValues.receivedFabric || "",
        goodsType: initialValues.goodsType || "",
        color: initialValues.color || "",
        requiredQty: initialValues.requiredQty || "",
        expectedQty: initialValues.expectedQty || "0",
        dcMtr: initialValues.dcMtr || "0",
        tagMtr: initialValues.tagMtr || "0",
        cuttingMtr: initialValues.cuttingMtr || "0",
        shortageMtr: initialValues.shortageMtr || "0",
        measurementUnit: initialValues.measurementUnit || "Meters",
        status: initialValues.status || "Pending Production",
        remarks: initialValues.remarks || "",
      });
    }
  }, [initialValues]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const requiredFields = [
        "orderId",
        "poDate",
        "receivedFabric",
        "goodsType",
        "color",
        "requiredQty",
        "status",
      ];

      for (const field of requiredFields) {
        if (!formData[field]?.toString().trim()) {
          alert(`Please fill in: ${field.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}`);
          return;
        }
      }

      // Ensure numeric fields are numbers
      const numericFields = [
        "requiredQty",
        "expectedQty",
        "dcMtr",
        "tagMtr",
        "cuttingMtr",
        "shortageMtr",
      ];
      const payload = { ...formData };
      numericFields.forEach((field) => {
        payload[field] = parseFloat(payload[field]) || 0;
      });

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

    if (initialValues.buttonsPurchases) {
      initialValues.buttonsPurchases.forEach(item => {
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

    if (initialValues.packetsPurchases) {
      initialValues.packetsPurchases.forEach(item => {
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

  // Get the current unit label based on selection
  const getUnitLabel = () => {
    return formData.measurementUnit;
  };

  // Handle cancel button click
  const handleCancel = () => {
    onClose(); // Now onClose is guaranteed to be a function (either provided or the default no-op)
  };

  return (
    <FormContainer
      title={initialValues._id ? "Edit Production" : "Create Production"}
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
      </FormSection>

      {/* Production Details */}
      <FormSection title="Production Details" color="green">
        <FormGrid columns={5} gap={4}>
          <FormInput
            label="Received Fabric*"
            value={formData.receivedFabric}
            onChange={(value) => handleInputChange("receivedFabric", value)}
            placeholder="e.g., Cotton, Polyester"
          />
          <FormInput
            label="Goods Type*"
            value={formData.goodsType}
            onChange={(value) => handleInputChange("goodsType", value)}
            placeholder="e.g., Shirt, Pant"
          />
          <FormInput
            label="Color*"
            value={formData.color}
            onChange={(value) => handleInputChange("color", value)}
            placeholder="e.g., Blue, Red"
          />
          <FormInput
            label="Required Qty*"
            type="number"
            min="1"
            value={formData.requiredQty}
            onChange={(value) => handleInputChange("requiredQty", value)}
          />
          <FormInput
            label="Expected Qty"
            type="number"
            value={formData.expectedQty}
            onChange={(value) => handleInputChange("expectedQty", value)}
          />
        </FormGrid>
      </FormSection>

      {/* Measurement Details with Unit Selector */}
      <FormSection title="Measurement Details" color="orange">
        <FormGrid columns={5} gap={4}>
          <FormSelect
            label="Measurement Unit*"
            value={formData.measurementUnit}
            onChange={(value) => handleInputChange("measurementUnit", value)}
            options={[
              { value: "Meters", label: "Meters" },
              { value: "KG", label: "KG" },
              { value: "Qty", label: "Qty" },
              { value: "Pcs", label: "Pcs" },
            ]}
          />
          <FormInput
            label={`DC ${getUnitLabel()}`}
            type="number"
            step="0.01"
            value={formData.dcMtr}
            onChange={(value) => handleInputChange("dcMtr", value)}
          />
          <FormInput
            label={`Tag ${getUnitLabel()}`}
            type="number"
            step="0.01"
            value={formData.tagMtr}
            onChange={(value) => handleInputChange("tagMtr", value)}
          />
          <FormInput
            label={`Cutting ${getUnitLabel()}`}
            type="number"
            step="0.01"
            value={formData.cuttingMtr}
            onChange={(value) => handleInputChange("cuttingMtr", value)}
          />
          <FormInput
            label={`Shortage ${getUnitLabel()}`}
            type="number"
            step="0.01"
            value={formData.shortageMtr}
            onChange={(value) => handleInputChange("shortageMtr", value)}
          />
        </FormGrid>
      </FormSection>

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