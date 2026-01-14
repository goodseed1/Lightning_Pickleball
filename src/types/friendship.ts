/**
 * 친구 관계 관련 TypeScript 타입 정의
 */

export type FriendshipStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

export interface Friendship {
  id: string; // userId1_userId2 형태
  users: [string, string]; // [userId1, userId2]
  status: FriendshipStatus;
  requesterId: string; // 친구 요청을 보낸 사용자의 ID
  createdAt: Date;
  updatedAt: Date;
}

export interface FriendRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterProfileImage?: string;
  requesterSkillLevel?: string;
  requesterSinglesElo?: number; // 🎾 ELO-based LPR display
  createdAt: Date;
}

export interface Friend {
  id: string;
  userId: string;
  name: string;
  profileImage?: string;
  skillLevel?: string;
  singlesElo?: number; // 🎾 ELO-based LPR display
  location?: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export interface FriendSearchResult {
  id: string;
  nickname: string;
  profileImage?: string;
  skillLevel?: string;
  singlesElo?: number; // 🎾 ELO-based LPR display
  location?: string;
  isFriend: boolean;
  hasPendingRequest: boolean;
}

/**
 * Firestore 데이터베이스 구조:
 *
 * friendships/ {
 *   "{userId1}_{userId2}": {
 *     users: [userId1, userId2],
 *     status: "pending" | "accepted" | "declined" | "blocked",
 *     requesterId: userId1,
 *     createdAt: Timestamp,
 *     updatedAt: Timestamp
 *   }
 * }
 *
 * 규칙:
 * - 문서 ID는 항상 사전순으로 정렬된 userId 조합 (예: "abc_def", "123_456")
 * - users 배열도 동일한 순서로 저장
 * - requesterId는 실제로 요청을 보낸 사용자의 ID
 */

/**
 * 두 사용자 ID로 friendship 문서 ID 생성
 */
export const createFriendshipId = (userId1: string, userId2: string): string => {
  return [userId1, userId2].sort().join('_');
};

/**
 * Friendship 문서에서 상대방 사용자 ID 가져오기
 */
export const getOtherUserId = (friendship: Friendship, currentUserId: string): string => {
  return friendship.users.find(id => id !== currentUserId) || '';
};
