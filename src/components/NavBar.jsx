import { Bell, Settings, UserCircle } from "lucide-react";

export default function NavBar() {
  return (
    <nav className="flex items-center justify-between px-6 py-3 border-b bg-white shadow-sm">
      {/* Left side */}
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-500">
          This is a <span className="font-bold">Test</span> organization.
        </span>
        <div className="ml-2 px-3 py-1 text-sm bg-gray-100 rounded-md cursor-pointer">
          Demo Org
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-5">
        <button>
          <Bell className="w-5 h-5 text-gray-600" />
        </button>
        <button>
          <Settings className="w-5 h-5 text-gray-600" />
        </button>
        <button>
          <UserCircle className="w-7 h-7 text-gray-600" />
        </button>
      </div>
    </nav>
  );
}
