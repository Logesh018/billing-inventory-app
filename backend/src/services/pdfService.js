// services/pdfService.js
import puppeteer from 'puppeteer';
import { cloudinaryService } from './cloudinaryService.js';

class PDFService {
  constructor() {
    this.browser = null;
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
    }
    return this.browser;
  }

  async generatePDFBuffer(htmlContent, options = {}) {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      await page.setContent(htmlContent, {
        waitUntil: ['networkidle0', 'load'],
        timeout: 60000
      });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in',
        },
        ...options
      });

      return pdfBuffer;
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error('Failed to generate PDF: ' + error.message);
    } finally {
      await page.close();
    }
  }

  async generateDocumentPDF(document, template = 'modern') {
    try {
      const { documentType, documentNo } = document;
      const htmlContent = this.generateDocumentHTML(document, template);

      console.log('Generated HTML:', htmlContent.substring(0, 500) + '...');

      const pdfBuffer = await this.generatePDFBuffer(htmlContent);

      const filename = `${documentType}-${documentNo}-${Date.now()}`;
      const folder = `${documentType}s`;
      const uploadResult = await cloudinaryService.uploadPDF(pdfBuffer, filename, folder);

      return {
        buffer: pdfBuffer,
        url: uploadResult.url,
        publicId: uploadResult.publicId,
      };
    } catch (error) {
      console.error('Document PDF generation error:', error);
      throw error;
    }
  }

  generateDocumentHTML(document, template = 'modern') {
    if (document.documentType === 'purchase-estimation') {
      return this.purchaseEstimationTemplate(document);
    }

    switch (template) {
      case 'classic':
        return this.classicTemplate(document);
      case 'minimal':
        return this.minimalTemplate(document);
      case 'modern':
      default:
        return this.modernTemplate(document);
    }
  }

  modernTemplate(document) {
    const { documentType, documentNo, documentDate, customerDetails, businessDetails, items, customization, status, paymentTerms, dueDate, validUntil, notes } = document;
    const title = documentType.charAt(0).toUpperCase() + documentType.slice(1);

    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalDiscount = items.reduce((sum, item) => sum + (item.discountType === 'percentage' ? (item.quantity * item.unitPrice * item.discount) / 100 : item.discount), 0);
    const totalTax = items.reduce((sum, item) => sum + ((item.quantity * item.unitPrice - (item.discountType === 'percentage' ? (item.quantity * item.unitPrice * item.discount) / 100 : item.discount)) * item.taxRate / 100), 0);
    const grandTotal = subtotal - totalDiscount + totalTax;

    const dateField = documentType === 'invoice' ? 'dueDate' : 'validUntil';
    const dateLabel = documentType === 'invoice' ? 'Due' : 'Valid Until';
    const dateValue = document[dateField] ? new Date(document[dateField]).toLocaleDateString() : 'N/A';

    const primaryColor = customization?.primaryColor || '#2563eb';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title} ${documentNo}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Arial', sans-serif; color: #1f2937; line-height: 1.6; }
          .invoice-container { max-width: 800px; margin: 0 auto; padding: 40px; background: white; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid ${primaryColor}; }
          .business-info h1 { font-size: 28px; font-weight: 700; color: ${primaryColor}; margin-bottom: 10px; }
          .business-info p { color: #6b7280; margin-bottom: 4px; }
          .invoice-title { text-align: right; }
          .invoice-title h2 { font-size: 36px; font-weight: 300; color: #1f2937; margin-bottom: 8px; }
          .invoice-meta { text-align: right; color: #6b7280; }
          .invoice-details { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
          .section-title { font-size: 14px; font-weight: 600; color: ${primaryColor}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
          .customer-info p, .invoice-info p { margin-bottom: 6px; color: #374151; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
          .items-table th { background: ${primaryColor}; color: white; padding: 16px 12px; text-align: left; font-weight: 600; font-size: 14px; }
          .items-table td { padding: 16px 12px; border-bottom: 1px solid #e5e7eb; color: #374151; }
          .items-table tr:nth-child(even) { background: #f9fafb; }
          .text-right { text-align: right; }
          .totals-section { display: flex; justify-content: flex-end; margin-bottom: 30px; }
          .totals-table { min-width: 300px; }
          .totals-table tr td { padding: 8px 12px; border: none; }
          .totals-table tr:last-child { border-top: 2px solid ${primaryColor}; font-weight: 700; font-size: 18px; color: ${primaryColor}; }
          .notes { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
          .notes h3 { font-size: 16px; color: #374151; margin-bottom: 12px; }
          .notes p { color: #6b7280; font-size: 14px; line-height: 1.7; }
          .footer { margin-top: 50px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
          @media print { .invoice-container { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <div class="business-info">
              <h1>${businessDetails.name}</h1>
              <p>${businessDetails.address}</p>
              <p>${businessDetails.city}, ${businessDetails.state} ${businessDetails.pincode}</p>
              ${businessDetails.phone ? `<p>Phone: ${businessDetails.phone}</p>` : ''}
              ${businessDetails.email ? `<p>Email: ${businessDetails.email}</p>` : ''}
              ${businessDetails.gst ? `<p>GST: ${businessDetails.gst}</p>` : ''}
            </div>
            <div class="invoice-title">
              <h2>${title.toUpperCase()}</h2>
              <div class="invoice-meta">
                <p><strong>${documentNo}</strong></p>
                <p>Date: ${new Date(documentDate).toLocaleDateString()}</p>
                <p>${dateLabel}: ${dateValue}</p>
              </div>
            </div>
          </div>
          <div class="invoice-details">
            <div class="bill-to">
              <h3 class="section-title">Bill To</h3>
              <div class="customer-info">
                <p><strong>${customerDetails.name || 'N/A'}</strong></p>
                ${customerDetails.company ? `<p>${customerDetails.company}</p>` : ''}
                ${customerDetails.address ? `<p>${customerDetails.address}</p>` : ''}
                ${customerDetails.mobile ? `<p>Phone: ${customerDetails.mobile}</p>` : ''}
                ${customerDetails.email ? `<p>Email: ${customerDetails.email}</p>` : ''}
                ${customerDetails.gst ? `<p>GST: ${customerDetails.gst}</p>` : ''}
              </div>
            </div>
            <div class="payment-info">
              <h3 class="section-title">${title} Details</h3>
              <div class="invoice-info">
                ${documentType === 'invoice' ? `<p>Terms: ${paymentTerms || 'N/A'}</p>` : ''}
                <p>Status: <strong>${status || 'Draft'}</strong></p>
                ${documentType === 'invoice' && document.balanceAmount > 0 ? `<p style="color: #dc2626;">Balance Due: ₹${(document.balanceAmount || 0).toLocaleString()}</p>` : ''}
              </div>
            </div>
          </div>
          <table class="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>HSN</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Rate</th>
                <th class="text-right">Discount</th>
                <th class="text-right">Tax</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${items && items.length > 0 ? items.map(item => {
                const lineTotal = item.quantity * item.unitPrice - (item.discountType === 'percentage' ? (item.quantity * item.unitPrice * item.discount) / 100 : item.discount) + ((item.quantity * item.unitPrice - (item.discountType === 'percentage' ? (item.quantity * item.unitPrice * item.discount) / 100 : item.discount)) * item.taxRate / 100);
                return `
                  <tr>
                    <td>
                      <strong>${item.productDetails.name || 'N/A'}</strong>
                      ${item.productDetails.description ? `<br><span style="color: #6b7280; font-size: 12px;">${item.productDetails.description}</span>` : ''}
                    </td>
                    <td>${item.productDetails.hsn || '-'}</td>
                    <td class="text-right">${item.quantity || 0}</td>
                    <td class="text-right">₹${(item.unitPrice || 0).toLocaleString()}</td>
                    <td class="text-right">
                      ${item.discount > 0 ? (item.discountType === 'percentage' ? `${item.discount}%` : `₹${item.discount}`) : '-'}
                    </td>
                    <td class="text-right">${(item.taxRate || 0)}%</td>
                    <td class="text-right">₹${lineTotal.toLocaleString()}</td>
                  </tr>
                `;
              }).join('') : '<tr><td colspan="7">No items available</td></tr>'}
            </tbody>
          </table>
          <div class="totals-section">
            <table class="totals-table">
              <tr><td>Subtotal:</td><td class="text-right">₹${subtotal.toLocaleString()}</td></tr>
              ${totalDiscount > 0 ? `<tr><td>Discount:</td><td class="text-right">-₹${totalDiscount.toLocaleString()}</td></tr>` : ''}
              <tr><td>Total Tax:</td><td class="text-right">₹${totalTax.toLocaleString()}</td></tr>
              <tr><td><strong>Total:</strong></td><td class="text-right"><strong>₹${grandTotal.toLocaleString()}</strong></td></tr>
            </table>
          </div>
          ${notes ? `<div class="notes"><h3>Notes</h3><p>${notes}</p></div>` : ''}
          <div class="footer">
            <p>Thank you for your business!</p>
            ${businessDetails.website ? `<p>${businessDetails.website}</p>` : ''}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  purchaseEstimationTemplate(document) {
    const {
      documentNo, documentDate, businessDetails,
      fabricPurchases = [], buttonsPurchases = [], packetsPurchases = [],
      totalFabricCost = 0, totalButtonsCost = 0, totalPacketsCost = 0,
      totalFabricGst = 0, totalButtonsGst = 0, totalPacketsGst = 0,
      grandTotalCost = 0, grandTotalWithGst = 0, remarks, status
    } = document;

    const primaryColor = '#10b981';
    const formatPurchaseMode = (mode) => {
      const modeMap = { 'kg': 'per KG', 'meter': 'per Meter', 'piece': 'per Piece', 'pieces': 'per Piece', 'qty': 'per Qty', 'packet': 'per Packet' };
      return modeMap[mode] || mode;
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Purchase Estimation ${documentNo}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Arial', sans-serif; color: #1f2937; line-height: 1.6; }
          .estimation-container { max-width: 800px; margin: 0 auto; padding: 40px; background: white; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid ${primaryColor}; }
          .business-info h1 { font-size: 28px; font-weight: 700; color: ${primaryColor}; margin-bottom: 10px; }
          .business-info p { color: #6b7280; margin-bottom: 4px; font-size: 13px; }
          .estimation-title { text-align: right; }
          .estimation-title h2 { font-size: 32px; font-weight: 300; color: #1f2937; margin-bottom: 8px; }
          .estimation-meta { text-align: right; color: #6b7280; font-size: 13px; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; margin-top: 8px; background: ${status === 'Finalized' ? '#dcfce7' : '#fef3c7'}; color: ${status === 'Finalized' ? '#15803d' : '#a16207'}; }
          .section-title { font-size: 18px; font-weight: 700; color: ${primaryColor}; margin: 30px 0 15px 0; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #e5e7eb; }
          .items-table th { background: ${primaryColor}; color: white; padding: 12px 10px; text-align: left; font-weight: 600; font-size: 12px; }
          .items-table td { padding: 10px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 12px; }
          .items-table tr:nth-child(even) { background: #f9fafb; }
          .items-table tr:last-child td { border-bottom: none; }
          .text-right { text-align: right; }
          .vendor-cell { font-weight: 600; color: #1f2937; }
          .colors-cell { font-size: 11px; color: #6b7280; }
          .summary-section { margin-top: 30px; background: #f9fafb; padding: 20px; border-radius: 8px; }
          .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .summary-item { text-align: center; padding: 15px; background: white; border-radius: 6px; border: 1px solid #e5e7eb; }
          .summary-item .label { font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 5px; }
          .summary-item .value { font-size: 20px; font-weight: 700; color: #1f2937; }
          .summary-item .gst { font-size: 11px; color: #10b981; margin-top: 3px; }
          .totals-table { width: 100%; margin-top: 10px; }
          .totals-table tr td { padding: 8px 0; border: none; }
          .totals-table tr { border-bottom: 1px solid #e5e7eb; }
          .totals-table tr:last-child { border-top: 2px solid ${primaryColor}; border-bottom: none; }
          .totals-table tr:last-child td { font-weight: 700; font-size: 20px; color: ${primaryColor}; padding-top: 12px; }
          .notes { margin-top: 30px; padding: 15px; background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px; }
          .notes h3 { font-size: 14px; color: #92400e; margin-bottom: 8px; font-weight: 600; }
          .notes p { color: #78350f; font-size: 13px; line-height: 1.6; }
          .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 11px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
          .no-items { text-align: center; padding: 30px; color: #9ca3af; font-style: italic; }
          @media print { .estimation-container { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="estimation-container">
          <div class="header">
            <div class="business-info">
              <h1>${businessDetails.name}</h1>
              <p>${businessDetails.address}</p>
              <p>${businessDetails.city}, ${businessDetails.state} ${businessDetails.pincode}</p>
              ${businessDetails.phone ? `<p>Phone: ${businessDetails.phone}</p>` : ''}
              ${businessDetails.email ? `<p>Email: ${businessDetails.email}</p>` : ''}
              ${businessDetails.gst ? `<p>GST: ${businessDetails.gst}</p>` : ''}
            </div>
            <div class="estimation-title">
              <h2>PURCHASE ESTIMATION</h2>
              <div class="estimation-meta">
                <p><strong>${documentNo}</strong></p>
                <p>Date: ${new Date(documentDate).toLocaleDateString('en-IN')}</p>
                <div class="status-badge">${status}</div>
              </div>
            </div>
          </div>

          ${fabricPurchases.length > 0 ? `
            <h3 class="section-title">Fabric Purchases</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Fabric Type</th><th>Vendor</th><th>GSM</th><th>Colors</th>
                  <th class="text-right">Qty</th><th class="text-right">Unit</th>
                  <th class="text-right">Rate</th><th class="text-right">GST %</th><th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${fabricPurchases.map(item => {
                  const colors = item.colors && item.colors.length > 0 ? item.colors.join(', ') : '-';
                  return `
                    <tr>
                      <td><strong>${item.fabricType || item.productName}</strong></td>
                      <td class="vendor-cell">${item.vendor}${item.vendorCode ? `<br><span style="font-size: 10px; color: #6b7280;">${item.vendorCode}</span>` : ''}</td>
                      <td>${item.gsm || '-'}</td>
                      <td class="colors-cell">${colors}</td>
                      <td class="text-right">${item.quantity || 0}</td>
                      <td class="text-right" style="font-size: 10px;">${formatPurchaseMode(item.purchaseMode)}</td>
                      <td class="text-right">₹${(item.costPerUnit || 0).toLocaleString()}</td>
                      <td class="text-right">${item.gstPercentage || 0}%</td>
                      <td class="text-right"><strong>₹${(item.totalWithGst || 0).toLocaleString()}</strong></td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          ` : ''}

          ${buttonsPurchases.length > 0 ? `
            <h3 class="section-title">Buttons Purchases</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item Name</th><th>Vendor</th><th>Size</th><th>Color</th>
                  <th class="text-right">Qty</th><th class="text-right">Unit</th>
                  <th class="text-right">Rate</th><th class="text-right">GST %</th><th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${buttonsPurchases.map(item => `
                  <tr>
                    <td><strong>${item.productName}</strong></td>
                    <td class="vendor-cell">${item.vendor}${item.vendorCode ? `<br><span style="font-size: 10px; color: #6b7280;">${item.vendorCode}</span>` : ''}</td>
                    <td>${item.size || '-'}</td>
                    <td>${item.color || '-'}</td>
                    <td class="text-right">${item.quantity || 0}</td>
                    <td class="text-right" style="font-size: 10px;">${formatPurchaseMode(item.purchaseMode)}</td>
                    <td class="text-right">₹${(item.costPerUnit || 0).toLocaleString()}</td>
                    <td class="text-right">${item.gstPercentage || 0}%</td>
                    <td class="text-right"><strong>₹${(item.totalWithGst || 0).toLocaleString()}</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}

          ${packetsPurchases.length > 0 ? `
            <h3 class="section-title">Packets Purchases</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item Name</th><th>Vendor</th><th>Size</th><th>Type</th>
                  <th class="text-right">Qty</th><th class="text-right">Unit</th>
                  <th class="text-right">Rate</th><th class="text-right">GST %</th><th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${packetsPurchases.map(item => `
                  <tr>
                    <td><strong>${item.productName}</strong></td>
                    <td class="vendor-cell">${item.vendor}${item.vendorCode ? `<br><span style="font-size: 10px; color: #6b7280;">${item.vendorCode}</span>` : ''}</td>
                    <td>${item.size || '-'}</td>
                    <td>${item.packetType || '-'}</td>
                    <td class="text-right">${item.quantity || 0}</td>
                    <td class="text-right" style="font-size: 10px;">${formatPurchaseMode(item.purchaseMode)}</td>
                    <td class="text-right">₹${(item.costPerUnit || 0).toLocaleString()}</td>
                    <td class="text-right">${item.gstPercentage || 0}%</td>
                    <td class="text-right"><strong>₹${(item.totalWithGst || 0).toLocaleString()}</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}

          ${fabricPurchases.length === 0 && buttonsPurchases.length === 0 && packetsPurchases.length === 0 ? `
            <div class="no-items">No purchase items available</div>
          ` : ''}

          <div class="summary-section">
            <h3 class="section-title" style="margin-top: 0; border: none;">Cost Summary</h3>
            <div class="summary-grid">
              ${fabricPurchases.length > 0 ? `<div class="summary-item"><div class="label">Fabric</div><div class="value">₹${totalFabricCost.toLocaleString()}</div><div class="gst">+ ₹${totalFabricGst.toLocaleString()} GST</div></div>` : ''}
              ${buttonsPurchases.length > 0 ? `<div class="summary-item"><div class="label">Buttons</div><div class="value">₹${totalButtonsCost.toLocaleString()}</div><div class="gst">+ ₹${totalButtonsGst.toLocaleString()} GST</div></div>` : ''}
              ${packetsPurchases.length > 0 ? `<div class="summary-item"><div class="label">Packets</div><div class="value">₹${totalPacketsCost.toLocaleString()}</div><div class="gst">+ ₹${totalPacketsGst.toLocaleString()} GST</div></div>` : ''}
            </div>
            <table class="totals-table">
              <tr><td>Subtotal (Before GST):</td><td class="text-right">₹${grandTotalCost.toLocaleString()}</td></tr>
              <tr><td>Total GST:</td><td class="text-right">₹${(totalFabricGst + totalButtonsGst + totalPacketsGst).toLocaleString()}</td></tr>
              <tr><td><strong>Grand Total:</strong></td><td class="text-right"><strong>₹${grandTotalWithGst.toLocaleString()}</strong></td></tr>
            </table>
          </div>

          ${remarks ? `<div class="notes"><h3>Remarks</h3><p>${remarks}</p></div>` : ''}

          <div class="footer">
            <p>This is a computer-generated purchase estimation</p>
            <p>Generated on ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  classicTemplate(document) {
    return this.modernTemplate(document);
  }

  minimalTemplate(document) {
    return this.modernTemplate(document);
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export const pdfService = new PDFService();

process.on('SIGINT', async () => {
  await pdfService.closeBrowser();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await pdfService.closeBrowser();
  process.exit(0);
});