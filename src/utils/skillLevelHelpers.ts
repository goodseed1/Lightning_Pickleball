/**
 * 🔧 Skill Level Helpers
 * Shared utilities for handling skill level data across multiple formats
 *
 * Supports:
 * - New object format: { selfAssessed: "4.0", verified: null, lastUpdated: Timestamp }
 * - Legacy string format: "4.0" or "intermediate"
 * - Legacy numeric format: 0-100 (from old onboarding)
 * - Nested profile structures
 *
 * 📝 LTR vs NTRP 네이밍 규칙
 * UI 표시: "LTR" (Lightning Tennis Rating)
 * 코드/DB: "ntrp" (변수명, 특히 ltrLevel)
 * 이유: Firestore 필드명 변경 위험 방지
 */

/**
 * 🔧 Helper: Convert numeric skill level to string
 * Used for backward compatibility with old onboarding data
 */
function convertNumericToLevel(num: number): string {
  if (num <= 30) return 'beginner';
  if (num <= 60) return 'intermediate';
  if (num <= 80) return 'advanced';
  return 'expert';
}

/**
 * 🔧 Helper: Smart skill level extraction with fallback
 * Supports multiple data structures for backward compatibility
 *
 * Priority order:
 * 1. NEW format: skillLevel.selfAssessed (object)
 * 2. OLD format: skillLevel (string)
 * 3. OLD format: skillLevel (number) - converted to string
 * 4. Legacy: ltrLevel (string)
 * 5. Nested: profile.skillLevel (recursive)
 *
 * @param profile - User profile object or partial profile data
 * @returns Skill level string or undefined
 */
export function getSkillLevelSmart(profile: unknown): string | undefined {
  // Type guard for profile object
  if (!profile || typeof profile !== 'object') {
    return undefined;
  }
  const prof = profile as Record<string, unknown>;

  // Priority 1: NEW 구조 (skillLevel.selfAssessed)
  if (
    prof.skillLevel &&
    typeof prof.skillLevel === 'object' &&
    'selfAssessed' in prof.skillLevel &&
    typeof (prof.skillLevel as Record<string, unknown>).selfAssessed === 'string'
  ) {
    return (prof.skillLevel as Record<string, unknown>).selfAssessed as string;
  }

  // Priority 2: OLD 구조 - 문자열
  if (typeof prof.skillLevel === 'string') {
    return prof.skillLevel;
  }

  // Priority 3: OLD 구조 - 숫자
  if (typeof prof.skillLevel === 'number') {
    // Check if it's NTRP value (1.0-7.0) or old onboarding value (0-100)
    if (prof.skillLevel >= 1.0 && prof.skillLevel <= 7.0) {
      // It's an NTRP value, return as string
      return prof.skillLevel.toString();
    } else {
      // It's old onboarding numeric value, convert to level
      return convertNumericToLevel(prof.skillLevel);
    }
  }

  // Priority 4: Legacy ltrLevel (could be string or number)
  if (prof.ltrLevel) {
    if (typeof prof.ltrLevel === 'string') {
      return prof.ltrLevel;
    }
    if (typeof prof.ltrLevel === 'number') {
      // NTRP is always 1.0-7.0 range
      return prof.ltrLevel.toString();
    }
  }

  // Priority 5: profile 중첩 구조
  if (prof.profile && typeof prof.profile === 'object') {
    return getSkillLevelSmart(prof.profile);
  }

  // 없으면 undefined (필드 생략)
  return undefined;
}
