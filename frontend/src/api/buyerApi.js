//src/api/buyerApi
import { axiosInstance } from "../lib/axios";

// Create a new buyer
export const createBuyer = async (buyerData) => {
  try {
    const response = await axiosInstance.post("/buyers", buyerData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error creating buyer");
  }
};

// Get all buyers
export const getAllBuyers = async () => {
  try {
    const response = await axiosInstance.get("/buyers");
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching buyers");
  }
};

// Get a single buyer by ID
export const getBuyerById = async (id) => {
  try {
    const response = await axiosInstance.get(`/buyers/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching buyer");
  }
};

// Update a buyer
export const updateBuyer = async (id, buyerData) => {
  try {
    const response = await axiosInstance.put(`/buyers/${id}`, buyerData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error updating buyer");
  }
};

// Delete a buyer
export const deleteBuyer = async (id) => {
  try {
    const response = await axiosInstance.delete(`/buyers/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error deleting buyer");
  }
};