import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./context/ProtectedRoute";
import { FormNavigationProvider, FormExitModal } from "./utils/FormExitModal";
import { Toaster } from 'react-hot-toast';
import LoadingSpinner from "./components/UI/LoadingSpinner";
import "./App.css";

// Eager loaded components (needed immediately)
import Login from "./pages/auth/Login";
import StoreLog from "./pages/store/StoreLog";
import StoreInventory from "./pages/store/StoreInventory";


// Lazy loaded components (loaded on demand)
const DashboardLayout = lazy(() => import("./pages/dashboard/DashboardLayout"));
const HomePage = lazy(() => import("./components/Sidebar/Sidebarpages/HomePage"));

// Vendor Management
const Buyers = lazy(() => import("./pages/vendors/buyers/Buyers"));
const Suppliers = lazy(() => import("./pages/vendors/supplier/Supplier"));
const YASSales = lazy(() => import("./pages/vendors/yas/YASSales"));

// Orders Management
const FOBOrders = lazy(() => import("./pages/orders/FOBOrders"));
const JobWorksOrders = lazy(() => import("./pages/orders/JobWorksOrders"));
const OwnOrders = lazy(() => import("./pages/orders/OwnOrders"));

// Purchase Management
const Purchase = lazy(() => import("./pages/purchases/Purchase"));
const PurchaseReturn = lazy(() => import("./pages/purchases/PurchaseReturn"));
const PurchaseEstimation = lazy(() => import("./pages/purchases/PurchaseEstimation"));
const PurchaseOrders = lazy(() => import("./pages/purchases/PurchaseOrder"));

//Store Management
const StoreEntry = lazy(() => import("./pages/store/StoreEntry"))

// Production Management
const Productions = lazy(() => import("./pages/productions/Productions"));
const Cutting = lazy(() => import("./pages/productions/Cutting"));

// Invoice Management
const Invoices = lazy(() => import("./pages/invoices/Invoices"));
const Proforma = lazy(() => import("./pages/invoices/Proforma"));
const Estimations = lazy(() => import("./pages/estimations/Estimations"));
const CreditNote = lazy(() => import("./pages/invoices/CreditNote"));
const DebitNote = lazy(() => import("./pages/invoices/DebitNote"));

// Other Pages
const ExpensesPage = lazy(() => import("./components/Sidebar/Expenses/Expenses"));
const RecurringExpenses = lazy(() => import("./components/Sidebar/Expenses/RecurringExpenses"));
const Projects = lazy(() => import("./components/Sidebar/Timetracking/Projects"));
const TimeSheet = lazy(() => import("./components/Sidebar/Timetracking/TimeSheet"));
const ReportsPage = lazy(() => import("./components/Sidebar/Sidebarpages/Reports"));
const UsersManagement = lazy(() => import("./pages/users/UsersManagement"));

function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
}

function App() {
  return (
    <AuthProvider>
      <FormNavigationProvider>
        <Router>
          {/* background layer */}
          {/* <div className="fixed inset-0 -z-10 bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 bg-[length:200%_200%] animate-subtle-gradient">
            <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full opacity-50 blur-[100px] bg-blue-400 animate-orb-float" />
            <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full opacity-50 blur-[100px] bg-pink-400 animate-orb-float"
              style={{ animationDelay: '10s' }}
            />
          </div> */}

          <div className="fixed inset-0 -z-10 bg-gradient-to-br from-white via-gray-50 to-gray-200" />

          <Toaster position="top-right" />
          <FormExitModal />

          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<RootRedirect />} />

              {/* Protected Dashboard Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                {/* Dashboard Home */}
                <Route index element={<HomePage />} />

                {/* Vendor Management */}
                <Route path="vendor/buyers" element={<Buyers />} />
                <Route path="vendor/suppliers" element={<Suppliers />} />
                <Route path="vendor/yas-sales" element={<YASSales />} />

                {/* Orders Management */}
                <Route path="orders/fob" element={<FOBOrders />} />
                <Route path="orders/job-works" element={<JobWorksOrders />} />
                <Route path="orders/own-orders" element={<OwnOrders />} />

                {/* Purchase Management */}
                <Route path="purchases" element={<Purchase />} />
                <Route path="purchase-return" element={<PurchaseReturn />} />
                <Route path="purchase-estimations" element={<PurchaseEstimation />} />
                <Route path="nila-po" element={<PurchaseOrders />} />

                {/* Store Management */}
                <Route path="store-entry" element={<StoreEntry />} />
                <Route path="store-log" element={<StoreLog />} />
                <Route path="store-inventory" element={<StoreInventory/>} />

                {/* Production Management */}
                <Route path="productions" element={<Productions />} />
                <Route path="production/cutting" element={<Cutting />} />
                <Route path="production/stitching" element={<TimeSheet />} />
                <Route path="production/trimming" element={<TimeSheet />} />
                <Route path="production/qc" element={<TimeSheet />} />
                <Route path="production/ironing" element={<TimeSheet />} />
                <Route path="production/packing" element={<TimeSheet />} />

                {/* Invoice Management */}
                <Route path="invoice/invoice" element={<Invoices />} />
                <Route path="invoice/proforma" element={<Proforma />} />
                <Route path="invoice/credit-note" element={<CreditNote />} />
                <Route path="invoice/debit-note" element={<DebitNote />} />
                <Route path="invoice/estimate" element={<Estimations />} />

                {/* YAS Production */}
                <Route path="yas/entry" element={<Projects />} />
                <Route path="yas/mrp-sticker" element={<TimeSheet />} />
                <Route path="yas/box-entry" element={<TimeSheet />} />

                {/* Sales Entry */}
                <Route path="sales/entry" element={<ExpensesPage />} />
                <Route path="sales/return" element={<RecurringExpenses />} />

                {/* Reports & Users */}
                <Route path="reports" element={<ReportsPage />} />
                <Route path="users" element={<UsersManagement />} />
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </FormNavigationProvider>
    </AuthProvider>
  );
}

export default App;