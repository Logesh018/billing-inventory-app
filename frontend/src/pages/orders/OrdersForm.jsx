import React from "react";
import { useState, useEffect } from "react";
import { axiosInstance } from "../../lib/axios";
import AttributeDropdown from "../../components/AttributeDropdown";
import MultiSelectDropdown from "../../components/MultiSelectDropdown";
import { useFormNavigation } from "../../utils/FormExitModal";

export default function OrderForm({ onSubmit, onClose, initialValues = {}, defaultOrderType }) {
  const { setIsFormOpen, registerFormClose, unregisterFormClose, requestNavigation } = useFormNavigation();
  
  const [formData, setFormData] = useState({
    PoNo: "",
    orderDate: new Date().toISOString().split('T')[0],
    orderType: defaultOrderType || "",
    buyer: {
      _id: "",
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
      productDetails: {
        category: "",
        name: "",
        type: [],  // Array for multiple types
        style: [],
        fabric: "",
        color: ""
      },
      variations: [
        { size: "S", qty: "" },
        { size: "M", qty: "" },
        { size: "L", qty: "" },
        { size: "XL", qty: "" }
      ],
    },
  ]);

  // Dropdown states
  const [buyerSearchTerm, setBuyerSearchTerm] = useState("");
  const [buyerSuggestions, setBuyerSuggestions] = useState([]);
  const [showBuyerDropdown, setShowBuyerDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    // Mark as having unsaved changes when user starts editing
    setHasUnsavedChanges(true);
  }, [formData, products]);

  useEffect(() => {
    setIsFormOpen(true);
    
    // Register the close handler - just call onClose
    registerFormClose(() => {
      onClose(); // This will trigger the parent's close handler
    });

    // Cleanup on unmount
    return () => {
      setIsFormOpen(false);
      unregisterFormClose();
    };
  }, [setIsFormOpen, registerFormClose, unregisterFormClose, onClose]);

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

      if (initialValues.buyerDetails?.name) {
        setBuyerSearchTerm(initialValues.buyerDetails.name);
      }

      if (initialValues.products && initialValues.products.length > 0) {
        setProducts(initialValues.products.map(p => ({
          productDetails: {
            category: p.productDetails?.category || "",
            name: p.productDetails?.name || "",
            type: Array.isArray(p.productDetails?.type) ? p.productDetails.type : [],
            style: Array.isArray(p.productDetails?.style) ? p.productDetails.style : [],
            fabric: p.productDetails?.fabric || p.productDetails?.fabricType || "",
            color: p.productDetails?.color || "",
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

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    setBuyerSearchTerm(buyer.name);
    setShowBuyerDropdown(false);
    setBuyerSuggestions([]);
  };

  const addProduct = () => {
    setProducts([
      ...products,
      {
        productDetails: { category: "", name: "", type: [], style: [], fabric: "", color: "" },
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
    if (updated[pIndex].variations.length > 1) {
      updated[pIndex].variations.splice(vIndex, 1);
      setProducts(updated);
    }
  };

  const handleProductChange = (pIndex, field, value) => {
    const updated = [...products];
    updated[pIndex].productDetails[field] = value;
    setProducts(updated);
  };

  const handleVariationChange = (pIndex, vIndex, field, value) => {
    const updated = [...products];
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

      // Validation
      if (!formData.PoNo.trim()) {
        alert("PO No is required");
        return;
      }
      if (!formData.orderType) {
        alert("Order type is required");
        return;
      }
      if (!formData.buyer._id) {
        alert("Please select a buyer");
        return;
      }

      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        if (!product.productDetails.name.trim()) {
          alert(`Product ${i + 1}: Name is required`);
          return;
        }

        for (let j = 0; j < product.variations.length; j++) {
          const variation = product.variations[j];
          if (!variation.size.trim() || !variation.qty) {
            alert(`Product ${i + 1}, Size ${j + 1}: All fields are required`);
            return;
          }
        }
      }

      // ✅ CRITICAL FIX: Ensure productDetails is an OBJECT, not wrapped in array
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
          productDetails: {  // ← This should be an OBJECT, not an array
            category: p.productDetails.category || "",
            name: p.productDetails.name || "",
            type: Array.isArray(p.productDetails.type) ? p.productDetails.type : [],
            style: Array.isArray(p.productDetails.style) ? p.productDetails.style : [],
            fabric: p.productDetails.fabric || "",
            color: p.productDetails.color || "",
          },
          sizes: p.variations
            .filter(v => v.size.trim() && v.qty) // Only include valid sizes
            .map(v => ({
              size: v.size.trim(),
              qty: parseInt(v.qty) || 0,
            })),
        }))
      };

      // ✅ Add debugging
      console.log("📤 Submitting order data:", JSON.stringify(submitData, null, 2));
      console.log("📋 First product structure:", submitData.products[0]);

      await onSubmit(submitData);
      setHasUnsavedChanges(false); 
      setIsFormOpen(false);
      onClose();
    } catch (error) {
      console.error("Error submitting order:", error);
      alert("Failed to save order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // If there are unsaved changes, use the navigation context
    if (hasUnsavedChanges) {
      // Use requestNavigation to handle the form close
      requestNavigation('Orders List', () => {
        setHasUnsavedChanges(false);
        setIsFormOpen(false);
        onClose();
      });
    } else {
      // No unsaved changes, just close
      setHasUnsavedChanges(false);
      setIsFormOpen(false);
      onClose();
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

      {/* Buyer Search Section */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
          <div className="w-1 h-4 bg-blue-500 rounded mr-2"></div>
          Buyer Information
        </h3>

        <div className="flex gap-4 items-start">
          <div className="relative w-1/3 min-w-[200px] max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buyer/Buyer ID<span className="text-red-500">*</span>
            </label>
            <input
              placeholder="Enter buyer name or code"
              className="w-full border border-gray-400 text-gray-800 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={buyerSearchTerm}
              onChange={(e) => {
                setBuyerSearchTerm(e.target.value);
                searchBuyers(e.target.value);
              }}
              onBlur={() => setTimeout(() => setShowBuyerDropdown(false), 200)}
            />
            {showBuyerDropdown && buyerSuggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                {buyerSuggestions.map((buyer, index) => (
                  <div
                    key={buyer._id || index}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700"
                    onClick={() => selectBuyer(buyer)}
                  >
                    <div className="font-medium text-gray-700">{buyer.name}</div>
                    <div className="text-xs text-gray-500">{buyer.code ? `Code: ${buyer.code} • ` : ''}{buyer.mobile}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {formData.buyer._id && (
            <div className="flex-grow border border-gray-300 rounded-md overflow-hidden shadow-md">
              <div className="grid grid-cols-6 text-center text-xs font-semibold text-gray-700 bg-gray-100 border-b border-gray-300">
                <div className="py-1 px-1 truncate col-span-1 border-r border-gray-300">Buyer ID</div>
                <div className="py-1 px-1 truncate col-span-1 border-r border-gray-300">Name</div>
                <div className="py-1 px-1 truncate col-span-1 border-r border-gray-300">Billing Address</div>
                <div className="py-1 px-1 truncate col-span-1 border-r border-gray-300">GST</div>
                <div className="py-1 px-1 truncate col-span-1 border-r border-gray-300">Mobile</div>
                <div className="py-1 px-1 truncate col-span-1 border-r border-gray-300">Email</div>
              </div>
              <div className="grid grid-cols-6 text-xs text-gray-800 font-medium bg-gradient-to-r from-blue-50 to-blue-100">
                <div className="py-1 px-1 text-center text-[10px] col-span-1 border-r border-gray-300">{formData.buyer.code}</div>
                <div className="py-1 px-1 text-center text-[10px] col-span-1 border-r border-gray-300">{formData.buyer.name}</div>
                <div className="py-1 px-1 text-[9px] border-r border-gray-300 col-span-1">{formData.buyer.address}</div>
                <div className="py-1 px-1 text-center text-[9px] col-span-1 border-r border-gray-300">{formData.buyer.gst}</div>
                <div className="py-1 px-1 text-center text-[10px] col-span-1 border-r border-gray-300">{formData.buyer.mobile}</div>
                <div className="py-1 px-1 text-center text-[9px] col-span-1 border-r border-gray-300">{formData.buyer.email}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <hr className="my-4 border-gray-200" />

      {/* Order Details Section - ALL IN ONE ROW */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
          <div className="w-1 h-4 bg-green-500 rounded mr-2"></div>
          Order Details
        </h3>

        <div className="grid grid-cols-4 gap-3">
          {/* Order ID - Auto generated (read-only display) */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Order ID (Auto)
            </label>
            <input
              placeholder="Auto-generated"
              className="w-full border border-gray-300 text-gray-500 rounded px-2 py-1 text-xs bg-gray-50 cursor-not-allowed"
              value="OID-XXXX"
              disabled
              readOnly
            />
          </div>

          {/* Buyer PO No */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Buyer PO No*
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
              Order Type*
            </label>
            <select
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-green-400 focus:border-green-400 bg-white"
              value={formData.orderType}
              onChange={(e) => handleFormChange('orderType', e.target.value)}
              required
            >
              <option value="">Select Type</option>
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
                <th className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-700 text-center w-12">
                  S.No
                </th>
                <th className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-700 text-center w-1/7">
                  Product Category
                </th>
                <th className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-700 text-center w-1/7">
                  Product
                </th>
                <th className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-700 text-center w-1/7">
                  Product Type
                </th>
                <th className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-700 text-center w-1/7">
                  Product Style
                </th>
                <th className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-700 text-center w-1/7">
                  Fabric
                </th>
                <th className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-700 text-center w-1/7">
                  Color
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
                    {pIndex > 0 && (
                      <tr className="bg-white-100">
                        <td colSpan="11" className="p-1">
                          <div className="h-3"></div>
                        </td>
                      </tr>
                    )}
                    {product.variations.map((variation, vIndex) => (
                      <tr
                        key={`${pIndex}-${vIndex}`}
                        className={`hover:bg-gray-50 ${pIndex % 2 === 1 ? 'bg-white-50' : ''}`}
                      >
                        {/* Serial Number */}
                        {vIndex === 0 ? (
                          <td
                            className="border border-gray-300 px-2 py-1 text-center font-semibold text-gray-700 align-top"
                            rowSpan={product.variations.length}
                          >
                            {pIndex + 1}
                          </td>
                        ) : null}

                        {/* Product Category - Using AttributeDropdown */}
                        {vIndex === 0 ? (
                          <td
                            className="border border-gray-300 px-2 py-1 align-top"
                            rowSpan={product.variations.length}
                          >
                            <AttributeDropdown
                              attributeType="category"
                              value={product.productDetails.category}
                              onChange={(value) => handleProductChange(pIndex, "category", value)}
                              placeholder="Category"
                            />
                          </td>
                        ) : null}

                        {/* Product Name - Keep existing search */}
                        {vIndex === 0 ? (
                          <td
                            className="border border-gray-300 px-2 py-1 align-top relative"
                            rowSpan={product.variations.length}
                          >
                            <AttributeDropdown
                              attributeType="list"
                              value={product.productDetails.name}
                              onChange={(value) => handleProductChange(pIndex, "name", value)}
                              placeholder="Product name"
                              required
                            />
                          </td>
                        ) : null}

                        {/* Product Type - Using MultiSelectDropdown */}
                        {vIndex === 0 ? (
                          <td
                            className="border border-gray-300 px-2 py-1 align-top"
                            rowSpan={product.variations.length}
                          >
                            <MultiSelectDropdown
                              attributeType="type"
                              values={product.productDetails.type}
                              onChange={(values) => handleProductChange(pIndex, "type", values)}
                              placeholder="Select types"
                            />
                          </td>
                        ) : null}

                        {/* Product Style - Using AttributeDropdown */}
                        {vIndex === 0 ? (
                          <td
                            className="border border-gray-300 px-2 py-1 align-top"
                            rowSpan={product.variations.length}
                          >
                            <MultiSelectDropdown
                              attributeType="style"
                              values={product.productDetails.style}
                              onChange={(values) => handleProductChange(pIndex, "style", values)}
                              placeholder="Select styles"
                            />
                          </td>
                        ) : null}

                        {/* Fabric - Using AttributeDropdown */}
                        {vIndex === 0 ? (
                          <td
                            className="border border-gray-300 px-2 py-1 align-top"
                            rowSpan={product.variations.length}
                          >
                            <AttributeDropdown
                              attributeType="fabric"
                              value={product.productDetails.fabric}
                              onChange={(value) => handleProductChange(pIndex, "fabric", value)}
                              placeholder="Fabric"
                              required
                            />
                          </td>
                        ) : null}

                        {/* Color - Keep as regular input */}
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

                        {/* Size */}
                        <td className="border border-gray-300 px-1 py-0.5">
                          <input
                            placeholder="Size"
                            className="w-full border border-gray-300 text-gray-800 rounded px-1.5 py-0.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase"
                            value={variation.size}
                            onChange={(e) => handleVariationChange(pIndex, vIndex, "size", e.target.value)}
                          />
                        </td>

                        {/* Qty */}
                        <td className="border border-gray-300 px-1 py-0.5">
                          <input
                            type="number"
                            min="1"
                            placeholder="Qty"
                            className="w-15 border border-gray-300 text-gray-800 rounded px-1.5 py-0.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500 "
                            value={variation.qty}
                            onChange={(e) => handleVariationChange(pIndex, vIndex, "qty", e.target.value)}
                            onWheel={(e) => e.currentTarget.blur()}
                          />
                        </td>

                        {/* Actions */}
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

                        {/* Total */}
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
            onClick={handleCancel}
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