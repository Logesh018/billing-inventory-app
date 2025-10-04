// src/api/userApi.js
import { axiosInstance } from "../lib/axios";

const API_URL = "/users"; 

export const createUser = async (userData) => {
  const response = await axiosInstance.post(API_URL, userData);
  return response.data;
};

export const getUsers = async () => {
  const response = await axiosInstance.get(API_URL);
  return response.data;
};

export const getUserById = async (id) => {
  const response = await axiosInstance.get(`${API_URL}/${id}`);
  return response.data;
};

export const updateUser = async (id, userData) => {
  const response = await axiosInstance.put(`${API_URL}/${id}`, userData);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await axiosInstance.delete(`${API_URL}/${id}`);
  return response.data;
};