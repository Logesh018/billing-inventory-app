// services/pdf-generators/NotePDFGenerator.js
import { BasePDFGenerator } from './BasePDFGenerator.js';

export class NotePDFGenerator extends BasePDFGenerator {
  /**
   * Generate Credit/Debit Note PDF
   */
  async generate(note, cloudinaryService) {
    try {
      const templateName = note.noteType === 'credit'
        ? 'creditNoteTemplate'
        : 'debitNoteTemplate';

      console.log(`📄 Generating ${note.noteType} note PDF: ${note.noteNumber}`);

      let templateHTML = this.pdfService.loadTemplate(templateName);

      // Inject business header with base64 logo
      const logoBase64 = this.pdfService.getLogoAsBase64();
      templateHTML = this.pdfService.injectBusinessHeader(templateHTML, logoBase64);

      // Split party address
      const partyAddress = note.partyDetails?.address || "";
      const partyAddressParts = this.splitAddress(partyAddress);

      // Generate HTML sections
      const itemsHTML = this.generateNoteItemsHTML(note);
      const taxRowsHTML = this.generateNoteTaxRows(note);
      const additionalChargesHTML = this.generateAdditionalChargesHTML(note);

      // Format reference date
      const refDate = note.referenceDate
        ? this.formatDate(note.referenceDate)
        : "";

      // Get reason display text
      const reasonMap = {
        'goods-returned': 'Goods Returned',
        'shortage-in-supply': 'Shortage in Supply',
        'overcharged-amount': 'Overcharged Amount',
        'discount-allowed': 'Discount Allowed',
        'quality-issue': 'Quality Issue',
        'damaged-goods': 'Damaged Goods',
        'undercharged-amount': 'Undercharged Amount',
        'additional-charges': 'Additional Charges',
        'price-difference': 'Price Difference',
        'penalty-charges': 'Penalty Charges',
        'other': 'Other'
      };
      const reasonText = reasonMap[note.reason] || note.reason;

      // Build template data
      const data = {
        // Note Details
        noteNumber: note.noteNumber,
        noteDate: this.formatDate(note.noteDate),
        referenceNumber: note.referenceNumber,
        referenceDate: refDate,
        reason: reasonText,
        reasonDescription: note.reasonDescription || "",

        // Party Details
        "party.name": note.partyDetails?.name || "",
        "party.addressLine1": partyAddressParts.line1,
        "party.addressLine2": partyAddressParts.line2,
        "party.gst": note.partyDetails?.gst || "",
        "party.state": note.partyDetails?.state || "",

        // Items and Charges
        items: itemsHTML,
        taxRows: taxRowsHTML,
        additionalCharges: additionalChargesHTML,

        // Financials
        subtotal: note.subtotal?.toFixed(2) || "0.00",
        "taxes.cgst": note.taxes?.cgst?.toFixed(2) || "0.00",
        "taxes.sgst": note.taxes?.sgst?.toFixed(2) || "0.00",
        roundOff: note.roundOff?.toFixed(2) || "0.00",
        grandTotal: note.grandTotal?.toFixed(2) || "0.00",
        amountInWords: note.amountInWords || "Zero Rupees Only",

        // Note Type specific labels
        noteTypeLabel: note.noteType === 'credit' ? 'CREDIT NOTE' : 'DEBIT NOTE',
        amountLabel: note.noteType === 'credit' ? 'Amount Credited' : 'Amount Debited'
      };

      console.log(`💰 ${note.formattedNoteType} Total: ₹${data.grandTotal}`);

      const filledHTML = this.pdfService.renderTemplate(templateHTML, data);

      const filename = `${note.noteType}-note-${note.noteNumber.replace(/\//g, '-')}-${Date.now()}`;
      const folder = `${note.noteType}-notes`;

      return await this.generateAndUpload(filledHTML, filename, folder, cloudinaryService);
    } catch (error) {
      console.error("❌ Note PDF generation error:", error);
      throw error;
    }
  }

  /**
   * Generate note items HTML
   */
  generateNoteItemsHTML(note) {
    if (!note.items || note.items.length === 0) {
      return '<tr><td colspan="6" style="text-align: center;">No items</td></tr>';
    }

    let html = '';

    note.items.forEach((item) => {
      const description = item.description || 'N/A';
      const hsnCode = item.hsnCode || '';
      const quantity = item.quantity || 0;
      const rate = parseFloat(item.rate || 0).toFixed(2);
      const amount = parseFloat(item.amount || 0).toFixed(2);

      html += `
      <tr class="bottom-border">
        <td class="left">${description}</td>
        <td class="center">${hsnCode}</td>
        <td class="center">${quantity}</td>
        <td class="center">Pcs</td>
        <td class="right">₹${rate}</td>
        <td class="right">₹${amount}</td>
      </tr>
    `;
    });

    return html;
  }

  /**
   * Generate tax breakdown rows for notes
   */
  generateNoteTaxRows(note) {
    let html = '';

    // Group items by tax rate
    const taxGroups = {};
    note.items.forEach(item => {
      const taxRate = item.taxRate || 5;
      if (!taxGroups[taxRate]) {
        taxGroups[taxRate] = {
          taxableAmount: 0,
          cgst: 0,
          sgst: 0
        };
      }
      const itemAmount = (item.quantity || 0) * (item.rate || 0);
      taxGroups[taxRate].taxableAmount += itemAmount;
    });

    // Calculate taxes for each group
    Object.keys(taxGroups).sort().forEach(rate => {
      const group = taxGroups[rate];
      const tax = (group.taxableAmount * parseFloat(rate)) / 100;
      group.cgst = tax / 2;
      group.sgst = tax / 2;

      const cgstRate = parseFloat(rate) / 2;
      const sgstRate = parseFloat(rate) / 2;

      html += `
      <tr class="full-border">
        <td class="left" colspan="4">Output CGST</td>
        <td class="center">${cgstRate}%</td>
        <td class="right">₹${group.cgst.toFixed(2)}</td>
      </tr>
      <tr class="full-border">
        <td class="left" colspan="4">Output SGST</td>
        <td class="center">${sgstRate}%</td>
        <td class="right">₹${group.sgst.toFixed(2)}</td>
      </tr>
    `;
    });

    return html;
  }

  /**
   * Generate additional charges row for notes
   */
  generateAdditionalChargesHTML(note) {
    if (!note.additionalCharges || !note.additionalCharges.amount || note.additionalCharges.amount === 0) {
      return '';
    }

    const charges = note.additionalCharges;
    const description = charges.description || 'Additional Charges';
    const hsnCode = charges.hsnCode || '9997';
    const amount = parseFloat(charges.amount || 0).toFixed(2);
    const taxRate = charges.taxRate || 18;
    const tax = (charges.amount * taxRate) / 100;
    const cgst = (tax / 2).toFixed(2);
    const sgst = (tax / 2).toFixed(2);
    const cgstRate = taxRate / 2;
    const sgstRate = taxRate / 2;

    return `
    <tr class="full-border">
      <td class="left">${description}</td>
      <td class="center">${hsnCode}</td>
      <td class="center">1</td>
      <td></td>
      <td></td>
      <td class="right">₹${amount}</td>
    </tr>
    <tr class="full-border">
      <td class="left" colspan="4">Output CGST</td>
      <td class="center">${cgstRate}%</td>
      <td class="right">₹${cgst}</td>
    </tr>
    <tr class="full-border">
      <td class="left" colspan="4">Output SGST</td>
      <td class="center">${sgstRate}%</td>
      <td class="right">₹${sgst}</td>
    </tr>
  `;
  }
}