// Safe utility functions to prevent undefined/null crashes

/**
 * Safely converts any value to an array
 */
export const toArray = <T>(v: T | T[] | null | undefined): T[] => {
  return Array.isArray(v) ? v : v == null ? [] : [v];
};

/**
 * Safe style combiner that filters out falsy values and flattens arrays
 * Accepts style objects, arrays of styles, or falsy values
 */
export const sx = (
  ...items: (Record<string, unknown> | Record<string, unknown>[] | false | null | undefined)[]
): Record<string, unknown>[] => {
  return items.flat(Infinity).filter(Boolean) as Record<string, unknown>[];
};

/**
 * Safe object spread that ensures we don't spread undefined
 */
export const safeSpread = <T extends Record<string, unknown>>(obj: T | null | undefined): T => {
  return obj && typeof obj === 'object' ? obj : ({} as T);
};

/**
 * Safe array access with fallback
 */
export const safeArray = <T>(arr: T[] | null | undefined, fallback: T[] = []): T[] => {
  return Array.isArray(arr) ? arr : fallback;
};
