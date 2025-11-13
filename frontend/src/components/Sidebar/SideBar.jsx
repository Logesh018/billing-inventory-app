import { useState } from "react";
import { Routes, Route, NavLink, useLocation } from "react-router-dom";
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
  Users,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  UserCog
} from "lucide-react";
import SubMenu from "./SubMenu";

// Import Pages
import HomePage from "./Sidebarpages/HomePage";
// import Products from "../../pages/products/Products";
import Purchase from "../../pages/purchases/Purchase";
import Productions from "../../pages/productions/Productions";
import Buyers from "./Sidebarpages/Buyers";
import Suppliers from "./Sidebarpages/Supplier";
import EventsPage from "./Sidebarpages/Events";
import ReportsPage from "./Sidebarpages/Reports";
import FOBOrders from "../../pages/orders/FOBOrders";
import JobWorksOrders from "../../pages/orders/JobWorksOrders";
import OwnOrders from "../../pages/OwnOrders";
import Invoices from "../../pages/invoices/Invoices";
import ExpensesPage from "./Expenses/Expenses";
import RecurringExpenses from "./Expenses/RecurringExpenses";
import Projects from "./Timetracking/Projects";
import TimeSheet from "./Timetracking/TimeSheet";
import UsersManagement from "../../pages/users/UsersManagement";
import Proforma from "../../pages/invoices/Proforma";
import Estimations from "../../pages/estimations/Estimations";
import PurchaseEstimation from "../../pages/purchases/PurchaseEstimation";
import PurchaseOrderForm from "../../pages/purchases/PurchaseOrderForm";
import PurchaseOrders from "../../pages/purchases/PurchaseOrder";

const menuItems = [
  { name: "Home", icon: Home, path: "/" },
  // { name: "Products", icon: Package, path: "/products" },
  {
    name: "Vendor Management",
    icon: Building2,
    subMenu: [
      { name: "Supplier", path: "/vendor/suppliers" },
      { name: "Buyers", path: "/vendor/buyers" },
      { name: "YASH Sales", path: "/vendor/sales" },
    ],
  },
  {
    name: "Orders Management",
    icon: Package,
    subMenu: [
      { name: "FOB Orders", path: "/orders/fob" },
      { name: "JOB-Works Orders", path: "/orders/job-works" },
      { name: "Own Orders", path: "/orders/own-orders" },
    ],
  },
  {
    name: "Purchase Management",
    icon: ShoppingCart,
    subMenu: [
      { name: "Purchases", path: "/purchases" },
      { name: "Purchase Return", path: "/purchase-return" },
      { name: "NILA PO", path: "/nila-po" },
      { name: "Purchase Estimations", path: "/purchase-estimations" },
    ],
  },
  {
    name: "Production Progress",
    icon: Factory,
    subMenu: [
      { name: "Store IN", path: "/productions" },
      { name: "Cutting", path: "/production/cutting" },
      { name: "Stitching", path: "/production/stitching" },
      { name: "Trimming", path: "/production/trimming" },
      { name: "QC", path: "/production/qc" },
      { name: "Ironing", path: "/production/ironing" },
      { name: "Packing", path: "/production/packing" },
    ],
  },
  {
    name: "Invoice Generate",
    icon: FileText,
    subMenu: [
      { name: "Invoice", path: "/invoice/invoice" },
      { name: "Proforma", path: "/invoice/proforma" },
      { name: "Estimate", path: "/invoice/estimate" },
      { name: "Credit Note", path: "/invoice/credit-note" },
      { name: "Debit Note", path: "/invoice/debit-note" },
    ],
  },
  {
    name: "YAS Production IN Entry",
    icon: Database,
    subMenu: [
      { name: "Entry – YAS Manufacturing Only", path: "/yas/entry" },
      { name: "MRP Sticker with Barcode", path: "/yas/mrp-sticker" },
      { name: "BOX Entry with MRP Sticker with Barcode", path: "/yas/box-entry" },
    ],
  },
  {
    name: "Sales Entry",
    icon: Receipt,
    subMenu: [
      { name: "Sales Entry – Sales Vendor Code wise", path: "/sales/entry" },
      { name: "Sales Return", path: "/sales/return" },
      { name: "Sales Quotation", path: "/sales/quotation" },
      { name: "Due Bill", path: "/sales/due-bill" },
    ],
  },
  { name: "Report", icon: BarChart3, path: "/reports" },
  { name: "User Management", icon: UserCog, path: "/users" },
];

export default function Sidebar() {
  const [openMenus, setOpenMenus] = useState({});
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

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

  return (
    <div className="flex w-full h-[calc(100vh-56px)]">
      {/* Sidebar */}
      <aside
        className={`h-full flex flex-col bg-slate-900/95 backdrop-blur-sm transition-all duration-500 ease-in-out ${isCollapsed ? "w-21" : "w-60"}`}
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
                      className={`flex items-center justify-between w-full px-4 py-2 rounded-lg group 
                transition-colors duration-300 ease-in-out overflow-hidden ${isActive
                          ? "bg-slate-900 text-green-500"
                          : "text-gray-300 hover:bg-slate-900 hover:text-green-500"
                        }`}
                    >
                      <div className="flex items-center min-w-10 flex-1 overflow-hidden">
                        <item.icon
                          className={`w-6 h-6 flex-shrink-0 transition-colors duration-300 ${isActive ? "text-green-500" : "text-gray-300 group-hover:text-green-500"
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
                          className={`w-4 h-4 ml-2 flex-shrink-0 transition-transform duration-300 ${openMenus[item.name] ? "rotate-180" : "rotate-0"
                            }`}
                        />
                      )}
                    </button>
                    {/* SubMenu Items */}
                    {!isCollapsed && openMenus[item.name] && (
                      <SubMenu items={item.subMenu} />
                    )}
                  </>
                ) : (
                  /* Menu without SubMenu */
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center justify-between w-full px-4 py-2 rounded-lg transition-colors duration-300 ease-in-out group overflow-hidden ${isActive
                        ? "bg-green-600 text-white"
                        : "text-gray-300 hover:bg-slate-900 hover:text-green-500"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <div className="flex items-center min-w-10 flex-1 overflow-hidden">
                        <item.icon
                          className={`w-6 h-6 flex-shrink-0 transition-colors duration-300 ${isActive ? "text-white" : "text-gray-300 group-hover:text-green-500"
                            }`}
                        />
                        {!isCollapsed && (
                          <span className="ml-3 whitespace-nowrap group-hover:animate-scroll-text">
                            {item.name}
                          </span>
                        )}
                      </div>
                    )}
                  </NavLink>
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

      {/* Pages */}
      <main className="flex-1 p-4 overflow-y-auto bg-transparent">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/vendor/suppliers" element={<Suppliers />} />
          <Route path="/vendor/buyers" element={<Buyers />} />
          <Route path="/vendor/sales" element={<EventsPage />} />
          {/* <Route path="/products" element={<Products />} /> */}
          <Route path="/purchases" element={<Purchase />} />
          <Route path="/purchase/return" element={<RecurringExpenses />} />
          <Route path="/purchase-estimations" element={<PurchaseEstimation />} />
          <Route path="/nila-po" element={<PurchaseOrders />} />
          <Route path="/orders/fob" element={<FOBOrders />} />
          <Route path="/orders/job-works" element={<JobWorksOrders />} />
          <Route path="/orders/own-orders" element={<OwnOrders />} />
          <Route path="/productions" element={<Productions />} />
          <Route path="/production/cutting" element={<Projects />} />
          <Route path="/production/stitching" element={<TimeSheet />} />
          <Route path="/production/trimming" element={<TimeSheet />} />
          <Route path="/production/qc" element={<TimeSheet />} />
          <Route path="/production/ironing" element={<TimeSheet />} />
          <Route path="/production/packing" element={<TimeSheet />} />
          <Route path="/invoice/invoice" element={<Invoices />} />
          <Route path="/invoice/proforma" element={<Proforma />} />
          <Route path="/invoice/estimate" element={<Estimations />} />
          <Route path="/yas/entry" element={<Projects />} />
          <Route path="/yas/mrp-sticker" element={<TimeSheet />} />
          <Route path="/yas/box-entry" element={<TimeSheet />} />
          <Route path="/sales/entry" element={<ExpensesPage />} />
          <Route path="/sales/return" element={<RecurringExpenses />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/users" element={<UsersManagement />} />
        </Routes>
      </main>

    </div>
  );
}



