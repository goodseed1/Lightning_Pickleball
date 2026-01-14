/**
 * 작전명: CCTV (Operation CCTV) - Central Logging Utility
 *
 * Provides millisecond-precision timestamped logging across all contexts
 * to track startup sequences and identify race conditions.
 */

// Generate unique session ID for tracking data flows
const SESSION_ID = Math.random().toString(36).substring(2, 8);

// App start time for relative timing
const APP_START_TIME = Date.now();

export interface CCTVLogEntry {
  timestamp: number;
  relativeTime: number;
  sessionId: string;
  context: string;
  phase: string;
  message: string;
  data?: unknown;
}

export class CCTVLogger {
  private static logs: CCTVLogEntry[] = [];

  static log(context: string, phase: string, message: string, data?: unknown): void {
    // 방어적 초기화 - React Native 모듈 로딩 타이밍 문제 해결
    if (!this.logs) {
      this.logs = [];
    }

    const timestamp = Date.now();
    const relativeTime = timestamp - APP_START_TIME;

    const logEntry: CCTVLogEntry = {
      timestamp,
      relativeTime,
      sessionId: SESSION_ID,
      context,
      phase,
      message,
      data: data ? JSON.stringify(data, null, 2) : undefined,
    };

    this.logs.push(logEntry);

    // Enhanced console output with millisecond precision
    console.log(
      `🎥 [CCTV-${SESSION_ID}] +${relativeTime}ms | ${context} | ${phase} | ${message}`,
      data ? data : ''
    );
  }

  static getLogs(): CCTVLogEntry[] {
    if (!this.logs) {
      this.logs = [];
    }
    return [...this.logs];
  }

  static getLogsSince(timeMs: number): CCTVLogEntry[] {
    if (!this.logs) {
      this.logs = [];
    }
    return this.logs.filter(log => log.relativeTime >= timeMs);
  }

  static printSummary(): void {
    if (!this.logs) {
      this.logs = [];
    }

    console.log('\n🎥 ===== CCTV OPERATION SUMMARY =====');
    console.log(`Session ID: ${SESSION_ID}`);
    console.log(`Total Events: ${this.logs.length}`);
    console.log(
      `Duration: ${this.logs.length > 0 ? Math.max(...this.logs.map(l => l.relativeTime)) : 0}ms`
    );

    const contextSummary = this.logs.reduce(
      (acc, log) => {
        acc[log.context] = (acc[log.context] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log('Context Activity:');
    Object.entries(contextSummary).forEach(([context, count]) => {
      console.log(`  - ${context}: ${count} events`);
    });
    console.log('🎥 ====================================\n');
  }

  static exportLogs(): string {
    if (!this.logs) {
      this.logs = [];
    }

    return JSON.stringify(
      {
        sessionId: SESSION_ID,
        appStartTime: APP_START_TIME,
        logs: this.logs,
      },
      null,
      2
    );
  }
}

// Convenience functions for common logging patterns
// 🔧 FIX: Bind static method to preserve 'this' context
export const cctvLog = CCTVLogger.log.bind(CCTVLogger);

// Phase constants for consistency
export const CCTV_PHASES = {
  INIT: 'INIT',
  AUTH_START: 'AUTH_START',
  AUTH_PROFILE_LOADING: 'AUTH_PROFILE_LOADING',
  AUTH_PROFILE_LOADED: 'AUTH_PROFILE_LOADED',
  LOCATION_PERMISSION: 'LOCATION_PERMISSION',
  LOCATION_ACQUIRED: 'LOCATION_ACQUIRED',
  DISCOVERY_START: 'DISCOVERY_START',
  DISCOVERY_DATA_LOADED: 'DISCOVERY_DATA_LOADED',
  COMPONENT_MOUNT: 'COMPONENT_MOUNT',
  COMPONENT_FOCUS: 'COMPONENT_FOCUS',
  DATA_REFRESH: 'DATA_REFRESH',
  ERROR: 'ERROR',
} as const;

// Export for global access
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).CCTVLogger = CCTVLogger;
}
