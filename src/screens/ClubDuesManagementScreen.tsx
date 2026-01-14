import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Avatar,
  Switch,
  Chip,
  TextInput,
  HelperText,
} from 'react-native-paper';

import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import duesService from '../services/duesService';
import {
  ClubDuesSettings,
  MemberForDues,
  DuesPaymentSummary,
  UpdateDuesSettingsRequest,
  PaymentMethodInfo,
  DuesType,
  getCurrentPeriod,
  getPaymentStatusColor,
  getPaymentStatusText,
  calculateCollectionRate,
} from '../types/dues';

type TabType = 'settings' | 'status' | 'unpaid';

const ClubDuesManagementScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { currentLanguage, t } = useLanguage();
  const { currentUser } = useAuth();

  // Get params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { clubId, clubName } = route.params as any;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('settings');

  // Settings tab state
  const [duesSettings, setDuesSettings] = useState<ClubDuesSettings | null>(null);
  const [settingsForm, setSettingsForm] = useState({
    duesType: 'monthly' as DuesType,
    amount: '',
    currency: 'USD',
    dueDay: '5',
    gracePeriodDays: '10',
    paymentInstructions: '',
    paymentMethods: [] as PaymentMethodInfo[],
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Status tab state
  const [paymentSummary, setPaymentSummary] = useState<DuesPaymentSummary | null>(null);
  const [allMembers, setAllMembers] = useState<MemberForDues[]>([]);

  // Unpaid tab state
  const [unpaidMembers, setUnpaidMembers] = useState<MemberForDues[]>([]);
  const [sendingReminders, setSendingReminders] = useState(false);

  // Auto invoice toggle state
  const [autoInvoiceEnabled, setAutoInvoiceEnabled] = useState(false);
  const [togglingAutoInvoice, setTogglingAutoInvoice] = useState(false);

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const currentPeriod = getCurrentPeriod('monthly'); // Default to monthly

      if (activeTab === 'settings') {
        await loadDuesSettings();
      } else if (activeTab === 'status') {
        await Promise.all([loadPaymentSummary(currentPeriod), loadAllMembers(currentPeriod)]);
      } else if (activeTab === 'unpaid') {
        await loadUnpaidMembers(currentPeriod);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert(t('common.error'), t('clubDuesManagement.errors.loadData'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadDuesSettings = async () => {
    const settings = await duesService.getClubDuesSettings(clubId);
    setDuesSettings(settings);

    if (settings) {
      setSettingsForm({
        duesType: settings.duesType,
        amount: settings.amount.toString(),
        currency: settings.currency,
        dueDay: settings.dueDay.toString(),
        gracePeriodDays: settings.gracePeriodDays.toString(),
        paymentInstructions: settings.paymentInstructions,
        paymentMethods: settings.paymentMethods,
      });
      setAutoInvoiceEnabled(settings.autoInvoiceEnabled ?? false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loadPaymentSummary = async (period: any) => {
    const summary = await duesService.getDuesPaymentSummary(clubId, period);
    setPaymentSummary(summary);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loadAllMembers = async (period: any) => {
    const members = await duesService.getMembersWithDuesStatus(clubId, period);
    setAllMembers(members);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loadUnpaidMembers = async (period: any) => {
    const members = await duesService.getUnpaidMembers(clubId, period);
    setUnpaidMembers(members);
  };

  useEffect(() => {
    loadData();
  }, [clubId, activeTab, currentLanguage]);

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);

      // Validate form
      const amount = parseFloat(settingsForm.amount);
      const dueDay = parseInt(settingsForm.dueDay);
      const gracePeriodDays = parseInt(settingsForm.gracePeriodDays);

      if (isNaN(amount) || amount <= 0) {
        Alert.alert(
          t('clubDuesManagement.errors.inputError'),
          t('clubDuesManagement.errors.invalidAmount')
        );
        return;
      }

      if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
        Alert.alert(
          t('clubDuesManagement.errors.inputError'),
          t('clubDuesManagement.errors.invalidDueDay')
        );
        return;
      }

      const updateRequest: UpdateDuesSettingsRequest = {
        duesType: settingsForm.duesType,
        amount,
        currency: settingsForm.currency,
        dueDay,
        gracePeriodDays,
        paymentMethods: settingsForm.paymentMethods,
        paymentInstructions: settingsForm.paymentInstructions,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await duesService.updateDuesSettings(clubId, updateRequest, (currentUser as any).uid);

      Alert.alert(
        t('clubDuesManagement.success.settingsSaved'),
        t('clubDuesManagement.success.settingsSavedMessage')
      );

      await loadDuesSettings(); // Reload settings
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert(
        t('clubDuesManagement.errors.saveFailed'),
        t('clubDuesManagement.errors.saveError')
      );
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTogglePaymentStatus = async (member: MemberForDues) => {
    try {
      const currentPeriod = getCurrentPeriod('monthly');
      const isPaid = member.currentDuesStatus?.status === 'paid';

      if (isPaid) {
        await duesService.markAsUnpaid(
          clubId,
          member.userId,
          currentPeriod,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (currentUser as any).uid
        );
      } else {
        const amount = duesSettings?.amount || 0;

        await duesService.markAsPaid(
          clubId,
          {
            userId: member.userId,
            period: currentPeriod,
            paidAmount: amount,
            paidMethod: 'other',
            notes: 'Manually marked as paid',
          },
          (currentUser as any).uid // eslint-disable-line @typescript-eslint/no-explicit-any -- User type from AuthContext may not have uid property
        );
      }

      // Reload data
      await loadData(true);
    } catch (error) {
      console.error('Error toggling payment status:', error);
      Alert.alert(t('common.error'), t('clubDuesManagement.errors.updatePaymentStatus'));
    }
  };

  const handleSendReminders = async () => {
    try {
      setSendingReminders(true);

      const userIds = unpaidMembers.map(member => member.userId);
      const currentPeriod = getCurrentPeriod('monthly');

      await duesService.sendPaymentReminder({
        userIds,
        period: currentPeriod,
        message: t('clubDuesManagement.reminder.message', { clubName }),
      });

      Alert.alert(
        t('clubDuesManagement.success.remindersSent'),
        t('clubDuesManagement.success.remindersSentMessage', { count: userIds.length })
      );
    } catch (error) {
      console.error('Error sending reminders:', error);
      Alert.alert(
        t('clubDuesManagement.errors.sendRemindersFailed'),
        t('clubDuesManagement.errors.sendRemindersFailed')
      );
    } finally {
      setSendingReminders(false);
    }
  };

  const handleToggleAutoInvoice = async (value: boolean) => {
    try {
      setTogglingAutoInvoice(true);
      setAutoInvoiceEnabled(value);

      // Update settings in Firestore
      const updateRequest: UpdateDuesSettingsRequest = {
        duesType: settingsForm.duesType,
        amount: parseFloat(settingsForm.amount) || 0,
        currency: settingsForm.currency,
        dueDay: parseInt(settingsForm.dueDay) || 5,
        gracePeriodDays: parseInt(settingsForm.gracePeriodDays) || 10,
        paymentMethods: settingsForm.paymentMethods,
        paymentInstructions: settingsForm.paymentInstructions,
        autoInvoiceEnabled: value,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await duesService.updateDuesSettings(clubId, updateRequest, (currentUser as any).uid);

      Alert.alert(
        t('clubDuesManagement.autoInvoice.settingsUpdated'),
        value
          ? t('clubDuesManagement.autoInvoice.enabled')
          : t('clubDuesManagement.autoInvoice.disabled')
      );
    } catch (error) {
      console.error('Error toggling auto invoice:', error);
      setAutoInvoiceEnabled(!value); // Revert on error
      Alert.alert(t('common.error'), t('clubDuesManagement.errors.autoInvoiceError'));
    } finally {
      setTogglingAutoInvoice(false);
    }
  };

  const addPaymentMethod = () => {
    const newMethod: PaymentMethodInfo = {
      method: 'venmo',
      displayName: 'Venmo',
      isActive: true,
    };

    setSettingsForm({
      ...settingsForm,
      paymentMethods: [...settingsForm.paymentMethods, newMethod],
    });
  };

  const updatePaymentMethod = (index: number, updates: Partial<PaymentMethodInfo>) => {
    const updatedMethods = [...settingsForm.paymentMethods];
    updatedMethods[index] = { ...updatedMethods[index], ...updates };
    setSettingsForm({ ...settingsForm, paymentMethods: updatedMethods });
  };

  const removePaymentMethod = (index: number) => {
    const updatedMethods = settingsForm.paymentMethods.filter((_, i) => i !== index);
    setSettingsForm({ ...settingsForm, paymentMethods: updatedMethods });
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
        onPress={() => setActiveTab('settings')}
      >
        <Ionicons
          name='settings-outline'
          size={20}
          color={activeTab === 'settings' ? '#1976d2' : '#666'}
        />
        <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
          {t('clubDuesManagement.tabs.settings')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'status' && styles.activeTab]}
        onPress={() => setActiveTab('status')}
      >
        <Ionicons
          name='list-outline'
          size={20}
          color={activeTab === 'status' ? '#1976d2' : '#666'}
        />
        <Text style={[styles.tabText, activeTab === 'status' && styles.activeTabText]}>
          {t('clubDuesManagement.tabs.status')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'unpaid' && styles.activeTab]}
        onPress={() => setActiveTab('unpaid')}
      >
        <Ionicons
          name='warning-outline'
          size={20}
          color={activeTab === 'unpaid' ? '#1976d2' : '#666'}
        />
        <Text style={[styles.tabText, activeTab === 'unpaid' && styles.activeTabText]}>
          {t('clubDuesManagement.tabs.unpaid')}
        </Text>
        {unpaidMembers.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unpaidMembers.length}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderSettingsTab = () => (
    <ScrollView
      style={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />}
    >
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>{t('clubDuesManagement.settings.title')}</Title>

          {/* Dues Type */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{t('clubDuesManagement.settings.duesType')}</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  settingsForm.duesType === 'monthly' && styles.activeOption,
                ]}
                onPress={() => setSettingsForm({ ...settingsForm, duesType: 'monthly' })}
              >
                <Text
                  style={[
                    styles.optionText,
                    settingsForm.duesType === 'monthly' && styles.activeOptionText,
                  ]}
                >
                  {t('clubDuesManagement.settings.monthly')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  settingsForm.duesType === 'yearly' && styles.activeOption,
                ]}
                onPress={() => setSettingsForm({ ...settingsForm, duesType: 'yearly' })}
              >
                <Text
                  style={[
                    styles.optionText,
                    settingsForm.duesType === 'yearly' && styles.activeOptionText,
                  ]}
                >
                  {t('clubDuesManagement.settings.yearly')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Amount */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{t('clubDuesManagement.settings.amount')}</Text>
            <TextInput
              value={settingsForm.amount}
              onChangeText={text => setSettingsForm({ ...settingsForm, amount: text })}
              placeholder={t('clubDuesManagement.settings.amountPlaceholder')}
              keyboardType='numeric'
              mode='outlined'
              left={<TextInput.Affix text='$' />}
            />
          </View>

          {/* Due Day */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{t('clubDuesManagement.settings.dueDay')}</Text>
            <TextInput
              value={settingsForm.dueDay}
              onChangeText={text => setSettingsForm({ ...settingsForm, dueDay: text })}
              placeholder={t('clubDuesManagement.settings.dueDayPlaceholder')}
              keyboardType='numeric'
              mode='outlined'
              right={<TextInput.Affix text={t('clubDuesManagement.settings.dayUnit')} />}
            />
            <HelperText type='info'>{t('clubDuesManagement.settings.dueDayHelper')}</HelperText>
          </View>

          {/* Grace Period */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{t('clubDuesManagement.settings.gracePeriod')}</Text>
            <TextInput
              value={settingsForm.gracePeriodDays}
              onChangeText={text => setSettingsForm({ ...settingsForm, gracePeriodDays: text })}
              placeholder={t('clubDuesManagement.settings.gracePeriodPlaceholder')}
              keyboardType='numeric'
              mode='outlined'
              right={<TextInput.Affix text={t('clubDuesManagement.settings.daysUnit')} />}
            />
          </View>

          {/* Payment Instructions */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              {t('clubDuesManagement.settings.paymentInstructions')}
            </Text>
            <TextInput
              value={settingsForm.paymentInstructions}
              onChangeText={text => setSettingsForm({ ...settingsForm, paymentInstructions: text })}
              placeholder={t('clubDuesManagement.settings.paymentInstructionsPlaceholder')}
              mode='outlined'
              multiline
              numberOfLines={3}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Payment Methods */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title style={styles.cardTitle}>
              {t('clubDuesManagement.settings.paymentMethods')}
            </Title>
            <Button mode='outlined' onPress={addPaymentMethod} compact>
              {t('clubDuesManagement.settings.addMethod')}
            </Button>
          </View>

          {settingsForm.paymentMethods.map((method, index) => (
            <Card key={index} style={styles.methodCard}>
              <Card.Content>
                <View style={styles.methodHeader}>
                  <Text style={styles.methodTitle}>{method.displayName}</Text>
                  <TouchableOpacity onPress={() => removePaymentMethod(index)}>
                    <Ionicons name='close-circle' size={24} color='#f44336' />
                  </TouchableOpacity>
                </View>

                <TextInput
                  label={t('clubDuesManagement.settings.displayName')}
                  value={method.displayName}
                  onChangeText={text => updatePaymentMethod(index, { displayName: text })}
                  mode='outlined'
                  style={styles.methodInput}
                />

                <TextInput
                  label={t('clubDuesManagement.settings.accountInfo')}
                  value={method.accountInfo || ''}
                  onChangeText={text => updatePaymentMethod(index, { accountInfo: text })}
                  mode='outlined'
                  style={styles.methodInput}
                />

                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>{t('clubDuesManagement.settings.active')}</Text>
                  <Switch
                    value={method.isActive}
                    onValueChange={value => updatePaymentMethod(index, { isActive: value })}
                  />
                </View>
              </Card.Content>
            </Card>
          ))}

          {settingsForm.paymentMethods.length === 0 && (
            <View style={styles.emptyMethodsContainer}>
              <Ionicons name='card-outline' size={48} color='#ddd' />
              <Text style={styles.emptyMethodsText}>
                {t('clubDuesManagement.settings.addPaymentMethods')}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Save Button */}
      <View style={styles.actionContainer}>
        <Button
          mode='contained'
          onPress={handleSaveSettings}
          loading={savingSettings}
          disabled={savingSettings}
          style={styles.saveButton}
        >
          {t('clubDuesManagement.settings.saveSettings')}
        </Button>
      </View>
    </ScrollView>
  );

  const renderStatusTab = () => (
    <ScrollView
      style={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />}
    >
      {/* Summary Card */}
      {paymentSummary && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>{t('clubDuesManagement.status.summary')}</Title>

            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{paymentSummary.totalMembers}</Text>
                <Text style={styles.summaryLabel}>
                  {t('clubDuesManagement.status.totalMembers')}
                </Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: '#4caf50' }]}>
                  {paymentSummary.paidMembers}
                </Text>
                <Text style={styles.summaryLabel}>{t('clubDuesManagement.status.paid')}</Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: '#ff9800' }]}>
                  {paymentSummary.unpaidMembers}
                </Text>
                <Text style={styles.summaryLabel}>{t('clubDuesManagement.status.unpaid')}</Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: '#f44336' }]}>
                  {paymentSummary.overdueMembers}
                </Text>
                <Text style={styles.summaryLabel}>{t('clubDuesManagement.status.overdue')}</Text>
              </View>
            </View>

            <View style={styles.collectionRate}>
              <Text style={styles.collectionRateLabel}>
                {t('clubDuesManagement.status.collectionRate')}
              </Text>
              <Text style={styles.collectionRateValue}>
                {calculateCollectionRate(paymentSummary)}%
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Members List */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title style={[styles.cardTitle, styles.cardTitleNoMargin]}>
              {t('clubDuesManagement.status.memberPaymentStatus')}
            </Title>
            <View style={styles.autoInvoiceToggle}>
              <Text style={styles.autoInvoiceLabel}>
                {t('clubDuesManagement.status.autoInvoice')}
              </Text>
              <Switch
                value={autoInvoiceEnabled}
                onValueChange={handleToggleAutoInvoice}
                disabled={togglingAutoInvoice}
              />
            </View>
          </View>

          {allMembers.map(member => (
            <View key={member.userId} style={styles.memberItem}>
              <View style={styles.memberInfo}>
                <Avatar.Text
                  size={40}
                  label={member.displayName.charAt(0)}
                  style={styles.memberAvatar}
                />
                <View style={styles.memberDetails}>
                  <Text style={styles.memberName}>{member.displayName}</Text>
                  {member.email && <Text style={styles.memberEmail}>{member.email}</Text>}
                </View>
              </View>

              <View style={styles.memberActions}>
                <Chip
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor: getPaymentStatusColor(
                        member.currentDuesStatus?.status || 'unpaid'
                      ),
                    },
                  ]}
                  textStyle={styles.statusChipText}
                >
                  {getPaymentStatusText(
                    member.currentDuesStatus?.status || 'unpaid',
                    currentLanguage
                  )}
                </Chip>

                <Switch
                  value={member.currentDuesStatus?.status === 'paid'}
                  onValueChange={() => handleTogglePaymentStatus(member)}
                />
              </View>
            </View>
          ))}

          {allMembers.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name='people-outline' size={48} color='#ddd' />
              <Text style={styles.emptyText}>{t('clubDuesManagement.status.noMembers')}</Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );

  const renderUnpaidTab = () => (
    <ScrollView
      style={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />}
    >
      {/* Action Card */}
      {unpaidMembers.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.actionHeader}>
              <View>
                <Title style={styles.cardTitle}>{t('clubDuesManagement.unpaid.management')}</Title>
                <Paragraph style={styles.actionSubtitle}>
                  {t('clubDuesManagement.unpaid.count', { count: unpaidMembers.length })}
                </Paragraph>
              </View>

              <Button
                mode='contained'
                onPress={handleSendReminders}
                loading={sendingReminders}
                disabled={sendingReminders}
                style={styles.reminderButton}
              >
                {t('clubDuesManagement.unpaid.sendReminders')}
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Unpaid Members List */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>{t('clubDuesManagement.unpaid.list')}</Title>

          {unpaidMembers.map(member => (
            <View key={member.userId} style={styles.unpaidMemberItem}>
              <View style={styles.memberInfo}>
                <Avatar.Text
                  size={40}
                  label={member.displayName.charAt(0)}
                  style={[styles.memberAvatar, styles.unpaidAvatar]}
                />
                <View style={styles.memberDetails}>
                  <Text style={styles.memberName}>{member.displayName}</Text>
                  {member.email && <Text style={styles.memberEmail}>{member.email}</Text>}
                  <Text style={styles.unpaidInfo}>
                    {t('clubDuesManagement.unpaid.reminderCount', {
                      count: member.currentDuesStatus?.reminderCount || 0,
                    })}
                  </Text>
                </View>
              </View>

              <View style={styles.unpaidActions}>
                <TouchableOpacity
                  style={styles.markPaidButton}
                  onPress={() => handleTogglePaymentStatus(member)}
                >
                  <Ionicons name='checkmark-circle' size={24} color='#4caf50' />
                  <Text style={styles.markPaidText}>{t('clubDuesManagement.unpaid.markPaid')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {unpaidMembers.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name='checkmark-circle-outline' size={48} color='#4caf50' />
              <Text style={styles.emptyText}>{t('clubDuesManagement.unpaid.allPaid')}</Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#1976d2' />
          <Text style={styles.loadingText}>{t('clubDuesManagement.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name='arrow-back' size={24} color='#333' />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('clubDuesManagement.title')}</Text>
          <Text style={styles.headerSubtitle}>{clubName}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Tab Bar */}
      {renderTabBar()}

      {/* Tab Content */}
      {activeTab === 'settings' && renderSettingsTab()}
      {activeTab === 'status' && renderStatusTab()}
      {activeTab === 'unpaid' && renderUnpaidTab()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 6,
    position: 'relative',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#1976d2',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#1976d2',
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#f44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardTitleNoMargin: {
    marginBottom: 0,
  },
  autoInvoiceToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  autoInvoiceLabel: {
    fontSize: 14,
    color: '#666',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  activeOption: {
    borderColor: '#1976d2',
    backgroundColor: '#e3f2fd',
  },
  optionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeOptionText: {
    color: '#1976d2',
    fontWeight: '600',
  },
  methodCard: {
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  methodInput: {
    marginBottom: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontSize: 14,
    color: '#333',
  },
  emptyMethodsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyMethodsText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  actionContainer: {
    marginBottom: 32,
  },
  saveButton: {
    backgroundColor: '#1976d2',
    borderRadius: 8,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  collectionRate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 8,
  },
  collectionRateLabel: {
    fontSize: 16,
    color: '#333',
  },
  collectionRateValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  memberAvatar: {
    backgroundColor: '#1976d2',
  },
  unpaidAvatar: {
    backgroundColor: '#f44336',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  memberEmail: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusChip: {
    borderRadius: 16,
  },
  statusChipText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  reminderButton: {
    backgroundColor: '#ff9800',
  },
  unpaidMemberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  unpaidInfo: {
    fontSize: 12,
    color: '#ff9800',
    marginTop: 2,
  },
  unpaidActions: {
    alignItems: 'flex-end',
  },
  markPaidButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#f1f8e9',
  },
  markPaidText: {
    fontSize: 12,
    color: '#4caf50',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default ClubDuesManagementScreen;
