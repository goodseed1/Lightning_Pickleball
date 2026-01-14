/**
 * 🌉 [HEIMDALL] Update League Status Cloud Function
 * Phase 5.14: Server-Side Migration - League Status Management
 *
 * Updates league status with validation and security checks
 * Uses Admin SDK to ensure atomic operations
 *
 * @author Kim (Phase 5.14)
 * @date 2025-11-17
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';

const db = admin.firestore();

type LeagueStatus = 'preparing' | 'open' | 'ongoing' | 'playoffs' | 'completed';

interface UpdateLeagueStatusRequest {
  leagueId: string;
  status: LeagueStatus;
}

interface UpdateLeagueStatusResponse {
  success: boolean;
  message: string;
  data?: {
    leagueId: string;
    status: LeagueStatus;
  };
}

/**
 * Update League Status Cloud Function
 *
 * Security:
 * - Must be authenticated
 * - Must be club admin
 * - Validates status transitions
 *
 * Valid Status Transitions:
 * - preparing → open (open for applications)
 * - open → preparing (close applications)
 * - preparing → ongoing (start league with matches)
 * - ongoing → playoffs (start playoffs)
 * - playoffs → completed (finish league)
 *
 * @param request - Contains leagueId and new status
 * @returns Success status with league info
 */
export const updateLeagueStatus = onCall<
  UpdateLeagueStatusRequest,
  Promise<UpdateLeagueStatusResponse>
>(async request => {
  const { data, auth } = request;
  const { leagueId, status } = data;

  // ============================================================================
  // Step 1: Authentication
  // ============================================================================
  if (!auth || !auth.uid) {
    throw new HttpsError('unauthenticated', 'You must be logged in to update league status');
  }

  const adminUserId = auth.uid;

  logger.info('🔄 [UPDATE_LEAGUE_STATUS] Starting', {
    leagueId,
    newStatus: status,
    adminUserId,
  });

  try {
    // ==========================================================================
    // Step 2: Get League Data
    // ==========================================================================
    const leagueRef = db.collection('leagues').doc(leagueId);
    const leagueSnap = await leagueRef.get();

    if (!leagueSnap.exists) {
      throw new HttpsError('not-found', 'League not found');
    }

    const league = leagueSnap.data();
    if (!league) {
      throw new HttpsError('internal', 'Invalid league data');
    }

    const currentStatus = league.status;

    logger.info('📊 [UPDATE_LEAGUE_STATUS] Current status', {
      leagueId,
      currentStatus,
      newStatus: status,
    });

    // ==========================================================================
    // Step 3: Authorization Check (Club Admin)
    // ==========================================================================
    const clubId = league.clubId;
    const clubMemberRef = db.collection('clubMembers').doc(`${clubId}_${adminUserId}`);
    const clubMemberSnap = await clubMemberRef.get();

    if (!clubMemberSnap.exists) {
      throw new HttpsError('permission-denied', 'You are not a member of this club');
    }

    const clubMemberData = clubMemberSnap.data();
    // 🎯 [KIM FIX] 운영진(manager)도 권한 부여
    const isAdminOrManager =
      clubMemberData?.role === 'admin' ||
      clubMemberData?.role === 'owner' ||
      clubMemberData?.role === 'manager';

    if (!isAdminOrManager) {
      throw new HttpsError(
        'permission-denied',
        'Only club admins or managers can update league status'
      );
    }

    // ==========================================================================
    // Step 4: Validate Status Transition
    // ==========================================================================
    const validTransitions: Record<string, string[]> = {
      preparing: ['open', 'ongoing'], // Can open for applications or start directly
      open: ['preparing', 'ongoing'], // Can close applications or start
      ongoing: ['playoffs'], // Can only progress to playoffs
      playoffs: ['completed'], // Can only complete
      completed: [], // Final state - no transitions allowed
    };

    const allowedNextStatuses = validTransitions[currentStatus] || [];

    if (!allowedNextStatuses.includes(status)) {
      throw new HttpsError(
        'failed-precondition',
        `Invalid status transition: ${currentStatus} → ${status}. ` +
          `Allowed transitions: ${allowedNextStatuses.join(', ') || 'none'}`
      );
    }

    // ==========================================================================
    // Step 5: Additional Validations Based on Target Status
    // ==========================================================================
    if (status === 'ongoing') {
      // Must have participants
      const participants = league.participants || [];
      if (participants.length < 2) {
        throw new HttpsError(
          'failed-precondition',
          'Cannot start league: At least 2 participants required'
        );
      }
    }

    if (status === 'playoffs') {
      // Regular season must be complete
      if (!league.regularSeasonComplete) {
        throw new HttpsError(
          'failed-precondition',
          'Cannot start playoffs: Regular season not yet complete'
        );
      }
    }

    // ==========================================================================
    // Step 6: Update League Status
    // ==========================================================================
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Add status-specific timestamps
    if (status === 'open') {
      updateData.openedAt = admin.firestore.FieldValue.serverTimestamp();
    } else if (status === 'ongoing') {
      updateData.startedAt = admin.firestore.FieldValue.serverTimestamp();
    } else if (status === 'completed') {
      updateData.completedAt = admin.firestore.FieldValue.serverTimestamp();
    }

    await leagueRef.update(updateData);

    logger.info('✅ [UPDATE_LEAGUE_STATUS] Successfully updated', {
      leagueId,
      oldStatus: currentStatus,
      newStatus: status,
    });

    return {
      success: true,
      message: `League status updated from ${currentStatus} to ${status}`,
      data: {
        leagueId,
        status,
      },
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    logger.error('❌ [UPDATE_LEAGUE_STATUS] Unexpected error', {
      leagueId,
      status,
      error: error instanceof Error ? error.message : String(error),
    });

    throw new HttpsError(
      'internal',
      `Failed to update league status: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});
