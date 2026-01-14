/**
 * 📋 System Log Screen
 * 시스템 로그 - 서버 로그, 에러 추적, 성능 모니터링
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, RefreshControl, Alert, Linking } from 'react-native';
import {
  Appbar,
  Card,
  Title,
  Text,
  List,
  ActivityIndicator,
  useTheme,
  Chip,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AdminStackParamList } from '../../navigation/AppNavigator';
import { collection, getDocs, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

interface SystemHealth {
  activeUsers24h: number;
  matchesCreated24h: number;
  errorsLogged: number;
  lastChecked: Date;
}

type NavigationProp = NativeStackNavigationProp<AdminStackParamList>;

const SystemLogScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [health, setHealth] = useState<SystemHealth>({
    activeUsers24h: 0,
    matchesCreated24h: 0,
    errorsLogged: 0,
    lastChecked: new Date(),
  });

  useEffect(() => {
    loadSystemHealth();
  }, []);

  const loadSystemHealth = async () => {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneDayAgoTimestamp = Timestamp.fromDate(oneDayAgo);

      // Get active users in last 24h
      const usersSnapshot = await getDocs(collection(db, 'users'));
      let activeUsers24h = 0;
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.lastActiveAt && data.lastActiveAt.toDate() >= oneDayAgo) {
          activeUsers24h++;
        }
      });

      // 🎯 [KIM FIX] Get events created in last 24h (not unused 'matches' collection)
      const eventsQuery = query(
        collection(db, 'events'),
        where('createdAt', '>=', oneDayAgoTimestamp),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      const eventsSnapshot = await getDocs(eventsQuery);

      setHealth({
        activeUsers24h,
        matchesCreated24h: eventsSnapshot.size,
        errorsLogged: 0, // Would need error logging collection
        lastChecked: new Date(),
      });
    } catch (error) {
      console.error('[SystemLog] Error loading health:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSystemHealth();
  };

  const getHealthStatusColor = () => {
    if (health.errorsLogged > 10) return '#f44336';
    if (health.errorsLogged > 0) return '#ff9800';
    return '#4caf50';
  };

  const getHealthStatusText = () => {
    if (health.errorsLogged > 10) return t('admin.logs.critical', '위험');
    if (health.errorsLogged > 0) return t('admin.logs.warning', '주의');
    return t('admin.logs.healthy', '정상');
  };

  const renderHealthCard = (title: string, value: number | string, icon: string, color: string) => (
    <Card
      style={[styles.healthCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}
    >
      <Card.Content style={styles.healthContent}>
        <Text style={{ fontSize: 24 }}>{icon}</Text>
        <Title style={[styles.healthValue, { color }]}>{value}</Title>
        <Text style={{ color: colors.onSurfaceVariant, fontSize: 11, textAlign: 'center' }}>
          {title}
        </Text>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title={t('admin.logs.title', '시스템 로그')} />
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
        <Appbar.Content title={t('admin.logs.title', '시스템 로그')} />
        <Appbar.Action icon='refresh' onPress={onRefresh} />
      </Appbar.Header>

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* System Status */}
        <Card
          style={[
            styles.statusCard,
            { backgroundColor: colors.surface, borderColor: colors.outline },
          ]}
        >
          <Card.Content>
            <View style={styles.statusHeader}>
              <Title>{t('admin.logs.systemStatus', '시스템 상태')}</Title>
              <Chip
                style={{ backgroundColor: getHealthStatusColor() }}
                textStyle={{ color: '#fff', fontWeight: 'bold' }}
              >
                {getHealthStatusText()}
              </Chip>
            </View>
            <Text style={{ color: colors.onSurfaceVariant, marginTop: 4 }}>
              {t('admin.logs.lastChecked', '마지막 확인')}:{' '}
              {health.lastChecked.toLocaleTimeString()}
            </Text>
          </Card.Content>
        </Card>

        {/* Health Metrics */}
        <View style={styles.healthGrid}>
          {renderHealthCard(
            t('admin.logs.activeUsers', '활성 사용자\n(24h)'),
            health.activeUsers24h,
            '👥',
            '#2196f3'
          )}
          {renderHealthCard(
            t('admin.logs.newMatches', '새 경기\n(24h)'),
            health.matchesCreated24h,
            '🎾',
            '#4caf50'
          )}
          {renderHealthCard(
            t('admin.logs.errors', '에러 로그'),
            health.errorsLogged,
            '⚠️',
            health.errorsLogged > 0 ? '#f44336' : '#4caf50'
          )}
        </View>

        {/* Log Categories */}
        <Card
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outline }]}
        >
          <List.Section>
            <List.Subheader>{t('admin.logs.categories', '로그 카테고리')}</List.Subheader>

            <List.Item
              title={t('admin.logs.functionLogs', 'Cloud Functions 로그')}
              description={t('admin.logs.functionLogsDesc', 'Firebase Console에서 확인')}
              left={props => <List.Icon {...props} icon='cloud' color='#2196f3' />}
              right={props => <List.Icon {...props} icon='open-in-new' />}
              onPress={() => {
                Alert.alert(
                  t('admin.logs.openConsole', 'Firebase Console 열기'),
                  t(
                    'admin.logs.openConsoleDesc',
                    'Firebase Console에서 Cloud Functions 로그를 확인하시겠습니까?'
                  ),
                  [
                    { text: t('common.cancel', '취소'), style: 'cancel' },
                    {
                      text: t('common.open', '열기'),
                      onPress: () => Linking.openURL('https://console.firebase.google.com/'),
                    },
                  ]
                );
              }}
            />

            <List.Item
              title={t('admin.logs.authLogs', '인증 로그')}
              description={t('admin.logs.authLogsDesc', '로그인, 가입, 탈퇴 이벤트')}
              left={props => <List.Icon {...props} icon='shield-account' color='#4caf50' />}
              right={props => <List.Icon {...props} icon='chevron-right' />}
              onPress={() => navigation.navigate('LogDetail', { logType: 'auth' })}
            />

            <List.Item
              title={t('admin.logs.errorLogs', '에러 로그')}
              description={t('admin.logs.errorLogsDesc', '앱 크래시, API 에러')}
              left={props => <List.Icon {...props} icon='alert-circle' color='#f44336' />}
              right={props => <List.Icon {...props} icon='chevron-right' />}
              onPress={() => navigation.navigate('LogDetail', { logType: 'error' })}
            />

            <List.Item
              title={t('admin.logs.performanceLogs', '성능 모니터링')}
              description={t('admin.logs.performanceLogsDesc', '앱 성능 지표')}
              left={props => <List.Icon {...props} icon='speedometer' color='#ff9800' />}
              right={props => <List.Icon {...props} icon='chevron-right' />}
              onPress={() => navigation.navigate('LogDetail', { logType: 'performance' })}
            />
          </List.Section>
        </Card>

        {/* Recent Activity */}
        <Card
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outline }]}
        >
          <Card.Content>
            <Title style={{ marginBottom: 12 }}>
              {t('admin.logs.recentActivity', '최근 활동')}
            </Title>
            <View style={styles.activityItem}>
              <Text style={{ fontSize: 12 }}>🟢</Text>
              <Text style={{ color: colors.onSurface, flex: 1, marginLeft: 8 }}>
                {t('admin.logs.systemNormal', '시스템이 정상 작동 중입니다')}
              </Text>
            </View>
            <View style={styles.activityItem}>
              <Text style={{ fontSize: 12 }}>📊</Text>
              <Text style={{ color: colors.onSurfaceVariant, flex: 1, marginLeft: 8 }}>
                {t('admin.logs.statsUpdated', '일일 통계가 자동으로 업데이트됩니다')}
              </Text>
            </View>
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
  statusCard: {
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthGrid: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  healthCard: {
    width: '31%',
    borderRadius: 12,
    borderWidth: 1,
  },
  healthContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  healthValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  card: {
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  bottomPadding: {
    height: 32,
  },
});

export default SystemLogScreen;
