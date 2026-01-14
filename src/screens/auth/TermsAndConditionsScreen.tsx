/**
 * 📝 LTR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LTR" (Lightning Tennis Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LTR로 변경하고 코드는 ntrp를 유지합니다.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../hooks/useTheme';
import { getLightningTennisTheme } from '../../theme';

interface TermsAndConditionsScreenProps {
  onComplete: () => void;
  onBack: () => void;
}

interface TermsAgreement {
  id: string;
  key: string;
  titleKey: string;
  required: boolean;
  agreed: boolean;
}

const TermsAndConditionsScreen: React.FC<TermsAndConditionsScreenProps> = ({
  onComplete,
  onBack,
}) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const themeColors = getLightningTennisTheme(theme);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const [agreements, setAgreements] = useState<TermsAgreement[]>([
    {
      id: '1',
      key: 'serviceTerms',
      titleKey: 'terms.serviceTerms',
      required: true,
      agreed: false,
    },
    {
      id: '2',
      key: 'privacyPolicy',
      titleKey: 'terms.privacyPolicy',
      required: true,
      agreed: false,
    },
    {
      id: '3',
      key: 'locationServices',
      titleKey: 'terms.locationServices',
      required: true,
      agreed: false,
    },
    {
      id: '4',
      key: 'liabilityDisclaimer',
      titleKey: 'terms.liabilityDisclaimer',
      required: true,
      agreed: false,
    },
    {
      id: '5',
      key: 'marketingCommunications',
      titleKey: 'terms.marketingCommunications',
      required: false,
      agreed: false,
    },
    {
      id: '6',
      key: 'inclusivityPolicy',
      titleKey: 'terms.inclusivityPolicy',
      required: true,
      agreed: false,
    },
  ]);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const toggleAgreement = (id: string) => {
    setAgreements(prev =>
      prev.map(agreement =>
        agreement.id === id ? { ...agreement, agreed: !agreement.agreed } : agreement
      )
    );
  };

  const toggleAll = () => {
    const allAgreed = agreements.every(a => a.agreed);

    setAgreements(prev => prev.map(agreement => ({ ...agreement, agreed: !allAgreed })));
  };

  const handleContinue = () => {
    const requiredAgreements = agreements.filter(a => a.required);
    const allRequiredAgreed = requiredAgreements.every(a => a.agreed);

    if (!allRequiredAgreed) {
      Alert.alert(t('terms.requiredTermsTitle'), t('terms.requiredTermsMessage'), [
        { text: t('common.ok') },
      ]);
      return;
    }

    onComplete();
  };

  const showTermsDetail = (termsType: string) => {
    const title = t(`terms.details.${termsType}.title`);
    const content = t(`terms.details.${termsType}.content`);

    Alert.alert(title, content, [{ text: t('common.ok') }]);
  };

  const allRequiredAgreed = agreements.filter(a => a.required).every(a => a.agreed);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.colors.background }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name='chevron-back' size={24} color={themeColors.colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.colors.onSurface }]}>
            {t('terms.title')}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: '66%', backgroundColor: themeColors.colors.primary },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: themeColors.colors.onSurfaceVariant }]}>
            {t('terms.stepProgress', { current: 2, total: 3 })}
          </Text>
        </View>

        {/* Content */}
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Introduction */}
          <View style={styles.introSection}>
            <Text style={[styles.introTitle, { color: themeColors.colors.onSurface }]}>
              {t('terms.description')}
            </Text>
            <Text style={[styles.introSubtitle, { color: themeColors.colors.onSurfaceVariant }]}>
              {t('terms.introSubtitle')}
            </Text>
          </View>

          {/* Select All */}
          <TouchableOpacity
            style={[
              styles.selectAllContainer,
              {
                backgroundColor: themeColors.colors.surfaceVariant,
                borderColor: themeColors.colors.outline,
              },
            ]}
            onPress={toggleAll}
          >
            <View style={styles.selectAllContent}>
              <View style={styles.checkboxContainer}>
                <View
                  style={[
                    styles.checkbox,
                    { borderColor: themeColors.colors.outline },
                    allRequiredAgreed && {
                      backgroundColor: themeColors.colors.primary,
                      borderColor: themeColors.colors.primary,
                    },
                  ]}
                >
                  {allRequiredAgreed && (
                    <Ionicons name='checkmark' size={16} color={themeColors.colors.onPrimary} />
                  )}
                </View>
              </View>
              <Text style={[styles.selectAllText, { color: themeColors.colors.onSurface }]}>
                {t('terms.agreeAll')}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Important Notice */}
          <View style={styles.noticeContainer}>
            <View style={styles.noticeHeader}>
              <Ionicons name='warning' size={20} color='#ff6b35' />
              <Text style={styles.noticeTitle}>{t('terms.importantNotice')}</Text>
            </View>
            <Text style={styles.noticeText}>{t('terms.noticeContent')}</Text>
          </View>

          {/* Terms List */}
          <View style={styles.termsList}>
            {agreements.map(agreement => (
              <View key={agreement.id} style={styles.termItem}>
                <TouchableOpacity
                  style={styles.termContent}
                  onPress={() => toggleAgreement(agreement.id)}
                >
                  <View style={styles.checkboxContainer}>
                    <View
                      style={[
                        styles.checkbox,
                        { borderColor: themeColors.colors.outline },
                        agreement.agreed && {
                          backgroundColor: themeColors.colors.primary,
                          borderColor: themeColors.colors.primary,
                        },
                      ]}
                    >
                      {agreement.agreed && (
                        <Ionicons name='checkmark' size={16} color={themeColors.colors.onPrimary} />
                      )}
                    </View>
                  </View>

                  <View style={styles.termText}>
                    <View style={styles.termHeader}>
                      <Text style={[styles.termTitle, { color: themeColors.colors.onSurface }]}>
                        {t(agreement.titleKey)}
                      </Text>
                      <View
                        style={[
                          styles.requirementBadge,
                          agreement.required ? styles.requiredBadge : styles.optionalBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.requirementText,
                            agreement.required ? styles.requiredText : styles.optionalText,
                          ]}
                        >
                          {agreement.required ? t('terms.required') : t('terms.optional')}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => showTermsDetail(agreement.key)}
                >
                  <Ionicons
                    name='document-text-outline'
                    size={20}
                    color={themeColors.colors.onSurfaceVariant}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              {
                backgroundColor: allRequiredAgreed
                  ? themeColors.colors.primary
                  : themeColors.colors.surfaceVariant,
              },
              allRequiredAgreed ? styles.continueButtonActive : styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!allRequiredAgreed}
          >
            <Text
              style={[
                styles.continueButtonText,
                {
                  color: allRequiredAgreed
                    ? themeColors.colors.onPrimary
                    : themeColors.colors.onSurfaceVariant,
                },
                allRequiredAgreed
                  ? styles.continueButtonTextActive
                  : styles.continueButtonTextDisabled,
              ]}
            >
              {t('common.continue')}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 34,
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e1e8ed',
    borderRadius: 2,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  introSection: {
    marginBottom: 30,
    alignItems: 'center',
  },
  introTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  introSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  selectAllContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  selectAllContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectAllText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  termsList: {
    marginBottom: 30,
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  termContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxContainer: {
    marginTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBox: {},
  termText: {
    flex: 1,
    marginLeft: 12,
  },
  termHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  termTitle: {
    fontSize: 16,
    flex: 1,
    marginRight: 10,
  },
  requirementBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  requiredBadge: {
    backgroundColor: '#ff6b35',
  },
  optionalBadge: {
    backgroundColor: '#4caf50',
  },
  requirementText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  requiredText: {
    color: '#fff',
  },
  optionalText: {
    color: '#fff',
  },
  viewButton: {
    padding: 8,
    marginLeft: 10,
  },
  noticeContainer: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#4A90E2',
    marginBottom: 20,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#ff6b35',
  },
  noticeText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#fff',
  },
  buttonContainer: {
    padding: 20,
    paddingTop: 10,
  },
  continueButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonActive: {},
  continueButtonDisabled: {},
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  continueButtonTextActive: {},
  continueButtonTextDisabled: {},
});

export default TermsAndConditionsScreen;
