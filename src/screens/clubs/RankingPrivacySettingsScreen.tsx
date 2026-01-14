import React, { useState, useEffect, useMemo, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Card, Button, RadioButton, Surface, Appbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../hooks/useTheme';
import { getLightningTennisTheme } from '../../theme';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { ClubVisibility, CLUB_VISIBILITY_OPTIONS } from '../../types/club';
import clubService from '../../services/clubService';

type RankingPrivacySettingsScreenRouteProp = RouteProp<
  RootStackParamList,
  'RankingPrivacySettings'
>;

interface RankingPrivacySettingsScreenParams {
  clubId: string;
  clubName: string;
  currentVisibility?: ClubVisibility;
}

const RankingPrivacySettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RankingPrivacySettingsScreenRouteProp>();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const themeColors = getLightningTennisTheme(theme);

  const { clubId, clubName, currentVisibility } =
    route.params as RankingPrivacySettingsScreenParams;

  // Create styles with dynamic theme colors
  const styles = useMemo(() => createStyles(themeColors.colors), [themeColors.colors]);

  const [selectedVisibility, setSelectedVisibility] = useState<ClubVisibility>(
    currentVisibility || 'public'
  );
  // Track the original value loaded from Firestore for hasChanges comparison
  const [originalVisibility, setOriginalVisibility] = useState<ClubVisibility | null>(null);
  const [, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 🎯 [KIM FIX] Hide React Navigation header, use Appbar.Header instead
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    // Always load current club settings from Firestore
    loadClubSettings();
  }, [clubId]);

  const loadClubSettings = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Loading club visibility for:', clubId);

      // Fetch actual visibility from Firestore
      const visibility = await clubService.getClubVisibility(clubId);
      console.log('📊 Current visibility from Firestore:', visibility);

      const visibilityValue = visibility as ClubVisibility;
      setSelectedVisibility(visibilityValue);
      setOriginalVisibility(visibilityValue); // Track original value for hasChanges
    } catch (error) {
      console.error('Error loading club settings:', error);
      // Keep default value on error, but set original to default too
      setOriginalVisibility('public');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      console.log('🔒 Saving club visibility:', selectedVisibility, 'for club:', clubId);

      // Update club visibility setting
      await clubService.updateClubVisibility(clubId, selectedVisibility);

      console.log('✅ Club visibility saved successfully');

      Alert.alert(t('rankingPrivacy.settingsSaved'), t('rankingPrivacy.settingsSavedMessage'), [
        {
          text: t('common.ok'),
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('❌ Error updating club visibility:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert(
        t('rankingPrivacy.saveFailed'),
        `${t('rankingPrivacy.saveFailedMessage')}: ${errorMessage}`,
        [{ text: t('common.ok') }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  const getVisibilityLabel = (visibility: ClubVisibility): string => {
    return t(`rankingPrivacy.visibility.${visibility}.label`);
  };

  const getVisibilityDescription = (visibility: ClubVisibility): string => {
    return t(`rankingPrivacy.visibility.${visibility}.description`);
  };

  // Compare with original value loaded from Firestore, not the nav param
  const hasChanges = originalVisibility !== null && selectedVisibility !== originalVisibility;

  return (
    <>
      {/* 🎯 [KIM FIX] Consistent Appbar.Header for unified navigation */}
      <Appbar.Header style={{ backgroundColor: themeColors.colors.surface }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('rankingPrivacy.screenTitle')} />
      </Appbar.Header>
      <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Header Info */}
          <Card style={styles.headerCard}>
            <Card.Content style={styles.headerContent}>
              <View style={styles.headerIcon}>
                <Ionicons
                  name='shield-checkmark-outline'
                  size={32}
                  color={themeColors.colors.primary}
                />
              </View>
              <Text style={styles.clubName}>{clubName}</Text>
              <Text style={styles.headerDescription}>{t('rankingPrivacy.headerDescription')}</Text>
            </Card.Content>
          </Card>

          {/* Privacy Options */}
          <Card style={styles.optionsCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>{t('rankingPrivacy.sectionTitle')}</Text>

              <RadioButton.Group
                onValueChange={value => setSelectedVisibility(value as ClubVisibility)}
                value={selectedVisibility}
              >
                {(Object.keys(CLUB_VISIBILITY_OPTIONS) as ClubVisibility[]).map(visibility => (
                  <TouchableOpacity
                    key={visibility}
                    activeOpacity={0.7}
                    onPress={() => setSelectedVisibility(visibility)}
                  >
                    <Surface style={styles.optionSurface}>
                      <View style={styles.optionContent}>
                        <View style={styles.optionHeader}>
                          <View style={styles.optionLabelContainer}>
                            <Text style={styles.optionLabel}>{getVisibilityLabel(visibility)}</Text>
                            {visibility === 'public' && (
                              <View style={styles.recommendedBadge}>
                                <Text style={styles.recommendedText}>
                                  {t('rankingPrivacy.recommended')}
                                </Text>
                              </View>
                            )}
                          </View>
                          <RadioButton value={visibility} />
                        </View>
                        <Text style={styles.optionDescription}>
                          {getVisibilityDescription(visibility)}
                        </Text>
                      </View>
                    </Surface>
                  </TouchableOpacity>
                ))}
              </RadioButton.Group>
            </Card.Content>
          </Card>

          {/* Current Status */}
          <Card style={styles.statusCard}>
            <Card.Content>
              <Text style={styles.statusTitle}>{t('rankingPrivacy.currentSetting')}</Text>
              <View style={styles.statusContent}>
                <Ionicons
                  name={
                    selectedVisibility === 'public'
                      ? 'globe-outline'
                      : selectedVisibility === 'membersOnly'
                        ? 'people-outline'
                        : 'lock-closed-outline'
                  }
                  size={24}
                  color={themeColors.colors.primary}
                />
                <View style={styles.statusText}>
                  <Text style={styles.statusLabel}>{getVisibilityLabel(selectedVisibility)}</Text>
                  <Text style={styles.statusDescription}>
                    {getVisibilityDescription(selectedVisibility)}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Impact Notice */}
          <Card style={styles.impactCard}>
            <Card.Content>
              <View style={styles.impactHeader}>
                <Ionicons
                  name='information-circle-outline'
                  size={20}
                  color={themeColors.colors.onSurfaceVariant}
                />
                <Text style={styles.impactTitle}>{t('rankingPrivacy.importantNotes')}</Text>
              </View>
              <Text style={styles.impactDescription}>{t('rankingPrivacy.impactDescription')}</Text>
            </Card.Content>
          </Card>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <Button mode='outlined' onPress={() => navigation.goBack()} style={styles.cancelButton}>
            {t('rankingPrivacy.cancel')}
          </Button>

          <Button
            mode='contained'
            onPress={handleSave}
            loading={isSaving}
            disabled={!hasChanges || isSaving}
            style={[styles.saveButton, !hasChanges && styles.disabledButton]}
          >
            {t('rankingPrivacy.save')}
          </Button>
        </View>
      </SafeAreaView>
    </>
  );
};

// 🎨 [DARK GLASS] Dynamic styles with theme colors
const createStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 100,
    },
    // 🎨 [DARK GLASS] Header card style
    headerCard: {
      marginBottom: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.outline,
    },
    headerContent: {
      alignItems: 'center',
      paddingVertical: 8,
    },
    headerIcon: {
      marginBottom: 8,
    },
    clubName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 8,
      textAlign: 'center',
    },
    headerDescription: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 20,
    },
    // 🎨 [DARK GLASS] Options card style
    optionsCard: {
      marginBottom: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.outline,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 16,
    },
    optionSurface: {
      marginBottom: 12,
      borderRadius: 8,
      elevation: 1,
      backgroundColor: colors.surfaceVariant,
    },
    optionContent: {
      padding: 16,
    },
    optionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    optionLabelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    optionLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.onSurface,
      marginRight: 8,
    },
    recommendedBadge: {
      backgroundColor: colors.primary,
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    recommendedText: {
      fontSize: 10,
      color: 'white',
      fontWeight: '600',
    },
    optionDescription: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      lineHeight: 20,
    },
    // 🎨 [DARK GLASS] Status card style
    statusCard: {
      marginBottom: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.outline,
    },
    statusTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.onSurface,
      marginBottom: 12,
    },
    statusContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    statusText: {
      marginLeft: 12,
      flex: 1,
    },
    statusLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.onSurface,
      marginBottom: 4,
    },
    statusDescription: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      lineHeight: 18,
    },
    // 🎨 [DARK GLASS] Impact card style
    impactCard: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.outline,
    },
    impactHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    impactTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.onSurfaceVariant,
      marginLeft: 6,
    },
    impactDescription: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
      lineHeight: 18,
    },
    actionContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      padding: 16,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.outline,
    },
    cancelButton: {
      flex: 1,
      marginRight: 8,
    },
    saveButton: {
      flex: 2,
      marginLeft: 8,
    },
    disabledButton: {
      opacity: 0.6,
    },
  });

export default RankingPrivacySettingsScreen;
