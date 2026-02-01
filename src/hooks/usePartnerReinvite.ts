/**
 * usePartnerReinvite Hook
 *
 * Reusable hook for partner re-invitation functionality
 * Handles modal state, Cloud Function calls, and gender filtering
 *
 * Usage:
 * ```typescript
 * const { openReinviteModal, userSearchModalProps } = usePartnerReinvite({
 *   currentLanguage,
 *   currentUserId,
 *   events, // Array of events to search for clubId
 *   onSuccess: () => refreshActivity(),
 * });
 * ```
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
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
 * Event data structure for clubId lookup
 * 🎯 [LPR FIX] Added hostLtr/minLtr for partner LPR filtering
 */
interface EventData {
  id: string;
  clubId?: string;
  hostId?: string; // 🎯 [LPR FIX v2] Host's user ID for ELO lookup fallback
  hostLtr?: number; // 🎯 [LPR FIX] Host's LPR level for ±1 filtering (preferred)
  hostLtrLevel?: number; // 🎯 [LPR FIX v2] Legacy field fallback
  minLtr?: number; // 🎯 [LPR FIX] Fallback: minLtr from Firestore (= hostLtr for singles)
  gameType?: string; // 🎯 [LPR FIX] Game type for LPR lookup
}

/**
 * Hook input props
 */
interface UsePartnerReinviteProps {
  currentUserId?: string;
  events: EventData[]; // Events array to find clubId
  onSuccess?: () => void; // Callback after successful re-invite
}

/**
 * Hook return value
 */
interface UsePartnerReinviteReturn {
  // Modal control
  openReinviteModal: (eventId: string, gameType?: string) => void;
  closeReinviteModal: () => void;

  // UserSearchModal props
  userSearchModalProps: {
    visible: boolean;
    onClose: () => void;
    onUserSelect: (users: SelectedUser[]) => Promise<void>;
    excludeUserIds: string[];
    clubId: string;
    genderFilter: 'male' | 'female' | null;
    hostLtr?: number; // 🎯 [LPR FIX] Host's LPR level for ±2 filtering
    gameType?: string; // 🎯 [LPR FIX] Game type for LPR lookup
    isPartnerSelection: boolean; // 🎯 [LPR FIX] Always true for partner selection
  };
}

/**
 * Custom hook for partner re-invitation
 */
export const usePartnerReinvite = ({
  currentUserId,
  events,
  onSuccess,
}: UsePartnerReinviteProps): UsePartnerReinviteReturn => {
  const { t } = useLanguage();

  // 🛡️ [CAPTAIN AMERICA] Re-invite partner modal state
  const [reinviteModalVisible, setReinviteModalVisible] = useState(false);
  const [reinviteEventId, setReinviteEventId] = useState<string | null>(null);
  const [reinviteGameType, setReinviteGameType] = useState<string | undefined>(undefined);
  const [reinviteClubId, setReinviteClubId] = useState<string>('');
  const [reinviteHostLtr, setReinviteHostLtr] = useState<number | undefined>(undefined); // 🎯 [LPR FIX]

  /**
   * 🎯 [LPR FIX v2] Fetch host's ELO from Firestore and convert to LPR
   * Used as fallback when hostLtr is not stored in event
   */
  const fetchHostLtrFromElo = useCallback(
    async (hostId: string, gameType?: string): Promise<number | undefined> => {
      try {
        const userDoc = await getDoc(doc(db, 'users', hostId));
        if (!userDoc.exists()) {
          console.warn('⚠️ [usePartnerReinvite] Host user not found:', hostId);
          return undefined;
        }

        const userData = userDoc.data();
        // 🎯 [LPR FIX v3] Determine which ELO to use based on game type
        // - mixed_doubles → mixed ELO
        // - mens_doubles/womens_doubles → doubles ELO
        // - singles → singles ELO
        let elo: number | undefined;
        const gt = gameType?.toLowerCase();

        if (gt === 'mixed_doubles' || gt?.includes('mixed')) {
          elo = userData?.eloRatings?.mixed?.current;
        } else if (gt?.includes('doubles')) {
          elo = userData?.eloRatings?.doubles?.current;
        } else {
          elo = userData?.eloRatings?.singles?.current;
        }

        if (elo === undefined) {
          console.warn('⚠️ [usePartnerReinvite] Host ELO not found, using default');
          return 5; // Default LPR
        }

        const ltr = convertEloToLtr(elo);
        console.log('📊 [usePartnerReinvite] Host LPR calculated from ELO:', {
          hostId,
          elo,
          ltr,
          gameType,
        });
        return ltr;
      } catch (error) {
        console.error('❌ [usePartnerReinvite] Error fetching host ELO:', error);
        return undefined;
      }
    },
    []
  );

  /**
   * Open re-invite modal
   * 🎯 [LPR FIX v2] Now async to support ELO lookup fallback
   */
  const openReinviteModal = useCallback(
    async (eventId: string, gameType?: string) => {
      // Find the event to get clubId
      const event = events.find(e => e.id === eventId);
      if (!event) {
        Alert.alert(t('common.error'), t('partnerReinvite.eventNotFound'));
        return;
      }

      const effectiveGameType = gameType || event.gameType;

      // 🎯 [LPR FIX v3] ALWAYS fetch host's current LPR from ELO (Single Source of Truth)
      // - Firestore에 저장된 hostLtr는 이벤트 생성 시점의 값이라 outdated될 수 있음
      // - 실시간 ELO 조회로 항상 최신 LPR 사용
      let effectiveHostLtr: number | undefined;

      if (event.hostId) {
        console.log('🔄 [usePartnerReinvite] Fetching current host LPR from ELO...');
        effectiveHostLtr = await fetchHostLtrFromElo(event.hostId, effectiveGameType);
      }

      // Fallback to stored values only if ELO lookup fails
      if (effectiveHostLtr === undefined) {
        effectiveHostLtr = event.hostLtr ?? event.hostLtrLevel;
        console.log('⚠️ [usePartnerReinvite] Using stored hostLtr as fallback:', effectiveHostLtr);
      }

      console.log('🔍 [usePartnerReinvite] Setting reinvite modal data:', {
        clubId: event.clubId || '(public event)',
        hostId: event.hostId,
        storedHostLtr: event.hostLtr,
        storedHostLtrLevel: event.hostLtrLevel,
        effectiveHostLtr,
        gameType: effectiveGameType,
        source: 'ELO lookup (real-time)', // 🎯 [LPR FIX v3] Always use real-time ELO
      });
      setReinviteEventId(eventId);
      setReinviteGameType(effectiveGameType);
      setReinviteClubId(event.clubId || '');
      setReinviteHostLtr(effectiveHostLtr); // 🎯 [LPR FIX v2] Store hostLtr for filtering
      setReinviteModalVisible(true);
    },
    [events, t, fetchHostLtrFromElo]
  );

  /**
   * Close re-invite modal
   */
  const closeReinviteModal = () => {
    setReinviteModalVisible(false);
  };

  /**
   * Handle partner selection from UserSearchModal
   */
  const handlePartnerSelected = async (users: SelectedUser[]) => {
    if (users.length === 0 || !reinviteEventId) return;

    const selectedPartner = users[0]; // Only one partner for doubles

    try {
      // Step 1: Try to find the rejected partner invitation (optional)
      const invitationsRef = collection(db, 'partner_invitations');
      const q = query(
        invitationsRef,
        where('eventId', '==', reinviteEventId),
        where('status', '==', 'rejected'),
        orderBy('respondedAt', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(q);

      // 🚀 [EMERGENCY FIX] oldInvitationId is optional now
      // If no rejected invitation exists, proceed with null (first-time invite scenario)
      const oldInvitationId = snapshot.empty ? null : snapshot.docs[0].id;

      console.log('🔍 [usePartnerReinvite] Old invitation search result:', {
        found: !snapshot.empty,
        oldInvitationId,
      });

      // Step 2: Call reinvitePartner Cloud Function
      const functions = getFunctions();
      const reinviteFn = httpsCallable(functions, 'reinvitePartner');

      await reinviteFn({
        eventId: reinviteEventId,
        oldInvitationId, // Can be null
        newPartnerId: selectedPartner.uid, // 🐛 [BUGFIX] Use 'uid' instead of 'id'
        newPartnerName: selectedPartner.displayName,
      });

      console.log('✅ [usePartnerReinvite] Partner reinvited successfully:', {
        eventId: reinviteEventId,
        oldInvitationId,
        newPartnerId: selectedPartner.uid,
        newPartnerName: selectedPartner.displayName,
      });

      Alert.alert(
        t('common.success'),
        t('partnerReinvite.invitationSent', { name: selectedPartner.displayName })
      );

      setReinviteModalVisible(false);

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('❌ [usePartnerReinvite] Error re-inviting partner:', error);
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
    openReinviteModal,
    closeReinviteModal,
    userSearchModalProps: {
      visible: reinviteModalVisible,
      onClose: closeReinviteModal,
      onUserSelect: handlePartnerSelected,
      excludeUserIds: currentUserId ? [currentUserId] : [],
      clubId: reinviteClubId,
      genderFilter,
      hostLtr: reinviteHostLtr, // 🎯 [LPR FIX] Pass hostLtr to UserSearchModal for ±2 filtering
      gameType: reinviteGameType, // 🎯 [LPR FIX] Pass gameType for game-specific LPR lookup
      isPartnerSelection: true, // 🎯 [LPR FIX] Always true - this is partner selection modal
    },
  };
};
