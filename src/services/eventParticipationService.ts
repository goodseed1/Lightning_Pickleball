/**
 * Event Participation Service
 * Lightning Pickleball 이벤트 참여 관리 서비스
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  increment,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase/config';
import {
  EventParticipationRequest,
  ParticipationType,
  ParticipationStatus,
  ParticipationRequestResponse,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  UpdateParticipationStatusRequest,
  EventParticipationSummary,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  AutoApprovalEligibilityResult,
} from '../types/eventParticipation';

class EventParticipationService {
  /**
   * 이벤트 참여 요청
   */
  async requestParticipation(
    eventId: string,
    participationType: ParticipationType = 'participant'
  ): Promise<ParticipationRequestResponse> {
    try {
      const requestFunction = httpsCallable(functions, 'requestEventParticipation');
      const result = await requestFunction({
        eventId,
        participationType,
      });

      return result.data as ParticipationRequestResponse;
    } catch (error) {
      console.error('Error requesting participation:', error);
      throw error;
    }
  }

  /**
   * 참여 상태 업데이트 (관리자용)
   */
  async updateParticipationStatus(
    participationId: string,
    status: 'approved' | 'rejected',
    reason?: string
  ): Promise<{ success: boolean; participationId: string; status: string }> {
    try {
      const updateFunction = httpsCallable(functions, 'updateParticipationStatus');
      const result = await updateFunction({
        participationId,
        status,
        reason,
      });

      return result.data as { success: boolean; participationId: string; status: string };
    } catch (error) {
      console.error('Error updating participation status:', error);
      throw error;
    }
  }

  /**
   * 사용자의 참여 요청 목록 조회
   */
  async getUserParticipations(userId: string): Promise<EventParticipationRequest[]> {
    try {
      const participationsRef = collection(db, 'eventParticipations');
      const q = query(
        participationsRef,
        where('userId', '==', userId),
        orderBy('requestedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as EventParticipationRequest[];
    } catch (error) {
      console.error('Error getting user participations:', error);
      throw error;
    }
  }

  /**
   * 이벤트의 참여 요청 목록 조회
   */
  async getEventParticipations(eventId: string): Promise<EventParticipationRequest[]> {
    try {
      const participationsRef = collection(db, 'eventParticipations');
      const q = query(
        participationsRef,
        where('eventId', '==', eventId),
        orderBy('requestedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as EventParticipationRequest[];
    } catch (error) {
      console.error('Error getting event participations:', error);
      throw error;
    }
  }

  /**
   * 특정 이벤트의 승인된 참가자 목록 조회
   */
  async getApprovedParticipants(eventId: string): Promise<EventParticipationRequest[]> {
    try {
      const participationsRef = collection(db, 'eventParticipations');
      const q = query(
        participationsRef,
        where('eventId', '==', eventId),
        where('status', 'in', ['approved', 'confirmed']),
        orderBy('approvedAt', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as EventParticipationRequest[];
    } catch (error) {
      console.error('Error getting approved participants:', error);
      throw error;
    }
  }

  /**
   * 특정 이벤트의 대기자 목록 조회
   */
  async getWaitlistedParticipants(eventId: string): Promise<EventParticipationRequest[]> {
    try {
      const participationsRef = collection(db, 'eventParticipations');
      const q = query(
        participationsRef,
        where('eventId', '==', eventId),
        where('status', '==', 'waitlisted'),
        orderBy('waitlistedAt', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as EventParticipationRequest[];
    } catch (error) {
      console.error('Error getting waitlisted participants:', error);
      throw error;
    }
  }

  /**
   * 특정 이벤트의 승인 대기 중인 요청 목록 조회
   */
  async getPendingParticipations(eventId: string): Promise<EventParticipationRequest[]> {
    try {
      const participationsRef = collection(db, 'eventParticipations');
      const q = query(
        participationsRef,
        where('eventId', '==', eventId),
        where('status', '==', 'pending'),
        orderBy('requestedAt', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as EventParticipationRequest[];
    } catch (error) {
      console.error('Error getting pending participations:', error);
      throw error;
    }
  }

  /**
   * 클럽의 모든 이벤트 참여 요청 조회 (관리자용)
   */
  async getClubParticipations(
    clubId: string,
    status?: ParticipationStatus
  ): Promise<EventParticipationRequest[]> {
    try {
      const participationsRef = collection(db, 'eventParticipations');
      let q = query(
        participationsRef,
        where('eventSnapshot.clubId', '==', clubId),
        orderBy('requestedAt', 'desc')
      );

      if (status) {
        q = query(
          participationsRef,
          where('eventSnapshot.clubId', '==', clubId),
          where('status', '==', status),
          orderBy('requestedAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as EventParticipationRequest[];
    } catch (error) {
      console.error('Error getting club participations:', error);
      throw error;
    }
  }

  /**
   * 이벤트 참여 요약 정보 조회
   */
  async getEventParticipationSummary(eventId: string): Promise<EventParticipationSummary> {
    try {
      const participations = await this.getEventParticipations(eventId);

      const summary: EventParticipationSummary = {
        eventId,
        totalParticipants: participations.length,
        confirmedParticipants: participations.filter(p =>
          ['approved', 'confirmed'].includes(p.status)
        ).length,
        waitlistedParticipants: participations.filter(p => p.status === 'waitlisted').length,

        participantsByType: {
          participants: participations.filter(p => p.participationType === 'participant').length,
          spectators: participations.filter(p => p.participationType === 'spectator').length,
          helpers: participations.filter(p => p.participationType === 'helper').length,
        },

        autoApprovedCount: participations.filter(
          p => p.approvalReason === 'club_member_regular_meeting'
        ).length,
        manualApprovedCount: participations.filter(
          p =>
            ['approved', 'confirmed'].includes(p.status) &&
            p.approvalReason !== 'club_member_regular_meeting'
        ).length,

        lastUpdated: Timestamp.now(),
      };

      return summary;
    } catch (error) {
      console.error('Error getting participation summary:', error);
      throw error;
    }
  }

  /**
   * 사용자의 특정 이벤트 참여 상태 확인
   */
  async getUserEventParticipationStatus(
    userId: string,
    eventId: string
  ): Promise<EventParticipationRequest | null> {
    try {
      const participationsRef = collection(db, 'eventParticipations');
      const q = query(
        participationsRef,
        where('userId', '==', userId),
        where('eventId', '==', eventId),
        limit(1)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as EventParticipationRequest;
    } catch (error) {
      console.error('Error getting user event participation status:', error);
      throw error;
    }
  }

  /**
   * 참여 취소
   */
  async cancelParticipation(participationId: string): Promise<void> {
    try {
      const participationRef = doc(db, 'eventParticipations', participationId);
      await updateDoc(participationRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 이벤트 참가자 수 감소 (승인된 상태였던 경우만)
      const participationDoc = await getDoc(participationRef);
      if (participationDoc.exists()) {
        const data = participationDoc.data();
        if (['approved', 'confirmed'].includes(data.status)) {
          const eventRef = doc(db, 'events', data.eventId);
          await updateDoc(eventRef, {
            participantCount: increment(-1),
            updatedAt: serverTimestamp(),
          });

          // 대기자가 있다면 자동 승인 처리
          await this.promoteWaitlistedParticipant(data.eventId);
        }
      }
    } catch (error) {
      console.error('Error cancelling participation:', error);
      throw error;
    }
  }

  /**
   * 대기자 자동 승급
   */
  private async promoteWaitlistedParticipant(eventId: string): Promise<void> {
    try {
      const waitlisted = await this.getWaitlistedParticipants(eventId);
      if (waitlisted.length === 0) return;

      // 가장 먼저 대기한 사람을 승급
      const nextParticipant = waitlisted[0];
      await this.updateParticipationStatus(
        nextParticipant.id,
        'approved',
        'Auto-promoted from waitlist'
      );

      console.log(`🎉 Auto-promoted participant ${nextParticipant.userId} from waitlist`);
    } catch (error) {
      console.error('Error promoting waitlisted participant:', error);
    }
  }

  /**
   * 이벤트 참여 요청 실시간 구독
   */
  subscribeToEventParticipations(
    eventId: string,
    callback: (participations: EventParticipationRequest[]) => void
  ): Unsubscribe {
    const participationsRef = collection(db, 'eventParticipations');
    const q = query(
      participationsRef,
      where('eventId', '==', eventId),
      orderBy('requestedAt', 'desc')
    );

    return onSnapshot(
      q,
      snapshot => {
        const participations = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as EventParticipationRequest[];

        callback(participations);
      },
      error => {
        console.error('Error in participation subscription:', error);
      }
    );
  }

  /**
   * 사용자 참여 요청 실시간 구독
   */
  subscribeToUserParticipations(
    userId: string,
    callback: (participations: EventParticipationRequest[]) => void
  ): Unsubscribe {
    const participationsRef = collection(db, 'eventParticipations');
    const q = query(
      participationsRef,
      where('userId', '==', userId),
      orderBy('requestedAt', 'desc')
    );

    return onSnapshot(
      q,
      snapshot => {
        const participations = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as EventParticipationRequest[];

        callback(participations);
      },
      error => {
        console.error('Error in user participation subscription:', error);
      }
    );
  }

  /**
   * 승인 대기 중인 요청 실시간 구독 (관리자용)
   */
  subscribeToPendingApprovals(
    eventId: string,
    callback: (participations: EventParticipationRequest[]) => void
  ): Unsubscribe {
    const participationsRef = collection(db, 'eventParticipations');
    const q = query(
      participationsRef,
      where('eventId', '==', eventId),
      where('status', '==', 'pending'),
      orderBy('requestedAt', 'asc')
    );

    return onSnapshot(
      q,
      snapshot => {
        const participations = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as EventParticipationRequest[];

        callback(participations);
      },
      error => {
        console.error('Error in pending approvals subscription:', error);
      }
    );
  }

  /**
   * 클럽 승인 대기 요청 실시간 구독 (클럽 관리자용)
   */
  subscribeToClubPendingApprovals(
    clubId: string,
    callback: (participations: EventParticipationRequest[]) => void
  ): Unsubscribe {
    const participationsRef = collection(db, 'eventParticipations');
    const q = query(
      participationsRef,
      where('eventSnapshot.clubId', '==', clubId),
      where('status', '==', 'pending'),
      orderBy('requestedAt', 'asc')
    );

    return onSnapshot(
      q,
      snapshot => {
        const participations = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as EventParticipationRequest[];

        callback(participations);
      },
      error => {
        console.error('Error in club pending approvals subscription:', error);
      }
    );
  }

  /**
   * 참여 확정 (체크인)
   */
  async confirmParticipation(participationId: string, notes?: string): Promise<void> {
    try {
      const participationRef = doc(db, 'eventParticipations', participationId);
      await updateDoc(participationRef, {
        status: 'confirmed',
        confirmedAt: serverTimestamp(),
        notes: notes || '',
        updatedAt: serverTimestamp(),
      });

      console.log(`✅ Participation confirmed: ${participationId}`);
    } catch (error) {
      console.error('Error confirming participation:', error);
      throw error;
    }
  }

  /**
   * 불참 처리
   */
  async markAsNoShow(participationId: string, adminNotes?: string): Promise<void> {
    try {
      const participationRef = doc(db, 'eventParticipations', participationId);
      await updateDoc(participationRef, {
        status: 'no_show',
        adminNotes: adminNotes || '',
        updatedAt: serverTimestamp(),
      });

      // 참가자 수 감소
      const participationDoc = await getDoc(participationRef);
      if (participationDoc.exists()) {
        const data = participationDoc.data();
        const eventRef = doc(db, 'events', data.eventId);
        await updateDoc(eventRef, {
          participantCount: increment(-1),
          updatedAt: serverTimestamp(),
        });

        // 대기자 승급
        await this.promoteWaitlistedParticipant(data.eventId);
      }

      console.log(`❌ Marked as no-show: ${participationId}`);
    } catch (error) {
      console.error('Error marking as no-show:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스 생성
const eventParticipationService = new EventParticipationService();
export default eventParticipationService;
