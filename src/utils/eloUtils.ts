/**
 * 📝 LPR (Lightning Pickleball Rating) System
 *
 * ⚡ LPR 1-10: Lightning Pickleball의 고유 레이팅 시스템
 *    - UI 표시: "LPR" (Lightning Pickleball Rating)
 *    - 코드/DB: "ltr" - 새로운 변수명, Firestore 필드명
 *    - ELO 알고리즘 기반 계산
 *
 * 📋 Legacy Support (NTRP):
 *    - 기존 NTRP 함수들은 하위 호환성을 위해 유지
 *    - 새로운 UI는 LPR 함수들을 사용
 */
import { SkillLevel, UserProfile, LtrDisplayOptions } from '../types/user';
import {
  getLtrFromElo,
  getLtrTier,
  getLtrTierColor,
  getLocalizedLtrLabel,
  getTierNameByLevel,
  getTierColorByLevel,
  getTierThemeByLevel,
} from './lprUtils';
import { LPR_LEVELS, getLocalizedText } from '../constants/lpr';
import i18n from '../i18n';

/**
 * ELO to LPR conversion mapping table (1-10 scale)
 * 🎯 [KIM FIX v16] Updated to use LPR scale (1-10) instead of NTRP (2.5-5.5)
 */
const ELO_TO_NTRP_MAP = [
  { minElo: 0, maxElo: 1000, ntrp: 1 },
  { minElo: 1000, maxElo: 1100, ntrp: 2 },
  { minElo: 1100, maxElo: 1200, ntrp: 3 },
  { minElo: 1200, maxElo: 1300, ntrp: 4 },
  { minElo: 1300, maxElo: 1450, ntrp: 5 },
  { minElo: 1450, maxElo: 1600, ntrp: 6 },
  { minElo: 1600, maxElo: 1800, ntrp: 7 },
  { minElo: 1800, maxElo: 2100, ntrp: 8 },
  { minElo: 2100, maxElo: 2400, ntrp: 9 },
  { minElo: 2400, maxElo: Infinity, ntrp: 10 },
];

/**
 * Convert ELO rating to LPR value (1-10 scale)
 * 🎯 [KIM FIX v16] Returns LPR scale (1-10) instead of NTRP (2.5-5.5)
 */
export function convertEloToLtr(elo: number): number {
  for (const mapping of ELO_TO_NTRP_MAP) {
    if (elo >= mapping.minElo && elo < mapping.maxElo) {
      return mapping.ntrp;
    }
  }
  return 5; // Default fallback (LPR 5 = Default)
}

/**
 * Calculate confidence level based on number of matches played
 * More matches = higher confidence in the calculated rating
 */
export function calculateConfidence(matchesPlayed: number): number {
  if (matchesPlayed === 0) return 0;
  if (matchesPlayed >= 20) return 1.0;

  // Linear progression from 0.1 (1 match) to 1.0 (20+ matches)
  return Math.min(0.1 + (matchesPlayed - 1) * 0.045, 1.0);
}

/**
 * Convert a point value to NTRP range string
 */
export function convertPointToRange(point: string | number): string {
  const numValue = typeof point === 'string' ? parseFloat(point) : point;

  if (numValue <= 2.0) return '1.5-2.0';
  if (numValue <= 2.5) return '2.0-2.5';
  if (numValue <= 3.0) return '2.5-3.0';
  if (numValue <= 3.5) return '3.0-3.5';
  if (numValue <= 4.0) return '3.5-4.0';
  if (numValue <= 4.5) return '4.0-4.5';
  if (numValue <= 5.0) return '4.5-5.0';
  return '5.0+';
}

/**
 * Get NTRP description using i18n translation
 */
export function getNtrpDescription(ntrp: number, t: (key: string) => string): string {
  if (ntrp < 2.0) return t('ltr.label.entry');
  if (ntrp < 3.0) return t('ltr.label.beginner');
  if (ntrp < 3.5) return t('ltr.label.adv_beginner');
  if (ntrp < 4.0) return t('ltr.label.intermediate');
  if (ntrp < 4.5) return t('ltr.label.adv_intermediate');
  if (ntrp < 5.0) return t('ltr.label.advanced');
  if (ntrp < 5.5) return t('ltr.label.expert');
  return t('ltr.label.pro');
}

/**
 * Get NTRP description from range string (legacy support)
 * Uses direct mapping to avoid boundary condition issues
 */
export function getNtrpDescriptionFromRange(range: string, t: (key: string) => string): string {
  const rangeToKey: { [key: string]: string } = {
    '1.0-2.5': 'ntrp.label.beginner', // Jong's range
    '1.5-2.0': 'ntrp.label.entry',
    '2.0-2.5': 'ntrp.label.beginner',
    '2.5-3.0': 'ntrp.label.adv_beginner',
    '3.0-3.5': 'ntrp.label.intermediate',
    '3.5-4.0': 'ntrp.label.adv_intermediate', // Direct mapping resolves boundary issues
    '4.0-4.5': 'ntrp.label.advanced',
    '4.5-5.0': 'ntrp.label.expert',
    '5.0+': 'ntrp.label.pro',
  };
  const key = rangeToKey[range] || 'ntrp.label.intermediate';
  return t(key);
}

/**
 * Extract legacy NTRP data from user profile
 */
function extractLegacyNtrp(user: UserProfile): { value: string; source: string } | null {
  // Priority order: profile.skillLevel > profile.ltrLevel > root ltrLevel
  if (user.profile?.skillLevel) {
    return { value: user.profile.skillLevel, source: 'profile.skillLevel' };
  }

  if (user.profile?.ltrLevel) {
    const range = convertPointToRange(user.profile.ltrLevel);
    return { value: range, source: 'profile.ltrLevel' };
  }

  if (user.ltrLevel) {
    const range = convertPointToRange(user.ltrLevel);
    return { value: range, source: 'root.ltrLevel' };
  }

  return null;
}

/**
 * Create new SkillLevel structure from legacy data
 */
export function migrateFromLegacyData(user: UserProfile): SkillLevel {
  const legacy = extractLegacyNtrp(user);
  const now = new Date().toISOString();

  const skillLevel: SkillLevel = {
    selfAssessed: legacy?.value || '3.0-3.5',
    lastUpdated: now,
    source: 'migration',
  };

  // Add calculated value if user has match history
  const stats = user.legacyStats;
  if (stats && stats.matchesPlayed > 0 && stats.eloRating) {
    skillLevel.calculated = convertEloToLtr(stats.eloRating);
    skillLevel.confidence = calculateConfidence(stats.matchesPlayed);
  }

  return skillLevel;
}

/**
 * Get the best NTRP display for a user
 * Prioritizes calculated values with high confidence, falls back to self-assessed
 */
export function getLtrDisplay(user: UserProfile, t?: (key: string) => string): LtrDisplayOptions {
  const skillLevel = user.skillLevel;

  // If we have the new structure, use it
  if (skillLevel && typeof skillLevel === 'object' && skillLevel.selfAssessed) {
    const hasReliableCalculation =
      skillLevel.calculated && skillLevel.confidence && skillLevel.confidence > 0.7;

    if (hasReliableCalculation) {
      const description = t ? getNtrpDescriptionFromRange(skillLevel.selfAssessed, t) : '중상급';
      const matchBreakdown = user.stats
        ? {
            public: user.stats.publicMatches || 0,
            club: user.stats.clubMatches || 0,
          }
        : undefined;

      return {
        primary: skillLevel.calculated!.toFixed(1),
        secondary: `자가평가: ${skillLevel.selfAssessed} (${description})`,
        source: 'calculated',
        confidence: skillLevel.confidence,
        matchBreakdown,
      };
    }

    // Use self-assessed with description
    const description = t ? getNtrpDescriptionFromRange(skillLevel.selfAssessed, t) : '중급';
    const secondary = skillLevel.calculated
      ? `시스템 계산: ${skillLevel.calculated.toFixed(1)}`
      : undefined;

    return {
      primary: `${skillLevel.selfAssessed} (${description})`,
      secondary,
      source: 'self-assessed',
    };
  }

  // Fallback to legacy data
  const legacy = extractLegacyNtrp(user);
  if (legacy) {
    const description = t ? getNtrpDescriptionFromRange(legacy.value, t) : '중급';
    return {
      primary: `${legacy.value} (${description})`,
      source: 'legacy',
    };
  }

  // Ultimate fallback
  return {
    primary: i18n.t('utils.eloUtils.defaultSkillLevel'),
    source: 'legacy',
  };
}

/**
 * Update calculated NTRP based on new ELO rating
 */
export function updateCalculatedNtrp(
  currentSkillLevel: SkillLevel | undefined,
  newEloRating: number,
  totalMatches: number
): SkillLevel {
  const now = new Date().toISOString();

  // If no current skill level, create from legacy or default
  if (!currentSkillLevel) {
    return {
      selfAssessed: '3.0-3.5',
      calculated: convertEloToLtr(newEloRating),
      confidence: calculateConfidence(totalMatches),
      lastUpdated: now,
      source: 'onboarding',
    };
  }

  // Update existing skill level
  return {
    ...currentSkillLevel,
    calculated: convertEloToLtr(newEloRating),
    confidence: calculateConfidence(totalMatches),
    lastUpdated: now,
  };
}

// ============================================================================
// ⚡ LPR (Lightning Pickleball Rating) Functions
// ============================================================================

/**
 * Get LPR description with tier name for UI display
 * @param elo - ELO rating
 * @param language - 'ko' | 'en'
 * @returns Formatted LPR description (e.g., "LPR 5 - Gold I (번개)")
 */
export function getLtrDescription(elo: number, language: 'ko' | 'en' = 'ko'): string {
  const ltr = getLtrFromElo(elo);
  const level = LPR_LEVELS.find(l => l.value === ltr);
  if (!level) return `LPR ${ltr}`;

  const label = getLocalizedText(level.label, language);
  return label;
}

/**
 * Get short LPR display for badges/chips
 * @param elo - ELO rating
 * @returns Short display (e.g., "LPR 5")
 */
export function getLtrBadgeText(elo: number): string {
  const ltr = getLtrFromElo(elo);
  return `LPR ${ltr}`;
}

/**
 * Get LPR tier information for styling
 * @param elo - ELO rating
 * @returns Tier info { name, color, theme }
 */
export function getLtrTierInfo(elo: number): {
  name: string;
  color: string;
  theme: { ko: string; en: string };
} {
  const ltr = getLtrFromElo(elo);
  return {
    name: getTierNameByLevel(ltr),
    color: getTierColorByLevel(ltr),
    theme: {
      ko: getTierThemeByLevel(ltr, 'ko'),
      en: getTierThemeByLevel(ltr, 'en'),
    },
  };
}

/**
 * Get LPR display for profile (with tier and theme)
 * @param elo - ELO rating
 * @param language - 'ko' | 'en'
 * @returns Full LPR display info
 */
export function getLtrProfileDisplay(
  elo: number,
  language: 'ko' | 'en' = 'ko'
): {
  level: number;
  label: string;
  tier: string;
  theme: string;
  color: string;
  elo: number;
} {
  const ltr = getLtrFromElo(elo);
  const level = LPR_LEVELS.find(l => l.value === ltr);

  return {
    level: ltr,
    label: level ? getLocalizedText(level.label, language) : `LPR ${ltr}`,
    tier: getTierNameByLevel(ltr),
    theme: getTierThemeByLevel(ltr, language),
    color: getTierColorByLevel(ltr),
    elo: elo,
  };
}

/**
 * Re-export LPR utility functions for convenience
 */
export { getLtrFromElo, getLtrTier, getLtrTierColor, getLocalizedLtrLabel };
