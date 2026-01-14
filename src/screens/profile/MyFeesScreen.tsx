import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  // 🔒 [LEGAL REVIEW] Image import hidden until QR code legal compliance verified
  // Image,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button, Avatar, Chip, Divider, Portal, Modal } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import feeService from '../../services/feeService';
import { formatPriceByCurrencyCode } from '../../utils/currencyUtils';

interface RequiredPayment {
  id: string;
  clubId: string;
  clubName: string;
  type: 'join' | 'monthly' | 'yearly';
  amount: number;
  currency: 'USD' | 'KRW';
  dueDate: Date;
  isOverdue: boolean;
  gracePeriodDays: number;
}

interface PaymentHistoryItem {
  id: string;
  clubId: string;
  clubName: string;
  type: 'join' | 'monthly' | 'yearly';
  amount: number;
  currency: 'USD' | 'KRW';
  paidDate: Date;
  method: string;
  status: 'completed' | 'pending' | 'failed';
}

interface PaymentMethodInfo {
  accountInfo: string;
  qrCodeUrl?: string;
}

interface PaymentMethods {
  zelle?: PaymentMethodInfo;
  venmo?: PaymentMethodInfo;
  kakaopay?: PaymentMethodInfo;
}

const MyFeesScreen: React.FC = () => {
  const { user } = useAuth();

  const { t } = useLanguage();

  const [requiredPayments, setRequiredPayments] = useState<RequiredPayment[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Payment modal states
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<RequiredPayment | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethods>({});
  const [selectedMethod, setSelectedMethod] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadFeeData();
    }
  }, [user?.uid]);

  const loadFeeData = async (isRefresh = false) => {
    if (!user?.uid) return;

    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const feeStatus = await feeService.getMyFeeStatus(user.uid);
      setRequiredPayments(feeStatus.required);
      setPaymentHistory(feeStatus.history);
    } catch (error) {
      console.error('Error loading fee data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadFeeData(true);
  };

  // 🌍 화폐 코드로 가격 포맷팅
  const formatCurrency = (amount: number, currency: string): string => {
    return formatPriceByCurrencyCode(amount, currency);
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'join':
        return t('myFees.paymentTypes.join');
      case 'monthly':
        return t('myFees.paymentTypes.monthly');
      case 'yearly':
        return t('myFees.paymentTypes.yearly');
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4caf50';
      case 'pending':
        return '#ff9800';
      case 'failed':
        return '#f44336';
      default:
        return '#666';
    }
  };

  const handlePayment = async (payment: RequiredPayment) => {
    try {
      setSelectedPayment(payment);

      // Load payment methods for this club
      const methods = await feeService.getClubPaymentMethods(payment.clubId);
      setPaymentMethods(methods);

      // Reset selected method
      setSelectedMethod('');

      setPaymentModalVisible(true);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      Alert.alert(t('myFees.alerts.error'), t('myFees.alerts.loadMethodsError'));
    }
  };

  const handleCopyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert(t('myFees.alerts.copied'), t('myFees.alerts.copiedMessage', { label }));
  };

  const handleSubmitPayment = async () => {
    if (!selectedPayment || !selectedMethod || !user?.uid) {
      Alert.alert(t('myFees.alerts.selectMethodTitle'), t('myFees.alerts.selectMethodMessage'));
      return;
    }

    try {
      setIsSubmittingPayment(true);

      await feeService.markAsPendingConfirmation(
        selectedPayment.clubId,
        user.uid,
        selectedPayment.type,
        selectedPayment.amount,
        selectedPayment.currency,
        selectedMethod
      );

      setPaymentModalVisible(false);

      Alert.alert(t('myFees.alerts.paymentSubmitted'), t('myFees.alerts.paymentSubmittedMessage'));

      // Refresh the fee data
      await loadFeeData(true);
    } catch (error) {
      console.error('Error submitting payment:', error);
      Alert.alert(t('myFees.alerts.requestFailed'), t('myFees.alerts.requestFailedMessage'));
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const renderRequiredPaymentCard = (payment: RequiredPayment) => (
    <Card key={payment.id} style={[styles.paymentCard, payment.isOverdue && styles.overdueCard]}>
      <Card.Content>
        <View style={styles.paymentHeader}>
          <View style={styles.clubInfo}>
            <Avatar.Text
              size={40}
              label={payment.clubName.charAt(0)}
              style={[styles.clubAvatar, payment.isOverdue && styles.overdueAvatar]}
            />
            <View style={styles.clubDetails}>
              <Text style={styles.clubName}>{payment.clubName}</Text>
              <Text style={styles.paymentType}>{getPaymentTypeLabel(payment.type)}</Text>
            </View>
          </View>
          <View style={styles.amountContainer}>
            <Text style={[styles.amount, payment.isOverdue && styles.overdueAmount]}>
              {formatCurrency(payment.amount, payment.currency)}
            </Text>
            {payment.isOverdue && (
              <Chip style={styles.overdueChip} textStyle={styles.overdueChipText}>
                {t('myFees.status.overdue')}
              </Chip>
            )}
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.paymentFooter}>
          <View style={styles.dueDateContainer}>
            <Ionicons
              name='calendar-outline'
              size={16}
              color={payment.isOverdue ? '#f44336' : '#666'}
            />
            <Text style={[styles.dueDate, payment.isOverdue && styles.overdueDueDate]}>
              {t('myFees.labels.due')}: {payment.dueDate.toLocaleDateString()}
            </Text>
          </View>
          <Button
            mode='contained'
            onPress={() => handlePayment(payment)}
            style={[styles.payButton, payment.isOverdue && styles.overduePayButton]}
            buttonColor={payment.isOverdue ? '#f44336' : undefined}
          >
            {t('myFees.labels.payNow')}
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderHistoryItem = (item: PaymentHistoryItem) => (
    <View key={item.id} style={styles.historyItem}>
      <View style={styles.historyHeader}>
        <Avatar.Text size={32} label={item.clubName.charAt(0)} style={styles.historyAvatar} />
        <View style={styles.historyDetails}>
          <Text style={styles.historyClubName}>{item.clubName}</Text>
          <Text style={styles.historyType}>
            {getPaymentTypeLabel(item.type)} • {item.method}
          </Text>
          <Text style={styles.historyDate}>{item.paidDate.toLocaleDateString()}</Text>
        </View>
        <View style={styles.historyAmount}>
          <Text style={styles.historyAmountText}>{formatCurrency(item.amount, item.currency)}</Text>
          <Chip
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) + '20' }]}
            textStyle={[styles.statusChipText, { color: getStatusColor(item.status) }]}
          >
            {item.status === 'completed'
              ? t('myFees.status.completed')
              : item.status === 'pending'
                ? t('myFees.status.pending')
                : t('myFees.status.failed')}
          </Chip>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#1976d2' />
          <Text style={styles.loadingText}>{t('myFees.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        {/* Required Payments Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('myFees.sections.required')}</Text>
          {requiredPayments.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <View style={styles.emptyState}>
                  <Ionicons name='checkmark-circle-outline' size={48} color='#4caf50' />
                  <Text style={styles.emptyTitle}>{t('myFees.emptyStates.allPaidTitle')}</Text>
                  <Text style={styles.emptySubtitle}>
                    {t('myFees.emptyStates.allPaidSubtitle')}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ) : (
            requiredPayments.map(renderRequiredPaymentCard)
          )}
        </View>

        {/* Payment History Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('myFees.sections.history')}</Text>
          {paymentHistory.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <View style={styles.emptyState}>
                  <Ionicons name='receipt-outline' size={48} color='#ddd' />
                  <Text style={styles.emptyTitle}>{t('myFees.emptyStates.noHistoryTitle')}</Text>
                  <Text style={styles.emptySubtitle}>
                    {t('myFees.emptyStates.noHistorySubtitle')}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ) : (
            <Card style={styles.historyCard}>
              <Card.Content>
                {paymentHistory.map((item, index) => (
                  <View key={item.id}>
                    {renderHistoryItem(item)}
                    {index < paymentHistory.length - 1 && <Divider style={styles.historyDivider} />}
                  </View>
                ))}
              </Card.Content>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Payment Modal */}
      <Portal>
        <Modal
          visible={paymentModalVisible}
          onDismiss={() => setPaymentModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card style={styles.modalCard}>
            <Card.Content>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('myFees.modal.title')}</Text>
                <TouchableOpacity
                  onPress={() => setPaymentModalVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name='close' size={24} color='#666' />
                </TouchableOpacity>
              </View>

              {selectedPayment && (
                <View style={styles.paymentSummary}>
                  <Text style={styles.paymentSummaryText}>
                    {selectedPayment.clubName} • {getPaymentTypeLabel(selectedPayment.type)}
                  </Text>
                  <Text style={styles.paymentAmount}>
                    {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                  </Text>
                </View>
              )}

              <Divider style={styles.modalDivider} />

              <Text style={styles.methodSectionTitle}>{t('myFees.modal.selectMethod')}</Text>

              {/* Zelle Method */}
              {paymentMethods.zelle && (
                <TouchableOpacity
                  style={[
                    styles.methodButton,
                    selectedMethod === 'zelle' && styles.selectedMethodButton,
                  ]}
                  onPress={() => setSelectedMethod('zelle')}
                >
                  <View style={styles.methodButtonContent}>
                    <Ionicons name='card-outline' size={24} color='#1976d2' />
                    <View style={styles.methodButtonText}>
                      <Text style={styles.methodButtonTitle}>Zelle</Text>
                      <Text style={styles.methodButtonSubtitle}>
                        {paymentMethods.zelle?.accountInfo}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() =>
                        handleCopyToClipboard(paymentMethods.zelle?.accountInfo || '', 'Zelle ID')
                      }
                      style={styles.copyButton}
                    >
                      <Ionicons name='copy-outline' size={16} color='#666' />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )}

              {/* Venmo Method */}
              {paymentMethods.venmo && (
                <TouchableOpacity
                  style={[
                    styles.methodButton,
                    selectedMethod === 'venmo' && styles.selectedMethodButton,
                  ]}
                  onPress={() => setSelectedMethod('venmo')}
                >
                  <View style={styles.methodButtonContent}>
                    <Ionicons name='qr-code-outline' size={24} color='#3D95CE' />
                    <View style={styles.methodButtonText}>
                      <Text style={styles.methodButtonTitle}>Venmo</Text>
                      <Text style={styles.methodButtonSubtitle}>
                        {paymentMethods.venmo?.accountInfo || 'QR Code'}
                      </Text>
                    </View>
                  </View>
                  {/* 🔒 [LEGAL REVIEW] QR Code feature hidden until legal compliance verified
                  {selectedMethod === 'venmo' && paymentMethods.venmo?.qrCodeUrl && (
                    <View style={styles.qrCodeContainer}>
                      <Image
                        source={{ uri: paymentMethods.venmo.qrCodeUrl }}
                        style={styles.qrCodeImage}
                      />
                      <Text style={styles.qrCodeInstructions}>
                        {t('myFees.modal.qrInstructions.venmo')}
                      </Text>
                    </View>
                  )}
                  */}
                </TouchableOpacity>
              )}

              {/* Kakao Pay Method */}
              {paymentMethods.kakaopay && (
                <TouchableOpacity
                  style={[
                    styles.methodButton,
                    selectedMethod === 'kakaopay' && styles.selectedMethodButton,
                  ]}
                  onPress={() => setSelectedMethod('kakaopay')}
                >
                  <View style={styles.methodButtonContent}>
                    <Ionicons name='qr-code-outline' size={24} color='#FEE500' />
                    <View style={styles.methodButtonText}>
                      <Text style={styles.methodButtonTitle}>Kakao Pay</Text>
                      <Text style={styles.methodButtonSubtitle}>
                        {paymentMethods.kakaopay?.accountInfo || 'QR Code'}
                      </Text>
                    </View>
                  </View>
                  {/* 🔒 [LEGAL REVIEW] QR Code feature hidden until legal compliance verified
                  {selectedMethod === 'kakaopay' && paymentMethods.kakaopay?.qrCodeUrl && (
                    <View style={styles.qrCodeContainer}>
                      <Image
                        source={{ uri: paymentMethods.kakaopay.qrCodeUrl }}
                        style={styles.qrCodeImage}
                      />
                      <Text style={styles.qrCodeInstructions}>
                        {t('myFees.modal.qrInstructions.kakaopay')}
                      </Text>
                    </View>
                  )}
                  */}
                </TouchableOpacity>
              )}

              {Object.keys(paymentMethods).length === 0 && (
                <View style={styles.noMethodsContainer}>
                  <Ionicons name='card-outline' size={48} color='#ddd' />
                  <Text style={styles.noMethodsText}>{t('myFees.modal.noMethods')}</Text>
                </View>
              )}

              <Divider style={styles.modalDivider} />

              <Button
                mode='contained'
                onPress={handleSubmitPayment}
                loading={isSubmittingPayment}
                disabled={isSubmittingPayment || !selectedMethod}
                style={styles.submitPaymentButton}
                icon='check-circle'
              >
                {t('myFees.modal.submitButton')}
              </Button>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  paymentCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  overdueCard: {
    borderColor: '#f44336',
    borderWidth: 1,
    backgroundColor: '#ffebee',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clubAvatar: {
    backgroundColor: '#1976d2',
    marginRight: 12,
  },
  overdueAvatar: {
    backgroundColor: '#f44336',
  },
  clubDetails: {
    flex: 1,
  },
  clubName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentType: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  overdueAmount: {
    color: '#f44336',
  },
  overdueChip: {
    marginTop: 4,
    backgroundColor: '#ffebee',
  },
  overdueChipText: {
    fontSize: 10,
    color: '#f44336',
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 12,
  },
  paymentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDate: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  overdueDueDate: {
    color: '#f44336',
    fontWeight: '500',
  },
  payButton: {
    borderRadius: 8,
  },
  overduePayButton: {
    backgroundColor: '#f44336',
  },
  emptyCard: {
    borderRadius: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  historyCard: {
    borderRadius: 12,
  },
  historyItem: {
    paddingVertical: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyAvatar: {
    backgroundColor: '#1976d2',
    marginRight: 12,
  },
  historyDetails: {
    flex: 1,
  },
  historyClubName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  historyType: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  historyDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  historyAmount: {
    alignItems: 'flex-end',
  },
  historyAmountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusChip: {
    marginTop: 4,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '500',
  },
  historyDivider: {
    marginTop: 12,
  },
  // Modal Styles
  modalContainer: {
    padding: 20,
    justifyContent: 'center',
  },
  modalCard: {
    borderRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 8,
  },
  paymentSummary: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  paymentSummaryText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  paymentAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  modalDivider: {
    marginVertical: 16,
  },
  methodSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  methodButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  selectedMethodButton: {
    borderColor: '#1976d2',
    backgroundColor: '#e3f2fd',
  },
  methodButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  methodButtonText: {
    flex: 1,
    marginLeft: 12,
  },
  methodButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  methodButtonSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  copyButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
  },
  qrCodeContainer: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  qrCodeImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  qrCodeInstructions: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noMethodsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noMethodsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  submitPaymentButton: {
    marginTop: 8,
    borderRadius: 12,
  },
});

export default MyFeesScreen;
