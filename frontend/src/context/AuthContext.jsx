import { createContext, useContext, useState, useEffect } from "react";
import { loginUser } from "../api/authApi";

const AuthContext = createContext();

// Move decodeToken outside component (fixes ESLint warning)
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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("token");
      console.log("🔍 Token found on mount:", token ? "Yes" : "No");
      
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Decode token to check expiration
        const decodedUser = decodeToken(token);
        
        if (!decodedUser) {
          console.warn("⚠️ Invalid token format, clearing...");
          localStorage.removeItem("token");
          setUser(null);
          setLoading(false);
          return;
        }

        // Check if token is expired (JWT exp is in seconds, Date.now() is in milliseconds)
        const currentTime = Math.floor(Date.now() / 1000);
        const tokenPayload = JSON.parse(atob(token.split(".")[1]));
        
        if (tokenPayload.exp && tokenPayload.exp < currentTime) {
          console.warn("⚠️ Token expired, clearing...");
          localStorage.removeItem("token");
          setUser(null);
          setLoading(false);
          return;
        }

        // Token is valid, set user
        console.log("✅ Token valid, user authenticated:", decodedUser);
        setUser(decodedUser);
      } catch (error) {
        console.error("❌ Token verification failed:", error);
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
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

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook - exported separately (fixes ESLint warning)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};