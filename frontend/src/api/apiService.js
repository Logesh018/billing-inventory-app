import { axiosInstance } from "../lib/axios";

class ApiService {
  // GET ALL
  async getAll(endpoint, params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `/${endpoint}?${queryString}` : `/${endpoint}`;
      const res = await axiosInstance.get(url);
      return res.data;
    } catch (error) {
      console.error(`API Error [GET ${endpoint}]:`, error);
      throw error;
    }
  }

  // GET BY ID
  async getById(endpoint, id) {
    try {
      const res = await axiosInstance.get(`/${endpoint}/${id}`);
      return res.data;
    } catch (error) {
      console.error(`API Error [GET ${endpoint}/${id}]:`, error);
      throw error;
    }
  }

 //POST
  async create(endpoint, data) {
    try {
      const res = await axiosInstance.post(`/${endpoint}`, data);
      return res.data;
    } catch (error) {
      console.error(`API Error [POST ${endpoint}]:`, error);
      throw error;
    }
  }

  // PUT
  async update(endpoint, id, data) {
    try {
      const res = await axiosInstance.put(`/${endpoint}/${id}`, data);
      return res.data;
    } catch (error) {
      console.error(`API Error [PUT ${endpoint}/${id}]:`, error);
      throw error;
    }
  }

  // DELETE
  async delete(endpoint, id) {
    try {
      await axiosInstance.delete(`/${endpoint}/${id}`);
      return { success: true };
    } catch (error) {
      console.error(`API Error [DELETE ${endpoint}/${id}]:`, error);
      throw error;
    }
  }


  // ORDERS
  getAllOrders(params) { return this.getAll('orders', params); }
  getOrderById(id) { return this.getById('orders', id); }
  createOrder(data) { return this.create('orders', data); }
  updateOrder(id, data) { return this.update('orders', id, data); }
  deleteOrder(id) { return this.delete('orders', id); }
  generateOrderPDF(id) { return this.customAction('orders', id, 'generate-pdf'); }

  // PURCHASES
  getAllPurchases(params) { return this.getAll('purchases', params); }
  getPurchaseById(id) { return this.getById('purchases', id); }
  createPurchase(data) { return this.create('purchases', data); }
  updatePurchase(id, data) { return this.update('purchases', id, data); }
  deletePurchase(id) { return this.delete('purchases', id); }
  completePurchase(id) { return this.patch('purchases', id, 'complete'); }
  searchSuppliers(query) { return this.search('purchases', 'search/suppliers', { q: query }); }

  // PRODUCTIONS
  getAllProductions(params) { return this.getAll('productions', params); }
  getProductionById(id) { return this.getById('productions', id); }
  createProduction(data) { return this.create('productions', data); }
  updateProduction(id, data) { return this.update('productions', id, data); }
  deleteProduction(id) { return this.delete('productions', id); }
  completeProduction(id) { return this.patch('productions', id, 'complete'); }

  // DOCUMENTS
  getAllDocuments(params) { return this.getAll('documents', params); }
  getDocumentById(id) { return this.getById('documents', id); }
  createDocument(data) { return this.create('documents', data); }
  updateDocument(id, data) { return this.update('documents', id, data); }
  deleteDocument(id) { return this.delete('documents', id); }
  generateDocumentPDF(id, template = 'modern') { 
    return this.customAction('documents', id, 'generate-pdf', { template }); 
  }
  downloadDocumentPDF(id) { 
    return this.downloadFile('documents', id, 'download', `document-${id}.pdf`); 
  }
  updateDocumentStatus(id, status) { 
    return this.patch('documents', id, 'status', { status }); 
  }
  convertDocument(id, newType, additionalData = {}) {
    return this.customAction('documents', id, 'convert', { documentType: newType, ...additionalData });
  }
}


export const apiService = new ApiService();
export default apiService;