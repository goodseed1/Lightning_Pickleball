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
// 🎯 [KIM FIX] Android SafeArea 지원을 위해 react-native-safe-area-context 사용
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import lightningIcon from '../../../assets/images/lightning-pickleball-icon.png';

interface LoginScreenProps {
  onLogin?: () => void;
  onNavigateToTerms?: () => void;
  onNavigateToEmailLogin?: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onNavigateToTerms,
  onNavigateToEmailLogin,
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // Debug props
  React.useEffect(() => {
    console.log('LoginScreen props:', {
      hasOnLogin: !!onLogin,
      hasOnNavigateToTerms: !!onNavigateToTerms,
      hasOnNavigateToEmailLogin: !!onNavigateToEmailLogin,
      onNavigateToEmailLoginType: typeof onNavigateToEmailLogin,
    });
  }, [onLogin, onNavigateToTerms, onNavigateToEmailLogin]);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleSocialLogin = async (provider: 'google' | 'apple' | 'facebook') => {
    setIsLoading(true);

    try {
      // Simulate social login process
      await new Promise(resolve => setTimeout(resolve, 1000));

      Alert.alert(
        t('common.success'),
        `${provider} ${t('auth.login')} ${t('common.success').toLowerCase()}`,
        [
          {
            text: t('common.ok'),
            onPress: onNavigateToTerms,
          },
        ]
      );
    } catch {
      Alert.alert(t('common.error'), t('auth.loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = () => {
    // Only use the prop
    if (onNavigateToEmailLogin && typeof onNavigateToEmailLogin === 'function') {
      console.log('Using onNavigateToEmailLogin prop');
      onNavigateToEmailLogin();
    } else {
      console.log('onNavigateToEmailLogin not available');
      Alert.alert(t('auth.emailLogin'), t('auth.emailLoginSetup'), [{ text: t('common.ok') }]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Image source={lightningIcon} style={styles.appIcon} resizeMode='contain' />
              <Text style={styles.appTitle}>Lightning Pickleball</Text>
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
              <Text style={styles.socialButtonText}>Sign in with Google</Text>
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
                  Sign in with Apple
                </Text>
              </TouchableOpacity>
            )}

            {/* Facebook Login */}
            <TouchableOpacity
              style={[styles.socialButton, styles.facebookButton]}
              onPress={() => handleSocialLogin('facebook')}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Ionicons name='logo-facebook' size={24} color='#fff' />
              <Text style={[styles.socialButtonText, styles.facebookButtonText]}>
                {t('auth.loginWithFacebook')}
              </Text>
            </TouchableOpacity>

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
                <Image source={lightningIcon} style={styles.featureAppIcon} resizeMode='contain' />
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
  facebookButton: {
    backgroundColor: '#1877f2',
    borderColor: '#1877f2',
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
  facebookButtonText: {
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
  featureText: {
    fontSize: 16,
    color: '#666',
  },
  featureAppIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
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

export default LoginScreen;
