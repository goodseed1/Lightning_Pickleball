import { db, functions } from '../firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

// Generate UUID (simple implementation)
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export interface TeamApplication {
  id?: string;
  eventId: string;
  applicantId: string;
  applicantName: string;
  status: 'pending' | 'approved' | 'rejected';
  isTeamApplication: boolean;
  teamId?: string;
  partnerId?: string;
  partnerName?: string;
  partnerStatus?: 'pending' | 'accepted' | 'rejected';
  invitedBy?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export const participationApplicationService = {
  /**
   * 팀 신청 생성 (C가 D를 초대)
   * 🔧 [FIX] event 문서의 updatedAt도 업데이트하여 호스트 화면 실시간 갱신 트리거
   */
  async createTeamApplication(
    eventId: string,
    applicantId: string,
    applicantName: string,
    partnerId: string,
    partnerName: string
  ): Promise<string> {
    const teamId = generateUUID();
    const batch = writeBatch(db);

    // C의 application
    const applicantAppRef = doc(collection(db, 'participation_applications'));
    batch.set(applicantAppRef, {
      eventId,
      applicantId,
      applicantName,
      status: 'pending',
      isTeamApplication: true,
      teamId,
      partnerId,
      partnerName,
      partnerStatus: 'pending',
      invitedBy: applicantId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // D의 application
    const partnerAppRef = doc(collection(db, 'participation_applications'));
    batch.set(partnerAppRef, {
      eventId,
      applicantId: partnerId,
      applicantName: partnerName,
      status: 'pending',
      isTeamApplication: true,
      teamId,
      partnerId: applicantId,
      partnerName: applicantName,
      partnerStatus: 'pending',
      invitedBy: applicantId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 🔧 [FIX] event 문서의 updatedAt 업데이트 - 호스트 화면 실시간 갱신 트리거
    const eventRef = doc(db, 'events', eventId);
    batch.update(eventRef, {
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
    console.log('✅ [TEAM_APPLICATION] Created:', { teamId, applicantId, partnerId });
    console.log('📡 [TEAM_APPLICATION] Event updatedAt triggered for host real-time update');
    return teamId;
  },

  /**
   * 파트너 초대 수락 (D가 수락)
   * 🔧 [FIX] event 문서의 updatedAt도 업데이트하여 호스트 화면 실시간 갱신 트리거
   */
  async acceptPartnerInvitation(teamId: string): Promise<void> {
    const q = query(collection(db, 'participation_applications'), where('teamId', '==', teamId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Team application not found');
    }

    // eventId 추출 (모든 팀 신청은 같은 eventId를 가짐)
    const firstApp = querySnapshot.docs[0].data();
    const eventId = firstApp.eventId;

    const batch = writeBatch(db);

    // 1. 모든 팀 신청의 partnerStatus 업데이트
    querySnapshot.forEach(docSnap => {
      batch.update(docSnap.ref, {
        partnerStatus: 'accepted',
        updatedAt: serverTimestamp(),
      });
    });

    // 2. 🔧 [FIX] event 문서의 updatedAt 업데이트 - 호스트 화면 실시간 갱신 트리거
    if (eventId) {
      const eventRef = doc(db, 'events', eventId);
      batch.update(eventRef, {
        updatedAt: serverTimestamp(),
      });
      console.log('📡 [TEAM_APPLICATION] Event updatedAt triggered for host real-time update');
    }

    await batch.commit();
    console.log('✅ [TEAM_APPLICATION] Partner accepted:', teamId, 'eventId:', eventId);
  },

  /**
   * 파트너 초대 거절 (D가 거절)
   * 🔧 [FIX] event 문서의 updatedAt도 업데이트하여 호스트 화면 실시간 갱신 트리거
   */
  async rejectPartnerInvitation(teamId: string): Promise<void> {
    const q = query(collection(db, 'participation_applications'), where('teamId', '==', teamId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Team application not found');
    }

    // eventId 추출
    const firstApp = querySnapshot.docs[0].data();
    const eventId = firstApp.eventId;

    const batch = writeBatch(db);
    querySnapshot.forEach(docSnap => {
      batch.delete(docSnap.ref);
    });

    // 🔧 [FIX] event 문서의 updatedAt 업데이트 - 호스트 화면 실시간 갱신 트리거
    if (eventId) {
      const eventRef = doc(db, 'events', eventId);
      batch.update(eventRef, {
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
    console.log('✅ [TEAM_APPLICATION] Partner rejected, applications deleted:', teamId);
    console.log('📡 [TEAM_APPLICATION] Event updatedAt triggered for host real-time update');
  },

  /**
   * 사용자의 팀 초대 조회 (D가 확인)
   */
  async getMyTeamInvitations(userId: string): Promise<TeamApplication[]> {
    const q = query(
      collection(db, 'participation_applications'),
      where('applicantId', '==', userId),
      where('isTeamApplication', '==', true),
      where('invitedBy', '!=', userId)
    );
    const querySnapshot = await getDocs(q);

    const invitations: TeamApplication[] = [];
    querySnapshot.forEach(docSnap => {
      invitations.push({ id: docSnap.id, ...docSnap.data() } as TeamApplication);
    });

    return invitations;
  },

  /**
   * 이벤트의 팀 신청 조회
   */
  async getEventTeamApplications(eventId: string): Promise<TeamApplication[]> {
    const q = query(
      collection(db, 'participation_applications'),
      where('eventId', '==', eventId),
      where('isTeamApplication', '==', true)
    );
    const querySnapshot = await getDocs(q);

    const applications: TeamApplication[] = [];
    querySnapshot.forEach(docSnap => {
      applications.push({ id: docSnap.id, ...docSnap.data() } as TeamApplication);
    });

    return applications;
  },

  /**
   * 개인 신청 생성 (파트너 없이)
   * 🔧 [FIX] event 문서의 updatedAt도 업데이트하여 호스트 화면 실시간 갱신 트리거
   */
  async createIndividualApplication(
    eventId: string,
    applicantId: string,
    applicantName: string
  ): Promise<string> {
    const batch = writeBatch(db);

    // 개인 신청 문서 생성
    const appRef = doc(collection(db, 'participation_applications'));
    batch.set(appRef, {
      eventId,
      applicantId,
      applicantName,
      status: 'pending',
      isTeamApplication: false,
      teamId: null,
      partnerId: null,
      partnerName: null,
      partnerStatus: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 🔧 [FIX] event 문서의 updatedAt 업데이트 - 호스트 화면 실시간 갱신 트리거
    const eventRef = doc(db, 'events', eventId);
    batch.update(eventRef, {
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
    console.log('✅ [INDIVIDUAL_APPLICATION] Created:', { appId: appRef.id, applicantId });
    console.log('📡 [INDIVIDUAL_APPLICATION] Event updatedAt triggered for host real-time update');
    return appRef.id;
  },

  /**
   * 이벤트의 개인 신청자 목록 조회
   */
  async getIndividualApplicants(eventId: string): Promise<TeamApplication[]> {
    const q = query(
      collection(db, 'participation_applications'),
      where('eventId', '==', eventId),
      where('isTeamApplication', '==', false)
    );
    const querySnapshot = await getDocs(q);

    const applicants: TeamApplication[] = [];
    querySnapshot.forEach(docSnap => {
      applicants.push({ id: docSnap.id, ...docSnap.data() } as TeamApplication);
    });

    return applicants;
  },

  /**
   * 개인 → 팀 변환 (C가 D에게 초대 보냄)
   * 🔧 [FIX] event 문서의 updatedAt도 업데이트하여 호스트 화면 실시간 갱신 트리거
   */
  async convertToTeamApplication(
    applicantAppId: string,
    applicantId: string,
    applicantName: string,
    partnerAppId: string,
    partnerId: string,
    partnerName: string,
    eventId: string
  ): Promise<string> {
    const teamId = generateUUID();
    const batch = writeBatch(db);

    // C의 application 업데이트
    const applicantRef = doc(db, 'participation_applications', applicantAppId);
    batch.update(applicantRef, {
      isTeamApplication: true,
      teamId,
      partnerId,
      partnerName,
      partnerStatus: 'pending',
      invitedBy: applicantId,
      updatedAt: serverTimestamp(),
    });

    // D의 application 업데이트
    const partnerRef = doc(db, 'participation_applications', partnerAppId);
    batch.update(partnerRef, {
      isTeamApplication: true,
      teamId,
      partnerId: applicantId,
      partnerName: applicantName,
      partnerStatus: 'pending',
      invitedBy: applicantId,
      updatedAt: serverTimestamp(),
    });

    // 🔧 [FIX] event 문서의 updatedAt 업데이트 - 호스트 화면 실시간 갱신 트리거
    if (eventId) {
      const eventRef = doc(db, 'events', eventId);
      batch.update(eventRef, {
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
    console.log('✅ [CONVERT_TO_TEAM] Converted:', { teamId, applicantId, partnerId });
    console.log('📡 [CONVERT_TO_TEAM] Event updatedAt triggered for host real-time update');
    return teamId;
  },

  /**
   * 팀 신청 승인 (호스트)
   * 조건: partnerStatus가 'accepted'인지 확인 후 승인
   * 🎯 [KIM FIX] Cloud Function 호출 추가 - 솔로 신청 닫기, participants 업데이트 등
   * 🎯 [KIM FIX v2] eventId 필수 파라미터 추가 - 같은 팀이 여러 이벤트에 신청할 수 있으므로
   */
  async approveTeamApplication(teamId: string, eventId: string): Promise<void> {
    // 🎯 [KIM FIX v2] teamId + eventId로 정확한 이벤트의 신청만 조회
    const q = query(
      collection(db, 'participation_applications'),
      where('teamId', '==', teamId),
      where('eventId', '==', eventId)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Team application not found');
    }

    // 팀의 partnerStatus가 'accepted'인지 확인
    const teamApps = querySnapshot.docs.map(doc => doc.data());
    const allAccepted = teamApps.every(app => app.partnerStatus === 'accepted');

    if (!allAccepted) {
      throw new Error('Cannot approve: Partner has not accepted the invitation yet');
    }

    // 🎯 [KIM FIX] Get the first application to get applicant info for Cloud Function
    // 🎯 [KIM FIX v2] eventId는 이제 파라미터로 받으므로 추출 불필요
    const primaryApp = querySnapshot.docs[0];
    const primaryAppData = primaryApp.data();
    const applicationId = primaryApp.id;
    const applicantId = primaryAppData.applicantId;

    const batch = writeBatch(db);
    querySnapshot.forEach(docSnap => {
      batch.update(docSnap.ref, {
        status: 'approved',
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
    console.log('✅ [APPROVE_TEAM] Team approved:', teamId);

    // 🎯 [KIM FIX] Call Cloud Function for additional processing
    // This handles: participants update, closing remaining solo applications, notifications
    try {
      console.log('🌉 [APPROVE_TEAM] Calling approveApplication Cloud Function:', {
        applicationId,
        eventId,
        applicantId,
      });

      const approveApplicationFn = httpsCallable(functions, 'approveApplication');
      await approveApplicationFn({
        applicationId,
        eventId,
        applicantId,
      });

      console.log('✅ [APPROVE_TEAM] Cloud Function executed successfully');
    } catch (error) {
      console.error('❌ [APPROVE_TEAM] Error calling Cloud Function:', error);
      // Don't throw - approval already succeeded in batch above
    }
  },

  /**
   * 팀 신청 거절 (호스트)
   */
  async rejectTeamApplication(teamId: string): Promise<void> {
    const q = query(collection(db, 'participation_applications'), where('teamId', '==', teamId));
    const querySnapshot = await getDocs(q);

    const batch = writeBatch(db);
    querySnapshot.forEach(docSnap => {
      batch.update(docSnap.ref, {
        status: 'rejected',
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
    console.log('✅ [REJECT_TEAM] Team rejected:', teamId);
  },

  /**
   * 이벤트의 팀 신청 그룹화 조회 (호스트용)
   * 같은 teamId를 가진 applications를 묶어서 반환
   */
  async getEventTeamApplicationsGrouped(eventId: string): Promise<
    Array<{
      teamId: string;
      members: TeamApplication[];
      status: string;
      partnerStatus: string;
    }>
  > {
    const applications = await this.getEventTeamApplications(eventId);

    // teamId로 그룹화
    const grouped = new Map<string, TeamApplication[]>();

    applications.forEach(app => {
      if (app.teamId) {
        if (!grouped.has(app.teamId)) {
          grouped.set(app.teamId, []);
        }
        grouped.get(app.teamId)!.push(app);
      }
    });

    // 배열로 변환
    const result: Array<{
      teamId: string;
      members: TeamApplication[];
      status: string;
      partnerStatus: string;
    }> = [];

    grouped.forEach((members, teamId) => {
      result.push({
        teamId,
        members,
        status: members[0].status || 'pending',
        partnerStatus: members[0].partnerStatus || 'pending',
      });
    });

    return result;
  },
};
