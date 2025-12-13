import { axiosInstance } from "../lib/axios";

export const getPurchases = () => axiosInstance.get("/purchases");
export const getPurchaseById = (id) => axiosInstance.get(`/purchases/${id}`);
export const createPurchase = (data) => axiosInstance.post("/purchases", data);
export const updatePurchase = (id, data) => axiosInstance.put(`/purchases/${id}`, data);
export const completePurchase = (id) => axiosInstance.patch(`/purchases/${id}/complete`);
export const deletePurchase = (id) => axiosInstance.delete(`/purchases/${id}`);
export const searchSuppliers = (query) => axiosInstance.get(`/purchases/search/suppliers?q=${query}`);


export const getPurchaseByOrderId = (orderId) => axiosInstance.get(`/purchases/by-order/${orderId}`);
export const getPurchaseByPURNo = (purNo) => axiosInstance.get(`/purchases/by-purno/${purNo}`);