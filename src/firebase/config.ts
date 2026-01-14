// src/firebase/config.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredVars = {
    EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };

  const missing = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.error('🔥 Firebase Config Error: Missing required environment variables:', missing);
    console.error(
      '📋 Create a .env file with these variables or check your environment configuration'
    );
    throw new Error(`Firebase configuration incomplete. Missing: ${missing.join(', ')}`);
  }

  console.log('✅ Firebase configuration validated successfully');
  return true;
};

// Validate before proceeding
validateFirebaseConfig();

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
};

// Singleton pattern - initialize once, reuse thereafter
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth with React Native persistence
import type { Auth } from 'firebase/auth';

let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error: unknown) {
  // If auth is already initialized, get the existing instance
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 'auth/already-initialized'
  ) {
    auth = getAuth(app);
  } else {
    throw error;
  }
}

// Initialize other Firebase services
export const db = getFirestore(app);
// Initialize Firebase Functions with explicit region
// All Cloud Functions are deployed to us-central1
export const functions = getFunctions(app, 'us-central1');
export const storage = getStorage(app);

// Connect to Firebase emulators in development
const useEmulators = process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

if (__DEV__ && useEmulators) {
  // Check if already connected to avoid duplicate connections
  try {
    // 💥 iOS Simulator networking fix - use host machine IP instead of localhost
    // iOS Simulator cannot resolve localhost to the host machine
    const emulatorHost = Platform.OS === 'ios' ? '192.168.4.163' : 'localhost';

    connectFirestoreEmulator(db, emulatorHost, 8083);
    console.log(`🔥 Connected to Firestore emulator at ${emulatorHost}:8083`);
  } catch {
    // Emulator connection may already exist, ignore the error
    console.log('🔥 Firestore emulator connection already exists');
  }
} else if (__DEV__) {
  console.log('🌐 Connecting to PRODUCTION Firebase backend (emulators disabled)');
}

// Log Firebase initialization status
console.log('🔥 [FIREBASE INIT] Configuration loaded:', {
  authInitialized: !!auth,
  authUser: auth?.currentUser?.uid || 'NONE',
  functionsRegion: 'us-central1',
  appName: app.name,
});

export { auth };
export default app;
