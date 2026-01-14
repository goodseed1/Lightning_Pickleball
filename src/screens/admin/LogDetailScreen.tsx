/**
 * 📋 Log Detail Screen
 * 로그 상세 화면 - 인증 로그, 에러 로그, 성능 모니터링
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, RefreshControl } from 'react-native';
import { Appbar, Card, Text, ActivityIndicator, useTheme, Chip, Divider } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { collection, getDocs, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

type LogType = 'auth' | 'error' | 'performance';

type RouteParams = {
  LogDetail: {
    logType: LogType;
  };
};

interface LogEntry {
  id: string;
  type: string;
  message: string;
  timestamp: Date;
  userId?: string;
  userEmail?: string;
  details?: string;
  level?: 'info' | 'warning' | 'error';
}

const LogDetailScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'LogDetail'>>();
  const { t } = useTranslation();

  const logType = route.params?.logType || 'auth';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const getTitle = () => {
    switch (logType) {
      case 'auth':
        return t('admin.logs.authLogs', '인증 로그');
      case 'error':
        return t('admin.logs.errorLogs', '에러 로그');
      case 'performance':
        return t('admin.logs.performanceLogs', '성능 모니터링');
      default:
        return t('admin.logs.title', '로그');
    }
  };

  const getIcon = () => {
    switch (logType) {
      case 'auth':
        return '🔐';
      case 'error':
        return '⚠️';
      case 'performance':
        return '📊';
      default:
        return '📋';
    }
  };

  useEffect(() => {
    loadLogs();
  }, [logType]);

  const loadLogs = async () => {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const sevenDaysAgoTimestamp = Timestamp.fromDate(sevenDaysAgo);

      let fetchedLogs: LogEntry[] = [];

      if (logType === 'auth') {
        // Fetch auth logs from users collection (login activity)
        const usersSnapshot = await getDocs(
          query(collection(db, 'users'), orderBy('lastActiveAt', 'desc'), limit(50))
        );

        fetchedLogs = usersSnapshot.docs
          .filter(doc => doc.data().lastActiveAt)
          .map(doc => {
            const data = doc.data();
            const lastActive = data.lastActiveAt?.toDate() || new Date();
            return {
              id: doc.id,
              type: 'login',
              message: t('admin.logs.userActivity', '사용자 활동'),
              timestamp: lastActive,
              userId: doc.id,
              userEmail: data.email || data.displayName || t('common.unknown'),
              details: data.displayName
                ? `${data.displayName} (${data.email || 'No email'})`
                : data.email || t('common.unknownUser'),
              level: 'info' as const,
            };
          });

        // Also check for recent signups (createdAt)
        const recentSignups = await getDocs(
          query(
            collection(db, 'users'),
            where('createdAt', '>=', sevenDaysAgoTimestamp),
            orderBy('createdAt', 'desc'),
            limit(20)
          )
        );

        const signupLogs = recentSignups.docs.map(doc => {
          const data = doc.data();
          return {
            id: `signup-${doc.id}`,
            type: 'signup',
            message: t('admin.logs.newSignup', '신규 가입'),
            timestamp: data.createdAt?.toDate() || new Date(),
            userId: doc.id,
            userEmail: data.email || t('common.unknown'),
            details: data.displayName || data.email || 'New user',
            level: 'info' as const,
          };
        });

        fetchedLogs = [...fetchedLogs, ...signupLogs].sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
        );
      } else if (logType === 'error') {
        // Check if system_logs collection exists
        try {
          const errorLogsSnapshot = await getDocs(
            query(
              collection(db, 'system_logs'),
              where('level', '==', 'error'),
              orderBy('timestamp', 'desc'),
              limit(50)
            )
          );

          fetchedLogs = errorLogsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              type: data.type || 'error',
              message: data.message || t('common.unknownError'),
              timestamp: data.timestamp?.toDate() || new Date(),
              details: data.details || data.stack || '',
              level: 'error' as const,
            };
          });
        } catch {
          // If system_logs doesn't exist, show empty state
          fetchedLogs = [];
        }
      } else if (logType === 'performance') {
        // 🎯 [KIM FIX] Performance metrics from events (not unused 'matches' collection)
        try {
          // Get event creation stats
          const eventsSnapshot = await getDocs(
            query(
              collection(db, 'events'),
              where('createdAt', '>=', sevenDaysAgoTimestamp),
              orderBy('createdAt', 'desc'),
              limit(100)
            )
          );

          const matchCount = eventsSnapshot.size;

          // Get app stats
          const appStatsDoc = await getDocs(collection(db, '_internal'));
          let dau = 0;
          let totalUsers = 0;

          appStatsDoc.forEach(doc => {
            if (doc.id === 'appStats') {
              const data = doc.data();
              dau = data.dau || 0;
              totalUsers = data.totalUsers || 0;
            }
          });

          fetchedLogs = [
            {
              id: 'perf-dau',
              type: 'metric',
              message: t('admin.logs.dailyActiveUsers', '일일 활성 사용자 (DAU)'),
              timestamp: new Date(),
              details: `${dau} ${t('admin.logs.users', '명')}`,
              level: 'info' as const,
            },
            {
              id: 'perf-total',
              type: 'metric',
              message: t('admin.logs.totalUsers', '전체 사용자'),
              timestamp: new Date(),
              details: `${totalUsers} ${t('admin.logs.users', '명')}`,
              level: 'info' as const,
            },
            {
              id: 'perf-matches',
              type: 'metric',
              message: t('admin.logs.matchesCreated', '최근 7일 경기'),
              timestamp: new Date(),
              details: `${matchCount} ${t('admin.logs.games', '경기')}`,
              level: 'info' as const,
            },
          ];
        } catch {
          // If data loading fails, show empty state
          fetchedLogs = [];
        }
      }

      setLogs(fetchedLogs);
    } catch (error) {
      console.error('[LogDetail] Error loading logs:', error);
      setLogs([
        {
          id: 'error',
          type: 'error',
          message: t('admin.logs.loadError', '로그를 불러오는 중 오류가 발생했습니다'),
          timestamp: new Date(),
          level: 'error' as const,
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLogs();
  };

  const getLevelColor = (level?: string) => {
    switch (level) {
      case 'error':
        return '#f44336';
      case 'warning':
        return '#ff9800';
      default:
        return '#4caf50';
    }
  };

  const getTypeChipColor = (type: string) => {
    switch (type) {
      case 'login':
        return '#2196f3';
      case 'signup':
        return '#4caf50';
      case 'logout':
        return '#ff9800';
      case 'error':
        return '#f44336';
      case 'metric':
        return '#9c27b0';
      case 'status':
        return '#00bcd4';
      default:
        return colors.primary;
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('admin.logs.justNow', '방금 전');
    if (minutes < 60) return `${minutes}${t('admin.logs.minutesAgo', '분 전')}`;
    if (hours < 24) return `${hours}${t('admin.logs.hoursAgo', '시간 전')}`;
    if (days < 7) return `${days}${t('admin.logs.daysAgo', '일 전')}`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title={getTitle()} />
        </Appbar.Header>
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size='large' color={colors.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={`${getIcon()} ${getTitle()}`} />
        <Appbar.Action icon='refresh' onPress={onRefresh} />
      </Appbar.Header>

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Summary Card */}
        <Card
          style={[
            styles.summaryCard,
            { backgroundColor: colors.surface, borderColor: colors.outline },
          ]}
        >
          <Card.Content>
            <View style={styles.summaryHeader}>
              <Text style={{ fontSize: 24 }}>{getIcon()}</Text>
              <View style={styles.summaryText}>
                <Text style={[styles.summaryTitle, { color: colors.onSurface }]}>{getTitle()}</Text>
                <Text style={{ color: colors.onSurfaceVariant }}>
                  {logs.length} {t('admin.logs.entries', '개의 항목')}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Log Entries */}
        <Card
          style={[
            styles.logsCard,
            { backgroundColor: colors.surface, borderColor: colors.outline },
          ]}
        >
          <Card.Content>
            {logs.length === 0 ? (
              <Text style={{ color: colors.onSurfaceVariant, textAlign: 'center', padding: 20 }}>
                {t('admin.logs.noLogs', '표시할 로그가 없습니다')}
              </Text>
            ) : (
              logs.map((log, index) => (
                <View key={log.id}>
                  <View style={styles.logEntry}>
                    <View style={styles.logHeader}>
                      <Chip
                        compact
                        style={[styles.typeChip, { backgroundColor: getTypeChipColor(log.type) }]}
                        textStyle={{ color: '#fff', fontSize: 10 }}
                      >
                        {log.type.toUpperCase()}
                      </Chip>
                      <View
                        style={[
                          styles.levelIndicator,
                          { backgroundColor: getLevelColor(log.level) },
                        ]}
                      />
                    </View>
                    <Text style={[styles.logMessage, { color: colors.onSurface }]}>
                      {log.message}
                    </Text>
                    {log.details && (
                      <Text style={[styles.logDetails, { color: colors.onSurfaceVariant }]}>
                        {log.details}
                      </Text>
                    )}
                    <Text style={[styles.logTimestamp, { color: colors.onSurfaceVariant }]}>
                      {formatTimestamp(log.timestamp)}
                    </Text>
                  </View>
                  {index < logs.length - 1 && <Divider style={styles.divider} />}
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    marginLeft: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  logsCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    borderWidth: 1,
  },
  logEntry: {
    paddingVertical: 12,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  typeChip: {
    height: 20,
  },
  levelIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  logMessage: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  logDetails: {
    fontSize: 12,
    marginBottom: 4,
  },
  logTimestamp: {
    fontSize: 11,
  },
  divider: {
    marginVertical: 4,
  },
  bottomPadding: {
    height: 32,
  },
});

export default LogDetailScreen;
