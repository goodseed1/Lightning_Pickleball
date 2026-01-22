/**
 * usePendingAdminAlerts Hook
 *
 * Custom hook for fetching admin alert counts:
 * - Content Reports (Apple 1.2 compliance)
 * - User Feedback awaiting response
 *
 * Only fetches data when user is admin.
 * Returns combined total for badge display.
 *
 * [KIM FIX] Uses same data source as UserFeedbackScreen
 * to ensure consistent badge counts.
 *
 * @author Kim
 * @date 2025-01-17
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getPendingReportsCount } from '../../services/reportService';
import { subscribeToAllFeedback, UserFeedback } from '../../services/adminService';

interface PendingAdminAlertsResult {
  /** Total combined count (reports only - for tab badge) */
  totalAlertCount: number;
  /** Content reports count only */
  pendingReportsCount: number;
  /** User feedback count only (status === 'new') */
  pendingFeedbackCount: number;
  /** Loading state */
  isLoading: boolean;
  /** Manual refresh function */
  refresh: () => Promise<void>;
}

/**
 * Hook to get pending admin alerts count
 * Only active when user is an admin
 */
export const usePendingAdminAlerts = (): PendingAdminAlertsResult => {
  const { isAdmin } = useAuth();
  const [pendingReportsCount, setPendingReportsCount] = useState(0);
  const [pendingFeedbackCount, setPendingFeedbackCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // [KIM FIX] Fetch content reports count
  const fetchReportsCount = useCallback(async () => {
    if (!isAdmin) {
      setPendingReportsCount(0);
      return;
    }

    try {
      const reportsCount = await getPendingReportsCount();
      setPendingReportsCount(reportsCount);
    } catch (error) {
      console.error('[ADMIN_ALERTS] Error fetching reports count:', error);
      setPendingReportsCount(0);
    }
  }, [isAdmin]);

  // [KIM FIX] Subscribe to feedback - same as UserFeedbackScreen
  // This ensures consistent count between badge and screen
  useEffect(() => {
    if (!isAdmin) {
      setPendingFeedbackCount(0);
      return;
    }

    setIsLoading(true);

    // Subscribe to all feedback and count 'new' status locally
    const unsubscribe = subscribeToAllFeedback((feedbacks: UserFeedback[]) => {
      const newCount = feedbacks.filter(f => f.status === 'new').length;

      console.log('[ADMIN_ALERTS] Feedback subscription update:', {
        totalFeedbacks: feedbacks.length,
        newFeedbacks: newCount,
      });

      setPendingFeedbackCount(newCount);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [isAdmin]);

  // [KIM FIX] Fetch reports count when isAdmin changes
  // This ensures badge shows correctly even if isAdmin loads after hook mounts
  useEffect(() => {
    fetchReportsCount();
  }, [fetchReportsCount]);

  // Log combined counts
  useEffect(() => {
    console.log('[ADMIN_ALERTS] Current counts:', {
      reports: pendingReportsCount,
      feedback: pendingFeedbackCount,
      tabBadgeTotal: pendingReportsCount,
    });
  }, [pendingReportsCount, pendingFeedbackCount]);

  return {
    // Tab badge only shows pending content reports (not feedback)
    totalAlertCount: pendingReportsCount,
    pendingReportsCount,
    pendingFeedbackCount,
    isLoading,
    refresh: fetchReportsCount,
  };
};

export default usePendingAdminAlerts;
