/**
 * Theme Selection Screen for Lightning Pickleball
 * Project Midnight - Dark Mode First Implementation
 *
 * Allows users to choose their preferred theme during onboarding
 * Supports light, dark, and system preference modes
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../contexts/LanguageContext';
import { getLightningPickleballTheme } from '../../theme';
import { ThemePreference } from '../../types/theme';

interface ThemeSelectionScreenProps {
  onComplete: () => void;
  onBack?: () => void;
}

// const { width } = Dimensions.get('window'); // Reserved for future use

const ThemeSelectionScreen: React.FC<ThemeSelectionScreenProps> = ({ onComplete, onBack }) => {
  const { theme, themePreference, setThemePreference } = useTheme();
  const { t } = useLanguage();
  const themeColors = getLightningPickleballTheme(theme);

  const [selectedTheme, setSelectedTheme] = useState<ThemePreference>(themePreference);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const handleThemeSelect = (preference: ThemePreference) => {
    setSelectedTheme(preference);
    // Preview the theme immediately
    setThemePreference(preference);
  };

  const handleContinue = async () => {
    await setThemePreference(selectedTheme);

    // Animate out and proceed
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onComplete();
    });
  };

  const themeOptions = [
    {
      key: 'light' as ThemePreference,
      title: t('themeSelection.lightMode.title'),
      subtitle: t('themeSelection.lightMode.subtitle'),
      icon: 'white-balance-sunny',
      preview: {
        background: '#FFFFFF',
        surface: '#F5F5F5',
        text: '#000000',
        primary: '#1976D2',
      },
    },
    {
      key: 'dark' as ThemePreference,
      title: t('themeSelection.darkMode.title'),
      subtitle: t('themeSelection.darkMode.subtitle'),
      icon: 'moon-waning-crescent',
      preview: {
        background: '#121212',
        surface: '#1E1E1E',
        text: '#FFFFFF',
        primary: '#64B5F6',
      },
    },
    {
      key: 'system' as ThemePreference,
      title: t('themeSelection.systemMode.title'),
      subtitle: t('themeSelection.systemMode.subtitle'),
      icon: 'theme-light-dark',
      preview: {
        background: theme === 'dark' ? '#121212' : '#FFFFFF',
        surface: theme === 'dark' ? '#1E1E1E' : '#F5F5F5',
        text: theme === 'dark' ? '#FFFFFF' : '#000000',
        primary: theme === 'dark' ? '#64B5F6' : '#1976D2',
      },
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <MaterialCommunityIcons
              name='palette-outline'
              size={48}
              color={themeColors.colors.primary}
            />
            <Text style={[styles.title, { color: themeColors.colors.onSurface }]}>
              {t('themeSelection.title')}
            </Text>
            <Text style={[styles.subtitle, { color: themeColors.colors.onSurfaceVariant }]}>
              {t('themeSelection.subtitle')}
            </Text>
          </View>

          {/* Theme Options */}
          <View style={styles.optionsContainer}>
            {themeOptions.map(option => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: themeColors.colors.surface,
                    borderColor:
                      selectedTheme === option.key
                        ? themeColors.colors.primary
                        : themeColors.colors.outline,
                  },
                  selectedTheme === option.key && {
                    borderWidth: 2,
                    backgroundColor:
                      theme === 'dark'
                        ? themeColors.colors.surfaceVariant
                        : themeColors.colors.primary + '15',
                  },
                ]}
                onPress={() => handleThemeSelect(option.key)}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <View style={styles.optionHeader}>
                    <MaterialCommunityIcons
                      name={option.icon}
                      size={32}
                      color={
                        selectedTheme === option.key
                          ? themeColors.colors.primary
                          : themeColors.colors.onSurfaceVariant
                      }
                    />
                    {selectedTheme === option.key && (
                      <View
                        style={[styles.checkmark, { backgroundColor: themeColors.colors.primary }]}
                      >
                        <MaterialCommunityIcons
                          name='check'
                          size={16}
                          color={themeColors.colors.onPrimary}
                        />
                      </View>
                    )}
                  </View>

                  <View style={styles.optionText}>
                    <Text
                      style={[
                        styles.optionTitle,
                        { color: themeColors.colors.onSurface },
                        selectedTheme === option.key && { color: themeColors.colors.primary },
                      ]}
                    >
                      {option.title}
                    </Text>
                    <Text
                      style={[
                        styles.optionSubtitle,
                        { color: themeColors.colors.onSurfaceVariant },
                      ]}
                    >
                      {option.subtitle}
                    </Text>
                  </View>

                  {/* Mini Preview */}
                  <View style={styles.previewContainer}>
                    <View
                      style={[styles.previewWindow, { backgroundColor: option.preview.background }]}
                    >
                      <View
                        style={[styles.previewHeader, { backgroundColor: option.preview.primary }]}
                      />
                      <View style={styles.previewContent}>
                        <View
                          style={[styles.previewCard, { backgroundColor: option.preview.surface }]}
                        />
                        <View
                          style={[
                            styles.previewText,
                            { backgroundColor: option.preview.text, opacity: 0.2 },
                          ]}
                        />
                        <View
                          style={[
                            styles.previewText,
                            { backgroundColor: option.preview.text, opacity: 0.15, width: '70%' },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {onBack && (
              <TouchableOpacity
                style={[styles.backButton, { borderColor: themeColors.colors.outline }]}
                onPress={onBack}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.backButtonText, { color: themeColors.colors.onSurfaceVariant }]}
                >
                  {t('themeSelection.back')}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.continueButton, { backgroundColor: themeColors.colors.primary }]}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <Text style={[styles.continueButtonText, { color: themeColors.colors.onPrimary }]}>
                {t('themeSelection.continue')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info Note */}
          <View style={styles.infoContainer}>
            <MaterialCommunityIcons
              name='information-outline'
              size={16}
              color={themeColors.colors.onSurfaceVariant}
            />
            <Text style={[styles.infoText, { color: themeColors.colors.onSurfaceVariant }]}>
              {t('themeSelection.infoNote')}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  optionsContainer: {
    marginBottom: 32,
  },
  themeOption: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionHeader: {
    marginRight: 16,
    position: 'relative',
  },
  checkmark: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
  },
  previewContainer: {
    marginLeft: 'auto',
  },
  previewWindow: {
    width: 60,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  previewHeader: {
    height: 12,
  },
  previewContent: {
    flex: 1,
    padding: 4,
  },
  previewCard: {
    height: 20,
    borderRadius: 4,
    marginBottom: 4,
  },
  previewText: {
    height: 3,
    borderRadius: 2,
    marginBottom: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  backButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
});

export default ThemeSelectionScreen;
