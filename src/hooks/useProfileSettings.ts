import { useState, useEffect, useCallback } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../hooks/useTheme';
import LocationService from '../services/LocationService';
import authService from '../services/authService';
import { RootStackParamList } from '../navigation/AppNavigator';

interface LocationPermissionInfo {
  icon: string;
  iconColor: string;
  statusText: string;
  descriptionText: string;
}

interface UseProfileSettingsReturn {
  // 🆕 Category notification master toggles
  chatCategoryNotifications: boolean;
  inviteCategoryNotifications: boolean;
  competitionCategoryNotifications: boolean;
  clubCategoryNotifications: boolean;
  achievementCategoryNotifications: boolean;
  setChatCategoryNotifications: (value: boolean) => void;
  setInviteCategoryNotifications: (value: boolean) => void;
  setCompetitionCategoryNotifications: (value: boolean) => void;
  setClubCategoryNotifications: (value: boolean) => void;
  setAchievementCategoryNotifications: (value: boolean) => void;
  refreshNotificationSettings: () => Promise<void>; // 🔄 Refresh for bi-directional sync

  // Legacy notification settings (for backward compatibility)
  lightningMatchNotifications: boolean;
  chatNotifications: boolean;
  setLightningMatchNotifications: (value: boolean) => void;
  setChatNotifications: (value: boolean) => void;

  // Location permission
  locationPermissionStatus: string;
  getLocationPermissionInfo: () => LocationPermissionInfo;
  handleLocationPermissionPress: () => Promise<void>;

  // Location update
  isUpdatingLocation: boolean;
  locationUpdateProgress: string;
  cancelLocationUpdate: () => void;

  // Theme settings
  getCurrentThemeText: () => string;
  handleThemeSettings: () => void;

  // Profile actions
  handleEditProfile: () => void;
  handleUpdateLocation: () => Promise<void>;

  // App settings
  handleLanguageSettings: () => void;
  handlePrivacySettings: () => void;
  handleTeamInvitations: () => void; // 🏛️ TEAM-FIRST 2.0: Navigate to team invitations
  handleLogout: () => void;
  handleDeleteAccount: () => void; // 🗑️ Delete account action
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const useProfileSettings = (): UseProfileSettingsReturn => {
  const navigation = useNavigation<NavigationProp>();
  const { signOut, updateUserProfile, currentUser } = useAuth();
  const { t } = useLanguage();
  const { themePreference, setThemePreference } = useTheme();

  // 🆕 Category notification master toggle states (synced with Firestore)
  const [chatCategoryNotifications, setChatCategoryNotificationsState] = useState(true);
  const [inviteCategoryNotifications, setInviteCategoryNotificationsState] = useState(true);
  const [competitionCategoryNotifications, setCompetitionCategoryNotificationsState] =
    useState(true);
  const [clubCategoryNotifications, setClubCategoryNotificationsState] = useState(true);
  const [achievementCategoryNotifications, setAchievementCategoryNotificationsState] =
    useState(true);

  // Legacy notification settings states
  const [lightningMatchNotifications, setLightningMatchNotifications] = useState(true);
  const [chatNotifications, setChatNotifications] = useState(true);

  // Location permission state
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<string>('checking');

  // Location update states
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [locationUpdateProgress, setLocationUpdateProgress] = useState('');
  const [locationUpdateAbortController, setLocationUpdateAbortController] =
    useState<AbortController | null>(null);

  // Cancel location update function
  const cancelLocationUpdate = () => {
    if (locationUpdateAbortController) {
      locationUpdateAbortController.abort();
      setLocationUpdateAbortController(null);
    }
    setIsUpdatingLocation(false);
    setLocationUpdateProgress('');
  };

  // Check location permission status on mount
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const status = await LocationService.getLocationPermissionStatus();
        setLocationPermissionStatus(status);
      } catch (error) {
        console.error('Error checking location permission:', error);
        setLocationPermissionStatus('denied');
      }
    };
    checkPermission();
  }, []);

  // 🆕 Load notification settings from Firestore (extracted as useCallback for refresh)
  const refreshNotificationSettings = useCallback(async () => {
    if (!currentUser?.uid) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const settings = userSnap.data()?.notificationSettings || {};

        // Load category master toggles (default: true)
        setChatCategoryNotificationsState(settings.chatCategoryEnabled !== false);
        setInviteCategoryNotificationsState(settings.inviteCategoryEnabled !== false);
        setCompetitionCategoryNotificationsState(settings.competitionCategoryEnabled !== false);
        setClubCategoryNotificationsState(settings.clubCategoryEnabled !== false);
        setAchievementCategoryNotificationsState(settings.achievementCategoryEnabled !== false);

        // Load legacy settings
        setLightningMatchNotifications(settings.lightningMatchNotifications !== false);
        setChatNotifications(settings.chatNotifications !== false);
      }
    } catch (error) {
      console.error('🔔 Error loading notification settings:', error);
    }
  }, [currentUser?.uid]);

  // 🔄 Load notification settings on mount
  useEffect(() => {
    refreshNotificationSettings();
  }, [refreshNotificationSettings]);

  // 🆕 Helper to update category notification in Firestore
  const updateCategoryNotification = useCallback(
    async (key: string, value: boolean) => {
      if (!currentUser?.uid) return;

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          [`notificationSettings.${key}`]: value,
        });
        console.log(`🔔 Updated ${key} to ${value}`);
      } catch (error) {
        console.error(`🔔 Error updating ${key}:`, error);
        throw error;
      }
    },
    [currentUser?.uid]
  );

  // 🆕 Category notification setters with Firestore sync
  const setChatCategoryNotifications = useCallback(
    async (value: boolean) => {
      setChatCategoryNotificationsState(value);
      await updateCategoryNotification('chatCategoryEnabled', value);
    },
    [updateCategoryNotification]
  );

  const setInviteCategoryNotifications = useCallback(
    async (value: boolean) => {
      setInviteCategoryNotificationsState(value);
      await updateCategoryNotification('inviteCategoryEnabled', value);
    },
    [updateCategoryNotification]
  );

  const setCompetitionCategoryNotifications = useCallback(
    async (value: boolean) => {
      setCompetitionCategoryNotificationsState(value);
      await updateCategoryNotification('competitionCategoryEnabled', value);
    },
    [updateCategoryNotification]
  );

  const setClubCategoryNotifications = useCallback(
    async (value: boolean) => {
      setClubCategoryNotificationsState(value);
      await updateCategoryNotification('clubCategoryEnabled', value);
    },
    [updateCategoryNotification]
  );

  const setAchievementCategoryNotifications = useCallback(
    async (value: boolean) => {
      setAchievementCategoryNotificationsState(value);
      await updateCategoryNotification('achievementCategoryEnabled', value);
    },
    [updateCategoryNotification]
  );

  // Location permission info based on current status
  const getLocationPermissionInfo = (): LocationPermissionInfo => {
    switch (locationPermissionStatus) {
      case 'granted':
        return {
          icon: 'checkmark-circle-outline',
          iconColor: '#4caf50',
          statusText: t('profileSettings.location.permission.granted'),
          descriptionText: t('profileSettings.location.permission.grantedDescription'),
        };
      case 'denied':
        return {
          icon: 'close-circle-outline',
          iconColor: '#f44336',
          statusText: t('profileSettings.location.permission.denied'),
          descriptionText: t('profileSettings.location.permission.deniedDescription'),
        };
      case 'undetermined':
        return {
          icon: 'help-circle-outline',
          iconColor: '#ff9800',
          statusText: t('profileSettings.location.permission.undetermined'),
          descriptionText: t('profileSettings.location.permission.undeterminedDescription'),
        };
      default:
        return {
          icon: 'time-outline',
          iconColor: '#9e9e9e',
          statusText: t('profileSettings.location.permission.checking'),
          descriptionText: t('profileSettings.location.permission.checkingDescription'),
        };
    }
  };

  // Location permission handler
  const handleLocationPermissionPress = async () => {
    try {
      const status = await LocationService.getLocationPermissionStatus();

      if (status === 'granted') {
        Alert.alert(
          t('profileSettings.location.alerts.permissionGrantedTitle'),
          t('profileSettings.location.alerts.permissionGrantedMessage'),
          [{ text: t('common.ok') }]
        );
      } else {
        Alert.alert(
          t('profileSettings.location.alerts.permissionTitle'),
          t('profileSettings.location.alerts.permissionMessage'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('profileSettings.location.alerts.openSettings'),
              onPress: () => {
                Linking.openSettings();
                // Re-check status after returning from settings
                setTimeout(async () => {
                  try {
                    const status = await LocationService.getLocationPermissionStatus();
                    setLocationPermissionStatus(status);
                  } catch (error) {
                    console.error('Error checking location permission:', error);
                  }
                }, 1000);
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error handling location permission:', error);
      Alert.alert(
        t('profileSettings.location.alerts.errorTitle'),
        t('profileSettings.location.alerts.errorMessage'),
        [{ text: t('common.ok') }]
      );
    }
  };

  // Get current theme display text
  const getCurrentThemeText = () => {
    switch (themePreference) {
      case 'light':
        return t('profileSettings.theme.lightMode');
      case 'dark':
        return t('profileSettings.theme.darkMode');
      case 'system':
        return t('profileSettings.theme.followSystem');
      default:
        return t('profileSettings.theme.followSystem');
    }
  };

  // Theme selection handler
  const handleThemeSettings = () => {
    const themeOptions = [
      {
        key: 'light' as const,
        title: t('profileSettings.theme.lightMode'),
        subtitle: t('profileSettings.theme.lightModeSubtitle'),
      },
      {
        key: 'dark' as const,
        title: t('profileSettings.theme.darkMode'),
        subtitle: t('profileSettings.theme.darkModeSubtitle'),
      },
      {
        key: 'system' as const,
        title: t('profileSettings.theme.followSystem'),
        subtitle: t('profileSettings.theme.followSystemSubtitle'),
      },
    ];

    const buttons: { text: string; onPress: () => void; style?: 'cancel' | 'destructive' | 'default' }[] = themeOptions.map(option => ({
      text: `${themePreference === option.key ? '✓ ' : ''}${option.title}`,
      onPress: () => {
        setThemePreference(option.key);
      },
    }));

    buttons.push({
      text: t('common.cancel'),
      onPress: () => {},
      style: 'cancel',
    });

    Alert.alert(
      t('profileSettings.theme.settingsTitle'),
      t('profileSettings.theme.settingsMessage'),
      buttons
    );
  };

  // Profile editing handler
  const handleEditProfile = () => {
    navigation.navigate('EditProfileScreen');
  };

  // Optimized location update handler with progressive updates
  const handleUpdateLocation = async () => {
    if (isUpdatingLocation) {
      console.log('📍 Location update already in progress, ignoring request');
      return;
    }

    const abortController = new AbortController();
    setLocationUpdateAbortController(abortController);
    setIsUpdatingLocation(true);

    try {
      // Step 1: Check location permission
      setLocationUpdateProgress(t('profileSettings.location.update.checkingPermission'));

      const permissionStatus = await LocationService.getLocationPermissionStatus();

      if (permissionStatus !== 'granted') {
        setIsUpdatingLocation(false);
        setLocationUpdateAbortController(null);
        setLocationUpdateProgress('');

        Alert.alert(
          t('profileSettings.location.update.permissionRequiredTitle'),
          t('profileSettings.location.update.permissionRequiredMessage'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('profileSettings.location.alerts.openSettings'),
              onPress: () => Linking.openSettings(),
            },
          ]
        );
        return;
      }

      if (abortController.signal.aborted) return;

      // Step 2: Get current location with timeout
      // 🎯 [KIM FIX] forceRefresh=true로 항상 새 GPS 위치 요청 (캐시 무시)
      setLocationUpdateProgress(t('profileSettings.location.update.gettingLocation'));

      let currentLocation;
      try {
        currentLocation = await Promise.race([
          LocationService.getCurrentLocationFast(true), // forceRefresh=true: 캐시 무시하고 새 GPS 요청
          new Promise<null>((_, reject) => {
            setTimeout(() => reject(new Error('Location timeout')), 12000);
          }),
        ]);
      } catch (error) {
        console.log('📍 Fast location failed, trying accurate location:', error);
        // Try to get accurate location as fallback (also bypasses cache)
        currentLocation = await LocationService.getCurrentLocation();
      }

      if (!currentLocation || abortController.signal.aborted) {
        throw new Error('Unable to get location');
      }

      // Step 3: Save location immediately with coordinates only
      setLocationUpdateProgress(t('profileSettings.location.update.savingLocation'));

      const preliminaryLocation = LocationService.createLocationObject(
        currentLocation.latitude,
        currentLocation.longitude
      );

      await updateUserProfile({
        profile: { location: preliminaryLocation },
      });

      if (abortController.signal.aborted) return;

      // Step 4: Get address info asynchronously
      setLocationUpdateProgress(t('profileSettings.location.update.gettingAddress'));

      try {
        const addressInfo = await Promise.race([
          LocationService.reverseGeocode(currentLocation.latitude, currentLocation.longitude),
          new Promise<null>((_, reject) => {
            setTimeout(() => reject(new Error('Geocoding timeout')), 10000);
          }),
        ]);

        if (addressInfo && !abortController.signal.aborted) {
          // Step 5: Update with full address info
          const fullLocation = LocationService.createLocationObject(
            currentLocation.latitude,
            currentLocation.longitude,
            addressInfo
          );

          await updateUserProfile({
            profile: { location: fullLocation },
          });

          // Success with full address
          setIsUpdatingLocation(false);
          setLocationUpdateAbortController(null);
          setLocationUpdateProgress('');

          Alert.alert(
            t('profileSettings.location.update.successTitle'),
            t('profileSettings.location.update.successMessage', {
              city:
                addressInfo.city ||
                t('profileSettings.location.update.successMessage').split(':')[0],
            }),
            [{ text: t('common.ok') }]
          );
        } else {
          throw new Error('No address info');
        }
      } catch (addressError) {
        // Fallback: Success with coordinates only
        console.log('Address lookup failed, using coordinates only:', addressError);

        setIsUpdatingLocation(false);
        setLocationUpdateAbortController(null);
        setLocationUpdateProgress('');

        Alert.alert(
          t('profileSettings.location.update.partialSuccessTitle'),
          t('profileSettings.location.update.partialSuccessMessage'),
          [{ text: t('common.ok') }]
        );
      }
    } catch (error) {
      console.error('Error updating location:', error);

      setIsUpdatingLocation(false);
      setLocationUpdateAbortController(null);
      setLocationUpdateProgress('');

      if (!abortController.signal.aborted) {
        Alert.alert(
          t('profileSettings.location.update.errorTitle'),
          t('profileSettings.location.update.errorMessage'),
          [{ text: t('common.ok') }]
        );
      }
    }
  };

  // Language settings handler
  const handleLanguageSettings = () => {
    navigation.navigate('LanguageSelectionScreen');
  };

  // Privacy settings handler
  const handlePrivacySettings = () => {
    Alert.alert(t('profileSettings.privacy.title'), t('profileSettings.privacy.message'), [
      {
        text: t('common.ok'),
        onPress: () => {
          Alert.alert(
            t('profileSettings.privacy.comingSoonTitle'),
            t('profileSettings.privacy.comingSoonMessage')
          );
        },
      },
    ]);
  };

  // 🏛️ TEAM-FIRST 2.0: Team invitations handler
  const handleTeamInvitations = () => {
    navigation.navigate('TeamInvitations');
  };

  // Logout handler
  const handleLogout = async () => {
    Alert.alert(t('profileSettings.logout.title'), t('profileSettings.logout.message'), [
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
      {
        text: t('profileSettings.logout.confirm'),
        style: 'destructive',
        onPress: () => signOut(),
      },
    ]);
  };

  // 🗑️ Delete account handler - Requires nickname confirmation
  const handleDeleteAccount = async () => {
    // 🔧 [KIM FIX] Get displayName for UI hint only - Cloud Function does the real validation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userNickname = (currentUser as any)?.nickname || currentUser?.displayName || '';

    // Helper function to execute the actual deletion
    // 🔧 [KIM FIX] Accept inputNickname parameter - send user's input directly to Cloud Function
    const executeAccountDeletion = async (inputNickname: string) => {
      try {
        // Pass user's input to Cloud Function - CF will validate against Firestore
        await authService.deleteUserAccount(inputNickname);
        // User will be automatically signed out
        Alert.alert(
          t('profileSettings.deleteAccount.completeTitle'),
          t('profileSettings.deleteAccount.completeMessage')
        );
      } catch (error) {
        // Log errors as warnings (not errors) to avoid red toast
        console.warn('⚠️ Account deletion encountered an issue:', error);
        Alert.alert(
          t('profileSettings.deleteAccount.noticeTitle'),
          t('profileSettings.deleteAccount.noticeMessage')
        );
      }
    };

    // Initial warning
    Alert.alert(
      t('profileSettings.deleteAccount.title'),
      t('profileSettings.deleteAccount.warningMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            // iOS: Use Alert.prompt to require nickname input
            if (Platform.OS === 'ios') {
              Alert.prompt(
                t('profileSettings.deleteAccount.confirmNicknameTitle'),
                t('profileSettings.deleteAccount.confirmNicknameMessage', {
                  nickname: userNickname,
                }),
                [
                  {
                    text: t('common.cancel'),
                    style: 'cancel',
                  },
                  {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: (inputText?: string) => {
                      // 🔧 [KIM FIX] Send user's input directly to Cloud Function
                      // Cloud Function will validate against Firestore data
                      if (inputText && inputText.trim()) {
                        executeAccountDeletion(inputText.trim());
                      } else {
                        Alert.alert(
                          t('profileSettings.deleteAccount.nicknameRequiredTitle'),
                          t('profileSettings.deleteAccount.nicknameRequiredMessage')
                        );
                      }
                    },
                  },
                ],
                'plain-text',
                '',
                'default'
              );
            } else {
              // Android: Show confirmation with nickname displayed
              // Alert.prompt is not available on Android, so we use a simpler confirmation
              // 🔧 [KIM FIX] Android uses userNickname since there's no prompt
              // TODO: Consider using a custom Modal with TextInput for Android
              Alert.alert(
                t('profileSettings.deleteAccount.finalConfirmationTitle'),
                t('profileSettings.deleteAccount.finalConfirmationMessage', {
                  nickname: userNickname,
                }),
                [
                  {
                    text: t('common.cancel'),
                    style: 'cancel',
                  },
                  {
                    text: t('profileSettings.deleteAccount.deleteButton'),
                    style: 'destructive',
                    onPress: () => executeAccountDeletion(userNickname),
                  },
                ]
              );
            }
          },
        },
      ]
    );
  };

  return {
    // 🆕 Category notification master toggles
    chatCategoryNotifications,
    inviteCategoryNotifications,
    competitionCategoryNotifications,
    clubCategoryNotifications,
    achievementCategoryNotifications,
    setChatCategoryNotifications,
    setInviteCategoryNotifications,
    setCompetitionCategoryNotifications,
    setClubCategoryNotifications,
    setAchievementCategoryNotifications,
    refreshNotificationSettings, // 🔄 For bi-directional sync with NotificationSettingsScreen

    // Legacy notification settings
    lightningMatchNotifications,
    chatNotifications,
    setLightningMatchNotifications,
    setChatNotifications,

    // Location permission
    locationPermissionStatus,
    getLocationPermissionInfo,
    handleLocationPermissionPress,

    // Location update
    isUpdatingLocation,
    locationUpdateProgress,
    cancelLocationUpdate,

    // Theme settings
    getCurrentThemeText,
    handleThemeSettings,

    // Profile actions
    handleEditProfile,
    handleUpdateLocation,

    // App settings
    handleLanguageSettings,
    handlePrivacySettings,
    handleTeamInvitations,
    handleLogout,
    handleDeleteAccount,
  };
};

export default useProfileSettings;
