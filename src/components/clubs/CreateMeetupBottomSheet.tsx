/**
 * CreateMeetupBottomSheet.tsx
 * 🎯 간단한 정기 모임 생성 바텀시트
 *
 * 필수 입력: 날짜, 시간, 장소, 코트 수
 * 기존 CreateMeetupScreen (1,800줄)을 대체하는 간소화된 버전 (~300줄)
 *
 * 🎯 [KIM] 장소 선택 기능:
 * - 클럽 홈코트 (기본값): 클럽 설정에서 불러온 주소 사용
 * - 다른 장소: Google Places API로 실시간 검색
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  Alert,
  ScrollView,
  LogBox,
} from 'react-native';

// 🎯 [KIM] Suppress VirtualizedList nesting warning
// This is a known React Native issue with GooglePlacesAutocomplete's internal FlatList
// inside a ScrollView. The warning doesn't cause crashes - it's a performance advisory.
LogBox.ignoreLogs(['VirtualizedLists should never be nested inside plain ScrollViews']);
import {
  Modal,
  Portal,
  Text,
  Button,
  IconButton,
  Surface,
  TextInput,
  RadioButton,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import meetupService from '../../services/meetupService';
import SafeGooglePlacesAutocomplete, {
  GooglePlaceData,
  GooglePlaceDetail,
} from '../common/SafeGooglePlacesAutocomplete';
import LocationService from '../../services/LocationService';

// Types
interface MeetupLocation {
  name: string;
  address: string;
  coordinates?: { lat: number; lng: number };
  placeId?: string;
}

// 🎯 [KIM] Club home address from Firestore (profile.courtAddress)
interface ClubHomeAddress {
  name: string;
  address: string;
  coordinates?: { lat: number; lng: number };
  placeId?: string;
}

// Location mode: 'home' = 클럽 홈코트, 'other' = 다른 장소
type LocationMode = 'home' | 'other';

// 🎯 [KIM] Initial meetup data for edit mode
interface InitialMeetupData {
  dateTime: Date;
  location: MeetupLocation;
  courtCount: number;
  courtNumbers?: string;
}

interface CreateMeetupBottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  clubId: string;
  defaultLocation?: MeetupLocation;
  clubHomeAddress?: ClubHomeAddress; // 🎯 [KIM] Club's home court address from settings
  defaultTime?: string; // "19:30" format
  defaultDayOfWeek?: number; // 0-6 (Sunday-Saturday)
  onSuccess?: () => void;
  // 🎯 [KIM] Edit mode props
  mode?: 'create' | 'edit';
  meetupId?: string;
  initialMeetup?: InitialMeetupData;
}

const CreateMeetupBottomSheet: React.FC<CreateMeetupBottomSheetProps> = ({
  visible,
  onDismiss,
  clubId,
  defaultLocation,
  clubHomeAddress,
  defaultTime = '19:30',
  defaultDayOfWeek,
  onSuccess,
  // 🎯 [KIM] Edit mode props
  mode = 'create',
  meetupId,
  initialMeetup,
}) => {
  const { paperTheme: theme } = useTheme();
  const { t } = useLanguage();
  const { currentUser } = useAuth();

  // State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [courtCount, setCourtCount] = useState(4);
  const [courtNumbers, setCourtNumbers] = useState(''); // 🎯 Court numbers input
  const [location, setLocation] = useState<MeetupLocation>({
    name: defaultLocation?.name || '',
    address: defaultLocation?.address || '',
    coordinates: defaultLocation?.coordinates,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🎯 [KIM] Location mode state: 'home' = 클럽 홈코트, 'other' = 다른 장소
  const [locationMode, setLocationMode] = useState<LocationMode>('home');
  const [isLoadingPlaceDetails, setIsLoadingPlaceDetails] = useState(false);
  const [showLocationSearch, setShowLocationSearch] = useState(false);

  // 🎯 [KIM FIX] Track if initialization has been done for current modal session
  // This prevents re-initialization when parent re-renders and clubHomeAddress reference changes
  const hasInitialized = useRef(false);

  // Initialize date with club's default schedule or edit mode data
  useEffect(() => {
    if (visible) {
      // 🎯 [KIM FIX] Only initialize once per modal session
      if (hasInitialized.current) {
        return;
      }
      hasInitialized.current = true;
      // 🎯 [KIM] Edit mode: Initialize with existing meetup data
      if (mode === 'edit' && initialMeetup) {
        console.log('🗓️ [BottomSheet] Edit mode - Initializing with existing meetup:', {
          dateTime: initialMeetup.dateTime,
          location: initialMeetup.location?.name,
          courtCount: initialMeetup.courtCount,
        });

        setSelectedDate(initialMeetup.dateTime);
        setCourtCount(initialMeetup.courtCount || 4);
        setCourtNumbers(initialMeetup.courtNumbers || '');

        if (initialMeetup.location) {
          setLocation(initialMeetup.location);
          // Determine location mode based on location data
          setLocationMode(initialMeetup.location.placeId ? 'other' : 'home');
        }
        setShowLocationSearch(false);
        return;
      }

      // 🎯 [KIM] Create mode: Initialize with default schedule
      console.log('🗓️ [BottomSheet] Create mode - Initializing with defaults:', {
        defaultDayOfWeek,
        defaultTime,
        defaultLocation: defaultLocation?.name,
        clubHomeAddress: clubHomeAddress?.name,
      });

      const now = new Date();
      const currentTime = new Date(); // Keep original time for comparison

      // Set time from defaultTime
      if (defaultTime) {
        const [hours, minutes] = defaultTime.split(':').map(Number);
        now.setHours(hours, minutes, 0, 0);
        console.log('🗓️ [BottomSheet] Set time to:', hours, ':', minutes);
      }

      // Find next occurrence of defaultDayOfWeek
      if (defaultDayOfWeek !== undefined && typeof defaultDayOfWeek === 'number') {
        const currentDay = now.getDay();
        let daysUntilNext = (defaultDayOfWeek - currentDay + 7) % 7;

        console.log('🗓️ [BottomSheet] Day calculation:', {
          defaultDayOfWeek,
          currentDay,
          daysUntilNext,
          nowTime: now.getTime(),
          currentTimeNow: currentTime.getTime(),
        });

        // If it's the same day but time has passed, go to next week
        if (daysUntilNext === 0 && now.getTime() < currentTime.getTime()) {
          daysUntilNext = 7;
          console.log('🗓️ [BottomSheet] Same day but time passed, adding 7 days');
        }

        now.setDate(now.getDate() + daysUntilNext);
        console.log('🗓️ [BottomSheet] Final date:', now.toISOString());
      } else {
        console.log('🗓️ [BottomSheet] No defaultDayOfWeek provided, using current date');
      }

      setSelectedDate(now);

      // 🎯 [KIM] Initialize location with club home address if available
      if (clubHomeAddress) {
        setLocation({
          name: clubHomeAddress.name || t('createMeetupBottomSheet.clubHomeCourt'),
          address: clubHomeAddress.address || '',
          coordinates: clubHomeAddress.coordinates,
          placeId: clubHomeAddress.placeId,
        });
        setLocationMode('home');
      } else if (defaultLocation) {
        setLocation({
          name: defaultLocation.name || t('createMeetupBottomSheet.clubHomeCourt'),
          address: defaultLocation.address || '',
          coordinates: defaultLocation.coordinates,
        });
        setLocationMode('home');
      }

      // Reset Google Places search state
      setShowLocationSearch(false);
    } else {
      // 🎯 [KIM FIX] Reset initialization flag when modal closes
      // This allows re-initialization when modal opens again
      hasInitialized.current = false;
    }
  }, [
    visible,
    defaultTime,
    defaultDayOfWeek,
    defaultLocation,
    clubHomeAddress,
    t,
    mode,
    initialMeetup,
  ]);

  // Format date for display
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    };
    return date.toLocaleDateString(t('common.locale'), options);
  };

  // Format time for display
  const formatTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };
    return date.toLocaleTimeString(t('common.locale'), options);
  };

  // Handle date change
  const onDateChange = (_event: unknown, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      const newDate = new Date(selectedDate);
      newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      setSelectedDate(newDate);
    }
  };

  // Handle time change
  const onTimeChange = (_event: unknown, time?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (time) {
      const newDate = new Date(selectedDate);
      newDate.setHours(time.getHours(), time.getMinutes());
      setSelectedDate(newDate);
    }
  };

  // Court count handlers
  const incrementCourt = () => setCourtCount(prev => Math.min(prev + 1, 20));
  const decrementCourt = () => setCourtCount(prev => Math.max(prev - 1, 1));

  // 🎯 [KIM] Location mode handlers
  const handleLocationModeChange = (mode: LocationMode) => {
    setLocationMode(mode);
    if (mode === 'home') {
      // Reset to club home address
      if (clubHomeAddress) {
        setLocation({
          name: clubHomeAddress.name || t('createMeetupBottomSheet.clubHomeCourt'),
          address: clubHomeAddress.address || '',
          coordinates: clubHomeAddress.coordinates,
          placeId: clubHomeAddress.placeId,
        });
      }
      setShowLocationSearch(false);
    } else {
      // 🎯 [KIM FIX] Clear location and show Google Places search
      setLocation({ name: '', address: '' }); // Clear location to show search input
      setShowLocationSearch(true);
    }
  };

  // 🎯 [KIM] Google Places selection handler
  const handlePlaceSelect = async (data: GooglePlaceData, details: GooglePlaceDetail | null) => {
    const placeId = data?.place_id;
    console.log('🎯 [BottomSheet] Place selected:', { placeId, description: data?.description });

    if (!placeId) {
      // Fallback to basic location data
      const locationText = data?.description || data?.structured_formatting?.main_text || '';
      setLocation({
        name: locationText,
        address: details?.formatted_address || locationText,
        coordinates: details?.geometry?.location
          ? { lat: details.geometry.location.lat, lng: details.geometry.location.lng }
          : undefined,
      });
      setShowLocationSearch(false);
      return;
    }

    try {
      setIsLoadingPlaceDetails(true);
      console.log('🔍 [BottomSheet] Fetching place details for:', placeId);

      // Get complete place details using LocationService
      const completeLocationData = await LocationService.createLocationObjectFromPlaceId(placeId);

      if (completeLocationData) {
        // 🌤️ [KIM FIX 2025-01-10] Use latitude/longitude directly from completeLocationData
        // createLocationObjectFromPlaceId returns { latitude, longitude } not { coordinates: { ... } }
        setLocation({
          name: completeLocationData.name || data?.structured_formatting?.main_text || '',
          address: completeLocationData.formattedAddress || completeLocationData.address || '',
          coordinates:
            completeLocationData.latitude && completeLocationData.longitude
              ? {
                  lat: completeLocationData.latitude,
                  lng: completeLocationData.longitude,
                }
              : undefined,
          placeId: placeId,
        });
      } else {
        // Fallback
        const locationText = data?.description || data?.structured_formatting?.main_text || '';
        setLocation({
          name: locationText,
          address: details?.formatted_address || locationText,
          coordinates: details?.geometry?.location
            ? { lat: details.geometry.location.lat, lng: details.geometry.location.lng }
            : undefined,
          placeId: placeId,
        });
      }

      setShowLocationSearch(false);
    } catch (error) {
      console.error('❌ [BottomSheet] Failed to get place details:', error);
      // Fallback to basic data
      const locationText = data?.description || data?.structured_formatting?.main_text || '';
      setLocation({
        name: locationText,
        address: details?.formatted_address || locationText,
        placeId: placeId,
      });
      setShowLocationSearch(false);
    } finally {
      setIsLoadingPlaceDetails(false);
    }
  };

  // Submit handler - supports both create and edit modes
  const handleSubmit = async () => {
    if (!currentUser) {
      Alert.alert(t('common.error'), t('createMeetupBottomSheet.errors.loginRequired'));
      return;
    }

    // 🎯 [KIM] Edit mode validation
    if (mode === 'edit' && !meetupId) {
      Alert.alert(t('common.error'), t('createMeetupBottomSheet.errors.missingMeetupId'));
      return;
    }

    setIsSubmitting(true);

    try {
      // Meetup data for both create and update
      const meetupData = {
        clubId,
        dateTime: selectedDate,
        location: {
          name: location.name,
          address: location.address,
          ...(location.coordinates && { coordinates: location.coordinates }),
        },
        courtDetails: {
          availableCourts: courtCount,
          courtNumbers: courtNumbers.trim() || null, // 🎯 Include court numbers if provided
        },
        status: 'confirmed', // 🎯 Use 'confirmed' so it appears immediately in the list
      };

      // 🎯 [KIM] Edit mode: Update existing meetup
      if (mode === 'edit' && meetupId) {
        console.log('✏️ [BottomSheet] Updating meetup:', meetupId);
        await meetupService.updateMeetup(meetupId, meetupData);

        Alert.alert(t('common.success'), t('createMeetupBottomSheet.meetupUpdated'), [
          {
            text: t('common.ok'),
            onPress: () => {
              onDismiss();
              onSuccess?.();
            },
          },
        ]);
      } else {
        // 🎯 [KIM] Create mode: Create new meetup
        console.log('➕ [BottomSheet] Creating new meetup');
        await meetupService.createMeetup(meetupData);

        Alert.alert(t('common.success'), t('createMeetupBottomSheet.meetupCreated'), [
          {
            text: t('common.ok'),
            onPress: () => {
              onDismiss();
              onSuccess?.();
            },
          },
        ]);
      }
    } catch (error) {
      console.error(`Failed to ${mode} meetup:`, error);
      const errorKey =
        mode === 'edit'
          ? 'createMeetupBottomSheet.errors.updateFailed'
          : 'createMeetupBottomSheet.errors.createFailed';
      Alert.alert(t('common.error'), t(errorKey));
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = createStyles(theme);

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Surface style={styles.surface}>
            {/* Header - fixed outside ScrollView */}
            <View style={styles.header}>
              <Text style={styles.title}>
                {mode === 'edit'
                  ? t('createMeetupBottomSheet.editTitle')
                  : t('createMeetupBottomSheet.title')}
              </Text>
              <IconButton icon='close' size={24} onPress={onDismiss} />
            </View>

            {/* 🎯 [KIM] Scrollable content area */}
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps='handled'
            >
              {/* Date Picker */}
              <TouchableOpacity style={styles.inputRow} onPress={() => setShowDatePicker(true)}>
                <View style={styles.inputLabel}>
                  <Ionicons name='calendar-outline' size={22} color={theme?.colors.primary} />
                  <Text style={styles.labelText}>{t('createMeetupBottomSheet.date')}</Text>
                </View>
                <Text style={styles.inputValue}>{formatDate(selectedDate)}</Text>
              </TouchableOpacity>

              {/* 🎯 [KIM FIX] Android: 네이티브 다이얼로그로 렌더링 (View 래퍼 제거) */}
              {showDatePicker && Platform.OS === 'android' && (
                <DateTimePicker
                  value={selectedDate}
                  mode='date'
                  display='default'
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    if (event.type === 'set' && date) {
                      const newDate = new Date(selectedDate);
                      newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                      setSelectedDate(newDate);
                    }
                  }}
                  minimumDate={new Date()}
                />
              )}
              {/* iOS: View 래퍼로 인라인 렌더링 */}
              {showDatePicker && Platform.OS === 'ios' && (
                <View style={styles.pickerContainer}>
                  <DateTimePicker
                    value={selectedDate}
                    mode='date'
                    display='inline'
                    onChange={onDateChange}
                    minimumDate={new Date()}
                    themeVariant='dark'
                    style={styles.calendarPicker}
                  />
                  <Button
                    mode='contained'
                    onPress={() => setShowDatePicker(false)}
                    style={styles.pickerDoneButton}
                  >
                    {t('createMeetupBottomSheet.done')}
                  </Button>
                </View>
              )}

              {/* Time Picker */}
              <TouchableOpacity style={styles.inputRow} onPress={() => setShowTimePicker(true)}>
                <View style={styles.inputLabel}>
                  <Ionicons name='time-outline' size={22} color={theme?.colors.primary} />
                  <Text style={styles.labelText}>{t('createMeetupBottomSheet.time')}</Text>
                </View>
                <Text style={styles.inputValue}>{formatTime(selectedDate)}</Text>
              </TouchableOpacity>

              {/* 🎯 [KIM FIX] Android: 네이티브 다이얼로그로 렌더링 (View 래퍼 제거) */}
              {showTimePicker && Platform.OS === 'android' && (
                <DateTimePicker
                  value={selectedDate}
                  mode='time'
                  display='default'
                  onChange={(event, time) => {
                    setShowTimePicker(false);
                    if (event.type === 'set' && time) {
                      const newDate = new Date(selectedDate);
                      newDate.setHours(time.getHours(), time.getMinutes());
                      setSelectedDate(newDate);
                    }
                  }}
                  minuteInterval={5}
                />
              )}
              {/* iOS: View 래퍼로 인라인 렌더링 */}
              {showTimePicker && Platform.OS === 'ios' && (
                <View style={styles.pickerContainer}>
                  <DateTimePicker
                    value={selectedDate}
                    mode='time'
                    display='spinner'
                    onChange={onTimeChange}
                    minuteInterval={5}
                    themeVariant='dark'
                    style={styles.dateTimePicker}
                  />
                  <Button
                    mode='contained'
                    onPress={() => setShowTimePicker(false)}
                    style={styles.pickerDoneButton}
                  >
                    {t('createMeetupBottomSheet.done')}
                  </Button>
                </View>
              )}

              {/* 🎯 [KIM] Location Selection - Radio buttons + Google Places */}
              <View style={styles.locationSection}>
                <View style={styles.inputLabel}>
                  <Ionicons name='location-outline' size={22} color={theme?.colors.primary} />
                  <Text style={styles.labelText}>{t('createMeetupBottomSheet.location')}</Text>
                </View>

                {/* Radio Buttons */}
                <RadioButton.Group
                  onValueChange={value => handleLocationModeChange(value as LocationMode)}
                  value={locationMode}
                >
                  <View style={styles.radioRow}>
                    <TouchableOpacity
                      style={[
                        styles.radioOption,
                        locationMode === 'home' && styles.radioOptionSelected,
                      ]}
                      onPress={() => handleLocationModeChange('home')}
                    >
                      <RadioButton value='home' color={theme?.colors.primary} />
                      <Text
                        style={[
                          styles.radioLabel,
                          locationMode === 'home' && styles.radioLabelSelected,
                        ]}
                      >
                        {t('createMeetupBottomSheet.clubHomeCourt')}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.radioOption,
                        locationMode === 'other' && styles.radioOptionSelected,
                      ]}
                      onPress={() => handleLocationModeChange('other')}
                    >
                      <RadioButton value='other' color={theme?.colors.primary} />
                      <Text
                        style={[
                          styles.radioLabel,
                          locationMode === 'other' && styles.radioLabelSelected,
                        ]}
                      >
                        {t('createMeetupBottomSheet.otherLocation')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </RadioButton.Group>

                {/* Selected Location Display */}
                {locationMode === 'home' && location.name && (
                  <View style={styles.selectedLocationCard}>
                    <Ionicons name='home-outline' size={18} color={theme?.colors.primary} />
                    <View style={styles.selectedLocationText}>
                      <Text style={styles.selectedLocationName} numberOfLines={1}>
                        {location.name}
                      </Text>
                      {location.address && (
                        <Text style={styles.selectedLocationAddress} numberOfLines={2}>
                          {location.address}
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {/* Google Places Search - only when "other" is selected */}
                {locationMode === 'other' && (
                  <View style={styles.googlePlacesContainer}>
                    {showLocationSearch && !location.name && (
                      <SafeGooglePlacesAutocomplete
                        placeholder={t('createMeetupBottomSheet.searchLocation')}
                        onPress={handlePlaceSelect}
                        fetchDetails={true}
                        isLoading={isLoadingPlaceDetails}
                        // 🎯 [KIM] Fix VirtualizedList nesting warning
                        // scrollEnabled: false prevents the internal FlatList from scrolling
                        // keyboardShouldPersistTaps ensures tap events work properly
                        listViewProps={{
                          nestedScrollEnabled: true,
                          scrollEnabled: false,
                          keyboardShouldPersistTaps: 'handled',
                        }}
                        textInputProps={{
                          placeholderTextColor: theme?.colors.outline || '#888',
                          // 🎯 [KIM] Auto-focus when "Other location" is selected
                          autoFocus: true,
                        }}
                        styles={{
                          container: styles.placesAutocompleteContainer,
                          textInputContainer: {
                            backgroundColor: 'transparent',
                          },
                          textInput: styles.placesTextInput,
                          listView: styles.placesListView,
                          // 🎯 [KIM] Dark mode styles for dropdown
                          row: {
                            backgroundColor: theme?.colors.surface || '#1E1E1E',
                            paddingVertical: 14,
                            paddingHorizontal: 12,
                          },
                          separator: {
                            height: 1,
                            backgroundColor: theme?.colors.outline || '#333',
                          },
                          description: {
                            color: theme?.colors.onSurface || '#FFFFFF',
                            fontSize: 14,
                          },
                          poweredContainer: {
                            backgroundColor: theme?.colors.surface || '#1E1E1E',
                            borderTopWidth: 1,
                            borderTopColor: theme?.colors.outline || '#333',
                          },
                          // 🎯 [KIM] Dark mode style for "Powered by Google" text
                          powered: {
                            color: theme?.colors.onSurfaceVariant || '#888888',
                          },
                        }}
                      />
                    )}

                    {/* Show selected location for "other" mode - no change button, clean display */}
                    {locationMode === 'other' && location.name && !showLocationSearch && (
                      <View style={styles.selectedLocationCard}>
                        <Ionicons name='location-outline' size={18} color={theme?.colors.primary} />
                        <View style={[styles.selectedLocationText, { flex: 1 }]}>
                          <Text style={styles.selectedLocationName} numberOfLines={1}>
                            {location.name}
                          </Text>
                          {location.address && (
                            <Text style={styles.selectedLocationAddress} numberOfLines={2}>
                              {location.address}
                            </Text>
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* Court Count */}
              <View style={styles.inputRow}>
                <View style={styles.inputLabel}>
                  <Ionicons name='pickleballball-outline' size={22} color={theme?.colors.primary} />
                  <Text style={styles.labelText}>{t('createMeetupBottomSheet.courts')}</Text>
                </View>
                <View style={styles.counterContainer}>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={decrementCourt}
                    disabled={courtCount <= 1}
                  >
                    <Ionicons
                      name='remove'
                      size={20}
                      color={courtCount <= 1 ? theme?.colors.outline : theme?.colors.primary}
                    />
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>{courtCount}</Text>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={incrementCourt}
                    disabled={courtCount >= 20}
                  >
                    <Ionicons
                      name='add'
                      size={20}
                      color={courtCount >= 20 ? theme?.colors.outline : theme?.colors.primary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* 🎯 Court Numbers Input */}
              <View style={styles.courtNumbersContainer}>
                <View style={styles.inputLabel}>
                  <Ionicons name='grid-outline' size={22} color={theme?.colors.primary} />
                  <Text style={styles.labelText}>{t('createMeetupBottomSheet.courtNumbers')}</Text>
                </View>
                <TextInput
                  mode='outlined'
                  placeholder={t('createMeetupBottomSheet.courtNumbersPlaceholder')}
                  placeholderTextColor={theme?.colors.outline}
                  value={courtNumbers}
                  onChangeText={setCourtNumbers}
                  style={styles.courtNumbersInput}
                  dense
                />
              </View>

              {/* Submit Button - dynamic text based on mode */}
              <Button
                mode='contained'
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={isSubmitting}
                loading={isSubmitting}
              >
                {isSubmitting
                  ? mode === 'edit'
                    ? t('createMeetupBottomSheet.updating')
                    : t('createMeetupBottomSheet.creating')
                  : mode === 'edit'
                    ? t('createMeetupBottomSheet.updateMeetup')
                    : t('createMeetupBottomSheet.createMeetup')}
              </Button>
            </ScrollView>
          </Surface>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createStyles = (theme: any) =>
  StyleSheet.create({
    modalContainer: {
      justifyContent: 'flex-end',
      margin: 0,
    },
    surface: {
      backgroundColor: theme?.colors.surface || '#1E1E1E',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 16,
      paddingBottom: Platform.OS === 'ios' ? 34 : 20,
      maxHeight: '98%', // 🎯 [KIM] 거의 전체 화면
      minHeight: '95%', // 🎯 [KIM] 버튼 전체 보이도록
    },
    scrollContent: {
      flexGrow: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: theme?.colors.onSurface || '#FFFFFF',
    },
    inputRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme?.colors.outline || '#333',
    },
    inputLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    labelText: {
      fontSize: 16,
      color: theme?.colors.onSurface || '#FFFFFF',
    },
    inputValue: {
      fontSize: 16,
      color: theme?.colors.primary || '#4CAF50',
      fontWeight: '500',
      maxWidth: '50%',
    },
    counterContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    counterButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme?.colors.surfaceVariant || '#333',
      justifyContent: 'center',
      alignItems: 'center',
    },
    counterValue: {
      fontSize: 18,
      fontWeight: '600',
      color: theme?.colors.onSurface || '#FFFFFF',
      minWidth: 30,
      textAlign: 'center',
    },
    submitButton: {
      marginTop: 24,
      borderRadius: 12,
      paddingVertical: 8,
    },
    // 🎯 [KIM] Picker container for center alignment
    pickerContainer: {
      alignItems: 'center',
      paddingVertical: 0,
      overflow: 'hidden', // 음수 마진으로 인한 오버플로우 숨김
    },
    // 🎯 [KIM] Calendar-style date picker (inline mode) - compact height
    calendarPicker: {
      width: '100%',
      height: 340,
      marginTop: -10, // 상단 여백 약간만 줄이기
      marginBottom: -30, // 하단 여백 더 줄이기
      backgroundColor: 'transparent',
      alignSelf: 'center', // 🎯 [KIM] Center the calendar
    },
    // 🎯 [KIM] Spinner-style time picker (center alignment)
    dateTimePicker: {
      width: '100%',
      alignSelf: 'center', // 🎯 [KIM] Center the time picker
    },
    // 🎯 [KIM] Done button for iOS date/time picker
    pickerDoneButton: {
      marginTop: 8,
      marginHorizontal: 40,
      borderRadius: 8,
      minWidth: 120,
    },
    // 🎯 [KIM] Location selection styles
    locationSection: {
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme?.colors.outline || '#333',
    },
    radioRow: {
      flexDirection: 'row',
      marginTop: 12,
      gap: 8,
    },
    radioOption: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme?.colors.surfaceVariant || '#333',
      borderRadius: 8,
      paddingRight: 16,
      paddingVertical: 4,
      flex: 1,
    },
    radioOptionSelected: {
      backgroundColor: theme?.colors.primaryContainer || '#2E5A27',
      borderWidth: 1,
      borderColor: theme?.colors.primary || '#4CAF50',
    },
    radioLabel: {
      fontSize: 14,
      color: theme?.colors.onSurfaceVariant || '#AAA',
    },
    radioLabelSelected: {
      color: theme?.colors.onPrimaryContainer || '#FFF',
      fontWeight: '600',
    },
    selectedLocationCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme?.colors.surfaceVariant || '#333',
      borderRadius: 8,
      padding: 12,
      marginTop: 12,
      gap: 10,
    },
    selectedLocationText: {
      flex: 1,
    },
    selectedLocationName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme?.colors.onSurface || '#FFF',
    },
    selectedLocationAddress: {
      fontSize: 12,
      color: theme?.colors.onSurfaceVariant || '#AAA',
      marginTop: 2,
    },
    googlePlacesContainer: {
      marginTop: 12,
    },
    placesAutocompleteContainer: {
      flex: 0,
    },
    placesTextInput: {
      backgroundColor: theme?.colors.surfaceVariant || '#333',
      borderRadius: 8,
      color: theme?.colors.onSurface || '#FFF',
      fontSize: 14,
      paddingHorizontal: 12,
      height: 44,
    },
    placesListView: {
      backgroundColor: theme?.colors.surface || '#1E1E1E',
      borderRadius: 8,
      marginTop: 4,
    },
    changeLocationButton: {
      backgroundColor: theme?.colors.primary || '#4CAF50',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    changeLocationText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFF',
    },
    // Court numbers styles
    courtNumbersContainer: {
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme?.colors.outline || '#333',
    },
    courtNumbersInput: {
      marginTop: 8,
      backgroundColor: theme?.colors.surfaceVariant || '#333',
    },
  });

export default CreateMeetupBottomSheet;
