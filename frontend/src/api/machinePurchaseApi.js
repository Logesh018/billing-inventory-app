import { axiosInstance } from "../lib/axios";

// GET all machine purchases (optionally paginated)
export const getMachinePurchases = (params = {}) => axiosInstance.get("/machines", { params });

// GET single machine purchase by ID
export const getMachinePurchaseById = (id) => axiosInstance.get(`/machines/${id}`);

// CREATE a new machine purchase
export const createMachinePurchase = (data) => axiosInstance.post("/machines", data);

// UPDATE machine purchase
export const updateMachinePurchase = (id, data) => axiosInstance.put(`/machines/${id}`, data);

// DELETE machine purchase
export const deleteMachinePurchase = (id) => axiosInstance.delete(`/machines/${id}`);
