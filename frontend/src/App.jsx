import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./context/ProtectedRoute";
import Login from "./pages/auth/Login";
import Home from "./pages/Home";
import "./App.css";
import { Toaster } from 'react-hot-toast';

// Create a component to handle root redirect
function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* === Animated background layer === */}
        <div className="fixed inset-0 -z-10 bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 bg-[length:200%_200%] animate-subtle-gradient">
          <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full opacity-50 blur-[100px] bg-blue-400 animate-orb-float" />
          <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full opacity-50 blur-[100px] bg-pink-400 animate-orb-float"
            style={{ animationDelay: '10s' }}
          />
        </div>
        <Toaster />
        <Routes>
          {/* Login page - accessible to everyone */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RootRedirect />} />
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
