/**
 * 🌍 Currency Utilities
 *
 * 국가별 화폐 포맷팅 유틸리티
 * 작성자의 위치 정보를 기반으로 해당 국가의 화폐로 표시
 */

// 국가별 화폐 매핑
const COUNTRY_CURRENCY_MAP: Record<
  string,
  { symbol: string; code: string; position: 'before' | 'after' }
> = {
  // 북미
  'United States': { symbol: '$', code: 'USD', position: 'before' },
  US: { symbol: '$', code: 'USD', position: 'before' },
  USA: { symbol: '$', code: 'USD', position: 'before' },
  Canada: { symbol: 'CA$', code: 'CAD', position: 'before' },

  // 아시아
  'South Korea': { symbol: '₩', code: 'KRW', position: 'before' },
  Korea: { symbol: '₩', code: 'KRW', position: 'before' },
  대한민국: { symbol: '₩', code: 'KRW', position: 'before' },
  Japan: { symbol: '¥', code: 'JPY', position: 'before' },
  China: { symbol: '¥', code: 'CNY', position: 'before' },
  Taiwan: { symbol: 'NT$', code: 'TWD', position: 'before' },
  'Hong Kong': { symbol: 'HK$', code: 'HKD', position: 'before' },
  Singapore: { symbol: 'S$', code: 'SGD', position: 'before' },
  Thailand: { symbol: '฿', code: 'THB', position: 'before' },
  Vietnam: { symbol: '₫', code: 'VND', position: 'after' },
  Philippines: { symbol: '₱', code: 'PHP', position: 'before' },
  Malaysia: { symbol: 'RM', code: 'MYR', position: 'before' },
  Indonesia: { symbol: 'Rp', code: 'IDR', position: 'before' },
  India: { symbol: '₹', code: 'INR', position: 'before' },

  // 유럽 (유로존)
  Germany: { symbol: '€', code: 'EUR', position: 'after' },
  France: { symbol: '€', code: 'EUR', position: 'after' },
  Italy: { symbol: '€', code: 'EUR', position: 'after' },
  Spain: { symbol: '€', code: 'EUR', position: 'after' },
  Portugal: { symbol: '€', code: 'EUR', position: 'after' },
  Netherlands: { symbol: '€', code: 'EUR', position: 'after' },
  Belgium: { symbol: '€', code: 'EUR', position: 'after' },
  Austria: { symbol: '€', code: 'EUR', position: 'after' },
  Ireland: { symbol: '€', code: 'EUR', position: 'after' },
  Finland: { symbol: '€', code: 'EUR', position: 'after' },
  Greece: { symbol: '€', code: 'EUR', position: 'after' },

  // 유럽 (비유로존)
  'United Kingdom': { symbol: '£', code: 'GBP', position: 'before' },
  UK: { symbol: '£', code: 'GBP', position: 'before' },
  Switzerland: { symbol: 'CHF', code: 'CHF', position: 'before' },
  Sweden: { symbol: 'kr', code: 'SEK', position: 'after' },
  Norway: { symbol: 'kr', code: 'NOK', position: 'after' },
  Denmark: { symbol: 'kr', code: 'DKK', position: 'after' },
  Poland: { symbol: 'zł', code: 'PLN', position: 'after' },
  'Czech Republic': { symbol: 'Kč', code: 'CZK', position: 'after' },
  Hungary: { symbol: 'Ft', code: 'HUF', position: 'after' },
  Russia: { symbol: '₽', code: 'RUB', position: 'after' },
  Ukraine: { symbol: '₴', code: 'UAH', position: 'after' },
  Turkey: { symbol: '₺', code: 'TRY', position: 'before' },

  // 오세아니아
  Australia: { symbol: 'A$', code: 'AUD', position: 'before' },
  'New Zealand': { symbol: 'NZ$', code: 'NZD', position: 'before' },

  // 남미
  Brazil: { symbol: 'R$', code: 'BRL', position: 'before' },
  Mexico: { symbol: 'MX$', code: 'MXN', position: 'before' },
  Argentina: { symbol: 'AR$', code: 'ARS', position: 'before' },
  Chile: { symbol: 'CLP$', code: 'CLP', position: 'before' },
  Colombia: { symbol: 'COL$', code: 'COP', position: 'before' },

  // 중동/아프리카
  'United Arab Emirates': { symbol: 'AED', code: 'AED', position: 'before' },
  UAE: { symbol: 'AED', code: 'AED', position: 'before' },
  'Saudi Arabia': { symbol: 'SAR', code: 'SAR', position: 'before' },
  Israel: { symbol: '₪', code: 'ILS', position: 'before' },
  'South Africa': { symbol: 'R', code: 'ZAR', position: 'before' },
  Egypt: { symbol: 'E£', code: 'EGP', position: 'before' },
};

// 기본 화폐 (국가를 찾을 수 없을 때)
const DEFAULT_CURRENCY = { symbol: '$', code: 'USD', position: 'before' as const };

/**
 * 국가명으로 화폐 정보 가져오기
 */
export function getCurrencyByCountry(country?: string): {
  symbol: string;
  code: string;
  position: 'before' | 'after';
} {
  if (!country) return DEFAULT_CURRENCY;
  return COUNTRY_CURRENCY_MAP[country] || DEFAULT_CURRENCY;
}

/**
 * 가격을 국가별 화폐로 포맷팅
 * @param price 가격 (숫자)
 * @param country 국가명
 * @returns 포맷팅된 가격 문자열
 */
export function formatPriceByCountry(price: number, country?: string): string {
  const currency = getCurrencyByCountry(country);
  const formattedPrice = price.toLocaleString();

  if (currency.position === 'before') {
    return `${currency.symbol}${formattedPrice}`;
  } else {
    return `${formattedPrice}${currency.symbol}`;
  }
}

/**
 * 미국인지 확인
 */
export function isUSACountry(country?: string): boolean {
  return country === 'United States' || country === 'US' || country === 'USA';
}

// 화폐 코드별 매핑 (역방향 조회용)
const CURRENCY_CODE_MAP: Record<string, { symbol: string; position: 'before' | 'after' }> = {
  USD: { symbol: '$', position: 'before' },
  KRW: { symbol: '₩', position: 'before' },
  JPY: { symbol: '¥', position: 'before' },
  CNY: { symbol: '¥', position: 'before' },
  EUR: { symbol: '€', position: 'after' },
  GBP: { symbol: '£', position: 'before' },
  CAD: { symbol: 'CA$', position: 'before' },
  AUD: { symbol: 'A$', position: 'before' },
  NZD: { symbol: 'NZ$', position: 'before' },
  CHF: { symbol: 'CHF', position: 'before' },
  HKD: { symbol: 'HK$', position: 'before' },
  SGD: { symbol: 'S$', position: 'before' },
  TWD: { symbol: 'NT$', position: 'before' },
  THB: { symbol: '฿', position: 'before' },
  VND: { symbol: '₫', position: 'after' },
  PHP: { symbol: '₱', position: 'before' },
  MYR: { symbol: 'RM', position: 'before' },
  IDR: { symbol: 'Rp', position: 'before' },
  INR: { symbol: '₹', position: 'before' },
  SEK: { symbol: 'kr', position: 'after' },
  NOK: { symbol: 'kr', position: 'after' },
  DKK: { symbol: 'kr', position: 'after' },
  PLN: { symbol: 'zł', position: 'after' },
  CZK: { symbol: 'Kč', position: 'after' },
  HUF: { symbol: 'Ft', position: 'after' },
  RUB: { symbol: '₽', position: 'after' },
  UAH: { symbol: '₴', position: 'after' },
  TRY: { symbol: '₺', position: 'before' },
  BRL: { symbol: 'R$', position: 'before' },
  MXN: { symbol: 'MX$', position: 'before' },
  ARS: { symbol: 'AR$', position: 'before' },
  CLP: { symbol: 'CLP$', position: 'before' },
  COP: { symbol: 'COL$', position: 'before' },
  AED: { symbol: 'AED', position: 'before' },
  SAR: { symbol: 'SAR', position: 'before' },
  ILS: { symbol: '₪', position: 'before' },
  ZAR: { symbol: 'R', position: 'before' },
  EGP: { symbol: 'E£', position: 'before' },
};

/**
 * 화폐 코드로 가격 포맷팅
 * @param price 가격 (숫자)
 * @param currencyCode 화폐 코드 (예: 'USD', 'KRW')
 * @returns 포맷팅된 가격 문자열
 */
export function formatPriceByCurrencyCode(price: number, currencyCode?: string): string {
  const currency = currencyCode ? CURRENCY_CODE_MAP[currencyCode] : null;
  const formattedPrice = price.toLocaleString();

  if (!currency) {
    // 기본값: USD
    return `$${formattedPrice}`;
  }

  if (currency.position === 'before') {
    return `${currency.symbol}${formattedPrice}`;
  } else {
    return `${formattedPrice}${currency.symbol}`;
  }
}

/**
 * 국가명으로 화폐 심볼만 가져오기
 * @param country 국가명
 * @returns 화폐 심볼 (예: '$', '₩')
 */
export function getCurrencySymbolByCountry(country?: string): string {
  const currency = getCurrencyByCountry(country);
  return currency.symbol;
}

export { COUNTRY_CURRENCY_MAP, CURRENCY_CODE_MAP, DEFAULT_CURRENCY };
