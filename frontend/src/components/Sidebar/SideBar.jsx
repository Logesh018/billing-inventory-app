import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Building2,
  Package,
  ShoppingCart,
  Factory,
  FileText,
  Database,
  Receipt,
  BarChart3,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  UserCog
} from "lucide-react";
import SubMenu from "./SubMenu";
import { useFormNavigation } from "../../utils/FormExitModal";

const menuItems = [
  { name: "Home", icon: Home, path: "/dashboard" },
  {
    name: "Vendor Management",
    icon: Building2,
    subMenu: [
      { name: "Buyers", path: "/dashboard/vendor/buyers" },
      { name: "Supplier", path: "/dashboard/vendor/suppliers" },
      { name: "YAS Sales", path: "/dashboard/vendor/yas-sales" },
    ],
  },
  {
    name: "Orders Management",
    icon: Package,
    subMenu: [
      { name: "FOB Orders", path: "/dashboard/orders/fob" },
      { name: "JOB-Works Orders", path: "/dashboard/orders/job-works" },
      { name: "Own Orders", path: "/dashboard/orders/own-orders" },
    ],
  },
  {
    name: "Purchase Management",
    icon: ShoppingCart,
    subMenu: [
      { name: "Purchases", path: "/dashboard/purchases" },
      { name: "Purchase Return", path: "/dashboard/purchase-return" },
      { name: "NILA PO", path: "/dashboard/nila-po" },
      { name: "Purchase Estimations", path: "/dashboard/purchase-estimations" },
    ],
  },
  {
    name: "Store Management",
    icon: ShoppingCart,
    subMenu: [
      { name: "Store Entry", path: "/dashboard/store-entry" },
      { name: "Store Log", path: "/dashboard/store-log" },
      { name: "Store Inventory", path: "/dashboard/store-inventory" },
    ],
  },
  {
    name: "Production Progress",
    icon: Factory,
    subMenu: [
      // { name: "Store IN", path: "/dashboard/productions" },
      { name: "Cutting", path: "/dashboard/production/cutting" },
      { name: "Stitching", path: "/dashboard/production/stitching" },
      { name: "Trimming", path: "/dashboard/production/trimming" },
      { name: "QC", path: "/dashboard/production/qc" },
      { name: "Ironing", path: "/dashboard/production/ironing" },
      { name: "Packing", path: "/dashboard/production/packing" },
    ],
  },
  {
    name: "Invoice Generate",
    icon: FileText,
    subMenu: [
      { name: "Invoice", path: "/dashboard/invoice/invoice" },
      { name: "Proforma", path: "/dashboard/invoice/proforma" },
      { name: "Estimate", path: "/dashboard/invoice/estimate" },
      { name: "Credit Note", path: "/dashboard/invoice/credit-note" },
      { name: "Debit Note", path: "/dashboard/invoice/debit-note" },
    ],
  },
  {
    name: "YAS Production IN Entry",
    icon: Database,
    subMenu: [
      { name: "Entry – YAS Manufacturing Only", path: "/dashboard/yas/entry" },
      { name: "MRP Sticker with Barcode", path: "/dashboard/yas/mrp-sticker" },
      { name: "BOX Entry with MRP Sticker with Barcode", path: "/dashboard/yas/box-entry" },
    ],
  },
  {
    name: "Sales Entry",
    icon: Receipt,
    subMenu: [
      { name: "Sales Entry – Sales Vendor Code wise", path: "/dashboard/sales/entry" },
      { name: "Sales Return", path: "/dashboard/sales/return" },
      { name: "Sales Quotation", path: "/dashboard/sales/quotation" },
      { name: "Due Bill", path: "/dashboard/sales/due-bill" },
    ],
  },
  { name: "Report", icon: BarChart3, path: "/dashboard/reports" },
  { name: "User Management", icon: UserCog, path: "/dashboard/users" },
];

export default function Sidebar() {
  const { requestNavigation, isFormOpen } = useFormNavigation();
  const [openMenus, setOpenMenus] = useState({});
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleMenu = (name) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setTimeout(() => {
        setOpenMenus((prev) => ({ ...prev, [name]: true }));
      }, 150);
    } else {
      setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }));
    }
  };

  const isSubMenuActive = (subMenu) => {
    return subMenu.some((sub) => location.pathname.startsWith(sub.path));
  };

  const handleNavigation = (path, label) => {
    if (isFormOpen) {
      requestNavigation(label, () => {
        navigate(path);
      });
    } else {
      navigate(path);
    }
  };

  return (
    <aside
      className={`h-full flex flex-col bg-slate-900/95 backdrop-blur-sm transition-all duration-500 ease-in-out ${
        isCollapsed ? "w-21" : "w-60"
      }`}
    >
      <nav className="flex-1 px-3 py-4 space-y-1 bg-slate-800/90 overflow-y-auto custom-scrollbar transition-all duration-300">
        {menuItems.map((item) => {
          const isActive = item.subMenu
            ? isSubMenuActive(item.subMenu)
            : location.pathname === item.path;

          return (
            <div key={item.name}>
              {item.subMenu ? (
                <>
                  {/* Menu with SubMenu */}
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={`flex items-center justify-between w-full px-4 py-3 font-semibold rounded-lg group transition-colors duration-300 ease-in-out overflow-hidden ${
                      isActive
                        ? "bg-slate-900 text-green-500"
                        : "text-gray-300 hover:bg-slate-900 hover:text-green-500"
                    }`}
                  >
                    <div className="flex items-center min-w-10 flex-1 overflow-hidden">
                      <item.icon
                        className={`w-6 h-6 flex-shrink-0 transition-colors duration-300 ${
                          isActive
                            ? "text-green-500"
                            : "text-gray-300 group-hover:text-green-500"
                        }`}
                      />
                      {!isCollapsed && (
                        <span className="ml-3 whitespace-nowrap group-hover:animate-scroll-text">
                          {item.name}
                        </span>
                      )}
                    </div>
                    {!isCollapsed && (
                      <ChevronDown
                        className={`w-4 h-4 ml-2 flex-shrink-0 transition-transform duration-300 ${
                          openMenus[item.name] ? "rotate-180" : "rotate-0"
                        }`}
                      />
                    )}
                  </button>
                  {/* SubMenu Items */}
                  {!isCollapsed && openMenus[item.name] && (
                    <SubMenu items={item.subMenu} onNavigate={handleNavigation} />
                  )}
                </>
              ) : (
                /* Menu without SubMenu */
                <button
                  onClick={() => handleNavigation(item.path, item.name)}
                  className={`flex items-center justify-between w-full px-4 py-2 rounded-lg transition-colors duration-300 ease-in-out group overflow-hidden ${
                    isActive
                      ? "bg-green-600 text-white"
                      : "text-gray-300 hover:bg-slate-900 hover:text-green-500"
                  }`}
                >
                  <div className="flex items-center min-w-10 flex-1 overflow-hidden">
                    <item.icon
                      className={`w-6 h-6 flex-shrink-0 transition-colors duration-300 ${
                        isActive
                          ? "text-white"
                          : "text-gray-300 group-hover:text-green-500"
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="ml-3 whitespace-nowrap group-hover:animate-scroll-text">
                        {item.name}
                      </span>
                    )}
                  </div>
                </button>
              )}
            </div>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div
        className="flex items-center justify-center px-4 py-3 border-t border-slate-700 cursor-pointer h-12"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? (
          <ChevronRight className="w-6 h-6 text-white hover:bg-green-600 transition rounded-sm" />
        ) : (
          <ChevronLeft className="w-6 h-6 text-white hover:bg-green-600 transition rounded-sm" />
        )}
      </div>
    </aside>
  );
}