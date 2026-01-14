#!/bin/bash

# EAS Environment Variables Setup Script
# Run this script to configure environment variables for EAS Build

echo "🔧 Setting up EAS environment variables for production..."

# Firebase Configuration
eas env:create EXPO_PUBLIC_FIREBASE_API_KEY --value "AIzaSyCYiYO3c-57uRErk-6Zr36ItwIeRxZkgT4" --environment production --visibility plaintext --non-interactive || true
eas env:create EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "lightning-tennis-community.firebaseapp.com" --environment production --visibility plaintext --non-interactive || true
eas env:create EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "lightning-tennis-community" --environment production --visibility plaintext --non-interactive || true
eas env:create EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "lightning-tennis-community.firebasestorage.app" --environment production --visibility plaintext --non-interactive || true
eas env:create EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "815594051044" --environment production --visibility plaintext --non-interactive || true
eas env:create EXPO_PUBLIC_FIREBASE_APP_ID --value "1:815594051044:ios:2e908e86def2cf1495e3f1" --environment production --visibility plaintext --non-interactive || true

# Other API Keys
eas env:create EXPO_PUBLIC_USE_FIREBASE_EMULATORS --value "false" --environment production --visibility plaintext --non-interactive || true
eas env:create EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "815594051044-rifecob4ovee8252sgj41q8olhb834ii.apps.googleusercontent.com" --environment production --visibility plaintext --non-interactive || true

echo "✅ EAS environment variables configured!"
echo "🚀 Now run: eas build --platform all --profile production"
