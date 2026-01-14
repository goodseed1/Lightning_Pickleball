// Re-export from the centralized Firebase configuration
// This file now serves as a thin compatibility layer
export { auth, db, functions, storage, default as firebaseApp } from './config';

// Legacy default export for backward compatibility
export { default } from './config';

// Legacy utilities - re-exported for backward compatibility
import { auth, db, functions, storage } from './config';

export const isFirebaseInitialized = () => {
  try {
    return !!(auth && db && functions && storage);
  } catch (error) {
    console.error('Error checking Firebase initialization:', error);
    return false;
  }
};

export const getFirebaseConfig = () => {
  if (__DEV__) {
    return {
      message: 'Config available from centralized config.ts',
      note: 'This module now re-exports from config.ts',
    };
  }
  return { message: 'Config only available in development mode' };
};

console.log('🔄 Firebase compatibility layer loaded (re-exports from config.ts)');
