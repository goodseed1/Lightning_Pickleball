/**
 * EventResultCard - AI 검색 결과 이벤트 카드
 * AI가 검색한 경기 결과를 시각적으로 표시
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, useTheme, Icon } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import type { EventData } from '../../types/ai';

interface EventResultCardProps {
  events: EventData[];
  language?: 'ko' | 'en';
}

const EventResultCard: React.FC<EventResultCardProps> = ({ events, language = 'ko' }) => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();

  if (!events || events.length === 0) {
    return null;
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString(language === 'ko' ? 'ko-KR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getGameTypeLabel = (gameType: string) => {
    const typeMap: Record<string, string> = {
      singles: 'mens_singles',
      doubles: 'mens_doubles',
      mixed: 'mixed_doubles',
    };
    const mappedType = typeMap[gameType] || gameType;
    return t(`types.tournament.eventTypes.${mappedType}` as const);
  };

  const handleEventPress = (eventId: string) => {
    // @ts-expect-error - navigation type
    navigation.navigate('EventDetail', { eventId });
  };

  return (
    <View style={styles.container}>
      {events.slice(0, 3).map(event => (
        <TouchableOpacity key={event.id} onPress={() => handleEventPress(event.id)}>
          <Card style={[styles.card, { backgroundColor: colors.surfaceVariant }]}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.onSurface }]} numberOfLines={1}>
                  {event.title}
                </Text>
                <View style={[styles.badge, { backgroundColor: colors.primaryContainer }]}>
                  <Text style={[styles.badgeText, { color: colors.onPrimaryContainer }]}>
                    {getGameTypeLabel(event.gameType)}
                  </Text>
                </View>
              </View>

              <View style={styles.details}>
                <View style={styles.detailRow}>
                  <Icon source='calendar' size={16} color={colors.onSurfaceVariant} />
                  <Text style={[styles.detailText, { color: colors.onSurfaceVariant }]}>
                    {formatDate(event.startTime)} {formatTime(event.startTime)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Icon source='map-marker' size={16} color={colors.onSurfaceVariant} />
                  <Text
                    style={[styles.detailText, { color: colors.onSurfaceVariant }]}
                    numberOfLines={1}
                  >
                    {event.location}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Icon source='account-group' size={16} color={colors.onSurfaceVariant} />
                  <Text style={[styles.detailText, { color: colors.onSurfaceVariant }]}>
                    {event.currentPlayers}/{event.maxPlayers} {t('modals.eventResultCard.players')}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </TouchableOpacity>
      ))}

      {events.length > 3 && (
        <Text style={[styles.moreText, { color: colors.primary }]}>
          {t('modals.eventResultCard.more', { count: events.length - 3 })}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    gap: 8,
  },
  card: {
    borderRadius: 12,
  },
  cardContent: {
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  details: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    flex: 1,
  },
  moreText: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 4,
  },
});

export default EventResultCard;
