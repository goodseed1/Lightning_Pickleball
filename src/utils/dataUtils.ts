/**
 * 🛡️ Unified Data Sanitization Utilities
 * Operation: Quarantine Expansion - Universal data protection across all pipelines
 *
 * 📝 LPR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LPR" (Lightning Pickleball Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LPR로 변경하고 코드는 ntrp를 유지합니다.
 *
 * This module applies the proven "Triple Defense System" from Feed to all data sources:
 * 1. Source validation and transformation (Firestore + Activity data)
 * 2. Safe type conversion with fallbacks
 * 3. Defensive rendering protection
 */

import i18next from 'i18next';
import { safeToDate } from './dateUtils';
import { EventWithParticipation } from '../types/activity';

/**
 * Recursively sanitizes an object for Firestore by converting all undefined values to null
 * Firestore accepts null values but rejects undefined values
 *
 * @param data - The object to sanitize
 * @returns A new object with all undefined values converted to null
 */
export function sanitizeDataForFirestore<T>(data: T): T {
  const sanitized = deepSanitize(data);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return sanitized as any;
}

/**
 * Deep sanitization helper function that handles nested objects and arrays
 */
function deepSanitize(value: unknown): unknown {
  // Handle null explicitly (Firestore accepts null)
  if (value === null) {
    return null;
  }

  // Convert undefined to null (this is the core fix)
  if (value === undefined) {
    return null;
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.map(deepSanitize);
  }

  // Handle objects (but not Date objects or other special types)
  if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
    const sanitized: Record<string, unknown> = {};

    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = deepSanitize(val);
    }

    return sanitized;
  }

  // Return primitive values as-is (string, number, boolean, etc.)
  return value;
}

/**
 * Validates that an object contains no undefined values
 * Useful for testing and debugging
 *
 * @param data - The object to validate
 * @param path - The current path (for recursive calls)
 * @returns Array of paths that contain undefined values
 */
export function findUndefinedValues(data: unknown, path: string = 'root'): string[] {
  const undefinedPaths: string[] = [];

  if (data === undefined) {
    undefinedPaths.push(path);
    return undefinedPaths;
  }

  if (Array.isArray(data)) {
    data.forEach((item, index) => {
      const itemPaths = findUndefinedValues(item, `${path}[${index}]`);
      undefinedPaths.push(...itemPaths);
    });
  } else if (typeof data === 'object' && data !== null && !(data instanceof Date)) {
    for (const [key, value] of Object.entries(data)) {
      const itemPaths = findUndefinedValues(value, `${path}.${key}`);
      undefinedPaths.push(...itemPaths);
    }
  }

  return undefinedPaths;
}

/**
 * Type-safe wrapper for sanitizing user profile data specifically
 * This provides better TypeScript integration for common use cases
 */
export function sanitizeUserProfileData(profileData: unknown) {
  // First, run general sanitization
  const generalSanitized = sanitizeDataForFirestore(profileData);

  // Additional profile-specific validation
  if (generalSanitized && typeof generalSanitized === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sanitized = generalSanitized as any;
    // Ensure critical location fields are handled properly
    if (sanitized.profile?.location) {
      const location = sanitized.profile.location;

      // Ensure coordinates are numbers, not null
      if (typeof location.lat !== 'number') location.lat = 0;
      if (typeof location.lng !== 'number') location.lng = 0;
      if (typeof location.latitude !== 'number') location.latitude = 0;
      if (typeof location.longitude !== 'number') location.longitude = 0;
    }

    // Ensure arrays are properly initialized
    if (!Array.isArray(sanitized.profile?.languages)) {
      if (sanitized.profile) {
        sanitized.profile.languages = [];
      }
    }

    if (!Array.isArray(sanitized.recentMatches)) {
      sanitized.recentMatches = [];
    }
  }

  return generalSanitized;
}

// ==========================================
// 🛡️ ENHANCED UNIVERSAL DATA UTILITIES
// Operation: Quarantine Expansion Extensions
// ==========================================

/**
 * 🛡️ Safe string extraction with fallback
 */
export function safeString(value: unknown, fallback: string = ''): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (value === null || value === undefined) {
    return fallback;
  }
  try {
    return String(value).trim();
  } catch {
    return fallback;
  }
}

/**
 * 🛡️ Safe number extraction with fallback
 */
export function safeNumber(value: unknown, fallback: number = 0): number {
  if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

/**
 * 🛡️ Safe array extraction with fallback
 */
export function safeArray<T>(value: unknown, fallback: T[] = []): T[] {
  if (Array.isArray(value)) {
    return value;
  }
  return fallback;
}

/**
 * 🛡️ Enhanced event type validation with known type mapping
 */
export function safeEventType(type: unknown): 'match' | 'practice' | 'tournament' | 'meetup' {
  const validTypes = ['match', 'practice', 'tournament', 'meetup'] as const;

  if (typeof type === 'string') {
    const normalizedType = type.toLowerCase().trim();

    // Direct mapping
    if (validTypes.includes(normalizedType as (typeof validTypes)[number])) {
      return normalizedType as 'match' | 'practice' | 'tournament' | 'meetup';
    }

    // Legacy type mapping for backward compatibility - lightning을 match로 통합
    const typeMapping: Record<string, 'match' | 'practice' | 'tournament' | 'meetup'> = {
      lightning: 'match', // 🔄 레거시 lightning → match 변환
      // meetup: removed - now a valid type! 🎯
      casual: 'practice',
      ranked: 'tournament',
      번개: 'match',
      연습: 'practice',
      토너먼트: 'tournament',
    };

    if (typeMapping[normalizedType]) {
      return typeMapping[normalizedType];
    }
  }

  // Safe fallback - 기본값을 match로 변경
  return 'match';
}

/**
 * 🛡️ Enhanced skill level extraction with comprehensive format support
 * Handles various skillLevel formats found in Firebase data + alternative field detection
 */
export function safeSkillLevel(skillLevel: unknown, eventData?: Record<string, unknown>): string {
  // 🔍 SIMPLE TEST: Verify this function is being called
  console.log('🔍 TEST: safeSkillLevel called with:', skillLevel);

  console.log('🔍 [safeSkillLevel] Processing:', { skillLevel, hasEventData: !!eventData });

  // Phase 1: Direct skillLevel processing
  if (typeof skillLevel === 'string' && skillLevel.trim() !== '') {
    const normalizedLevel = skillLevel.trim().toLowerCase();

    // Map common variations to translation keys
    const levelMapping: Record<string, string> = {
      beginner: i18next.t('dataUtils.skillLevels.beginner'),
      intermediate: i18next.t('dataUtils.skillLevels.intermediate'),
      advanced: i18next.t('dataUtils.skillLevels.advanced'),
      expert: i18next.t('dataUtils.skillLevels.expert'),
      all: i18next.t('dataUtils.skillLevels.all'),
      any: i18next.t('dataUtils.skillLevels.anyLevel'),
      mixed: i18next.t('dataUtils.skillLevels.mixed'),
      초급: i18next.t('dataUtils.skillLevels.beginner'),
      중급: i18next.t('dataUtils.skillLevels.intermediate'),
      고급: i18next.t('dataUtils.skillLevels.advanced'),
      전문가: i18next.t('dataUtils.skillLevels.expert'),
      모든레벨: i18next.t('dataUtils.skillLevels.anyLevel'),
      혼합: i18next.t('dataUtils.skillLevels.mixed'),
    };

    const mappedLevel = levelMapping[normalizedLevel] || skillLevel.trim();
    console.log('🔍 [safeSkillLevel] String mapping result:', mappedLevel);
    return mappedLevel;
  }

  // Phase 2: Handle numeric values (NTRP scale)
  if (typeof skillLevel === 'number') {
    let numericLevel = i18next.t('dataUtils.skillLevels.intermediate');
    if (skillLevel >= 1.0 && skillLevel <= 2.5)
      numericLevel = i18next.t('dataUtils.skillLevels.beginner');
    else if (skillLevel >= 3.0 && skillLevel <= 4.0)
      numericLevel = i18next.t('dataUtils.skillLevels.intermediate');
    else if (skillLevel >= 4.5 && skillLevel <= 5.5)
      numericLevel = i18next.t('dataUtils.skillLevels.advanced');
    else if (skillLevel >= 6.0) numericLevel = i18next.t('dataUtils.skillLevels.expert');

    console.log('🔍 [safeSkillLevel] Numeric conversion:', skillLevel, '→', numericLevel);
    return numericLevel;
  }

  // Phase 3: Handle object format (if Firebase stores complex skill data)
  if (skillLevel && typeof skillLevel === 'object') {
    const skillObj = skillLevel as Record<string, unknown>;

    // Check for various field names
    const possibleFields = [
      'level',
      'value',
      'skillLevel',
      'rating',
      'ntrp',
      'required',
      'min',
      'max',
    ];
    for (const field of possibleFields) {
      if (skillObj[field]) {
        console.log('🔍 [safeSkillLevel] Found nested field:', field, '=', skillObj[field]);
        return safeSkillLevel(skillObj[field], eventData);
      }
    }
  }

  // Phase 4: Alternative field detection from eventData
  if (eventData && typeof eventData === 'object') {
    console.log('🔍 [safeSkillLevel] Searching alternative fields in eventData');

    const alternativeFields = [
      'requiredSkillLevel',
      'minSkillLevel',
      'maxSkillLevel',
      'hostSkillLevel',
      'creatorSkillLevel',
      'targetSkillLevel',
    ];

    for (const field of alternativeFields) {
      if (eventData[field]) {
        console.log('🔍 [safeSkillLevel] Found alternative field:', field, '=', eventData[field]);
        return safeSkillLevel(eventData[field], eventData);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventDataAny = eventData as any;

    // Check nested preferences
    if (eventDataAny.preferences?.skillLevel) {
      console.log(
        '🔍 [safeSkillLevel] Found preferences.skillLevel:',
        eventDataAny.preferences.skillLevel
      );
      return safeSkillLevel(eventDataAny.preferences.skillLevel, eventData);
    }

    // Check user/host profile data
    if (eventDataAny.host?.profile?.skillLevel) {
      console.log(
        '🔍 [safeSkillLevel] Found host.profile.skillLevel:',
        eventDataAny.host.profile.skillLevel
      );
      return safeSkillLevel(eventDataAny.host.profile.skillLevel, eventData);
    }
  }

  // Phase 5: Smart fallback based on event type/context
  if (eventData && typeof eventData === 'object') {
    // Tournament events typically require higher skill
    if (eventData.type === 'tournament') {
      const advanced = i18next.t('dataUtils.skillLevels.advanced');
      console.log('🔍 [safeSkillLevel] Tournament fallback:', advanced);
      return advanced;
    }

    // Practice events are usually beginner-friendly
    if (eventData.type === 'practice') {
      const beginner = i18next.t('dataUtils.skillLevels.beginner');
      console.log('🔍 [safeSkillLevel] Practice fallback:', beginner);
      return beginner;
    }
  }

  // Final safe fallback
  const anyLevel = i18next.t('dataUtils.skillLevels.anyLevel');
  console.log('🔍 [safeSkillLevel] Using final fallback:', anyLevel);
  return anyLevel;
}

/**
 * 🛡️ Enhanced location extraction with multiple format support
 */
export function safeLocation(location: unknown): string {
  if (typeof location === 'string' && location.trim() !== '') {
    return location.trim();
  }

  if (location && typeof location === 'object') {
    const locationObj = location as Record<string, unknown>;

    // Try various location field names
    const locationFields = [
      'address',
      'name',
      'formatted_address',
      'formattedAddress',
      'description',
      'venue',
    ];

    for (const field of locationFields) {
      const value = locationObj[field];
      if (typeof value === 'string' && value.trim() !== '') {
        return value.trim();
      }
    }
  }

  return i18next.t('dataUtils.location.tbd');
}

/**
 * 🛡️ Safe Match Result Validation
 * Ensures match result data is properly structured
 */
export function safeMatchResult(matchResult: unknown): {
  score: unknown;
  hostResult: 'win' | 'loss';
  submittedAt: Date;
} | null {
  if (!matchResult || typeof matchResult !== 'object') {
    return null;
  }

  const result = matchResult as Record<string, unknown>;

  // Must have either score or hostResult to be valid
  if (!result.score && !result.hostResult) {
    return null;
  }

  return {
    score: result.score || null,
    hostResult: result.hostResult === 'win' ? 'win' : 'loss',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    submittedAt: safeToDate(result.submittedAt as any) || new Date(),
  };
}

/**
 * 🛡️ Safe Score Validation for Multiple Formats
 * Handles both string scores and structured score objects
 */
export function validateScore(score: unknown): boolean {
  if (!score) {
    return false;
  }

  // String score (e.g., "6-2, 6-4")
  if (typeof score === 'string' && score.trim() !== '') {
    return true;
  }

  // Object score with sets
  if (typeof score === 'object') {
    const scoreObj = score as Record<string, unknown>;

    // Check for _winner field (legacy format)
    if (scoreObj._winner) {
      return true;
    }

    // Check for sets array (new format)
    if (Array.isArray(scoreObj.sets) && scoreObj.sets.length > 0) {
      return true;
    }
  }

  return false;
}

/**
 * 🛡️ Smart Skill Level Formatting
 * Converts complex skill level ranges to readable text
 * @deprecated currentLanguage parameter is deprecated, uses i18next instead
 */
export function formatSmartSkillLevel(skillLevel: string, currentLanguage?: string): string {
  // Suppress unused parameter warning - kept for backwards compatibility
  void currentLanguage;

  if (!skillLevel || typeof skillLevel !== 'string') {
    return i18next.t('dataUtils.skillLevels.anyLevel');
  }

  const trimmedLevel = skillLevel.trim();

  // Handle numeric NTRP values (e.g., "3", "3.5", "4.0")
  const numericValue = parseFloat(trimmedLevel);
  if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 7) {
    // For single numeric values, just return them as-is
    return trimmedLevel;
  }

  const normalizedLevel = trimmedLevel.toLowerCase();

  // Handle simple text levels using i18next
  const simpleLevels: Record<string, string> = {
    beginner: 'dataUtils.skillLevels.beginner',
    intermediate: 'dataUtils.skillLevels.intermediate',
    advanced: 'dataUtils.skillLevels.advanced',
    expert: 'dataUtils.skillLevels.expert',
    'any level': 'dataUtils.skillLevels.anyLevel',
    all: 'dataUtils.skillLevels.all',
  };

  if (simpleLevels[normalizedLevel]) {
    return i18next.t(simpleLevels[normalizedLevel]);
  }

  // Handle single ranges (e.g., "3.0-4.0")
  if (trimmedLevel.includes('-') && !trimmedLevel.includes(',')) {
    const parts = trimmedLevel.split('-');
    if (parts.length === 2) {
      const start = parseFloat(parts[0].trim());
      const end = parseFloat(parts[1].trim());
      if (!isNaN(start) && !isNaN(end)) {
        if (start >= 1.0 && end <= 2.5) {
          return i18next.t('dataUtils.skillLevels.beginner');
        }
        if (start >= 2.5 && end <= 3.5) {
          return i18next.t('dataUtils.skillLevels.intermediate');
        }
        if (start >= 3.5 && end <= 4.5) {
          return i18next.t('dataUtils.skillLevels.advanced');
        }
        if (start >= 4.5) {
          return i18next.t('dataUtils.skillLevels.expert');
        }
        // Return the range as-is if it doesn't fit categories
        return trimmedLevel;
      }
    }
  }

  // Handle complex multi-ranges (e.g., "1.0-2.5,3.0-3.5,4.0-4.5")
  if (trimmedLevel.includes(',')) {
    const ranges = trimmedLevel.split(',');

    // Analyze if all levels except 5.0 are included
    const hasLow = ranges.some(r => r.includes('1') || r.includes('2'));
    const hasMid = ranges.some(r => r.includes('3'));
    const hasHigh = ranges.some(r => r.includes('4'));
    const hasExpert = ranges.some(r => r.includes('5'));

    // Smart text for common patterns
    if (hasLow && hasMid && hasHigh && !hasExpert) {
      return i18next.t('dataUtils.smartSkillLevel.under5');
    }
    if (ranges.length >= 3) {
      return i18next.t('dataUtils.smartSkillLevel.mostLevels');
    }
    if (ranges.length === 2) {
      return i18next.t('dataUtils.smartSkillLevel.mixedLevel');
    }
  }

  // If it's a short string that doesn't match patterns, return as-is
  if (trimmedLevel.length <= 15) {
    return trimmedLevel;
  }

  // For long strings, truncate
  return trimmedLevel.substring(0, 12) + '...';
}

/**
 * 🎯 [KIM FIX] Infer correct event type from gameType field
 * gameType is more reliable than type field (which can be incorrectly set during event creation)
 *
 * @param gameType - The gameType field from the event (e.g., 'mens_singles', 'rally')
 * @param originalType - The original type field from the event (fallback)
 * @returns Inferred event type: 'match' | 'meetup' | original type
 */
export function inferEventType(
  gameType: string | undefined | null,
  originalType: string | undefined | null
): string {
  const normalizedGameType = gameType?.toLowerCase();

  // Match types: singles/doubles games
  if (normalizedGameType?.includes('singles') || normalizedGameType?.includes('doubles')) {
    return 'match';
  }

  // Meetup types: rally, practice sessions
  if (normalizedGameType === 'rally') {
    return 'meetup';
  }

  // Fallback to original type
  return originalType || 'match';
}

/**
 * 🎯 [KIM FIX] Check if event type is meetup based on both type and gameType
 * Uses inferEventType to determine correct type from gameType first
 *
 * @param event - The event object with type and gameType fields
 * @returns true if the event is a meetup type
 */
export function isMeetupEvent(event: { type?: string | null; gameType?: string | null }): boolean {
  const inferredType = inferEventType(event.gameType, event.type);
  return inferredType?.toLowerCase() === 'meetup';
}

/**
 * 🛡️ Event Completion Detection
 * Universal logic to determine if an event is completed across all contexts
 */
export function isEventCompleted(event: Partial<EventWithParticipation>): boolean {
  // Check explicit status
  if (event.status === 'completed') {
    return true;
  }

  // Check for valid match result
  const validMatchResult = safeMatchResult(event.matchResult);
  if (validMatchResult) {
    return true;
  }

  // Check for valid score data
  if (validateScore((event as Record<string, unknown>).score)) {
    return true;
  }

  return false;
}
