/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tournament Service
 * Lightning Tennis 클럽 토너먼트 관리 서비스
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  Unsubscribe,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase/config';
import {
  Tournament,
  TournamentStatus,
  TournamentParticipant,
  BracketRound,
  BracketMatch,
  BracketPlayer,
  BracketPositionStatus,
  TournamentScore,
  CreateTournamentRequest,
  DoublesTeam,
  getRoundName,
  isUpset,
  getMatchFormatFromTournamentEventType,
  getTournamentEventTypeDisplayName,
} from '../types/tournament';
import { TennisEventType } from '../types/league';
import authService from './authService';
import i18n from '../i18n';
// import { sanitizeDataForFirestore, findUndefinedValues } from '../utils/dataUtils';

// Note: removeUndefinedFields utility function was removed as it's no longer used
// All data sanitization is now handled by Cloud Functions

// 🛡️ Firebase undefined 값 제거 유틸리티 (REMOVED - no longer needed)
// function removeUndefinedFields(obj: any): any {
//   if (obj === null || obj === undefined) {
//     return null;
//   }
//
//   if (Array.isArray(obj)) {
//     return obj.map(removeUndefinedFields);
//   }
//
//   if (typeof obj === 'object') {
//     const cleaned: any = {};
//     for (const [key, value] of Object.entries(obj)) {
//       if (value !== undefined) {
//         if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
//           // Firestore Timestamp 객체는 그대로 유지
//           if (value.constructor.name === 'Timestamp' || value._methodName === 'serverTimestamp') {
//             cleaned[key] = value;
//           } else {
//             cleaned[key] = removeUndefinedFields(value);
//           }
//         } else {
//           cleaned[key] = value;
//         }
//       }
//     }
//     return cleaned;
//   }
//
//   return obj;
// }

class TournamentService {
  /**
   * 토너먼트 생성 (Cloud Function)
   *
   * @param request - 토너먼트 생성 요청
   * @returns 생성된 토너먼트 ID
   */
  async createTournament(request: CreateTournamentRequest): Promise<string> {
    try {
      const createFn = httpsCallable(functions, 'createTournament');
      const response = await createFn(request);
      // Cloud Function returns: { success, message, data: { tournamentId, createdAt } }
      const result = response.data as { data: { tournamentId: string } };

      console.log('✅ Tournament created:', result.data.tournamentId);
      return result.data.tournamentId;
    } catch (error) {
      console.error('Error creating tournament:', error);
      throw error;
    }
  }

  /**
   * 토너먼트 정보 조회
   */
  async getTournament(tournamentId: string): Promise<Tournament | null> {
    try {
      const tournamentDoc = await getDoc(doc(db, 'tournaments', tournamentId));

      if (!tournamentDoc.exists()) {
        return null;
      }

      return {
        id: tournamentDoc.id,
        ...tournamentDoc.data(),
      } as Tournament;
    } catch (error) {
      console.error('Error getting tournament:', error);
      throw error;
    }
  }

  /**
   * 클럽의 토너먼트 목록 조회
   */
  async getClubTournaments(clubId: string, status?: TournamentStatus): Promise<Tournament[]> {
    try {
      const tournamentsRef = collection(db, 'tournaments');
      let q = query(tournamentsRef, where('clubId', '==', clubId), orderBy('createdAt', 'desc'));

      if (status) {
        q = query(
          tournamentsRef,
          where('clubId', '==', clubId),
          where('status', '==', status),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Tournament[];
    } catch (error) {
      console.error('Error getting club tournaments:', error);
      throw error;
    }
  }

  /**
   * 클럽의 토너먼트 목록 실시간 구독
   * Real-time subscription for club tournaments list
   */
  subscribeToClubTournaments(
    clubId: string,
    userRole: string,
    callback: (tournaments: Tournament[]) => void
  ): Unsubscribe {
    const tournamentsRef = collection(db, 'tournaments');

    // Role-based query construction similar to leagues
    let q;
    if (userRole === 'admin' || userRole === 'owner' || userRole === 'manager') {
      // Admin: Can see all tournament statuses (backstage view)
      q = query(tournamentsRef, where('clubId', '==', clubId), orderBy('createdAt', 'desc'));
      console.log(
        '🏆 [TOURNAMENT SUBSCRIPTION] Admin backstage view: Loading all tournament statuses'
      );
    } else {
      // Members: See tournaments including preparation phases (draft, registration, in_progress, etc.)
      q = query(
        tournamentsRef,
        where('clubId', '==', clubId),
        where('status', 'in', [
          'draft',
          'registration',
          'in_progress',
          'bracket_generation',
          'completed',
        ]),
        orderBy('createdAt', 'desc')
      );
      console.log(
        '🏆 [TOURNAMENT SUBSCRIPTION] Member view: Loading all tournaments including preparation phases'
      );
    }

    return onSnapshot(
      q,
      snapshot => {
        const allTournaments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Tournament[];

        // All tournaments from the Firestore query are available to display
        // Remove client-side filtering to allow members to see tournaments during preparation phases
        const availableTournaments = allTournaments;

        console.log(
          `🏆 [TOURNAMENT SUBSCRIPTION] ${userRole} received ${availableTournaments.length} tournaments for club ${clubId}`
        );
        callback(availableTournaments);
      },
      error => {
        console.error('Error in club tournaments subscription:', error);
        callback([]); // Return empty array on error
      }
    );
  }

  /**
   * 토너먼트 참가 신청 (Cloud Function)
   *
   * @param tournamentId - 토너먼트 ID
   * @param userId - 사용자 ID
   * @param partnerInfo - 복식 토너먼트용 파트너 정보 (선택적)
   * @returns 참가자 ID
   */
  async registerForTournament(
    tournamentId: string,
    userId: string,
    partnerInfo?: { partnerId: string; partnerName: string }
  ): Promise<string> {
    try {
      const registerFn = httpsCallable(functions, 'registerForTournament');
      const response = await registerFn({
        tournamentId,
        userId,
        partnerInfo,
      });
      // Cloud Function returns: { success, message, data: { participantId } }
      const result = response.data as { data: { participantId: string } };

      console.log('✅ Tournament registration completed:', result.data.participantId);
      return result.data.participantId;
    } catch (error) {
      console.error('Error registering for tournament:', error);
      throw error;
    }
  }

  /**
   * 🏛️ TEAM-FIRST ARCHITECTURE 2.0 (Cloud Function)
   * Register a CONFIRMED TEAM for a doubles tournament
   *
   * @param tournamentId - Tournament to register for
   * @param teamId - ID of the confirmed team
   * @param registeredBy - userId who triggered the registration (either team member)
   * @returns Participant ID
   */
  async registerTeamForTournament(
    tournamentId: string,
    teamId: string,
    registeredBy: string
  ): Promise<string> {
    try {
      const registerTeamFn = httpsCallable(functions, 'registerTeamForTournament');
      const response = await registerTeamFn({
        tournamentId,
        teamId,
        registeredBy,
      });
      // Cloud Function returns: { success, message, data: { participantId } }
      const result = response.data as { data: { participantId: string } };

      console.log('✅ Team registration completed:', result.data.participantId);
      return result.data.participantId;
    } catch (error) {
      console.error('Error registering team for tournament:', error);
      throw error;
    }
  }

  /**
   * 시드 배정
   */
  /**
   * 🌉 [HEIMDALL] Phase 5.3: Assign Seeds via Cloud Function
   * Migrated from client-side to server-side for security
   * ⚡ [THOR] Doubles partner seed unification handled server-side
   */
  async assignSeeds(
    tournamentId: string,
    seeds: Array<{ playerId: string; seed: number }>
  ): Promise<void> {
    try {
      console.log('🎯 [ASSIGN_SEEDS] Calling assignSeeds Cloud Function:', tournamentId);

      const assignSeedsFn = httpsCallable(functions, 'assignSeeds');
      const result = await assignSeedsFn({
        tournamentId,
        seeds: seeds.map(s => ({ participantId: s.playerId, seedNumber: s.seed })),
      });

      console.log('✅ [ASSIGN_SEEDS] Seeds assigned successfully:', result.data);
    } catch (error) {
      console.error('❌ [ASSIGN_SEEDS] Error assigning seeds:', error);
      throw error;
    }
  }

  /**
   * 🎾 Iron Man: Team-First Architecture
   * 복식 토너먼트 참가자들을 팀 단위로 그룹화
   *
   * @param participants 토너먼트 참가자 배열
   * @returns DoublesTeam 배열 (3팀 → 3개 객체)
   *
   * Example:
   * - Input: 6명 참가자 (Won, 누나, 철이, 파트너A, 선수B, 선수C)
   * - Output: 3팀 ([Won/누나], [철이/파트너A], [선수B/선수C])
   */
  groupParticipantsIntoTeams(participants: TournamentParticipant[]): DoublesTeam[] {
    const teams: DoublesTeam[] = [];
    const processedPlayerIds = new Set<string>();

    console.log('🎾 [TEAM ARCHITECT] Grouping participants into teams:');
    console.log(`  📊 Total participants: ${participants.length}`);

    // 🛡️ 각 참가자의 파트너 정보 검증
    console.log('  🛡️ [VALIDATION] Checking partner information for all participants:');
    participants.forEach((participant, index) => {
      console.log(`  [${index}] ${participant.playerName}:`, {
        playerId: participant.playerId,
        partnerId: participant.partnerId || 'null ❌',
        partnerName: participant.partnerName || 'null ❌',
        hasPartner: !!participant.partnerId,
      });
    });

    participants.forEach(participant => {
      // 이미 처리된 선수는 스킵 (파트너로 추가됨)
      if (processedPlayerIds.has(participant.playerId)) {
        console.log(`  ⏭️ Skipping ${participant.playerName} (already added as partner)`);
        return;
      }

      if (participant.partnerId) {
        // 파트너 찾기
        const partner = participants.find(p => p.playerId === participant.partnerId);

        if (!partner) {
          // ⚠️ 파트너를 찾지 못한 경우 (삭제 중이거나 데이터 불일치)
          // 이는 복식 팀 삭제 중 Firestore 실시간 업데이트로 인한 일시적 상태일 수 있음
          console.warn(
            `  ⚠️ Partner not found for ${participant.playerName} (partnerId: ${participant.partnerId}) - possibly being deleted`
          );
          return;
        }

        // 팀 생성
        const team: DoublesTeam = {
          teamId: `${participant.playerId}_${participant.partnerId}`,
          player1: participant,
          player2: partner,
          seed: participant.seed, // 두 선수 모두 같은 시드를 가져야 함
          teamName: `${participant.playerName} / ${partner.playerName}`,
        };

        teams.push(team);
        processedPlayerIds.add(participant.playerId);
        processedPlayerIds.add(participant.partnerId);

        console.log(`  ✅ Team created: ${team.teamName} (Seed: ${team.seed || 'N/A'})`);
      } else {
        console.warn(`  ⚠️ ${participant.playerName} has no partner - cannot form team`);
      }
    });

    console.log(`🎾 [TEAM ARCHITECT] Total teams created: ${teams.length}`);

    // 🚨 최종 검증: 팀 생성 실패 경고
    if (participants.length > 0 && teams.length === 0) {
      console.error('❌ [CRITICAL ERROR] No teams created despite having participants!');
      console.error('  Possible causes:');
      console.error('  1. Missing partnerId fields in participant data');
      console.error('  2. Partner participants not found in array (partnerId mismatch)');
      console.error('  3. Data structure mismatch between participants');
      console.error('  → Check Firebase data and registration flow!');
    }

    return teams;
  }

  /**
   * 싱글 엘리미네이션 대진표 생성
   * 🦾⚡ Team-First Architecture: 복식은 팀 기반, 단식은 선수 기반
   */
  async generateSingleEliminationBracket(tournamentId: string): Promise<void> {
    try {
      const tournament = await this.getTournament(tournamentId);
      if (!tournament) {
        throw new Error('Tournament not found');
      }

      const participants = [...tournament.participants];
      const totalParticipants = participants.length;

      console.log('🎾 Starting bracket generation:', {
        tournamentId,
        totalParticipants,
        eventType: tournament.eventType,
        participantNames: participants.map(p => p.playerName),
      });

      if (totalParticipants < 2) {
        throw new Error('At least 2 participants required for tournament');
      }

      // 🎯 Thor: 복식/단식 구분
      const isDoubles = getMatchFormatFromTournamentEventType(tournament.eventType) === 'doubles';

      if (isDoubles) {
        console.log('⚡ [THOR] Detected DOUBLES tournament - using Team-First Architecture');

        // 🦾 팀 단위로 그룹화
        const teams = this.groupParticipantsIntoTeams(participants);
        console.log(
          `⚡ [THOR] Grouped ${participants.length} participants into ${teams.length} teams`
        );

        // 팀 시드 기준으로 정렬
        teams.sort((a, b) => (a.seed || 999) - (b.seed || 999));

        console.log(
          '⚡ [THOR] Teams after seeding:',
          teams.map(t => ({
            teamName: t.teamName,
            seed: t.seed,
          }))
        );

        // 🏆 팀 기반 대진표 생성 (3팀 → Bracket Size 4)
        const teamCount = teams.length;
        const { bracket, matches } = this.generateTeamBasedBracket(tournamentId, teams, teamCount);

        console.log('⚡ [THOR] Generated team-based bracket:', {
          totalRounds: bracket.length,
          totalMatches: matches.length,
          teamCount,
        });

        // Firebase에 저장
        await this.saveBracketToFirebase(tournamentId, bracket, matches);

        console.log(`✅ [THOR] Generated ${matches.length} matches for ${teamCount} teams`);
      } else {
        console.log('🎾 [SINGLES] Using standard player-based bracket generation');

        // 시드 순으로 정렬 (시드가 낮을수록 높은 시드)
        participants.sort((a, b) => (a.seed || 999) - (b.seed || 999));

        console.log(
          '🎾 Participants after seeding:',
          participants.map(p => ({
            name: p.playerName,
            seed: p.seed,
          }))
        );

        // 🎯 Operation: Perfect Bracket - 표준 토너먼트 BYE 배분 알고리즘
        const { bracket, matches } = this.generatePerfectBracket(tournamentId, participants);

        console.log('🎾 Generated bracket structure:', {
          totalRounds: bracket.length,
          totalMatches: matches.length,
          roundBreakdown: bracket.map(r => ({
            round: r.roundNumber,
            matches: r.matches.length,
          })),
        });

        // Firebase에 저장
        await this.saveBracketToFirebase(tournamentId, bracket, matches);

        console.log(`✅ Generated ${matches.length} matches in ${bracket.length} rounds`);
      }
    } catch (error) {
      console.error('Error generating bracket:', error);
      throw error;
    }
  }

  /**
   * 경기 결과 입력
   */
  async updateMatchResult(matchId: string, _winner: string, score: TournamentScore): Promise<void> {
    try {
      // Extract tournament ID from match ID (format: tournamentId_match_number)
      const tournamentId = matchId.split('_match_')[0];

      // 경기 정보 조회 (nested subcollection에서 조회)
      const matchDoc = await getDoc(doc(db, 'tournaments', tournamentId, 'matches', matchId));
      if (!matchDoc.exists()) {
        throw new Error('Match not found');
      }

      const match = matchDoc.data() as BracketMatch;

      // 🔍 [BROKEN WIRE FIX] Client-side tracing for Firestore update
      const docPath = `tournaments/${tournamentId}/matches/${matchId}`;
      const updateData = {
        status: 'completed',
        winner: _winner, // 🔧 FIXED: _winner → winner (matching Cloud Function expectation)
        score,
        updatedAt: serverTimestamp(),
      };

      console.log('--- 📤 CLIENT-SIDE FIRESTORE UPDATE ---');
      console.log(`Document Path: ${docPath}`);
      console.log(
        'Update Data:',
        JSON.stringify(
          {
            status: updateData.status,
            winner: _winner,
            score: score,
            timestamp: new Date().toISOString(),
          },
          null,
          2
        )
      );

      // 경기 결과 업데이트 (nested subcollection에서 업데이트)
      await updateDoc(doc(db, 'tournaments', tournamentId, 'matches', matchId), updateData);

      // 💥 CLIENT ADVANCEMENT LOGIC REMOVED 💥
      // All tournament progression is now handled by onMatchResultUpdated Cloud Function
      // Client responsibility is LIMITED to recording match results only

      // 토너먼트 통계 업데이트
      await this.updateTournamentStats(match.tournamentId, match, _winner);

      console.log('✅ Match result updated:', matchId);
    } catch (error) {
      console.error('Error updating match result:', error);
      throw error;
    }
  }

  /**
   * 💀 CLIENT-SIDE ADVANCEMENT LOGIC REMOVED 💀
   * This method has been deprecated as part of "Brain Transplant" surgery.
   * All tournament progression is now handled by onMatchResultUpdated Cloud Function.
   *
   * IMPORTANT: Do not restore this logic - it was the source of tournament bracket conflicts!
   */
  // private async advanceToNextRound(
  //   nextMatchId: string,
  //   position: 'player1' | 'player2',
  //   playerId: string
  // ): Promise<void> {
  //   // This entire method is deprecated and commented out
  //   // All advancement logic moved to Cloud Function for centralized processing
  // }

  /**
   * 토너먼트 통계 업데이트
   */
  private async updateTournamentStats(
    tournamentId: string,
    match: BracketMatch,
    _winner: string
  ): Promise<void> {
    try {
      const tournament = await this.getTournament(tournamentId);
      if (!tournament) return;

      // 업셋 체크
      const winnerPlayer = match.player1?.playerId === _winner ? match.player1 : match.player2;
      const loserPlayer = match.player1?.playerId === _winner ? match.player2 : match.player1;

      const upset = isUpset(winnerPlayer?.seed, loserPlayer?.seed);

      // 통계 업데이트
      const stats = tournament.stats || {
        totalMatches: 0,
        completedMatches: 0,
        upsets: 0,
        walkovers: 0,
        averageMatchDuration: 0,
      };

      stats.completedMatches++;
      if (upset) stats.upsets++;
      if (match.score?.walkover) stats.walkovers++;

      // 최종 라운드인 경우 챔피언 결정
      if (match.roundNumber === tournament.totalRounds) {
        // 🏛️ PROJECT OLYMPUS: Calculate rankings for Hall of Fame trophy/badge system
        console.log('🏆 [OLYMPUS] Calculating tournament rankings for trophy/badge awards...');
        const fullRankings = await this.calculateRankings(tournamentId);

        // Cloud Function이 기대하는 간소화된 형식으로 변환
        const rankings = fullRankings.map(r => ({
          rank: r.rank,
          playerId: r.participant.playerId,
          playerName: r.participant.playerName,
          wins: r.wins,
          losses: r.losses,
        }));

        console.log('✅ [OLYMPUS] Rankings prepared for Cloud Function:', {
          totalParticipants: rankings.length,
          winner: rankings[0]?.playerName,
          runnerUp: rankings[1]?.playerName,
        });

        await updateDoc(doc(db, 'tournaments', tournamentId), {
          status: 'completed',
          champion: {
            playerId: _winner,
            playerName: winnerPlayer?.playerName || '',
            finalOpponent: loserPlayer?.playerId,
            finalScore: match.score?.finalScore,
          },
          runnerUp: {
            playerId: loserPlayer?.playerId || '',
            playerName: loserPlayer?.playerName || '',
          },
          stats,
          rankings, // 🏛️ PROJECT OLYMPUS: 트로피/배지 수여를 위한 랭킹 데이터
          updatedAt: serverTimestamp(),
        });

        // 🔥 THOR 2.0: 토너먼트 완료 시 클럽 랭킹 업데이트 (헌장 v1.4)
        console.log('🏆 [THOR 2.0] Tournament completed! Initiating club ranking update...');
        try {
          await this.updateClubRankingsAfterTournament(tournamentId, tournament.clubId);
          console.log(
            '✅ [THOR 2.0] Club rankings updated successfully after tournament completion!'
          );
        } catch (error) {
          // 클럽 랭킹 업데이트 실패해도 토너먼트 완료는 유지
          console.error(
            '⚠️ [THOR 2.0] Failed to update club rankings, but tournament is still completed:',
            error
          );
        }
      } else {
        await updateDoc(doc(db, 'tournaments', tournamentId), {
          stats,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error updating tournament stats:', error);
      throw error;
    }
  }

  /**
   * 토너먼트 경기 목록 조회
   */
  async getTournamentMatches(tournamentId: string, round?: number): Promise<BracketMatch[]> {
    try {
      const matchesRef = collection(db, 'tournaments', tournamentId, 'matches');
      let q = query(matchesRef, orderBy('bracketPosition', 'asc'));

      if (round) {
        q = query(matchesRef, where('roundNumber', '==', round), orderBy('matchNumber', 'asc'));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as BracketMatch[];
    } catch (error) {
      console.error('Error getting tournament matches:', error);
      throw error;
    }
  }

  /**
   * 플레이어의 토너먼트 경기 조회
   */
  async getPlayerTournamentMatches(
    tournamentId: string,
    playerId: string
  ): Promise<BracketMatch[]> {
    try {
      const allMatches = await this.getTournamentMatches(tournamentId);
      return allMatches.filter(
        match => match.player1?.playerId === playerId || match.player2?.playerId === playerId
      );
    } catch (error) {
      console.error('Error getting player matches:', error);
      throw error;
    }
  }

  /**
   * 토너먼트 상태 변경 (Cloud Function)
   *
   * @param tournamentId - 토너먼트 ID
   * @param newStatus - 새로운 상태
   * @param reason - 상태 변경 이유 (cancelled 상태일 때 필수)
   */
  async updateTournamentStatus(
    tournamentId: string,
    newStatus: TournamentStatus,
    reason?: string
  ): Promise<void> {
    try {
      const updateStatusFn = httpsCallable(functions, 'updateTournamentStatus');
      const response = await updateStatusFn({
        tournamentId,
        newStatus,
        reason,
      });

      console.log(`✅ Tournament status updated to: ${newStatus}`, response.data);
    } catch (error) {
      console.error('Error updating tournament status:', error);
      throw error;
    }
  }

  /**
   * 🗑️ 토너먼트 삭제
   * 토너먼트와 관련된 모든 데이터를 삭제합니다.
   * - 토너먼트 문서
   * - 모든 매치 데이터
   * - 클럽 통계 업데이트
   */
  /**
   * 🌉 [HEIMDALL] Phase 5.3: Delete Tournament via Cloud Function
   * Migrated from client-side to server-side for security
   */
  async deleteTournament(tournamentId: string): Promise<void> {
    try {
      console.log('🗑️ [DELETE] Calling deleteTournament Cloud Function:', tournamentId);

      const deleteTournamentFn = httpsCallable(functions, 'deleteTournament');
      const result = await deleteTournamentFn({ tournamentId });

      console.log('✅ [DELETE] Tournament deleted successfully:', result.data);
    } catch (error) {
      console.error('❌ [DELETE] Error deleting tournament:', error);
      throw error;
    }
  }

  /**
   * 토너먼트 실시간 구독
   */
  subscribeToTournament(
    tournamentId: string,
    callback: (tournament: Tournament | null) => void
  ): Unsubscribe {
    const tournamentRef = doc(db, 'tournaments', tournamentId);

    return onSnapshot(
      tournamentRef,
      snapshot => {
        if (snapshot.exists()) {
          callback({
            id: snapshot.id,
            ...snapshot.data(),
          } as Tournament);
        } else {
          callback(null);
        }
      },
      error => {
        console.error('Error in tournament subscription:', error);
      }
    );
  }

  /**
   * 토너먼트 경기 실시간 구독
   */
  subscribeToTournamentMatches(
    tournamentId: string,
    callback: (matches: BracketMatch[]) => void
  ): Unsubscribe {
    const matchesRef = collection(db, 'tournaments', tournamentId, 'matches');
    const q = query(matchesRef, orderBy('bracketPosition', 'asc'));

    return onSnapshot(
      q,
      snapshot => {
        const matches = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as BracketMatch[];

        callback(matches);
      },
      error => {
        console.error('Error in matches subscription:', error);
      }
    );
  }

  // Duplicate function removed - see subscribeToTournamentMatches above

  /**
   * 토너먼트 총 라운드 수 계산
   */
  private calculateTotalRounds(participantCount: number): number {
    return Math.ceil(Math.log2(participantCount));
  }

  /**
   * 파트너 참가 확인 (복식 전용)
   */
  async confirmPartnerParticipation(
    tournamentId: string,
    participantId: string,
    partnerId: string
  ): Promise<void> {
    try {
      const tournament = await this.getTournament(tournamentId);
      if (!tournament) {
        throw new Error('Tournament not found');
      }

      // 참가자 찾기
      const participantIndex = tournament.participants.findIndex(
        p => p.id === participantId && p.partnerId === partnerId
      );

      if (participantIndex === -1) {
        throw new Error(i18n.t('services.tournament.participantNotFound'));
      }

      // 파트너 확인 업데이트
      const updatedParticipants = [...tournament.participants];
      updatedParticipants[participantIndex] = {
        ...updatedParticipants[participantIndex],
        partnerConfirmed: true,
        status: 'confirmed',
      };

      await updateDoc(doc(db, 'tournaments', tournamentId), {
        participants: updatedParticipants,
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Partner participation confirmed');
    } catch (error) {
      console.error('Error confirming partner participation:', error);
      throw error;
    }
  }

  /**
   * 경기 종류별 토너먼트 목록 조회
   */
  async getTournamentsByEventType(
    clubId: string,
    eventType: TennisEventType
  ): Promise<Tournament[]> {
    try {
      const tournamentsRef = collection(db, 'tournaments');
      const q = query(
        tournamentsRef,
        where('clubId', '==', clubId),
        where('eventType', '==', eventType),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Tournament[];
    } catch (error) {
      console.error('Error getting tournaments by event type:', error);
      throw error;
    }
  }

  /**
   * 토너먼트 참가자 통계 (단식/복식 고려)
   */
  async getTournamentParticipantStats(tournamentId: string): Promise<{
    totalParticipants: number;
    confirmedParticipants: number;
    pendingConfirmations: number;
    eventTypeDisplay: string;
    isDoubles: boolean;
  }> {
    try {
      const tournament = await this.getTournament(tournamentId);
      if (!tournament) {
        throw new Error('Tournament not found');
      }

      const isDoubles = getMatchFormatFromTournamentEventType(tournament.eventType) === 'doubles';
      const totalParticipants = tournament.participants.length;
      const confirmedParticipants = tournament.participants.filter(
        p => p.status === 'confirmed' || !isDoubles || p.partnerConfirmed
      ).length;
      const pendingConfirmations = tournament.participants.filter(
        p => isDoubles && !p.partnerConfirmed
      ).length;

      return {
        totalParticipants,
        confirmedParticipants,
        pendingConfirmations,
        eventTypeDisplay: getTournamentEventTypeDisplayName(tournament.eventType),
        isDoubles,
      };
    } catch (error) {
      console.error('Error getting tournament participant stats:', error);
      throw error;
    }
  }

  /**
   * 토너먼트 대진표 예비 검증
   */
  async validateBracketGeneration(
    tournamentId: string
  ): Promise<{ canGenerate: boolean; issues: string[] }> {
    try {
      const tournament = await this.getTournament(tournamentId);
      if (!tournament) {
        return {
          canGenerate: false,
          issues: [i18n.t('services.tournament.notFound')],
        };
      }

      const issues: string[] = [];
      const isDoubles = getMatchFormatFromTournamentEventType(tournament.eventType) === 'doubles';

      // 최소 참가자 수 확인
      if (tournament.participants.length < tournament.settings.minParticipants) {
        issues.push(
          i18n.t('services.tournament.minParticipantsRequired', {
            current: tournament.participants.length,
            required: tournament.settings.minParticipants,
          })
        );
      }

      // 복식인 경우 파트너 확인 상태 검사
      if (isDoubles) {
        const unconfirmedPartners = tournament.participants.filter(p => !p.partnerConfirmed);
        if (unconfirmedPartners.length > 0) {
          issues.push(
            i18n.t('services.tournament.partnerConfirmationRequired', {
              count: unconfirmedPartners.length,
            })
          );
        }
      }

      // 대진표 형식 호환성 검사
      if (
        tournament.format === 'single_elimination' ||
        tournament.format === 'double_elimination'
      ) {
        const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(tournament.participants.length)));
        if (tournament.participants.length !== nextPowerOfTwo) {
          issues.push(
            i18n.t('services.tournament.participantCountMismatch', {
              required: nextPowerOfTwo,
            })
          );
        }
      }

      return {
        canGenerate: issues.length === 0,
        issues,
      };
    } catch (error) {
      console.error('Error validating bracket generation:', error);
      return {
        canGenerate: false,
        issues: [i18n.t('services.tournament.validationError')],
      };
    }
  }

  /**
   * 토너먼트 대진표 생성 (통합 함수)
   * 🌉 [HEIMDALL] Phase 5.2: Server-Side Bracket Generation
   */
  async generateTournamentBracket(tournamentId: string): Promise<void> {
    try {
      // ⚠️ RACE CONDITION PREVENTION: Wait briefly to ensure all pending Cloud Function calls complete
      console.log('🔒 [RACE PREVENTION] Waiting 500ms to ensure participant additions complete...');
      await new Promise(resolve => setTimeout(resolve, 500));

      const tournament = await this.getTournament(tournamentId);
      if (!tournament) {
        throw new Error('Tournament not found');
      }

      if (
        tournament.status !== 'draft' &&
        tournament.status !== 'registration' &&
        tournament.status !== 'bracket_generation'
      ) {
        throw new Error(
          'Tournament bracket can only be generated in draft, registration, or bracket_generation status'
        );
      }

      const participantCount = tournament.participants?.length || 0;
      console.log(`🔍 [RACE PREVENTION] Verified participant count: ${participantCount}`);

      if (participantCount < 2) {
        throw new Error('At least 2 participants are required to generate bracket');
      }

      // Enhanced 시딩 방식에 따른 처리 with validation and error handling
      try {
        if (tournament.settings.seedingMethod === 'manual') {
          // 수동 시딩인 경우 시드 검증
          const seedValidation = this.validateSeeds(tournament);

          // Log warnings even if validation passes
          if (seedValidation.warnings.length > 0) {
            console.warn('⚠️ Manual seeding warnings:', seedValidation.warnings);
          }

          if (!seedValidation.isValid) {
            throw new Error(`Manual seed validation failed: ${seedValidation.errors.join(', ')}`);
          }
          console.log('✅ Manual seed validation passed');
        } else {
          // Pre-validation for automatic seeding
          const preValidation = this.validateSeeds(tournament);
          if (preValidation.warnings.length > 0) {
            console.warn(
              `⚠️ Automatic seeding warnings (${tournament.settings.seedingMethod}):`,
              preValidation.warnings
            );
          }

          // 자동 시딩인 경우 시드 자동 생성
          await this.generateAutomaticSeeds(tournamentId, tournament.settings.seedingMethod);
          console.log(
            `✅ Enhanced automatic seeding completed using ${tournament.settings.seedingMethod} method`
          );

          // Post-validation to ensure seeding was successful
          const updatedTournament = await this.getTournament(tournamentId);
          const postValidation = this.validateSeeds(updatedTournament!);
          if (!postValidation.isValid) {
            throw new Error(`Post-seeding validation failed: ${postValidation.errors.join(', ')}`);
          }
        }
      } catch (seedingError) {
        // Enhanced error handling with context and suggestions
        const enhancedError = this.handleSeedingError(seedingError as Error, tournament);
        console.error('❌ Seeding process failed:', enhancedError.message);
        throw enhancedError;
      }

      // 🌉 [HEIMDALL] Phase 5.2: Call Cloud Function for bracket generation
      console.log('🌉 [HEIMDALL] Calling generateBracket Cloud Function...');

      const generateBracketFn = httpsCallable(functions, 'generateBracket');
      const result = await generateBracketFn({ tournamentId });

      console.log('✅ [HEIMDALL] Cloud Function response:', result.data);
      console.log('✅ Tournament bracket generated successfully');
    } catch (error) {
      console.error('Error generating tournament bracket:', error);
      throw error;
    }
  }

  /**
   * 토너먼트 참가자 목록 조회
   */
  async getTournamentParticipants(tournamentId: string): Promise<TournamentParticipant[]> {
    try {
      const participantsRef = collection(db, 'tournaments', tournamentId, 'participants');
      const snapshot = await getDocs(query(participantsRef, orderBy('seed')));

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as TournamentParticipant[];
    } catch (error) {
      console.error('Error getting tournament participants:', error);
      throw error;
    }
  }

  /**
   * 토너먼트 참가자 추가
   */
  async addTournamentParticipant(
    tournamentId: string,
    participant: Omit<TournamentParticipant, 'id' | 'tournamentId'>
  ): Promise<string> {
    try {
      const tournament = await this.getTournament(tournamentId);
      if (!tournament) {
        throw new Error('Tournament not found');
      }

      if (tournament.status !== 'draft' && tournament.status !== 'registration') {
        throw new Error('Cannot add participants to tournament in current status');
      }

      const participantsRef = collection(db, 'tournaments', tournamentId, 'participants');
      const docRef = await addDoc(participantsRef, {
        ...participant,
        tournamentId,
        registeredAt: serverTimestamp(),
      });

      console.log('✅ Tournament participant added:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding tournament participant:', error);
      throw error;
    }
  }

  /**
   * 토너먼트 참가자 제거 (array-based)
   */
  /**
   * 🌉 [HEIMDALL] Phase 5.3: Withdraw From Tournament via Cloud Function
   * Migrated from client-side to server-side for security
   */
  async removeParticipant(tournamentId: string, participantId: string): Promise<void> {
    try {
      console.log(
        '🚪 [WITHDRAW] Calling withdrawFromTournament Cloud Function:',
        participantId,
        'from tournament:',
        tournamentId
      );

      const withdrawFn = httpsCallable(functions, 'withdrawFromTournament');
      const result = await withdrawFn({ tournamentId, userId: participantId });

      console.log('✅ [WITHDRAW] Participant removed successfully:', result.data);
    } catch (error) {
      console.error('❌ [WITHDRAW] Error removing participant:', error);
      throw error;
    }
  }

  /**
   * 🌉 [HEIMDALL] Phase 5.4: Submit Match Result via Cloud Function
   * Migrated from client-side (608 lines!) to server-side for security and reliability
   *
   * Server-side handles:
   * - ⚡ Thor's Transaction Golden Rule (Reads First, Writes Later)
   * - Match completion + Winner advancement
   * - Final match processing (Champion/RunnerUp)
   * - 🏛️ PROJECT OLYMPUS Rankings calculation
   * - 🏆 Trophy awarding
   * - Tournament Events creation
   * - Stats updates (ELO, wins/losses)
   */
  async submitMatchResult(
    tournamentId: string,
    matchId: string,
    result: {
      winnerId: string | null;
      score: TournamentScore;
      notes?: string;
    }
  ): Promise<void> {
    try {
      console.log('🎾 [SUBMIT_MATCH_RESULT] Calling Cloud Function:', {
        matchId,
        tournamentId,
        winnerId: result.winnerId,
        scoreData: result.score,
      });

      const submitMatchResultFn = httpsCallable(functions, 'submitMatchResult');

      // ⚖️ [VAR SYSTEM] Send full score data for server-side winner verification
      const response = await submitMatchResultFn({
        matchId,
        tournamentId,
        winnerId: result.winnerId, // Optional: Server will verify from scoreData
        scoreData: {
          sets: result.score.sets,
          finalScore: result.score.finalScore,
          walkover: result.score.walkover,
          retired: result.score.retired,
          retiredPlayer: result.score.retiredPlayer,
        },
        // Deprecated fields (for backward compatibility during migration)
        score: result.score.finalScore,
        retired: result.score.retired,
        walkover: result.score.walkover,
      });

      console.log('✅ [SUBMIT_MATCH_RESULT] Match result submitted successfully:', response.data);
    } catch (error) {
      console.error('❌ [SUBMIT_MATCH_RESULT] Error submitting match result:', error);
      throw error;
    }
  }

  /**
   * 승자를 다음 라운드로 진출시키기
   */
  private async advanceWinnerToNextRound(
    tournamentId: string,
    matchId: string,
    winnerId: string
  ): Promise<void> {
    // Get current match to find next match info
    const currentMatchRef = doc(db, 'tournaments', tournamentId, 'matches', matchId);
    const currentMatchSnap = await getDoc(currentMatchRef);

    if (!currentMatchSnap.exists()) {
      throw new Error(`Current match ${matchId} not found`);
    }

    const currentMatch = currentMatchSnap.data() as BracketMatch;

    // Find next match that this winner should advance to
    const nextMatch = currentMatch.nextMatch;
    if (!nextMatch) {
      return;
    }

    // Get winner player data from current match
    let winnerPlayer: BracketPlayer | null = null;
    if (currentMatch.player1?.playerId === winnerId) {
      winnerPlayer = currentMatch.player1;
    } else if (currentMatch.player2?.playerId === winnerId) {
      winnerPlayer = currentMatch.player2;
    }

    if (!winnerPlayer) {
      throw new Error(`Winner player ${winnerId} not found in current match players`);
    }

    // Update next match with winner
    const nextMatchRef = doc(db, 'tournaments', tournamentId, 'matches', nextMatch.matchId);
    let nextMatchSnap = await getDoc(nextMatchRef);

    if (!nextMatchSnap.exists()) {
      // Fallback: Try to find match by bracket position or round number
      const matchesRef = collection(db, 'tournaments', tournamentId, 'matches');
      const allMatches = await getDocs(matchesRef);

      let foundMatch = null;
      for (const doc of allMatches.docs) {
        const matchData = doc.data();
        if (
          matchData.id === nextMatch.matchId ||
          (matchData.roundNumber === currentMatch.roundNumber + 1 && matchData.bracketPosition)
        ) {
          foundMatch = { id: doc.id, data: matchData };
          break;
        }
      }

      if (foundMatch) {
        const fallbackNextMatchRef = doc(db, 'tournaments', tournamentId, 'matches', foundMatch.id);
        nextMatchSnap = await getDoc(fallbackNextMatchRef);
      }

      if (!nextMatchSnap.exists()) {
        throw new Error(`Next match ${nextMatch.matchId} not found even with fallback search`);
      }
    }

    const nextMatchData = nextMatchSnap.data() as BracketMatch;
    const intendedPosition = nextMatch.position === 'player1' ? 'player1' : 'player2';

    // 🏗️ CRITICAL: BYE Protection System - Only fill EMPTY slots
    let actualUpdateField: string | null = null;

    if (intendedPosition === 'player2' && !nextMatchData.player2) {
      // Round 1 winners go to player2 slot (reserved for them)
      actualUpdateField = 'player2';
    } else if (intendedPosition === 'player1' && !nextMatchData.player1) {
      // Other rounds: standard advancement to player1 if empty
      actualUpdateField = 'player1';
    } else if (!nextMatchData.player1) {
      // Fallback: Use player1 if available
      actualUpdateField = 'player1';
    } else if (!nextMatchData.player2) {
      // Fallback: Use player2 if available
      actualUpdateField = 'player2';
    } else {
      // 🚨 CRITICAL ERROR: Both slots occupied - this should never happen with new architecture
      console.error('🚨 [ARCHITECTURE ERROR] Both slots occupied - cannot advance winner!', {
        player1: nextMatchData.player1.playerName,
        player2: nextMatchData.player2.playerName,
        intendedWinner: winnerPlayer.playerName,
      });
      throw new Error(`Cannot advance winner - both slots occupied in ${nextMatch.matchId}`);
    }

    // Use the correct document reference for updating
    const actualNextMatchRef = nextMatchSnap.ref;

    await updateDoc(actualNextMatchRef, {
      [actualUpdateField]: winnerPlayer,
      updatedAt: serverTimestamp(),
    });

    // Check if both players are now set for next match
    const updatedNextMatchSnap = await getDoc(actualNextMatchRef);
    const updatedNextMatch = updatedNextMatchSnap.data() as BracketMatch;

    if (updatedNextMatch.player1 && updatedNextMatch.player2) {
      // Both players are set, update match status to scheduled
      await updateDoc(actualNextMatchRef, {
        status: 'scheduled',
        updatedAt: serverTimestamp(),
      });
    }
  }

  // Duplicate function removed - see subscribeToTournamentMatches above (line 779)

  /**
   * ⚡ Thor: Team-Based Bracket Generation
   * 복식 토너먼트를 팀 단위로 대진표 생성
   *
   * @param tournamentId 토너먼트 ID
   * @param teams DoublesTeam 배열 (예: 3팀)
   * @param teamCount 팀 수 (예: 3)
   * @returns 대진표 및 매치 목록
   *
   * Example (3팀):
   * - Bracket Size: 4 (2^2)
   * - Round 1: 시드 2팀 vs 시드 3팀 (1경기)
   * - Round 2: 시드 1팀 (BYE) vs R1 승자 (1경기)
   */
  private generateTeamBasedBracket(
    tournamentId: string,
    teams: DoublesTeam[],
    teamCount: number
  ): { bracket: BracketRound[]; matches: BracketMatch[] } {
    console.log(`⚡ [THOR] Starting team-based bracket generation for ${teamCount} teams`);

    // Bracket Size 계산 (3팀 → 4, 5팀 → 8, 6팀 → 8)
    const M = Math.pow(2, Math.ceil(Math.log2(teamCount)));
    const totalRounds = Math.ceil(Math.log2(M));
    const numByes = M - teamCount;

    console.log(`⚡ [THOR] Bracket parameters:`, {
      teamCount,
      bracketSize: M,
      totalRounds,
      byes: numByes,
    });

    // 시드 순으로 정렬 (이미 정렬되어 있지만 확실히 하기 위해)
    const sortedTeams = [...teams].sort((a, b) => (a.seed || 999) - (b.seed || 999));

    console.log(
      '⚡ [THOR] Teams by seed:',
      sortedTeams.map(t => `${t.teamName}(seed:${t.seed})`).join(', ')
    );

    const allMatches: BracketMatch[] = [];
    const bracket: BracketRound[] = [];
    let matchIdCounter = 1;

    // 🏆 BYE를 가진 팀과 첫 라운드에서 경기하는 팀 분리
    const teamsWithByes = sortedTeams.slice(0, numByes); // 높은 시드부터
    const teamsInFirstRound = sortedTeams.slice(numByes); // 나머지

    console.log(`⚡ [THOR] Teams with BYEs: ${teamsWithByes.map(t => t.teamName).join(', ')}`);
    console.log(`⚡ [THOR] Teams in Round 1: ${teamsInFirstRound.map(t => t.teamName).join(', ')}`);

    // Round 1 생성 (BYE가 아닌 팀들끼리 경기)
    if (teamsInFirstRound.length > 0) {
      console.log(`⚡ [THOR Round 1] Creating matches for ${teamsInFirstRound.length} teams`);
      const round1Matches: BracketMatch[] = [];
      const firstRoundPairs = teamsInFirstRound.length / 2;

      for (let i = 0; i < firstRoundPairs; i++) {
        const higherSeedTeam = teamsInFirstRound[i];
        const lowerSeedTeam = teamsInFirstRound[teamsInFirstRound.length - 1 - i];

        const match = this.createEmptyMatch(tournamentId, matchIdCounter++, 1, i + 1);

        // 팀의 두 선수를 "팀명"으로 표시 (playerName에 팀명 저장)
        match.player1 = {
          playerId: higherSeedTeam.teamId,
          playerName:
            higherSeedTeam.teamName ||
            `${higherSeedTeam.player1.playerName} / ${higherSeedTeam.player2.playerName}`,
          seed: higherSeedTeam.seed,
          status: 'filled' as BracketPositionStatus,
        };

        match.player2 = {
          playerId: lowerSeedTeam.teamId,
          playerName:
            lowerSeedTeam.teamName ||
            `${lowerSeedTeam.player1.playerName} / ${lowerSeedTeam.player2.playerName}`,
          seed: lowerSeedTeam.seed,
          status: 'filled' as BracketPositionStatus,
        };

        match.status = 'scheduled';
        round1Matches.push(match);
        allMatches.push(match);

        console.log(
          `  ⚡ R1M${i + 1}: ${match.player1.playerName}(seed:${match.player1.seed}) vs ${match.player2.playerName}(seed:${match.player2.seed})`
        );
      }

      bracket.push({
        roundNumber: 1,
        matches: round1Matches,
        roundName: getRoundName(1, totalRounds, round1Matches.length),
        isCompleted: false,
      });
    }

    // Round 2+ 생성 (빈 슬롯 + BYE 팀 배치)
    for (let round = 2; round <= totalRounds; round++) {
      const matchesInRound = M / Math.pow(2, round);
      const roundMatches: BracketMatch[] = [];

      console.log(`⚡ [THOR Round ${round}] Creating ${matchesInRound} match slots`);

      for (let i = 0; i < matchesInRound; i++) {
        const match = this.createEmptyMatch(tournamentId, matchIdCounter++, round, i + 1);

        // 🔧 [THOR] Round 2에서 BYE 팀 배치 (ATP/WTA standard)
        // Top seeds wait for R1 winners, middle BYE seeds play each other
        if (round === 2) {
          // player1에 BYE 팀 배치 (순서대로)
          if (i < teamsWithByes.length) {
            const byeTeam = teamsWithByes[i];
            match.player1 = {
              playerId: byeTeam.teamId,
              playerName:
                byeTeam.teamName || `${byeTeam.player1.playerName} / ${byeTeam.player2.playerName}`,
              seed: byeTeam.seed,
              status: 'bye' as BracketPositionStatus,
            };
            console.log(
              `  ⚡ R2M${i + 1}: ${byeTeam.teamName || 'Team'}(seed:${byeTeam.seed}) gets BYE (player1)`
            );
          }

          // player2에 BYE 팀 배치 (마지막 매치부터 역순으로)
          // Top seed는 R1 winner를 기다리고, 중간 seeds끼리 매칭
          const reversedIndex = matchesInRound - 1 - i;
          const player2ByeIndex = matchesInRound + reversedIndex;
          if (player2ByeIndex < teamsWithByes.length) {
            const byeTeam = teamsWithByes[player2ByeIndex];
            match.player2 = {
              playerId: byeTeam.teamId,
              playerName:
                byeTeam.teamName || `${byeTeam.player1.playerName} / ${byeTeam.player2.playerName}`,
              seed: byeTeam.seed,
              status: 'bye' as BracketPositionStatus,
            };
            console.log(
              `  ⚡ R2M${i + 1}: ${byeTeam.teamName || 'Team'}(seed:${byeTeam.seed}) gets BYE (player2)`
            );
          }
        }

        roundMatches.push(match);
        allMatches.push(match);
      }

      bracket.push({
        roundNumber: round,
        matches: roundMatches,
        roundName: getRoundName(round, totalRounds, roundMatches.length),
        isCompleted: false,
      });
    }

    console.log(
      `✅ [THOR] Team-based bracket complete: ${allMatches.length} matches, ${totalRounds} rounds`
    );

    // 🔧 FIX: Set nextMatch connections using GPS engine (same as singles tournaments)
    this.setupPerfectBracketConnections(allMatches, bracket);

    return { bracket, matches: allMatches };
  }

  /**
   * 빈 매치 객체 생성 헬퍼 함수
   */
  private createEmptyMatch(
    tournamentId: string,
    matchId: number,
    roundNumber: number,
    matchNumber: number
  ): BracketMatch {
    return {
      id: `${tournamentId}_match_${matchId}`,
      tournamentId,
      roundNumber,
      matchNumber,
      bracketPosition: matchId,
      status: 'scheduled',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      player1: undefined,
      player2: undefined,
    };
  }

  /**
   * 참가자를 브래킷 플레이어 객체로 변환
   */
  private participantToBracketPlayer(participant: TournamentParticipant): BracketPlayer {
    return {
      playerId: participant.playerId,
      playerName: participant.playerName,
      seed: participant.seed,
      status: 'filled' as BracketPositionStatus,
    };
  }

  /**
   * 🏆 6인 토너먼트 전용 브래킷 생성
   * 올바른 구조: R1(2경기) → R2(2경기) → R3(1경기)
   */
  private generate6PlayerBracket(
    tournamentId: string,
    participants: TournamentParticipant[]
  ): { bracket: BracketRound[]; matches: BracketMatch[] } {
    console.log('🏆 [6-PLAYER ARCHITECT] Starting optimized 6-player bracket generation');

    // 시드 순으로 정렬
    const sortedParticipants = [...participants].sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999));
    console.log(
      '🎯 [6P] Participants by seed:',
      sortedParticipants.map(p => `${p.playerName}(seed:${p.seed})`).join(', ')
    );

    const allMatches: BracketMatch[] = [];
    const bracket: BracketRound[] = [];
    let matchIdCounter = 1;

    // Round 1: 하위 4명이 경기 (Seed 3,4,5,6)
    console.log('🏆 [6P R1] Creating first round with lower seeds');
    const round1Matches: BracketMatch[] = [];

    // R1M1: Seed 3 vs Seed 6 (철이 vs Won)
    const r1m1 = this.createEmptyMatch(tournamentId, matchIdCounter++, 1, 1);
    r1m1.player1 = this.participantToBracketPlayer(sortedParticipants[2]); // Seed 3
    r1m1.player2 = this.participantToBracketPlayer(sortedParticipants[5]); // Seed 6
    r1m1.status = 'scheduled';
    round1Matches.push(r1m1);
    allMatches.push(r1m1);

    // R1M2: Seed 4 vs Seed 5 (숙이 vs 광이)
    const r1m2 = this.createEmptyMatch(tournamentId, matchIdCounter++, 1, 2);
    r1m2.player1 = this.participantToBracketPlayer(sortedParticipants[3]); // Seed 4
    r1m2.player2 = this.participantToBracketPlayer(sortedParticipants[4]); // Seed 5
    r1m2.status = 'scheduled';
    round1Matches.push(r1m2);
    allMatches.push(r1m2);

    bracket.push({
      roundNumber: 1,
      matches: round1Matches,
      roundName: 'First Round',
      isCompleted: false,
    });

    // Round 2: 상위 2명 부전승 + R1 승자들
    console.log('🏆 [6P R2] Creating second round with byes for top seeds');
    const round2Matches: BracketMatch[] = [];

    // R2M1: Seed 2 (정이) vs R1M1 승자
    const r2m1 = this.createEmptyMatch(tournamentId, matchIdCounter++, 2, 1);
    r2m1.player1 = this.participantToBracketPlayer(sortedParticipants[1]); // Seed 2 (정이)
    r2m1.status = 'scheduled';
    round2Matches.push(r2m1);
    allMatches.push(r2m1);

    // R2M2: Seed 1 (누님) vs R1M2 승자
    const r2m2 = this.createEmptyMatch(tournamentId, matchIdCounter++, 2, 2);
    r2m2.player1 = this.participantToBracketPlayer(sortedParticipants[0]); // Seed 1 (누님)
    r2m2.status = 'scheduled';
    round2Matches.push(r2m2);
    allMatches.push(r2m2);

    bracket.push({
      roundNumber: 2,
      matches: round2Matches,
      roundName: 'Semifinals',
      isCompleted: false,
    });

    // Round 3: 결승
    console.log('🏆 [6P R3] Creating final match');
    const round3Matches: BracketMatch[] = [];

    const r3m1 = this.createEmptyMatch(tournamentId, matchIdCounter++, 3, 1);
    r3m1.status = 'scheduled';
    round3Matches.push(r3m1);
    allMatches.push(r3m1);

    bracket.push({
      roundNumber: 3,
      matches: round3Matches,
      roundName: 'Final',
      isCompleted: false,
    });

    // 🧭 6인 토너먼트 GPS 네비게이션 설정
    console.log('🧭 [6P GPS] Setting up 6-player tournament navigation routes');

    // R1M1 승자 → R2M1 player2
    r1m1.nextMatch = {
      matchId: r2m1.id,
      position: 'player2',
    };

    // R1M2 승자 → R2M2 player2
    r1m2.nextMatch = {
      matchId: r2m2.id,
      position: 'player2',
    };

    // R2M1 승자 → R3M1 player1
    r2m1.nextMatch = {
      matchId: r3m1.id,
      position: 'player1',
    };

    // R2M2 승자 → R3M1 player2
    r2m2.nextMatch = {
      matchId: r3m1.id,
      position: 'player2',
    };

    console.log('🧭 [6P GPS] Navigation routes configured:');
    console.log(`  R1M1(${r1m1.id}) → R2M1(${r2m1.id})[player2]`);
    console.log(`  R1M2(${r1m2.id}) → R2M2(${r2m2.id})[player2]`);
    console.log(`  R2M1(${r2m1.id}) → R3M1(${r3m1.id})[player1]`);
    console.log(`  R2M2(${r2m2.id}) → R3M1(${r3m1.id})[player2]`);

    console.log('🏆 [6P] 6-player bracket structure created:', {
      totalMatches: allMatches.length,
      rounds: bracket.length,
      structure: 'R1(2) → R2(2) → R3(1)',
      navigationComplete: true,
    });

    return { bracket, matches: allMatches };
  }

  /**
   * 🏗️ FUTURE-PROOF BRACKET ARCHITECT™ - Complete Redesign
   * 토너먼트 시작부터 결승전까지 모든 경기 슬롯을 미리 생성
   * "채워 넣을 빈 슬롯이 없다" 문제를 원천적으로 해결
   */
  private generatePerfectBracket(
    tournamentId: string,
    participants: TournamentParticipant[]
  ): { bracket: BracketRound[]; matches: BracketMatch[] } {
    const N = participants.length;

    // 🏆 6인 토너먼트 특별 처리
    if (N === 6) {
      console.log('🏆 [6-PLAYER SPECIAL] Detected 6-player tournament - using optimized structure');
      return this.generate6PlayerBracket(tournamentId, participants);
    }

    const M = Math.pow(2, Math.ceil(Math.log2(N))); // Bracket size (8명, 16명 등)
    const totalRounds = Math.ceil(Math.log2(M)); // Total rounds needed
    const numByes = M - N; // BYE count

    console.log('🏗️ [FUTURE-PROOF ARCHITECT] Starting Complete Bracket Generation:');
    console.log(
      `  📊 Participants: ${N}, Bracket Size: ${M}, Rounds: ${totalRounds}, BYEs: ${numByes}`
    );
    console.log(
      `  🎯 Participants: ${participants.map(p => `${p.playerName}(seed:${p.seed})`).join(', ')}`
    );

    // 🏗️ STEP 1: Create ALL future match slots from start to finish
    const allMatches: BracketMatch[] = [];
    const bracket: BracketRound[] = [];
    let matchIdCounter = 1;

    console.log('🏗️ [STEP 1] Creating ALL future match slots (empty houses first):');

    // Create all rounds and all matches as empty slots
    for (let round = 1; round <= totalRounds; round++) {
      let matchesInRound: number;

      // ✅ Round 1 BYE adjustment for odd-sized tournaments
      if (round === 1 && numByes > 0) {
        // Only create matches for players who actually compete in Round 1
        matchesInRound = Math.max(1, (N - numByes) / 2);
        console.log(
          `  🎯 [BRACKET R1 BYE] Adjusted Round 1 matches: standard=${M / Math.pow(2, round)}, actual=${matchesInRound}, byePlayers=${numByes}`
        );
      } else {
        matchesInRound = M / Math.pow(2, round);
      }

      const roundMatches: BracketMatch[] = [];

      console.log(`  🏠 Round ${round}: Creating ${matchesInRound} empty match slots...`);

      for (let i = 0; i < matchesInRound; i++) {
        const match: BracketMatch = {
          id: `${tournamentId}_match_${matchIdCounter}`,
          tournamentId,
          roundNumber: round,
          matchNumber: i + 1,
          bracketPosition: matchIdCounter,
          status: 'scheduled', // All start as pending until populated
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          // 🏠 Empty slots - to be filled later
          player1: undefined,
          player2: undefined,
        };

        roundMatches.push(match);
        allMatches.push(match);
        matchIdCounter++;
      }

      const bracketRound: BracketRound = {
        roundNumber: round,
        roundName: getRoundName(round, totalRounds, roundMatches.length),
        matches: roundMatches,
        isCompleted: false,
      };

      bracket.push(bracketRound);
    }

    // ✅ Log bracket structure for verification
    console.log('✅ [BRACKET STRUCTURE] Generated bracket:', {
      totalMatches: bracket.reduce((sum, r) => sum + r.matches.length, 0),
      rounds: bracket.map(r => ({
        round: r.roundNumber,
        name: r.roundName,
        matches: r.matches.length,
      })),
    });

    // 🏛️ [SERVER SOVEREIGNTY] STEP 2: NO CLIENT-SIDE PREDICTIONS
    // 클라이언트는 더 이상 미래를 예측하지 않습니다.
    // 모든 연결 정보는 서버에서 결정됩니다.
    console.log(
      '🏛️ [STEP 2] CLIENT ABSTAINS FROM FUTURE PREDICTIONS - Server will decide all connections'
    );

    // 🏗️ STEP 3: Populate first round with actual players
    console.log('🏗️ [STEP 3] Moving actual players into Round 1 matches:');

    // 🎾 [ATP/WTA STANDARD] Phase 1: Ensure proper seed-based sorting
    const sortedParticipants = [...participants].sort((a, b) => (a.seed || 999) - (b.seed || 999));

    const playersWithByes = sortedParticipants.slice(0, numByes);
    const playersInFirstRound = sortedParticipants.slice(numByes);

    console.log('🎾 [ATP/WTA] Seed-sorted participants confirmed:');
    console.log(
      `  📊 Total: ${sortedParticipants.map(p => `${p.playerName}(${p.seed})`).join(', ')}`
    );

    // 🎾 [ATP/WTA STANDARD] Phase 1 Complete: Guaranteed seed order
    console.log('✅ [ATP/WTA Phase 1] Seed-based sorting verified and enforced');

    console.log(
      `  ✅ BYE Players: ${playersWithByes.map(p => `${p.playerName}(seed:${p.seed})`).join(', ')}`
    );
    console.log(
      `  ⚔️ Round 1 Players: ${playersInFirstRound.map(p => `${p.playerName}(seed:${p.seed})`).join(', ')}`
    );

    // 🎾 [ATP/WTA STANDARD] Phase 2: Implement professional tournament pairing formula
    console.log('🎾 [ATP/WTA Phase 2] Applying standard highest-vs-lowest seed pairing:');

    const round1Matches = bracket[0].matches;
    const firstRoundPairs = playersInFirstRound.length / 2;

    // 🏆 ATP/WTA OFFICIAL FORMULA: Highest seed vs Lowest seed
    for (let i = 0; i < firstRoundPairs; i++) {
      // ✅ CORRECT: Seed-based pairing (not array index)
      const higherSeedPlayer = playersInFirstRound[i]; // 가장 높은 시드부터
      const lowerSeedPlayer = playersInFirstRound[playersInFirstRound.length - 1 - i]; // 가장 낮은 시드부터

      if (round1Matches[i]) {
        const match = round1Matches[i];

        match.player1 = {
          playerId: higherSeedPlayer.playerId,
          playerName: higherSeedPlayer.playerName,
          seed: higherSeedPlayer.seed,
          status: 'filled' as BracketPositionStatus,
        };

        match.player2 = {
          playerId: lowerSeedPlayer.playerId,
          playerName: lowerSeedPlayer.playerName,
          seed: lowerSeedPlayer.seed,
          status: 'filled' as BracketPositionStatus,
        };

        match.status = 'scheduled'; // Ready to play

        console.log(
          `    🏆 [ATP/WTA] Match ${i + 1}: ${match.player1.playerName}(seed:${match.player1.seed}) vs ${match.player2.playerName}(seed:${match.player2.seed})`
        );
        console.log(
          `      ✅ Standard pairing: Higher seed (${match.player1.seed}) vs Lower seed (${match.player2.seed})`
        );
      }
    }

    console.log(
      '✅ [ATP/WTA Phase 2] Professional tournament pairing formula applied successfully'
    );

    // 🎾 [ATP/WTA STANDARD] Phase 3: Clarify winner advancement paths
    // ⚠️ ONLY for tournaments with BYEs (Round 2 must exist!)
    if (playersWithByes.length > 0 && bracket.length > 1) {
      console.log('🎾 [ATP/WTA Phase 3] Establishing correct BYE placement for Round 2:');

      const round2Matches = bracket[1].matches;
      // ✅ Count only filled matches (ignore empty slots)
      const numRound1Matches = round1Matches.filter(m => m.player1 && m.player2).length;
      const numByePlayers = playersWithByes.length;

      console.log('🔍 [BYE ALLOCATION] Analysis:');
      console.log(`  📊 Round 1 matches: ${numRound1Matches}`);
      console.log(`  📊 BYE players: ${numByePlayers}`);
      console.log(
        `  📊 BYE list: ${playersWithByes.map(p => `${p.playerName}(seed:${p.seed})`).join(', ')}`
      );
      console.log(`  📊 Round 2 matches available: ${round2Matches.length}`);

      let round2MatchIndex = 0;

      // 🎯 STEP 1: BYE players vs Round 1 winners
      console.log('🎯 [STEP 1] Pairing BYE players with Round 1 winners:');
      const numByeVsWinnerMatches = Math.min(numRound1Matches, numByePlayers);

      for (let i = 0; i < numByeVsWinnerMatches; i++) {
        const byePlayer = playersWithByes[i];
        const targetMatch = round2Matches[round2MatchIndex];
        const r1Match = round1Matches[i];

        // Place BYE player in player1
        targetMatch.player1 = {
          playerId: byePlayer.playerId,
          playerName: byePlayer.playerName,
          seed: byePlayer.seed,
          status: 'filled' as BracketPositionStatus,
        };
        targetMatch.status = 'scheduled';

        // Set Round 1 winner destination to player2
        r1Match.nextMatch = {
          matchId: targetMatch.id,
          position: 'player2',
        };

        console.log(
          `  ✅ R2M${round2MatchIndex + 1}: ${byePlayer.playerName}(${byePlayer.seed}) vs R1M${i + 1} winner`
        );
        console.log(
          `    🗺️ R1M${i + 1} [${r1Match.player1?.playerName}(${r1Match.player1?.seed}) vs ${r1Match.player2?.playerName}(${r1Match.player2?.seed})] → R2M${round2MatchIndex + 1}.player2`
        );

        round2MatchIndex++;
      }

      // 🎯 STEP 2: Remaining BYE players vs each other
      const remainingByePlayers = numByePlayers - numByeVsWinnerMatches;
      if (remainingByePlayers > 0) {
        console.log('🎯 [STEP 2] Pairing remaining BYE players with each other:');

        for (let i = numByeVsWinnerMatches; i < numByePlayers; i += 2) {
          if (i + 1 < numByePlayers) {
            const byePlayer1 = playersWithByes[i];
            const byePlayer2 = playersWithByes[i + 1];
            const targetMatch = round2Matches[round2MatchIndex];

            // Both BYE players placed immediately
            targetMatch.player1 = {
              playerId: byePlayer1.playerId,
              playerName: byePlayer1.playerName,
              seed: byePlayer1.seed,
              status: 'filled' as BracketPositionStatus,
            };
            targetMatch.player2 = {
              playerId: byePlayer2.playerId,
              playerName: byePlayer2.playerName,
              seed: byePlayer2.seed,
              status: 'filled' as BracketPositionStatus,
            };
            targetMatch.status = 'scheduled';

            console.log(
              `  ✅ R2M${round2MatchIndex + 1}: ${byePlayer1.playerName}(${byePlayer1.seed}) vs ${byePlayer2.playerName}(${byePlayer2.seed}) [Both BYE]`
            );

            round2MatchIndex++;
          }
        }
      }

      console.log(
        `✅ [ATP/WTA Phase 3] Round 2 configured with ${round2MatchIndex} active matches`
      );
    } else {
      console.log(
        'ℹ️ [ATP/WTA Phase 3] Skipped - No BYEs in this tournament (all participants in Round 1)'
      );
    }

    // 🏗️ STEP 5: Final validation of the complete architecture
    console.log('🏗️ [STEP 5] Validating complete bracket architecture:');

    const allFilledPlayers = allMatches.flatMap(match =>
      [match.player1, match.player2].filter(
        (p): p is BracketPlayer => p !== undefined && p !== null
      )
    );
    const uniquePlayersInBracket = new Map<string, BracketPlayer>();
    allFilledPlayers.forEach(player => {
      uniquePlayersInBracket.set(player.playerId, player);
    });

    console.log('🏗️ [ARCHITECTURE COMPLETE] Future-Proof Bracket Summary:');
    console.log(`  🏠 Total Match Slots Created: ${allMatches.length}`);
    console.log(
      `  ⚔️ Round 1 Active Matches: ${round1Matches.filter(m => m.player1 && m.player2).length}`
    );
    if (bracket.length > 1) {
      const round2Matches = bracket[1].matches;
      console.log(
        `  🏆 Round 2 BYE Matches: ${round2Matches.filter(m => m.player1 && !m.player2).length}`
      );
      console.log(`  🏠 Round 2 Reserved Slots: ${round2Matches.filter(m => !m.player2).length}`);
    }
    console.log(`  📊 Players Placed: ${uniquePlayersInBracket.size}/${participants.length}`);

    // 🔍 Enhanced validation logging for debugging
    console.log('🔍 [DEBUG] Validation Analysis:');
    console.log(`  📊 Total participants: ${participants.length}`);
    console.log(
      `  📊 Participants: ${participants.map(p => `${p.playerName}(seed:${p.seed})`).join(', ')}`
    );
    console.log(`  📊 Players found in bracket: ${uniquePlayersInBracket.size}`);
    console.log(
      `  📊 Bracket players: ${Array.from(uniquePlayersInBracket.values())
        .map(p => `${p.playerName}(seed:${p.seed})`)
        .join(', ')}`
    );

    // Validate all participants are included
    const bracketPlayerIds = new Set(Array.from(uniquePlayersInBracket.keys()));
    const missingPlayers = participants.filter(p => !bracketPlayerIds.has(p.playerId));

    if (missingPlayers.length > 0) {
      console.error(
        '❌ [ARCHITECTURE ERROR] Missing players:',
        missingPlayers.map(p => `${p.playerName}(seed:${p.seed})`)
      );
      console.error('🔍 [DEBUG] Missing player analysis:');
      missingPlayers.forEach(missing => {
        console.error(
          `  ❌ ${missing.playerName} (ID: ${missing.playerId}, seed: ${missing.seed})`
        );
        console.error(
          `  🔍 Expected in: ${(missing.seed ?? 999) <= numByes ? 'Round 2 BYE' : 'Round 1 match'}`
        );
      });

      // Detailed match analysis
      console.error('🔍 [DEBUG] Match-by-match player placement:');
      allMatches.forEach((match, idx) => {
        console.error(
          `  Match ${idx + 1} (Round ${match.roundNumber}): ${match.player1?.playerName || 'empty'} vs ${match.player2?.playerName || 'empty'}`
        );
      });
    } else {
      console.log('✅ [ARCHITECTURE VALIDATED] All participants successfully placed in bracket!');
    }

    // Validate seed #1 specifically
    const seed1Participants = participants.filter(p => p.seed === 1);
    const seed1InBracket = Array.from(uniquePlayersInBracket.values()).filter(p => p.seed === 1);

    console.log('🏆 [SEED #1 ARCHITECTURE CHECK]:');
    console.log(
      `  📊 Seed #1 Expected: ${seed1Participants.length} (${seed1Participants.map(p => p.playerName).join(', ')})`
    );
    console.log(
      `  📊 Seed #1 In Bracket: ${seed1InBracket.length} (${seed1InBracket.map(p => p.playerName).join(', ')})`
    );

    if (seed1Participants.length === seed1InBracket.length) {
      console.log(
        '✅ [SEED #1 ARCHITECTURE] Perfect! All seed #1 players have their reserved slots!'
      );
    } else {
      console.error('❌ [SEED #1 ARCHITECTURE ERROR] Seed #1 players missing from bracket!');
    }

    // 🗺️ [PERFECT NAVIGATION MAP] Add nextMatch connections to all matches
    console.log('🗺️ [PERFECT NAVIGATION MAP] Setting up bracket connections...');
    this.setupPerfectBracketConnections(allMatches, bracket);
    console.log('✅ [PERFECT NAVIGATION MAP] All nextMatch connections established!');

    return { bracket, matches: allMatches };
  }

  /**
   * 🏗️ Future-Proof Bracket Connection Architecture
   * 모든 매치의 승자 진출 경로를 미리 설정하여 완벽한 연결 구조 구축
   */
  // 🏛️ [SERVER SOVEREIGNTY] FORMER setupFutureBracketConnections FUNCTION REMOVED
  // 클라이언트는 더 이상 미래를 예측하거나 연결을 설정하지 않습니다.
  // 모든 토너먼트 운명은 오직 서버의 '단일한 두뇌'에 의해서만 결정됩니다.

  /**
   * Firebase에 대진표 저장
   */
  private async saveBracketToFirebase(
    tournamentId: string,
    bracket: BracketRound[],
    matches: BracketMatch[]
  ): Promise<void> {
    try {
      const batch = writeBatch(db);

      // 토너먼트 문서 업데이트
      const tournamentRef = doc(db, 'tournaments', tournamentId);
      batch.update(tournamentRef, {
        bracket,
        totalRounds: bracket.length,
        status: 'bracket_generation',
        updatedAt: serverTimestamp(),
      });

      // 각 매치를 subcollection에 저장
      matches.forEach(match => {
        const matchRef = doc(db, 'tournaments', tournamentId, 'matches', match.id);
        batch.set(matchRef, match);
      });

      await batch.commit();
      console.log('✅ Bracket saved to Firebase successfully');
    } catch (error) {
      console.error('Error saving bracket to Firebase:', error);
      throw error;
    }
  }

  /**
   * 자동 시드 생성 (Enhanced with user profile data)
   */
  private async generateAutomaticSeeds(
    tournamentId: string,
    seedingMethod: 'manual' | 'ranking' | 'rating' | 'random' | 'snake'
  ): Promise<void> {
    try {
      const tournament = await this.getTournament(tournamentId);
      if (!tournament) {
        throw new Error('Tournament not found');
      }

      const participants = [...tournament.participants];
      const isDoubles = getMatchFormatFromTournamentEventType(tournament.eventType) === 'doubles';

      // 🔧 [THOR] 복식 토너먼트: 팀 단위로 시드 생성
      if (isDoubles) {
        console.log('⚡ [THOR] Doubles tournament - generating team-based seeds');
        await this.generateDoublesTeamSeeds(tournamentId, seedingMethod, tournament, participants);
        return;
      }

      // 🎾 단식 토너먼트: 기존 개인 기반 시드 생성
      console.log('🎾 [SINGLES] Generating individual seeds');

      // Batch fetch user profiles for enhanced seeding data
      const userIds = participants.map(p => p.playerId);
      const userProfiles = await authService.getBatchUserProfiles(userIds);

      // Create enhanced participant data with profile information
      const enhancedParticipants = participants.map((participant, index) => {
        const profileData = userProfiles.find((up: any) => up.userId === participant.playerId);
        const profile = ((profileData as any)?.profile as any) || {};

        return {
          ...participant,
          registrationOrder: index, // ⭐ Official Tiebreaker: Store registration order
          userProfile: profile,
          clubStats: profile.clubMemberships?.[tournament.clubId]?.clubStats || null,
          skillLevel: profile.skillLevel || { selfAssessed: participant.skillLevel || '3.0' },
          stats: profile.stats || {
            unifiedEloRating: 1200,
            matchesPlayed: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
          },
        };
      });

      let seedAssignments: Array<{ playerId: string; seed: number }> = [];

      switch (seedingMethod) {
        case 'ranking':
          // 클럽 랭킹 기반 시딩 (Enhanced with club-specific data)
          enhancedParticipants.sort((a, b) => {
            // Primary: Club ranking (lower number = better rank = higher seed)
            const clubRankA = (a.clubStats as any)?.clubRanking || 999;
            const clubRankB = (b.clubStats as any)?.clubRanking || 999;
            if (clubRankA !== clubRankB) {
              return clubRankA - clubRankB;
            }

            // Secondary: Club win rate
            const winRateA = (a.clubStats as any)?.winRate || 0;
            const winRateB = (b.clubStats as any)?.winRate || 0;
            if (Math.abs(winRateA - winRateB) > 0.01) {
              return winRateB - winRateA;
            }

            // Tertiary: Club matches played (more experience = higher seed for ties)
            const clubMatchesA = a.clubStats?.matchesPlayed || 0;
            const clubMatchesB = b.clubStats?.matchesPlayed || 0;
            if (clubMatchesA !== clubMatchesB) {
              return clubMatchesB - clubMatchesA;
            }

            // Quaternary: ELO rating
            const eloA = (a.stats as any)?.unifiedEloRating || 1200;
            const eloB = (b.stats as any)?.unifiedEloRating || 1200;
            if (eloA !== eloB) {
              return eloB - eloA;
            }

            // ⭐ Official Tiebreaker 2nd: Set Win Rate (세트 득실률)
            const totalSetsA = ((a.stats as any)?.setsWon || 0) + ((a.stats as any)?.setsLost || 0);
            const totalSetsB = ((b.stats as any)?.setsWon || 0) + ((b.stats as any)?.setsLost || 0);
            const setWinRateA = totalSetsA > 0 ? ((a.stats as any)?.setsWon || 0) / totalSetsA : 0;
            const setWinRateB = totalSetsB > 0 ? ((b.stats as any)?.setsWon || 0) / totalSetsB : 0;

            if (setWinRateA !== setWinRateB) {
              return setWinRateB - setWinRateA;
            }

            // ⭐ Official Tiebreaker 3rd: Game Win Rate (게임 득실률)
            const totalGamesA =
              ((a.stats as any)?.gamesWon || 0) + ((a.stats as any)?.gamesLost || 0);
            const totalGamesB =
              ((b.stats as any)?.gamesWon || 0) + ((b.stats as any)?.gamesLost || 0);
            const gameWinRateA =
              totalGamesA > 0 ? ((a.stats as any)?.gamesWon || 0) / totalGamesA : 0;
            const gameWinRateB =
              totalGamesB > 0 ? ((b.stats as any)?.gamesWon || 0) / totalGamesB : 0;

            if (gameWinRateA !== gameWinRateB) {
              return gameWinRateB - gameWinRateA;
            }

            // ⭐ Official Tiebreaker Final: Registration Order (earlier registration = higher seed)
            return a.registrationOrder - b.registrationOrder;
          });
          break;

        case 'rating':
          // ELO 레이팅 기반 시딩 (Enhanced with confidence weighting)
          enhancedParticipants.sort((a, b) => {
            // Primary: Unified ELO rating
            const eloA = (a.stats as any)?.unifiedEloRating || 1200;
            const eloB = (b.stats as any)?.unifiedEloRating || 1200;
            if (Math.abs(eloA - eloB) > 10) {
              // Significant ELO difference
              return eloB - eloA;
            }

            // Secondary: Calculated skill level confidence
            const confidenceA = (a.skillLevel as any)?.confidence || 0.5;
            const confidenceB = (b.skillLevel as any)?.confidence || 0.5;
            const calculatedA =
              (a.skillLevel as any)?.calculated ||
              parseFloat((a.skillLevel as any)?.selfAssessed) ||
              3.0;
            const calculatedB =
              (b.skillLevel as any)?.calculated ||
              parseFloat((b.skillLevel as any)?.selfAssessed) ||
              3.0;

            const weightedSkillA = calculatedA * confidenceA;
            const weightedSkillB = calculatedB * confidenceB;
            if (Math.abs(weightedSkillA - weightedSkillB) > 0.1) {
              return weightedSkillB - weightedSkillA;
            }

            // Tertiary: Total matches played (experience tiebreaker)
            const matchesA = (a.stats as any)?.matchesPlayed || 0;
            const matchesB = (b.stats as any)?.matchesPlayed || 0;
            if (matchesA !== matchesB) {
              return matchesB - matchesA;
            }

            // ⭐ Official Tiebreaker 2nd: Set Win Rate (세트 득실률)
            const totalSetsA = ((a.stats as any)?.setsWon || 0) + ((a.stats as any)?.setsLost || 0);
            const totalSetsB = ((b.stats as any)?.setsWon || 0) + ((b.stats as any)?.setsLost || 0);
            const setWinRateA = totalSetsA > 0 ? ((a.stats as any)?.setsWon || 0) / totalSetsA : 0;
            const setWinRateB = totalSetsB > 0 ? ((b.stats as any)?.setsWon || 0) / totalSetsB : 0;

            if (setWinRateA !== setWinRateB) {
              return setWinRateB - setWinRateA;
            }

            // ⭐ Official Tiebreaker 3rd: Game Win Rate (게임 득실률)
            const totalGamesA =
              ((a.stats as any)?.gamesWon || 0) + ((a.stats as any)?.gamesLost || 0);
            const totalGamesB =
              ((b.stats as any)?.gamesWon || 0) + ((b.stats as any)?.gamesLost || 0);
            const gameWinRateA =
              totalGamesA > 0 ? ((a.stats as any)?.gamesWon || 0) / totalGamesA : 0;
            const gameWinRateB =
              totalGamesB > 0 ? ((b.stats as any)?.gamesWon || 0) / totalGamesB : 0;

            if (gameWinRateA !== gameWinRateB) {
              return gameWinRateB - gameWinRateA;
            }

            // ⭐ Official Tiebreaker Final: Registration Order (earlier registration = higher seed)
            return a.registrationOrder - b.registrationOrder;
          });
          break;

        case 'random':
          // 무작위 시딩 (Enhanced with secure randomization)
          this.secureRandomShuffle(enhancedParticipants);
          break;

        case 'snake': {
          // 스네이크 드래프트 방식 (Enhanced skill-based)
          // First sort by combined skill metrics
          enhancedParticipants.sort((a, b) => {
            const eloA = a.stats?.unifiedEloRating || 1200;
            const eloB = b.stats?.unifiedEloRating || 1200;
            const skillA = parseFloat(a.skillLevel?.selfAssessed) || 3.0;
            const skillB = parseFloat(b.skillLevel?.selfAssessed) || 3.0;

            // Combine ELO and skill level for better ordering
            const combinedA = eloA / 400 + skillA; // Normalize ELO to skill level scale
            const combinedB = eloB / 400 + skillB;

            if (combinedA !== combinedB) {
              return combinedB - combinedA;
            }

            // ⭐ Official Tiebreaker 2nd: Set Win Rate (세트 득실률)
            const totalSetsA = ((a.stats as any)?.setsWon || 0) + ((a.stats as any)?.setsLost || 0);
            const totalSetsB = ((b.stats as any)?.setsWon || 0) + ((b.stats as any)?.setsLost || 0);
            const setWinRateA = totalSetsA > 0 ? ((a.stats as any)?.setsWon || 0) / totalSetsA : 0;
            const setWinRateB = totalSetsB > 0 ? ((b.stats as any)?.setsWon || 0) / totalSetsB : 0;

            if (setWinRateA !== setWinRateB) {
              return setWinRateB - setWinRateA;
            }

            // ⭐ Official Tiebreaker 3rd: Game Win Rate (게임 득실률)
            const totalGamesA =
              ((a.stats as any)?.gamesWon || 0) + ((a.stats as any)?.gamesLost || 0);
            const totalGamesB =
              ((b.stats as any)?.gamesWon || 0) + ((b.stats as any)?.gamesLost || 0);
            const gameWinRateA =
              totalGamesA > 0 ? ((a.stats as any)?.gamesWon || 0) / totalGamesA : 0;
            const gameWinRateB =
              totalGamesB > 0 ? ((b.stats as any)?.gamesWon || 0) / totalGamesB : 0;

            if (gameWinRateA !== gameWinRateB) {
              return gameWinRateB - gameWinRateA;
            }

            // ⭐ Official Tiebreaker Final: Registration Order (earlier registration = higher seed)
            return a.registrationOrder - b.registrationOrder;
          });

          // Apply snake pattern redistribution
          const snakeOrder: typeof enhancedParticipants = [];
          const half = Math.ceil(enhancedParticipants.length / 2);

          for (let i = 0; i < half; i++) {
            snakeOrder.push(enhancedParticipants[i]);
            const pairedIndex = enhancedParticipants.length - 1 - i;
            if (pairedIndex > i) {
              snakeOrder.push(enhancedParticipants[pairedIndex]);
            }
          }

          enhancedParticipants.splice(0, enhancedParticipants.length, ...snakeOrder);
          break;
        }

        default:
          throw new Error(`Unsupported seeding method: ${seedingMethod}`);
      }

      // 시드 번호 배정
      seedAssignments = enhancedParticipants.map((participant, index) => ({
        playerId: participant.playerId,
        seed: index + 1,
      }));

      // 시드 저장
      await this.assignSeeds(tournamentId, seedAssignments);

      // Enhanced logging with seeding rationale
      console.log(`✅ Enhanced automatic seeds generated using ${seedingMethod}:`);
      seedAssignments.forEach((assignment, index) => {
        const participant = enhancedParticipants[index];
        const rationale = this.getSeedingRationale(participant, seedingMethod);
        console.log(`  #${assignment.seed}: ${participant.playerName} ${rationale}`);
      });
    } catch (error) {
      console.error('Error generating automatic seeds:', error);
      throw error;
    }
  }

  /**
   * 🔧 [THOR] 복식 토너먼트 팀 기반 시드 생성
   * 파트너끼리 항상 같은 시드를 받도록 보장
   */
  private async generateDoublesTeamSeeds(
    tournamentId: string,
    seedingMethod: 'manual' | 'ranking' | 'rating' | 'random' | 'snake',
    tournament: Tournament,
    participants: TournamentParticipant[]
  ): Promise<void> {
    console.log('⚡ [THOR] Generating team-based seeds for doubles tournament');

    // Step 1: 팀 생성
    const teams = this.groupParticipantsIntoTeams(participants);
    console.log(`  📊 Total teams: ${teams.length}`);

    if (teams.length === 0) {
      throw new Error('No teams could be formed from participants');
    }

    // Step 2: 각 팀의 평균 능력치 계산 (시딩 기준)
    const userIds = participants.map(p => p.playerId);
    const userProfiles = await authService.getBatchUserProfiles(userIds);

    interface EnhancedTeam extends DoublesTeam {
      avgElo: number;
      avgSkillLevel: number;
      avgClubRanking: number;
      avgWinRate: number;
      registrationOrder: number;
    }

    const enhancedTeams: EnhancedTeam[] = teams.map((team, index) => {
      const player1Profile = userProfiles.find((up: any) => up.userId === team.player1.playerId);
      const player2Profile = userProfiles.find((up: any) => up.userId === team.player2.playerId);

      const p1Stats = ((player1Profile as any)?.profile as any)?.stats || {
        unifiedEloRating: 1200,
      };
      const p2Stats = ((player2Profile as any)?.profile as any)?.stats || {
        unifiedEloRating: 1200,
      };

      const p1ClubStats =
        ((player1Profile as any)?.profile as any)?.clubMemberships?.[tournament.clubId]
          ?.clubStats || null;
      const p2ClubStats =
        ((player2Profile as any)?.profile as any)?.clubMemberships?.[tournament.clubId]
          ?.clubStats || null;

      const p1SkillLevel =
        parseFloat(((player1Profile as any)?.profile as any)?.skillLevel?.selfAssessed || '3.0') ||
        3.0;
      const p2SkillLevel =
        parseFloat(((player2Profile as any)?.profile as any)?.skillLevel?.selfAssessed || '3.0') ||
        3.0;

      return {
        ...team,
        avgElo: (p1Stats.unifiedEloRating + p2Stats.unifiedEloRating) / 2,
        avgSkillLevel: (p1SkillLevel + p2SkillLevel) / 2,
        avgClubRanking: ((p1ClubStats?.clubRanking || 999) + (p2ClubStats?.clubRanking || 999)) / 2,
        avgWinRate: ((p1ClubStats?.winRate || 0) + (p2ClubStats?.winRate || 0)) / 2,
        registrationOrder: index, // ⭐ Official Tiebreaker: Store team registration order
      };
    });

    // Step 3: 시딩 방식에 따라 팀 정렬/섞기
    switch (seedingMethod) {
      case 'ranking':
        enhancedTeams.sort((a, b) => {
          if (Math.abs(a.avgClubRanking - b.avgClubRanking) > 0.5) {
            return a.avgClubRanking - b.avgClubRanking; // Lower rank = better
          }
          if (Math.abs(a.avgWinRate - b.avgWinRate) > 0.01) {
            return b.avgWinRate - a.avgWinRate; // Higher win rate = better
          }
          if (b.avgElo !== a.avgElo) {
            return b.avgElo - a.avgElo;
          }
          // ⭐ Official Tiebreaker: Registration Order
          return a.registrationOrder - b.registrationOrder;
        });
        console.log('  🏆 Teams sorted by club ranking');
        break;

      case 'rating':
        enhancedTeams.sort((a, b) => {
          if (Math.abs(a.avgElo - b.avgElo) > 10) {
            return b.avgElo - a.avgElo; // Higher ELO = better
          }
          if (b.avgSkillLevel !== a.avgSkillLevel) {
            return b.avgSkillLevel - a.avgSkillLevel;
          }
          // ⭐ Official Tiebreaker: Registration Order
          return a.registrationOrder - b.registrationOrder;
        });
        console.log('  ⚡ Teams sorted by ELO rating');
        break;

      case 'random':
        this.secureRandomShuffle(enhancedTeams);
        console.log('  🎲 Teams randomly shuffled');
        break;

      case 'snake': {
        // Snake draft: sort by combined skill, then apply snake pattern
        enhancedTeams.sort((a, b) => {
          const combinedA = a.avgElo / 400 + a.avgSkillLevel;
          const combinedB = b.avgElo / 400 + b.avgSkillLevel;
          if (combinedA !== combinedB) {
            return combinedB - combinedA;
          }
          // ⭐ Official Tiebreaker: Registration Order
          return a.registrationOrder - b.registrationOrder;
        });

        const snakeOrder: EnhancedTeam[] = [];
        const half = Math.ceil(enhancedTeams.length / 2);
        for (let i = 0; i < half; i++) {
          snakeOrder.push(enhancedTeams[i]);
          const pairedIndex = enhancedTeams.length - 1 - i;
          if (pairedIndex > i) {
            snakeOrder.push(enhancedTeams[pairedIndex]);
          }
        }
        enhancedTeams.splice(0, enhancedTeams.length, ...snakeOrder);
        console.log('  🐍 Teams arranged in snake pattern');
        break;
      }

      default:
        throw new Error(`Unsupported seeding method: ${seedingMethod}`);
    }

    // Step 4: 팀 시드 배정 + 두 파트너에게 같은 시드 적용 ⭐
    const seedAssignments: Array<{ playerId: string; seed: number }> = [];

    enhancedTeams.forEach((team, index) => {
      const teamSeed = index + 1;

      // 두 파트너 모두 같은 시드 적용!
      seedAssignments.push({ playerId: team.player1.playerId, seed: teamSeed });
      seedAssignments.push({ playerId: team.player2.playerId, seed: teamSeed });

      console.log(
        `  ✅ Team #${teamSeed}: ${team.teamName} (Avg ELO: ${team.avgElo.toFixed(0)}, Skill: ${team.avgSkillLevel.toFixed(1)})`
      );
    });

    // Step 5: 시드 저장
    await this.assignSeeds(tournamentId, seedAssignments);

    console.log(
      `✅ [THOR] Doubles team seeds generated successfully using ${seedingMethod} method`
    );
  }

  /**
   * Secure random shuffle using Fisher-Yates algorithm
   */
  private secureRandomShuffle<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      // Use crypto.getRandomValues for secure randomization if available
      const randomValue =
        typeof crypto !== 'undefined' && crypto.getRandomValues
          ? crypto.getRandomValues(new Uint32Array(1))[0] / (0xffffffff + 1)
          : Math.random();

      const j = Math.floor(randomValue * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * Get human-readable seeding rationale for logging
   */
  private getSeedingRationale(
    participant: Record<string, unknown>,
    method: 'manual' | 'ranking' | 'rating' | 'random' | 'snake'
  ): string {
    switch (method) {
      case 'ranking': {
        const clubRank = (participant.clubStats as any)?.clubRanking;
        const winRate = (participant.clubStats as any)?.winRate;
        return clubRank
          ? `(Club Rank: #${clubRank}, Win Rate: ${(winRate * 100).toFixed(1)}%)`
          : `(ELO: ${(participant.stats as any)?.unifiedEloRating || 1200})`;
      }

      case 'rating': {
        const elo = (participant.stats as any)?.unifiedEloRating || 1200;
        const confidence = (participant.skillLevel as any)?.confidence;
        return confidence
          ? `(ELO: ${elo}, Confidence: ${(confidence * 100).toFixed(1)}%)`
          : `(ELO: ${elo})`;
      }

      case 'random':
        return '(Random)';

      case 'snake': {
        const combinedSkill =
          ((participant.stats as any)?.unifiedEloRating || 1200) / 400 +
          (parseFloat((participant.skillLevel as any)?.selfAssessed) || 3.0);
        return `(Combined Skill: ${combinedSkill.toFixed(2)})`;
      }

      default:
        return '';
    }
  }

  /**
   * Enhanced 시드 검증 (Enhanced validation for all seeding methods)
   */
  private validateSeeds(tournament: Tournament): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const participants = tournament.participants;
    const seedAssignments = participants.filter(p => p.seed !== undefined);

    // Basic validation for all seeding methods
    if (participants.length < 2) {
      errors.push('Tournament must have at least 2 participants');
      return { isValid: false, errors, warnings };
    }

    // Manual seeding specific validation
    if (tournament.settings.seedingMethod === 'manual') {
      // 🎾 Team-aware validation for doubles tournaments
      const isDoubles = getMatchFormatFromTournamentEventType(tournament.eventType) === 'doubles';

      // 모든 참가자에게 시드가 배정되었는지 확인
      if (seedAssignments.length !== participants.length) {
        errors.push(
          `All participants must have seeds assigned for manual seeding. Missing: ${participants.length - seedAssignments.length} participants`
        );
      }

      // 시드 번호가 1부터 연속적으로 배정되었는지 확인
      const assignedSeeds = seedAssignments.map(p => p.seed!).sort((a, b) => a - b);

      if (isDoubles) {
        // 🎾 DOUBLES: Validate seeds per TEAM (not per participant)
        const expectedTeamCount = Math.floor(participants.length / 2);
        const uniqueSeeds = new Set(assignedSeeds);

        console.log('🎾 [VALIDATOR] Doubles tournament seed validation:', {
          participants: participants.length,
          expectedTeams: expectedTeamCount,
          uniqueSeeds: Array.from(uniqueSeeds).sort((a, b) => a - b),
          allSeeds: assignedSeeds,
        });

        // Check that we have exactly expectedTeamCount unique seeds
        if (uniqueSeeds.size !== expectedTeamCount) {
          errors.push(
            `Doubles tournament must have ${expectedTeamCount} unique team seeds. Found: ${uniqueSeeds.size}`
          );
        }

        // Check that seeds are consecutive from 1 to expectedTeamCount
        const uniqueSeedsArray = Array.from(uniqueSeeds).sort((a, b) => a - b);
        for (let i = 0; i < uniqueSeedsArray.length; i++) {
          if (uniqueSeedsArray[i] !== i + 1) {
            errors.push(
              `Team seeds must be consecutive from 1 to ${expectedTeamCount}. Missing seed: ${i + 1}`
            );
            break;
          }
        }

        // ✅ Verify that partners share the same seed (this is CORRECT, not an error!)
        const partnerPairs = new Map<string, string[]>();
        participants.forEach(p => {
          if (p.partnerId && p.seed !== undefined) {
            const pairKey = [p.playerId, p.partnerId].sort().join('_');
            if (!partnerPairs.has(pairKey)) {
              partnerPairs.set(pairKey, []);
            }
            partnerPairs.get(pairKey)!.push(`${p.playerName}:${p.seed}`);
          }
        });

        // Verify each partner pair has matching seeds
        partnerPairs.forEach((seedInfo, pairKey) => {
          const seeds = seedInfo.map(info => parseInt(info.split(':')[1]));
          if (seeds.length === 2 && seeds[0] !== seeds[1]) {
            errors.push(
              `Partner pair ${pairKey} has mismatched seeds: ${seeds[0]} and ${seeds[1]}`
            );
          }
        });
      } else {
        // 🎾 SINGLES: Validate seeds per PARTICIPANT (original logic)
        for (let i = 0; i < assignedSeeds.length; i++) {
          if (assignedSeeds[i] !== i + 1) {
            errors.push(
              `Seeds must be assigned consecutively from 1 to ${participants.length}. Missing seed: ${i + 1}`
            );
            break;
          }
        }

        // 중복 시드 검사 (singles only - duplicates are errors)
        const uniqueSeeds = new Set(assignedSeeds);
        if (uniqueSeeds.size !== assignedSeeds.length) {
          errors.push('Duplicate seed assignments found');
        }
      }

      // 시드 배정 완성도 체크
      if (seedAssignments.length > 0 && seedAssignments.length < participants.length) {
        warnings.push(
          `Only ${seedAssignments.length} of ${participants.length} participants have seeds assigned`
        );
      }
    }

    // Automatic seeding data quality validation
    if (tournament.settings.seedingMethod !== 'manual') {
      let dataQualityScore = 0;
      let maxPossibleScore = 0;

      participants.forEach(participant => {
        maxPossibleScore += 3; // 3 points possible per participant

        // Check skill level data quality
        const skillLevel = parseFloat(participant.skillLevel) || 0;
        if (skillLevel > 0 && skillLevel <= 7.0) {
          dataQualityScore += 1;
        }

        // Estimate user profile completeness (this is a heuristic)
        if (participant.playerName && participant.playerName !== 'Unknown Player') {
          dataQualityScore += 1;
        }

        // Registration recency (newer registrations might have better data)
        if (participant.registeredAt) {
          const daysSinceRegistration =
            (Date.now() - participant.registeredAt.toMillis()) / (1000 * 60 * 60 * 24);
          if (daysSinceRegistration < 30) {
            // Recent registration
            dataQualityScore += 1;
          }
        }
      });

      const qualityPercentage =
        maxPossibleScore > 0 ? (dataQualityScore / maxPossibleScore) * 100 : 0;

      if (qualityPercentage < 50) {
        warnings.push(
          `Low data quality (${qualityPercentage.toFixed(1)}%) may affect seeding accuracy. Consider manual seeding.`
        );
      } else if (qualityPercentage < 75) {
        warnings.push(
          `Moderate data quality (${qualityPercentage.toFixed(1)}%). Seeding may be suboptimal.`
        );
      }

      // Method-specific warnings
      if (tournament.settings.seedingMethod === 'ranking') {
        const participantsWithoutClubData = participants.filter(
          p => !p.skillLevel || parseFloat(p.skillLevel) === 0
        );
        if (participantsWithoutClubData.length > 0) {
          warnings.push(
            `${participantsWithoutClubData.length} participants missing club ranking data. Will fall back to ELO ratings.`
          );
        }
      }

      if (tournament.settings.seedingMethod === 'rating') {
        const assumedDefaultRatings = participants.filter(
          p => !p.skillLevel || parseFloat(p.skillLevel) === 3.0
        );
        if (assumedDefaultRatings.length > participants.length / 2) {
          warnings.push(
            `Over half of participants have default/unknown ratings. Consider ranking-based seeding instead.`
          );
        }
      }
    }

    // Tournament format compatibility check
    if (tournament.format === 'single_elimination' || tournament.format === 'double_elimination') {
      const isPowerOfTwo = (participants.length & (participants.length - 1)) === 0;
      if (!isPowerOfTwo) {
        const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(participants.length)));
        warnings.push(
          `${participants.length} participants will require ${nextPowerOfTwo - participants.length} BYEs for ${tournament.format} format`
        );
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Enhanced seeding error handling with recovery suggestions
   */
  private handleSeedingError(error: Error, tournament: Tournament): Error {
    const method = tournament.settings.seedingMethod;
    const participantCount = tournament.participants.length;

    let enhancedMessage = `Seeding failed (${method}): ${error.message}`;
    const suggestions: string[] = [];

    // Add context-specific suggestions
    if (error.message.includes('User profile not found') || error.message.includes('batch fetch')) {
      suggestions.push('Some participant profiles are missing. Try manual seeding instead.');
      suggestions.push(
        'Check if all participants have properly set up their Lightning Tennis profiles.'
      );
    }

    if (error.message.includes('clubRanking') || error.message.includes('clubStats')) {
      suggestions.push('Club ranking data unavailable. Consider using ELO rating-based seeding.');
      suggestions.push('Ensure club members have played matches to establish rankings.');
    }

    if (method === 'ranking' && participantCount < 4) {
      suggestions.push(
        'Club ranking works best with 4+ participants. Consider random seeding for smaller tournaments.'
      );
    }

    if (method === 'rating' && participantCount > 16) {
      suggestions.push(
        'Large tournaments may benefit from club ranking-based seeding for local context.'
      );
    }

    // Append suggestions to error message
    if (suggestions.length > 0) {
      enhancedMessage += '\n\nSuggestions:\n' + suggestions.map(s => `• ${s}`).join('\n');
    }

    return new Error(enhancedMessage);
  }

  /**
   * 🎮 MANUAL ROUND GENERATOR
   *
   * Allows administrators to manually generate the next round when automatic
   * advancement fails or needs manual intervention. Acts as a safety net.
   */
  /**
   * 🌉 [HEIMDALL] Phase 5.4: Generate Next Round via Cloud Function
   * Migrated from client-side to server-side for security
   */
  async generateNextRoundManually(tournamentId: string): Promise<void> {
    try {
      console.log('🎮 [GENERATE_NEXT_ROUND] Calling Cloud Function:', tournamentId);

      const generateNextRoundFn = httpsCallable(functions, 'generateNextRound');
      const result = await generateNextRoundFn({ tournamentId });

      console.log('✅ [GENERATE_NEXT_ROUND] Next round generated successfully:', result.data);
    } catch (error) {
      console.error('❌ [GENERATE_NEXT_ROUND] Error generating next round:', error);
      throw error;
    }
  }

  /**
   * 🎯 MANUAL MATCHUP CREATOR
   *
   * Creates matchups for manually generated rounds
   */
  private createManualNextRoundMatchups(
    tournamentId: string,
    winners: Array<{ playerId: string; playerName: string; seed?: number; fromMatchId: string }>,
    roundNumber: number,
    existingMatches: BracketMatch[]
  ): BracketMatch[] {
    const nextRoundMatches: BracketMatch[] = [];
    const now = Timestamp.now();

    // Calculate number of matches needed for next round
    const numMatches = Math.floor(winners.length / 2);

    console.log(
      `🎯 [Manual Matchups] Creating ${numMatches} matches for round ${roundNumber} from ${winners.length} winners`
    );

    // Pair winners for next round matches
    for (let i = 0; i < numMatches; i++) {
      const player1 = winners[i * 2];
      const player2 = winners[i * 2 + 1];

      if (!player1 || !player2) {
        console.warn(
          `⚠️ [Manual Matchups] Insufficient players for match ${i + 1} in round ${roundNumber}`
        );
        continue;
      }

      // Generate match ID
      const matchId = `${tournamentId}_manual_round${roundNumber}_match${i + 1}`;

      // Calculate bracket position
      const maxBracketPosition = Math.max(...existingMatches.map(m => m.bracketPosition), 0);
      const bracketPosition = maxBracketPosition + i + 1;

      const match: BracketMatch = {
        id: matchId,
        tournamentId,
        roundNumber,
        matchNumber: i + 1,
        bracketPosition,
        status: 'scheduled',
        player1: {
          playerId: player1.playerId,
          playerName: player1.playerName,
          seed: player1.seed,
          status: 'filled' as BracketPositionStatus,
        },
        player2: {
          playerId: player2.playerId,
          playerName: player2.playerName,
          seed: player2.seed,
          status: 'filled' as BracketPositionStatus,
        },
        createdAt: now,
        updatedAt: now,
      };

      console.log(
        `🆚 [Manual Matchups] Match ${i + 1}: ${player1.playerName} vs ${player2.playerName}`
      );
      nextRoundMatches.push(match);
    }

    return nextRoundMatches;
  }

  /**
   * 🔍 ROUND STATUS CHECKER
   *
   * Checks if a round can be manually advanced
   */
  async canGenerateNextRound(tournamentId: string): Promise<{
    canGenerate: boolean;
    reason?: string;
    currentRound?: number;
    nextRound?: number;
  }> {
    try {
      const tournament = await this.getTournament(tournamentId);
      if (!tournament) {
        return { canGenerate: false, reason: 'Tournament not found' };
      }

      if (tournament.status !== 'in_progress') {
        return { canGenerate: false, reason: 'Tournament must be in progress' };
      }

      const allMatches = await this.getTournamentMatches(tournamentId);
      const currentRound = Math.max(...allMatches.map(m => m.roundNumber));

      // Check if current round is complete
      const roundMatches = allMatches.filter(m => m.roundNumber === currentRound);
      const completedMatches = roundMatches.filter(m => (m.status as any) === 'completed');

      if (completedMatches.length !== roundMatches.length) {
        return {
          canGenerate: false,
          reason: `Current round ${currentRound} incomplete (${completedMatches.length}/${roundMatches.length})`,
          currentRound,
        };
      }

      // Check if this is the final round
      if (currentRound >= tournament.totalRounds) {
        // 🤖 AUTO-STATUS UPDATE: Tournament reached final round with all matches complete
        // Automatically update status to 'completed' to maintain data consistency
        if (tournament.status === 'in_progress') {
          console.log('🏆 [AUTO-COMPLETE] Tournament reached final round, auto-updating status:', {
            tournamentId,
            currentRound,
            totalRounds: tournament.totalRounds,
            completedMatches: completedMatches.length,
            totalMatches: roundMatches.length,
          });

          try {
            const tournamentRef = doc(db, 'tournaments', tournamentId);
            await updateDoc(tournamentRef, {
              status: 'completed',
              updatedAt: serverTimestamp(),
            });
            console.log('✅ [AUTO-COMPLETE] Tournament status auto-updated to completed');
          } catch (error) {
            console.error('❌ [AUTO-COMPLETE] Failed to auto-update tournament status:', error);
          }
        }

        return {
          canGenerate: false,
          reason: 'Tournament is already complete',
          currentRound,
        };
      }

      // Check if next round already exists
      const nextRoundMatches = allMatches.filter(m => m.roundNumber === currentRound + 1);
      if (nextRoundMatches.length > 0) {
        return {
          canGenerate: false,
          reason: `Next round ${currentRound + 1} already exists`,
          currentRound,
        };
      }

      return {
        canGenerate: true,
        currentRound,
        nextRound: currentRound + 1,
      };
    } catch (error) {
      console.error('Error checking round status:', error);
      return { canGenerate: false, reason: (error as Error).message };
    }
  }

  /**
   * 🚀 GPS 내비게이션 엔진: 동적 경로 계산 시스템
   * 토너먼트 브래킷의 수학적 규칙에 따라 다음 매치 목적지를 계산합니다.
   * 이 함수는 어떤 크기의 토너먼트든 처리할 수 있는 범용 알고리즘입니다.
   */
  private calculateNextMatchDynamically(
    currentMatch: BracketMatch,
    bracket: BracketRound[]
  ): { matchId: string; position: 'player1' | 'player2' } | null {
    const currentRound = currentMatch.roundNumber;
    const currentMatchInRound = currentMatch.matchNumber;
    const totalRounds = bracket.length;

    console.log('🗺️ [GPS ENGINE] Calculating route for:', {
      matchId: currentMatch.id,
      roundNumber: currentRound,
      matchNumber: currentMatchInRound,
      totalRounds,
    });

    // 결승전이면 다음 매치 없음
    if (currentRound >= totalRounds) {
      console.log('🏆 [GPS] Final match detected - no next destination');
      return null;
    }

    // 🧮 수학적 계산 공식 적용
    const nextRoundIndex = currentRound; // bracket array는 0-based: 라운드2는 index[1]

    // 🏆 특별 케이스 감지: 부전승이 포함된 토너먼트
    const currentRoundMatches = bracket[currentRound - 1]?.matches.length || 0;
    const nextRoundMatches = bracket[currentRound]?.matches.length || 0;

    // 🔍 개선된 BYE 구조 감지: Round 2에 BYE players가 있는지 확인
    const nextRound = bracket[currentRound];
    const byePlayerCount =
      nextRound?.matches.filter(
        match => (match.player1 && !match.player2) || (!match.player1 && match.player2)
      ).length || 0;

    const hasByeStructure = byePlayerCount > 0;

    console.log('🔍 [GPS BYE DETECTION]:', {
      currentRound,
      currentRoundMatches,
      nextRoundMatches,
      byePlayerCount,
      hasByeStructure,
      detectionMethod: byePlayerCount > 0 ? 'BYE_PLAYERS_FOUND' : 'STANDARD_TOURNAMENT',
    });

    let nextMatchNumber: number;
    let nextPosition: 'player1' | 'player2';

    if (hasByeStructure && currentRound === 1) {
      // 🎯 부전승 토너먼트 (5인, 6인, 7인, 9인, 10인, 11인 등): Round 1 매치 분류
      const byeVsWinnerMatches = Math.min(currentRoundMatches, byePlayerCount);

      if (currentMatchInRound <= byeVsWinnerMatches) {
        // ✅ BYE player와 짝지어지는 매치 → 직접 매핑
        nextMatchNumber = currentMatchInRound; // 1→1, 2→2
        nextPosition = 'player2'; // BYE player는 player1에 배치됨
        console.log(
          `🏆 [BYE DIRECT] R1M${currentMatchInRound} → R2M${nextMatchNumber}.${nextPosition} (vs BYE player)`
        );
      } else {
        // ✅ 남은 R1 matches끼리 짝지어짐 → 표준 공식 적용
        const remainingIndex = currentMatchInRound - byeVsWinnerMatches;
        nextMatchNumber = byeVsWinnerMatches + Math.ceil(remainingIndex / 2);
        nextPosition = remainingIndex % 2 === 1 ? 'player1' : 'player2';
        console.log(
          `🏆 [BYE PAIRING] R1M${currentMatchInRound} → R2M${nextMatchNumber}.${nextPosition} (remaining matches paired)`
        );
      }
    } else {
      // 🧮 일반 토너먼트: 표준 수학적 공식
      nextMatchNumber = Math.ceil(currentMatchInRound / 2);
      nextPosition = currentMatchInRound % 2 === 1 ? 'player1' : 'player2';
    }

    console.log('🧮 [GPS MATH]:', {
      currentRoundMatches,
      nextRoundMatches,
      hasByeStructure,
      calculation: hasByeStructure
        ? `Direct mapping: ${currentMatchInRound} → ${nextMatchNumber}`
        : `Math.ceil(${currentMatchInRound} / 2) = ${nextMatchNumber}`,
      position: nextPosition,
      currentRound,
      nextRoundIndex,
      explanation: `Round ${currentRound} → Round ${currentRound + 1} (index ${nextRoundIndex})`,
    });

    console.log('🔍 [GPS ROUTE CALCULATION]:', {
      inputMatch: {
        id: currentMatch.id,
        roundNumber: currentRound,
        matchNumber: currentMatchInRound,
      },
      calculatedDestination: {
        nextRoundIndex,
        nextMatchNumber,
        nextPosition,
      },
      routingStrategy:
        hasByeStructure && currentRound === 1 ? 'BYE_STRUCTURE_DIRECT' : 'STANDARD_TOURNAMENT',
    });

    // 다음 라운드에서 해당 매치 찾기
    if (nextRoundIndex >= bracket.length) {
      console.warn('⚠️ [GPS] Next round index out of bounds');
      return null;
    }

    // nextRound는 이미 Line 3366에서 선언됨
    console.log('🔍 [GPS SEARCH] Looking for next match:', {
      searchCriteria: {
        roundIndex: nextRoundIndex,
        matchNumber: nextMatchNumber,
      },
      availableMatches: nextRound.matches.map(m => ({
        id: m.id,
        matchNumber: m.matchNumber,
        currentPlayers: {
          player1: m.player1?.playerName || 'EMPTY',
          player2: m.player2?.playerName || 'EMPTY',
        },
      })),
    });

    const nextMatch = nextRound.matches.find(m => m.matchNumber === nextMatchNumber);

    if (!nextMatch) {
      console.error('❌ [GPS] CRITICAL ERROR: Next match not found!', {
        currentMatch: currentMatch.id,
        nextRoundIndex,
        nextMatchNumber,
        availableMatches: nextRound.matches.map(m => ({ id: m.id, matchNumber: m.matchNumber })),
        possibleCause: 'Match numbering mismatch or bracket structure issue',
      });
      return null;
    }

    console.log('✅ [GPS] Route calculated successfully:', {
      from: currentMatch.id,
      to: nextMatch.id,
      position: nextPosition,
      fullRoute: `${currentMatch.id} (R${currentRound}M${currentMatchInRound}) → ${nextMatch.id} (R${currentRound + 1}M${nextMatchNumber}) as ${nextPosition}`,
      nextMatchCurrentState: {
        player1: nextMatch.player1?.playerName || 'EMPTY',
        player2: nextMatch.player2?.playerName || 'EMPTY',
        status: nextMatch.status,
      },
    });

    return {
      matchId: nextMatch.id,
      position: nextPosition,
    };
  }

  /**
   * Perfect Bracket 매치 연결 설정 (GPS 엔진 기반)
   */
  private setupPerfectBracketConnections(matches: BracketMatch[], bracket: BracketRound[]): void {
    console.log('🚀 [GPS ENGINE] Setting up dynamic match connections...');

    // ✅ Ghost Match 필터링 (Round-based)
    const activeMatches = matches.filter(match => {
      // 🎯 라운드 1 이외의 경기는 선수가 나중에 채워질 수 있음
      if (match.roundNumber > 1) {
        console.log(
          `✅ [GPS] Including Round ${match.roundNumber} match: ${match.id} (players will be filled later)`
        );
        return true;
      }

      // 🚨 라운드 1만 Ghost Match 체크
      const isGhostMatch =
        (!match.player1 || (typeof match.player1 === 'string' && match.player1 === 'EMPTY')) &&
        (!match.player2 || (typeof match.player2 === 'string' && match.player2 === 'EMPTY'));

      if (isGhostMatch) {
        console.log('👻 [GPS FILTER] Skipping ghost match:', {
          matchId: match.id,
          matchNumber: match.matchNumber,
          roundNumber: match.roundNumber,
          reason: 'Round 1 structural empty slot (both players empty)',
        });
      }

      return !isGhostMatch;
    });

    console.log('📊 [GPS ENGINE] Match filtering:', {
      totalMatches: matches.length,
      activeMatches: activeMatches.length,
      ghostMatches: matches.length - activeMatches.length,
    });

    console.log('🎯 [TOURNAMENT ANALYSIS]', {
      totalMatches: activeMatches.length,
      totalRounds: bracket.length,
      roundBreakdown: bracket.map((round, idx) => ({
        round: idx + 1,
        matches: round.matches.length,
        matchIds: round.matches.map(m => m.id),
      })),
    });

    // 🚀 GPS 엔진으로 모든 매치의 다음 목적지 동적 계산
    activeMatches.forEach(match => {
      // 🎯 이미 설정된 연결은 보존 (6인 토너먼트 등의 수동 설정)
      if (match.nextMatch) {
        console.log(
          `🎯 [GPS PRESERVED] ${match.id} → ${match.nextMatch.matchId} (${match.nextMatch.position}) [Manual]`
        );
        return;
      }

      // GPS 엔진 호출하여 다음 매치 정보 계산
      const nextMatchInfo = this.calculateNextMatchDynamically(match, bracket);

      if (nextMatchInfo) {
        match.nextMatch = nextMatchInfo;
        console.log(
          `🗺️ [GPS ROUTE] ${match.id} → ${nextMatchInfo.matchId} (${nextMatchInfo.position}) [Auto]`
        );
      } else {
        match.nextMatch = undefined; // 결승전
        console.log(`🏆 [GPS FINAL] ${match.id} → CHAMPION!`);
      }
    });

    // 🔗 이전 매치 참조도 GPS 원리로 설정
    this.setupPreviousMatchReferences(activeMatches, bracket);

    console.log('✅ [GPS ENGINE] All connections established dynamically!');
  }

  /**
   * 🔗 이전 매치 참조 설정 (GPS 엔진 기반)
   * 각 매치가 어떤 이전 매치들로부터 선수를 받는지 동적으로 계산
   */
  private setupPreviousMatchReferences(matches: BracketMatch[], bracket: BracketRound[]): void {
    console.log('🔗 [GPS] Setting up previous match references...');

    matches.forEach(match => {
      // 첫 번째 라운드는 이전 매치가 없음
      if (match.roundNumber === 1) {
        return;
      }

      const currentRound = match.roundNumber;
      const currentMatchInRound = match.matchNumber;

      // 🧮 수학적 계산으로 이전 매치들 찾기
      // 이전 라운드에서 이 매치로 오는 두 매치 계산
      const prevMatch1Number = (currentMatchInRound - 1) * 2 + 1; // 홀수 매치
      const prevMatch2Number = (currentMatchInRound - 1) * 2 + 2; // 짝수 매치

      const previousRound = bracket[currentRound - 2]; // 0-based index

      if (previousRound) {
        const prevMatch1 = previousRound.matches.find(m => m.matchNumber === prevMatch1Number);
        const prevMatch2 = previousRound.matches.find(m => m.matchNumber === prevMatch2Number);

        if (prevMatch1) {
          match.previousMatch1 = {
            matchId: prevMatch1.id,
            type: '_winner',
          };
          console.log(`🔗 [GPS PREV] ${match.id} ← ${prevMatch1.id} (player1)`);
        }

        if (prevMatch2) {
          match.previousMatch2 = {
            matchId: prevMatch2.id,
            type: '_winner',
          };
          console.log(`🔗 [GPS PREV] ${match.id} ← ${prevMatch2.id} (player2)`);
        }
      }
    });

    console.log('✅ [GPS] Previous match references established!');
  }

  // =========================================================
  // 🏆 THOR'S RANKING ENGINE - Hall of Fame 계산 시스템
  // =========================================================

  /**
   * 🏆 토너먼트 랭킹 계산 (Async Overload)
   *
   * tournamentId로 토너먼트 데이터를 가져와서 랭킹을 계산합니다.
   * Final match 완료 시 호출됩니다.
   *
   * @param tournamentId - 토너먼트 ID
   * @returns 정렬된 랭킹 통계 배열
   */
  async calculateRankings(tournamentId: string): Promise<
    Array<{
      participant: TournamentParticipant;
      rank: number;
      wins: number;
      losses: number;
      setsWon: number;
      setsLost: number;
      setDifference: number;
      gamesWon: number;
      gamesLost: number;
      gameDifference: number;
      winRate: number;
    }>
  > {
    // Fetch tournament data
    const tournament = await this.getTournament(tournamentId);
    if (!tournament) {
      throw new Error(`Tournament ${tournamentId} not found`);
    }

    // Fetch all matches
    const matches = await this.getTournamentMatches(tournamentId);

    // Call synchronous version with fetched data
    return this.calculateRankingsSync(tournament.participants, matches, tournament.eventType);
  }

  /**
   * 🔥 토너먼트 랭킹 계산 엔진 (Thor's Forge of Olympus)
   *
   * 참가자들의 토너먼트 성적을 기반으로 순위를 계산합니다.
   *
   * 랭킹 기준 (우선순위):
   * 1. 승수 (Wins) - 많을수록 높은 순위
   * 2. 세트 차이 (Set Difference) - (획득 세트 - 잃은 세트), 높을수록 좋음
   * 3. 게임 차이 (Game Difference) - (획득 게임 - 잃은 게임), 높을수록 좋음
   * 4. 시드 번호 (Seed) - 낮을수록 높은 순위 (동점일 때만)
   *
   * @param participants - 토너먼트 참가자 목록
   * @param matches - 토너먼트 매치 목록 (완료된 매치들)
   * @returns 정렬된 랭킹 통계 배열
   */
  calculateRankingsSync(
    participants: TournamentParticipant[],
    matches: BracketMatch[],
    eventType?: TennisEventType
  ): Array<{
    participant: TournamentParticipant;
    rank: number;
    wins: number;
    losses: number;
    setsWon: number;
    setsLost: number;
    setDifference: number;
    gamesWon: number;
    gamesLost: number;
    gameDifference: number;
    winRate: number;
  }> {
    console.log('⚡ [THOR] Initiating ranking calculation engine...', {
      participantCount: participants.length,
      totalMatches: matches.length,
      completedMatches: matches.filter(m => m.status === 'completed').length,
      eventType,
    });

    // 🎾 Detect if this is a doubles tournament
    const isDoubles = eventType
      ? getMatchFormatFromTournamentEventType(eventType) === 'doubles'
      : false;

    console.log('⚡ [THOR] Tournament format detected:', {
      isDoubles,
      format: isDoubles ? 'Team-based (Doubles)' : 'Individual (Singles)',
    });

    // 각 참가자별 통계 초기화
    const playerStats: Record<
      string,
      {
        participant: TournamentParticipant;
        wins: number;
        losses: number;
        setsWon: number;
        setsLost: number;
        gamesWon: number;
        gamesLost: number;
      }
    > = {};

    // 참가자 초기화
    if (isDoubles) {
      // 🎾 DOUBLES: Initialize with TEAM IDs (user1_user2 format)
      const teams = this.groupParticipantsIntoTeams(participants);
      console.log('⚡ [THOR] Initializing stats for DOUBLES teams:', {
        teamCount: teams.length,
        teams: teams.map(t => ({ teamId: t.teamId, teamName: t.teamName })),
      });

      teams.forEach(team => {
        playerStats[team.teamId] = {
          participant: {
            id: team.teamId,
            tournamentId: '',
            playerId: team.teamId,
            playerName: team.teamName || `${team.player1.playerName} / ${team.player2.playerName}`,
            playerGender: 'male' as const,
            skillLevel: '',
            seed: team.seed,
            status: 'confirmed',
            partnerId: undefined,
            registeredAt: Timestamp.now(),
            matchesPlayed: 0,
            matchesWon: 0,
            setsWon: 0,
            setsLost: 0,
            gamesWon: 0,
            gamesLost: 0,
          },
          wins: 0,
          losses: 0,
          setsWon: 0,
          setsLost: 0,
          gamesWon: 0,
          gamesLost: 0,
        };
      });
    } else {
      // 🎾 SINGLES: Initialize with individual player IDs
      console.log('⚡ [THOR] Initializing stats for SINGLES players:', {
        playerCount: participants.length,
      });

      participants.forEach(participant => {
        playerStats[participant.playerId] = {
          participant,
          wins: 0,
          losses: 0,
          setsWon: 0,
          setsLost: 0,
          gamesWon: 0,
          gamesLost: 0,
        };
      });
    }

    // 🔍 완료된 매치들을 분석하여 통계 계산
    const completedMatches = matches.filter(
      match => match.status === 'completed' && match.player1 && match.player2 && match._winner
    );

    console.log('⚡ [THOR] Processing completed matches for statistics...', {
      completedMatchCount: completedMatches.length,
      initializedTeams: Object.keys(playerStats),
      completedMatchIds: completedMatches.map(m => m.id),
    });

    completedMatches.forEach(match => {
      const player1Id = match.player1!.playerId;
      const player2Id = match.player2!.playerId;
      const winnerId = match._winner!;

      console.log('⚡ [THOR] Processing match for win/loss update:', {
        matchId: match.id,
        player1Id,
        player2Id,
        winnerId,
        player1Exists: !!playerStats[player1Id],
        player2Exists: !!playerStats[player2Id],
        winnerMatches:
          winnerId === player1Id ? 'player1' : winnerId === player2Id ? 'player2' : 'NO MATCH!',
      });

      // 승부 기록 업데이트
      if (winnerId === player1Id) {
        if (playerStats[player1Id]) {
          playerStats[player1Id].wins++;
        } else {
          console.error('❌ [THOR] playerStats missing for player1:', player1Id);
        }
        if (playerStats[player2Id]) {
          playerStats[player2Id].losses++;
        } else {
          console.error('❌ [THOR] playerStats missing for player2:', player2Id);
        }
      } else if (winnerId === player2Id) {
        if (playerStats[player2Id]) {
          playerStats[player2Id].wins++;
        } else {
          console.error('❌ [THOR] playerStats missing for player2:', player2Id);
        }
        if (playerStats[player1Id]) {
          playerStats[player1Id].losses++;
        } else {
          console.error('❌ [THOR] playerStats missing for player1:', player1Id);
        }
      } else {
        console.warn('⚠️ [THOR] Winner ID does not match either player!', {
          winnerId,
          player1Id,
          player2Id,
        });
      }

      // 세트/게임 통계 계산 (score 필드에서 추출)
      // score는 문자열("6-4, 3-6") 또는 객체({ sets: [...], finalScore: "..." }) 형태일 수 있음
      const scoreData = match.score;
      let scoreString: string | undefined;

      if (typeof scoreData === 'string') {
        // score가 직접 문자열인 경우
        scoreString = scoreData;
      } else if (scoreData && typeof scoreData === 'object') {
        // score가 객체인 경우
        if (scoreData.sets && Array.isArray(scoreData.sets) && scoreData.sets.length > 0) {
          // sets 배열이 있으면 그것을 사용
          let player1Sets = 0;
          let player2Sets = 0;
          let player1Games = 0;
          let player2Games = 0;

          scoreData.sets.forEach(set => {
            const p1Games = set.player1Games || 0;
            const p2Games = set.player2Games || 0;

            player1Games += p1Games;
            player2Games += p2Games;

            if (p1Games > p2Games) player1Sets++;
            else if (p2Games > p1Games) player2Sets++;
          });

          // 통계 업데이트
          if (playerStats[player1Id]) {
            playerStats[player1Id].setsWon += player1Sets;
            playerStats[player1Id].setsLost += player2Sets;
            playerStats[player1Id].gamesWon += player1Games;
            playerStats[player1Id].gamesLost += player2Games;
          }
          if (playerStats[player2Id]) {
            playerStats[player2Id].setsWon += player2Sets;
            playerStats[player2Id].setsLost += player1Sets;
            playerStats[player2Id].gamesWon += player2Games;
            playerStats[player2Id].gamesLost += player1Games;
          }

          console.log('⚡ [THOR] Match stats from sets array:', {
            matchId: match.id,
            sets: `${player1Sets}-${player2Sets}`,
            games: `${player1Games}-${player2Games}`,
          });
        } else if (scoreData.finalScore && typeof scoreData.finalScore === 'string') {
          scoreString = scoreData.finalScore;
        }
      }

      // 문자열 형태의 점수 파싱 ("6-4, 3-6, 6-2")
      if (scoreString) {
        let player1Sets = 0;
        let player2Sets = 0;
        let player1Games = 0;
        let player2Games = 0;

        const setScores = scoreString.split(',').map(s => s.trim());
        setScores.forEach(setScore => {
          const parts = setScore.split('-').map(s => parseInt(s.trim(), 10));
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            const p1Games = parts[0];
            const p2Games = parts[1];
            player1Games += p1Games;
            player2Games += p2Games;
            if (p1Games > p2Games) player1Sets++;
            else if (p2Games > p1Games) player2Sets++;
          }
        });

        // 통계 업데이트
        if (playerStats[player1Id]) {
          playerStats[player1Id].setsWon += player1Sets;
          playerStats[player1Id].setsLost += player2Sets;
          playerStats[player1Id].gamesWon += player1Games;
          playerStats[player1Id].gamesLost += player2Games;
        }

        if (playerStats[player2Id]) {
          playerStats[player2Id].setsWon += player2Sets;
          playerStats[player2Id].setsLost += player1Sets;
          playerStats[player2Id].gamesWon += player2Games;
          playerStats[player2Id].gamesLost += player1Games;
        }

        console.log('⚡ [THOR] Match stats processed:', {
          matchId: match.id,
          player1: match.player1?.playerName,
          player2: match.player2?.playerName,
          winner: winnerId === player1Id ? match.player1?.playerName : match.player2?.playerName,
          sets: `${player1Sets}-${player2Sets}`,
          games: `${player1Games}-${player2Games}`,
        });
      }
    });

    // 📊 랭킹 계산 및 정렬
    const rankings = Object.values(playerStats).map(stats => {
      const setDifference = stats.setsWon - stats.setsLost;
      const gameDifference = stats.gamesWon - stats.gamesLost;
      const totalMatches = stats.wins + stats.losses;
      const winRate = totalMatches > 0 ? (stats.wins / totalMatches) * 100 : 0;

      return {
        participant: stats.participant,
        rank: 0, // 정렬 후 설정
        wins: stats.wins,
        losses: stats.losses,
        setsWon: stats.setsWon,
        setsLost: stats.setsLost,
        setDifference,
        gamesWon: stats.gamesWon,
        gamesLost: stats.gamesLost,
        gameDifference,
        winRate,
      };
    });

    // 🎯 랭킹 정렬 로직 (Thor's Ranking Algorithm)
    rankings.sort((a, b) => {
      // 1순위: 승수 (많을수록 좋음)
      if (a.wins !== b.wins) {
        return b.wins - a.wins;
      }

      // 2순위: 세트 차이 (높을수록 좋음)
      if (a.setDifference !== b.setDifference) {
        return b.setDifference - a.setDifference;
      }

      // 3순위: 게임 차이 (높을수록 좋음)
      if (a.gameDifference !== b.gameDifference) {
        return b.gameDifference - a.gameDifference;
      }

      // 4순위: 시드 번호 (낮을수록 좋음, 동점일 때만)
      const seedA = a.participant.seed || 999;
      const seedB = b.participant.seed || 999;
      return seedA - seedB;
    });

    // 순위 번호 할당
    rankings.forEach((ranking, index) => {
      ranking.rank = index + 1;
    });

    console.log('✅ [THOR] Ranking calculation completed!', {
      totalParticipants: rankings.length,
      topThree: rankings.slice(0, 3).map(r => ({
        rank: r.rank,
        name: r.participant.playerName,
        wins: r.wins,
        losses: r.losses,
        setDiff: r.setDifference,
        gameDiff: r.gameDifference,
      })),
    });

    return rankings;
  }

  // =========================================================
  // 🔥 THOR 2.0 - 클럽 랭킹 시스템 (헌장 v1.4 분리된 랭킹)
  // =========================================================

  /**
   * 🏆 클럽 랭킹 포인트 계산 (Thor 2.0 Algorithm)
   *
   * 토너먼트 성과를 기반으로 클럽 내 랭킹 포인트를 계산합니다.
   *
   * 포인트 산정 기준:
   * - 우승: 100점
   * - 준우승: 50점
   * - 준결승: 25점
   * - 참가: 5점
   * - 경기 승리: 3점/승
   *
   * @param tournamentStats - 토너먼트 통계
   * @returns 클럽 랭킹 포인트
   */
  private calculateClubRankingPoints(tournamentStats: {
    participations: number;
    wins: number;
    runnerUps: number;
    semiFinals: number;
    tournamentWins: number;
  }): number {
    const points =
      tournamentStats.wins * 100 + // 우승: 100점
      tournamentStats.runnerUps * 50 + // 준우승: 50점
      tournamentStats.semiFinals * 25 + // 준결승: 25점
      tournamentStats.participations * 5 + // 참가: 5점
      tournamentStats.tournamentWins * 3; // 승리: 3점

    console.log('🏆 [THOR 2.0] Club ranking points calculated:', {
      tournamentStats,
      totalPoints: points,
    });

    return points;
  }

  /**
   * 🔥 토너먼트 완료 후 클럽 랭킹 업데이트 (Thor 2.0 Core)
   *
   * 헌장 v1.4 "분리된 랭킹 시스템" 구현:
   * - 토너먼트 결과 → 클럽 랭킹만 업데이트
   * - 전체 ELO 랭킹은 영향 없음 (상호 불간섭 원칙)
   *
   * 처리 흐름:
   * 1. 토너먼트 참가자들의 최종 순위 확정
   * 2. 각 참가자의 clubMembership/clubStats 업데이트
   * 3. 클럽 전체 랭킹 재계산
   *
   * @param tournamentId - 토너먼트 ID
   * @param clubId - 클럽 ID
   */
  async updateClubRankingsAfterTournament(tournamentId: string, clubId: string): Promise<void> {
    console.log('⚡ [THOR 2.0] Initiating club ranking update...', {
      tournamentId,
      clubId,
    });

    try {
      // 1. 토너먼트 및 매치 데이터 로드
      const tournament = await this.getTournament(tournamentId);
      if (!tournament) {
        throw new Error(`Tournament ${tournamentId} not found`);
      }

      const matches = await this.getTournamentMatches(tournamentId);

      // 2. Thor의 랭킹 계산 엔진으로 최종 순위 확정
      const rankings = this.calculateRankingsSync(tournament.participants, matches);

      console.log('⚡ [THOR 2.0] Rankings calculated, updating club memberships...', {
        participantCount: rankings.length,
      });

      // 3. 각 참가자별 clubMembership 업데이트
      const batch = writeBatch(db);

      for (const ranking of rankings) {
        const participant = ranking.participant;
        const finalRank = ranking.rank;

        // clubMembership 문서 참조
        const clubMembershipRef = doc(db, 'users', participant.playerId, 'clubMemberships', clubId);

        // 기존 데이터 로드
        const membershipDoc = await getDoc(clubMembershipRef);

        if (!membershipDoc.exists()) {
          console.warn(
            `⚠️ [THOR 2.0] Club membership not found for player ${participant.playerName}`
          );
          continue;
        }

        const membershipData = membershipDoc.data();
        const currentStats = membershipData.clubStats || {};
        const currentTournamentStats = currentStats.tournamentStats || {
          participations: 0,
          wins: 0,
          runnerUps: 0,
          semiFinals: 0,
          bestFinish: 999,
          totalMatches: 0,
          tournamentWins: 0,
          tournamentLosses: 0,
          tournamentWinRate: 0,
        };

        // 🏆 토너먼트 통계 업데이트 (토너먼트 결과만)
        // ⚠️ tournamentWins/Losses/totalMatches는 Cloud Function이 실시간 관리
        const newTournamentStats = {
          participations: currentTournamentStats.participations + 1,
          wins: currentTournamentStats.wins + (finalRank === 1 ? 1 : 0),
          runnerUps: currentTournamentStats.runnerUps + (finalRank === 2 ? 1 : 0),
          semiFinals: currentTournamentStats.semiFinals + (finalRank <= 4 ? 1 : 0),
          bestFinish: Math.min(currentTournamentStats.bestFinish, finalRank),
        };

        // 🎯 클럽 랭킹 포인트 계산 (현재 Firestore의 실제 승패 기록 사용)
        const currentTotalMatches =
          currentTournamentStats.tournamentWins + currentTournamentStats.tournamentLosses;
        const currentWinRate =
          currentTotalMatches > 0
            ? (currentTournamentStats.tournamentWins / currentTotalMatches) * 100
            : 0;

        const statsForRankingCalculation = {
          ...currentTournamentStats,
          ...newTournamentStats,
          tournamentWinRate: currentWinRate,
        };

        const clubRankingPoints = this.calculateClubRankingPoints(statsForRankingCalculation);

        // Firestore 업데이트 (increment 방식으로 변경)
        const updateData: Record<string, unknown> = {
          'clubStats.tournamentStats.participations': increment(1),
          'clubStats.tournamentStats.bestFinish': newTournamentStats.bestFinish,
          'clubStats.clubRankingPoints': clubRankingPoints,
          'clubStats.lastRankingUpdate': new Date().toISOString(),
        };

        // 조건부 increment
        if (finalRank === 1) {
          (updateData as any)['clubStats.tournamentStats.wins'] = increment(1);
        }
        if (finalRank === 2) {
          (updateData as any)['clubStats.tournamentStats.runnerUps'] = increment(1);
        }
        if (finalRank <= 4) {
          (updateData as any)['clubStats.tournamentStats.semiFinals'] = increment(1);
        }

        batch.update(clubMembershipRef, updateData as any);

        console.log('⚡ [THOR 2.0] Updated club stats for player:', {
          playerName: participant.playerName,
          finalRank,
          matchesInTournament: `${ranking.wins}W-${ranking.losses}L`,
          tournamentResultsUpdated: newTournamentStats,
          clubRankingPoints,
          note: 'tournamentWins/Losses/totalMatches managed by Cloud Function',
        });
      }

      // 4. 모든 업데이트 커밋
      await batch.commit();

      // 5. 클럽 전체 랭킹 재계산
      await this.recalculateClubRankings(clubId);

      console.log('✅ [THOR 2.0] Club ranking update completed successfully!', {
        tournamentId,
        clubId,
        participantsUpdated: rankings.length,
      });
    } catch (error) {
      console.error('❌ [THOR 2.0] Failed to update club rankings:', error);
      throw new Error(
        `클럽 랭킹 업데이트 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      );
    }
  }

  /**
   * 🔄 클럽 전체 랭킹 재계산 (Thor 2.0)
   *
   * 클럽 내 모든 멤버의 랭킹 포인트를 기준으로 순위를 재계산합니다.
   *
   * @param clubId - 클럽 ID
   */
  private async recalculateClubRankings(clubId: string): Promise<void> {
    console.log('🔄 [THOR 2.0] Recalculating club rankings...', { clubId });

    try {
      // 클럽의 모든 멤버 로드
      const membersRef = collection(db, 'clubs', clubId, 'members');
      const membersSnapshot = await getDocs(membersRef);

      // 각 멤버의 clubMembership 데이터 로드
      const memberRankings: Array<{
        userId: string;
        points: number;
        participations: number;
      }> = [];

      for (const memberDoc of membersSnapshot.docs) {
        const userId = memberDoc.id;

        try {
          const clubMembershipRef = doc(db, 'users', userId, 'clubMemberships', clubId);
          const clubMembershipDoc = await getDoc(clubMembershipRef);

          if (clubMembershipDoc.exists()) {
            const data = clubMembershipDoc.data();
            const points = data.clubStats?.clubRankingPoints || 0;
            const participations = data.clubStats?.tournamentStats?.participations || 0;

            memberRankings.push({
              userId,
              points,
              participations,
            });
          }
        } catch (error) {
          console.warn(`⚠️ Failed to load club membership for user ${userId}:`, error);
        }
      }

      // 랭킹 정렬: 포인트 높은 순 → 참가 횟수 많은 순
      memberRankings.sort((a, b) => {
        if (a.points !== b.points) {
          return b.points - a.points;
        }
        return b.participations - a.participations;
      });

      // 순위 할당 및 업데이트
      const batch = writeBatch(db);

      memberRankings.forEach((member, index) => {
        const rank = index + 1;
        const clubMembershipRef = doc(db, 'users', member.userId, 'clubMemberships', clubId);

        batch.update(clubMembershipRef, {
          'clubStats.clubRanking': rank,
        });
      });

      await batch.commit();

      console.log('✅ [THOR 2.0] Club rankings recalculated!', {
        clubId,
        totalMembers: memberRankings.length,
        topThree: memberRankings.slice(0, 3).map((m, i) => ({
          rank: i + 1,
          userId: m.userId,
          points: m.points,
        })),
      });
    } catch (error) {
      console.error('❌ [THOR 2.0] Failed to recalculate club rankings:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스 생성
const tournamentService = new TournamentService();
export default tournamentService;

// 헬퍼 함수 수출
export {
  validateTournamentParticipant,
  getMatchFormatFromTournamentEventType,
  getTournamentEventTypeDisplayName,
  createTournamentTeam,
} from '../types/tournament';
