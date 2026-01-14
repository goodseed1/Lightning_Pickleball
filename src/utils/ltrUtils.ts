/**
 * ⚡ LPR (Lightning Pickleball Rating) Utility Functions
 *
 * Utility functions for the LPR 1-10 rating system
 * Converts between LPR levels and ELO ratings
 *
 * 🎯 LPR System - Lightning Pickleball의 독자적인 레이팅 시스템
 * - ELO 알고리즘 기반
 * - 1-10까지의 직관적인 레벨
 * - 공용 번개 매치 결과에 적용
 *
 * @author Kim (LPR System Transition)
 * @date 2025-12-28
 */

import {
  LPR_LEVELS,
  LPR_TIERS,
  getLtrLevelByValue,
  convertEloToLtr,
  getInitialEloFromLtr,
  convertNtrpToLtr,
  ONBOARDING_LPR_CAP,
  getOnboardingLtrLevels,
  getTierByLevel,
  getTierNameByLevel,
  getTierColorByLevel,
  getTierThemeByLevel,
  getTierDescriptionByLevel,
  type LtrLevel,
  type LtrTier,
  type LtrTierName,
  type SupportedLanguage,
} from '../constants/ltr';
import i18n from '../i18n';

// Re-export core functions from ltr.ts for convenience
export {
  convertEloToLtr,
  convertEloToLtr as getLtrFromElo, // Alias for backward compatibility
  getInitialEloFromLtr,
  getInitialEloFromLtr as getInitialEloFromNtrp, // Alias for backward compatibility
  convertNtrpToLtr,
  getLtrLevelByValue,
  getOnboardingLtrLevels,
  ONBOARDING_LPR_CAP,
  LPR_LEVELS,
  LPR_TIERS,
  getTierByLevel,
  getTierNameByLevel,
  getTierColorByLevel,
  getTierThemeByLevel,
  getTierDescriptionByLevel,
};
export type { LtrLevel, LtrTier, LtrTierName, SupportedLanguage };

/**
 * Get localized LPR label for a given level
 * Alias for backward compatibility with eloUtils imports
 *
 * @param ltrLevel - LPR level (1-10)
 * @param language - Supported language code
 * @returns Localized label string
 */
export function getLocalizedLtrLabel(ltrLevel: number, language: SupportedLanguage = 'ko'): string {
  const level = getLtrLevelByValue(ltrLevel);
  if (!level) return `LPR ${ltrLevel}`;
  return level.label[language] || level.label.en;
}

/**
 * Get LPR level details for UI display
 *
 * @param ltrLevel - LPR level (1-10)
 * @param language - Supported language code
 * @returns Object with label, description, skills, tactics, experience
 */
export function getLtrDetails(ltrLevel: number, language: SupportedLanguage = 'ko') {
  const level = getLtrLevelByValue(ltrLevel);

  if (!level) {
    return {
      label: `LPR ${ltrLevel}`,
      description: i18n.t('utils.ltr.unknownLevel'),
      skills: '',
      tactics: '',
      experience: '',
      initialElo: 1150,
    };
  }

  return {
    label: level.label[language],
    description: level.description[language],
    skills: level.skills[language],
    tactics: level.tactics[language],
    experience: level.experience[language],
    initialElo: level.initialElo,
  };
}

// Alias for backward compatibility
export const getNtrpDetails = getLtrDetails;

/**
 * Validate if LPR level is within acceptable range (1-10)
 *
 * @param ltrLevel - LPR level to validate
 * @returns true if valid (1-10), false otherwise
 */
export function isValidLtrLevel(ltrLevel: number): boolean {
  return Number.isInteger(ltrLevel) && ltrLevel >= 1 && ltrLevel <= 10;
}

/**
 * Validate if LPR level is within onboarding cap
 *
 * @param ltrLevel - LPR level to validate
 * @returns true if valid for onboarding (1-5), false otherwise
 */
export function isValidOnboardingLtrLevel(ltrLevel: number): boolean {
  return isValidLtrLevel(ltrLevel) && ltrLevel <= ONBOARDING_LPR_CAP;
}

/**
 * Check if selected LPR level requires over-estimation warning
 * LPR 5 is the onboarding cap, so show warning for attempts above
 *
 * @param ltrLevel - LPR level to check
 * @returns true if level is at the onboarding cap (requires info about earning higher levels)
 */
export function shouldShowOnboardingCapInfo(ltrLevel: number): boolean {
  return ltrLevel >= ONBOARDING_LPR_CAP;
}

/**
 * Check if selected LPR level is at beginner tier
 *
 * @param ltrLevel - LPR level to check
 * @returns true if LPR 1 or 2 (show encouragement message)
 */
export function isBeginnerLevel(ltrLevel: number): boolean {
  return ltrLevel <= 2;
}

/**
 * Get LPR level description for display in profile
 * Handles multiple input formats: number, string, object
 *
 * @param ltrLevel - LPR level (number, string, or object with ltr)
 * @param language - Supported language code
 * @returns Formatted LPR description string
 */
export function getLtrLevelDescription(
  ltrLevel: string | number | object | undefined,
  language: SupportedLanguage = 'ko'
): string {
  if (!ltrLevel && ltrLevel !== 0) {
    return '';
  }

  // Handle NUMBER (standard LPR format)
  if (typeof ltrLevel === 'number') {
    const details = getLtrDetails(ltrLevel, language);
    return details.label; // e.g., "LPR 5 - 폭풍의 눈"
  }

  // Handle STRING that looks like LPR number (e.g., "5", "7")
  if (typeof ltrLevel === 'string') {
    const numValue = parseInt(ltrLevel, 10);

    // If it's a valid LPR numeric value, convert it
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 10) {
      const details = getLtrDetails(numValue, language);
      return details.label;
    }
    // Otherwise, it's a legacy text format
    return ltrLevel;
  }

  // If it's an object format, extract ltr value
  const result = (ltrLevel as { ltr?: number }).ltr;
  if (result !== undefined) {
    const details = getLtrDetails(result, language);
    return details.label;
  }

  return '';
}

/**
 * Get ELO range description for a given LPR level
 *
 * @param ltrLevel - LPR level (1-10)
 * @returns ELO range string (e.g., "1300-1399" or "≥2400")
 */
export function getEloRangeDescription(
  ltrLevel: number
): string {
  const level = getLtrLevelByValue(ltrLevel);

  if (!level) {
    return '';
  }

  if (ltrLevel === 10) {
    return i18n.t('utils.ltr.eloAbove', { min: level.eloMin });
  }

  return `ELO ${level.eloMin}-${level.eloMax - 1}`;
}

/**
 * Calculate LPR level progress percentage within current level
 *
 * @param elo - Current ELO rating
 * @returns Progress percentage (0-100) within current LPR level
 */
export function calculateLtrProgress(elo: number): number {
  const ltr = convertEloToLtr(elo);
  const level = getLtrLevelByValue(ltr);

  if (!level) return 0;

  // LPR 10 has no upper limit
  if (ltr === 10) {
    // Show progress based on how far beyond 2400
    const bonusProgress = Math.min(((elo - 2400) / 200) * 100, 100);
    return bonusProgress;
  }

  const range = level.eloMax - level.eloMin;
  const progress = ((elo - level.eloMin) / range) * 100;

  return Math.max(0, Math.min(100, progress));
}

/**
 * Get the next LPR level info
 *
 * @param currentLtr - Current LPR level
 * @param language - Supported language code
 * @returns Next level info or null if at max level
 */
export function getNextLtrLevel(currentLtr: number, language: SupportedLanguage = 'ko') {
  if (currentLtr >= 10) {
    return null; // Already at max level
  }

  const nextLevel = getLtrLevelByValue(currentLtr + 1);
  if (!nextLevel) return null;

  return {
    level: nextLevel.value,
    label: nextLevel.label[language],
    description: nextLevel.description[language],
    requiredElo: nextLevel.eloMin,
  };
}

/**
 * Get formatted LPR badge text
 *
 * @param ltrLevel - LPR level (1-10)
 * @returns Formatted badge text (e.g., "LPR 5")
 */
export function getLtrBadgeText(ltrLevel: number): string {
  return `LPR ${ltrLevel}`;
}

/**
 * Get LPR level tier category (NEW: 7-tier system)
 *
 * @param ltrLevel - LPR level (1-10)
 * @returns Tier name: LtrTierName
 */
export function getLtrTier(ltrLevel: number): LtrTierName {
  return getTierNameByLevel(ltrLevel);
}

/**
 * Get tier color for UI display (NEW: 7-tier system colors)
 *
 * @param ltrLevel - LPR level (1-10)
 * @returns Hex color code for the tier
 *
 * 🎨 Tier Colors:
 * - Bronze (LPR 1-2): #CD7F32
 * - Silver (LPR 3-4): #C0C0C0
 * - Gold (LPR 5-6): #FFD700
 * - Platinum (LPR 7): #E5E4E2
 * - Diamond (LPR 8): #B9F2FF
 * - Master (LPR 9): #1A1A2E (Obsidian)
 * - Legend (LPR 10): #FFD700 (Legendary Gold)
 */
export function getLtrTierColor(ltrLevel: number): string {
  return getTierColorByLevel(ltrLevel);
}

/**
 * Compare two LPR levels for matchmaking
 *
 * @param ltr1 - First LPR level
 * @param ltr2 - Second LPR level
 * @returns 'good' | 'fair' | 'mismatch' based on difference
 */
export function compareLtrLevels(ltr1: number, ltr2: number): 'good' | 'fair' | 'mismatch' {
  const diff = Math.abs(ltr1 - ltr2);

  if (diff <= 1) return 'good'; // Same level or 1 apart
  if (diff <= 2) return 'fair'; // 2 levels apart
  return 'mismatch'; // 3+ levels apart
}

/**
 * Get LPR explanation text for Hall of Fame page
 *
 * @param language - Supported language code
 * @returns Object with LPR explanation sections
 */
export function getLtrExplanation(language: SupportedLanguage = 'ko') {
  // Set the language for i18n before retrieving translations
  if (i18n.language !== language) {
    i18n.changeLanguage(language);
  }

  const explanations = {
    ko: {
      whatIsLtr: {
        title: i18n.t('utils.ltr.whatIsLtr.title'),
        content: i18n.t('utils.ltr.whatIsLtr.content'),
      },
      relationToNtrp: {
        title: i18n.t('utils.ltr.relationToNtrp.title'),
        content: i18n.t('utils.ltr.relationToNtrp.content'),
      },
    },
    en: {
      whatIsLtr: {
        title: i18n.t('utils.ltr.whatIsLtr.title'),
        content: i18n.t('utils.ltr.whatIsLtr.content'),
      },
      relationToNtrp: {
        title: i18n.t('utils.ltr.relationToNtrp.title'),
        content: i18n.t('utils.ltr.relationToNtrp.content'),
      },
    },
    es: {
      whatIsLtr: {
        title: '¿Qué es LPR?',
        content:
          'LPR (Lightning Pickleball Rating) es un sistema de evaluación de habilidades desarrollado independientemente para la comunidad de Lightning Pickleball. LPR se calcula en base a un algoritmo ELO aplicado a todos los resultados de partidos públicos, mostrando tu viaje de crecimiento a través de niveles intuitivos del 1 al 10.',
      },
      relationToNtrp: {
        title: 'Relación con NTRP',
        content:
          'LPR es el sistema propio de Lightning Pickleball, diferente del NTRP de USTA. Para comodidad de los usuarios familiarizados con NTRP, puedes seleccionar tu nivel en un rango similar al registrarte, pero todos los niveles oficiales se basan en LPR.',
      },
    },
    fr: {
      whatIsLtr: {
        title: "Qu'est-ce que LPR?",
        content:
          "LPR (Lightning Pickleball Rating) est un système d'évaluation des compétences développé indépendamment pour la communauté Lightning Pickleball. LPR est calculé sur la base d'un algorithme ELO appliqué à tous les résultats de matchs publics, montrant votre parcours de croissance à travers des niveaux intuitifs de 1 à 10.",
      },
      relationToNtrp: {
        title: 'Relation avec NTRP',
        content:
          "LPR est le système propre de Lightning Pickleball, différent du NTRP de l'USTA. Pour la commodité des utilisateurs familiers avec NTRP, vous pouvez sélectionner votre niveau dans une plage similaire lors de l'inscription, mais tous les niveaux officiels sont basés sur LPR.",
      },
    },
    de: {
      whatIsLtr: {
        title: 'Was ist LPR?',
        content:
          'LPR (Lightning Pickleball Rating) ist ein unabhängig entwickeltes Bewertungssystem für die Lightning Pickleball Community. LPR wird basierend auf einem ELO-Algorithmus berechnet, der auf alle öffentlichen Match-Ergebnisse angewendet wird, und zeigt Ihre Entwicklung durch intuitive Level von 1 bis 10.',
      },
      relationToNtrp: {
        title: 'Beziehung zu NTRP',
        content:
          'LPR ist Lightning Pickleball eigenes System, unterschiedlich von USTAs NTRP. Für die Bequemlichkeit der mit NTRP vertrauten Benutzer können Sie bei der Anmeldung Ihr Level in einem ähnlichen Bereich wählen, aber alle offiziellen Level basieren auf LPR.',
      },
    },
    ja: {
      whatIsLtr: {
        title: 'LPRとは？',
        content:
          'LPR（Lightning Pickleball Rating）は、ライトニングテニスコミュニティのために独自に開発されたスキル評価システムです。LPRは、すべての公開マッチ結果に適用されるELOアルゴリズムに基づいて計算され、1から10までの直感的なレベルであなたの成長の旅を示します。',
      },
      relationToNtrp: {
        title: 'NTRPとの関係',
        content:
          'LPRはUSTA NTRPとは異なる、ライトニングテニス独自のシステムです。NTRPに慣れたユーザーの便宜のため、登録時に同様の範囲でレベルを選択できますが、アプリ内で計算・表示されるすべての公式レベルはLPRに基づいています。',
      },
    },
    zh: {
      whatIsLtr: {
        title: '什么是LPR？',
        content:
          'LPR（Lightning Pickleball Rating）是为闪电网球社区独立开发的技能评估系统。LPR基于应用于所有公开比赛结果的ELO算法计算，通过1到10的直观级别展示您的成长历程。',
      },
      relationToNtrp: {
        title: '与NTRP的关系',
        content:
          'LPR是闪电网球自己的系统，与USTA的NTRP不同。为了方便熟悉NTRP的用户，注册时可以选择类似范围的级别，但应用内计算和显示的所有官方级别都基于LPR。',
      },
    },
    pt: {
      whatIsLtr: {
        title: 'O que é LPR?',
        content:
          'LPR (Lightning Pickleball Rating) é um sistema de avaliação de habilidades desenvolvido independentemente para a comunidade Lightning Pickleball. LPR é calculado com base em um algoritmo ELO aplicado a todos os resultados de partidas públicas, mostrando sua jornada de crescimento através de níveis intuitivos de 1 a 10.',
      },
      relationToNtrp: {
        title: 'Relação com NTRP',
        content:
          'LPR é o sistema próprio do Lightning Pickleball, diferente do NTRP da USTA. Para conveniência dos usuários familiarizados com NTRP, você pode selecionar seu nível em uma faixa similar ao se inscrever, mas todos os níveis oficiais são baseados em LPR.',
      },
    },
    it: {
      whatIsLtr: {
        title: "Cos'è LPR?",
        content:
          'LPR (Lightning Pickleball Rating) è un sistema di valutazione delle competenze sviluppato indipendentemente per la comunità Lightning Pickleball. LPR è calcolato sulla base di un algoritmo ELO applicato a tutti i risultati delle partite pubbliche, mostrando il tuo percorso di crescita attraverso livelli intuitivi da 1 a 10.',
      },
      relationToNtrp: {
        title: 'Relazione con NTRP',
        content:
          "LPR è il sistema proprio di Lightning Pickleball, diverso dall'NTRP dell'USTA. Per comodità degli utenti familiari con NTRP, puoi selezionare il tuo livello in un intervallo simile durante la registrazione, ma tutti i livelli ufficiali sono basati su LPR.",
      },
    },
    ru: {
      whatIsLtr: {
        title: 'Что такое LPR?',
        content:
          'LPR (Lightning Pickleball Rating) - это система оценки навыков, независимо разработанная для сообщества Lightning Pickleball. LPR рассчитывается на основе алгоритма ELO, применяемого ко всем результатам публичных матчей, показывая ваш путь роста через интуитивные уровни от 1 до 10.',
      },
      relationToNtrp: {
        title: 'Связь с NTRP',
        content:
          'LPR - это собственная система Lightning Pickleball, отличная от NTRP USTA. Для удобства пользователей, знакомых с NTRP, вы можете выбрать свой уровень в аналогичном диапазоне при регистрации, но все официальные уровни основаны на LPR.',
      },
    },
  };

  return explanations[language] || explanations.en;
}

/**
 * Check if user's self-assessed LPR is significantly higher than calculated LPR
 * Used to show over-estimation warning during onboarding
 *
 * @param selfAssessed - User's self-assessed LPR level
 * @param calculated - Calculated LPR based on assessment answers
 * @returns true if user may be overestimating their skill
 */
export function shouldShowOverEstimationWarning(selfAssessed: number, calculated: number): boolean {
  // Show warning if self-assessed is 2+ levels higher than calculated
  return selfAssessed - calculated >= 2;
}

/**
 * Check if user's self-assessed LPR is significantly lower than calculated LPR
 * Used to show recommendation to consider higher level during onboarding
 *
 * @param selfAssessed - User's self-assessed LPR level
 * @param calculated - Calculated LPR based on assessment answers
 * @returns true if user may be underestimating their skill
 */
export function shouldShowUnderEstimationRecommendation(
  selfAssessed: number,
  calculated: number
): boolean {
  // Show recommendation if calculated is 2+ levels higher than self-assessed
  return calculated - selfAssessed >= 2;
}
