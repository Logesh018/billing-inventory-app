// // api/documentApi.js
// import { axiosInstance } from "../lib/axios";

// // Get all documents of a specific type
// export const getAllDocuments = async (documentType, filters = {}) => {
//   const params = new URLSearchParams();
//   Object.keys(filters).forEach(key => {
//     if (filters[key]) params.append(key, filters[key]);
//   });
//   params.append("documentType", documentType); // Append documentType as a query parameter

//   const url = `/documents?${params.toString()}`;
//   const res = await axiosInstance.get(url);
//   return res.data;
// };

// // Get a single document by ID and type
// export const getDocumentById = async (documentType, id) => {
//   const res = await axiosInstance.get(`/documents/${id}`, {
//     params: { documentType } // Pass documentType as a query parameter
//   });
//   return res.data;
// };

// // Create a new document
// export const createDocument = async (data) => {
//   // The 'documentType' field is already in the data payload from the component
//   const res = await axiosInstance.post("/documents", data); // Post to a generic endpoint
//   return res.data;
// };

// // Update an existing document
// export const updateDocument = async (documentType, id, data) => {
//   const res = await axiosInstance.put(`/documents/${id}`, { ...data, documentType });
//   return res.data;
// };

// // Delete a document
// export const deleteDocument = async (documentType, id) => {
//   await axiosInstance.delete(`/documents/${id}`, {
//     params: { documentType } // Pass documentType as a query parameter
//   });
// };

// // Download document PDF
// export const downloadDocumentPDF = async (documentType, id) => {
//   const response = await axiosInstance.get(`/documents/${id}/download`, {
//     responseType: 'blob',
//     params: { documentType },
//   });

//   const blob = new Blob([response.data], { type: 'application/pdf' });
//   const url = window.URL.createObjectURL(blob);
//   const link = document.createElement('a');
//   link.href = url;
//   link.download = `${documentType}-${id}.pdf`;
//   document.body.appendChild(link);
//   link.click();
//   document.body.removeChild(link);
//   window.URL.revokeObjectURL(url);
// };

// // Generate/Regenerate PDF
// export const generateDocumentPDF = async (documentType, id, template = "modern") => {
//   const res = await axiosInstance.post(`/documents/${id}/generate-pdf`, { template, documentType });
//   return res.data;
// };

// // Update document status
// export const updateDocumentStatus = async (documentType, id, status) => {
//   const res = await axiosInstance.patch(`/documents/${id}/status`, { status, documentType });
//   return res.data;
// };

// // Add payment
// export const addPayment = async (documentType, id, paymentData) => {
//   const res = await axiosInstance.post(`/documents/${id}/payments`, { ...paymentData, documentType });
//   return res.data;
// };

// // Get document statistics
// export const getDocumentStats = async (documentType) => {
//   const res = await axiosInstance.get(`/documents/stats`, {
//     params: { documentType }
//   });
//   return res.data;
// };



// api/documentApi.js - Frontend API service
import { axiosInstance } from "../lib/axios";

// Generic document API functions
export const createDocument = async (documentType, data) => {
  const res = await axiosInstance.post("/documents", { ...data, documentType });
  return res.data;
};

export const getAllDocuments = async (documentType, filters = {}) => {
  const params = new URLSearchParams();
  if (documentType) params.append('documentType', documentType);
  Object.keys(filters).forEach(key => {
    if (filters[key]) params.append(key, filters[key]);
  });
  
  const url = params.toString() ? `/documents?${params}` : "/documents";
  const res = await axiosInstance.get(url);
  return res.data;
};

export const getDocumentById = async (id) => {
  const res = await axiosInstance.get(`/documents/${id}`);
  return res.data;
};

export const updateDocument = async (id, data) => {
  const res = await axiosInstance.put(`/documents/${id}`, data);
  return res.data;
};

export const deleteDocument = async (id) => {
  await axiosInstance.delete(`/documents/${id}`);
};

export const downloadDocumentPDF = async (id) => {
  const response = await axiosInstance.get(`/documents/${id}/download`, {
    responseType: 'blob',
  });
  
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `document-${id}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const generateDocumentPDF = async (id, template = "modern") => {
  const res = await axiosInstance.post(`/documents/${id}/generate-pdf`, { template });
  return res.data;
};

export const updateDocumentStatus = async (id, status) => {
  const res = await axiosInstance.patch(`/documents/${id}/status`, { status });
  return res.data;
};

export const addPaymentToInvoice = async (id, paymentData) => {
  const res = await axiosInstance.post(`/documents/${id}/payments`, paymentData);
  return res.data;
};

export const convertDocument = async (id, newDocumentType, additionalData = {}) => {
  const res = await axiosInstance.post(`/documents/${id}/convert`, { 
    documentType: newDocumentType, 
    ...additionalData 
  });
  return res.data;
};

export const getDocumentStats = async (documentType = null) => {
  const params = documentType ? `?documentType=${documentType}` : '';
  const res = await axiosInstance.get(`/documents/stats${params}`);
  return res.data;
};

// Specific document type functions
export const createInvoice = (data) => createDocument('invoice', data);
export const createProforma = (data) => createDocument('proforma', data);
export const createEstimation = (data) => createDocument('estimation', data);

export const getAllInvoices = (filters) => getAllDocuments('invoice', filters);
export const getAllProformas = (filters) => getAllDocuments('proforma', filters);
export const getAllEstimations = (filters) => getAllDocuments('estimation', filters);

export const getInvoiceStats = () => getDocumentStats('invoice');
export const getProformaStats = () => getDocumentStats('proforma');
export const getEstimationStats = () => getDocumentStats('estimation');

// Conversion helpers
export const convertEstimationToProforma = (id, additionalData) => 
  convertDocument(id, 'proforma', additionalData);

export const convertEstimationToInvoice = (id, additionalData) => 
  convertDocument(id, 'invoice', additionalData);

export const convertProformaToInvoice = (id, additionalData) => 
  convertDocument(id, 'invoice', additionalData);

// Update your main app.js to include the new routes:
/*
import documentRoutes from './routes/documentRoutes.js';
import { invoiceRouter } from './routes/invoiceRoutes.js';

// Add to your app
app.use('/api/documents', documentRoutes);
app.use('/api/invoices', invoiceRouter); // Backward compatibility
*/

// Add to your frontend router:
/*
import Invoices from './pages/Invoices/Invoices';
import Proforma from './pages/Proforma/Proforma';
import Estimations from './pages/Estimations/Estimations';

// Add routes:
<Route path="/invoices" element={<Invoices />} />
<Route path="/proforma" element={<Proforma />} />
<Route path="/estimations" element={<Estimations />} />
*/