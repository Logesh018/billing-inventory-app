// src/components/Sidebar/SubMenu.jsx
import { Link } from "react-router-dom";

export default function SubMenu({ items }) {
  return (
    <div className="ml-6 mt-1 space-y-1">
      {items.map((sub) => (
        <Link
          key={sub.name}
          to={sub.path}
          className="block px-4 py-2 text-sm text-gray-300 rounded hover:bg-green-600 hover:text-white transition"
        >
          {sub.name}
        </Link>
      ))}
    </div>
  );
}
