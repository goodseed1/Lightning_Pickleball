/**
 * 친구 관계 관리를 위한 서비스
 *
 * 📝 LTR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LTR" (Lightning Tennis Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LTR로 변경하고 코드는 ntrp를 유지합니다.
 */

import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  doc,
  getDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase/config';
import {
  Friendship,
  Friend,
  FriendRequest,
  FriendSearchResult,
  createFriendshipId,
  getOtherUserId,
} from '../types/friendship';

class FriendshipService {
  /**
   * 친구 요청 보내기
   */
  async sendFriendRequest(
    targetUserId: string
  ): Promise<{ success: boolean; message: string; autoAccepted?: boolean }> {
    try {
      const sendRequest = httpsCallable(functions, 'sendFriendRequest');
      const result = await sendRequest({ targetUserId });
      return result.data as { success: boolean; message: string; autoAccepted?: boolean };
    } catch (error: unknown) {
      console.error('Error sending friend request:', error);
      const message = error instanceof Error ? error.message : 'Failed to send friend request';
      throw new Error(message);
    }
  }

  /**
   * 친구 요청 수락
   */
  async acceptFriendRequest(requesterId: string): Promise<{ success: boolean; message: string }> {
    try {
      const acceptRequest = httpsCallable(functions, 'acceptFriendRequest');
      const result = await acceptRequest({ requesterId });
      return result.data as { success: boolean; message: string };
    } catch (error: unknown) {
      console.error('Error accepting friend request:', error);
      const message = error instanceof Error ? error.message : 'Failed to accept friend request';
      throw new Error(message);
    }
  }

  /**
   * 친구 요청 거절
   */
  async declineFriendRequest(
    requesterId: string,
    shouldBlock = false
  ): Promise<{ success: boolean; message: string }> {
    try {
      const declineRequest = httpsCallable(functions, 'declineFriendRequest');
      const result = await declineRequest({ requesterId, shouldBlock });
      return result.data as { success: boolean; message: string };
    } catch (error: unknown) {
      console.error('Error declining friend request:', error);
      const message = error instanceof Error ? error.message : 'Failed to decline friend request';
      throw new Error(message);
    }
  }

  /**
   * 사용자의 친구 목록 가져오기 (실시간)
   */
  subscribeToFriends(userId: string, callback: (friends: Friend[]) => void): Unsubscribe {
    const friendshipsQuery = query(
      collection(db, 'friendships'),
      where('users', 'array-contains', userId),
      where('status', '==', 'accepted'),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(friendshipsQuery, async snapshot => {
      try {
        const friends: Friend[] = [];

        for (const docSnapshot of snapshot.docs) {
          const friendship = { id: docSnapshot.id, ...docSnapshot.data() } as Friendship;
          const friendUserId = getOtherUserId(friendship, userId);

          // 친구 사용자 정보 가져오기
          const friendDoc = await getDoc(doc(db, 'users', friendUserId));
          if (friendDoc.exists()) {
            const friendData = friendDoc.data();
            // skillLevel 추출: root level skillLevel 우선, 없으면 profile.skillLevel
            // root level에 숫자형 NTRP 값이 있고, profile.skillLevel은 객체로 저장됨
            const rootSkillLevel = friendData.skillLevel;
            const profileSkillLevel = friendData.profile?.skillLevel;
            let skillLevelDisplay: string | number | undefined;

            if (typeof rootSkillLevel === 'number' || typeof rootSkillLevel === 'string') {
              // root level에 직접 값이 있으면 사용
              skillLevelDisplay = rootSkillLevel;
            } else if (typeof profileSkillLevel === 'object' && profileSkillLevel?.selfAssessed) {
              // profile.skillLevel이 객체면 selfAssessed 추출
              skillLevelDisplay = profileSkillLevel.selfAssessed;
            } else if (profileSkillLevel) {
              skillLevelDisplay = profileSkillLevel;
            }
            // 🎾 [KIM FIX v25] ELO-based LTR: Use eloRatings only (Single Source of Truth)
            const eloRatings = friendData.eloRatings as
              | { singles?: { current?: number } }
              | undefined;
            const singlesElo = eloRatings?.singles?.current;

            const friend: Friend = {
              id: friendship.id,
              userId: friendUserId,
              name: friendData.profile?.displayName || friendData.displayName || 'Unknown',
              // 🎯 [KIM FIX] Check multiple locations for profile image
              profileImage:
                friendData.profile?.photoURL ||
                friendData.photoURL ||
                friendData.profile?.profileImage ||
                friendData.profileImage,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              skillLevel: skillLevelDisplay as any,
              singlesElo: singlesElo || undefined,
              location: friendData.profile?.location,
              isOnline: friendData.isOnline || false,
              lastSeen: friendData.lastSeen?.toDate(),
            };
            friends.push(friend);
          }
        }

        callback(friends);
      } catch (error) {
        console.error('Error processing friends:', error);
        callback([]);
      }
    });
  }

  /**
   * 받은 친구 요청 목록 가져오기 (실시간)
   */
  subscribeToFriendRequests(
    userId: string,
    callback: (requests: FriendRequest[]) => void
  ): Unsubscribe {
    const requestsQuery = query(
      collection(db, 'friendships'),
      where('users', 'array-contains', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(requestsQuery, async snapshot => {
      try {
        const requests: FriendRequest[] = [];

        for (const docSnapshot of snapshot.docs) {
          const friendship = { id: docSnapshot.id, ...docSnapshot.data() } as Friendship;

          // 내가 받은 요청만 (내가 요청자가 아닌 경우)
          if (friendship.requesterId !== userId) {
            const requesterDoc = await getDoc(doc(db, 'users', friendship.requesterId));
            if (requesterDoc.exists()) {
              const requesterData = requesterDoc.data();
              // skillLevel 추출: root level skillLevel 우선, 없으면 profile.skillLevel
              const rootSkillLevel = requesterData.skillLevel;
              const profileSkillLevel = requesterData.profile?.skillLevel;
              let skillLevelDisplay: string | number | undefined;

              if (typeof rootSkillLevel === 'number' || typeof rootSkillLevel === 'string') {
                skillLevelDisplay = rootSkillLevel;
              } else if (typeof profileSkillLevel === 'object' && profileSkillLevel?.selfAssessed) {
                skillLevelDisplay = profileSkillLevel.selfAssessed;
              } else if (profileSkillLevel) {
                skillLevelDisplay = profileSkillLevel;
              }
              // 🎾 [KIM FIX v25] ELO-based LTR: Use eloRatings only (Single Source of Truth)
              const eloRatings = requesterData.eloRatings as
                | { singles?: { current?: number } }
                | undefined;
              const singlesElo = eloRatings?.singles?.current;

              const request: FriendRequest = {
                id: friendship.id,
                requesterId: friendship.requesterId,
                requesterName:
                  requesterData.profile?.displayName || requesterData.displayName || 'Unknown',
                // 🎯 [KIM FIX] Check multiple locations for profile image
                requesterProfileImage:
                  requesterData.profile?.photoURL ||
                  requesterData.photoURL ||
                  requesterData.profile?.profileImage ||
                  requesterData.profileImage,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                requesterSkillLevel: skillLevelDisplay as any,
                requesterSinglesElo: singlesElo || undefined,
                createdAt:
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (friendship.createdAt as any)?.toDate
                    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (friendship.createdAt as any).toDate()
                    : friendship.createdAt,
              };
              requests.push(request);
            }
          }
        }

        callback(requests);
      } catch (error) {
        console.error('Error processing friend requests:', error);
        callback([]);
      }
    });
  }

  /**
   * 사용자 검색 (친구 찾기)
   */
  async searchUsers(
    searchTerm: string,
    currentUserId: string,
    limitResults = 20
  ): Promise<FriendSearchResult[]> {
    try {
      if (!searchTerm.trim()) {
        return [];
      }

      // 사용자 검색 (닉네임 기준)
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('profile.nickname'),
        limit(50) // 초기 쿼리 제한
      );

      const usersSnapshot = await getDocs(usersQuery);
      const searchResults: FriendSearchResult[] = [];

      // 현재 사용자의 친구 관계 상태 확인
      const friendshipStatusMap = await this.getFriendshipStatusMap(currentUserId);

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;

        // 자기 자신 제외
        if (userId === currentUserId) continue;

        const nickname = userData.profile?.displayName || userData.displayName || '';

        // 검색어와 매치하는지 확인 (대소문자 무시)
        if (nickname.toLowerCase().includes(searchTerm.toLowerCase())) {
          const friendshipId = createFriendshipId(currentUserId, userId);
          const friendshipStatus = friendshipStatusMap.get(friendshipId);

          // skillLevel 추출: root level skillLevel 우선, 없으면 profile.skillLevel
          const rootSkillLevel = userData.skillLevel;
          const profileSkillLevel = userData.profile?.skillLevel;
          let skillLevelDisplay: string | number | undefined;

          if (typeof rootSkillLevel === 'number' || typeof rootSkillLevel === 'string') {
            skillLevelDisplay = rootSkillLevel;
          } else if (typeof profileSkillLevel === 'object' && profileSkillLevel?.selfAssessed) {
            skillLevelDisplay = profileSkillLevel.selfAssessed;
          } else if (profileSkillLevel) {
            skillLevelDisplay = profileSkillLevel;
          }

          // 🎾 [KIM FIX v25] ELO-based LTR: Use eloRatings only (Single Source of Truth)
          const eloRatings = userData.eloRatings as { singles?: { current?: number } } | undefined;
          const singlesElo = eloRatings?.singles?.current;

          const searchResult: FriendSearchResult = {
            id: userId,
            nickname,
            // 🎯 [KIM FIX] Check multiple locations for profile image
            profileImage:
              userData.profile?.photoURL ||
              userData.photoURL ||
              userData.profile?.profileImage ||
              userData.profileImage,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            skillLevel: skillLevelDisplay as any,
            singlesElo: singlesElo || undefined,
            location: userData.profile?.location,
            isFriend: friendshipStatus === 'accepted',
            hasPendingRequest: friendshipStatus === 'pending',
          };

          searchResults.push(searchResult);

          // 결과 개수 제한
          if (searchResults.length >= limitResults) break;
        }
      }

      return searchResults;
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  /**
   * 현재 사용자의 친구 관계 상태 맵 생성
   */
  private async getFriendshipStatusMap(userId: string): Promise<Map<string, string>> {
    const statusMap = new Map<string, string>();

    try {
      const friendshipsQuery = query(
        collection(db, 'friendships'),
        where('users', 'array-contains', userId)
      );

      const snapshot = await getDocs(friendshipsQuery);

      snapshot.docs.forEach(doc => {
        const friendship = doc.data();
        statusMap.set(doc.id, friendship.status);
      });
    } catch (error) {
      console.error('Error loading friendship status:', error);
    }

    return statusMap;
  }

  /**
   * 특정 사용자와의 친구 관계 상태 확인
   */
  async getFriendshipStatus(currentUserId: string, targetUserId: string): Promise<string | null> {
    try {
      const friendshipId = createFriendshipId(currentUserId, targetUserId);
      const friendshipDoc = await getDoc(doc(db, 'friendships', friendshipId));

      if (friendshipDoc.exists()) {
        return friendshipDoc.data().status;
      }

      return null;
    } catch (error) {
      console.error('Error checking friendship status:', error);
      return null;
    }
  }
}

// 싱글톤 인스턴스 생성 및 export
const friendshipService = new FriendshipService();
export default friendshipService;
