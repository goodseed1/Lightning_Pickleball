import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Text as PaperText, Card, Button, Switch, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../hooks/useTheme';
import { getLightningPickleballTheme } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import clubService from '../services/clubService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MyClubSettingsScreenRouteProp = RouteProp<Record<string, any>, 'MyClubSettings'>;

const MyClubSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<MyClubSettingsScreenRouteProp>();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const themeColors = getLightningPickleballTheme(theme);

  const { currentUser } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { clubId, clubName } = route.params as any;

  // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [chatNotifications, setChatNotifications] = useState(true);
  const [eventNotifications, setEventNotifications] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  // Smart screen state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userRole, setUserRole] = useState<any>(null);
  const [adminCount, setAdminCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!currentUser?.uid) return;

        const [role, count] = await Promise.all([
          clubService.getUserRoleInClub(clubId, currentUser.uid),
          clubService.getClubAdminCount(clubId),
        ]);

        setUserRole(role);
        setAdminCount(count);
      } catch (error) {
        console.error('Error fetching club data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clubId, currentUser?.uid]);

  const handleLeaveClub = async () => {
    // Check if user is the only admin
    if (userRole === 'admin' && adminCount <= 1) {
      Alert.alert(
        t('myClubSettings.alerts.cannotLeaveTitle'),
        t('myClubSettings.alerts.cannotLeaveMessage'),
        [{ text: t('myClubSettings.alerts.ok') }]
      );
      return;
    }

    const isAdmin = userRole === 'admin';
    const title = isAdmin
      ? t('myClubSettings.alerts.leaveAsAdminTitle')
      : t('myClubSettings.alerts.leaveClubTitle');

    const message = isAdmin
      ? t('myClubSettings.alerts.leaveAsAdminMessage', { clubName })
      : t('myClubSettings.alerts.leaveClubMessage', { clubName });

    Alert.alert(title, message, [
      { text: t('myClubSettings.alerts.cancel'), style: 'cancel' },
      {
        text: t('myClubSettings.alerts.leave'),
        style: 'destructive',
        onPress: async () => {
          try {
            setIsLeaving(true);

            await clubService.leaveClub(clubId);

            Alert.alert(
              t('myClubSettings.alerts.leftSuccessTitle'),
              t('myClubSettings.alerts.leftSuccessMessage'),
              [
                {
                  text: t('myClubSettings.alerts.ok'),
                  onPress: () => {
                    // Navigate back to MyClubs screen
                    const resetAction = CommonActions.reset({
                      index: 0,
                      routes: [
                        {
                          name: 'MainTabs',
                          params: {
                            screen: 'MyClubs',
                            params: {
                              screen: 'MyClubsList',
                            },
                          },
                        },
                      ],
                    });
                    navigation.dispatch(resetAction);
                  },
                },
              ]
            );
          } catch (error: unknown) {
            console.error('Club leave error:', error);
            Alert.alert(
              t('myClubSettings.alerts.error'),
              (error instanceof Error ? error.message : null) ||
                t('myClubSettings.alerts.leaveErrorMessage')
            );
          } finally {
            setIsLeaving(false);
          }
        },
      },
    ]);
  };

  const navigateToAdminDashboard = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigation.navigate as any)('ClubAdmin', { clubId, clubName, userRole: userRole || 'member' });
  };

  const renderDangerZone = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='small' color={themeColors.colors.primary} />
          <PaperText style={styles.loadingText}>{t('myClubSettings.loading')}</PaperText>
        </View>
      );
    }

    // Scenario 1: Regular member
    if (userRole !== 'admin') {
      return (
        <>
          <PaperText style={styles.dangerDescription}>
            {t('myClubSettings.dangerZone.memberDescription', { clubName })}
          </PaperText>

          <Button
            mode='contained'
            buttonColor={themeColors.colors.error}
            textColor='white'
            onPress={handleLeaveClub}
            loading={isLeaving}
            disabled={isLeaving}
            icon='exit-to-app'
          >
            {t('myClubSettings.dangerZone.leaveClubButton')}
          </Button>
        </>
      );
    }

    // Scenario 2: Admin with other admins
    if (userRole === 'admin' && adminCount > 1) {
      return (
        <>
          <PaperText style={styles.dangerDescription}>
            {t('myClubSettings.dangerZone.adminWithOthersDescription', {
              clubName,
              otherAdminCount: adminCount - 1,
            })}
          </PaperText>

          <Button
            mode='contained'
            buttonColor={themeColors.colors.error}
            textColor='white'
            onPress={handleLeaveClub}
            loading={isLeaving}
            disabled={isLeaving}
            icon='exit-to-app'
          >
            {t('myClubSettings.dangerZone.leaveClubAdminButton')}
          </Button>
        </>
      );
    }

    // Scenario 3: Sole admin (most critical)
    if (userRole === 'admin' && adminCount <= 1) {
      return (
        <>
          <PaperText style={styles.dangerDescription}>
            {t('myClubSettings.dangerZone.soleAdminDescription', { clubName })}
          </PaperText>

          <Button
            mode='contained'
            buttonColor={themeColors.colors.primary}
            textColor='white'
            onPress={navigateToAdminDashboard}
            icon='shield-account-outline'
          >
            {t('myClubSettings.dangerZone.goToManagementButton')}
          </Button>
        </>
      );
    }

    return null; // Fallback
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: themeColors.colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.colors.outline,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.colors.onSurface,
      flex: 1,
      textAlign: 'center',
    },
    headerSpacer: {
      width: 40,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    sectionCard: {
      marginBottom: 16,
      backgroundColor: themeColors.colors.surface,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: themeColors.colors.onSurface,
      marginBottom: 16,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
    },
    settingLabel: {
      fontSize: 16,
      color: themeColors.colors.onSurface,
    },
    settingDescription: {
      fontSize: 14,
      color: themeColors.colors.onSurfaceVariant,
      marginTop: 2,
    },
    dangerCard: {
      marginTop: 24,
      backgroundColor: themeColors.colors.errorContainer,
      borderWidth: 1,
      borderColor: themeColors.colors.error,
    },
    dangerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: themeColors.colors.onErrorContainer,
      marginBottom: 8,
    },
    dangerDescription: {
      fontSize: 14,
      color: themeColors.colors.onSurfaceVariant,
      marginBottom: 16,
      lineHeight: 20,
    },
    clubName: {
      fontWeight: 'bold',
      color: themeColors.colors.primary,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
    },
    loadingText: {
      marginLeft: 8,
      color: themeColors.colors.onSurfaceVariant,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name='arrow-back' size={24} color={themeColors.colors.onSurface} />
        </TouchableOpacity>
        <PaperText style={styles.headerTitle}>{t('myClubSettings.header')}</PaperText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* Notification Settings */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <PaperText style={styles.sectionTitle}>
              {t('myClubSettings.notificationSettings.title')}
            </PaperText>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <PaperText style={styles.settingLabel}>
                  {t('myClubSettings.notificationSettings.allNotifications')}
                </PaperText>
                <PaperText style={styles.settingDescription}>
                  {t('myClubSettings.notificationSettings.allNotificationsDesc')}
                </PaperText>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                color={themeColors.colors.primary}
              />
            </View>

            <Divider style={{ marginVertical: 8 }} />

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <PaperText style={styles.settingLabel}>
                  {t('myClubSettings.notificationSettings.chatNotifications')}
                </PaperText>
                <PaperText style={styles.settingDescription}>
                  {t('myClubSettings.notificationSettings.chatNotificationsDesc')}
                </PaperText>
              </View>
              <Switch
                value={chatNotifications}
                onValueChange={setChatNotifications}
                color={themeColors.colors.primary}
                disabled={!notificationsEnabled}
              />
            </View>

            <Divider style={{ marginVertical: 8 }} />

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <PaperText style={styles.settingLabel}>
                  {t('myClubSettings.notificationSettings.eventNotifications')}
                </PaperText>
                <PaperText style={styles.settingDescription}>
                  {t('myClubSettings.notificationSettings.eventNotificationsDesc')}
                </PaperText>
              </View>
              <Switch
                value={eventNotifications}
                onValueChange={setEventNotifications}
                color={themeColors.colors.primary}
                disabled={!notificationsEnabled}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Smart Danger Zone */}
        <Card style={styles.dangerCard}>
          <Card.Content>
            <PaperText style={styles.dangerTitle}>{t('myClubSettings.dangerZone.title')}</PaperText>
            {renderDangerZone()}
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MyClubSettingsScreen;
