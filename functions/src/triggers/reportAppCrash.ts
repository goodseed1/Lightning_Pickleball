/**
 * 🔥 [Project Sentinel] Report App Crash
 *
 * ErrorBoundary에서 캡처한 앱 크래시를 Firestore에 자동 저장
 * 관리자 대시보드의 사용자 피드백 화면에 표시됨
 *
 * Firestore Schema: user_feedback/{feedbackId}
 * {
 *   userId: string,
 *   userName: string,
 *   userMessage: string,           // 에러 메시지
 *   aiResponse: string,            // 스택 트레이스
 *   detectedIssue: {
 *     priority: 'high',            // 크래시는 항상 high
 *     category: 'app_crash',       // 새로운 카테고리
 *     keywords: string[],          // 에러 관련 키워드
 *     context: string              // 컴포넌트 스택
 *   },
 *   deviceInfo: object,            // 디바이스 정보
 *   appVersion: string,            // 앱 버전
 *   timestamp: Firestore Timestamp,
 *   status: 'new',
 *   source: 'error_boundary'       // 출처 표시
 * }
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';

interface DeviceInfo {
  platform?: string;
  osVersion?: string;
  deviceModel?: string;
  appVersion?: string;
  buildNumber?: string;
}

interface ReportAppCrashData {
  userId?: string;
  userName?: string;
  errorName: string;
  errorMessage: string;
  errorStack?: string;
  componentStack?: string;
  deviceInfo?: DeviceInfo;
  screenName?: string;
  timestamp?: string;
}

interface ReportAppCrashResponse {
  success: boolean;
  crashReportId: string;
  message: string;
}

/**
 * Callable Function: 앱 크래시 리포트 저장
 */
export const reportAppCrash = onCall<ReportAppCrashData, Promise<ReportAppCrashResponse>>(
  async request => {
    const { data, auth } = request;

    try {
      logger.info('🔥 [Sentinel] Received app crash report:', {
        errorName: data.errorName,
        errorMessage: data.errorMessage?.substring(0, 100),
        userId: data.userId || auth?.uid || 'anonymous',
      });

      // 데이터 검증
      if (!data.errorMessage) {
        throw new HttpsError('invalid-argument', 'Missing required field: errorMessage');
      }

      // 에러 메시지에서 키워드 추출
      const keywords = extractKeywords(data.errorName, data.errorMessage);

      // 스크린 이름 또는 컴포넌트 스택에서 컨텍스트 추출
      const context = data.screenName
        ? `Screen: ${data.screenName}`
        : extractContext(data.componentStack);

      // Firestore에 저장 (user_feedback 컬렉션 사용 - 기존 대시보드와 호환)
      const feedbackRef = admin.firestore().collection('user_feedback');
      const crashDoc = await feedbackRef.add({
        // 기본 정보
        userId: data.userId || auth?.uid || 'anonymous',
        userName: data.userName || 'App User',

        // 에러 정보를 기존 스키마에 맞게 매핑
        userMessage: `[앱 크래시] ${data.errorName}: ${data.errorMessage}`,
        aiResponse: data.errorStack || 'No stack trace available',

        // 이슈 분류
        detectedIssue: {
          priority: 'high', // 크래시는 항상 고우선순위
          category: 'app_crash', // 새로운 카테고리
          keywords: keywords,
          context: context,
        },

        // 추가 정보
        deviceInfo: data.deviceInfo || {},
        appVersion: data.deviceInfo?.appVersion || 'Unknown',
        componentStack: data.componentStack || '',
        crashTimestamp: data.timestamp || new Date().toISOString(),

        // 메타데이터
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'new',
        source: 'error_boundary', // 출처 표시
      });

      logger.info(`✅ [Sentinel] Crash report saved: ${crashDoc.id}`);

      // 🔔 크래시는 항상 고우선순위 - 이메일 알림 전송 (기존 인프라 활용)
      // Note: 이메일 알림은 reportUserFeedback과 동일한 로직을 사용하므로
      // 여기서는 별도 알림을 보내지 않고, 관리자가 대시보드에서 확인하도록 함
      // 필요시 sendAdminNotification 함수를 import해서 사용 가능

      return {
        success: true,
        crashReportId: crashDoc.id,
        message: 'Crash report saved successfully',
      };
    } catch (error) {
      logger.error('❌ [Sentinel] Error saving crash report:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        'internal',
        'Failed to save crash report',
        error instanceof Error ? error.message : String(error)
      );
    }
  }
);

/**
 * 에러 메시지에서 유용한 키워드 추출
 */
function extractKeywords(errorName: string, errorMessage: string): string[] {
  const keywords: string[] = [];

  // 에러 타입 추가
  if (errorName) {
    keywords.push(errorName);
  }

  // 일반적인 에러 키워드 탐지
  const commonKeywords = [
    'undefined',
    'null',
    'TypeError',
    'ReferenceError',
    'NetworkError',
    'SyntaxError',
    'Firebase',
    'Firestore',
    'Auth',
    'Navigation',
    'Render',
    'State',
    'Props',
    'Hook',
    'useEffect',
    'useState',
    'Context',
    'async',
    'await',
    'Promise',
    'fetch',
    'API',
  ];

  const combinedText = `${errorName} ${errorMessage}`.toLowerCase();
  commonKeywords.forEach(keyword => {
    if (combinedText.includes(keyword.toLowerCase())) {
      keywords.push(keyword);
    }
  });

  // 중복 제거 및 최대 10개 제한
  return [...new Set(keywords)].slice(0, 10);
}

/**
 * 컴포넌트 스택에서 컨텍스트 추출
 */
function extractContext(componentStack?: string): string {
  if (!componentStack) {
    return 'Unknown context';
  }

  // 첫 번째 컴포넌트 이름 추출 시도
  const lines = componentStack.split('\n').filter(line => line.trim());
  if (lines.length > 0) {
    // "in ComponentName" 패턴 찾기
    const match = lines[0].match(/in (\w+)/);
    if (match) {
      return `Component: ${match[1]}`;
    }
    // 첫 줄을 그대로 반환 (최대 100자)
    return lines[0].substring(0, 100);
  }

  return 'Unknown context';
}
