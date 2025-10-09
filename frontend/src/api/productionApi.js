import { axiosInstance } from "../lib/axios";

export const getProductions = () => axiosInstance.get("/productions");
export const createProduction = (data) => axiosInstance.post("/productions", data);
export const getProductionById = (id) => axiosInstance.get(`/productions/${id}`);
export const updateProduction = (id, data) => axiosInstance.put(`/productions/${id}`, data);
export const completeProduction = (id) => axiosInstance.patch(`/productions/${id}/complete`);
export const deleteProduction = (id) => axiosInstance.delete(`/productions/${id}`);