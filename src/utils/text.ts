// Hardened helpers to avoid calling array methods on undefined
export function toArray<T>(v: T | T[] | null | undefined): T[] {
  if (Array.isArray(v)) return v;
  if (v == null) return [];
  return [v];
}

/**
 * Normalize a multi-line string into non-empty trimmed lines.
 * Accepts string | null | undefined and always returns a safe array.
 */
export function normalizeMultiline(input: string | null | undefined): string[] {
  if (typeof input !== 'string') return [];
  const parts = input.split(/\r?\n/); // always an array
  return parts.map(line => (line ?? '').trim()).filter(Boolean) as string[];
}

/**
 * Safely normalize any value to an array before filtering/mapping.
 * Useful for style arrays or other potentially undefined collections.
 */
export function normalizeArray<T>(v: unknown, fallback: T[] = []): T[] {
  return Array.isArray(v) ? (v as T[]) : fallback;
}
