/**
 * BadgeGallery 컴포넌트
 * 사용자의 획득한 배지들을 그리드 형태로 표시하는 컴포넌트
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  getDocs,
  query,
  orderBy,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * 배지 정보 타입
 */

interface Badge {
  id: string;
  type?: string;
  achievedAt?: string;
  tier: string;
  // 🔧 [FIX] unlockedAt 지원 추가 (matchBadgeChecker에서 사용하는 필드)
  unlockedAt?: {
    toDate?: () => Date;
    seconds?: number;
  };
  earnedAt?: {
    toDate?: () => Date;
    seconds?: number;
  };
  name: {
    ko: string;
    en: string;
  };
  description: {
    ko: string;
    en: string;
  };
  icon: string;
  iconColor: string;
  category: string;
  rarity: string;
  source?: {
    details?: string;
  };
}

interface BadgeGalleryProps {
  userId?: string | null;
  showTitle?: boolean;
  maxColumns?: number;
  maxBadges?: number | null;
}
// Helper function to get badge definition with i18n support
const getBadgeDefinition = (badgeId: string, t: (key: string) => string) => {
  const iconMap: Record<
    string,
    { icon: string; iconColor: string; category: string; rarity: string; tier: string }
  > = {
    first_victory: {
      icon: '🏆',
      iconColor: '#ffc107',
      category: 'match',
      rarity: 'common',
      tier: 'bronze',
    },
    first_club_join: {
      icon: '🏟️',
      iconColor: '#4caf50',
      category: 'club',
      rarity: 'common',
      tier: 'bronze',
    },
    streak_5: {
      icon: '🔥',
      iconColor: '#ff5722',
      category: 'match',
      rarity: 'rare',
      tier: 'silver',
    },
    social_butterfly: {
      icon: '🦋',
      iconColor: '#e91e63',
      category: 'social',
      rarity: 'rare',
      tier: 'silver',
    },
    tournament_champion: {
      icon: '👑',
      iconColor: '#ff9800',
      category: 'tournament',
      rarity: 'epic',
      tier: 'gold',
    },
    league_master: {
      icon: '⚡',
      iconColor: '#2196f3',
      category: 'league',
      rarity: 'epic',
      tier: 'gold',
    },
    league_champion: {
      icon: '👑',
      iconColor: '#ffd700',
      category: 'league',
      rarity: 'epic',
      tier: 'gold',
    },
    perfect_season: {
      icon: '💎',
      iconColor: '#9c27b0',
      category: 'achievement',
      rarity: 'legendary',
      tier: 'platinum',
    },
    community_leader: {
      icon: '🌟',
      iconColor: '#00bcd4',
      category: 'leadership',
      rarity: 'epic',
      tier: 'gold',
    },
  };

  const iconDef = iconMap[badgeId] || {
    icon: '🏅',
    iconColor: '#666',
    category: 'unknown',
    rarity: 'common',
    tier: 'bronze',
  };

  return {
    name: {
      ko: t(`badgeGallery.badges.${badgeId}.name`),
      en: t(`badgeGallery.badges.${badgeId}.name`),
    },
    description: {
      ko: t(`badgeGallery.badges.${badgeId}.description`),
      en: t(`badgeGallery.badges.${badgeId}.description`),
    },
    ...iconDef,
  };
};

/**
 * 배지 등급별 스타일
 */
const TIER_STYLES = {
  bronze: {
    backgroundColor: '#cd7f32',
    glowColor: '#cd7f32',
    borderColor: '#b8722c',
  },
  silver: {
    backgroundColor: '#c0c0c0',
    glowColor: '#c0c0c0',
    borderColor: '#a8a8a8',
  },
  gold: {
    backgroundColor: '#ffd700',
    glowColor: '#ffd700',
    borderColor: '#e6c200',
  },
  platinum: {
    backgroundColor: '#e5e4e2',
    glowColor: '#e5e4e2',
    borderColor: '#b8b8b8',
  },
};

const BadgeGallery: React.FC<BadgeGalleryProps> = ({
  userId = null, // null이면 현재 사용자, 특정 userId를 전달하면 해당 사용자
  showTitle = true,
  maxColumns = 4,
  maxBadges = null,
}) => {
  const { user } = useAuth();
  const { currentLanguage, t } = useLanguage();

  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // 표시할 사용자 ID 결정
  const targetUserId = userId || user?.uid;
  const isOwnProfile = !userId || userId === user?.uid;

  /**
   * Firebase 쿼리를 타임아웃과 함께 실행하는 헬퍼 함수
   */
  const executeWithTimeout = <T,>(promise: Promise<T>, timeoutMs = 10000): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Firebase query timeout')), timeoutMs)
      ),
    ]);
  };

  /**
   * 사용자의 배지 정보 로드 - 강화된 에러 핸들링 및 디버깅
   */
  const loadUserBadges = useCallback(async () => {
    console.log('--- 🎖️ BADGE SERVICE: STARTING FETCH ---');
    console.log(`🔍 Target User ID: ${targetUserId}`);
    console.log(`🔍 Current User: ${user?.uid || 'undefined'}`);
    console.log(`🔍 Is Own Profile: ${isOwnProfile}`);

    // 사용자 ID 유효성 검사
    if (!targetUserId) {
      console.error('❌ BADGE SERVICE ERROR: No target user ID provided');
      setLoading(false);
      setBadges([]);
      return;
    }

    setLoading(true);

    try {
      console.log('📡 FIREBASE: Constructing query...');

      // Firebase 레퍼런스 생성
      // 🔧 [FIX] badges 컬렉션에서 읽기 (matchBadgeChecker, leagueBadgeChecker 등에서 저장하는 위치)
      const badgesRef = collection(db, 'users', targetUserId, 'badges');
      console.log(`📡 FIREBASE: Query path - users/${targetUserId}/badges`);

      // 쿼리 생성
      // 🔧 [FIX] badges 컬렉션에서는 unlockedAt으로 정렬 (matchBadgeChecker에서 사용하는 필드)
      const q = query(badgesRef, orderBy('unlockedAt', 'desc'));
      console.log('📡 FIREBASE: Query created with orderBy unlockedAt desc');

      // 타임아웃과 함께 쿼리 실행
      console.log('⏱️ FIREBASE: Executing query with 10s timeout...');
      const querySnapshot = await executeWithTimeout(getDocs(q));
      console.log(
        `✅ FIREBASE: Query executed successfully, ${querySnapshot.size} documents found`
      );

      const userBadges: Badge[] = [];

      if (querySnapshot.empty) {
        console.log('📝 FIREBASE: No achievements found for user');
      } else {
        console.log('🔄 PROCESSING: Starting badge processing...');

        let index = 0;
        querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
          console.log(`🔄 PROCESSING: Badge ${index + 1}/${querySnapshot.size} - ${doc.id}`);

          // 🔧 [FIX] matchBadgeChecker에서 저장하는 형식 지원
          const badgeData = doc.data() as {
            // Old format (achievements collection)
            earnedAt?: unknown;
            source?: string | { details?: string };
            // New format (badges collection from matchBadgeChecker)
            unlockedAt?: unknown;
            createdAt?: unknown;
            name?: string;
            nameKo?: string;
            description?: string;
            descriptionKo?: string;
            icon?: string;
            tier?: string;
            category?: string;
            clubName?: string;
            leagueId?: string;
          };
          const badgeId = doc.id;

          // 배지 데이터 로깅
          console.log(`📋 Badge Data:`, {
            id: badgeId,
            unlockedAt: badgeData.unlockedAt,
            earnedAt: badgeData.earnedAt,
            name: badgeData.name,
            nameKo: badgeData.nameKo,
            tier: badgeData.tier,
          });

          // 배지 정의에서 정보 가져오기
          const badgeDefinition = getBadgeDefinition(badgeId, t);

          console.log(`✅ Badge definition found for ${badgeId}`);
          const badge: Badge = {
            id: badgeId,
            // 🔧 [FIX] unlockedAt 또는 earnedAt 사용
            unlockedAt: badgeData.unlockedAt as Badge['unlockedAt'],
            earnedAt: badgeData.earnedAt as Badge['earnedAt'],
            source:
              typeof badgeData.source === 'string'
                ? { details: badgeData.source }
                : badgeData.clubName
                  ? { details: badgeData.clubName }
                  : badgeData.source,
            tier: badgeData.tier || badgeDefinition.tier,
            name: badgeDefinition.name,
            description: badgeDefinition.description,
            icon: badgeDefinition.icon,
            iconColor: badgeDefinition.iconColor,
            category: badgeDefinition.category,
            rarity: badgeDefinition.rarity,
          };
          userBadges.push(badge);
          index++;
        });
      }

      // maxBadges가 설정되어 있으면 제한
      const displayBadges = maxBadges ? userBadges.slice(0, maxBadges) : userBadges;
      console.log(
        `🎯 FINAL RESULT: ${userBadges.length} total badges, displaying ${displayBadges.length}`
      );

      setBadges(displayBadges);
      console.log('✅ SUCCESS: Badges state updated successfully');
    } catch (error: unknown) {
      console.error('--- 🎖️ BADGE SERVICE ERROR ---');
      const err = error as { name?: string; message?: string; code?: string };
      console.error('Error type:', err.name);
      console.error('Error message:', err.message);
      console.error('Full error:', error);

      // 에러 타입별 처리
      if (err.message === 'Firebase query timeout') {
        console.error('🕐 TIMEOUT: Firebase query timed out after 10 seconds');
        Alert.alert(t('badgeGallery.alerts.timeoutTitle'), t('badgeGallery.alerts.timeoutMessage'));
      } else if (err.code === 'permission-denied') {
        console.error('🚫 PERMISSIONS: Access denied to achievements collection');
        Alert.alert(
          t('badgeGallery.alerts.permissionTitle'),
          t('badgeGallery.alerts.permissionMessage')
        );
      } else if (err.code === 'unavailable') {
        console.error('🌐 NETWORK: Firebase service unavailable');
        Alert.alert(
          t('badgeGallery.alerts.unavailableTitle'),
          t('badgeGallery.alerts.unavailableMessage')
        );
      } else {
        console.error('❓ UNKNOWN ERROR: Unexpected error occurred');
      }

      // Firebase 연결 실패 시 mock 데이터 사용
      console.log('🔄 FALLBACK: Using mock badge data due to Firebase error');
      const firstVictoryDef = getBadgeDefinition('first_victory', t);
      const firstClubJoinDef = getBadgeDefinition('first_club_join', t);

      const mockBadges: Badge[] = [
        {
          id: 'first_victory',
          earnedAt: {
            toDate: () => new Date('2024-01-15'),
            seconds: Math.floor(new Date('2024-01-15').getTime() / 1000),
          },
          source: { details: 'demo' },
          tier: 'bronze',
          name: firstVictoryDef.name,
          description: firstVictoryDef.description,
          icon: firstVictoryDef.icon,
          iconColor: firstVictoryDef.iconColor,
          category: firstVictoryDef.category,
          rarity: firstVictoryDef.rarity,
        },
        {
          id: 'first_club_join',
          earnedAt: {
            toDate: () => new Date('2024-02-01'),
            seconds: Math.floor(new Date('2024-02-01').getTime() / 1000),
          },
          source: { details: 'demo' },
          tier: 'bronze',
          name: firstClubJoinDef.name,
          description: firstClubJoinDef.description,
          icon: firstClubJoinDef.icon,
          iconColor: firstClubJoinDef.iconColor,
          category: firstClubJoinDef.category,
          rarity: firstClubJoinDef.rarity,
        },
      ];

      const fallbackBadges = maxBadges ? mockBadges.slice(0, maxBadges) : mockBadges;
      setBadges(fallbackBadges);
      console.log(`🔄 FALLBACK: Set ${fallbackBadges.length} mock badges`);
    } finally {
      // 💥 이 부분이 핵심! 💥
      // 성공하든 실패하든 항상 loading을 false로 설정
      console.log('--- 🎖️ BADGE SERVICE: FINISHING FETCH ---');
      console.log('⏹️ CLEANUP: Setting loading to false');
      setLoading(false);
      console.log('✅ CLEANUP: Badge loading process completed');
    }
  }, [targetUserId, user?.uid, isOwnProfile, currentLanguage, maxBadges, t]);

  useEffect(() => {
    if (targetUserId) {
      loadUserBadges();
    }
  }, [targetUserId, loadUserBadges]);

  /**
   * 배지 클릭 핸들러 - 상세 정보 모달 표시
   */
  const handleBadgePress = (badge: Badge) => {
    setSelectedBadge(badge);
    setModalVisible(true);
  };

  /**
   * 배지 그리드 아이템 렌더링
   */
  const renderBadgeItem = (badge: Badge) => {
    const tierStyle = TIER_STYLES[badge.tier as keyof typeof TIER_STYLES] || TIER_STYLES.bronze;

    return (
      <TouchableOpacity
        key={badge.id}
        style={[
          styles.badgeItem,
          {
            backgroundColor: tierStyle.backgroundColor,
            borderColor: tierStyle.borderColor,
            shadowColor: tierStyle.glowColor,
          },
        ]}
        onPress={() => handleBadgePress(badge)}
        activeOpacity={0.8}
      >
        <View style={styles.badgeIconContainer}>
          <Text style={[styles.badgeIcon, { color: badge.iconColor }]}>{badge.icon}</Text>
        </View>

        <View style={styles.badgeTierIndicator}>
          <View style={[styles.tierDot, { backgroundColor: tierStyle.borderColor }]} />
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * 배지 상세 모달 렌더링
   */
  const renderBadgeModal = () => {
    if (!selectedBadge) return null;

    const tierStyle =
      TIER_STYLES[selectedBadge.tier as keyof typeof TIER_STYLES] || TIER_STYLES.bronze;
    // 🔧 [FIX] unlockedAt 또는 earnedAt 사용
    const timestamp = selectedBadge.unlockedAt || selectedBadge.earnedAt;
    const earnedDate = timestamp?.toDate?.() || new Date((timestamp?.seconds ?? 0) * 1000);

    return (
      <Modal
        animationType='fade'
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderColor: tierStyle.borderColor }]}>
            {/* 닫기 버튼 */}
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Ionicons name='close' size={24} color='#666' />
            </TouchableOpacity>

            {/* 배지 아이콘 */}
            <View style={[styles.modalBadgeIcon, { backgroundColor: tierStyle.backgroundColor }]}>
              <Text style={[styles.modalBadgeIconText, { color: selectedBadge.iconColor }]}>
                {selectedBadge.icon}
              </Text>
            </View>

            {/* 배지 이름 */}
            <Text style={styles.modalBadgeName}>{selectedBadge.name[currentLanguage as 'ko' | 'en'] || selectedBadge.name.en}</Text>

            {/* 배지 등급 */}
            <View style={[styles.tierBadge, { backgroundColor: tierStyle.backgroundColor }]}>
              <Text style={styles.tierText}>{selectedBadge.tier.toUpperCase()}</Text>
            </View>

            {/* 배지 설명 */}
            <Text style={styles.modalBadgeDescription}>
              {selectedBadge.description[currentLanguage as 'ko' | 'en'] || selectedBadge.description.en}
            </Text>

            {/* 획득 정보 */}
            <View style={styles.badgeDetails}>
              <View style={styles.detailRow}>
                <Ionicons name='calendar-outline' size={16} color='#666' />
                <Text style={styles.detailText}>
                  {t('badgeGallery.modal.earned')}
                  {earnedDate.toLocaleDateString()}
                </Text>
              </View>

              {selectedBadge.source?.details && (
                <View style={styles.detailRow}>
                  <Ionicons name='information-circle-outline' size={16} color='#666' />
                  <Text style={styles.detailText}>{selectedBadge.source.details}</Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Ionicons name='trophy-outline' size={16} color='#666' />
                <Text style={styles.detailText}>
                  {t('badgeGallery.modal.category')}
                  {selectedBadge.category}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#1976d2' />
        <Text style={styles.loadingText}>{t('badgeGallery.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 제목 */}
      {showTitle && (
        <View style={styles.header}>
          <Text style={styles.title}>
            {isOwnProfile ? t('badgeGallery.titleOwn') : t('badgeGallery.titleOther')}
          </Text>
          <View style={styles.badgeCount}>
            <Ionicons name='trophy' size={16} color='#ffc107' />
            <Text style={styles.badgeCountText}>{badges.length}</Text>
          </View>
        </View>
      )}

      {/* 배지 그리드 */}
      {badges.length > 0 ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View
            style={[
              styles.badgeGrid,
              {
                // 그리드 열 수 계산
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: badges.length < maxColumns ? 'flex-start' : 'space-between',
              },
            ]}
          >
            {badges.map(badge => renderBadgeItem(badge))}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name='trophy-outline' size={48} color='#ddd' />
          <Text style={styles.emptyText}>
            {isOwnProfile ? t('badgeGallery.emptyOwn') : t('badgeGallery.emptyOther')}
          </Text>
          {isOwnProfile && <Text style={styles.emptySubtext}>{t('badgeGallery.emptyHint')}</Text>}
        </View>
      )}

      {/* 배지 상세 모달 */}
      {renderBadgeModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  badgeCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeCountText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  badgeGrid: {
    gap: 12,
  },
  badgeItem: {
    width: 80,
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    marginBottom: 12,
  },
  badgeIconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeIcon: {
    fontSize: 32,
  },
  badgeTierIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  tierDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBadgeIcon: {
    width: 100,
    height: 100,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  modalBadgeIconText: {
    fontSize: 48,
  },
  modalBadgeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  tierText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  modalBadgeDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  badgeDetails: {
    width: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
});

export default BadgeGallery;
