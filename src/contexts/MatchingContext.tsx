import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { DeviceEventEmitter, AppState, AppStateStatus } from 'react-native';
import { useAuth } from './AuthContext';
import { useLocation } from './LocationContext';
import RealTimeMatchingService from '../services/RealTimeMatchingService';
import PersonalizationService from '../services/PersonalizationService';
import MatchBrokerService from '../services/MatchBrokerService';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import StorageService from '../services/StorageService';
import i18n from '../i18n';

export interface MatchCandidate {
  userId: string;
  name: string;
  profileImage: string;
  skillLevel: number;
  distance: number;
  matchScore: number;
  personalizedScore?: number;
  availability: TimeSlot[];
  isOnline: boolean;
  lastSeen: number;
}

export interface MatchRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserImage: string;
  toUserId: string;
  message: string;
  proposedTime: {
    start: Date;
    end: Date;
  };
  location: {
    name: string;
    latitude: number;
    longitude: number;
  };
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  timestamp: number;
  expiresAt: number;
}

export interface MatchSession {
  id: string;
  participants: Array<{
    userId: string;
    name: string;
    profileImage: string;
  }>;
  location: {
    name: string;
    latitude: number;
    longitude: number;
  };
  scheduledTime: {
    start: Date;
    end: Date;
  };
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  createdAt: number;
}

interface MatchingState {
  isActive: boolean;
  isConnected: boolean;
  candidates: MatchCandidate[];
  incomingRequests: MatchRequest[];
  sentRequests: MatchRequest[];
  activeSessions: MatchSession[];
  lastMatchingTime: number;
  connectionError: string | null;
  loading: boolean;
}

interface MatchingContextValue {
  state: MatchingState;
  startMatching: (options: {
    skillLevel: number;
    radius: number;
    preferredTimes: TimeSlot[];
  }) => Promise<boolean>;
  stopMatching: () => void;
  sendMatchRequest: (
    candidateId: string,
    options: {
      message?: string;
      proposedTime: { start: Date; end: Date };
      location: { name: string; latitude: number; longitude: number };
    }
  ) => Promise<string | null>;
  respondToMatchRequest: (
    requestId: string,
    accept: boolean,
    counterOffer?: unknown
  ) => Promise<boolean>;
  refreshCandidates: () => Promise<void>;
  recordUserInteraction: (targetUserId: string, action: string) => Promise<void>;
  getPersonalizedCandidates: () => MatchCandidate[];
}

type MatchingAction =
  | { type: 'SET_CONNECTION_STATUS'; payload: boolean }
  | { type: 'SET_MATCHING_ACTIVE'; payload: boolean }
  | { type: 'SET_CANDIDATES'; payload: MatchCandidate[] }
  | { type: 'ADD_INCOMING_REQUEST'; payload: MatchRequest }
  | { type: 'UPDATE_REQUEST_STATUS'; payload: { requestId: string; status: string } }
  | { type: 'ADD_SESSION'; payload: MatchSession }
  | { type: 'UPDATE_SESSION'; payload: { sessionId: string; updates: Partial<MatchSession> } }
  | { type: 'SET_CONNECTION_ERROR'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_EXPIRED_REQUESTS' };

const initialState: MatchingState = {
  isActive: false,
  isConnected: false,
  candidates: [],
  incomingRequests: [],
  sentRequests: [],
  activeSessions: [],
  lastMatchingTime: 0,
  connectionError: null,
  loading: false,
};

function matchingReducer(state: MatchingState, action: MatchingAction): MatchingState {
  switch (action.type) {
    case 'SET_CONNECTION_STATUS':
      return {
        ...state,
        isConnected: action.payload,
        connectionError: action.payload ? null : state.connectionError,
      };

    case 'SET_MATCHING_ACTIVE':
      return {
        ...state,
        isActive: action.payload,
        lastMatchingTime: action.payload ? Date.now() : state.lastMatchingTime,
      };

    case 'SET_CANDIDATES':
      return {
        ...state,
        candidates: action.payload,
        loading: false,
      };

    case 'ADD_INCOMING_REQUEST':
      return {
        ...state,
        incomingRequests: [...state.incomingRequests, action.payload],
      };

    case 'UPDATE_REQUEST_STATUS':
      return {
        ...state,
        incomingRequests: state.incomingRequests.map(req =>
          req.id === action.payload.requestId
            ? {
                ...req,
                status: action.payload.status as 'pending' | 'accepted' | 'declined' | 'expired',
              }
            : req
        ),
        sentRequests: state.sentRequests.map(req =>
          req.id === action.payload.requestId
            ? {
                ...req,
                status: action.payload.status as 'pending' | 'accepted' | 'declined' | 'expired',
              }
            : req
        ),
      };

    case 'ADD_SESSION':
      return {
        ...state,
        activeSessions: [...state.activeSessions, action.payload],
      };

    case 'UPDATE_SESSION':
      return {
        ...state,
        activeSessions: state.activeSessions.map(session =>
          session.id === action.payload.sessionId
            ? { ...session, ...action.payload.updates }
            : session
        ),
      };

    case 'SET_CONNECTION_ERROR':
      return {
        ...state,
        connectionError: action.payload,
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    case 'CLEAR_EXPIRED_REQUESTS': {
      const now = Date.now();
      return {
        ...state,
        incomingRequests: state.incomingRequests.filter(req => req.expiresAt > now),
        sentRequests: state.sentRequests.filter(req => req.expiresAt > now),
      };
    }

    default:
      return state;
  }
}

const MatchingContext = createContext<MatchingContextValue | undefined>(undefined);

export function MatchingProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(matchingReducer, initialState);
  const { currentUser: user } = useAuth();
  const { location: currentLocation } = useLocation();

  /**
   * 매치 발견 핸들러
   */
  const handleMatchesFound = useCallback(
    async (candidates: MatchCandidate[]) => {
      if (!user) return;

      try {
        // 개인화된 후보 정렬
        const rawCandidates = await PersonalizationService.reorderCandidates(candidates);

        // Type assertion with validation
        const personalizedCandidates: MatchCandidate[] = rawCandidates.map(c => ({
          userId: c.userId as string,
          name: c.name as string,
          profileImage: c.profileImage as string,
          skillLevel: c.skillLevel as number,
          distance: c.distance as number,
          matchScore: c.matchScore as number,
          personalizedScore: c.personalizedScore as number | undefined,
          availability: c.availability as TimeSlot[],
          isOnline: c.isOnline as boolean,
          lastSeen: c.lastSeen as number,
        }));

        dispatch({ type: 'SET_CANDIDATES', payload: personalizedCandidates });
      } catch (error) {
        console.error('Error processing match candidates:', error);
        dispatch({ type: 'SET_CANDIDATES', payload: candidates });
      }
    },
    [user]
  );

  /**
   * 매치 요청 수신 핸들러
   */
  const handleMatchRequestReceived = useCallback((requestData: unknown) => {
    const data = requestData as Record<string, unknown>;
    const proposedTime = data.proposedTime as { start: string; end: string };

    const matchRequest: MatchRequest = {
      ...data,
      proposedTime: {
        start: new Date(proposedTime.start),
        end: new Date(proposedTime.end),
      },
    } as MatchRequest;

    dispatch({ type: 'ADD_INCOMING_REQUEST', payload: matchRequest });
  }, []);

  /**
   * 매치 응답 수신 핸들러
   */
  const handleMatchResponseReceived = useCallback((responseData: unknown) => {
    dispatch({
      type: 'UPDATE_REQUEST_STATUS',
      payload: {
        requestId: (responseData as { requestId: string }).requestId,
        status: (responseData as { accepted: boolean }).accepted ? 'accepted' : 'declined',
      },
    });
  }, []);

  /**
   * 사용자 상태 업데이트 핸들러
   */
  const handleUserStatusUpdate = useCallback(
    (data: { userId: string; isOnline: boolean; lastSeen: number }) => {
      // 후보자 목록에서 사용자 상태 업데이트
      dispatch({
        type: 'SET_CANDIDATES',
        payload: state.candidates.map(candidate =>
          candidate.userId === data.userId
            ? { ...candidate, isOnline: data.isOnline, lastSeen: data.lastSeen }
            : candidate
        ),
      });
    },
    [state.candidates]
  );

  /**
   * 매칭 이벤트 핸들러
   */
  const handleMatchingEvent = useCallback(
    (event: { type: string; data: unknown }) => {
      switch (event.type) {
        case 'connection_status':
          dispatch({
            type: 'SET_CONNECTION_STATUS',
            payload: (event.data as { connected: boolean }).connected,
          });
          break;

        case 'matches_found':
          handleMatchesFound(event.data as MatchCandidate[]);
          break;

        case 'match_request_received':
          handleMatchRequestReceived(event.data);
          break;

        case 'match_response_received':
          handleMatchResponseReceived(event.data);
          break;

        case 'connection_failed':
          dispatch({
            type: 'SET_CONNECTION_ERROR',
            payload: (event.data as { error: string }).error,
          });
          break;

        case 'user_status_update':
          handleUserStatusUpdate(
            event.data as { userId: string; isOnline: boolean; lastSeen: number }
          );
          break;
      }
    },
    [
      handleMatchesFound,
      handleMatchRequestReceived,
      handleMatchResponseReceived,
      handleUserStatusUpdate,
    ]
  );

  /**
   * 매치 요청 생성 핸들러
   */
  const handleMatchRequestCreated = useCallback((...args: unknown[]) => {
    const request = args[0] as MatchRequest;
    // 발송한 요청을 상태에 추가
    dispatch({ type: 'ADD_INCOMING_REQUEST', payload: request });
  }, []);

  /**
   * 매치 세션 생성 핸들러
   */
  const handleMatchSessionCreated = useCallback((...args: unknown[]) => {
    const session = args[0] as MatchSession;
    dispatch({ type: 'ADD_SESSION', payload: session });
  }, []);

  /**
   * 실시간 이벤트 리스너 설정
   */
  useEffect(() => {
    if (!user) return;

    const matchingEventListener = DeviceEventEmitter.addListener(
      'matching_event',
      handleMatchingEvent
    );

    MatchBrokerService.addListener('match_request_created', handleMatchRequestCreated);

    MatchBrokerService.addListener('match_session_created', handleMatchSessionCreated);

    return () => {
      matchingEventListener.remove();
      MatchBrokerService.removeListener('match_request_created', handleMatchRequestCreated);
      MatchBrokerService.removeListener('match_session_created', handleMatchSessionCreated);
    };
  }, [user, handleMatchRequestCreated, handleMatchSessionCreated, handleMatchingEvent]);

  /**
   * 앱 상태 변화에 따른 연결 관리
   */
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' && state.isActive) {
        // 백그라운드로 갈 때 매칭 일시 정지
        RealTimeMatchingService.pauseMatching();
      } else if (nextAppState === 'active' && state.isActive) {
        // 포그라운드로 올 때 매칭 재개
        RealTimeMatchingService.resumeMatching();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [state.isActive]);

  /**
   * 정기적인 만료된 요청 정리
   */
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      dispatch({ type: 'CLEAR_EXPIRED_REQUESTS' });
    }, 60000); // 1분마다

    return () => clearInterval(cleanupInterval);
  }, []);

  /**
   * 사용자 상호작용 기록
   */
  const recordUserInteraction = useCallback(
    async (targetUserId: string, action: string) => {
      if (!user || !currentLocation) return;

      try {
        await PersonalizationService.recordInteraction(user.uid, {
          type: 'match_interaction',
          candidateId: targetUserId,
          action,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error('Error recording user interaction:', error);
      }
    },
    [user, currentLocation]
  );

  /**
   * 매칭 시작
   */
  const startMatching = useCallback(
    async (options: {
      skillLevel: number;
      radius: number;
      preferredTimes: TimeSlot[];
    }): Promise<boolean> => {
      if (!user || !currentLocation) {
        console.error('User or location not available');
        return false;
      }

      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_CONNECTION_ERROR', payload: null });

      try {
        const matchingRequest = {
          userId: user.uid,
          location: {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            accuracy: 10, // Default accuracy
            timestamp: Date.now(),
          },
          skillLevel: options.skillLevel,
          preferredTime: {
            start: new Date().toISOString(),
            end: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2시간 후
          },
          radius: options.radius,
          timestamp: Date.now(),
        };

        const success = await RealTimeMatchingService.startMatching(user.uid, matchingRequest);

        if (success) {
          dispatch({ type: 'SET_MATCHING_ACTIVE', payload: true });
          dispatch({ type: 'SET_CONNECTION_STATUS', payload: true });
        } else {
          dispatch({ type: 'SET_CONNECTION_ERROR', payload: i18n.t('contexts.matching.connectionFailed') });
        }

        return success;
      } catch (error) {
        console.error('Error starting matching:', error);
        dispatch({ type: 'SET_CONNECTION_ERROR', payload: i18n.t('contexts.matching.startFailed') });
        return false;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [user, currentLocation]
  );

  /**
   * 매칭 중지
   */
  const stopMatching = useCallback(() => {
    RealTimeMatchingService.stopMatching();
    dispatch({ type: 'SET_MATCHING_ACTIVE', payload: false });
    dispatch({ type: 'SET_CANDIDATES', payload: [] });
  }, []);

  /**
   * 매치 요청 전송
   */
  const sendMatchRequest = useCallback(
    async (
      candidateId: string,
      options: {
        message?: string;
        proposedTime: { start: Date; end: Date };
        location: { name: string; latitude: number; longitude: number };
      }
    ): Promise<string | null> => {
      if (!user) return null;

      try {
        const requestId = await MatchBrokerService.createMatchRequest({
          userId: user.uid,
          preferences: { candidateId, message: options.message },
          location: {
            latitude: options.location.latitude,
            longitude: options.location.longitude,
            radius: 10, // Default radius
          },
          timeSlot: {
            date: options.proposedTime.start.toISOString().split('T')[0],
            startTime: options.proposedTime.start.toISOString(),
            endTime: options.proposedTime.end.toISOString(),
          },
        });

        // 상호작용 기록
        await recordUserInteraction(candidateId, 'request');

        return requestId;
      } catch (error) {
        console.error('Error sending match request:', error);
        return null;
      }
    },
    [user, recordUserInteraction]
  );

  /**
   * 매치 요청 응답
   */
  const respondToMatchRequest = useCallback(
    async (requestId: string, accept: boolean, counterOffer?: unknown): Promise<boolean> => {
      if (!user) return false;

      try {
        await MatchBrokerService.respondToMatchRequest(requestId, {
          userId: user.uid,
          accepted: accept,
          message: counterOffer as string | undefined,
        });

        dispatch({
          type: 'UPDATE_REQUEST_STATUS',
          payload: {
            requestId,
            status: accept ? 'accepted' : 'declined',
          },
        });

        // 상호작용 기록
        const request = state.incomingRequests.find(r => r.id === requestId);
        if (request) {
          await recordUserInteraction(request.fromUserId, accept ? 'accept' : 'decline');
        }

        return true;
      } catch (error) {
        console.error('Error responding to match request:', error);
        return false;
      }
    },
    [user, state.incomingRequests, recordUserInteraction]
  );

  /**
   * 후보자 새로고침
   */
  const refreshCandidates = useCallback(async () => {
    if (!user || !currentLocation || !state.isActive) return;

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // 위치 업데이트
      const locationData = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        accuracy: 10, // Default accuracy
        timestamp: Date.now(),
      };
      RealTimeMatchingService.updateLocation(locationData);

      // 새로운 후보자 요청
      // 실제 구현에서는 서버에서 새로운 매칭 결과를 받음
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error refreshing candidates:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user, currentLocation, state.isActive]);

  /**
   * 개인화된 후보자 목록 조회
   */
  const getPersonalizedCandidates = useCallback((): MatchCandidate[] => {
    return state.candidates
      .filter(candidate => candidate.personalizedScore !== undefined)
      .sort((a, b) => (b.personalizedScore || 0) - (a.personalizedScore || 0));
  }, [state.candidates]);

  const contextValue: MatchingContextValue = {
    state,
    startMatching,
    stopMatching,
    sendMatchRequest,
    respondToMatchRequest,
    refreshCandidates,
    recordUserInteraction,
    getPersonalizedCandidates,
  };

  return <MatchingContext.Provider value={contextValue}>{children}</MatchingContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMatching() {
  const context = useContext(MatchingContext);
  if (context === undefined) {
    throw new Error('useMatching must be used within a MatchingProvider');
  }
  return context;
}

// 타입 정의
interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
}
