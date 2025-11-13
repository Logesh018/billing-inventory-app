//src/api/supplierApi.js
import { axiosInstance } from "../lib/axios";

// Create a new supplier
export const createSupplier = async (supplierData) => {
  try {
    const response = await axiosInstance.post("/suppliers", supplierData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error creating supplier");
  }
};

// Get all suppliers
export const getAllSuppliers = async () => {
  try {
    const response = await axiosInstance.get("/suppliers");
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching suppliers");
  }
};

// Get a single supplier by ID
export const getSupplierById = async (id) => {
  try {
    const response = await axiosInstance.get(`/suppliers/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching supplier");
  }
};

// Update a supplier
export const updateSupplier = async (id, supplierData) => {
  try {
    const response = await axiosInstance.put(`/suppliers/${id}`, supplierData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error updating supplier");
  }
};

// Delete a supplier
export const deleteSupplier = async (id) => {
  try {
    const response = await axiosInstance.delete(`/suppliers/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error deleting supplier");
  }
};