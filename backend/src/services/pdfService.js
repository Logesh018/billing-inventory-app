import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";
import { cloudinaryService } from "./cloudinaryService.js";

import { OrderPDFGenerator } from './pdf-generators/OrderPDFGenerator.js';
import { InvoicePDFGenerator } from './pdf-generators/InvoicePDFGenerator.js';
import { PurchaseOrderPDFGenerator } from './pdf-generators/PurchaseOrderPDFGenerator.js';
import { NotePDFGenerator } from './pdf-generators/NotePDFGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PDFService {
  constructor() {
    this.browser = null;
    this.headerTemplate = null;

    // Initialize all generators
    this.orderGenerator = new OrderPDFGenerator(this);
    this.invoiceGenerator = new InvoicePDFGenerator(this);
    this.purchaseOrderGenerator = new PurchaseOrderPDFGenerator(this);
    this.noteGenerator = new NotePDFGenerator(this);
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

  /**
   * Load header template (cached for performance)
   */
  loadHeaderTemplate() {
    if (!this.headerTemplate) {
      const filePath = path.resolve(__dirname, './templates', 'headerTemplate.html');
      console.log('📄 Loading header template from:', filePath);

      if (!fs.existsSync(filePath)) {
        console.error('❌ Header template file not found:', filePath);
        throw new Error(`Header template file not found: ${filePath}`);
      }

      this.headerTemplate = fs.readFileSync(filePath, "utf-8");
    }
    return this.headerTemplate;
  }

  /**
   * Get logo as base64 data URL
   */
  getLogoAsBase64() {
    try {
      const logoPath = path.resolve(__dirname, '../../../public/nila_logo_upscaled.png');
      console.log('📷 Reading logo from:', logoPath);

      if (!fs.existsSync(logoPath)) {
        console.error('❌ Logo file not found:', logoPath);

        const altPath = path.resolve(__dirname, '../../public/nila_logo_upscaled.png');
        console.log('📷 Trying alternative path:', altPath);

        if (!fs.existsSync(altPath)) {
          console.error('❌ Logo file not found in alternative path either');
          return '';
        }

        const logoBuffer = fs.readFileSync(altPath);
        const base64Logo = logoBuffer.toString('base64');
        const dataUrl = `data:image/png;base64,${base64Logo}`;
        console.log('✅ Logo converted to base64 successfully (alt path)');
        return dataUrl;
      }

      const logoBuffer = fs.readFileSync(logoPath);
      const base64Logo = logoBuffer.toString('base64');
      const dataUrl = `data:image/png;base64,${base64Logo}`;

      console.log('✅ Logo converted to base64 successfully');
      return dataUrl;
    } catch (error) {
      console.error('❌ Error reading logo file:', error);
      return '';
    }
  }

  /**
   * Inject business header into template HTML
   */
  injectBusinessHeader(templateHTML, logoBase64) {
    const headerHTML = this.loadHeaderTemplate();
    const headerWithLogo = headerHTML.replace('{{logoPath}}', logoBase64);
    const bodyTagRegex = /(<body[^>]*>)/i;
    const match = templateHTML.match(bodyTagRegex);

    if (!match) {
      console.warn('⚠️ Could not find <body> tag in template');
      return templateHTML;
    }

    const modifiedHTML = templateHTML.replace(
      bodyTagRegex,
      `$1\n${headerWithLogo}\n`
    );

    console.log('✅ Business header injected successfully');
    return modifiedHTML;
  }

  /**
   * Load template file
   */
  loadTemplate(templateName) {
    const filePath = path.resolve(__dirname, './templates', `${templateName}.html`);
    console.log('📄 Loading template from:', filePath);

    if (!fs.existsSync(filePath)) {
      console.error('❌ Template file not found:', filePath);
      throw new Error(`Template file not found: ${filePath}`);
    }

    return fs.readFileSync(filePath, "utf-8");
  }

  /**
   * Render template with data
   */
  renderTemplate(template, data) {
    let html = template;
    for (const key in data) {
      const value = data[key] ?? "";
      const regex = new RegExp(`{{${key}}}`, "g");
      html = html.replace(regex, value);
    }
    return html;
  }

  /**
   * Generate PDF buffer from HTML
   */
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

  /**
   * Generate Order PDF
   */
  async generateOrderPDF(order) {
    return await this.orderGenerator.generate(order, cloudinaryService);
  }

  /**
   * Generate Invoice/Proforma/Estimation PDF
   */
  async generateDocumentPDF(document) {
    console.log('📄 Generating document PDF, type:', document.documentType);
    if (document.documentType === 'purchase-estimation') {
      console.log('🔄 Routing to Purchase Order PDF Generator for Purchase Estimation');
      return await this.generatePurchaseEstimationPDF(document);
    }
    return await this.invoiceGenerator.generate(document, cloudinaryService);
  }

  /**
   * Generate Purchase Estimation PDF using Purchase Order template
   */
  async generatePurchaseEstimationPDF(estimation) {
    try {
      console.log(`📄 Generating Purchase Estimation PDF: ${estimation.documentNo}`);

      // Transform Purchase Estimation to Purchase Order format
      const purchaseOrderData = {
        poNumber: estimation.documentNo, // PES-0001
        poDate: estimation.documentDate,
        
        // Supplier info (from first purchase item vendor)
        supplier: {
          name: estimation.purchaseItems?.[0]?.vendor || "N/A",
          address: estimation.purchaseItems?.[0]?.vendorState || "",
          gstin: estimation.purchaseItems?.[0]?.vendorCode || "",
        },
        
        // Transform purchase items to PO items format
        items: this.transformPurchaseItemsToPOItems(estimation.purchaseItems),
        
        // Financials
        totalValue: estimation.grandTotalCost || 0,
        discount: 0,
        roundOff: 0,
        grandTotal: estimation.grandTotalWithGst || 0,
        
        // Taxes
        taxes: {
          cgst: estimation.totalCgst || 0,
          sgst: estimation.totalSgst || 0,
          igst: estimation.totalIgst || 0,
        },
      };

      console.log('📋 Transformed Purchase Estimation to PO format:', {
        poNumber: purchaseOrderData.poNumber,
        supplier: purchaseOrderData.supplier.name,
        itemsCount: purchaseOrderData.items.length,
        grandTotal: purchaseOrderData.grandTotal
      });

      // Use Purchase Order generator
      return await this.purchaseOrderGenerator.generate(purchaseOrderData, cloudinaryService);
    } catch (error) {
      console.error("❌ Purchase Estimation PDF generation error:", error);
      throw error;
    }
  }

  /**
   * Transform Purchase Estimation items to Purchase Order items format
   */
  transformPurchaseItemsToPOItems(purchaseItems) {
    if (!purchaseItems || purchaseItems.length === 0) {
      return [];
    }

    const poItems = [];

    purchaseItems.forEach(vendorItem => {
      vendorItem.items.forEach(item => {
        const quantity = item.quantity || 0;
        const rate = item.costPerUnit || 0;
        const subtotal = quantity * rate;
        const gstPercentage = item.gstPercentage || 0;
        const gstAmount = (subtotal * gstPercentage) / 100;
        const total = subtotal + gstAmount;

        poItems.push({
          description: `${item.itemName}${item.gsm ? ` (${item.gsm} GSM)` : ''}${item.color ? ` - ${item.color}` : ''}`,
          quantity: quantity,
          rate: rate,
          amount: total,
          gstPercentage: gstPercentage,
        });
      });
    });

    console.log(`✅ Transformed ${poItems.length} purchase items to PO items`);
    return poItems;
  }

  /**
   * Generate Purchase Order PDF
   */
  async generatePurchaseOrderPDF(purchaseOrder) {
    return await this.purchaseOrderGenerator.generate(purchaseOrder, cloudinaryService);
  }

  /**
   * Generate Credit/Debit Note PDF
   */
  async generateNotePDF(note) {
    return await this.noteGenerator.generate(note, cloudinaryService);
  }

  /**
   * Close browser
   */
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