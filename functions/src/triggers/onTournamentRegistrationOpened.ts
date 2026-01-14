/**
 * 📢 Firestore Trigger: onTournamentRegistrationOpened
 *
 * Automatically creates feed items when tournament status changes to 'registration'
 * This allows club members to see tournament registration announcements in their feeds
 *
 * Pattern: Same as onClubJoinRequestCreated
 * Phase: Feed Advertising System
 *
 * Trigger: tournaments/{tournamentId} document updated
 * Condition: status changed TO 'registration'
 * Action: Create feed item visible to all club members
 */

import * as admin from 'firebase-admin';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * ============================================================================
 * Firestore Trigger: onTournamentRegistrationOpened
 * ============================================================================
 *
 * Creates feed advertisement when tournament opens for registration
 *
 * Trigger: Firestore onDocumentUpdated
 * Collection: tournaments/{tournamentId}
 * Condition: status changes to 'registration'
 *
 * Feed Item Created:
 * - Type: 'tournament_registration_open'
 * - Visibility: 'club_members' (only club members can see)
 * - VisibleTo: All active club members
 * - Metadata: Tournament details for card display
 *
 * @param event - Firestore DocumentSnapshot with before/after data
 */
export const onTournamentRegistrationOpened = onDocumentUpdated(
  'tournaments/{tournamentId}',
  async event => {
    try {
      const beforeData = event.data?.before.data();
      const afterData = event.data?.after.data();
      const tournamentId = event.params.tournamentId;

      console.log('📢 [TOURNAMENT FEED] Checking tournament status change:', tournamentId);
      console.log(`   Before status: ${beforeData?.status}`);
      console.log(`   After status: ${afterData?.status}`);

      // ========================================================================
      // 1. Check if status changed TO 'registration'
      // ========================================================================

      // Only process when status changes TO 'registration' (from any other status)
      if (afterData?.status !== 'registration') {
        console.log('   ⏭️  Status not "registration", skipping feed creation');
        return null;
      }

      // Prevent duplicate feed items if already in registration
      if (beforeData?.status === 'registration') {
        console.log('   ⏭️  Already in registration status, skipping duplicate');
        return null;
      }

      console.log('✅ [TOURNAMENT FEED] Status changed to registration, creating feed item');

      // ========================================================================
      // 2. Extract Tournament Data
      // ========================================================================

      const {
        tournamentName,
        title,
        clubId,
        createdBy,
        format,
        eventType,
        settings,
        startDate,
        endDate,
        registrationDeadline,
        entryFee,
      } = afterData;

      if (!clubId || !createdBy) {
        console.error('❌ [TOURNAMENT FEED] Missing required fields:', {
          clubId,
          createdBy,
        });
        return null;
      }

      // ========================================================================
      // 3. Fetch Club Data
      // ========================================================================

      const clubDoc = await db.doc(`pickleball_clubs/${clubId}`).get();

      if (!clubDoc.exists) {
        console.error('❌ [TOURNAMENT FEED] Club not found:', clubId);
        return null;
      }

      const clubData = clubDoc.data();
      const clubName = clubData?.profile?.name || clubData?.name || 'Unknown Club';

      console.log(`📋 [TOURNAMENT FEED] Club: ${clubName}`);

      // ========================================================================
      // 4. Fetch Creator Data
      // ========================================================================

      const creatorDoc = await db.doc(`users/${createdBy}`).get();
      const creatorData = creatorDoc.data();
      const creatorName = creatorData?.profile?.nickname || 'Tournament Host';

      console.log(`👤 [TOURNAMENT FEED] Creator: ${creatorName}`);

      // ========================================================================
      // 5. Get Club Members for visibleTo
      // ========================================================================

      const membersSnapshot = await db
        .collection('clubMembers')
        .where('clubId', '==', clubId)
        .where('status', '==', 'active')
        .get();

      const memberIds = membersSnapshot.docs.map(doc => doc.data().userId);

      console.log(`👥 [TOURNAMENT FEED] Found ${memberIds.length} club members`);

      if (memberIds.length === 0) {
        console.warn('⚠️  [TOURNAMENT FEED] No club members found, skipping feed creation');
        return null;
      }

      // ========================================================================
      // 6. Create Feed Item (Advertisement)
      // ========================================================================

      const feedItem = {
        type: 'tournament_registration_open',
        actorId: createdBy,
        actorName: creatorName,
        clubId: clubId,
        clubName: clubName,
        eventId: tournamentId,
        metadata: {
          tournamentName: tournamentName || title || 'Unnamed Tournament',
          format: format || 'singles',
          eventType: eventType || 'tournament',
          maxParticipants: settings?.maxParticipants || 0,
          minParticipants: settings?.minParticipants || 0,
          startDate: startDate || null,
          endDate: endDate || null,
          registrationDeadline: registrationDeadline || null,
          entryFee: entryFee || null,
          seedingMethod: settings?.seedingMethod || 'manual',
          matchFormat: settings?.matchFormat || 'best_of_3',
        },
        visibility: 'club_members',
        visibleTo: memberIds,
        isActive: true,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const feedRef = await db.collection('feed').add(feedItem);

      console.log(`✅ [TOURNAMENT FEED] Feed item created: ${feedRef.id}`);
      console.log(`   Tournament: ${tournamentName || title}`);
      console.log(`   Visible to: ${memberIds.length} members`);
      console.log(`   Type: ${feedItem.type}`);

      // ========================================================================
      // 7. Log Activity
      // ========================================================================

      await db.collection('activities').add({
        type: 'tournament_registration_opened',
        userId: createdBy,
        clubId: clubId,
        tournamentId: tournamentId,
        tournamentName: tournamentName || title,
        feedItemId: feedRef.id,
        metadata: {
          visibleToCount: memberIds.length,
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log('📝 [TOURNAMENT FEED] Activity logged');

      return {
        success: true,
        feedItemId: feedRef.id,
        visibleToCount: memberIds.length,
      };
    } catch (error) {
      console.error('❌ [TOURNAMENT FEED] Error creating feed item:', error);
      // Don't throw - allow tournament to continue even if feed creation fails
      return null;
    }
  }
);
