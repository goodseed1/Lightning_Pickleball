/**
 * League Service
 * Lightning Pickleball 클럽 리그 관리 서비스
 *
 * 📝 LPR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LPR" (Lightning Pickleball Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LPR로 변경하고 코드는 ntrp를 유지합니다.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  limit,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  Unsubscribe,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { db, auth, functions } from '../firebase/config';
import { httpsCallable } from 'firebase/functions';
import i18n from '../i18n';
import {
  League,
  LeagueStatus,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  LeagueSettings,
  PlayerStanding,
  LeagueMatch,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  MatchStatus,
  CreateLeagueRequest,
  LeagueRegistration,
  LeagueParticipant,
  LeagueSummary,
  PlayoffMatch,
  sortStandings,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getPlayerForm,
} from '../types/league';

class LeagueService {
  /**
   * DEBUG: 클럽 멤버십 데이터 확인
   */
  async debugClubMembership(clubId: string, userId: string): Promise<void> {
    try {
      console.log(`🔍 [DEBUG] Checking club membership for user ${userId} in club ${clubId}`);

      // 클럽 멤버십 컬렉션에서 해당 사용자 데이터 조회
      const clubMemberQuery = query(
        collection(db, 'clubMembers'),
        where('clubId', '==', clubId),
        where('userId', '==', userId)
      );

      const clubMemberSnapshot = await getDocs(clubMemberQuery);

      if (clubMemberSnapshot.empty) {
        console.log(`❌ [DEBUG] No club membership found for user ${userId} in club ${clubId}`);
        return;
      }

      clubMemberSnapshot.forEach(doc => {
        const memberData = doc.data();
        console.log(`✅ [DEBUG] Club membership found:`, {
          docId: doc.id,
          userId: memberData.userId,
          clubId: memberData.clubId,
          role: memberData.role,
          status: memberData.status,
          joinedAt: memberData.joinedAt,
          ...memberData,
        });
      });
    } catch (error) {
      console.error('🚫 [DEBUG] Error checking club membership:', error);
    }
  }

  /**
   * 리그 생성
   */
  /**
   * 🌉 [HEIMDALL] Create League via Cloud Function
   * Server-Side Migration Phase 3
   */
  async createLeague(request: CreateLeagueRequest): Promise<string> {
    try {
      console.log('🌉 [CREATE_LEAGUE] Calling Cloud Function', {
        clubId: request.clubId,
        seasonName: request.seasonName,
      });

      const createLeagueFn = httpsCallable(functions, 'createLeague');
      const result = await createLeagueFn({
        clubId: request.clubId,
        seasonName: request.seasonName,
        description: request.description,
        eventType: request.eventType,
        settings: request.settings,
        startDate: request.startDate.toISOString(),
        endDate: request.endDate.toISOString(),
        registrationDeadline: request.registrationDeadline.toISOString(),
        entryFee: request.entryFee,
      });

      const data = result.data as {
        success: boolean;
        message: string;
        data: {
          leagueId: string;
        };
      };

      console.log('✅ [CREATE_LEAGUE] Cloud Function result:', data);

      return data.data.leagueId;
    } catch (error) {
      console.error('❌ [CREATE_LEAGUE] Error:', error);
      throw new Error(`Failed to create league: ${(error as Error).message || 'Unknown error'}`);
    }
  }

  /**
   * 리그 정보 조회
   */
  async getLeague(leagueId: string): Promise<League | null> {
    try {
      console.log('🐛 DEBUG: getLeague called with leagueId:', leagueId);
      const leagueDoc = await getDoc(doc(db, 'leagues', leagueId));

      if (!leagueDoc.exists()) {
        console.log('🐛 DEBUG: League document does not exist');
        return null;
      }

      const data = leagueDoc.data();
      console.log('🐛 DEBUG: Raw league data from Firebase:', JSON.stringify(data, null, 2));
      console.log(
        '🐛 DEBUG: Data participants type:',
        typeof data?.participants,
        Array.isArray(data?.participants)
      );
      console.log(
        '🐛 DEBUG: Data standings type:',
        typeof data?.standings,
        Array.isArray(data?.standings)
      );

      // Ensure critical arrays are initialized to prevent indexOf errors
      const league = {
        id: leagueDoc.id,
        ...data,
        participants: Array.isArray(data?.participants) ? data.participants : [],
        standings: Array.isArray(data?.standings) ? data.standings : [],
        waitlist: Array.isArray(data?.waitlist) ? data.waitlist : [],
      } as League;

      console.log('🐛 DEBUG: Final league object participants:', league.participants);
      console.log('🐛 DEBUG: Final league object standings:', league.standings);
      return league;
    } catch (error) {
      console.error('🐛 DEBUG: Error in getLeague function:', error);
      console.error('🐛 DEBUG: getLeague error type:', typeof error);
      console.error(
        '🐛 DEBUG: getLeague error message:',
        error instanceof Error ? error.message : String(error)
      );
      console.error(
        '🐛 DEBUG: getLeague error stack:',
        error instanceof Error ? error.stack : 'N/A'
      );
      throw error;
    }
  }

  /**
   * 클럽의 리그 목록 조회
   */
  async getClubLeagues(clubId: string, status?: LeagueStatus): Promise<League[]> {
    try {
      const leaguesRef = collection(db, 'leagues');
      let q = query(leaguesRef, where('clubId', '==', clubId), orderBy('createdAt', 'desc'));

      if (status) {
        q = query(
          leaguesRef,
          where('clubId', '==', clubId),
          where('status', '==', status),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as League[];
    } catch (error) {
      console.error('Error getting club leagues:', error);
      throw error;
    }
  }

  /**
   * 리그 참가 신청 (league_participants 컬렉션에 추가)
   * 단식용
   */
  /**
   * 🌉 [HEIMDALL] Apply For League via Cloud Function (Singles)
   * Server-Side Migration Phase 2
   */
  async applyForLeague(
    leagueId: string,
    userId: string,
    userDisplayName: string,
    userEmail?: string,
    userLtrLevel?: number,
    userProfileImage?: string
  ): Promise<string> {
    try {
      console.log('🌉 [APPLY_FOR_LEAGUE] Calling Cloud Function', {
        leagueId,
        userId,
        userDisplayName,
      });

      const applyForLeagueFn = httpsCallable(functions, 'applyForLeague');
      const result = await applyForLeagueFn({
        leagueId,
        userDisplayName,
        userEmail,
        userLtrLevel,
        userProfileImage,
      });

      const data = result.data as {
        success: boolean;
        message: string;
        data: {
          participantId: string;
        };
      };

      console.log('✅ [APPLY_FOR_LEAGUE] Cloud Function result:', data);

      return data.data.participantId;
    } catch (error) {
      console.error('❌ [APPLY_FOR_LEAGUE] Error:', error);
      throw new Error(`Failed to apply for league: ${(error as Error).message || 'Unknown error'}`);
    }
  }

  /**
   * 🌉 [HEIMDALL] Create League Team via Cloud Function
   * Creates a confirmed team for league doubles
   *
   * @param player1Id - First player user ID
   * @param player2Id - Second player user ID
   * @param leagueId - League ID (optional, for validation/logging)
   * @returns Team creation result with teamId and teamName
   */
  async createLeagueTeam(
    player1Id: string,
    player2Id: string,
    leagueId?: string
  ): Promise<{
    success: boolean;
    teamId: string;
    teamName: string;
    message: string;
  }> {
    try {
      console.log('🌉 [CREATE_LEAGUE_TEAM] Calling Cloud Function', {
        player1Id,
        player2Id,
        leagueId: leagueId || 'N/A',
      });

      const createLeagueTeamFn = httpsCallable(functions, 'createLeagueTeam');
      const result = await createLeagueTeamFn({
        player1Id,
        player2Id,
        leagueId,
      });

      const data = result.data as {
        success: boolean;
        teamId: string;
        teamName: string;
        message: string;
      };

      console.log('✅ [CREATE_LEAGUE_TEAM] Cloud Function result:', data);

      return data;
    } catch (error) {
      console.error('❌ [CREATE_LEAGUE_TEAM] Error:', error);
      throw new Error(
        `Failed to create league team: ${(error as Error).message || 'Unknown error'}`
      );
    }
  }

  /**
   * 🌉 [HEIMDALL] Apply For League As Team via Cloud Function (Doubles)
   * Server-Side Migration Phase 2
   */
  async applyForLeagueAsTeam(leagueId: string, teamId: string): Promise<string> {
    try {
      console.log('🌉 [APPLY_FOR_LEAGUE_AS_TEAM] Calling Cloud Function', {
        leagueId,
        teamId,
      });

      const applyForLeagueAsTeamFn = httpsCallable(functions, 'applyForLeagueAsTeam');
      const result = await applyForLeagueAsTeamFn({
        leagueId,
        teamId,
      });

      const data = result.data as {
        success: boolean;
        message: string;
        data: {
          participantId: string;
          teamName: string;
        };
      };

      console.log('✅ [APPLY_FOR_LEAGUE_AS_TEAM] Cloud Function result:', data);

      return data.data.participantId;
    } catch (error) {
      console.error('❌ [APPLY_FOR_LEAGUE_AS_TEAM] Error:', error);
      throw new Error(
        `Failed to apply for league as team: ${(error as Error).message || 'Unknown error'}`
      );
    }
  }

  /**
   * 특정 리그의 특정 사용자 참가 정보 조회
   */
  async getLeagueParticipant(leagueId: string, userId: string): Promise<LeagueParticipant | null> {
    try {
      const participantsRef = collection(db, 'league_participants');
      const q = query(
        participantsRef,
        where('leagueId', '==', leagueId),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return null;
      }

      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data(),
      } as LeagueParticipant;
    } catch (error) {
      console.error('Error getting league participant:', error);
      throw error;
    }
  }

  /**
   * 리그 참가 신청자 목록 조회
   */
  async getLeagueParticipants(
    leagueId: string,
    status?: 'applied' | 'confirmed' | 'rejected'
  ): Promise<LeagueParticipant[]> {
    try {
      const participantsRef = collection(db, 'league_participants');
      let q = query(
        participantsRef,
        where('leagueId', '==', leagueId),
        orderBy('appliedAt', 'asc')
      );

      if (status) {
        q = query(
          participantsRef,
          where('leagueId', '==', leagueId),
          where('status', '==', status),
          orderBy('appliedAt', 'asc')
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as LeagueParticipant[];
    } catch (error) {
      console.error('Error getting league participants:', error);
      throw error;
    }
  }

  /**
   * 리그 참가 신청 승인 (Cloud Function으로 서버 사이드 처리)
   * Phase 5.14: approveLeagueParticipant Cloud Function 호출
   */
  async approveLeagueParticipant(
    participantId: string,
    adminId: string,
    note?: string
  ): Promise<void> {
    try {
      console.log('⚡ [approveLeagueParticipant] Calling Cloud Function...', {
        participantId,
        adminId,
        note,
      });

      const approveFunction = httpsCallable(functions, 'approveLeagueParticipant');

      const result = await approveFunction({
        participantId,
        note,
      });

      const response = result.data as {
        success: boolean;
        message: string;
        data?: {
          participantId: string;
          status: string;
        };
      };

      if (!response.success) {
        throw new Error(response.message || 'Failed to approve participant');
      }

      console.log('✅ [approveLeagueParticipant] Cloud Function success', response.data);
    } catch (error) {
      console.error('❌ [approveLeagueParticipant] Error:', error);
      throw error;
    }
  }

  /**
   * 리그 참가 신청 거절 (Cloud Function으로 서버 사이드 처리)
   * Phase 5.14: rejectLeagueParticipant Cloud Function 호출
   */
  async rejectLeagueParticipant(
    participantId: string,
    adminId: string,
    note?: string
  ): Promise<void> {
    try {
      console.log('⚡ [rejectLeagueParticipant] Calling Cloud Function...', {
        participantId,
        adminId,
        note,
      });

      const rejectFunction = httpsCallable(functions, 'rejectLeagueParticipant');

      const result = await rejectFunction({
        participantId,
        note,
      });

      const response = result.data as {
        success: boolean;
        message: string;
        data?: {
          participantId: string;
          status: string;
        };
      };

      if (!response.success) {
        throw new Error(response.message || 'Failed to reject participant');
      }

      console.log('✅ [rejectLeagueParticipant] Cloud Function success', response.data);
    } catch (error) {
      console.error('❌ [rejectLeagueParticipant] Error:', error);
      throw error;
    }
  }

  /**
   * 리그 참가 신청
   */
  async registerForLeague(leagueId: string, userId: string): Promise<string> {
    try {
      // 리그 정보 확인
      const league = await this.getLeague(leagueId);
      if (!league) {
        throw new Error('League not found');
      }

      // 참가 가능 확인
      if (league.status !== 'open') {
        throw new Error('League is not open for registration');
      }

      if (league.participants.length >= league.settings.maxParticipants) {
        throw new Error('League is full');
      }

      // 중복 신청 확인
      if (
        league.participants &&
        Array.isArray(league.participants) &&
        league.participants.includes(userId)
      ) {
        throw new Error('Already registered');
      }

      // 참가 신청 생성
      const registration: Omit<LeagueRegistration, 'id'> = {
        leagueId,
        userId,
        status: 'approved', // 자동 승인 (필요시 'pending'으로 변경)
        registeredAt: serverTimestamp() as Timestamp,
        approvedAt: serverTimestamp() as Timestamp,
      };

      const docRef = await addDoc(collection(db, 'leagueRegistrations'), registration);

      // 리그 참가자 목록 업데이트
      await updateDoc(doc(db, 'leagues', leagueId), {
        participants: [...league.participants, userId],
        updatedAt: serverTimestamp(),
      });

      // 순위표에 추가
      await this.addPlayerToStandings(leagueId, userId);

      console.log('✅ League registration completed:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error registering for league:', error);
      throw error;
    }
  }

  /**
   * 순위표에 플레이어 추가
   */
  private async addPlayerToStandings(leagueId: string, playerId: string): Promise<void> {
    try {
      const league = await this.getLeague(leagueId);
      if (!league) return;

      // 플레이어 정보 조회 (실제로는 users 컬렉션에서)
      const playerName = 'Player Name'; // TODO: Get from users collection

      const newStanding: PlayerStanding = {
        playerId,
        playerName,
        position: league.standings.length + 1,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gamesWon: 0,
        gamesLost: 0,
        gameDifference: 0,
        setsWon: 0,
        setsLost: 0,
        setDifference: 0,
        points: 0,
        form: [],
        streak: { type: 'none', count: 0 },
        lastUpdated: serverTimestamp() as Timestamp,
      };

      const updatedStandings = [...league.standings, newStanding];

      await updateDoc(doc(db, 'leagues', leagueId), {
        standings: updatedStandings,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error adding player to standings:', error);
      throw error;
    }
  }

  /**
   * 모든 브래킷 매치 삭제 (관리자 전용)
   */
  async clearAllMatches(leagueId: string): Promise<void> {
    try {
      console.log('🗑️ [CLEAR MATCHES] Starting to clear all matches for league:', leagueId);

      const leagueRef = doc(db, 'leagues', leagueId);
      const matchesRef = collection(leagueRef, 'matches');
      const playoffMatchesRef = collection(leagueRef, 'playoff_matches');

      // 1. 정규 시즌 매치 삭제
      const matchesSnapshot = await getDocs(matchesRef);
      const matchDeletePromises = matchesSnapshot.docs.map(doc => deleteDoc(doc.ref));

      // 2. 플레이오프 매치 삭제
      const playoffMatchesSnapshot = await getDocs(playoffMatchesRef);
      const playoffDeletePromises = playoffMatchesSnapshot.docs.map(doc => deleteDoc(doc.ref));

      // 3. 모든 매치 삭제 실행
      await Promise.all([...matchDeletePromises, ...playoffDeletePromises]);

      // 4. 리그 상태를 'open'으로 되돌리고 standings 초기화
      await updateDoc(leagueRef, {
        status: 'open',
        currentRound: 0,
        playoff: null,
        standings: [], // 순위표 초기화 - 경기 기록과 일치시킴
        updatedAt: serverTimestamp(),
      });

      console.log(
        '🗑️ [CLEAR MATCHES] Successfully cleared all matches, standings, and reset league status'
      );
    } catch (error) {
      console.error('Error clearing matches:', error);
      throw error;
    }
  }

  /**
   * 리그 경기 생성 (Cloud Function으로 서버 사이드 처리)
   * Phase 5.12: generateRoundRobinMatches Cloud Function 호출
   */
  async generateRoundRobinMatches(leagueId: string): Promise<void> {
    try {
      console.log('⚡ [generateRoundRobinMatches] Calling Cloud Function...', {
        leagueId,
      });

      const generateMatchesFunction = httpsCallable(functions, 'generateRoundRobinMatches');

      const result = await generateMatchesFunction({
        leagueId,
      });

      const response = result.data as {
        success: boolean;
        message: string;
        data?: {
          matchCount: number;
          totalRounds: number;
        };
      };

      if (!response.success) {
        throw new Error(response.message || 'Failed to generate matches');
      }

      console.log('✅ [generateRoundRobinMatches] Cloud Function success', {
        matchCount: response.data?.matchCount,
        totalRounds: response.data?.totalRounds,
      });
    } catch (error) {
      console.error('❌ [generateRoundRobinMatches] Error:', error);
      throw error;
    }
  }

  /**
   * 경기 결과 제출 (Cloud Function으로 서버 사이드 처리)
   * Phase 5.11: submitLeagueMatchResult Cloud Function 호출
   */
  async submitMatchResult(
    matchId: string,
    leagueId: string,
    resultData: {
      _winner: string;
      score: {
        sets: Array<{
          player1Games: number;
          player2Games: number;
        }>;
        finalScore: string;
      };
    }
  ): Promise<void> {
    try {
      console.log('⚡ [submitMatchResult] Calling Cloud Function...', {
        leagueId,
        matchId,
        winnerId: resultData._winner,
      });

      const submitResult = httpsCallable(functions, 'submitLeagueMatchResult');
      const result = await submitResult({
        leagueId,
        matchId,
        winnerId: resultData._winner,
        score: resultData.score,
      });

      const response = result.data as { success: boolean; message: string };
      if (response.success) {
        console.log(`✅ [submitMatchResult] ${response.message}`);
      }
    } catch (error) {
      console.error('❌ [submitMatchResult] Cloud Function error:', error);
      throw error;
    }
  }

  /**
   * 경기 결과 승인 (관리자용)
   */
  async approveMatchResult(leagueId: string, matchId: string): Promise<void> {
    try {
      console.log('🐛 DEBUG: approveMatchResult called with:', { leagueId, matchId });
      // 경기 정보 조회 (subcollection에서)
      const matchDoc = await getDoc(doc(db, 'leagues', leagueId, 'matches', matchId));
      if (!matchDoc.exists()) {
        console.log('🐛 DEBUG: approveMatchResult - match not found');
        throw new Error('Match not found');
      }

      const match = matchDoc.data() as LeagueMatch;
      console.log('🐛 DEBUG: approveMatchResult - match data:', JSON.stringify(match, null, 2));

      // 승인 대기 상태가 아니면 에러
      if (match.status !== 'pending_approval') {
        throw new Error('Match is not pending approval');
      }

      // 경기 상태를 완료로 변경 (subcollection에서)
      await updateDoc(doc(db, 'leagues', leagueId, 'matches', matchId), {
        status: 'completed',
        actualDate: serverTimestamp(),
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 순위표 업데이트
      if (match._winner && match.score) {
        console.log('🐛 DEBUG: approveMatchResult - about to call updateStandings');
        await this.updateStandings(leagueId, match, match._winner);
        console.log('🐛 DEBUG: approveMatchResult - updateStandings completed');
      }

      console.log('✅ Match result approved:', matchId);
    } catch (error) {
      console.error('🐛 DEBUG: Error in approveMatchResult:', error);
      console.error('🐛 DEBUG: approveMatchResult error type:', typeof error);
      console.error(
        '🐛 DEBUG: approveMatchResult error message:',
        error instanceof Error ? error.message : String(error)
      );
      console.error(
        '🐛 DEBUG: approveMatchResult error stack:',
        error instanceof Error ? error.stack : 'N/A'
      );
      throw error;
    }
  }

  /**
   * 경기 결과 입력 (관리자용 - 즉시 완료)
   */
  async updateMatchResult(
    leagueId: string,
    matchId: string,
    _winner: string,
    score: {
      sets: Array<{
        player1Games: number;
        player2Games: number;
      }>;
      finalScore: string;
    }
  ): Promise<void> {
    try {
      // 경기 정보 조회 (subcollection에서)
      const matchDoc = await getDoc(doc(db, 'leagues', leagueId, 'matches', matchId));
      if (!matchDoc.exists()) {
        throw new Error('Match not found');
      }

      const match = matchDoc.data() as LeagueMatch;

      // 경기 결과 업데이트 (subcollection에서)
      await updateDoc(doc(db, 'leagues', leagueId, 'matches', matchId), {
        status: 'completed',
        _winner,
        score,
        actualDate: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 순위표 업데이트
      await this.updateStandings(leagueId, match, _winner);

      console.log('✅ Match result updated:', matchId);
    } catch (error) {
      console.error('Error updating match result:', error);
      throw error;
    }
  }

  /**
   * 순위표 업데이트
   */
  private async updateStandings(
    leagueId: string,
    match: LeagueMatch,
    _winner: string
  ): Promise<void> {
    try {
      console.log('🐛 DEBUG: updateStandings called with:', {
        leagueId,
        match: match?.id,
        _winner,
      });
      const league = await this.getLeague(leagueId);
      if (!league) {
        console.log('🐛 DEBUG: updateStandings - league not found, returning');
        return;
      }

      console.log('🐛 DEBUG: updateStandings - league.standings:', league.standings);
      console.log('🐛 DEBUG: updateStandings - league.standings type:', typeof league.standings);
      console.log(
        '🐛 DEBUG: updateStandings - league.standings isArray:',
        Array.isArray(league.standings)
      );

      // Ensure standings array exists and is valid
      if (!league.standings || !Array.isArray(league.standings)) {
        console.error('🐛 DEBUG: League standings is not a valid array, cannot update standings');
        return;
      }

      console.log('🐛 DEBUG: updateStandings - about to spread standings array');
      const standings = [...league.standings];
      console.log(
        '🐛 DEBUG: updateStandings - standings spread completed, length:',
        standings.length
      );
      const player1Standing = standings.find(s => s.playerId === match.player1Id);
      const player2Standing = standings.find(s => s.playerId === match.player2Id);

      if (!player1Standing || !player2Standing) return;

      // 게임 수 계산
      let player1Games = 0,
        player2Games = 0;
      let player1Sets = 0,
        player2Sets = 0;

      if (match.score?.sets) {
        for (const set of match.score.sets) {
          player1Games += set.player1Games;
          player2Games += set.player2Games;

          if (set.player1Games > set.player2Games) {
            player1Sets++;
          } else {
            player2Sets++;
          }
        }
      }

      // 통계 업데이트
      player1Standing.played++;
      player2Standing.played++;

      if (_winner === match.player1Id) {
        player1Standing.won++;
        player1Standing.points += league.settings.pointsForWin;
        player2Standing.lost++;
        player2Standing.points += league.settings.pointsForLoss;

        // 연승/연패 업데이트
        player1Standing.streak =
          player1Standing.streak.type === 'win'
            ? { type: 'win', count: player1Standing.streak.count + 1 }
            : { type: 'win', count: 1 };
        player2Standing.streak =
          player2Standing.streak.type === 'loss'
            ? { type: 'loss', count: player2Standing.streak.count + 1 }
            : { type: 'loss', count: 1 };
      } else {
        player2Standing.won++;
        player2Standing.points += league.settings.pointsForWin;
        player1Standing.lost++;
        player1Standing.points += league.settings.pointsForLoss;

        // 연승/연패 업데이트
        player2Standing.streak =
          player2Standing.streak.type === 'win'
            ? { type: 'win', count: player2Standing.streak.count + 1 }
            : { type: 'win', count: 1 };
        player1Standing.streak =
          player1Standing.streak.type === 'loss'
            ? { type: 'loss', count: player1Standing.streak.count + 1 }
            : { type: 'loss', count: 1 };
      }

      // 게임/세트 통계
      player1Standing.gamesWon += player1Games;
      player1Standing.gamesLost += player2Games;
      player1Standing.gameDifference = player1Standing.gamesWon - player1Standing.gamesLost;

      player2Standing.gamesWon += player2Games;
      player2Standing.gamesLost += player1Games;
      player2Standing.gameDifference = player2Standing.gamesWon - player2Standing.gamesLost;

      player1Standing.setsWon += player1Sets;
      player1Standing.setsLost += player2Sets;
      player1Standing.setDifference = player1Standing.setsWon - player1Standing.setsLost;

      player2Standing.setsWon += player2Sets;
      player2Standing.setsLost += player1Sets;
      player2Standing.setDifference = player2Standing.setsWon - player2Standing.setsLost;

      // 순위 재정렬 (번개 피클볼 공식 타이브레이커 규정 v1.0 적용)
      console.log('🐛 DEBUG: updateStandings - about to call sortStandings');
      console.log('🐛 DEBUG: updateStandings - standings before sort:', standings);

      // 🔍 Head-to-Head 판별을 위해 모든 경기 기록 가져오기
      const matchesCollectionRef = collection(db, 'leagues', leagueId, 'matches');
      const matchesSnapshot = await getDocs(matchesCollectionRef);
      const matches = matchesSnapshot.docs.map(doc => doc.data() as LeagueMatch);

      console.log('🐛 DEBUG: updateStandings - fetched matches for Head-to-Head:', matches.length);

      // 🏅 공식 타이브레이커 규칙 적용:
      // 1. Head-to-Head (승자승)
      // 2. 세트 득실률
      // 3. 게임 득실률
      // 4. 등록 순서

      // Convert participants to string array for sortStandings
      const participantIds = league.participants.map(p => (typeof p === 'string' ? p : p.playerId));
      const sortedStandings = sortStandings(standings, matches, participantIds);
      console.log('🐛 DEBUG: updateStandings - sortStandings completed, result:', sortedStandings);

      sortedStandings.forEach((standing, index) => {
        standing.position = index + 1;
      });

      // 업데이트
      await updateDoc(doc(db, 'leagues', leagueId), {
        standings: sortedStandings,
        updatedAt: serverTimestamp(),
      });
      console.log('🐛 DEBUG: updateStandings - Firebase update completed');

      // 🏛️ Update clubStats for both players in clubMembers collection
      const clubId = league.clubId;
      if (clubId) {
        // Winner stats
        const winnerMembershipId = `${clubId}_${_winner}`;
        const winnerMembershipRef = doc(db, 'clubMembers', winnerMembershipId);
        const winnerMembershipDoc = await getDoc(winnerMembershipRef);

        if (winnerMembershipDoc.exists()) {
          await updateDoc(winnerMembershipRef, {
            'clubStats.wins': increment(1),
            'clubStats.matchesPlayed': increment(1),
            'clubStats.lastMatchDate': serverTimestamp(),
          });
        }

        // Loser stats
        const loserId = _winner === match.player1Id ? match.player2Id : match.player1Id;
        const loserMembershipId = `${clubId}_${loserId}`;
        const loserMembershipRef = doc(db, 'clubMembers', loserMembershipId);
        const loserMembershipDoc = await getDoc(loserMembershipRef);

        if (loserMembershipDoc.exists()) {
          await updateDoc(loserMembershipRef, {
            'clubStats.losses': increment(1),
            'clubStats.matchesPlayed': increment(1),
            'clubStats.lastMatchDate': serverTimestamp(),
          });
        }
      }

      // 🏆 정규 시즌 완료 체크 (플레이오프 자동 생성)
      await this.checkRegularSeasonCompletion(leagueId);
    } catch (error) {
      console.error('🐛 DEBUG: Error in updateStandings:', error);
      console.error('🐛 DEBUG: updateStandings error type:', typeof error);
      console.error(
        '🐛 DEBUG: updateStandings error message:',
        error instanceof Error ? error.message : String(error)
      );
      console.error(
        '🐛 DEBUG: updateStandings error stack:',
        error instanceof Error ? error.stack : 'N/A'
      );
      throw error;
    }
  }

  /**
   * 리그 경기 목록 조회
   */
  async getLeagueMatches(leagueId: string, round?: number): Promise<LeagueMatch[]> {
    try {
      // 🆕 [KIM FIX] 서브컬렉션에서 정규 시즌 + 플레이오프 경기 모두 조회
      const leagueRef = doc(db, 'leagues', leagueId);
      const matchesRef = collection(leagueRef, 'matches');
      const playoffMatchesRef = collection(leagueRef, 'playoff_matches');

      console.log(
        '🔍 [getLeagueMatches] Querying matches from subcollections:',
        `leagues/${leagueId}/matches + playoff_matches`
      );

      // 정규 시즌 매치 가져오기
      let q = query(matchesRef, orderBy('round', 'asc'), orderBy('createdAt', 'asc'));

      if (round) {
        q = query(matchesRef, where('round', '==', round), orderBy('createdAt', 'asc'));
      }

      const regularSnapshot = await getDocs(q);
      const regularMatches = regularSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as LeagueMatch[];

      console.log('📊 [getLeagueMatches] Found', regularMatches.length, 'regular season matches');

      // 🆕 플레이오프 매치 가져오기
      const playoffSnapshot = await getDocs(playoffMatchesRef);
      const playoffMatches = playoffSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isPlayoffMatch: true, // 명시적으로 플레이오프 플래그 설정
      })) as LeagueMatch[];

      console.log('📊 [getLeagueMatches] Found', playoffMatches.length, 'playoff matches');

      // 두 배열 합치기
      const allMatches = [...regularMatches, ...playoffMatches];

      console.log('📊 [getLeagueMatches] Total matches:', allMatches.length);

      return allMatches;
    } catch (error) {
      console.error('Error getting league matches from subcollection:', error);
      throw error;
    }
  }

  /**
   * 플레이어의 리그 경기 조회
   */
  async getPlayerLeagueMatches(leagueId: string, playerId: string): Promise<LeagueMatch[]> {
    try {
      const allMatches = await this.getLeagueMatches(leagueId);
      return allMatches.filter(
        match => match.player1Id === playerId || match.player2Id === playerId
      );
    } catch (error) {
      console.error('Error getting player matches:', error);
      throw error;
    }
  }

  /**
   * 리그 요약 정보 조회
   */
  async getLeagueSummary(leagueId: string): Promise<LeagueSummary> {
    try {
      const league = await this.getLeague(leagueId);
      if (!league) {
        throw new Error('League not found');
      }

      const matches = await this.getLeagueMatches(leagueId);
      const completedMatches = matches.filter(m => m.status === 'completed');
      const upcomingMatches = matches.filter(m => m.status === 'scheduled');

      const summary: LeagueSummary = {
        leagueId,
        totalParticipants: league.participants.length,
        totalMatches: matches.length,
        completedMatches: completedMatches.length,
        upcomingMatches: upcomingMatches.length,
        averageMatchesPerPlayer: matches.length / league.participants.length,
        completionRate: matches.length > 0 ? (completedMatches.length / matches.length) * 100 : 0,
        topScorers: league.standings.slice(0, 5),
        recentResults: completedMatches
          .sort((a, b) => (b.actualDate?.toMillis() || 0) - (a.actualDate?.toMillis() || 0))
          .slice(0, 5),
      };

      return summary;
    } catch (error) {
      console.error('Error getting league summary:', error);
      throw error;
    }
  }

  /**
   * 리그 상태 변경 (Cloud Function으로 서버 사이드 처리)
   * Phase 5.14: updateLeagueStatus Cloud Function 호출
   */
  async updateLeagueStatus(leagueId: string, status: LeagueStatus): Promise<void> {
    try {
      console.log('⚡ [updateLeagueStatus] Calling Cloud Function...', {
        leagueId,
        status,
      });

      const updateStatusFunction = httpsCallable(functions, 'updateLeagueStatus');

      const result = await updateStatusFunction({
        leagueId,
        status,
      });

      const response = result.data as {
        success: boolean;
        message: string;
        data?: {
          leagueId: string;
          status: string;
        };
      };

      if (!response.success) {
        throw new Error(response.message || 'Failed to update league status');
      }

      console.log(`✅ [updateLeagueStatus] Cloud Function success`, response.data);
    } catch (error) {
      console.error('❌ [updateLeagueStatus] Error:', error);
      throw error;
    }
  }

  /**
   * 🎭 커튼콜: 리그 신청 접수 시작 (preparing → open)
   * 관리자가 리그 준비를 완료하고 회원들에게 공개할 때 사용
   */
  async openLeagueForApplications(leagueId: string): Promise<void> {
    try {
      console.log('🎭 [CURTAIN CALL] Opening league for applications:', leagueId);

      // 현재 리그 상태 확인
      const league = await this.getLeague(leagueId);
      if (!league) {
        throw new Error('League not found');
      }

      if (league.status !== 'preparing') {
        throw new Error(`Cannot open league with status '${league.status}'. Expected 'preparing'.`);
      }

      // 상태를 'open'으로 변경 (회원들이 참가 신청할 수 있는 상태)
      await updateDoc(doc(db, 'leagues', leagueId), {
        status: 'open',
        openedAt: serverTimestamp(), // 공개된 시점 기록
        updatedAt: serverTimestamp(),
      });

      console.log('🎭 [CURTAIN CALL] ✅ League successfully opened for applications');
    } catch (error) {
      console.error('🎭 [CURTAIN CALL] ❌ Error opening league for applications:', error);
      throw error;
    }
  }

  /**
   * 리그 완료 처리 (Server-Side via Cloud Function)
   */
  async completeLeague(leagueId: string): Promise<void> {
    try {
      const completeLeagueFn = httpsCallable(functions, 'completeLeague');

      const response = await completeLeagueFn({ leagueId });

      const result = response.data as {
        success: boolean;
        message: string;
        data: {
          winner: { playerName: string; finalPoints: number };
          runnerUp?: { playerName: string; finalPoints: number };
        };
      };

      console.log('✅ League completed successfully:', {
        winner: result.data.winner.playerName,
        runnerUp: result.data.runnerUp?.playerName || 'N/A',
      });
    } catch (error) {
      console.error('Error completing league:', error);
      throw error;
    }
  }

  /**
   * 리그 실시간 구독
   */
  subscribeToLeague(leagueId: string, callback: (league: League | null) => void): Unsubscribe {
    const leagueRef = doc(db, 'leagues', leagueId);

    return onSnapshot(
      leagueRef,
      snapshot => {
        if (snapshot.exists()) {
          callback({
            id: snapshot.id,
            ...snapshot.data(),
          } as League);
        } else {
          callback(null);
        }
      },
      error => {
        console.error('Error in league subscription:', error);
      }
    );
  }

  /**
   * 리그 경기 실시간 구독
   */
  subscribeToLeagueMatches(
    leagueId: string,
    callback: (matches: LeagueMatch[]) => void
  ): Unsubscribe {
    const matchesRef = collection(db, 'leagueMatches');
    const q = query(matchesRef, where('leagueId', '==', leagueId), orderBy('round', 'asc'));

    return onSnapshot(
      q,
      snapshot => {
        const matches = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as LeagueMatch[];

        callback(matches);
      },
      error => {
        console.error('Error in matches subscription:', error);
      }
    );
  }

  /**
   * 클럽 내부 리그 목록 실시간 구독 (역할 기반 필터링)
   * ClubDetailScreen의 리그/토너먼트 탭에서 사용
   * @param clubId 클럽 ID
   * @param userRole 사용자 역할 ('admin'/'owner' = 모든 리그, 'member' = 공개된 리그만)
   * @param callback 리그 목록 업데이트 콜백
   */
  subscribeToClubLeagues(
    clubId: string,
    userRole: string,
    callback: (leagues: League[]) => void
  ): Unsubscribe {
    const leaguesRef = collection(db, 'leagues');

    // 🎭 역할 기반 쿼리 구성
    let q;
    if (userRole === 'admin' || userRole === 'owner' || userRole === 'manager') {
      // 관리자: 모든 상태의 리그를 볼 수 있음 (백스테이지)
      q = query(leaguesRef, where('clubId', '==', clubId), orderBy('createdAt', 'desc'));
      console.log('🎭 [CURTAIN CALL] Admin backstage view: Loading all league statuses');
    } else {
      // 회원: 모든 상태의 리그를 볼 수 있음 (preparing 포함)
      q = query(leaguesRef, where('clubId', '==', clubId), orderBy('createdAt', 'desc'));
      console.log(
        '🎭 [CURTAIN CALL] Member audience view: Loading all leagues including preparation phases'
      );
    }

    return onSnapshot(
      q,
      snapshot => {
        const leagues = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as League[];

        console.log(
          `🎭 [CURTAIN CALL] ${userRole} received ${leagues.length} leagues for club ${clubId}`
        );
        callback(leagues);
      },
      error => {
        console.error('Error in club leagues subscription:', error);
        callback([]); // 에러 시 빈 배열 반환
      }
    );
  }

  /**
   * 관리자 기능: 경기 결과 수정
   *
   * @param leagueId 리그 ID
   * @param matchId 경기 ID
   * @param newScores 새로운 점수 { player1Score: number, player2Score: number }
   * @param newWinnerId 새로운 승자 ID
   * @param adminUserId 수정을 수행하는 관리자 ID
   * @param reason 수정 사유
   */
  async correctMatchResult(
    leagueId: string,
    matchId: string,
    newScores: { player1Score: number; player2Score: number },
    newWinnerId: string,
    adminUserId: string,
    reason: string = '관리자 수정'
  ): Promise<void> {
    try {
      const batch = writeBatch(db);

      // 경기 정보 업데이트
      const matchRef = doc(db, 'league_matches', matchId);
      const matchDoc = await getDoc(matchRef);

      if (!matchDoc.exists()) {
        throw new Error(i18n.t('services.league.matchNotFound'));
      }

      const originalMatch = matchDoc.data() as LeagueMatch;

      batch.update(matchRef, {
        player1Score: newScores.player1Score,
        player2Score: newScores.player2Score,
        winnerId: newWinnerId,
        status: 'completed',
        updatedAt: serverTimestamp(),
        adminCorrected: true,
        correctionHistory: [
          ...(originalMatch.correctionHistory || []),
          {
            timestamp: serverTimestamp(),
            adminId: adminUserId,
            reason,
            previousScores: {
              player1Score: originalMatch.player1Score,
              player2Score: originalMatch.player2Score,
            },
            previousWinnerId: originalMatch.winnerId,
            newScores,
            newWinnerId,
          },
        ],
      });

      // 리그 순위표 재계산 (이 부분은 Cloud Function에서 처리될 수도 있음)
      const leagueRef = doc(db, 'leagues', leagueId);
      const leagueDoc = await getDoc(leagueRef);

      if (leagueDoc.exists()) {
        const league = leagueDoc.data() as League;
        const updatedStandings = await this.recalculateStandings(league, matchId, originalMatch, {
          ...originalMatch,
          player1Score: newScores.player1Score,
          player2Score: newScores.player2Score,
          winnerId: newWinnerId,
        });

        batch.update(leagueRef, {
          standings: updatedStandings,
          updatedAt: serverTimestamp(),
        });
      }

      await batch.commit();

      console.log(`✅ Match result corrected by admin: ${matchId}`);
    } catch (error) {
      console.error('Error correcting match result:', error);
      throw error;
    }
  }

  /**
   * 관리자 기능: 경기 일정 변경
   *
   * @param leagueId 리그 ID
   * @param matchId 경기 ID
   * @param newDate 새로운 경기 날짜
   * @param adminUserId 수정을 수행하는 관리자 ID
   * @param reason 일정 변경 사유
   */
  async rescheduleMatch(
    leagueId: string,
    matchId: string,
    newDate: Date,
    adminUserId: string,
    reason: string = '관리자 일정 변경'
  ): Promise<void> {
    try {
      const matchRef = doc(db, 'league_matches', matchId);
      const matchDoc = await getDoc(matchRef);

      if (!matchDoc.exists()) {
        throw new Error(i18n.t('services.league.matchNotFound'));
      }

      const originalMatch = matchDoc.data() as LeagueMatch;

      await updateDoc(matchRef, {
        scheduledDate: Timestamp.fromDate(newDate),
        updatedAt: serverTimestamp(),
        adminRescheduled: true,
        rescheduleHistory: [
          ...(originalMatch.rescheduleHistory || []),
          {
            timestamp: serverTimestamp(),
            adminId: adminUserId,
            reason,
            previousDate: originalMatch.scheduledDate,
            newDate: Timestamp.fromDate(newDate),
          },
        ],
      });

      console.log(`✅ Match rescheduled by admin: ${matchId} to ${newDate.toISOString()}`);
    } catch (error) {
      console.error('Error rescheduling match:', error);
      throw error;
    }
  }

  /**
   * 순위표 재계산 헬퍼 함수
   */
  private async recalculateStandings(
    league: League,
    changedMatchId: string,
    oldMatch: LeagueMatch,
    newMatch: LeagueMatch
  ): Promise<PlayerStanding[]> {
    try {
      console.log('🐛 DEBUG: recalculateStandings - league.standings:', league.standings);
      console.log('🐛 DEBUG: recalculateStandings - isArray:', Array.isArray(league.standings));

      // Ensure standings array exists and is valid
      if (!league.standings || !Array.isArray(league.standings)) {
        console.error('🐛 DEBUG: recalculateStandings - League standings is not a valid array');
        return [];
      }

      const standings = [...league.standings];

      // 기존 결과 제거
      if (
        oldMatch.winnerId &&
        oldMatch.player1Score !== undefined &&
        oldMatch.player2Score !== undefined
      ) {
        const player1Standing = standings.find(s => s.playerId === oldMatch.player1Id);
        const player2Standing = standings.find(s => s.playerId === oldMatch.player2Id);

        if (player1Standing && player2Standing) {
          // 기존 승부 결과 롤백 (use primary fields: won/lost instead of wins/losses)
          if (oldMatch.winnerId === oldMatch.player1Id) {
            player1Standing.won--;
            player1Standing.points -= 3;
            player2Standing.lost--;
          } else {
            player2Standing.won--;
            player2Standing.points -= 3;
            player1Standing.lost--;
          }

          // Use primary fields: gamesWon/gamesLost instead of gamesFor/gamesAgainst
          player1Standing.gamesWon -= oldMatch.player1Score;
          player1Standing.gamesLost -= oldMatch.player2Score;
          player2Standing.gamesWon -= oldMatch.player2Score;
          player2Standing.gamesLost -= oldMatch.player1Score;
        }
      }

      // 새 결과 적용
      if (
        newMatch.winnerId &&
        newMatch.player1Score !== undefined &&
        newMatch.player2Score !== undefined
      ) {
        const player1Standing = standings.find(s => s.playerId === newMatch.player1Id);
        const player2Standing = standings.find(s => s.playerId === newMatch.player2Id);

        if (player1Standing && player2Standing) {
          // 새 승부 결과 적용 (use primary fields: won/lost instead of wins/losses)
          if (newMatch.winnerId === newMatch.player1Id) {
            player1Standing.won++;
            player1Standing.points += 3;
            player2Standing.lost++;
          } else {
            player2Standing.won++;
            player2Standing.points += 3;
            player1Standing.lost++;
          }

          // Use primary fields: gamesWon/gamesLost instead of gamesFor/gamesAgainst
          player1Standing.gamesWon += newMatch.player1Score;
          player1Standing.gamesLost += newMatch.player2Score;
          player2Standing.gamesWon += newMatch.player2Score;
          player2Standing.gamesLost += newMatch.player1Score;
        }
      }

      // 순위 재정렬
      return sortStandings(standings);
    } catch (error) {
      console.error('Error recalculating standings:', error);
      throw error;
    }
  }

  /**
   * 🏆 정규 시즌 완료 체크 및 플레이오프 자동 생성
   * 모든 라운드 로빈 경기가 완료되면 자동으로 플레이오프를 시작
   */
  async checkRegularSeasonCompletion(leagueId: string): Promise<void> {
    try {
      const league = await this.getLeague(leagueId);
      if (!league || league.status !== 'ongoing') {
        return;
      }

      // 모든 정규 시즌 경기 가져오기
      const allMatches = await this.getLeagueMatches(leagueId);

      if (allMatches.length === 0) {
        return;
      }

      // 모든 경기가 완료되었는지 확인
      const completedMatches = allMatches.filter(match => match.status === 'completed');

      console.log(`🏆 정규 시즌 체크: ${completedMatches.length}/${allMatches.length} 경기 완료`);

      // 라운드 로빈 예상 경기 수 계산 (n명일 때 n*(n-1)/2 경기)
      // Use same fallback logic as playoff detection
      let participantCount = league.participants?.length || 0;

      // league.participants가 비어있으면 매치 데이터에서 참가자 추출 (fallback)
      if (participantCount === 0 && allMatches.length > 0) {
        const uniquePlayerIds = new Set<string>();
        allMatches.forEach(match => {
          const player1Id = match.player1Id;
          const player2Id = match.player2Id;

          if (player1Id) uniquePlayerIds.add(player1Id);
          if (player2Id) uniquePlayerIds.add(player2Id);
        });
        participantCount = uniquePlayerIds.size;
        console.log(
          `🏆 [PLAYOFF GENERATION] Fallback: 매치 데이터에서 추출한 참가자 수: ${participantCount}`
        );
      }

      const expectedMatches = (participantCount * (participantCount - 1)) / 2;

      console.log(
        `🏆 예상 경기 수: ${expectedMatches} (참가자 ${participantCount}명), 실제 경기 수: ${allMatches.length}`
      );

      // 모든 정규 시즌 경기가 완료되었는지 확인
      if (
        completedMatches.length === expectedMatches &&
        completedMatches.length === allMatches.length
      ) {
        console.log('🏆 정규 시즌 완료! 플레이오프 생성 시작...');
        await this.createPlayoffs(leagueId);
      }
    } catch (error) {
      console.error('Error checking regular season completion:', error);
    }
  }

  /**
   * 승자승 비교: 두 선수 간 직접 대결 전적 계산
   * @returns 양수면 playerB 우위, 음수면 playerA 우위, 0이면 동등
   */
  private compareHeadToHead(
    playerA: PlayerStanding,
    playerB: PlayerStanding,
    allMatches: LeagueMatch[]
  ): number {
    // A vs B 직접 대결 전적
    const headToHeadMatches = allMatches.filter(
      m =>
        m.status === 'completed' &&
        ((m.player1Id === playerA.playerId && m.player2Id === playerB.playerId) ||
          (m.player1Id === playerB.playerId && m.player2Id === playerA.playerId))
    );

    if (headToHeadMatches.length === 0) {
      return 0; // 직접 대결 경기 없음
    }

    let aWins = 0;
    let bWins = 0;

    headToHeadMatches.forEach(match => {
      const matchWinner = match.winner || match._winner;
      if (matchWinner === playerA.playerId) aWins++;
      if (matchWinner === playerB.playerId) bWins++;
    });

    console.log(`🤝 승자승: ${playerA.playerName} vs ${playerB.playerName} → ${aWins}-${bWins}`);

    return bWins - aWins; // B가 더 많이 이기면 양수 (B가 앞순위)
  }

  /**
   * 🥇 플레이오프 자동 생성 (Cloud Function으로 서버 사이드 처리)
   * Phase 5.13: createPlayoffs Cloud Function 호출
   */
  private async createPlayoffs(leagueId: string): Promise<void> {
    try {
      console.log('⚡ [createPlayoffs] Calling Cloud Function...', { leagueId });

      const createPlayoffsFunction = httpsCallable(functions, 'createPlayoffs');

      const result = await createPlayoffsFunction({
        leagueId,
      });

      const response = result.data as {
        success: boolean;
        message: string;
        data?: {
          playoffType: string;
          matchCount: number;
          qualifiedPlayers: string[];
        };
      };

      if (!response.success) {
        throw new Error(response.message || 'Failed to create playoffs');
      }

      console.log('✅ [createPlayoffs] Cloud Function success', {
        playoffType: response.data?.playoffType,
        matchCount: response.data?.matchCount,
        qualifiedPlayers: response.data?.qualifiedPlayers,
      });

      console.log('🎉 플레이오프 생성 완료!');
    } catch (error) {
      console.error('❌ [createPlayoffs] Error:', error);
      throw error;
    }
  }

  /**
   * 🔧 임시 수정: createdBy 필드를 실제 사용자 ID로 수정
   */
  async fixLeagueCreatedBy(leagueId: string): Promise<void> {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      console.log('🔧 [FIX] Updating createdBy field for league:', leagueId);
      console.log('🔧 [FIX] Setting createdBy to:', auth.currentUser.uid);

      await updateDoc(doc(db, 'leagues', leagueId), {
        createdBy: auth.currentUser.uid,
        updatedAt: serverTimestamp(),
      });

      console.log('✅ [FIX] Successfully updated createdBy field');
    } catch (error) {
      console.error('❌ [FIX] Error updating createdBy field:', error);
      throw error;
    }
  }

  /**
   * 플레이오프 진출자 선정 (항상 상위 4명)
   */
  private selectPlayoffQualifiers(
    standings: import('../types/league').PlayerStanding[]
  ): import('../types/league').PlayerStanding[] {
    // 항상 상위 4명 선발 (부족하면 있는 만큼)
    return standings.slice(0, Math.min(4, standings.length));
  }

  /**
   * 플레이오프 매치 생성
   */
  private async generatePlayoffMatches(
    leagueId: string,
    qualifiedPlayers: import('../types/league').PlayerStanding[]
  ): Promise<import('../types/league').PlayoffMatch[]> {
    const now = Timestamp.now();
    const leagueRef = doc(db, 'leagues', leagueId);
    const playoffMatchesRef = collection(leagueRef, 'playoff_matches');

    // 레거시 모드: 2명만 있으면 결승전만 생성
    if (qualifiedPlayers.length < 4) {
      const finalMatch: import('../types/league').PlayoffMatch = {
        id: `playoff_final_${Date.now()}`,
        type: 'final',
        round: 1,
        player1Id: qualifiedPlayers[0]?.playerId || null,
        player2Id: qualifiedPlayers[1]?.playerId || null,
        player1Name: qualifiedPlayers[0]?.playerName || 'TBD',
        player2Name: qualifiedPlayers[1]?.playerName || 'TBD',
        status: 'scheduled',
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(playoffMatchesRef, finalMatch);
      return [{ ...finalMatch, id: docRef.id }];
    }

    // 4강 토너먼트 모드: 준결승 2 + 결승 1 + 3,4위전 1
    // ✅ Firestore doc ID를 미리 생성 (실제 ID!)
    const semi1Ref = doc(playoffMatchesRef); // 준결승 1 ref
    const semi2Ref = doc(playoffMatchesRef); // 준결승 2 ref
    const finalRef = doc(playoffMatchesRef); // 결승 ref
    const consolationRef = doc(playoffMatchesRef); // 3,4위전 ref

    const semi1Id = semi1Ref.id;
    const semi2Id = semi2Ref.id;
    const finalId = finalRef.id; // ✅ 실제 Firestore ID
    const consolationId = consolationRef.id; // ✅ 실제 Firestore ID

    console.log('🎯 [Playoff IDs]', { semi1Id, semi2Id, finalId, consolationId });

    const matches: import('../types/league').PlayoffMatch[] = [
      // 준결승 1: 1위 vs 4위
      {
        id: semi1Id, // ✅ 실제 Firestore ID
        type: 'semifinals' as const,
        isPlayoffMatch: true, // ✅ 플레이오프 매치 플래그
        round: 2,
        player1Id: qualifiedPlayers[0].playerId,
        player2Id: qualifiedPlayers[3].playerId,
        player1Name: qualifiedPlayers[0].playerName,
        player2Name: qualifiedPlayers[3].playerName,
        status: 'scheduled' as const,
        nextMatchForWinner: finalId,
        nextMatchForLoser: consolationId,
        nextMatchPositionForWinner: 'player1' as const,
        nextMatchPositionForLoser: 'player1' as const,
        createdAt: now,
        updatedAt: now,
      },
      // 준결승 2: 2위 vs 3위
      {
        id: semi2Id, // ✅ 실제 Firestore ID
        type: 'semifinals' as const,
        isPlayoffMatch: true, // ✅ 플레이오프 매치 플래그
        round: 2,
        player1Id: qualifiedPlayers[1].playerId,
        player2Id: qualifiedPlayers[2].playerId,
        player1Name: qualifiedPlayers[1].playerName,
        player2Name: qualifiedPlayers[2].playerName,
        status: 'scheduled' as const,
        nextMatchForWinner: finalId,
        nextMatchForLoser: consolationId,
        nextMatchPositionForWinner: 'player2' as const,
        nextMatchPositionForLoser: 'player2' as const,
        createdAt: now,
        updatedAt: now,
      },
      // 결승전 (선수 TBD)
      {
        id: finalId,
        type: 'final' as const,
        isPlayoffMatch: true, // ✅ 플레이오프 매치 플래그
        round: 1,
        player1Id: null,
        player2Id: null,
        player1Name: 'TBD',
        player2Name: 'TBD',
        status: 'pending' as const,
        nextMatchForWinner: null,
        nextMatchForLoser: null,
        createdAt: now,
        updatedAt: now,
      },
      // 3,4위 결정전 (선수 TBD)
      {
        id: consolationId,
        type: 'consolation' as const,
        isPlayoffMatch: true, // ✅ 플레이오프 매치 플래그
        round: 1,
        player1Id: null,
        player2Id: null,
        player1Name: 'TBD',
        player2Name: 'TBD',
        status: 'pending' as const,
        nextMatchForWinner: null,
        nextMatchForLoser: null,
        createdAt: now,
        updatedAt: now,
      },
    ];

    // Firestore에 저장 (setDoc으로 ID 지정)
    const matchesWithRefs = [
      { match: matches[0], ref: semi1Ref }, // 준결승 1
      { match: matches[1], ref: semi2Ref }, // 준결승 2
      { match: matches[2], ref: finalRef }, // 결승
      { match: matches[3], ref: consolationRef }, // 3,4위전
    ];

    const savedMatches: import('../types/league').PlayoffMatch[] = [];
    for (const { match, ref } of matchesWithRefs) {
      await setDoc(ref, match); // ✅ 지정한 ID로 저장!
      savedMatches.push(match);
      console.log(`✅ [Playoff Match Created] ${match.type} (${match.id})`);
    }

    console.log('✅ 4강 플레이오프 생성 완료:', savedMatches.length, '경기');
    return savedMatches;
  }

  /**
   * 플레이오프 매치 결과 업데이트 (자동 승진 시스템)
   * 🌉 [HEIMDALL] Phase 5.10: Cloud Function으로 마이그레이션 (Security Rules 우회)
   */
  async updatePlayoffMatchResult(
    leagueId: string,
    matchId: string,
    winnerId: string,
    score: { sets: import('../types/league').SetScore[]; finalScore: string }
  ): Promise<void> {
    try {
      console.log('🏆 [updatePlayoffMatchResult] Calling Cloud Function...');

      // Cloud Function 호출 (Admin SDK로 Security Rules 우회 + Atomic Transaction!)
      const updateResult = httpsCallable<
        {
          leagueId: string;
          matchId: string;
          winnerId: string;
          score: { sets: import('../types/league').SetScore[]; finalScore: string };
        },
        { success: boolean; message: string; data?: unknown }
      >(functions, 'updatePlayoffMatchResult');

      const result = await updateResult({ leagueId, matchId, winnerId, score });

      console.log('✅ [updatePlayoffMatchResult] Cloud Function result:', result.data);

      if (result.data.success) {
        console.log(`🎉 ${result.data.message}`);

        // 플레이오프 완료 체크 (Cloud Function 호출)
        await this.checkPlayoffCompletion(leagueId);
      }
    } catch (error) {
      console.error('❌ [updatePlayoffMatchResult] Error calling Cloud Function:', error);
      throw error;
    }
  }

  /**
   * 플레이오프 완료 체크 (3,4위 결정 포함)
   * 🌉 [HEIMDALL] Phase 5.9: Cloud Function으로 마이그레이션 (Security Rules 우회)
   */
  private async checkPlayoffCompletion(leagueId: string): Promise<void> {
    try {
      console.log('🔍 [checkPlayoffCompletion] Calling Cloud Function...');

      // Cloud Function 호출 (Admin SDK로 Security Rules 우회!)
      const checkCompletion = httpsCallable<
        { leagueId: string },
        { success: boolean; message: string; data?: unknown }
      >(functions, 'checkLeaguePlayoffCompletion');

      const result = await checkCompletion({ leagueId });

      console.log('✅ [checkPlayoffCompletion] Cloud Function result:', result.data);

      if (result.data.success) {
        console.log(`🎉 ${result.data.message}`);
      }
    } catch (error) {
      console.error('❌ [checkPlayoffCompletion] Error calling Cloud Function:', error);
    }
  }

  /**
   * 플레이오프 매치 목록 조회
   */
  async getPlayoffMatches(leagueId: string): Promise<PlayoffMatch[]> {
    try {
      const leagueRef = doc(db, 'leagues', leagueId);
      const playoffMatchesRef = collection(leagueRef, 'playoff_matches');
      const snapshot = await getDocs(playoffMatchesRef);

      const matches = snapshot.docs.map(doc => {
        const data = doc.data() as PlayoffMatch;
        return {
          ...data,
          id: doc.id,
        };
      }) as PlayoffMatch[];

      // 🔍 DEBUG: 읽어온 플레이오프 매치 로그
      console.log('🔍 [getPlayoffMatches] 총 매치 수:', matches.length);
      matches.forEach(m => {
        console.log(
          `🔍 [getPlayoffMatches] ID: ${m.id}, status: ${m.status}, type: ${m.type || 'N/A'}, round: ${m.round}`
        );
      });

      return matches;
    } catch (error) {
      console.error('Error getting playoff matches:', error);
      return [];
    }
  }

  /**
   * 플레이오프 결과로부터 챔피언 결정
   */
  private determineChampion(
    matches: import('../types/league').PlayoffMatch[]
  ): { playerId: string; playerName: string } | null {
    const finalMatch = matches.find(m => m.type === 'final' && m.status === 'completed');
    if (finalMatch && finalMatch.winner) {
      return {
        playerId: finalMatch.winner,
        playerName:
          finalMatch.winner === finalMatch.player1Id
            ? finalMatch.player1Name
            : finalMatch.player2Name,
      };
    }
    return null;
  }

  /**
   * 플레이오프 결과로부터 준우승자 결정
   */
  private determineRunnerUp(
    matches: import('../types/league').PlayoffMatch[]
  ): { playerId: string; playerName: string } | null {
    const finalMatch = matches.find(m => m.type === 'final' && m.status === 'completed');
    if (finalMatch && finalMatch.winner) {
      const runnerId =
        finalMatch.winner === finalMatch.player1Id ? finalMatch.player2Id : finalMatch.player1Id;

      // Ensure runnerId is not null before returning
      if (!runnerId) {
        return null;
      }

      return {
        playerId: runnerId,
        playerName:
          finalMatch.winner === finalMatch.player1Id
            ? finalMatch.player2Name
            : finalMatch.player1Name,
      };
    }
    return null;
  }

  /**
   * 다중 경기 결과 일괄 승인 (관리자용)
   */
  async bulkApproveMatchResults(
    leagueId: string,
    matchIds: string[]
  ): Promise<{
    successful: string[];
    failed: Array<{ matchId: string; error: string }>;
  }> {
    const successful: string[] = [];
    const failed: Array<{ matchId: string; error: string }> = [];

    console.log(`🔥 [leagueService] bulkApproveMatchResults called with:`, {
      leagueId,
      matchIds,
      count: matchIds.length,
    });

    for (const matchId of matchIds) {
      try {
        await this.approveMatchResult(leagueId, matchId);
        successful.push(matchId);
        console.log(`✅ [bulkApprove] Successfully approved match: ${matchId}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        failed.push({ matchId, error: errorMessage });
        console.error(`❌ [bulkApprove] Failed to approve match ${matchId}:`, error);
      }
    }

    console.log(`🏁 [bulkApprove] Bulk approval completed:`, {
      total: matchIds.length,
      successful: successful.length,
      failed: failed.length,
      successfulIds: successful,
      failedDetails: failed,
    });

    return { successful, failed };
  }

  /**
   * 관리자가 수동으로 참가자 추가
   * 🌉 [HEIMDALL] Phase 5.8: Migrated to Cloud Function
   */
  async addParticipantManually(
    leagueId: string,
    participantData: {
      userId: string;
      userDisplayName: string;
      userEmail?: string;
      userLtrLevel?: number;
      userProfileImage?: string;
    }
  ): Promise<void> {
    try {
      const addLeagueParticipant = httpsCallable<
        {
          leagueId: string;
          userId: string;
          userDisplayName: string;
          userEmail?: string;
          userLtrLevel?: number;
          userProfileImage?: string;
        },
        {
          success: boolean;
          message: string;
          data?: { participantId: string };
        }
      >(functions, 'addLeagueParticipant');

      const result = await addLeagueParticipant({
        leagueId,
        ...participantData,
      });

      if (!result.data.success) {
        throw new Error(result.data.message);
      }

      console.log('✅ Participant added via Cloud Function:', result.data.data?.participantId);
    } catch (error: unknown) {
      console.error('Error adding participant manually:', error);

      // Extract user-friendly message from Cloud Function error
      const errorCode = (error as { code?: string }).code;
      const errorMessage = (error as { message?: string }).message;

      if (errorCode === 'permission-denied') {
        throw new Error('Only club admins can add participants manually');
      } else if (errorCode === 'already-exists') {
        throw new Error('User is already a participant');
      } else if (errorCode === 'failed-precondition') {
        throw new Error(errorMessage || 'Cannot add participant to this league');
      } else {
        throw new Error(errorMessage || 'Failed to add participant');
      }
    }
  }

  /**
   * 관리자가 참가자 제거
   * @param leagueId - 리그 ID
   * @param userId - 제거할 참가자의 사용자 ID
   */
  async removeParticipant(leagueId: string, userId: string): Promise<void> {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      // 리그 정보 확인
      const league = await this.getLeague(leagueId);
      if (!league) {
        throw new Error('League not found');
      }

      // 권한 확인 (클럽 관리자 또는 리그 생성자만 가능)
      if (league.createdBy !== auth.currentUser.uid) {
        throw new Error('Only league creator or club admin can remove participants');
      }

      // 진행 중인 리그는 참가자 제거 불가
      if (
        league.status === 'ongoing' ||
        league.status === 'playoffs' ||
        league.status === 'completed'
      ) {
        throw new Error('Cannot remove participants from an active or completed league');
      }

      // participants 배열에서 제거
      const updatedParticipants = league.participants.filter(p => {
        const playerId = typeof p === 'object' ? p.playerId : p;
        return playerId !== userId;
      });

      // standings 배열에서 제거 (있다면)
      const updatedStandings = league.standings?.filter(s => s.playerId !== userId) || [];

      // Firestore 업데이트
      await updateDoc(doc(db, 'leagues', leagueId), {
        participants: updatedParticipants,
        standings: updatedStandings,
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Participant removed successfully:', userId);
    } catch (error) {
      console.error('Error removing participant:', error);
      throw error;
    }
  }

  /**
   * 관리자가 수동으로 복식 팀 추가 (Cloud Function 호출)
   * Server-Side Migration: Uses addLeagueTeam Cloud Function
   */
  async addDoublesTeamManually(
    leagueId: string,
    team: {
      player1Id: string;
      player2Id: string;
      player1Name: string;
      player2Name: string;
      teamName?: string;
    }
  ): Promise<void> {
    try {
      console.log('➕ [ADD_DOUBLES_TEAM] Calling addLeagueTeam Cloud Function', {
        leagueId,
        player1Id: team.player1Id,
        player2Id: team.player2Id,
      });

      // Call Cloud Function (supports direct addition without teamId)
      const addLeagueTeamFn = httpsCallable(functions, 'addLeagueTeam');
      const result = await addLeagueTeamFn({
        leagueId,
        player1Id: team.player1Id,
        player2Id: team.player2Id,
        player1Name: team.player1Name,
        player2Name: team.player2Name,
        teamName: team.teamName,
        // No teamId - direct addition mode
      });

      const responseData = result.data as { success: boolean; message: string };

      console.log('✅ [ADD_DOUBLES_TEAM] Cloud Function response:', responseData);

      if (!responseData.success) {
        throw new Error(responseData.message || 'Failed to add team');
      }

      console.log('✅ [ADD_DOUBLES_TEAM] Team added successfully via Cloud Function');
    } catch (error) {
      console.error('Error adding doubles team manually:', error);
      throw error;
    }
  }

  /**
   * Delete league (calls Cloud Function)
   */
  async deleteLeague(leagueId: string, reason?: string): Promise<void> {
    try {
      console.log('🗑️ [DELETE] Calling deleteLeague Cloud Function:', leagueId);

      const deleteLeagueFn = httpsCallable(functions, 'deleteLeague');
      const result = await deleteLeagueFn({ leagueId, reason });

      console.log('✅ [DELETE] League deleted successfully:', result.data);
    } catch (error) {
      console.error('❌ [DELETE] Error deleting league:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스 생성
const leagueService = new LeagueService();
export default leagueService;

// 🧪 개발자 도구용 전역 함수
if (__DEV__) {
  // React Native에서 전역 객체 접근
  const globalObj =
    typeof globalThis !== 'undefined'
      ? globalThis
      : typeof global !== 'undefined'
        ? global
        : typeof window !== 'undefined'
          ? window
          : {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalObj as any).fixLeagueCreatedBy = async (leagueId: string) => {
    try {
      console.log('🔧 [GLOBAL] fixLeagueCreatedBy called with:', leagueId);
      await leagueService.fixLeagueCreatedBy(leagueId);
    } catch (error) {
      console.error('❌ [GLOBAL] Error in fixLeagueCreatedBy:', error);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalObj as any).debugClubMembership = async (clubId: string, userId: string) => {
    try {
      console.log('🔍 [GLOBAL] debugClubMembership called with:', { clubId, userId });
      await leagueService.debugClubMembership(clubId, userId);
    } catch (error) {
      console.error('❌ [GLOBAL] Error in debugClubMembership:', error);
    }
  };

  // 직접 함수도 노출
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalObj as any).fixCreatedBy = (globalObj as any).fixLeagueCreatedBy;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalObj as any).checkMembership = (globalObj as any).debugClubMembership;

  console.log('🧪 [DEV] League debug functions available globally:');
  console.log('  - fixLeagueCreatedBy("LEAGUE_ID")');
  console.log('  - debugClubMembership("CLUB_ID", "USER_ID")');
  console.log('  - fixCreatedBy("LEAGUE_ID")');
  console.log('  - checkMembership("CLUB_ID", "USER_ID")');
  console.log('🧪 [DEV] Global object type:', typeof globalObj);
}
