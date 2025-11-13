import { axiosInstance } from "../lib/axios";

export const loginUser = async (credentials) => {
  console.log("🔍 authApi loginUser called with:", credentials);
  
  try {
    const response = await axiosInstance.post("/auth/login", credentials);
    console.log("✅ Backend response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ authApi error:", error);
    console.error("❌ Error response:", error.response?.data);
    throw error;
  }
};