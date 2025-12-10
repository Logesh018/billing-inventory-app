import { Outlet } from "react-router-dom";
import Header from "../../components/Navbar/Header";
import Sidebar from "../../components/Sidebar/SideBar";

export default function DashboardLayout() {
  return (
    <div className="flex flex-col h-screen bg-transparent">
      {/* Header */}
      <Header />

      {/* Sidebar + Main Content */}
      <div className="flex flex-1 bg-transparent overflow-hidden">
        <Sidebar />
        
        {/* Main Content Area - where nested routes render */}
        <main className="flex-1 overflow-y-auto bg-transparent p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}