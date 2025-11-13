import React from "react";
import { useState, useEffect } from "react";
import { axiosInstance } from "../../lib/axios";
import { showSuccess, showError, showWarning } from "../../utils/toast"

export default function OrderForm({ onSubmit, onClose, initialValues = {}, defaultOrderType }) {
  const [formData, setFormData] = useState({
    PoNo: "",
    orderDate: new Date().toISOString().split('T')[0],
    orderType: defaultOrderType || "",
    buyer: {
      name: "",
      code: "",
      mobile: "",
      gst: "",
      email: "",
      address: "",
    }
  });

  const [products, setProducts] = useState([
    {
      productDetails: { name: "", style: "", color: "", fabricType: "" },
      variations: [
        { size: "S", qty: "" },
        { size: "M", qty: "" },
        { size: "L", qty: "" },
        { size: "XL", qty: "" }
      ],
    },
  ]);


  // Dropdown states
  const [buyerSuggestions, setBuyerSuggestions] = useState([]);
  const [showBuyerDropdown, setShowBuyerDropdown] = useState(false);
  const [productSuggestions, setProductSuggestions] = useState([]);
  const [showProductDropdown, setShowProductDropdown] = useState({});
  const [loading, setLoading] = useState(false);


  // Initialize form with existing data for editing
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setFormData({
        PoNo: initialValues.PoNo || "",
        orderDate: initialValues.orderDate ? new Date(initialValues.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        orderType: initialValues.orderType || "",
        buyer: {
          _id: initialValues.buyerDetails?._id || "",
          name: initialValues.buyerDetails?.name || "",
          code: initialValues.buyerDetails?.code || "",
          mobile: initialValues.buyerDetails?.mobile || "",
          gst: initialValues.buyerDetails?.gst || "",
          email: initialValues.buyerDetails?.email || "",
          address: initialValues.buyerDetails?.address || "",
        }
      });

      if (initialValues.products && initialValues.products.length > 0) {
        setProducts(initialValues.products.map(p => ({
          productDetails: {
            name: p.productDetails?.name || "",
            style: p.productDetails?.style || "",
            color: p.productDetails?.color || "",
            fabricType: p.productDetails?.fabricType || "",
          },
          variations: p.sizes?.map(s => ({
            size: s.size || "",
            qty: s.qty || ""
          })) || [
              { size: "S", qty: "" },
              { size: "M", qty: "" },
              { size: "L", qty: "" },
              { size: "XL", qty: "" }
            ]
        })));
      }
    }
  }, [initialValues]);

  // Add normalization function for size input
  const normalizeSizeInput = (value) => {
    return value.trim().toUpperCase();
  };

  const searchBuyers = async (searchTerm) => {
    if (searchTerm.length < 2) {
      setBuyerSuggestions([]);
      setShowBuyerDropdown(false);
      return;
    }

    try {
      const { data } = await axiosInstance.get(`/orders/search/buyers?q=${searchTerm}`);

      // Deduplicate buyers (by _id or name+mobile)
      const uniqueBuyers = data.filter(
        (buyer, index, self) =>
          index === self.findIndex(
            (b) =>
              (b._id && b._id === buyer._id) ||
              (b.name === buyer.name && b.mobile === buyer.mobile)
          )
      );

      setBuyerSuggestions(uniqueBuyers);
      setShowBuyerDropdown(true);
    } catch (error) {
      console.error("Error searching buyers:", error);
      setBuyerSuggestions([]);
      setShowBuyerDropdown(false);
    }
  };

  const searchProducts = async (searchTerm, productIndex) => {
    if (searchTerm.length < 2) {
      setProductSuggestions([]);
      setShowProductDropdown({});
      return;
    }

    try {
      const { data } = await axiosInstance.get(`/products/search?q=${encodeURIComponent(searchTerm)}`);

      // Deduplicate products (by _id or name+hsn)
      const uniqueProducts = data.filter(
        (prod, index, self) =>
          index === self.findIndex(
            (p) =>
              (p._id && p._id === prod._id) ||
              (p.name === prod.name && p.hsn === prod.hsn)
          )
      );

      setProductSuggestions(uniqueProducts);
      setShowProductDropdown({ [productIndex]: true });
    } catch (error) {
      console.error("Error searching products:", error);
      setProductSuggestions([]);
      setShowProductDropdown({});
    }
  };

  const handleFormChange = (field, value) => {
    if (field.startsWith('buyer.')) {
      const buyerField = field.replace('buyer.', '');
      setFormData(prev => ({
        ...prev,
        buyer: { ...prev.buyer, [buyerField]: value }
      }));

      if (buyerField === 'name') {
        searchBuyers(value);
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const selectBuyer = (buyer) => {
    setFormData(prev => ({
      ...prev,
      buyer: {
        _id: buyer._id,
        name: buyer.name,
        code: buyer.code || "",
        mobile: buyer.mobile || "",
        gst: buyer.gst || "",
        email: buyer.email || "",
        address: buyer.address || "",
      }
    }));
    setShowBuyerDropdown(false);
    setBuyerSuggestions([]);
  };

  const selectProduct = (prod, pIndex) => {
    const updated = [...products];
    updated[pIndex].productDetails.name = prod.name;
    updated[pIndex].productDetails.style = prod.style || "";
    updated[pIndex].productDetails.color = prod.color || "";
    updated[pIndex].productDetails.fabricType = prod.fabricType || "";
    setProducts(updated);
    setShowProductDropdown({});
    setProductSuggestions([]);
  };

  const handleSaveBuyer = async () => {
    try {
      setLoading(true);

      if (!formData.buyer.name.trim()) {
        showWarning("Buyer name is required");
        return;
      }
      if (!formData.buyer.mobile.trim()) {
        showWarning("Buyer mobile is required");
        return;
      }

      const buyerData = {
        name: formData.buyer.name,
        code: formData.buyer.code || "",
        mobile: formData.buyer.mobile,
        gst: formData.buyer.gst || "",
        email: formData.buyer.email || "",
        address: formData.buyer.address || "",
      };

      const { data: newBuyer } = await axiosInstance.post("/buyers", buyerData);

      setFormData(prev => ({
        ...prev,
        PoNo: "",
        orderDate: new Date().toISOString().split('T')[0],
        orderType: "",
        buyer: {
          _id: newBuyer._id,
          name: newBuyer.name,
          code: newBuyer.code,
          mobile: newBuyer.mobile,
          gst: newBuyer.gst,
          email: newBuyer.email,
          address: newBuyer.address,
        }
      }));
      setProducts([
        {
          productDetails: { name: "", style: "", color: "", fabricType: "" },  // ✅ Correct
          variations: [
            { size: "S", qty: "" },
            { size: "M", qty: "" },
            { size: "L", qty: "" },
            { size: "XL", qty: "" }
          ],
        },
      ]);

      showSuccess("Buyer saved successfully!");
    } catch (error) {
      console.error("Error saving buyer:", error);
      showError("Failed to save buyer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const addProduct = () => {
    setProducts([
      ...products,
      {
        productDetails: { name: "", style: "", color: "", fabricType: "" },  // ✅ Correct structure
        variations: [
          { size: "S", qty: "" },
          { size: "M", qty: "" },
          { size: "L", qty: "" },
          { size: "XL", qty: "" }
        ]
      },
    ]);
  };

  const removeProduct = (index) => {
    const updated = [...products];
    updated.splice(index, 1);
    setProducts(updated);
  };

  const addVariation = (pIndex) => {
    const updated = [...products];
    updated[pIndex].variations.push({ size: "", qty: "" });
    setProducts(updated);
  };

  const removeVariation = (pIndex, vIndex) => {
    const updated = [...products];
    if (updated[pIndex].variations.length > 1) { // Allow removal if more than 1 variation exists
      updated[pIndex].variations.splice(vIndex, 1);
      setProducts(updated);
    }
  };

  const handleProductChange = (pIndex, field, value) => {
    const updated = [...products];
    if (field === 'name') {
      updated[pIndex].productDetails.name = value;
      searchProducts(value, pIndex);
    } else if (field === 'style') {
      updated[pIndex].productDetails.style = value;
    } else if (field === 'color') {
      updated[pIndex].productDetails.color = value;
    } else if (field === 'fabricType') {
      updated[pIndex].productDetails.fabricType = value;
    }
    setProducts(updated);
  };

  const handleVariationChange = (pIndex, vIndex, field, value) => {
    const updated = [...products];
    // Normalize size input to uppercase and trim whitespace
    if (field === 'size') {
      updated[pIndex].variations[vIndex][field] = normalizeSizeInput(value);
    } else {
      updated[pIndex].variations[vIndex][field] = value;
    }
    setProducts(updated);
  };

  const totalQty = products.reduce(
    (sum, p) =>
      sum +
      p.variations.reduce(
        (subSum, v) => subSum + (parseInt(v.qty || 0, 10) || 0),
        0
      ),
    0
  );

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Add validation for PO No
      if (!formData.PoNo.trim()) {
        showWarning("PO No is required");
        return;
      }
      if (!formData.orderType) {
        showWarning("Order type is required");
        return;
      }
      if (!formData.buyer.name.trim()) {
        showWarning("Buyer name is required");
        return;
      }
      if (!formData.buyer.mobile.trim()) {
        showWarning("Buyer mobile is required");
        return;
      }

      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        if (!product.productDetails.name.trim()) {
          showWarning(`Product ${i + 1}: Name is required`);
          return;
        }
        if (!product.productDetails.style.trim()) {
          showWarning(`Product ${i + 1}: Style is required`);
          return;
        }
        if (!product.productDetails.color.trim()) {
          showWarning(`Product ${i + 1}: Color is required`);
          return;
        }
        if (!product.productDetails.fabricType.trim()) {
          showWarning(`Product ${i + 1}: Fabric Type is required`);
          return;
        }

        for (let j = 0; j < product.variations.length; j++) {
          const variation = product.variations[j];
          if (!variation.size.trim() || !variation.qty) {
            showWarning(`Product ${i + 1}, Size ${j + 1}: All fields are required`);
            return;
          }
        }
      }

      const submitData = {
        PoNo: formData.PoNo,
        orderDate: formData.orderDate,
        orderType: formData.orderType,
        buyer: {
          _id: formData.buyer._id,
          name: formData.buyer.name,
          code: formData.buyer.code,
          mobile: formData.buyer.mobile,
          gst: formData.buyer.gst,
          email: formData.buyer.email,
          address: formData.buyer.address,
        },
        products: products.map(p => ({
          productDetails: {
            name: p.productDetails.name,
            style: p.productDetails.style,
            color: p.productDetails.color,
            fabricType: p.productDetails.fabricType,
          },
          sizes: p.variations.map(v => ({
            size: v.size,
            qty: parseInt(v.qty) || 0,
          })),
        }))
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error("Error submitting order:", error);
      showError("Failed to save order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
      <div className="text-center mb-3">
        <h1 className="text-xl font-bold text-gray-800">
          {defaultOrderType === "FOB"
            ? "Create FOB Order"
            : defaultOrderType === "JOB-Works"
              ? "Create JOB-Works Order"
              : defaultOrderType === "Own-Orders"
                ? "Create Own Order"
                : "Create Order"}
        </h1>
      </div>

      {/* Buyer Information Section */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
          <div className="w-1 h-4 bg-blue-500 rounded mr-2"></div>
          Buyer Information
        </h3>

        <div className="grid grid-cols-12 gap-2 items-start mb-2">
          {/* Buyer Name - 2 cols */}
          <div className="relative col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Buyer*
            </label>
            <input
              placeholder="Enter buyer name"
              className="w-full border border-gray-300 text-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
              value={formData.buyer.name}
              onChange={(e) => handleFormChange('buyer.name', e.target.value)}
              onBlur={() => setTimeout(() => setShowBuyerDropdown(false), 200)}
            />
            {showBuyerDropdown && buyerSuggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                {buyerSuggestions.map((buyer, index) => (
                  <div
                    key={buyer._id || index}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-xs text-gray-700"
                    onClick={() => selectBuyer(buyer)}
                  >
                    <div className="font-medium text-gray-700">{buyer.name}</div>
                    <div className="text-gray-500">{buyer.mobile}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buyer Code - 1 col */}
          <div className="col-span-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Code
            </label>
            <input
              placeholder="Auto"
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
              value={formData.buyer.code}
              onChange={(e) => handleFormChange('buyer.code', e.target.value)}
            />
          </div>

          {/* Mobile - 2 cols */}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Mobile*
            </label>
            <input
              placeholder="Mobile number"
              className="w-full border border-gray-300 text-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
              value={formData.buyer.mobile}
              onChange={(e) => handleFormChange('buyer.mobile', e.target.value)}
            />
          </div>

          {/* GST - 2 cols */}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              GST
            </label>
            <input
              placeholder="GST number"
              className="w-full border border-gray-300 text-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
              value={formData.buyer.gst}
              onChange={(e) => handleFormChange('buyer.gst', e.target.value)}
            />
          </div>

          {/* Email - 2 cols */}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Email
            </label>
            <input
              placeholder="Email address"
              className="w-full border border-gray-300 text-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
              value={formData.buyer.email}
              onChange={(e) => handleFormChange('buyer.email', e.target.value)}
            />
          </div>

          {/* Address - 3 cols */}
          <div className="col-span-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Address
            </label>
            <textarea
              placeholder="Address"
              rows="1"
              className="w-full border border-gray-300 text-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 resize-none"
              value={formData.buyer.address}
              onChange={(e) => handleFormChange('buyer.address', e.target.value)}
            />
          </div>
        </div>

        {/* Buttons row */}
        <div className="flex justify-end gap-2">
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
            onClick={handleSaveBuyer}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-1.5 text-xs font-medium disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Buyer"}
          </button>
        </div>
      </div>

      {/* Order Details Section */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
          <div className="w-1 h-4 bg-green-500 rounded mr-2"></div>
          Order Details
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {/* PO No - Now Editable */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              PO No*
            </label>
            <input
              placeholder="Enter PO No"
              className="w-full border border-gray-300 text-gray-800 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-400 focus:border-green-400"
              value={formData.PoNo}
              onChange={(e) => handleFormChange('PoNo', e.target.value)}
              required
            />
          </div>

          {/* Order Type */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Type*
            </label>
            <select
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-green-400 focus:border-green-400 bg-white"
              value={formData.orderType}
              onChange={(e) => handleFormChange('orderType', e.target.value)}
              required
            >
              <option value="">Select type</option>
              <option value="FOB">FOB</option>
              <option value="JOB-Works">JOB-Works</option>
              <option value="Own-Orders">Own Orders</option>

            </select>
          </div>

          {/* Order Date */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Date*
            </label>
            <input
              type="date"
              className="w-full border border-gray-300 text-gray-800 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-400 focus:border-green-400"
              value={formData.orderDate}
              onChange={(e) => handleFormChange('orderDate', e.target.value)}
              required
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
              onClick={addProduct}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded px-3 py-1 text-xs font-medium"
            >
              + Add Product
            </button>
            {products.length > 1 && (
              <button
                onClick={() => removeProduct(products.length - 1)}
                className="bg-red-500 hover:bg-red-600 text-white rounded px-3 py-1 text-xs font-medium"
                title="Remove Last Product"
              >
                Remove Product
              </button>
            )}
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-xs font-semibold">
              Total: {totalQty}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-700 text-left w-1/4">
                  Product
                </th>
                <th className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-700 text-left w-1/6">
                  Style
                </th>
                <th className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-700 text-left w-1/6">
                  Color
                </th>
                <th className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-700 text-left w-1/6">
                  Fabric Type
                </th>
                <th className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-700 text-center w-16">
                  Size
                </th>
                <th className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-700 text-center w-20">
                  Qty
                </th>
                <th className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-700 text-center w-20">
                  Action
                </th>
                <th className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-700 text-center w-16">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, pIndex) => {
                const productTotal = product.variations.reduce(
                  (sum, v) => sum + (parseInt(v.qty || 0, 10) || 0),
                  0
                );

                return (
                  <React.Fragment key={pIndex}>
                    {/* Add spacing row between products */}
                    {pIndex > 0 && (
                      <tr className="bg-white-100">
                        <td colSpan="8" className="p-1">
                          <div className="h-3"></div>
                        </td>
                      </tr>
                    )}
                    {product.variations.map((variation, vIndex) => (
                      <tr
                        key={`${pIndex}-${vIndex}`}
                        className={`hover:bg-gray-50 ${pIndex % 2 === 1 ? 'bg-white-50' : ''}`}
                      >
                        {/* Product Name - only show in first row */}
                        {vIndex === 0 ? (
                          <td
                            className="border border-gray-300 px-2 py-1 align-top relative"
                            rowSpan={product.variations.length}
                          >
                            <input
                              placeholder="Product name"
                              className="w-full border border-gray-300 rounded px-2 py-1.5 text-[10px] text-gray-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                              value={product.productDetails.name}
                              onChange={(e) => handleProductChange(pIndex, "name", e.target.value)}
                              onBlur={() => setTimeout(() => setShowProductDropdown({}), 200)}
                            />
                            {showProductDropdown[pIndex] && productSuggestions.length > 0 && (
                              <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1 left-2">
                                {productSuggestions.map((prod, index) => (
                                  <div
                                    key={prod._id || index}
                                    className="px-3 py-2 hover:bg-gray-100 text-gray-800 cursor-pointer text-xs"
                                    onClick={() => selectProduct(prod, pIndex)}
                                  >
                                    <div className="font-medium text-gray-800">{prod.name}</div>
                                    <div className="text-gray-700">Style: {prod.style}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        ) : null}

                        {/* Style - only show in first row */}
                        {vIndex === 0 ? (
                          <td
                            className="border border-gray-300 px-2 py-1 align-top"
                            rowSpan={product.variations.length}
                          >
                            <input
                              placeholder="Style"
                              className="w-full border border-gray-300 text-gray-800 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
                              value={product.productDetails.style}
                              onChange={(e) => handleProductChange(pIndex, "style", e.target.value)}
                            />
                          </td>
                        ) : null}

                        {/* Color - only show in first row */}
                        {vIndex === 0 ? (
                          <td
                            className="border border-gray-300 px-2 py-1 align-top"
                            rowSpan={product.variations.length}
                          >
                            <input
                              placeholder="Color"
                              className="w-full border border-gray-300 text-gray-800 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
                              value={product.productDetails.color}
                              onChange={(e) => handleProductChange(pIndex, "color", e.target.value)}
                            />
                          </td>
                        ) : null}

                        {/* Fabric Type - only show in first row */}
                        {vIndex === 0 ? (
                          <td
                            className="border border-gray-300 px-2 py-1 align-top"
                            rowSpan={product.variations.length}
                          >
                            <input
                              placeholder="Fabric Type"
                              className="w-full border border-gray-300 text-gray-800 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
                              value={product.productDetails.fabricType}
                              onChange={(e) => handleProductChange(pIndex, "fabricType", e.target.value)}
                            />
                          </td>
                        ) : null}

                        {/* Size - show in every row */}
                        <td className="border border-gray-300 px-1 py-0.5">
                          <input
                            placeholder="Size"
                            className="w-full border border-gray-300 text-gray-800 rounded px-1.5 py-0.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase"
                            value={variation.size}
                            onChange={(e) => handleVariationChange(pIndex, vIndex, "size", e.target.value)}
                          />
                        </td>

                        {/* Qty - show in every row */}
                        <td className="border border-gray-300 px-1 py-0.5">
                          <input
                            type="number"
                            min="1"
                            placeholder="Qty"
                            className="w-full border border-gray-300 text-gray-800 rounded px-1.5 py-0.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={variation.qty}
                            onChange={(e) => handleVariationChange(pIndex, vIndex, "qty", e.target.value)}
                          />
                        </td>

                        {/* Actions - show in every row */}
                        <td className="border border-gray-300 px-1 py-0.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => addVariation(pIndex)}
                              className="bg-green-500 hover:bg-green-600 text-white rounded px-1.5 py-0.5 text-xs font-medium"
                              title="Add size"
                            >
                              +
                            </button>
                            <button
                              onClick={() => removeVariation(pIndex, vIndex)}
                              disabled={product.variations.length <= 1}
                              className="bg-red-400 hover:bg-red-500 text-white rounded px-1.5 py-0.5 text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Remove size"
                            >
                              −
                            </button>
                          </div>
                        </td>

                        {/* Total - only show in first row */}
                        {vIndex === 0 ? (
                          <td
                            className="border border-gray-300 px-3 py-1 text-center font-semibold text-gray-800 align-top"
                            rowSpan={product.variations.length}
                          >
                            {productTotal}
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

      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-600">
          {products.length} product{products.length !== 1 ? 's' : ''} • {totalQty} total items
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
            {loading ? "Saving..." : "Save Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

