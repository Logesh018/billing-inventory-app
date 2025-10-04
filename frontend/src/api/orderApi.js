import { axiosInstance } from "../lib/axios";

// Get order by ID
export const getOrderById = async (id) => {
  const res = await axiosInstance.get(`/orders/${id}`);
  return res.data;
};

// Get all orders (optionally filter by orderType)
export const getAllOrders = async (orderType) => {
  const url = orderType ? `/orders?orderType=${orderType}` : "/orders";
  const res = await axiosInstance.get(url);
  return res.data;
};

export const deleteOrder = async (id) => {
  await axiosInstance.delete(`/orders/${id}`);
};

export const createOrder = async (data) => {
  const res = await axiosInstance.post("/orders", data);
  return res.data;
};

export const updateOrder = async (id, data) => {
  const res = await axiosInstance.put(`/orders/${id}`, data);
  return res.data;
};

// For FOB orders, just call:
export const getAllFOBOrders = async () => {
  return getAllOrders("FOB");
};