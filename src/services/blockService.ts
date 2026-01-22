/**
 * Block Service - Apple Guideline 1.2 Compliance
 *
 * 사용자 차단 시스템을 위한 서비스
 * - 사용자 차단/차단 해제
 * - 차단 목록 구독
 * - 차단 여부 확인
 *
 * Firestore Schema:
 * users/{userId}/blocked_users/{blockedUserId}
 * {
 *   blockedAt: Timestamp,
 *   blockedUserName: string,
 *   blockedUserPhotoURL?: string,  // 🎯 [KIM FIX] Added for profile photo display
 * }
 */

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
  Timestamp,
  query,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase/config';

// ============ TYPES ============

export interface BlockedUser {
  id: string; // blockedUserId
  blockedUserName: string;
  blockedUserPhotoURL?: string; // 🎯 [KIM FIX] Added for profile photo display
  blockedAt: Timestamp | Date;
}

// ============ CONSTANTS ============

const getBlockedUsersCollection = (userId: string) =>
  collection(db, 'users', userId, 'blocked_users');

// ============ SERVICE FUNCTIONS ============

/**
 * 사용자 차단
 */
export const blockUser = async (
  currentUserId: string,
  blockedUserId: string,
  blockedUserName: string,
  blockedUserPhotoURL?: string // 🎯 [KIM FIX] Added for profile photo display
): Promise<void> => {
  try {
    const blockData = {
      blockedUserName,
      blockedAt: Timestamp.now(),
      ...(blockedUserPhotoURL && { blockedUserPhotoURL }), // 🎯 Only save if exists
    };

    await setDoc(doc(db, 'users', currentUserId, 'blocked_users', blockedUserId), blockData);

    console.log('🚫 [BlockService] User blocked:', blockedUserId);
  } catch (error) {
    console.error('❌ [BlockService] Error blocking user:', error);
    throw error;
  }
};

/**
 * 사용자 차단 해제
 */
export const unblockUser = async (currentUserId: string, blockedUserId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'users', currentUserId, 'blocked_users', blockedUserId));

    console.log('✅ [BlockService] User unblocked:', blockedUserId);
  } catch (error) {
    console.error('❌ [BlockService] Error unblocking user:', error);
    throw error;
  }
};

/**
 * 특정 사용자가 차단되었는지 확인
 */
export const isUserBlocked = async (
  currentUserId: string,
  targetUserId: string
): Promise<boolean> => {
  try {
    const docRef = doc(db, 'users', currentUserId, 'blocked_users', targetUserId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.error('❌ [BlockService] Error checking blocked status:', error);
    return false;
  }
};

/**
 * 양방향 차단 확인 (내가 차단했거나, 나를 차단한 경우)
 */
export const isEitherBlocked = async (userId1: string, userId2: string): Promise<boolean> => {
  try {
    const [blocked1, blocked2] = await Promise.all([
      isUserBlocked(userId1, userId2),
      isUserBlocked(userId2, userId1),
    ]);
    return blocked1 || blocked2;
  } catch (error) {
    console.error('❌ [BlockService] Error checking bidirectional block:', error);
    return false;
  }
};

/**
 * 차단 목록 실시간 구독
 */
export const subscribeToBlockedUsers = (
  currentUserId: string,
  callback: (blockedUsers: BlockedUser[]) => void
): (() => void) => {
  try {
    const q = query(getBlockedUsersCollection(currentUserId), orderBy('blockedAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const blockedUsers: BlockedUser[] = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as BlockedUser[];

        callback(blockedUsers);
      },
      error => {
        console.error('❌ [BlockService] Error in subscription:', error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('❌ [BlockService] Error setting up subscription:', error);
    return () => {};
  }
};

/**
 * 차단 목록 일회성 조회
 */
export const getBlockedUsers = async (currentUserId: string): Promise<BlockedUser[]> => {
  try {
    const q = query(getBlockedUsersCollection(currentUserId), orderBy('blockedAt', 'desc'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as BlockedUser[];
  } catch (error) {
    console.error('❌ [BlockService] Error getting blocked users:', error);
    return [];
  }
};

/**
 * 차단된 사용자 ID 목록만 조회 (필터링용)
 */
export const getBlockedUserIds = async (currentUserId: string): Promise<string[]> => {
  try {
    const blockedUsers = await getBlockedUsers(currentUserId);
    return blockedUsers.map(user => user.id);
  } catch (error) {
    console.error('❌ [BlockService] Error getting blocked user IDs:', error);
    return [];
  }
};

/**
 * 차단된 사용자 수 조회
 */
export const getBlockedUsersCount = async (currentUserId: string): Promise<number> => {
  try {
    const snapshot = await getDocs(getBlockedUsersCollection(currentUserId));
    return snapshot.size;
  } catch (error) {
    console.error('❌ [BlockService] Error getting blocked users count:', error);
    return 0;
  }
};

export default {
  blockUser,
  unblockUser,
  isUserBlocked,
  isEitherBlocked,
  subscribeToBlockedUsers,
  getBlockedUsers,
  getBlockedUserIds,
  getBlockedUsersCount,
};
