import NavBar from "./NavBar";
import logo from "/nila_upscaled.png";

export default function Header() {
  return (
    <>
      <header className="flex items-center justify-between bg-white/80 backdrop-blur-sm border-b border-gray-800 h-14 w-full">
        {/* Logo Section */}
        <img
          src={logo}
          alt="Nila Texgarments - Garments Manufacturer & Supplier"
          className="h-full w-60 object-cover bg-gray-900/90" 
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

