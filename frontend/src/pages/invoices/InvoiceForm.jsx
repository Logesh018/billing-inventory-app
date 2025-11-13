import React from "react";
import { useState, useEffect } from 'react';
import { BuyerSearchInput } from '../../components/Forms/SearchInputs';

export default function InvoiceForm({ onSubmit, onClose, initialValues = {} }) {
  // Basic invoice data
  const [formData, setFormData] = useState({
    documentNo: "",
    documentDate: new Date().toISOString().split('T')[0],
    orderNo: "",
    placeOfSupply: "Tamil Nadu",
    transportationCharges: 0,
    transportationHsn: "9966",
    transportationTaxRate: 18,
    paymentTerms: "Net 30",
    customerDetails: {
      name: "",
      mobile: "",
      address: "",
      gst: "",
      company: "",
    }
  });

  // Products with variations (colors/sizes)
  const [products, setProducts] = useState([
    {
      productDetails: {
        name: "",
        hsn: "",
      },
      variations: [
        { color: "", size: "", qty: 0, rate: 275 }
      ],
      taxRate: 5,
    }
  ]);

  const [loading, setLoading] = useState(false);

  // Initialize form for editing
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setFormData({
        documentNo: initialValues.documentNo || "",
        documentDate: initialValues.documentDate
          ? new Date(initialValues.documentDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        orderNo: initialValues.orderNo || "",
        placeOfSupply: initialValues.placeOfSupply || "Tamil Nadu",
        transportationCharges: initialValues.transportationCharges || 0,
        paymentTerms: initialValues.paymentTerms || "Net 30",
        customerDetails: {
          name: initialValues.customerDetails?.name || "",
          mobile: initialValues.customerDetails?.mobile || "",
          address: initialValues.customerDetails?.address || "",
          gst: initialValues.customerDetails?.gst || "",
          company: initialValues.customerDetails?.company || "",
        }
      });

      if (initialValues.items && initialValues.items.length > 0) {
        const convertedProducts = initialValues.items.map(item => {
          const variations = [];

          if (item.colors && item.colors.length > 0) {
            item.colors.forEach(color => {
              color.sizes.forEach(size => {
                variations.push({
                  size: size.sizeName,
                  color: color.colorName,
                  qty: size.quantity,
                  rate: size.unitPrice
                });
              });
            });
          } else {
            variations.push({
              size: "",
              color: "",
              qty: item.quantity || 0,
              rate: item.unitPrice || 0
            });
          }

          return {
            productDetails: {
              name: item.productDetails?.name || "",
              hsn: item.productDetails?.hsn || "",
              fabricType: item.productDetails?.fabricType || ""
            },
            variations,
            taxRate: item.taxRate || 5
          };
        });
        setProducts(convertedProducts);
      }
    }
  }, [initialValues]);

  // Form handlers
  const handleFormChange = (field, value) => {
    if (field.startsWith('customerDetails.')) {
      const customerField = field.replace('customerDetails.', '');
      setFormData(prev => ({
        ...prev,
        customerDetails: { ...prev.customerDetails, [customerField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleCustomerSelect = (customer) => {
    setFormData(prev => ({
      ...prev,
      customerDetails: {
        name: customer.name || "",
        mobile: customer.mobile || "",
        address: customer.address || "",
        gst: customer.gst || "",
        company: customer.company || "",
      },
      placeOfSupply: customer.state || "Tamil Nadu"
    }));
  };

  // Product handlers
  const handleAddProduct = () => {
    setProducts([
      ...products,
      {
        productDetails: { name: "", hsn: "", fabricType: "" },
        variations: [{ size: "", color: "", qty: 0, rate: 275 }],
        taxRate: 5
      }
    ]);
  };

  const handleRemoveProduct = (productIndex) => {
    if (products.length > 1) {
      const updated = [...products];
      updated.splice(productIndex, 1);
      setProducts(updated);
    }
  };

  const handleProductChange = (productIndex, field, value) => {
    const updated = [...products];
    updated[productIndex].productDetails[field] = value;
    setProducts(updated);
  };

  const handleTaxRateChange = (productIndex, value) => {
    const updated = [...products];
    updated[productIndex].taxRate = parseFloat(value);
    setProducts(updated);
  };

  const handleAddVariation = (productIndex) => {
    const updated = [...products];
    updated[productIndex].variations.push({ size: "", color: "", qty: 0, rate: 275 });
    setProducts(updated);
  };

  const handleRemoveVariation = (productIndex, variationIndex) => {
    const updated = [...products];
    if (updated[productIndex].variations.length > 1) {
      updated[productIndex].variations.splice(variationIndex, 1);
      setProducts(updated);
    }
  };

  const handleVariationChange = (productIndex, variationIndex, field, value) => {
    const updated = [...products];
    updated[productIndex].variations[variationIndex][field] = value;
    setProducts(updated);
  };

  // Calculate totals
  const calculateTotals = () => {
    let subtotal = 0;
    let totalTax = 0;

    products.forEach(product => {
      let productSubtotal = 0;
      product.variations.forEach(variation => {
        const qty = parseInt(variation.qty || 0);
        const rate = parseFloat(variation.rate || 0);
        productSubtotal += qty * rate;
      });
      subtotal += productSubtotal;

      const taxRate = parseFloat(product.taxRate || 0);
      const productTax = (productSubtotal * taxRate) / 100;
      totalTax += productTax;
    });

    const cgst = totalTax / 2;
    const sgst = totalTax / 2;

    // Transportation charges (dynamic tax rate)
    const transportCharges = parseFloat(formData.transportationCharges || 0);
    const transportTaxRate = parseFloat(formData.transportationTaxRate || 18);
    const transportTax = (transportCharges * transportTaxRate) / 100;
    const transportCgst = transportTax / 2;
    const transportSgst = transportTax / 2;

    const grandTotal = Math.round(subtotal + totalTax + transportCharges + transportTax);

    // Count total pieces
    const totalQty = products.reduce((sum, p) =>
      sum + p.variations.reduce((subSum, v) => subSum + (parseInt(v.qty || 0)), 0), 0
    );

    return {
      subtotal: subtotal.toFixed(2),
      cgst: cgst.toFixed(2),
      sgst: sgst.toFixed(2),
      totalTax: totalTax.toFixed(2),
      transportCharges: transportCharges.toFixed(2),
      transportCgst: transportCgst.toFixed(2),
      transportSgst: transportSgst.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
      totalQty
    };
  };

  const totals = calculateTotals();

  // Submit handler
  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (!formData.customerDetails.name.trim()) {
        alert("Customer name is required");
        return;
      }

      if (!formData.customerDetails.mobile.trim()) {
        alert("Customer mobile number is required");
        return;
      }

      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        if (!product.productDetails.name.trim()) {
          alert(`Product ${i + 1}: Product name is required`);
          return;
        }

        for (let j = 0; j < product.variations.length; j++) {
          const variation = product.variations[j];
          if (!variation.color.trim()) {
            alert(`Product ${i + 1}, Variation ${j + 1}: Color is required`);
            return;
          }
          if (!variation.size.trim()) {
            alert(`Product ${i + 1}, Variation ${j + 1}: Size is required`);
            return;
          }
          if (variation.qty <= 0) {
            alert(`Product ${i + 1}, Variation ${j + 1}: Quantity must be greater than 0`);
            return;
          }
        }
      }

      // Convert products to backend format
      const items = products.map(product => {
        const colorMap = {};
        product.variations.forEach(variation => {
          const color = variation.color;
          if (!colorMap[color]) {
            colorMap[color] = [];
          }
          colorMap[color].push({
            sizeName: variation.size,
            quantity: parseInt(variation.qty),
            unitPrice: parseFloat(variation.rate)
          });
        });

        const colors = Object.keys(colorMap).map(colorName => ({
          colorName,
          sizes: colorMap[colorName]
        }));

        return {
          productDetails: {
            name: product.productDetails.name.trim(),
            hsn: product.productDetails.hsn.trim(),
            //fabricType: product.productDetails.fabricType.trim()
          },
          colors,
          taxRate: parseFloat(product.taxRate || 5)
        };
      });

      const submitData = {
        documentType: "invoice",
        documentNo: formData.documentNo.trim(),
        documentDate: formData.documentDate,
        orderNo: formData.orderNo.trim(),
        placeOfSupply: formData.placeOfSupply,
        transportationCharges: parseFloat(formData.transportationCharges || 0),
        transportationHsn: formData.transportationHsn || "9966", 
        transportationTaxRate: parseFloat(formData.transportationTaxRate || 18), 
        paymentTerms: formData.paymentTerms,
        customer: formData.customerDetails,
        items
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error("Error submitting invoice:", error);
      alert("Failed to save invoice. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // const paymentTermsOptions = [
  //   "Net 15", "Net 30", "Net 45", "Net 60",
  //   "Due on Receipt", "COD", "Advance Payment",
  //   "50% Advance, 50% on Delivery"
  // ];

  const placeOfSupplyOptions = [
    "Tamil Nadu", "Andhra Pradesh", "Karnataka", "Kerala", "Telangana",
    "Maharashtra", "Gujarat", "Delhi", "Rajasthan", "Uttar Pradesh",
    "West Bengal", "Other"
  ];

  const taxRateOptions = [5, 12, 18, 28];

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
      <div className="text-center mb-3">
        <h1 className="text-xl font-bold text-gray-800">
          {initialValues._id ? "Edit Invoice" : "Create Invoice"}
        </h1>
      </div>

      {/* Invoice Details Section */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
          <div className="w-1 h-4 bg-blue-500 rounded mr-2"></div>
          Invoice Details
        </h3>
        <div className="grid grid-cols-4 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Invoice No</label>
            <input
              placeholder="Auto"
              className="w-full border border-gray-300 text-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
              value={formData.documentNo}
              onChange={(e) => handleFormChange('documentNo', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              className="w-full border border-gray-300 text-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
              value={formData.documentDate}
              onChange={(e) => handleFormChange('documentDate', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Order No</label>
            <input
              placeholder="PO/2526/03134"
              className="w-full border border-gray-300 text-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
              value={formData.orderNo}
              onChange={(e) => handleFormChange('orderNo', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Place of Supply</label>
            <select
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
              value={formData.placeOfSupply}
              onChange={(e) => handleFormChange('placeOfSupply', e.target.value)}
            >
              {placeOfSupplyOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          {/* <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Payment Terms</label>
            <select
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
              value={formData.paymentTerms}
              onChange={(e) => handleFormChange('paymentTerms', e.target.value)}
            >
              {paymentTermsOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div> */}
          {/* <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Transport (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              className="w-full border border-gray-300 text-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
              value={formData.transportationCharges}
              onChange={(e) => handleFormChange('transportationCharges', e.target.value)}
            />
          </div> */}
        </div>
      </div>

      {/* Customer Details Section */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
          <div className="w-1 h-4 bg-green-500 rounded mr-2"></div>
          Customer Details
        </h3>
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-3">
            <BuyerSearchInput
              label="Customer*"
              value={formData.customerDetails.name}
              onChange={(value) => handleFormChange('customerDetails.name', value)}
              onSelect={handleCustomerSelect}
              placeholder="Customer name"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
            <input
              placeholder="Company"
              className="w-full border border-gray-300 text-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-400"
              value={formData.customerDetails.company}
              onChange={(e) => handleFormChange('customerDetails.company', e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Mobile*</label>
            <input
              placeholder="Mobile"
              className="w-full border border-gray-300 text-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-400"
              value={formData.customerDetails.mobile}
              onChange={(e) => handleFormChange('customerDetails.mobile', e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">GST</label>
            <input
              placeholder="GST"
              className="w-full border border-gray-300 text-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-400"
              value={formData.customerDetails.gst}
              onChange={(e) => handleFormChange('customerDetails.gst', e.target.value)}
            />
          </div>
          <div className="col-span-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
            <textarea
              placeholder="Address"
              rows="1"
              className="w-full border border-gray-300 text-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-400 resize-none"
              value={formData.customerDetails.address}
              onChange={(e) => handleFormChange('customerDetails.address', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center">
            <div className="w-1 h-4 bg-purple-500 rounded mr-2"></div>
            Products
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddProduct}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded px-3 py-1 text-xs font-medium"
            >
              + Add Product
            </button>
            {products.length > 1 && (
              <button
                onClick={() => handleRemoveProduct(products.length - 1)}
                className="bg-red-500 hover:bg-red-600 text-white rounded px-3 py-1 text-xs font-medium"
              >
                Remove Product
              </button>
            )}
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-xs font-semibold">
              Total: {totals.totalQty} • ₹{totals.grandTotal}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-700 text-left w-1/5">Product</th>
                <th className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-700 text-left w-16">HSN</th>
                <th className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-700 text-center w-20">Color</th>
                <th className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-700 text-center w-14">Size</th>
                <th className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-700 text-center w-12">Qty</th>
                <th className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-700 text-center w-14">Rate</th>
                <th className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-700 text-center w-12">GST%</th>
                <th className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-700 text-center w-20">Action</th>
                <th className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-700 text-center w-16">Total</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, pIndex) => {
                const productTotal = product.variations.reduce(
                  (sum, v) => sum + (parseInt(v.qty || 0) * parseFloat(v.rate || 0)),
                  0
                );

                return (
                  <React.Fragment key={pIndex}>
                    {pIndex > 0 && (
                      <tr className="bg-white-100">
                        <td colSpan="10" className="p-1">
                          <div className="h-3"></div>
                        </td>
                      </tr>
                    )}
                    {product.variations.map((variation, vIndex) => (
                      <tr key={`${pIndex}-${vIndex}`} className={`hover:bg-gray-50 ${pIndex % 2 === 1 ? 'bg-white-50' : ''}`}>
                        {vIndex === 0 ? (
                          <td className="border border-gray-300 px-2 py-1 align-top" rowSpan={product.variations.length}>
                            <input
                              placeholder="Product name"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                              value={product.productDetails.name}
                              onChange={(e) => handleProductChange(pIndex, "name", e.target.value)}
                            />
                          </td>
                        ) : null}

                        {vIndex === 0 ? (
                          <td className="border border-gray-300 px-1 py-1 align-top" rowSpan={product.variations.length}>
                            <input
                              placeholder="HSN"
                              className="w-full border border-gray-300 text-gray-800 rounded px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
                              value={product.productDetails.hsn}
                              onChange={(e) => handleProductChange(pIndex, "hsn", e.target.value)}
                            />
                          </td>
                        ) : null}

                        <td className="border border-gray-300 px-1 py-0.5">
                          <input
                            placeholder="Color"
                            className="w-full border border-gray-300 text-gray-800 rounded px-1 py-0.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={variation.color}
                            onChange={(e) => handleVariationChange(pIndex, vIndex, "color", e.target.value)}
                          />
                        </td>

                        <td className="border border-gray-300 px-1 py-0.5">
                          <input
                            placeholder="Size"
                            className="w-full border border-gray-300 text-gray-800 rounded px-1 py-0.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={variation.size}
                            onChange={(e) => handleVariationChange(pIndex, vIndex, "size", e.target.value)}
                          />
                        </td>

                        {/* <td className="border border-gray-300 px-1 py-0.5">
                          <input
                            placeholder="Color"
                            className="w-full border border-gray-300 text-gray-800 rounded px-1 py-0.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={variation.color}
                            onChange={(e) => handleVariationChange(pIndex, vIndex, "color", e.target.value)}
                          />
                        </td> */}

                        <td className="border border-gray-300 px-1 py-0.5">
                          <input
                            type="number"
                            min="0"
                            placeholder="Qty"
                            className="w-full border border-gray-300 text-gray-800 rounded px-1 py-0.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={variation.qty}
                            onChange={(e) => handleVariationChange(pIndex, vIndex, "qty", e.target.value)}
                          />
                        </td>

                        <td className="border border-gray-300 px-1 py-0.5">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Rate"
                            className="w-full border border-gray-300 text-gray-800 rounded px-1 py-0.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={variation.rate}
                            onChange={(e) => handleVariationChange(pIndex, vIndex, "rate", e.target.value)}
                          />
                        </td>

                        {vIndex === 0 ? (
                          <td className="border border-gray-300 px-1 py-1 align-top" rowSpan={product.variations.length}>
                            <select
                              className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-purple-400 bg-white"
                              value={product.taxRate}
                              onChange={(e) => handleTaxRateChange(pIndex, e.target.value)}
                            >
                              {taxRateOptions.map(rate => (
                                <option key={rate} value={rate}>{rate}%</option>
                              ))}
                            </select>
                          </td>
                        ) : null}

                        <td className="border border-gray-300 px-1 py-0.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleAddVariation(pIndex)}
                              className="bg-green-500 hover:bg-green-600 text-white rounded px-1.5 py-0.5 text-xs font-medium"
                            >
                              +
                            </button>
                            <button
                              onClick={() => handleRemoveVariation(pIndex, vIndex)}
                              disabled={product.variations.length <= 1}
                              className="bg-red-400 hover:bg-red-500 text-white rounded px-1.5 py-0.5 text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              −
                            </button>
                          </div>
                        </td>

                        {vIndex === 0 ? (
                          <td className="border border-gray-300 px-2 py-1 text-center font-semibold text-gray-800 align-top" rowSpan={product.variations.length}>
                            ₹{productTotal.toFixed(2)}
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transportation Charges Section */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
          <div className="w-1 h-4 bg-orange-500 rounded mr-2"></div>
          Transportation
        </h3>
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">HSN Code</label>
            <input
              placeholder="9966"
              className="w-full border border-gray-300 text-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
              value={formData.transportationHsn || "9966"}
              onChange={(e) => handleFormChange('transportationHsn', e.target.value)}
            />
          </div>
          <div className="col-span-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">GST %</label>
            <select
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-orange-400 bg-white"
              value={formData.transportationTaxRate || 18}
              onChange={(e) => handleFormChange('transportationTaxRate', e.target.value)}
            >
              <option value="5">5%</option>
              <option value="12">12%</option>
              <option value="18">18%</option>
              <option value="28">28%</option>
            </select>
          </div>
          <div className="col-span-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">Transportation Cost (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="1500"
              className="w-full border border-gray-300 text-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
              value={formData.transportationCharges}
              onChange={(e) => handleFormChange('transportationCharges', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tax Summary */}
      <div className="mb-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded border border-gray-200 p-2">
            <div className="text-xs font-medium text-gray-700 mb-2">Product Tax</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">CGST:</span>
                <span>₹{totals.cgst}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">SGST:</span>
                <span>₹{totals.sgst}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded border border-gray-200 p-2">
            <div className="text-xs font-medium text-gray-700 mb-2">Transport Tax (18%)</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">CGST (9%):</span>
                <span>₹{totals.transportCgst}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">SGST (9%):</span>
                <span>₹{totals.transportSgst}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded border-2 border-orange-300 p-2">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-700">Subtotal:</span>
                <span className="font-medium">₹{totals.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Total Tax:</span>
                <span className="font-medium">₹{totals.totalTax}</span>
              </div>
              {parseFloat(totals.transportCharges) > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>Transport:</span>
                  <span className="font-medium">₹{totals.transportCharges}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-orange-600 border-t-2 border-orange-400 pt-1 mt-1">
                <span>Grand Total:</span>
                <span>₹{totals.grandTotal}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-600">
          {products.length} product{products.length !== 1 ? 's' : ''} • {totals.totalQty} pcs
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="bg-gray-500 hover:bg-gray-600 text-white rounded px-4 py-1.5 text-xs font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-1.5 text-xs font-medium disabled:opacity-50 flex items-center gap-1"
          >
            {loading ? "Saving..." : initialValues._id ? "Update Invoice" : "Generate Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}