/**
 * 🌉 [HEIMDALL] Delete Club Cloud Function
 * Phase 5.3: Server-Side Migration - Critical Security
 *
 * Securely deletes a club and all related data
 * Only allows deletion by club creator to preserve integrity
 *
 * @author Heimdall (Phase 5.3)
 * @date 2025-11-13
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';

const db = admin.firestore();

/**
 * Delete Club Request
 */
export interface DeleteClubRequest {
  clubId: string;
  reason?: string; // Optional reason for deletion
}

/**
 * Delete Club Response
 */
export interface DeleteClubResponse {
  success: boolean;
  message: string;
  data?: {
    clubName: string;
    deletedDocuments: {
      club: number;
      members: number;
      tournaments: number;
      joinRequests: number;
    };
  };
}

/**
 * Delete Club Cloud Function
 *
 * Security Rules:
 * - Must be authenticated
 * - Must be club creator (createdBy == request.auth.uid)
 * - Cannot delete clubs with active tournaments (future enhancement)
 *
 * Cascade Deletions:
 * - All clubMembers documents (clubMembers/{clubId}_{userId})
 * - All club join requests
 * - All tournaments (if any) - currently just counts
 * - Club document itself
 *
 * @param request - Contains clubId and optional reason
 * @returns Success status with deletion counts
 */
export const deleteClub = onCall<DeleteClubRequest, Promise<DeleteClubResponse>>(
  {
    invoker: 'public', // Allow public invoke (authentication still enforced inside function)
  },
  async request => {
    const { data, auth } = request;
    const { clubId, reason } = data;

    // ============================================================================
    // Step 1: Authentication
    // ============================================================================
    if (!auth || !auth.uid) {
      throw new HttpsError('unauthenticated', 'You must be logged in to delete a club');
    }

    const userId = auth.uid;

    logger.info('🗑️ [DELETE_CLUB] Starting deletion', {
      clubId,
      userId,
      reason,
    });

    try {
      // ==========================================================================
      // Step 2: Validate Club Exists & Get Data
      // ==========================================================================
      const clubRef = db.collection('pickleball_clubs').doc(clubId);
      const clubSnap = await clubRef.get();

      if (!clubSnap.exists) {
        throw new HttpsError('not-found', 'Club not found');
      }

      const clubData = clubSnap.data();
      if (!clubData) {
        throw new HttpsError('internal', 'Invalid club data');
      }

      // 🔧 FIX: Check profile.name first, then fallback to name
      const clubName = clubData.profile?.name || clubData.name || 'Unknown Club';

      // ==========================================================================
      // Step 3: Authorization Check
      // ==========================================================================
      // Only the club creator can delete the club
      const isCreator = clubData.createdBy === userId;

      if (!isCreator) {
        throw new HttpsError('permission-denied', 'Only the club creator can delete this club');
      }

      // ==========================================================================
      // Step 4: Check for Active Tournaments (Future Enhancement)
      // ==========================================================================
      // For now, we allow deletion even with tournaments
      // Future: prevent deletion if there are active/upcoming tournaments

      // ==========================================================================
      // Step 5: Cascade Delete All Related Data
      // ==========================================================================
      const batch = db.batch();

      // 5.1: Delete all clubMembers documents
      // Pattern: clubMembers/{clubId}_{userId}
      const membersQuery = db.collection('clubMembers').where('clubId', '==', clubId);
      const membersSnap = await membersQuery.get();
      const deletedMembersCount = membersSnap.size;

      membersSnap.forEach(memberDoc => {
        batch.delete(memberDoc.ref);
      });

      logger.info('🗑️ [DELETE_CLUB] Deleting members', {
        clubId,
        count: deletedMembersCount,
      });

      // 5.2: Delete all club join requests
      const joinRequestsQuery = db.collection('clubJoinRequests').where('clubId', '==', clubId);
      const joinRequestsSnap = await joinRequestsQuery.get();
      const deletedJoinRequestsCount = joinRequestsSnap.size;

      joinRequestsSnap.forEach(requestDoc => {
        batch.delete(requestDoc.ref);
      });

      logger.info('🗑️ [DELETE_CLUB] Deleting join requests', {
        clubId,
        count: deletedJoinRequestsCount,
      });

      // 5.3: Count tournaments (for now, just count - don't delete)
      // Future: cascade delete tournaments or prevent deletion
      const tournamentsQuery = db.collection('tournaments').where('clubId', '==', clubId);
      const tournamentsSnap = await tournamentsQuery.get();
      const tournamentsCount = tournamentsSnap.size;

      if (tournamentsCount > 0) {
        logger.warn('⚠️ [DELETE_CLUB] Club has tournaments', {
          clubId,
          tournamentsCount,
        });
        // For now, we'll just log this. In the future, we might:
        // 1. Prevent deletion if tournaments exist
        // 2. Cascade delete all tournaments
        // 3. Archive tournaments instead of deleting
      }

      // 5.4: Collect member IDs BEFORE deleting (for notifications)
      const memberIds: string[] = [];
      membersSnap.forEach(memberDoc => {
        const memberData = memberDoc.data();
        if (memberData.userId && memberData.userId !== userId) {
          // Don't notify the deleter (club creator)
          memberIds.push(memberData.userId);
        }
      });

      // 5.5: Delete the club document itself
      batch.delete(clubRef);

      // ==========================================================================
      // Step 6: Commit All Deletions
      // ==========================================================================
      await batch.commit();

      logger.info('✅ [DELETE_CLUB] Successfully deleted club', {
        clubId,
        clubName,
        deletedMembersCount,
        deletedJoinRequestsCount,
        tournamentsCount,
        userId,
        reason,
      });

      // ==========================================================================
      // Step 7: Send notifications to members (POST-TRANSACTION)
      // ==========================================================================
      try {
        logger.info('📮 [DELETE_CLUB] Creating deletion notifications for members...', {
          memberCount: memberIds.length,
        });

        const notificationPromises = memberIds.map(async memberId => {
          // 1. Create notification
          await db.collection('notifications').add({
            recipientId: memberId,
            type: 'CLUB_DELETED',
            message: `'${clubName}' 클럽이 삭제되었습니다`,
            status: 'unread',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            metadata: {
              notificationType: 'club_deleted',
              clubName: clubName,
              reason: reason || 'No reason provided',
            },
          });

          // 2. Create feed item (visible only to this member)
          await db.collection('feed').add({
            type: 'club_deleted',
            actorId: memberId,
            actorName: '',
            clubName: clubName,
            content: 'feed.clubDeleted',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            isActive: true,
            visibility: 'private',
            visibleTo: [memberId], // 🔒 Only this member can see
            metadata: {
              reason: reason || 'No reason provided',
            },
          });
        });

        await Promise.all(notificationPromises);

        logger.info('✅ [DELETE_CLUB] Notifications sent to all members', {
          memberCount: memberIds.length,
        });
      } catch (notificationError) {
        // Don't fail the entire operation if notifications fail
        logger.error('⚠️ [DELETE_CLUB] Failed to send notifications:', notificationError);
      }

      return {
        success: true,
        message: `Club "${clubName}" successfully deleted. ${deletedMembersCount} members and ${deletedJoinRequestsCount} join requests removed.`,
        data: {
          clubName,
          deletedDocuments: {
            club: 1,
            members: deletedMembersCount,
            tournaments: tournamentsCount,
            joinRequests: deletedJoinRequestsCount,
          },
        },
      };
    } catch (error) {
      // Re-throw HttpsError as is
      if (error instanceof HttpsError) {
        throw error;
      }

      // Log unexpected errors
      logger.error('❌ [DELETE_CLUB] Unexpected error', {
        clubId,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new HttpsError(
        'internal',
        `Failed to delete club: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
);
