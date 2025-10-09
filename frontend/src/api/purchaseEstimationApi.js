// api/purchaseEstimationApi.js
import { axiosInstance } from "../lib/axios";

export const getPurchaseEstimations = () => axiosInstance.get("/purchase-estimations");
export const getPurchaseEstimationById = (id) => axiosInstance.get(`/purchase-estimations/${id}`);
export const createPurchaseEstimation = (data) => axiosInstance.post("/purchase-estimations", data);
export const updatePurchaseEstimation = (id, data) => axiosInstance.put(`/purchase-estimations/${id}`, data);
export const deletePurchaseEstimation = (id) => axiosInstance.delete(`/purchase-estimations/${id}`);
export const getEstimationPDF = (id) => axiosInstance.get(`/purchase-estimations/${id}/pdf`);  // ← NEW - Fast check
export const generateEstimationPDF = (id) => axiosInstance.post(`/purchase-estimations/${id}/generate-pdf`);
export const searchSuppliers = (query) => axiosInstance.get(`/purchase-estimations/search/suppliers?q=${query}`);