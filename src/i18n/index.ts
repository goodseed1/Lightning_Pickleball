/**
 * ⚡ LTR System Migration Complete
 *
 * UI 표시: "LTR" (Lightning Tennis Rating)
 * 코드/DB: "ltr" - 변수명, 함수명, 새 Firestore 필드명
 *
 * Migration: NTRP → LTR 완료
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
// English & Korean
import ltrEn from './ltr.en.json';
import ltrKo from './ltr.ko.json';
import enTranslations from '../locales/en.json';
import koTranslations from '../locales/ko.json';
// 8 new languages (Spanish, French, German, Japanese, Chinese, Portuguese, Italian, Russian)
import ltrEs from './ltr.es.json';
import ltrFr from './ltr.fr.json';
import ltrDe from './ltr.de.json';
import ltrJa from './ltr.ja.json';
import ltrZh from './ltr.zh.json';
import ltrPt from './ltr.pt.json';
import ltrIt from './ltr.it.json';
import ltrRu from './ltr.ru.json';
import esTranslations from '../locales/es.json';
import frTranslations from '../locales/fr.json';
import deTranslations from '../locales/de.json';
import jaTranslations from '../locales/ja.json';
import zhTranslations from '../locales/zh.json';
import ptTranslations from '../locales/pt.json';
import itTranslations from '../locales/it.json';
import ruTranslations from '../locales/ru.json';

// Type for localization modules
interface LocalizationModule {
  getLocales: () => Array<{ languageCode: string }>;
}

// Robust localization module detection
let ExpoLocalization: LocalizationModule | null = null;
let RNLocalize: LocalizationModule | null = null;

try {
  // Try Expo Localization first (for Expo projects)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ExpoLocalization = require('expo-localization');
} catch {
  try {
    // Fallback to react-native-localize (for bare React Native)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    RNLocalize = require('react-native-localize');
  } catch {
    console.warn('No localization module found, using fallback');
  }
}

export const resources = {
  en: {
    translation: {
      ...enTranslations,
      ...ltrEn,
    },
  },
  ko: {
    translation: {
      ...koTranslations,
      ...ltrKo,
    },
  },
  es: {
    translation: {
      ...esTranslations,
      ...ltrEs,
    },
  },
  fr: {
    translation: {
      ...frTranslations,
      ...ltrFr,
    },
  },
  de: {
    translation: {
      ...deTranslations,
      ...ltrDe,
    },
  },
  ja: {
    translation: {
      ...jaTranslations,
      ...ltrJa,
    },
  },
  zh: {
    translation: {
      ...zhTranslations,
      ...ltrZh,
    },
  },
  pt: {
    translation: {
      ...ptTranslations,
      ...ltrPt,
    },
  },
  it: {
    translation: {
      ...itTranslations,
      ...ltrIt,
    },
  },
  ru: {
    translation: {
      ...ruTranslations,
      ...ltrRu,
    },
  },
};

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: (callback: (lng: string) => void) => {
    try {
      // Try Expo Localization first
      if (ExpoLocalization && typeof ExpoLocalization.getLocales === 'function') {
        const locales = ExpoLocalization.getLocales();
        if (locales && locales.length > 0 && locales[0].languageCode) {
          const lang = locales[0].languageCode;
          callback(['ko', 'kr'].includes(lang) ? 'ko' : 'en');
          return;
        }
      }

      // Fallback to react-native-localize
      if (RNLocalize && typeof RNLocalize.getLocales === 'function') {
        const locales = RNLocalize.getLocales();
        if (locales && locales.length > 0 && locales[0].languageCode) {
          const lang = locales[0].languageCode;
          callback(['ko', 'kr'].includes(lang) ? 'ko' : 'en');
          return;
        }
      }
    } catch (e) {
      console.warn('Language detection error:', e);
    }

    // Ultimate fallback to English
    callback('en');
  },
  init: () => {},
  cacheUserLanguage: () => {},
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: __DEV__,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
