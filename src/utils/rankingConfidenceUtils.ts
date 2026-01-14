/**
 * 🏆 [THOR] Ranking Confidence System - Phase 1 Honor System
 *
 * 시즌 경기 수 기반 랭킹 신뢰도 계산
 *
 * ⚠️ IMPORTANT: 기존 skillLevel.confidence와 완전 분리!
 * - skillLevel.confidence: 온보딩 시 자가평가 신뢰도 (0-1 범위)
 * - rankingConfidence: 시즌 경기 수 기반 랭킹 신뢰도 (0-5 레벨)
 *
 * Purpose: 시즌 경기 수에 따른 '신뢰도'를 5칸 바로 시각화
 * - 0경기: Level 0 (시작 전)
 * - 1경기: Level 1 (첫걸음)
 * - 2경기: Level 2 (성장 중)
 * - 3경기: Level 3 (발전 중)
 * - 4경기: Level 4 (거의 완료)
 * - 5경기 이상: Level 5 (공식 랭커)
 */

export interface RankingConfidenceLevel {
  level: number; // 0-5
  percentage: number; // 0-100
  isOfficial: boolean; // 5경기 이상 = 공식 랭커
  description: string; // 레벨 설명 (i18n key)
  remainingMatches: number; // 공식 랭킹까지 남은 경기 수
}

/**
 * 시즌 경기 수 기반 랭킹 신뢰도 레벨 계산
 *
 * @param seasonMatchesPlayed - 현재 시즌에 플레이한 경기 수
 * @returns RankingConfidenceLevel - 신뢰도 레벨 정보
 *
 * @example
 * ```typescript
 * const confidence = getRankingConfidenceLevel(3);
 * console.log(confidence.level); // 3
 * console.log(confidence.isOfficial); // false
 * console.log(confidence.remainingMatches); // 2
 * ```
 */
export function getRankingConfidenceLevel(seasonMatchesPlayed: number): RankingConfidenceLevel {
  // Validate input
  const matches = Math.max(0, Math.floor(seasonMatchesPlayed));

  // Calculate level (0-5, capped at 5)
  const level = Math.min(matches, 5);

  // Calculate percentage (0-100)
  const percentage = (level / 5) * 100;

  // Official ranker status (5+ matches)
  const isOfficial = matches >= 5;

  // Remaining matches to reach official status
  const remainingMatches = isOfficial ? 0 : 5 - matches;

  // Description key for i18n
  const description = `rankingConfidence.level${level}`;

  return {
    level,
    percentage,
    isOfficial,
    description,
    remainingMatches,
  };
}

/**
 * 랭킹 신뢰도 레벨에 대한 설명 반환 (다국어 지원)
 *
 * @param level - 신뢰도 레벨 (0-5)
 * @param language - 언어 코드 ('en' | 'ko' | 등)
 * @returns 레벨에 대한 설명 문자열
 *
 * @deprecated Use i18n translation keys directly with `rankingConfidence.level{0-5}`
 * This function is provided for backward compatibility only.
 */
export function getRankingConfidenceDescription(
  level: number,
  language: 'en' | 'ko' = 'en'
): string {
  const validLevel = Math.max(0, Math.min(5, Math.floor(level)));

  const descriptions: Record<string, Record<number, string>> = {
    en: {
      0: 'Not started',
      1: 'First step',
      2: 'Building',
      3: 'Growing',
      4: 'Almost there',
      5: 'Official',
    },
    ko: {
      0: '시작 전',
      1: '첫걸음',
      2: '성장 중',
      3: '발전 중',
      4: '거의 완료',
      5: '공식',
    },
  };

  const langDescriptions = descriptions[language] || descriptions.en;
  return langDescriptions[validLevel] || langDescriptions[0];
}

/**
 * Helper function to format remaining matches message
 *
 * @param remainingMatches - Number of matches remaining to official status
 * @param language - Language code
 * @returns Formatted message
 *
 * @deprecated Use i18n translation keys directly with `rankingConfidence.remainingMatches`
 */
export function getRemainingMatchesMessage(
  remainingMatches: number,
  language: 'en' | 'ko' = 'en'
): string {
  if (remainingMatches === 0) {
    return language === 'ko' ? '공식 랭커' : 'Official Ranker';
  }

  if (language === 'ko') {
    return `공식 랭킹까지 ${remainingMatches}경기`;
  }

  return `${remainingMatches} ${remainingMatches === 1 ? 'match' : 'matches'} to official ranking`;
}
