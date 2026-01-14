# 🔐 Social Login Setup Guide

This guide explains how to configure Google and Apple sign-in for the Lightning Pickleball app.

---

## 📋 Prerequisites

- Firebase project created and configured
- Google Cloud Platform account (for Google Sign-In)
- Apple Developer account (for Apple Sign-In)
- Access to Firebase Console and Apple Developer Console

---

## 🔥 Firebase Console Setup

### 1. Enable Google Authentication Provider

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your Lightning Pickleball project
3. Navigate to **Authentication** > **Sign-in method**
4. Find **Google** in the providers list
5. Click **Enable**
6. Enter your project support email
7. Click **Save**

### 2. Enable Apple Authentication Provider

1. In Firebase Console Authentication > Sign-in method
2. Find **Apple** in the providers list
3. Click **Enable**
4. You'll need to configure your Apple Developer account first (see below)
5. Click **Save**

---

## 🔑 Google Web Client ID Setup

### 1. Get OAuth 2.0 Web Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project (or create a new one)
3. Navigate to **APIs & Services** > **Credentials**
4. Find the **OAuth 2.0 Client IDs** section
5. Look for the **Web client (auto created by Google Service)** entry
6. Copy the **Client ID** (it should end with `.apps.googleusercontent.com`)

### 2. Add to Environment Variables

Add the Web Client ID to your `.env` file:

```bash
# Google Sign-In Configuration
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
```

**Important**:

- Make sure to use the **Web client ID**, not the Android or iOS client ID
- The `.env` file should be in the project root directory
- Never commit the `.env` file to version control (it's already in `.gitignore`)

---

## 🍎 Apple Sign-In Setup

### 1. Apple Developer Console Configuration

1. Go to [Apple Developer](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click on **Identifiers**
4. Select your app's App ID
5. Enable **Sign In with Apple** capability
6. Configure the following:
   - **Group with existing primary App ID** (if you have one)
   - Or **Enable as primary App ID**
7. Click **Save**

### 2. Add Service ID (Optional)

If you need a Service ID for web authentication:

1. In Apple Developer Console, go to **Identifiers**
2. Click the **+** button to create a new identifier
3. Select **Services IDs** and click **Continue**
4. Fill in:
   - **Description**: Lightning Pickleball Service ID
   - **Identifier**: com.lightningpickleball.serviceid (or similar)
5. Enable **Sign In with Apple**
6. Configure:
   - **Primary App ID**: Select your main app ID
   - **Web Domain**: Your Firebase project domain
   - **Return URLs**: Your Firebase Auth redirect URL
7. Click **Save**

### 3. Firebase Configuration

1. In Firebase Console > Authentication > Sign-in method
2. Click on **Apple**
3. Enable the provider
4. Enter your **Service ID** (if you created one)
5. Enter your **Apple Team ID** (found in Apple Developer account)
6. Click **Save**

---

## 🔧 Native Configuration

### iOS (Apple Sign-In)

Add the Sign In with Apple capability to your iOS app:

1. Open your project in Xcode
2. Select your app target
3. Go to **Signing & Capabilities**
4. Click **+ Capability**
5. Add **Sign In with Apple**

### Android (Google Sign-In)

The Google Sign-In library handles most Android configuration automatically. However, you need to:

1. Ensure your `google-services.json` is in the `android/app` directory
2. Make sure your package name matches what's in Firebase Console
3. Add your SHA-1 certificate fingerprint to Firebase Console:
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
4. Add the SHA-1 fingerprint in Firebase Console > Project Settings > Your Android app

---

## ✅ Testing

### Google Sign-In Testing

1. **Android Emulator**: Works with Google Play Services installed
2. **iOS Simulator**: **Does NOT work** - requires real device
3. **Real Devices**: Full functionality

**Test Steps**:

1. Launch the app
2. Tap "Sign in with Google"
3. Select your Google account
4. Grant permissions
5. Verify successful login and redirection to Terms screen

### Apple Sign-In Testing

1. **iOS Simulator**: **Does NOT work** - requires real device
2. **Real iOS Device**: Full functionality (iOS 13+)

**Test Steps**:

1. Launch the app on a real iOS device
2. Tap "Sign in with Apple"
3. Choose to share or hide your email
4. Authenticate with Face ID/Touch ID/passcode
5. Verify successful login and redirection to Terms screen

---

## 🐛 Troubleshooting

### Google Sign-In Issues

**Error**: "Developer Error"

- **Solution**: Check that your Web Client ID is correct in `.env`
- Verify the OAuth 2.0 client is enabled in Google Cloud Console

**Error**: "Sign in cancelled"

- **Solution**: User cancelled the sign-in flow - this is normal

**Error**: "No Google Play Services"

- **Solution**: Only on Android - install Google Play Services on your emulator

### Apple Sign-In Issues

**Error**: "Not supported on this device"

- **Solution**: Apple Sign-In requires iOS 13+ and a real device

**Error**: "Invalid Service ID"

- **Solution**: Verify Service ID in Apple Developer Console matches Firebase configuration

**Error**: "No identity token"

- **Solution**: Check that Sign In with Apple is enabled in your app's capabilities

---

## 🔒 Security Best Practices

1. **Never commit** `.env` file or credentials to version control
2. **Rotate** your OAuth credentials periodically
3. **Monitor** authentication logs in Firebase Console
4. **Limit** OAuth scopes to only what you need
5. **Validate** ID tokens on your backend (if you have one)

---

## 📚 Additional Resources

- [Google Sign-In for React Native](https://github.com/react-native-google-signin/google-signin)
- [Apple Sign-In for React Native](https://github.com/invertase/react-native-apple-authentication)
- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Apple Sign In Documentation](https://developer.apple.com/documentation/sign_in_with_apple)

---

## 🎯 Next Steps

After completing this setup:

1. Test social login on real devices
2. Monitor authentication success rates in Firebase Console
3. Set up error tracking (e.g., Sentry) for production
4. Consider adding phone authentication as an alternative
5. Implement account linking if users sign in with multiple methods

---

**Last Updated**: December 14, 2024
**Maintained By**: Lightning Pickleball Team
