/**
 * Dues Service
 * Lightning Pickleball 클럽 회비 관리 서비스
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  writeBatch,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  ClubDuesSettings,
  MemberDuesStatus,
  DuesPaymentSummary,
  MemberForDues,
  UpdateDuesSettingsRequest,
  MarkAsPaidRequest,
  SendReminderRequest,
  DuesPeriod,
  getCurrentPeriod,
  PaymentStatus,
  // 새로 추가된 타입들
  DuesType,
  MemberDuesRecord,
  MemberDuesSummary,
  PaymentMethod,
  // 분기 회비 관련
  calculateQuarterlyExemptionPeriod,
  determineDuesTypeByAmount,
  // 커스텀 금액 면제 관련
  calculateCustomAmountExemption,
  calculateCustomExemptionPeriod,
} from '../types/dues';
import i18n from '../i18n';

class DuesService {
  /**
   * 클럽 회비 설정 조회
   */
  async getClubDuesSettings(clubId: string): Promise<ClubDuesSettings | null> {
    try {
      const settingsRef = collection(db, 'club_dues_settings');
      const q = query(
        settingsRef,
        where('clubId', '==', clubId),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data(),
      } as ClubDuesSettings;
    } catch (error) {
      console.error('Error getting club dues settings:', error);
      throw error;
    }
  }

  /**
   * 클럽 회비 설정 부분 업데이트 (특정 필드만 업데이트)
   * 설정이 없으면 기본값으로 새로 생성
   */
  async updateClubDuesSettings(
    clubId: string,
    updates: Partial<{ autoInvoiceEnabled: boolean }>
  ): Promise<void> {
    try {
      const existingSettings = await this.getClubDuesSettings(clubId);

      if (existingSettings) {
        // 기존 설정 업데이트
        await updateDoc(doc(db, 'club_dues_settings', existingSettings.id), {
          ...updates,
          updatedAt: serverTimestamp(),
        });
        console.log('✅ Club dues settings updated:', clubId, updates);
      } else {
        // 설정이 없으면 새로 생성
        const defaultSettings = {
          clubId,
          monthlyAmount: 0,
          currency: 'USD',
          paymentDay: 1,
          isActive: true,
          autoInvoiceEnabled: updates.autoInvoiceEnabled ?? false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await addDoc(collection(db, 'club_dues_settings'), defaultSettings);
        console.log('✅ Club dues settings created:', clubId, defaultSettings);
      }
    } catch (error) {
      console.error('Error updating club dues settings:', error);
      throw error;
    }
  }

  /**
   * 클럽 회비 설정 업데이트
   */
  async updateDuesSettings(
    clubId: string,
    settings: UpdateDuesSettingsRequest,
    createdBy: string
  ): Promise<void> {
    try {
      // 기존 설정 비활성화
      const existingSettings = await this.getClubDuesSettings(clubId);
      if (existingSettings) {
        await updateDoc(doc(db, 'club_dues_settings', existingSettings.id), {
          isActive: false,
          updatedAt: serverTimestamp(),
        });
      }

      // 새 설정 생성
      const newSettings: Omit<ClubDuesSettings, 'id'> = {
        clubId,
        ...settings,
        isActive: true,
        createdBy,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      await addDoc(collection(db, 'club_dues_settings'), newSettings);

      console.log('✅ Dues settings updated for club:', clubId);
    } catch (error) {
      console.error('Error updating dues settings:', error);
      throw error;
    }
  }

  /**
   * 특정 기간 회원들의 납부 상태 조회
   */
  async getMembersDuesStatus(clubId: string, period: DuesPeriod): Promise<MemberDuesStatus[]> {
    try {
      const statusRef = collection(db, 'club_dues_status');
      const q = query(
        statusRef,
        where('clubId', '==', clubId),
        where('period.year', '==', period.year),
        where('period.type', '==', period.type)
      );

      // 월회비의 경우 월도 필터링
      let finalQuery = q;
      if (period.month) {
        finalQuery = query(
          statusRef,
          where('clubId', '==', clubId),
          where('period.year', '==', period.year),
          where('period.month', '==', period.month),
          where('period.type', '==', period.type)
        );
      }

      const snapshot = await getDocs(finalQuery);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as MemberDuesStatus[];
    } catch (error) {
      console.error('Error getting members dues status:', error);
      throw error;
    }
  }

  /**
   * 회원들과 납부 상태 통합 조회
   */
  async getMembersWithDuesStatus(clubId: string, period: DuesPeriod): Promise<MemberForDues[]> {
    try {
      // 클럽 회원 목록 조회
      const membersRef = collection(db, 'clubMembers');
      const membersQuery = query(
        membersRef,
        where('clubId', '==', clubId),
        where('status', '==', 'active')
      );

      const membersSnapshot = await getDocs(membersQuery);

      // 납부 상태 조회
      const duesStatuses = await this.getMembersDuesStatus(clubId, period);
      const statusMap = new Map(duesStatuses.map(status => [status.userId, status]));

      // 회원 정보와 납부 상태 결합
      const membersWithStatus: MemberForDues[] = [];

      for (const memberDoc of membersSnapshot.docs) {
        const memberData = memberDoc.data();
        const duesStatus = statusMap.get(memberData.userId);

        membersWithStatus.push({
          userId: memberData.userId,
          displayName: memberData.userName || 'Unknown',
          email: memberData.email,
          profileImage: memberData.profileImage,
          joinedAt: memberData.joinedAt || memberData.createdAt,
          membershipType: memberData.membershipType,
          isActive: memberData.status === 'active',
          currentDuesStatus: duesStatus,
        });
      }

      return membersWithStatus;
    } catch (error) {
      console.error('Error getting members with dues status:', error);
      throw error;
    }
  }

  /**
   * 회원을 납부 완료 처리
   */
  async markAsPaid(clubId: string, request: MarkAsPaidRequest, markedBy: string): Promise<void> {
    try {
      // 기존 상태 조회
      const existingStatus = await this.getMemberDuesStatus(clubId, request.userId, request.period);

      const statusData: Partial<MemberDuesStatus> = {
        status: 'paid',
        paidAt: serverTimestamp() as Timestamp,
        paidMethod: request.paidMethod,
        paidAmount: request.paidAmount,
        transactionId: request.transactionId,
        markedBy,
        notes: request.notes,
        updatedAt: serverTimestamp() as Timestamp,
      };

      if (existingStatus) {
        // 기존 상태 업데이트
        await updateDoc(doc(db, 'club_dues_status', existingStatus.id), statusData);
      } else {
        // 새 상태 생성
        const newStatus: Omit<MemberDuesStatus, 'id'> = {
          clubId,
          userId: request.userId,
          period: request.period,
          amount: request.paidAmount,
          currency: 'USD', // TODO: 클럽 설정에서 가져오기
          reminderCount: 0,
          createdAt: serverTimestamp() as Timestamp,
          ...statusData,
        } as Omit<MemberDuesStatus, 'id'>;

        await addDoc(collection(db, 'club_dues_status'), newStatus);
      }

      console.log('✅ Member marked as paid:', request.userId);
    } catch (error) {
      console.error('Error marking member as paid:', error);
      throw error;
    }
  }

  /**
   * 회원을 미납 처리
   */
  async markAsUnpaid(
    clubId: string,
    userId: string,
    period: DuesPeriod,
    markedBy: string
  ): Promise<void> {
    try {
      const existingStatus = await this.getMemberDuesStatus(clubId, userId, period);

      if (existingStatus) {
        await updateDoc(doc(db, 'club_dues_status', existingStatus.id), {
          status: 'unpaid',
          paidAt: null,
          paidMethod: null,
          paidAmount: null,
          transactionId: null,
          markedBy,
          updatedAt: serverTimestamp(),
        });
      } else {
        // 클럽 설정에서 기본 금액 가져오기
        const settings = await this.getClubDuesSettings(clubId);
        const amount = settings?.amount || 0;

        const newStatus: Omit<MemberDuesStatus, 'id'> = {
          clubId,
          userId,
          period,
          status: 'unpaid',
          amount,
          currency: settings?.currency || 'USD',
          reminderCount: 0,
          markedBy,
          createdAt: serverTimestamp() as Timestamp,
          updatedAt: serverTimestamp() as Timestamp,
        };

        await addDoc(collection(db, 'club_dues_status'), newStatus);
      }

      console.log('✅ Member marked as unpaid:', userId);
    } catch (error) {
      console.error('Error marking member as unpaid:', error);
      throw error;
    }
  }

  /**
   * 특정 회원의 납부 상태 조회
   */
  async getMemberDuesStatus(
    clubId: string,
    userId: string,
    period: DuesPeriod
  ): Promise<MemberDuesStatus | null> {
    try {
      const statusRef = collection(db, 'club_dues_status');
      let q = query(
        statusRef,
        where('clubId', '==', clubId),
        where('userId', '==', userId),
        where('period.year', '==', period.year),
        where('period.type', '==', period.type)
      );

      // 월회비의 경우 월도 필터링
      if (period.month) {
        q = query(
          statusRef,
          where('clubId', '==', clubId),
          where('userId', '==', userId),
          where('period.year', '==', period.year),
          where('period.month', '==', period.month),
          where('period.type', '==', period.type)
        );
      }

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data(),
      } as MemberDuesStatus;
    } catch (error) {
      console.error('Error getting member dues status:', error);
      throw error;
    }
  }

  /**
   * 회비 납부 요약 정보 계산
   */
  async getDuesPaymentSummary(clubId: string, period: DuesPeriod): Promise<DuesPaymentSummary> {
    try {
      const membersWithStatus = await this.getMembersWithDuesStatus(clubId, period);
      const settings = await this.getClubDuesSettings(clubId);

      const totalMembers = membersWithStatus.length;
      let paidMembers = 0;
      let unpaidMembers = 0;
      let overdueMembers = 0;
      let exemptMembers = 0;
      let totalCollected = 0;

      const now = new Date();

      membersWithStatus.forEach(member => {
        const status = member.currentDuesStatus?.status;

        switch (status) {
          case 'paid':
            paidMembers++;
            totalCollected += member.currentDuesStatus?.paidAmount || 0;
            break;
          case 'unpaid':
            // 연체 여부 확인
            if (period.overdueDate.toDate() < now) {
              overdueMembers++;
            } else {
              unpaidMembers++;
            }
            break;
          case 'overdue':
            overdueMembers++;
            break;
          case 'exempt':
            exemptMembers++;
            break;
          default:
            // 상태가 없는 경우 미납으로 처리
            if (period.overdueDate.toDate() < now) {
              overdueMembers++;
            } else {
              unpaidMembers++;
            }
        }
      });

      const expectedAmount = settings?.amount || 0;
      const totalExpected = totalMembers * expectedAmount;
      const totalPending = (unpaidMembers + overdueMembers) * expectedAmount;
      const collectionRate = totalMembers > 0 ? (paidMembers / totalMembers) * 100 : 0;

      return {
        clubId,
        period,
        totalMembers,
        paidMembers,
        unpaidMembers,
        overdueMembers,
        exemptMembers,
        totalExpected,
        totalCollected,
        totalPending,
        collectionRate,
        lastUpdated: serverTimestamp() as Timestamp,
      };
    } catch (error) {
      console.error('Error getting dues payment summary:', error);
      throw error;
    }
  }

  /**
   * 미납자들에게 알림 발송 (현재는 로깅만)
   */
  async sendPaymentReminder(request: SendReminderRequest): Promise<void> {
    try {
      // TODO: 실제 푸시 알림/이메일 발송 로직 구현
      console.log('📱 Payment reminder sent!', {
        userIds: request.userIds,
        period: request.period,
        message: request.message || 'Please pay your club dues.',
        timestamp: new Date().toISOString(),
      });

      // 알림 발송 기록 업데이트
      const batch = writeBatch(db);
      const now = serverTimestamp();

      for (const userId of request.userIds) {
        const existingStatus = await this.getMemberDuesStatus('', userId, request.period);
        if (existingStatus) {
          const statusRef = doc(db, 'club_dues_status', existingStatus.id);
          batch.update(statusRef, {
            reminderSentAt: now,
            reminderCount: (existingStatus.reminderCount || 0) + 1,
            updatedAt: now,
          });
        }
      }

      await batch.commit();

      console.log('✅ Reminder records updated');
    } catch (error) {
      console.error('Error sending payment reminder:', error);
      throw error;
    }
  }

  /**
   * 현재 기간의 미납자 목록 조회
   */
  async getUnpaidMembers(clubId: string, period?: DuesPeriod): Promise<MemberForDues[]> {
    try {
      const currentPeriod = period || getCurrentPeriod('monthly'); // 기본값
      const membersWithStatus = await this.getMembersWithDuesStatus(clubId, currentPeriod);

      return membersWithStatus.filter(member => {
        const status = member.currentDuesStatus?.status;
        return !status || status === 'unpaid' || status === 'overdue';
      });
    } catch (error) {
      console.error('Error getting unpaid members:', error);
      throw error;
    }
  }

  /**
   * 회원별 납부 이력 조회
   */
  async getMemberPaymentHistory(
    clubId: string,
    userId: string,
    limitCount: number = 12
  ): Promise<MemberDuesStatus[]> {
    try {
      const statusRef = collection(db, 'club_dues_status');
      const q = query(
        statusRef,
        where('clubId', '==', clubId),
        where('userId', '==', userId),
        orderBy('period.year', 'desc'),
        orderBy('period.month', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      })) as MemberDuesStatus[];
    } catch (error) {
      console.error('Error getting member payment history:', error);
      throw error;
    }
  }

  // ============================================
  // 회비 레코드 시스템 (신규 - member_dues_records 컬렉션)
  // ============================================

  /**
   * 가입비 레코드 생성
   */
  async createJoinFeeRecord(
    clubId: string,
    userId: string,
    amount: number,
    currency: string = 'USD'
  ): Promise<string> {
    try {
      const existingRecord = await this.getMemberDuesRecord(clubId, userId, 'join');
      if (existingRecord) {
        console.log('⚠️ Join fee record already exists for user:', userId);
        return existingRecord.id;
      }

      const record: Omit<MemberDuesRecord, 'id'> = {
        clubId,
        userId,
        duesType: 'join',
        amount,
        currency,
        status: 'unpaid',
        reminderCount: 0,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      const docRef = await addDoc(collection(db, 'member_dues_records'), record);
      console.log('✅ Join fee record created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating join fee record:', error);
      throw error;
    }
  }

  /**
   * 월회비/연회비 레코드 생성
   */
  async createPeriodicDuesRecord(
    clubId: string,
    userId: string,
    duesType: 'monthly' | 'yearly',
    year: number,
    month?: number,
    amount?: number,
    currency: string = 'USD'
  ): Promise<string> {
    try {
      const existingRecord = await this.getMemberDuesRecordByPeriod(
        clubId,
        userId,
        duesType,
        year,
        month
      );
      if (existingRecord) {
        console.log(`⚠️ ${duesType} dues record already exists for period:`, { year, month });
        return existingRecord.id;
      }

      const settings = await this.getClubDuesSettings(clubId);
      const finalAmount =
        amount ??
        (duesType === 'monthly' ? settings?.monthlyFee : settings?.yearlyFee) ??
        settings?.amount ??
        0;

      const record: Omit<MemberDuesRecord, 'id'> = {
        clubId,
        userId,
        duesType,
        period: {
          year,
          ...(month !== undefined && { month }),
        },
        amount: finalAmount,
        currency: currency || settings?.currency || 'USD',
        status: 'unpaid',
        reminderCount: 0,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      const docRef = await addDoc(collection(db, 'member_dues_records'), record);
      console.log(`✅ ${duesType} dues record created:`, docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating periodic dues record:', error);
      throw error;
    }
  }

  /**
   * 연체료 레코드 추가
   */
  async addLateFeeRecord(
    clubId: string,
    userId: string,
    amount: number,
    relatedDuesId?: string,
    notes?: string,
    currency: string = 'USD'
  ): Promise<string> {
    try {
      const record: Omit<MemberDuesRecord, 'id'> = {
        clubId,
        userId,
        duesType: 'late_fee',
        amount,
        currency,
        status: 'unpaid',
        ...(relatedDuesId && { relatedDuesId }),
        ...(notes && { notes }),
        reminderCount: 0,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      const docRef = await addDoc(collection(db, 'member_dues_records'), record);
      console.log('✅ Late fee record created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating late fee record:', error);
      throw error;
    }
  }

  /**
   * 특정 회비 레코드 조회 (가입비용)
   */
  async getMemberDuesRecord(
    clubId: string,
    userId: string,
    duesType: DuesType
  ): Promise<MemberDuesRecord | null> {
    try {
      const recordsRef = collection(db, 'member_dues_records');
      const q = query(
        recordsRef,
        where('clubId', '==', clubId),
        where('userId', '==', userId),
        where('duesType', '==', duesType),
        limit(1)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data(),
      } as MemberDuesRecord;
    } catch (error) {
      console.error('Error getting member dues record:', error);
      throw error;
    }
  }

  /**
   * 기간별 회비 레코드 조회 (월회비/연회비용)
   */
  async getMemberDuesRecordByPeriod(
    clubId: string,
    userId: string,
    duesType: 'monthly' | 'yearly',
    year: number,
    month?: number
  ): Promise<MemberDuesRecord | null> {
    try {
      const recordsRef = collection(db, 'member_dues_records');

      let q;
      if (duesType === 'monthly' && month !== undefined) {
        q = query(
          recordsRef,
          where('clubId', '==', clubId),
          where('userId', '==', userId),
          where('duesType', '==', duesType),
          where('period.year', '==', year),
          where('period.month', '==', month),
          limit(1)
        );
      } else {
        q = query(
          recordsRef,
          where('clubId', '==', clubId),
          where('userId', '==', userId),
          where('duesType', '==', duesType),
          where('period.year', '==', year),
          limit(1)
        );
      }

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data(),
      } as MemberDuesRecord;
    } catch (error) {
      console.error('Error getting member dues record by period:', error);
      throw error;
    }
  }

  /**
   * 회원의 모든 회비 레코드 조회
   */
  async getMemberAllDuesRecords(clubId: string, userId: string): Promise<MemberDuesRecord[]> {
    try {
      const recordsRef = collection(db, 'member_dues_records');
      const q = query(
        recordsRef,
        where('clubId', '==', clubId),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      })) as MemberDuesRecord[];
    } catch (error) {
      console.error('Error getting member all dues records:', error);
      throw error;
    }
  }

  /**
   * 전체 회원의 회비 현황 요약 조회
   * ⚡ [KIM FIX] N+1 쿼리 문제 해결 - Promise.all로 병렬 처리
   */
  async getAllMembersDuesSummary(clubId: string): Promise<MemberDuesSummary[]> {
    try {
      const membersRef = collection(db, 'clubMembers');
      const membersQuery = query(
        membersRef,
        where('clubId', '==', clubId),
        where('status', '==', 'active')
      );

      const membersSnapshot = await getDocs(membersQuery);

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      // ⚡ Step 1: 모든 회원의 userId 수집
      const memberDataList = membersSnapshot.docs.map(docSnapshot => ({
        docData: docSnapshot.data(),
        userId: docSnapshot.data().userId as string,
      }));

      const userIds = memberDataList.map(m => m.userId);

      // ⚡ Step 2: 모든 사용자 정보를 병렬로 조회
      console.log(`⚡ Fetching ${userIds.length} user docs in parallel for dues summary`);
      const userDocsPromises = userIds.map(userId =>
        getDoc(doc(db, 'users', userId)).catch(err => {
          console.warn(`⚠️ Failed to fetch user ${userId}:`, err.message);
          return null;
        })
      );
      const userDocsResults = await Promise.all(userDocsPromises);

      // 사용자 정보 맵 생성 (O(1) 조회용)
      const userInfoMap = new Map<
        string,
        { displayName: string; email: string; profileImage: string }
      >();
      userDocsResults.forEach((userDoc, index) => {
        const userId = userIds[index];
        if (userDoc && userDoc.exists()) {
          const userData = userDoc.data();
          userInfoMap.set(userId, {
            displayName:
              userData?.profile?.displayName ||
              userData?.displayName ||
              memberDataList[index].docData?.memberInfo?.displayName ||
              memberDataList[index].docData?.memberInfo?.nickname ||
              'Unknown',
            email: userData?.email || memberDataList[index].docData?.email || '',
            profileImage:
              userData?.profile?.photoURL ||
              userData?.photoURL ||
              memberDataList[index].docData?.profileImage ||
              '',
          });
        } else {
          userInfoMap.set(userId, {
            displayName:
              memberDataList[index].docData?.memberInfo?.displayName ||
              memberDataList[index].docData?.memberInfo?.nickname ||
              'Unknown',
            email: memberDataList[index].docData?.email || '',
            profileImage: memberDataList[index].docData?.profileImage || '',
          });
        }
      });

      // ⚡ Step 3: 모든 회비 레코드를 한 번에 조회 (클럽 ID로만 필터링)
      console.log(`⚡ Fetching all dues records for club ${clubId} in single query`);
      const recordsRef = collection(db, 'member_dues_records');
      const recordsQuery = query(
        recordsRef,
        where('clubId', '==', clubId),
        orderBy('createdAt', 'desc')
      );
      const recordsSnapshot = await getDocs(recordsQuery);

      // userId별 레코드 맵 생성
      const recordsByUserId = new Map<string, MemberDuesRecord[]>();
      recordsSnapshot.docs.forEach(docSnapshot => {
        const record = {
          id: docSnapshot.id,
          ...docSnapshot.data(),
        } as MemberDuesRecord;
        const recordUserId = record.userId;
        if (!recordsByUserId.has(recordUserId)) {
          recordsByUserId.set(recordUserId, []);
        }
        recordsByUserId.get(recordUserId)!.push(record);
      });

      // ⚡ Step 4: 메모리에서 요약 정보 생성 (DB 호출 없음!)
      const summaries: MemberDuesSummary[] = memberDataList.map(({ docData, userId }) => {
        const userInfo = userInfoMap.get(userId) || {
          displayName: 'Unknown',
          email: '',
          profileImage: '',
        };
        const records = recordsByUserId.get(userId) || [];

        const joinFee = records.find(r => r.duesType === 'join') || null;
        const currentMonthDues =
          records.find(
            r =>
              r.duesType === 'monthly' &&
              r.period?.year === currentYear &&
              r.period?.month === currentMonth
          ) || null;
        const currentYearDues =
          records.find(r => r.duesType === 'yearly' && r.period?.year === currentYear) || null;
        const lateFees = records.filter(r => r.duesType === 'late_fee' && r.status !== 'paid');

        let totalOwed = 0;
        let totalPaid = 0;

        records.forEach(r => {
          if (r.status === 'paid') {
            totalPaid += r.paidAmount || r.amount;
          } else if (r.status !== 'exempt') {
            totalOwed += r.amount;
          }
        });

        return {
          userId,
          displayName: userInfo.displayName,
          email: userInfo.email,
          profileImage: userInfo.profileImage,
          joinedAt: docData.joinedAt || docData.createdAt,
          isDuesExempt: docData.isDuesExempt || false,
          exemptReason: docData.duesExemptReason,
          joinFee,
          currentMonthDues,
          currentYearDues,
          lateFees,
          totalOwed,
          totalPaid,
        };
      });

      console.log(`✅ Dues summary generated for ${summaries.length} members (parallelized)`);
      return summaries;
    } catch (error) {
      console.error('Error getting all members dues summary:', error);
      throw error;
    }
  }

  /**
   * 실시간 전체 회원 회비 현황 구독
   * member_dues_records와 clubMembers 모두 구독하여 면제 상태 변경도 반영
   */
  subscribeToAllMembersDuesSummary(
    clubId: string,
    callback: (summaries: MemberDuesSummary[]) => void
  ): () => void {
    const fetchSummaries = async () => {
      try {
        const summaries = await this.getAllMembersDuesSummary(clubId);
        callback(summaries);
      } catch (error) {
        console.error('Error in dues summary subscription:', error);
      }
    };

    // member_dues_records 구독
    const recordsRef = collection(db, 'member_dues_records');
    const recordsQuery = query(recordsRef, where('clubId', '==', clubId));
    const unsubRecords = onSnapshot(recordsQuery, fetchSummaries);

    // clubMembers 구독 (면제 상태 변경 감지용)
    const membersRef = collection(db, 'clubMembers');
    const membersQuery = query(
      membersRef,
      where('clubId', '==', clubId),
      where('status', '==', 'active')
    );
    const unsubMembers = onSnapshot(membersQuery, fetchSummaries);

    // 두 구독 모두 해제하는 함수 반환
    return () => {
      unsubRecords();
      unsubMembers();
    };
  }

  /**
   * 레코드 납부 완료 처리 (관리자)
   * 납부 금액에 따라 월회비/분기회비/연회비 자동 판별 및 면제 처리
   */
  async markRecordAsPaid(
    recordId: string,
    paymentMethod: PaymentMethod,
    paidAmount: number,
    markedBy: string,
    transactionId?: string,
    notes?: string
  ): Promise<{ exemptMonths: number; duesType: DuesType }> {
    try {
      const recordRef = doc(db, 'member_dues_records', recordId);
      const recordDoc = await getDoc(recordRef);

      if (!recordDoc.exists()) {
        throw new Error('Record not found');
      }

      const recordData = recordDoc.data() as MemberDuesRecord;
      const { clubId, userId, period } = recordData;

      // 클럽 설정에서 회비 금액 조회
      const settings = await this.getClubDuesSettings(clubId);
      const monthlyFee = settings?.monthlyFee || settings?.amount || 0;
      const quarterlyFee = settings?.quarterlyFee;
      const yearlyFee = settings?.yearlyFee;

      // 납부 금액으로 회비 유형 판별
      const { duesType, exemptMonths } = determineDuesTypeByAmount(
        paidAmount,
        monthlyFee,
        quarterlyFee,
        yearlyFee
      );

      // 레코드 업데이트
      // 💵 [KIM] amount 필드도 함께 업데이트 (UI 표시용)
      await updateDoc(recordRef, {
        status: 'paid',
        paidAt: serverTimestamp(),
        paidMethod: paymentMethod,
        amount: paidAmount, // 💵 [KIM] UI 표시용 금액도 업데이트
        paidAmount,
        markedBy,
        ...(transactionId && { transactionId }),
        ...(notes && { notes }),
        // 실제 납부된 회비 유형 기록
        actualDuesType: duesType,
        updatedAt: serverTimestamp(),
      });

      // 면제 기간 처리 (분기회비 또는 연회비인 경우)
      if (exemptMonths > 0 && period?.year && period?.month) {
        if (duesType === 'quarterly') {
          // 분기 회비: 다음 2개월 면제 생성
          await this.createQuarterlyExemption(
            clubId,
            userId,
            period.year,
            period.month,
            recordId,
            markedBy
          );
          console.log(
            `✅ Quarterly exemption created: ${exemptMonths} months from ${period.year}/${period.month}`
          );
        } else if (duesType === 'yearly') {
          // 연회비: 12개월 면제 생성
          await this.createYearlyExemption(
            clubId,
            userId,
            period.year,
            period.month,
            recordId,
            markedBy
          );
          console.log(
            `✅ Yearly exemption created: ${exemptMonths} months from ${period.year}/${period.month}`
          );
        }
      }

      console.log(
        `✅ Record marked as paid: ${recordId} (${duesType}, ${exemptMonths} months exempt)`
      );
      return { exemptMonths, duesType };
    } catch (error) {
      console.error('Error marking record as paid:', error);
      throw error;
    }
  }

  /**
   * 레코드 미납 처리 (관리자)
   */
  async markRecordAsUnpaid(recordId: string, markedBy: string, notes?: string): Promise<void> {
    try {
      const recordRef = doc(db, 'member_dues_records', recordId);

      await updateDoc(recordRef, {
        status: 'unpaid',
        paidAt: null,
        paidMethod: null,
        paidAmount: null,
        transactionId: null,
        markedBy,
        ...(notes && { notes }),
        // 승인 관련 필드 초기화
        paymentRequestedAt: null,
        paymentRequestedMethod: null,
        paymentProofImageUrl: null,
        requestNotes: null,
        approvedBy: null,
        rejectedReason: null,
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Record marked as unpaid:', recordId);
    } catch (error) {
      console.error('Error marking record as unpaid:', error);
      throw error;
    }
  }

  /**
   * 회원 납부 요청 (승인 대기 상태로 변경)
   */
  async requestPaymentApproval(
    recordId: string,
    userId: string,
    paymentMethod: PaymentMethod,
    proofImageUrl?: string,
    notes?: string,
    requestedAmount?: number,
    requestedPaymentType?: 'monthly' | 'quarterly' | 'yearly' | 'custom',
    requestedPaidAt?: Date
  ): Promise<void> {
    try {
      const recordRef = doc(db, 'member_dues_records', recordId);
      const recordDoc = await getDoc(recordRef);

      if (!recordDoc.exists()) {
        throw new Error('Record not found');
      }

      const recordData = recordDoc.data();
      if (recordData.userId !== userId) {
        throw new Error('Permission denied: Not your record');
      }

      if (recordData.status === 'paid') {
        throw new Error('Already paid');
      }

      await updateDoc(recordRef, {
        status: 'pending_approval',
        paymentRequestedAt: serverTimestamp(),
        paymentRequestedMethod: paymentMethod,
        ...(proofImageUrl && { paymentProofImageUrl: proofImageUrl }),
        ...(notes && { requestNotes: notes }),
        ...(requestedAmount && { requestedAmount }),
        ...(requestedPaymentType && { requestedPaymentType }),
        ...(requestedPaidAt && { requestedPaidAt: Timestamp.fromDate(requestedPaidAt) }),
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Payment approval requested:', recordId);
    } catch (error) {
      console.error('Error requesting payment approval:', error);
      throw error;
    }
  }

  /**
   * 납부 요청 승인 (관리자)
   * 연회비/분기회비/커스텀 금액 승인 시 자동으로 월회비 면제 기간 생성
   */
  async approvePaymentRequest(
    recordId: string,
    approvedBy: string
  ): Promise<{ exemptMonths: number; remainingCredit: number }> {
    try {
      const recordRef = doc(db, 'member_dues_records', recordId);
      const recordDoc = await getDoc(recordRef);

      if (!recordDoc.exists()) {
        throw new Error('Record not found');
      }

      const recordData = recordDoc.data() as MemberDuesRecord;
      if (recordData.status !== 'pending_approval') {
        throw new Error('Record is not pending approval');
      }

      const { clubId, userId, period } = recordData;
      const requestedPaymentType = recordData.requestedPaymentType;
      const paidAmount = recordData.requestedAmount || recordData.amount;

      // 레코드 업데이트
      await updateDoc(recordRef, {
        status: 'paid',
        paidAt: serverTimestamp(),
        paidMethod: recordData.paymentRequestedMethod,
        paidAmount,
        approvedBy,
        updatedAt: serverTimestamp(),
      });

      let exemptMonths = 0;
      let remainingCredit = 0;

      // 연회비/분기회비/커스텀인 경우 면제 기간 생성
      if (period?.year && period?.month) {
        if (requestedPaymentType === 'yearly') {
          // 연회비: 12개월 면제 (현재 월 포함하여 앞으로 11개월)
          await this.createYearlyExemption(
            clubId,
            userId,
            period.year,
            period.month,
            recordId,
            approvedBy
          );
          exemptMonths = 11; // 현재 월 제외 앞으로 11개월 면제
          console.log(`✅ Yearly exemption created: 12 months from ${period.year}/${period.month}`);
        } else if (requestedPaymentType === 'quarterly') {
          // 분기회비: 3개월 면제 (현재 월 포함하여 앞으로 2개월)
          await this.createQuarterlyExemption(
            clubId,
            userId,
            period.year,
            period.month,
            recordId,
            approvedBy
          );
          exemptMonths = 2; // 현재 월 제외 앞으로 2개월 면제
          console.log(
            `✅ Quarterly exemption created: 3 months from ${period.year}/${period.month}`
          );
        } else if (requestedPaymentType === 'custom' && paidAmount > 0) {
          // 커스텀 금액: 월회비로 나눠서 면제 기간 계산
          const settings = await this.getClubDuesSettings(clubId);
          const monthlyFee = settings?.monthlyFee || settings?.amount || 0;

          if (monthlyFee > 0) {
            const { fullMonths, remainingCredit: credit } = calculateCustomAmountExemption(
              paidAmount,
              monthlyFee
            );

            if (fullMonths > 0 || credit > 0) {
              await this.createCustomExemption(
                clubId,
                userId,
                period.year,
                period.month,
                fullMonths,
                credit,
                recordId,
                approvedBy
              );
              exemptMonths = fullMonths > 0 ? fullMonths - 1 : 0; // 현재 월 제외
              remainingCredit = credit;
              console.log(
                `✅ Custom exemption created: ${fullMonths} months from ${period.year}/${period.month}, credit: $${credit}`
              );
            }
          }
        }
      }

      console.log('✅ Payment request approved:', recordId);
      return { exemptMonths, remainingCredit };
    } catch (error) {
      console.error('Error approving payment request:', error);
      throw error;
    }
  }

  /**
   * 납부 요청 거절 (관리자)
   */
  async rejectPaymentRequest(recordId: string, rejectedBy: string, reason?: string): Promise<void> {
    try {
      const recordRef = doc(db, 'member_dues_records', recordId);
      const recordDoc = await getDoc(recordRef);

      if (!recordDoc.exists()) {
        throw new Error('Record not found');
      }

      const recordData = recordDoc.data();
      if (recordData.status !== 'pending_approval') {
        throw new Error('Record is not pending approval');
      }

      await updateDoc(recordRef, {
        status: 'unpaid',
        paymentRequestedAt: null,
        paymentRequestedMethod: null,
        paymentProofImageUrl: null,
        requestNotes: null,
        markedBy: rejectedBy,
        ...(reason && { rejectedReason: reason }),
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Payment request rejected:', recordId);
    } catch (error) {
      console.error('Error rejecting payment request:', error);
      throw error;
    }
  }

  /**
   * 승인 대기 중인 납부 요청 목록 조회
   */
  async getPendingApprovalRequests(clubId: string): Promise<MemberDuesRecord[]> {
    try {
      const recordsRef = collection(db, 'member_dues_records');
      const q = query(
        recordsRef,
        where('clubId', '==', clubId),
        where('status', '==', 'pending_approval'),
        orderBy('paymentRequestedAt', 'asc')
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      })) as MemberDuesRecord[];
    } catch (error) {
      console.error('Error getting pending approval requests:', error);
      throw error;
    }
  }

  /**
   * 실시간 승인 대기 목록 구독
   */
  subscribeToPendingApprovalRequests(
    clubId: string,
    callback: (records: MemberDuesRecord[]) => void
  ): () => void {
    const recordsRef = collection(db, 'member_dues_records');
    const q = query(
      recordsRef,
      where('clubId', '==', clubId),
      where('status', '==', 'pending_approval'),
      orderBy('paymentRequestedAt', 'asc')
    );

    return onSnapshot(q, snapshot => {
      const records = snapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      })) as MemberDuesRecord[];

      callback(records);
    });
  }

  /**
   * 레코드 삭제 (관리자)
   */
  async deleteDuesRecord(recordId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'member_dues_records', recordId));
      console.log('✅ Dues record deleted:', recordId);
    } catch (error) {
      console.error('Error deleting dues record:', error);
      throw error;
    }
  }

  /**
   * 회원 레코드 ID로 조회
   */
  async getDuesRecordById(recordId: string): Promise<MemberDuesRecord | null> {
    try {
      const recordRef = doc(db, 'member_dues_records', recordId);
      const recordDoc = await getDoc(recordRef);

      if (!recordDoc.exists()) {
        return null;
      }

      return {
        id: recordDoc.id,
        ...recordDoc.data(),
      } as MemberDuesRecord;
    } catch (error) {
      console.error('Error getting dues record by id:', error);
      throw error;
    }
  }

  /**
   * 클럽의 미납 레코드 조회
   */
  async getUnpaidDuesRecords(clubId: string): Promise<MemberDuesRecord[]> {
    try {
      const recordsRef = collection(db, 'member_dues_records');
      const q = query(
        recordsRef,
        where('clubId', '==', clubId),
        where('status', 'in', ['unpaid', 'overdue']),
        orderBy('createdAt', 'asc')
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      })) as MemberDuesRecord[];
    } catch (error) {
      console.error('Error getting unpaid dues records:', error);
      throw error;
    }
  }

  /**
   * 회원에게 모든 미납 회비 레코드 생성 (가입비 + 현재 기간 회비)
   */
  async initializeMemberDuesRecords(
    clubId: string,
    userId: string,
    settings: ClubDuesSettings
  ): Promise<void> {
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      // 1. 가입비 레코드 생성 (설정된 경우)
      if (settings.joinFee && settings.joinFee > 0) {
        await this.createJoinFeeRecord(clubId, userId, settings.joinFee, settings.currency);
      }

      // 2. 월회비 또는 연회비 레코드 생성
      if (settings.duesType === 'monthly' && settings.monthlyFee && settings.monthlyFee > 0) {
        await this.createPeriodicDuesRecord(
          clubId,
          userId,
          'monthly',
          currentYear,
          currentMonth,
          settings.monthlyFee,
          settings.currency
        );
      } else if (settings.duesType === 'yearly' && settings.yearlyFee && settings.yearlyFee > 0) {
        await this.createPeriodicDuesRecord(
          clubId,
          userId,
          'yearly',
          currentYear,
          undefined,
          settings.yearlyFee,
          settings.currency
        );
      }

      console.log('✅ Member dues records initialized:', userId);
    } catch (error) {
      console.error('Error initializing member dues records:', error);
      throw error;
    }
  }

  /**
   * 특정 회원의 회비 레코드 실시간 구독 (회원용)
   */
  subscribeToMemberDuesRecords(
    clubId: string,
    userId: string,
    callback: (records: MemberDuesRecord[]) => void
  ): () => void {
    const recordsRef = collection(db, 'member_dues_records');
    const q = query(
      recordsRef,
      where('clubId', '==', clubId),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const records = snapshot.docs.map(docSnapshot => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        })) as MemberDuesRecord[];
        callback(records);
      },
      error => {
        console.error('Error subscribing to member dues records:', error);
        callback([]);
      }
    );

    return unsubscribe;
  }

  // ============================================
  // 납부 이력 조회 (3년 보관, 회원/관리자 모두 사용)
  // ============================================

  /**
   * 회원 본인의 납부 이력 조회 (최대 3년)
   */
  async getMyPaymentHistory(
    clubId: string,
    userId: string,
    options?: {
      year?: number;
      duesType?: DuesType;
      status?: PaymentStatus;
    }
  ): Promise<MemberDuesRecord[]> {
    try {
      const recordsRef = collection(db, 'member_dues_records');

      // 3년 전 날짜 계산
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      const threeYearsAgoTimestamp = Timestamp.fromDate(threeYearsAgo);

      const q = query(
        recordsRef,
        where('clubId', '==', clubId),
        where('userId', '==', userId),
        where('createdAt', '>=', threeYearsAgoTimestamp),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      let records = snapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      })) as MemberDuesRecord[];

      // 추가 필터 적용
      if (options?.year) {
        records = records.filter(r => {
          if (r.period?.year) return r.period.year === options.year;
          const createdYear = r.createdAt?.toDate?.()?.getFullYear?.();
          return createdYear === options.year;
        });
      }

      if (options?.duesType) {
        records = records.filter(r => r.duesType === options.duesType);
      }

      if (options?.status) {
        records = records.filter(r => r.status === options.status);
      }

      return records;
    } catch (error) {
      console.error('Error getting my payment history:', error);
      throw error;
    }
  }

  /**
   * 관리자용: 전체 회원 납부 이력 조회 (최대 3년)
   */
  async getAllMembersPaymentHistory(
    clubId: string,
    options?: {
      year?: number;
      month?: number;
      duesType?: DuesType;
      status?: PaymentStatus;
    }
  ): Promise<MemberDuesRecord[]> {
    try {
      const recordsRef = collection(db, 'member_dues_records');

      // 3년 전 날짜 계산
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      const threeYearsAgoTimestamp = Timestamp.fromDate(threeYearsAgo);

      const q = query(
        recordsRef,
        where('clubId', '==', clubId),
        where('createdAt', '>=', threeYearsAgoTimestamp),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      let records = snapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      })) as MemberDuesRecord[];

      // 추가 필터 적용
      if (options?.year) {
        records = records.filter(r => r.period?.year === options.year);
      }

      if (options?.month) {
        records = records.filter(r => r.period?.month === options.month);
      }

      if (options?.duesType) {
        records = records.filter(r => r.duesType === options.duesType);
      }

      if (options?.status) {
        records = records.filter(r => r.status === options.status);
      }

      return records;
    } catch (error) {
      console.error('Error getting all members payment history:', error);
      throw error;
    }
  }

  /**
   * 연도별 납부 통계 조회
   */
  async getYearlyPaymentStats(
    clubId: string,
    year: number
  ): Promise<{
    totalRevenue: number;
    joinFeeRevenue: number;
    monthlyDuesRevenue: number;
    yearlyDuesRevenue: number;
    lateFeeRevenue: number;
    paidCount: number;
    unpaidCount: number;
    overdueCount: number;
  }> {
    try {
      const recordsRef = collection(db, 'member_dues_records');
      const q = query(recordsRef, where('clubId', '==', clubId));

      const snapshot = await getDocs(q);

      let totalRevenue = 0;
      let joinFeeRevenue = 0;
      let monthlyDuesRevenue = 0;
      let yearlyDuesRevenue = 0;
      let lateFeeRevenue = 0;
      let paidCount = 0;
      let unpaidCount = 0;
      let overdueCount = 0;

      snapshot.forEach(docSnapshot => {
        const record = docSnapshot.data() as MemberDuesRecord;

        // 해당 연도 기록만 집계
        const paidAt = record.paidAt?.toDate?.();
        const recordYear = paidAt?.getFullYear() || record.period?.year;

        if (recordYear !== year && record.duesType !== 'join') {
          return;
        }

        if (record.status === 'paid') {
          const amount = record.paidAmount || record.amount;
          totalRevenue += amount;
          paidCount++;

          switch (record.duesType) {
            case 'join':
              joinFeeRevenue += amount;
              break;
            case 'monthly':
              monthlyDuesRevenue += amount;
              break;
            case 'yearly':
              yearlyDuesRevenue += amount;
              break;
            case 'late_fee':
              lateFeeRevenue += amount;
              break;
          }
        } else if (record.status === 'unpaid') {
          unpaidCount++;
        } else if (record.status === 'overdue') {
          overdueCount++;
        }
      });

      return {
        totalRevenue,
        joinFeeRevenue,
        monthlyDuesRevenue,
        yearlyDuesRevenue,
        lateFeeRevenue,
        paidCount,
        unpaidCount,
        overdueCount,
      };
    } catch (error) {
      console.error('Error getting yearly payment stats:', error);
      throw error;
    }
  }

  /**
   * 연간 보고서 조회
   */
  async getAnnualReport(
    clubId: string,
    year: number
  ): Promise<{
    id: string;
    year: number;
    totalRevenue: number;
    monthlyBreakdown: Array<{
      month: number;
      joinFee: number;
      monthlyDues: number;
      yearlyDues: number;
      lateFee: number;
      total: number;
      paidCount: number;
    }>;
    collectionRate: number;
    generatedAt: Timestamp;
  } | null> {
    try {
      const reportsRef = collection(db, 'annual_dues_reports');
      const q = query(
        reportsRef,
        where('clubId', '==', clubId),
        where('year', '==', year),
        limit(1)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as {
        id: string;
        year: number;
        totalRevenue: number;
        monthlyBreakdown: Array<{
          month: number;
          joinFee: number;
          monthlyDues: number;
          yearlyDues: number;
          lateFee: number;
          total: number;
          paidCount: number;
        }>;
        collectionRate: number;
        generatedAt: Timestamp;
      };
    } catch (error) {
      console.error('Error getting annual report:', error);
      throw error;
    }
  }

  // ============================================
  // 연회비 면제 기간 관리
  // ============================================

  /**
   * 연회비 납부 시 면제 기간 생성
   */
  async createYearlyExemption(
    clubId: string,
    userId: string,
    startYear: number,
    startMonth: number,
    yearlyDuesRecordId: string,
    createdBy: string
  ): Promise<string> {
    try {
      // 면제 기간 계산 (시작월로부터 12개월)
      let endMonth = startMonth - 1;
      let endYear = startYear + 1;

      if (endMonth <= 0) {
        endMonth = 12 + endMonth;
        endYear = startYear;
      }

      const exemption = {
        clubId,
        userId,
        startYear,
        startMonth,
        endYear,
        endMonth,
        yearlyDuesRecordId,
        createdAt: serverTimestamp(),
        createdBy,
      };

      const docRef = await addDoc(collection(db, 'member_yearly_exemptions'), exemption);
      console.log('✅ Yearly exemption created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating yearly exemption:', error);
      throw error;
    }
  }

  /**
   * 회원의 면제 기간 조회
   */
  async getMemberExemptions(
    clubId: string,
    userId: string
  ): Promise<
    Array<{
      id: string;
      startYear: number;
      startMonth: number;
      endYear: number;
      endMonth: number;
    }>
  > {
    try {
      const exemptionsRef = collection(db, 'member_yearly_exemptions');
      const q = query(
        exemptionsRef,
        where('clubId', '==', clubId),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      })) as Array<{
        id: string;
        startYear: number;
        startMonth: number;
        endYear: number;
        endMonth: number;
      }>;
    } catch (error) {
      console.error('Error getting member exemptions:', error);
      throw error;
    }
  }

  /**
   * 특정 월이 면제 기간 내인지 확인
   */
  async isMonthExempted(
    clubId: string,
    userId: string,
    year: number,
    month: number
  ): Promise<boolean> {
    try {
      const exemptions = await this.getMemberExemptions(clubId, userId);

      for (const exemption of exemptions) {
        const checkDate = year * 12 + month;
        const startDate = exemption.startYear * 12 + exemption.startMonth;
        const endDate = exemption.endYear * 12 + exemption.endMonth;

        if (checkDate >= startDate && checkDate <= endDate) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking month exemption:', error);
      return false;
    }
  }

  // ============================================
  // 분기 회비 면제 기간 관리
  // ============================================

  /**
   * 분기 회비 납부 시 면제 기간 생성 (3개월)
   */
  async createQuarterlyExemption(
    clubId: string,
    userId: string,
    startYear: number,
    startMonth: number,
    quarterlyDuesRecordId: string,
    createdBy: string
  ): Promise<string> {
    try {
      // 면제 기간 계산 (시작월로부터 3개월)
      const { endYear, endMonth } = calculateQuarterlyExemptionPeriod(startYear, startMonth);

      const exemption = {
        clubId,
        userId,
        startYear,
        startMonth,
        endYear,
        endMonth,
        quarterlyDuesRecordId,
        createdAt: serverTimestamp(),
        createdBy,
      };

      const docRef = await addDoc(collection(db, 'member_quarterly_exemptions'), exemption);
      console.log('✅ Quarterly exemption created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating quarterly exemption:', error);
      throw error;
    }
  }

  /**
   * 회원의 분기 면제 기간 조회
   */
  async getMemberQuarterlyExemptions(
    clubId: string,
    userId: string
  ): Promise<
    Array<{
      id: string;
      startYear: number;
      startMonth: number;
      endYear: number;
      endMonth: number;
    }>
  > {
    try {
      const exemptionsRef = collection(db, 'member_quarterly_exemptions');
      const q = query(
        exemptionsRef,
        where('clubId', '==', clubId),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      })) as Array<{
        id: string;
        startYear: number;
        startMonth: number;
        endYear: number;
        endMonth: number;
      }>;
    } catch (error) {
      console.error('Error getting member quarterly exemptions:', error);
      throw error;
    }
  }

  /**
   * 특정 월이 분기 면제 기간 내인지 확인
   */
  async isMonthQuarterlyExempted(
    clubId: string,
    userId: string,
    year: number,
    month: number
  ): Promise<boolean> {
    try {
      const exemptions = await this.getMemberQuarterlyExemptions(clubId, userId);

      for (const exemption of exemptions) {
        const checkDate = year * 12 + month;
        const startDate = exemption.startYear * 12 + exemption.startMonth;
        const endDate = exemption.endYear * 12 + exemption.endMonth;

        if (checkDate >= startDate && checkDate <= endDate) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking quarterly month exemption:', error);
      return false;
    }
  }

  /**
   * 특정 월이 어떤 면제(연회비/분기회비/커스텀)에도 해당하는지 확인
   */
  async isMonthExemptedFromAny(
    clubId: string,
    userId: string,
    year: number,
    month: number
  ): Promise<boolean> {
    const isYearlyExempted = await this.isMonthExempted(clubId, userId, year, month);
    if (isYearlyExempted) return true;

    const isQuarterlyExempted = await this.isMonthQuarterlyExempted(clubId, userId, year, month);
    if (isQuarterlyExempted) return true;

    const isCustomExempted = await this.isMonthCustomExempted(clubId, userId, year, month);
    return isCustomExempted;
  }

  // ============================================
  // 커스텀 금액 면제 기간 관리
  // ============================================

  /**
   * 커스텀 금액 납부 시 면제 기간 생성
   * @param fullMonths 완전히 커버되는 개월 수
   * @param remainingCredit 나머지 크레딧 (다음 달 적용)
   */
  async createCustomExemption(
    clubId: string,
    userId: string,
    startYear: number,
    startMonth: number,
    fullMonths: number,
    remainingCredit: number,
    duesRecordId: string,
    createdBy: string
  ): Promise<string> {
    try {
      // 면제 기간 계산
      const { endYear, endMonth, creditApplyYear, creditApplyMonth } =
        calculateCustomExemptionPeriod(startYear, startMonth, fullMonths);

      const exemption = {
        clubId,
        userId,
        startYear,
        startMonth,
        endYear,
        endMonth,
        remainingCredit,
        ...(remainingCredit > 0 && {
          creditApplyYear,
          creditApplyMonth,
        }),
        duesRecordId,
        createdAt: serverTimestamp(),
        createdBy,
      };

      const docRef = await addDoc(collection(db, 'member_custom_exemptions'), exemption);
      console.log('✅ Custom exemption created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating custom exemption:', error);
      throw error;
    }
  }

  /**
   * 회원의 커스텀 면제 기간 조회
   */
  async getMemberCustomExemptions(
    clubId: string,
    userId: string
  ): Promise<
    Array<{
      id: string;
      startYear: number;
      startMonth: number;
      endYear: number;
      endMonth: number;
      remainingCredit: number;
      creditApplyYear?: number;
      creditApplyMonth?: number;
    }>
  > {
    try {
      const exemptionsRef = collection(db, 'member_custom_exemptions');
      const q = query(
        exemptionsRef,
        where('clubId', '==', clubId),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      })) as Array<{
        id: string;
        startYear: number;
        startMonth: number;
        endYear: number;
        endMonth: number;
        remainingCredit: number;
        creditApplyYear?: number;
        creditApplyMonth?: number;
      }>;
    } catch (error) {
      console.error('Error getting member custom exemptions:', error);
      throw error;
    }
  }

  /**
   * 특정 월이 커스텀 면제 기간 내인지 확인
   */
  async isMonthCustomExempted(
    clubId: string,
    userId: string,
    year: number,
    month: number
  ): Promise<boolean> {
    try {
      const exemptions = await this.getMemberCustomExemptions(clubId, userId);

      for (const exemption of exemptions) {
        const checkDate = year * 12 + month;
        const startDate = exemption.startYear * 12 + exemption.startMonth;
        const endDate = exemption.endYear * 12 + exemption.endMonth;

        if (checkDate >= startDate && checkDate <= endDate) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking custom month exemption:', error);
      return false;
    }
  }

  /**
   * 특정 월에 적용할 크레딧 조회
   * @returns 크레딧 금액 (해당 월 회비에서 차감)
   */
  async getMonthCredit(
    clubId: string,
    userId: string,
    year: number,
    month: number
  ): Promise<number> {
    try {
      const exemptions = await this.getMemberCustomExemptions(clubId, userId);

      for (const exemption of exemptions) {
        if (
          exemption.creditApplyYear === year &&
          exemption.creditApplyMonth === month &&
          exemption.remainingCredit > 0
        ) {
          return exemption.remainingCredit;
        }
      }

      return 0;
    } catch (error) {
      console.error('Error getting month credit:', error);
      return 0;
    }
  }

  // ============================================
  // 회비 면제자 관리 (월회비 자동 생성 제외)
  // ============================================

  /**
   * 회원 회비 면제 상태 설정/해제
   * clubMembers 컬렉션의 회원 문서에 isDuesExempt 필드 저장
   */
  async setMemberDuesExempt(
    clubId: string,
    userId: string,
    isExempt: boolean,
    reason?: string
  ): Promise<void> {
    try {
      // clubMembers에서 해당 회원 문서 찾기
      const membersRef = collection(db, 'clubMembers');
      const q = query(membersRef, where('clubId', '==', clubId), where('userId', '==', userId));

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        throw new Error('Member not found');
      }

      const memberDocRef = snapshot.docs[0].ref;

      // 면제 상태 업데이트
      await updateDoc(memberDocRef, {
        isDuesExempt: isExempt,
        ...(isExempt && reason && { duesExemptReason: reason }),
        ...(!isExempt && { duesExemptReason: deleteField() }),
        updatedAt: serverTimestamp(),
      });

      console.log(
        `✅ Member dues exempt status updated: ${userId} -> ${isExempt ? 'Exempt' : 'Not Exempt'}`
      );
    } catch (error) {
      console.error('Error setting member dues exempt:', error);
      throw error;
    }
  }

  /**
   * 회원 회비 면제 상태 조회
   */
  async getMemberDuesExemptStatus(
    clubId: string,
    userId: string
  ): Promise<{ isExempt: boolean; reason?: string }> {
    try {
      const membersRef = collection(db, 'clubMembers');
      const q = query(membersRef, where('clubId', '==', clubId), where('userId', '==', userId));

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return { isExempt: false };
      }

      const memberData = snapshot.docs[0].data();
      return {
        isExempt: memberData.isDuesExempt || false,
        reason: memberData.duesExemptReason,
      };
    } catch (error) {
      console.error('Error getting member dues exempt status:', error);
      return { isExempt: false };
    }
  }

  /**
   * 클럽의 모든 면제 회원 목록 조회
   */
  async getExemptMembers(clubId: string): Promise<string[]> {
    try {
      const membersRef = collection(db, 'clubMembers');
      const q = query(
        membersRef,
        where('clubId', '==', clubId),
        where('status', '==', 'active'),
        where('isDuesExempt', '==', true)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data().userId);
    } catch (error) {
      console.error('Error getting exempt members:', error);
      return [];
    }
  }

  /**
   * 연간 회비 납부 보고서 데이터 조회
   * 회원별 월별 납부 금액 합계를 반환
   * ⚡ [KIM FIX] N+1 쿼리 문제 해결 - Promise.all로 병렬 처리
   */
  async getAnnualDuesReport(
    clubId: string,
    year: number
  ): Promise<{
    members: Array<{
      userId: string;
      displayName: string;
      monthlyPayments: number[]; // index 0 = 1월, index 11 = 12월
      total: number;
    }>;
    monthlyTotals: number[]; // 월별 총액
    grandTotal: number;
  }> {
    try {
      // 1. 해당 클럽의 모든 활성 회원 조회
      const membersRef = collection(db, 'clubMembers');
      const membersQuery = query(
        membersRef,
        where('clubId', '==', clubId),
        where('status', '==', 'active')
      );
      const membersSnapshot = await getDocs(membersQuery);

      // ⚡ Step 1: 모든 회원 userId 수집
      const userIds = membersSnapshot.docs.map(docSnapshot => docSnapshot.data().userId as string);

      // ⚡ Step 2: 모든 사용자 정보를 병렬로 조회
      console.log(`⚡ Fetching ${userIds.length} user docs in parallel for annual report`);
      const userDocsPromises = userIds.map(userId =>
        getDoc(doc(db, 'users', userId)).catch(err => {
          console.warn(`⚠️ Failed to fetch user ${userId}:`, err.message);
          return null;
        })
      );
      const userDocsResults = await Promise.all(userDocsPromises);

      // 사용자 정보 맵 생성
      const memberMap = new Map<string, { userId: string; displayName: string }>();
      userDocsResults.forEach((userSnap, index) => {
        const userId = userIds[index];
        let displayName = i18n.t('common.unknown');

        if (userSnap && userSnap.exists()) {
          const userData = userSnap.data();
          displayName =
            userData.displayName ||
            userData.profile?.displayName ||
            userData.nickname ||
            i18n.t('common.unknown');
        }

        memberMap.set(userId, { userId, displayName });
      });

      // 2. 해당 연도의 모든 납부 완료된 회비 레코드 조회
      const recordsRef = collection(db, 'member_dues_records');
      const recordsQuery = query(
        recordsRef,
        where('clubId', '==', clubId),
        where('status', '==', 'paid')
      );
      const recordsSnapshot = await getDocs(recordsQuery);

      // 3. 회원별 월별 납부 금액 집계
      const memberPayments = new Map<string, number[]>();

      // 모든 회원에 대해 초기화
      memberMap.forEach((_, odUserId) => {
        memberPayments.set(odUserId, new Array(12).fill(0));
      });

      for (const recordDoc of recordsSnapshot.docs) {
        const record = recordDoc.data();
        const paidAt = record.paidAt;

        if (!paidAt) continue;

        // paidAt 날짜에서 연도와 월 추출
        let paidDate: Date;
        if (paidAt.toDate) {
          paidDate = paidAt.toDate();
        } else if (paidAt.seconds) {
          paidDate = new Date(paidAt.seconds * 1000);
        } else {
          paidDate = new Date(paidAt);
        }

        const paidYear = paidDate.getFullYear();
        const paidMonth = paidDate.getMonth(); // 0-11

        // 해당 연도의 납부만 집계
        if (paidYear !== year) continue;

        const userId = record.userId;
        const amount = record.amount || 0;

        // 회원이 memberMap에 없으면 추가 (탈퇴한 회원의 기록일 수 있음)
        if (!memberPayments.has(userId)) {
          memberPayments.set(userId, new Array(12).fill(0));
          if (!memberMap.has(userId)) {
            memberMap.set(userId, { userId, displayName: i18n.t('common.withdrawnMember') });
          }
        }

        const payments = memberPayments.get(userId)!;
        payments[paidMonth] += amount;
      }

      // 4. 결과 정리
      const members: Array<{
        userId: string;
        displayName: string;
        monthlyPayments: number[];
        total: number;
      }> = [];

      const monthlyTotals = new Array(12).fill(0);
      let grandTotal = 0;

      memberMap.forEach((member, odUserId) => {
        const payments = memberPayments.get(odUserId) || new Array(12).fill(0);
        const total = payments.reduce((sum, val) => sum + val, 0);

        members.push({
          userId: odUserId,
          displayName: member.displayName,
          monthlyPayments: payments,
          total,
        });

        // 월별 총액 집계
        payments.forEach((amount, monthIndex) => {
          monthlyTotals[monthIndex] += amount;
        });

        grandTotal += total;
      });

      // 이름순 정렬
      members.sort((a, b) => a.displayName.localeCompare(b.displayName, 'ko'));

      return {
        members,
        monthlyTotals,
        grandTotal,
      };
    } catch (error) {
      console.error('Error getting annual dues report:', error);
      return {
        members: [],
        monthlyTotals: new Array(12).fill(0),
        grandTotal: 0,
      };
    }
  }
}

// 싱글톤 인스턴스 생성
const duesService = new DuesService();
export default duesService;
