/**
 * Unit Conversion Utilities for Lightning Tennis
 * Global Unit Control Room - Centralized distance formatting system
 *
 * Handles automatic km/miles conversion based on user country and language
 * Eliminates code duplication across components
 */

// Countries that primarily use miles (Imperial system)
// Support both country codes AND full country names for robust detection
const MILES_COUNTRIES = [
  // United States variants
  'US',
  'USA',
  'UNITED STATES',
  'UNITED STATES OF AMERICA',
  // United Kingdom variants
  'GB',
  'UK',
  'UNITED KINGDOM',
  'GREAT BRITAIN',
  'BRITAIN',
  // Liberia variants
  'LR',
  'LIBERIA',
  'REPUBLIC OF LIBERIA',
  // Myanmar variants
  'MM',
  'MYANMAR',
  'BURMA',
  'REPUBLIC OF THE UNION OF MYANMAR',
];

// Conversion constants
const KILOMETERS_IN_A_MILE = 1.609344;
const METERS_IN_A_KILOMETER = 1000;

// Translation function type for i18n integration
type TranslationFunction = (key: string, options?: { distance?: string | number }) => string;

/**
 * Simple template string processor for translation keys
 * Replaces {{distance}} with actual distance value
 */
const processTemplate = (template: string, distance: string | number): string => {
  return template.replace(/\{\{distance\}\}/g, String(distance));
};

/**
 * Determines if a country uses miles instead of kilometers
 * @param countryCode - Country code ('US', 'GB') or full name ('United States', 'United Kingdom')
 * @returns true if country uses miles, false for kilometers
 */
const shouldUseMiles = (countryCode?: string): boolean => {
  if (!countryCode) return false; // Default to metric system
  return MILES_COUNTRIES.includes(countryCode.toUpperCase());
};

/**
 * Formats distance with appropriate unit based on user's country and language
 * FINAL FIX: Unit determination (country-based) separated from text translation (language-based)
 * @param distance - Distance in kilometers (as currently stored in the app)
 * @param countryCode - Country code ('US') or full name ('United States')
 * @param t - Translation function from useLanguage hook
 * @returns Formatted distance string (e.g., "1.5 km", "22 mi", "Within 1km")
 */
export const formatDistance = (
  distance: number | null | undefined,
  countryCode?: string,
  t?: TranslationFunction
): string => {
  // Handle invalid input
  if (typeof distance !== 'number' || !isFinite(distance) || distance < 0) {
    return t ? t('units.distanceNA') : 'Distance N/A';
  }

  // STEP 1: Determine unit based ONLY on country (not language)
  const useMiles = shouldUseMiles(countryCode);

  if (useMiles) {
    // Convert kilometers to miles for Imperial countries
    const miles = distance / KILOMETERS_IN_A_MILE;

    if (miles < 0.1) {
      // Very short distances - use translation with fixed 0.1 value
      const template = t ? t('units.withinMi') : 'Within {{distance}} mi';
      return processTemplate(template, '0.1');
    } else if (miles < 1) {
      // Less than 1 mile - use translation with decimal value
      const template = t ? t('units.withinMi') : 'Within {{distance}} mi';
      return processTemplate(template, miles.toFixed(1));
    } else {
      // 1 mile or more - use translation with rounded value
      const roundedMiles = miles < 10 ? miles.toFixed(1) : Math.round(miles).toString();
      const template = t ? t('units.distanceMi') : '{{distance}} mi';
      return processTemplate(template, roundedMiles);
    }
  } else {
    // Use kilometers for metric countries
    if (distance < 1) {
      // Less than 1 km - use translation with fixed 1 value
      const template = t ? t('units.withinKm') : 'Within {{distance}}km';
      return processTemplate(template, '1');
    } else if (distance < 10) {
      // 1-10 km - show one decimal place using translation
      const template = t ? t('units.distanceKm') : '{{distance}} km';
      return processTemplate(template, distance.toFixed(1));
    } else {
      // 10+ km - round to whole numbers using translation
      const template = t ? t('units.distanceKm') : '{{distance}} km';
      return processTemplate(template, Math.round(distance));
    }
  }
};

/**
 * Converts distance from meters to the appropriate display unit
 * @param distanceInMeters - Distance in meters
 * @param countryCode - User's country code
 * @param t - Translation function from useLanguage hook
 * @returns Formatted distance string
 */
export const formatDistanceFromMeters = (
  distanceInMeters: number | null | undefined,
  countryCode?: string,
  t?: TranslationFunction
): string => {
  if (typeof distanceInMeters !== 'number') {
    return formatDistance(null, countryCode, t);
  }

  // Convert meters to kilometers first
  const distanceInKm = distanceInMeters / METERS_IN_A_KILOMETER;
  return formatDistance(distanceInKm, countryCode, t);
};

/**
 * Gets the appropriate distance unit label for a country
 * @param countryCode - User's country code
 * @param t - Translation function from useLanguage hook
 * @returns Unit label string
 */
export const getDistanceUnit = (
  param1?: string | TranslationFunction,
  param2?: string | TranslationFunction
): string => {
  // 🛡️ 방어적 매개변수 처리: 순서가 바뀌어도 올바르게 동작
  let countryCode: string | undefined;
  let t: TranslationFunction | undefined;

  // 첫 번째 매개변수가 함수인 경우 (올바른 순서: t, countryCode)
  if (typeof param1 === 'function') {
    t = param1 as TranslationFunction;
    countryCode = typeof param2 === 'string' ? param2 : undefined;
  }
  // 첫 번째 매개변수가 문자열인 경우 (기존 순서: countryCode, t)
  else {
    countryCode = param1;
    t = typeof param2 === 'function' ? (param2 as TranslationFunction) : undefined;
  }

  if (shouldUseMiles(countryCode)) {
    return t ? t('units.mi') : 'mi';
  } else {
    return t ? t('units.km') : 'km';
  }
};

/**
 * Converts kilometers to miles
 * @param kilometers - Distance in kilometers
 * @returns Distance in miles
 */
export const kilometersToMiles = (kilometers: number): number => {
  return kilometers / KILOMETERS_IN_A_MILE;
};

/**
 * Converts miles to kilometers
 * @param miles - Distance in miles
 * @returns Distance in kilometers
 */
export const milesToKilometers = (miles: number): number => {
  return miles * KILOMETERS_IN_A_MILE;
};

/**
 * Backward compatibility function - formats distance with legacy API
 * @deprecated Use formatDistance with translation function instead
 * @param distance - Distance in kilometers
 * @param countryCode - Country code or name
 * @param _language - Language code ('en' | 'ko') - unused in new implementation
 * @returns Formatted distance string
 */
export const formatDistanceLegacy = (
  distance: number | null | undefined,
  countryCode?: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _language: 'en' | 'ko' = 'en'
): string => {
  // Use the new function without translation for backward compatibility
  return formatDistance(distance, countryCode);
};
