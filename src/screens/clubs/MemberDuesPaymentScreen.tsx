/**
 * MemberDuesPaymentScreen - 회원용 회비 납부 요청 화면
 * 일반 회원이 자신의 미납 회비를 확인하고 납부 요청을 할 수 있는 화면
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Text, Card, Button, Chip, Divider, IconButton, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc } from 'firebase/firestore';

import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../hooks/useTheme';
import { getLightningTennisTheme } from '../../theme';
import duesService from '../../services/duesService';
import { db, storage } from '../../firebase/config';
import { formatPriceByCountry } from '../../utils/currencyUtils';
import {
  MemberDuesRecord,
  PaymentMethod,
  getDuesTypeText,
  getExtendedPaymentStatusColor,
  getExtendedPaymentStatusText,
} from '../../types/dues';

type RootStackParamList = {
  MemberDuesPayment: { clubId: string; clubName: string };
};

type MemberDuesPaymentScreenRouteProp = RouteProp<RootStackParamList, 'MemberDuesPayment'>;

interface ClubSettings {
  membershipFee?: number;
  quarterlyFee?: number;
  joinFee?: number;
  yearlyFee?: number;
  dueDate?: number;
  lateFee?: number;
  gracePeriod?: number;
  paymentMethods?: string[];
  paymentQRCodes?: Record<string, string>;
  paymentInstructions?: string;
}

type PaymentAmountType = 'monthly' | 'quarterly' | 'yearly' | 'custom';

const MemberDuesPaymentScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<MemberDuesPaymentScreenRouteProp>();
  const { currentUser } = useAuth();
  const { t, currentLanguage } = useLanguage();
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningTennisTheme(currentTheme);
  const styles = createStyles(themeColors.colors);
  const { clubId, clubName } = route.params;

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [myDuesRecords, setMyDuesRecords] = useState<MemberDuesRecord[]>([]);
  const [clubSettings, setClubSettings] = useState<ClubSettings | null>(null);
  const [showPaymentRequestDialog, setShowPaymentRequestDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MemberDuesRecord | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('venmo');
  const [proofImageUri, setProofImageUri] = useState<string>('');
  const [requestNotes, setRequestNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentAmountType, setPaymentAmountType] = useState<PaymentAmountType>('monthly');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQRUrl, setSelectedQRUrl] = useState<string>('');
  const [selectedQRMethod, setSelectedQRMethod] = useState<string>('');
  const [paidDate, setPaidDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  // Load data
  useEffect(() => {
    loadData();

    // Subscribe to my dues records
    if (currentUser?.uid) {
      const unsubscribe = duesService.subscribeToMemberDuesRecords(
        clubId,
        currentUser.uid,
        records => {
          setMyDuesRecords(records);
        }
      );
      return () => unsubscribe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId, currentUser?.uid]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load club settings
      const clubRef = doc(db, 'tennis_clubs', clubId);
      const clubSnap = await getDoc(clubRef);

      if (clubSnap.exists()) {
        const data = clubSnap.data();
        setClubSettings(data.settings || {});
      }

      // Load my dues records
      if (currentUser?.uid) {
        const records = await duesService.getMemberAllDuesRecords(clubId, currentUser.uid);
        setMyDuesRecords(records);
      }
    } catch (error) {
      console.error('Error loading dues data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🌍 국가별 화폐로 가격 포맷팅
  const userCountry = currentUser?.profile?.location?.country;
  const formatCurrency = (amount: number): string => {
    return formatPriceByCountry(amount, userCountry);
  };

  // Open payment request dialog
  const openPaymentRequest = (record: MemberDuesRecord) => {
    setSelectedRecord(record);
    setSelectedPaymentMethod('venmo');
    setProofImageUri('');
    setRequestNotes('');
    setPaymentAmountType('monthly');
    setCustomAmount('');
    setPaidDate(new Date()); // 오늘 날짜로 초기화
    setShowPaymentRequestDialog(true);
  };

  // Get the actual payment amount based on selection
  const getPaymentAmount = (): number => {
    if (paymentAmountType === 'monthly') {
      return clubSettings?.membershipFee || selectedRecord?.amount || 0;
    } else if (paymentAmountType === 'quarterly') {
      return clubSettings?.quarterlyFee || 0;
    } else if (paymentAmountType === 'yearly') {
      return clubSettings?.yearlyFee || 0;
    } else {
      return parseInt(customAmount, 10) || 0;
    }
  };

  // Get payment amount type label
  const getPaymentTypeLabel = (type: PaymentAmountType): string => {
    if (type === 'monthly') {
      return t('memberDuesPayment.monthly');
    } else if (type === 'quarterly') {
      return t('memberDuesPayment.quarterly');
    } else if (type === 'yearly') {
      return t('memberDuesPayment.yearly');
    } else {
      return t('memberDuesPayment.custom');
    }
  };

  // Pick proof image
  const pickProofImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProofImageUri(result.assets[0].uri);
    }
  };

  // Upload proof image
  const uploadProofImage = async (): Promise<string | undefined> => {
    if (!proofImageUri || !currentUser?.uid || !selectedRecord) return undefined;

    try {
      const response = await fetch(proofImageUri);
      const blob = await response.blob();
      const filename = `payment_proofs/${clubId}/${currentUser.uid}/${selectedRecord.id}_${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error uploading proof image:', error);
      return undefined;
    }
  };

  // Submit payment request
  const handleSubmitPaymentRequest = async () => {
    if (!selectedRecord || !currentUser?.uid) return;

    try {
      setIsSubmitting(true);

      // Upload proof image if provided
      let proofImageUrl: string | undefined;
      if (proofImageUri) {
        proofImageUrl = await uploadProofImage();
      }

      // Submit payment request
      await duesService.requestPaymentApproval(
        selectedRecord.id,
        currentUser.uid,
        selectedPaymentMethod,
        proofImageUrl,
        requestNotes || undefined,
        getPaymentAmount(),
        paymentAmountType,
        paidDate // 납부일 추가
      );

      Alert.alert(
        t('memberDuesPayment.requestSubmitted'),
        t('memberDuesPayment.requestSubmittedMessage')
      );

      setShowPaymentRequestDialog(false);
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error submitting payment request:', error);
      Alert.alert(t('memberDuesPayment.error'), t('memberDuesPayment.errorMessage'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔒 [LEGAL REVIEW] Show QR code modal - hidden until legal compliance verified
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const showQR = (method: string, url: string) => {
    setSelectedQRMethod(method);
    setSelectedQRUrl(url);
    setShowQRModal(true);
  };

  // Get unpaid records
  const unpaidRecords = myDuesRecords.filter(r => r.status === 'unpaid' || r.status === 'overdue');

  // Get pending approval records
  const pendingRecords = myDuesRecords.filter(r => r.status === 'pending_approval');

  // Get paid records
  const paidRecords = myDuesRecords.filter(r => r.status === 'paid');

  // Calculate total owed
  const totalOwed = unpaidRecords.reduce((sum, r) => sum + r.amount, 0);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <IconButton icon='arrow-left' size={24} onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>{t('memberDuesPayment.title')}</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={themeColors.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon='arrow-left' size={24} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>{t('memberDuesPayment.title')}</Text>
        <IconButton icon='refresh' size={24} onPress={loadData} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Club Name */}
        <Text style={styles.clubName}>{clubName}</Text>

        {/* Disclaimer Notice */}
        <View style={styles.disclaimerCard}>
          <Ionicons name='information-circle' size={20} color={themeColors.colors.primary} />
          <Text style={styles.disclaimerText}>{t('memberDuesPayment.disclaimer')}</Text>
        </View>

        {/* Summary Card */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{t('memberDuesPayment.totalOwed')}</Text>
                <Text
                  style={[styles.summaryValue, { color: totalOwed > 0 ? '#f44336' : '#4caf50' }]}
                >
                  {formatCurrency(totalOwed)}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{t('memberDuesPayment.pending')}</Text>
                <Text style={[styles.summaryValue, { color: '#2196f3' }]}>
                  {pendingRecords.length}
                  {t('duesManagement.countSuffix')}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Unpaid Dues Section */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>
              {t('memberDuesPayment.unpaidDues')} ({unpaidRecords.length})
            </Text>

            {unpaidRecords.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name='checkmark-circle' size={48} color='#4caf50' />
                <Text style={styles.emptyText}>{t('memberDuesPayment.noDues')}</Text>
              </View>
            ) : (
              unpaidRecords.map(record => (
                <View key={record.id} style={styles.duesItem}>
                  <View style={styles.duesItemInfo}>
                    <Text style={styles.duesType}>
                      {getDuesTypeText(record.duesType, currentLanguage)}
                    </Text>
                    {record.period && (
                      <Text style={styles.duesPeriod}>
                        {record.period.year}
                        {record.period.month &&
                          `-${record.period.month}${t('memberDuesPayment.month')}`}
                      </Text>
                    )}
                    <Chip
                      compact
                      style={[
                        styles.statusChip,
                        { backgroundColor: getExtendedPaymentStatusColor(record.status) + '20' },
                      ]}
                      textStyle={[
                        styles.statusChipText,
                        { color: getExtendedPaymentStatusColor(record.status) },
                      ]}
                    >
                      {getExtendedPaymentStatusText(record.status, currentLanguage)}
                    </Chip>
                    {/* Show rejection reason if exists */}
                    {record.rejectedReason && (
                      <View style={styles.rejectionReasonContainer}>
                        <Ionicons name='alert-circle' size={14} color='#f44336' />
                        <Text style={styles.rejectionReasonText}>
                          {t('memberDuesPayment.rejectionReason')}
                          {record.rejectedReason}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.duesItemAction}>
                    <Text style={styles.duesAmount}>{formatCurrency(record.amount)}</Text>
                    <Button
                      mode='contained'
                      compact
                      onPress={() => openPaymentRequest(record)}
                      style={styles.payButton}
                    >
                      {t('memberDuesPayment.pay')}
                    </Button>
                  </View>
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        {/* Pending Approval Section */}
        {pendingRecords.length > 0 && (
          <Card style={[styles.sectionCard, { borderColor: '#2196f3', borderWidth: 1 }]}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: '#2196f3' }]}>
                {t('memberDuesPayment.pendingApproval')} ({pendingRecords.length})
              </Text>

              {pendingRecords.map(record => (
                <View key={record.id} style={styles.duesItem}>
                  <View style={styles.duesItemInfo}>
                    <Text style={styles.duesType}>
                      {getDuesTypeText(record.duesType, currentLanguage)}
                    </Text>
                    {record.paymentRequestedMethod && (
                      <Text style={styles.duesPeriod}>
                        {record.paymentRequestedMethod.toUpperCase()}
                      </Text>
                    )}
                    <Chip
                      compact
                      style={[styles.statusChip, { backgroundColor: '#2196f320' }]}
                      textStyle={[styles.statusChipText, { color: '#2196f3' }]}
                    >
                      {t('memberDuesPayment.pending')}
                    </Chip>
                  </View>
                  <View style={styles.duesItemAction}>
                    <Text style={styles.duesAmount}>{formatCurrency(record.amount)}</Text>
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Paid Dues Section */}
        {paidRecords.length > 0 && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>
                {t('memberDuesPayment.paid')} ({paidRecords.length})
              </Text>

              {paidRecords.slice(0, 5).map(record => (
                <View key={record.id} style={styles.duesItem}>
                  <View style={styles.duesItemInfo}>
                    <Text style={styles.duesType}>
                      {getDuesTypeText(record.duesType, currentLanguage)}
                    </Text>
                    {record.paidAt && (
                      <Text style={styles.duesPeriod}>
                        {record.paidAt.toDate().toLocaleDateString()}
                      </Text>
                    )}
                    <Chip
                      compact
                      style={[styles.statusChip, { backgroundColor: '#4caf5020' }]}
                      textStyle={[styles.statusChipText, { color: '#4caf50' }]}
                    >
                      {t('memberDuesPayment.paid')}
                    </Chip>
                  </View>
                  <View style={styles.duesItemAction}>
                    <Text style={[styles.duesAmount, { color: '#4caf50' }]}>
                      {formatCurrency(record.amount)}
                    </Text>
                  </View>
                </View>
              ))}

              {paidRecords.length > 5 && (
                <Text style={styles.moreText}>
                  +{paidRecords.length - 5} {t('memberDuesPayment.more')}
                </Text>
              )}
            </Card.Content>
          </Card>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Payment Request Dialog */}
      <Modal visible={showPaymentRequestDialog} transparent animationType='slide'>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('memberDuesPayment.paymentRequest')}</Text>
              <IconButton
                icon='close'
                size={24}
                onPress={() => setShowPaymentRequestDialog(false)}
              />
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedRecord && (
                <>
                  {/* Payment Amount Type Selection */}
                  <Text style={styles.inputLabel}>
                    {t('memberDuesPayment.selectPaymentAmount')}
                  </Text>
                  <View style={styles.paymentTypeSelector}>
                    <TouchableOpacity
                      style={[
                        styles.paymentTypeOption,
                        paymentAmountType === 'monthly' && styles.paymentTypeOptionSelected,
                      ]}
                      onPress={() => setPaymentAmountType('monthly')}
                    >
                      <Text
                        style={[
                          styles.paymentTypeLabel,
                          paymentAmountType === 'monthly' && styles.paymentTypeLabelSelected,
                        ]}
                      >
                        {t('memberDuesPayment.monthly')}
                      </Text>
                      <Text
                        style={[
                          styles.paymentTypeAmount,
                          paymentAmountType === 'monthly' && styles.paymentTypeLabelSelected,
                        ]}
                      >
                        {formatCurrency(clubSettings?.membershipFee || selectedRecord.amount)}
                      </Text>
                    </TouchableOpacity>

                    {clubSettings?.quarterlyFee && clubSettings.quarterlyFee > 0 && (
                      <TouchableOpacity
                        style={[
                          styles.paymentTypeOption,
                          paymentAmountType === 'quarterly' && styles.paymentTypeOptionSelected,
                        ]}
                        onPress={() => setPaymentAmountType('quarterly')}
                      >
                        <Text
                          style={[
                            styles.paymentTypeLabel,
                            paymentAmountType === 'quarterly' && styles.paymentTypeLabelSelected,
                          ]}
                        >
                          {t('memberDuesPayment.quarterly')}
                        </Text>
                        <Text
                          style={[
                            styles.paymentTypeAmount,
                            paymentAmountType === 'quarterly' && styles.paymentTypeLabelSelected,
                          ]}
                        >
                          {formatCurrency(clubSettings.quarterlyFee)}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {clubSettings?.yearlyFee && clubSettings.yearlyFee > 0 && (
                      <TouchableOpacity
                        style={[
                          styles.paymentTypeOption,
                          paymentAmountType === 'yearly' && styles.paymentTypeOptionSelected,
                        ]}
                        onPress={() => setPaymentAmountType('yearly')}
                      >
                        <Text
                          style={[
                            styles.paymentTypeLabel,
                            paymentAmountType === 'yearly' && styles.paymentTypeLabelSelected,
                          ]}
                        >
                          {t('memberDuesPayment.yearly')}
                        </Text>
                        <Text
                          style={[
                            styles.paymentTypeAmount,
                            paymentAmountType === 'yearly' && styles.paymentTypeLabelSelected,
                          ]}
                        >
                          {formatCurrency(clubSettings.yearlyFee)}
                        </Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={[
                        styles.paymentTypeOption,
                        paymentAmountType === 'custom' && styles.paymentTypeOptionSelected,
                      ]}
                      onPress={() => setPaymentAmountType('custom')}
                    >
                      <Text
                        style={[
                          styles.paymentTypeLabel,
                          paymentAmountType === 'custom' && styles.paymentTypeLabelSelected,
                        ]}
                      >
                        {t('memberDuesPayment.custom')}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Custom Amount Input */}
                  {paymentAmountType === 'custom' && (
                    <TextInput
                      value={customAmount}
                      onChangeText={setCustomAmount}
                      mode='outlined'
                      keyboardType='numeric'
                      placeholder={t('memberDuesPayment.enterAmount')}
                      left={<TextInput.Affix text='$' />}
                      style={styles.customAmountInput}
                    />
                  )}

                  {/* Display selected amount */}
                  <View style={styles.recordInfo}>
                    <Text style={styles.recordType}>{getPaymentTypeLabel(paymentAmountType)}</Text>
                    <Text style={styles.recordAmount}>{formatCurrency(getPaymentAmount())}</Text>
                  </View>

                  <Divider style={styles.modalDivider} />

                  {/* Payment Date Selection */}
                  <Text style={styles.inputLabel}>{t('memberDuesPayment.paymentDate')}</Text>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Ionicons
                      name='calendar-outline'
                      size={20}
                      color={themeColors.colors.primary}
                    />
                    <Text style={styles.datePickerButtonText}>
                      {paidDate.toLocaleDateString(currentLanguage === 'ko' ? 'ko-KR' : 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                    <Ionicons
                      name='chevron-down'
                      size={16}
                      color={themeColors.colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>

                  {showDatePicker && (
                    <>
                      <DateTimePicker
                        value={paidDate}
                        mode='date'
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        maximumDate={new Date()} // 미래 날짜 선택 불가
                        onChange={(event, date) => {
                          if (Platform.OS === 'android') {
                            setShowDatePicker(false);
                          }
                          if (date) {
                            setPaidDate(date);
                          }
                        }}
                      />
                      {Platform.OS === 'ios' && (
                        <Button
                          mode='text'
                          onPress={() => setShowDatePicker(false)}
                          style={styles.datePickerCloseButton}
                        >
                          {t('memberDuesPayment.confirm')}
                        </Button>
                      )}
                    </>
                  )}

                  <Divider style={styles.modalDivider} />

                  {/* Payment Method Selection */}
                  <Text style={styles.inputLabel}>{t('memberDuesPayment.paymentMethod')}</Text>
                  <View style={styles.paymentMethodSelector}>
                    {[
                      ...new Set([
                        ...(clubSettings?.paymentMethods || []),
                        'cash', // 현금은 항상 포함
                      ]),
                    ].map(method => (
                      <Chip
                        key={method}
                        selected={selectedPaymentMethod === method}
                        onPress={() => setSelectedPaymentMethod(method as PaymentMethod)}
                        style={styles.methodChip}
                      >
                        {method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' ')}
                      </Chip>
                    ))}
                  </View>

                  {/* 🔒 [LEGAL REVIEW] QR Code feature hidden until legal compliance verified
                  {clubSettings?.paymentQRCodes?.[selectedPaymentMethod] && (
                    <TouchableOpacity
                      style={styles.qrPreview}
                      onPress={() =>
                        showQR(
                          selectedPaymentMethod,
                          clubSettings.paymentQRCodes![selectedPaymentMethod]
                        )
                      }
                    >
                      <Image
                        source={{ uri: clubSettings.paymentQRCodes[selectedPaymentMethod] }}
                        style={styles.qrPreviewImage}
                        resizeMode='contain'
                      />
                      <Text style={styles.qrPreviewText}>{t('memberDuesPayment.viewQRCode')}</Text>
                    </TouchableOpacity>
                  )}
                  */}

                  <Divider style={styles.modalDivider} />

                  {/* Proof Image */}
                  <Text style={styles.inputLabel}>{t('memberDuesPayment.paymentProof')}</Text>
                  <TouchableOpacity style={styles.imagePicker} onPress={pickProofImage}>
                    {proofImageUri ? (
                      <Image source={{ uri: proofImageUri }} style={styles.proofImage} />
                    ) : (
                      <View style={styles.imagePickerPlaceholder}>
                        <Ionicons name='camera-outline' size={32} color='#666' />
                        <Text style={styles.imagePickerText}>
                          {t('memberDuesPayment.addScreenshot')}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Notes */}
                  <Text style={styles.inputLabel}>{t('memberDuesPayment.notes')}</Text>
                  <TextInput
                    value={requestNotes}
                    onChangeText={setRequestNotes}
                    mode='outlined'
                    multiline
                    numberOfLines={3}
                    placeholder={t('memberDuesPayment.enterAdditionalInfo')}
                    style={styles.notesInput}
                  />
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                mode='outlined'
                onPress={() => setShowPaymentRequestDialog(false)}
                style={styles.modalButton}
                disabled={isSubmitting}
              >
                {t('memberDuesPayment.cancel')}
              </Button>
              <Button
                mode='contained'
                onPress={handleSubmitPaymentRequest}
                style={styles.modalButton}
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                {t('memberDuesPayment.submitRequest')}
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* QR Code Modal */}
      <Modal visible={showQRModal} transparent animationType='fade'>
        <Pressable style={styles.qrModalOverlay} onPress={() => setShowQRModal(false)}>
          <View style={styles.qrModalContent}>
            <Text style={styles.qrModalTitle}>
              {selectedQRMethod.charAt(0).toUpperCase() + selectedQRMethod.slice(1)} QR Code
            </Text>
            {selectedQRUrl && (
              <Image
                source={{ uri: selectedQRUrl }}
                style={styles.qrModalImage}
                resizeMode='contain'
              />
            )}
            <Button
              mode='contained'
              onPress={() => setShowQRModal(false)}
              style={styles.qrCloseButton}
            >
              {t('memberDuesPayment.close')}
            </Button>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
      backgroundColor: colors.surface,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.onSurface,
    },
    headerRight: {
      width: 48,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flex: 1,
      padding: 16,
    },
    clubName: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.onSurfaceVariant,
      marginBottom: 12,
    },
    disclaimerCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.primaryContainer,
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
      gap: 10,
    },
    disclaimerText: {
      flex: 1,
      fontSize: 12,
      lineHeight: 18,
      color: colors.onPrimaryContainer,
    },
    summaryCard: {
      marginBottom: 16,
      backgroundColor: colors.surface,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    summaryItem: {
      flex: 1,
      alignItems: 'center',
    },
    summaryDivider: {
      width: 1,
      height: 40,
      backgroundColor: colors.outline,
      marginHorizontal: 16,
    },
    summaryLabel: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginBottom: 4,
    },
    summaryValue: {
      fontSize: 24,
      fontWeight: '700',
    },
    sectionCard: {
      marginBottom: 16,
      backgroundColor: colors.surface,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 12,
    },
    paymentMethodsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 12,
    },
    paymentMethodItem: {
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      backgroundColor: colors.surfaceVariant,
      minWidth: 80,
    },
    paymentMethodIcon: {
      marginBottom: 4,
    },
    paymentMethodLabel: {
      fontSize: 12,
      color: colors.onSurface,
    },
    qrChip: {
      marginTop: 4,
      height: 20,
    },
    qrChipText: {
      fontSize: 10,
    },
    paymentInstructions: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
      fontStyle: 'italic',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 24,
    },
    emptyText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginTop: 8,
    },
    duesItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    duesItemInfo: {
      flex: 1,
    },
    duesType: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.onSurface,
    },
    duesPeriod: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
      marginTop: 2,
    },
    statusChip: {
      marginTop: 4,
      alignSelf: 'flex-start',
    },
    statusChipText: {
      fontSize: 11,
    },
    rejectionReasonContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: 6,
      paddingHorizontal: 8,
      paddingVertical: 6,
      backgroundColor: '#f4433615',
      borderRadius: 6,
      borderLeftWidth: 3,
      borderLeftColor: '#f44336',
    },
    rejectionReasonText: {
      fontSize: 12,
      color: '#f44336',
      marginLeft: 4,
      flex: 1,
    },
    duesItemAction: {
      alignItems: 'flex-end',
    },
    duesAmount: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 4,
    },
    payButton: {
      marginTop: 4,
    },
    moreText: {
      fontSize: 13,
      color: colors.primary,
      textAlign: 'center',
      paddingTop: 8,
    },
    bottomPadding: {
      height: 32,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '90%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.onSurface,
    },
    modalBody: {
      padding: 16,
      maxHeight: 400,
    },
    recordInfo: {
      alignItems: 'center',
      marginBottom: 16,
    },
    recordType: {
      fontSize: 16,
      color: colors.onSurface,
    },
    recordAmount: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.primary,
      marginTop: 4,
    },
    modalDivider: {
      marginVertical: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.onSurface,
      marginBottom: 8,
    },
    paymentMethodSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    methodChip: {
      marginRight: 4,
    },
    paymentTypeSelector: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
    },
    paymentTypeOption: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      backgroundColor: colors.surfaceVariant,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    paymentTypeOptionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '15',
    },
    paymentTypeLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.onSurfaceVariant,
    },
    paymentTypeLabelSelected: {
      color: colors.primary,
    },
    paymentTypeAmount: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.onSurface,
      marginTop: 4,
    },
    customAmountInput: {
      marginBottom: 16,
    },
    datePickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      backgroundColor: colors.surfaceVariant,
      marginBottom: 8,
      gap: 8,
    },
    datePickerButtonText: {
      flex: 1,
      fontSize: 15,
      color: colors.onSurface,
    },
    datePickerCloseButton: {
      alignSelf: 'center',
      marginTop: 8,
    },
    qrPreview: {
      alignItems: 'center',
      padding: 12,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 8,
      marginBottom: 16,
    },
    qrPreviewImage: {
      width: 120,
      height: 120,
    },
    qrPreviewText: {
      fontSize: 12,
      color: colors.primary,
      marginTop: 8,
    },
    imagePicker: {
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: colors.outline,
      borderRadius: 8,
      marginBottom: 16,
      overflow: 'hidden',
    },
    imagePickerPlaceholder: {
      alignItems: 'center',
      padding: 24,
    },
    imagePickerText: {
      fontSize: 13,
      color: '#666',
      marginTop: 8,
    },
    proofImage: {
      width: '100%',
      height: 150,
    },
    notesInput: {
      marginBottom: 16,
    },
    modalFooter: {
      flexDirection: 'row',
      padding: 16,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: colors.outline,
    },
    modalButton: {
      flex: 1,
    },
    // QR Modal styles
    qrModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.8)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    qrModalContent: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      width: '80%',
    },
    qrModalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 16,
    },
    qrModalImage: {
      width: 250,
      height: 250,
    },
    qrCloseButton: {
      marginTop: 16,
      minWidth: 120,
    },
  });

export default MemberDuesPaymentScreen;
