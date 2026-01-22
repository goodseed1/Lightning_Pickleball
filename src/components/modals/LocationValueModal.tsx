import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

export type LocationTriggerContext = 'events' | 'players' | 'clubs' | 'general';

interface LocationValueModalProps {
  visible: boolean;
  onRequestPermission: () => void;
  onSkip?: () => void; // 🍎 [Guideline 5.1.1] Optional - no longer used (kept for backward compatibility)
  triggerContext?: LocationTriggerContext;
}

interface ValuePoint {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  titleKey: string;
  descriptionKey: string;
}

const VALUE_POINTS: ValuePoint[] = [
  {
    icon: 'location-outline',
    iconColor: '#4CAF50',
    titleKey: 'location.valueModal.point1Title',
    descriptionKey: 'location.valueModal.point1Description',
  },
  // 🎯 [KIM FIX] Global Exposure Warning 제거됨 (사용자 요청)
  {
    icon: 'calendar-outline',
    iconColor: '#2196F3',
    titleKey: 'location.valueModal.point3Title',
    descriptionKey: 'location.valueModal.point3Description',
  },
  {
    icon: 'people-outline',
    iconColor: '#9C27B0',
    titleKey: 'location.valueModal.point4Title',
    descriptionKey: 'location.valueModal.point4Description',
  },
  {
    icon: 'settings-outline',
    iconColor: '#607D8B',
    titleKey: 'location.valueModal.point5Title',
    descriptionKey: 'location.valueModal.point5Description',
  },
];

// Fallback translations for when i18n keys are not yet added
// 🎯 [KIM FIX] Global Exposure Warning (point2) 제거됨
const FALLBACK_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    'location.valueModal.title': 'Enable Location Services',
    'location.valueModal.subtitle': 'Get the best experience with location enabled',
    'location.valueModal.point1Title': 'Approximate Location Only',
    'location.valueModal.point1Description':
      'We only use your general area to match you with nearby players - not your exact GPS location.',
    'location.valueModal.point3Title': 'Event Visibility',
    'location.valueModal.point3Description':
      'Events you create will be shown to players far away, who may not be able to attend.',
    'location.valueModal.point4Title': 'Club Discovery',
    'location.valueModal.point4Description':
      'Clubs you join will be visible to distant players, reducing local community focus.',
    'location.valueModal.point5Title': 'Unit Settings',
    'location.valueModal.point5Description':
      'Distance, weather, and currency units may display incorrectly without your location.',
    'location.valueModal.allowButton': 'Continue',
    'location.valueModal.skipButton': 'Maybe Later',
  },
  ko: {
    'location.valueModal.title': '위치 서비스 활성화',
    'location.valueModal.subtitle': '위치를 활성화하면 최상의 경험을 할 수 있습니다',
    'location.valueModal.point1Title': '근접 위치만 사용',
    'location.valueModal.point1Description':
      '정확한 GPS가 아닌 대략적인 지역만 사용하여 근처 플레이어와 매칭합니다.',
    'location.valueModal.point3Title': '이벤트 가시성',
    'location.valueModal.point3Description':
      '생성한 이벤트가 참석할 수 없는 먼 곳의 플레이어에게도 표시됩니다.',
    'location.valueModal.point4Title': '클럽 탐색',
    'location.valueModal.point4Description':
      '가입한 클럽이 먼 곳의 플레이어에게도 표시되어 지역 커뮤니티 집중도가 낮아집니다.',
    'location.valueModal.point5Title': '단위 설정',
    'location.valueModal.point5Description':
      '위치 없이는 거리, 날씨, 통화 단위가 잘못 표시될 수 있습니다.',
    'location.valueModal.allowButton': '계속',
    'location.valueModal.skipButton': '나중에',
  },
};

export const LocationValueModal: React.FC<LocationValueModalProps> = ({
  visible,
  onRequestPermission,
  onSkip,
}) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();

  // Helper function to get translation with fallback
  const getText = (key: string): string => {
    const translated = t(key);
    // If i18n returns the key itself, use fallback
    if (translated === key) {
      const lang = i18n.language?.startsWith('ko') ? 'ko' : 'en';
      return FALLBACK_TRANSLATIONS[lang]?.[key] || key;
    }
    return translated;
  };

  return (
    <Modal visible={visible} animationType='slide' transparent={false} onRequestClose={onSkip}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Location Icon */}
          <View style={styles.header}>
            <View
              style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}
            >
              <Ionicons name='location' size={60} color={theme.colors.primary} />
            </View>
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>
              {getText('location.valueModal.title')}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              {getText('location.valueModal.subtitle')}
            </Text>
          </View>

          {/* Value Points */}
          <View style={styles.valuePointsContainer}>
            {VALUE_POINTS.map((point, index) => (
              <View
                key={index}
                style={[styles.valuePoint, { backgroundColor: theme.colors.surfaceVariant }]}
              >
                <View style={[styles.valuePointIcon, { backgroundColor: `${point.iconColor}20` }]}>
                  <Ionicons name={point.icon} size={24} color={point.iconColor} />
                </View>
                <View style={styles.valuePointContent}>
                  <Text style={[styles.valuePointTitle, { color: theme.colors.onSurface }]}>
                    {getText(point.titleKey)}
                  </Text>
                  <Text
                    style={[styles.valuePointDescription, { color: theme.colors.onSurfaceVariant }]}
                  >
                    {getText(point.descriptionKey)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={[styles.buttonContainer, { backgroundColor: theme.colors.background }]}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
            onPress={onRequestPermission}
          >
            <Ionicons name='location' size={20} color={theme.colors.onPrimary} />
            <Text style={[styles.primaryButtonText, { color: theme.colors.onPrimary }]}>
              {getText('location.valueModal.allowButton')}
            </Text>
          </TouchableOpacity>

          {/* 🎯 [KIM FIX v12] Apple Guideline 5.1.1 - "Maybe Later" 버튼 제거됨 */}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  valuePointsContainer: {
    gap: 12,
  },
  valuePoint: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  valuePointIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  valuePointContent: {
    flex: 1,
  },
  valuePointTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  valuePointDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttonContainer: {
    padding: 24,
    paddingBottom: 32,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LocationValueModal;
