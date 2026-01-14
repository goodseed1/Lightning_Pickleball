/**
 * 📝 LTR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LTR" (Lightning Tennis Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LTR로 변경하고 코드는 ntrp를 유지합니다.
 */
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  runTransaction,
  addDoc,
  orderBy,
  limit,
  setDoc,
  increment,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { getLtrDisplay, migrateFromLegacyData, updateCalculatedNtrp } from '../utils/eloUtils';
import {
  updateUnifiedStats,
  updateClubStats,
  updateSkillLevelFromUnified,
  createInitialUnifiedStats,
  createInitialClubStats,
  calculateNewELO,
  validateRankingUpdate,
} from '../utils/unifiedRankingUtils';

// Try to import authService, but handle if it's not available
let authService;
try {
  authService = require('./authService').default;
} catch (error) {
  console.warn('⚠️ AuthService not available, using mock auth');
  authService = {
    getCurrentUser: () => ({ uid: 'mock-user-id' }),
  };
}

/**
 * Service for managing user data and statistics
 * Handles Firestore operations with fallback to mock data
 */
class UserService {
  /**
   * Get user profile by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User profile data
   */
  async getUserProfile(userId) {
    try {
      console.log('👤 Getting user profile for:', userId);

      // Try Firebase first
      try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          // 📧 [KIM FIX] Return null instead of throwing when user not found
          // This is expected when viewing public content while logged out
          console.log('📧 User profile not found (expected for guests):', userId);
          return null;
        }

        const userData = userDoc.data();

        // Helper function to safely convert Timestamp to Date
        const safeTimestampToDate = (timestamp, fallback = null) => {
          if (!timestamp) return fallback;
          if (typeof timestamp.toDate === 'function') {
            try {
              return timestamp.toDate();
            } catch (error) {
              console.warn('⚠️ Failed to convert timestamp:', error);
              return fallback;
            }
          }
          if (timestamp instanceof Date) return timestamp;
          if (typeof timestamp === 'string' || typeof timestamp === 'number') {
            try {
              return new Date(timestamp);
            } catch (error) {
              console.warn('⚠️ Failed to parse date string/number:', error);
              return fallback;
            }
          }
          return fallback;
        };

        const userProfile = {
          id: userDoc.id,
          ...userData,
          createdAt: safeTimestampToDate(userData.createdAt, new Date()),
          updatedAt: safeTimestampToDate(userData.updatedAt, new Date()),
          lastActive: safeTimestampToDate(userData.lastActive, new Date()),
          lastLoginAt: safeTimestampToDate(userData.lastLoginAt, null),
          dateOfBirth: safeTimestampToDate(userData.dateOfBirth, null),
        };

        console.log('✅ User profile retrieved successfully');
        return userProfile;
      } catch (firebaseError) {
        // Distinguish between "document not found" vs Firebase connectivity issues
        if (
          firebaseError.message.includes('사용자를 찾을 수 없습니다') ||
          firebaseError.message.includes('User not found')
        ) {
          console.warn('⚠️ User not found in Firebase:', userId);
          throw firebaseError; // Re-throw document not found errors
        } else {
          console.warn(
            '⚠️ Firebase unavailable, returning mock user profile:',
            firebaseError.message
          );
        }

        // Generate a meaningful name based on user ID
        const userName = userId.includes('mock')
          ? `Mock Player ${userId.split('-').pop()}`
          : `Player ${userId.slice(-4)}`;

        // Return mock data
        const mockProfile = {
          id: userId,
          displayName: userName,
          name: userName, // Add name field as fallback
          email: 'mock@example.com',
          profileImage: null,
          ltrLevel: 3.5,
          stats: {
            wins: 5,
            losses: 3,
            eloPoints: 1200,
            totalMatches: 8,
            winRate: 62.5,
          },
          preferences: {
            preferredLevel: 'intermediate',
            playingStyle: 'baseline',
            availableDays: ['weekends'],
          },
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date(),
          lastActive: new Date(),
        };

        console.log('✅ Returning mock user profile');
        return mockProfile;
      }
    } catch (error) {
      console.error('❌ Failed to get user profile:', error);
      throw new Error('사용자 정보를 불러오는 중 오류가 발생했습니다: ' + error.message);
    }
  }

  /**
   * Update user ranking after match result (supports dual ranking system)
   * @param {Object} rankingUpdateData - Ranking update data conforming to RankingUpdateData interface
   * @returns {Promise<boolean>} Success status
   */
  async updateUserRankingAfterMatch(rankingUpdateData) {
    try {
      console.log('🏆 Updating user ranking after match:', rankingUpdateData);

      // Validate ranking update data
      if (!validateRankingUpdate(rankingUpdateData)) {
        throw new Error('유효하지 않은 랭킹 업데이트 데이터입니다.');
      }

      const { userId, context, result, opponentElo, matchId } = rankingUpdateData;

      // Try Firebase first
      try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          throw new Error('사용자를 찾을 수 없습니다.');
        }

        const userData = userDoc.data();

        // Initialize globalStats if not exists
        if (!userData.globalStats) {
          userData.globalStats = createInitialGlobalStats();
        }

        if (context.type === 'global') {
          // Update global ranking
          const currentElo = userData.globalStats.eloRating;
          const newElo = calculateNewELO(currentElo, opponentElo, result);
          const newGlobalStats = updateGlobalStats(userData.globalStats, result, newElo);

          // Update skill level based on new global stats
          const currentSkillLevel = userData.skillLevel || {
            selfAssessed: '3.0-3.5',
            lastUpdated: new Date().toISOString(),
            source: 'migration',
          };
          const newSkillLevel = updateSkillLevelFromGlobal(currentSkillLevel, newGlobalStats);

          await updateDoc(userRef, {
            globalStats: newGlobalStats,
            skillLevel: newSkillLevel,
            updatedAt: serverTimestamp(),
          });

          console.log(`✅ Global ranking updated: ELO ${currentElo} → ${newElo}`);
        } else if (context.type === 'club' && context.clubId) {
          // Update club ranking
          const clubMembershipRef = doc(db, 'users', userId, 'clubMemberships', context.clubId);
          const clubDoc = await getDoc(clubMembershipRef);

          if (!clubDoc.exists()) {
            throw new Error('클럽 멤버십을 찾을 수 없습니다.');
          }

          const membershipData = clubDoc.data();
          const currentClubStats = membershipData.clubStats || createInitialClubStats();
          const currentElo = currentClubStats.eloRating;
          const newElo = calculateNewELO(currentElo, opponentElo, result);
          const newClubStats = updateClubStats(currentClubStats, result, newElo);

          await updateDoc(clubMembershipRef, {
            clubStats: newClubStats,
            lastUpdated: serverTimestamp(),
          });

          console.log(
            `✅ Club ranking updated for ${context.clubName}: ELO ${currentElo} → ${newElo}`
          );
        }

        return true;
      } catch (firebaseError) {
        console.warn('⚠️ Firebase unavailable, using mock ranking update:', firebaseError.message);

        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('✅ Mock ranking update successful');
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to update user ranking:', error);
      throw new Error('사용자 랭킹 업데이트 중 오류가 발생했습니다: ' + error.message);
    }
  }

  /**
   * Get multiple user profiles by IDs
   * @param {Array<string>} userIds - Array of user IDs
   * @returns {Promise<Array>} Array of user profiles
   */
  async getUserProfiles(userIds) {
    try {
      console.log('👥 Getting multiple user profiles for:', userIds);

      if (!userIds || userIds.length === 0) {
        return [];
      }

      // Try Firebase first
      try {
        const profiles = await Promise.all(
          userIds.map(async userId => {
            try {
              return await this.getUserProfile(userId);
            } catch (error) {
              console.warn(`Could not fetch profile for user ${userId}:`, error);
              // Generate a meaningful name based on user ID
              const userName = userId.includes('mock')
                ? `Mock Player ${userId.split('-').pop()}`
                : `Player ${userId.slice(-4)}`;

              return {
                id: userId,
                displayName: userName,
                name: userName, // Add name field as fallback
                email: null,
                profileImage: null,
                ltrLevel: null,
                stats: {
                  wins: 0,
                  losses: 0,
                  eloPoints: 1200,
                  totalMatches: 0,
                  winRate: 0,
                },
              };
            }
          })
        );

        console.log(`✅ Retrieved ${profiles.length} user profiles`);
        return profiles;
      } catch (firebaseError) {
        console.warn(
          '⚠️ Firebase unavailable, returning mock user profiles:',
          firebaseError.message
        );

        // Return mock data
        const mockProfiles = userIds.map((userId, index) => {
          const userName = userId.includes('mock')
            ? `Mock Player ${userId.split('-').pop()}`
            : `Player ${userId.slice(-4)}`;

          return {
            id: userId,
            displayName: userName,
            name: userName, // Add name field as fallback
            email: `mock${index + 1}@example.com`,
            profileImage: null,
            ltrLevel: 3.0 + index * 0.5,
            stats: {
              wins: Math.floor(Math.random() * 10),
              losses: Math.floor(Math.random() * 10),
              eloPoints: 1200 + (Math.random() * 400 - 200),
              totalMatches: Math.floor(Math.random() * 20),
              winRate: Math.round(Math.random() * 100),
            },
          };
        });

        console.log(`✅ Returning ${mockProfiles.length} mock user profiles`);
        return mockProfiles;
      }
    } catch (error) {
      console.error('❌ Failed to get user profiles:', error);
      throw new Error('사용자 정보를 불러오는 중 오류가 발생했습니다: ' + error.message);
    }
  }

  /**
   * Update user NTRP level
   * @param {string} userId - User ID
   * @param {number} newNTRP - New NTRP level
   * @returns {Promise<boolean>} Success status
   */
  async updateUserNTRP(userId, newNTRP) {
    try {
      console.log('🎾 Updating user NTRP for:', userId, 'to:', newNTRP);

      if (newNTRP < 1.0 || newNTRP > 7.0) {
        throw new Error('NTRP 등급은 1.0과 7.0 사이여야 합니다.');
      }

      // Try Firebase first
      try {
        const userRef = doc(db, 'users', userId);

        await updateDoc(userRef, {
          ltrLevel: newNTRP,
          updatedAt: serverTimestamp(),
        });

        console.log('✅ User NTRP updated successfully in Firebase');
        return true;
      } catch (firebaseError) {
        console.warn('⚠️ Firebase unavailable, using mock NTRP update:', firebaseError.message);

        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('✅ Mock user NTRP update successful');
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to update user NTRP:', error);
      throw new Error('NTRP 등급 업데이트 중 오류가 발생했습니다: ' + error.message);
    }
  }

  /**
   * Get leaderboard (top players by ELO)
   * @param {number} limit - Number of players to return
   * @returns {Promise<Array>} Array of top players
   */
  async getLeaderboard(limit = 50) {
    try {
      console.log('🏆 Getting leaderboard, limit:', limit);

      // Try Firebase first
      try {
        const usersRef = collection(db, 'users');
        const q = query(
          usersRef,
          where('stats.totalMatches', '>=', 5), // Minimum matches to appear on leaderboard
          orderBy('stats.eloPoints', 'desc'),
          limit(maxResults)
        );

        const snapshot = await getDocs(q);
        const leaderboard = snapshot.docs.map((doc, index) => {
          const userData = doc.data();
          return {
            rank: index + 1,
            id: doc.id,
            displayName: userData.displayName || 'Unknown',
            profileImage: userData.profileImage,
            ltrLevel: userData.ltrLevel,
            stats: userData.stats || {
              wins: 0,
              losses: 0,
              eloPoints: 1200,
              totalMatches: 0,
              winRate: 0,
            },
          };
        });

        console.log(`✅ Retrieved leaderboard with ${leaderboard.length} players`);
        return leaderboard;
      } catch (firebaseError) {
        console.warn('⚠️ Firebase unavailable, returning mock leaderboard:', firebaseError.message);

        // Return mock leaderboard data
        const mockLeaderboard = Array.from({ length: Math.min(limit, 10) }, (_, index) => ({
          rank: index + 1,
          id: `mock-user-${index + 1}`,
          displayName: `Player ${index + 1}`,
          profileImage: null,
          ltrLevel: 4.0 - index * 0.1,
          stats: {
            wins: 20 - index,
            losses: 5 + index,
            eloPoints: 1500 - index * 25,
            totalMatches: 25,
            winRate: Math.round(((20 - index) / 25) * 100),
          },
        }));

        console.log(`✅ Returning mock leaderboard with ${mockLeaderboard.length} players`);
        return mockLeaderboard;
      }
    } catch (error) {
      console.error('❌ Failed to get leaderboard:', error);
      throw new Error('리더보드를 불러오는 중 오류가 발생했습니다: ' + error.message);
    }
  }

  /**
   * Get user's match history
   * @param {string} userId - User ID
   * @param {number} limit - Number of matches to return
   * @returns {Promise<Array>} Array of match history
   */
  async getUserMatchHistory(userId, maxResults = 20) {
    try {
      console.log('📜 Getting match history for:', userId);

      // Try Firebase first
      try {
        const eventsRef = collection(db, 'events');
        const q = query(
          eventsRef,
          where('type', 'in', ['rankedMatch', 'match']), // Include both legacy rankedMatch and new match types
          where('status', '==', 'completed'),
          where('participants', 'array-contains', userId),
          orderBy('completedAt', 'desc'),
          limit(maxResults)
        );

        const snapshot = await getDocs(q);
        const matches = snapshot.docs.map(doc => {
          const matchData = doc.data();
          const isWinner = matchData.result?.winnerId === userId;

          return {
            id: doc.id,
            title: matchData.title,
            opponent: isWinner ? matchData.result?.loserId : matchData.result?.winnerId,
            result: isWinner ? 'win' : 'loss',
            score: matchData.result?.score,
            eloChange: matchData.result?.eloChanges?.[userId] || 0,
            completedAt: matchData.completedAt?.toDate() || new Date(),
            location: matchData.location,
          };
        });

        console.log(`✅ Retrieved ${matches.length} matches from history`);
        return matches;
      } catch (firebaseError) {
        console.warn(
          '⚠️ Firebase unavailable, returning empty match history:',
          firebaseError.message
        );

        // Return empty match history
        console.log('✅ Returning empty match history');
        return [];
      }
    } catch (error) {
      console.error('❌ Failed to get match history:', error);
      throw new Error('경기 기록을 불러오는 중 오류가 발생했습니다: ' + error.message);
    }
  }

  /**
   * 📊 [VISION] Get user's ELO history for chart display
   * @param {string} userId - User ID
   * @param {number} maxResults - Number of matches to return (default 30)
   * @returns {Promise<Array>} Array of ELO history {date, elo, change}
   */
  async getEloHistory(userId, maxResults = 30) {
    try {
      console.log('📊 [VISION] Getting ELO history for:', userId);

      const historyRef = collection(db, `users/${userId}/match_history`);
      const q = query(historyRef, orderBy('date', 'desc'), limit(maxResults));

      const snapshot = await getDocs(q);
      const eloHistory = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          date: data.date?.toDate() || new Date(),
          oldElo: data.oldElo || 1200,
          newElo: data.newElo || 1200,
          eloChange: data.eloChange || 0,
          result: data.result,
          opponent: data.opponent?.playerName || 'Unknown',
        };
      });

      // Sort by date ascending for chart display (oldest first)
      eloHistory.reverse();

      console.log(`✅ [VISION] Retrieved ${eloHistory.length} ELO history entries`);
      return eloHistory;
    } catch (error) {
      console.error('❌ [VISION] Failed to get ELO history:', error);
      // Return empty array on error (graceful degradation for chart)
      return [];
    }
  }

  /**
   * 📊 [IRON MAN] Get user's global ELO history (public matches)
   * @param {string} userId - User ID
   * @param {number} maxResults - Number of matches to return (default 30)
   * @returns {Promise<Array>} Array of global ELO history
   */
  async getGlobalEloHistory(userId, maxResults = 30) {
    try {
      console.log('📊 [GLOBAL ELO] Getting global ELO history for:', userId);

      // Read from global_match_history collection (server-side separation)
      const historyRef = collection(db, `users/${userId}/global_match_history`);
      const q = query(historyRef, orderBy('date', 'desc'), limit(maxResults));

      const snapshot = await getDocs(q);
      const eloHistory = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          matchId: doc.id,
          date: data.date?.toDate() || new Date(),
          oldElo: data.oldElo || 1200,
          newElo: data.newElo || 1200,
          eloChange: data.eloChange || 0,
          result: data.result,
          opponent: data.opponent?.playerName || 'Unknown',
        };
      });

      // Sort by date ascending for chart display (oldest first)
      eloHistory.reverse();

      console.log(`✅ [GLOBAL ELO] Retrieved ${eloHistory.length} global ELO history entries`);
      return eloHistory;
    } catch (error) {
      console.error('❌ [GLOBAL ELO] Failed to get global ELO history:', error);
      // Return empty array on error (graceful degradation for chart)
      return [];
    }
  }

  /**
   * 📊 [IRON MAN] Get user's club ELO history (club matches)
   * @param {string} userId - User ID
   * @param {string} clubId - Club ID
   * @param {number} maxResults - Number of matches to return (default 30)
   * @returns {Promise<Array>} Array of club ELO history
   */
  async getClubEloHistory(userId, clubId, maxResults = 30) {
    try {
      console.log('📊 [CLUB ELO] Getting club ELO history for:', userId, 'club:', clubId);

      // Read from club_match_history collection (server-side separation)
      const historyRef = collection(db, `users/${userId}/club_match_history`);
      const q = query(
        historyRef,
        where('clubId', '==', clubId),
        orderBy('date', 'desc'),
        limit(maxResults)
      );

      const snapshot = await getDocs(q);
      const eloHistory = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          matchId: doc.id,
          date: data.date?.toDate() || new Date(),
          oldElo: data.oldElo || 1200,
          newElo: data.newElo || 1200,
          eloChange: data.eloChange || 0,
          result: data.result,
          opponent: data.opponent?.playerName || 'Unknown',
          clubId: data.clubId,
          clubName: data.clubName || 'Unknown Club',
        };
      });

      // Sort by date ascending for chart display (oldest first)
      eloHistory.reverse();

      console.log(`✅ [CLUB ELO] Retrieved ${eloHistory.length} club ELO history entries`);
      return eloHistory;
    } catch (error) {
      console.error('❌ [CLUB ELO] Failed to get club ELO history:', error);
      // Return empty array on error (graceful degradation for chart)
      return [];
    }
  }

  // ============ ELO RANKING SYSTEM (Cloud Function Logic) ============

  /*
   * 📊 CLOUD FUNCTION DESIGN FOR ELO RANKING SYSTEM
   *
   * 이 섹션은 Firebase Cloud Functions에서 구현될 ELO 랭킹 업데이트 로직의 설계를 설명합니다.
   * 실제 구현이 아닌 개념적 설계이며, 주석으로 작성되었습니다.
   *
   * === Firestore 트리거 Cloud Function 설정 ===
   *
   * exports.updateRankingsOnMatchComplete = functions.firestore
   *   .document('events/{eventId}')
   *   .onUpdate(async (change, context) => {
   *
   * 주요 실행 로직:
   *
   * async function updateRankingsOnMatchComplete(change, context) {
   *   try {
   *     const eventId = context.params.eventId;
   *     const beforeData = change.before.data();
   *     const afterData = change.after.data();
   *
   *     // 트리거 조건 확인: status가 'completed'로 변경되고, type이 'rankedMatch' 또는 'match'인 경우만
   *     if (beforeData.status !== 'completed' &&
   *         afterData.status === 'completed' &&
   *         (afterData.type === 'rankedMatch' || afterData.type === 'match')) {
   *
   *       console.log(`🏆 Processing ranking update for match: ${eventId}`);
   *
   *       // Step 1: 결과 데이터 추출 및 검증
   *       const result = afterData.result;
   *       if (!result || !result.winnerId || !result.loserId) {
   *         throw new Error('Invalid match result data');
   *       }
   *
   *       const winnerId = result.winnerId;
   *       const loserId = result.loserId;
   *
   *       console.log(`Winner: ${winnerId}, Loser: ${loserId}`);
   *
   *       // Step 2: 트랜잭션으로 원자적 업데이트 실행
   *       await admin.firestore().runTransaction(async (transaction) => {
   *
   *         // Step 2.1: 현재 사용자 데이터 조회
   *         const winnerRef = admin.firestore().collection('users').doc(winnerId);
   *         const loserRef = admin.firestore().collection('users').doc(loserId);
   *
   *         const [winnerDoc, loserDoc] = await Promise.all([
   *           transaction.get(winnerRef),
   *           transaction.get(loserRef)
   *         ]);
   *
   *         if (!winnerDoc.exists || !loserDoc.exists) {
   *           throw new Error('User documents not found');
   *         }
   *
   *         // Step 2.2: 현재 통계 추출
   *         const winnerData = winnerDoc.data();
   *         const loserData = loserDoc.data();
   *
   *         const winnerStats = winnerData.stats || {
   *           wins: 0,
   *           losses: 0,
   *           eloPoints: 1200,
   *           totalMatches: 0,
   *           winRate: 0
   *         };
   *
   *         const loserStats = loserData.stats || {
   *           wins: 0,
   *           losses: 0,
   *           eloPoints: 1200,
   *           totalMatches: 0,
   *           winRate: 0
   *         };
   *
   *         console.log(`Winner ELO: ${winnerStats.eloPoints}, Loser ELO: ${loserStats.eloPoints}`);
   *
   *         // Step 2.3: ELO 점수 계산
   *         const { newWinnerElo, newLoserElo } = calculateNewEloRatings(
   *           winnerStats.eloPoints,
   *           loserStats.eloPoints
   *         );
   *
   *         const winnerEloChange = newWinnerElo - winnerStats.eloPoints;
   *         const loserEloChange = newLoserElo - loserStats.eloPoints;
   *
   *         console.log(`ELO changes - Winner: +${winnerEloChange}, Loser: ${loserEloChange}`);
   *
   *         // Step 2.4: 새로운 통계 계산
   *         const newWinnerStats = {
   *           wins: winnerStats.wins + 1,
   *           losses: winnerStats.losses,
   *           eloPoints: newWinnerElo,
   *           totalMatches: winnerStats.totalMatches + 1
   *         };
   *         newWinnerStats.winRate = Math.round((newWinnerStats.wins / newWinnerStats.totalMatches) * 100 * 100) / 100;
   *
   *         const newLoserStats = {
   *           wins: loserStats.wins,
   *           losses: loserStats.losses + 1,
   *           eloPoints: newLoserElo,
   *           totalMatches: loserStats.totalMatches + 1
   *         };
   *         newLoserStats.winRate = Math.round((newLoserStats.wins / newLoserStats.totalMatches) * 100 * 100) / 100;
   *
   *         // Step 2.5: 트랜잭션으로 동시 업데이트
   *         transaction.update(winnerRef, {
   *           stats: newWinnerStats,
   *           updatedAt: admin.firestore.FieldValue.serverTimestamp()
   *         });
   *
   *         transaction.update(loserRef, {
   *           stats: newLoserStats,
   *           updatedAt: admin.firestore.FieldValue.serverTimestamp()
   *         });
   *
   *         // Step 2.6: 매치 결과에 ELO 변화량 기록
   *         const eventRef = admin.firestore().collection('events').doc(eventId);
   *         transaction.update(eventRef, {
   *           'result.eloChanges': {
   *             [winnerId]: winnerEloChange,
   *             [loserId]: loserEloChange
   *           },
   *           'result.processedAt': admin.firestore.FieldValue.serverTimestamp()
   *         });
   *
   *         console.log('✅ Ranking update transaction completed successfully');
   *       });
   *
   *       console.log(`🎉 Ranking update completed for match: ${eventId}`);
   *     }
   *   } catch (error) {
   *     console.error('❌ Failed to update rankings:', error);
   *     throw error;
   *   }
   * }
   *
   * // ELO 계산 함수 (표준 ELO 시스템)
   * function calculateNewEloRatings(winnerElo, loserElo, kFactor = 32) {
   *   // Expected scores calculation
   *   const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
   *   const expectedLoser = 1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400));
   *
   *   // New ratings calculation
   *   // Winner gets score of 1, loser gets score of 0
   *   const newWinnerElo = Math.round(winnerElo + kFactor * (1 - expectedWinner));
   *   const newLoserElo = Math.round(loserElo + kFactor * (0 - expectedLoser));
   *
   *   // 최소값 제한 (1000점 이하로 떨어지지 않도록)
   *   return {
   *     newWinnerElo: Math.max(1000, newWinnerElo),
   *     newLoserElo: Math.max(1000, newLoserElo)
   *   };
   * }
   *
   * === 추가 고려사항 ===
   *
   * 1. 데이터 정합성:
   *    - runTransaction 사용으로 동시성 문제 해결
   *    - 중복 처리 방지를 위한 processedAt 필드 체크
   *    - 롤백 처리로 부분 실패 시 전체 작업 취소
   *
   * 2. 에러 처리:
   *    - 사용자 문서 존재 여부 확인
   *    - 유효하지 않은 결과 데이터 검증
   *    - 네트워크 오류 시 재시도 로직
   *
   * 3. 성능 최적화:
   *    - 필요한 필드만 업데이트
   *    - 배치 처리로 다수 매치 동시 처리
   *    - 인덱스 최적화로 쿼리 성능 향상
   *
   * 4. 모니터링:
   *    - Cloud Logging으로 모든 랭킹 변화 추적
   *    - 이상한 ELO 변화 감지 및 알림
   *    - 시스템 성능 메트릭 수집
   *
   * 5. 확장성:
   *    - K-factor 동적 조정 (신규 유저 vs 베테랑)
   *    - 계절별 랭킹 리셋 기능
   *    - 다양한 게임 모드별 별도 랭킹
   *
   * 이 Cloud Function은 events 컬렉션의 status 변화를 감지하여
   * 자동으로 사용자들의 ELO 랭킹을 실시간 업데이트하며,
   * 트랜잭션을 통해 데이터 일관성을 보장합니다.
   */

  // ============ SPORTSMANSHIP RATING SYSTEM ============

  /**
   * Submit sportsmanship rating for a user
   * @param {Object} ratingData - Rating data object
   * @returns {Promise<string>} Rating document ID
   */
  async submitSportsmanshipRating(ratingData) {
    try {
      console.log('⭐ Submitting sportsmanship rating:', ratingData);

      // Validate required fields
      if (!ratingData.ratedUserId || !ratingData.raterUserId || !ratingData.ratings) {
        throw new Error('필수 평가 데이터가 누락되었습니다');
      }

      // Try Firebase first
      try {
        const ratingsRef = collection(db, 'user_ratings');

        const ratingDoc = {
          ratedUserId: ratingData.ratedUserId,
          ratedUserName: ratingData.ratedUserName || 'Unknown',
          raterUserId: ratingData.raterUserId,
          raterUserName: ratingData.raterUserName || 'Unknown',
          eventId: ratingData.eventId || null,
          eventType: ratingData.eventType || 'match',
          eventTitle: ratingData.eventTitle || '',
          ratings: {
            sportsmanship: ratingData.ratings.sportsmanship || 0,
            punctuality: ratingData.ratings.punctuality || 0,
            attitude: ratingData.ratings.attitude || 0,
          },
          averageRating: ratingData.averageRating || 0,
          comment: ratingData.comment || '',
          timestamp: serverTimestamp(),
          createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(ratingsRef, ratingDoc);

        // Update user's average rating
        await this.updateUserAverageRating(ratingData.ratedUserId);

        console.log('✅ Rating submitted successfully:', docRef.id);
        return docRef.id;
      } catch (firebaseError) {
        console.warn(
          '⚠️ Firebase unavailable, simulating rating submission:',
          firebaseError.message
        );

        // Mock response
        await new Promise(resolve => setTimeout(resolve, 500));
        const mockId = `mock-rating-${Date.now()}`;
        console.log('✅ Mock rating submission successful:', mockId);
        return mockId;
      }
    } catch (error) {
      console.error('❌ Failed to submit rating:', error);
      throw new Error('평가 제출 중 오류가 발생했습니다: ' + error.message);
    }
  }

  /**
   * Get ratings for a user
   * @param {string} userId - User ID
   * @param {number} limitCount - Number of ratings to return
   * @returns {Promise<Array>} Array of rating data
   */
  async getUserRatings(userId, limitCount = 20) {
    try {
      console.log('📊 Getting ratings for user:', userId);

      // Try Firebase first
      try {
        const ratingsRef = collection(db, 'user_ratings');
        const q = query(
          ratingsRef,
          where('ratedUserId', '==', userId),
          orderBy('timestamp', 'desc'),
          limit(limitCount)
        );

        const snapshot = await getDocs(q);
        const ratings = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        }));

        console.log(`✅ Retrieved ${ratings.length} ratings`);
        return ratings;
      } catch (firebaseError) {
        console.warn('⚠️ Firebase unavailable, returning mock ratings:', firebaseError.message);

        // Return mock ratings
        const mockRatings = [
          {
            id: 'mock-rating-1',
            ratedUserId: userId,
            ratedUserName: 'Current User',
            raterUserId: 'mock-rater-1',
            raterUserName: 'TennisAce',
            eventId: 'mock-event-1',
            eventType: 'match',
            eventTitle: 'Lightning Match',
            ratings: {
              sportsmanship: 5,
              punctuality: 4,
              attitude: 5,
            },
            averageRating: 4.7,
            comment: '함께 경기해서 즐거웠습니다!',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
          {
            id: 'mock-rating-2',
            ratedUserId: userId,
            ratedUserName: 'Current User',
            raterUserId: 'mock-rater-2',
            raterUserName: 'CourtRunner',
            eventId: 'mock-event-2',
            eventType: 'meetup',
            eventTitle: 'Weekend Meetup',
            ratings: {
              sportsmanship: 4,
              punctuality: 5,
              attitude: 4,
            },
            averageRating: 4.3,
            comment: 'Great sportsmanship!',
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          },
        ];

        console.log(`✅ Returning ${mockRatings.length} mock ratings`);
        return mockRatings;
      }
    } catch (error) {
      console.error('❌ Failed to get user ratings:', error);
      throw new Error('평가를 불러오는 중 오류가 발생했습니다: ' + error.message);
    }
  }

  /**
   * Update user's average rating
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async updateUserAverageRating(userId) {
    try {
      console.log('📈 Updating average rating for user:', userId);

      // Try Firebase first
      try {
        // Get all ratings for the user
        const ratingsRef = collection(db, 'user_ratings');
        const q = query(ratingsRef, where('ratedUserId', '==', userId));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          console.log('No ratings found for user');
          return;
        }

        // Calculate averages
        let totalSportsmanship = 0;
        let totalPunctuality = 0;
        let totalAttitude = 0;
        let totalOverall = 0;
        const count = snapshot.size;

        snapshot.docs.forEach(doc => {
          const rating = doc.data();
          totalSportsmanship += rating.ratings.sportsmanship || 0;
          totalPunctuality += rating.ratings.punctuality || 0;
          totalAttitude += rating.ratings.attitude || 0;
          totalOverall += rating.averageRating || 0;
        });

        const averageRatings = {
          sportsmanship: Math.round((totalSportsmanship / count) * 10) / 10,
          punctuality: Math.round((totalPunctuality / count) * 10) / 10,
          attitude: Math.round((totalAttitude / count) * 10) / 10,
          overall: Math.round((totalOverall / count) * 10) / 10,
          totalRatings: count,
          lastUpdated: serverTimestamp(),
        };

        // Update user document
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          sportsmanshipRatings: averageRatings,
          updatedAt: serverTimestamp(),
        });

        console.log('✅ Average rating updated:', averageRatings);
      } catch (firebaseError) {
        console.warn(
          '⚠️ Firebase unavailable, skipping average rating update:',
          firebaseError.message
        );
      }
    } catch (error) {
      console.error('❌ Failed to update average rating:', error);
    }
  }

  /**
   * Get user's sportsmanship statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Sportsmanship statistics
   */
  async getUserSportsmanshipStats(userId) {
    try {
      console.log('📊 Getting sportsmanship stats for user:', userId);

      // Try Firebase first
      try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          throw new Error('사용자를 찾을 수 없습니다');
        }

        const userData = userDoc.data();
        const stats = userData.sportsmanshipRatings || {
          sportsmanship: 0,
          punctuality: 0,
          attitude: 0,
          overall: 0,
          totalRatings: 0,
        };

        console.log('✅ Retrieved sportsmanship stats:', stats);
        return stats;
      } catch (firebaseError) {
        console.warn('⚠️ Firebase unavailable, returning mock stats:', firebaseError.message);

        // Return mock stats
        const mockStats = {
          sportsmanship: 4.5,
          punctuality: 4.2,
          attitude: 4.7,
          overall: 4.5,
          totalRatings: 12,
          lastUpdated: new Date(),
        };

        console.log('✅ Returning mock sportsmanship stats:', mockStats);
        return mockStats;
      }
    } catch (error) {
      console.error('❌ Failed to get sportsmanship stats:', error);
      throw new Error('스포츠맨십 통계를 불러오는 중 오류가 발생했습니다: ' + error.message);
    }
  }

  /**
   * Get unified NTRP display for a user (supports dual ranking system)
   * @param {Object} user - User profile object
   * @param {Object} context - Optional match context for dual ranking display
   * @param {Function} t - Optional translation function for i18n support
   * @returns {Object} NTRP display options
   */
  getLtrDisplay(user, context = null, t = null) {
    // Try new dual ranking display first
    if (user.skillLevel && user.globalStats) {
      return getDualRankingLtrDisplay(user, context);
    }

    // Fallback to legacy display logic
    return getLtrDisplay(user, t);
  }

  /**
   * Migrate user from legacy NTRP data to new structure
   * @param {string} userId - User ID to migrate
   * @returns {Promise<Object>} The new skill level structure
   */
  async migrateUserToNewNtrpStructure(userId) {
    try {
      console.log('🔄 Migrating user to new NTRP structure:', userId);

      // Get current user data
      const user = await this.getUserProfile(userId);

      // Check if already migrated
      if (user.skillLevel && user.skillLevel.selfAssessed) {
        console.log('ℹ️ User already has new structure, skipping migration');
        return user.skillLevel;
      }

      // Create new skill level from legacy data
      const newSkillLevel = migrateFromLegacyData(user);

      // Update user document
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        skillLevel: newSkillLevel,
      });

      console.log('✅ Successfully migrated user NTRP structure:', {
        userId,
        newSkillLevel,
      });

      return newSkillLevel;
    } catch (error) {
      console.error('❌ Failed to migrate user NTRP structure:', error);
      throw new Error('사용자 NTRP 구조 마이그레이션 중 오류가 발생했습니다: ' + error.message);
    }
  }

  /**
   * Update user's calculated NTRP after a match
   * @param {string} userId - User ID
   * @param {number} newEloRating - New ELO rating
   * @param {number} totalMatches - Total matches played
   * @returns {Promise<void>}
   */
  async updateUserNtrpAfterMatch(userId, newEloRating, totalMatches) {
    try {
      console.log('🎾 Updating user NTRP after match:', {
        userId,
        newEloRating,
        totalMatches,
      });

      // Get current user data
      const user = await this.getUserProfile(userId);

      // Update skill level (migrate if necessary)
      let currentSkillLevel = user.skillLevel;
      if (!currentSkillLevel || !currentSkillLevel.selfAssessed) {
        console.log('🔄 Auto-migrating user during NTRP update');
        currentSkillLevel = migrateFromLegacyData(user);
      }

      // Calculate new skill level with updated rating
      const updatedSkillLevel = updateCalculatedNtrp(currentSkillLevel, newEloRating, totalMatches);

      // Update user document
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        'stats.eloRating': newEloRating,
        skillLevel: updatedSkillLevel,
      });

      console.log('✅ Successfully updated user NTRP after match:', {
        userId,
        calculated: updatedSkillLevel.calculated,
        confidence: updatedSkillLevel.confidence,
      });
    } catch (error) {
      console.error('❌ Failed to update user NTRP after match:', error);
      throw new Error('경기 후 NTRP 업데이트 중 오류가 발생했습니다: ' + error.message);
    }
  }

  /**
   * Update user's self-assessed skill level
   * @param {string} userId - User ID
   * @param {string} selfAssessed - New self-assessed range (e.g., "3.0-3.5")
   * @returns {Promise<void>}
   */
  async updateSelfAssessedSkillLevel(userId, selfAssessed) {
    try {
      console.log('📝 Updating user self-assessed skill level:', {
        userId,
        selfAssessed,
      });

      // Get current user data
      const user = await this.getUserProfile(userId);

      // Get current skill level or create new one
      let skillLevel = user.skillLevel;
      if (!skillLevel || !skillLevel.selfAssessed) {
        skillLevel = migrateFromLegacyData(user);
      }

      // Update self-assessed value
      const updatedSkillLevel = {
        ...skillLevel,
        selfAssessed,
        lastUpdated: new Date().toISOString(),
        source: 'manual',
      };

      // Update user document
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        skillLevel: updatedSkillLevel,
      });

      console.log('✅ Successfully updated self-assessed skill level:', {
        userId,
        selfAssessed,
      });
    } catch (error) {
      console.error('❌ Failed to update self-assessed skill level:', error);
      throw new Error('자가평가 스킬 레벨 업데이트 중 오류가 발생했습니다: ' + error.message);
    }
  }

  /**
   * Migrate user to dual ranking system
   * @param {string} userId - User ID to migrate
   * @returns {Promise<Object>} Migration result
   */
  async migrateUserToDualRanking(userId) {
    try {
      console.log('🔄 Migrating user to dual ranking system:', userId);

      const user = await this.getUserProfile(userId);

      // Check if already migrated
      if (user.globalStats && user.skillLevel && user.skillLevel.selfAssessed) {
        console.log('ℹ️ User already migrated to dual ranking system');
        return { migrated: false, reason: 'Already migrated' };
      }

      // Create new structures from legacy data
      const legacyStats = user.stats || {};
      const globalStats = {
        eloRating: legacyStats.eloRating || legacyStats.eloPoints || 1200,
        matchesPlayed: legacyStats.totalMatches || 0,
        wins: legacyStats.wins || 0,
        losses: legacyStats.losses || 0,
        winRate: legacyStats.winRate || 0,
        currentStreak: 0,
        longestStreak: 0,
        lastMatchDate: user.lastActive || new Date().toISOString(),
      };

      // Create skill level from legacy NTRP data
      let selfAssessed = '3.0-3.5'; // Default
      if (user.profile?.skillLevel) {
        selfAssessed = user.profile.skillLevel;
      } else if (user.ltrLevel) {
        const ntrp = parseFloat(user.ltrLevel);
        if (ntrp >= 1.0 && ntrp <= 2.5) selfAssessed = '1.0-2.5';
        else if (ntrp >= 2.5 && ntrp <= 3.0) selfAssessed = '2.5-3.0';
        else if (ntrp >= 3.0 && ntrp <= 3.5) selfAssessed = '3.0-3.5';
        else if (ntrp >= 3.5 && ntrp <= 4.0) selfAssessed = '3.5-4.0';
        else if (ntrp >= 4.0 && ntrp <= 4.5) selfAssessed = '4.0-4.5';
        else if (ntrp >= 4.5 && ntrp <= 5.0) selfAssessed = '4.5-5.0';
        else if (ntrp >= 5.0) selfAssessed = '5.0+';
      }

      const skillLevel = updateSkillLevelFromGlobal(
        {
          selfAssessed,
          lastUpdated: new Date().toISOString(),
          source: 'migration',
        },
        globalStats
      );

      // Update user document
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        globalStats,
        skillLevel,
        // Keep legacy data for backward compatibility during transition
        migrationDate: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Successfully migrated user to dual ranking system:', {
        userId,
        globalStats,
        skillLevel,
      });

      return {
        migrated: true,
        globalStats,
        skillLevel,
        legacyPreserved: true,
      };
    } catch (error) {
      console.error('❌ Failed to migrate user to dual ranking system:', error);
      throw new Error('이중 랭킹 시스템 마이그레이션 중 오류가 발생했습니다: ' + error.message);
    }
  }

  /**
   * Join user to a club (creates club membership)
   * @param {string} userId - User ID
   * @param {Object} clubData - Club information
   * @returns {Promise<boolean>} Success status
   */
  async joinClub(userId, clubData) {
    try {
      console.log('🏟️ User joining club:', { userId, clubId: clubData.clubId });

      const { clubId, clubName } = clubData;
      if (!clubId || !clubName) {
        throw new Error('클럽 ID와 이름이 필요합니다.');
      }

      // Create club membership document
      const clubMembershipRef = doc(db, 'users', userId, 'clubMemberships', clubId);
      const membershipData = {
        clubId,
        clubName,
        role: 'member',
        status: 'active',
        joinedAt: new Date().toISOString(),
        clubStats: createInitialClubStats(),
      };

      await setDoc(clubMembershipRef, membershipData);

      console.log('✅ Successfully joined club:', { userId, clubId, clubName });
      return true;
    } catch (error) {
      console.error('❌ Failed to join club:', error);
      throw new Error('클럽 가입 중 오류가 발생했습니다: ' + error.message);
    }
  }

  /**
   * Get user's club memberships
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of club memberships
   */
  async getUserClubMemberships(userId) {
    try {
      console.log('🏟️ Getting club memberships for user:', userId);

      const membershipsRef = collection(db, 'users', userId, 'clubMemberships');
      const snapshot = await getDocs(membershipsRef);

      const memberships = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(`✅ Retrieved ${memberships.length} club memberships`);
      return memberships;
    } catch (error) {
      console.error('❌ Failed to get club memberships:', error);
      throw new Error('클럽 멤버십 조회 중 오류가 발생했습니다: ' + error.message);
    }
  }

  /**
   * Get formatted ranking display for user
   * @param {string} userId - User ID
   * @param {string} context - 'global' or 'club'
   * @param {string} clubId - Club ID (required if context is 'club')
   * @returns {Promise<string>} Formatted ranking display
   */
  async getFormattedRankingDisplay(userId, context = 'global', clubId = null) {
    try {
      const user = await this.getUserProfile(userId);

      if (context === 'global' && user.globalStats) {
        return formatRankingDisplay(user.globalStats.eloRating, 'global');
      }

      if (context === 'club' && clubId) {
        const memberships = await this.getUserClubMemberships(userId);
        const clubMembership = memberships.find(m => m.clubId === clubId);

        if (clubMembership) {
          return formatRankingDisplay(
            clubMembership.clubStats.eloRating,
            'club',
            clubMembership.clubName
          );
        }
      }

      // Fallback to legacy display
      return `${user.ltrLevel || '3.0'} (레거시)`;
    } catch (error) {
      console.error('❌ Failed to get formatted ranking display:', error);
      return '레벨 정보 없음';
    }
  }

  /**
   * Award sportsmanship tags to a user
   * @param {string} recipientId - ID of user receiving the tags
   * @param {string[]} tagIds - Array of tag IDs to award
   * @param {string} awarderId - ID of user awarding the tags
   * @returns {Promise<void>}
   */
  async awardSportsmanshipTags(recipientId, tagIds, awarderId) {
    try {
      console.log('🏆 Awarding sportsmanship tags:', { recipientId, tagIds, awarderId });

      if (!recipientId || !tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
        throw new Error('필수 매개변수가 누락되었습니다');
      }

      // Firestore transaction을 사용하여 원자적으로 업데이트
      await runTransaction(db, async transaction => {
        const userRef = doc(db, 'users', recipientId);
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists()) {
          throw new Error('사용자를 찾을 수 없습니다');
        }

        // 각 태그의 카운트를 1씩 증가
        const updates = {};
        tagIds.forEach(tagId => {
          updates[`sportsmanshipTags.${tagId}`] = increment(1);
        });

        // 마지막 업데이트 시간도 함께 업데이트
        updates.updatedAt = serverTimestamp();

        transaction.update(userRef, updates);

        // 태그 수여 기록을 별도 컬렉션에 저장 (선택사항 - 히스토리 추적용)
        const tagsHistoryRef = doc(collection(db, 'sportsmanship_history'));
        transaction.set(tagsHistoryRef, {
          recipientId,
          awarderId,
          tagIds,
          timestamp: serverTimestamp(),
        });
      });

      console.log('✅ Successfully awarded sportsmanship tags');
    } catch (error) {
      console.error('❌ Failed to award sportsmanship tags:', error);
      throw new Error(`태그 수여 실패: ${error.message}`);
    }
  }

  /**
   * 🏛️ THOR'S UNIFIED HISTORY AGGREGATION
   * 사용자의 모든 경기 통계 집계 (글로벌 + 모든 클럽)
   * Aggregates all user match statistics (global + all clubs)
   *
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Aggregated statistics
   */
  async getAggregatedUserStats(userId) {
    try {
      console.log('🏛️ [THOR] Starting unified history aggregation for user:', userId);

      // 1. Get global stats from user profile
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const globalStats = userData?.stats || {};

      // 🎯 [KIM FIX] Extract matchType-specific public stats for StatsTabContent
      const publicStats = globalStats.publicStats || {};

      console.log('📊 [GLOBAL STATS]', {
        wins: globalStats.wins || 0,
        losses: globalStats.losses || 0,
        unifiedElo: globalStats.unifiedEloRating,
        publicStats: publicStats, // 🆕 Include matchType breakdown
      });

      // 2. Aggregate all club membership stats
      // 🔧 FIX: Read from clubMembers root collection (matches Cloud Functions write path)
      const clubMembersRef = collection(db, 'clubMembers');
      const clubMembersQuery = query(clubMembersRef, where('userId', '==', userId));
      const clubMembershipsSnapshot = await getDocs(clubMembersQuery);

      let totalClubWins = 0;
      let totalClubLosses = 0;
      let totalClubMatches = 0;
      let maxClubStreak = 0;
      let maxClubLongestStreak = 0;

      const clubStatsBreakdown = [];

      // 🏛️ CAPTAIN AMERICA: Separate league stats from tournament stats
      let totalTournamentWins = 0;
      let totalTournamentLosses = 0;
      let totalTournamentMatches = 0;

      // 🏆 Tournament placement stats (new fields)
      let totalChampionships = 0;
      let totalRunnerUps = 0;
      let totalSemiFinals = 0;
      let totalTournamentsPlayed = 0;
      let bestFinishEver = null;

      clubMembershipsSnapshot.forEach(doc => {
        const membership = doc.data();
        const clubStats = membership.clubStats || {};
        const tournamentStats = clubStats.tournamentStats || {};

        // 🔧 FIX: clubStats already contains league-only stats
        // tournamentStats is stored separately inside clubStats
        // Therefore: Total Club = League + Tournament (not League = Club - Tournament)
        const leagueWins = clubStats.wins || 0;
        const leagueLosses = clubStats.losses || 0;
        const leagueMatches = clubStats.matchesPlayed || 0;

        totalClubWins += leagueWins;
        totalClubLosses += leagueLosses;
        totalClubMatches += leagueMatches;

        // 🎾 Match statistics (legacy field names for now)
        totalTournamentWins += tournamentStats.tournamentWins || 0;
        totalTournamentLosses += tournamentStats.tournamentLosses || 0;
        totalTournamentMatches += tournamentStats.totalMatches || 0;

        // 🏆 Tournament placement statistics
        // Note: Reading from legacy 'wins' field which currently contains match wins
        // This will be corrected after data migration (Phase 4)
        totalChampionships += tournamentStats.wins || 0; // Legacy: actually contains match wins
        totalRunnerUps += tournamentStats.runnerUps || 0;
        totalSemiFinals += tournamentStats.semiFinals || 0;
        totalTournamentsPlayed += tournamentStats.participations || 0; // Legacy: actually contains match count

        // Track best finish across all clubs
        if (tournamentStats.bestFinish !== null && tournamentStats.bestFinish !== undefined) {
          if (bestFinishEver === null || tournamentStats.bestFinish < bestFinishEver) {
            bestFinishEver = tournamentStats.bestFinish;
          }
        }

        if ((clubStats.currentStreak || 0) > maxClubStreak) {
          maxClubStreak = clubStats.currentStreak || 0;
        }
        if ((clubStats.longestStreak || 0) > maxClubLongestStreak) {
          maxClubLongestStreak = clubStats.longestStreak || 0;
        }

        clubStatsBreakdown.push({
          clubId: membership.clubId || doc.id.split('_')[0], // 🔧 FIX: Extract clubId from document ID format {clubId}_{userId}
          clubName: membership.clubName,
          wins: leagueWins,
          losses: leagueLosses,
          matches: leagueMatches,
          winRate: leagueMatches > 0 ? (leagueWins / leagueMatches) * 100 : 0,
          clubEloRating: clubStats.clubEloRating || 1200, // 🆕 PROJECT OLYMPUS: Club-specific ELO

          // 🏆 Tournament stats - Match statistics
          tournamentMatchWins: tournamentStats.tournamentWins || 0, // Renamed for clarity
          tournamentMatchLosses: tournamentStats.tournamentLosses || 0, // Renamed for clarity
          tournamentTotalMatches: tournamentStats.totalMatches || 0,

          // 🏆 Tournament stats - Placement statistics
          championships: tournamentStats.wins || 0, // Legacy: actually match wins
          runnerUps: tournamentStats.runnerUps || 0,
          semiFinals: tournamentStats.semiFinals || 0,
          tournamentsPlayed: tournamentStats.participations || 0, // Legacy: actually match count
          bestFinish: tournamentStats.bestFinish || null,

          // Legacy compatibility
          tournamentWins: tournamentStats.tournamentWins || 0,
          tournamentLosses: tournamentStats.tournamentLosses || 0,
          tournamentMatches: tournamentStats.totalMatches || 0,
        });
      });

      console.log('🏢 [CLUB STATS AGGREGATED]', {
        totalClubWins,
        totalClubLosses,
        totalClubMatches,
        numberOfClubs: clubStatsBreakdown.length,
      });

      // 3. Calculate totals (global + ALL club matches = global + league + tournament)
      const totalWins = (globalStats.wins || 0) + totalClubWins + totalTournamentWins;
      const totalLosses = (globalStats.losses || 0) + totalClubLosses + totalTournamentLosses;
      const totalMatches = totalWins + totalLosses;
      const totalWinRate = totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0;

      // 🏛️ CAPTAIN AMERICA: 3-Museum Architecture
      const aggregatedStats = {
        // Overall totals
        totalWins,
        totalLosses,
        totalMatches,
        totalWinRate,

        // 🌍 Museum 1: Public Matches (Global Stats)
        publicWins: globalStats.wins || 0,
        publicLosses: globalStats.losses || 0,
        publicMatches: (globalStats.wins || 0) + (globalStats.losses || 0),
        publicWinRate: globalStats.winRate || 0,

        // 🏢 Museum 2: Club League Matches (League-only Stats)
        leagueWins: totalClubWins,
        leagueLosses: totalClubLosses,
        leagueMatches: totalClubMatches,
        leagueWinRate: totalClubMatches > 0 ? (totalClubWins / totalClubMatches) * 100 : 0,

        // 🏆 Museum 3: Club Tournament Matches (Tournament-only Stats)
        // Match statistics
        tournamentMatchWins: totalTournamentWins, // Renamed for clarity
        tournamentMatchLosses: totalTournamentLosses, // Renamed for clarity
        tournamentTotalMatches: totalTournamentMatches,
        tournamentWinRate:
          totalTournamentMatches > 0 ? (totalTournamentWins / totalTournamentMatches) * 100 : 0,

        // Tournament placement statistics
        championships: totalChampionships, // Legacy: actually match wins until migration
        runnerUps: totalRunnerUps,
        semiFinals: totalSemiFinals,
        tournamentsPlayed: totalTournamentsPlayed, // Legacy: actually match count until migration
        bestFinish: bestFinishEver,

        // Legacy compatibility (old field names)
        tournamentWins: totalTournamentWins,
        tournamentLosses: totalTournamentLosses,
        tournamentMatches: totalTournamentMatches,

        // Legacy fields for backward compatibility
        globalWins: globalStats.wins || 0,
        globalLosses: globalStats.losses || 0,
        globalMatches: (globalStats.wins || 0) + (globalStats.losses || 0),
        globalWinRate: globalStats.winRate || 0,
        // 🔧 FIX: clubWins should include BOTH league and tournament
        clubWins: totalClubWins + totalTournamentWins,
        clubLosses: totalClubLosses + totalTournamentLosses,
        clubMatches: totalClubMatches + totalTournamentMatches,
        clubWinRate:
          totalClubMatches + totalTournamentMatches > 0
            ? ((totalClubWins + totalTournamentWins) /
                (totalClubMatches + totalTournamentMatches)) *
              100
            : 0,

        // ELO rating (from unified stats - weighted global + club)
        unifiedEloRating: globalStats.unifiedEloRating || 1200,

        // Streak (max across all contexts)
        currentStreak: Math.max(globalStats.currentStreak || 0, maxClubStreak),
        longestStreak: Math.max(globalStats.longestStreak || 0, maxClubLongestStreak),

        // Detailed club breakdown
        clubStatsBreakdown,

        // 🎯 [KIM FIX] MatchType-specific public stats for StatsTabContent
        // Structure: { singles: { matchesPlayed, wins, losses }, doubles: {...}, mixed_doubles: {...} }
        publicStats,
      };

      console.log('✅ [THOR] Unified history aggregation complete!', {
        totalMatches: aggregatedStats.totalMatches,
        totalWinRate: aggregatedStats.totalWinRate.toFixed(1) + '%',
      });

      return aggregatedStats;
    } catch (error) {
      console.error('❌ [THOR] Failed to aggregate user stats:', error);
      throw new Error(`통계 집계 실패: ${error.message}`);
    }
  }

  /**
   * 🏛️ OLYMPUS MISSION - Phase 1.1: Get all users for participant selection
   * Get all users from Firestore for UserSearchModal
   * @returns {Promise<Array>} Array of user objects with uid, displayName, photoURL, etc.
   */
  async getAllUsers() {
    try {
      console.log('👥 [getAllUsers] Fetching all users from Firestore...');

      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);

      if (snapshot.empty) {
        console.log('⚠️ [getAllUsers] No users found');
        return [];
      }

      const users = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
      }));

      console.log(`✅ [getAllUsers] Found ${users.length} users`);

      // 🔍 DEBUG: Log first user to check data structure
      if (users.length > 0) {
        console.log('🔍 [getAllUsers] First user data:', JSON.stringify(users[0], null, 2));
        console.log('🔍 [getAllUsers] First user keys:', Object.keys(users[0]));
      }

      return users;
    } catch (error) {
      console.error('❌ [getAllUsers] Error fetching users:', error);
      throw new Error(`사용자 목록 조회 실패: ${error.message}`);
    }
  }
}

// Create singleton instance
const userService = new UserService();

export default userService;
