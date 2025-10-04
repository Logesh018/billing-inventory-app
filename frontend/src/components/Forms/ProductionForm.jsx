import { useState, useEffect } from "react";
import {
  FormContainer,
  FormSection,
  FormGrid,
  FormInput,
  FormSelect,
  SearchableInput,
} from "../UI/FormComponents";

export default function ProductionForm({
  onSubmit,
  onClose,
  initialValues = {},
  orders = [],
  purchases = [],
}) {
  const [formData, setFormData] = useState({
    orderId: "",
    poDate: new Date().toISOString().split("T")[0],
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
    status: "Pending Production",
    remarks: "",
  });

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderSuggestions, setOrderSuggestions] = useState([]);
  const [showOrderDropdown, setShowOrderDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize form for editing
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      const order = orders.find((o) => o._id === initialValues.order?._id) || {};
      setSelectedOrder(order);

      setFormData({
        orderId: initialValues.order?._id || "",
        poDate: initialValues.poDate
          ? new Date(initialValues.poDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        factoryReceivedDate: initialValues.factoryReceivedDate
          ? new Date(initialValues.factoryReceivedDate).toISOString().split("T")[0]
          : "",
        receivedFabric: initialValues.receivedFabric || getFallbackValue(order, purchases, "fabricType"),
        goodsType: initialValues.goodsType || getFallbackValue(order, purchases, "fabricStyle"),
        color: initialValues.color || getFallbackValue(order, purchases, "fabricColor"),
        requiredQty: initialValues.requiredQty || getFallbackValue(order, purchases, "totalQty"),
        expectedQty: initialValues.expectedQty || "0",
        dcMtr: initialValues.dcMtr || "0",
        tagMtr: initialValues.tagMtr || "0",
        cuttingMtr: initialValues.cuttingMtr || "0",
        shortageMtr: initialValues.shortageMtr || "0",
        status: initialValues.status || "Pending Production",
        remarks: initialValues.remarks || "",
      });
    }
  }, [initialValues, orders, purchases]);

  // Fallback logic based on Order Type (FOB vs JOB-WORKS)
  const getFallbackValue = (order, purchases, field) => {
    if (!order) return "";

    const isFob = order.orderType === "FOB";
    const relatedPurchase = isFob
      ? purchases.find((p) => p.order?._id === order._id && p.purchaseKg > 0)
      : null;

    switch (field) {
      case "fabricType":
        return isFob
          ? relatedPurchase?.fabricType || ""
          : order.fabric?.type || "";
      case "fabricStyle":
        return isFob
          ? relatedPurchase?.fabricStyles?.[0] || ""
          : order.fabric?.style || "";
      case "fabricColor":
        return isFob
          ? relatedPurchase?.fabricColors?.[0] || ""
          : order.fabric?.color || "";
      case "totalQty":
        return isFob
          ? relatedPurchase?.purchaseKg || ""
          : order.totalQty || "";
      default:
        return "";
    }
  };

  const searchOrders = (searchTerm) => {
    if (searchTerm.length < 2) {
      setOrderSuggestions([]);
      setShowOrderDropdown(false);
      return;
    }

    const filtered = orders.filter(
      (order) =>
        order.orderNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.buyerDetails?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setOrderSuggestions(filtered);
    setShowOrderDropdown(true);
  };

  const selectOrder = (order) => {
    setSelectedOrder(order);
    setFormData((prev) => ({
      ...prev,
      orderId: order._id,
      receivedFabric: getFallbackValue(order, purchases, "fabricType"),
      goodsType: getFallbackValue(order, purchases, "fabricStyle"),
      color: getFallbackValue(order, purchases, "fabricColor"),
      requiredQty: getFallbackValue(order, purchases, "totalQty"),
      status: order.status || "Pending Production",
    }));
    setShowOrderDropdown(false);
    setOrderSuggestions([]);
  };

  const handleInputChange = (field, value) => {
    if (field === "orderId") {
      searchOrders(value);
    }
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

  const totalInfo = selectedOrder
    ? `${selectedOrder.orderType} • Order: ${selectedOrder.orderNo || "N/A"}`
    : "Select an order to begin";

  return (
    <FormContainer
      title={initialValues?._id ? "Edit Production" : "Create Production"}
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={loading}
      submitText={initialValues?._id ? "Update Production" : "Create Production"}
      totalInfo={totalInfo}
    >
      {/* Order Selection */}
      <FormSection title="Order Selection" color="blue">
        <FormGrid columns={1}>
          <SearchableInput
            label="Select Order*"
            value={formData.orderId ? selectedOrder?.orderNo || "" : ""}
            onChange={(value) => handleInputChange("orderId", value)}
            placeholder="Search by Order No or Buyer Name..."
            suggestions={orderSuggestions}
            onSelect={selectOrder}
            showDropdown={showOrderDropdown}
            onBlur={() => setTimeout(() => setShowOrderDropdown(false), 200)}
          />
          {selectedOrder && (
            <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded mt-1">
              <div>
                <strong>Buyer:</strong> {selectedOrder.buyerDetails?.name || "N/A"}
              </div>
              <div>
                <strong>Type:</strong>{" "}
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    selectedOrder.orderType === "FOB"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {selectedOrder.orderType}
                </span>
              </div>
              <div>
                <strong>Total Qty:</strong> {selectedOrder.totalQty || "N/A"}
              </div>
            </div>
          )}
        </FormGrid>
      </FormSection>

      {/* Production Details */}
      <FormSection title="Production Details" color="green">
        <FormGrid columns={3} gap={4}>
          <FormInput
            label="PO Date*"
            type="date"
            value={formData.poDate}
            onChange={(value) => handleInputChange("poDate", value)}
          />
          <FormInput
            label="Factory Received Date"
            type="date"
            value={formData.factoryReceivedDate}
            onChange={(value) => handleInputChange("factoryReceivedDate", value)}
          />
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
          <FormInput
            label="DC Meters"
            type="number"
            value={formData.dcMtr}
            onChange={(value) => handleInputChange("dcMtr", value)}
          />
          <FormInput
            label="Tag Meters"
            type="number"
            value={formData.tagMtr}
            onChange={(value) => handleInputChange("tagMtr", value)}
          />
          <FormInput
            label="Cutting Meters"
            type="number"
            value={formData.cuttingMtr}
            onChange={(value) => handleInputChange("cuttingMtr", value)}
          />
          <FormInput
            label="Shortage Meters"
            type="number"
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