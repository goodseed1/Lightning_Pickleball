/**
 * 🌐 Submit Public Match Result Cloud Function
 *
 * Submits lightning match result and updates player statistics
 * Separated by match type: singles, doubles, mixed_doubles
 *
 * @author Kim (Phase 2)
 * @date 2025-11-23
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { calculatePublicElo, extractMatchType } from './utils/publicEloCalculator';
import { checkAllMatchBadges } from './utils/matchBadgeChecker';

const db = admin.firestore();

interface SetScore {
  player1Games: number;
  player2Games: number;
}

interface ApprovedApplication {
  id: string;
  applicantId: string;
  applicantName: string;
  teamId?: string;
  partnerId?: string;
  partnerName?: string; // 🎯 [KIM FIX] 도전팀 파트너 이름
  userId?: string;
  type?: string; // 🎯 [KIM FIX] 'partner_invitation' = 호스트 파트너 (상대팀 아님!)
}

interface SubmitPublicMatchResultRequest {
  eventId: string;
  hostId: string;
  gameType: 'mens_singles' | 'womens_singles' | 'mixed_doubles' | 'mens_doubles' | 'womens_doubles';
  sets: SetScore[];
  winnerId: string;
  finalScore: string;

  // 복식인 경우
  hostPartnerId?: string;
  opponentId: string;
  opponentPartnerId?: string;
}

interface SubmitPublicMatchResultResponse {
  success: boolean;
  message: string;
  data?: {
    eventId: string;
    matchType: string;
    eloChanges: {
      host: number;
      opponent: number;
    };
  };
}

/**
 * Submit Public Match Result Cloud Function
 *
 * Security:
 * - Must be authenticated
 * - Only host can submit score
 * - Validates participant structure (singles: 1, doubles: 2 with teamId)
 *
 * Operations:
 * 1. Validate event and participants
 * 2. Calculate match type specific ELO
 * 3. Update player statistics (separated by match type)
 * 4. Update event matchResult
 * 5. Record match history
 */
export const submitPublicMatchResult = onCall<
  SubmitPublicMatchResultRequest,
  Promise<SubmitPublicMatchResultResponse>
>(async request => {
  const { data, auth } = request;
  const { eventId, hostId, gameType, sets, winnerId, finalScore } = data;

  // Step 1: Authentication
  if (!auth || !auth.uid) {
    throw new HttpsError('unauthenticated', 'You must be logged in');
  }

  if (auth.uid !== hostId) {
    throw new HttpsError('permission-denied', 'Only host can submit score');
  }

  logger.info('⚡ [SUBMIT_PUBLIC_MATCH] Starting', {
    eventId,
    hostId,
    gameType,
    winnerId,
  });

  try {
    // Step 2: Get Event
    const eventRef = db.collection('events').doc(eventId);
    const eventSnap = await eventRef.get();

    if (!eventSnap.exists) {
      throw new HttpsError('not-found', 'Event not found');
    }

    const eventData = eventSnap.data()!;

    // 🆕 [3개월 규칙] Check if this is a ranked match
    // If isRankedMatch is not set (legacy events), default to true for backward compatibility
    const isRankedMatch = eventData.isRankedMatch !== false;

    logger.info('📊 [SUBMIT_PUBLIC_MATCH] Match type check', {
      eventId,
      isRankedMatch,
      gameType: eventData.gameType,
      cooldownWarning: eventData.cooldownWarning || null,
    });

    // Step 3: Get approved participants from flat collection
    logger.info('📋 [SUBMIT_PUBLIC_MATCH] Reading participation_applications flat collection', {
      eventId,
    });

    const applicationsSnap = await db
      .collection('participation_applications')
      .where('eventId', '==', eventId)
      .where('status', '==', 'approved')
      .get();

    const allApproved = applicationsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ApprovedApplication[];

    // 🎯 [KIM FIX] Filter out host partner applications to prevent double counting!
    // - partner_invitation type: Host partner who accepted invitation
    // - Also filter by hostPartnerId in case type is missing
    const approved = allApproved.filter(app => {
      // Exclude partner_invitation type (host partner)
      if (app.type === 'partner_invitation') {
        logger.info('🚫 [KIM FIX] Filtering out host partner from opponents:', {
          applicantId: app.applicantId,
          type: app.type,
        });
        return false;
      }
      // Exclude if applicantId matches hostPartnerId (safety check)
      if (data.hostPartnerId && app.applicantId === data.hostPartnerId) {
        logger.info('🚫 [KIM FIX] Filtering out hostPartnerId from opponents:', {
          applicantId: app.applicantId,
          hostPartnerId: data.hostPartnerId,
        });
        return false;
      }
      return true;
    });

    logger.info('✅ [SUBMIT_PUBLIC_MATCH] Approved participants loaded', {
      eventId,
      totalApproved: allApproved.length,
      filteredApproved: approved.length,
      participants: approved.map(a => ({
        applicantId: a.applicantId,
        applicantName: a.applicantName,
        teamId: a.teamId,
        partnerId: a.partnerId,
        type: a.type,
      })),
    });

    // Step 4: Validate participants
    const isSingles = gameType.includes('singles');

    if (isSingles) {
      // Singles: exactly 1 approved participant
      if (approved.length !== 1) {
        throw new HttpsError(
          'failed-precondition',
          `Singles match requires exactly 1 opponent (found ${approved.length})`
        );
      }
    } else {
      // 🎯 [KIM FIX] Doubles: 1개(신규 포맷) 또는 2개(레거시 포맷) 허용
      // 신규 포맷: 1개의 신청에 partnerId 포함
      // 레거시 포맷: 2개의 신청 (teamId로 연결되거나 동시 승인)
      if (approved.length === 0) {
        throw new HttpsError(
          'failed-precondition',
          'Doubles match requires at least 1 approved team'
        );
      }

      // 1개의 신청인 경우: partnerId가 있으면 유효한 복식 팀
      if (approved.length === 1) {
        const app = approved[0];
        if (!app.partnerId) {
          logger.warn('⚠️ [SUBMIT_PUBLIC_MATCH] Single application without partnerId for doubles', {
            applicantId: app.applicantId,
          });
          // partnerId 없어도 진행 허용 (데이터 마이그레이션 케이스)
        }
      }

      // 2개의 신청인 경우: teamId 체크는 선택적 (레거시 데이터 허용)
      if (approved.length === 2) {
        const [app1, app2] = approved;
        // teamId가 있으면 체크, 없으면 건너뜀 (레거시 호환)
        if (app1.teamId && app2.teamId && app1.teamId !== app2.teamId) {
          throw new HttpsError(
            'failed-precondition',
            'Invalid team structure: participants must be from same team'
          );
        }
        logger.info('✅ [SUBMIT_PUBLIC_MATCH] Legacy format: 2 approved applications', {
          app1: app1.applicantName,
          app2: app2.applicantName,
        });
      }
    }

    // Step 4: Extract match type
    const matchType = extractMatchType(gameType);

    logger.info('📊 [SUBMIT_PUBLIC_MATCH] Match validated', {
      matchType,
      participantCount: approved.length,
      isSingles,
    });

    // Step 5: Calculate match statistics
    let player1Games = 0;
    let player2Games = 0;
    let player1Sets = 0;
    let player2Sets = 0;

    for (const set of sets) {
      player1Games += set.player1Games;
      player2Games += set.player2Games;

      if (set.player1Games > set.player2Games) {
        player1Sets++;
      } else {
        player2Sets++;
      }
    }

    // 🔥 [KIM FIX] winnerId가 호스트팀(host 또는 hostPartner)에 속하는지 확인
    // winnerId가 hostId 또는 hostPartnerId이면 호스트팀 승리
    const hostTeamPlayerIds = [hostId, data.hostPartnerId].filter(Boolean);
    const isHostWinner = hostTeamPlayerIds.includes(winnerId);

    logger.info('📊 [SUBMIT_PUBLIC_MATCH] Winner calculation', {
      winnerId,
      hostId,
      hostPartnerId: data.hostPartnerId,
      hostTeamPlayerIds,
      isHostWinner,
    });

    // Step 6: Calculate ELO
    const eloResult = await calculatePublicElo({
      matchId: eventId,
      matchType,
      date: admin.firestore.Timestamp.now(),
      player1Id: hostId,
      player1Name: eventData.hostName,
      player1PartnerId: data.hostPartnerId,
      player1PartnerName: eventData.hostPartnerName,
      player2Id: data.opponentId,
      player2Name: approved[0].applicantName,
      player2PartnerId: data.opponentPartnerId,
      // 🎯 [KIM FIX] 신규/레거시 포맷 모두 지원
      player2PartnerName:
        approved.length >= 2 ? approved[1].applicantName : approved[0]?.partnerName || undefined,
      winnerId,
      score: finalScore,
      recordedBy: hostId,
    });

    if (!eloResult.success) {
      throw new HttpsError('internal', `ELO calculation failed: ${eloResult.error}`);
    }

    // Step 7: Generate finalScore from sets (e.g., "6-3, 6-3")
    const generatedFinalScore =
      finalScore || sets.map(set => `${set.player1Games}-${set.player2Games}`).join(', ');

    logger.info('📊 [SUBMIT_PUBLIC_MATCH] Generated final score', {
      eventId,
      providedFinalScore: finalScore,
      generatedFinalScore,
    });

    // Step 8: Update player statistics (match type specific!)
    const batch = db.batch();

    // 🆕 [3개월 규칙] Only update stats for ranked matches
    if (isRankedMatch) {
      // 🎯 [KIM FIX] Host team statistics (host + partner for doubles)
      const hostTeamIds = [hostId];
      if (!isSingles && data.hostPartnerId) {
        hostTeamIds.push(data.hostPartnerId);
      }

      hostTeamIds.forEach(uid => {
        const hostRef = db.collection('users').doc(uid);
        batch.update(hostRef, {
          // ✨ Global stats (for UI aggregation)
          'stats.wins': isHostWinner
            ? admin.firestore.FieldValue.increment(1)
            : admin.firestore.FieldValue.increment(0),
          'stats.losses': !isHostWinner
            ? admin.firestore.FieldValue.increment(1)
            : admin.firestore.FieldValue.increment(0),
          // 🎯 [KIM FIX] Add lastMatchDate and matchesPlayed for ranking calculations
          'stats.lastMatchDate': new Date().toISOString(),
          'stats.matchesPlayed': admin.firestore.FieldValue.increment(1),
          'stats.publicMatches': admin.firestore.FieldValue.increment(1),

          // 📊 Match type specific stats
          [`stats.publicStats.${matchType}.matchesPlayed`]: admin.firestore.FieldValue.increment(1),
          [`stats.publicStats.${matchType}.wins`]: isHostWinner
            ? admin.firestore.FieldValue.increment(1)
            : admin.firestore.FieldValue.increment(0),
          [`stats.publicStats.${matchType}.losses`]: !isHostWinner
            ? admin.firestore.FieldValue.increment(1)
            : admin.firestore.FieldValue.increment(0),
          [`stats.publicStats.${matchType}.setsWon`]:
            admin.firestore.FieldValue.increment(player1Sets),
          [`stats.publicStats.${matchType}.setsLost`]:
            admin.firestore.FieldValue.increment(player2Sets),
          [`stats.publicStats.${matchType}.gamesWon`]:
            admin.firestore.FieldValue.increment(player1Games),
          [`stats.publicStats.${matchType}.gamesLost`]:
            admin.firestore.FieldValue.increment(player2Games),
          [`stats.publicStats.${matchType}.elo`]: eloResult.player1NewElo,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      logger.info('📊 [SUBMIT_PUBLIC_MATCH] Host team stats updated', {
        hostTeamIds,
        matchType,
        isHostWinner,
      });

      // Opponent(s) statistics
      // 🎯 [KIM FIX] 신규 포맷(1개 신청 + partnerId) 및 레거시 포맷(2개 신청) 모두 지원
      // 🔥 [KIM FIX] data.opponentPartnerId를 fallback으로 사용 (Firestore에 partnerId가 없는 경우)
      let opponentIds: string[];
      if (isSingles) {
        opponentIds = [approved[0].applicantId];
      } else {
        // 복식: approved[0] + partnerId(신규) 또는 approved[0] + approved[1](레거시)
        if (approved.length >= 2) {
          // 레거시 포맷: 2개의 신청
          opponentIds = [approved[0].applicantId, approved[1].applicantId];
        } else {
          // 신규 포맷: 1개의 신청 + partnerId (Firestore 또는 request에서)
          opponentIds = [approved[0].applicantId];
          // 🔥 [KIM FIX] approved[0].partnerId 우선, 없으면 data.opponentPartnerId 사용
          const partnerId = approved[0].partnerId || data.opponentPartnerId;
          if (partnerId) {
            opponentIds.push(partnerId);
          }
        }
      }
      // undefined 필터링
      opponentIds = opponentIds.filter((id): id is string => id !== undefined && id !== null);

      logger.info('📊 [SUBMIT_PUBLIC_MATCH] Opponent team IDs', {
        opponentIds,
        approvedPartnerId: approved[0]?.partnerId,
        dataOpponentPartnerId: data.opponentPartnerId,
      });

      opponentIds.forEach(uid => {
        const opponentRef = db.collection('users').doc(uid);
        batch.update(opponentRef, {
          // ✨ Global stats (for UI aggregation)
          'stats.wins': !isHostWinner
            ? admin.firestore.FieldValue.increment(1)
            : admin.firestore.FieldValue.increment(0),
          'stats.losses': isHostWinner
            ? admin.firestore.FieldValue.increment(1)
            : admin.firestore.FieldValue.increment(0),
          // 🎯 [KIM FIX] Add lastMatchDate and matchesPlayed for ranking calculations
          'stats.lastMatchDate': new Date().toISOString(),
          'stats.matchesPlayed': admin.firestore.FieldValue.increment(1),
          'stats.publicMatches': admin.firestore.FieldValue.increment(1),

          // 📊 Match type specific stats
          [`stats.publicStats.${matchType}.matchesPlayed`]: admin.firestore.FieldValue.increment(1),
          [`stats.publicStats.${matchType}.wins`]: !isHostWinner
            ? admin.firestore.FieldValue.increment(1)
            : admin.firestore.FieldValue.increment(0),
          [`stats.publicStats.${matchType}.losses`]: isHostWinner
            ? admin.firestore.FieldValue.increment(1)
            : admin.firestore.FieldValue.increment(0),
          [`stats.publicStats.${matchType}.setsWon`]:
            admin.firestore.FieldValue.increment(player2Sets),
          [`stats.publicStats.${matchType}.setsLost`]:
            admin.firestore.FieldValue.increment(player1Sets),
          [`stats.publicStats.${matchType}.gamesWon`]:
            admin.firestore.FieldValue.increment(player2Games),
          [`stats.publicStats.${matchType}.gamesLost`]:
            admin.firestore.FieldValue.increment(player1Games),
          [`stats.publicStats.${matchType}.elo`]: eloResult.player2NewElo,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });
    } else {
      // 🆕 [3개월 규칙] 친선경기: 통계 업데이트 건너뜀
      logger.info('⚠️ [SUBMIT_PUBLIC_MATCH] Friendly match - skipping stats update', {
        eventId,
        reason: 'isRankedMatch === false',
        cooldownWarning: eventData.cooldownWarning || null,
      });
    }

    // Update event matchResult and mark as completed
    // 🎯 [KIM FIX] undefined 값 방지를 위해 조건부 필드 추가
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventUpdate: Record<string, any> = {
      status: 'completed',
      matchResult: {
        score: {
          sets,
          finalScore: generatedFinalScore,
        },
        winnerId,
        hostResult: isHostWinner ? 'win' : 'loss',
        opponentResult: isHostWinner ? 'loss' : 'win',
        submittedAt: admin.firestore.FieldValue.serverTimestamp(),
        submittedBy: hostId,
        // 🆕 [3개월 규칙] Track whether stats were updated
        eloProcessed: isRankedMatch, // 친선경기면 false
        isRankedMatch, // 플래그 저장
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // 조건부 필드 추가 (undefined 방지)
    if (eventData.hostName) {
      eventUpdate.hostName = eventData.hostName;
    }
    if (approved[0]?.applicantName) {
      eventUpdate.applicantName = approved[0].applicantName;
    }

    // 🎯 [KIM FIX] Save opponent team info for PastEventCard display
    // Without these fields, PastEventCard cannot correctly show challenger team names
    if (approved[0]?.applicantId) {
      eventUpdate.applicantId = approved[0].applicantId;
    }

    // For doubles: save opponent partner info
    if (!isSingles) {
      // New format: single application with partnerId
      if (approved[0]?.partnerId) {
        eventUpdate.opponentPartnerId = approved[0].partnerId;
      }
      if (approved[0]?.partnerName) {
        eventUpdate.opponentPartnerName = approved[0].partnerName;
      }
      // Legacy format: 2 approved applications (second one is partner)
      if (approved.length >= 2) {
        eventUpdate.opponentPartnerId = approved[1].applicantId;
        eventUpdate.opponentPartnerName = approved[1].applicantName;
      }
      // Fallback: use request data if not in approved applications
      if (!eventUpdate.opponentPartnerId && data.opponentPartnerId) {
        eventUpdate.opponentPartnerId = data.opponentPartnerId;
      }
    }

    logger.info('📝 [SUBMIT_PUBLIC_MATCH] Saving opponent team info to event', {
      applicantId: eventUpdate.applicantId,
      applicantName: eventUpdate.applicantName,
      opponentPartnerId: eventUpdate.opponentPartnerId,
      opponentPartnerName: eventUpdate.opponentPartnerName,
    });

    batch.update(eventRef, eventUpdate);

    await batch.commit();

    // 🏅 [PROJECT OLYMPUS] Check and award badges for all players
    // Only for ranked matches
    if (isRankedMatch) {
      logger.info('🏅 [BADGE] Checking match badges for all players...');

      // Collect all player IDs
      const allPlayerIds = new Set<string>();

      // Host team
      allPlayerIds.add(hostId);
      if (!isSingles && data.hostPartnerId) {
        allPlayerIds.add(data.hostPartnerId);
      }

      // Opponent team
      if (isSingles) {
        allPlayerIds.add(approved[0].applicantId);
      } else {
        allPlayerIds.add(approved[0].applicantId);
        if (approved.length >= 2) {
          allPlayerIds.add(approved[1].applicantId);
        } else if (approved[0].partnerId) {
          allPlayerIds.add(approved[0].partnerId);
        } else if (data.opponentPartnerId) {
          allPlayerIds.add(data.opponentPartnerId);
        }
      }

      // Check badges for each player
      for (const playerId of allPlayerIds) {
        try {
          // Determine if this player won
          const playerIsWinner = hostTeamPlayerIds.includes(playerId)
            ? isHostWinner
            : !isHostWinner;

          const awardedBadges = await checkAllMatchBadges(playerId, playerIsWinner, eventId);

          if (awardedBadges.length > 0) {
            logger.info(`🏅 [BADGE] Awarded ${awardedBadges.length} badge(s) to ${playerId}:`, {
              badges: awardedBadges,
            });
          }
        } catch (badgeError) {
          logger.error(`❌ [BADGE] Failed to check badges for ${playerId}:`, badgeError);
          // Continue to next player even if badge check fails
        }
      }

      logger.info('✅ [BADGE] Match badge checking completed!');

      // 🏅 [PROJECT OLYMPUS] Check Lightning Host badges for the host
      try {
        logger.info('🏅 [BADGE] Checking Lightning Host badges for host...');
        const { checkLightningHostBadges } = await import('./utils/clubBadgeChecker');

        const hostBadges = await checkLightningHostBadges(
          hostId,
          eventData.clubId,
          eventData.clubName
        );

        if (hostBadges.length > 0) {
          logger.info(
            `🏅 [BADGE] Awarded ${hostBadges.length} Lightning Host badge(s) to ${hostId}:`,
            {
              badges: hostBadges,
            }
          );
        }
      } catch (hostBadgeError) {
        logger.error(
          `❌ [BADGE] Failed to check Lightning Host badges for ${hostId}:`,
          hostBadgeError
        );
        // Continue even if badge check fails
      }
    }

    logger.info('✅ [SUBMIT_PUBLIC_MATCH] Match result submitted successfully', {
      eventId,
      matchType,
      hostEloChange: eloResult.player1EloChange,
      opponentEloChange: eloResult.player2EloChange,
    });

    return {
      success: true,
      message: 'Match result submitted successfully',
      data: {
        eventId,
        matchType,
        eloChanges: {
          host: eloResult.player1EloChange,
          opponent: eloResult.player2EloChange,
        },
      },
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    logger.error('❌ [SUBMIT_PUBLIC_MATCH] Unexpected error', {
      eventId,
      error: error instanceof Error ? error.message : String(error),
    });

    throw new HttpsError(
      'internal',
      `Failed to submit match result: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});
