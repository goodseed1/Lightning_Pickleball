import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Animated } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Avatar,
  Chip,
  ProgressBar,
  Surface,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useLocation } from '../../contexts/LocationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { theme } from '../../theme';
import { RootStackParamList } from '../../navigation/AppNavigator';

// Use type assertions to bypass module resolution errors
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const LottieView = require('lottie-react-native') as any;
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const aiAnalyzingAnimation = require('../../assets/animations/ai-analyzing.json') as any;

type AIMatchingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'UserProfile'>;

interface MatchCandidate {
  id: string;
  name: string;
  avatar?: string;
  skillLevel: number;
  matchScore: number;
  distance: number;
  availability: string[];
  bio: string;
  strengths: string[];
  playStyle: string;
}

export default function AIMatchingScreen() {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [candidates, setCandidates] = useState<MatchCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<MatchCandidate | null>(null);
  const [progress] = useState(new Animated.Value(0));

  const navigation = useNavigation<AIMatchingScreenNavigationProp>();
  const { location, getCurrentLocation } = useLocation();
  const { t } = useLanguage();

  const startAIMatching = useCallback(async () => {
    setIsAnalyzing(true);

    // 위치 업데이트
    if (!location) {
      await getCurrentLocation();
    }

    const analysisSteps = [
      t('aiMatching.analyzing.steps.profile'),
      t('aiMatching.analyzing.steps.skillLevel'),
      t('aiMatching.analyzing.steps.location'),
      t('aiMatching.analyzing.steps.schedule'),
      t('aiMatching.analyzing.steps.selection'),
    ];

    // 분석 단계 애니메이션
    for (let i = 0; i < analysisSteps.length; i++) {
      setAnalysisStep(i);

      Animated.timing(progress, {
        toValue: (i + 1) / analysisSteps.length,
        duration: 800,
        useNativeDriver: false,
      }).start();

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // TODO: Replace with real AI matching API call
    // AI 매칭 기능은 현재 개발 중입니다
    setCandidates([]);
    setIsAnalyzing(false);
  }, [location, getCurrentLocation, progress, t]);

  useEffect(() => {
    startAIMatching();
  }, [startAIMatching]);

  const getMatchScoreColor = (score: number): string => {
    if (score >= 90) return theme.colors.success;
    if (score >= 70) return theme.colors.primary;
    if (score >= 50) return theme.colors.warning;
    return theme.colors.error;
  };

  const getSkillLevelText = (level: number): string => {
    if (level < 30) return t('aiMatching.candidate.skillLevel.beginner');
    if (level < 60) return t('aiMatching.candidate.skillLevel.elementary');
    if (level < 80) return t('aiMatching.candidate.skillLevel.intermediate');
    return t('aiMatching.candidate.skillLevel.advanced');
  };

  const handleSelectCandidate = (candidate: MatchCandidate) => {
    setSelectedCandidate(candidate);
  };

  const handleSendMatchRequest = () => {
    if (selectedCandidate) {
      navigation.navigate('UserProfile', { userId: selectedCandidate.id });
    }
  };

  const renderAnalyzing = () => {
    const analysisSteps = [
      t('aiMatching.analyzing.steps.profile'),
      t('aiMatching.analyzing.steps.skillLevel'),
      t('aiMatching.analyzing.steps.location'),
      t('aiMatching.analyzing.steps.schedule'),
      t('aiMatching.analyzing.steps.selection'),
    ];

    return (
      <View style={styles.analyzingContainer}>
        <LottieView source={aiAnalyzingAnimation} autoPlay loop style={styles.lottieAnimation} />

        <Title style={styles.analyzingTitle}>{t('aiMatching.analyzing.title')}</Title>
        <Paragraph style={styles.analyzingStep}>{analysisSteps[analysisStep]}</Paragraph>

        <View style={styles.progressContainer}>
          <ProgressBar
            progress={progress as any} // eslint-disable-line @typescript-eslint/no-explicit-any -- ProgressBar progress prop type mismatch
            color={theme.colors.primary}
            style={styles.progressBar}
          />
        </View>

        <Paragraph style={styles.analyzingTip}>{t('aiMatching.analyzing.tip')}</Paragraph>
      </View>
    );
  };

  const renderCandidateCard = (candidate: MatchCandidate) => (
    <Card
      key={candidate.id}
      style={[styles.candidateCard, selectedCandidate?.id === candidate.id && styles.selectedCard]}
      onPress={() => handleSelectCandidate(candidate)}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.candidateInfo}>
            <Avatar.Text size={56} label={candidate.name.charAt(0)} style={styles.avatar} />
            <View style={styles.candidateDetails}>
              <Title style={styles.candidateName}>{candidate.name}</Title>
              <View style={styles.candidateStats}>
                <Chip compact style={styles.skillChip} textStyle={styles.skillText}>
                  {getSkillLevelText(candidate.skillLevel)}
                </Chip>
                <Paragraph style={styles.distance}>{candidate.distance}km</Paragraph>
              </View>
            </View>
          </View>

          <View style={styles.matchScoreContainer}>
            <Title style={[styles.matchScore, { color: getMatchScoreColor(candidate.matchScore) }]}>
              {candidate.matchScore}%
            </Title>
            <Paragraph style={styles.matchScoreLabel}>
              {t('aiMatching.candidate.matchScore')}
            </Paragraph>
          </View>
        </View>

        <Paragraph style={styles.candidateBio} numberOfLines={2}>
          {candidate.bio}
        </Paragraph>

        <View style={styles.candidateAttributes}>
          <View style={styles.attributeSection}>
            <Ionicons name='trophy' size={16} color={theme.colors.primary} />
            <Paragraph style={styles.attributeLabel}>
              {t('aiMatching.candidate.attributes.strengths')}
            </Paragraph>
          </View>
          <View style={styles.strengthChips}>
            {candidate.strengths.map((strength, idx) => (
              <Chip
                key={idx}
                compact
                mode='outlined'
                style={styles.strengthChip}
                textStyle={styles.strengthText}
              >
                {strength}
              </Chip>
            ))}
          </View>
        </View>

        <View style={styles.candidateAttributes}>
          <View style={styles.attributeSection}>
            <Ionicons name='time' size={16} color={theme.colors.primary} />
            <Paragraph style={styles.attributeLabel}>
              {t('aiMatching.candidate.attributes.availableTime')}
            </Paragraph>
          </View>
          <View style={styles.availabilityChips}>
            {candidate.availability.slice(0, 2).map((time, idx) => (
              <Chip key={idx} compact style={styles.timeChip} textStyle={styles.timeText}>
                {time}
              </Chip>
            ))}
          </View>
        </View>

        <View style={styles.playStyleContainer}>
          <Ionicons name='basketball' size={16} color={theme.colors.primary} />
          <Paragraph style={styles.playStyle}>
            {t('aiMatching.candidate.attributes.playStyle')}: {candidate.playStyle}
          </Paragraph>
        </View>

        {selectedCandidate?.id === candidate.id && (
          <Surface style={styles.selectedIndicator}>
            <Ionicons name='checkmark-circle' size={20} color={theme.colors.success} />
            <Paragraph style={styles.selectedText}>{t('aiMatching.candidate.selected')}</Paragraph>
          </Surface>
        )}
      </Card.Content>
    </Card>
  );

  if (isAnalyzing) {
    return <SafeAreaView style={styles.container}>{renderAnalyzing()}</SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Title style={styles.title}>{t('aiMatching.results.title')}</Title>
          <Paragraph style={styles.subtitle}>
            {t('aiMatching.results.subtitle', { count: candidates.length })}
          </Paragraph>
        </View>

        <View style={styles.tipsCard}>
          <Ionicons name='bulb' size={24} color={theme.colors.primary} />
          <View style={styles.tipsContent}>
            <Paragraph style={styles.tipsTitle}>{t('aiMatching.results.tipsTitle')}</Paragraph>
            <Paragraph style={styles.tipsText}>{t('aiMatching.results.tipsText')}</Paragraph>
          </View>
        </View>

        {candidates.length > 0 ? (
          candidates.map(candidate => renderCandidateCard(candidate))
        ) : (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Ionicons name='construct-outline' size={48} color={theme.colors.primary} />
              <Title style={styles.emptyTitle}>{t('aiMatching.empty.title')}</Title>
              <Paragraph style={styles.emptyText}>{t('aiMatching.empty.message')}</Paragraph>
            </Card.Content>
          </Card>
        )}

        <Button mode='text' onPress={startAIMatching} style={styles.refreshButton}>
          {t('aiMatching.results.refreshButton')}
        </Button>
      </ScrollView>

      {selectedCandidate && (
        <Surface style={styles.bottomBar}>
          <View style={styles.selectedInfo}>
            <Paragraph style={styles.selectedName}>
              {t('aiMatching.bottomBar.selectedName', { name: selectedCandidate.name })}
            </Paragraph>
            <Paragraph style={styles.selectedAction}>
              {t('aiMatching.bottomBar.selectedAction')}
            </Paragraph>
          </View>
          <Button mode='contained' onPress={handleSendMatchRequest} style={styles.requestButton}>
            {t('aiMatching.bottomBar.requestButton')}
          </Button>
        </Surface>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 120,
  },
  analyzingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  lottieAnimation: {
    width: 200,
    height: 200,
  },
  analyzingTitle: {
    fontSize: 24,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  analyzingStep: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: theme.spacing.lg,
  },
  progressContainer: {
    width: '80%',
    marginBottom: theme.spacing.lg,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  analyzingTip: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.6,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  tipsCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary + '10',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.lg,
  },
  tipsContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  tipsTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tipsText: {
    fontSize: 13,
    opacity: 0.8,
  },
  candidateCard: {
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: theme.colors.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  candidateInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    backgroundColor: theme.colors.primary,
    marginRight: theme.spacing.md,
  },
  candidateDetails: {
    flex: 1,
  },
  candidateName: {
    fontSize: 18,
    marginBottom: 4,
  },
  candidateStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  skillChip: {
    height: 24,
    backgroundColor: theme.colors.primary + '20',
  },
  skillText: {
    fontSize: 11,
    color: theme.colors.primary,
  },
  distance: {
    fontSize: 12,
    color: theme.colors.primary,
  },
  matchScoreContainer: {
    alignItems: 'center',
  },
  matchScore: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  matchScoreLabel: {
    fontSize: 11,
    opacity: 0.6,
  },
  candidateBio: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
    opacity: 0.8,
  },
  candidateAttributes: {
    marginBottom: theme.spacing.sm,
  },
  attributeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  attributeLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    opacity: 0.7,
  },
  strengthChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginLeft: 20,
  },
  strengthChip: {
    height: 22,
  },
  strengthText: {
    fontSize: 10,
  },
  availabilityChips: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginLeft: 20,
  },
  timeChip: {
    height: 22,
    backgroundColor: theme.colors.success + '20',
  },
  timeText: {
    fontSize: 10,
    color: theme.colors.success,
  },
  playStyleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  playStyle: {
    fontSize: 13,
    fontWeight: '500',
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.success + '10',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.medium,
    marginTop: theme.spacing.md,
  },
  selectedText: {
    color: theme.colors.success,
    fontWeight: 'bold',
  },
  refreshButton: {
    marginTop: theme.spacing.lg,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  selectedAction: {
    fontSize: 14,
    opacity: 0.7,
  },
  requestButton: {
    marginLeft: theme.spacing.md,
  },
  emptyCard: {
    marginVertical: theme.spacing.lg,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    paddingHorizontal: theme.spacing.lg,
  },
});
