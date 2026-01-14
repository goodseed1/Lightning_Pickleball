import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { UserProfile, MatchContext, RankingUpdateData, SkillLevel } from '../types/user';
import {
  calculateNewELO,
  updateUnifiedStats,
  updateClubStats,
  updateSkillLevelFromUnified,
  convertEloToLtr,
  createInitialUnifiedStats,
  createInitialClubStats,
  validateRankingUpdate,
} from '../utils/unifiedRankingUtils';
import clubService from './clubService';
import i18n from '../i18n';

/**
 * Unified ELO Ranking System
 *
 * This service implements a single, weighted ELO system that unifies all match results
 * into one skill rating while respecting match context through K-Factor weighting.
 *
 * Core Principles:
 * 1. Single source of truth: One ELO rating per player
 * 2. Context-weighted updates: Club matches have reduced K-Factor impact
 * 3. Unified skill calculation: All displays use the same ELO base
 * 4. Atomic updates with full data integrity
 *
 * Philosophy: Federal Model - One citizenship, contextual influence
 *
 * 📝 LPR vs NTRP 네이밍 규칙
 * UI 표시: "LPR" (Lightning Pickleball Rating)
 * 코드/DB: "ntrp" (함수명 convertEloToLtr 등)
 * 이유: Firestore 필드명 변경 위험 방지
 */
class RankingService {
  /**
   * K-Factor 결정 원칙 (K-Factor Decision Principles)
   *
   * Calculates dynamic K-Factor based on player experience and match context
   *
   * @param matchesPlayed - Total matches played by the player
   * @param isClubMatch - Whether this is a club match (receives 0.5x multiplier)
   * @returns K-Factor value (16-32 for global, 8-16 for club matches)
   */
  getKFactor(matchesPlayed: number, isClubMatch: boolean = false): number {
    console.log(
      `🎯 Calculating K-Factor for player with ${matchesPlayed} matches, club match: ${isClubMatch}`
    );

    // Base K-Factor determination based on experience
    let baseKFactor: number;

    if (matchesPlayed < 10) {
      // New players: High volatility for rapid rating adjustment
      baseKFactor = 32;
      console.log(`📈 New player K-Factor: ${baseKFactor} (rapid adjustment period)`);
    } else {
      // Experienced players: Lower volatility for stable ratings
      baseKFactor = 16;
      console.log(`⚖️ Experienced player K-Factor: ${baseKFactor} (stable rating period)`);
    }

    // Club match modifier: 0.5x multiplier for club matches
    if (isClubMatch) {
      const clubKFactor = baseKFactor * 0.5;
      console.log(`🏟️ Club match K-Factor reduced: ${baseKFactor} → ${clubKFactor}`);
      return clubKFactor;
    }

    return baseKFactor;
  }

  /**
   * Update Unified ELO after any match (public or club)
   *
   * Handles atomic updates to user's unified ranking with appropriate weighting
   * based on match context. All matches contribute to the same skill rating.
   */

  async updateUnifiedElo(
    userId: string,
    opponentElo: number,
    result: 'win' | 'loss',
    context: MatchContext,
    matchId: string
  ): Promise<{
    oldElo: number;
    newElo: number;
    kFactor: number;
    skillLevel: SkillLevel;
    clubStatsUpdated?: boolean;
  }> {
    const isClubMatch = context.type === 'club';
    console.log(
      `🎯 Updating Unified ELO for user ${userId}: ${result} vs opponent ELO ${opponentElo} (${context.type} match) [Match: ${matchId}]`
    );

    try {
      const userRef = doc(db, 'users', userId);

      return await runTransaction(db, async transaction => {
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists()) {
          throw new Error(i18n.t('services.ranking.userNotFound'));
        }

        const userData = userDoc.data() as UserProfile;

        // Initialize or get current unified stats
        const currentStats = userData.stats || createInitialUnifiedStats();
        const currentSkillLevel = userData.skillLevel || {
          selfAssessed: '3.0-3.5',
          lastUpdated: new Date().toISOString(),
          source: 'migration' as const,
        };

        // Calculate dynamic K-Factor with context weighting
        const kFactor = this.getKFactor(currentStats.matchesPlayed, isClubMatch);

        // Calculate new unified ELO with sanitization
        const rawOldElo = currentStats.unifiedEloRating;
        const oldElo =
          rawOldElo === null ||
          rawOldElo === undefined ||
          isNaN(rawOldElo) ||
          typeof rawOldElo !== 'number'
            ? 1200
            : rawOldElo;
        console.log(`🎯 Sanitized ELO: raw=${rawOldElo} → sanitized=${oldElo}`);
        const rawNewElo = calculateNewELO(oldElo, opponentElo, result, kFactor);
        const newElo =
          rawNewElo === null ||
          rawNewElo === undefined ||
          isNaN(rawNewElo) ||
          typeof rawNewElo !== 'number'
            ? 1200
            : rawNewElo;
        console.log(`🎯 Sanitized NEW ELO: raw=${rawNewElo} → sanitized=${newElo}`);

        // Update unified statistics
        const newStats = updateUnifiedStats(currentStats, result, newElo, isClubMatch);

        // Update skill level based on unified stats
        const newSkillLevel = updateSkillLevelFromUnified(currentSkillLevel, newStats);

        // Atomic update to main user document
        transaction.update(userRef, {
          stats: newStats,
          skillLevel: newSkillLevel,
          updatedAt: serverTimestamp(),
        });

        console.log(`✅ Unified ELO updated: ${oldElo} → ${newElo} (K-Factor: ${kFactor})`);
        console.log(
          `🎾 NTRP updated: ${newSkillLevel.calculated?.toFixed(1)} (confidence: ${newSkillLevel.confidence?.toFixed(2)})`
        );

        // If club match, also update club-specific stats (non-ELO)
        let clubStatsUpdated = false;
        if (isClubMatch && context.clubId) {
          try {
            const clubMembershipRef = doc(db, 'users', userId, 'clubMemberships', context.clubId);
            const membershipDoc = await transaction.get(clubMembershipRef);

            if (membershipDoc.exists()) {
              const membershipData = membershipDoc.data();
              const currentClubStats = membershipData.clubStats || createInitialClubStats();
              const newClubStats = updateClubStats(currentClubStats, result);

              transaction.update(clubMembershipRef, {
                clubStats: newClubStats,
                lastUpdated: serverTimestamp(),
              });

              clubStatsUpdated = true;
              console.log(`🏆 Club stats updated for ${context.clubName}: ${result}`);
            }
          } catch (clubError) {
            console.warn(
              '⚠️ Failed to update club stats, but unified ELO update succeeded:',
              clubError
            );
          }
        }

        return {
          oldElo,
          newElo,
          kFactor,
          skillLevel: newSkillLevel,
          clubStatsUpdated,
        };
      });
    } catch (error) {
      console.error('❌ Failed to update unified ELO:', error);
      throw new Error(
        `통합 ELO 업데이트 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      );
    }
  }

  /**
   * Process match result and update appropriate ELO system
   *
   * Master coordinator that determines context and delegates to
   * the appropriate ELO update function
   */
  async processMatchResult(rankingUpdateData: RankingUpdateData): Promise<{
    success: boolean;
    context: MatchContext;
    eloChange: number;
    newRating: number;
    details: unknown;
  }> {
    console.log(`🏁 Processing match result:`, rankingUpdateData);

    // Validate input data
    if (!validateRankingUpdate(rankingUpdateData)) {
      throw new Error(i18n.t('services.ranking.invalidRankingData'));
    }

    const { userId, context, result, opponentElo, matchId } = rankingUpdateData;

    try {
      // Process any match using unified ELO system
      const updateResult = await this.updateUnifiedElo(
        userId,
        opponentElo,
        result,
        context,
        matchId
      );

      return {
        success: true,
        context,
        eloChange: updateResult.newElo - updateResult.oldElo,
        newRating: updateResult.newElo,
        details: {
          type: 'unified',
          matchContext: context.type,
          clubId: context.clubId,
          clubName: context.clubName,
          oldElo: updateResult.oldElo,
          newElo: updateResult.newElo,
          kFactor: updateResult.kFactor,
          skillLevel: updateResult.skillLevel,
          clubStatsUpdated: updateResult.clubStatsUpdated,
        },
      };
    } catch (error) {
      console.error('❌ Failed to process match result:', error);
      return {
        success: false,
        context,
        eloChange: 0,
        newRating: 0,
        details: {
          error: error instanceof Error ? error.message : '알 수 없는 오류',
        },
      };
    }
  }

  /**
   * Get current unified ELO rating for a user
   *
   * Note: In the unified system, all users have one ELO rating regardless of context
   */
  async getCurrentElo(userId: string): Promise<number> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        console.log(`🎯 User ${userId} not found, returning default ELO: 1200`);
        return 1200; // Default starting ELO
      }

      const userData = userDoc.data() as UserProfile;
      const rawElo = userData.stats?.unifiedEloRating;

      // Robust validation to ensure we never return NaN
      if (rawElo === null || rawElo === undefined || isNaN(rawElo) || typeof rawElo !== 'number') {
        console.log(`🎯 User ${userId} has invalid ELO (${rawElo}), returning default: 1200`);
        return 1200;
      }

      console.log(`🎯 User ${userId} current ELO: ${rawElo}`);
      return rawElo;
    } catch (error) {
      console.error('❌ Failed to get current unified ELO:', error);
      return 1200; // Safe fallback
    }
  }

  /**
   * Preview ELO change without actually updating
   *
   * Useful for showing users what their rating change would be
   */
  async previewEloChange(
    userId: string,
    context: MatchContext,
    opponentElo: number,
    result: 'win' | 'loss'
  ): Promise<{
    currentElo: number;
    newElo: number;
    eloChange: number;
    kFactor: number;
  }> {
    const currentElo = await this.getCurrentElo(userId);

    // Get unified match count to determine K-Factor
    let matchesPlayed = 0;
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        matchesPlayed = userData.stats?.matchesPlayed || 0;
      }
    } catch (error) {
      console.warn('⚠️ Could not get match count for K-Factor calculation:', error);
    }

    const isClubMatch = context.type === 'club';
    const kFactor = this.getKFactor(matchesPlayed, isClubMatch);
    const newElo = calculateNewELO(currentElo, opponentElo, result, kFactor);

    return {
      currentElo,
      newElo,
      eloChange: newElo - currentElo,
      kFactor,
    };
  }

  /**
   * Get user ranking for specific time period
   * Returns ranking data for monthly, season, or all-time periods
   *
   * This implementation queries Firestore to get actual ranking data
   * based on unified ELO ratings within specified time periods
   *
   * 🎯 [KIM FIX] Now uses publicStats ELO for ranking when unifiedEloRating is not available
   * Also adds stable tiebreaker (userId) for consistent ranking when ELO scores are equal
   */
  async getUserRanking(
    userId: string,
    type: 'monthly' | 'season' | 'alltime'
  ): Promise<{
    currentRank: number;
    totalPlayers: number;
    rankingType: 'monthly' | 'season' | 'alltime';
  }> {
    try {
      console.log(`📊 Getting ${type} ranking for user ${userId}`);

      // Determine time filter based on ranking type
      const now = new Date();
      let startDate: Date;

      switch (type) {
        case 'monthly':
          // Current month rankings
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'season': {
          // Current season (3 months)
          const currentQuarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
          break;
        }
        case 'alltime':
          // All time - no date filter needed
          startDate = new Date(0); // Unix epoch
          break;
      }

      // Query users collection to get rankings
      // In production, this would ideally be a materialized view or cached collection
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);

      // 🎯 [KIM FIX] Helper to get best ELO from any source
      const getBestElo = (userData: UserProfile): number => {
        // 1. Try unified ELO first (include 1200 - it's valid for NTRP 3.0 users!)
        if (userData.stats?.unifiedEloRating) {
          return userData.stats.unifiedEloRating;
        }

        // 🎯 [KIM FIX v25] ELO 단일화: eloRatings만 사용 (Single Source of Truth)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const eloRatings = (userData as any).eloRatings;
        if (eloRatings) {
          const elos = [
            eloRatings.singles?.current,
            eloRatings.doubles?.current,
            eloRatings.mixed?.current,
          ].filter((elo): elo is number => elo !== undefined && elo > 0);

          if (elos.length > 0) {
            // Return highest ELO among all match types
            return Math.max(...elos);
          }
        }

        // 3. Default
        return 1200;
      };

      // 🎯 [KIM FIX v25] ELO 단일화: eloRatings 기반으로 체크
      const hasValidEloRatings = (userData: UserProfile): boolean => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const eloRatings = (userData as any).eloRatings;
        if (!eloRatings) return false;
        return (
          eloRatings.singles?.current > 0 ||
          eloRatings.doubles?.current > 0 ||
          eloRatings.mixed?.current > 0
        );
      };

      // 🎯 [NEW USER FIX] NTRP 기반 ELO 확인
      // 💡 온보딩이 필수이므로 unifiedEloRating이 있으면 = 의도적 선택
      // 새 사용자(경기 기록 없음)도 랭킹에 표시됨
      const hasNtrpBasedElo = (userData: UserProfile): boolean => {
        const stats = userData.stats as { unifiedEloRating?: number } | undefined;
        return stats?.unifiedEloRating !== undefined;
      };

      // Filter and sort users by ELO rating
      const rankedUsers = usersSnapshot.docs
        .map(doc => ({
          id: doc.id,
          data: doc.data() as UserProfile,
        }))
        .filter(user => {
          // Filter by users who have played matches in the time period
          const stats = user.data.stats;

          // 🎯 [KIM FIX] Include users who completed onboarding (they have ELO assigned)
          const hasCompletedOnboarding = user.data.isOnboardingComplete === true;

          // If no stats AND not completed onboarding - exclude
          if (!stats && !hasCompletedOnboarding) return false;

          // 🎯 [KIM FIX v25] Include users with valid eloRatings
          const hasValidElo = hasValidEloRatings(user.data);

          // 🎯 [NEW USER FIX] Include new users with NTRP-based ELO from onboarding
          const hasNtrpElo = hasNtrpBasedElo(user.data);

          // 🎯 [KIM FIX] Include onboarded users even without match history
          // No activity at all AND no NTRP ELO AND not onboarded - exclude
          if (!stats?.lastMatchDate && !hasValidElo && !hasNtrpElo && !hasCompletedOnboarding)
            return false;

          // For all-time, include everyone with stats, public ELO, NTRP ELO, or completed onboarding
          if (type === 'alltime') return true;

          // 🎯 [KIM FIX] For monthly/season - if no lastMatchDate but has valid ELO or completed onboarding,
          // include them (new users get ranked from day 1!)
          if (!stats?.lastMatchDate && (hasValidElo || hasNtrpElo || hasCompletedOnboarding))
            return true;

          // For monthly/season, check if they played in the period
          if (!stats?.lastMatchDate) return false;
          const lastMatch = new Date(stats.lastMatchDate);
          return lastMatch >= startDate;
        })
        .sort((a, b) => {
          // 🎯 [KIM FIX] Sort by best available ELO rating (descending)
          const eloA = getBestElo(a.data);
          const eloB = getBestElo(b.data);

          // Primary sort: ELO descending
          if (eloB !== eloA) {
            return eloB - eloA;
          }

          // 🎯 [KIM FIX] Tiebreaker: userId ascending (stable sort for equal ELO)
          return a.id.localeCompare(b.id);
        });

      // 🎯 [KIM FIX] Find user's rank with tie handling (sports-style ranking)
      // Same ELO = same rank (e.g., 1st, 1st, 3rd, 3rd instead of 1st, 2nd, 3rd, 4th)
      let currentRank = 0;
      const userIndex = rankedUsers.findIndex(user => user.id === userId);
      if (userIndex >= 0) {
        const userElo = getBestElo(rankedUsers[userIndex].data);
        // Count how many users have STRICTLY higher ELO
        const higherEloCount = rankedUsers.filter(u => getBestElo(u.data) > userElo).length;
        currentRank = higherEloCount + 1;
      }
      const totalPlayers = rankedUsers.length;

      console.log(`✅ ${type} ranking: User ${userId} is rank ${currentRank} of ${totalPlayers}`);

      return {
        currentRank,
        totalPlayers,
        rankingType: type,
      };
    } catch (error) {
      console.error(`❌ Failed to get ${type} ranking for user ${userId}:`, error);
      // Return default values on error
      return {
        currentRank: 0,
        totalPlayers: 0,
        rankingType: type,
      };
    }
  }

  /**
   * 🆕 [KIM] Get public ranking by specific matchType (singles/doubles/mixed_doubles)
   * Uses matchType-specific ELO for ranking calculation
   * 🆕 [KIM] Added gender filter - users only compete against same gender
   */
  async getPublicRankingByMatchType(
    userId: string,
    matchType: 'singles' | 'doubles' | 'mixed_doubles',
    period: 'monthly' | 'season' | 'alltime',
    gender?: 'male' | 'female'
  ): Promise<{
    currentRank: number;
    totalPlayers: number;
  }> {
    try {
      console.log(
        `📊 Getting ${matchType} ${period} ranking for user ${userId} (gender: ${gender || 'all'})`
      );

      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);

      // 🎯 [KIM FIX v25] ELO 단일화: eloRatings만 사용 (Single Source of Truth)
      const getMatchTypeElo = (userData: UserProfile): number => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const eloRatings = (userData as any).eloRatings;
        const matchTypeKey = matchType === 'mixed_doubles' ? 'mixed' : matchType;
        const currentElo = eloRatings?.[matchTypeKey]?.current;

        if (currentElo && currentElo > 0) {
          return currentElo;
        }

        return 1200; // Default ELO
      };

      // 🎯 [KIM FIX v4] Helper to check if user completed onboarding
      // 전체 탭(getPublicRankingByWinRate)과 동일한 로직 사용
      const hasCompletedOnboarding = (userData: UserProfile): boolean => {
        // 1. stats.unifiedEloRating 확인 (새 사용자)
        const stats = userData.stats as { unifiedEloRating?: number } | undefined;
        if (stats?.unifiedEloRating !== undefined) return true;

        // 2. isOnboardingComplete 플래그 확인 (기존 사용자)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((userData as any).isOnboardingComplete === true) return true;

        // 3. eloRatings 객체 확인 (기존 사용자)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const eloRatings = (userData as any).eloRatings;
        if (
          eloRatings?.singles?.current ||
          eloRatings?.doubles?.current ||
          eloRatings?.mixed?.current
        ) {
          return true;
        }

        // 4. displayName이 있으면 온보딩 완료로 간주 (7명의 레거시 사용자 포함)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const displayName = (userData as any).displayName || (userData as any).profile?.displayName;
        if (displayName && displayName.trim().length > 0) return true;

        return false;
      };

      // 🆕 [KIM] Helper to get user's gender
      const getUserGender = (userData: UserProfile): 'male' | 'female' | null => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userGender = (userData as any).gender || (userData as any).profile?.gender;
        if (userGender === 'male' || userGender === 'female') {
          return userGender;
        }
        return null;
      };

      // Filter and sort users
      const rankedUsers = usersSnapshot.docs
        .map(doc => ({
          id: doc.id,
          data: doc.data() as UserProfile,
        }))
        .filter(user => hasCompletedOnboarding(user.data))
        // 🆕 [KIM] Filter by gender if specified
        .filter(user => {
          if (!gender) return true; // No gender filter, include all
          const userGender = getUserGender(user.data);
          return userGender === gender;
        })
        .sort((a, b) => {
          const eloA = getMatchTypeElo(a.data);
          const eloB = getMatchTypeElo(b.data);
          if (eloB !== eloA) return eloB - eloA;
          return a.id.localeCompare(b.id);
        });

      // Find user's rank with tie handling
      let currentRank = 0;
      const userIndex = rankedUsers.findIndex(user => user.id === userId);
      if (userIndex >= 0) {
        const userElo = getMatchTypeElo(rankedUsers[userIndex].data);
        const higherEloCount = rankedUsers.filter(u => getMatchTypeElo(u.data) > userElo).length;
        currentRank = higherEloCount + 1;
      }

      console.log(
        `✅ ${matchType} ${period} ranking: User ${userId} is rank ${currentRank} of ${rankedUsers.length}`
      );

      return {
        currentRank,
        totalPlayers: rankedUsers.length,
      };
    } catch (error) {
      console.error(`❌ Failed to get ${matchType} ranking:`, error);
      return { currentRank: 0, totalPlayers: 0 };
    }
  }

  /**
   * 🆕 [KIM FIX v2] Get public ranking by average ELO (for "all" tab)
   * Uses average ELO across all matchTypes (singles + doubles + mixed) / 3
   * 🆕 [KIM] Added gender filter - users only compete against same gender
   */
  async getPublicRankingByWinRate(
    userId: string,
    period: 'monthly' | 'season' | 'alltime',
    gender?: 'male' | 'female'
  ): Promise<{
    currentRank: number;
    totalPlayers: number;
    elo: number; // 🎯 [KIM FIX] Added average ELO to return value
  }> {
    try {
      console.log(
        `📊 Getting average ELO ${period} ranking for user ${userId} (gender: ${gender || 'all'})`
      );

      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);

      // 🎯 [KIM FIX v25] ELO 단일화: eloRatings만 사용 (Single Source of Truth)
      const getMatchTypeEloForUser = (
        userData: UserProfile,
        matchType: 'singles' | 'doubles' | 'mixed_doubles'
      ): number => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const eloRatings = (userData as any).eloRatings;
        const matchTypeKey = matchType === 'mixed_doubles' ? 'mixed' : matchType;
        const currentElo = eloRatings?.[matchTypeKey]?.current;

        if (currentElo && currentElo > 0) {
          return currentElo;
        }

        return 1200; // Default
      };

      // 🎯 [KIM FIX v2] Calculate average ELO across all matchTypes
      const getAverageElo = (userData: UserProfile): number => {
        const singlesElo = getMatchTypeEloForUser(userData, 'singles');
        const doublesElo = getMatchTypeEloForUser(userData, 'doubles');
        const mixedElo = getMatchTypeEloForUser(userData, 'mixed_doubles');
        return (singlesElo + doublesElo + mixedElo) / 3;
      };

      // 🎯 [KIM FIX] 온보딩 완료 사용자 확인 - 여러 필드 체크 (기존 사용자 호환성)
      // 경기가 없어도 온보딩에서 LPR 선택했으면 랭킹에 포함
      const hasCompletedOnboarding = (userData: UserProfile): boolean => {
        // 1. stats.unifiedEloRating 확인 (새 사용자)
        const stats = userData.stats as { unifiedEloRating?: number } | undefined;
        if (stats?.unifiedEloRating !== undefined) return true;

        // 2. isOnboardingComplete 플래그 확인 (기존 사용자)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((userData as any).isOnboardingComplete === true) return true;

        // 3. eloRatings 객체 확인 (기존 사용자)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const eloRatings = (userData as any).eloRatings;
        if (
          eloRatings?.singles?.current ||
          eloRatings?.doubles?.current ||
          eloRatings?.mixed?.current
        ) {
          return true;
        }

        // 4. displayName이 있으면 온보딩 완료로 간주
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const displayName = (userData as any).displayName || (userData as any).profile?.displayName;
        if (displayName && displayName.trim().length > 0) return true;

        return false;
      };

      // 🆕 [KIM] Helper to get user's gender
      const getUserGender = (userData: UserProfile): 'male' | 'female' | null => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userGender = (userData as any).gender || (userData as any).profile?.gender;
        if (userGender === 'male' || userGender === 'female') {
          return userGender;
        }
        return null;
      };

      // 🎯 [KIM FIX v2] Filter and sort users by average ELO
      // 온보딩 완료한 사용자만 포함
      // 🆕 [KIM] Gender filter applied if specified
      const rankedUsers = usersSnapshot.docs
        .map(doc => ({
          id: doc.id,
          data: doc.data() as UserProfile,
        }))
        .filter(user => hasCompletedOnboarding(user.data))
        // 🆕 [KIM] Filter by gender if specified
        .filter(user => {
          if (!gender) return true; // No gender filter, include all
          const userGender = getUserGender(user.data);
          return userGender === gender;
        })
        .sort((a, b) => {
          const avgEloA = getAverageElo(a.data);
          const avgEloB = getAverageElo(b.data);
          if (avgEloB !== avgEloA) return avgEloB - avgEloA;
          // Tie-break by user ID for consistent ordering
          return a.id.localeCompare(b.id);
        });

      // Find user's rank with tie handling
      let currentRank = 0;
      let userAvgElo = 1200; // 🎯 [KIM FIX] Default ELO
      const userIndex = rankedUsers.findIndex(user => user.id === userId);
      if (userIndex >= 0) {
        userAvgElo = Math.round(getAverageElo(rankedUsers[userIndex].data));
        const higherEloCount = rankedUsers.filter(u => getAverageElo(u.data) > userAvgElo).length;
        currentRank = higherEloCount + 1;
      }

      console.log(
        `✅ Average ELO ${period} ranking: User ${userId} is rank ${currentRank} of ${rankedUsers.length} (ELO: ${userAvgElo})`
      );

      return {
        currentRank,
        totalPlayers: rankedUsers.length,
        elo: userAvgElo, // 🎯 [KIM FIX] Return user's average ELO
      };
    } catch (error) {
      console.error(`❌ Failed to get overall win rate ranking:`, error);
      return { currentRank: 0, totalPlayers: 0, elo: 1200 };
    }
  }

  /**
   * 🆕 PROJECT OLYMPUS: Get club-specific ELO rating for a user
   *
   * Retrieves independent club ELO rating (separate from unified global ELO)
   * Each club maintains its own isolated ELO ecosystem
   *
   * @param userId - User ID to query
   * @param clubId - Club ID to query
   * @returns Club ELO rating (default 1200 if not set)
   */
  async getClubElo(userId: string, clubId: string): Promise<number> {
    try {
      const membershipRef = doc(db, 'users', userId, 'clubMemberships', clubId);
      const membershipDoc = await getDoc(membershipRef);

      if (!membershipDoc.exists()) {
        console.log(
          `🎯 Club membership not found for user ${userId} in club ${clubId}, returning default: 1200`
        );
        return 1200; // Default starting club ELO
      }

      const membershipData = membershipDoc.data();
      const rawClubElo = membershipData.clubStats?.clubEloRating;

      // Robust validation to ensure we never return NaN
      if (
        rawClubElo === null ||
        rawClubElo === undefined ||
        isNaN(rawClubElo) ||
        typeof rawClubElo !== 'number'
      ) {
        console.log(
          `🎯 User ${userId} has invalid club ELO (${rawClubElo}) in club ${clubId}, returning default: 1200`
        );
        return 1200;
      }

      console.log(`🎯 User ${userId} current club ELO in ${clubId}: ${rawClubElo}`);
      return rawClubElo;
    } catch (error) {
      console.error('❌ Failed to get club ELO:', error);
      return 1200; // Safe fallback
    }
  }

  /**
   * 🆕 PROJECT OLYMPUS: Preview club ELO change without actually updating
   *
   * Useful for showing users what their club rating change would be
   * Uses independent club ELO calculation (not unified system)
   */
  async previewClubEloChange(
    userId: string,
    clubId: string,
    opponentElo: number,
    result: 'win' | 'loss'
  ): Promise<{
    currentElo: number;
    newElo: number;
    eloChange: number;
    kFactor: number;
  }> {
    const currentElo = await this.getClubElo(userId, clubId);

    // Get club match count to determine K-Factor
    let clubMatchesPlayed = 0;
    try {
      const membershipRef = doc(db, 'users', userId, 'clubMemberships', clubId);
      const membershipDoc = await getDoc(membershipRef);
      if (membershipDoc.exists()) {
        const membershipData = membershipDoc.data();
        clubMatchesPlayed = membershipData.clubStats?.matchesPlayed || 0;
      }
    } catch (error) {
      console.warn('⚠️ Could not get club match count for K-Factor calculation:', error);
    }

    // Club ELO uses different K-Factor logic than unified system
    // K-Factor: 32 for <10 matches, 16 for >=10 matches
    const kFactor = clubMatchesPlayed < 10 ? 32 : 16;

    // Use same calculation as unified system
    const newElo = calculateNewELO(currentElo, opponentElo, result, kFactor);

    return {
      currentElo,
      newElo,
      eloChange: newElo - currentElo,
      kFactor,
    };
  }

  /**
   * Get comprehensive ranking information for a user in unified system
   * Respects club privacy settings - only returns club rankings user is authorized to view
   */
  async getUserRankingInfo(
    userId: string,
    viewerId?: string
  ): Promise<{
    unifiedRanking: {
      elo: number;
      ntrp: number;
      matches: number;
      winRate: number;
      confidence: number;
      publicMatches: number;
      clubMatches: number;
    } | null;
    clubRankings: Array<{
      clubId: string;
      clubName: string;
      matches: number;
      winRate: number;
      clubRanking?: number;
      clubEloRating?: number; // 🆕 PROJECT OLYMPUS: Club-specific ELO rating
      isPrivate?: boolean; // Indicates if ranking is hidden due to privacy settings
    }>;
  }> {
    try {
      // Get unified ranking (single source of truth)
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      let unifiedRanking = null;
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        if (userData.stats) {
          unifiedRanking = {
            elo: userData.stats.unifiedEloRating,
            ntrp: convertEloToLtr(userData.stats.unifiedEloRating),
            matches: userData.stats.matchesPlayed,
            winRate: userData.stats.winRate,
            confidence: userData.skillLevel?.confidence || 0,
            publicMatches: userData.stats.publicMatches || 0,
            clubMatches: userData.stats.clubMatches || 0,
          };
        }
      }

      // Get club rankings with privacy checking
      const clubRankings: Array<{
        clubId: string;
        clubName: string;
        matches: number;
        winRate: number;
        clubRanking?: number;
        clubEloRating?: number; // 🆕 PROJECT OLYMPUS: Club-specific ELO rating
        isPrivate?: boolean;
      }> = [];

      try {
        const membershipsRef = collection(db, 'users', userId, 'clubMemberships');
        const membershipsSnapshot = await getDocs(membershipsRef);

        // Process each club membership
        for (const membershipDoc of membershipsSnapshot.docs) {
          const membershipData = membershipDoc.data();
          const clubId = membershipDoc.id;

          if (membershipData.clubStats) {
            // Check if the viewing user can see this club's rankings
            const canViewRankings = viewerId
              ? await clubService.canViewClubRankings(clubId, viewerId)
              : userId === viewerId || !viewerId; // User can always see own rankings unless explicitly blocked

            if (canViewRankings) {
              // User can view full ranking data
              clubRankings.push({
                clubId,
                clubName: membershipData.clubName,
                matches: membershipData.clubStats.matchesPlayed,
                winRate: membershipData.clubStats.winRate,
                clubRanking: membershipData.clubStats.clubRanking,
                clubEloRating: membershipData.clubStats.clubEloRating || 1200, // 🆕 PROJECT OLYMPUS
                isPrivate: false,
              });
            } else {
              // User cannot view rankings - show privacy placeholder
              clubRankings.push({
                clubId,
                clubName: membershipData.clubName,
                matches: 0,
                winRate: 0,
                isPrivate: true,
              });
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not load club rankings:', error);
      }

      return {
        unifiedRanking,
        clubRankings,
      };
    } catch (error) {
      console.error('❌ Failed to get user ranking info:', error);
      throw new Error(i18n.t('services.ranking.rankingInfoFailed'));
    }
  }
}

// Create singleton instance
const rankingService = new RankingService();

export default rankingService;
