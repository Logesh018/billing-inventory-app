import { useBuyerSearch, useSupplierSearch, useProductSearch,usePOSupplierSearch } from "../../hooks/useSearch"

// components/Forms/BuyerSearchInput.jsx
import { SearchableInput } from '../UI/FormComponents';
export function BuyerSearchInput({
  value,
  onChange,
  onSelect,
  label = "Buyer",
  placeholder = "Enter buyer name",
  required = false,
  className = ""
}) {
  const {
    buyerSuggestions,
    showBuyerDropdown,
    searchBuyers,
    selectBuyer,
    setShowBuyerDropdown
  } = useBuyerSearch();

  const handleSelect = (buyer) => {
    // Add safety check
    if (buyer && onSelect) {
      selectBuyer(buyer, onSelect);
    }
  };

  return (
    <SearchableInput
      label={label}
      value={value}
      onChange={onChange}
      onSearch={searchBuyers}
      onSelect={handleSelect}
      suggestions={buyerSuggestions}
      showDropdown={showBuyerDropdown}
      onDropdownToggle={setShowBuyerDropdown}
      placeholder={placeholder}
      required={required}
      className={className}
      renderSuggestion={(buyer) => (
        <div>
          <div className="font-medium">{buyer.name}</div>
          <div className="text-gray-500">{buyer.mobile}</div>
        </div>
      )}
    />
  );
}

// components/Forms/SupplierSearchInput.jsx
// import { SearchableInput } from '../UI/FormComponents';
// import { useSupplierSearch } from '../../hooks/useSearch';

export function SupplierSearchInput({
  value,
  onChange,
  onSelect,
  label = "Supplier",
  placeholder = "Enter supplier name",
  required = false,
  className = ""
}) {
  const {
    supplierSuggestions,
    showSupplierDropdown,
    searchSuppliers,
    selectSupplier,
    setShowSupplierDropdown
  } = useSupplierSearch();

  const handleSelect = (supplier) => {
    // Add safety check
    if (supplier && onSelect) {
      selectSupplier(supplier, onSelect);
    }
  };

  return (
    <SearchableInput
      label={label}
      value={value}
      onChange={onChange}
      onSearch={searchSuppliers}
      onSelect={handleSelect}
      suggestions={supplierSuggestions}
      showDropdown={showSupplierDropdown}
      onDropdownToggle={setShowSupplierDropdown}
      placeholder={placeholder}
      required={required}
      className={className}
      renderSuggestion={(supplier) => (
        <div>
          <div className="font-medium">{supplier.name}</div>
          <div className="text-gray-500">
            {supplier.mobile || supplier.code || supplier.email}
          </div>
        </div>
      )}
    />
  );
}

// components/Forms/ProductSearchInput.jsx

export function ProductSearchInput({
  value,
  onChange,
  onSelect,
  label = "Product",
  placeholder = "Enter product name",
  required = false,
  className = ""
}) {
  const {
    productSuggestions,
    showProductDropdown,
    searchProducts,
    selectProduct,
    setShowProductDropdown
  } = useProductSearch();

  const handleSelect = (product) => {
    // Add safety check
    if (product && onSelect) {
      selectProduct(product, onSelect);
    }
  };

  return (
    <SearchableInput
      label={label}
      value={value}
      onChange={onChange}
      onSearch={searchProducts}
      onSelect={handleSelect}
      suggestions={productSuggestions}
      showDropdown={showProductDropdown}
      onDropdownToggle={setShowProductDropdown}
      placeholder={placeholder}
      required={required}
      className={className}
      renderSuggestion={(product) => (
        <div>
          <div className="font-medium">{product.name}</div>
          <div className="text-gray-500">HSN: {product.hsn}</div>
        </div>
      )}
    />
  );
}

// components/Forms/POSupplierSearchInput.jsx
export function POSupplierSearchInput({
  value,
  onChange,
  onSelect,
  label = "Supplier",
  placeholder = "Enter supplier name",
  required = false,
  className = ""
}) {
  const {
    poSupplierSuggestions,
    showPOSupplierDropdown,
    searchPOSuppliers,
    selectPOSupplier,
    setShowPOSupplierDropdown
  } = usePOSupplierSearch();

  const handleSelect = (supplier) => {
    if (supplier && onSelect) {
      selectPOSupplier(supplier, onSelect);
    }
  };

  return (
    <SearchableInput
      label={label}
      value={value}
      onChange={onChange}
      onSearch={searchPOSuppliers}
      onSelect={handleSelect}
      suggestions={poSupplierSuggestions}
      showDropdown={showPOSupplierDropdown}
      onDropdownToggle={setShowPOSupplierDropdown}
      placeholder={placeholder}
      required={required}
      className={className}
      renderSuggestion={(supplier) => (
        <div>
          <div className="font-medium">{supplier.name}</div>
          <div className="text-gray-500 text-sm">
            {supplier.code && <span>{supplier.code}</span>}
            {supplier.gst && <span> • GST: {supplier.gst}</span>}
            {supplier.address && <div>{supplier.address}</div>}
          </div>
        </div>
      )}
    />
  );
}

