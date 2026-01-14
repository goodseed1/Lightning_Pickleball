import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import appleAuth from '@invertase/react-native-apple-authentication';
import { useLanguage } from '../../contexts/LanguageContext';
import authService from '../../services/authService';

interface LoginScreenSimpleProps {
  onNavigateToEmailLogin?: () => void;
}

const LoginScreenSimple: React.FC<LoginScreenSimpleProps> = ({ onNavigateToEmailLogin }) => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setIsLoading(true);

    try {
      if (provider === 'google') {
        // Check if device has Google Play Services
        await GoogleSignin.hasPlayServices();

        // 🔄 CRITICAL FIX: Sign out first to clear cached session
        // This ensures fresh account selection and prevents looping issues
        // caused by stale credentials after Genesis Wave data wipe
        try {
          await GoogleSignin.signOut();
          console.log('✅ Previous Google session cleared');
        } catch {
          // Ignore sign out errors (user might not be signed in)
          console.log('ℹ️ No previous Google session to clear');
        }

        // Get Google ID token (now shows account selection)
        // v16 API: signIn() returns { data: { idToken, user, ... } }
        const response = await GoogleSignin.signIn();
        const idToken = response.data?.idToken;

        // If no idToken, user likely cancelled - exit silently
        if (!idToken) {
          console.log('ℹ️ No ID token received - user may have cancelled Google sign-in');
          console.log('📊 Response data:', JSON.stringify(response, null, 2));
          setIsLoading(false);
          return;
        }

        // Sign in with Firebase using the Google ID token
        await authService.signInWithGoogle(idToken);

        console.log('✅ Google login successful');
        // Navigation is handled automatically by AppNavigator based on auth state
        // Do NOT manually navigate - this causes looping issues
      } else if (provider === 'apple') {
        // Perform Apple authentication
        const appleAuthRequestResponse = await appleAuth.performRequest({
          requestedOperation: appleAuth.Operation.LOGIN,
          requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
        });

        const { identityToken, nonce } = appleAuthRequestResponse;

        if (!identityToken) {
          throw new Error('No identity token received from Apple Sign-In');
        }

        // Sign in with Firebase using the Apple identity token
        await authService.signInWithApple(identityToken, nonce);

        console.log('✅ Apple login successful');
        // Navigation is handled automatically by AppNavigator based on auth state
        // Do NOT manually navigate - this causes looping issues
      }
    } catch (error: unknown) {
      // Handle user cancellation silently (no error message)
      const errorWithCode = error as { code?: string | number; message?: string };
      const errorMessage = String(error);

      // Google Sign-In cancellation
      if (provider === 'google' && errorWithCode.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('ℹ️ User cancelled Google sign-in');
        setIsLoading(false);
        return;
      }

      // Apple Sign-In cancellation
      // Apple uses error code 1000 or 1001 for user cancellation
      if (provider === 'apple') {
        const isAppleCancellation =
          errorWithCode.code === '1000' ||
          errorWithCode.code === '1001' ||
          errorWithCode.code === 1000 ||
          errorWithCode.code === 1001 ||
          errorMessage.includes('error 1000') ||
          errorMessage.includes('error 1001');

        if (isAppleCancellation) {
          console.log('ℹ️ User cancelled Apple sign-in');
          setIsLoading(false);
          return;
        }
      }

      // Show error only for actual failures
      console.error(`❌ ${provider} login failed:`, error);
      Alert.alert(
        t('common.error'),
        `${provider === 'google' ? 'Google' : 'Apple'} login failed. Please try again.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = () => {
    if (onNavigateToEmailLogin) {
      onNavigateToEmailLogin();
    } else {
      console.warn('onNavigateToEmailLogin function not provided');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* 🎨 Force dark status bar on white background */}
      <StatusBar style='dark' />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Image
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                source={require('../../../assets/images/lightning-tennis-icon.png')}
                style={styles.appIcon}
                resizeMode='contain'
              />
              <Text style={styles.appTitle}>Lightning Tennis</Text>
            </View>
            <Text style={styles.tagline}>{t('home.subtitle')}</Text>
            <Text style={styles.description}>{t('auth.loginDescription')}</Text>
          </View>

          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>{t('auth.welcomeTitle')}</Text>
            <Text style={styles.welcomeSubtitle}>{t('auth.welcomeSubtitle')}</Text>
          </View>

          {/* Social Login Buttons */}
          <View style={styles.socialLoginSection}>
            {/* Google Login */}
            <TouchableOpacity
              style={[styles.socialButton, styles.googleButton]}
              onPress={() => handleSocialLogin('google')}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Ionicons name='logo-google' size={24} color='#db4437' />
              <Text style={styles.socialButtonText}>{t('auth.loginWithGoogle')}</Text>
            </TouchableOpacity>

            {/* Apple Login (iOS only) */}
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[styles.socialButton, styles.appleButton]}
                onPress={() => handleSocialLogin('apple')}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <Ionicons name='logo-apple' size={24} color='#fff' />
                <Text style={[styles.socialButtonText, styles.appleButtonText]}>
                  {t('auth.loginWithApple')}
                </Text>
              </TouchableOpacity>
            )}

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('common.or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email Login */}
            <TouchableOpacity
              style={[styles.socialButton, styles.emailButton]}
              onPress={handleEmailLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Ionicons name='mail' size={24} color='#666' />
              <Text style={[styles.socialButtonText, styles.emailButtonText]}>
                {t('auth.continueWithEmail')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Features Preview */}
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>{t('auth.whatYouGet')}</Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Image
                  // eslint-disable-next-line @typescript-eslint/no-require-imports
                  source={require('../../../assets/images/lightning-tennis-icon.png')}
                  style={styles.featureAppIcon}
                  resizeMode='contain'
                />
                <Text style={styles.featureText}>{t('auth.feature1')}</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🏟️</Text>
                <Text style={styles.featureText}>{t('auth.feature2')}</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🎾</Text>
                <Text style={styles.featureText}>{t('auth.feature3')}</Text>
              </View>
            </View>
          </View>

          {/* Terms Notice */}
          <View style={styles.termsNotice}>
            <Text style={styles.termsText}>{t('auth.termsNotice')}</Text>
          </View>

          {/* Loading Indicator */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <Animated.View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>{t('common.loading')}</Text>
              </Animated.View>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 20,
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 30,
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  appIcon: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1976d2',
    textAlign: 'center',
  },
  tagline: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  socialLoginSection: {
    marginBottom: 30,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  googleButton: {
    backgroundColor: '#fff',
    borderColor: '#db4437',
  },
  appleButton: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  emailButton: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e1e8ed',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    color: '#333',
  },
  appleButtonText: {
    color: '#fff',
  },
  emailButtonText: {
    color: '#666',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e1e8ed',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
    fontSize: 14,
  },
  featuresSection: {
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  featureAppIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#666',
  },
  termsNotice: {
    alignItems: 'center',
    marginBottom: 20,
  },
  termsText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#333',
  },
});

export default LoginScreenSimple;
