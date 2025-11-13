// services/pdfService.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";
import { cloudinaryService } from "./cloudinaryService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PDFService {
  constructor() {
    this.browser = null;
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
      });
    }
    return this.browser;
  }

  loadTemplate(templateName) {
    const filePath = path.resolve(__dirname, './templates', `${templateName}.html`);
    console.log('📄 Loading template from:', filePath);

    if (!fs.existsSync(filePath)) {
      console.error('❌ Template file not found:', filePath);
      throw new Error(`Template file not found: ${filePath}`);
    }

    return fs.readFileSync(filePath, "utf-8");
  }

  renderTemplate(template, data) {
    let html = template;
    for (const key in data) {
      const value = data[key] ?? "";
      const regex = new RegExp(`{{${key}}}`, "g");
      html = html.replace(regex, value);
    }
    return html;
  }

  async generatePDFBuffer(htmlContent, options = {}) {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      await page.setContent(htmlContent, {
        waitUntil: ["networkidle0", "load"],
        timeout: 60000,
      });

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "0.4in",
          right: "0.4in",
          bottom: "0.4in",
          left: "0.4in",
        },
        ...options,
      });

      return pdfBuffer;
    } catch (error) {
      console.error("❌ PDF generation error:", error);
      throw new Error("Failed to generate PDF: " + error.message);
    } finally {
      await page.close();
    }
  }

  /** Generate items HTML with proper column alignment **/
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
        item.colors.forEach((color, colorIndex) => {
          const colorName = (color.colorName || '').toUpperCase();
          const sizes = color.sizes || [];

          // Product + color header (no colspan misalignment)
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

          sizes.forEach((size, sizeIndex) => {
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
        // Normal product (no color/size)
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

          // Collect all sizes for this color
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



  /** Count total size rows for rowspan (product name + all colors + all sizes) **/
  getTotalSizeRows(item) {
    let total = 1; // Product name row

    if (item.colors && item.colors.length > 0) {
      item.colors.forEach(color => {
        total += 1; // Color header row
        total += (color.sizes?.length || 0); // Size rows
      });
    }

    return total;
  }

  /** Generate Purchase Order PDF **/
  async generatePurchaseOrderPDF(purchaseOrder) {
    try {
      console.log(`📄 Generating Purchase Order PDF for PO: ${purchaseOrder.poNumber}`);

      const templateHTML = this.loadTemplate('purchaseOrderTemplate');

      // Generate items HTML for Purchase Order
      const itemsHTML = this.generatePurchaseOrderItemsHTML(purchaseOrder);

      // Calculate tax totals
      const cgst = purchaseOrder.taxes?.cgst || 0;
      const sgst = purchaseOrder.taxes?.sgst || 0;
      const igst = purchaseOrder.taxes?.igst || 0;

      // Build data for template
      const data = {
        poNumber: purchaseOrder.poNumber,
        poDate: new Date(purchaseOrder.poDate).toLocaleDateString("en-IN"),

        // Buyer (Your Business)
        "business.name": purchaseOrder.buyer?.name || "NILA TEXGARMENTS",
        "business.address": purchaseOrder.buyer?.address || "31/4, Kamaraj Nagar, Gandhi Nagar, Karamadai, Mettupalayam, Coimbatore 641104 TN",
        "business.gstin": purchaseOrder.buyer?.gstin || "33AAVFN6955C1ZX",

        // Supplier (Vendor)
        "supplier.name": purchaseOrder.supplier?.name || "",
        "supplier.address": purchaseOrder.supplier?.address || "",
        "supplier.gstin": purchaseOrder.supplier?.gstin || "",

        // Items
        items: itemsHTML,

        // Financials
        totalValue: purchaseOrder.totalValue?.toFixed(2) || "0.00",
        discount: purchaseOrder.discount?.toFixed(2) || "0.00",
        roundOff: purchaseOrder.roundOff?.toFixed(2) || "0.00",
        grandTotal: purchaseOrder.grandTotal?.toFixed(2) || "0.00",

        // Tax Details
        "taxDetails.cgst": cgst.toFixed(2),
        "taxDetails.sgst": sgst.toFixed(2),
        "taxDetails.igst": igst.toFixed(2),
      };

      console.log('📋 Purchase Order Data:', {
        poNumber: data.poNumber,
        supplier: data["supplier.name"],
        grandTotal: data.grandTotal
      });

      const filledHTML = this.renderTemplate(templateHTML, data);
      const pdfBuffer = await this.generatePDFBuffer(filledHTML);

      const filename = `purchase-order-${purchaseOrder.poNumber}-${Date.now()}`;
      const folder = 'purchase-orders';

      console.log(`📤 Uploading Purchase Order PDF to Cloudinary: ${folder}/${filename}`);

      const uploadResult = await cloudinaryService.uploadPDF(pdfBuffer, filename, folder);

      console.log('✅ Purchase Order PDF uploaded successfully:', uploadResult.url);

      return {
        buffer: pdfBuffer,
        url: uploadResult.url,
        publicId: uploadResult.publicId,
      };
    } catch (error) {
      console.error("❌ Purchase Order PDF generation error:", error);
      throw error;
    }
  }

  /** Generate items HTML for Purchase Order **/
  generatePurchaseOrderItemsHTML(purchaseOrder) {
    if (!purchaseOrder.items || purchaseOrder.items.length === 0) {
      return '<tr><td colspan="5" style="text-align: center;">No items</td></tr>';
    }

    let html = '';

    purchaseOrder.items.forEach((item, index) => {
      const description = item.description || 'N/A';
      const quantity = item.quantity || 0;
      const rate = parseFloat(item.rate || 0).toFixed(2);
      const amount = parseFloat(item.amount || 0).toFixed(2);

      // Calculate tax from amount and rate
      const subtotal = quantity * item.rate;
      const taxAmount = item.amount - subtotal;
      const taxPercent = subtotal > 0 ? ((taxAmount / subtotal) * 100).toFixed(0) : 0;

      html += `
      <tr>
        <td style="text-align: left;">${description}</td>
        <td style="text-align: center;">${taxPercent}%</td>
        <td style="text-align: center;">${quantity}</td>
        <td style="text-align: right;">₹${rate}</td>
        <td style="text-align: right;">₹${amount}</td>
      </tr>
    `;
    });
    return html;
  }

  /** Main PDF generator **/
  async generateDocumentPDF(document) {
    try {
      const { documentType, documentNo } = document;

      const typeMap = {
        invoice: "invoiceTemplate",
        proforma: "proformaTemplate",
        estimation: "estimationTemplate",
      };
      const templateName = typeMap[documentType] || "invoiceTemplate";

      console.log(`📄 Generating ${documentType} PDF using template: ${templateName}`);

      const templateHTML = this.loadTemplate(templateName);

      // === Split addresses into 2 lines ===
      const customerAddress = document.customerDetails?.address || "";
      const customerAddressParts = this.splitAddress(customerAddress);

      // === Generate items HTML based on document type ===
      const itemsHTML = documentType === 'proforma'
        ? this.generateItemsHTMLForProforma(document)
        : this.generateItemsHTML(document);

      // === Calculate tax breakdowns ===
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

      // For transportation (only for invoice/estimation)
      const transportCharges = document.transportationCharges || 0;
      const transportTaxRate = document.transportationTaxRate || 18;
      const transportTax = (transportCharges * transportTaxRate) / 100;
      const transportCgst = (transportTax / 2).toFixed(2);
      const transportSgst = (transportTax / 2).toFixed(2);

      // === Build data for template ===
      const data = {
        documentNo: document.documentNo,
        documentDate: new Date(document.documentDate).toLocaleDateString("en-IN"),
        orderNo: document.orderNo || "",
        orderDate: document.orderDate ? new Date(document.orderDate).toLocaleDateString("en-IN") : "",

        // Customer
        "customer.name": document.customerDetails?.name || "",
        "customer.addressLine1": customerAddressParts.line1,
        "customer.addressLine2": customerAddressParts.line2,
        "customer.gst": document.customerDetails?.gst || "",

        // Business
        "business.name": document.businessDetails?.name || "NILA TEXGARMENTS",
        "business.address": document.businessDetails?.address || "",
        "business.city": document.businessDetails?.city || "",
        "business.state": document.businessDetails?.state || "",
        "business.pincode": document.businessDetails?.pincode || "",
        "business.gst": document.businessDetails?.gst || "",
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
        transportationCharges: transportCharges.toFixed(2),
        transportationHsn: document.transportationHsn || "9966",
        transportationTaxRate: transportTaxRate,
        amountInWords: document.amountInWords || "Zero Rupees Only",

        // Tax Details
        "taxDetails.cgst2_5": cgst2_5,
        "taxDetails.sgst2_5": sgst2_5,
        "taxDetails.cgst9": transportCgst,
        "taxDetails.sgst9": transportSgst,
      };

      console.log('💰 Tax Breakdown:', {
        cgst2_5,
        sgst2_5,
        transportCgst,
        transportSgst
      });

      const filledHTML = this.renderTemplate(templateHTML, data);
      const pdfBuffer = await this.generatePDFBuffer(filledHTML);

      const filename = `${documentType}-${documentNo}-${Date.now()}`;
      const folder = `${documentType}s`;

      console.log(`📤 Uploading to Cloudinary: ${folder}/${filename}`);

      const uploadResult = await cloudinaryService.uploadPDF(pdfBuffer, filename, folder);

      console.log('✅ PDF uploaded successfully:', uploadResult.url);

      return {
        buffer: pdfBuffer,
        url: uploadResult.url,
        publicId: uploadResult.publicId,
      };
    } catch (error) {
      console.error("❌ Document PDF generation error:", error);
      throw error;
    }
  }

  /** Split long address into two lines **/
  splitAddress(address) {
    if (!address) return { line1: '', line2: '' };

    const maxLineLength = 45;
    if (address.length <= maxLineLength) {
      return { line1: address, line2: '' };
    }

    const commaIndex = address.indexOf(',', maxLineLength / 2);
    if (commaIndex > 0 && commaIndex < maxLineLength) {
      return {
        line1: address.substring(0, commaIndex).trim(),
        line2: address.substring(commaIndex + 1).trim()
      };
    }

    const spaceIndex = address.lastIndexOf(' ', maxLineLength);
    if (spaceIndex > 0) {
      return {
        line1: address.substring(0, spaceIndex).trim(),
        line2: address.substring(spaceIndex + 1).trim()
      };
    }

    return {
      line1: address.substring(0, maxLineLength).trim(),
      line2: address.substring(maxLineLength).trim()
    };
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export const pdfService = new PDFService();

process.on("SIGINT", async () => {
  console.log('🛑 Closing PDF service browser...');
  await pdfService.closeBrowser();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log('🛑 Closing PDF service browser...');
  await pdfService.closeBrowser();
  process.exit(0);
});