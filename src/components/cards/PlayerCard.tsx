/**
 * 📝 LTR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LTR" (Lightning Tennis Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LTR로 변경하고 코드는 ntrp를 유지합니다.
 */
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Card, Button, Avatar } from 'react-native-paper';
import { useTheme } from '../../hooks/useTheme';
import { getLightningTennisTheme } from '../../theme';
import { useTranslation } from 'react-i18next';
import { getNtrpDescription, getNtrpDescriptionFromRange } from '../../utils/eloUtils';
import { convertEloToLtr } from '../../utils/ltrUtils';
import InfoTag from '../common/InfoTag';
import StatIcon from '../common/StatIcon';
import StatusChip from '../common/StatusChip';

// 🎯 [KIM FIX] US 주 이름을 2글자 약어로 변환 (Georgia -> GA)
const US_STATE_ABBREVIATIONS: Record<string, string> = {
  Alabama: 'AL',
  Alaska: 'AK',
  Arizona: 'AZ',
  Arkansas: 'AR',
  California: 'CA',
  Colorado: 'CO',
  Connecticut: 'CT',
  Delaware: 'DE',
  Florida: 'FL',
  Georgia: 'GA',
  Hawaii: 'HI',
  Idaho: 'ID',
  Illinois: 'IL',
  Indiana: 'IN',
  Iowa: 'IA',
  Kansas: 'KS',
  Kentucky: 'KY',
  Louisiana: 'LA',
  Maine: 'ME',
  Maryland: 'MD',
  Massachusetts: 'MA',
  Michigan: 'MI',
  Minnesota: 'MN',
  Mississippi: 'MS',
  Missouri: 'MO',
  Montana: 'MT',
  Nebraska: 'NE',
  Nevada: 'NV',
  'New Hampshire': 'NH',
  'New Jersey': 'NJ',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'North Dakota': 'ND',
  Ohio: 'OH',
  Oklahoma: 'OK',
  Oregon: 'OR',
  Pennsylvania: 'PA',
  'Rhode Island': 'RI',
  'South Carolina': 'SC',
  'South Dakota': 'SD',
  Tennessee: 'TN',
  Texas: 'TX',
  Utah: 'UT',
  Vermont: 'VT',
  Virginia: 'VA',
  Washington: 'WA',
  'West Virginia': 'WV',
  Wisconsin: 'WI',
  Wyoming: 'WY',
  'District of Columbia': 'DC',
};

const getStateAbbreviation = (state: string): string => {
  if (!state) return '';
  // 이미 2글자 약어인 경우 그대로 반환
  if (state.length === 2 && state === state.toUpperCase()) return state;
  // 전체 이름인 경우 약어로 변환
  return US_STATE_ABBREVIATIONS[state] || state;
};

interface PlayerCardProps {
  player: {
    id: string;
    name: string;
    avatar?: string;
    skillLevel:
      | number
      | { calculated?: number; selfAssessed?: string; confidence?: number }
      | { selfAssessed: string }; // Support both legacy number and new object structure
    distance: number | null;
    formattedDistance?: string | null; // Pre-calculated by DiscoveryContext
    isOnline: boolean;
    bio?: string;
    matchCount: number;
    winRate: number;
    location?: {
      latitude: number;
      longitude: number;
    };
    profile?: {
      location?: {
        address?: string;
        city?: string;
        state?: string;
        country?: string;
        latitude?: number;
        longitude?: number;
      };
      gender?: string;
    };
    preferredTimeSlots: string[];
    // 🎯 [KIM FIX v19] Singles LTR (1-10 scale) for quick match display
    singlesLtr?: number;
    // 🎾 ELO-based LTR display
    singlesElo?: number;
  };
  // 🎯 [KIM FIX] Current user info for quick match eligibility check
  currentUserNtrp?: number;
  currentUserGender?: string;
  // 🎯 [KIM FIX] Disable quick match button for current user's own card
  isCurrentUser?: boolean;
  onPress: () => void;
  onAction?: () => void;
  onQuickMatch?: () => void;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  currentUserNtrp,
  currentUserGender,
  isCurrentUser,
  onPress,
  onAction,
  onQuickMatch,
}) => {
  const { theme, isThemeReady } = useTheme();
  const { t } = useTranslation();

  // Defensive programming: ensure theme is ready and valid
  const safeTheme = theme || 'dark';
  const themeColors = getLightningTennisTheme(safeTheme);

  // Don't render until theme is ready
  if (!isThemeReady || !themeColors) {
    return null;
  }

  const getSkillLevelText = (): string => {
    // Use calculated value if available and reliable
    if (typeof player.skillLevel === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const skillObj = player.skillLevel as any;
      if (skillObj?.calculated && skillObj?.confidence && skillObj.confidence > 0.7) {
        return getNtrpDescription(skillObj.calculated, t);
      }
    }
    // 🎯 [KIM FIX] Fall back to self-assessed value using getNtrpDescriptionFromRange
    if (typeof player.skillLevel === 'object' && player.skillLevel?.selfAssessed) {
      return getNtrpDescriptionFromRange(player.skillLevel.selfAssessed, t);
    }
    // Legacy numeric skillLevel support
    if (typeof player.skillLevel === 'number') {
      const levels = [
        t('playerCard.beginner'),
        t('playerCard.intermediate'),
        t('playerCard.advanced'),
        t('playerCard.expert'),
      ];
      return levels[Math.min(player.skillLevel - 1, 3)] || levels[0];
    }
    // 🎯 [KIM FIX] No NTRP data - return "없음" / "N/A"
    return t('playerCard.notAvailable');
  };

  // 🎯 [KIM FIX v19] Get player's LTR value for comparison
  const getPlayerNtrp = (): number | undefined => {
    if (player.singlesLtr) return player.singlesLtr;
    if (typeof player.skillLevel === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const skillObj = player.skillLevel as any;
      if (skillObj?.calculated && skillObj?.confidence && skillObj.confidence > 0.7) {
        return skillObj.calculated;
      }
    }
    if (typeof player.skillLevel === 'object' && player.skillLevel?.selfAssessed) {
      return parseFloat(player.skillLevel.selfAssessed.split('-')[0]);
    }
    return undefined;
  };

  // 🎯 [KIM FIX] Check quick match eligibility (same gender, NTRP within ±0.5)
  const isQuickMatchEligible = (): boolean => {
    // 🎯 [KIM FIX] Disable quick match for current user's own card
    if (isCurrentUser) {
      return false;
    }

    const playerNtrp = getPlayerNtrp();
    const playerGender = player.profile?.gender;

    // 🎯 [KIM FIX] If player has no NTRP data, disable quick match
    if (!playerNtrp) {
      return false;
    }

    // If current user info not provided, allow (for backward compatibility)
    if (!currentUserNtrp || !currentUserGender) return true;

    // 🎯 [KIM FIX] Gender check - only apply when BOTH users have specific gender (male/female)
    // If either user has no gender or non-binary gender, allow quick match
    const specificGenders = ['male', 'female', '남성', '여성'];
    const currentUserHasSpecificGender = specificGenders.includes(currentUserGender.toLowerCase());
    const playerHasSpecificGender =
      playerGender && specificGenders.includes(playerGender.toLowerCase());

    if (currentUserHasSpecificGender && playerHasSpecificGender) {
      // Both have specific genders - must match
      if (playerGender.toLowerCase() !== currentUserGender.toLowerCase()) {
        return false;
      }
    }
    // If either doesn't have specific gender, skip gender check

    // 🎯 [KIM FIX] Check LTR difference within ±2 (LTR uses 1-10 scale, not NTRP)
    if (Math.abs(playerNtrp - currentUserNtrp) > 2) {
      return false;
    }

    return true;
  };

  const quickMatchEnabled = isQuickMatchEligible();

  const getNtrpChipVariant = (): 'info' | 'success' | 'warning' | 'default' => {
    // 🎯 [KIM FIX] Use getPlayerNtrp() to check if NTRP exists
    const playerNtrp = getPlayerNtrp();

    // No NTRP data - return default (neutral) variant
    if (!playerNtrp) {
      return 'default';
    }

    // Map NTRP levels to visual variants with semantic color progression
    if (playerNtrp < 2.5) return 'info'; // Entry/Beginner: Blue tones
    if (playerNtrp < 3.5) return 'success'; // Intermediate: Green tones
    if (playerNtrp < 4.5) return 'warning'; // Advanced: Amber tones
    return 'default'; // Expert/Pro: Default (theme-appropriate in dark mode)
  };

  // 🎯 [KIM FIX] Get singles LTR display text with (단식) label
  // ⚡ LTR Display - Use ELO-based calculation for consistency
  const getSinglesLtrDisplay = (): string => {
    // Use ELO-based LTR if available (accurate, from actual matches)
    if (player.singlesElo && player.singlesElo > 0) {
      const ltrLevel = convertEloToLtr(player.singlesElo);
      return `LTR ${ltrLevel} (${t('playerCard.singles')})`;
    }
    // Fallback to skill level text if no ELO data
    return getSkillLevelText();
  };

  const getOnlineStatusChip = () => {
    if (player.isOnline) {
      return <StatusChip text={t('playerCard.online')} variant='success' emoji='🟢' />;
    } else {
      // 🎯 [KIM FIX] Show singles NTRP with (단식) label
      return <StatusChip text={getSinglesLtrDisplay()} variant={getNtrpChipVariant()} emoji='🎾' />;
    }
  };

  const getTags = (): string[] => {
    const tags = [];
    if (player.preferredTimeSlots.length > 0) {
      const timeSlot = player.preferredTimeSlots[0]?.split(' ')[0];
      if (timeSlot) {
        tags.push(`#${timeSlot}`);
      }
    }
    tags.push(`#${getSkillLevelText()}`);
    if (player.winRate > 60) {
      tags.push(`#${t('playerCard.skilled')}`);
    }
    return tags;
  };

  // Create dynamic styles based on current theme
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const styles = createStyles(themeColors.colors as any);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <Card style={styles.card}>
        {/* 1. Header: Player info + Status */}
        <View style={styles.header}>
          {/* 🎯 [KIM FIX] Show Avatar.Image if player has avatar, otherwise fallback to Avatar.Text */}
          {player.avatar ? (
            <Avatar.Image size={48} source={{ uri: player.avatar }} style={styles.avatar} />
          ) : (
            <Avatar.Text
              size={48}
              label={player.name.charAt(0).toUpperCase()}
              style={styles.avatar}
            />
          )}
          <View style={styles.playerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.title}>{player.name}</Text>
              {/* 🎯 [KIM FIX] Show gender icon only for male/female */}
              {(player.profile?.gender === 'male' ||
                player.profile?.gender === '남성' ||
                player.profile?.gender === 'female' ||
                player.profile?.gender === '여성') && (
                <Text
                  style={{
                    marginLeft: 6,
                    fontSize: 14,
                    color:
                      player.profile?.gender === 'male' || player.profile?.gender === '남성'
                        ? '#4A90D9'
                        : '#E91E8C',
                  }}
                >
                  {player.profile?.gender === 'male' || player.profile?.gender === '남성'
                    ? '♂'
                    : '♀'}
                </Text>
              )}
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.statsText}>
                {t('playerCard.matchStatsFormat', {
                  count: player.matchCount,
                  winRate: player.winRate,
                })}
              </Text>
            </View>
            <View style={styles.winRateBar}>
              <View style={[styles.winRateFill, { width: `${player.winRate}%` }]} />
            </View>
          </View>
          {getOnlineStatusChip()}
        </View>

        {/* 2. Body: Core information and Action */}
        <Card.Content style={styles.body}>
          <View style={styles.locationAndAction}>
            <View style={styles.locationInfo}>
              {/* 🎯 [KIM FIX] City, State + distance format */}
              {(() => {
                const city = player.profile?.location?.city;
                const state = player.profile?.location?.state;
                const distance = player.formattedDistance;

                // Build location text: "City, State" format only (no full address)
                let locationText = '';
                if (city && state) {
                  locationText = `${city}, ${getStateAbbreviation(state)}`;
                } else if (city) {
                  locationText = city;
                }

                // Combine location + distance
                let displayText = '';
                if (locationText && distance) {
                  displayText = `${locationText} • ${distance}`;
                } else if (locationText) {
                  displayText = locationText;
                } else if (distance) {
                  displayText = distance;
                }

                if (displayText) {
                  return (
                    <StatIcon
                      icon='location-outline'
                      text={displayText}
                      color={themeColors.colors.onSurfaceVariant}
                      size={16}
                    />
                  );
                }

                // No location or distance available
                return (
                  <>
                    <StatIcon
                      icon='location-outline'
                      text={t('playerCard.locationNotAvailable')}
                      color={themeColors.colors.outline}
                      size={16}
                    />
                    <View style={styles.tagContainer}>
                      {getTags()
                        .slice(0, 2)
                        .map((tag, index) => (
                          <InfoTag key={index} text={tag} />
                        ))}
                    </View>
                  </>
                );
              })()}
            </View>
            <Button
              mode='contained'
              onPress={onQuickMatch || onAction || onPress}
              style={styles.circularButton}
              labelStyle={styles.circularButtonLabel}
              buttonColor={
                quickMatchEnabled ? themeColors.colors.primary : themeColors.colors.outline
              }
              disabled={!quickMatchEnabled}
              compact
            >
              ⚡
            </Button>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const createStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    card: {
      marginBottom: 12,
      borderRadius: 12,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      backgroundColor: colors.surface,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
    },
    avatar: {
      backgroundColor: colors.primary,
      marginRight: 12,
    },
    playerInfo: {
      flex: 1,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.onSurface,
      marginBottom: 4,
    },
    statsRow: {
      marginBottom: 6,
    },
    statsText: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
    },
    winRateBar: {
      height: 4,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 2,
      overflow: 'hidden',
    },
    winRateFill: {
      height: '100%',
      backgroundColor: colors.success || colors.primary,
      borderRadius: 2,
    },
    body: {
      paddingTop: 0,
      paddingBottom: 16,
    },
    locationAndAction: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    locationInfo: {
      flex: 1,
    },
    tagContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 8,
    },
    circularButton: {
      borderRadius: 20,
      width: 40,
      height: 40,
      marginLeft: 12,
    },
    circularButtonLabel: {
      fontSize: 18,
      margin: 0,
    },
  });

export default PlayerCard;
