/**
 * 📝 LTR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LTR" (Lightning Tennis Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LTR로 변경하고 코드는 ntrp를 유지합니다.
 */
import React from 'react';
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
import { useLanguage } from '../../contexts/LanguageContext';
import { lightningTennisDarkTheme } from '../../theme';
import {
  getQuestionsForPage,
  QUESTION_PAGES,
  SupportedLanguage,
} from '../../constants/ltrQuestions';
import { Answer } from '../../utils/ltrAssessment';

// ============================================================================
// Type Definitions
// ============================================================================

interface LtrQuestionScreenProps {
  page: 1 | 2 | 3 | 4;
  answers: Answer[];
  onAnswersChange: (answers: Answer[]) => void;
  onNext: () => void;
  onBack: () => void;
}

// ============================================================================
// Main Component
// ============================================================================

const LtrQuestionScreen: React.FC<LtrQuestionScreenProps> = ({
  page,
  answers,
  onAnswersChange,
  onNext,
  onBack,
}) => {
  const { currentLanguage, t } = useLanguage();
  const themeColors = lightningTennisDarkTheme.colors;

  // 🌐 All 10 languages are now supported in ltrQuestions.ts
  const supportedLangs: SupportedLanguage[] = [
    'ko',
    'en',
    'es',
    'de',
    'fr',
    'it',
    'pt',
    'ja',
    'zh',
    'ru',
  ];
  const questionLang: SupportedLanguage = supportedLangs.includes(
    currentLanguage as SupportedLanguage
  )
    ? (currentLanguage as SupportedLanguage)
    : 'en';

  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const scrollViewRef = React.useRef<ScrollView>(null);

  // Auto-scroll to top when page changes
  React.useEffect(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  }, [page]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleAnswerSelection = (
    questionId: string,
    optionId: string,
    score: number,
    category: 'skills' | 'tactics' | 'experience' | 'selfAssessment'
  ) => {
    const existingIndex = answers.findIndex(a => a.questionId === questionId);
    let newAnswers: Answer[];

    if (existingIndex >= 0) {
      // Update existing answer
      newAnswers = [...answers];
      newAnswers[existingIndex] = { questionId, optionId, score, category };
    } else {
      // Add new answer
      newAnswers = [...answers, { questionId, optionId, score, category }];
    }

    onAnswersChange(newAnswers);
  };

  // ============================================================================
  // Validation
  // ============================================================================

  const isPageComplete = () => {
    const questions = getQuestionsForPage(page);
    return questions.every(q => answers.some(a => a.questionId === q.id));
  };

  // ============================================================================
  // Render Functions
  // ============================================================================

  const renderProgressIndicator = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3, 4].map(pageNum => (
        <View
          key={pageNum}
          style={[
            styles.progressDot,
            page === pageNum && styles.activeProgressDot,
            page > pageNum && styles.completedProgressDot,
          ]}
        />
      ))}
    </View>
  );

  const renderQuestions = () => {
    const questions = getQuestionsForPage(page);

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>{QUESTION_PAGES[page - 1].title[questionLang]}</Text>
          <Text style={styles.pageProgress}>{page} / 4</Text>
        </View>

        {questions.map((question, index) => (
          <View key={question.id} style={styles.questionContainer}>
            <Text style={styles.questionNumber}>Q{index + 1}</Text>
            <Text style={styles.questionText}>{question.question[questionLang]}</Text>

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
                      {option.text[questionLang]}
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
          {t('ltrQuestion.title')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress Indicator */}
      {renderProgressIndicator()}

      {/* Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {renderQuestions()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity onPress={onBack} style={styles.backNavButton}>
          <Text style={styles.backNavButtonText}>{t('ltrQuestion.back')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onNext}
          style={[styles.nextButton, !isPageComplete() && styles.disabledNextButton]}
          disabled={!isPageComplete()}
        >
          <Text style={styles.nextButtonText}>
            {page === 4 ? t('ltrQuestion.viewResult') : t('ltrQuestion.next')}
          </Text>
        </TouchableOpacity>
      </View>
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
});

export default LtrQuestionScreen;
