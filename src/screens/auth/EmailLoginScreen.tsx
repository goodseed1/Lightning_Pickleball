import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
// 🎯 [KIM FIX] Android SafeArea 지원을 위해 react-native-safe-area-context 사용
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../firebase/config';
import { emailService, EmailStatus, EmailValidationReason } from '../../services/emailService';

// 📧 Email verification waiting state type
type VerificationState = 'none' | 'pending';

interface EmailLoginScreenProps {
  onNavigateBack: () => void;
  onNavigateToTerms?: () => void;
}

const EmailLoginScreen: React.FC<EmailLoginScreenProps> = ({ onNavigateBack }) => {
  const { t } = useLanguage();
  const { signInWithEmail, signUpWithEmail, resendVerificationEmail } = useAuth();

  const [isLogin, setIsLogin] = useState(true); // true for login, false for signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 📧 Email verification state
  const [verificationState, setVerificationState] = useState<VerificationState>('none');
  const [pendingEmail, setPendingEmail] = useState('');

  // 📧 Email availability check states (Sign Up mode only)
  const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle');
  const [emailError, setEmailError] = useState<EmailValidationReason | null>(null);
  const emailCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const EMAIL_CHECK_DEBOUNCE_MS = 500;

  // 📧 Debounced email availability check (works for both Login and Sign Up)
  const checkEmailAvailability = useCallback(async (emailToCheck: string) => {
    // Clear previous timer
    if (emailCheckTimerRef.current) {
      clearTimeout(emailCheckTimerRef.current);
    }

    // Quick local validation first
    const localValidation = emailService.validateLocally(emailToCheck);
    if (!localValidation.valid) {
      setEmailStatus('idle');
      setEmailError(localValidation.reason || null);
      return;
    }

    // Reset error, start checking
    setEmailError(null);
    setEmailStatus('checking');

    // Debounce the Firebase check
    emailCheckTimerRef.current = setTimeout(async () => {
      try {
        const result = await emailService.checkAvailability(emailToCheck);
        if (result.available) {
          setEmailStatus('available');
          setEmailError(null);
        } else {
          setEmailStatus('unavailable');
          setEmailError(result.reason || 'taken');
        }
      } catch {
        setEmailStatus('error');
        setEmailError(null);
      }
    }, EMAIL_CHECK_DEBOUNCE_MS);
  }, []);

  // 📧 Handle email input change (both Login and Sign Up modes)
  const handleEmailChange = useCallback(
    (newEmail: string) => {
      setEmail(newEmail);
      if (newEmail.trim().length > 0) {
        checkEmailAvailability(newEmail);
      } else {
        setEmailStatus('idle');
        setEmailError(null);
      }
    },
    [checkEmailAvailability]
  );

  // 📧 Reset email status when switching between login/signup
  useEffect(() => {
    setEmailStatus('idle');
    setEmailError(null);
    // Re-check email when switching modes
    if (email.trim().length > 0) {
      checkEmailAvailability(email);
    }
  }, [isLogin, email, checkEmailAvailability]);

  // 📧 Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (emailCheckTimerRef.current) {
        clearTimeout(emailCheckTimerRef.current);
      }
    };
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const handleEmailAuth = async () => {
    // 🎯 Validate inputs with friendly modals
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        t('emailLogin.alerts.inputRequired.title'),
        t('emailLogin.alerts.inputRequired.message'),
        [{ text: t('common.ok') }]
      );
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert(
        t('emailLogin.alerts.invalidEmail.title'),
        t('emailLogin.alerts.invalidEmail.message'),
        [{ text: t('common.ok') }]
      );
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert(
        t('emailLogin.alerts.passwordTooShort.title'),
        t('emailLogin.alerts.passwordTooShort.message'),
        [{ text: t('common.ok') }]
      );
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      Alert.alert(
        t('emailLogin.alerts.passwordMismatch.title'),
        t('emailLogin.alerts.passwordMismatch.message'),
        [{ text: t('common.ok') }]
      );
      return;
    }

    // 📧 Block sign up if email is already taken (real-time validation result)
    if (!isLogin && emailStatus === 'unavailable') {
      Alert.alert(
        t('emailLogin.alerts.emailAlreadyRegistered.title'),
        t('emailLogin.alerts.emailAlreadyRegistered.message'),
        [
          {
            text: t('emailLogin.buttons.goToLogin'),
            onPress: () => setIsLogin(true),
          },
          {
            text: t('common.ok'),
            style: 'cancel',
          },
        ]
      );
      return;
    }

    setIsLoading(true);

    try {
      let result;
      if (isLogin) {
        // Login with existing account
        result = await signInWithEmail(email, password);
        if (result.success) {
          // Firebase 인증 성공 - onAuthStateChanged가 자동으로 적절한 화면으로 전환
          console.log('✅ EmailLoginScreen: Login successful - AuthContext will handle navigation');
          return; // 성공 시 함수 종료
        }

        // 📧 Check if email verification is required (for login)
        if (result.emailVerificationRequired) {
          console.log('📧 EmailLoginScreen: Email verification required for login');
          setPendingEmail(result.email || email);
          setVerificationState('pending');
          return;
        }
      } else {
        // Create new account
        result = await signUpWithEmail(email, password);

        // 📧 Check if email verification is required (for signup)
        if (result.success && result.emailVerificationRequired) {
          console.log('📧 EmailLoginScreen: Email verification required - showing verification UI');
          setPendingEmail(result.email || email);
          setVerificationState('pending');
          return;
        }

        if (result.success) {
          // Firebase 회원가입 성공 - onAuthStateChanged가 자동으로 적절한 화면으로 전환
          console.log(
            '✅ EmailLoginScreen: Signup successful - AuthContext will handle navigation'
          );
          return; // 성공 시 함수 종료
        }
      }

      // 🎯 실패 시 result.code를 사용하여 친절한 모달 표시
      console.log('🔍 Auth failed with code:', result?.code, 'error:', result?.error);

      const errorCode = result?.code;
      const errorMessage = result?.error || t('emailLogin.alerts.authError.message');

      // Handle specific Firebase error codes with friendly modals
      if (errorCode) {
        switch (errorCode) {
          case 'auth/invalid-credential':
          case 'auth/wrong-password':
            // 🎯 비밀번호 오류 - 친절한 모달로 안내
            Alert.alert(
              t('emailLogin.alerts.loginFailed.title'),
              t('emailLogin.alerts.loginFailed.message'),
              [
                {
                  text: t('emailLogin.buttons.tryAgain'),
                  style: 'default',
                },
              ]
            );
            return;
          case 'auth/user-not-found':
            // 🎯 계정 없음 - 회원가입 유도 모달
            Alert.alert(
              t('emailLogin.alerts.accountNotFound.title'),
              t('emailLogin.alerts.accountNotFound.message'),
              [
                {
                  text: t('emailLogin.buttons.goToSignup'),
                  onPress: () => setIsLogin(false),
                },
                {
                  text: t('emailLogin.buttons.cancel'),
                  style: 'cancel',
                },
              ]
            );
            return;
          case 'auth/email-already-in-use':
            // 🎯 이미 사용 중인 이메일 - 로그인 유도 모달
            Alert.alert(
              t('emailLogin.alerts.emailAlreadyRegistered.title'),
              t('emailLogin.alerts.emailAlreadyRegistered.message'),
              [
                {
                  text: t('emailLogin.buttons.goToLogin'),
                  onPress: () => setIsLogin(true),
                },
                {
                  text: t('common.ok'),
                  style: 'cancel',
                },
              ]
            );
            return;
          case 'auth/weak-password':
            // 🎯 약한 비밀번호 - 안내 모달
            Alert.alert(
              t('emailLogin.alerts.weakPassword.title'),
              t('emailLogin.alerts.weakPassword.message'),
              [
                {
                  text: t('common.ok'),
                  style: 'default',
                },
              ]
            );
            return;
          case 'auth/invalid-email':
            // 🎯 유효하지 않은 이메일 형식
            Alert.alert(
              t('emailLogin.alerts.invalidEmail.title'),
              t('emailLogin.alerts.invalidEmail.message'),
              [
                {
                  text: t('common.ok'),
                  style: 'default',
                },
              ]
            );
            return;
          case 'auth/too-many-requests':
            // 🎯 너무 많은 시도 - 안내 모달
            Alert.alert(
              t('emailLogin.alerts.tooManyAttempts.title'),
              t('emailLogin.alerts.tooManyAttempts.message'),
              [
                {
                  text: t('common.ok'),
                  style: 'default',
                },
              ]
            );
            return;
          default:
            // 🎯 기타 에러 - 일반 모달
            Alert.alert(t('emailLogin.alerts.authError.title'), errorMessage, [
              {
                text: t('common.ok'),
                style: 'default',
              },
            ]);
        }
      } else {
        // 🎯 에러 코드가 없는 경우 - Fallback 모달
        Alert.alert(t('emailLogin.alerts.genericError.title'), errorMessage, [
          {
            text: t('common.ok'),
            style: 'default',
          },
        ]);
      }
    } catch (error: unknown) {
      // 🎯 예상치 못한 에러 처리
      console.error('Unexpected email authentication error:', error);
      Alert.alert(
        t('emailLogin.alerts.genericError.title'),
        t('emailLogin.alerts.authError.message'),
        [
          {
            text: t('common.ok'),
            style: 'default',
          },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 📧 Handle resend verification email
  const handleResendVerification = async () => {
    if (!pendingEmail || !password) {
      Alert.alert(t('common.error'), t('emailLogin.alerts.missingInfo.message'), [
        {
          text: t('common.ok'),
          onPress: () => {
            setVerificationState('none');
            setPendingEmail('');
          },
        },
      ]);
      return;
    }

    setIsLoading(true);
    try {
      const result = await resendVerificationEmail(pendingEmail, password);
      if (result.success) {
        Alert.alert(
          t('emailLogin.alerts.resendSuccess.title'),
          t('emailLogin.alerts.resendSuccess.message', { email: pendingEmail }),
          [{ text: t('common.ok') }]
        );
      } else {
        Alert.alert(
          t('emailLogin.alerts.resendFailed.title'),
          result.error || t('emailLogin.alerts.resendFailed.message'),
          [{ text: t('common.ok') }]
        );
      }
    } catch {
      Alert.alert(t('common.error'), t('emailLogin.alerts.resendError.message'), [
        { text: t('common.ok') },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // 📧 Handle going back from verification screen
  const handleBackFromVerification = () => {
    setVerificationState('none');
    setPendingEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  // 📧 Handle trying to login after verification
  const handleTryLogin = async () => {
    if (!pendingEmail || !password) {
      Alert.alert(t('common.error'), t('emailLogin.alerts.loginInfoMissing.message'), [
        { text: t('common.ok') },
      ]);
      return;
    }

    setIsLoading(true);
    try {
      const result = await signInWithEmail(pendingEmail, password);
      if (result.success) {
        console.log('✅ EmailLoginScreen: Login after verification successful');
        // Navigation will be handled by AuthContext
        return;
      }

      if (result.emailVerificationRequired) {
        Alert.alert(
          t('emailLogin.alerts.emailNotVerified.title'),
          t('emailLogin.alerts.emailNotVerified.message'),
          [{ text: t('common.ok') }]
        );
        return;
      }

      Alert.alert(
        t('emailLogin.alerts.loginFailed.title'),
        result.error || t('emailLogin.alerts.loginFailed.message'),
        [{ text: t('common.ok') }]
      );
    } catch {
      Alert.alert(t('common.error'), t('emailLogin.alerts.resendError.message'), [
        { text: t('common.ok') },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    // 1. Check if email is entered
    if (!email.trim()) {
      Alert.alert(
        t('emailLogin.alerts.forgotPassword.emailRequired.title'),
        t('emailLogin.alerts.forgotPassword.emailRequired.message'),
        [{ text: t('common.ok') }]
      );
      return;
    }

    // 2. Validate email format
    const localValidation = emailService.validateLocally(email);
    if (!localValidation.valid) {
      Alert.alert(
        t('emailLogin.alerts.invalidEmail.title'),
        t('emailLogin.alerts.forgotPassword.invalidFormat.message'),
        [{ text: t('common.ok') }]
      );
      return;
    }

    // 3. Check if email is registered (using current emailStatus)
    if (emailStatus === 'available') {
      // Email not registered - prompt to sign up
      Alert.alert(
        t('emailLogin.alerts.forgotPassword.notRegistered.title'),
        t('emailLogin.alerts.forgotPassword.notRegistered.message'),
        [
          {
            text: t('emailLogin.title.signup'),
            onPress: () => setIsLogin(false),
          },
          {
            text: t('common.cancel'),
            style: 'cancel',
          },
        ]
      );
      return;
    }

    // 4. Send password reset email
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.toLowerCase().trim());
      Alert.alert(
        t('emailLogin.alerts.forgotPassword.emailSent.title'),
        t('emailLogin.alerts.forgotPassword.emailSent.message', { email }),
        [{ text: t('common.ok') }]
      );
    } catch (error: unknown) {
      console.error('📧 [ForgotPassword] Error:', error);
      const firebaseError = error as { code?: string };

      if (firebaseError.code === 'auth/user-not-found') {
        Alert.alert(
          t('emailLogin.alerts.forgotPassword.notRegistered.title'),
          t('emailLogin.alerts.forgotPassword.userNotFound.message'),
          [{ text: t('common.ok') }]
        );
      } else if (firebaseError.code === 'auth/too-many-requests') {
        Alert.alert(
          t('emailLogin.alerts.tooManyAttempts.title'),
          t('emailLogin.alerts.forgotPassword.tooManyRequests.message'),
          [{ text: t('common.ok') }]
        );
      } else {
        Alert.alert(
          t('emailLogin.alerts.genericError.title'),
          t('emailLogin.alerts.forgotPassword.sendError.message'),
          [{ text: t('common.ok') }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 📧 Email Verification Pending UI
  if (verificationState === 'pending') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.verificationContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBackFromVerification}>
              <Ionicons name='arrow-back' size={24} color='#333' />
            </TouchableOpacity>
            <Text style={styles.title}>{t('emailLogin.title.verification')}</Text>
          </View>

          {/* Verification Content */}
          <View style={styles.verificationContent}>
            <MaterialCommunityIcons name='email-check-outline' size={80} color='#1976d2' />

            <Text style={styles.verificationTitle}>{t('emailLogin.verification.checkEmail')}</Text>

            <Text style={styles.verificationEmail}>{pendingEmail}</Text>

            <Text style={styles.verificationDescription}>
              {t('emailLogin.verification.description')}
            </Text>

            {/* Try Login Button */}
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleTryLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size='small' color='#fff' />
              ) : (
                <Text style={styles.submitButtonText}>
                  {t('emailLogin.buttons.loginAfterVerification')}
                </Text>
              )}
            </TouchableOpacity>

            {/* Resend Button */}
            <TouchableOpacity
              style={[styles.resendButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleResendVerification}
              disabled={isLoading}
            >
              <Ionicons name='refresh-outline' size={18} color='#1976d2' />
              <Text style={styles.resendButtonText}>
                {t('emailLogin.buttons.resendVerification')}
              </Text>
            </TouchableOpacity>

            {/* Change Email Link */}
            <TouchableOpacity
              style={styles.changeEmailButton}
              onPress={handleBackFromVerification}
              disabled={isLoading}
            >
              <Text style={styles.changeEmailText}>{t('emailLogin.buttons.changeEmail')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps='handled'
          bounces={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onNavigateBack}>
              <Ionicons name='arrow-back' size={24} color='#333' />
            </TouchableOpacity>
            <Text style={styles.title}>
              {isLogin ? t('emailLogin.title.login') : t('emailLogin.title.signup')}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('emailLogin.labels.email')}</Text>
              <View
                style={[
                  styles.inputWrapper,
                  // 📧 Border color based on email status
                  // Sign Up: available=good, unavailable=bad
                  // Login: available=bad (no account), unavailable=good (account exists)
                  !isLogin && emailStatus === 'available' && styles.inputWrapperSuccess,
                  !isLogin && emailStatus === 'unavailable' && styles.inputWrapperError,
                  isLogin && emailStatus === 'unavailable' && styles.inputWrapperSuccess,
                  isLogin && emailStatus === 'available' && styles.inputWrapperError,
                ]}
              >
                <Ionicons name='mail-outline' size={20} color='#666' style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder={t('emailLogin.placeholders.email')}
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType='email-address'
                  textContentType='emailAddress'
                  autoComplete='email'
                  autoCapitalize='none'
                  autoCorrect={false}
                  spellCheck={false}
                  importantForAutofill='yes'
                  editable={!isLoading}
                />
                {/* 📧 Email status indicator */}
                {emailStatus === 'checking' && (
                  <ActivityIndicator size='small' color='#1976d2' style={styles.emailStatusIcon} />
                )}
                {/* Sign Up: available = good (checkmark) */}
                {!isLogin && emailStatus === 'available' && (
                  <Ionicons
                    name='checkmark-circle'
                    size={20}
                    color='#4CAF50'
                    style={styles.emailStatusIcon}
                  />
                )}
                {/* Sign Up: unavailable = bad (X) */}
                {!isLogin && emailStatus === 'unavailable' && (
                  <Ionicons
                    name='close-circle'
                    size={20}
                    color='#F44336'
                    style={styles.emailStatusIcon}
                  />
                )}
                {/* Login: unavailable = good (account exists, checkmark) */}
                {isLogin && emailStatus === 'unavailable' && (
                  <Ionicons
                    name='checkmark-circle'
                    size={20}
                    color='#4CAF50'
                    style={styles.emailStatusIcon}
                  />
                )}
                {/* Login: available = bad (no account, X) */}
                {isLogin && emailStatus === 'available' && (
                  <Ionicons
                    name='close-circle'
                    size={20}
                    color='#F44336'
                    style={styles.emailStatusIcon}
                  />
                )}
              </View>
              {/* 📧 Email validation messages */}
              {/* Sign Up: unavailable = error */}
              {!isLogin && emailStatus === 'unavailable' && emailError && (
                <Text style={styles.emailErrorText}>
                  {emailService.getErrorMessage(emailError)}
                </Text>
              )}
              {/* Sign Up: available = success */}
              {!isLogin && emailStatus === 'available' && (
                <Text style={styles.emailSuccessText}>{t('emailLogin.emailStatus.available')}</Text>
              )}
              {/* Login: available = error (no account) */}
              {isLogin && emailStatus === 'available' && (
                <Text style={styles.emailErrorText}>
                  {t('emailLogin.emailStatus.noAccountFound')}
                </Text>
              )}
              {/* Login: unavailable = success (account exists) */}
              {isLogin && emailStatus === 'unavailable' && (
                <Text style={styles.emailSuccessText}>
                  {t('emailLogin.emailStatus.accountFound')}
                </Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('emailLogin.labels.password')}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name='lock-closed-outline'
                  size={20}
                  color='#666'
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder={t('emailLogin.placeholders.password')}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  textContentType='password'
                  autoComplete='password'
                  autoCapitalize='none'
                  autoCorrect={false}
                  spellCheck={false}
                  importantForAutofill='yes'
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color='#666'
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input (Sign Up only) */}
            {!isLogin && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('emailLogin.labels.confirmPassword')}</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name='lock-closed-outline'
                    size={20}
                    color='#666'
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder={t('emailLogin.placeholders.confirmPassword')}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    textContentType='password'
                    autoComplete='password'
                    autoCapitalize='none'
                    autoCorrect={false}
                    spellCheck={false}
                    importantForAutofill='yes'
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color='#666'
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Forgot Password (Login only) */}
            {isLogin && (
              <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordText}>
                  {t('emailLogin.buttons.forgotPassword')}
                </Text>
              </TouchableOpacity>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleEmailAuth}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size='small' color='#fff' />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isLogin ? t('emailLogin.title.login') : t('emailLogin.title.signup')}
                </Text>
              )}
            </TouchableOpacity>

            {/* Toggle Login/Signup */}
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleText}>
                {isLogin ? t('emailLogin.toggle.noAccount') : t('emailLogin.toggle.hasAccount')}
              </Text>
              <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                <Text style={styles.toggleLink}>
                  {isLogin ? t('emailLogin.title.signup') : t('emailLogin.title.login')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 10,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
  },
  // 📧 Success border for available email
  inputWrapperSuccess: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  // 📧 Error border for unavailable email
  inputWrapperError: {
    borderColor: '#F44336',
    borderWidth: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  // 📧 Email status icon
  emailStatusIcon: {
    marginLeft: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
    color: '#333',
  },
  eyeButton: {
    padding: 8,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 30,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  toggleText: {
    fontSize: 14,
    color: '#666',
  },
  toggleLink: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '600',
  },
  // 📧 Email validation messages
  emailErrorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 6,
    marginLeft: 4,
  },
  emailSuccessText: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 6,
    marginLeft: 4,
  },
  // 📧 Email Verification Styles
  verificationContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 20,
  },
  verificationContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  verificationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  verificationEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 16,
  },
  verificationDescription: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1976d2',
    marginTop: 12,
  },
  resendButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1976d2',
    marginLeft: 8,
  },
  changeEmailButton: {
    marginTop: 24,
    paddingVertical: 8,
  },
  changeEmailText: {
    fontSize: 14,
    color: '#666',
    textDecorationLine: 'underline',
  },
});

export default EmailLoginScreen;
