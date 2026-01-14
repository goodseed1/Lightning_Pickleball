/**
 * Onboarding Data Storage Test Functions
 * Functions to test the complete onboarding data flow
 */

/**
 * Create sample onboarding data for testing
 * @param {string} language - Preferred language
 * @returns {Object} Sample onboarding data
 */
export const createSampleOnboardingData = (language = 'en') => {
  const sampleData = {
    // Step 1: Language Selection
    language,
    preferredLanguage: language,
    communicationLanguages: [language, language === 'en' ? 'ko' : 'en'],

    // Step 3: Basic Profile Setup
    nickname: language === 'en' ? 'TennisPlayer123' : '테니스선수123',
    gender: 'male',
    skillLevel: 'intermediate',
    zipCode: '30309',
    playingStyle: ['both_great', 'singles_specialist'],
    activityRegions: [
      language === 'en' ? 'Atlanta Metro' : '애틀랜타 메트로',
      language === 'en' ? 'Midtown' : '미드타운',
    ],
    maxTravelDistance: 25,
    notificationDistance: 15,

    // Step 4: Preferences
    notifications: {
      personalMatches: true,
      clubEvents: true,
      friendRequests: true,
      matchReminders: true,
      notificationDistance: 15,
    },
    privacy: {
      showEmail: false,
      showLocation: true,
      showStats: true,
    },
  };

  console.log('📝 Sample onboarding data created:', sampleData);
  return sampleData;
};

/**
 * Test onboarding data validation
 * @param {Object} authService - Auth service instance
 * @param {Object} onboardingData - Data to test
 */
export const testOnboardingValidation = async onboardingData => {
  try {
    const { validateOnboardingData, transformOnboardingData } = await import('./onboardingUtils');

    console.log('🧪 Testing onboarding data validation...');

    // Transform data
    const transformedData = transformOnboardingData(onboardingData);
    console.log('✅ Data transformation successful:', transformedData);

    // Validate data
    const validation = validateOnboardingData(transformedData);
    console.log('🔍 Validation result:', validation);

    if (validation.isValid) {
      console.log('✅ Onboarding data validation passed');
    } else {
      console.warn('⚠️ Validation errors found:', validation.errors);
    }

    if (validation.warnings.length > 0) {
      console.warn('⚠️ Validation warnings:', validation.warnings);
    }

    return validation;
  } catch (error) {
    console.error('❌ Onboarding validation test failed:', error);
    throw error;
  }
};

/**
 * Test complete onboarding flow with sample data
 * @param {Object} authContext - Auth context with completeOnboarding function
 * @param {string} language - Test language
 */
export const testCompleteOnboardingFlow = async (authContext, language = 'en') => {
  try {
    // Check if user is authenticated
    if (!authContext.isAuthenticated()) {
      throw new Error('User must be authenticated to test onboarding');
    }

    // Create sample data
    const sampleData = createSampleOnboardingData(language);

    // Test validation
    await testOnboardingValidation(sampleData);

    // Complete onboarding
    console.log('💾 Saving onboarding data to Firestore...');
    const updatedProfile = await authContext.completeOnboarding(sampleData);

    console.log('✅ Complete onboarding flow test successful!');
    console.log('📊 Final profile data:', updatedProfile);

    // Verify data was saved correctly
    const verification = verifyOnboardingDataSaved(sampleData, updatedProfile);
    if (verification.success) {
      console.log('✅ Data verification passed');
    } else {
      console.warn('⚠️ Data verification issues:', verification.issues);
    }

    return {
      success: true,
      profile: updatedProfile,
      verification,
    };
  } catch (error) {
    console.error('❌ Complete onboarding flow test failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Verify that onboarding data was saved correctly
 * @param {Object} originalData - Original onboarding data
 * @param {Object} savedProfile - Profile data from Firestore
 * @returns {Object} Verification result
 */
export const verifyOnboardingDataSaved = (originalData, savedProfile) => {
  const issues = [];

  try {
    // Check required fields
    const requiredFields = [
      { original: 'nickname', saved: 'profile.nickname' },
      { original: 'skillLevel', saved: 'profile.skillLevel' },
      { original: 'preferredLanguage', saved: 'profile.preferredLanguage' },
      { original: 'communicationLanguages', saved: 'profile.communicationLanguages' },
    ];

    requiredFields.forEach(({ original, saved }) => {
      const originalValue = getNestedValue(originalData, original);
      const savedValue = getNestedValue(savedProfile, saved);

      if (JSON.stringify(originalValue) !== JSON.stringify(savedValue)) {
        issues.push(
          `Mismatch in ${original}: expected ${JSON.stringify(originalValue)}, got ${JSON.stringify(savedValue)}`
        );
      }
    });

    // Check onboarding completion
    if (!savedProfile?.profile?.onboardingCompleted) {
      issues.push('Onboarding completion flag not set');
    }

    if (!savedProfile?.profile?.onboardingCompletedAt) {
      issues.push('Onboarding completion timestamp not set');
    }

    // Check preferences
    if (!savedProfile?.preferences?.language) {
      issues.push('Language preference not saved');
    }

    if (!savedProfile?.preferences?.notifications) {
      issues.push('Notification preferences not saved');
    }

    return {
      success: issues.length === 0,
      issues,
    };
  } catch (error) {
    return {
      success: false,
      issues: [`Verification failed: ${error.message}`],
    };
  }
};

/**
 * Get nested object value by dot notation
 * @param {Object} obj - Object to search
 * @param {string} path - Dot notation path
 * @returns {any} Value at path
 */
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

/**
 * Log Firestore structure for debugging
 * @param {Object} profile - User profile from Firestore
 */
export const logFirestoreStructure = profile => {
  console.log('📋 Firestore User Profile Structure:');
  console.log('├── Basic Info:', {
    uid: profile?.uid,
    email: profile?.email,
    displayName: profile?.displayName,
    createdAt: profile?.createdAt,
  });
  console.log('├── Profile:', profile?.profile);
  console.log('├── Stats:', profile?.stats);
  console.log('├── Preferences:', profile?.preferences);
  console.log('└── Onboarding Status:', {
    completed: profile?.profile?.onboardingCompleted,
    completedAt: profile?.profile?.onboardingCompletedAt,
  });
};
