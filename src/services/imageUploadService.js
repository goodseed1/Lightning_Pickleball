/**
 * Image Upload Service for Firebase Storage
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase/config';

class ImageUploadService {
  constructor() {
    console.log('📸 ImageUploadService initialized');
  }

  /**
   * Upload image to Firebase Storage
   * @param {string} localUri - Local file URI
   * @param {string} path - Storage path (e.g., 'clubs/logos/clubId')
   * @param {string} fileName - File name
   * @returns {Promise<string>} Download URL
   */
  async uploadImage(localUri, path, fileName) {
    try {
      console.log('📤 Uploading image:', { localUri, path, fileName });

      // Convert local URI to blob
      const response = await fetch(localUri);
      const blob = await response.blob();

      // Create storage reference
      const imageRef = ref(storage, `${path}/${fileName}`);

      // Upload file
      console.log('⏳ Uploading to Firebase Storage...');
      const uploadResult = await uploadBytes(imageRef, blob);
      console.log('✅ Upload successful:', uploadResult.metadata.fullPath);

      // Get download URL
      const downloadURL = await getDownloadURL(imageRef);
      console.log('🔗 Download URL generated:', downloadURL);

      return downloadURL;
    } catch (error) {
      console.error('❌ Image upload failed:', error);
      throw new Error(`이미지 업로드 실패: ${error.message}`);
    }
  }

  /**
   * Upload club logo
   * @param {string} localUri - Local file URI
   * @param {string} clubId - Club ID
   * @returns {Promise<string>} Download URL
   */
  async uploadClubLogo(localUri, clubId) {
    const fileName = `logo_${clubId}_${Date.now()}.jpg`;
    return this.uploadImage(localUri, 'clubs/logos', fileName);
  }

  /**
   * Delete image from Firebase Storage
   * @param {string} downloadUrl - Download URL to delete
   */
  async deleteImage(downloadUrl) {
    try {
      // Extract path from download URL
      const pathRegex = /\/o\/(.+?)\?/;
      const match = downloadUrl.match(pathRegex);

      if (!match) {
        throw new Error('Invalid download URL format');
      }

      const path = decodeURIComponent(match[1]);
      const imageRef = ref(storage, path);

      await deleteObject(imageRef);
      console.log('🗑️ Image deleted successfully:', path);
    } catch (error) {
      console.error('❌ Image deletion failed:', error);
      // Don't throw error for deletion failures
    }
  }
}

export default new ImageUploadService();
