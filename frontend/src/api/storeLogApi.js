// api/storeLogApi.js
import { axiosInstance } from "../lib/axios";

// Store Log API calls
export const createStoreLog = (data) => axiosInstance.post("/store-logs", data);
export const getStoreLogs = (params = {}) => axiosInstance.get("/store-logs", { params });
export const getStoreLogById = (id) => axiosInstance.get(`/store-logs/${id}`);
export const getStoreLogsByStoreEntry = (storeEntryId) => axiosInstance.get(`/store-logs/store-entry/${storeEntryId}`);
export const getAvailableStock = (storeEntryId) => axiosInstance.get(`/store-logs/available-stock/${storeEntryId}`);
export const updateStoreLog = (id, data) => axiosInstance.put(`/store-logs/${id}`, data);
export const deleteStoreLog = (id) => axiosInstance.delete(`/store-logs/${id}`);