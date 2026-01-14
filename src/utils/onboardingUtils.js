/**
 * Onboarding Utility Functions
 * Helper functions for processing and validating onboarding data
 */

/**
 * Transform onboarding data to match Firestore user profile structure
 * @param {Object} onboardingData - Raw onboarding data from UI
 * @returns {Object} Structured data ready for Firestore
 */
export const transformOnboardingData = onboardingData => {
  const {
    // Language settings
    language,
    preferredLanguage,
    communicationLanguages,

    // Basic information
    nickname,
    gender,
    zipCode,

    // Pickleball specific
    skillLevel,
    playingStyle,
    activityRegions,
    maxTravelDistance,
    notificationDistance,

    // Preferences
    notifications,
    privacy,

    // Nested profile (alternative format)
    profile = {},
  } = onboardingData;

  return {
    // Language settings
    language: language || preferredLanguage || 'en',
    preferredLanguage: language || preferredLanguage || 'en',
    communicationLanguages: communicationLanguages || [language || preferredLanguage || 'en'],

    // Basic information
    nickname: nickname || profile.nickname || '',
    gender: gender || profile.gender || '',
    zipCode: zipCode || profile.zipCode || '',

    // Pickleball specific
    skillLevel: skillLevel || profile.skillLevel || 'beginner',
    playingStyle: playingStyle || profile.playingStyle || [],
    activityRegions: activityRegions || profile.activityRegions || [],
    maxTravelDistance: maxTravelDistance || profile.maxTravelDistance || 20,
    notificationDistance: notificationDistance || profile.notificationDistance || 10,

    // Preferences
    notifications: {
      personalMatches: notifications?.personalMatches !== false,
      clubEvents: notifications?.clubEvents !== false,
      friendRequests: notifications?.friendRequests !== false,
      matchReminders: notifications?.matchReminders !== false,
      notificationDistance: notificationDistance || profile.notificationDistance || 10,
    },

    privacy: {
      showEmail: privacy?.showEmail || false,
      showLocation: privacy?.showLocation !== false,
      showStats: privacy?.showStats !== false,
    },
  };
};

/**
 * Validate onboarding data before saving
 * @param {Object} data - Onboarding data to validate
 * @returns {Object} Validation result with success flag and errors
 */
export const validateOnboardingData = data => {
  const errors = [];
  const warnings = [];

  // Required fields validation
  if (!data.nickname || data.nickname.trim().length < 2) {
    errors.push('Nickname must be at least 2 characters long');
  }

  if (data.nickname && data.nickname.length > 20) {
    errors.push('Nickname must be less than 20 characters');
  }

  if (
    !data.skillLevel ||
    !['beginner', 'intermediate', 'advanced', 'expert'].includes(data.skillLevel)
  ) {
    errors.push('Valid skill level is required');
  }

  if (!data.language || !['en', 'ko'].includes(data.language)) {
    errors.push('Language selection is required');
  }

  // Optional fields validation
  if (data.zipCode && !/^\d{5}(-\d{4})?$/.test(data.zipCode)) {
    warnings.push('ZIP code format should be 5 digits (e.g., 30309 or 30309-1234)');
  }

  if (
    data.notificationDistance &&
    (data.notificationDistance < 1 || data.notificationDistance > 100)
  ) {
    warnings.push('Notification distance should be between 1-100 miles');
  }

  if (data.maxTravelDistance && (data.maxTravelDistance < 1 || data.maxTravelDistance > 200)) {
    warnings.push('Max travel distance should be between 1-200 miles');
  }

  // Array fields validation
  if (data.playingStyle && !Array.isArray(data.playingStyle)) {
    errors.push('Playing style must be an array');
  }

  if (data.activityRegions && !Array.isArray(data.activityRegions)) {
    errors.push('Activity regions must be an array');
  }

  if (data.communicationLanguages && !Array.isArray(data.communicationLanguages)) {
    errors.push('Communication languages must be an array');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Get default onboarding data structure
 * @param {string} language - User's preferred language
 * @returns {Object} Default onboarding data
 */
export const getDefaultOnboardingData = (language = 'en') => {
  return {
    language,
    preferredLanguage: language,
    communicationLanguages: [language],
    nickname: '',
    gender: '',
    zipCode: '',
    skillLevel: 'beginner',
    playingStyle: ['both_great'],
    activityRegions: [],
    maxTravelDistance: 20,
    notificationDistance: 10,
    notifications: {
      personalMatches: true,
      clubEvents: true,
      friendRequests: true,
      matchReminders: true,
      notificationDistance: 10,
    },
    privacy: {
      showEmail: false,
      showLocation: true,
      showStats: true,
    },
  };
};

/**
 * Format skill level for display
 * @param {string} skillLevel - Skill level code
 * @param {string} language - Display language
 * @returns {string} Formatted skill level
 */
export const formatSkillLevel = (skillLevel, language = 'en') => {
  const skillLevels = {
    en: {
      beginner: 'Beginner (1.0-2.5)',
      intermediate: 'Intermediate (3.0-3.5)',
      advanced: 'Advanced (4.0-4.5)',
      expert: 'Expert (5.0+)',
    },
    ko: {
      beginner: '초급 (1.0-2.5)',
      intermediate: '중급 (3.0-3.5)',
      advanced: '고급 (4.0-4.5)',
      expert: '전문가 (5.0+)',
    },
  };

  return skillLevels[language]?.[skillLevel] || skillLevel;
};

/**
 * Format playing style for display
 * @param {Array} playingStyles - Array of playing style codes
 * @param {string} language - Display language
 * @returns {Array} Formatted playing styles
 */
export const formatPlayingStyles = (playingStyles, language = 'en') => {
  const styles = {
    en: {
      rally_focused: 'Rally-focused practice',
      game_preference: 'Game/Match preference',
      both_great: 'Both are great',
      singles_specialist: 'Singles specialist',
      doubles_specialist: 'Doubles specialist',
      aggressive_baseline: 'Aggressive baseline',
      serve_and_volley: 'Serve and volley',
      all_court: 'All-court player',
    },
    ko: {
      rally_focused: '랠리 중심 연습',
      game_preference: '게임/매치 선호',
      both_great: '둘 다 좋음',
      singles_specialist: '단식 전문',
      doubles_specialist: '복식 전문',
      aggressive_baseline: '공격적 베이스라인',
      serve_and_volley: '서브 앤 발리',
      all_court: '올코트 플레이어',
    },
  };

  if (!Array.isArray(playingStyles)) return [];

  return playingStyles.map(style => styles[language]?.[style] || style);
};

/**
 * Check if onboarding data is complete
 * @param {Object} data - Onboarding data
 * @returns {boolean} Whether onboarding is complete
 */
export const isOnboardingComplete = data => {
  const requiredFields = ['language', 'nickname', 'skillLevel'];

  return requiredFields.every(field => {
    const value = data[field] || data.profile?.[field];
    return value && value.toString().trim().length > 0;
  });
};

/**
 * Get onboarding completion percentage
 * @param {Object} data - Onboarding data
 * @returns {number} Completion percentage (0-100)
 */
export const getOnboardingProgress = data => {
  const fields = [
    'language',
    'nickname',
    'skillLevel',
    'gender',
    'zipCode',
    'playingStyle',
    'activityRegions',
  ];

  const completedFields = fields.filter(field => {
    const value = data[field] || data.profile?.[field];
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value && value.toString().trim().length > 0;
  });

  return Math.round((completedFields.length / fields.length) * 100);
};
