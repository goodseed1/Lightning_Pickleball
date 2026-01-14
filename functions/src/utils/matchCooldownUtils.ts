/**
 * 🚫 [MATCH COOLDOWN] 분기별 중복 매치 방지 유틸리티
 *
 * 같은 상대/팀과 같은 분기 내 기록경기를 방지하는 규칙 검증
 * - 분기: Q1(1-3월), Q2(4-6월), Q3(7-9월), Q4(10-12월)
 * - 분기가 바뀌면 쿨다운 리셋
 * - 단식: 같은 상대와 같은 분기 내 매치 불가
 * - 복식: 같은 팀 조합 같은 분기 내 매치 불가
 *
 * @author Kim
 * @date 2025-12-11
 * @updated 2026-01-07 - Changed to quarter-based cooldown
 */

import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions/v2';

const db = admin.firestore();

export interface RecentMatchResult {
  hasMatch: boolean;
  lastMatchDate?: Date;
  eventId?: string;
}

/**
 * 팀 ID 정규화 (순서 무관하게 같은 팀 식별)
 * 예: (user_002, user_001) → "user_001_user_002"
 */
export function normalizeTeamId(player1: string, player2: string): string {
  return [player1, player2].sort().join('_');
}

/**
 * 현재 분기의 시작 날짜 계산
 * Q1: 1/1, Q2: 4/1, Q3: 7/1, Q4: 10/1
 *
 * @returns 현재 분기의 첫날 (00:00:00)
 */
export function getCurrentQuarterStartDate(): Date {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const year = now.getFullYear();

  // 분기 계산 (0-2 → Q1, 3-5 → Q2, 6-8 → Q3, 9-11 → Q4)
  const quarterStartMonth = Math.floor(month / 3) * 3; // 0, 3, 6, 9

  return new Date(year, quarterStartMonth, 1, 0, 0, 0, 0);
}

/**
 * 현재 분기 번호 반환 (Q1, Q2, Q3, Q4)
 */
export function getCurrentQuarter(): string {
  const month = new Date().getMonth(); // 0-11
  return `Q${Math.floor(month / 3) + 1}`;
}

/**
 * 분기별 같은 상대와의 단식 매치 이력 확인
 *
 * @param userId1 - 첫 번째 플레이어 ID
 * @param userId2 - 두 번째 플레이어 ID
 * @param monthsBack - (Deprecated) 하위 호환성을 위해 유지하나 실제로는 분기 기반으로 동작
 * @returns 매치 이력 존재 여부 및 마지막 매치 날짜
 */
export async function hasRecentSinglesMatch(
  userId1: string,
  userId2: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  monthsBack: number = 3 // 하위 호환성 유지, 실제로는 무시됨
): Promise<RecentMatchResult> {
  // 분기 시작일부터 체크
  const cutoffDate = getCurrentQuarterStartDate();

  logger.info('🔍 [COOLDOWN] Checking singles match history (quarter-based)', {
    userId1,
    userId2,
    currentQuarter: getCurrentQuarter(),
    quarterStartDate: cutoffDate.toISOString(),
  });

  try {
    // 1. userId1이 호스트인 경우
    const asHostQuery = await db
      .collection('events')
      .where('hostId', '==', userId1)
      .where('status', '==', 'completed')
      .where('gameType', 'in', ['mens_singles', 'womens_singles'])
      .where('updatedAt', '>=', admin.firestore.Timestamp.fromDate(cutoffDate))
      .get();

    // matchResult.opponentId 또는 관련 필드로 userId2 확인
    for (const doc of asHostQuery.docs) {
      const data = doc.data();
      // opponentId 필드 확인 (matchResult 또는 루트 레벨)
      const opponentId = data.matchResult?.opponentId || data.opponentId || data.applicantId;

      if (opponentId === userId2) {
        const lastMatchDate = data.updatedAt?.toDate() || new Date();
        logger.info('✅ [COOLDOWN] Found recent singles match (as host)', {
          eventId: doc.id,
          lastMatchDate: lastMatchDate.toISOString(),
        });
        return {
          hasMatch: true,
          lastMatchDate,
          eventId: doc.id,
        };
      }
    }

    // 2. userId2가 호스트인 경우 (역방향 확인)
    const asOpponentQuery = await db
      .collection('events')
      .where('hostId', '==', userId2)
      .where('status', '==', 'completed')
      .where('gameType', 'in', ['mens_singles', 'womens_singles'])
      .where('updatedAt', '>=', admin.firestore.Timestamp.fromDate(cutoffDate))
      .get();

    for (const doc of asOpponentQuery.docs) {
      const data = doc.data();
      const opponentId = data.matchResult?.opponentId || data.opponentId || data.applicantId;

      if (opponentId === userId1) {
        const lastMatchDate = data.updatedAt?.toDate() || new Date();
        logger.info('✅ [COOLDOWN] Found recent singles match (as opponent)', {
          eventId: doc.id,
          lastMatchDate: lastMatchDate.toISOString(),
        });
        return {
          hasMatch: true,
          lastMatchDate,
          eventId: doc.id,
        };
      }
    }

    logger.info('❌ [COOLDOWN] No recent singles match found', {
      userId1,
      userId2,
    });

    return { hasMatch: false };
  } catch (error) {
    logger.error('❌ [COOLDOWN] Error checking singles match history', {
      error: error instanceof Error ? error.message : String(error),
    });
    // 에러 시 안전하게 false 반환 (기록경기로 진행 허용)
    return { hasMatch: false };
  }
}

/**
 * 분기별 같은 팀 조합 복식 매치 이력 확인
 *
 * 팀 ID를 정규화하여 순서와 관계없이 같은 팀으로 인식
 * 예: [A,B] vs [C,D] = [B,A] vs [D,C] (같은 매치)
 *
 * @param hostTeam - 호스트 팀 [player1Id, player2Id]
 * @param guestTeam - 게스트 팀 [player1Id, player2Id]
 * @param monthsBack - (Deprecated) 하위 호환성을 위해 유지하나 실제로는 분기 기반으로 동작
 * @returns 매치 이력 존재 여부 및 마지막 매치 날짜
 */
export async function hasRecentDoublesMatch(
  hostTeam: [string, string],
  guestTeam: [string, string],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  monthsBack: number = 3 // 하위 호환성 유지, 실제로는 무시됨
): Promise<RecentMatchResult> {
  // 분기 시작일부터 체크
  const cutoffDate = getCurrentQuarterStartDate();

  // 팀 ID 정규화 (순서 무관)
  const normalizedHostTeam = normalizeTeamId(hostTeam[0], hostTeam[1]);
  const normalizedGuestTeam = normalizeTeamId(guestTeam[0], guestTeam[1]);

  logger.info('🔍 [COOLDOWN] Checking doubles match history (quarter-based)', {
    hostTeam: normalizedHostTeam,
    guestTeam: normalizedGuestTeam,
    currentQuarter: getCurrentQuarter(),
    quarterStartDate: cutoffDate.toISOString(),
  });

  try {
    // 복식 매치 조회 (호스트팀의 한 명으로 검색)
    const doublesQuery = await db
      .collection('events')
      .where('status', '==', 'completed')
      .where('gameType', 'in', ['mens_doubles', 'womens_doubles', 'mixed_doubles'])
      .where('updatedAt', '>=', admin.firestore.Timestamp.fromDate(cutoffDate))
      .get();

    for (const doc of doublesQuery.docs) {
      const data = doc.data();

      // 호스트 팀 추출 (hostId + hostPartnerId)
      const eventHostTeam = normalizeTeamId(data.hostId || '', data.hostPartnerId || '');

      // 게스트 팀 추출 (opponentId + opponentPartnerId)
      const eventGuestTeam = normalizeTeamId(
        data.opponentId || data.matchResult?.opponentId || '',
        data.opponentPartnerId || data.matchResult?.opponentPartnerId || ''
      );

      // 같은 팀 조합인지 확인 (양방향)
      const isSameMatchup =
        (eventHostTeam === normalizedHostTeam && eventGuestTeam === normalizedGuestTeam) ||
        (eventHostTeam === normalizedGuestTeam && eventGuestTeam === normalizedHostTeam);

      if (isSameMatchup) {
        const lastMatchDate = data.updatedAt?.toDate() || new Date();
        logger.info('✅ [COOLDOWN] Found recent doubles match', {
          eventId: doc.id,
          eventHostTeam,
          eventGuestTeam,
          lastMatchDate: lastMatchDate.toISOString(),
        });
        return {
          hasMatch: true,
          lastMatchDate,
          eventId: doc.id,
        };
      }
    }

    logger.info('❌ [COOLDOWN] No recent doubles match found', {
      hostTeam: normalizedHostTeam,
      guestTeam: normalizedGuestTeam,
    });

    return { hasMatch: false };
  } catch (error) {
    logger.error('❌ [COOLDOWN] Error checking doubles match history', {
      error: error instanceof Error ? error.message : String(error),
    });
    // 에러 시 안전하게 false 반환 (기록경기로 진행 허용)
    return { hasMatch: false };
  }
}

/**
 * 날짜 포맷팅 (한국어)
 */
export function formatDateKorean(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
