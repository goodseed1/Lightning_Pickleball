import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const LOCATION_CACHE_KEY = '@cached_location';

// Location interface for caching
export interface CachedLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
}

/**
 * Upload an image to Firebase Storage
 * @param imageUri - Local image URI
 * @param path - Storage path (e.g., 'payment-qr/clubId/venmo')
 * @returns Promise<string> - Download URL
 */
export const uploadImage = async (imageUri: string, path: string): Promise<string> => {
  try {
    // Convert image URI to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Create storage reference
    const imageRef = ref(storage, `${path}_${Date.now()}.jpg`);

    // Upload the blob
    const snapshot = await uploadBytes(imageRef, blob);

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Save location data to AsyncStorage
 * @param location - Location object with latitude, longitude, and timestamp
 */
export const saveCachedLocation = async (location: CachedLocation): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(location);
    await AsyncStorage.setItem(LOCATION_CACHE_KEY, jsonValue);
    console.log('✅ Location successfully cached to device.');
  } catch (error) {
    console.error('❌ Failed to cache location:', error);
  }
};

/**
 * Get cached location data from AsyncStorage
 * @returns Promise<CachedLocation | null> - Cached location or null if not found
 */
export const getCachedLocation = async (): Promise<CachedLocation | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
    if (jsonValue != null) {
      const location = JSON.parse(jsonValue) as CachedLocation;
      console.log('✅ Successfully loaded cached location from device.');
      return location;
    }
    return null;
  } catch (error) {
    console.error('❌ Failed to load cached location:', error);
    return null;
  }
};

/**
 * Generic key-value storage methods for AsyncStorage
 */
export const setItem = async <T>(key: string, value: T): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error(`Error setting item ${key}:`, error);
    throw error;
  }
};

export const getItem = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    if (jsonValue != null) {
      return JSON.parse(jsonValue) as T;
    }
    return null;
  } catch (error) {
    console.error(`Error getting item ${key}:`, error);
    return null;
  }
};

// Default export with all storage methods
const StorageService = {
  uploadImage,
  saveCachedLocation,
  getCachedLocation,
  setItem,
  getItem,
};

export default StorageService;
