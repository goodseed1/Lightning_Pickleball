/**
 * ⚡ LTR System Migration Complete
 *
 * UI 표시: "LTR" (Lightning Tennis Rating)
 * 코드/DB: "ltr" - 변수명, 함수명, 새 Firestore 필드명
 *
 * Migration: NTRP → LTR 완료
 */
import React from 'react';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import LoginScreenSimple from '../screens/auth/LoginScreenSimple';
import EmailLoginScreen from '../screens/auth/EmailLoginScreen';
import TermsAndConditionsScreen from '../screens/auth/TermsAndConditionsScreen';
import OnboardingContainer from '../screens/auth/OnboardingContainer';
import LtrAssessmentScreen from '../screens/auth/LtrAssessmentScreen';

// Answer type from LtrAssessmentScreen
interface Answer {
  questionId: string;
  selectedOption: string;
}

// AssessmentResult type from LtrAssessmentScreen
interface AssessmentResult {
  recommendedLtr: number;
  confidence: number;
  categoryScores: {
    groundstrokes: number;
    volley: number;
    serve: number;
    return: number;
    tactics: number;
    experience: number;
  };
}

export type AuthStackParamList = {
  Login: undefined;
  EmailLogin: undefined;
  Terms: undefined;
  Onboarding: undefined;
  LtrAssessment: {
    onSelect: (
      ltr: number,
      assessmentData: { answers: Answer[]; result: AssessmentResult }
    ) => void;
  };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

// Login Screen with navigation prop
const LoginScreenWithNavigation: React.FC<NativeStackScreenProps<AuthStackParamList, 'Login'>> = ({
  navigation,
}) => {
  const handleNavigateToEmailLogin = () => {
    navigation.navigate('EmailLogin');
  };

  // Note: Social login navigation is handled automatically by AppNavigator
  // based on auth state changes - no manual navigation needed

  return <LoginScreenSimple onNavigateToEmailLogin={handleNavigateToEmailLogin} />;
};

const EmailLoginScreenWithNavigation = () => {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();

  return (
    <EmailLoginScreen
      onNavigateBack={() => {
        navigation.goBack();
      }}
      onNavigateToTerms={() => {
        navigation.navigate('Terms');
      }}
    />
  );
};

const TermsScreenWithNavigation = () => {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();

  return (
    <TermsAndConditionsScreen
      onComplete={() => {
        navigation.navigate('Onboarding');
      }}
      onBack={() => {
        navigation.navigate('Login');
      }}
    />
  );
};

const OnboardingWithNavigation: React.FC<
  NativeStackScreenProps<AuthStackParamList, 'Onboarding'>
> = () => {
  return (
    <OnboardingContainer
      onComplete={userData => {
        console.log('Onboarding completed:', userData);
        // AuthContext handles the navigation to main app
      }}
    />
  );
};

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName='Login'
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name='Login' component={LoginScreenWithNavigation} />
      <Stack.Screen name='EmailLogin' component={EmailLoginScreenWithNavigation} />
      <Stack.Screen name='Terms' component={TermsScreenWithNavigation} />
      <Stack.Screen name='Onboarding' component={OnboardingWithNavigation} />
      <Stack.Screen
        name='LtrAssessment'
        component={LtrAssessmentScreen}
        options={{
          headerShown: true,
          // Title is set dynamically in LtrAssessmentScreen using i18n
          title: '',
        }}
      />
    </Stack.Navigator>
  );
}
