/**
 * 🎯 [SINGLES REINVITE] useFriendReinvite Hook
 *
 * Reusable hook for friend re-invitation functionality (SINGLES matches only)
 * Handles modal state, Cloud Function calls, and LTR filtering
 *
 * This is the singles counterpart to usePartnerReinvite (doubles)
 *
 * Usage:
 * ```typescript
 * const { openFriendReinviteModal, userSearchModalProps } = useFriendReinvite({
 *   currentUserId,
 *   events,
 *   onSuccess: () => refreshActivity(),
 * });
 * ```
 *
 * @author Kim
 * @date 2026-01-01
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useLanguage } from '../contexts/LanguageContext';
import { convertEloToLtr } from '../utils/eloUtils';

/**
 * User selection from UserSearchModal
 */
interface SelectedUser {
  uid: string;
  displayName: string;
}

/**
 * Event data structure for singles friend reinvite
 */
interface EventData {
  id: string;
  clubId: string;
  hostId?: string;
  hostLtr?: number;
  hostLtrLevel?: number;
  minLtr?: number;
  gameType?: string;
  friendInvitations?: Array<{
    userId: string;
    status: 'pending' | 'accepted' | 'rejected';
  }>;
}

/**
 * Hook input props
 */
interface UseFriendReinviteProps {
  currentUserId?: string;
  events: EventData[];
  onSuccess?: () => void;
}

/**
 * Hook return value
 */
interface UseFriendReinviteReturn {
  // Modal control
  openFriendReinviteModal: (eventId: string, gameType?: string) => void;
  closeFriendReinviteModal: () => void;

  // UserSearchModal props
  userSearchModalProps: {
    visible: boolean;
    onClose: () => void;
    onUserSelect: (users: SelectedUser[]) => Promise<void>;
    excludeUserIds: string[];
    clubId: string;
    genderFilter: 'male' | 'female' | null;
    hostLtr?: number;
    gameType?: string;
    isPartnerSelection: boolean;
  };
}

/**
 * 🎯 [SINGLES REINVITE] Custom hook for friend re-invitation
 */
export const useFriendReinvite = ({
  currentUserId,
  events,
  onSuccess,
}: UseFriendReinviteProps): UseFriendReinviteReturn => {
  const { t } = useLanguage();

  // Modal state
  const [reinviteModalVisible, setReinviteModalVisible] = useState(false);
  const [reinviteEventId, setReinviteEventId] = useState<string | null>(null);
  const [reinviteGameType, setReinviteGameType] = useState<string | undefined>(undefined);
  const [reinviteClubId, setReinviteClubId] = useState<string>('');
  const [reinviteHostLtr, setReinviteHostLtr] = useState<number | undefined>(undefined);
  const [excludedUserIds, setExcludedUserIds] = useState<string[]>([]);

  /**
   * Fetch host's ELO from Firestore and convert to LTR
   */
  const fetchHostLtrFromElo = useCallback(
    async (hostId: string, gameType?: string): Promise<number | undefined> => {
      try {
        const userDoc = await getDoc(doc(db, 'users', hostId));
        if (!userDoc.exists()) {
          console.warn('⚠️ [useFriendReinvite] Host user not found:', hostId);
          return undefined;
        }

        const userData = userDoc.data();
        // Singles always use singles ELO
        const elo = userData?.eloRatings?.singles?.current;

        if (elo === undefined) {
          console.warn('⚠️ [useFriendReinvite] Host ELO not found, using default');
          return 5;
        }

        const ltr = convertEloToLtr(elo);
        console.log('📊 [useFriendReinvite] Host LTR calculated from ELO:', {
          hostId,
          elo,
          ltr,
          gameType,
        });
        return ltr;
      } catch (error) {
        console.error('❌ [useFriendReinvite] Error fetching host ELO:', error);
        return undefined;
      }
    },
    []
  );

  /**
   * Open friend re-invite modal
   */
  const openFriendReinviteModal = useCallback(
    async (eventId: string, gameType?: string) => {
      const event = events.find(e => e.id === eventId);
      if (!event) {
        Alert.alert(t('common.error'), t('partnerReinvite.eventNotFound'));
        return;
      }

      const effectiveGameType = gameType || event.gameType;

      // 🎯 [LTR FIX v3] ALWAYS fetch host's current LTR from ELO (Single Source of Truth)
      // - Firestore에 저장된 hostLtr는 이벤트 생성 시점의 값이라 outdated될 수 있음
      // - 실시간 ELO 조회로 항상 최신 LTR 사용
      let effectiveHostLtr: number | undefined;

      if (event.hostId) {
        console.log('🔄 [useFriendReinvite] Fetching current host LTR from ELO...');
        effectiveHostLtr = await fetchHostLtrFromElo(event.hostId, effectiveGameType);
      }

      // Fallback to stored values only if ELO lookup fails
      if (effectiveHostLtr === undefined) {
        effectiveHostLtr = event.hostLtr ?? event.hostLtrLevel;
        console.log('⚠️ [useFriendReinvite] Using stored hostLtr as fallback:', effectiveHostLtr);
      }

      // Build exclude list: current user + already invited friends
      const alreadyInvitedIds = (event.friendInvitations || []).map(inv => inv.userId);
      const excludeIds = currentUserId ? [currentUserId, ...alreadyInvitedIds] : alreadyInvitedIds;

      console.log('🔍 [useFriendReinvite] Setting friend reinvite modal data:', {
        eventId,
        clubId: event.clubId || '(public event)',
        storedHostLtr: event.hostLtr,
        effectiveHostLtr,
        gameType: effectiveGameType,
        excludedUserIds: excludeIds.length,
        source: 'ELO lookup (real-time)', // 🎯 [LTR FIX v3] Always use real-time ELO
      });

      setReinviteEventId(eventId);
      setReinviteGameType(effectiveGameType);
      setReinviteClubId(event.clubId);
      setReinviteHostLtr(effectiveHostLtr);
      setExcludedUserIds(excludeIds);
      setReinviteModalVisible(true);
    },
    [events, t, fetchHostLtrFromElo, currentUserId]
  );

  /**
   * Close friend re-invite modal
   */
  const closeFriendReinviteModal = () => {
    setReinviteModalVisible(false);
  };

  /**
   * Handle friend selection from UserSearchModal
   */
  const handleFriendSelected = async (users: SelectedUser[]) => {
    if (users.length === 0 || !reinviteEventId) return;

    const selectedFriend = users[0]; // Only one friend for singles

    try {
      // Call reinviteFriend Cloud Function
      const functions = getFunctions();
      const reinviteFn = httpsCallable(functions, 'reinviteFriend');

      await reinviteFn({
        eventId: reinviteEventId,
        newFriendId: selectedFriend.uid,
        newFriendName: selectedFriend.displayName,
      });

      console.log('✅ [useFriendReinvite] Friend reinvited successfully:', {
        eventId: reinviteEventId,
        newFriendId: selectedFriend.uid,
        newFriendName: selectedFriend.displayName,
      });

      Alert.alert(
        t('common.success'),
        t('partnerReinvite.invitationSent', { name: selectedFriend.displayName })
      );

      setReinviteModalVisible(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('❌ [useFriendReinvite] Error re-inviting friend:', error);
      Alert.alert(t('common.error'), t('partnerReinvite.invitationError'));
    }
  };

  /**
   * Derive gender filter from game type
   * ⚠️ IMPORTANT: Check 'womens' BEFORE 'mens' because 'womens' contains 'mens'!
   */
  const genderFilter = reinviteGameType?.toLowerCase().includes('womens')
    ? 'female'
    : reinviteGameType?.toLowerCase().includes('mens')
      ? 'male'
      : null;

  return {
    openFriendReinviteModal,
    closeFriendReinviteModal,
    userSearchModalProps: {
      visible: reinviteModalVisible,
      onClose: closeFriendReinviteModal,
      onUserSelect: handleFriendSelected,
      excludeUserIds: excludedUserIds,
      clubId: reinviteClubId,
      genderFilter,
      hostLtr: reinviteHostLtr,
      gameType: reinviteGameType,
      isPartnerSelection: false, // This is friend selection for singles, not partner
    },
  };
};
