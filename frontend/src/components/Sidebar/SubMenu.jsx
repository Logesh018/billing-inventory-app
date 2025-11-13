// SubMenu.jsx - Replace the entire component with this:

import { NavLink } from "react-router-dom";

export default function SubMenu({ items }) {
  return (
    <div className="ml-6 mt-1 space-y-1 border-l-2 border-slate-700 pl-4">
      {items.map((subItem) => (
        <NavLink
          key={subItem.path}
          to={subItem.path}
          className={({ isActive }) =>
            `block px-3 py-1.5 text-sm rounded-md transition-colors duration-200 ${isActive
              ? "bg-green-600 text-white font-medium"
              : "text-gray-400 hover:bg-slate-900 hover:text-green-500"
            }`
          }
        >
          {subItem.name}
        </NavLink>
      ))}
    </div>
  );
}