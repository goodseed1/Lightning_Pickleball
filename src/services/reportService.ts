/**
 * Report Service - Apple Guideline 1.2 Compliance
 *
 * 콘텐츠 신고 시스템을 위한 서비스
 * - 신고 제출
 * - 신고 목록 구독 (관리자용)
 * - 신고 상태 업데이트
 * - 통계 조회
 */

import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
  getCountFromServer,
  getDocs,
  limit,
  QueryConstraint,
  getDoc,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase/config';

// ============ TYPES ============

export type ReportTargetType = 'user' | 'club' | 'event' | 'post' | 'comment' | 'chat';

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'inappropriate'
  | 'hate_speech'
  | 'violence'
  | 'other';

export type ReportStatus = 'pending' | 'reviewed' | 'action_taken' | 'dismissed';

export type ActionTaken = 'warning' | 'content_removed' | 'user_banned' | 'user_unbanned';

export interface ContentReport {
  id?: string;

  // 신고자 정보
  reporterId: string;
  reporterEmail: string;
  reporterName: string;

  // 신고 대상 정보
  targetType: ReportTargetType;
  targetId: string;
  targetOwnerId: string;
  targetOwnerName: string;
  targetSnapshot?: Record<string, unknown>; // 신고 시점의 콘텐츠 스냅샷

  // 신고 내용
  reason: ReportReason;
  description?: string;

  // 상태
  status: ReportStatus;
  adminNotes?: string;
  actionTaken?: ActionTaken;

  // 시간
  createdAt: Timestamp | Date;
  reviewedAt?: Timestamp | Date;
  reviewedBy?: string;
}

export interface ReportStats {
  total: number;
  pending: number;
  reviewed: number;
  actionTaken: number;
  dismissed: number;
}

// ============ CONSTANTS ============

const COLLECTION_NAME = 'content_reports';

// ============ SERVICE FUNCTIONS ============

/**
 * 콘텐츠 신고 제출
 */
export const submitReport = async (
  report: Omit<ContentReport, 'id' | 'createdAt' | 'status'>
): Promise<string> => {
  try {
    const reportData = {
      ...report,
      status: 'pending' as ReportStatus,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), reportData);
    console.log('📢 [ReportService] Report submitted:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ [ReportService] Error submitting report:', error);
    throw error;
  }
};

/**
 * 신고 목록 실시간 구독 (관리자용)
 */
export const subscribeToReports = (
  callback: (reports: ContentReport[]) => void,
  filters?: {
    status?: ReportStatus;
    targetType?: ReportTargetType;
    limitCount?: number;
  }
): (() => void) => {
  try {
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];

    if (filters?.status) {
      constraints.unshift(where('status', '==', filters.status));
    }

    if (filters?.targetType) {
      constraints.unshift(where('targetType', '==', filters.targetType));
    }

    if (filters?.limitCount) {
      constraints.push(limit(filters.limitCount));
    }

    const q = query(collection(db, COLLECTION_NAME), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const reports: ContentReport[] = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as ContentReport[];

        callback(reports);
      },
      error => {
        console.error('❌ [ReportService] Error in subscription:', error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('❌ [ReportService] Error setting up subscription:', error);
    return () => {};
  }
};

/**
 * 신고 상태 업데이트 (관리자용)
 */
export const updateReportStatus = async (
  reportId: string,
  status: ReportStatus,
  options?: {
    adminNotes?: string;
    actionTaken?: ActionTaken;
    reviewedBy?: string;
  }
): Promise<void> => {
  try {
    const updateData: Record<string, unknown> = {
      status,
      reviewedAt: Timestamp.now(),
    };

    if (options?.adminNotes) {
      updateData.adminNotes = options.adminNotes;
    }

    if (options?.actionTaken) {
      updateData.actionTaken = options.actionTaken;
    }

    if (options?.reviewedBy) {
      updateData.reviewedBy = options.reviewedBy;
    }

    await updateDoc(doc(db, COLLECTION_NAME, reportId), updateData);
    console.log('✅ [ReportService] Report status updated:', reportId, status);
  } catch (error) {
    console.error('❌ [ReportService] Error updating report status:', error);
    throw error;
  }
};

/**
 * 신고 통계 조회 (관리자용)
 */
export const getReportStats = async (): Promise<ReportStats> => {
  try {
    const collRef = collection(db, COLLECTION_NAME);

    // 전체 카운트
    const totalSnapshot = await getCountFromServer(collRef);
    const total = totalSnapshot.data().count;

    // 상태별 카운트
    const statuses: ReportStatus[] = ['pending', 'reviewed', 'action_taken', 'dismissed'];
    const statusCounts: Record<string, number> = {};

    for (const status of statuses) {
      const statusQuery = query(collRef, where('status', '==', status));
      const statusSnapshot = await getCountFromServer(statusQuery);
      statusCounts[status] = statusSnapshot.data().count;
    }

    return {
      total,
      pending: statusCounts.pending || 0,
      reviewed: statusCounts.reviewed || 0,
      actionTaken: statusCounts.action_taken || 0,
      dismissed: statusCounts.dismissed || 0,
    };
  } catch (error) {
    console.error('❌ [ReportService] Error getting report stats:', error);
    return {
      total: 0,
      pending: 0,
      reviewed: 0,
      actionTaken: 0,
      dismissed: 0,
    };
  }
};

/**
 * 사용자가 이미 특정 콘텐츠를 신고했는지 확인
 *
 * NOTE: 오직 pending 상태의 리포트만 중복으로 간주
 * - pending: 아직 검토 대기 중 → 중복 신고 불가
 * - reviewed/action_taken/dismissed: 처리 완료 → 다시 신고 가능
 */
export const hasUserReported = async (
  reporterId: string,
  targetType: ReportTargetType,
  targetId: string
): Promise<boolean> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('reporterId', '==', reporterId),
      where('targetType', '==', targetType),
      where('targetId', '==', targetId),
      where('status', '==', 'pending'),
      limit(1)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('❌ [ReportService] Error checking if user reported:', error);
    return false;
  }
};

/**
 * 대기 중인 신고 수 조회 (배지 표시용)
 */
export const getPendingReportsCount = async (): Promise<number> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('status', '==', 'pending'));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  } catch (error) {
    console.error('❌ [ReportService] Error getting pending reports count:', error);
    return 0;
  }
};

// ============ CONTENT REMOVAL (Cloud Function) ============

interface RemoveContentResult {
  success: boolean;
  message: string;
  deletedItems?: number;
  error?: string;
}

/**
 * 🚨 [Apple 1.2] Remove reported content via Cloud Function
 * Called when admin selects "Content Removed" action
 *
 * @param reportId - The ID of the content report
 * @param adminNotes - Optional admin notes explaining the action
 * @returns Promise with removal result
 */
export const removeReportedContent = async (
  reportId: string,
  adminNotes?: string
): Promise<RemoveContentResult> => {
  try {
    // 1. Get the report details
    const reportDoc = await getDoc(doc(db, COLLECTION_NAME, reportId));
    if (!reportDoc.exists()) {
      throw new Error('Report not found');
    }

    const report = reportDoc.data() as ContentReport;

    // 2. Call Cloud Function to remove content
    const removeContentFn = httpsCallable<
      {
        reportId: string;
        targetType: ReportTargetType;
        targetId: string;
        targetOwnerId: string;
        targetSnapshot?: Record<string, unknown>;
        adminNotes?: string;
      },
      RemoveContentResult
    >(functions, 'removeReportedContent');

    const result = await removeContentFn({
      reportId,
      targetType: report.targetType,
      targetId: report.targetId,
      targetOwnerId: report.targetOwnerId,
      targetSnapshot: report.targetSnapshot,
      adminNotes,
    });

    console.log('🗑️ [ReportService] Content removed:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ [ReportService] Error removing content:', error);
    throw error;
  }
};

/**
 * 🔔 Get count of NEW user feedback (status === 'new')
 * Only counts feedback that has never been responded to by admin
 *
 * NOTE: This counts ALL feedback with status='new' in Firestore.
 * If the count seems high, check Firestore Console for actual data.
 */
export const getPendingFeedbackCount = async (): Promise<number> => {
  try {
    const q = query(collection(db, 'user_feedback'), where('status', '==', 'new'));
    const snapshot = await getCountFromServer(q);
    const count = snapshot.data().count;

    console.log('🔔 [ReportService] Pending feedback count (status=new):', count);

    return count;
  } catch (error) {
    console.error('❌ [ReportService] Error getting pending feedback count:', error);
    return 0;
  }
};

export default {
  submitReport,
  subscribeToReports,
  updateReportStatus,
  getReportStats,
  hasUserReported,
  getPendingReportsCount,
  getPendingFeedbackCount,
  removeReportedContent,
};
