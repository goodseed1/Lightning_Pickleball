import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import SafeGooglePlacesAutocomplete, {
  GooglePlaceData,
  GooglePlaceDetail,
} from '../components/common/SafeGooglePlacesAutocomplete';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../hooks/useTheme';
import { getLightningTennisTheme } from '../theme';
import { CreationStackParamList } from '../navigation/CreationNavigator';
import LocationService from '../services/LocationService';

type NavigationProp = NativeStackNavigationProp<CreationStackParamList, 'LocationSearch'>;
type RoutePropType = RouteProp<CreationStackParamList, 'LocationSearch'>;

// 🌍 Map app language codes to Google Places API language codes
// Reference: https://developers.google.com/maps/documentation/places/web-service/place-details
const getGooglePlacesLanguage = (appLanguage: string): string => {
  const languageMap: Record<string, string> = {
    en: 'en', // English
    ko: 'ko', // Korean
    es: 'es', // Spanish
    de: 'de', // German
    fr: 'fr', // French
    it: 'it', // Italian
    ja: 'ja', // Japanese
    pt: 'pt-BR', // Portuguese (Brazil)
    ru: 'ru', // Russian
    zh: 'zh-CN', // Chinese Simplified - important for proper address formatting!
  };
  return languageMap[appLanguage] || 'en';
};

const LocationSearchScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { t, currentLanguage } = useLanguage();
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningTennisTheme(currentTheme);
  const colors = themeColors.colors;

  // 🌍 Get Google Places API language code based on current app language
  const googlePlacesLanguage = getGooglePlacesLanguage(currentLanguage);

  // 🎯 [KIM FIX] Hide React Navigation header - use custom header instead
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // 🎯 작전명 "마스터 키": Place Details API 호출 상태 관리
  const [isLoadingPlaceDetails, setIsLoadingPlaceDetails] = useState(false);

  // Platform-specific Google Places API key
  const googleApiKey =
    Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY_IOS
      : process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY_ANDROID;

  // Debug API key and language loading
  console.log('🔑 Platform:', Platform.OS);
  console.log('🔑 API Key loaded:', googleApiKey ? 'YES' : 'NO');
  console.log('🔑 API Key length:', googleApiKey?.length || 0);
  console.log(
    '🌍 App language:',
    currentLanguage,
    '→ Google Places language:',
    googlePlacesLanguage
  );

  // 🎯 작전명 "마스터 키": placeId를 사용한 완전한 장소 정보 획득
  const handleLocationSelect = async (data: GooglePlaceData, details: GooglePlaceDetail | null) => {
    const placeId = data?.place_id;

    console.log('🎯 작전명 "마스터 키" 시작 - Place ID:', placeId);

    if (!placeId) {
      console.warn('⚠️ No place_id found, falling back to basic location data');
      // Fallback to basic location data
      const locationText = data?.description || data?.structured_formatting?.main_text || '';
      const fallbackLocationData = {
        address: locationText,
        placeId: '',
        coordinates: details?.geometry?.location
          ? {
              lat: details.geometry.location.lat,
              lng: details.geometry.location.lng,
            }
          : null,
        types: details?.types || [],
        formatted_address: details?.formatted_address || data?.description,
      };

      navigateWithLocationData(fallbackLocationData);
      return;
    }

    try {
      setIsLoadingPlaceDetails(true);
      console.log('🔍 Fetching complete place details for place_id:', placeId);

      // 🚀 "마스터 키" 사용: LocationService의 getPlaceDetails로 완전한 정보 획득
      const completeLocationData = await LocationService.createLocationObjectFromPlaceId(placeId);

      if (!completeLocationData) {
        console.warn('⚠️ Failed to get complete place details, falling back to basic data');
        // Fallback to basic autocomplete data
        const locationText = data?.description || data?.structured_formatting?.main_text || '';
        const fallbackLocationData = {
          address: locationText,
          placeId: placeId,
          coordinates: details?.geometry?.location
            ? {
                lat: details.geometry.location.lat,
                lng: details.geometry.location.lng,
              }
            : null,
          types: details?.types || [],
          formatted_address: details?.formatted_address || data?.description,
        };

        navigateWithLocationData(fallbackLocationData);
        return;
      }

      // ✅ "마스터 키" 성공: 완전한 장소 정보 구성
      const enrichedLocationData = {
        // 완전한 장소 정보 (name 필드 포함!)
        name: completeLocationData.formattedAddress.split(',')[0] || completeLocationData.address,
        address: completeLocationData.address,
        formattedAddress: completeLocationData.formattedAddress,
        placeId: completeLocationData.placeId,
        coordinates: {
          lat: completeLocationData.latitude,
          lng: completeLocationData.longitude,
        },
        types: completeLocationData.types,
        city: completeLocationData.city,
        district: completeLocationData.district,
        state: completeLocationData.state,
        country: completeLocationData.country,
      };

      console.log('🎉 작전명 "마스터 키" 성공! 완전한 장소 정보:', {
        name: enrichedLocationData.name,
        address: enrichedLocationData.address,
        placeId: enrichedLocationData.placeId,
        hasName: !!enrichedLocationData.name,
      });

      navigateWithLocationData(enrichedLocationData);
    } catch (error) {
      console.error('🚨 작전명 "마스터 키" 실패:', error);

      // 에러 발생 시 기본 데이터로 fallback
      const locationText = data?.description || data?.structured_formatting?.main_text || '';
      const fallbackLocationData = {
        address: locationText,
        placeId: placeId,
        coordinates: details?.geometry?.location
          ? {
              lat: details.geometry.location.lat,
              lng: details.geometry.location.lng,
            }
          : null,
        types: details?.types || [],
        formatted_address: details?.formatted_address || data?.description,
      };

      navigateWithLocationData(fallbackLocationData);
    } finally {
      setIsLoadingPlaceDetails(false);
    }
  };

  // 네비게이션 로직을 분리하여 재사용성 향상
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigateWithLocationData = (locationData: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const returnScreen = (route.params as any)?.returnScreen || 'CreateEventForm';

    if (returnScreen === 'CreateClub') {
      navigation.navigate('CreateClub', {
        ...route.params,
        selectedLocation: locationData,
      });
    } else if (returnScreen === 'CreateClubEvent') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigation as any).navigate('CreateClubEvent', {
        ...route.params,
        selectedLocation: locationData,
      });
    } else if (returnScreen === 'AdminMeetupConfirmation') {
      console.log('🔙 Returning complete location data to RegularMeetupTab');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigation as any).navigate('ClubDetail', {
        ...route.params,
        selectedMeetupLocation: locationData,
        reopenCreateModal: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        clubId: (route.params as any)?.clubId,
      });
    } else {
      navigation.navigate('CreateEventForm', {
        ...route.params,
        selectedLocation: locationData,
      });
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.onSurface,
      flex: 1,
      textAlign: 'center',
    },
    headerSpacer: {
      width: 40,
    },
    // 🚨 [KIM FIX] Warning banner styles - Dark Glass style
    warningBanner: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outline,
      borderRadius: 12,
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    warningContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    warningIcon: {
      marginRight: 10,
      marginTop: 2,
    },
    warningTextContainer: {
      flex: 1,
    },
    warningTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: '#FFD700', // Gold/Yellow for warning emphasis
      marginBottom: 4,
    },
    warningDescription: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      lineHeight: 18,
    },
    rowContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    rowIcon: {
      marginRight: 12,
    },
    rowTextContainer: {
      flex: 1,
    },
    rowMainText: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.onSurface,
      marginBottom: 2,
    },
    rowSecondaryText: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name='arrow-back' size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('locationSearch.title')}</Text>
        <View style={styles.headerSpacer}>
          {isLoadingPlaceDetails && <ActivityIndicator size='small' color={colors.primary} />}
        </View>
      </View>

      {/* 🚨 [KIM FIX] Warning banner - Address will be publicly visible */}
      <View style={styles.warningBanner}>
        <View style={styles.warningContent}>
          <Ionicons name='warning' size={18} color='#FFD700' style={styles.warningIcon} />
          <View style={styles.warningTextContainer}>
            <Text style={styles.warningTitle}>{t('locationSearch.publicWarning')}</Text>
            <Text style={styles.warningDescription}>{t('locationSearch.avoidHomeAddress')}</Text>
          </View>
        </View>
      </View>

      <SafeGooglePlacesAutocomplete
        placeholder={t('locationSearch.placeholder')}
        onPress={handleLocationSelect}
        query={{
          key: googleApiKey,
          language: googlePlacesLanguage, // 🌍 Dynamic language based on app settings
        }}
        fetchDetails={true}
        enablePoweredByContainer={false}
        debounce={300}
        onFail={error => {
          console.error('🚫 GooglePlacesAutocomplete Error:', error);
        }}
        listViewDisplayed='auto'
        returnKeyType={'search'}
        onTimeout={() => console.log('⏰ Request timeout')}
        timeout={20000}
        minLength={2}
        keepResultsAfterBlur={true}
        styles={{
          container: {
            flex: 1,
          },
          textInputContainer: {
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.outline,
            paddingHorizontal: 16,
            paddingTop: 8,
          },
          textInput: {
            fontSize: 16,
            color: colors.onSurface,
            backgroundColor: colors.surfaceVariant,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginTop: 0,
          },
          listView: {
            backgroundColor: colors.surface,
          },
          row: {
            backgroundColor: colors.surface,
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: colors.outline,
          },
          description: {
            fontSize: 15,
            color: colors.onSurface,
          },
          predefinedPlacesDescription: {
            color: colors.primary,
          },
          loader: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            height: 20,
            marginRight: 16,
          },
          separator: {
            height: 0,
          },
        }}
        textInputProps={{
          placeholderTextColor: colors.onSurfaceVariant,
          autoFocus: true,
          returnKeyType: 'search',
        }}
        renderRow={data => (
          <View style={styles.rowContainer}>
            <Ionicons
              name='location-outline'
              size={20}
              color={colors.onSurfaceVariant}
              style={styles.rowIcon}
            />
            <View style={styles.rowTextContainer}>
              <Text style={styles.rowMainText}>
                {data.structured_formatting?.main_text || data.description?.split(',')[0]}
              </Text>
              <Text style={styles.rowSecondaryText}>
                {data.structured_formatting?.secondary_text ||
                  data.description?.split(',').slice(1).join(',')}
              </Text>
            </View>
          </View>
        )}
        renderDescription={row => row.description || row.structured_formatting?.main_text}
        // 🔒 [KIM FIX] Removed "Use Current Location" for privacy protection
        nearbyPlacesAPI='GooglePlacesSearch'
        keyboardShouldPersistTaps='handled'
      />
    </SafeAreaView>
  );
};

export default LocationSearchScreen;
