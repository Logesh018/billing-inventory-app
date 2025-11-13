// src/api/productApi.js
import { axiosInstance } from "../lib/axios";

export const getProducts = () => axiosInstance.get("/products");
export const createProduct = (data) => axiosInstance.post("/products", data);
export const deleteProduct = (id) => axiosInstance.delete(`/products/${id}`);


