// src/components/SideBar/SideBar.jsx
import {
  Home,
  Users,
  Package,
  ShoppingCart,
  CreditCard,
  Wallet,
  Clock,
  Calendar,
  BarChart,
  UserCog,
  Zap, // Thunder icon
} from "lucide-react";

const menuItems = [
  { name: "Home", icon: Home },
  { name: "Customers", icon: Users },
  { name: "Product Catalog", icon: Package },
  { name: "Sales", icon: ShoppingCart },
  { name: "Payments", icon: CreditCard },
  { name: "Expenses", icon: Wallet },
  { name: "Time Tracking", icon: Clock },
  { name: "Events", icon: Calendar },
  { name: "Reports", icon: BarChart },
  { name: "User Management", icon: UserCog },
];

export default function SideBar() {
  return (
    <aside className="w-60 h-screen flex flex-col">
      {/* Top section - Billing */}
      <div className="flex items-center justify-center gap-1 px-6 py-3.5 bg-slate-900">
        <Zap className="w-5 h-5 text-white" />
        <span className="text-white text-base font-medium">Billing</span>
      </div>

      {/* Menu items */}
      <nav className="flex-1 px-3 py-4 space-y-1 bg-slate-800">
        {menuItems.map((item) => (
          <button
            key={item.name}
            className="flex items-center w-full px-4 py-2 text-gray-300 rounded-lg hover:bg-green-600 hover:text-gray-100 transition"
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
          </button>
        ))}
      </nav>
    </aside>
  );
}
