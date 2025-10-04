import { Zap } from "lucide-react";
import NavBar from "./NavBar";
import { NavLink } from "react-router-dom";

import logo from "/nila_upscaled.png";

export default function Header() {
  return (
    <>
      <header className="flex items-center justify-between bg-white border-b border-gray-700 h-14 w-full">
        {/* Logo Section */}
        {/* <NavLink
          to="/"
          className="flex items-center px-6 py-3.5 bg-slate-900 h-full w-60"
        > */}
          <img
            src={logo}
            alt="Nila Texgarments - Garments Manufacturer & Supplier"
            className="h-full w-60 object-cover  bg-gray-900" 
            style={{ filter: "brightness(1.1)" }} 
          />
        {/* </NavLink> */}

        {/* Navbar Section */}
        <div className="flex-1">
          <NavBar />
        </div>
      </header>
    </>
  );
}