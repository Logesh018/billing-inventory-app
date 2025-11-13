// src/lib/axios.js
import axios from "axios";

const API_URL = "http://localhost:5000/api";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? API_URL : "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

