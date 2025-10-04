// services/pdfService.js
import puppeteer from 'puppeteer';
import { cloudinaryService } from './cloudinaryService.js';

class PDFService {
  constructor() {
    this.browser = null;
  }

  // Initialize browser (reuse for performance)
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

  // Generate PDF from HTML
  async generatePDFBuffer(htmlContent, options = {}) {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      // Set content with extended timeout and wait conditions
      await page.setContent(htmlContent, {
        waitUntil: ['networkidle0', 'load'],
        timeout: 60000 // Increased timeout to ensure content loads
      });

      // Generate PDF with improved options
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

  // Generate and upload a document PDF (generic function)
  async generateDocumentPDF(document, template = 'modern') {
    try {
      const { documentType, documentNo } = document;
      // Generate HTML content
      const htmlContent = this.generateDocumentHTML(document, template);

      // Log HTML for debugging
      console.log('Generated HTML:', htmlContent.substring(0, 500) + '...'); // Log first 500 chars

      // Generate PDF buffer
      const pdfBuffer = await this.generatePDFBuffer(htmlContent);

      // Upload to Cloudinary with dynamic filename and folder
      const filename = `${documentType}-${documentNo}-${Date.now()}`;
      const folder = `${documentType}s`; // e.g., 'invoices', 'proformas'
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

  // Generate HTML content for any document
  generateDocumentHTML(document, template = 'modern') {
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

  // Modern template - now generic for all documents
  modernTemplate(document) {
    const { documentType, documentNo, documentDate, customerDetails, businessDetails, items, customization, status, paymentTerms, dueDate, validUntil, notes } = document;
    const title = documentType.charAt(0).toUpperCase() + documentType.slice(1); // Invoice, Proforma, Estimation

    // Calculate totals if not present (fallback)
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalDiscount = items.reduce((sum, item) => sum + (item.discountType === 'percentage' ? (item.quantity * item.unitPrice * item.discount) / 100 : item.discount), 0);
    const totalTax = items.reduce((sum, item) => sum + ((item.quantity * item.unitPrice - (item.discountType === 'percentage' ? (item.quantity * item.unitPrice * item.discount) / 100 : item.discount)) * item.taxRate / 100), 0);
    const grandTotal = subtotal - totalDiscount + totalTax;

    // Determine due date or valid until date
    const dateField = documentType === 'invoice' ? 'dueDate' : 'validUntil';
    const dateLabel = documentType === 'invoice' ? 'Due' : 'Valid Until';
    const dateValue = document[dateField] ? new Date(document[dateField]).toLocaleDateString() : 'N/A';

    // Fallback for customization
    const primaryColor = customization?.primaryColor || '#2563eb';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title} ${documentNo}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            color: #1f2937;
            line-height: 1.6;
          }
          
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
            background: white;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid ${primaryColor};
          }
          
          .business-info h1 {
            font-size: 28px;
            font-weight: 700;
            color: ${primaryColor};
            margin-bottom: 10px;
          }
          
          .business-info p {
            color: #6b7280;
            margin-bottom: 4px;
          }
          
          .invoice-title {
            text-align: right;
          }
          
          .invoice-title h2 {
            font-size: 36px;
            font-weight: 300;
            color: #1f2937;
            margin-bottom: 8px;
          }
          
          .invoice-meta {
            text-align: right;
            color: #6b7280;
          }
          
          .invoice-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
          }
          
          .section-title {
            font-size: 14px;
            font-weight: 600;
            color: ${primaryColor};
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
          }
          
          .customer-info p, .invoice-info p {
            margin-bottom: 6px;
            color: #374151;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          
          .items-table th {
            background: ${primaryColor};
            color: white;
            padding: 16px 12px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
          }
          
          .items-table td {
            padding: 16px 12px;
            border-bottom: 1px solid #e5e7eb;
            color: #374151;
          }
          
          .items-table tr:nth-child(even) {
            background: #f9fafb;
          }
          
          .text-right {
            text-align: right;
          }
          
          .totals-section {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
          }
          
          .totals-table {
            min-width: 300px;
          }
          
          .totals-table tr td {
            padding: 8px 12px;
            border: none;
          }
          
          .totals-table tr:last-child {
            border-top: 2px solid ${primaryColor};
            font-weight: 700;
            font-size: 18px;
            color: ${primaryColor};
          }
          
          .notes {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
          
          .notes h3 {
            font-size: 16px;
            color: #374151;
            margin-bottom: 12px;
          }
          
          .notes p {
            color: #6b7280;
            font-size: 14px;
            line-height: 1.7;
          }
          
          .footer {
            margin-top: 50px;
            text-align: center;
            color: #9ca3af;
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
          }
          
          @media print {
            .invoice-container {
              padding: 20px;
            }
          }
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
              <tr>
                <td>Subtotal:</td>
                <td class="text-right">₹${subtotal.toLocaleString()}</td>
              </tr>
              ${totalDiscount > 0 ? `
                <tr>
                  <td>Discount:</td>
                  <td class="text-right">-₹${totalDiscount.toLocaleString()}</td>
                </tr>
              ` : ''}
              <tr>
                <td>Total Tax:</td>
                <td class="text-right">₹${totalTax.toLocaleString()}</td>
              </tr>
              <tr>
                <td><strong>Total:</strong></td>
                <td class="text-right"><strong>₹${grandTotal.toLocaleString()}</strong></td>
              </tr>
            </table>
          </div>
          
          ${notes ? `
            <div class="notes">
              <h3>Notes</h3>
              <p>${notes}</p>
            </div>
          ` : ''}
          
          <div class="footer">
            <p>Thank you for your business!</p>
            ${businessDetails.website ? `<p>${businessDetails.website}</p>` : ''}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Classic template (you can create multiple templates)
  classicTemplate(document) {
    // Placeholder - use modern template for now
    return this.modernTemplate(document);
  }

  // Minimal template
  minimalTemplate(document) {
    // Placeholder - use modern template for now
    return this.modernTemplate(document);
  }

  // Close browser when shutting down
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export const pdfService = new PDFService();

// Graceful shutdown
process.on('SIGINT', async () => {
  await pdfService.closeBrowser();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await pdfService.closeBrowser();
  process.exit(0);
});