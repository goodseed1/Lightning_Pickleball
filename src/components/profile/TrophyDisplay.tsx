/**
 * 🏆 Trophy Display Component
 * Iron Man's Masterpiece with react-native-vector-icons
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Trophy } from '../../types/user';
import { useLanguage } from '../../contexts/LanguageContext';

interface TrophyDisplayProps {
  trophy: Trophy;
}

const TrophyDisplay: React.FC<TrophyDisplayProps> = ({ trophy }) => {
  const { t, currentLanguage } = useLanguage();
  const [resolvedClubName, setResolvedClubName] = useState<string | undefined>(trophy.clubName);

  useEffect(() => {
    const fetchClubName = async () => {
      // Only fetch if clubName is missing or "Unknown Club"
      if (!trophy.clubId || (trophy.clubName && trophy.clubName !== 'Unknown Club')) {
        return;
      }

      try {
        const clubDoc = await getDoc(doc(db, 'pickleball_clubs', trophy.clubId));
        if (clubDoc.exists()) {
          const clubData = clubDoc.data();
          const clubName = clubData.profile?.name || clubData.name || 'Unknown Club';
          setResolvedClubName(clubName);
        }
      } catch (error) {
        console.error('[TrophyDisplay] Failed to fetch club name:', error);
      }
    };

    fetchClubName();
  }, [trophy.clubId, trophy.clubName]);
  const getTrophyColor = (rank: string) => {
    if (rank === 'Winner' || trophy.type === 'tournament_winner') {
      return '#FFD700'; // Gold
    }
    if (rank === 'Runner-up' || trophy.type === 'tournament_runnerup') {
      return '#C0C0C0'; // Silver
    }
    return '#CD7F32'; // Bronze
  };

  const getTrophyIcon = (rank: string) => {
    if (rank === 'Winner' || trophy.type === 'tournament_winner') {
      return 'trophy';
    }
    return 'medal-outline';
  };

  const color = getTrophyColor(trophy.rank || '');
  const iconName = getTrophyIcon(trophy.rank || '');

  // Format date with user's locale
  const formatDate = (timestamp: Timestamp | string | Date | { toDate: () => Date } | undefined) => {
    if (!timestamp) return '';
    let date: Date;
    if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if ('toDate' in timestamp && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else {
      date = new Date();
    }
    // Map language code to locale
    const localeMap: Record<string, string> = {
      ko: 'ko-KR',
      en: 'en-US',
      ja: 'ja-JP',
      zh: 'zh-CN',
      ru: 'ru-RU',
      de: 'de-DE',
      fr: 'fr-FR',
      es: 'es-ES',
      it: 'it-IT',
      pt: 'pt-BR',
    };
    const locale = localeMap[currentLanguage] || 'en-US';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get translated rank display
  const getRankDisplay = () => {
    // If trophy.rank is stored (e.g., "Winner"), translate it
    const rankValue: string = trophy.rank || (trophy.type === 'tournament_winner' ? 'Winner' : 'Runner-up');
    const winnerValues = ['Winner', '우승', 'winner'];
    const runnerUpValues = ['Runner-up', '준우승', 'runner-up'];
    if (winnerValues.includes(rankValue)) {
      return t('hallOfFame.winner');
    }
    if (runnerUpValues.includes(rankValue)) {
      return t('hallOfFame.runnerUp');
    }
    return rankValue;
  };

  return (
    <Card style={styles.card} mode='outlined'>
      <Card.Content style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name={iconName} size={40} color={color} />
        </View>
        <View style={styles.infoContainer}>
          <Text variant='titleMedium' style={styles.tournamentName}>
            {trophy.tournamentName}
          </Text>
          <Text variant='bodySmall' style={styles.clubName}>
            {resolvedClubName}
          </Text>
          <View style={styles.detailsRow}>
            <Text variant='bodySmall' style={[styles.rank, { color }]}>
              {getRankDisplay()}
            </Text>
            <Text variant='bodySmall' style={styles.date}>
              {formatDate(trophy.awardedAt)}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconContainer: {
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  tournamentName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  clubName: {
    opacity: 0.7,
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rank: {
    fontWeight: '600',
  },
  date: {
    opacity: 0.6,
    fontSize: 12,
  },
});

export default TrophyDisplay;
