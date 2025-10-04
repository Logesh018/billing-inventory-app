// components/UI/FormContainer.jsx
// Main container wrapper for all forms
export function FormContainer({ title, children, onClose, onSubmit, loading, submitText = "Save", totalInfo }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-3">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <div className="text-center mb-3">
            <h1 className="text-xl font-bold text-gray-800">{title}</h1>
          </div>

          {children}

          <div className="flex justify-between items-center pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-600">
              {totalInfo}
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
                onClick={onSubmit}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-1.5 text-xs font-medium disabled:opacity-50 flex items-center gap-1"
              >
                {loading ? "Saving..." : submitText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// components/UI/FormSection.jsx
// Reusable section wrapper
export function FormSection({ title, color = "blue", children, className = "" }) {
  const colorMap = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    red: "bg-red-500",
    yellow: "bg-yellow-500"
  };

  return (
    <div className={`mb-4 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
        <div className={`w-1 h-4 ${colorMap[color]} rounded mr-2`}></div>
        {title}
      </h3>
      {children}
    </div>
  );
}

// components/UI/FormGrid.jsx
// Grid wrapper for form inputs
export function FormGrid({ columns = 4, gap = 2, children }) {
  return (
    <div className={`grid grid-cols-${columns} gap-${gap}`}>
      {children}
    </div>
  );
}

// components/UI/FormInput.jsx
// Reusable input component (NO ASTERISKS)
export function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  className = "",
  inputClassName = "",
  ...props
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border border-gray-300 rounded px-2 py-1 text-xs 
          focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 ${inputClassName}`}
        {...props}
      />
    </div>
  );
}

// components/UI/FormTextarea.jsx
// Reusable textarea component (NO ASTERISKS)
export function FormTextarea({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  rows = 1,
  className = "",
  ...props
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
      </label>
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full border border-gray-300 rounded px-2 py-1 text-xs 
          focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 
          resize-y min-h-[24px]"
        {...props}
      />
    </div>
  );
}

// components/UI/FormSelect.jsx
// Reusable select component (NO ASTERISKS)
export function FormSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Select option",
  required = false,
  className = "",
  ...props
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded px-2 py-1 text-xs 
          focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white"
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option, index) => (
          <option key={index} value={option.value || option}>
            {option.label || option}
          </option>
        ))}
      </select>
    </div>
  );
}

// components/UI/SearchableInput.jsx
// Reusable searchable input with dropdown (NO ASTERISKS)
// components/UI/SearchableInput.jsx
// Reusable searchable input with dropdown (NO ASTERISKS)
export function SearchableInput({
  label,
  value,
  onChange,
  onSearch,
  placeholder,
  suggestions = [],
  onSelect,
  showDropdown,
  onDropdownToggle,
  renderSuggestion,
  className = "",
  required = false,
}) {
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    if (onSearch) {
      onSearch(newValue);
    }
  };

  const handleBlur = () => {
    // Delay hiding dropdown to allow click on suggestions
    setTimeout(() => {
      if (onDropdownToggle) {
        onDropdownToggle(false);
      }
    }, 200);
  };

  const handleSelect = (item) => {
    if (item && onSelect) {
      onSelect(item);
    }
    if (onDropdownToggle) {
      onDropdownToggle(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded px-2 py-1 text-xs 
          focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
        value={value}
        onChange={handleInputChange}
        onBlur={handleBlur}
      />
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
          {suggestions.map((item, index) => (
            <div
              key={item._id || index}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-xs border-b border-gray-100 last:border-b-0"
              onClick={() => handleSelect(item)}
            >
              {renderSuggestion ? renderSuggestion(item) : (
                <div>
                  <div className="font-medium text-gray-900">{item.name}</div>
                  <div className="text-gray-500">
                    {item.mobile || item.hsn || item.email}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// components/UI/ProductCard.jsx
// Product card component matching the exact screenshot design
export function ProductCard({
  product,
  productIndex,
  onProductChange,
  onVariationChange,
  onAddVariation,
  onRemoveVariation,
  onRemoveProduct,
  productSuggestions = [],
  showProductDropdown = {},
}) {
  return (
    <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-xs font-semibold text-gray-700">Product {productIndex + 1}</h4>
        <button
          type="button"
          onClick={() => onRemoveProduct(productIndex)}
          className="text-red-500 hover:text-red-700 text-xs"
        >
          Remove
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <SearchableInput
          label="Product Name"
          value={product.productDetails.name}
          onChange={(value) => onProductChange(productIndex, 'name', value)}
          placeholder="Product name"
          suggestions={productSuggestions}
          onSelect={(selectedProduct) => {
            if (selectedProduct) {
              onProductChange(productIndex, 'name', selectedProduct.name);
              onProductChange(productIndex, 'hsn', selectedProduct.hsn);
            }
          }}
          showDropdown={showProductDropdown[productIndex]}
        />

        <FormInput
          label="HSN"
          value={product.productDetails.hsn}
          onChange={(value) => onProductChange(productIndex, 'hsn', value)}
          placeholder="HSN code"
        />

        <FormInput
          label="Fabric Type"
          value={product.productDetails.fabricType || ""}
          onChange={(value) => onProductChange(productIndex, 'fabricType', value)}
          placeholder="Enter fabric type"
        />
      </div>

      {/* Variations Table - Headers only once */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="text-xs font-medium text-gray-700">Variations</div>
          <button
            type="button"
            onClick={() => onAddVariation(productIndex)}
            className="bg-green-500 hover:bg-green-600 text-white rounded px-2 py-1 text-xs"
          >
            + Add
          </button>
        </div>

        {/* Table Headers */}
        <div className="grid grid-cols-10 gap-1 text-xs font-medium text-gray-700 border-b border-gray-300 pb-1">
          <div className="col-span-3">Size</div>
          <div className="col-span-3">Color</div>
          <div className="col-span-3">Qty</div>
          <div className="col-span-1"></div>
        </div>

        {/* Table Rows */}
        {product.variations.map((variation, vIndex) => (
          <div key={vIndex} className="grid grid-cols-10 gap-1 items-center">
            <div className="col-span-3">
              <input
                type="text"
                value={variation.size}
                onChange={(e) => onVariationChange(productIndex, vIndex, 'size', e.target.value)}
                placeholder="Size"
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
              />
            </div>

            <div className="col-span-3">
              <input
                type="text"
                value={variation.color}
                onChange={(e) => onVariationChange(productIndex, vIndex, 'color', e.target.value)}
                placeholder="Color"
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
              />
            </div>

            <div className="col-span-3">
              <input
                type="number"
                value={variation.qty}
                onChange={(e) => onVariationChange(productIndex, vIndex, 'qty', e.target.value)}
                placeholder="Qty"
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
              />
            </div>

            <div className="col-span-1 flex justify-center">
              <button
                type="button"
                onClick={() => onRemoveVariation(productIndex, vIndex)}
                className="bg-red-500 hover:bg-red-600 text-white rounded text-xs w-4 h-4 flex items-center justify-center"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// components/UI/ProductGrid.jsx
// Enhanced product grid layout
// components/UI/ProductGrid.jsx
// Enhanced product grid layout with header
// components/UI/ProductGrid.jsx
// Enhanced product grid layout with header
export function ProductGrid({
  products,
  columns = 2,
  gap = 3,
  onAddProduct,
  onProductChange,
  onVariationChange,
  onAddVariation,
  onRemoveVariation,
  onRemoveProduct,
  productSuggestions,
  showProductDropdown,
  className = ""
}) {
  const createGrid = () => {
    const grid = [];
    for (let i = 0; i < products.length; i += columns) {
      grid.push(products.slice(i, i + columns));
    }
    return grid;
  };

  const productGrid = createGrid();

  // Calculate total quantity
  const totalQty = products.reduce(
    (sum, p) =>
      sum +
      p.variations.reduce(
        (subSum, v) => subSum + (parseInt(v.qty || 0, 10) || 0),
        0
      ),
    0
  );

  return (
    <div className={className}>
      {/* Header with Add Product button and Total */}
      <div className="flex justify-between items-center mb-3">
        <button
          type="button"
          onClick={onAddProduct}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-1.5 text-xs font-medium flex items-center gap-1"
        >
          + Add Product
        </button>
        <div className="text-xs text-gray-600 font-medium">
          Total: {totalQty}
        </div>
      </div>

      {/* Products Grid */}
      <div className={`space-y-${gap}`}>
        {productGrid.map((row, rowIndex) => (
          <div key={rowIndex} className={`grid grid-cols-${columns} gap-${gap}`}>
            {row.map((product, colIndex) => {
              const productIndex = rowIndex * columns + colIndex;
              return (
                <ProductCard
                  key={productIndex}
                  product={product}
                  productIndex={productIndex}
                  onProductChange={onProductChange}
                  onVariationChange={onVariationChange}
                  onAddVariation={onAddVariation}
                  onRemoveVariation={onRemoveVariation}
                  onRemoveProduct={onRemoveProduct}
                  productSuggestions={productSuggestions}
                  showProductDropdown={showProductDropdown}
                />
              );
            })}

            {/* Add product button for incomplete rows */}
            {row.length < columns && (
              <button
                type="button"
                onClick={onAddProduct}
                className="border-2 border-dashed border-gray-300 rounded-lg p-3 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors"
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">+</div>
                  <div className="text-xs">Add Product</div>
                </div>
              </button>
            )}
          </div>
        ))}

        {/* Add product button when no products or all rows are complete */}
        {(products.length === 0 || products.length % columns === 0) && (
          <div className={`grid grid-cols-${columns} gap-${gap}`}>
            <button
              type="button"
              onClick={onAddProduct}
              className="border-2 border-dashed border-gray-300 rounded-lg p-3 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors"
            >
              <div className="text-center">
                <div className="text-2xl mb-1">+</div>
                <div className="text-xs">Add Product</div>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}