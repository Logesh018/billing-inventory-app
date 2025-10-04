// src/pages/Home.jsx
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function Home() {
  const [data, setData] = useState(generateData());

  // regenerate data every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setData(generateData());
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      

      {/* Sidebar + Main Content */}
      <div className="flex flex-1">
        

        {/* Dashboard Content */}
        <main className="flex-1 p-6 overflow-y-auto bg-gray-50">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
            Nila Tex Garments
          </h1>

          {/* Charts Grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold mb-2">Revenue</h2>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data.revenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#4f46e5" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Purchase Chart */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold mb-2">Purchases</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.purchases}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#16a34a" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Production Chart */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold mb-2">Production</h2>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data.production}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#dc2626" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* New Orders Chart */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold mb-2">New Orders</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.orders}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Employee Performance */}
            <div className="bg-white rounded-lg shadow-md p-4 col-span-2">
              <h2 className="text-lg font-semibold mb-2">
                Employee Performance
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.employees}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    label
                  >
                    {data.employees.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Hardcoded colors for pie chart
const COLORS = ["#4f46e5", "#16a34a", "#dc2626", "#f59e0b", "#06b6d4"];

// Function to generate random hardcoded-like values
function generateData() {
  return {
    revenue: [
      { month: "Jan", value: random(20000, 50000) },
      { month: "Feb", value: random(20000, 50000) },
      { month: "Mar", value: random(20000, 50000) },
      { month: "Apr", value: random(20000, 50000) },
    ],
    purchases: [
      { month: "Jan", value: random(5000, 20000) },
      { month: "Feb", value: random(5000, 20000) },
      { month: "Mar", value: random(5000, 20000) },
      { month: "Apr", value: random(5000, 20000) },
    ],
    production: [
      { day: "Mon", value: random(100, 500) },
      { day: "Tue", value: random(100, 500) },
      { day: "Wed", value: random(100, 500) },
      { day: "Thu", value: random(100, 500) },
      { day: "Fri", value: random(100, 500) },
    ],
    orders: [
      { day: "Mon", value: random(10, 50) },
      { day: "Tue", value: random(10, 50) },
      { day: "Wed", value: random(10, 50) },
      { day: "Thu", value: random(10, 50) },
      { day: "Fri", value: random(10, 50) },
    ],
    employees: [
      { name: "John", value: random(10, 30) },
      { name: "Sara", value: random(10, 30) },
      { name: "David", value: random(10, 30) },
      { name: "Priya", value: random(10, 30) },
      { name: "Rahul", value: random(10, 30) },
    ],
  };
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
