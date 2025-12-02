// services/pdf-generators/PurchaseOrderPDFGenerator.js
import { BasePDFGenerator } from './BasePDFGenerator.js';

export class PurchaseOrderPDFGenerator extends BasePDFGenerator {
  /**
   * Generate Purchase Order PDF
   */
  async generate(purchaseOrder, cloudinaryService) {
    try {
      console.log(`📄 Generating Purchase Order PDF for PO: ${purchaseOrder.poNumber}`);

      let templateHTML = this.pdfService.loadTemplate('purchaseOrderTemplate');

      // Inject business header with base64 logo
      const logoBase64 = this.pdfService.getLogoAsBase64();
      templateHTML = this.pdfService.injectBusinessHeader(templateHTML, logoBase64);

      // Generate items HTML
      const itemsHTML = this.generatePurchaseOrderItemsHTML(purchaseOrder);

      // Calculate tax totals
      const cgst = purchaseOrder.taxes?.cgst || 0;
      const sgst = purchaseOrder.taxes?.sgst || 0;
      const igst = purchaseOrder.taxes?.igst || 0;

      // Build data for template
      const data = {
        poNumber: purchaseOrder.poNumber,
        poDate: this.formatDate(purchaseOrder.poDate),

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

      const filledHTML = this.pdfService.renderTemplate(templateHTML, data);

      const filename = `purchase-order-${purchaseOrder.poNumber}-${Date.now()}`;
      const folder = 'purchase-orders';

      return await this.generateAndUpload(filledHTML, filename, folder, cloudinaryService);
    } catch (error) {
      console.error("❌ Purchase Order PDF generation error:", error);
      throw error;
    }
  }

  /**
   * Generate items HTML for Purchase Order
   */
  generatePurchaseOrderItemsHTML(purchaseOrder) {
    if (!purchaseOrder.items || purchaseOrder.items.length === 0) {
      return '<tr><td colspan="5" style="text-align: center;">No items</td></tr>';
    }

    let html = '';

    purchaseOrder.items.forEach((item) => {
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
}