// src/pages/Home.jsx
import Header from "../components/Navbar/Header";
import Sidebar from "../components/Sidebar/SideBar";

export default function Home() {
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <Header />

      {/* Sidebar + Main Content */}
      <div className="flex flex-1">
        <Sidebar />
      </div>
    </div>
  );
}
