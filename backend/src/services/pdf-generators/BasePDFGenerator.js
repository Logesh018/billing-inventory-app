// services/pdf-generators/BasePDFGenerator.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Base class for all PDF generators
 * Contains shared utility methods
 */
export class BasePDFGenerator {
  constructor(pdfService) {
    this.pdfService = pdfService;
  }

  /**
   * Split long address into two lines
   */
  splitAddress(address) {
    if (!address) return { line1: '', line2: '' };

    const maxLineLength = 50;
    if (address.length <= maxLineLength) {
      return { line1: address, line2: '' };
    }

    // Try to split at comma
    const commaIndex = address.indexOf(',', maxLineLength / 2);
    if (commaIndex > 0 && commaIndex < maxLineLength) {
      return {
        line1: address.substring(0, commaIndex).trim(),
        line2: address.substring(commaIndex + 1).trim()
      };
    }

    // Try to split at space
    const spaceIndex = address.lastIndexOf(' ', maxLineLength);
    if (spaceIndex > 0) {
      return {
        line1: address.substring(0, spaceIndex).trim(),
        line2: address.substring(spaceIndex + 1).trim()
      };
    }

    // Fallback: hard split
    return {
      line1: address.substring(0, maxLineLength).trim(),
      line2: address.substring(maxLineLength).trim()
    };
  }

  /**
   * Get business config from environment
   */
  getBusinessConfig() {
    return {
      accountNumber: process.env.BUSINESS_ACCOUNT_NUMBER || "",
      ifsc: process.env.BUSINESS_IFSC || "",
      branch: process.env.BUSINESS_BRANCH || "",
      bankName: process.env.BUSINESS_BANK_NAME || ""
    };
  }

  /**
   * Format date to Indian locale
   */
  formatDate(date) {
    return new Date(date).toLocaleDateString("en-IN");
  }

  /**
   * Generate PDF and upload to Cloudinary
   */
  async generateAndUpload(htmlContent, filename, folder, cloudinaryService) {
    const pdfBuffer = await this.pdfService.generatePDFBuffer(htmlContent);

    console.log(`📤 Uploading to Cloudinary: ${folder}/${filename}`);

    const uploadResult = await cloudinaryService.uploadPDF(
      pdfBuffer,
      filename,
      folder
    );

    console.log('✅ PDF uploaded successfully:', uploadResult.url);

    return {
      buffer: pdfBuffer,
      url: uploadResult.url,
      publicId: uploadResult.publicId,
    };
  }
}