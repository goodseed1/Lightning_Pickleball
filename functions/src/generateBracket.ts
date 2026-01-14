/**
 * 🌉 [HEIMDALL] Generate Tournament Bracket Cloud Function
 *
 * Phase 5.2: Server-Side Bracket Generation
 *
 * This Cloud Function generates tournament brackets on the server side,
 * ensuring data consistency and security.
 *
 * Features:
 * - Single Elimination bracket generation
 * - Doubles (Team-First 2.0) and Singles support
 * - BYE allocation (ATP/WTA standard)
 * - GPS Engine for dynamic match connections
 * - Team seed unification
 */

import { onCall, CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import {
  BracketMatch,
  BracketRound,
  BracketPositionStatus,
  TournamentParticipant,
  DoublesTeam,
  TournamentStatus,
  getRoundName,
} from './types/tournament';

// ============================================================================
// Request/Response Types
// ============================================================================

export interface GenerateBracketRequest {
  tournamentId: string;
}

export interface GenerateBracketResponse {
  success: boolean;
  message: string;
  data?: {
    tournamentId: string;
    totalMatches: number;
    totalRounds: number;
    bracketType: 'singles' | 'doubles';
    generatedAt: string;
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Remove undefined values from object (Firestore doesn't allow undefined)
 */
function removeUndefinedFields<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedFields(item)) as T;
  }

  if (typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    Object.entries(obj).forEach(([key, value]) => {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedFields(value);
      }
    });
    return cleaned as T;
  }

  return obj;
}

/**
 * 참가자를 복식 팀으로 그룹화
 */
function groupParticipantsIntoTeams(participants: TournamentParticipant[]): DoublesTeam[] {
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
 * 빈 매치 객체 생성 헬퍼 함수
 */
function createEmptyMatch(
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
  };
}

/**
 * 🗺️ GPS 엔진: 현재 매치의 다음 매치 동적 계산
 */
function calculateNextMatchDynamically(
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
      match =>
        (match.player1 && match.player1.status === 'bye') ||
        (match.player2 && match.player2.status === 'bye')
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

  // 다음 라운드에서 해당 매치 찾기
  if (nextRoundIndex >= bracket.length) {
    console.warn('⚠️ [GPS] Next round index out of bounds');
    return null;
  }

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
 * 🔗 이전 매치 참조 설정 (GPS 엔진 기반)
 */
function setupPreviousMatchReferences(matches: BracketMatch[], bracket: BracketRound[]): void {
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
        match.player1SourceMatchId = prevMatch1.id;
        match.player1SourcePosition = 'winner';
        console.log(`🔗 [GPS PREV] ${match.id} ← ${prevMatch1.id} (player1)`);
      }

      if (prevMatch2) {
        match.player2SourceMatchId = prevMatch2.id;
        match.player2SourcePosition = 'winner';
        console.log(`🔗 [GPS PREV] ${match.id} ← ${prevMatch2.id} (player2)`);
      }
    }
  });

  console.log('✅ [GPS] Previous match references established!');
}

/**
 * Perfect Bracket 매치 연결 설정 (GPS 엔진 기반)
 */
function setupPerfectBracketConnections(matches: BracketMatch[], bracket: BracketRound[]): void {
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
    const isGhostMatch = !match.player1 && !match.player2;

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
    // 🎯 이미 설정된 연결은 보존
    if (match.nextMatchId) {
      console.log(
        `🎯 [GPS PRESERVED] ${match.id} → ${match.nextMatchId} (${match.nextMatchPosition}) [Manual]`
      );
      return;
    }

    // GPS 엔진 호출하여 다음 매치 정보 계산
    const nextMatchInfo = calculateNextMatchDynamically(match, bracket);

    if (nextMatchInfo) {
      match.nextMatchId = nextMatchInfo.matchId;
      match.nextMatchPosition = nextMatchInfo.position;
      console.log(
        `🗺️ [GPS ROUTE] ${match.id} → ${nextMatchInfo.matchId} (${nextMatchInfo.position}) [Auto]`
      );
    } else {
      match.nextMatchId = undefined; // 결승전
      console.log(`🏆 [GPS FINAL] ${match.id} → CHAMPION!`);
    }
  });

  // 🔗 이전 매치 참조도 GPS 원리로 설정
  setupPreviousMatchReferences(activeMatches, bracket);

  console.log('✅ [GPS ENGINE] All connections established dynamically!');
}

/**
 * 🏆 선수 기반 브래킷 생성 (Singles Tournaments)
 */
function generatePlayerBasedBracket(
  tournamentId: string,
  players: TournamentParticipant[],
  playerCount: number
): { bracket: BracketRound[]; matches: BracketMatch[] } {
  console.log(`⚡ [THOR] Starting player-based bracket generation for ${playerCount} players`);

  // Bracket Size 계산 (5명 → 8, 6명 → 8, 9명 → 16)
  const M = Math.pow(2, Math.ceil(Math.log2(playerCount)));
  const totalRounds = Math.ceil(Math.log2(M));
  const numByes = M - playerCount;

  console.log(`⚡ [THOR] Bracket parameters:`, {
    playerCount,
    bracketSize: M,
    totalRounds,
    byes: numByes,
  });

  // 시드 순으로 정렬
  const sortedPlayers = [...players].sort((a, b) => (a.seed || 999) - (b.seed || 999));

  console.log(
    '⚡ [THOR] Players by seed:',
    sortedPlayers.map(p => `${p.playerName}(seed:${p.seed})`).join(', ')
  );

  const allMatches: BracketMatch[] = [];
  const bracket: BracketRound[] = [];
  let matchIdCounter = 1;

  // 🏆 BYE를 가진 선수와 첫 라운드에서 경기하는 선수 분리
  const playersWithByes = sortedPlayers.slice(0, numByes); // 높은 시드부터
  const playersInFirstRound = sortedPlayers.slice(numByes); // 나머지

  console.log(`⚡ [THOR] Players with BYEs: ${playersWithByes.map(p => p.playerName).join(', ')}`);
  console.log(
    `⚡ [THOR] Players in Round 1: ${playersInFirstRound.map(p => p.playerName).join(', ')}`
  );

  // Round 1 생성 (BYE가 아닌 선수들끼리 경기)
  if (playersInFirstRound.length > 0) {
    console.log(`⚡ [THOR Round 1] Creating matches for ${playersInFirstRound.length} players`);
    const round1Matches: BracketMatch[] = [];
    const firstRoundPairs = playersInFirstRound.length / 2;

    for (let i = 0; i < firstRoundPairs; i++) {
      const higherSeedPlayer = playersInFirstRound[i];
      const lowerSeedPlayer = playersInFirstRound[playersInFirstRound.length - 1 - i];

      const match = createEmptyMatch(tournamentId, matchIdCounter++, 1, i + 1);

      match.player1 = {
        playerId: higherSeedPlayer.playerId,
        playerName: higherSeedPlayer.playerName,
        seed: higherSeedPlayer.seed,
        status: 'filled' as BracketPositionStatus,
        profileImage: higherSeedPlayer.profileImage,
        skillLevel: higherSeedPlayer.skillLevel,
      };

      match.player2 = {
        playerId: lowerSeedPlayer.playerId,
        playerName: lowerSeedPlayer.playerName,
        seed: lowerSeedPlayer.seed,
        status: 'filled' as BracketPositionStatus,
        profileImage: lowerSeedPlayer.profileImage,
        skillLevel: lowerSeedPlayer.skillLevel,
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

  // Round 2+ 생성 (빈 슬롯 + BYE 선수 배치)
  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = M / Math.pow(2, round);
    const roundMatches: BracketMatch[] = [];

    console.log(`⚡ [THOR Round ${round}] Creating ${matchesInRound} match slots`);

    for (let i = 0; i < matchesInRound; i++) {
      const match = createEmptyMatch(tournamentId, matchIdCounter++, round, i + 1);

      // 🔧 [THOR] Round 2에서 BYE 선수 배치
      if (round === 2) {
        // player1에 BYE 선수 배치
        if (i < playersWithByes.length) {
          const byePlayer = playersWithByes[i];
          match.player1 = {
            playerId: byePlayer.playerId,
            playerName: byePlayer.playerName,
            seed: byePlayer.seed,
            status: 'bye' as BracketPositionStatus,
            profileImage: byePlayer.profileImage,
            skillLevel: byePlayer.skillLevel,
          };
          console.log(
            `  ⚡ R2M${i + 1}: ${byePlayer.playerName}(seed:${byePlayer.seed}) gets BYE (player1)`
          );
        }

        // player2에 BYE 선수 배치 (마지막 매치부터 역순으로)
        const reversedIndex = matchesInRound - 1 - i;
        const player2ByeIndex = matchesInRound + reversedIndex;
        if (player2ByeIndex < playersWithByes.length) {
          const byePlayer = playersWithByes[player2ByeIndex];
          match.player2 = {
            playerId: byePlayer.playerId,
            playerName: byePlayer.playerName,
            seed: byePlayer.seed,
            status: 'bye' as BracketPositionStatus,
            profileImage: byePlayer.profileImage,
            skillLevel: byePlayer.skillLevel,
          };
          console.log(
            `  ⚡ R2M${i + 1}: ${byePlayer.playerName}(seed:${byePlayer.seed}) gets BYE (player2)`
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
    `✅ [THOR] Player-based bracket complete: ${allMatches.length} matches, ${totalRounds} rounds`
  );

  // 🔧 FIX: Set nextMatch connections using GPS engine
  setupPerfectBracketConnections(allMatches, bracket);

  return { bracket, matches: allMatches };
}

/**
 * 🏆 팀 기반 브래킷 생성 (Doubles Tournaments)
 */
function generateTeamBasedBracket(
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

      const match = createEmptyMatch(tournamentId, matchIdCounter++, 1, i + 1);

      // 팀의 두 선수를 "팀명"으로 표시 (playerName에 팀명 저장)
      match.player1 = {
        playerId: higherSeedTeam.teamId,
        playerName: higherSeedTeam.teamName || '',
        seed: higherSeedTeam.seed,
        status: 'filled' as BracketPositionStatus,
      };

      match.player2 = {
        playerId: lowerSeedTeam.teamId,
        playerName: lowerSeedTeam.teamName || '',
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
      const match = createEmptyMatch(tournamentId, matchIdCounter++, round, i + 1);

      // 🔧 [THOR] Round 2에서 BYE 팀 배치 (ATP/WTA standard)
      // Top seeds wait for R1 winners, middle BYE seeds play each other
      if (round === 2) {
        // player1에 BYE 팀 배치 (순서대로)
        if (i < teamsWithByes.length) {
          const byeTeam = teamsWithByes[i];
          match.player1 = {
            playerId: byeTeam.teamId,
            playerName: byeTeam.teamName || '',
            seed: byeTeam.seed,
            status: 'bye' as BracketPositionStatus,
          };
          console.log(
            `  ⚡ R2M${i + 1}: ${byeTeam.teamName}(seed:${byeTeam.seed}) gets BYE (player1)`
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
            playerName: byeTeam.teamName || '',
            seed: byeTeam.seed,
            status: 'bye' as BracketPositionStatus,
          };
          console.log(
            `  ⚡ R2M${i + 1}: ${byeTeam.teamName}(seed:${byeTeam.seed}) gets BYE (player2)`
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

  // 🔧 FIX: Set nextMatch connections using GPS engine
  setupPerfectBracketConnections(allMatches, bracket);

  return { bracket, matches: allMatches };
}

// ============================================================================
// Cloud Function
// ============================================================================

/**
 * 🚀 Generate Tournament Bracket (Cloud Function)
 *
 * This function generates a tournament bracket on the server side.
 *
 * @param request - GenerateBracketRequest
 * @returns GenerateBracketResponse
 */
export const generateBracket = onCall<GenerateBracketRequest>(
  async (request: CallableRequest<GenerateBracketRequest>): Promise<GenerateBracketResponse> => {
    const db = getFirestore();
    const { tournamentId } = request.data;

    console.log('🌉 [HEIMDALL] generateBracket called:', { tournamentId });

    // Validate request
    if (!tournamentId) {
      throw new HttpsError('invalid-argument', 'tournamentId is required');
    }

    try {
      // Fetch tournament
      const tournamentRef = db.collection('tournaments').doc(tournamentId);
      const tournamentSnap = await tournamentRef.get();

      if (!tournamentSnap.exists) {
        throw new HttpsError('not-found', `Tournament ${tournamentId} not found`);
      }

      const tournament = tournamentSnap.data();
      if (!tournament) {
        throw new HttpsError('internal', 'Tournament data is empty');
      }

      console.log('📊 [HEIMDALL] Tournament loaded:', {
        name: tournament.title,
        format: tournament.format,
        eventType: tournament.eventType,
        status: tournament.status,
      });

      // Check if tournament is in correct status
      if (tournament.status !== 'registration' && tournament.status !== 'bracket_generation') {
        throw new HttpsError(
          'failed-precondition',
          `Cannot generate bracket for tournament in status: ${tournament.status}`
        );
      }

      // Fetch participants from tournament document (array field)
      // Note: addTournamentParticipant stores in tournament.participants array
      const participants: TournamentParticipant[] = (tournament.participants ||
        []) as TournamentParticipant[];

      console.log('📊 [HEIMDALL] Participants loaded:', participants.length);

      if (participants.length === 0) {
        throw new HttpsError('failed-precondition', 'Cannot generate bracket with 0 participants');
      }

      // Determine bracket type (singles vs doubles)
      const isDoubles = tournament.eventType.includes('doubles');
      const bracketType = isDoubles ? 'doubles' : 'singles';

      console.log('🎯 [HEIMDALL] Bracket type:', bracketType);

      let bracket: BracketRound[];
      let matches: BracketMatch[];

      if (isDoubles) {
        // 🏆 Doubles: Team-First 2.0 Architecture
        console.log('🎾 [HEIMDALL] Generating doubles (team-based) bracket...');

        const teams = groupParticipantsIntoTeams(participants);
        const teamCount = teams.length;

        if (teamCount === 0) {
          throw new HttpsError(
            'failed-precondition',
            'Cannot generate bracket: no valid teams found'
          );
        }

        const result = generateTeamBasedBracket(tournamentId, teams, teamCount);
        bracket = result.bracket;
        matches = result.matches;
      } else {
        // 🏆 Singles: Player-based bracket
        console.log('🎾 [HEIMDALL] Generating singles (player-based) bracket...');

        const result = generatePlayerBasedBracket(tournamentId, participants, participants.length);
        bracket = result.bracket;
        matches = result.matches;
      }

      console.log('✅ [HEIMDALL] Bracket generated:', {
        totalRounds: bracket.length,
        totalMatches: matches.length,
      });

      // Save bracket to Firestore
      console.log('💾 [HEIMDALL] Saving bracket to Firestore...');

      // Remove undefined values (Firestore doesn't allow undefined)
      const cleanedBracket = removeUndefinedFields(
        bracket.map(round => ({
          roundNumber: round.roundNumber,
          roundName: round.roundName,
          matches: round.matches,
          isCompleted: round.isCompleted,
        }))
      );

      // Update tournament with bracket
      await tournamentRef.update({
        bracket: cleanedBracket,
        status: 'in_progress' as TournamentStatus,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Save individual matches to subcollection
      const batch = db.batch();
      matches.forEach(match => {
        const matchRef = tournamentRef.collection('matches').doc(match.id);
        const cleanedMatch = removeUndefinedFields(match);
        batch.set(matchRef, cleanedMatch);
      });
      await batch.commit();

      console.log('✅ [HEIMDALL] Bracket saved to Firestore!');

      return {
        success: true,
        message: 'Bracket generated successfully',
        data: {
          tournamentId,
          totalMatches: matches.length,
          totalRounds: bracket.length,
          bracketType,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('❌ [HEIMDALL] Error generating bracket:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', `Failed to generate bracket: ${(error as Error).message}`);
    }
  }
);
