/**
 * AdminService - Real-time User Feedback Management
 * Provides functions for admins to monitor and manage user feedback
 */

import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  getDocs,
  Timestamp,
  QueryConstraint,
  arrayUnion,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Conversation Message Interface for feedback threads
 */
export interface ConversationMessage {
  sender: 'user' | 'admin';
  senderName: string;
  senderId: string;
  message: string;
  timestamp: Date;
}

/**
 * User Feedback Interface
 */
export interface UserFeedback {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: 'bug' | 'feature' | 'complaint' | 'praise' | 'other';
  title: string;
  description: string;
  status: 'new' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  adminNotes?: string;
  // Legacy single response field (for backward compatibility)
  adminResponse?: string;
  respondedAt?: Date;
  respondedBy?: string;
  // 💬 New: Conversation thread
  conversation?: ConversationMessage[];
  lastMessageAt?: Date;
  lastMessageBy?: 'user' | 'admin';
}

/**
 * Filters for feedback queries
 */
export interface FeedbackFilters {
  status?: 'new' | 'in_progress' | 'resolved';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  type?: 'bug' | 'feature' | 'complaint' | 'praise' | 'other';
}

/**
 * Feedback statistics
 */
export interface FeedbackStats {
  byStatus: {
    new: number;
    in_progress: number;
    resolved: number;
  };
  byType: {
    bug: number;
    feature: number;
    complaint: number;
    praise: number;
    other: number;
  };
  byPriority: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

/**
 * Subscribe to all user feedback with real-time updates
 * @param callback Function to call when feedback data changes
 * @param filters Optional filters for status, priority, or type
 * @returns Unsubscribe function
 */
export const subscribeToAllFeedback = (
  callback: (feedback: UserFeedback[]) => void,
  filters?: FeedbackFilters
): (() => void) => {
  try {
    const feedbackRef = collection(db, 'user_feedback');
    const constraints: QueryConstraint[] = [];

    // Apply filters
    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    }
    if (filters?.priority) {
      constraints.push(where('priority', '==', filters.priority));
    }
    if (filters?.type) {
      constraints.push(where('type', '==', filters.type));
    }

    // Always sort by createdAt descending (newest first)
    constraints.push(orderBy('createdAt', 'desc'));

    const q = query(feedbackRef, ...constraints);

    return onSnapshot(
      q,
      snapshot => {
        const feedbackList: UserFeedback[] = snapshot.docs.map(doc => {
          const data = doc.data();

          // Parse conversation array with timestamps
          const conversation: ConversationMessage[] = (data.conversation || []).map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (msg: any) => ({
              sender: msg.sender,
              senderName: msg.senderName,
              senderId: msg.senderId,
              message: msg.message,
              timestamp: msg.timestamp?.toDate() || new Date(),
            })
          );

          return {
            id: doc.id,
            userId: data.userId,
            userEmail: data.userEmail,
            userName: data.userName,
            type: data.type,
            title: data.title,
            description: data.description,
            status: data.status,
            priority: data.priority,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            resolvedAt: data.resolvedAt?.toDate(),
            adminNotes: data.adminNotes,
            adminResponse: data.adminResponse,
            respondedAt: data.respondedAt?.toDate(),
            respondedBy: data.respondedBy,
            // 💬 Conversation thread
            conversation,
            lastMessageAt: data.lastMessageAt?.toDate(),
            lastMessageBy: data.lastMessageBy,
          };
        });
        callback(feedbackList);
      },
      error => {
        console.error('[adminService] Error subscribing to feedback:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.error('[adminService] Error setting up feedback subscription:', error);
    return () => {};
  }
};

/**
 * Update feedback status and optionally add admin notes
 * @param feedbackId Feedback document ID
 * @param newStatus New status value
 * @param adminNotes Optional admin notes
 */
export const updateFeedbackStatus = async (
  feedbackId: string,
  newStatus: 'new' | 'in_progress' | 'resolved',
  adminNotes?: string
): Promise<void> => {
  try {
    const feedbackRef = doc(db, 'user_feedback', feedbackId);
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updatedAt: Timestamp.now(),
    };

    // Add resolvedAt timestamp if status is resolved
    if (newStatus === 'resolved') {
      updateData.resolvedAt = Timestamp.now();
    }

    // Add admin notes if provided
    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    await updateDoc(feedbackRef, updateData);
  } catch (error) {
    console.error('[adminService] Error updating feedback status:', error);
    throw error;
  }
};

/**
 * Add admin response to feedback (supports conversation threads)
 * @param feedbackId Feedback document ID
 * @param response Admin response text
 * @param adminId Admin user ID
 * @param adminName Optional admin name (defaults to 'Admin')
 */
export const addAdminResponse = async (
  feedbackId: string,
  response: string,
  adminId: string,
  adminName = 'Admin'
): Promise<void> => {
  try {
    const feedbackRef = doc(db, 'user_feedback', feedbackId);
    const now = Timestamp.now();

    // Create new conversation message
    const newMessage = {
      sender: 'admin' as const,
      senderName: adminName,
      senderId: adminId,
      message: response,
      timestamp: now,
    };

    const updateData: Record<string, unknown> = {
      // Legacy field for backward compatibility
      adminResponse: response,
      respondedAt: now,
      respondedBy: adminId,
      // 💬 New conversation fields
      conversation: arrayUnion(newMessage),
      lastMessageAt: now,
      lastMessageBy: 'admin',
      // Update status to in_progress (not resolved - waiting for user response)
      status: 'in_progress',
      updatedAt: now,
    };

    await updateDoc(feedbackRef, updateData);
    console.log('[adminService] Admin response added to conversation:', feedbackId);
  } catch (error) {
    console.error('[adminService] Error adding admin response:', error);
    throw error;
  }
};

/**
 * Get single feedback by ID
 * @param feedbackId Feedback document ID
 * @returns UserFeedback or null
 */
export const getFeedbackById = async (feedbackId: string): Promise<UserFeedback | null> => {
  try {
    const feedbackRef = doc(db, 'user_feedback', feedbackId);
    const docSnap = await getDoc(feedbackRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();

    // Parse conversation array with timestamps
    const conversation: ConversationMessage[] = (data.conversation || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (msg: any) => ({
        sender: msg.sender,
        senderName: msg.senderName,
        senderId: msg.senderId,
        message: msg.message,
        timestamp: msg.timestamp?.toDate() || new Date(),
      })
    );

    return {
      id: docSnap.id,
      userId: data.userId,
      userEmail: data.userEmail,
      userName: data.userName,
      type: data.type,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      resolvedAt: data.resolvedAt?.toDate(),
      adminNotes: data.adminNotes,
      adminResponse: data.adminResponse,
      respondedAt: data.respondedAt?.toDate(),
      respondedBy: data.respondedBy,
      conversation,
      lastMessageAt: data.lastMessageAt?.toDate(),
      lastMessageBy: data.lastMessageBy,
    };
  } catch (error) {
    console.error('[adminService] Error getting feedback by ID:', error);
    throw error;
  }
};

/**
 * Get feedback statistics grouped by status, type, and priority
 * @returns Feedback statistics object
 */
export const getFeedbackStats = async (): Promise<FeedbackStats> => {
  try {
    const feedbackRef = collection(db, 'user_feedback');
    const snapshot = await getDocs(feedbackRef);

    const stats: FeedbackStats = {
      byStatus: {
        new: 0,
        in_progress: 0,
        resolved: 0,
      },
      byType: {
        bug: 0,
        feature: 0,
        complaint: 0,
        praise: 0,
        other: 0,
      },
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      },
    };

    snapshot.docs.forEach(doc => {
      const data = doc.data();

      // Count by status
      if (data.status in stats.byStatus) {
        stats.byStatus[data.status as keyof typeof stats.byStatus]++;
      }

      // Count by type
      if (data.type in stats.byType) {
        stats.byType[data.type as keyof typeof stats.byType]++;
      }

      // Count by priority
      if (data.priority in stats.byPriority) {
        stats.byPriority[data.priority as keyof typeof stats.byPriority]++;
      }
    });

    return stats;
  } catch (error) {
    console.error('[adminService] Error getting feedback stats:', error);
    throw error;
  }
};

/**
 * Daily Statistics Interface
 */
export interface DailyStats {
  date: string;
  totalUsers: number;
  dau: number;
  wau: number;
  mau: number;
  calculatedAt: Date;
}

/**
 * Get latest daily stats
 * @returns Latest daily statistics or null if not available
 */
export const getLatestStats = async (): Promise<DailyStats | null> => {
  try {
    const statsRef = collection(db, 'daily_stats');
    const q = query(statsRef, orderBy('calculatedAt', 'desc'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('[adminService] No daily stats found');
      return null;
    }

    const latestDoc = snapshot.docs[0];
    const data = latestDoc.data();

    return {
      date: data.date,
      totalUsers: data.totalUsers,
      dau: data.dau,
      wau: data.wau,
      mau: data.mau,
      calculatedAt: data.calculatedAt?.toDate(),
    };
  } catch (error) {
    console.error('[adminService] Error getting latest stats:', error);
    throw error;
  }
};

/**
 * App-wide Statistics Interface (for _internal/appStats document)
 */
export interface AppStats {
  totalUsers: number;
  dau: number;
  wau: number;
  mau: number;
  lastCalculatedAt: Date;
}

/**
 * Subscribe to real-time app statistics
 * @param onUpdate Callback when stats are updated
 * @param onError Callback when error occurs
 * @returns Unsubscribe function
 */
export const listenForAppStats = (
  onUpdate: (stats: AppStats | null) => void,
  onError?: (error: Error) => void
): (() => void) => {
  try {
    const docRef = doc(db, '_internal', 'appStats');

    return onSnapshot(
      docRef,
      docSnapshot => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          onUpdate({
            totalUsers: data.totalUsers ?? 0,
            dau: data.dau ?? 0,
            wau: data.wau ?? 0,
            mau: data.mau ?? 0,
            lastCalculatedAt: data.lastCalculatedAt?.toDate() ?? new Date(),
          });
        } else {
          console.log('[adminService] appStats document does not exist');
          onUpdate(null);
        }
      },
      error => {
        console.error('[adminService] Error listening to app stats:', error);
        if (onError) {
          onError(error);
        }
      }
    );
  } catch (error) {
    console.error('[adminService] Error setting up app stats subscription:', error);
    return () => {};
  }
};

/**
 * Get stats history for chart
 * @param days Number of days to retrieve (default: 7)
 * @returns Array of daily statistics
 */
export const getStatsHistory = async (days = 7): Promise<DailyStats[]> => {
  try {
    const statsRef = collection(db, 'daily_stats');
    const q = query(statsRef, orderBy('calculatedAt', 'desc'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('[adminService] No stats history found');
      return [];
    }

    const history: DailyStats[] = snapshot.docs.slice(0, days).map(doc => {
      const data = doc.data();
      return {
        date: data.date,
        totalUsers: data.totalUsers,
        dau: data.dau,
        wau: data.wau,
        mau: data.mau,
        calculatedAt: data.calculatedAt?.toDate(),
      };
    });

    // Reverse to get chronological order (oldest to newest)
    return history.reverse();
  } catch (error) {
    console.error('[adminService] Error getting stats history:', error);
    throw error;
  }
};

/**
 * Admin User List Interface for detailed user management
 */
export interface AdminUserData {
  uid: string;
  displayName: string;
  email: string;
  createdAt: Date | null;
  eloRatings: {
    singles: number | null;
    doubles: number | null;
    mixed: number | null;
  };
  clubs: Array<{
    clubId: string;
    clubName: string;
    role: 'admin' | 'manager' | 'member';
  }>;
  eventsCreated: number;
}

/**
 * Get all users for admin user list with detailed information
 * Sorted by createdAt descending (newest first)
 * @returns Array of AdminUserData
 */
export const getAllUsersForAdmin = async (): Promise<AdminUserData[]> => {
  try {
    console.log('[adminService] Fetching all users for admin...');

    // 1. Fetch all users
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    // 2. Fetch events created count per user
    const eventsRef = collection(db, 'club_events');
    const eventsSnapshot = await getDocs(eventsRef);

    // Count events by hostId
    const eventsCountByUser: Record<string, number> = {};
    eventsSnapshot.docs.forEach(eventDoc => {
      const eventData = eventDoc.data();
      const hostId = eventData.hostId || eventData.createdBy;
      if (hostId) {
        eventsCountByUser[hostId] = (eventsCountByUser[hostId] || 0) + 1;
      }
    });

    // 3. Process users
    const users: AdminUserData[] = usersSnapshot.docs.map(userDoc => {
      const data = userDoc.data();
      const uid = userDoc.id;

      // Get display name (profile.nickname or displayName)
      const displayName = data.profile?.nickname || data.displayName || 'Unknown';

      // Get email
      const email = data.email || '';

      // Get createdAt
      let createdAt: Date | null = null;
      if (data.createdAt) {
        if (typeof data.createdAt.toDate === 'function') {
          createdAt = data.createdAt.toDate();
        } else if (typeof data.createdAt === 'string') {
          createdAt = new Date(data.createdAt);
        }
      }

      // Get ELO ratings
      const eloRatings = {
        singles: data.eloRatings?.singles?.current || null,
        doubles: data.eloRatings?.doubles?.current || null,
        mixed: data.eloRatings?.mixed?.current || null,
      };

      // Get club memberships
      const clubs: AdminUserData['clubs'] = [];
      if (data.clubMemberships) {
        Object.entries(data.clubMemberships).forEach(([clubId, membership]) => {
          const m = membership as { clubName?: string; role?: string; status?: string };
          if (m.status === 'active' || !m.status) {
            clubs.push({
              clubId,
              clubName: m.clubName || clubId,
              role: (m.role as 'admin' | 'manager' | 'member') || 'member',
            });
          }
        });
      }

      // Get events created count
      const eventsCreated = eventsCountByUser[uid] || 0;

      return {
        uid,
        displayName,
        email,
        createdAt,
        eloRatings,
        clubs,
        eventsCreated,
      };
    });

    // 4. Sort by createdAt descending (newest first)
    users.sort((a, b) => {
      if (!a.createdAt && !b.createdAt) return 0;
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    console.log(`[adminService] Fetched ${users.length} users for admin`);
    return users;
  } catch (error) {
    console.error('[adminService] Error fetching users for admin:', error);
    throw error;
  }
};
