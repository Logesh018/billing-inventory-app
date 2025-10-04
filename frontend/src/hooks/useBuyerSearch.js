// hooks/useBuyerSearch.js
// Specific buyer search hook
export function useBuyerSearch() {
  const searchHook = useSearch("/orders/search/buyers");

  return {
    ...searchHook,
    searchBuyers: searchHook.search,
    buyerSuggestions: searchHook.suggestions,
    showBuyerDropdown: searchHook.showDropdown,
    setShowBuyerDropdown: searchHook.setShowDropdown,
    selectBuyer: searchHook.selectItem,
  };
}