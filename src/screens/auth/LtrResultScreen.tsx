/**
 * 🎾 LPR Assessment Result Screen
 *
 * Displays the recommended LPR level from the assessment quiz.
 * Users can confirm the recommendation or select a different level (1-5).
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
import { Answer, AssessmentResult } from '../../utils/ltrAssessment';
import { getLtrDetails, getInitialEloFromLtr } from '../../utils/ltrUtils';
import { LPR_LEVELS } from '../../constants/ltr';
import LtrLevelDetailModal from './LtrLevelDetailModal';

// ============================================================================
// Type Definitions
// ============================================================================

interface LtrResultScreenProps {
  answers: Answer[];
  result: AssessmentResult;
  onSelectLevel: (ltr: number) => void;
  onBack: () => void;
}

// ============================================================================
// Main Component
// ============================================================================

const LtrResultScreen: React.FC<LtrResultScreenProps> = ({ result, onSelectLevel, onBack }) => {
  const { currentLanguage, t } = useLanguage();
  const themeColors = lightningPickleballDarkTheme.colors;

  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalLtr, setModalLtr] = useState<number>(3);

  const recommendedLtr = result.recommendedLtr;
  const ltrDetails = getLtrDetails(recommendedLtr, currentLanguage);
  const initialElo = getInitialEloFromLtr(recommendedLtr);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleLevelSelect = (ltr: number) => {
    setSelectedLevel(ltr);

    const levelDetails = LPR_LEVELS.find(l => l.value === ltr);
    const levelLabel = levelDetails?.label[currentLanguage] || `LPR ${ltr}`;

    Alert.alert(
      t('ltrResult.confirmSkillLevel'),
      t('ltrResult.confirmMessage', { level: levelLabel }),
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

  const showEloInfo = () => {
    Alert.alert(t('ltrResult.eloInfo.title'), t('ltrResult.eloInfo.description'), [
      { text: t('common.ok') },
    ]);
  };

  const showConfidenceInfo = () => {
    Alert.alert(t('ltrResult.confidenceInfo.title'), t('ltrResult.confidenceInfo.description'), [
      { text: t('common.ok') },
    ]);
  };

  // ============================================================================
  // Render Functions
  // ============================================================================

  const renderLevelButton = (ltr: number) => {
    const isRecommended = ltr === recommendedLtr;
    const isSelected = ltr === selectedLevel;
    const level = LPR_LEVELS.find(l => l.value === ltr);
    const levelElo = getInitialEloFromLtr(ltr);
    if (!level) return null;

    return (
      <View key={ltr} style={styles.levelButtonContainer}>
        <TouchableOpacity
          style={[
            styles.levelButton,
            isRecommended && styles.recommendedLevelButton,
            isSelected && styles.selectedLevelButton,
          ]}
          onPress={() => handleLevelSelect(ltr)}
        >
          <View style={styles.levelButtonContent}>
            <Text style={[styles.levelValue, isRecommended && styles.recommendedLevelText]}>
              {ltr}
            </Text>
            {isRecommended && (
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedBadgeText}>{t('ltrResult.recommended')}</Text>
              </View>
            )}
          </View>
          <Text
            style={[styles.levelLabel, isRecommended && styles.recommendedLevelText]}
            numberOfLines={1}
          >
            {level.label[currentLanguage].replace(/LPR \d+ - /, '')}
          </Text>
          <Text style={[styles.levelElo, isRecommended && styles.recommendedLevelText]}>
            ELO {levelElo}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.infoButton} onPress={() => handleInfoPress(ltr)}>
          <Ionicons name='information-circle-outline' size={24} color='#AAA' />
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
          {t('ltrResult.title')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Recommended Result Section */}
        <View style={styles.resultSection}>
          <Ionicons name='trophy' size={64} color='#FFD700' />

          <Text style={styles.resultTitle}>{t('ltrResult.recommendedLevel')}</Text>

          <Text style={styles.resultLtr}>{recommendedLtr}</Text>

          <Text style={styles.resultLabel}>{ltrDetails.label}</Text>

          <Text style={styles.resultDescription}>{ltrDetails.description}</Text>

          {/* ELO Section */}
          <View style={styles.eloContainer}>
            <Text style={styles.eloLabel}>{t('ltrResult.initialElo')}</Text>
            <View style={styles.eloRow}>
              <Text style={styles.eloValue}>{initialElo}</Text>
              <TouchableOpacity style={styles.infoIconButton} onPress={showEloInfo}>
                <Ionicons name='information-circle-outline' size={20} color='#AAA' />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confidence Badge with Info Button */}
          <View style={styles.confidenceRow}>
            <View
              style={[
                styles.confidenceBadge,
                result.confidence === 'high' && styles.highConfidence,
                result.confidence === 'medium' && styles.mediumConfidence,
                result.confidence === 'low' && styles.lowConfidence,
              ]}
            >
              <Text style={styles.confidenceText}>
                {t('ltrResult.confidence.label', {
                  level:
                    result.confidence === 'high'
                      ? t('ltrResult.confidence.high')
                      : result.confidence === 'medium'
                        ? t('ltrResult.confidence.medium')
                        : t('ltrResult.confidence.low'),
                })}
              </Text>
            </View>
            <TouchableOpacity style={styles.infoIconButton} onPress={showConfidenceInfo}>
              <Ionicons name='information-circle-outline' size={20} color='#AAA' />
            </TouchableOpacity>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Level Selection Section */}
        <View style={styles.selectionSection}>
          <Text style={styles.selectionTitle}>{t('ltrResult.chooseSkillLevel')}</Text>
          <Text style={styles.selectionSubtitle}>{t('ltrResult.manualSelectionHint')}</Text>

          {/* 🎯 [ONBOARDING LIMIT] 온보딩에서 최대 선택 가능 LPR: 5 */}
          {/* LPR 6 이상은 매치를 통해서만 달성 가능 */}
          <View style={styles.levelGrid}>{[1, 2, 3, 4, 5].map(ltr => renderLevelButton(ltr))}</View>

          {/* 🎯 Policy Notice - Show when assessment recommends 6+ */}
          {recommendedLtr >= 6 && (
            <View style={styles.policyNoticeHighlighted}>
              <Ionicons name='alert-circle' size={20} color='#FF9800' />
              <Text style={styles.policyNoticeHighlightedText}>
                {t('ltrResult.highLevelNotice', { level: recommendedLtr })}
              </Text>
            </View>
          )}

          {/* 🎯 General Policy Notice */}
          <View style={styles.policyNotice}>
            <Ionicons name='information-circle' size={18} color='#FFD700' />
            <Text style={styles.policyNoticeText}>{t('ltrResult.policyNotice')}</Text>
          </View>
        </View>

        {/* Warnings */}
        {result.warnings.length > 0 && (
          <View style={styles.warningsContainer}>
            {result.warnings.map((warning, index) => (
              <View key={index} style={styles.warningItem}>
                <Ionicons name='warning-outline' size={20} color='#FF9800' />
                <Text style={styles.warningText}>{warning}</Text>
              </View>
            ))}
          </View>
        )}
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
  },
  resultSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#AAA',
    marginTop: 16,
  },
  resultLtr: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FFD700',
    marginVertical: 8,
  },
  resultLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  resultDescription: {
    fontSize: 14,
    color: '#AAA',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  eloContainer: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  eloLabel: {
    fontSize: 14,
    color: '#AAA',
    marginBottom: 4,
  },
  eloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eloValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  confidenceBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  highConfidence: {
    backgroundColor: '#1a4a1a',
  },
  mediumConfidence: {
    backgroundColor: '#4a3a1a',
  },
  lowConfidence: {
    backgroundColor: '#4a1a1a',
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 24,
  },
  selectionSection: {
    paddingHorizontal: 4,
  },
  selectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  selectionSubtitle: {
    fontSize: 14,
    color: '#AAA',
    marginBottom: 24,
    textAlign: 'center',
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
  recommendedLevelButton: {
    backgroundColor: '#1a3a1a',
    borderColor: '#4CAF50',
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
  recommendedLevelText: {
    color: '#4CAF50',
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
  recommendedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recommendedBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  infoButton: {
    alignSelf: 'center',
    padding: 4,
  },
  infoIconButton: {
    padding: 4,
  },
  policyNoticeHighlighted: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
    padding: 12,
    marginTop: 16,
    gap: 8,
  },
  policyNoticeHighlightedText: {
    flex: 1,
    fontSize: 13,
    color: '#FFB74D',
    lineHeight: 20,
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
  warningsContainer: {
    marginTop: 24,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    backgroundColor: '#2a2210',
    borderRadius: 8,
    marginBottom: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#FFB74D',
    lineHeight: 20,
  },
});

export default LtrResultScreen;
