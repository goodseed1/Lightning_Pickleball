/**
 * LPR Assessment Utility
 *
 * 📝 LPR (Lightning Pickleball Rating) 시스템
 * - LPR 스케일: 1-10 정수
 * - ELO 기반 계산
 *
 * Calculates recommended LPR level based on user's assessment questionnaire responses.
 * Uses weighted scoring system across 4 categories: Skills, Tactics, Experience, Self-Assessment.
 */

import {
  shouldShowOverEstimationWarning,
  shouldShowUnderEstimationRecommendation,
} from './ltrUtils';
import i18n from '../i18n';

// ============================================================================
// Type Definitions
// ============================================================================

export interface Answer {
  questionId: string;
  optionId: string;
  score: number;
  category: 'skills' | 'tactics' | 'experience' | 'selfAssessment';
}

export interface AssessmentResult {
  recommendedLtr: number; // 1-5 (onboarding cap)
  confidence: 'high' | 'medium' | 'low';
  scoreBreakdown: {
    skills: number; // 0-50 (5 questions × 10 points)
    tactics: number; // 0-40 (4 questions × 10 points)
    experience: number; // 0-30 (3 questions × 10 points)
    selfAssessment: number; // 0-20 (2 questions × 10 points)
    total: number; // 0-140
    weighted: number; // Weighted average for LPR calculation (0-1)
  };
  warnings: string[];
}

// ============================================================================
// Constants
// ============================================================================

const CATEGORY_WEIGHTS = {
  skills: 0.6,
  tactics: 0.3,
  experience: 0.05,
  selfAssessment: 0.05,
};

const CATEGORY_MAX_SCORES = {
  skills: 50,
  tactics: 40,
  experience: 30,
  selfAssessment: 20,
};

// LPR Mapping: weighted score (0-1) → LPR level (1-5 for onboarding)
const LPR_MAPPING = [
  { min: 0.0, max: 0.2, ltr: 1 },
  { min: 0.2, max: 0.4, ltr: 2 },
  { min: 0.4, max: 0.6, ltr: 3 },
  { min: 0.6, max: 0.8, ltr: 4 },
  { min: 0.8, max: 1.0, ltr: 5 },
];

const CONFIDENCE_THRESHOLDS = {
  high: 2.0,
  medium: 3.0,
};

// ============================================================================
// Main Calculation Function
// ============================================================================

// 🎯 [ONBOARDING LIMIT] 온보딩에서 최대 선택 가능 LPR: 5
// LPR 6 이상은 매치를 통해서만 달성 가능 (실력으로 증명!)
const MAX_ONBOARDING_LPR = 5;

/**
 * Calculate recommended LPR level from assessment answers
 * Note: Result is capped at 6 - higher levels must be earned through matches
 */
export function calculateRecommendedLtr(answers: Answer[]): AssessmentResult {
  console.log('🎾 ========== LPR Assessment Calculation START ==========');
  console.log('📝 Total answers received:', answers.length);

  // 1. Category별 점수 집계
  const categoryScores = {
    skills: 0,
    tactics: 0,
    experience: 0,
    selfAssessment: 0,
  };

  answers.forEach(answer => {
    console.log(
      `  ✅ ${answer.questionId} (${answer.category}): score=${answer.score}, optionId=${answer.optionId}`
    );
    categoryScores[answer.category] += answer.score;
  });

  const total = Object.values(categoryScores).reduce((sum, score) => sum + score, 0);

  console.log('📊 Category Scores:');
  console.log(
    `  • Skills: ${categoryScores.skills}/${CATEGORY_MAX_SCORES.skills} (${((categoryScores.skills / CATEGORY_MAX_SCORES.skills) * 100).toFixed(1)}%)`
  );
  console.log(
    `  • Tactics: ${categoryScores.tactics}/${CATEGORY_MAX_SCORES.tactics} (${((categoryScores.tactics / CATEGORY_MAX_SCORES.tactics) * 100).toFixed(1)}%)`
  );
  console.log(
    `  • Experience: ${categoryScores.experience}/${CATEGORY_MAX_SCORES.experience} (${((categoryScores.experience / CATEGORY_MAX_SCORES.experience) * 100).toFixed(1)}%)`
  );
  console.log(
    `  • Self-Assessment: ${categoryScores.selfAssessment}/${CATEGORY_MAX_SCORES.selfAssessment} (${((categoryScores.selfAssessment / CATEGORY_MAX_SCORES.selfAssessment) * 100).toFixed(1)}%)`
  );
  console.log(`  • Total: ${total}/140`);

  // 2. Weighted Score 계산 (0-1 범위)
  const weighted =
    (categoryScores.skills / CATEGORY_MAX_SCORES.skills) * CATEGORY_WEIGHTS.skills +
    (categoryScores.tactics / CATEGORY_MAX_SCORES.tactics) * CATEGORY_WEIGHTS.tactics +
    (categoryScores.experience / CATEGORY_MAX_SCORES.experience) * CATEGORY_WEIGHTS.experience +
    (categoryScores.selfAssessment / CATEGORY_MAX_SCORES.selfAssessment) *
      CATEGORY_WEIGHTS.selfAssessment;

  console.log('⚖️  Weighted Score Calculation:');
  console.log(
    `  • Skills contribution: ${((categoryScores.skills / CATEGORY_MAX_SCORES.skills) * CATEGORY_WEIGHTS.skills).toFixed(3)} (weight: ${CATEGORY_WEIGHTS.skills})`
  );
  console.log(
    `  • Tactics contribution: ${((categoryScores.tactics / CATEGORY_MAX_SCORES.tactics) * CATEGORY_WEIGHTS.tactics).toFixed(3)} (weight: ${CATEGORY_WEIGHTS.tactics})`
  );
  console.log(
    `  • Experience contribution: ${((categoryScores.experience / CATEGORY_MAX_SCORES.experience) * CATEGORY_WEIGHTS.experience).toFixed(3)} (weight: ${CATEGORY_WEIGHTS.experience})`
  );
  console.log(
    `  • Self-Assessment contribution: ${((categoryScores.selfAssessment / CATEGORY_MAX_SCORES.selfAssessment) * CATEGORY_WEIGHTS.selfAssessment).toFixed(3)} (weight: ${CATEGORY_WEIGHTS.selfAssessment})`
  );
  console.log(`  • Final weighted score: ${weighted.toFixed(3)}`);

  // 3. LPR Level Mapping
  const rawLtr = mapWeightedScoreToLtr(weighted);
  // 🎯 [ONBOARDING LIMIT] Cap at 5 - higher levels must be earned through matches
  const recommendedLtr = Math.min(rawLtr, MAX_ONBOARDING_LPR);
  console.log(`🎯 Raw LPR: ${rawLtr}, Capped to: ${recommendedLtr} (max: ${MAX_ONBOARDING_LPR})`);

  // 4. Confidence Calculation
  const scores = answers.map(a => a.score);
  const stdDev = calculateStandardDeviation(scores);
  const confidence = getConfidenceLevel(stdDev);
  console.log(`📈 Standard Deviation: ${stdDev.toFixed(2)}`);
  console.log(`✨ Confidence Level: ${confidence}`);

  // 5. Score Breakdown
  const scoreBreakdown = {
    ...categoryScores,
    total,
    weighted,
  };

  // 6. Warning Detection
  const result: AssessmentResult = {
    recommendedLtr,
    confidence,
    scoreBreakdown,
    warnings: [],
  };

  result.warnings = detectWarnings(result);

  if (result.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    result.warnings.forEach(warning => console.log(`  • ${warning}`));
  }

  console.log('🎾 ========== LPR Assessment Calculation END ==========');

  return result;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get category score as percentage (0-1)
 */
export function getCategoryPercentage(
  answers: Answer[],
  category: keyof typeof CATEGORY_WEIGHTS
): number {
  const categoryAnswers = answers.filter(a => a.category === category);
  const categoryScore = categoryAnswers.reduce((sum, a) => sum + a.score, 0);
  const maxScore = CATEGORY_MAX_SCORES[category];

  return maxScore > 0 ? categoryScore / maxScore : 0;
}

/**
 * Calculate standard deviation of scores
 */
function calculateStandardDeviation(scores: number[]): number {
  if (scores.length === 0) return 0;

  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const squaredDiffs = scores.map(score => Math.pow(score - mean, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / scores.length;

  return Math.sqrt(variance);
}

/**
 * Map weighted score (0-1) to LPR level (1-5)
 */
function mapWeightedScoreToLtr(weighted: number): number {
  // Clamp weighted score to 0-1 range
  const clampedWeighted = Math.max(0, Math.min(1, weighted));

  // Find matching LPR range
  const match = LPR_MAPPING.find(
    range => clampedWeighted >= range.min && clampedWeighted < range.max
  );

  // Handle edge case: exactly 1.0 → 5
  if (clampedWeighted === 1.0) {
    return 5;
  }

  return match ? match.ltr : 1;
}

/**
 * Get confidence level based on standard deviation
 */
function getConfidenceLevel(stdDev: number): 'high' | 'medium' | 'low' {
  if (stdDev < CONFIDENCE_THRESHOLDS.high) {
    return 'high';
  } else if (stdDev < CONFIDENCE_THRESHOLDS.medium) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Detect warnings based on assessment results
 */
function detectWarnings(result: AssessmentResult): string[] {
  const warnings: string[] = [];
  const { scoreBreakdown, recommendedLtr } = result;

  // Skills vs Experience Mismatch
  const skillsPercentage = scoreBreakdown.skills / CATEGORY_MAX_SCORES.skills;
  const experiencePercentage = scoreBreakdown.experience / CATEGORY_MAX_SCORES.experience;

  if (skillsPercentage > 0.7 && experiencePercentage < 0.3) {
    warnings.push(i18n.t('utils.ltrAssessment.warnings.highSkillLowExperience'));
  }

  // Self-Assessment vs Objective Scores Mismatch
  const objectivePercentage =
    ((scoreBreakdown.skills / CATEGORY_MAX_SCORES.skills) * CATEGORY_WEIGHTS.skills +
      (scoreBreakdown.tactics / CATEGORY_MAX_SCORES.tactics) * CATEGORY_WEIGHTS.tactics +
      (scoreBreakdown.experience / CATEGORY_MAX_SCORES.experience) * CATEGORY_WEIGHTS.experience) /
    (CATEGORY_WEIGHTS.skills + CATEGORY_WEIGHTS.tactics + CATEGORY_WEIGHTS.experience);

  const selfPercentage = scoreBreakdown.selfAssessment / CATEGORY_MAX_SCORES.selfAssessment;

  if (selfPercentage - objectivePercentage > 0.3) {
    warnings.push(i18n.t('utils.ltrAssessment.warnings.selfOverEstimation'));
  } else if (objectivePercentage - selfPercentage > 0.3) {
    warnings.push(i18n.t('utils.ltrAssessment.warnings.selfUnderEstimation'));
  }

  // Over-estimation Warning (using existing util)
  if (shouldShowOverEstimationWarning(recommendedLtr)) {
    warnings.push(i18n.t('utils.ltrAssessment.warnings.highLevelWarning'));
  }

  // Under-estimation Recommendation (using existing util)
  if (shouldShowUnderEstimationRecommendation(recommendedLtr)) {
    warnings.push(i18n.t('utils.ltrAssessment.warnings.beginnerEncouragement'));
  }

  return warnings;
}

// ============================================================================
// Exports
// ============================================================================

export { CATEGORY_WEIGHTS, CATEGORY_MAX_SCORES, LPR_MAPPING };
