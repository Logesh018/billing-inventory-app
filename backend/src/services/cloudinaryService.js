// services/cloudinaryService.js
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class CloudinaryService {
  // Upload PDF buffer to Cloudinary
  // The folder parameter now makes this function dynamic
  async uploadPDF(buffer, filename, folder = 'documents') {
    try {
      const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto', 
            folder: folder,
            public_id: safeFilename,
            overwrite: true,
            use_filename: true,
            access_mode: 'public',
            format: 'pdf',
            invalidate: true
          },
          (error, result) => {
            if (error) reject(error);
            else {
              console.log("✅ Cloudinary Upload Result:", result);
              resolve(result);
            }
          }
        );

        uploadStream.end(buffer);
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.error('❌ Cloudinary upload error:', error);
      throw new Error('Failed to upload PDF to cloud storage');
    }
  }

  // Delete PDF from Cloudinary
  async deletePDF(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'raw'
      });
      return result.result === 'ok';
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return false;
    }
  }

  // Generate signed URL for secure access (optional)
  generateSignedUrl(publicId, expirationTime = 3600) {
    return cloudinary.utils.private_download_url(publicId, 'pdf', {
      resource_type: 'jpg',
      expires_at: Math.round(Date.now() / 1000) + expirationTime
    });
  }
}

export const cloudinaryService = new CloudinaryService();