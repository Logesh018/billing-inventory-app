// api/storeEntryApi.js
import { axiosInstance } from "../lib/axios";

// Store Entry API calls
export const createStoreEntry = (data) => axiosInstance.post("/store-entries", data);
export const getStoreEntries = (params = {}) => axiosInstance.get("/store-entries", { params });
export const getStoreEntryById = (id) => axiosInstance.get(`/store-entries/${id}`);
export const getStoreEntryByPurchaseId = (purchaseId) => axiosInstance.get(`/store-entries/purchase/${purchaseId}`);
export const checkStoreEntryExists = (purchaseId) => axiosInstance.get(`/store-entries/check/${purchaseId}`);
export const updateStoreEntry = (id, data) => axiosInstance.put(`/store-entries/${id}`, data);
export const deleteStoreEntry = (id) => axiosInstance.delete(`/store-entries/${id}`);

// NEW: Get purchases ready for store entry (completed but no store entry yet)
export const getPendingPurchasesForStoreEntry = () => axiosInstance.get("/store-entries/pending-purchases");