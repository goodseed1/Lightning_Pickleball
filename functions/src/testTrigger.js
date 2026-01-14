/**
 * 💥 리트머스 시험지 - The Ultimate Proof! 💥
 * This is the simplest possible trigger to test if the Firestore path works
 */

const functions = require('firebase-functions');

exports.testTrigger = functions.firestore
  .document('leagues/{tournamentId}/matches/{matchId}')
  .onUpdate(async (change, context) => {
    console.log(
      `--- ✅ SUCCESS! testTrigger fired for match: ${context.params.matchId} in tournament: ${context.params.tournamentId} ---`
    );

    const beforeData = change.before.data();
    const afterData = change.after.data();

    console.log('🔍 BEFORE DATA:', JSON.stringify(beforeData, null, 2));
    console.log('🔍 AFTER DATA:', JSON.stringify(afterData, null, 2));
    console.log('📍 Triggered by document path:', change.after.ref.path);
    console.log('🕒 Timestamp:', new Date().toISOString());

    // Log any status changes to identify match completion
    if (beforeData?.status !== afterData?.status) {
      console.log(`📈 STATUS CHANGE: ${beforeData?.status} → ${afterData?.status}`);
    }

    console.log('--- ✅ testTrigger execution completed ---');
  });
