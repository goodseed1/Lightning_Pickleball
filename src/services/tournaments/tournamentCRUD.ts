/**
 * Tournament CRUD Operations
 * Lightning Tennis 클럽 토너먼트 기본 CRUD 및 쿼리 서비스
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../firebase/config';
import { Tournament, TournamentStatus, CreateTournamentRequest } from '../../types/tournament';
import { TennisEventType } from '../../types/league';

/**
 * 토너먼트 생성 (Cloud Function)
 *
 * @param request - 토너먼트 생성 요청
 * @returns 생성된 토너먼트 ID
 */
export const createTournament = async (request: CreateTournamentRequest): Promise<string> => {
  try {
    const createFn = httpsCallable(functions, 'createTournament');
    const response = await createFn(request);
    // Cloud Function returns: { success, message, data: { tournamentId, createdAt } }
    const result = response.data as { data: { tournamentId: string } };

    console.log('✅ Tournament created:', result.data.tournamentId);
    return result.data.tournamentId;
  } catch (error) {
    console.error('Error creating tournament:', error);
    throw error;
  }
};

/**
 * 토너먼트 정보 조회
 */
export const getTournament = async (tournamentId: string): Promise<Tournament | null> => {
  try {
    const tournamentDoc = await getDoc(doc(db, 'tournaments', tournamentId));

    if (!tournamentDoc.exists()) {
      return null;
    }

    return {
      id: tournamentDoc.id,
      ...tournamentDoc.data(),
    } as Tournament;
  } catch (error) {
    console.error('Error getting tournament:', error);
    throw error;
  }
};

/**
 * 클럽의 토너먼트 목록 조회
 */
export const getClubTournaments = async (
  clubId: string,
  status?: TournamentStatus
): Promise<Tournament[]> => {
  try {
    const tournamentsRef = collection(db, 'tournaments');
    let q = query(tournamentsRef, where('clubId', '==', clubId), orderBy('createdAt', 'desc'));

    if (status) {
      q = query(
        tournamentsRef,
        where('clubId', '==', clubId),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Tournament[];
  } catch (error) {
    console.error('Error getting club tournaments:', error);
    throw error;
  }
};

/**
 * 클럽의 토너먼트 목록 실시간 구독
 * Real-time subscription for club tournaments list
 */
export const subscribeToClubTournaments = (
  clubId: string,
  userRole: string,
  callback: (tournaments: Tournament[]) => void
): Unsubscribe => {
  const tournamentsRef = collection(db, 'tournaments');

  // Role-based query construction similar to leagues
  let q;
  if (userRole === 'admin' || userRole === 'owner' || userRole === 'manager') {
    // Admin: Can see all tournament statuses (backstage view)
    q = query(tournamentsRef, where('clubId', '==', clubId), orderBy('createdAt', 'desc'));
    console.log(
      '🏆 [TOURNAMENT SUBSCRIPTION] Admin backstage view: Loading all tournament statuses'
    );
  } else {
    // Members: See tournaments including preparation phases (draft, registration, in_progress, etc.)
    q = query(
      tournamentsRef,
      where('clubId', '==', clubId),
      where('status', 'in', [
        'draft',
        'registration',
        'in_progress',
        'bracket_generation',
        'completed',
      ]),
      orderBy('createdAt', 'desc')
    );
    console.log(
      '🏆 [TOURNAMENT SUBSCRIPTION] Member view: Loading all tournaments including preparation phases'
    );
  }

  return onSnapshot(
    q,
    snapshot => {
      const allTournaments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Tournament[];

      // All tournaments from the Firestore query are available to display
      // Remove client-side filtering to allow members to see tournaments during preparation phases
      const availableTournaments = allTournaments;

      console.log(
        `🏆 [TOURNAMENT SUBSCRIPTION] ${userRole} received ${availableTournaments.length} tournaments for club ${clubId}`
      );
      callback(availableTournaments);
    },
    error => {
      console.error('Error in club tournaments subscription:', error);
      callback([]); // Return empty array on error
    }
  );
};

/**
 * 토너먼트 상태 변경 (Cloud Function)
 *
 * @param tournamentId - 토너먼트 ID
 * @param newStatus - 새로운 상태
 * @param reason - 상태 변경 이유 (cancelled 상태일 때 필수)
 */
export const updateTournamentStatus = async (
  tournamentId: string,
  newStatus: TournamentStatus,
  reason?: string
): Promise<void> => {
  try {
    const updateStatusFn = httpsCallable(functions, 'updateTournamentStatus');
    const response = await updateStatusFn({
      tournamentId,
      newStatus,
      reason,
    });

    console.log(`✅ Tournament status updated to: ${newStatus}`, response.data);
  } catch (error) {
    console.error('Error updating tournament status:', error);
    throw error;
  }
};

/**
 * 🗑️ 토너먼트 삭제
 * 토너먼트와 관련된 모든 데이터를 삭제합니다.
 * - 토너먼트 문서
 * - 모든 매치 데이터
 * - 클럽 통계 업데이트
 */
/**
 * 🌉 [HEIMDALL] Phase 5.3: Delete Tournament via Cloud Function
 * Migrated from client-side to server-side for security
 */
export const deleteTournament = async (tournamentId: string): Promise<void> => {
  try {
    console.log('🗑️ [DELETE] Calling deleteTournament Cloud Function:', tournamentId);

    const deleteTournamentFn = httpsCallable(functions, 'deleteTournament');
    const result = await deleteTournamentFn({ tournamentId });

    console.log('✅ [DELETE] Tournament deleted successfully:', result.data);
  } catch (error) {
    console.error('❌ [DELETE] Error deleting tournament:', error);
    throw error;
  }
};

/**
 * 토너먼트 실시간 구독
 */
export const subscribeToTournament = (
  tournamentId: string,
  callback: (tournament: Tournament | null) => void
): Unsubscribe => {
  const tournamentRef = doc(db, 'tournaments', tournamentId);

  return onSnapshot(
    tournamentRef,
    snapshot => {
      if (snapshot.exists()) {
        callback({
          id: snapshot.id,
          ...snapshot.data(),
        } as Tournament);
      } else {
        callback(null);
      }
    },
    error => {
      console.error('Error in tournament subscription:', error);
    }
  );
};

/**
 * 경기 종류별 토너먼트 목록 조회
 */
export const getTournamentsByEventType = async (
  clubId: string,
  eventType: TennisEventType
): Promise<Tournament[]> => {
  try {
    const tournamentsRef = collection(db, 'tournaments');
    const q = query(
      tournamentsRef,
      where('clubId', '==', clubId),
      where('eventType', '==', eventType),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Tournament[];
  } catch (error) {
    console.error('Error getting tournaments by event type:', error);
    throw error;
  }
};
