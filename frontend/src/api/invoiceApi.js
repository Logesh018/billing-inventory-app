// api/invoiceApi.js
import { axiosInstance } from "../lib/axios";

// Get all invoices
export const getAllInvoices = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.keys(filters).forEach(key => {
    if (filters[key]) params.append(key, filters[key]);
  });
  
  const url = params.toString() ? `/invoices?${params}` : "/invoices";
  const res = await axiosInstance.get(url);
  return res.data;
};

// Get invoice by ID
export const getInvoiceById = async (id) => {
  const res = await axiosInstance.get(`/invoices/${id}`);
  return res.data;
};

// Create invoice
export const createInvoice = async (data) => {
  const res = await axiosInstance.post("/invoices", data);
  return res.data;
};

// Update invoice
export const updateInvoice = async (id, data) => {
  const res = await axiosInstance.put(`/invoices/${id}`, data);
  return res.data;
};

// Delete invoice
export const deleteInvoice = async (id) => {
  await axiosInstance.delete(`/invoices/${id}`);
};

// Download PDF
export const downloadInvoicePDF = async (id) => {
  const response = await axiosInstance.get(`/invoices/${id}/download`, {
    responseType: 'blob', // Important for file downloads
  });
  
  // Create blob URL and trigger download
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `invoice-${id}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Generate/Regenerate PDF
export const generateInvoicePDF = async (id, template = "modern") => {
  const res = await axiosInstance.post(`/invoices/${id}/generate-pdf`, { template });
  return res.data;
};

// Update invoice status
export const updateInvoiceStatus = async (id, status) => {
  const res = await axiosInstance.patch(`/invoices/${id}/status`, { status });
  return res.data;
};

// Add payment
export const addPayment = async (id, paymentData) => {
  const res = await axiosInstance.post(`/invoices/${id}/payments`, paymentData);
  return res.data;
};

// Get invoice statistics
export const getInvoiceStats = async () => {
  const res = await axiosInstance.get("/invoices/stats");
  return res.data;
};

