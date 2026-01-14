/**
 * Emergency Tournament Fix Script
 *
 * Manually advances Round 1 winners to Round 2 for existing tournament
 * that was created before Server Sovereignty Recovery architecture
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyD4C1_VJ6gYdJGMoZH1sRjhb_nwJr8aD0E',
  authDomain: 'lightning-pickleball-community.firebaseapp.com',
  projectId: 'lightning-pickleball-community',
  storageBucket: 'lightning-pickleball-community.appspot.com',
  messagingSenderId: '1064094238988',
  appId: '1:1064094238988:web:9d1e8a1e7c8b9a8c2e3f4d',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixTournamentAdvancement() {
  const tournamentId = 'A9a9Bw7wUGc0r87UzkTQ';

  console.log('🔧 Starting emergency tournament advancement fix...');

  try {
    // Round 1 Match 1 Winner: 철이 → Round 2 Match 5 player2
    console.log('🎯 Moving 철이 to Round 2 Match 5...');
    const match5Ref = doc(db, 'leagues', tournamentId, 'matches', `${tournamentId}_match_5`);

    await updateDoc(match5Ref, {
      player2: {
        playerId: '5D2WUjWtF2ezPlV8OX926d4Fdyb2',
        playerName: '철이',
        seed: 3,
      },
      updatedAt: new Date(),
    });

    // Round 1 Match 2 Winner: 정이 → Round 2 Match 6 player2
    console.log('🎯 Moving 정이 to Round 2 Match 6...');
    const match6Ref = doc(db, 'leagues', tournamentId, 'matches', `${tournamentId}_match_6`);

    await updateDoc(match6Ref, {
      player2: {
        playerId: 'celVeuZPpwRsDI5drwZ4U0ULJlg2',
        playerName: '정이',
        seed: 4,
      },
      updatedAt: new Date(),
    });

    console.log('✅ Tournament advancement fix completed!');
    console.log('📊 Expected Round 2 state:');
    console.log('   Match 5: 숙이 vs 철이');
    console.log('   Match 6: 광이 vs 정이');
  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

// Run the fix
fixTournamentAdvancement();
