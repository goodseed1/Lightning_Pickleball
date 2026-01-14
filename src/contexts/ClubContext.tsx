/**
 * Club Context for Lightning Pickleball
 * Provides club management state and methods throughout the app
 */

/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import clubService from '../services/clubService';
import meetupService from '../services/meetupService';
import userService from '../services/userService';
import { useAuth } from './AuthContext';

// Firebase Timestamp helper type
type FirebaseTimestamp = Timestamp | Date | { seconds: number; nanoseconds: number };

// Types (simplified for JavaScript compatibility)
interface Club {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  location: {
    address: string;
    region: string;
  };
  stats: {
    totalMembers: number;
    activeMembers: number;
    totalEvents: number;
    monthlyEvents: number;
  };
  userRole?: string;
  joinedAt?: FirebaseTimestamp;
}

interface ClubMember {
  id: string;
  clubId: string;
  userId: string;
  role: 'admin' | 'manager' | 'member';
  status: string;
  memberInfo: {
    displayName: string;
    nickname: string;
    photoURL?: string;
  };
}

interface ClubEvent {
  id: string;
  clubId: string;
  title: string;
  description: string;
  type: string;
  schedule: {
    startTime: FirebaseTimestamp;
    endTime: FirebaseTimestamp;
  };
  participants: {
    currentCount: number;
    maxParticipants?: number;
  };
}

interface Meetup {
  id: string;
  clubId: string;
  title: string;
  description: string;
  type: string;
  date: FirebaseTimestamp;
  schedule: {
    startTime: FirebaseTimestamp;
    endTime: FirebaseTimestamp;
    duration: number;
  };
  location: {
    name: string;
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    placeId?: string;
  };
  courtDetails: {
    availableCourts: number;
    courtNumbers?: string;
  };
  participants: {
    currentCount: number;
    maxParticipants: number;
  };
  createdBy: string;
  createdAt: FirebaseTimestamp;
  status: string;
}

interface League {
  id: string;
  clubId: string;
  name: string;
  description: string;
  status: 'upcoming' | 'active' | 'completed';
  settings: Record<string, string | number | boolean>;
  participants: string[];
  createdAt: FirebaseTimestamp;
  startDate: FirebaseTimestamp;
  endDate: FirebaseTimestamp;
}

interface ClubAnnouncement {
  title: string;
  content: string;
  isImportant: boolean;
  createdAt?: FirebaseTimestamp;
  updatedAt?: FirebaseTimestamp;
  authorId?: string;
  authorName?: string;
}

interface ClubContextType {
  // State
  userClubs: Club[];
  userMemberships: ClubMember[]; // Raw membership documents
  currentClub: Club | null;
  currentClubId: string | null;
  clubMembers: ClubMember[];
  clubEvents: ClubEvent[];
  meetups: Meetup[];
  leagues: League[];
  announcement: ClubAnnouncement | null;
  loading: boolean;
  isLoadingMeetups: boolean;
  isLoadingMembers: boolean;
  isLoadingLeagues: boolean;
  isLoadingAnnouncement: boolean;
  error: string | null;
  // 🎯 [KIM FIX] Pending join requests count for MyClubs tab badge
  pendingJoinRequestsCount: number;

  // Club Management
  createClub: (clubData: Record<string, string | number | boolean>) => Promise<string>;
  selectClub: (clubId: string) => Promise<void>;
  updateClub: (
    clubId: string,
    updateData: Record<string, string | number | boolean>
  ) => Promise<void>;
  searchClubs: (filters?: Record<string, string | number | boolean>) => Promise<Club[]>;

  // Member Management
  inviteMember: (
    clubId: string,
    inviteData: Record<string, string | number | boolean>
  ) => Promise<string>;
  joinClub: (clubId: string, invitationId?: string) => Promise<void>;
  leaveClub: (clubId: string) => Promise<void>;
  loadClubMembers: (clubId: string) => Promise<void>;

  // Event Management
  createEvent: (
    clubId: string,
    eventData: Record<string, string | number | boolean>
  ) => Promise<string>;
  joinEvent: (eventId: string) => Promise<void>;
  loadClubEvents: (clubId: string) => Promise<void>;

  // Chat Management
  sendMessage: (
    clubId: string,
    messageData: Record<string, string | number | boolean>
  ) => Promise<string>;
  loadClubMessages: (clubId: string) => Promise<Record<string, string | number | boolean>[]>;

  // Utility
  refreshUserClubs: () => Promise<void>;
  checkMembership: (clubId: string) => Promise<boolean>;
  checkPermission: (clubId: string, role: string) => Promise<boolean>;
  setCurrentClubId: (clubId: string | null) => void;
}

const ClubContext = createContext<ClubContextType | undefined>(undefined);

export const useClub = () => {
  const context = useContext(ClubContext);
  if (!context) {
    throw new Error('useClub must be used within a ClubProvider');
  }
  return context;
};

interface ClubProviderProps {
  children: React.ReactNode;
}

export const ClubProvider: React.FC<ClubProviderProps> = ({ children }) => {
  // State
  const [userClubs, setUserClubs] = useState<Club[]>([]);
  const [userMemberships, setUserMemberships] = useState<ClubMember[]>([]);
  const [currentClub, setCurrentClub] = useState<Club | null>(null);
  const [currentClubId, setCurrentClubId] = useState<string | null>(null);
  const [clubMembers, setClubMembers] = useState<ClubMember[]>([]);
  const [clubEvents, setClubEvents] = useState<ClubEvent[]>([]);
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [announcement, setAnnouncement] = useState<ClubAnnouncement | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoadingMeetups, setIsLoadingMeetups] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isLoadingLeagues, setIsLoadingLeagues] = useState(false);
  const [isLoadingAnnouncement, setIsLoadingAnnouncement] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 🎯 [KIM FIX] Pending join requests count for MyClubs tab badge
  const [pendingJoinRequestsCount, setPendingJoinRequestsCount] = useState(0);

  const { currentUser } = useAuth();

  // 🎯 REAL-TIME MEMBERSHIP LISTENER
  // Initialize user clubs when user is authenticated with onSnapshot listener
  useEffect(() => {
    if (!currentUser?.uid) {
      // Clear data when user logs out
      setUserClubs([]);
      setUserMemberships([]);
      setCurrentClub(null);
      setCurrentClubId(null);
      setClubMembers([]);
      setClubEvents([]);
      setMeetups([]);
      setLeagues([]);
      return;
    }

    setLoading(true);

    // Create query for user's club memberships (active only)
    const membershipQuery = query(
      collection(db, 'clubMembers'),
      where('userId', '==', currentUser.uid),
      where('status', '==', 'active') // Only active memberships
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      membershipQuery,
      async snapshot => {
        try {
          // Extract membership data
          const memberships = snapshot.docs.map(doc => ({
            id: doc.id,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(doc.data() as any),
          }));

          setUserMemberships(memberships as ClubMember[]);

          // Hydrate with club details
          if (memberships.length > 0) {
            const clubsWithDetails = await Promise.all(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              memberships.map(async (membership: any) => {
                try {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const clubDetails = (await clubService.getClub(membership.clubId)) as any;
                  return {
                    ...clubDetails,
                    userRole: membership.role,
                    joinedAt: membership.joinedAt,
                    membershipStatus: membership.status,
                  };
                } catch {
                  // 🎯 [KIM FIX] Downgrade to warning - deleted clubs are expected
                  console.warn('⚠️ Club not found (may be deleted):', membership.clubId);
                  return null;
                }
              })
            );

            // Filter out failed club loads
            const validClubs = clubsWithDetails.filter(club => club !== null);
            setUserClubs(validClubs as Club[]);
          } else {
            setUserClubs([]);
          }
        } catch (error: unknown) {
          console.error('Error processing membership data:', error);
          const message = error instanceof Error ? error.message : 'Unknown error';
          setError(message);
        } finally {
          setLoading(false);
        }
      },
      (error: unknown) => {
        console.error('Real-time membership listener error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        setError(message);
        setLoading(false);
      }
    );

    // Cleanup function
    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid]);

  // Subscribe to meetup changes when currentClubId changes
  useEffect(() => {
    if (!currentClubId || !currentUser) {
      setMeetups([]);
      setIsLoadingMeetups(false);
      return;
    }

    setIsLoadingMeetups(true);

    try {
      // 🔍 DEBUG: Log when setting up meetup listener
      console.log('🔍 [ClubContext] Setting up meetup listener for clubId:', currentClubId);

      const unsubscribe = meetupService.getClubMeetupsRealtime(
        currentClubId,
        'all', // Get all meetups, we'll filter in React
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (meetupsData: any) => {
          // 🔍 DEBUG: Log received meetups data
          console.log('🔍 [ClubContext] Received meetups from listener:', {
            count: meetupsData?.length || 0,
            clubId: currentClubId,
            firstMeetup: meetupsData?.[0],
          });
          setMeetups(meetupsData);
          setIsLoadingMeetups(false);
        }
      );

      return () => {
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    } catch (error: unknown) {
      console.error('Failed to setup meetup listener:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setError(message);
      setIsLoadingMeetups(false);
    }
  }, [currentClubId, currentUser]);

  // Subscribe to club members changes when currentClubId changes
  useEffect(() => {
    if (!currentClubId || !currentUser) {
      setClubMembers([]);
      setIsLoadingMembers(false);
      return;
    }

    setIsLoadingMembers(true);

    try {
      // Create real-time listener for club members using onSnapshot
      const membersRef = collection(db, 'clubMembers');
      const membersQuery = query(
        membersRef,
        where('clubId', '==', currentClubId),
        where('status', '==', 'active')
      );

      const unsubscribe = onSnapshot(
        membersQuery,
        async snapshot => {
          const memberships = snapshot.docs.map(doc => ({
            id: doc.id,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(doc.data() as any),
          }));

          // Transform membership documents into ClubMember format
          const members = await Promise.all(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            memberships.map(async (membership: any) => {
              try {
                // Get user profile for each member
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const userProfile = (await userService.getUserProfile(membership.userId)) as any;
                return {
                  id: membership.id,
                  userId: membership.userId,
                  userName: userProfile?.displayName || userProfile?.name || 'Unknown',
                  profileImage: userProfile?.photoURL,
                  skillLevel: userProfile?.skillLevel,
                  role: membership.role || 'member',
                  status: membership.status,
                  joinedAt: membership.joinedAt || membership.createdAt,
                  lastActive: userProfile?.lastActive,
                  eventsAttended: 0, // TODO: Calculate from events data
                };
              } catch {
                // This is expected for deleted users - use warn instead of error
                console.warn(
                  `⚠️ Member profile not found (user may have been deleted): ${membership.userId}`
                );
                return {
                  id: membership.id,
                  userId: membership.userId,
                  userName: '(Deleted User)',
                  role: membership.role || 'member',
                  status: membership.status,
                  joinedAt: membership.joinedAt || membership.createdAt,
                  eventsAttended: 0,
                };
              }
            })
          );

          setClubMembers(members as unknown as ClubMember[]);
          setIsLoadingMembers(false);
        },
        (error: unknown) => {
          console.error('Club members listener error:', error);
          const message = error instanceof Error ? error.message : 'Unknown error';
          setError(message);
          setIsLoadingMembers(false);
        }
      );

      return () => {
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    } catch (error: unknown) {
      console.error('Failed to setup club members listener:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setError(message);
      setIsLoadingMembers(false);
    }
  }, [currentClubId, currentUser]);

  // Subscribe to league changes when currentClubId changes
  useEffect(() => {
    if (!currentClubId || !currentUser) {
      setLeagues([]);
      setIsLoadingLeagues(false);
      return;
    }

    setIsLoadingLeagues(true);

    try {
      // Create real-time listener for club leagues using onSnapshot
      const leaguesRef = collection(db, 'leagues');
      const leaguesQuery = query(
        leaguesRef,
        where('clubId', '==', currentClubId),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        leaguesQuery,
        snapshot => {
          const leaguesData = snapshot.docs.map(doc => ({
            id: doc.id,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(doc.data() as any),
          }));

          setLeagues(leaguesData as League[]);
          setIsLoadingLeagues(false);
        },
        (error: unknown) => {
          console.error('Club leagues listener error:', error);
          const message = error instanceof Error ? error.message : 'Unknown error';
          setError(message);
          setIsLoadingLeagues(false);
        }
      );

      return () => {
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    } catch (error: unknown) {
      console.error('Failed to setup club leagues listener:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setError(message);
      setIsLoadingLeagues(false);
    }
  }, [currentClubId, currentUser]);

  // Subscribe to announcement changes when currentClubId changes
  useEffect(() => {
    if (!currentClubId) {
      setAnnouncement(null);
      setIsLoadingAnnouncement(false);
      return;
    }

    setIsLoadingAnnouncement(true);

    try {
      const unsubscribe = clubService.getClubAnnouncementStream(
        currentClubId,
        (announcementData: ClubAnnouncement | null) => {
          setAnnouncement(announcementData);
          setIsLoadingAnnouncement(false);
        }
      );

      return () => {
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    } catch (error: unknown) {
      console.error('Failed to setup club announcement listener:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setError(message);
      setIsLoadingAnnouncement(false);
    }
  }, [currentClubId]);

  // 🎯 [KIM FIX] Subscribe to pending join requests for clubs where user is admin/manager
  useEffect(() => {
    // Get club IDs where user is admin or manager
    const adminClubIds = userMemberships
      .filter(m => m.role === 'admin' || m.role === 'manager')
      .map(m => m.clubId);

    if (!currentUser?.uid || adminClubIds.length === 0) {
      setPendingJoinRequestsCount(0);
      return;
    }

    console.log('🎯 [KIM FIX] Subscribing to pending join requests for admin clubs:', adminClubIds);

    // Firestore 'in' query supports max 30 items, so we need to handle this
    // For most users, they won't be admin of more than 30 clubs
    const clubIdsToQuery = adminClubIds.slice(0, 30);

    // 🔧 FIX: Use camelCase collection name to match Cloud Functions
    const joinRequestsQuery = query(
      collection(db, 'clubJoinRequests'),
      where('clubId', 'in', clubIdsToQuery),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(
      joinRequestsQuery,
      snapshot => {
        const count = snapshot.docs.length;
        console.log('🎯 [KIM FIX] Pending join requests count:', count);
        setPendingJoinRequestsCount(count);
      },
      error => {
        console.error('❌ [KIM FIX] Error subscribing to join requests:', error);
        setPendingJoinRequestsCount(0);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid, userMemberships]);

  // ============ CLUB MANAGEMENT ============

  /**
   * Create a new club
   */
  const createClub = async (
    clubData: Record<string, string | number | boolean>
  ): Promise<string> => {
    try {
      setLoading(true);
      setError(null);

      const clubId = await clubService.createClub(clubData);

      // Real-time listener will automatically update userClubs when membership is created
      return clubId;
    } catch (error: unknown) {
      console.error('❌ Failed to create club:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Select and load a specific club
   */
  const selectClub = async (clubId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const club = (await clubService.getClub(clubId)) as any;
      setCurrentClub(club as Club);
      setCurrentClubId(clubId);

      // Load club members and events
      await Promise.all([loadClubMembers(clubId), loadClubEvents(clubId)]);
    } catch (error: unknown) {
      console.error('❌ Failed to select club:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update club information
   */
  const updateClub = async (
    clubId: string,
    updateData: Record<string, string | number | boolean>
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await clubService.updateClub(clubId, updateData);

      // Refresh current club if it's the one being updated
      if (currentClub?.id === clubId) {
        await selectClub(clubId);
      }

      // Real-time listener will automatically update userClubs if membership data changes
    } catch (error: unknown) {
      console.error('❌ Failed to update club:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Search clubs with filters
   */
  const searchClubs = async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _filters: Record<string, string | number | boolean> = {}
  ): Promise<Club[]> => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Implement searchClubs in clubService
      // For now, return empty array
      console.warn('searchClubs not implemented yet, returning empty array');
      // const clubs = await clubService.getAllClubs();
      const clubs: Club[] = [];

      return clubs;
    } catch (error: unknown) {
      console.error('❌ Failed to search clubs:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ============ MEMBER MANAGEMENT ============

  /**
   * Invite a member to the club
   */
  const inviteMember = async (
    clubId: string,
    inviteData: Record<string, string | number | boolean>
  ): Promise<string> => {
    try {
      setLoading(true);
      setError(null);

      const invitationId = await clubService.inviteMember(clubId, inviteData);

      return invitationId;
    } catch (error: unknown) {
      console.error('❌ Failed to invite member:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Join a club
   */
  const joinClub = async (clubId: string, invitationId?: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await clubService.joinClub(clubId, invitationId);

      // Real-time listener will automatically update userClubs when membership is approved/created
    } catch (error: unknown) {
      console.error('❌ Failed to join club:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Leave a club
   */
  const leaveClub = async (clubId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await clubService.leaveClub(clubId);

      // Clear current club if leaving it
      if (currentClub?.id === clubId) {
        setCurrentClub(null);
        setCurrentClubId(null);
        setClubMembers([]);
        setClubEvents([]);
        setMeetups([]);
        setLeagues([]);
      }

      // 🎯 Real-time listener will automatically remove this club from userClubs when membership is deleted
    } catch (error: unknown) {
      console.error('❌ Failed to leave club:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load club members
   */
  const loadClubMembers = async (clubId: string): Promise<void> => {
    try {
      const members = await clubService.getClubMembers(clubId);
      setClubMembers(members);
    } catch (error: unknown) {
      console.error('❌ Failed to load club members:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setError(message);
    }
  };

  // ============ EVENT MANAGEMENT ============

  /**
   * Create a club event
   */
  const createEvent = async (
    clubId: string,
    eventData: Record<string, string | number | boolean>
  ): Promise<string> => {
    try {
      setLoading(true);
      setError(null);

      const eventId = await clubService.createClubEvent(clubId, eventData);

      // Reload events for the club
      if (currentClub?.id === clubId) {
        await loadClubEvents(clubId);
      }

      return eventId;
    } catch (error: unknown) {
      console.error('❌ Failed to create event:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Join an event
   */
  const joinEvent = async (eventId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await clubService.joinEvent(eventId);

      // Reload events to update participation
      if (currentClub) {
        await loadClubEvents(currentClub.id);
      }
    } catch (error: unknown) {
      console.error('❌ Failed to join event:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load club events
   */
  const loadClubEvents = async (clubId: string): Promise<void> => {
    try {
      const events = await clubService.getClubEvents(clubId, { upcoming: true });
      setClubEvents(events);
    } catch (error: unknown) {
      console.error('❌ Failed to load club events:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setError(message);
    }
  };

  // ============ CHAT MANAGEMENT ============

  /**
   * Send a message to club chat
   */
  const sendMessage = async (
    clubId: string,
    messageData: Record<string, string | number | boolean>
  ): Promise<string> => {
    try {
      const messageId = await clubService.sendClubMessage(clubId, messageData);
      return messageId;
    } catch (error: unknown) {
      console.error('❌ Failed to send message:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setError(message);
      throw error;
    }
  };

  /**
   * Load club chat messages
   */
  const loadClubMessages = async (
    clubId: string
  ): Promise<Record<string, string | number | boolean>[]> => {
    try {
      const messages = await clubService.getClubMessages(clubId);
      return messages;
    } catch (error: unknown) {
      console.error('❌ Failed to load messages:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setError(message);
      return [];
    }
  };

  // ============ UTILITY FUNCTIONS ============

  /**
   * Refresh user's clubs (now handled by real-time listener)
   * This function is kept for backward compatibility but does nothing
   */
  const refreshUserClubs = async (): Promise<void> => {
    // Real-time listener handles all updates automatically
    return Promise.resolve();
  };

  /**
   * Check if user is a member of a club
   */
  const checkMembership = async (clubId: string): Promise<boolean> => {
    try {
      return await clubService.checkClubMembership(clubId);
    } catch (error: unknown) {
      console.error('❌ Failed to check membership:', error);
      return false;
    }
  };

  /**
   * Check if user has specific permission in a club
   */
  const checkPermission = async (clubId: string, role: string): Promise<boolean> => {
    try {
      return await clubService.checkClubPermission(clubId, role);
    } catch (error: unknown) {
      console.error('❌ Failed to check permission:', error);
      return false;
    }
  };

  // Context value
  const value = {
    // State
    userClubs,
    userMemberships,
    currentClub,
    currentClubId,
    clubMembers,
    clubEvents,
    meetups,
    leagues,
    announcement,
    loading,
    isLoadingMeetups,
    isLoadingMembers,
    isLoadingLeagues,
    isLoadingAnnouncement,
    error,
    // 🎯 [KIM FIX] Pending join requests count for MyClubs tab badge
    pendingJoinRequestsCount,

    // Club Management
    createClub,
    selectClub,
    updateClub,
    searchClubs,

    // Member Management
    inviteMember,
    joinClub,
    leaveClub,
    loadClubMembers,

    // Event Management
    createEvent,
    joinEvent,
    loadClubEvents,

    // Chat Management
    sendMessage,
    loadClubMessages,

    // Utility
    refreshUserClubs,
    checkMembership,
    checkPermission,
    setCurrentClubId,
  };

  return <ClubContext.Provider value={value}>{children}</ClubContext.Provider>;
};

export default ClubContext;
