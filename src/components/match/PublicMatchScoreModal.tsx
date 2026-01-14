/**
 * Public Match Score Modal
 * Adapter for ScoreInputModal to work with LightningEvent
 * Converts event data to Match format and calls Cloud Function
 */

import React, { useState } from 'react';
import { Alert } from 'react-native';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase/config';
import { Timestamp } from 'firebase/firestore';
import ScoreInputModal from './ScoreInputModal';
import { Match } from '../../types/match';
import i18n from '../../i18n';

// Local interface extending the event type we need
interface PublicMatchEvent {
  id: string;
  hostId: string;
  hostName: string;
  hostPartnerId?: string;
  hostPartnerName?: string;
  partnerAccepted?: boolean; // 🆕 [KIM FIX] Partner acceptance status
  partnerStatus?: 'pending' | 'rejected'; // 🆕 [KIM FIX] Partner invitation status
  gameType?: string;
  scheduledTime: Date;
  approvedApplications?: Array<{
    applicantId: string;
    applicantName: string;
    partnerId?: string;
    partnerName?: string; // 🎯 [KIM FIX] 도전팀 파트너 이름
  }>;
  // 🆕 [3개월 규칙] 기록경기 여부
  isRankedMatch?: boolean;
  cooldownWarning?: string;
}

interface PublicMatchScoreModalProps {
  visible: boolean;
  event: PublicMatchEvent;
  currentUserId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const PublicMatchScoreModal: React.FC<PublicMatchScoreModalProps> = ({
  visible,
  event,
  currentUserId,
  onClose,
  onSuccess,
}) => {
  const [submitting, setSubmitting] = useState(false);

  // Convert LightningEvent to Match format
  const convertEventToMatch = (): Match => {
    // 🎯 [KIM FIX] Filter out host and host partner from approved applications
    // They are part of the host team, not the opponent team
    const approved = (event.approvedApplications || []).filter(
      app => app.applicantId !== event.hostId && app.applicantId !== event.hostPartnerId
    );
    const isSingles = event.gameType?.includes('singles');

    // Host team name (복식: "Host님 / Partner님", 단식: "Host님")
    // 🛡️ [KIM FIX] Only show partner name if accepted (not rejected)
    const hostTeamName =
      event.hostPartnerName && event.partnerAccepted !== false && event.partnerStatus !== 'rejected'
        ? `${event.hostName} / ${event.hostPartnerName}`
        : event.hostName;

    // Opponent team name (토너먼트 방식)
    // 🎯 [KIM FIX] 복식 경기: 신규 포맷(partnerName) 또는 레거시 포맷(approved[1]) 모두 지원
    let opponentTeamName: string;
    if (isSingles) {
      opponentTeamName = approved[0]?.applicantName || 'Opponent';
    } else {
      const player1Name = approved[0]?.applicantName || 'Player 1';
      // 신규 포맷: partnerName 사용, 레거시 포맷: approved[1] 사용
      const player2Name = approved[0]?.partnerName || approved[1]?.applicantName || 'Partner';
      opponentTeamName = `${player1Name} / ${player2Name}`;
    }

    return {
      id: event.id,
      type: 'lightning_match',
      format: isSingles ? 'singles' : 'doubles',
      player1: {
        userId: event.hostId,
        userName: hostTeamName,
        skillLevel: '3.5', // Default, can be updated if needed
      },
      player2: {
        userId: approved[0]?.applicantId || 'unknown',
        userName: opponentTeamName,
        skillLevel: '3.5', // Default, can be updated if needed
      },
      status: 'scheduled',
      scheduledAt: Timestamp.fromDate(event.scheduledTime),
      clubId: '',
      createdBy: event.hostId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
  };

  // Submit score to Cloud Function
  const handleSubmit = async (scoreData: unknown) => {
    if (submitting) return;

    setSubmitting(true);

    try {
      // 🎯 [KIM FIX] Filter out host and host partner from approved applications
      const approved = (event.approvedApplications || []).filter(
        app => app.applicantId !== event.hostId && app.applicantId !== event.hostPartnerId
      );

      console.log('🏆 [PublicMatchScoreModal] handleSubmit - Event data:', {
        eventId: event.id,
        gameType: event.gameType,
        approvedCount: approved.length,
        approved: approved,
        hostPartnerId: event.hostPartnerId,
      });

      // Validate approved applications exist
      if (approved.length === 0) {
        Alert.alert(
          i18n.t('common.error'),
          i18n.t('modals.publicMatchScore.noApprovedParticipants'),
          [{ text: i18n.t('common.ok') }]
        );
        return;
      }

      const isSingles = event.gameType?.includes('singles');

      // Validate participant count
      if (isSingles && approved.length !== 1) {
        Alert.alert(
          i18n.t('common.error'),
          i18n.t('modals.publicMatchScore.singlesParticipantError', { count: approved.length }),
          [{ text: i18n.t('common.ok') }]
        );
        return;
      }

      // 🎯 [KIM FIX] 복식 경기: 1개(신규 포맷) 또는 2개(레거시 포맷) 허용
      if (!isSingles && approved.length < 1) {
        Alert.alert(
          i18n.t('common.error'),
          i18n.t('modals.publicMatchScore.doublesParticipantError', { count: approved.length }),
          [{ text: i18n.t('common.ok') }]
        );
        return;
      }

      // Determine winner userId
      const winnerId =
        (scoreData as { _winner: string })._winner === 'player1'
          ? event.hostId
          : approved[0].applicantId;

      // Call Cloud Function
      const submitPublicMatchResult = httpsCallable(functions, 'submitPublicMatchResult');

      // 🎯 [KIM FIX] 신규 팀 포맷(1개 신청 + partnerId) 및 레거시 포맷(2개 신청) 모두 지원
      // 레거시: approved[1]?.applicantId
      // 신규: approved[0]?.partnerId
      const opponentPartnerId = approved[1]?.applicantId || approved[0]?.partnerId;

      console.log('📊 [PublicMatchScoreModal] Submitting result with partner info:', {
        approvedCount: approved.length,
        opponentId: approved[0].applicantId,
        opponentPartnerIdFromApproved1: approved[1]?.applicantId,
        opponentPartnerIdFromApproved0Partner: approved[0]?.partnerId,
        finalOpponentPartnerId: opponentPartnerId,
      });

      await submitPublicMatchResult({
        eventId: event.id,
        hostId: event.hostId,
        gameType: event.gameType,
        sets: (scoreData as { sets: unknown[] }).sets,
        winnerId,
        finalScore: (scoreData as { finalScore?: string }).finalScore || '',
        // 복식인 경우
        hostPartnerId: event.hostPartnerId,
        opponentId: approved[0].applicantId,
        opponentPartnerId, // 🎯 [KIM FIX] 신규/레거시 포맷 모두 지원
      });

      // 🆕 [3개월 규칙] 친선경기 여부에 따라 메시지 변경
      const successMessage =
        event.isRankedMatch === false
          ? i18n.t('modals.publicMatchScore.submitSuccessFriendly')
          : i18n.t('modals.publicMatchScore.submitSuccess');

      Alert.alert(i18n.t('common.success'), successMessage, [
        {
          text: i18n.t('common.ok'),
          onPress: () => {
            onSuccess();
            onClose();
          },
        },
      ]);
    } catch (error) {
      console.error('❌ [PublicMatchScoreModal] Error submitting score:', error);
      Alert.alert(
        i18n.t('common.error'),
        (error as { message?: string }).message || i18n.t('modals.publicMatchScore.submitError'),
        [{ text: i18n.t('common.ok') }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const match = convertEventToMatch();

  return (
    <ScoreInputModal
      visible={visible}
      match={match}
      currentUserId={currentUserId}
      onClose={onClose}
      onSubmit={handleSubmit}
    />
  );
};

export default PublicMatchScoreModal;
