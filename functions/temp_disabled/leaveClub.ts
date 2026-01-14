/**
 * Leave Club Cloud Function
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const leaveClub = functions.https.onCall(async (data: { clubId: string }, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }

    const userId = context.auth.uid;
    const { clubId } = data;

    if (!clubId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'The function must be called with a "clubId" argument.'
      );
    }

    console.log(`🚪 Processing leave request: User ${userId} leaving club ${clubId}`);

    const db = admin.firestore();

    // 💥 Use query-based approach instead of assumed document ID format
    console.log('🔍 Searching for membership document using query...');

    // First, find the membership document using a query
    const membershipsRef = db.collection('clubMembers');
    const membershipQuery = membershipsRef
      .where('clubId', '==', clubId)
      .where('userId', '==', userId)
      .limit(1);

    const membershipSnapshot = await membershipQuery.get();

    if (membershipSnapshot.empty) {
      console.log('❌ No membership document found for query');
      throw new functions.https.HttpsError('not-found', 'Membership document not found');
    }

    const membershipDoc = membershipSnapshot.docs[0];
    const membershipRef = membershipDoc.ref;
    const membershipData = membershipDoc.data();

    console.log('🔍 Found membership document:', {
      id: membershipDoc.id,
      clubId: membershipData.clubId,
      userId: membershipData.userId,
      role: membershipData.role,
      status: membershipData.status,
    });

    // Define other document references
    const clubRef = db.doc(`pickleball_clubs/${clubId}`);
    const userRef = db.doc(`users/${userId}`);

    // Execute all operations in a transaction for data consistency
    await db.runTransaction(async transaction => {
      // 1. Delete membership document completely
      transaction.delete(membershipRef);
      console.log('🗑️ Membership document deleted');

      // 2. Update club statistics
      transaction.update(clubRef, {
        'stats.totalMembers': admin.firestore.FieldValue.increment(-1),
        'stats.activeMemberCount': admin.firestore.FieldValue.increment(-1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log('📊 Club statistics updated');

      // 3. Update user's club memberships
      transaction.update(userRef, {
        'clubs.memberships': admin.firestore.FieldValue.arrayRemove(clubId),
        'clubs.adminOf': admin.firestore.FieldValue.arrayRemove(clubId), // Remove admin status if applicable
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log('👤 User profile updated');
    });

    console.log(`✅ Successfully processed leave request for user ${userId} from club ${clubId}`);

    return {
      success: true,
      message: `Successfully left club ${clubId}`,
      clubId,
      userId,
    };
  } catch (error) {
    console.error('❌ Error in leaveClub function:', error);

    // Re-throw HttpsError as is
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    // Convert other errors to internal error
    throw new functions.https.HttpsError('internal', 'Failed to leave the club', error);
  }
});
