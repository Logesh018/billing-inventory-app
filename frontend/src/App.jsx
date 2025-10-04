// src/App.jsx - FIXED ROUTING
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./context/ProtectedRoute";
import Login from "./pages/Login";
import Home from "./pages/Home";
import "./App.css";

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

  // If user is logged in, go to dashboard, otherwise go to login
  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Login page - accessible to everyone */}
          <Route path="/login" element={<Login />} />

          {/* Root redirect based on auth status */}
          <Route path="/" element={<RootRedirect />} />

          {/* Protected routes - only accessible when logged in */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          {/* Catch all other routes */}
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