// api/purchaseReturnApi.js
import { axiosInstance } from "../lib/axios";

/**
 * Get purchase details by PURNo for creating return
 */
export const getPurchaseForReturn = (PURNo) => 
  axiosInstance.get(`/purchase-returns/purchase/${PURNo}`);

/**
 * Get next available PURTNo (preview)
 */
export const getNextPURTNo = () => 
  axiosInstance.get("/purchase-returns/next-purt-no");

/**
 * Create a new purchase return
 */
export const createPurchaseReturn = (data) => 
  axiosInstance.post("/purchase-returns", data);

/**
 * Get all purchase returns with optional filters
 */
export const getPurchaseReturns = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `/purchase-returns?${queryString}` : '/purchase-returns';
  return axiosInstance.get(url);
};

/**
 * Get single purchase return by ID
 */
export const getPurchaseReturnById = (id) => 
  axiosInstance.get(`/purchase-returns/${id}`);

/**
 * Update purchase return status
 */
export const updatePurchaseReturnStatus = (id, status) => 
  axiosInstance.patch(`/purchase-returns/${id}/status`, { status });

/**
 * Delete a purchase return
 */
export const deletePurchaseReturn = (id) => 
  axiosInstance.delete(`/purchase-returns/${id}`);