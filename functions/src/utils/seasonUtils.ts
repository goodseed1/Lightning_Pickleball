/**
 * 🏛️ PROJECT OLYMPUS - Honor System Phase 2
 * Season Management Utilities
 *
 * Provides season calculation functions for the Honor System's official ranker differentiation.
 * Seasons are quarterly (Q1-Q4) and used to track player rankings and award trophies.
 */

/**
 * Get current season ID based on current date
 * @returns Season ID in format 'YYYY-QN' (e.g., '2025-Q1')
 */
export function getCurrentSeasonId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11

  // Calculate quarter based on month
  const quarter = Math.floor(month / 3) + 1;

  return `${year}-Q${quarter}`;
}

/**
 * Get previous season ID
 * @returns Previous season ID in format 'YYYY-QN'
 */
export function getPreviousSeasonId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11

  // Calculate current quarter
  const currentQuarter = Math.floor(month / 3) + 1;

  // Calculate previous quarter
  let prevQuarter: number;
  let prevYear: number;

  if (currentQuarter === 1) {
    // If current is Q1, previous is Q4 of last year
    prevQuarter = 4;
    prevYear = year - 1;
  } else {
    // Otherwise, just decrement quarter
    prevQuarter = currentQuarter - 1;
    prevYear = year;
  }

  return `${prevYear}-Q${prevQuarter}`;
}

/**
 * Get human-readable season name
 * @param seasonId Season ID in format 'YYYY-QN'
 * @returns Season name (e.g., '2025 Spring')
 */
export function getSeasonName(seasonId: string): string {
  const [year, quarterStr] = seasonId.split('-');
  const quarter = parseInt(quarterStr.replace('Q', ''), 10);

  const seasonNames: { [key: number]: string } = {
    1: 'Spring',
    2: 'Summer',
    3: 'Fall',
    4: 'Winter',
  };

  return `${year} ${seasonNames[quarter] || 'Unknown'}`;
}

/**
 * Get date range for a specific season
 * @param seasonId Season ID in format 'YYYY-QN'
 * @returns Object with start and end dates
 */
export function getSeasonDateRange(seasonId: string): { start: Date; end: Date } {
  const [yearStr, quarterStr] = seasonId.split('-');
  const year = parseInt(yearStr, 10);
  const quarter = parseInt(quarterStr.replace('Q', ''), 10);

  // Calculate start month (0-indexed)
  const startMonth = (quarter - 1) * 3;

  // Create start date (first day of first month in quarter)
  const start = new Date(year, startMonth, 1, 0, 0, 0, 0);

  // Create end date (last day of last month in quarter)
  // End date is actually the start of next quarter minus 1ms
  const endMonth = startMonth + 3;
  const end = new Date(year, endMonth, 1, 0, 0, 0, -1);

  return { start, end };
}

/**
 * Check if a date falls within a specific season
 * @param date Date to check
 * @param seasonId Season ID in format 'YYYY-QN'
 * @returns True if date is within season
 */
export function isDateInSeason(date: Date, seasonId: string): boolean {
  const { start, end } = getSeasonDateRange(seasonId);
  return date >= start && date <= end;
}

/**
 * Get season ID for a specific date
 * @param date Date to get season for
 * @returns Season ID in format 'YYYY-QN'
 */
export function getSeasonIdForDate(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11
  const quarter = Math.floor(month / 3) + 1;

  return `${year}-Q${quarter}`;
}
