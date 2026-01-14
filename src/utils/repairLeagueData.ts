/**
 * Simple league data repair utility
 * Adds test participants and regenerates matches for leagues with broken data
 *
 * 📝 LTR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LTR" (Lightning Tennis Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LTR로 변경하고 코드는 ntrp를 유지합니다.
 */

import { db } from '../firebase/config';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { LeagueParticipant } from '../types/league';
import leagueService from '../services/leagueService';

// Test participant data
const TEST_PARTICIPANTS = [
  {
    userId: 'test-user-1',
    userDisplayName: '김철수',
    userEmail: 'kimchulsu@example.com',
    userLtrLevel: 3.5,
  },
  {
    userId: 'test-user-2',
    userDisplayName: '이영희',
    userEmail: 'leeyounghi@example.com',
    userLtrLevel: 3.0,
  },
  {
    userId: 'test-user-3',
    userDisplayName: '박민수',
    userEmail: 'parkminsu@example.com',
    userLtrLevel: 4.0,
  },
  {
    userId: 'test-user-4',
    userDisplayName: '최지은',
    userEmail: 'choijieun@example.com',
    userLtrLevel: 3.5,
  },
];

export const repairLeagueData = async (leagueId: string) => {
  console.log('🔧 Starting league data repair for leagueId:', leagueId);

  try {
    // Step 1: Add test participants to league_participants collection
    console.log('📝 Step 1: Adding test participants...');

    const participantIds: string[] = [];

    for (const testParticipant of TEST_PARTICIPANTS) {
      const participantData: Omit<LeagueParticipant, 'id'> = {
        leagueId,
        userId: testParticipant.userId,
        status: 'confirmed',
        appliedAt: serverTimestamp() as Timestamp,
        processedAt: serverTimestamp() as Timestamp,
        processedBy: 'admin-repair-script',
        processingNote: 'Added via data repair script',
        userDisplayName: testParticipant.userDisplayName,
        userEmail: testParticipant.userEmail,
        userLtrLevel: testParticipant.userLtrLevel,
      };

      const docRef = await addDoc(collection(db, 'league_participants'), participantData);
      participantIds.push(testParticipant.userId);
      console.log(`✅ Added participant: ${testParticipant.userDisplayName} (${docRef.id})`);
    }

    // Step 2: Update league document with participant IDs
    console.log('📝 Step 2: Updating league participants array...');

    const leagueRef = doc(db, 'leagues', leagueId);
    await updateDoc(leagueRef, {
      participants: participantIds,
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Updated league.participants array with:', participantIds);

    // Step 3: Delete existing broken matches
    console.log('📝 Step 3: Deleting existing broken matches...');

    const matchesRef = collection(leagueRef, 'matches');
    const existingMatches = await getDocs(matchesRef);

    for (const matchDoc of existingMatches.docs) {
      await deleteDoc(matchDoc.ref);
      console.log(`🗑️ Deleted broken match: ${matchDoc.id}`);
    }

    // Step 4: Generate new matches using the fixed function
    console.log('📝 Step 4: Generating new matches with proper participant data...');

    await leagueService.generateRoundRobinMatches(leagueId);
    console.log('✅ Generated new round-robin matches with real names');

    // Step 5: Verify the repair
    console.log('📝 Step 5: Verifying the repair...');

    const newMatches = await leagueService.getLeagueMatches(leagueId);
    const participants = await leagueService.getLeagueParticipants(leagueId);

    console.log('🔍 Repair verification results:', {
      participantsCount: participants.length,
      matchesCount: newMatches.length,
      sampleMatch: newMatches[0]
        ? {
            player1Id: newMatches[0].player1Id,
            player2Id: newMatches[0].player2Id,
            player1Name: newMatches[0].player1Name,
            player2Name: newMatches[0].player2Name,
          }
        : 'No matches found',
    });

    console.log('🎉 League data repair completed successfully!');
    return {
      success: true,
      participantsAdded: participantIds.length,
      matchesGenerated: newMatches.length,
    };
  } catch (error) {
    console.error('❌ Error repairing league data:', error);
    throw error;
  }
};

// Helper function to repair the current problematic league
export const repairCurrentLeague = () => {
  const CURRENT_LEAGUE_ID = 'FRxzwj7oVsBIuOODkGlG'; // From debug logs
  return repairLeagueData(CURRENT_LEAGUE_ID);
};
