/**
 * 🎾 Onboarding Container
 *
 * 온보딩 플로우를 관리하는 컨테이너 컴포넌트.
 * 언어 선택 → 약관 동의 → 프로필 설정 → LPR 레벨 선택 순서로 진행.
 *
 * 📝 LPR System - Lightning Pickleball Rating
 * - LPR은 1-10까지의 정수 값
 * - 온보딩에서는 LPR 1-5까지만 선택 가능
 * - LPR 6 이상은 매치를 통해서만 획득 가능
 *
 * @author Kim (LPR System Transition)
 * @date 2025-12-28
 */
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageSelectionScreen from '../LanguageSelectionScreen';
import TermsAndConditionsScreen from './TermsAndConditionsScreen';
import ProfileSetupScreen, { ProfileData } from './ProfileSetupScreen';
// 🎨 [REMOVED] ThemeSelectionScreen - 테마 선택은 온보딩에서 제거됨 (기본값: 다크 모드)
import { Answer, AssessmentResult, calculateRecommendedLtr } from '../../utils/ltrAssessment';
import LtrQuestionScreen from './LtrQuestionScreen';
import LtrResultScreen from './LtrResultScreen';
import LtrLevelSelectScreen from './LtrLevelSelectScreen';

interface OnboardingContainerProps {
  onComplete: (userData: UserData) => void;
}

export interface UserData {
  language: 'en' | 'ko';
  authProvider: 'google' | 'apple' | 'facebook' | 'email';
  termsAccepted: boolean;
  profile: ProfileData;
  // onboardingCompletedAt now handled by AuthContext
}

type OnboardingStep =
  | 'language'
  | 'terms'
  | 'profile'
  | 'ltrSelect' // 🎯 Direct level selection (skip assessment)
  | 'ltrQ1' // Optional assessment flow
  | 'ltrQ2'
  | 'ltrQ3'
  | 'ltrQ4'
  | 'ltrResult';

const OnboardingContainer: React.FC<OnboardingContainerProps> = ({ onComplete }) => {
  const { currentLanguage } = useLanguage();
  // 🎯 [KIM FIX] Always start with language selection for new user registration
  // This ensures Step 1 of 3 (Language) is shown before Step 2 of 3 (Terms)
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('language');
  const [userData, setUserData] = useState<Partial<UserData>>({
    language: currentLanguage,
    termsAccepted: false,
    // onboardingCompletedAt now handled by AuthContext
  });

  const handleLanguageSelected = () => {
    setUserData(prev => ({ ...prev, language: currentLanguage }));
    setCurrentStep('terms'); // Skip login, go directly to terms
  };

  // Remove login-related handlers since user is already authenticated
  // Set default auth provider to email since user completed Firebase signup

  const handleTermsAccepted = () => {
    setUserData(prev => ({ ...prev, termsAccepted: true }));
    setCurrentStep('profile');
  };

  const [ltrAnswers, setLtrAnswers] = useState<Answer[]>([]);
  const [ltrResult, setLtrResult] = useState<AssessmentResult | null>(null);

  const handleProfileComplete = (profileData: ProfileData) => {
    console.log('🏁 OnboardingContainer: Received profile data');
    console.log('📋 Profile data:', profileData);

    // 🎯 Store profile data and move to LPR level selection
    setUserData(prev => ({ ...prev, profile: profileData }));
    setCurrentStep('ltrSelect');
  };

  // 🎯 Start optional LPR assessment from level selection screen
  const handleLtrStartAssessment = () => {
    console.log('📝 OnboardingContainer: Starting LPR assessment');
    setCurrentStep('ltrQ1');
  };

  const handleLtrQuestionNext = (fromPage: 1 | 2 | 3 | 4) => {
    if (fromPage === 1) setCurrentStep('ltrQ2');
    else if (fromPage === 2) setCurrentStep('ltrQ3');
    else if (fromPage === 3) setCurrentStep('ltrQ4');
    else if (fromPage === 4) {
      // Calculate result
      const result = calculateRecommendedLtr(ltrAnswers);
      setLtrResult(result);
      setCurrentStep('ltrResult');
    }
  };

  const handleLtrQuestionBack = (fromPage: 1 | 2 | 3 | 4) => {
    // 🎯 Q1에서 뒤로가기 시 ltrSelect로 이동 (평가 취소)
    if (fromPage === 1) setCurrentStep('ltrSelect');
    else if (fromPage === 2) setCurrentStep('ltrQ1');
    else if (fromPage === 3) setCurrentStep('ltrQ2');
    else if (fromPage === 4) setCurrentStep('ltrQ3');
  };

  const handleLtrLevelSelect = (ltr: number) => {
    console.log('🎾 OnboardingContainer: LPR level selected:', ltr);

    // 🛡️ Save both skillLevel (number) and ltrLevel (string) for compatibility
    const updatedProfile = {
      ...userData.profile!,
      skillLevel: ltr, // Number (e.g., 3)
      ltrLevel: String(ltr), // String (e.g., '3')
    };

    // 🎨 [REMOVED] Theme selection step - directly complete onboarding
    // 기본 테마는 다크 모드 (ThemeContext의 기본값)
    console.log('🏁 OnboardingContainer: Skipping theme selection - completing onboarding');

    try {
      const completeUserData: UserData = {
        language: currentLanguage,
        authProvider: 'email',
        termsAccepted: true,
        profile: updatedProfile,
      };

      console.log('✅ OnboardingContainer: Complete profile data prepared');
      onComplete(completeUserData);
    } catch (error) {
      console.error('❌ OnboardingContainer: Error during onboarding completion:', error);
      const completeUserData: UserData = {
        language: currentLanguage,
        authProvider: 'email',
        termsAccepted: true,
        profile: updatedProfile,
      };
      onComplete(completeUserData);
    }
  };

  const handleLtrResultBack = () => {
    setCurrentStep('ltrQ4');
  };

  const handleStepBack = () => {
    switch (currentStep) {
      case 'terms':
        setCurrentStep('language');
        break;
      case 'profile':
        setCurrentStep('terms');
        break;
      case 'ltrSelect':
        setCurrentStep('profile');
        break;
      case 'ltrQ1':
        setCurrentStep('profile');
        break;
      case 'ltrQ2':
        setCurrentStep('ltrQ1');
        break;
      case 'ltrQ3':
        setCurrentStep('ltrQ2');
        break;
      case 'ltrQ4':
        setCurrentStep('ltrQ3');
        break;
      case 'ltrResult':
        setCurrentStep('ltrQ4');
        break;
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'language':
        return <LanguageSelectionScreen onLanguageSelected={handleLanguageSelected} />;

      case 'terms':
        return (
          <TermsAndConditionsScreen onComplete={handleTermsAccepted} onBack={handleStepBack} />
        );

      case 'profile':
        return <ProfileSetupScreen onComplete={handleProfileComplete} onBack={handleStepBack} />;

      case 'ltrSelect':
        return (
          <LtrLevelSelectScreen
            onSelectLevel={handleLtrLevelSelect}
            onStartAssessment={handleLtrStartAssessment}
            onBack={() => setCurrentStep('profile')}
          />
        );

      case 'ltrQ1':
        return (
          <LtrQuestionScreen
            page={1}
            answers={ltrAnswers}
            onAnswersChange={setLtrAnswers}
            onNext={() => handleLtrQuestionNext(1)}
            onBack={() => handleLtrQuestionBack(1)}
          />
        );

      case 'ltrQ2':
        return (
          <LtrQuestionScreen
            page={2}
            answers={ltrAnswers}
            onAnswersChange={setLtrAnswers}
            onNext={() => handleLtrQuestionNext(2)}
            onBack={() => handleLtrQuestionBack(2)}
          />
        );

      case 'ltrQ3':
        return (
          <LtrQuestionScreen
            page={3}
            answers={ltrAnswers}
            onAnswersChange={setLtrAnswers}
            onNext={() => handleLtrQuestionNext(3)}
            onBack={() => handleLtrQuestionBack(3)}
          />
        );

      case 'ltrQ4':
        return (
          <LtrQuestionScreen
            page={4}
            answers={ltrAnswers}
            onAnswersChange={setLtrAnswers}
            onNext={() => handleLtrQuestionNext(4)}
            onBack={() => handleLtrQuestionBack(4)}
          />
        );

      case 'ltrResult':
        return ltrResult ? (
          <LtrResultScreen
            answers={ltrAnswers}
            result={ltrResult}
            onSelectLevel={handleLtrLevelSelect}
            onBack={handleLtrResultBack}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>{renderCurrentStep()}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default OnboardingContainer;
