import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Appbar } from 'react-native-paper';
import {
  useLanguage,
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
} from '../../contexts/LanguageContext';
import { useTheme } from '../../hooks/useTheme';
import { getLightningPickleballTheme } from '../../theme';

const LanguageSelectionScreen: React.FC = () => {
  const { currentLanguage, setLanguage, t } = useLanguage();
  const { theme: currentTheme } = useTheme();
  const paperTheme = getLightningPickleballTheme(currentTheme);
  const navigation = useNavigation();

  const isDark = currentTheme === 'dark';

  // 🎨 다크 글래스 스타일
  const darkGlassStyle = {
    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
  };

  const onSelectLanguage = async (langCode: SupportedLanguage) => {
    try {
      await setLanguage(langCode);
      navigation.goBack();
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  return (
    <>
      {/* 🔧 [KIM FIX] Android 상태바 겹침 방지 - Appbar.Header 패턴 사용 */}
      <Appbar.Header style={{ backgroundColor: paperTheme.colors.surface }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('profile.languageSettings')} />
      </Appbar.Header>
      <SafeAreaView
        style={[styles.container, { backgroundColor: isDark ? '#000' : '#f5f5f5' }]}
        edges={['bottom', 'left', 'right']}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDark ? '#fff' : '#1F2937' }]}>
            {t('profile.languageSettings')}
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? 'rgba(255,255,255,0.7)' : '#6B7280' }]}>
            {t('profile.selectLanguage')}
          </Text>
        </View>

        {/* 2-Column Grid Layout for 10 Languages */}
        <ScrollView
          style={styles.languageScrollView}
          contentContainerStyle={styles.languageGrid}
          showsVerticalScrollIndicator={false}
        >
          {SUPPORTED_LANGUAGES.map(lang => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageCard,
                darkGlassStyle,
                currentLanguage === lang.code && {
                  borderColor: '#1976d2',
                  borderWidth: 2,
                  backgroundColor: isDark ? 'rgba(25, 118, 210, 0.2)' : '#f3f9ff',
                },
              ]}
              onPress={() => onSelectLanguage(lang.code)}
              activeOpacity={0.7}
            >
              <Text style={styles.cardFlag}>{lang.flag}</Text>
              <Text
                style={[
                  styles.cardNativeName,
                  { color: isDark ? '#fff' : '#1F2937' },
                  currentLanguage === lang.code && styles.selectedText,
                ]}
                numberOfLines={1}
              >
                {lang.nativeName}
              </Text>
              {currentLanguage === lang.code && (
                <View style={styles.cardCheckmark}>
                  <Ionicons name='checkmark-circle' size={20} color='#1976d2' />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <Text
            style={[styles.footerText, { color: isDark ? 'rgba(255,255,255,0.5)' : '#6B7280' }]}
          >
            {t('profile.languageChangeNote')}
          </Text>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  // 2-column grid styles - compact for 10 languages without scroll
  languageScrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    paddingBottom: 10,
  },
  languageCard: {
    width: '48%',
    paddingVertical: 10,
    paddingHorizontal: 8,
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
  },
  selectedText: {
    color: '#1976d2',
  },
  footer: {
    padding: 12,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default LanguageSelectionScreen;
