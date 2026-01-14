// Firebase barrel exports - centralized imports
// Import from singleton configuration only
export { app, auth, db, functions, storage } from './config';
export { default } from './config';

// Legacy compatibility utilities
export { isFirebaseInitialized, getFirebaseConfig } from './firebase';
