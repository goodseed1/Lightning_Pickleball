import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  onSnapshot,
  collection,
  query,
  where,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import friendshipService from '../services/friendshipService';

// 🎯 [KIM FIX] All possible application statuses including solo lobby and team applications
type ApplicationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'declined'
  | 'cancelled'
  | 'cancelled_by_user'
  | 'cancelled_by_host'
  | 'looking_for_partner' // Solo lobby status
  | 'pending_partner_approval' // Team application waiting for partner
  | 'closed' // 🎯 [KIM FIX] Solo application closed when another team is approved
  | 'merged'; // 🎯 [KIM FIX] Merged into another application

interface Application {
  id: string;
  eventId: string;
  applicantId: string;
  status: ApplicationStatus;
  appliedAt: Date | string | { seconds: number; nanoseconds: number };
  updatedAt: Date | string | { seconds: number; nanoseconds: number };
  // 🎯 [KIM FIX] Partner status for team applications
  partnerStatus?: 'pending' | 'accepted' | 'rejected';
  // 🎯 [KIM FIX] Partner ID for team applications
  partnerId?: string;
  // 🎯 [SOLO LOBBY] Team proposal from another solo applicant
  pendingProposalFrom?: string;
}

// 🦾 IRON MAN: Team Invitation Notification Interface
interface TeamInviteNotification {
  id: string;
  recipientId: string;
  type: 'CLUB_TEAM_INVITE';
  clubId: string;
  tournamentId: string;
  message: string;
  relatedTeamId?: string;
  inviterName?: string;
  tournamentName?: string;
  status: 'unread' | 'read';
  createdAt: unknown;
  metadata?: {
    notificationType?: string;
    actionRequired?: boolean;
    deepLink?: string;
  };
}

interface ActivityContextType {
  myApplications: Application[];
  isLoadingApplications: boolean;
  getMyApplicationStatus: (eventId: string) => 'not_applied' | ApplicationStatus;
  // 🎯 [KIM FIX] Get partner status for team applications
  getMyPartnerStatus: (eventId: string) => 'pending' | 'accepted' | 'rejected' | undefined;
  // 🦾 IRON MAN: Unread team invitations
  unreadTeamInvites: TeamInviteNotification[];
  isLoadingInvites: boolean;
  // 🎯 [KIM FIX] Badge counts for profile tab
  pendingHostedApplicationsCount: number; // 호스트한 모임의 승인 대기 신청자 수
  pendingPartnerInvitationsCount: number; // 파트너 초대 응답 대기 수
  pendingFriendInvitationsCount: number; // 🎯 [FRIEND INVITE] 이벤트 친구 초대 대기 수
  pendingFriendRequestsCount: number; // 🤝 [FRIENDSHIP] 친구 관계 요청 대기 수
  pendingTeamProposalsCount: number; // 🎯 [SOLO LOBBY] 솔로 로비에서 받은 팀 제안 수
  profileBadgeCount: number; // 합계
}

const ActivityContext = createContext<ActivityContextType>({
  myApplications: [],
  isLoadingApplications: true,
  getMyApplicationStatus: () => 'not_applied' as 'not_applied' | ApplicationStatus,
  getMyPartnerStatus: () => undefined,
  unreadTeamInvites: [],
  isLoadingInvites: true,
  // 🎯 [KIM FIX] Badge counts defaults
  pendingHostedApplicationsCount: 0,
  pendingPartnerInvitationsCount: 0,
  pendingFriendInvitationsCount: 0,
  pendingFriendRequestsCount: 0,
  pendingTeamProposalsCount: 0,
  profileBadgeCount: 0,
});

interface ActivityProviderProps {
  children: ReactNode;
}

export const ActivityProvider: React.FC<ActivityProviderProps> = ({ children }) => {
  const { currentUser: user } = useAuth();
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(true);

  // 🦾 IRON MAN: Unread Team Invitations State
  const [unreadTeamInvites, setUnreadTeamInvites] = useState<TeamInviteNotification[]>([]);
  const [isLoadingInvites, setIsLoadingInvites] = useState(true);

  // 🎯 [KIM FIX] Badge counts for profile tab
  const [pendingHostedApplicationsCount, setPendingHostedApplicationsCount] = useState(0);
  // 🎯 [FRIEND INVITE] Pending friend invitations count (event invitations)
  const [pendingFriendInvitationsCount, setPendingFriendInvitationsCount] = useState(0);
  // 🤝 [FRIENDSHIP] Pending friend requests count (friendship requests)
  const [pendingFriendRequestsCount, setPendingFriendRequestsCount] = useState(0);
  // 🎯 [KIM FIX] Pending partner invitations count from partner_invitations collection
  const [realPartnerInvitationsCount, setRealPartnerInvitationsCount] = useState(0);

  useEffect(() => {
    if (user?.uid) {
      console.log(
        '🔄 ActivityContext: Setting up real-time subscription for user applications:',
        user.uid
      );

      // 🎯 [OPERATION DUO - FIX] Use two separate queries instead of OR
      // OR query doesn't work reliably in React Native
      const applicantQuery = query(
        collection(db, 'participation_applications'),
        where('applicantId', '==', user.uid)
      );

      const partnerQuery = query(
        collection(db, 'participation_applications'),
        where('partnerId', '==', user.uid)
      );

      // Store all applications with deduplication
      const allApplicationsMap = new Map<string, Application>();

      const handleSnapshot = (source: string) => (snapshot: QuerySnapshot<DocumentData>) => {
        console.log(`📥 [${source}] Received ${snapshot.docs.length} applications`);

        snapshot.docs.forEach(doc => {
          allApplicationsMap.set(doc.id, {
            id: doc.id,
            ...doc.data(),
          } as Application);
        });

        const applications = Array.from(allApplicationsMap.values());
        console.log('📝 ActivityContext: Total loaded', applications.length, 'applications');
        console.log('🔍 [DEBUG] User UID:', user.uid);
        console.log('🔍 [DEBUG] Applications data:', JSON.stringify(applications, null, 2));
        setMyApplications(applications);
        setIsLoadingApplications(false);
      };

      const handleError = (error: Error) => {
        console.error('❌ ActivityContext: Error loading applications:', error);
        setIsLoadingApplications(false);
      };

      // Subscribe to both queries
      const unsubscribeApplicant = onSnapshot(
        applicantQuery,
        handleSnapshot('APPLICANT'),
        handleError
      );

      const unsubscribePartner = onSnapshot(partnerQuery, handleSnapshot('PARTNER'), handleError);

      return () => {
        unsubscribeApplicant();
        unsubscribePartner();
      };
    } else {
      setMyApplications([]);
      setIsLoadingApplications(false);
    }
  }, [user?.uid]);

  // 🦾 IRON MAN: Subscribe to unread team invitations
  useEffect(() => {
    if (user?.uid) {
      console.log(
        '🦾 [IRON MAN] ActivityContext: Setting up real-time subscription for team invitations:',
        user.uid
      );

      const q = query(
        collection(db, 'notifications'),
        where('recipientId', '==', user.uid),
        where('type', '==', 'CLUB_TEAM_INVITE'),
        where('status', '==', 'unread')
      );

      const unsubscribe = onSnapshot(
        q,
        snapshot => {
          const invites = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as TeamInviteNotification[];

          console.log(
            '🦾 [IRON MAN] ActivityContext: Loaded',
            invites.length,
            'unread team invites'
          );
          setUnreadTeamInvites(invites);
          setIsLoadingInvites(false);
        },
        error => {
          console.error('❌ [IRON MAN] ActivityContext: Error loading team invites:', error);
          setIsLoadingInvites(false);
        }
      );

      return () => unsubscribe();
    } else {
      setUnreadTeamInvites([]);
      setIsLoadingInvites(false);
    }
  }, [user?.uid]);

  // 🎯 [KIM FIX] Subscribe to pending applications where I am the host
  useEffect(() => {
    if (user?.uid) {
      console.log(
        '🎯 [KIM FIX] ActivityContext: Setting up subscription for hosted pending applications:',
        user.uid
      );

      const hostedPendingQuery = query(
        collection(db, 'participation_applications'),
        where('hostId', '==', user.uid),
        where('status', '==', 'pending')
      );

      const unsubscribe = onSnapshot(
        hostedPendingQuery,
        snapshot => {
          const count = snapshot.docs.length;
          console.log('🎯 [KIM FIX] ActivityContext: Hosted pending applications count:', count);
          setPendingHostedApplicationsCount(count);
        },
        error => {
          console.error(
            '❌ [KIM FIX] ActivityContext: Error loading hosted pending applications:',
            error
          );
        }
      );

      return () => unsubscribe();
    } else {
      setPendingHostedApplicationsCount(0);
    }
  }, [user?.uid]);

  // 🎯 [FRIEND INVITE] Subscribe to pending friend invitations count
  // Friend invitations are stored in events.friendInvitations array
  useEffect(() => {
    if (user?.uid) {
      console.log(
        '🎯 [FRIEND INVITE] ActivityContext: Setting up subscription for friend invitations:',
        user.uid
      );

      // Query events where isInviteOnly is true (friend invitations are only on invite-only events)
      // 🎯 [KIM FIX] Use 'events' collection to match ActivityService (not 'lightning_events')
      const friendInvitationsQuery = query(
        collection(db, 'events'),
        where('isInviteOnly', '==', true)
      );

      const unsubscribe = onSnapshot(
        friendInvitationsQuery,
        snapshot => {
          let pendingCount = 0;

          snapshot.docs.forEach(doc => {
            const eventData = doc.data();
            // Skip completed or cancelled events
            const eventStatus = eventData.status as string;
            if (eventStatus === 'completed' || eventStatus === 'cancelled') {
              return;
            }

            const friendInvitations = eventData.friendInvitations as
              | Array<{ userId: string; status: string }>
              | undefined;

            if (friendInvitations) {
              // Find pending invitation for this user
              const userInvitation = friendInvitations.find(
                inv => inv.userId === user.uid && inv.status === 'pending'
              );
              if (userInvitation) {
                pendingCount++;
              }
            }
          });

          console.log(
            '🎯 [FRIEND INVITE] ActivityContext: Pending friend invitations count:',
            pendingCount
          );
          setPendingFriendInvitationsCount(pendingCount);
        },
        error => {
          console.error(
            '❌ [FRIEND INVITE] ActivityContext: Error loading friend invitations:',
            error
          );
        }
      );

      return () => unsubscribe();
    } else {
      setPendingFriendInvitationsCount(0);
    }
  }, [user?.uid]);

  // 🤝 [FRIENDSHIP] Subscribe to pending friend requests for badge count
  useEffect(() => {
    if (user?.uid) {
      console.log('🤝 [FRIENDSHIP] ActivityContext: Setting up friend requests listener');

      const unsubscribe = friendshipService.subscribeToFriendRequests(user.uid, requests => {
        console.log(
          '🤝 [FRIENDSHIP] ActivityContext: Pending friend requests count:',
          requests.length
        );
        setPendingFriendRequestsCount(requests.length);
      });

      return () => {
        console.log('🤝 [FRIENDSHIP] ActivityContext: Cleaning up friend requests subscription');
        unsubscribe();
      };
    } else {
      setPendingFriendRequestsCount(0);
    }
  }, [user?.uid]);

  // 🎯 [KIM FIX] Subscribe to partner_invitations collection for real-time badge count
  useEffect(() => {
    if (user?.uid) {
      console.log(
        '🎯 [KIM FIX] ActivityContext: Setting up partner_invitations listener:',
        user.uid
      );

      const partnerInvitationsQuery = query(
        collection(db, 'partner_invitations'),
        where('invitedUserId', '==', user.uid),
        where('status', '==', 'pending')
      );

      const unsubscribe = onSnapshot(
        partnerInvitationsQuery,
        snapshot => {
          // Filter out expired invitations
          const now = new Date();
          const pendingCount = snapshot.docs.filter(doc => {
            const data = doc.data();
            const expiresAt = data.expiresAt?.toDate
              ? data.expiresAt.toDate()
              : new Date(data.expiresAt);
            return expiresAt >= now;
          }).length;

          console.log(
            '🎯 [KIM FIX] ActivityContext: Real partner invitations count (from partner_invitations):',
            pendingCount
          );
          setRealPartnerInvitationsCount(pendingCount);
        },
        error => {
          console.error('❌ [KIM FIX] ActivityContext: Error loading partner_invitations:', error);
        }
      );

      return () => unsubscribe();
    } else {
      setRealPartnerInvitationsCount(0);
    }
  }, [user?.uid]);

  const getMyApplicationStatus = (eventId: string): 'not_applied' | ApplicationStatus => {
    // 🎯 [KIM FIX v2] Consider both:
    // 1. Applications where user is the APPLICANT (직접 신청한 경우)
    // 2. Applications where user is the PARTNER (팀원으로 초대받은 경우)
    // This ensures partners also see the correct rejected/approved status
    const myDirectApplications = myApplications.filter(
      app => app.eventId === eventId && app.applicantId === user?.uid
    );

    // 🎯 [KIM FIX v2] Also check applications where I am the partner
    const myPartnerApplications = myApplications.filter(
      app => app.eventId === eventId && app.partnerId === user?.uid
    );

    console.log(
      `🔍 [getMyApplicationStatus] EventId: ${eventId}, Found ${myDirectApplications.length} direct + ${myPartnerApplications.length} partner applications`
    );

    // 🎯 [KIM FIX v4] Priority order:
    // 1. ACTIVE direct applications (looking_for_partner, pending, approved) - HIGHEST
    // 2. ACTIVE partner applications (pending_partner_approval, approved)
    // 3. INACTIVE applications (rejected, cancelled, merged) - can re-apply

    // Step 1: Check for ACTIVE direct applications first
    if (myDirectApplications.length > 0) {
      // Find active direct applications (non-terminal states)
      const activeDirectApp = myDirectApplications.find(
        app =>
          app.status === 'looking_for_partner' ||
          app.status === 'pending' ||
          app.status === 'pending_partner_approval' ||
          app.status === 'approved'
      );

      if (activeDirectApp) {
        console.log(
          `🔍 [getMyApplicationStatus] Found ACTIVE direct application: ${activeDirectApp.status}`,
          activeDirectApp
        );
        return activeDirectApp.status;
      }
    }

    // Step 2: Check for ACTIVE partner applications
    if (myPartnerApplications.length > 0) {
      // Check if any partner application is approved
      const approvedPartnerApp = myPartnerApplications.find(app => app.status === 'approved');
      if (approvedPartnerApp) {
        console.log(
          `🔍 [getMyApplicationStatus] Found approved partner application`,
          approvedPartnerApp
        );
        return 'approved';
      }

      // Check if any partner application is pending
      const pendingPartnerApp = myPartnerApplications.find(
        app => app.status === 'pending' || app.status === 'pending_partner_approval'
      );
      if (pendingPartnerApp) {
        console.log(
          `🔍 [getMyApplicationStatus] Found pending partner application`,
          pendingPartnerApp
        );
        return 'pending';
      }
    }

    // Step 3: All applications are inactive (rejected/cancelled/merged) - user can re-apply
    // Check if there are ANY applications (direct or partner) that are terminated
    const hasTerminatedDirectApp = myDirectApplications.some(
      app =>
        app.status === 'rejected' ||
        app.status === 'declined' ||
        app.status === 'cancelled' ||
        app.status === 'cancelled_by_host' ||
        app.status === 'cancelled_by_user' ||
        app.status === 'merged'
    );

    const hasTerminatedPartnerApp = myPartnerApplications.some(
      app =>
        app.status === 'rejected' ||
        app.status === 'declined' ||
        app.status === 'cancelled' ||
        app.status === 'cancelled_by_host' ||
        app.status === 'cancelled_by_user'
    );

    if (hasTerminatedDirectApp || hasTerminatedPartnerApp) {
      console.log(
        `🔍 [getMyApplicationStatus] All applications are terminated, returning 'rejected' so user can re-apply`
      );
      return 'rejected';
    }

    if (myDirectApplications.length === 0 && myPartnerApplications.length === 0) {
      return 'not_applied';
    }

    // Return the most recent application (sort by appliedAt descending)
    // 🎯 [KIM FIX v29] Combine direct and partner applications for sorting
    const allMyApplications = [...myDirectApplications, ...myPartnerApplications];

    // 🎯 [KIM FIX v29] Safety check - if no applications, return not_applied
    if (allMyApplications.length === 0) {
      return 'not_applied';
    }

    const sortedApplications = allMyApplications.sort((a, b) => {
      // Helper function to safely get timestamp
      const getTimestamp = (appliedAt: Application['appliedAt']): number => {
        if (!appliedAt) return 0; // Handle undefined/null

        if (typeof appliedAt === 'object' && 'seconds' in appliedAt) {
          return appliedAt.seconds;
        }

        if (typeof appliedAt === 'string') {
          return new Date(appliedAt).getTime() / 1000;
        }

        if (appliedAt instanceof Date) {
          return appliedAt.getTime() / 1000;
        }

        return 0; // Fallback
      };

      const aTime = getTimestamp(a.appliedAt);
      const bTime = getTimestamp(b.appliedAt);

      return bTime - aTime; // Descending order (most recent first)
    });

    // 🎯 [KIM FIX v29] Safety check for undefined
    const mostRecentApplication = sortedApplications[0];
    if (!mostRecentApplication) {
      return 'not_applied';
    }
    const mostRecentStatus = mostRecentApplication.status;
    console.log(
      `🔍 [getMyApplicationStatus] Most recent application status: ${mostRecentStatus}`,
      sortedApplications[0]
    );

    return mostRecentStatus;
  };

  // 🎯 [KIM FIX] Get partner status for team applications
  const getMyPartnerStatus = (eventId: string): 'pending' | 'accepted' | 'rejected' | undefined => {
    const eventApplications = myApplications.filter(app => app.eventId === eventId);

    if (eventApplications.length === 0) {
      return undefined;
    }

    // Get the most recent application's partner status
    const sortedApplications = eventApplications.sort((a, b) => {
      const getTimestamp = (appliedAt: Application['appliedAt']): number => {
        if (!appliedAt) return 0;
        if (typeof appliedAt === 'object' && 'seconds' in appliedAt) {
          return appliedAt.seconds;
        }
        if (typeof appliedAt === 'string') {
          return new Date(appliedAt).getTime() / 1000;
        }
        if (appliedAt instanceof Date) {
          return appliedAt.getTime() / 1000;
        }
        return 0;
      };
      return getTimestamp(b.appliedAt) - getTimestamp(a.appliedAt);
    });

    const partnerStatus = sortedApplications[0].partnerStatus;
    console.log(`🔍 [getMyPartnerStatus] EventId: ${eventId}, Partner status: ${partnerStatus}`);

    return partnerStatus;
  };

  // 🎯 [KIM FIX] Calculate pending partner invitations count
  // These are applications where I am the partner and partnerStatus is 'pending'
  const pendingPartnerInvitationsCount = myApplications.filter(
    app => app.partnerStatus === 'pending'
  ).length;

  // 🎯 [SOLO LOBBY] Calculate pending team proposals count
  // These are solo applications where I received a team proposal from another solo applicant
  const pendingTeamProposalsCount = myApplications.filter(
    app => app.status === 'looking_for_partner' && !!app.pendingProposalFrom
  ).length;

  // 🎯 [KIM FIX] Total profile badge count (sum of all pending items)
  // Includes: hosted pending + partner invitations (from both sources) + friend invitations + friend requests + team proposals
  // 🔥 realPartnerInvitationsCount: from partner_invitations collection (real-time updates)
  // 🔥 pendingPartnerInvitationsCount: from participation_applications where partnerStatus='pending'
  const profileBadgeCount =
    pendingHostedApplicationsCount +
    realPartnerInvitationsCount + // 🎯 [KIM FIX] Use real-time partner_invitations count
    pendingFriendInvitationsCount +
    pendingFriendRequestsCount + // 🤝 [FRIENDSHIP] 친구 관계 요청
    pendingTeamProposalsCount;

  const value: ActivityContextType = {
    myApplications,
    isLoadingApplications,
    getMyApplicationStatus,
    getMyPartnerStatus,
    // 🦾 IRON MAN: Unread team invitations
    unreadTeamInvites,
    isLoadingInvites,
    // 🎯 [KIM FIX] Badge counts for profile tab
    pendingHostedApplicationsCount,
    pendingPartnerInvitationsCount,
    pendingFriendInvitationsCount,
    pendingFriendRequestsCount, // 🤝 [FRIENDSHIP] 친구 관계 요청
    pendingTeamProposalsCount,
    profileBadgeCount,
  };

  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useActivities = () => {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivities must be used within an ActivityProvider');
  }
  return context;
};
