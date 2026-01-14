/**
 * 🎾 LPR Level Selection Screen
 *
 * Direct level selection screen for streamlined onboarding.
 * Users can either select their level directly or take the optional assessment.
 *
 * 📝 LPR System - Lightning Pickleball Rating
 *
 * UI 표시: "LPR" (Lightning Pickleball Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ltr" - 변수명, 함수명, 새로운 Firestore 필드명
 *
 * LPR은 1-10까지의 정수 값으로, 온보딩에서는 LPR 1-5까지만 선택 가능합니다.
 * LPR 6 이상은 매치를 통해서만 획득할 수 있습니다.
 *
 * @author Kim (LPR System Transition)
 * @date 2025-12-28
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { lightningPickleballDarkTheme } from '../../theme';
import { getInitialEloFromLtr, getLocalizedText } from '../../constants/lpr';
import { LPR_LEVELS, getOnboardingLtrLevels } from '../../constants/lpr';
import LtrLevelDetailModal from './LtrLevelDetailModal';

// ============================================================================
// Type Definitions
// ============================================================================

interface LtrLevelSelectScreenProps {
  onSelectLevel: (ltr: number) => void;
  onStartAssessment: () => void;
  onBack: () => void;
}

// ============================================================================
// Main Component
// ============================================================================

const LtrLevelSelectScreen: React.FC<LtrLevelSelectScreenProps> = ({
  onSelectLevel,
  onStartAssessment,
  onBack,
}) => {
  const { currentLanguage, t } = useLanguage();
  const themeColors = lightningPickleballDarkTheme.colors;

  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalLtr, setModalLtr] = useState<number>(3);

  // Get onboarding levels (LPR 1-5)
  const onboardingLevels = getOnboardingLtrLevels();

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleLevelSelect = (ltr: number) => {
    setSelectedLevel(ltr);

    const levelDetails = LPR_LEVELS.find(l => l.value === ltr);
    const levelLabel = levelDetails
      ? getLocalizedText(levelDetails.label, currentLanguage)
      : `LPR ${ltr}`;

    Alert.alert(
      t('ltrLevelSelect.confirmTitle') || 'Confirm Level',
      (t('ltrLevelSelect.confirmMessage', { level: levelLabel }) as string) ||
        `Are you sure you want to select ${levelLabel}?`,
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
          onPress: () => {
            setSelectedLevel(null);
          },
        },
        {
          text: t('common.confirm'),
          onPress: () => {
            onSelectLevel(ltr);
          },
        },
      ]
    );
  };

  const handleInfoPress = (ltr: number) => {
    setModalLtr(ltr);
    setModalVisible(true);
  };

  // ============================================================================
  // Render Functions
  // ============================================================================

  const renderLevelButton = (ltr: number) => {
    const isSelected = ltr === selectedLevel;
    const level = LPR_LEVELS.find(l => l.value === ltr);
    const levelElo = getInitialEloFromLtr(ltr);
    if (!level) return null;

    return (
      <View key={ltr} style={styles.levelButtonContainer}>
        <TouchableOpacity
          style={[styles.levelButton, isSelected && styles.selectedLevelButton]}
          onPress={() => handleLevelSelect(ltr)}
        >
          <View style={styles.levelButtonContent}>
            <Text style={styles.levelValue}>{ltr}</Text>
          </View>
          <Text style={styles.levelLabel} numberOfLines={1}>
            {getLocalizedText(level.label, currentLanguage).replace(/LPR \d+ - /, '')}
          </Text>
          <Text style={styles.levelElo}>ELO {levelElo}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.infoButton} onPress={() => handleInfoPress(ltr)}>
          <Ionicons name='information-circle-outline' size={24} color='#AAA' />
        </TouchableOpacity>
      </View>
    );
  };

  const renderAssessmentButton = () => {
    return (
      <View style={styles.levelButtonContainer}>
        <TouchableOpacity style={styles.assessmentGridButton} onPress={onStartAssessment}>
          <View style={styles.levelButtonContent}>
            <Ionicons name='help-circle' size={28} color='#4CAF50' />
          </View>
          <Text style={styles.assessmentGridLabel} numberOfLines={1}>
            {t('ltrLevelSelect.assessmentGridTitle') || 'Not Sure?'}
          </Text>
          <Text style={styles.assessmentGridSubtext}>
            {t('ltrLevelSelect.assessmentGridSubtext') || 'Take Quiz'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.infoButton} onPress={onStartAssessment}>
          <Ionicons name='chevron-forward-circle-outline' size={24} color='#4CAF50' />
        </TouchableOpacity>
      </View>
    );
  };

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name='arrow-back' size={24} color={themeColors.onBackground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.onBackground }]}>
          {t('ltrLevelSelect.headerTitle') || 'Select Your Level'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <View style={styles.iconContainer}>
            <Ionicons name='pickleballball' size={48} color='#4CAF50' />
          </View>

          <Text style={styles.mainTitle}>
            {t('ltrLevelSelect.mainTitle') || "What's Your LPR Level?"}
          </Text>

          <Text style={styles.subtitle}>
            {t('ltrLevelSelect.subtitle') ||
              'Select the level that best describes your current pickleball skill'}
          </Text>

          {/* 🎯 Policy Notice for Level 6+ - subtitle 아래로 이동 */}
          <View style={styles.policyNotice}>
            <Ionicons name='information-circle' size={18} color='#FFD700' />
            <Text style={styles.policyNoticeText}>
              {t('ltrLevelSelect.policyNotice') ||
                'LPR 6 and above can only be achieved through match results within the app'}
            </Text>
          </View>
        </View>

        {/* Level Selection Grid */}
        {/* 🎯 [ONBOARDING LIMIT] 온보딩에서 최대 선택 가능 LPR: 5 */}
        {/* LPR 6 이상은 매치를 통해서만 달성 가능 */}
        <View style={styles.selectionSection}>
          <View style={styles.levelGrid}>
            {onboardingLevels.map(level => renderLevelButton(level.value))}
            {/* 🎯 Assessment button in grid - 5번 옆에 배치 */}
            {renderAssessmentButton()}
          </View>
        </View>
      </ScrollView>

      {/* Modal */}
      <LtrLevelDetailModal
        visible={modalVisible}
        ltr={modalLtr}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 40,
  },
  titleSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#AAA',
    textAlign: 'center',
    marginBottom: 8,
  },
  selectionSection: {
    marginTop: 8,
  },
  levelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  levelButtonContainer: {
    width: '48%',
    marginBottom: 12,
  },
  levelButton: {
    padding: 16,
    backgroundColor: '#222',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedLevelButton: {
    backgroundColor: '#2a2a4a',
    borderColor: '#FFD700',
  },
  levelButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  levelValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  levelLabel: {
    fontSize: 12,
    color: '#AAA',
    textAlign: 'center',
  },
  levelElo: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  infoButton: {
    alignSelf: 'center',
    padding: 4,
  },
  assessmentGridButton: {
    padding: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: 8,
  },
  assessmentGridLabel: {
    fontSize: 12,
    color: '#4CAF50',
    textAlign: 'center',
    fontWeight: '600',
  },
  assessmentGridSubtext: {
    fontSize: 11,
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 4,
  },
  policyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    gap: 8,
  },
  policyNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#CCC',
    lineHeight: 18,
  },
});

export default LtrLevelSelectScreen;
