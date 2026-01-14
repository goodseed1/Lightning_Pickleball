/**
 * 🏛️ OLYMPUS MISSION - Phase 1.2: Add Tournament Participant (Admin)
 * Cloud Function to add a participant to a tournament with admin privileges
 *
 * This function is called by tournament admins to manually add participants.
 * Regular users cannot directly modify tournament participants due to security rules.
 */

const admin = require('firebase-admin');
const { onCall, HttpsError } = require('firebase-functions/v2/https');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

exports.addTournamentParticipant = onCall(async request => {
  const { tournamentId, userId, partnerId, partnerName } = request.data;
  const callerId = request.auth?.uid;

  console.log('👥 [ADD PARTICIPANT] Function called:', {
    tournamentId,
    userId,
    callerId,
    partnerId: partnerId || 'none',
    partnerName: partnerName || 'none',
  });

  // Verify authentication
  if (!callerId) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Validate input
  if (!tournamentId || !userId) {
    throw new HttpsError('invalid-argument', 'tournamentId and userId are required');
  }

  try {
    const db = admin.firestore();
    const tournamentRef = db.doc(`tournaments/${tournamentId}`);

    // Run transaction to safely add participant
    const result = await db.runTransaction(async transaction => {
      const tournamentDoc = await transaction.get(tournamentRef);

      if (!tournamentDoc.exists) {
        throw new HttpsError('not-found', 'Tournament not found');
      }

      const tournament = tournamentDoc.data();

      // Verify caller is a tournament admin (owner or club admin)
      const clubRef = db.doc(`tennis_clubs/${tournament.clubId}`);
      const clubMemberRef = db.doc(`clubMembers/${callerId}_${tournament.clubId}`);

      const [clubDoc, clubMemberDoc] = await Promise.all([
        transaction.get(clubRef),
        transaction.get(clubMemberRef),
      ]);

      if (!clubDoc.exists) {
        throw new HttpsError('not-found', 'Club not found');
      }

      const clubMember = clubMemberDoc.data();
      // 🎯 [KIM FIX] 운영진(manager)도 권한 부여
      const isClubAdminOrManager =
        clubMember?.role === 'admin' ||
        clubMember?.role === 'owner' ||
        clubMember?.role === 'manager';
      const isTournamentCreator = tournament.createdBy === callerId;

      if (!isClubAdminOrManager && !isTournamentCreator) {
        throw new HttpsError(
          'permission-denied',
          'Only club admins, managers, or tournament creators can add participants'
        );
      }

      // Check tournament status
      // ⚠️ RACE CONDITION FIX: Allow participant addition during 'registration' or 'bracket_generation'
      // This prevents rejection when user quickly clicks "Close Registration" → "Generate Bracket"
      const allowedStatuses = ['registration', 'bracket_generation'];
      if (!allowedStatuses.includes(tournament.status)) {
        throw new HttpsError(
          'failed-precondition',
          `Tournament is not open for registration (status: ${tournament.status})`
        );
      }

      // Check if tournament is full
      const participants = tournament.participants || [];
      if (participants.length >= tournament.settings?.maxParticipants) {
        throw new HttpsError('resource-exhausted', 'Tournament is full');
      }

      // Check if user is already registered
      const alreadyRegistered = participants.find(p => p.playerId === userId);
      if (alreadyRegistered) {
        throw new HttpsError('already-exists', 'User is already registered');
      }

      // Get user profile
      const userDoc = await transaction.get(db.doc(`users/${userId}`));
      if (!userDoc.exists) {
        throw new HttpsError('not-found', 'User not found');
      }

      const userProfile = userDoc.data();

      // Create participant object
      const now = admin.firestore.Timestamp.now();

      // 🔍 DEBUG: Log the partner data being used
      console.log('🔍 [CREATE PARTICIPANT] Partner data:', {
        partnerId: partnerId,
        partnerName: partnerName,
        partnerIdType: typeof partnerId,
        partnerNameType: typeof partnerName,
      });

      const participant = {
        id: `${userId}_${Date.now()}`,
        tournamentId: tournamentId,
        playerId: userId,
        playerName: userProfile?.displayName || userProfile?.name || 'Unknown Player',
        playerGender: userProfile?.gender || 'male',
        skillLevel: userProfile?.skillLevel?.toString() || '3.0',
        status: 'approved',
        registeredAt: now,
        matchesPlayed: 0,
        matchesWon: 0,
        setsWon: 0,
        setsLost: 0,
        gamesWon: 0,
        gamesLost: 0,
        // Doubles tournament partner information
        partnerId: partnerId || null,
        partnerName: partnerName || null,
      };

      // 🔍 DEBUG: Log the complete participant object
      console.log('📦 [PARTICIPANT OBJECT]:', JSON.stringify(participant, null, 2));

      // Update tournament with new participant
      transaction.update(tournamentRef, {
        participants: [...participants, participant],
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Also create a registration record for consistency
      const registrationRef = db.collection('tournamentRegistrations').doc();
      transaction.set(registrationRef, {
        tournamentId,
        userId,
        status: 'approved',
        registeredAt: now,
        approvedAt: now,
        approvedBy: callerId, // Admin who added the participant
      });

      console.log('✅ [ADD PARTICIPANT] Participant added successfully:', {
        participantId: participant.id,
        playerName: participant.playerName,
      });

      return {
        success: true,
        participantId: participant.id,
        registrationId: registrationRef.id,
      };
    });

    return result;
  } catch (error) {
    console.error('❌ [ADD PARTICIPANT] Error:', error);

    // Re-throw HttpsErrors as-is
    if (error instanceof HttpsError) {
      throw error;
    }

    // Wrap other errors
    throw new HttpsError('internal', `Failed to add participant: ${error.message}`);
  }
});
