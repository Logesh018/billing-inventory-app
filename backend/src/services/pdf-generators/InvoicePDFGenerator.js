// services/pdf-generators/InvoicePDFGenerator.js
import { BasePDFGenerator } from './BasePDFGenerator.js';

export class InvoicePDFGenerator extends BasePDFGenerator {
  /**
   * Generate Invoice/Proforma/Estimation PDF
   */
  async generate(document, cloudinaryService) {
    try {
      const { documentType, documentNo } = document;

      const typeMap = {
        invoice: "invoiceTemplate",
        proforma: "proformaTemplate",
        estimation: "estimationTemplate",
      };
      const templateName = typeMap[documentType] || "invoiceTemplate";

      console.log(`📄 Generating ${documentType} PDF using template: ${templateName}`);

      let templateHTML = this.pdfService.loadTemplate(templateName);

      // Inject business header with base64 logo
      const logoBase64 = this.pdfService.getLogoAsBase64();
      templateHTML = this.pdfService.injectBusinessHeader(templateHTML, logoBase64);

      // Split addresses into 2 lines
      const customerAddress = document.customerDetails?.address || "";
      const customerAddressParts = this.splitAddress(customerAddress);

      // Generate items HTML based on document type
      const itemsHTML = documentType === 'proforma'
        ? this.generateItemsHTMLForProforma(document)
        : this.generateItemsHTML(document);

      // Calculate tax breakdowns
      const taxBreakdown = this.calculateTaxBreakdown(document);

      // Build data for template
      const data = {
        documentNo: document.documentNo,
        documentDate: this.formatDate(document.documentDate),
        orderNo: document.orderNo || "",
        orderDate: document.orderDate ? this.formatDate(document.orderDate) : "",

        // Customer
        "customer.name": document.customerDetails?.name || "",
        "customer.addressLine1": customerAddressParts.line1,
        "customer.addressLine2": customerAddressParts.line2,
        "customer.gst": document.customerDetails?.gst || "",

        // Business (Only PAN and bank details needed, rest is in header)
        "business.pan": document.businessDetails?.pan || "",
        "business.accountNumber": document.businessDetails?.accountNumber || "",
        "business.ifsc": document.businessDetails?.ifsc || "",
        "business.branch": document.businessDetails?.branch || "",
        "business.bankName": document.businessDetails?.bankName || "",

        // Items
        items: itemsHTML,

        // Financials
        subtotal: document.subtotal?.toFixed(2) || "0.00",
        grandTotal: document.grandTotal?.toFixed(2) || "0.00",
        transportationCharges: taxBreakdown.transportCharges.toFixed(2),
        transportationHsn: document.transportationHsn || "9966",
        transportationTaxRate: taxBreakdown.transportTaxRate,
        amountInWords: document.amountInWords || "Zero Rupees Only",

        // Tax Details
        "taxDetails.cgst2_5": taxBreakdown.cgst2_5,
        "taxDetails.sgst2_5": taxBreakdown.sgst2_5,
        "taxDetails.cgst9": taxBreakdown.transportCgst,
        "taxDetails.sgst9": taxBreakdown.transportSgst,
      };

      console.log('💰 Tax Breakdown:', {
        cgst2_5: taxBreakdown.cgst2_5,
        sgst2_5: taxBreakdown.sgst2_5,
        transportCgst: taxBreakdown.transportCgst,
        transportSgst: taxBreakdown.transportSgst
      });

      const filledHTML = this.pdfService.renderTemplate(templateHTML, data);

      const filename = `${documentType}-${documentNo}-${Date.now()}`;
      const folder = `${documentType}s`;

      return await this.generateAndUpload(filledHTML, filename, folder, cloudinaryService);
    } catch (error) {
      console.error("❌ Document PDF generation error:", error);
      throw error;
    }
  }

  /**
   * Calculate tax breakdown
   */
  calculateTaxBreakdown(document) {
    // Product tax @ 5%
    const productTax5 = document.items
      .filter(item => item.taxRate === 5)
      .reduce((sum, item) => {
        let itemTotal = 0;
        if (item.colors && item.colors.length > 0) {
          item.colors.forEach(color => {
            color.sizes.forEach(size => {
              itemTotal += (size.quantity || 0) * (size.unitPrice || 0);
            });
          });
        } else {
          itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
        }
        return sum + (itemTotal * 5) / 100;
      }, 0);

    const cgst2_5 = (productTax5 / 2).toFixed(2);
    const sgst2_5 = (productTax5 / 2).toFixed(2);

    // Transportation charges
    const transportCharges = document.transportationCharges || 0;
    const transportTaxRate = document.transportationTaxRate || 18;
    const transportTax = (transportCharges * transportTaxRate) / 100;
    const transportCgst = (transportTax / 2).toFixed(2);
    const transportSgst = (transportTax / 2).toFixed(2);

    return {
      cgst2_5,
      sgst2_5,
      transportCharges,
      transportTaxRate,
      transportCgst,
      transportSgst
    };
  }

  /**
   * Generate items HTML with proper column alignment
   */
  generateItemsHTML(document) {
    if (!document.items || document.items.length === 0) {
      return '<tr><td colspan="6" class="left">No items</td></tr>';
    }

    let html = '';

    document.items.forEach((item) => {
      const name = item.productDetails?.name || 'N/A';
      const desc = item.productDetails?.description || '';
      const hsn = item.productDetails?.hsn || '';

      if (item.colors && item.colors.length > 0) {
        item.colors.forEach((color) => {
          const colorName = (color.colorName || '').toUpperCase();
          const sizes = color.sizes || [];

          html += `
          <tr class="no-bottom-border">
            <td class="left"><strong>${name}${desc ? '<br>' + desc : ''}</strong><br>COLOUR ${colorName}</td>
            <td class="center">${hsn}</td>
            <td class="center"></td>
            <td class="center"></td>
            <td class="center"></td>
            <td class="center"></td>
          </tr>
        `;

          sizes.forEach((size) => {
            const sizeName = size.sizeName || '';
            const qty = size.quantity || 0;
            const rate = parseFloat(size.unitPrice || 0).toFixed(2);
            const amount = (qty * size.unitPrice).toFixed(2);

            html += `
            <tr class="bottom-border">
              <td class="left" style="padding-left: 20px;">SIZE - ${sizeName}</td>
              <td class="center"></td>
              <td class="center">${qty}</td>
              <td class="center">Pcs</td>
              <td class="right">${rate}</td>
              <td class="right">${amount}</td>
            </tr>
          `;
          });
        });
      } else {
        const qty = item.quantity || 0;
        const rate = parseFloat(item.unitPrice || 0).toFixed(2);
        const amount = (qty * item.unitPrice).toFixed(2);

        html += `
        <tr class="bottom-border">
          <td class="left">${name}${desc ? '<br>' + desc : ''}</td>
          <td class="center">${hsn}</td>
          <td class="center">${qty}</td>
          <td class="center">Pcs</td>
          <td class="right">${rate}</td>
          <td class="right">${amount}</td>
        </tr>
      `;
      }
    });

    return html;
  }

  /**
   * Generate items HTML for Proforma
   */
  generateItemsHTMLForProforma(document) {
    if (!document.items || document.items.length === 0) {
      return '<tr><td colspan="8" class="left">No items</td></tr>';
    }

    let html = '';

    document.items.forEach((item) => {
      const name = item.productDetails?.name || 'N/A';
      const hsn = item.productDetails?.hsn || '';
      const taxRate = item.taxRate || 5;

      if (item.colors && item.colors.length > 0) {
        item.colors.forEach((color) => {
          const colorName = (color.colorName || '').toUpperCase();
          const sizes = color.sizes || [];

          const sizeNames = sizes.map(s => s.sizeName).join(', ');
          const totalQty = sizes.reduce((sum, s) => sum + (s.quantity || 0), 0);
          const avgRate = sizes[0]?.unitPrice || 0;
          const totalAmount = sizes.reduce((sum, s) => sum + ((s.quantity || 0) * (s.unitPrice || 0)), 0).toFixed(2);

          html += `
          <tr>
            <td class="left">${name}</td>
            <td class="center">${hsn}</td>
            <td class="center">${sizeNames}</td>
            <td class="center">${colorName}</td>
            <td class="center">${totalQty}</td>
            <td class="right">${avgRate.toFixed(2)}</td>
            <td class="center">${taxRate}%</td>
            <td class="right">${totalAmount}</td>
          </tr>
        `;
        });
      } else {
        const qty = item.quantity || 0;
        const rate = parseFloat(item.unitPrice || 0).toFixed(2);
        const amount = (qty * item.unitPrice).toFixed(2);

        html += `
        <tr>
          <td class="left">${name}</td>
          <td class="center">${hsn}</td>
          <td class="center">-</td>
          <td class="center">-</td>
          <td class="center">${qty}</td>
          <td class="right">${rate}</td>
          <td class="center">${taxRate}%</td>
          <td class="right">${amount}</td>
        </tr>
      `;
      }
    });

    return html;
  }
}