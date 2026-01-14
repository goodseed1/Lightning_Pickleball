# Firebase Setup Guide for Lightning Tennis

This guide will help you set up Firebase for the Lightning Tennis React Native app.

## 🚀 Quick Start

### 1. Prerequisites

- Firebase account (https://firebase.google.com/)
- Node.js and npm installed
- Expo CLI installed globally

### 2. Firebase Project Setup

#### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Enter project name: `lightning-tennis-app`
4. Choose whether to enable Google Analytics (recommended)
5. Create the project

#### Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable the following sign-in providers:
   - **Email/Password**: Enable both "Email/Password" and "Email link (passwordless sign-in)"
   - **Google**: Click enable, add your project's OAuth 2.0 client ID
   - **Apple**: Enable for iOS (requires Apple Developer account)
   - **Facebook**: Enable with Facebook App ID and Secret

#### Step 3: Set up Firestore Database

1. Go to **Firestore Database**
2. Click "Create database"
3. Choose **Start in test mode** (we'll set up security rules later)
4. Select a location closest to your users (e.g., `us-central1`)

#### Step 4: Enable Cloud Functions

1. Go to **Functions**
2. Click "Get started" to enable Cloud Functions
3. Choose the same location as your Firestore database

#### Step 5: Enable Storage

1. Go to **Storage**
2. Click "Get started"
3. Accept the default security rules for now
4. Choose the same location as other services

### 3. Web App Configuration

#### Step 1: Register Web App

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click the **Web** icon (`</>`)
4. Enter app nickname: `Lightning Tennis Web`
5. **Don't** check "Also set up Firebase Hosting"
6. Click "Register app"

#### Step 2: Copy Configuration

1. Copy the `firebaseConfig` object shown
2. Create `.env` file in your project root (copy from `.env.example`)
3. Fill in the values:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id_here
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id_here
```

### 4. Install Firebase Dependencies

```bash
npm install firebase
```

### 5. Test Firebase Connection

Run the app and check the console for Firebase initialization messages:

```bash
npm run start
```

You should see:

```
✅ Firebase configuration validated successfully
✅ Firebase app initialized successfully
✅ Firebase Auth initialized with AsyncStorage persistence
✅ Firestore initialized successfully
✅ Firebase Functions initialized successfully
✅ Firebase Storage initialized successfully
🔥 Firebase setup completed successfully
```

## 📱 Mobile App Setup (iOS/Android)

### iOS Setup

1. In Firebase Console, click the **iOS** icon to add iOS app
2. Enter iOS bundle ID (from `app.json`): `com.lightningtennis.community`
3. Download `GoogleService-Info.plist`
4. Add it to your iOS project (Xcode)

### Android Setup

1. Click the **Android** icon to add Android app
2. Enter Android package name (from `app.json`): `com.lightningtennis.community`
3. Download `google-services.json`
4. Place it in `android/app/` directory

## 🔐 Security Rules

### Firestore Security Rules

Create these security rules in **Firestore Database** > **Rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null; // Allow reading other users' public data
    }

    // Lightning matches - authenticated users can read and create
    match /lightning_matches/{matchId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.hostId;
      allow update: if request.auth != null && (
        request.auth.uid == resource.data.hostId ||
        request.auth.uid in resource.data.participantIds
      );
    }

    // Tennis clubs
    match /tennis_clubs/{clubId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && (
        request.auth.uid in resource.data.adminIds ||
        request.auth.uid in resource.data.managerIds
      );
    }

    // Club events
    match /club_events/{eventId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null && (
        request.auth.uid == resource.data.createdBy ||
        // Check if user is club admin/manager (would need additional query)
        true
      );
    }
  }
}
```

### Storage Security Rules

Update **Storage** > **Rules**:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can upload their own profile images
    match /users/{userId}/profile/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Club images - club members can upload
    match /clubs/{clubId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null; // Add club membership check
    }
  }
}
```

## 🧪 Development & Testing

### Local Firebase Emulators (Optional)

1. Install Firebase CLI:

   ```bash
   npm install -g firebase-tools
   ```

2. Initialize Firebase in your project:

   ```bash
   firebase init
   ```

   Select: Firestore, Functions, Storage

3. Start emulators:

   ```bash
   firebase emulators:start
   ```

4. Set environment variable:
   ```env
   EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true
   ```

### Testing Authentication

1. Run the app
2. Go through the onboarding flow
3. Try different sign-in methods
4. Check Firebase Console > Authentication to see registered users
5. Check Firestore > Data to see created user profiles

## 🔍 Debugging

### Common Issues

1. **Firebase not initialized**
   - Check all environment variables are set correctly
   - Verify `.env` file is in the root directory
   - Make sure environment variables start with `EXPO_PUBLIC_`

2. **Authentication errors**
   - Check sign-in methods are enabled in Firebase Console
   - Verify OAuth configurations for Google/Apple/Facebook
   - Check bundle IDs match between app.json and Firebase Console

3. **Firestore permission denied**
   - Check security rules allow the operation
   - Verify user is authenticated
   - Check document path matches security rules

4. **Network errors**
   - Check internet connection
   - Verify Firebase project is active
   - Check if using emulators, they are running

### Debug Information

The app logs detailed Firebase initialization information. Check the console for:

- ✅ Success messages (green checkmarks)
- ❌ Error messages (red X marks)
- 🔧 Development mode messages
- ⚠️ Warning messages

## 📊 Database Schema

### Users Collection (`users/{userId}`)

```javascript
{
  uid: string,
  email: string,
  displayName: string,
  photoURL: string,
  emailVerified: boolean,
  createdAt: timestamp,
  lastLoginAt: timestamp,
  profile: {
    nickname: string,
    skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert',
    location: string,
    preferredLanguage: 'en' | 'ko',
    communicationLanguages: string[],
    gender: string,
    zipCode: string,
    activityRegions: string[],
    maxTravelDistance: number,
    onboardingCompleted: boolean,
    onboardingCompletedAt: timestamp
  },
  stats: {
    matchesPlayed: number,
    wins: number,
    losses: number,
    winRate: number,
    currentStreak: number,
    eloRating: number
  },
  preferences: {
    notifications: {
      personalMatches: boolean,
      clubEvents: boolean,
      friendRequests: boolean,
      matchReminders: boolean,
      notificationDistance: number
    },
    privacy: {
      showEmail: boolean,
      showLocation: boolean,
      showStats: boolean
    }
  }
}
```

### Lightning Matches Collection (`lightning_matches/{matchId}`)

```javascript
{
  hostId: string,
  title: string,
  description: string,
  location: {
    name: string,
    address: string,
    lat: number,
    lng: number
  },
  scheduledTime: timestamp,
  duration: number, // minutes
  maxParticipants: number,
  participantIds: string[],
  participantCount: number,
  skillLevel: string,
  type: 'singles' | 'doubles',
  status: 'active' | 'full' | 'completed' | 'cancelled',
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Tennis Clubs Collection (`tennis_clubs/{clubId}`)

```javascript
{
  name: string,
  description: string,
  logo: string,
  coverImage: string,
  location: {
    address: string,
    lat: number,
    lng: number
  },
  establishedDate: timestamp,
  adminIds: string[],
  managerIds: string[],
  memberIds: string[],
  memberCount: number,
  isPublic: boolean,
  joinRequiresApproval: boolean,
  tags: string[],
  contactInfo: {
    email: string,
    phone: string,
    website: string
  },
  socialLinks: {
    facebook: string,
    instagram: string,
    website: string
  },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## 🚀 Next Steps

After completing this setup:

1. **Test all authentication methods**
2. **Create sample data** in Firestore
3. **Set up Cloud Functions** for advanced features
4. **Configure push notifications** with FCM
5. **Deploy security rules** to production
6. **Set up analytics** and monitoring

## 📞 Support

If you encounter issues:

1. Check the [Firebase Documentation](https://firebase.google.com/docs)
2. Review the console logs for specific error messages
3. Verify all configuration steps were completed
4. Check the GitHub repository for updates

---

**🎾 Lightning Tennis - Firebase Setup Complete! ⚡️**
