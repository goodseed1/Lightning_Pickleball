// import { io, Socket } from 'socket.io-client';
import { DeviceEventEmitter } from 'react-native';
import * as Notifications from 'expo-notifications';
import { LocationData } from './LocationService';
import StorageService from './StorageService';
import i18n from '../i18n';

// ============ TYPE DEFINITIONS ============

/**
 * Socket.io Socket type placeholder (currently commented out)
 * When socket.io-client is enabled, this will be imported from 'socket.io-client'
 */
interface Socket {
  connected: boolean;
  disconnect: () => void;
  connect: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on: (event: string, handler: (...args: any[]) => void) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off: (event: string, handler: (...args: any[]) => void) => void;
  emit: (event: string, ...args: unknown[]) => void;
  removeAllListeners: () => void;
}

/**
 * Socket.io connection options
 */
interface SocketIOClientOptions {
  transports: string[];
  autoConnect: boolean;
  reconnection: boolean;
  reconnectionDelay: number;
  reconnectionAttempts: number;
  timeout: number;
}

/**
 * Socket.io factory function (placeholder)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function io(url: string, options?: SocketIOClientOptions): Socket {
  throw new Error('Socket.io not implemented - WebSocket disabled');
}

/**
 * Match request data structure
 */
interface MatchRequestData {
  senderName: string;
  requestId: string;
  senderId: string;
  [key: string]: unknown;
}

/**
 * Match response data structure
 */
interface MatchResponseData {
  accepted: boolean;
  responderName: string;
  requestId: string;
  sessionId?: string;
  [key: string]: unknown;
}

/**
 * Session update data structure
 */
interface SessionUpdateData {
  status: 'started' | 'completed' | 'cancelled';
  sessionId: string;
  [key: string]: unknown;
}

export interface MatchingRequest {
  userId: string;
  location: LocationData;
  skillLevel: number;
  preferredTime: {
    start: string;
    end: string;
  };
  radius: number;
  timestamp: number;
}

export interface MatchCandidate {
  userId: string;
  name: string;
  profileImage: string;
  skillLevel: number;
  distance: number;
  matchScore: number;
  availability: TimeSlot[];
  isOnline: boolean;
  lastSeen: number;
  location: {
    latitude: number;
    longitude: number;
  };
}

export interface MatchNotification {
  type:
    | 'match_found'
    | 'match_request'
    | 'match_accepted'
    | 'match_declined'
    | 'match_started'
    | 'match_completed';
  title: string;
  body: string;
  data: unknown;
  timestamp: number;
}

interface ConnectionOptions {
  autoReconnect: boolean;
  maxReconnectAttempts: number;
  reconnectDelay: number;
  heartbeatInterval: number;
}

class RealTimeMatchingService {
  private socket: Socket | null = null;
  private matchingActive: boolean = false;
  private userId: string | null = null;
  private reconnectAttempts = 0;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastHeartbeat = 0;
  private isPaused = false;

  private readonly options: ConnectionOptions = {
    autoReconnect: true,
    maxReconnectAttempts: 5,
    reconnectDelay: 1000,
    heartbeatInterval: 30000, // 30초
  };

  private readonly serverUrl = process.env.EXPO_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8080';

  constructor() {
    this.initializeSocket();
    this.setupNotificationHandlers();
  }

  /**
   * WebSocket 연결 초기화
   */
  private initializeSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(this.serverUrl, {
      transports: ['websocket'],
      autoConnect: false,
      reconnection: this.options.autoReconnect,
      reconnectionDelay: this.options.reconnectDelay,
      reconnectionAttempts: this.options.maxReconnectAttempts,
      timeout: 20000,
    });

    this.setupSocketListeners();
  }

  /**
   * Socket 이벤트 리스너 설정
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    // 연결 성공
    this.socket.on('connect', () => {
      console.log('✅ Connected to matching server');
      this.reconnectAttempts = 0;
      this.lastHeartbeat = Date.now();

      this.emitEvent('connection_status', { connected: true });

      if (this.userId) {
        this.authenticateUser(this.userId);
      }

      this.startHeartbeat();
    });

    // 연결 해제
    this.socket.on('disconnect', (reason: string) => {
      console.log('❌ Disconnected from matching server:', reason);
      this.emitEvent('connection_status', { connected: false, reason });
      this.stopHeartbeat();
    });

    // 연결 오류
    this.socket.on('connect_error', (error: Error) => {
      console.error('🔥 Connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
        this.handleConnectionFailure();
      }
    });

    // 인증 성공
    this.socket.on('authenticated', (data: unknown) => {
      console.log('🔐 Authentication successful:', data);
      this.emitEvent('authenticated', data);
    });

    // 매치 발견
    this.socket.on('match_found', (candidates: MatchCandidate[]) => {
      console.log('🎯 Matches found:', candidates.length);
      this.handleMatchFound(candidates);
    });

    // 매치 요청 수신
    this.socket.on('match_request', (data: unknown) => {
      console.log('📨 Match request received:', data);
      this.handleMatchRequest(data);
    });

    // 매치 응답 수신
    this.socket.on('match_response', (data: unknown) => {
      console.log('📬 Match response received:', data);
      this.handleMatchResponse(data);
    });

    // 사용자 상태 업데이트
    this.socket.on('user_status_update', (data: unknown) => {
      this.emitEvent('user_status_update', data);
    });

    // 매치 세션 업데이트
    this.socket.on('session_update', (data: unknown) => {
      console.log('🎾 Session update:', data);
      this.handleSessionUpdate(data);
    });

    // 하트비트 응답
    this.socket.on('pong', () => {
      this.lastHeartbeat = Date.now();
    });

    // 오류 처리
    this.socket.on('error', (error: Error) => {
      console.error('❗ Socket error:', error);
      this.emitEvent('socket_error', { error });
    });
  }

  /**
   * 알림 핸들러 설정
   */
  private setupNotificationHandlers(): void {
    Notifications.setNotificationHandler({
      handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }

  /**
   * 사용자 인증
   */
  private authenticateUser(userId: string): void {
    if (!this.socket?.connected) return;

    this.socket.emit('authenticate', {
      userId,
      timestamp: Date.now(),
      deviceInfo: {
        platform: 'react-native',
        version: '1.0.0',
      },
    });
  }

  /**
   * 매칭 서비스 시작
   */
  async startMatching(userId: string, matchingRequest: MatchingRequest): Promise<boolean> {
    try {
      this.userId = userId;

      // 일시 정지 상태 해제
      this.isPaused = false;

      // 연결되지 않은 경우 연결 시도
      if (!this.socket?.connected) {
        await this.connect();
      }

      if (!this.socket?.connected) {
        throw new Error('Unable to establish connection');
      }

      this.matchingActive = true;

      // 매칭 요청 전송
      this.socket.emit('start_matching', {
        ...matchingRequest,
        preferences: await this.getUserPreferences(userId),
      });

      // 매칭 요청 로컬 저장 (using generic setItem from StorageService)
      // Note: saveMatchingRequest method doesn't exist in StorageService
      // Using generic storage instead
      try {
        await StorageService.setItem('matching_request', matchingRequest);
      } catch (storageError) {
        console.warn('Failed to cache matching request:', storageError);
      }

      return true;
    } catch (error) {
      console.error('💥 Error starting matching:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start matching';
      this.emitEvent('connection_failed', {
        error: errorMessage,
      });
      return false;
    }
  }

  /**
   * 매칭 서비스 중지
   */
  stopMatching(): void {
    this.matchingActive = false;
    this.isPaused = false;

    if (this.socket?.connected) {
      this.socket.emit('stop_matching', {
        userId: this.userId,
        timestamp: Date.now(),
      });
    }

    console.log('⏹️ Matching stopped');
  }

  /**
   * 매칭 일시 정지
   */
  pauseMatching(): void {
    if (!this.matchingActive) return;

    this.isPaused = true;

    if (this.socket?.connected) {
      this.socket.emit('pause_matching', {
        userId: this.userId,
        timestamp: Date.now(),
      });
    }

    console.log('⏸️ Matching paused');
  }

  /**
   * 매칭 재개
   */
  resumeMatching(): void {
    if (!this.matchingActive || !this.isPaused) return;

    this.isPaused = false;

    if (this.socket?.connected) {
      this.socket.emit('resume_matching', {
        userId: this.userId,
        timestamp: Date.now(),
      });
    }

    console.log('▶️ Matching resumed');
  }

  /**
   * 위치 업데이트
   */
  updateLocation(location: LocationData): void {
    if (!this.matchingActive || this.isPaused || !this.socket?.connected) return;

    this.socket.emit('location_update', {
      userId: this.userId,
      location,
      timestamp: Date.now(),
    });

    // 디바운스된 로그
    console.log('📍 Location updated');
  }

  /**
   * 매치 요청 전송
   */
  sendMatchRequest(targetUserId: string, requestId?: string): void {
    if (!this.socket?.connected) return;

    this.socket.emit('send_match_request', {
      requestId: requestId || this.generateRequestId(),
      fromUserId: this.userId,
      toUserId: targetUserId,
      timestamp: Date.now(),
    });
  }

  /**
   * 매치 요청 응답
   */
  respondToMatchRequest(requestId: string, accept: boolean): void {
    if (!this.socket?.connected) return;

    this.socket.emit('match_request_response', {
      requestId,
      accept,
      userId: this.userId,
      timestamp: Date.now(),
    });
  }

  /**
   * 알림 전송
   */
  async sendNotification(userId: string, notification: MatchNotification): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          // Cast to Record<string, unknown> to satisfy NotificationContentInput type
          data: notification.data as Record<string, unknown>,
        },
        trigger: null, // 즉시 발송
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * WebSocket 연결
   */
  private connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not initialized'));
        return;
      }

      if (this.socket.connected) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 15000);

      const onConnect = () => {
        clearTimeout(timeout);
        this.socket?.off('connect', onConnect);
        this.socket?.off('connect_error', onError);
        resolve();
      };

      const onError = (error: Error) => {
        clearTimeout(timeout);
        this.socket?.off('connect', onConnect);
        this.socket?.off('connect_error', onError);
        reject(error);
      };

      this.socket.on('connect', onConnect);
      this.socket.on('connect_error', onError);

      this.socket.connect();
    });
  }

  /**
   * 매치 발견 핸들러
   */
  private async handleMatchFound(candidates: MatchCandidate[]): Promise<void> {
    try {
      // 후보자 정보 캐싱 (using generic setItem from StorageService)
      // Note: saveMatchCandidates method doesn't exist in StorageService
      try {
        await StorageService.setItem('match_candidates', candidates);
      } catch (storageError) {
        console.warn('Failed to cache match candidates:', storageError);
      }

      // 개인화 점수가 있는 후보자 우선 정렬
      const sortedCandidates = candidates.sort((a, b) => {
        const aScore = a.matchScore || 50;
        const bScore = b.matchScore || 50;
        return bScore - aScore;
      });

      this.emitEvent('matches_found', sortedCandidates);

      // 높은 점수의 매치에 대해 알림 전송
      const topMatch = sortedCandidates[0];
      if (topMatch && topMatch.matchScore > 80) {
        await this.sendNotification(this.userId!, {
          type: 'match_found',
          title: i18n.t('services.matching.perfectMatchTitle'),
          body: i18n.t('services.matching.perfectMatchBody', {
            name: topMatch.name,
            score: Math.round(topMatch.matchScore),
          }),
          data: { candidateId: topMatch.userId },
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error('Error handling match found:', error);
    }
  }

  /**
   * 매치 요청 핸들러
   */
  private async handleMatchRequest(data: unknown): Promise<void> {
    try {
      // Type guard for match request data
      const requestData = data as MatchRequestData;

      // 로컬 알림 발송
      await this.sendNotification(this.userId!, {
        type: 'match_request',
        title: i18n.t('services.matching.newRequestTitle'),
        body: i18n.t('services.matching.newRequestBody', {
          senderName: requestData.senderName,
        }),
        data: {
          type: 'match_request',
          requestId: requestData.requestId,
          senderId: requestData.senderId,
        },
        timestamp: Date.now(),
      });

      this.emitEvent('match_request_received', data);
    } catch (error) {
      console.error('Error handling match request:', error);
    }
  }

  /**
   * 매치 응답 핸들러
   */
  private async handleMatchResponse(data: unknown): Promise<void> {
    try {
      // Type guard for match response data
      const responseData = data as MatchResponseData;

      const title = responseData.accepted
        ? i18n.t('services.matching.matchAcceptedTitle')
        : i18n.t('services.matching.matchDeclinedTitle');
      const body = responseData.accepted
        ? i18n.t('services.matching.matchAcceptedBody', {
            responderName: responseData.responderName,
          })
        : i18n.t('services.matching.matchDeclinedBody', {
            responderName: responseData.responderName,
          });

      await this.sendNotification(this.userId!, {
        type: responseData.accepted ? 'match_accepted' : 'match_declined',
        title,
        body,
        data: {
          requestId: responseData.requestId,
          accepted: responseData.accepted,
          sessionId: responseData.sessionId,
        },
        timestamp: Date.now(),
      });

      this.emitEvent('match_response_received', data);
    } catch (error) {
      console.error('Error handling match response:', error);
    }
  }

  /**
   * 세션 업데이트 핸들러
   */
  private async handleSessionUpdate(data: unknown): Promise<void> {
    try {
      // Type guard for session update data
      const sessionData = data as SessionUpdateData;

      let notificationTitle = '';
      let notificationBody = '';

      switch (sessionData.status) {
        case 'started':
          notificationTitle = i18n.t('services.matching.matchStartedTitle');
          notificationBody = i18n.t('services.matching.matchStartedBody');
          break;
        case 'completed':
          notificationTitle = i18n.t('services.matching.matchCompletedTitle');
          notificationBody = i18n.t('services.matching.matchCompletedBody');
          break;
        case 'cancelled':
          notificationTitle = i18n.t('services.matching.matchCancelledTitle');
          notificationBody = i18n.t('services.matching.matchCancelledBody');
          break;
      }

      if (notificationTitle) {
        await this.sendNotification(this.userId!, {
          type: 'match_started',
          title: notificationTitle,
          body: notificationBody,
          data: { sessionId: sessionData.sessionId, status: sessionData.status },
          timestamp: Date.now(),
        });
      }

      this.emitEvent('session_update', data);
    } catch (error) {
      console.error('Error handling session update:', error);
    }
  }

  /**
   * 연결 실패 처리
   */
  private handleConnectionFailure(): void {
    console.error(
      '❌ Failed to connect to matching server after',
      this.options.maxReconnectAttempts,
      'attempts'
    );

    this.emitEvent('connection_failed', {
      error: i18n.t('services.matching.connectionFailedError'),
      canRetry: true,
      maxAttemptsReached: true,
    });
  }

  /**
   * 하트비트 시작
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');

        // 하트비트 타임아웃 체크
        if (Date.now() - this.lastHeartbeat > this.options.heartbeatInterval * 2) {
          console.warn('❤️ Heartbeat timeout detected');
          this.handleConnectionFailure();
        }
      }
    }, this.options.heartbeatInterval);
  }

  /**
   * 하트비트 중지
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * 사용자 선호도 조회
   */
  private async getUserPreferences(userId: string): Promise<Record<string, unknown>> {
    try {
      // Note: getUserPreferences method doesn't exist in StorageService
      // Using generic getItem instead
      const preferences = await StorageService.getItem<Record<string, unknown>>(
        `user_preferences_${userId}`
      );
      return preferences || {};
    } catch (error) {
      console.error('Error loading user preferences:', error);
      return {};
    }
  }

  /**
   * 이벤트 방출
   */
  private emitEvent(type: string, data: unknown): void {
    DeviceEventEmitter.emit('matching_event', { type, data });
  }

  /**
   * 요청 ID 생성
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 연결 상태 확인
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * 매칭 상태 확인
   */
  isMatchingActive(): boolean {
    return this.matchingActive && !this.isPaused;
  }

  /**
   * 일시 정지 상태 확인
   */
  isPausedState(): boolean {
    return this.isPaused;
  }

  /**
   * 연결 재시도
   */
  async reconnect(): Promise<boolean> {
    try {
      this.reconnectAttempts = 0;
      if (this.socket) {
        this.socket.disconnect();
        this.initializeSocket();
      }

      await this.connect();
      return true;
    } catch (error) {
      console.error('Error reconnecting:', error);
      return false;
    }
  }

  /**
   * 서비스 정리
   */
  cleanup(): void {
    this.stopMatching();
    this.stopHeartbeat();

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    console.log('🧹 RealTimeMatchingService cleaned up');
  }
}

// 타입 정의
interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
}

export default new RealTimeMatchingService();
