// src/api/purchaseOrderApi.js
import { axiosInstance } from "../lib/axios";

// Create a new Purchase Order
export const createPurchaseOrder = async (data) => {
  return await axiosInstance.post("/purchase-orders", data);
};

// Get all Purchase Orders
export const getPurchaseOrders = async () => {
  return await axiosInstance.get("/purchase-orders");
};

// Get Purchase Order by ID
export const getPurchaseOrderById = async (id) => {
  return await axiosInstance.get(`/purchase-orders/${id}`);
};

// Update Purchase Order
export const updatePurchaseOrder = async (id, data) => {
  return await axiosInstance.put(`/purchase-orders/${id}`, data);
};

// Delete Purchase Order
export const deletePurchaseOrder = async (id) => {
  return await axiosInstance.delete(`/purchase-orders/${id}`);
};
