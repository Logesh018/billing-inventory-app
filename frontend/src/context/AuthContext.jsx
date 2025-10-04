import { createContext, useContext, useState, useEffect } from "react";
import { loginUser } from "../api/authApi"; // Import from authApi

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem("token");
    console.log("🔍 Token found on mount:", token ? "Yes" : "No");
    
    if (token) {
      const decodedUser = decodeToken(token);
      console.log("🔍 Decoded user:", decodedUser);
      if (decodedUser) {
        setUser(decodedUser);
      }
    }
    setLoading(false);
  }, []);

  // Login function
  const login = async (email, password) => {
    console.log("🔍 AuthContext login called with:", { email, password: "***" });
    setLoading(true);
    
    try {
      const data = await loginUser({ email, password });
      console.log("✅ loginUser response:", data);
      
      if (!data.token) {
        console.error("❌ No token in response!");
        throw new Error("No token received from server");
      }
      
      if (!data.user) {
        console.warn("⚠️ No user data in response, will decode from token");
        // If backend doesn't return user, decode from token
        const decodedUser = decodeToken(data.token);
        data.user = decodedUser;
      }
      
      localStorage.setItem("token", data.token);
      console.log("✅ Token saved to localStorage");
      
      setUser(data.user);
      console.log("✅ User set in context:", data.user);
      
    } catch (error) {
      console.error("❌ AuthContext login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    console.log("✅ User logged out");
  };

  // Check if user has access to a module
  const hasAccess = (module) => user?.access?.includes(module) || false;

  // Decode JWT token
  const decodeToken = (token) => {
    try {
      const payload = token.split(".")[1];
      const decoded = JSON.parse(atob(payload));
      return { 
        id: decoded.id, 
        role: decoded.role, 
        access: decoded.access || ["purchase"],
        email: decoded.email
      };
    } catch (e) {
      console.error("❌ Invalid token:", e);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);