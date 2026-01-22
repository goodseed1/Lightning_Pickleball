/**
 * Appeal Service
 * Apple Guideline 1.2 Compliance
 *
 * 밴 이의 제기 관리 서비스
 * - 이의 제기 목록 조회
 * - 이의 제기 검토 (승인/거절)
 * - Unban 처리
 *
 * @author Kim
 * @date 2025-01-17
 */

import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase/config';

// ============ TYPES ============

export type AppealStatus = 'pending' | 'approved' | 'rejected';

export interface BanAppeal {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  appealText: string;
  status: AppealStatus;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  reviewedBy?: string;
  reviewedAt?: Timestamp | Date;
  adminNotes?: string;
}

// ============ SERVICE FUNCTIONS ============

/**
 * 이의 제기 목록 실시간 구독
 */
export const subscribeToAppeals = (
  callback: (appeals: BanAppeal[]) => void,
  statusFilter?: AppealStatus
): (() => void) => {
  try {
    let q = query(collection(db, 'ban_appeals'), orderBy('createdAt', 'desc'));

    if (statusFilter) {
      q = query(
        collection(db, 'ban_appeals'),
        where('status', '==', statusFilter),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const appeals: BanAppeal[] = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as BanAppeal[];

        console.log('[AppealService] Loaded', appeals.length, 'appeals');
        callback(appeals);
      },
      error => {
        console.error('[AppealService] Error in subscription:', error);
        callback([]);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('[AppealService] Error setting up subscription:', error);
    return () => {};
  }
};

/**
 * 이의 제기 목록 일회성 조회
 */
export const getAppeals = async (statusFilter?: AppealStatus): Promise<BanAppeal[]> => {
  try {
    let q = query(collection(db, 'ban_appeals'), orderBy('createdAt', 'desc'));

    if (statusFilter) {
      q = query(
        collection(db, 'ban_appeals'),
        where('status', '==', statusFilter),
        orderBy('createdAt', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as BanAppeal[];
  } catch (error) {
    console.error('[AppealService] Error getting appeals:', error);
    return [];
  }
};

/**
 * 이의 제기 승인 + Unban
 */
export const approveAppeal = async (
  appealId: string,
  userId: string,
  reviewedBy: string,
  adminNotes?: string
): Promise<void> => {
  try {
    // 1. Appeal 상태 업데이트
    await updateDoc(doc(db, 'ban_appeals', appealId), {
      status: 'approved',
      reviewedBy,
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...(adminNotes && { adminNotes }),
    });

    // 2. 사용자 Unban
    await updateDoc(doc(db, 'users', userId), {
      isBanned: false,
      unbannedAt: serverTimestamp(),
      unbannedBy: reviewedBy,
      unbannedReason: 'appeal_approved',
    });

    console.log('[AppealService] Appeal approved and user unbanned:', userId);
  } catch (error) {
    console.error('[AppealService] Error approving appeal:', error);
    throw error;
  }
};

/**
 * 이의 제기 거절
 */
export const rejectAppeal = async (
  appealId: string,
  reviewedBy: string,
  adminNotes?: string
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'ban_appeals', appealId), {
      status: 'rejected',
      reviewedBy,
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...(adminNotes && { adminNotes }),
    });

    console.log('[AppealService] Appeal rejected:', appealId);
  } catch (error) {
    console.error('[AppealService] Error rejecting appeal:', error);
    throw error;
  }
};

/**
 * 직접 Unban (이의 제기 없이)
 */
export const unbanUser = async (userId: string, unbannedBy: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      isBanned: false,
      unbannedAt: serverTimestamp(),
      unbannedBy,
      unbannedReason: 'admin_direct',
    });

    console.log('[AppealService] User directly unbanned:', userId);
  } catch (error) {
    console.error('[AppealService] Error unbanning user:', error);
    throw error;
  }
};

export default {
  subscribeToAppeals,
  getAppeals,
  approveAppeal,
  rejectAppeal,
  unbanUser,
};
