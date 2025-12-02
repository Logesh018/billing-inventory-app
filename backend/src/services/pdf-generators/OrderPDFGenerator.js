// services/pdf-generators/OrderPDFGenerator.js
import { BasePDFGenerator } from './BasePDFGenerator.js';

export class OrderPDFGenerator extends BasePDFGenerator {
  /**
   * Generate Order PDF
   */
  async generate(order, cloudinaryService) {
    try {
      console.log(`📄 Generating Order PDF: ${order.orderId}`);

      let templateHTML = this.pdfService.loadTemplate('orderTemplate');

      // Inject business header with base64 logo
      const logoBase64 = this.pdfService.getLogoAsBase64();
      templateHTML = this.pdfService.injectBusinessHeader(templateHTML, logoBase64);

      // Split buyer address
      const buyerAddress = order.buyerDetails?.address || "";
      const buyerAddressParts = this.splitAddress(buyerAddress);

      // Generate products HTML
      const productsHTML = this.generateOrderItemsHTML(order);

      // Get business config (bank details)
      const businessConfig = this.getBusinessConfig();

      // Build template data
      const data = {
        // Order Details
        orderId: order.orderId || order._id,
        PoNo: order.PoNo || "",
        orderType: order.orderType || "",
        orderDate: this.formatDate(order.orderDate),
        status: order.status || "Pending Purchase",

        // Buyer Details
        "buyer.name": order.buyerDetails?.name || "",
        "buyer.addressLine1": buyerAddressParts.line1,
        "buyer.addressLine2": buyerAddressParts.line2,
        "buyer.code": order.buyerDetails?.code || "",
        "buyer.mobile": order.buyerDetails?.mobile || "",
        "buyer.email": order.buyerDetails?.email || "",
        "buyer.gst": order.buyerDetails?.gst || "",

        // Order Summary
        productCount: order.products?.length || 0,
        totalQty: order.totalQty || 0,

        // Products
        products: productsHTML,

        // Bank Details
        "business.accountNumber": businessConfig.accountNumber,
        "business.ifsc": businessConfig.ifsc,
        "business.branch": businessConfig.branch,
        "business.bankName": businessConfig.bankName,
      };

      console.log('📋 Order Data:', {
        orderId: data.orderId,
        orderType: data.orderType,
        buyer: data["buyer.name"],
        productCount: data.productCount,
        totalQty: data.totalQty
      });

      const filledHTML = this.pdfService.renderTemplate(templateHTML, data);

      const filename = `order-${order.orderId.replace(/\//g, '-')}-${Date.now()}`;
      const folder = 'orders';

      return await this.generateAndUpload(filledHTML, filename, folder, cloudinaryService);
    } catch (error) {
      console.error("❌ Order PDF generation error:", error);
      throw error;
    }
  }

  /**
   * Generate Order items HTML – specific table layout for Order PDF
   */
  generateOrderItemsHTML(order) {
    if (!order.products || order.products.length === 0) {
      return '<tr><td colspan="10" class="center">No products</td></tr>';
    }

    let html = '';
    let serialNo = 1;

    order.products.forEach((product) => {
      const details = product.productDetails || {};
      const category = details.category || '';
      const name = details.name || 'N/A';

      // Handle type and style arrays
      const types = Array.isArray(details.type)
        ? details.type.join(', ')
        : (details.type || '');
      const styles = Array.isArray(details.style)
        ? details.style.join(', ')
        : (details.style || '');

      const fabric = details.fabric || '';
      const productColor = details.color || '';

      // Check for sizes array DIRECTLY on product (not nested in colors)
      if (product.sizes && product.sizes.length > 0) {
        html += this.generateSizesRows(product, serialNo, category, name, types, styles, fabric, productColor);
        serialNo++;
      }
      // Check for NESTED colors structure (alternative data format)
      else if (product.colors && product.colors.length > 0) {
        serialNo = this.generateColorsRows(product, serialNo, category, name, types, styles, fabric, html);
      }
      // Product without sizes structure - simple row
      else {
        html += this.generateSimpleRow(product, serialNo++, category, name, types, styles, fabric, productColor);
      }
    });

    return html;
  }

  /**
   * Generate rows for products with direct sizes array
   */
  generateSizesRows(product, serialNo, category, name, types, styles, fabric, productColor) {
    const sizes = product.sizes;
    const totalQty = sizes.reduce((sum, s) => sum + (s.qty || 0), 0);
    let html = '';

    sizes.forEach((size, sizeIndex) => {
      const sizeValue = size.size || '';
      const qty = size.qty || 0;

      if (sizeIndex === 0) {
        html += `
          <tr class="${sizeIndex === sizes.length - 1 ? 'bottom-border' : 'no-bottom-border'}">
            <td class="center" rowspan="${sizes.length}">${serialNo}</td>
            <td class="left" rowspan="${sizes.length}">${category}</td>
            <td class="left" rowspan="${sizes.length}"><strong>${name}</strong></td>
            <td class="left" rowspan="${sizes.length}">${types}</td>
            <td class="left" rowspan="${sizes.length}">${styles}</td>
            <td class="left" rowspan="${sizes.length}">${fabric}</td>
            <td class="left" rowspan="${sizes.length}">${productColor.toUpperCase()}</td>
            <td class="center">${sizeValue}</td>
            <td class="center">${qty}</td>
            <td class="center" rowspan="${sizes.length}"><strong>${totalQty}</strong></td>
          </tr>
        `;
      } else {
        html += `
          <tr class="${sizeIndex === sizes.length - 1 ? 'bottom-border' : 'no-bottom-border'}">
            <td class="center">${sizeValue}</td>
            <td class="center">${qty}</td>
          </tr>
        `;
      }
    });

    return html;
  }

  /**
   * Generate rows for products with nested colors structure
   */
  generateColorsRows(product, serialNo, category, name, types, styles, fabric, html) {
    product.colors.forEach((color) => {
      const colorName = (color.colorName || '').toUpperCase();
      const sizes = color.sizes || [];

      if (sizes.length === 0) {
        html += `
          <tr class="bottom-border">
            <td class="center">${serialNo++}</td>
            <td class="left">${category}</td>
            <td class="left"><strong>${name}</strong></td>
            <td class="left">${types}</td>
            <td class="left">${styles}</td>
            <td class="left">${fabric}</td>
            <td class="left">${colorName}</td>
            <td class="center">-</td>
            <td class="center">0</td>
            <td class="center">0</td>
          </tr>
        `;
      } else {
        const colorTotal = sizes.reduce((sum, s) => sum + (s.quantity || 0), 0);

        sizes.forEach((size, sizeIndex) => {
          const sizeValue = size.sizeName || size.size || '';
          const qty = size.quantity || 0;

          if (sizeIndex === 0) {
            html += `
              <tr class="${sizeIndex === sizes.length - 1 ? 'bottom-border' : 'no-bottom-border'}">
                <td class="center" rowspan="${sizes.length}">${serialNo}</td>
                <td class="left" rowspan="${sizes.length}">${category}</td>
                <td class="left" rowspan="${sizes.length}"><strong>${name}</strong></td>
                <td class="left" rowspan="${sizes.length}">${types}</td>
                <td class="left" rowspan="${sizes.length}">${styles}</td>
                <td class="left" rowspan="${sizes.length}">${fabric}</td>
                <td class="left" rowspan="${sizes.length}">${colorName}</td>
                <td class="center">${sizeValue}</td>
                <td class="center">${qty}</td>
                <td class="center" rowspan="${sizes.length}"><strong>${colorTotal}</strong></td>
              </tr>
            `;
          } else {
            html += `
              <tr class="${sizeIndex === sizes.length - 1 ? 'bottom-border' : 'no-bottom-border'}">
                <td class="center">${sizeValue}</td>
                <td class="center">${qty}</td>
              </tr>
            `;
          }
        });

        serialNo++;
      }
    });

    return serialNo;
  }

  /**
   * Generate simple row for products without sizes
   */
  generateSimpleRow(product, serialNo, category, name, types, styles, fabric, productColor) {
    const qty = product.quantity || 0;

    return `
      <tr class="bottom-border">
        <td class="center">${serialNo}</td>
        <td class="left">${category}</td>
        <td class="left"><strong>${name}</strong></td>
        <td class="left">${types}</td>
        <td class="left">${styles}</td>
        <td class="left">${fabric}</td>
        <td class="left">${productColor ? productColor.toUpperCase() : '-'}</td>
        <td class="center">-</td>
        <td class="center">${qty}</td>
        <td class="center"><strong>${qty}</strong></td>
      </tr>
    `;
  }
}