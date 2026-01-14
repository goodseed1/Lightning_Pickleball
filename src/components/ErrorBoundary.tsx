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
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Button, Card, Title, Paragraph } from 'react-native-paper';
import { httpsCallable } from 'firebase/functions';
import { theme } from '../theme';
import { functions, auth } from '../firebase/config';
import Constants from 'expo-constants';
import i18n from '../i18n';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  reportSent: boolean;
}

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

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      reportSent: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🔥 [ErrorBoundary] Caught an error:', error, errorInfo);

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
  private reportCrashToFirebase = async (error: Error, errorInfo: ErrorInfo) => {
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

  private handleReload = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      reportSent: false,
    });
  };

  private handleRestart = () => {
    // 앱 재시작 (React Native에서는 일반적으로 사용자가 수동으로 재시작)
    console.log('🔄 [ErrorBoundary] App restart requested');
    // 상태 초기화로 재시도
    this.handleReload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Card style={styles.errorCard}>
            <Card.Content>
              <Title style={styles.errorTitle}>
                {i18n.t('common.errorBoundary.detailedTitle')}
              </Title>

              <Paragraph style={styles.errorMessage}>
                {i18n.t('common.errorBoundary.detailedMessage')}
              </Paragraph>

              {/* 리포트 전송 상태 표시 */}
              <View style={styles.reportStatus}>
                {this.state.reportSent ? (
                  <Text style={styles.reportSentText}>
                    {i18n.t('common.errorBoundary.reportSent')}
                  </Text>
                ) : (
                  <Text style={styles.reportPendingText}>
                    {i18n.t('common.errorBoundary.reportPending')}
                  </Text>
                )}
              </View>

              {__DEV__ && this.state.error && (
                <ScrollView style={styles.errorDetails}>
                  <Text style={styles.errorDetailsTitle}>
                    {i18n.t('common.errorBoundary.errorDetails')}
                  </Text>
                  <Text style={styles.errorText}>{this.state.error.message}</Text>
                  {this.state.error.stack && (
                    <Text style={styles.stackTrace}>{this.state.error.stack}</Text>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      <Text style={styles.errorDetailsTitle}>
                        {i18n.t('common.errorBoundary.componentStack')}
                      </Text>
                      <Text style={styles.stackTrace}>{this.state.errorInfo.componentStack}</Text>
                    </>
                  )}
                </ScrollView>
              )}
            </Card.Content>

            <Card.Actions style={styles.actions}>
              <Button mode='outlined' onPress={this.handleReload} style={styles.button}>
                {i18n.t('common.errorBoundary.retry')}
              </Button>
              <Button mode='contained' onPress={this.handleRestart} style={styles.button}>
                {i18n.t('common.errorBoundary.restart')}
              </Button>
            </Card.Actions>
          </Card>

          <View style={styles.supportInfo}>
            <Text style={styles.supportText}>{i18n.t('common.errorBoundary.supportText')}</Text>
            <Text style={styles.supportDetails}>
              • {i18n.t('common.errorBoundary.errorTime')}:{' '}
              {new Date().toLocaleString(i18n.language)}
            </Text>
            <Text style={styles.supportDetails}>
              • {i18n.t('common.errorBoundary.appVersion')}:{' '}
              {Constants.expoConfig?.version || '1.0.0'}
            </Text>
            {this.state.error && (
              <Text style={styles.supportDetails}>
                • {i18n.t('common.errorBoundary.errorCode')}: {this.state.error.name}
              </Text>
            )}
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
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    justifyContent: 'center',
  },
  errorCard: {
    marginBottom: theme.spacing.lg,
  },
  errorTitle: {
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    lineHeight: 24,
  },
  reportStatus: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: '#f0f0f0',
    borderRadius: theme.borderRadius.medium,
  },
  reportSentText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '500',
  },
  reportPendingText: {
    color: '#FF9800',
    fontSize: 12,
    fontWeight: '500',
  },
  errorDetails: {
    backgroundColor: '#f5f5f5',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    maxHeight: 200,
    marginBottom: theme.spacing.md,
  },
  errorDetailsTitle: {
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
    color: theme.colors.error,
  },
  errorText: {
    color: '#d32f2f',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: theme.spacing.sm,
  },
  stackTrace: {
    color: '#666',
    fontFamily: 'monospace',
    fontSize: 10,
    marginBottom: theme.spacing.sm,
  },
  actions: {
    justifyContent: 'space-around',
    paddingHorizontal: theme.spacing.md,
  },
  button: {
    flex: 1,
    marginHorizontal: theme.spacing.sm,
  },
  supportInfo: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  supportText: {
    fontWeight: '500',
    marginBottom: theme.spacing.sm,
    color: theme.colors.onSurface,
  },
  supportDetails: {
    fontSize: 12,
    color: theme.colors.onSurface,
    marginBottom: 2,
    fontFamily: 'monospace',
  },
});
