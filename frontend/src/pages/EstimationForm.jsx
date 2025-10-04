// pages/Estimations/EstimationForm.jsx
import { useState, useEffect } from 'react';
import { FormContainer, FormSection, FormGrid, FormInput, FormSelect, FormTextarea } from '../components/UI/FormComponents';
import { BuyerSearchInput, ProductSearchInput } from '../components/Forms/SearchInputs';

export default function EstimationForm({ onSubmit, onClose, initialValues = {} }) {
  const [formData, setFormData] = useState({
    quotationNo: "",
    quotationDate: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days from now
    estimatedDelivery: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 21 days from now
    paymentTerms: "50% Advance, 50% on Delivery",
    deliveryTerms: "Ex-Factory",
    warranty: "1 Year Manufacturing Defects",
    notes: "",
    template: "modern",
    customer: {
      name: "",
      email: "",
      mobile: "",
      address: "",
      gst: "",
      company: "",
    },
    customization: {
      primaryColor: "#059669", // Green theme for estimations
      secondaryColor: "#64748b",
      fontFamily: "Inter",
      showLogo: true,
      showGST: true,
    }
  });

  const [items, setItems] = useState([
    {
      productDetails: {
        name: "",
        description: "",
        hsn: "",
        specifications: "", // Additional field for estimations
      },
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      discountType: "percentage",
      taxRate: 18,
      laborCost: 0, // Estimation-specific field
      materialCost: 0, // Estimation-specific field
    },
  ]);

  const [loading, setLoading] = useState(false);

  // Initialize form for editing
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setFormData({
        quotationNo: initialValues.quotationNo || initialValues.documentNo || "",
        quotationDate: initialValues.quotationDate ? new Date(initialValues.quotationDate).toISOString().split('T')[0] :
          initialValues.documentDate ? new Date(initialValues.documentDate).toISOString().split('T')[0] :
            new Date().toISOString().split('T')[0],
        validUntil: initialValues.validUntil ? new Date(initialValues.validUntil).toISOString().split('T')[0] :
          new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedDelivery: initialValues.estimatedDelivery ? new Date(initialValues.estimatedDelivery).toISOString().split('T')[0] :
          new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paymentTerms: initialValues.paymentTerms || "50% Advance, 50% on Delivery",
        deliveryTerms: initialValues.deliveryTerms || "Ex-Factory",
        warranty: initialValues.warranty || "1 Year Manufacturing Defects",
        notes: initialValues.notes || "",
        template: initialValues.template || "modern",
        customer: {
          name: initialValues.customerDetails?.name || "",
          email: initialValues.customerDetails?.email || "",
          mobile: initialValues.customerDetails?.mobile || "",
          address: initialValues.customerDetails?.address || "",
          gst: initialValues.customerDetails?.gst || "",
          company: initialValues.customerDetails?.company || "",
        },
        customization: initialValues.customization || {
          primaryColor: "#059669",
          secondaryColor: "#64748b",
          fontFamily: "Inter",
          showLogo: true,
          showGST: true,
        }
      });

      if (initialValues.items && initialValues.items.length > 0) {
        setItems(initialValues.items.map(item => ({
          productDetails: {
            name: item.productDetails?.name || "",
            description: item.productDetails?.description || "",
            hsn: item.productDetails?.hsn || "",
            specifications: item.productDetails?.specifications || "",
          },
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          discount: item.discount || 0,
          discountType: item.discountType || "percentage",
          taxRate: item.taxRate || 18,
          laborCost: item.laborCost || 0,
          materialCost: item.materialCost || 0,
        })));
      }
    }
  }, [initialValues]);

  // Form handlers
  const handleFormChange = (field, value) => {
    if (field.startsWith('customer.')) {
      const customerField = field.replace('customer.', '');
      setFormData(prev => ({
        ...prev,
        customer: { ...prev.customer, [customerField]: value }
      }));
    } else if (field.startsWith('customization.')) {
      const customField = field.replace('customization.', '');
      setFormData(prev => ({
        ...prev,
        customization: { ...prev.customization, [customField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

 const handleCustomerSelect = (customer) => {
  // Add null/undefined check
  if (!customer) {
    console.warn('No customer selected');
    return;
  }
  
  setFormData(prev => ({
    ...prev,
    customer: {
      name: customer.name || "",
      email: customer.email || "",
      mobile: customer.mobile || "",
      address: customer.address || "",
      gst: customer.gst || "",
      company: customer.company || "",
    }
  }));
};

  // Item handlers
  const addItem = () => {
    setItems([
      ...items,
      {
        productDetails: { name: "", description: "", hsn: "", specifications: "" },
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        discountType: "percentage",
        taxRate: 18,
        laborCost: 0,
        materialCost: 0,
      },
    ]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      const updated = [...items];
      updated.splice(index, 1);
      setItems(updated);
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    if (field.startsWith('productDetails.')) {
      const productField = field.replace('productDetails.', '');
      updated[index].productDetails[productField] = value;
    } else {
      updated[index][field] = value;
    }
    setItems(updated);
  };

  const handleProductSelect = (product, index) => {
    const updated = [...items];
    updated[index].productDetails = {
      name: product.name,
      description: product.description || "",
      hsn: product.hsn,
      specifications: product.specifications || "",
    };
    setItems(updated);
  };

  // Calculate totals (including labor and material costs)
  const calculateTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let totalLaborCost = 0;
    let totalMaterialCost = 0;

    items.forEach(item => {
      const laborCost = parseFloat(item.laborCost || 0) * item.quantity;
      const materialCost = parseFloat(item.materialCost || 0) * item.quantity;
      const lineSubtotal = (item.quantity * item.unitPrice) + laborCost + materialCost;

      subtotal += lineSubtotal;
      totalLaborCost += laborCost;
      totalMaterialCost += materialCost;

      // Calculate discount
      let discountAmount = 0;
      if (item.discountType === "percentage") {
        discountAmount = (lineSubtotal * item.discount) / 100;
      } else {
        discountAmount = parseFloat(item.discount || 0);
      }
      totalDiscount += discountAmount;

      // Calculate tax on discounted amount
      const taxableAmount = lineSubtotal - discountAmount;
      totalTax += (taxableAmount * item.taxRate) / 100;
    });

    const grandTotal = subtotal - totalDiscount + totalTax;

    return {
      subtotal: subtotal.toFixed(2),
      totalDiscount: totalDiscount.toFixed(2),
      totalTax: totalTax.toFixed(2),
      totalLaborCost: totalLaborCost.toFixed(2),
      totalMaterialCost: totalMaterialCost.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
    };
  };

  const totals = calculateTotals();

  // Form validation and submission
  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validation
      if (!formData.customer.name.trim()) {
        alert("Customer name is required");
        return;
      }

      if (!formData.customer.mobile.trim()) {
        alert("Customer mobile is required");
        return;
      }

      // Validate items
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.productDetails.name.trim()) {
          alert(`Item ${i + 1}: Product name is required`);
          return;
        }
        if (item.quantity <= 0) {
          alert(`Item ${i + 1}: Quantity must be greater than 0`);
          return;
        }
        if (item.unitPrice <= 0 && item.laborCost <= 0 && item.materialCost <= 0) {
          alert(`Item ${i + 1}: At least one cost (unit price, labor, or material) must be greater than 0`);
          return;
        }
      }

      // Prepare submission data
      const submitData = {
        quotationNo: formData.quotationNo,
        quotationDate: formData.quotationDate,
        validUntil: formData.validUntil,
        estimatedDelivery: formData.estimatedDelivery,
        paymentTerms: formData.paymentTerms,
        deliveryTerms: formData.deliveryTerms,
        warranty: formData.warranty,
        notes: formData.notes,
        template: formData.template,
        customization: formData.customization,
        customer: formData.customer,
        items: items.map(item => ({
          productDetails: item.productDetails,
          quantity: parseInt(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          discount: parseFloat(item.discount || 0),
          discountType: item.discountType,
          taxRate: parseFloat(item.taxRate),
          laborCost: parseFloat(item.laborCost || 0),
          materialCost: parseFloat(item.materialCost || 0),
        }))
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error("Error submitting estimation:", error);
      alert("Failed to save estimation/quotation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const paymentTermsOptions = [
    "50% Advance, 50% on Delivery",
    "100% Advance",
    "Net 30",
    "Net 15",
    "COD"
  ];

  const deliveryTermsOptions = [
    "Ex-Factory",
    "FOB",
    "CIF",
    "Door Delivery"
  ];

  const warrantyOptions = [
    "1 Year Manufacturing Defects",
    "6 Months Manufacturing Defects",
    "2 Years Manufacturing Defects",
    "No Warranty",
    "As per Manufacturer"
  ];

  const templateOptions = [
    { value: "modern", label: "Modern" },
    { value: "classic", label: "Classic" },
    { value: "minimal", label: "Minimal" }
  ];

  return (
    <FormContainer
      title={initialValues._id ? "Edit Estimation/Quotation" : "Create Estimation/Quotation"}
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={loading}
      submitText="Generate Quotation"
    >
      {/* Quotation Details */}
      <FormSection title="Quotation Details" color="green">
        <FormGrid columns={4}>
          <FormInput
            label="Quotation Number"
            value={formData.quotationNo}
            onChange={(value) => handleFormChange('quotationNo', value)}
            placeholder="Auto-generated if empty"
          />
          <FormInput
            label="Quotation Date"
            type="date"
            value={formData.quotationDate}
            onChange={(value) => handleFormChange('quotationDate', value)}
            required
          />
          <FormInput
            label="Valid Until"
            type="date"
            value={formData.validUntil}
            onChange={(value) => handleFormChange('validUntil', value)}
            required
          />
          <FormInput
            label="Estimated Delivery"
            type="date"
            value={formData.estimatedDelivery}
            onChange={(value) => handleFormChange('estimatedDelivery', value)}
            required
          />
        </FormGrid>

        <FormGrid columns={3} className="mt-2">
          <FormSelect
            label="Payment Terms"
            value={formData.paymentTerms}
            onChange={(value) => handleFormChange('paymentTerms', value)}
            options={paymentTermsOptions}
          />
          <FormSelect
            label="Delivery Terms"
            value={formData.deliveryTerms}
            onChange={(value) => handleFormChange('deliveryTerms', value)}
            options={deliveryTermsOptions}
          />
          <FormSelect
            label="Warranty"
            value={formData.warranty}
            onChange={(value) => handleFormChange('warranty', value)}
            options={warrantyOptions}
          />
        </FormGrid>
      </FormSection>

      {/* Customer Information */}
      <FormSection title="Customer Information" color="blue">
        <FormGrid columns={3}>
          <BuyerSearchInput
            label="Customer Name"
            value={formData.customer.name}
            onChange={(value) => handleFormChange('customer.name', value)}
            onSelect={handleCustomerSelect}
            placeholder="Enter customer name"
            required
          />
          <FormInput
            label="Company"
            value={formData.customer.company}
            onChange={(value) => handleFormChange('customer.company', value)}
            placeholder="Company name (optional)"
          />
          <FormInput
            label="GST Number"
            value={formData.customer.gst}
            onChange={(value) => handleFormChange('customer.gst', value)}
            placeholder="GST number (optional)"
          />
        </FormGrid>

        <FormGrid columns={3} className="mt-2">
          <FormInput
            label="Mobile Number"
            value={formData.customer.mobile}
            onChange={(value) => handleFormChange('customer.mobile', value)}
            placeholder="Customer mobile"
            required
          />
          <FormInput
            label="Email"
            type="email"
            value={formData.customer.email}
            onChange={(value) => handleFormChange('customer.email', value)}
            placeholder="Customer email"
          />
          <FormTextarea
            label="Address"
            value={formData.customer.address}
            onChange={(value) => handleFormChange('customer.address', value)}
            placeholder="Customer address"
            rows={1}
          />
        </FormGrid>
      </FormSection>

      {/* Estimation Items */}
      <FormSection title="Estimation Items" color="purple">
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-medium text-gray-700">Item {index + 1}</h4>
                {items.length > 1 && (
                  <button
                    onClick={() => removeItem(index)}
                    className="bg-red-500 hover:bg-red-600 text-white rounded px-2 py-1 text-xs"
                  >
                    Remove
                  </button>
                )}
              </div>

              <FormGrid columns={6} gap={3}>
                <div className="col-span-2">
                  <ProductSearchInput
                    label="Product/Service Name"
                    value={item.productDetails.name}
                    onChange={(value) => handleItemChange(index, 'productDetails.name', value)}
                    onSelect={(product) => handleProductSelect(product, index)}
                    placeholder="Enter product/service name"
                    required
                  />
                </div>
                <FormInput
                  label="HSN Code"
                  value={item.productDetails.hsn}
                  onChange={(value) => handleItemChange(index, 'productDetails.hsn', value)}
                  placeholder="HSN code"
                />
                <FormInput
                  label="Quantity"
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(value) => handleItemChange(index, 'quantity', value)}
                  required
                />
                <FormInput
                  label="Unit Price (₹)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(value) => handleItemChange(index, 'unitPrice', value)}
                />
                <FormInput
                  label="Tax Rate (%)"
                  type="number"
                  min="0"
                  max="100"
                  value={item.taxRate}
                  onChange={(value) => handleItemChange(index, 'taxRate', value)}
                />
              </FormGrid>

              <FormGrid columns={6} gap={3} className="mt-3">
                <FormTextarea
                  className="col-span-2"
                  label="Description (Optional)"
                  value={item.productDetails.description}
                  onChange={(value) => handleItemChange(index, 'productDetails.description', value)}
                  placeholder="Item description"
                  rows={1}
                />
                <FormTextarea
                  label="Specifications"
                  value={item.productDetails.specifications}
                  onChange={(value) => handleItemChange(index, 'productDetails.specifications', value)}
                  placeholder="Technical specifications"
                  rows={1}
                />
                <FormInput
                  label="Labor Cost (₹)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.laborCost}
                  onChange={(value) => handleItemChange(index, 'laborCost', value)}
                  placeholder="Per unit labor cost"
                />
                <FormInput
                  label="Material Cost (₹)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.materialCost}
                  onChange={(value) => handleItemChange(index, 'materialCost', value)}
                  placeholder="Per unit material cost"
                />
                <FormInput
                  label="Discount"
                  type="number"
                  min="0"
                  value={item.discount}
                  onChange={(value) => handleItemChange(index, 'discount', value)}
                />
              </FormGrid>

              <FormGrid columns={1} className="mt-3">
                <FormSelect
                  label="Discount Type"
                  value={item.discountType}
                  onChange={(value) => handleItemChange(index, 'discountType', value)}
                  options={[
                    { value: "percentage", label: "Percentage (%)" },
                    { value: "amount", label: "Fixed Amount (₹)" }
                  ]}
                  className="max-w-xs"
                />
              </FormGrid>
            </div>
          ))}

          <button
            onClick={addItem}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2 text-sm font-medium"
          >
            + Add Item
          </button>
        </div>
      </FormSection>

      {/* Estimation Totals Summary */}
      <FormSection title="Estimation Summary" color="yellow">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Labor Cost:</span>
                <span>₹{totals.totalLaborCost}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Material Cost:</span>
                <span>₹{totals.totalMaterialCost}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>₹{totals.subtotal}</span>
              </div>
              {parseFloat(totals.totalDiscount) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Total Discount:</span>
                  <span>-₹{totals.totalDiscount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Total Tax:</span>
                <span>₹{totals.totalTax}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-green-600 border-t pt-2">
                <span>Grand Total:</span>
                <span>₹{totals.grandTotal}</span>
              </div>
            </div>
          </div>
        </div>
      </FormSection>

      {/* Template & Customization */}
      <FormSection title="Template & Design" color="purple">
        <FormGrid columns={3}>
          <FormSelect
            label="Template"
            value={formData.template}
            onChange={(value) => handleFormChange('template', value)}
            options={templateOptions}
          />
          <FormInput
            label="Primary Color"
            type="color"
            value={formData.customization.primaryColor}
            onChange={(value) => handleFormChange('customization.primaryColor', value)}
          />
          <FormInput
            label="Font Family"
            value={formData.customization.fontFamily}
            onChange={(value) => handleFormChange('customization.fontFamily', value)}
            placeholder="Inter, Arial, etc."
          />
        </FormGrid>
      </FormSection>

      {/* Notes */}
      <FormSection title="Additional Information" color="gray">
        <FormGrid columns={1}>
          <FormTextarea
            label="Notes, Terms & Conditions"
            value={formData.notes}
            onChange={(value) => handleFormChange('notes', value)}
            placeholder="Terms and conditions, project scope, delivery timeline, warranty information, or additional notes for the estimation"
            rows={4}
          />
        </FormGrid>
      </FormSection>

      {/* Summary Footer */}
      <div className="text-sm text-gray-600 mb-4">
        {items.length} item{items.length !== 1 ? 's' : ''} • Total: ₹{totals.grandTotal} • Valid until: {new Date(formData.validUntil).toLocaleDateString()}
      </div>
    </FormContainer>
  );
}