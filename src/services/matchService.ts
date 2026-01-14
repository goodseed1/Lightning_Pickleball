/**
 * Match Service
 * 경기 점수 기록 및 관리 서비스
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  runTransaction,
  Transaction,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  Match,
  MatchType,
  MatchStatus,
  MatchFormat,
  ScoreInputForm,
  PlayerMatchStats,
  HeadToHeadRecord,
  MatchFilterOptions,
  MatchListResponse,
  calculateMatchWinner,
} from '../types/match';
import { PickleballEventType, getMatchFormatFromEventType } from '../types/league';
import i18n from '../i18n';

class MatchService {
  private matchesCollection = collection(db, 'matches');
  private playerStatsCollection = collection(db, 'playerStats');
  private headToHeadCollection = collection(db, 'headToHeadRecords');

  /**
   * Create a new match with event type support
   * 새 경기 생성 (경기 종류 지원)
   */
  async createMatch(matchData: {
    type: MatchType;
    eventType?: PickleballEventType; // ⭐ 경기 종류 추가
    format: MatchFormat;
    player1Id: string;
    player2Id: string;
    player1PartnerId?: string;
    player2PartnerId?: string;
    scheduledAt: Date;
    clubId: string;
    leagueId?: string;
    tournamentId?: string;
    eventId?: string;
    createdBy: string;
  }): Promise<string> {
    try {
      // Get player information
      const player1Doc = await getDoc(doc(db, 'users', matchData.player1Id));
      const player2Doc = await getDoc(doc(db, 'users', matchData.player2Id));

      if (!player1Doc.exists() || !player2Doc.exists()) {
        throw new Error(i18n.t('services.match.participantNotFound'));
      }

      const player1Data = player1Doc.data();
      const player2Data = player2Doc.data();

      // Validate event type for lightning matches
      if (matchData.type === 'lightning_match' && matchData.eventType) {
        const expectedFormat = getMatchFormatFromEventType(matchData.eventType);
        if (matchData.format !== expectedFormat) {
          throw new Error(
            i18n.t('services.match.invalidEventType', {
              eventType: matchData.eventType,
              expectedFormat,
            })
          );
        }
      }

      const match: Omit<Match, 'id'> = {
        type: matchData.type,
        format: matchData.format,
        eventType: matchData.eventType, // ⭐ 경기 종류 추가
        player1: {
          userId: matchData.player1Id,
          userName: player1Data.displayName || player1Data.name || 'Unknown',
          skillLevel: player1Data.skillLevel || 'intermediate',
          photoURL: player1Data.photoURL,
        },
        player2: {
          userId: matchData.player2Id,
          userName: player2Data.displayName || player2Data.name || 'Unknown',
          skillLevel: player2Data.skillLevel || 'intermediate',
          photoURL: player2Data.photoURL,
        },
        scheduledAt: Timestamp.fromDate(matchData.scheduledAt),
        status: 'scheduled',
        clubId: matchData.clubId,
        leagueId: matchData.leagueId,
        tournamentId: matchData.tournamentId,
        eventId: matchData.eventId,
        createdBy: matchData.createdBy,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Handle doubles partners if provided
      if (matchData.format === 'doubles') {
        if (matchData.player1PartnerId) {
          const partner1Doc = await getDoc(doc(db, 'users', matchData.player1PartnerId));
          if (partner1Doc.exists()) {
            const partner1Data = partner1Doc.data();
            match.player1Partner = {
              userId: matchData.player1PartnerId,
              userName: partner1Data.displayName || partner1Data.name || 'Unknown',
              skillLevel: partner1Data.skillLevel || 'intermediate',
              photoURL: partner1Data.photoURL,
            };
          }
        }

        if (matchData.player2PartnerId) {
          const partner2Doc = await getDoc(doc(db, 'users', matchData.player2PartnerId));
          if (partner2Doc.exists()) {
            const partner2Data = partner2Doc.data();
            match.player2Partner = {
              userId: matchData.player2PartnerId,
              userName: partner2Data.displayName || partner2Data.name || 'Unknown',
              skillLevel: partner2Data.skillLevel || 'intermediate',
              photoURL: partner2Data.photoURL,
            };
          }
        }
      }

      const docRef = await addDoc(this.matchesCollection, match);
      console.log('✅ Match created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating match:', error);
      throw error;
    }
  }

  /**
   * Submit match score
   * 경기 점수 제출
   */
  async submitScore(
    matchId: string,
    scoreData: ScoreInputForm,
    submittedBy: string
  ): Promise<void> {
    try {
      const matchRef = doc(this.matchesCollection, matchId);
      const matchDoc = await getDoc(matchRef);

      if (!matchDoc.exists()) {
        throw new Error(i18n.t('services.match.matchNotFound'));
      }

      const match = { id: matchDoc.id, ...matchDoc.data() } as Match;

      // Verify that the submitter is a participant
      const isParticipant =
        match.player1.userId === submittedBy ||
        match.player2.userId === submittedBy ||
        match.player1Partner?.userId === submittedBy ||
        match.player2Partner?.userId === submittedBy;

      if (!isParticipant) {
        throw new Error(i18n.t('services.match.onlyParticipantCanSubmit'));
      }

      // Calculate winner
      const _winner = calculateMatchWinner(scoreData.sets);

      const updatedMatch = {
        score: {
          sets: scoreData.sets,
          _winner,
          isComplete: _winner !== null,
          retiredAt: scoreData.retiredAt,
          walkover: scoreData.walkover,
        },
        status: 'pending_confirmation' as MatchStatus,
        scoreSubmittedBy: submittedBy,
        scoreSubmittedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await updateDoc(matchRef, updatedMatch);
      console.log('✅ Score submitted for match:', matchId);
    } catch (error) {
      console.error('❌ Error submitting score:', error);
      throw error;
    }
  }

  /**
   * Confirm or dispute submitted score
   * 제출된 점수 확인 또는 이의제기
   */
  async confirmScore(
    matchId: string,
    agreed: boolean,
    confirmedBy: string,
    reason?: string
  ): Promise<void> {
    try {
      const matchRef = doc(this.matchesCollection, matchId);

      await runTransaction(db, async transaction => {
        const matchDoc = await transaction.get(matchRef);

        if (!matchDoc.exists()) {
          throw new Error(i18n.t('services.match.matchNotFound'));
        }

        const match = { id: matchDoc.id, ...matchDoc.data() } as Match;

        // Verify that the confirmer is the other participant
        const submittedByPlayer1 = match.scoreSubmittedBy === match.player1.userId;
        const shouldConfirm =
          (confirmedBy === match.player1.userId && !submittedByPlayer1) ||
          (confirmedBy === match.player2.userId && submittedByPlayer1);

        if (!shouldConfirm) {
          throw new Error(i18n.t('services.match.noPermissionToConfirm'));
        }

        const updateData: Partial<Match> = {
          scoreConfirmedBy: confirmedBy,
          scoreConfirmedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        if (agreed) {
          // Score confirmed - finalize the match
          updateData.status = 'confirmed';
          transaction.update(matchRef, updateData);

          // Update player statistics
          await this.updatePlayerStatistics(match, transaction);
        } else {
          // Score disputed
          updateData.status = 'disputed';
          updateData.disputeReason = reason;
          transaction.update(matchRef, updateData);
        }
      });

      console.log('✅ Score confirmation processed for match:', matchId);
    } catch (error) {
      console.error('❌ Error confirming score:', error);
      throw error;
    }
  }

  /**
   * Update player statistics after match confirmation
   * 경기 확정 후 선수 통계 업데이트
   */
  private async updatePlayerStatistics(match: Match, transaction: Transaction): Promise<void> {
    if (!match.score?._winner) return;

    const player1Id = match.player1.userId;
    const player2Id = match.player2.userId;
    const player1Won = match.score._winner === 'player1';

    // Update individual player stats
    await this.updatePlayerStats(player1Id, match.clubId, player1Won, match, transaction);
    await this.updatePlayerStats(player2Id, match.clubId, !player1Won, match, transaction);

    // Update head-to-head record
    await this.updateHeadToHeadRecord(
      player1Id,
      player2Id,
      match.clubId,
      player1Won,
      match.id,
      transaction
    );
  }

  /**
   * Update individual player statistics
   * 개별 선수 통계 업데이트
   */
  private async updatePlayerStats(
    playerId: string,
    clubId: string,
    won: boolean,
    match: Match,
    transaction: Transaction
  ): Promise<void> {
    const statsId = `${clubId}_${playerId}`;
    const statsRef = doc(this.playerStatsCollection, statsId);
    const statsDoc = await transaction.get(statsRef);

    let stats: PlayerMatchStats;

    if (statsDoc.exists()) {
      stats = statsDoc.data() as PlayerMatchStats;
    } else {
      stats = {
        userId: playerId,
        clubId: clubId,
        totalMatches: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        leagueStats: { matches: 0, wins: 0, losses: 0 },
        tournamentStats: { matches: 0, wins: 0, losses: 0 },
        lightningMatchStats: { matches: 0, wins: 0, losses: 0 },
        eventTypeStats: {}, // ⭐ 경기 종류별 통계 초기화
        currentStreak: 0,
        longestWinStreak: 0,
        recentMatches: [],
        lastUpdated: Timestamp.now(),
        // ⭐ Official Tiebreaker: Set/Game statistics initialization
        setsWon: 0,
        setsLost: 0,
        gamesWon: 0,
        gamesLost: 0,
      };
    }

    // Update total stats
    stats.totalMatches++;
    if (won) {
      stats.wins++;
      stats.currentStreak = stats.currentStreak >= 0 ? stats.currentStreak + 1 : 1;
      stats.longestWinStreak = Math.max(stats.longestWinStreak, stats.currentStreak);
    } else {
      stats.losses++;
      stats.currentStreak = stats.currentStreak <= 0 ? stats.currentStreak - 1 : -1;
    }
    stats.winRate = stats.totalMatches > 0 ? (stats.wins / stats.totalMatches) * 100 : 0;

    // Update type-specific stats
    const typeKey =
      match.type === 'lightning_match'
        ? 'lightningMatchStats'
        : match.type === 'league'
          ? 'leagueStats'
          : match.type === 'tournament'
            ? 'tournamentStats'
            : 'lightningMatchStats';

    stats[typeKey].matches++;
    if (won) {
      stats[typeKey].wins++;
    } else {
      stats[typeKey].losses++;
    }

    // ⭐ Update event type specific stats for lightning matches
    if (match.type === 'lightning_match' && match.eventType) {
      if (!stats.eventTypeStats) {
        stats.eventTypeStats = {};
      }

      if (!stats.eventTypeStats[match.eventType]) {
        stats.eventTypeStats[match.eventType] = {
          matches: 0,
          wins: 0,
          losses: 0,
          setsWon: 0,
          setsLost: 0,
          gamesWon: 0,
          gamesLost: 0,
        };
      }

      const eventStats = stats.eventTypeStats[match.eventType];
      if (eventStats) {
        eventStats.matches++;

        if (won) {
          eventStats.wins++;
        } else {
          eventStats.losses++;
        }

        // Calculate set and game statistics from the match score
        if (match.score && match.score.sets) {
          const isPlayer1 = match.player1.userId === playerId;

          match.score.sets.forEach(set => {
            const playerGames = isPlayer1 ? set.player1Games : set.player2Games;
            const opponentGames = isPlayer1 ? set.player2Games : set.player1Games;

            eventStats.gamesWon += playerGames;
            eventStats.gamesLost += opponentGames;

            // Count sets won/lost
            if (playerGames > opponentGames) {
              eventStats.setsWon++;
            } else if (opponentGames > playerGames) {
              eventStats.setsLost++;
            }
          });
        }
      }
    }

    // ⭐ Official Tiebreaker: Track set/game statistics for ALL match types
    // (lightning, league, tournament - applies to all)
    if (match.score && match.score.sets) {
      const isPlayer1 = match.player1.userId === playerId;

      // Initialize fields if they don't exist (for backward compatibility)
      if (stats.setsWon === undefined) stats.setsWon = 0;
      if (stats.setsLost === undefined) stats.setsLost = 0;
      if (stats.gamesWon === undefined) stats.gamesWon = 0;
      if (stats.gamesLost === undefined) stats.gamesLost = 0;

      match.score.sets.forEach(set => {
        const playerGames = isPlayer1 ? set.player1Games : set.player2Games;
        const opponentGames = isPlayer1 ? set.player2Games : set.player1Games;

        // Accumulate game counts
        if (stats.gamesWon !== undefined && stats.gamesLost !== undefined) {
          stats.gamesWon += playerGames;
          stats.gamesLost += opponentGames;
        }

        // Accumulate set wins/losses
        if (stats.setsWon !== undefined && stats.setsLost !== undefined) {
          if (playerGames > opponentGames) {
            stats.setsWon++;
          } else if (opponentGames > playerGames) {
            stats.setsLost++;
          }
        }
      });
    }

    // Update recent matches (keep last 10)
    stats.recentMatches.unshift(match.id);
    if (stats.recentMatches.length > 10) {
      stats.recentMatches = stats.recentMatches.slice(0, 10);
    }

    stats.lastUpdated = Timestamp.now();

    transaction.set(statsRef, stats);
  }

  /**
   * Update head-to-head record between two players
   * 두 선수 간 상대전 기록 업데이트
   */
  private async updateHeadToHeadRecord(
    player1Id: string,
    player2Id: string,
    clubId: string,
    player1Won: boolean,
    matchId: string,
    transaction: Transaction
  ): Promise<void> {
    // Create consistent ID regardless of player order
    const recordId =
      player1Id < player2Id
        ? `${clubId}_${player1Id}_${player2Id}`
        : `${clubId}_${player2Id}_${player1Id}`;

    const recordRef = doc(this.headToHeadCollection, recordId);
    const recordDoc = await transaction.get(recordRef);

    let record: HeadToHeadRecord;

    if (recordDoc.exists()) {
      record = recordDoc.data() as HeadToHeadRecord;
    } else {
      record = {
        player1Id: player1Id < player2Id ? player1Id : player2Id,
        player2Id: player1Id < player2Id ? player2Id : player1Id,
        clubId: clubId,
        player1Wins: 0,
        player2Wins: 0,
        totalMatches: 0,
        recentMatches: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
    }

    // Update wins based on consistent player order
    const isPlayer1InRecord = record.player1Id === player1Id;
    if ((player1Won && isPlayer1InRecord) || (!player1Won && !isPlayer1InRecord)) {
      record.player1Wins++;
    } else {
      record.player2Wins++;
    }

    record.totalMatches++;
    record.recentMatches.unshift(matchId);
    if (record.recentMatches.length > 10) {
      record.recentMatches = record.recentMatches.slice(0, 10);
    }
    record.lastPlayed = Timestamp.now();
    record.updatedAt = Timestamp.now();

    transaction.set(recordRef, record);
  }

  /**
   * Get match by ID
   * ID로 경기 조회
   */
  async getMatch(matchId: string): Promise<Match | null> {
    try {
      const matchDoc = await getDoc(doc(this.matchesCollection, matchId));

      if (!matchDoc.exists()) {
        return null;
      }

      return { id: matchDoc.id, ...matchDoc.data() } as Match;
    } catch (error) {
      console.error('❌ Error getting match:', error);
      throw error;
    }
  }

  /**
   * Get matches with filters
   * 필터를 적용한 경기 목록 조회
   */
  async getMatches(filters: MatchFilterOptions, pageSize: number = 20): Promise<MatchListResponse> {
    try {
      let q = query(this.matchesCollection);

      // Apply filters
      q = query(q, where('clubId', '==', filters.clubId));

      if (filters.playerId) {
        // Note: This is a simplified query. In production, you might need to use array-contains
        // or create separate queries for different player positions
        q = query(q, where('player1.userId', '==', filters.playerId));
      }

      if (filters.type && filters.type.length > 0) {
        q = query(q, where('type', 'in', filters.type));
      }

      if (filters.status && filters.status.length > 0) {
        q = query(q, where('status', 'in', filters.status));
      }

      if (filters.leagueId) {
        q = query(q, where('leagueId', '==', filters.leagueId));
      }

      if (filters.tournamentId) {
        q = query(q, where('tournamentId', '==', filters.tournamentId));
      }

      // Apply sorting
      if (filters.sortBy === 'date') {
        q = query(q, orderBy('scheduledAt', filters.sortOrder));
      } else if (filters.sortBy === 'status') {
        q = query(q, orderBy('status', filters.sortOrder));
      }

      q = query(q, limit(pageSize + 1)); // Get one extra to check if there are more

      const snapshot = await getDocs(q);
      const matches = snapshot.docs.slice(0, pageSize).map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Match[];

      return {
        matches,
        totalCount: matches.length,
        hasMore: snapshot.docs.length > pageSize,
      };
    } catch (error) {
      console.error('❌ Error getting matches:', error);
      throw error;
    }
  }

  /**
   * Get player statistics
   * 선수 통계 조회
   */
  async getPlayerStats(playerId: string, clubId: string): Promise<PlayerMatchStats | null> {
    try {
      const statsId = `${clubId}_${playerId}`;
      const statsDoc = await getDoc(doc(this.playerStatsCollection, statsId));

      if (!statsDoc.exists()) {
        return null;
      }

      return statsDoc.data() as PlayerMatchStats;
    } catch (error) {
      console.error('❌ Error getting player stats:', error);
      throw error;
    }
  }

  /**
   * Get head-to-head record between two players
   * 두 선수 간 상대전 기록 조회
   */
  async getHeadToHeadRecord(
    player1Id: string,
    player2Id: string,
    clubId: string
  ): Promise<HeadToHeadRecord | null> {
    try {
      const recordId =
        player1Id < player2Id
          ? `${clubId}_${player1Id}_${player2Id}`
          : `${clubId}_${player2Id}_${player1Id}`;

      const recordDoc = await getDoc(doc(this.headToHeadCollection, recordId));

      if (!recordDoc.exists()) {
        return null;
      }

      return recordDoc.data() as HeadToHeadRecord;
    } catch (error) {
      console.error('❌ Error getting head-to-head record:', error);
      throw error;
    }
  }

  /**
   * Admin function: Resolve disputed match
   * 관리자 기능: 분쟁 경기 해결
   */
  async resolveDispute(
    matchId: string,
    resolvedBy: string,
    finalScore?: ScoreInputForm
  ): Promise<void> {
    try {
      const matchRef = doc(this.matchesCollection, matchId);

      await runTransaction(db, async transaction => {
        const matchDoc = await transaction.get(matchRef);

        if (!matchDoc.exists()) {
          throw new Error(i18n.t('services.match.matchNotFound'));
        }

        const match = { id: matchDoc.id, ...matchDoc.data() } as Match;

        if (match.status !== 'disputed') {
          throw new Error(i18n.t('services.match.notDisputed'));
        }

        const updateData: Partial<Match> = {
          status: 'confirmed',
          disputeResolvedBy: resolvedBy,
          disputeResolvedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        // If admin provided new score, update it
        if (finalScore) {
          const _winner = calculateMatchWinner(finalScore.sets);
          updateData.score = {
            sets: finalScore.sets,
            _winner,
            isComplete: _winner !== null,
            retiredAt: finalScore.retiredAt,
            walkover: finalScore.walkover,
          };
        }

        transaction.update(matchRef, updateData);

        // Update player statistics with final score
        const updatedMatch = { ...match, ...updateData };
        await this.updatePlayerStatistics(updatedMatch, transaction);
      });

      console.log('✅ Dispute resolved for match:', matchId);
    } catch (error) {
      console.error('❌ Error resolving dispute:', error);
      throw error;
    }
  }

  /**
   * Get player event type specific statistics
   * 플레이어의 경기 종류별 통계 조회
   */
  async getPlayerEventTypeStats(
    playerId: string,
    clubId: string,
    eventType?: import('../types/league').PickleballEventType
  ): Promise<Record<string, unknown> | null> {
    try {
      const stats = await this.getPlayerStats(playerId, clubId);

      if (!stats || !stats.eventTypeStats) {
        return null;
      }

      if (eventType && stats.eventTypeStats) {
        return stats.eventTypeStats[eventType] || null;
      }

      return stats.eventTypeStats;
    } catch (error) {
      console.error('❌ Error getting player event type stats:', error);
      throw error;
    }
  }

  /**
   * Create lightning match with event type
   * 경기 종류가 포함된 번개 매치 생성
   */
  async createLightningMatch(matchData: {
    eventType: import('../types/league').PickleballEventType;
    player1Id: string;
    player2Id: string;
    player1PartnerId?: string;
    player2PartnerId?: string;
    scheduledAt: Date;
    clubId: string;
    createdBy: string;
  }): Promise<string> {
    try {
      // Validate event type and format consistency
      const expectedFormat = getMatchFormatFromEventType(matchData.eventType);

      return await this.createMatch({
        type: 'lightning_match',
        eventType: matchData.eventType,
        format: expectedFormat,
        player1Id: matchData.player1Id,
        player2Id: matchData.player2Id,
        player1PartnerId: matchData.player1PartnerId,
        player2PartnerId: matchData.player2PartnerId,
        scheduledAt: matchData.scheduledAt,
        clubId: matchData.clubId,
        createdBy: matchData.createdBy,
      });
    } catch (error) {
      console.error('❌ Error creating lightning match:', error);
      throw error;
    }
  }

  /**
   * Get lightning matches by event type
   * 경기 종류별 번개 매치 조회
   */
  async getLightningMatchesByEventType(
    clubId: string,
    eventType: import('../types/league').PickleballEventType,
    limit: number = 20
  ): Promise<Match[]> {
    try {
      const filters: MatchFilterOptions = {
        clubId,
        type: ['lightning_match'],
        sortBy: 'date',
        sortOrder: 'desc',
      };

      const response = await this.getMatches(filters, limit);

      // Filter by event type on the client side since Firestore has limited query capabilities
      return response.matches.filter(match => match.eventType === eventType);
    } catch (error) {
      console.error('❌ Error getting lightning matches by event type:', error);
      throw error;
    }
  }

  // ============ ADMIN FUNCTIONS ============

  /**
   * Admin: Override match result (for dispute resolution)
   * 관리자: 경기 결과 강제 변경 (분쟁 해결용)
   */
  async adminOverrideMatchResult(
    matchId: string,
    newScore: ScoreInputForm,
    adminId: string,
    reason: string
  ): Promise<void> {
    try {
      await runTransaction(db, async transaction => {
        const matchRef = doc(this.matchesCollection, matchId);
        const matchDoc = await transaction.get(matchRef);

        if (!matchDoc.exists()) {
          throw new Error(i18n.t('services.match.matchNotFound'));
        }

        const match = matchDoc.data() as Match;
        const oldScore = match.score;

        // Calculate new winner
        const newWinner = calculateMatchWinner(newScore.sets);

        // Create new match score
        const updatedScore = {
          sets: newScore.sets,
          _winner: newWinner,
          isComplete: true,
          retiredAt: newScore.retiredAt,
          walkover: newScore.walkover,
        };

        // Update match
        transaction.update(matchRef, {
          score: updatedScore,
          status: 'confirmed',
          adminOverride: {
            adminId,
            reason,
            timestamp: Timestamp.now(),
            previousScore: oldScore,
          },
          updatedAt: Timestamp.now(),
        });

        // If score changed, recalculate player statistics
        if (oldScore && oldScore._winner !== newWinner) {
          // Reverse old statistics
          await this.reversePlayerStats(match, transaction);

          // Apply new statistics
          const updatedMatch = { ...match, score: updatedScore };
          // Update player statistics for the new match result
          const player1Won = updatedScore._winner === match.player1.userId;
          await this.updatePlayerStats(
            match.player1.userId,
            match.clubId,
            player1Won,
            updatedMatch,
            transaction
          );
          await this.updatePlayerStats(
            match.player2.userId,
            match.clubId,
            !player1Won,
            updatedMatch,
            transaction
          );
        }
      });

      console.log('✅ Match result overridden by admin:', matchId);
    } catch (error) {
      console.error('❌ Error overriding match result:', error);
      throw error;
    }
  }

  /**
   * Admin: Cancel match and reverse statistics
   * 관리자: 경기 취소 및 통계 롤백
   */
  async adminCancelMatch(matchId: string, adminId: string, reason: string): Promise<void> {
    try {
      await runTransaction(db, async transaction => {
        const matchRef = doc(this.matchesCollection, matchId);
        const matchDoc = await transaction.get(matchRef);

        if (!matchDoc.exists()) {
          throw new Error(i18n.t('services.match.matchNotFound'));
        }

        const match = matchDoc.data() as Match;

        // If match was completed, reverse statistics
        if (match.status === 'confirmed' && match.score) {
          await this.reversePlayerStats(match, transaction);
        }

        // Update match status
        transaction.update(matchRef, {
          status: 'cancelled',
          adminCancellation: {
            adminId,
            reason,
            timestamp: Timestamp.now(),
          },
          updatedAt: Timestamp.now(),
        });
      });

      console.log('✅ Match cancelled by admin:', matchId);
    } catch (error) {
      console.error('❌ Error cancelling match:', error);
      throw error;
    }
  }

  /**
   * Admin: Get all disputed matches
   * 관리자: 분쟁 중인 모든 경기 조회
   */
  async getDisputedMatches(clubId: string): Promise<Match[]> {
    try {
      const q = query(
        this.matchesCollection,
        where('clubId', '==', clubId),
        where('status', '==', 'disputed'),
        orderBy('updatedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Match[];
    } catch (error) {
      console.error('❌ Error getting disputed matches:', error);
      throw error;
    }
  }

  /**
   * Admin: Get match history with all admin actions
   * 관리자: 관리자 액션이 포함된 경기 이력 조회
   */
  async getMatchAdminHistory(matchId: string): Promise<{
    match: Match;
    adminActions: Array<{
      type: 'override' | 'cancellation' | 'dispute_resolution';
      adminId: string;
      reason: string;
      timestamp: Timestamp;
      details?: unknown;
    }>;
  }> {
    try {
      const match = await this.getMatch(matchId);
      if (!match) {
        throw new Error(i18n.t('services.match.matchNotFound'));
      }

      const adminActions: Array<{
        type: 'override' | 'cancellation' | 'dispute_resolution';
        adminId: string;
        reason: string;
        timestamp: Timestamp;
        details?: {
          previousScore?: unknown;
          newScore?: unknown;
        };
      }> = [];

      // Add admin override actions
      const matchWithAdmin = match as {
        adminOverride?: {
          adminId: string;
          reason: string;
          timestamp: Timestamp;
          previousScore: unknown;
        };
      };
      if (matchWithAdmin.adminOverride) {
        adminActions.push({
          type: 'override',
          adminId: matchWithAdmin.adminOverride.adminId,
          reason: matchWithAdmin.adminOverride.reason,
          timestamp: matchWithAdmin.adminOverride.timestamp,
          details: {
            previousScore: matchWithAdmin.adminOverride.previousScore,
            newScore: match.score,
          },
        });
      }

      // Add cancellation actions
      const matchWithCancellation = match as {
        adminCancellation?: { adminId: string; reason: string; timestamp: Timestamp };
      };
      if (matchWithCancellation.adminCancellation) {
        adminActions.push({
          type: 'cancellation',
          adminId: matchWithCancellation.adminCancellation.adminId,
          reason: matchWithCancellation.adminCancellation.reason,
          timestamp: matchWithCancellation.adminCancellation.timestamp,
        });
      }

      // Add dispute resolution actions
      if (match.disputeResolvedBy) {
        adminActions.push({
          type: 'dispute_resolution',
          adminId: match.disputeResolvedBy,
          reason: match.disputeReason || '',
          timestamp: match.disputeResolvedAt || Timestamp.now(),
        });
      }

      // Sort by timestamp
      adminActions.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());

      return {
        match,
        adminActions,
      };
    } catch (error) {
      console.error('❌ Error getting match admin history:', error);
      throw error;
    }
  }

  /**
   * Private: Reverse player statistics (for admin corrections)
   * 내부: 플레이어 통계 롤백 (관리자 수정용)
   */
  private async reversePlayerStats(match: Match, transaction: Transaction): Promise<void> {
    if (!match.score || !match.score._winner) {
      return;
    }

    const player1Id = match.player1.userId;
    const player2Id = match.player2.userId;
    const player1Won = match.score._winner === 'player1';

    // Reverse stats for both players
    await this.reverseIndividualPlayerStats(
      player1Id,
      match.clubId,
      player1Won,
      match,
      transaction
    );
    await this.reverseIndividualPlayerStats(
      player2Id,
      match.clubId,
      !player1Won,
      match,
      transaction
    );

    // Reverse head-to-head record
    await this.reverseHeadToHeadRecord(
      player1Id,
      player2Id,
      match.clubId,
      player1Won,
      match.id,
      transaction
    );
  }

  /**
   * Private: Reverse individual player statistics
   * 내부: 개별 플레이어 통계 롤백
   */
  private async reverseIndividualPlayerStats(
    playerId: string,
    clubId: string,
    won: boolean,
    match: Match,
    transaction: Transaction
  ): Promise<void> {
    const statsId = `${clubId}_${playerId}`;
    const statsRef = doc(this.playerStatsCollection, statsId);
    const statsDoc = await transaction.get(statsRef);

    if (!statsDoc.exists()) {
      return; // No stats to reverse
    }

    const stats = statsDoc.data() as PlayerMatchStats;

    // Reverse total stats
    stats.totalMatches = Math.max(0, stats.totalMatches - 1);
    if (won) {
      stats.wins = Math.max(0, stats.wins - 1);
    } else {
      stats.losses = Math.max(0, stats.losses - 1);
    }

    // Recalculate win rate
    stats.winRate = stats.totalMatches > 0 ? (stats.wins / stats.totalMatches) * 100 : 0;

    // Reverse type-specific stats
    const typeKey =
      match.type === 'lightning_match'
        ? 'lightningMatchStats'
        : match.type === 'league'
          ? 'leagueStats'
          : match.type === 'tournament'
            ? 'tournamentStats'
            : 'lightningMatchStats';

    stats[typeKey].matches = Math.max(0, stats[typeKey].matches - 1);
    if (won) {
      stats[typeKey].wins = Math.max(0, stats[typeKey].wins - 1);
    } else {
      stats[typeKey].losses = Math.max(0, stats[typeKey].losses - 1);
    }

    // Reverse event type stats if applicable
    if (
      match.type === 'lightning_match' &&
      match.eventType &&
      stats.eventTypeStats &&
      stats.eventTypeStats[match.eventType]
    ) {
      const eventStats = stats.eventTypeStats[match.eventType];
      if (eventStats) {
        eventStats.matches = Math.max(0, eventStats.matches - 1);

        if (won) {
          eventStats.wins = Math.max(0, eventStats.wins - 1);
        } else {
          eventStats.losses = Math.max(0, eventStats.losses - 1);
        }

        // Reverse set and game statistics
        if (match.score && match.score.sets) {
          const isPlayer1 = match.player1.userId === playerId;

          match.score.sets.forEach(set => {
            const playerGames = isPlayer1 ? set.player1Games : set.player2Games;
            const opponentGames = isPlayer1 ? set.player2Games : set.player1Games;

            eventStats.gamesWon = Math.max(0, eventStats.gamesWon - playerGames);
            eventStats.gamesLost = Math.max(0, eventStats.gamesLost - opponentGames);

            if (playerGames > opponentGames) {
              eventStats.setsWon = Math.max(0, eventStats.setsWon - 1);
            } else if (opponentGames > playerGames) {
              eventStats.setsLost = Math.max(0, eventStats.setsLost - 1);
            }
          });
        }
      }
    }

    // Remove from recent matches
    if (stats.recentMatches && Array.isArray(stats.recentMatches)) {
      const matchIndex = stats.recentMatches.indexOf(match.id);
      if (matchIndex > -1) {
        stats.recentMatches.splice(matchIndex, 1);
      }
    }

    stats.lastUpdated = Timestamp.now();

    transaction.set(statsRef, stats);
  }

  /**
   * Private: Reverse head-to-head record
   * 내부: 상대전 기록 롤백
   */
  private async reverseHeadToHeadRecord(
    player1Id: string,
    player2Id: string,
    clubId: string,
    player1Won: boolean,
    matchId: string,
    transaction: Transaction
  ): Promise<void> {
    const recordId = `${clubId}_${[player1Id, player2Id].sort().join('_')}`;
    const recordRef = doc(this.headToHeadCollection, recordId);
    const recordDoc = await transaction.get(recordRef);

    if (!recordDoc.exists()) {
      return; // No record to reverse
    }

    const record = recordDoc.data() as HeadToHeadRecord;

    // Reverse the record
    record.totalMatches = Math.max(0, record.totalMatches - 1);
    if (player1Won) {
      record.player1Wins = Math.max(0, record.player1Wins - 1);
    } else {
      record.player2Wins = Math.max(0, record.player2Wins - 1);
    }

    // Remove from recent matches
    if (record.recentMatches && Array.isArray(record.recentMatches)) {
      const matchIndex = record.recentMatches.indexOf(matchId);
      if (matchIndex > -1) {
        record.recentMatches.splice(matchIndex, 1);
      }
    }

    record.updatedAt = Timestamp.now();

    transaction.set(recordRef, record);
  }
}

export const matchService = new MatchService();
