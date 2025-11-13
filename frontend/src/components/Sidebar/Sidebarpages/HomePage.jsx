import { useState, useEffect, useCallback } from "react";
import {
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ShoppingCart,
  Factory,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899"];

const STATUS_COLORS = {
  "Pending Purchase": "#f59e0b",
  "Purchase Completed": "#10b981",
  "Pending Production": "#f59e0b",
  "Factory Received": "#3b82f6",
  "In Production": "#8b5cf6",
  "Production Completed": "#10b981",
  "Ready for Delivery": "#06b6d4",
  "Delivered": "#10b981",
  "Completed": "#059669",
  "Pending": "#f59e0b",
  "Cutting": "#8b5cf6",
  "Stitching": "#8b5cf6",
  "Trimming": "#8b5cf6",
  "QC": "#3b82f6",
  "Ironing": "#3b82f6",
  "Packing": "#06b6d4",
};

export default function HomePage() {
  const [orders, setOrders] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    // Orders
    totalOrders: 0,
    totalQuantity: 0,
    fobOrders: 0,
    jobWorksOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    // Purchases
    totalPurchases: 0,
    pendingPurchases: 0,
    completedPurchases: 0,
    // Productions
    totalProductions: 0,
    pendingProductions: 0,
    completedProductions: 0,
  });

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchOrders(),
        fetchPurchases(),
        fetchProductions()
      ]);
      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const fetchOrders = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE}/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch orders');

      const data = await response.json();
      const ordersData = data.orders || data;
      setOrders(ordersData);
      return ordersData;
    } catch (err) {
      console.error("Error fetching orders:", err);
      throw err;
    }
  };

  const fetchPurchases = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE}/purchases`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch purchases');

      const data = await response.json();
      setPurchases(data);
      return data;
    } catch (err) {
      console.error("Error fetching purchases:", err);
      throw err;
    }
  };

  const fetchProductions = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE}/productions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch productions');

      const data = await response.json();
      setProductions(data);
      return data;
    } catch (err) {
      console.error("Error fetching productions:", err);
      throw err;
    }
  };



  const calculateStats = useCallback(() => {
    const stats = {
      // Orders stats
      totalOrders: orders.length,
      totalQuantity: orders.reduce((sum, order) => sum + (order.totalQty || 0), 0),
      fobOrders: orders.filter((o) => o.orderType === "FOB").length,
      jobWorksOrders: orders.filter((o) => o.orderType === "JOB-Works").length,
      pendingOrders: orders.filter((o) =>
        !["Completed", "Delivered"].includes(o.status)
      ).length,
      completedOrders: orders.filter((o) =>
        ["Completed", "Delivered"].includes(o.status)
      ).length,
      // Purchases stats
      totalPurchases: purchases.length,
      pendingPurchases: purchases.filter((p) => p.status === "Pending").length,
      completedPurchases: purchases.filter((p) => p.status === "Completed").length,
      // Productions stats
      totalProductions: productions.length,
      pendingProductions: productions.filter((p) =>
        p.status === "Pending Production"
      ).length,
      completedProductions: productions.filter((p) =>
        p.status === "Production Completed"
      ).length,
    };
    setStats(stats);
  }, [orders, purchases, productions]);

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  const getStatusDistribution = () => {
    const statusCount = {};
    orders.forEach((order) => {
      statusCount[order.status] = (statusCount[order.status] || 0) + 1;
    });
    return Object.entries(statusCount).map(([name, value]) => ({
      name,
      value,
    }));
  };

  // const getOrderTypeData = () => {
  //   return [
  //     { name: "FOB", value: stats.fobOrders },
  //     { name: "JOB-Works", value: stats.jobWorksOrders },
  //   ];
  // };

  const getMonthlyOrders = () => {
    const monthlyData = {};
    orders.forEach((order) => {
      const date = new Date(order.orderDate);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      monthlyData[monthYear] = (monthlyData[monthYear] || 0) + 1;
    });

    return Object.entries(monthlyData)
      .map(([month, count]) => ({ month, count }))
      .slice(-6);
  };

  const getTopBuyers = () => {
    const buyerData = {};
    orders.forEach((order) => {
      const buyerName = order.buyerDetails?.name || order.buyer?.name || "Unknown";
      if (!buyerData[buyerName]) {
        buyerData[buyerName] = { name: buyerName, orders: 0, quantity: 0 };
      }
      buyerData[buyerName].orders += 1;
      buyerData[buyerName].quantity += order.totalQty || 0;
    });

    return Object.values(buyerData)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  };

  const getProductionStatusDistribution = () => {
    const statusCount = {};
    productions.forEach((prod) => {
      statusCount[prod.status] = (statusCount[prod.status] || 0) + 1;
    });
    return Object.entries(statusCount).map(([name, value]) => ({
      name,
      value,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-semibold">{error}</p>
          <button
            onClick={fetchAllData}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your business overview</p>
        </div>
        <button
          onClick={fetchAllData}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Refresh Data
        </button>
      </div>

      {/* Stats Cards - Row 1 (Orders) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Package}
          title="Total Orders"
          value={stats.totalOrders}
          color="bg-blue-500"
          iconBg="bg-blue-100"
        />
        <StatCard
          icon={TrendingUp}
          title="Total Quantity"
          value={stats.totalQuantity.toLocaleString()}
          color="bg-green-500"
          iconBg="bg-green-100"
        />
        <StatCard
          icon={Clock}
          title="Pending Orders"
          value={stats.pendingOrders}
          color="bg-yellow-500"
          iconBg="bg-yellow-100"
        />
        <StatCard
          icon={CheckCircle}
          title="Completed Orders"
          value={stats.completedOrders}
          color="bg-emerald-500"
          iconBg="bg-emerald-100"
        />
      </div>

      {/* Stats Cards - Row 2 (Purchases & Productions) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={ShoppingCart}
          title="Total Purchases"
          value={stats.totalPurchases}
          color="bg-purple-500"
          iconBg="bg-purple-100"
        />
        <StatCard
          icon={CheckCircle}
          title="Completed Purchases"
          value={stats.completedPurchases}
          subtitle={`Pending: ${stats.pendingPurchases}`}
          color="bg-purple-600"
          iconBg="bg-purple-100"
        />
        <StatCard
          icon={Factory}
          title="Total Productions"
          value={stats.totalProductions}
          color="bg-indigo-500"
          iconBg="bg-indigo-100"
        />
        <StatCard
          icon={CheckCircle}
          title="Completed Productions"
          value={stats.completedProductions}
          subtitle={`Pending: ${stats.pendingProductions}`}
          color="bg-indigo-600"
          iconBg="bg-indigo-100"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Orders Trend */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Monthly Orders Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getMonthlyOrders()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="Orders" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top 5 Buyers */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top 5 Buyers by Quantity</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getTopBuyers()} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="quantity" fill="#8b5cf6" radius={[0, 8, 8, 0]} name="Total Qty" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Order Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getStatusDistribution()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {getStatusDistribution().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Production Status Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Production Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getProductionStatusDistribution()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {getProductionStatusDistribution().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>


      {/* Recent Orders Table */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PO No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Buyer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.slice(0, 5).map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.PoNo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {order.buyerDetails?.name || order.buyer?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${order.orderType === "FOB"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-purple-100 text-purple-800"
                      }`}>
                      {order.orderType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {order.totalQty?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className="px-2 py-1 text-xs font-semibold rounded-full text-white"
                      style={{ backgroundColor: STATUS_COLORS[order.status] || "#6b7280" }}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {new Date(order.orderDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Purchases Table */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Purchases</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PUR No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PO No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {purchases.slice(0, 5).map((purchase) => (
                <tr key={purchase._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {purchase.PURNo || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {purchase.PoNo || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${purchase.orderType === "FOB"
                      ? "bg-blue-100 text-blue-800"
                      : purchase.orderType === "JOB-Works"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-gray-100 text-gray-800"
                      }`}>
                      {purchase.orderType || "Machine"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    ₹{(purchase.grandTotalWithGst || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${purchase.status === "Completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                        }`}
                    >
                      {purchase.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {new Date(purchase.purchaseDate || purchase.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Productions Table */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Productions</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PO No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Buyer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Required Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productions.slice(0, 5).map((production) => (
                <tr key={production._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {production.PoNo || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {production.buyerName || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${production.orderType === "FOB"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-purple-100 text-purple-800"
                      }`}>
                      {production.orderType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {production.requiredQty?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className="px-2 py-1 text-xs font-semibold rounded-full text-white"
                      style={{ backgroundColor: STATUS_COLORS[production.status] || "#6b7280" }}
                    >
                      {production.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {new Date(production.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard(props) {
  const { icon, title, value, subtitle, color, iconBg } = props;
  const IconComponent = icon;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`${iconBg} p-3 rounded-lg`}>
          <IconComponent className={`w-8 h-8 ${color.replace('bg-', 'text-')}`} />
        </div>
      </div>
    </div>
  );
}