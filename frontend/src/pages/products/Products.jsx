import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import { axiosInstance } from "../../lib/axios";

// Product API with axiosInstance
const productApi = {
  getAll: async () => {
    const { data } = await axiosInstance.get("/products");
    return data;
  },
  create: async (productData) => {
    const { data } = await axiosInstance.post("/products", productData);
    return data;
  },
  update: async (id, productData) => {
    const { data } = await axiosInstance.put(`/products/${id}`, productData);
    return data;
  },
  delete: async (id) => {
    const { data } = await axiosInstance.delete(`/products/${id}`);
    return data;
  }
};

function ProductForm({ onSubmit, onClose, initialValues = {} }) {
  const [formData, setFormData] = useState({
    name: "",
    hsn: "",
    category: "",
    subcategory: "",
    description: "",
    gender: "",
    fabricType: "",
    gsm: "",
    availableSizes: [],
    availableColors: [],
    fabricConfigurations: [],
    isActive: true
  });

  const [currentFabricConfig, setCurrentFabricConfig] = useState({
    fabricType: "",
    availableSizes: [],
    availableColors: [],
    gsm: ""
  });

  //const [sizeInput, setSizeInput] = useState("");
  const [colorInput, setColorInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL", "Free Size", "Custom"];

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setFormData({
        name: initialValues.name || "",
        hsn: initialValues.hsn || "",
        category: initialValues.category || "",
        subcategory: initialValues.subcategory || "",
        description: initialValues.description || "",
        gender: initialValues.gender || "",
        fabricType: initialValues.fabricType || "",
        gsm: initialValues.gsm || "",
        availableSizes: initialValues.availableSizes || [],
        availableColors: initialValues.availableColors || [],
        fabricConfigurations: initialValues.fabricConfigurations || [],
        isActive: initialValues.isActive !== undefined ? initialValues.isActive : true
      });
    }
  }, [initialValues]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSize = (size) => {
    if (size && !formData.availableSizes.includes(size)) {
      setFormData(prev => ({
        ...prev,
        availableSizes: [...prev.availableSizes, size]
      }));
    }
  };

  const removeSize = (size) => {
    setFormData(prev => ({
      ...prev,
      availableSizes: prev.availableSizes.filter(s => s !== size)
    }));
  };

  const addColor = () => {
    if (colorInput.trim() && !formData.availableColors.includes(colorInput.trim())) {
      setFormData(prev => ({
        ...prev,
        availableColors: [...prev.availableColors, colorInput.trim()]
      }));
      setColorInput("");
    }
  };

  const removeColor = (color) => {
    setFormData(prev => ({
      ...prev,
      availableColors: prev.availableColors.filter(c => c !== color)
    }));
  };

  const addFabricConfiguration = () => {
    if (!currentFabricConfig.fabricType.trim()) {
      alert("Fabric type is required");
      return;
    }

    setFormData(prev => ({
      ...prev,
      fabricConfigurations: [...prev.fabricConfigurations, { ...currentFabricConfig }]
    }));

    setCurrentFabricConfig({
      fabricType: "",
      availableSizes: [],
      availableColors: [],
      gsm: ""
    });
  };

  const removeFabricConfiguration = (index) => {
    setFormData(prev => ({
      ...prev,
      fabricConfigurations: prev.fabricConfigurations.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert("Product name is required");
      return;
    }
    if (!formData.hsn.trim()) {
      alert("HSN code is required");
      return;
    }
    if (!formData.category.trim()) {
      alert("Category is required");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Error submitting product:", error);
      alert("Failed to save product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-3">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <div className="text-center mb-3">
            <h1 className="text-xl font-bold text-gray-800">
              {initialValues._id ? "Edit Product" : "Create Product"}
            </h1>
          </div>

          {/* Basic Information */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <div className="w-1 h-4 bg-blue-500 rounded mr-2"></div>
              Basic Information
            </h3>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Product Name*
                </label>
                <input
                  placeholder="Enter product name"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  HSN Code*
                </label>
                <input
                  placeholder="HSN code"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                  value={formData.hsn}
                  onChange={(e) => handleChange('hsn', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Category*
                </label>
                <input
                  placeholder="e.g., T-Shirt, Polo"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Subcategory
                </label>
                <input
                  placeholder="Optional"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                  value={formData.subcategory}
                  onChange={(e) => handleChange('subcategory', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <div className="w-1 h-4 bg-green-500 rounded mr-2"></div>
              Product Details
            </h3>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-400 bg-white"
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Unisex">Unisex</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Fabric Type
                </label>
                <input
                  placeholder="e.g., Cotton, Polyester"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-400"
                  value={formData.fabricType}
                  onChange={(e) => handleChange('fabricType', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  GSM
                </label>
                <input
                  placeholder="e.g., 180, 200"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-400"
                  value={formData.gsm}
                  onChange={(e) => handleChange('gsm', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                placeholder="Product description"
                rows="2"
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-400"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </div>
          </div>

          {/* Default Sizes & Colors */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <div className="w-1 h-4 bg-purple-500 rounded mr-2"></div>
              Default Sizes & Colors
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Available Sizes
                </label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {sizeOptions.map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => addSize(size)}
                      className={`px-2 py-1 text-xs rounded ${formData.availableSizes.includes(size)
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {formData.availableSizes.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formData.availableSizes.map(size => (
                      <span
                        key={size}
                        className="inline-flex items-center bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs"
                      >
                        {size}
                        <button
                          type="button"
                          onClick={() => removeSize(size)}
                          className="ml-1 text-purple-600 hover:text-purple-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Available Colors
                </label>
                <div className="flex gap-1 mb-2">
                  <input
                    placeholder="Enter color name"
                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
                  />
                  <button
                    type="button"
                    onClick={addColor}
                    className="bg-purple-500 hover:bg-purple-600 text-white rounded px-3 py-1 text-xs"
                  >
                    Add
                  </button>
                </div>
                {formData.availableColors.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formData.availableColors.map(color => (
                      <span
                        key={color}
                        className="inline-flex items-center bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs"
                      >
                        {color}
                        <button
                          type="button"
                          onClick={() => removeColor(color)}
                          className="ml-1 text-purple-600 hover:text-purple-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Fabric Configurations */}
          {/* <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <div className="w-1 h-4 bg-orange-500 rounded mr-2"></div>
              Fabric Configurations (Optional)
            </h3>
            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 mb-2">
              <div className="grid grid-cols-4 gap-2 mb-2">
                <input
                  placeholder="Fabric Type"
                  className="border border-gray-300 rounded px-2 py-1 text-xs"
                  value={currentFabricConfig.fabricType}
                  onChange={(e) => setCurrentFabricConfig(prev => ({ ...prev, fabricType: e.target.value }))}
                />
                <input
                  placeholder="GSM"
                  className="border border-gray-300 rounded px-2 py-1 text-xs"
                  value={currentFabricConfig.gsm}
                  onChange={(e) => setCurrentFabricConfig(prev => ({ ...prev, gsm: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={addFabricConfiguration}
                  className="bg-orange-500 hover:bg-orange-600 text-white rounded px-3 py-1 text-xs col-span-2"
                >
                  Add Configuration
                </button>
              </div>
            </div>

            {formData.fabricConfigurations.length > 0 && (
              <div className="space-y-2">
                {formData.fabricConfigurations.map((config, index) => (
                  <div key={index} className="border border-gray-300 rounded-lg p-2 bg-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-sm text-gray-800">{config.fabricType}</div>
                        {config.gsm && <div className="text-xs text-gray-600">GSM: {config.gsm}</div>}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFabricConfiguration(index)}
                        className="bg-red-500 hover:bg-red-600 text-white rounded px-2 py-1 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div> */}

          {/* Status */}
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleChange('isActive', e.target.checked)}
                className="rounded"
              />
              <span className="font-medium">Active Product</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
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
              className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-1.5 text-xs font-medium disabled:opacity-50"
            >
              {loading ? "Saving..." : initialValues._id ? "Update Product" : "Create Product"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DataTable({ columns, data, actions }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                style={{ width: col.width }}
              >
                {col.label}
              </th>
            ))}
            {actions && actions.length > 0 && (
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              {columns.map((col) => (
                <td key={col.key} className="px-3 py-2 whitespace-nowrap">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
              {actions && actions.length > 0 && (
                <td className="px-3 py-2 whitespace-nowrap text-center">
                  <div className="flex gap-1 justify-center">
                    {actions.map((action, idx) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => action.onClick(row)}
                          className={`p-1.5 rounded text-xs ${action.className}`}
                          title={action.label}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </button>
                      );
                    })}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productApi.getAll();
      setProducts(Array.isArray(data) ? data : []);
      setError(null);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to fetch products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await productApi.delete(id);
        await fetchProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
        alert(`Failed to delete product: ${error.message}`);
      }
    }
  };

  const handleFormSubmit = async (data) => {
    try {
      if (editProduct) {
        await productApi.update(editProduct._id, data);
      } else {
        await productApi.create(data);
      }
      setShowForm(false);
      setEditProduct(null);
      await fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      throw error;
    }
  };

  const truncate = (str, max = 15) => {
    if (!str) return "—";
    return str.length > max ? str.substring(0, max) + "…" : str;
  };

  const filteredProducts = filter === "all"
    ? products
    : filter === "active"
      ? products.filter(p => p.isActive)
      : products.filter(p => !p.isActive);

  const columns = [
    {
      key: "name",
      label: "Product Name",
      width: "200px",
      render: (p) => (
        <div>
          <div className="font-medium text-sm text-gray-800" title={p.name}>
            {truncate(p.name, 25)}
          </div>
          {p.category && (
            <div className="text-xs text-gray-500">{p.category}</div>
          )}
        </div>
      )
    },
    {
      key: "hsn",
      label: "HSN",
      width: "100px",
      render: (p) => (
        <div className="font-mono text-xs text-gray-700">{p.hsn || "—"}</div>
      )
    },
    {
      key: "sizes",
      label: "Sizes",
      width: "150px",
      render: (p) => (
        <div className="flex flex-wrap gap-1">
          {p.availableSizes && p.availableSizes.length > 0 ? (
            p.availableSizes.map((size, idx) => (
              <span key={idx} className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs">
                {size}
              </span>
            ))
          ) : (
            <span className="text-gray-400 text-xs">—</span>
          )}
        </div>
      )
    },
    {
      key: "colors",
      label: "Colors",
      width: "180px",
      render: (p) => (
        <div className="text-xs">
          {p.availableColors && p.availableColors.length > 0 ? (
            <div title={p.availableColors.join(", ")}>
              {p.availableColors.slice(0, 3).join(", ")}
              {p.availableColors.length > 3 && (
                <span className="text-blue-600 font-medium"> +{p.availableColors.length - 3}</span>
              )}
            </div>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </div>
      )
    },
    {
      key: "fabricType",
      label: "Fabric",
      width: "120px",
      render: (p) => (
        <div className="text-xs text-gray-700">
          {p.fabricType || "—"}
          {p.gsm && <div className="text-gray-500">GSM: {p.gsm}</div>}
        </div>
      )
    },
    {
      key: "orders",
      label: "Orders",
      width: "100px",
      render: (p) => (
        <div className="text-sm">
          <div className="font-semibold text-gray-800">{p.totalOrders || 0}</div>
          {p.totalQuantityOrdered > 0 && (
            <div className="text-xs text-gray-500">{p.totalQuantityOrdered} pcs</div>
          )}
        </div>
      )
    },
    {
      key: "status",
      label: "Status",
      width: "80px",
      render: (p) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${p.isActive
          ? "bg-green-100 text-green-700"
          : "bg-gray-100 text-gray-700"
          }`}>
          {p.isActive ? "Active" : "Inactive"}
        </span>
      )
    }
  ];

  const actions = [
    {
      label: "Edit",
      icon: Edit,
      className: "bg-blue-500 text-white hover:bg-blue-600",
      onClick: (product) => {
        setEditProduct(product);
        setShowForm(true);
      },
    },
    {
      label: "Delete",
      icon: Trash2,
      className: "bg-red-500 text-white hover:bg-red-600",
      onClick: (product) => handleDelete(product._id),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showForm ? (
        <ProductForm
          onSubmit={handleFormSubmit}
          initialValues={editProduct || {}}
          onClose={() => {
            setShowForm(false);
            setEditProduct(null);
          }}
        />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Products Management</h1>
              <p className="text-gray-600 text-sm mt-1">Manage your product catalog</p>
            </div>
            <button
              onClick={() => {
                setShowForm(true);
                setEditProduct(null);
              }}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-sm text-sm"
            >
              <Plus className="w-4 h-4 mr-1" /> Create Product
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="border-b border-gray-200">
            <div className="flex space-x-4">
              {[
                { key: "all", label: "All Products", count: products.length },
                { key: "active", label: "Active", count: products.filter(p => p.isActive).length },
                { key: "inactive", label: "Inactive", count: products.filter(p => !p.isActive).length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`py-2 px-3 text-sm font-medium rounded-t-lg transition-colors ${filter === tab.key
                    ? "bg-white text-green-600 border-t-2 border-green-500"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  {tab.label}
                  <span className="ml-1 bg-gray-100 text-gray-800 py-0.5 px-1.5 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="w-full">
              <DataTable
                columns={columns}
                data={filteredProducts}
                actions={actions}
              />
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <div className="text-gray-500 text-lg mb-2">No products found</div>
              <div className="text-gray-400 text-sm mb-4">
                {filter === "all"
                  ? "Create your first product to get started"
                  : `No ${filter} products found`
                }
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Product
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}


