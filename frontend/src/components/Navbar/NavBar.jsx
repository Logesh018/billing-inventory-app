import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  RotateCcw,
  Search,
  Plus,
  Users,
  Bell,
  Settings,
  User,
  Grid,
} from "lucide-react";

export default function NavBar() {
  const [openDropdown, setOpenDropdown] = useState(false);
  const [openSearchDropdown, setOpenSearchDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setOpenSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex items-center justify-between px-4 h-14 bg-white border-b border-gray-200 shadow-sm relative">
      {/* Left */}
      <div className="flex items-center gap-3 max-w-md">
        <button className="p-1 hover:bg-gray-100 rounded">
          <RotateCcw className="w-5 h-5 text-gray-600 hover:text-gray-900" />
        </button>

        {/* Search with dropdown */}
        <div
          ref={searchRef}
          className="relative flex items-center bg-gray-100 rounded-md px-3 py-1.5 border border-transparent transition-all duration-300 ease-in-out hover:border-blue-500 hover:bg-gray-200 hover:w-72 w-60"
        >
          <button
            onClick={() => setOpenSearchDropdown(!openSearchDropdown)}
            className="flex items-center gap-2 w-full"
          >
            <Search className="w-4 h-4 text-gray-500" />
            ▾
            <input
              type="text"
              placeholder="Search in Customers ( / )"
              className="ml-2 bg-transparent outline-none text-sm flex-1"
            />
          </button>

          {/* Search Dropdown with fade effect */}
          <div
            className={`absolute left-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-md shadow-lg z-50 transform transition-all duration-200 ease-out ${openSearchDropdown
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 pointer-events-none"
              }`}
          >
            <Link
              to="#"
              className="block px-4 py-2 text-sm hover:bg-green-600 hover:text-white transition"
            >
              Search Customer
            </Link>
            <Link
              to="#"
              className="block px-4 py-2 text-sm hover:bg-green-600 hover:text-white transition"
            >
              Search Product
            </Link>
          </div>
        </div>
      </div>

    
      <div className="text-sm text-blue-800 px-4 whitespace-nowrap">
         <span className="text-xl font-bold">NILA TEXGARMENTS</span> 
      </div>

      {/* Right */}
      <div className="flex items-center gap-4 relative">
  

        {/* Plus Button with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpenDropdown(!openDropdown)}
            className="bg-green-600 text-white w-9 h-9 rounded-md hover:bg-green-800 flex items-center justify-center"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Plus Dropdown with fade effect */}
          <div
            className={`absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-50 transform transition-all duration-200 ease-out ${openDropdown
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 pointer-events-none"
              }`}
          >
            <Link
              to="#"
              className="block px-4 py-2 text-sm hover:bg-green-600 hover:text-white transition"
            >
              Add a Customer
            </Link>
            <Link
              to="#"
              className="block px-4 py-2 text-sm hover:bg-green-600 hover:text-white transition"
            >
              Add a Product
            </Link>
          </div>
        </div>

        {/* Other Icons */}
        <Link to="/users" className="p-1 hover:bg-gray-100 rounded">
          <Users className="w-5 h-5 text-gray-600 hover:text-gray-900" />
        </Link>

        <button className="p-1 hover:bg-gray-100 rounded">
          <Bell className="w-5 h-5 text-gray-600 hover:text-gray-900" />
        </button>

        <button className="p-1 hover:bg-gray-100 rounded">
          <Settings className="w-5 h-5 text-gray-600 hover:text-gray-900" />
        </button>

        <button className="p-1 hover:bg-gray-100 rounded">
          <User className="w-5 h-5 text-gray-600 hover:text-gray-900" />
        </button>

        <button className="p-1 hover:bg-gray-100 rounded">
          <Grid className="w-5 h-5 text-gray-600 hover:text-gray-900" />
        </button>
      </div>
    </div>
  );
}
