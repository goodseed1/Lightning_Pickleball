/**
 * 🎾 LPR (Lightning Pickleball Rating) Assessment Screen
 *
 * Self-assessment questionnaire to determine user's LPR level (1-10)
 */
import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLanguage } from '../../contexts/LanguageContext';
import { lightningPickleballDarkTheme } from '../../theme';
import { getQuestionsForPage, QUESTION_PAGES } from '../../constants/lprQuestions';
import { calculateRecommendedLtr, Answer, AssessmentResult } from '../../utils/lprAssessment';
import { getLtrDetails } from '../../utils/lprUtils';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

// ============================================================================
// Type Definitions
// ============================================================================

type LtrAssessmentScreenRouteProp = RouteProp<AuthStackParamList, 'LtrAssessment'>;
type LtrAssessmentScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'LtrAssessment'
>;

interface LtrAssessmentScreenProps {
  route: LtrAssessmentScreenRouteProp;
  navigation: LtrAssessmentScreenNavigationProp;
}

// ============================================================================
// Main Component
// ============================================================================

const LtrAssessmentScreen: React.FC<LtrAssessmentScreenProps> = ({ navigation, route }) => {
  const { currentLanguage, t } = useLanguage();
  const themeColors = lightningPickleballDarkTheme.colors;

  // Set header title dynamically with i18n
  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('navigation.lprAssessment'),
    });
  }, [navigation, t]);

  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [showResultScreen, setShowResultScreen] = useState(false);
  const [adjustedNtrp, setAdjustedNtrp] = useState<number | null>(null);

  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleAnswerSelection = (
    questionId: string,
    optionId: string,
    score: number,
    category: 'skills' | 'tactics' | 'experience' | 'selfAssessment'
  ) => {
    setAnswers(prevAnswers => {
      const existingIndex = prevAnswers.findIndex(a => a.questionId === questionId);
      if (existingIndex >= 0) {
        // Update existing answer
        const updated = [...prevAnswers];
        updated[existingIndex] = { questionId, optionId, score, category };
        return updated;
      } else {
        // Add new answer
        return [...prevAnswers, { questionId, optionId, score, category }];
      }
    });
  };

  const handleNext = () => {
    if (currentPage < 4) {
      // Fade out → increment page → fade in
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentPage(currentPage + 1);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    } else {
      // Calculate result and show result screen
      const calculatedResult = calculateRecommendedLtr(answers);
      setResult(calculatedResult);
      setShowResultScreen(true);
    }
  };

  const handleBack = () => {
    if (showResultScreen) {
      // Go back from result screen to page 4
      setShowResultScreen(false);
      setAdjustedNtrp(null);
    } else if (currentPage > 1) {
      // Fade out → decrement page → fade in
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentPage(currentPage - 1);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    } else {
      // Return to ProfileSetupScreen
      navigation.goBack();
    }
  };

  const handleAdjustNtrp = (delta: number) => {
    const currentNtrp = adjustedNtrp || result!.recommendedLtr;
    const newNtrp = currentNtrp + delta;
    if (newNtrp >= 2.0 && newNtrp <= 5.5) {
      setAdjustedNtrp(newNtrp);
    }
  };

  const handleComplete = () => {
    const finalNtrp = adjustedNtrp || result!.recommendedLtr;

    // Call the callback function passed via route params
    if (route.params?.onSelect) {
      route.params.onSelect(finalNtrp, {
        answers: answers as unknown as { questionId: string; selectedOption: string }[],
        result: result as unknown as { recommendedLtr: number; confidence: number; categoryScores: { groundstrokes: number; volley: number; serve: number; return: number; tactics: number; experience: number } },
      });
    }

    // Navigate back
    navigation.goBack();
  };

  // ============================================================================
  // Validation
  // ============================================================================

  const isPageComplete = () => {
    const questions = getQuestionsForPage(currentPage as 1 | 2 | 3 | 4);
    return questions.every(q => answers.some(a => a.questionId === q.id));
  };

  // ============================================================================
  // Render Functions
  // ============================================================================

  const renderProgressIndicator = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3, 4].map(page => (
        <View
          key={page}
          style={[
            styles.progressDot,
            currentPage === page && styles.activeProgressDot,
            currentPage > page && styles.completedProgressDot,
          ]}
        />
      ))}
    </View>
  );

  const renderQuestionPage = () => {
    const questions = getQuestionsForPage(currentPage as 1 | 2 | 3 | 4);

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>
            {QUESTION_PAGES[currentPage - 1].title[currentLanguage]}
          </Text>
          <Text style={styles.pageProgress}>{currentPage} / 4</Text>
        </View>

        {questions.map((question, index) => (
          <View key={question.id} style={styles.questionContainer}>
            <Text style={styles.questionNumber}>Q{index + 1}</Text>
            <Text style={styles.questionText}>{question.question[currentLanguage]}</Text>

            <View style={styles.optionsContainer}>
              {question.options.map(option => {
                const isSelected =
                  answers.find(a => a.questionId === question.id)?.optionId === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.optionButton, isSelected && styles.selectedOption]}
                    onPress={() =>
                      handleAnswerSelection(question.id, option.id, option.score, question.category)
                    }
                  >
                    <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
                      {option.text[currentLanguage]}
                    </Text>
                    {isSelected && <Ionicons name='checkmark-circle' size={20} color='#4CAF50' />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </Animated.View>
    );
  };

  const renderResultScreen = () => {
    if (!result) return null;

    const displayLtr = adjustedNtrp || result.recommendedLtr;
    const ltrDetails = getLtrDetails(displayLtr, currentLanguage);

    return (
      <ScrollView style={styles.resultScrollView}>
        <View style={styles.resultContainer}>
          <Ionicons name='trophy' size={64} color='#FFD700' />

          <Text style={styles.resultTitle}>{t('lprAssessment.recommendedLevel')}</Text>

          <Text style={styles.resultNtrp}>{displayLtr.toFixed(1)}</Text>

          <Text style={styles.resultLabel}>{ltrDetails.label}</Text>

          <Text style={styles.resultDescription}>{ltrDetails.description}</Text>

          {/* Confidence Badge */}
          <View
            style={[
              styles.confidenceBadge,
              result.confidence === 'high' && styles.highConfidence,
              result.confidence === 'medium' && styles.mediumConfidence,
              result.confidence === 'low' && styles.lowConfidence,
            ]}
          >
            <Text style={styles.confidenceText}>
              {t('lprAssessment.confidence')}:{' '}
              {t(
                `ntrpAssessment.confidence${result.confidence.charAt(0).toUpperCase() + result.confidence.slice(1)}`
              )}
            </Text>
          </View>

          {/* Score Breakdown */}
          <View style={styles.scoreBreakdown}>
            <Text style={styles.breakdownTitle}>{t('lprAssessment.scoreBreakdown')}</Text>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>{t('lprAssessment.skills')}</Text>
              <Text style={styles.breakdownValue}>{result.scoreBreakdown.skills} / 50</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>{t('lprAssessment.tactics')}</Text>
              <Text style={styles.breakdownValue}>{result.scoreBreakdown.tactics} / 40</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>{t('lprAssessment.experience')}</Text>
              <Text style={styles.breakdownValue}>{result.scoreBreakdown.experience} / 30</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>{t('lprAssessment.selfAssessment')}</Text>
              <Text style={styles.breakdownValue}>{result.scoreBreakdown.selfAssessment} / 20</Text>
            </View>
          </View>

          {/* ±1 Level Adjustment */}
          <View style={styles.adjustmentContainer}>
            <Text style={styles.adjustmentTitle}>{t('lprAssessment.adjustLevel')}</Text>
            <View style={styles.adjustmentButtons}>
              <TouchableOpacity
                style={[styles.adjustButton, displayLtr <= 2.0 && styles.disabledButton]}
                onPress={() => handleAdjustNtrp(-0.5)}
                disabled={displayLtr <= 2.0}
              >
                <Ionicons
                  name='remove-circle-outline'
                  size={24}
                  color={displayLtr <= 2.0 ? '#666' : '#FFF'}
                />
                <Text style={[styles.adjustText, displayLtr <= 2.0 && styles.disabledText]}>
                  -0.5
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.resetButton} onPress={() => setAdjustedNtrp(null)}>
                <Text style={styles.resetButtonText}>{t('lprAssessment.reset')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.adjustButton, displayLtr >= 5.5 && styles.disabledButton]}
                onPress={() => handleAdjustNtrp(+0.5)}
                disabled={displayLtr >= 5.5}
              >
                <Ionicons
                  name='add-circle-outline'
                  size={24}
                  color={displayLtr >= 5.5 ? '#666' : '#FFF'}
                />
                <Text style={[styles.adjustText, displayLtr >= 5.5 && styles.disabledText]}>
                  +0.5
                </Text>
              </TouchableOpacity>
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

          {/* Complete Button */}
          <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
            <Text style={styles.completeButtonText}>{t('lprAssessment.complete')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name='arrow-back' size={24} color={themeColors.onBackground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.onBackground }]}>
          {t('lprAssessment.title')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress Indicator */}
      {!showResultScreen && renderProgressIndicator()}

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {showResultScreen ? renderResultScreen() : renderQuestionPage()}
      </ScrollView>

      {/* Navigation Buttons */}
      {!showResultScreen && (
        <View style={styles.navigationContainer}>
          <TouchableOpacity onPress={handleBack} style={styles.backNavButton}>
            <Text style={styles.backNavButtonText}>{t('lprAssessment.back')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNext}
            style={[styles.nextButton, !isPageComplete() && styles.disabledNextButton]}
            disabled={!isPageComplete()}
          >
            <Text style={styles.nextButtonText}>
              {currentPage === 4 ? t('lprAssessment.viewResult') : t('lprAssessment.next')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#444',
  },
  activeProgressDot: {
    backgroundColor: '#FFD700',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  completedProgressDot: {
    backgroundColor: '#4CAF50',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 100,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  pageProgress: {
    fontSize: 16,
    color: '#AAA',
  },
  questionContainer: {
    marginBottom: 32,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 16,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#222',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333',
  },
  selectedOption: {
    backgroundColor: '#1a3a1a',
    borderColor: '#4CAF50',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: '#CCC',
    lineHeight: 20,
  },
  selectedOptionText: {
    color: '#FFF',
    fontWeight: '600',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  backNavButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  backNavButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  nextButton: {
    flex: 1,
    marginLeft: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#FFD700',
    alignItems: 'center',
  },
  disabledNextButton: {
    backgroundColor: '#555',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  resultScrollView: {
    flex: 1,
  },
  resultContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#AAA',
    marginTop: 16,
  },
  resultNtrp: {
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
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  confidenceBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 24,
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
  scoreBreakdown: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#AAA',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
  },
  adjustmentContainer: {
    width: '100%',
    marginBottom: 24,
  },
  adjustmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  adjustmentButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  adjustButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#222',
  },
  adjustText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  disabledText: {
    color: '#666',
  },
  resetButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#4a4a4a',
    borderRadius: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  warningsContainer: {
    width: '100%',
    marginBottom: 24,
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
  completeButton: {
    width: '100%',
    paddingVertical: 16,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
});

export default LtrAssessmentScreen;
