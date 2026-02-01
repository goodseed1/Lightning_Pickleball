import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useLocation } from '../contexts/LocationContext';
import { useTheme } from '../hooks/useTheme';
import { getLightningPickleballTheme } from '../theme';
import { CreationStackParamList } from '../navigation/CreationNavigator';

type NavigationProp = NativeStackNavigationProp<CreationStackParamList, 'CreateEventChoice'>;

const CreateEventChoiceScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useLanguage();
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningPickleballTheme(currentTheme);
  const colors = themeColors.colors;

  // 📍 Location permission check for creating events
  const { isLocationEnabled, requestLocationPermission } = useLocation();

  /**
   * 📍 Check location permission before creating any event
   * Returns true if location is available, false otherwise
   */
  const checkLocationPermission = async (): Promise<boolean> => {
    if (isLocationEnabled) {
      return true;
    }

    // Request permission if not enabled
    const granted = await requestLocationPermission();
    if (!granted) {
      Alert.alert(t('common.locationRequired'), t('common.locationRequiredForCreate'), [
        { text: t('common.ok') },
      ]);
      return false;
    }
    return true;
  };

  const handleCreateMatch = async () => {
    const hasLocation = await checkLocationPermission();
    if (!hasLocation) return;
    navigation.navigate('CreateEventForm', { eventType: 'match' });
  };

  const handleCreateMeetup = async () => {
    const hasLocation = await checkLocationPermission();
    if (!hasLocation) return;
    navigation.navigate('CreateEventForm', { eventType: 'meetup' });
  };

  const handleCreateClub = async () => {
    console.log('🏟️ [CreateEventChoice] Club creation button pressed');
    const hasLocation = await checkLocationPermission();
    if (!hasLocation) return;
    try {
      // @ts-expect-error CreateClub is on a different stack
      navigation.navigate('CreateClub', { mode: 'create' });
    } catch (error) {
      console.error('❌ [CreateEventChoice] Navigation error:', error);
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
    },
    placeholder: {
      width: 40,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: 20,
    },
    subtitle: {
      fontSize: 16,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: 30,
    },
    choiceCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
      borderWidth: 2,
    },
    matchCard: {
      borderColor: colors.primary,
    },
    meetupCard: {
      borderColor: colors.tertiary,
    },
    clubCard: {
      borderColor: colors.secondary,
    },
    cardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
    },
    iconContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    cardIcon: {
      fontSize: 32,
    },
    textContainer: {
      flex: 1,
      marginRight: 10,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.onSurface,
      marginBottom: 2,
    },
    cardSubtitle: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginBottom: 8,
    },
    cardDescription: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      lineHeight: 20,
    },
    infoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryContainer,
      padding: 16,
      borderRadius: 12,
      marginTop: 20,
    },
    infoText: {
      flex: 1,
      fontSize: 14,
      color: colors.onPrimaryContainer,
      marginLeft: 12,
      lineHeight: 20,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* StatusBar now managed centrally by ThemeProvider */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name='arrow-back' size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('createEventChoice.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>{t('createEventChoice.subtitle')}</Text>

        {/* Ranked Match Button */}
        <TouchableOpacity
          style={[styles.choiceCard, styles.matchCard]}
          onPress={handleCreateMatch}
          activeOpacity={0.9}
        >
          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <Text style={styles.cardIcon}>🏆</Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>{t('createEventChoice.lightningMatch.title')}</Text>
              <Text style={styles.cardSubtitle}>
                {t('createEventChoice.lightningMatch.subtitle')}
              </Text>
              <Text style={styles.cardDescription}>
                {t('createEventChoice.lightningMatch.description')}
              </Text>
            </View>
            <Ionicons name='chevron-forward' size={24} color={colors.primary} />
          </View>
        </TouchableOpacity>

        {/* Casual Meetup Button */}
        <TouchableOpacity
          style={[styles.choiceCard, styles.meetupCard]}
          onPress={handleCreateMeetup}
          activeOpacity={0.9}
        >
          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <Text style={styles.cardIcon}>😊</Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>{t('createEventChoice.lightningMeetup.title')}</Text>
              <Text style={styles.cardSubtitle}>
                {t('createEventChoice.lightningMeetup.subtitle')}
              </Text>
              <Text style={styles.cardDescription}>
                {t('createEventChoice.lightningMeetup.description')}
              </Text>
            </View>
            <Ionicons name='chevron-forward' size={24} color={colors.tertiary} />
          </View>
        </TouchableOpacity>

        {/* Create Club Button */}
        <TouchableOpacity
          style={[styles.choiceCard, styles.clubCard]}
          onPress={handleCreateClub}
          activeOpacity={0.9}
        >
          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <Text style={styles.cardIcon}>🏟️</Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>{t('createEventChoice.createClub.title')}</Text>
              <Text style={styles.cardSubtitle}>{t('createEventChoice.createClub.subtitle')}</Text>
              <Text style={styles.cardDescription}>
                {t('createEventChoice.createClub.description')}
              </Text>
            </View>
            <Ionicons name='chevron-forward' size={24} color={colors.secondary} />
          </View>
        </TouchableOpacity>

        {/* Additional Info */}
        <View style={styles.infoContainer}>
          <Ionicons name='information-circle-outline' size={20} color={colors.onSurfaceVariant} />
          <Text style={styles.infoText}>{t('createEventChoice.infoNotice')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateEventChoiceScreen;
