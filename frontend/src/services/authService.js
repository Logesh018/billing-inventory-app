// src/services/authService.js 
import { axiosInstance } from "../lib/axios";  

// Login user
export const loginUser = async (email, password) => {
  try {
    const response = await axiosInstance.post("/auth/login", { email, password });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Login failed");
  }
};

// Logout user
export const logoutUser = () => {
  localStorage.removeItem("token");
};

// Fetch current user
export const getCurrentUser = async () => {
  try {
    const response = await axiosInstance.get("/auth/me");
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch user");
  }
};