// src/components/UsersManagement.jsx
import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, User } from "lucide-react";
import { createUser, getUsers, updateUser, deleteUser } from "../api/userApi";

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Employee",
    access: [],
  });
  const [errors, setErrors] = useState({});

  const modules = ["purchase", "product", "orders", "production", "invoices", "buyer"];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getUsers();
      setUsers(response.data || []);
      setError(null);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to fetch users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleCheckboxChange = (module) => {
    setFormData((prev) => {
      const newAccess = prev.access.includes(module)
        ? prev.access.filter((a) => a !== module)
        : [...prev.access, module];
      return { ...prev, access: newAccess };
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!selectedUser && !formData.password) {
      newErrors.password = "Password is required for new users";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (selectedUser) {
        await updateUser(selectedUser._id, {
          name: formData.name,
          email: formData.email,
          password: formData.password || undefined,
          role: formData.role,
          access: formData.access,
        });
      } else {
        await createUser(formData);
      }
      setShowForm(false);
      setSelectedUser(null);
      setFormData({ name: "", email: "", password: "", role: "Employee", access: [] });
      fetchUsers();
    } catch (error) {
      console.error("Error saving user:", error);
      alert(`Failed to save user: ${error.message || error}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteUser(id);
        fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
        alert(`Failed to delete user: ${error.message || error}`);
      }
    }
  };

  const truncate = (str, max = 20) => {
    if (!str) return "—";
    return str.length > max ? str.substring(0, max) + "…" : str;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showForm ? (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-3">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
              <div className="text-center mb-3">
                <h1 className="text-xl font-bold text-gray-800">
                  {selectedUser ? "Edit User" : "Create New User"}
                </h1>
              </div>

              {/* Basic Information */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <div className="w-1 h-4 bg-blue-500 rounded mr-2"></div>
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Full Name*
                    </label>
                    <input
                      placeholder="Enter full name"
                      className={`w-full border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 ${errors.name
                          ? 'border-red-500 focus:ring-red-400'
                          : 'border-gray-300 focus:ring-blue-400'
                        }`}
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                    {errors.name && (
                      <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Email*
                    </label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      className={`w-full border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 ${errors.email
                          ? 'border-red-500 focus:ring-red-400'
                          : 'border-gray-300 focus:ring-blue-400'
                        }`}
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value.toLowerCase())}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500 mt-0.5">{errors.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Authentication */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <div className="w-1 h-4 bg-green-500 rounded mr-2"></div>
                  Authentication
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {!selectedUser && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Password*
                      </label>
                      <input
                        type="password"
                        placeholder="Create password"
                        className={`w-full border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 ${errors.password
                            ? 'border-red-500 focus:ring-red-400'
                            : 'border-gray-300 focus:ring-green-400'
                          }`}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                      />
                      {errors.password && (
                        <p className="text-xs text-red-500 mt-0.5">{errors.password}</p>
                      )}
                    </div>
                  )}
                  {selectedUser && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        New Password (optional)
                      </label>
                      <input
                        type="password"
                        placeholder="Leave empty to keep current password"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-400"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Role & Permissions */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <div className="w-1 h-4 bg-purple-500 rounded mr-2"></div>
                  Role & Permissions
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
                      value={formData.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                    >
                      <option value="Employee">Employee</option>
                      <option value="Admin">Admin</option>
                      <option value="SuperAdmin">SuperAdmin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Access Modules
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {modules.map((module) => (
                        <label key={module} className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={formData.access.includes(module)}
                            onChange={() => handleCheckboxChange(module)}
                            disabled={formData.role === "SuperAdmin"}
                            className="rounded"
                          />
                          <span className="capitalize">{module}</span>
                        </label>
                      ))}
                    </div>
                    {formData.role === "SuperAdmin" && (
                      <p className="text-xs text-gray-500 mt-1">
                        SuperAdmin has access to all modules by default
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setSelectedUser(null);
                    setFormData({ name: "", email: "", password: "", role: "Employee", access: [] });
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white rounded px-4 py-1.5 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-1.5 text-xs font-medium"
                >
                  {selectedUser ? "Update User" : "Create User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Users Management</h1>
              <p className="text-gray-600 text-sm mt-1">Manage your user accounts</p>
            </div>
            <button
              onClick={() => {
                setShowForm(true);
                setSelectedUser(null);
                setFormData({ name: "", email: "", password: "", role: "Employee", access: [] });
              }}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-sm text-sm"
            >
              <Plus className="w-4 h-4 mr-1" /> Create User
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-48">
                    Name
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-64">
                    Email
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                    Role
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Access
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="font-medium text-sm text-gray-800" title={user.name}>
                        {truncate(user.name, 20)}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-700" title={user.email}>
                        {truncate(user.email, 30)}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${user.role === "SuperAdmin"
                          ? "bg-purple-100 text-purple-700"
                          : user.role === "Admin"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-xs">
                        {user.access.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.access.map((module) => (
                              <span
                                key={module}
                                className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs capitalize"
                              >
                                {module}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setFormData({
                              name: user.name,
                              email: user.email,
                              password: "",
                              role: user.role,
                              access: user.access,
                            });
                            setShowForm(true);
                          }}
                          className="p-1.5 rounded text-xs bg-blue-500 text-white hover:bg-blue-600"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="p-1.5 rounded text-xs bg-red-500 text-white hover:bg-red-600"
                          title="Delete"
                          disabled={user.role === "SuperAdmin"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <div className="text-gray-500 text-lg mb-2">No users found</div>
              <div className="text-gray-400 text-sm mb-4">
                Create your first user to get started
              </div>
              <button
                onClick={() => {
                  setShowForm(true);
                  setSelectedUser(null);
                  setFormData({ name: "", email: "", password: "", role: "Employee", access: [] });
                }}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First User
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UsersManagement;