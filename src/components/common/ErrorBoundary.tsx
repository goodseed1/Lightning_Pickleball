/**
 * 🔥 ErrorBoundary - App Crash Handler with Auto-Reporting
 *
 * React 컴포넌트 렌더링 에러를 캡처하고:
 * 1. 사용자에게 친화적인 에러 화면 표시
 * 2. 자동으로 Firebase Cloud Function에 크래시 리포트 전송
 * 3. 관리자 대시보드의 "사용자 피드백"에 표시됨
 *
 * Cloud Function: reportAppCrash
 * Firestore Collection: user_feedback
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { httpsCallable } from 'firebase/functions';
import { functions, auth } from '../../firebase/config';
import Constants from 'expo-constants';
import i18n from '../../i18n';

// 디바이스 정보 인터페이스
interface DeviceInfo {
  platform: string;
  osVersion: string;
  appVersion: string;
  buildNumber: string;
  expoVersion: string;
}

// Cloud Function 요청 인터페이스
interface CrashReportData {
  userId?: string;
  userName?: string;
  errorName: string;
  errorMessage: string;
  errorStack?: string;
  componentStack?: string;
  deviceInfo: DeviceInfo;
  screenName?: string;
  timestamp: string;
}

// Cloud Function 응답 인터페이스
interface CrashReportResponse {
  success: boolean;
  crashReportId: string;
  message: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  reportSent: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      reportSent: false,
    };
  }

  static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 ErrorBoundary caught an error:', error);
    console.error('🚨 Component Stack:', errorInfo.componentStack);
    console.error('🚨 Error Stack:', error.stack);
    console.error(
      '🚨 Full Error Object:',
      JSON.stringify(
        {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        null,
        2
      )
    );

    this.setState({
      error,
      errorInfo,
    });

    // 🚨 Firebase Cloud Function으로 크래시 리포트 전송
    this.reportCrashToFirebase(error, errorInfo);
  }

  /**
   * 디바이스 정보 수집
   */
  private getDeviceInfo(): DeviceInfo {
    return {
      platform: Platform.OS,
      osVersion: Platform.Version?.toString() || 'Unknown',
      appVersion: Constants.expoConfig?.version || '1.0.0',
      buildNumber:
        Constants.expoConfig?.ios?.buildNumber ||
        Constants.expoConfig?.android?.versionCode?.toString() ||
        '1',
      expoVersion: Constants.expoVersion || 'Unknown',
    };
  }

  /**
   * 🚨 Firebase Cloud Function으로 크래시 리포트 전송
   */
  private reportCrashToFirebase = async (error: Error, errorInfo: React.ErrorInfo) => {
    // 이미 전송했으면 스킵
    if (this.state.reportSent) {
      console.log('🔄 [ErrorBoundary] Crash report already sent, skipping...');
      return;
    }

    try {
      console.log('📤 [ErrorBoundary] Sending crash report to Firebase...');

      // Cloud Function 호출
      const reportAppCrash = httpsCallable<CrashReportData, CrashReportResponse>(
        functions,
        'reportAppCrash'
      );

      // 현재 사용자 정보
      const currentUser = auth.currentUser;

      // 크래시 리포트 데이터
      const crashData: CrashReportData = {
        userId: currentUser?.uid,
        userName: currentUser?.displayName || currentUser?.email || undefined,
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        componentStack: errorInfo.componentStack || undefined,
        deviceInfo: this.getDeviceInfo(),
        timestamp: new Date().toISOString(),
      };

      const result = await reportAppCrash(crashData);

      if (result.data.success) {
        console.log(
          '✅ [ErrorBoundary] Crash report sent successfully:',
          result.data.crashReportId
        );
        this.setState({ reportSent: true });
      } else {
        console.warn('⚠️ [ErrorBoundary] Crash report returned unsuccessful:', result.data.message);
      }
    } catch (reportError) {
      // 크래시 리포트 전송 실패는 사용자 경험에 영향을 주지 않도록 조용히 처리
      console.error('❌ [ErrorBoundary] Failed to send crash report:', reportError);
      // 실패해도 reportSent를 true로 설정하여 중복 시도 방지
      this.setState({ reportSent: true });
    }
  };

  handleRestart = () => {
    // Reset the error boundary state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      reportSent: false,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Ionicons name='alert-circle' size={64} color='#ff4444' style={styles.icon} />
            <Text style={styles.title}>{i18n.t('common.errorBoundary.title')}</Text>
            <Text style={styles.subtitle}>{i18n.t('common.errorBoundary.subtitle')}</Text>

            {/* 🚨 크래시 리포트 전송 상태 표시 */}
            <View style={styles.reportStatus}>
              {this.state.reportSent ? (
                <Text style={styles.reportSentText}>
                  ✅{' '}
                  {i18n.t('common.errorBoundary.reportSent', {
                    defaultValue: '오류가 자동으로 보고되었습니다',
                  })}
                </Text>
              ) : (
                <Text style={styles.reportPendingText}>
                  ⏳{' '}
                  {i18n.t('common.errorBoundary.reportPending', {
                    defaultValue: '오류 보고 중...',
                  })}
                </Text>
              )}
            </View>

            {__DEV__ && this.state.error && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>{i18n.t('common.errorBoundary.debugTitle')}</Text>
                <Text style={styles.debugText}>{this.state.error.message}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.restartButton} onPress={this.handleRestart}>
              <Text style={styles.restartButtonText}>{i18n.t('common.errorBoundary.retry')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  reportStatus: {
    alignItems: 'center',
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignSelf: 'stretch',
  },
  reportSentText: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '500',
  },
  reportPendingText: {
    color: '#FF9800',
    fontSize: 13,
    fontWeight: '500',
  },
  debugContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignSelf: 'stretch',
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  debugText: {
    fontSize: 10,
    color: '#333',
    fontFamily: 'monospace',
  },
  restartButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  restartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorBoundary;
