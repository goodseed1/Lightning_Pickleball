import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  ImageSourcePropType,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage, SUPPORTED_LANGUAGES, SupportedLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../hooks/useTheme';
import { getLightningPickleballTheme } from '../theme';

// Import image as module
import lightningPickleballIcon from '../../assets/images/lightning-pickleball-icon.png';

interface LanguageSelectionScreenProps {
  onLanguageSelected: () => void;
}

const LanguageSelectionScreen: React.FC<LanguageSelectionScreenProps> = ({
  onLanguageSelected,
}) => {
  const { setLanguage } = useLanguage();
  const { theme } = useTheme();
  const themeColors = getLightningPickleballTheme(theme);
  const [selectedLanguage, setSelectedLanguage] = React.useState<SupportedLanguage>('en'); // Default to English
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleLanguageSelect = (lang: SupportedLanguage) => {
    setSelectedLanguage(lang);
  };

  const handleContinue = async () => {
    await setLanguage(selectedLanguage);

    // Animate out and proceed
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onLanguageSelected();
    });
  };

  const getTitle = () => {
    // English-only text for neutral language display
    return 'Choose Your Language';
  };

  const getSubtitle = () => {
    // English-only text for neutral language display
    return 'Select your preferred language for the app';
  };

  const getContinueText = () => {
    switch (selectedLanguage) {
      case 'ko':
        return '계속하기';
      case 'es':
        return 'Continuar';
      case 'fr':
        return 'Continuer';
      case 'de':
        return 'Weiter';
      case 'ja':
        return '続ける';
      case 'zh':
        return '继续';
      case 'pt':
        return 'Continuar';
      case 'it':
        return 'Continua';
      case 'ru':
        return 'Продолжить';
      case 'en':
      default:
        return 'Continue';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.colors.background }]}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Image
              source={lightningPickleballIcon as ImageSourcePropType}
              style={styles.appIcon}
              resizeMode='contain'
            />
            <Text style={[styles.appTitle, { color: themeColors.colors.primary }]}>
              Lightning Pickleball
            </Text>
          </View>
          <Text style={[styles.tagline, { color: themeColors.colors.onSurfaceVariant }]}>
            Build your local pickleball network and community
          </Text>
        </View>

        {/* Language Selection Section */}
        <View style={styles.selectionSection}>
          <Text style={[styles.title, { color: themeColors.colors.onSurface }]}>{getTitle()}</Text>
          <Text style={[styles.subtitle, { color: themeColors.colors.onSurfaceVariant }]}>
            {getSubtitle()}
          </Text>

          {/* Language Options - 2 Column Grid with ScrollView */}
          <ScrollView
            style={styles.languageScrollView}
            contentContainerStyle={styles.languageGrid}
            showsVerticalScrollIndicator={false}
          >
            {SUPPORTED_LANGUAGES.map(language => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageCard,
                  {
                    backgroundColor: themeColors.colors.surface,
                    borderColor:
                      selectedLanguage === language.code
                        ? themeColors.colors.primary
                        : themeColors.colors.outline,
                  },
                  selectedLanguage === language.code && {
                    backgroundColor:
                      theme === 'dark'
                        ? themeColors.colors.surfaceVariant
                        : themeColors.colors.primary + '10',
                  },
                ]}
                onPress={() => handleLanguageSelect(language.code)}
                activeOpacity={0.7}
              >
                <Text style={styles.cardFlag}>{language.flag}</Text>
                <Text
                  style={[
                    styles.cardNativeName,
                    { color: themeColors.colors.onSurface },
                    selectedLanguage === language.code && { color: themeColors.colors.primary },
                  ]}
                  numberOfLines={1}
                >
                  {language.nativeName}
                </Text>
                {selectedLanguage === language.code && (
                  <View
                    style={[styles.cardCheckmark, { backgroundColor: themeColors.colors.primary }]}
                  >
                    <Text style={[styles.checkmarkText, { color: themeColors.colors.onPrimary }]}>
                      ✓
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              backgroundColor: selectedLanguage
                ? themeColors.colors.primary
                : themeColors.colors.surfaceVariant,
            },
            selectedLanguage && styles.continueButtonActive,
          ]}
          onPress={handleContinue}
          disabled={!selectedLanguage}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.continueButtonText,
              {
                color: selectedLanguage
                  ? themeColors.colors.onPrimary
                  : themeColors.colors.onSurfaceVariant,
              },
            ]}
          >
            {getContinueText()}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  appIcon: {
    width: 48,
    height: 48,
    marginRight: 10,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tagline: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 4,
  },
  selectionSection: {
    flex: 1,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 16,
  },
  // 2-column grid styles - compact for 10 languages without scroll
  languageScrollView: {
    flex: 1,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    paddingBottom: 4,
  },
  languageCard: {
    width: '48%',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    position: 'relative',
  },
  cardFlag: {
    fontSize: 22,
    marginBottom: 4,
  },
  cardNativeName: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  cardCheckmark: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Legacy styles (kept for compatibility)
  languageOptions: {
    gap: 16,
  },
  languageOption: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
  },
  selectedLanguageOption: {},
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flag: {
    fontSize: 32,
    marginRight: 20,
  },
  languageText: {
    flex: 1,
  },
  languageName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedLanguageName: {},
  nativeName: {
    fontSize: 16,
  },
  selectedNativeName: {},
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  continueButtonActive: {
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LanguageSelectionScreen;
