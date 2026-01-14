import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Title, Paragraph, Card, Checkbox } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../theme';
import { RootStackParamList } from '../../navigation/AppNavigator';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

export default function RegisterScreen() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { signUpWithEmail } = useAuth();

  const validateForm = (): boolean => {
    const { displayName, email, password, confirmPassword } = formData;

    if (!displayName.trim()) {
      Alert.alert(t('auth.register.errors.title'), t('auth.register.errors.nameRequired'));
      return false;
    }

    if (displayName.trim().length < 2) {
      Alert.alert(t('auth.register.errors.title'), t('auth.register.errors.nameMinLength'));
      return false;
    }

    if (!email.trim()) {
      Alert.alert(t('auth.register.errors.title'), t('auth.register.errors.emailRequired'));
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t('auth.register.errors.title'), t('auth.register.errors.emailInvalid'));
      return false;
    }

    if (!password.trim()) {
      Alert.alert(t('auth.register.errors.title'), t('auth.register.errors.passwordRequired'));
      return false;
    }

    if (password.length < 8) {
      Alert.alert(t('auth.register.errors.title'), t('auth.register.errors.passwordMinLength'));
      return false;
    }

    // 비밀번호 복잡성 검증
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(password)) {
      Alert.alert(t('auth.register.errors.title'), t('auth.register.errors.passwordComplexity'));
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('auth.register.errors.title'), t('auth.register.errors.passwordMismatch'));
      return false;
    }

    if (!agreeTerms) {
      Alert.alert(t('auth.register.errors.title'), t('auth.register.errors.termsRequired'));
      return false;
    }

    if (!agreePrivacy) {
      Alert.alert(t('auth.register.errors.title'), t('auth.register.errors.privacyRequired'));
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await signUpWithEmail(formData.email.trim(), formData.password);

      if (!result.success) {
        Alert.alert(
          t('auth.register.errors.signupFailed'),
          result.error || t('auth.register.errors.unknown')
        );
        return;
      }

      Alert.alert(t('auth.register.success.title'), t('auth.register.success.message'), [
        {
          text: t('auth.register.success.ok'),
          onPress: () => navigation.navigate('Onboarding'),
        },
      ]);
    } catch (error: unknown) {
      let errorMessage = t('auth.register.errors.signupFailedMessage');

      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string };
        if (firebaseError.code === 'auth/email-already-in-use') {
          errorMessage = t('auth.register.errors.emailInUse');
        } else if (firebaseError.code === 'auth/invalid-email') {
          errorMessage = t('auth.register.errors.invalidEmailFormat');
        } else if (firebaseError.code === 'auth/operation-not-allowed') {
          errorMessage = t('auth.register.errors.operationNotAllowed');
        } else if (firebaseError.code === 'auth/weak-password') {
          errorMessage = t('auth.register.errors.weakPassword');
        }
      }

      Alert.alert(t('auth.register.errors.signupFailed'), errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps='handled'
        >
          <View style={styles.header}>
            <Title style={styles.title}>{t('auth.register.title')}</Title>
            <Paragraph style={styles.subtitle}>{t('auth.register.subtitle')}</Paragraph>
          </View>

          <Card style={styles.registerCard}>
            <Card.Content>
              <View style={styles.inputContainer}>
                <TextInput
                  label={t('auth.register.displayName')}
                  value={formData.displayName}
                  onChangeText={value => updateFormData('displayName', value)}
                  mode='outlined'
                  autoCapitalize='words'
                  autoComplete='name'
                  textContentType='name'
                  style={styles.input}
                  disabled={isLoading}
                />

                <TextInput
                  label={t('auth.email')}
                  value={formData.email}
                  onChangeText={value => updateFormData('email', value)}
                  mode='outlined'
                  keyboardType='email-address'
                  autoCapitalize='none'
                  autoComplete='email'
                  textContentType='emailAddress'
                  spellCheck={false}
                  autoCorrect={false}
                  importantForAutofill='yes'
                  style={styles.input}
                  disabled={isLoading}
                />

                <TextInput
                  label={t('auth.password')}
                  value={formData.password}
                  onChangeText={value => updateFormData('password', value)}
                  mode='outlined'
                  secureTextEntry={!showPassword}
                  autoCapitalize='none'
                  autoComplete='password-new'
                  textContentType='newPassword'
                  style={styles.input}
                  disabled={isLoading}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                />

                <TextInput
                  label={t('auth.confirmPassword')}
                  value={formData.confirmPassword}
                  onChangeText={value => updateFormData('confirmPassword', value)}
                  mode='outlined'
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize='none'
                  style={styles.input}
                  disabled={isLoading}
                  right={
                    <TextInput.Icon
                      icon={showConfirmPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    />
                  }
                />

                <Paragraph style={styles.passwordHint}>{t('auth.register.passwordHint')}</Paragraph>
              </View>

              <View style={styles.agreementContainer}>
                <View style={styles.checkboxRow}>
                  <Checkbox
                    status={agreeTerms ? 'checked' : 'unchecked'}
                    onPress={() => setAgreeTerms(!agreeTerms)}
                    disabled={isLoading}
                  />
                  <Button
                    mode='text'
                    compact
                    onPress={() =>
                      Alert.alert(
                        t('auth.register.termsComingSoon'),
                        t('auth.register.termsComingSoonMessage')
                      )
                    }
                    style={styles.agreementButton}
                  >
                    {t('auth.register.agreeTerms')}
                  </Button>
                </View>

                <View style={styles.checkboxRow}>
                  <Checkbox
                    status={agreePrivacy ? 'checked' : 'unchecked'}
                    onPress={() => setAgreePrivacy(!agreePrivacy)}
                    disabled={isLoading}
                  />
                  <Button
                    mode='text'
                    compact
                    onPress={() =>
                      Alert.alert(
                        t('auth.register.privacyComingSoon'),
                        t('auth.register.privacyComingSoonMessage')
                      )
                    }
                    style={styles.agreementButton}
                  >
                    {t('auth.register.agreePrivacy')}
                  </Button>
                </View>
              </View>

              <Button
                mode='contained'
                onPress={handleRegister}
                style={styles.registerButton}
                disabled={isLoading}
                loading={isLoading}
              >
                {isLoading ? t('auth.register.signingUp') : t('auth.signup')}
              </Button>
            </Card.Content>
          </Card>

          <View style={styles.loginContainer}>
            <Paragraph style={styles.loginText}>{t('auth.alreadyHaveAccount')}</Paragraph>
            <Button mode='text' onPress={() => navigation.goBack()} disabled={isLoading}>
              {t('auth.login')}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.md,
    paddingTop: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    color: theme.colors.onSurface,
    fontSize: 16,
    opacity: 0.7,
  },
  registerCard: {
    marginBottom: theme.spacing.lg,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  passwordHint: {
    fontSize: 12,
    color: theme.colors.onSurface,
    opacity: 0.6,
    marginTop: -theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  agreementContainer: {
    marginBottom: theme.spacing.lg,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  agreementButton: {
    flex: 1,
    justifyContent: 'flex-start',
    marginLeft: -theme.spacing.sm,
  },
  registerButton: {
    paddingVertical: theme.spacing.xs,
  },
  loginContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    marginRight: theme.spacing.xs,
  },
});
