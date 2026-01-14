/**
 * 🌍 Timezone Utilities (Client-side)
 *
 * Provides timezone detection and local time calculations for users.
 * Used during onboarding to automatically detect user's timezone from GPS coordinates.
 */

/**
 * Common timezone mappings for major regions
 * Based on IANA timezone database
 */
const TIMEZONE_REGIONS: Record<
  string,
  { lat: [number, number]; lng: [number, number]; tz: string }
> = {
  // United States
  'US-Eastern': { lat: [24, 50], lng: [-87, -66], tz: 'America/New_York' },
  'US-Central': { lat: [24, 50], lng: [-105, -87], tz: 'America/Chicago' },
  'US-Mountain': { lat: [24, 50], lng: [-115, -105], tz: 'America/Denver' },
  'US-Pacific': { lat: [24, 50], lng: [-130, -115], tz: 'America/Los_Angeles' },
  'US-Alaska': { lat: [50, 72], lng: [-180, -130], tz: 'America/Anchorage' },
  'US-Hawaii': { lat: [18, 30], lng: [-180, -150], tz: 'Pacific/Honolulu' },

  // Asia
  Korea: { lat: [33, 43], lng: [124, 132], tz: 'Asia/Seoul' },
  Japan: { lat: [24, 46], lng: [122, 154], tz: 'Asia/Tokyo' },
  'China-East': { lat: [18, 54], lng: [100, 135], tz: 'Asia/Shanghai' },
  India: { lat: [6, 36], lng: [68, 98], tz: 'Asia/Kolkata' },
  Singapore: { lat: [-1, 2], lng: [100, 108], tz: 'Asia/Singapore' },

  // Europe
  UK: { lat: [49, 61], lng: [-11, 2], tz: 'Europe/London' },
  CentralEurope: { lat: [43, 55], lng: [2, 25], tz: 'Europe/Berlin' },
  EasternEurope: { lat: [43, 60], lng: [25, 45], tz: 'Europe/Moscow' },

  // Australia
  'Australia-East': { lat: [-44, -10], lng: [140, 155], tz: 'Australia/Sydney' },
  'Australia-Central': { lat: [-44, -10], lng: [130, 140], tz: 'Australia/Adelaide' },
  'Australia-West': { lat: [-44, -10], lng: [112, 130], tz: 'Australia/Perth' },
};

/**
 * Get timezone from latitude/longitude coordinates
 * Uses a simplified region-based lookup for common areas
 *
 * @param lat - Latitude coordinate
 * @param lng - Longitude coordinate
 * @returns IANA timezone identifier (e.g., "America/New_York")
 */
export function getTimezoneFromCoordinates(lat: number, lng: number): string {
  // Check each region
  for (const [, region] of Object.entries(TIMEZONE_REGIONS)) {
    const [latMin, latMax] = region.lat;
    const [lngMin, lngMax] = region.lng;

    if (lat >= latMin && lat <= latMax && lng >= lngMin && lng <= lngMax) {
      return region.tz;
    }
  }

  // Fallback: Calculate approximate timezone from longitude
  // Each 15° of longitude ≈ 1 hour offset from UTC
  const offsetHours = Math.round(lng / 15);

  // Map common offset hours to major timezones
  const offsetToTimezone: Record<number, string> = {
    [-12]: 'Pacific/Fiji',
    [-11]: 'Pacific/Samoa',
    [-10]: 'Pacific/Honolulu',
    [-9]: 'America/Anchorage',
    [-8]: 'America/Los_Angeles',
    [-7]: 'America/Denver',
    [-6]: 'America/Chicago',
    [-5]: 'America/New_York',
    [-4]: 'America/Halifax',
    [-3]: 'America/Sao_Paulo',
    [0]: 'Europe/London',
    [1]: 'Europe/Paris',
    [2]: 'Europe/Berlin',
    [3]: 'Europe/Moscow',
    [4]: 'Asia/Dubai',
    [5]: 'Asia/Karachi',
    [6]: 'Asia/Dhaka',
    [7]: 'Asia/Bangkok',
    [8]: 'Asia/Shanghai',
    [9]: 'Asia/Tokyo',
    [10]: 'Australia/Sydney',
    [11]: 'Pacific/Noumea',
    [12]: 'Pacific/Auckland',
  };

  return offsetToTimezone[offsetHours] || 'America/New_York'; // Default to Eastern Time
}

/**
 * Default timezone if user doesn't have one set
 */
export const DEFAULT_TIMEZONE = 'America/New_York';
