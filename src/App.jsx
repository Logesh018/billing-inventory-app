import React from "react";
import NavBar from "./components/NavBar";
import SideBar from "./components/SideBar";
import "./App.css"

export default function App() {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <SideBar />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <NavBar />

        {/* Placeholder for dashboard content */}
        <div className="p-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
      </div>
    </div>
  );
}

