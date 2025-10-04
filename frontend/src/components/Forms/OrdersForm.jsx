import { useState, useEffect } from "react";
import { axiosInstance } from "../../lib/axios";

export default function OrderForm({ onSubmit, onClose, initialValues = {} }) {
  const [formData, setFormData] = useState({
    PoNo: "",
    orderDate: new Date().toISOString().split('T')[0],
    orderType: "",
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
      productDetails: { name: "", hsn: "" },
      variations: [{ size: "", color: "", qty: "" }],
    },
  ]);

  const [nextPoNo, setNextPoNo] = useState("");

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
            hsn: p.productDetails?.hsn || "",
          },
          variations: p.variations || [{ size: "", color: "", qty: "" }]
        })));
      }
    }
  }, [initialValues]);

  useEffect(() => {
    if (!initialValues || Object.keys(initialValues).length === 0) {
      const fetchNextPoNo = async () => {
        try {
          const { data } = await axiosInstance.get("/orders/next-po-no");
          setNextPoNo(data.nextPoNo);
        } catch (error) {
          console.error("Error fetching next PO No:", error);
        }
      };

      fetchNextPoNo();
    }
  }, [initialValues]);

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
    updated[pIndex].productDetails.hsn = prod.hsn;
    setProducts(updated);
    setShowProductDropdown({});
    setProductSuggestions([]);
  };

  const handleSaveBuyer = async () => {
    try {
      setLoading(true);

      if (!formData.buyer.name.trim()) {
        alert("Buyer name is required");
        return;
      }
      if (!formData.buyer.mobile.trim()) {
        alert("Buyer mobile is required");
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
          productDetails: { name: "", hsn: "" },
          variations: [{ size: "", color: "", qty: "" }],
        },
      ]);

      alert("Buyer saved successfully!");
    } catch (error) {
      console.error("Error saving buyer:", error);
      alert("Failed to save buyer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const addProduct = () => {
    setProducts([
      ...products,
      { productDetails: { name: "", hsn: "" }, variations: [{ size: "", color: "", qty: "" }] },
    ]);
  };

  const removeProduct = (index) => {
    const updated = [...products];
    updated.splice(index, 1);
    setProducts(updated);
  };

  const addVariation = (pIndex) => {
    const updated = [...products];
    updated[pIndex].variations.push({ size: "", color: "", qty: "" });
    setProducts(updated);
  };

  const removeVariation = (pIndex, vIndex) => {
    const updated = [...products];
    updated[pIndex].variations.splice(vIndex, 1);
    setProducts(updated);
  };

  const handleProductChange = (pIndex, field, value) => {
    const updated = [...products];
    if (field === 'name') {
      updated[pIndex].productDetails.name = value;
      searchProducts(value, pIndex);
    } else if (field === 'hsn') {
      updated[pIndex].productDetails.hsn = value;
    } else if (field === 'fabricType') {
      updated[pIndex].productDetails.fabricType = value;
    }
    setProducts(updated);
  };

  const handleVariationChange = (pIndex, vIndex, field, value) => {
    const updated = [...products];
    updated[pIndex].variations[vIndex][field] = value;
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

      if (!formData.orderType) {
        alert("Order type is required");
        return;
      }
      if (!formData.buyer.name.trim()) {
        alert("Buyer name is required");
        return;
      }
      if (!formData.buyer.mobile.trim()) {
        alert("Buyer mobile is required");
        return;
      }

      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        if (!product.productDetails.name.trim()) {
          alert(`Product ${i + 1}: Name is required`);
          return;
        }
        if (!product.productDetails.hsn.trim()) {
          alert(`Product ${i + 1}: HSN is required`);
          return;
        }

        for (let j = 0; j < product.variations.length; j++) {
          const variation = product.variations[j];
          if (!variation.size.trim() || !variation.color.trim() || !variation.qty) {
            alert(`Product ${i + 1}, Variation ${j + 1}: All fields (size, color, qty) are required`);
            return;
          }
        }
      }

      const submitData = {
        //PoNo: formData.PoNo, 
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
        products: products.map(p => {
          // Group variations by fabricType (you have one fabricType per product)
          const fabricType = p.productDetails.fabricType || "Default";

          // Build sizes → colors structure
          const sizesMap = {};
          p.variations.forEach(v => {
            if (!sizesMap[v.size]) {
              sizesMap[v.size] = [];
            }
            sizesMap[v.size].push({
              color: v.color,
              qty: parseInt(v.qty) || 0
            });
          });

          const sizes = Object.entries(sizesMap).map(([size, colors]) => ({
            size,
            colors
          }));

          return {
            productDetails: p.productDetails,
            fabricTypes: [
              {
                fabricType,
                sizes
              }
            ]
          };
        })
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error("Error submitting order:", error);
      alert("Failed to save order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const createProductGrid = () => {
    const grid = [];
    for (let i = 0; i < products.length; i += 2) {
      grid.push(products.slice(i, i + 2));
    }
    return grid;
  };

  const productGrid = createProductGrid();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-3">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <div className="text-center mb-3">
            <h1 className="text-xl font-bold text-gray-800">Create Order</h1>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <div className="w-1 h-4 bg-blue-500 rounded mr-2"></div>
              Buyer Information
            </h3>

            {/* Use 5 columns now for better alignment */}
            <div className="grid grid-cols-5 gap-2 items-start">
              {/* Buyer Name */}
              <div className="relative col-span-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Buyer*
                </label>
                <input
                  placeholder="Enter buyer name"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                  value={formData.buyer.name}
                  onChange={(e) => handleFormChange('buyer.name', e.target.value)}
                  onBlur={() => setTimeout(() => setShowBuyerDropdown(false), 200)}
                />
                {showBuyerDropdown && buyerSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                    {buyerSuggestions.map((buyer, index) => (
                      <div
                        key={buyer._id || index}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-xs"
                        onClick={() => selectBuyer(buyer)}
                      >
                        <div className="font-medium">{buyer.name}</div>
                        <div className="text-gray-500">{buyer.mobile}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Buyer Code */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Buyer Code
                </label>
                <input
                  placeholder="Auto generated if empty"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                  value={formData.buyer.code}
                  onChange={(e) => handleFormChange('buyer.code', e.target.value)}
                />
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Mobile
                </label>
                <input
                  placeholder="Mobile number"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                  value={formData.buyer.mobile}
                  onChange={(e) => handleFormChange('buyer.mobile', e.target.value)}
                />
              </div>

              {/* GST */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  GST
                </label>
                <input
                  placeholder="GST number"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                  value={formData.buyer.gst}
                  onChange={(e) => handleFormChange('buyer.gst', e.target.value)}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Email
                </label>
                <input
                  placeholder="Email address"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                  value={formData.buyer.email}
                  onChange={(e) => handleFormChange('buyer.email', e.target.value)}
                />
              </div>

              {/* Address and Buttons */}
              <div className="col-span-6 grid grid-cols-1 gap-2 items-start">
                <div className="col-span-1 ">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Address
                  </label>
                  <div className="inline-flex items-center relative">
                    <textarea
                      placeholder="Address"
                      rows="2"
                      className="w-sm border inline-flex  border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                      value={formData.buyer.address}
                      onChange={(e) => handleFormChange('buyer.address', e.target.value)}
                    />

                    <div className="flex justify-end w-137 gap-2">
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="bg-gray-500 hover:bg-gray-600 text-white rounded px-4 py-1.5 text-xs font-medium disabled:opacity-50 h-7 justify-end"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveBuyer}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded h-7 px-4 py-1.5 text-xs font-medium disabled:opacity-50 justify-end  gap-1"
                      >
                        {loading ? "Saving..." : "Save Buyer"}
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <div className="w-1 h-4 bg-green-500 rounded mr-2"></div>
              Order Details
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {/* PO No - Read-only */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  PO No
                </label>
                {initialValues && initialValues._id ? (
                  <div className="w-full bg-gray-100 border border-gray-300 rounded px-2 py-1 text-xs font-medium">
                    {formData.PoNo || "—"}
                  </div>
                ) : (
                  <div className="w-full bg-gray-100 border border-gray-300 rounded px-2 py-1 text-xs font-medium">
                    {nextPoNo || "Loading..."}
                  </div>
                )}
              </div>

              {/* Order Type */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Type*
                </label>
                <select
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-400 focus:border-green-400 bg-white"
                  value={formData.orderType}
                  onChange={(e) => handleFormChange('orderType', e.target.value)}
                  required
                >
                  <option value="">Select type</option>
                  <option value="FOB">FOB</option>
                  <option value="JOB-Works">JOB-Works</option>
                </select>
              </div>

              {/* Order Date */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Date*
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-400 focus:border-green-400"
                  value={formData.orderDate}
                  onChange={(e) => handleFormChange('orderDate', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

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
                <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                  Total: {totalQty}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {productGrid.map((row, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-2 gap-3">
                  {row.map((product, colIndex) => {
                    const pIndex = rowIndex * 2 + colIndex;
                    return (
                      <div key={pIndex} className="border border-gray-300 rounded-lg bg-gray-50 p-3">
                        <div className="flex gap-2 mb-2">
                          <div className="flex-1 relative">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Product</label>
                            <input
                              placeholder="Product name"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                              value={product.productDetails.name}
                              onChange={(e) => handleProductChange(pIndex, "name", e.target.value)}
                              onBlur={() => setTimeout(() => setShowProductDropdown({}), 200)}
                            />
                            {showProductDropdown[pIndex] && productSuggestions.length > 0 && (
                              <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                                {productSuggestions.map((prod, index) => (
                                  <div
                                    key={prod._id || index}
                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-xs"
                                    onClick={() => selectProduct(prod, pIndex)}
                                  >
                                    <div className="font-medium">{prod.name}</div>
                                    <div className="text-gray-500">HSN: {prod.hsn}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="w-1/3">
                            <label className="block text-xs font-medium text-gray-600 mb-1">HSN</label>
                            <input
                              placeholder="HSN"
                              className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
                              value={product.productDetails.hsn}
                              onChange={(e) => handleProductChange(pIndex, "hsn", e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Fabric Type
                            </label>
                            <input
                              placeholder="Enter Fabric Type"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
                              value={product.productDetails.fabricType}
                              onChange={(e) => handleProductChange(pIndex, "fabricType", e.target.value)}
                            />
                          </div>
                          {products.length > 1 && (
                            <button
                              onClick={() => removeProduct(pIndex)}
                              className="self-end bg-red-500 hover:bg-red-600 text-white rounded px-2 py-1 text-xs"
                              title="Remove Product"
                            >
                              ×
                            </button>
                          )}
                        </div>

                        <div className="bg-white rounded border border-gray-100 p-2">
                          {/* Fixed table structure with proper column widths */}
                          <div className="overflow-x-auto rounded-md">
                            <table className="min-w-full border-1 bg-gray-50 border-gray-200 text-xs">
                              <thead>
                                <tr>
                                  <th className="border-0 px-2 py-1 font-semibold text-gray-600 text-center w-1/4">Size</th>
                                  <th className="border-0 px-2 py-1 font-semibold text-gray-600 text-center w-1/4">Color</th>
                                  <th className="border-0 px-2 py-1 font-semibold text-gray-600 text-center w-1/4">Qty</th>
                                  <th className="border-0 px-2 py-1 font-semibold text-gray-600 text-center w-1/4">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {product.variations.map((variation, vIndex) => (
                                  <tr key={vIndex} className="odd:bg-gray-50 even:bg-gray-50">
                                    <td className="border-0 px-2 py-1 w-1/4">
                                      <input
                                        placeholder="Size"
                                        className="w-full border bg-white border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        value={variation.size}
                                        onChange={(e) =>
                                          handleVariationChange(pIndex, vIndex, "size", e.target.value)
                                        }
                                      />
                                    </td>
                                    <td className="border-0 px-2 py-1 w-1/4">
                                      <input
                                        placeholder="Color"
                                        className="w-full border bg-white border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        value={variation.color}
                                        onChange={(e) =>
                                          handleVariationChange(pIndex, vIndex, "color", e.target.value)
                                        }
                                      />
                                    </td>
                                    <td className="border-0 px-2 py-1 w-1/4">
                                      <input
                                        type="number"
                                        min="1"
                                        placeholder="Qty"
                                        className="w-full border bg-white border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        value={variation.qty}
                                        onChange={(e) =>
                                          handleVariationChange(pIndex, vIndex, "qty", e.target.value)
                                        }
                                      />
                                    </td>
                                    <td className="border-0 px-2 py-1 text-center w-1/4">
                                      <div className="flex items-center justify-center gap-1">
                                        <button
                                          onClick={() => addVariation(pIndex)}
                                          className="bg-green-500 hover:bg-green-600 text-white rounded px-2 py-0.5 text-xs font-medium"
                                          title="Add variation"
                                        >
                                          +
                                        </button>
                                        {product.variations.length > 1 && (
                                          <button
                                            onClick={() => removeVariation(pIndex, vIndex)}
                                            className="bg-red-400 hover:bg-red-500 text-white rounded px-2 py-0.5 text-xs font-medium"
                                            title="Remove variation"
                                          >
                                            ×
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {row.length === 1 && (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <div className="text-2xl mb-1">+</div>
                        <div className="text-xs">Add another product</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
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
      </div>
    </div>
  );
}