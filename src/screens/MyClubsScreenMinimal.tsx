import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import AdminNotificationCard, {
  AdminNotification,
} from '../components/admin/AdminNotificationCard';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import clubService from '../services/clubService';

const MyClubsScreenMinimal = () => {
  const { t } = useTranslation();
  const { currentUser, loading: authLoading } = useAuth();
  // navigation is used in useFocusEffect callback - kept for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _navigation = useNavigation();
  // loading is used in useFocusEffect callback - kept for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_loading, setLoading] = useState(false);
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);

  // Add a sample notification for testing
  useEffect(() => {
    const sampleNotification: AdminNotification = {
      id: 'test-1',
      type: 'club_applications',
      clubId: 'test-club',
      clubName: 'Test Club',
      count: 3,
      priority: 'high',
      title: 'New club applications',
      description: 'You have 3 pending club applications to review.',
    };
    setAdminNotifications([sampleNotification]);
  }, []);

  // Test useFocusEffect like in original code
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 MyClubsScreenMinimal focused - testing focus effect');
      if (currentUser?.uid && !authLoading) {
        console.log('Focus effect: User found, would load clubs here');
        setLoading(true);
        // Simulate some async work
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      }
    }, [currentUser?.uid, authLoading])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('myClubs.minimalTitle')}</Text>
        <Text style={styles.description}>{t('myClubs.minimalDescription')}</Text>
        <Text style={styles.debugInfo}>
          {authLoading ? 'Loading...' : currentUser ? `User: ${currentUser.email}` : 'No user'}
        </Text>

        {/* Test AdminNotificationCard */}
        {adminNotifications.length > 0 && (
          <View style={styles.notificationsSection}>
            {adminNotifications.map(notification => (
              <AdminNotificationCard
                key={notification.id}
                notification={notification}
                onPress={() => console.log('Notification pressed')}
                onDismiss={() => console.log('Notification dismissed')}
              />
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  debugInfo: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
  },
  notificationsSection: {
    marginTop: 20,
    width: '100%',
  },
});

export default MyClubsScreenMinimal;
