import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  RefreshControl,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Platform,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import {
  Card,
  Button,
  Avatar,
  Chip,
  Surface,
  Divider,
  ProgressBar,
  TextInput,
  Dialog,
  Portal,
  Switch,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SceneMap, TabView, TabBar } from 'react-native-tab-view';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

// 🚨 [LEGAL REVIEW] 결제 수단 기능 비활성화 - 법적 검토 후 활성화 예정
const SHOW_PAYMENT_METHODS = false;
import { useTheme } from '../../hooks/useTheme';
import { getLightningPickleballTheme } from '../../theme';
import { RootStackParamList } from '../../navigation/AppNavigator';
import duesService from '../../services/duesService';
import { formatPriceByCurrencyCode } from '../../utils/currencyUtils';
import {
  MemberDuesSummary,
  MemberDuesRecord,
  PaymentMethod,
  getDuesTypeText,
  getExtendedPaymentStatusText,
  getExtendedPaymentStatusColor,
} from '../../types/dues';

type DuesManagementScreenRouteProp = RouteProp<RootStackParamList, 'ClubDuesManagement'>;

interface DuesSettings {
  joinFee: number;
  monthlyFee: number;
  quarterlyFee: number;
  yearlyFee: number;
  paymentMethods: string[];
  paymentQRCodes: Record<string, string>; // { Venmo: 'imageUrl', ... }
  paymentIDs: Record<string, string>; // { Venmo: '@username', Zelle: 'email@example.com', ... }
  dueDate: number; // Day of month (1-31)
  gracePeriod: number; // Days
  lateFee: number;
  currency: 'KRW' | 'USD';
  autoInvoiceEnabled?: boolean; // 월회비 청구서 자동 발부 여부
}

const DuesManagementScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<DuesManagementScreenRouteProp>();
  const { currentUser } = useAuth();
  const { t, currentLanguage } = useLanguage();
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningPickleballTheme(currentTheme);
  const styles = createStyles(themeColors.colors as unknown as Record<string, string>);
  const { clubId, clubName, initialTab } = route.params;

  const [index, setIndex] = useState(initialTab ?? 1); // Default to '현황' (Status) tab, or use initialTab if provided
  const [routes] = useState([
    { key: 'settings', title: t('duesManagement.tabs.settings') },
    { key: 'status', title: t('duesManagement.tabs.status') },
    { key: 'overdue', title: t('duesManagement.tabs.overdue') },
    { key: 'report', title: t('duesManagement.tabs.report') },
  ]);

  const [isLoading, setIsLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [editJoinFee, setEditJoinFee] = useState('');
  const [editMonthlyFee, setEditMonthlyFee] = useState('');
  const [editQuarterlyFee, setEditQuarterlyFee] = useState('');
  const [editYearlyFee, setEditYearlyFee] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editGracePeriod, setEditGracePeriod] = useState('');
  const [editLateFee, setEditLateFee] = useState('');
  const [showAddPaymentMethodDialog, setShowAddPaymentMethodDialog] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState('');

  const [duesSettings, setDuesSettings] = useState<DuesSettings>({
    joinFee: 20,
    monthlyFee: 30,
    quarterlyFee: 75,
    yearlyFee: 300,
    paymentMethods: ['Venmo', 'Zelle', 'KakaoPay'],
    paymentQRCodes: {},
    paymentIDs: {},
    dueDate: 25,
    gracePeriod: 7,
    lateFee: 5,
    currency: 'USD',
    autoInvoiceEnabled: false,
  });

  // Auto invoice toggle state
  const [autoInvoiceEnabled, setAutoInvoiceEnabled] = useState(false);
  const [togglingAutoInvoice, setTogglingAutoInvoice] = useState(false);

  // Handler for auto invoice toggle
  const handleToggleAutoInvoice = async (value: boolean) => {
    // 비활성화는 바로 처리
    if (!value) {
      try {
        setTogglingAutoInvoice(true);
        await duesService.updateClubDuesSettings(clubId, { autoInvoiceEnabled: false });
        setAutoInvoiceEnabled(false);
        setDuesSettings(prev => ({ ...prev, autoInvoiceEnabled: false }));
      } catch (error) {
        console.error('Error toggling auto invoice:', error);
        Alert.alert(
          t('duesManagement.alerts.error'),
          t('duesManagement.messages.autoInvoiceFailed')
        );
      } finally {
        setTogglingAutoInvoice(false);
      }
      return;
    }

    // 활성화 시 필수 설정 확인
    const hasMonthlyFee = duesSettings.monthlyFee > 0;
    const hasDueDate = duesSettings.dueDate > 0 && duesSettings.dueDate <= 28;

    if (!hasMonthlyFee || !hasDueDate) {
      // 필수 설정이 없으면 경고 모달
      const missingItems: string[] = [];
      if (!hasMonthlyFee) {
        missingItems.push(t('duesManagement.fees.monthlyFee'));
      }
      if (!hasDueDate) {
        missingItems.push(t('duesManagement.fees.dueDate'));
      }

      Alert.alert(
        t('duesManagement.alerts.settingsRequired'),
        t('duesManagement.messages.missingSettings', { items: missingItems.join('\n• ') }),
        [{ text: t('duesManagement.alerts.ok') }]
      );
      return;
    }

    // 필수 설정이 있으면 확인 모달 표시
    const invoiceSendDay = Math.max(1, duesSettings.dueDate - 10);

    Alert.alert(
      t('duesManagement.alerts.enableAutoInvoice'),
      t('duesManagement.messages.autoInvoiceConfirm', {
        day: invoiceSendDay,
        dueDate: duesSettings.dueDate,
      }),
      [
        {
          text: t('duesManagement.actions.cancel'),
          style: 'cancel',
        },
        {
          text: t('duesManagement.actions.enable'),
          onPress: async () => {
            try {
              setTogglingAutoInvoice(true);
              await duesService.updateClubDuesSettings(clubId, { autoInvoiceEnabled: true });
              setAutoInvoiceEnabled(true);
              setDuesSettings(prev => ({ ...prev, autoInvoiceEnabled: true }));
            } catch (error) {
              console.error('Error toggling auto invoice:', error);
              Alert.alert(
                t('duesManagement.alerts.error'),
                t('duesManagement.messages.autoInvoiceFailed')
              );
            } finally {
              setTogglingAutoInvoice(false);
            }
          },
        },
      ]
    );
  };

  // QR Code Dialog state
  const [showQRCodeDialog, setShowQRCodeDialog] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [isUploadingQR, setIsUploadingQR] = useState(false);
  const [editPaymentID, setEditPaymentID] = useState('');
  const [isSavingPaymentID, setIsSavingPaymentID] = useState(false);

  // New dues summary state (Firestore 연동)
  const [membersDuesSummary, setMembersDuesSummary] = useState<MemberDuesSummary[]>([]);
  const [isSummaryLoaded, setIsSummaryLoaded] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<MemberDuesRecord[]>([]);
  const [selectedApprovalDetail, setSelectedApprovalDetail] = useState<MemberDuesRecord | null>(
    null
  );
  const [showApprovalDetailModal, setShowApprovalDetailModal] = useState(false);

  // Payment Dialog state
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MemberDuesRecord | null>(null);
  const [selectedMemberName, setSelectedMemberName] = useState<string>('');
  const [paymentMethodInput, setPaymentMethodInput] = useState<PaymentMethod>('venmo');
  const [transactionIdInput, setTransactionIdInput] = useState('');
  const [paymentNotesInput, setPaymentNotesInput] = useState('');
  // 💵 [KIM] 금액 수정 기능
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const { width } = Dimensions.get('window');

  useEffect(() => {
    loadDuesData();

    // 실시간 구독 설정
    const unsubscribeSummary = duesService.subscribeToAllMembersDuesSummary(clubId, summaries => {
      setMembersDuesSummary(summaries);
      setIsSummaryLoaded(true);
    });

    const unsubscribePending = duesService.subscribeToPendingApprovalRequests(clubId, records => {
      setPendingApprovals(records);
    });

    return () => {
      unsubscribeSummary();
      unsubscribePending();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId]);

  const loadDuesData = async () => {
    try {
      setIsLoading(true);

      // Load club settings from Firestore
      const clubRef = doc(db, 'pickleball_clubs', clubId);
      const clubSnap = await getDoc(clubRef);

      if (clubSnap.exists()) {
        const clubData = clubSnap.data();
        const settings = clubData?.settings || {};

        // Update dues settings from Firestore data
        setDuesSettings(prev => ({
          ...prev,
          joinFee: settings.joinFee || prev.joinFee,
          monthlyFee: settings.membershipFee || prev.monthlyFee,
          quarterlyFee: settings.quarterlyFee || prev.quarterlyFee,
          yearlyFee: settings.yearlyFee || prev.yearlyFee,
          ...(settings.paymentMethods && { paymentMethods: settings.paymentMethods }),
          ...(settings.paymentQRCodes && { paymentQRCodes: settings.paymentQRCodes }),
          ...(settings.paymentIDs && { paymentIDs: settings.paymentIDs }),
          ...(settings.dueDate && { dueDate: settings.dueDate }),
          ...(settings.gracePeriod && { gracePeriod: settings.gracePeriod }),
          ...(settings.lateFee && { lateFee: settings.lateFee }),
          autoInvoiceEnabled: settings.autoInvoiceEnabled ?? false,
        }));

        // Update separate state for toggle
        setAutoInvoiceEnabled(settings.autoInvoiceEnabled ?? false);
      }
    } catch (error) {
      console.error('Error loading dues data:', error);
      Alert.alert(t('duesManagement.alerts.loadFailed'), t('duesManagement.messages.loadingData'), [
        { text: t('duesManagement.alerts.ok') },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDuesData();
    setIsRefreshing(false);
  };

  const openSettingsDialog = () => {
    // Initialize edit form with current values
    setEditJoinFee(duesSettings.joinFee.toString());
    setEditMonthlyFee(duesSettings.monthlyFee.toString());
    setEditQuarterlyFee(duesSettings.quarterlyFee.toString());
    setEditYearlyFee(duesSettings.yearlyFee.toString());
    setEditDueDate(duesSettings.dueDate.toString());
    setEditGracePeriod(duesSettings.gracePeriod.toString());
    setEditLateFee(duesSettings.lateFee.toString());
    setShowSettingsDialog(true);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const newSettings = {
        joinFee: parseInt(editJoinFee, 10) || 0,
        membershipFee: parseInt(editMonthlyFee, 10) || 0,
        quarterlyFee: parseInt(editQuarterlyFee, 10) || 0,
        yearlyFee: parseInt(editYearlyFee, 10) || 0,
        dueDate: parseInt(editDueDate, 10) || 25,
        gracePeriod: parseInt(editGracePeriod, 10) || 7,
        lateFee: parseInt(editLateFee, 10) || 0,
        paymentMethods: duesSettings.paymentMethods,
      };

      // Save to Firestore
      const clubRef = doc(db, 'pickleball_clubs', clubId);
      const clubSnap = await getDoc(clubRef);

      if (clubSnap.exists()) {
        const { updateDoc } = await import('firebase/firestore');
        await updateDoc(clubRef, {
          'settings.joinFee': newSettings.joinFee,
          'settings.membershipFee': newSettings.membershipFee,
          'settings.quarterlyFee': newSettings.quarterlyFee,
          'settings.yearlyFee': newSettings.yearlyFee,
          'settings.dueDate': newSettings.dueDate,
          'settings.gracePeriod': newSettings.gracePeriod,
          'settings.lateFee': newSettings.lateFee,
        });

        // Update local state
        setDuesSettings(prev => ({
          ...prev,
          joinFee: newSettings.joinFee,
          monthlyFee: newSettings.membershipFee,
          quarterlyFee: newSettings.quarterlyFee,
          yearlyFee: newSettings.yearlyFee,
          dueDate: newSettings.dueDate,
          gracePeriod: newSettings.gracePeriod,
          lateFee: newSettings.lateFee,
        }));

        Alert.alert(t('duesManagement.alerts.saved'), t('duesManagement.messages.settingsSaved'));
      }

      setShowSettingsDialog(false);
    } catch (error) {
      console.error('Error saving dues settings:', error);
      Alert.alert(t('duesManagement.alerts.saveFailed'), t('duesManagement.messages.loadError'));
    } finally {
      setIsSaving(false);
    }
  };

  // 🌍 화폐 코드로 가격 포맷팅
  const formatCurrency = (amount: number): string => {
    return formatPriceByCurrencyCode(amount, duesSettings.currency);
  };

  // 미납자에게 납부 독려 알림 보내기
  const handleSendReminder = () => {
    Alert.alert(
      t('duesManagement.modals.paymentReminder'),
      t('duesManagement.messages.paymentReminderConfirm'),
      [
        { text: t('duesManagement.actions.cancel') },
        {
          text: t('duesManagement.actions.send'),
          onPress: async () => {
            // TODO: 실제 푸시 알림 구현
            Alert.alert(
              t('duesManagement.alerts.reminderSent'),
              t('duesManagement.messages.paymentReminderSent', { count: 1 })
            );
          },
        },
      ]
    );
  };

  // 회원의 회비 상세 보기 (현황 탭으로 이동하거나 모달 표시)
  const handleViewMemberDues = (userId: string) => {
    // 해당 회원의 미납 레코드를 찾아서 처리할 수 있는 모달 또는 화면으로 이동
    const memberSummary = membersDuesSummary.find(m => m.userId === userId);
    if (!memberSummary) {
      Alert.alert(t('duesManagement.alerts.error'), t('duesManagement.messages.memberNotFound'));
      return;
    }

    // 현황 탭으로 이동 (index 1)
    setIndex(1);
    Alert.alert(
      t('duesManagement.modals.manageDues'),
      t('duesManagement.overview.memberDuesStatus')
    );
  };

  const removePaymentMethod = async (methodToRemove: string) => {
    Alert.alert(
      t('duesManagement.modals.removePaymentMethod'),
      t('duesManagement.modals.removePaymentMethodConfirm'),
      [
        { text: t('duesManagement.actions.cancel') },
        {
          text: t('duesManagement.actions.remove'),
          style: 'destructive',
          onPress: async () => {
            const newMethods = duesSettings.paymentMethods.filter(m => m !== methodToRemove);
            setDuesSettings(prev => ({ ...prev, paymentMethods: newMethods }));

            // Save to Firestore
            try {
              const clubRef = doc(db, 'pickleball_clubs', clubId);
              const { updateDoc } = await import('firebase/firestore');
              await updateDoc(clubRef, {
                'settings.paymentMethods': newMethods,
              });
            } catch (error) {
              console.error('Error removing payment method:', error);
            }
          },
        },
      ]
    );
  };

  const addPaymentMethod = async () => {
    if (!newPaymentMethod.trim()) return;

    const newMethods = [...duesSettings.paymentMethods, newPaymentMethod.trim()];
    setDuesSettings(prev => ({ ...prev, paymentMethods: newMethods }));
    setNewPaymentMethod('');
    setShowAddPaymentMethodDialog(false);

    // Save to Firestore
    try {
      const clubRef = doc(db, 'pickleball_clubs', clubId);
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(clubRef, {
        'settings.paymentMethods': newMethods,
      });
    } catch (error) {
      console.error('Error adding payment method:', error);
    }
  };

  // QR Code functions
  const openQRCodeDialog = (method: string) => {
    setSelectedPaymentMethod(method);
    // 기존 ID가 있으면 로드
    setEditPaymentID(duesSettings.paymentIDs[method] || '');
    setShowQRCodeDialog(true);
  };

  // 결제 수단 ID 저장 함수
  const savePaymentID = async () => {
    if (!selectedPaymentMethod) return;

    try {
      setIsSavingPaymentID(true);
      const clubRef = doc(db, 'pickleball_clubs', clubId);
      const { updateDoc } = await import('firebase/firestore');

      if (editPaymentID.trim()) {
        // ID 저장
        await updateDoc(clubRef, {
          [`settings.paymentIDs.${selectedPaymentMethod}`]: editPaymentID.trim(),
        });

        // 로컬 상태 업데이트
        setDuesSettings(prev => ({
          ...prev,
          paymentIDs: {
            ...prev.paymentIDs,
            [selectedPaymentMethod]: editPaymentID.trim(),
          },
        }));
      } else {
        // ID 삭제
        const { deleteField } = await import('firebase/firestore');
        await updateDoc(clubRef, {
          [`settings.paymentIDs.${selectedPaymentMethod}`]: deleteField(),
        });

        // 로컬 상태 업데이트
        const newIDs = { ...duesSettings.paymentIDs };
        delete newIDs[selectedPaymentMethod];
        setDuesSettings(prev => ({
          ...prev,
          paymentIDs: newIDs,
        }));
      }

      Alert.alert(t('common.success'), t('duesManagement.messages.paymentIdSaved'));
    } catch (error) {
      console.error('Error saving payment ID:', error);
      Alert.alert(t('common.error'), t('duesManagement.messages.paymentIdSaveError'));
    } finally {
      setIsSavingPaymentID(false);
    }
  };

  const pickQRCodeImage = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          t('duesManagement.alerts.permissionRequired'),
          t('duesManagement.messages.permissionDenied')
        );
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadQRCodeImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('duesManagement.alerts.error'), t('duesManagement.messages.uploadError'));
    }
  };

  const uploadQRCodeImage = async (imageUri: string) => {
    setIsUploadingQR(true);
    try {
      // Convert image to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Upload to Firebase Storage
      const storage = getStorage();
      const fileName = `clubs/${clubId}/payment-qr/${selectedPaymentMethod}-${Date.now()}.jpg`;
      const storageRef = ref(storage, fileName);

      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);

      // Update Firestore
      const clubRef = doc(db, 'pickleball_clubs', clubId);
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(clubRef, {
        [`settings.paymentQRCodes.${selectedPaymentMethod}`]: downloadUrl,
      });

      // Update local state
      setDuesSettings(prev => ({
        ...prev,
        paymentQRCodes: {
          ...prev.paymentQRCodes,
          [selectedPaymentMethod]: downloadUrl,
        },
      }));

      Alert.alert(
        t('duesManagement.alerts.uploadComplete'),
        t('duesManagement.messages.imageUploaded')
      );
      setShowQRCodeDialog(false);
    } catch (error) {
      console.error('Error uploading QR code:', error);
      Alert.alert(
        t('duesManagement.alerts.uploadFailed'),
        t('duesManagement.messages.uploadError')
      );
    } finally {
      setIsUploadingQR(false);
    }
  };

  const deleteQRCode = async () => {
    Alert.alert(
      t('duesManagement.modals.deleteQrCode'),
      t('duesManagement.modals.deleteQrCodeConfirm'),
      [
        { text: t('duesManagement.actions.cancel') },
        {
          text: t('duesManagement.actions.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const clubRef = doc(db, 'pickleball_clubs', clubId);
              const { updateDoc, deleteField } = await import('firebase/firestore');
              await updateDoc(clubRef, {
                [`settings.paymentQRCodes.${selectedPaymentMethod}`]: deleteField(),
              });

              // Update local state
              const newQRCodes = { ...duesSettings.paymentQRCodes };
              delete newQRCodes[selectedPaymentMethod];
              setDuesSettings(prev => ({
                ...prev,
                paymentQRCodes: newQRCodes,
              }));

              setShowQRCodeDialog(false);
            } catch (error) {
              console.error('Error deleting QR code:', error);
            }
          },
        },
      ]
    );
  };

  // ========== 새로운 회비 레코드 처리 함수들 ==========

  const openPaymentDialog = (record: MemberDuesRecord, memberName: string) => {
    setSelectedRecord(record);
    setSelectedMemberName(memberName);
    setPaymentMethodInput('venmo');
    setTransactionIdInput('');
    setPaymentNotesInput('');
    // 💵 [KIM] 기존 금액을 초기값으로 설정
    setPaymentAmountInput(record.amount.toString());
    setShowPaymentDialog(true);
  };

  const handleMarkRecordAsPaid = async () => {
    if (!selectedRecord || !currentUser) return;

    // 💵 [KIM] 수정된 금액 사용 (입력값이 유효하지 않으면 기존 금액 사용)
    const finalAmount = parseFloat(paymentAmountInput) || selectedRecord.amount;

    setIsProcessingPayment(true);
    try {
      await duesService.markRecordAsPaid(
        selectedRecord.id,
        paymentMethodInput,
        finalAmount,
        currentUser.uid,
        transactionIdInput || undefined,
        paymentNotesInput || undefined
      );

      Alert.alert(
        t('duesManagement.alerts.completed'),
        t('duesManagement.messages.paymentMarkedPaid')
      );
      setShowPaymentDialog(false);
    } catch (error) {
      console.error('Error marking record as paid:', error);
      Alert.alert(t('duesManagement.alerts.error'), t('duesManagement.messages.loadError'));
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // 📝 [KIM] 납부 완료된 레코드 관리 (수정/삭제)
  const handlePaidRecordActions = (record: MemberDuesRecord, memberName: string) => {
    Alert.alert(
      t('duesManagement.modals.managePaidRecord'),
      `${memberName}: ${formatCurrency(record.amount)}`,
      [
        { text: t('duesManagement.actions.cancel'), style: 'cancel' },
        {
          text: t('duesManagement.actions.edit'),
          onPress: () => openPaymentDialog(record, memberName),
        },
        {
          text: t('duesManagement.actions.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await duesService.deleteDuesRecord(record.id);
              Alert.alert(
                t('duesManagement.alerts.deleted'),
                t('duesManagement.messages.recordDeleted')
              );
            } catch (error) {
              console.error('Error deleting paid record:', error);
              Alert.alert(t('duesManagement.alerts.error'), t('duesManagement.messages.loadError'));
            }
          },
        },
      ]
    );
  };

  // 🗑️ [KIM] 결제 다이얼로그에서 레코드 삭제
  const handleDeleteRecordFromDialog = () => {
    if (!selectedRecord) return;

    Alert.alert(t('common.delete'), t('duesManagement.modals.deleteRecordConfirm'), [
      { text: t('duesManagement.actions.cancel'), style: 'cancel' },
      {
        text: t('duesManagement.actions.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            setIsProcessingPayment(true);
            await duesService.deleteDuesRecord(selectedRecord.id);
            Alert.alert(
              t('duesManagement.alerts.deleted'),
              t('duesManagement.messages.recordDeleted')
            );
            setShowPaymentDialog(false);
          } catch (error) {
            console.error('Error deleting record:', error);
            Alert.alert(t('duesManagement.alerts.error'), t('duesManagement.messages.loadError'));
          } finally {
            setIsProcessingPayment(false);
          }
        },
      },
    ]);
  };

  const handleApprovePayment = async (record: MemberDuesRecord) => {
    if (!currentUser) return;

    Alert.alert(
      t('duesManagement.modals.approvePayment'),
      t('duesManagement.modals.approvePaymentConfirm'),
      [
        { text: t('duesManagement.actions.cancel') },
        {
          text: t('duesManagement.actions.approve'),
          onPress: async () => {
            try {
              await duesService.approvePaymentRequest(record.id, currentUser.uid);
              Alert.alert(
                t('duesManagement.alerts.approved'),
                t('duesManagement.messages.paymentApproved')
              );
            } catch (error) {
              console.error('Error approving payment:', error);
              Alert.alert(t('duesManagement.alerts.error'), t('duesManagement.messages.loadError'));
            }
          },
        },
      ]
    );
  };

  const handleRejectPayment = async (record: MemberDuesRecord) => {
    if (!currentUser) return;

    Alert.prompt(
      t('duesManagement.modals.rejectPayment'),
      t('duesManagement.modals.rejectPaymentConfirm'),
      [
        { text: t('duesManagement.actions.cancel') },
        {
          text: t('duesManagement.actions.reject'),
          style: 'destructive',
          onPress: async (reason?: string) => {
            try {
              await duesService.rejectPaymentRequest(record.id, currentUser.uid, reason);
              Alert.alert(
                t('duesManagement.alerts.rejected'),
                t('duesManagement.messages.paymentRejected')
              );
            } catch (error) {
              console.error('Error rejecting payment:', error);
              Alert.alert(t('duesManagement.alerts.error'), t('duesManagement.messages.loadError'));
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleAddLateFee = async (userId: string, memberName: string) => {
    Alert.prompt(
      t('duesManagement.modals.addLateFee'),
      t('duesManagement.modals.manageLateFeesMessage', { amount: memberName }),
      [
        { text: t('duesManagement.actions.cancel') },
        {
          text: t('duesManagement.actions.add'),
          onPress: async (amountStr?: string) => {
            const amount = parseFloat(amountStr || '0');
            if (amount <= 0) {
              Alert.alert(t('duesManagement.alerts.error'), t('duesManagement.messages.loadError'));
              return;
            }
            try {
              await duesService.addLateFeeRecord(
                clubId,
                userId,
                amount,
                undefined,
                t('duesManagement.types.adminAdded'),
                duesSettings.currency
              );
              Alert.alert(
                t('duesManagement.alerts.added'),
                t('duesManagement.messages.lateFeeAdded')
              );
            } catch (error) {
              console.error('Error adding late fee:', error);
              Alert.alert(t('duesManagement.alerts.error'), t('duesManagement.messages.loadError'));
            }
          },
        },
      ],
      'plain-text',
      duesSettings.lateFee.toString()
    );
  };

  // 연체료 관리 (추가/삭제 옵션)
  const handleManageLateFees = (
    userId: string,
    memberName: string,
    lateFees: MemberDuesRecord[]
  ) => {
    // 연체료 레코드가 있으면 관리 옵션 표시
    const buttons: { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }[] = [
      { text: t('duesManagement.actions.close'), style: 'cancel' },
      {
        text: t('duesManagement.modals.addLateFee'),
        onPress: () => handleAddLateFee(userId, memberName),
      },
    ];

    // 각 연체료 레코드에 대한 삭제 옵션 추가
    if (lateFees.length > 0) {
      buttons.push({
        text: t('duesManagement.modals.deleteLateFee'),
        style: 'destructive',
        onPress: () => handleSelectLateFeeToDelete(userId, memberName, lateFees),
      });
    }

    Alert.alert(
      t('duesManagement.modals.manageLateFeesTitle'),
      t('duesManagement.modals.manageLateFeesMessage', {
        amount: formatCurrency(lateFees.reduce((sum, f) => sum + f.amount, 0)),
      }),
      buttons
    );
  };

  // 삭제할 연체료 선택
  const handleSelectLateFeeToDelete = (
    _userId: string,
    memberName: string,
    lateFees: MemberDuesRecord[]
  ) => {
    const buttons: { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }[] = [
      { text: t('duesManagement.actions.cancel'), style: 'cancel' },
    ];

    lateFees.forEach((fee, index) => {
      const feeDate = fee.createdAt?.toDate ? fee.createdAt.toDate().toLocaleDateString() : '';
      buttons.push({
        text: `${index + 1}. ${formatCurrency(fee.amount)} ${feeDate ? `(${feeDate})` : ''}`,
        style: 'destructive',
        onPress: () => handleDeleteLateFee(fee.id),
      });
    });

    Alert.alert(
      t('duesManagement.modals.selectLateFeeToDelete'),
      t('duesManagement.modals.selectLateFeePrompt'),
      buttons
    );
  };

  // 연체료 삭제
  const handleDeleteLateFee = async (recordId: string) => {
    Alert.alert(
      t('duesManagement.modals.deleteLateFee'),
      t('duesManagement.modals.deleteLateFeeConfirm'),
      [
        { text: t('duesManagement.actions.cancel'), style: 'cancel' },
        {
          text: t('duesManagement.actions.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await duesService.deleteDuesRecord(recordId);
              Alert.alert(
                t('duesManagement.alerts.deleted'),
                t('duesManagement.messages.lateFeeDeleted')
              );
            } catch (error) {
              console.error('Error deleting late fee:', error);
              Alert.alert(t('duesManagement.alerts.error'), t('duesManagement.messages.loadError'));
            }
          },
        },
      ]
    );
  };

  // 가입비 관리 (결제 상세 보기/삭제 옵션)
  const handleManageJoinFee = (memberName: string, joinFee: MemberDuesRecord) => {
    const buttons: { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }[] = [
      { text: t('duesManagement.actions.close'), style: 'cancel' },
    ];

    // 미납 상태면 결제 처리 옵션 추가
    if (joinFee.status !== 'paid') {
      buttons.push({
        text: t('duesManagement.actions.processPayment'),
        onPress: () => openPaymentDialog(joinFee, memberName),
      });
    }

    // 삭제 옵션 추가
    buttons.push({
      text: t('duesManagement.modals.deleteJoinFee'),
      style: 'destructive',
      onPress: () => handleDeleteJoinFee(joinFee.id),
    });

    const statusText =
      joinFee.status === 'paid'
        ? t('duesManagement.status.paid')
        : joinFee.status === 'pending_approval'
          ? t('duesManagement.status.pending')
          : t('duesManagement.status.unpaid');

    Alert.alert(
      t('duesManagement.modals.manageJoinFee'),
      `${memberName}: ${formatCurrency(joinFee.amount)} (${statusText})`,
      buttons
    );
  };

  // 가입비 삭제
  const handleDeleteJoinFee = async (recordId: string) => {
    Alert.alert(
      t('duesManagement.modals.deleteJoinFee'),
      t('duesManagement.modals.deleteJoinFeeConfirm'),
      [
        { text: t('duesManagement.actions.cancel'), style: 'cancel' },
        {
          text: t('duesManagement.actions.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await duesService.deleteDuesRecord(recordId);
              Alert.alert(
                t('duesManagement.alerts.deleted'),
                t('duesManagement.messages.joinFeeDeleted')
              );
            } catch (error) {
              console.error('Error deleting join fee:', error);
              Alert.alert(t('duesManagement.alerts.error'), t('duesManagement.messages.loadError'));
            }
          },
        },
      ]
    );
  };

  // 회비 면제 토글
  const handleToggleDuesExempt = (userId: string, memberName: string, currentlyExempt: boolean) => {
    if (currentlyExempt) {
      // 면제 해제
      Alert.alert(
        t('duesManagement.modals.removeExemption'),
        t('duesManagement.modals.removeExemptionConfirm'),
        [
          { text: t('duesManagement.actions.cancel'), style: 'cancel' },
          {
            text: t('duesManagement.actions.remove'),
            onPress: async () => {
              try {
                await duesService.setMemberDuesExempt(clubId, userId, false);
                Alert.alert(
                  t('duesManagement.alerts.done'),
                  t('duesManagement.messages.exemptionRemoved')
                );
              } catch (error) {
                console.error('Error removing exemption:', error);
                Alert.alert(
                  t('duesManagement.alerts.error'),
                  t('duesManagement.messages.loadError')
                );
              }
            },
          },
        ]
      );
    } else {
      // 면제 설정
      Alert.prompt(
        t('duesManagement.modals.exemptionTitle'),
        t('duesManagement.modals.exemptionConfirm'),
        [
          { text: t('duesManagement.actions.cancel'), style: 'cancel' },
          {
            text: t('duesManagement.status.exempt'),
            onPress: async (reason?: string) => {
              try {
                await duesService.setMemberDuesExempt(clubId, userId, true, reason);
                Alert.alert(
                  t('duesManagement.alerts.done'),
                  t('duesManagement.messages.exemptionSet')
                );
              } catch (error) {
                console.error('Error setting exemption:', error);
                Alert.alert(
                  t('duesManagement.alerts.error'),
                  t('duesManagement.messages.loadError')
                );
              }
            },
          },
        ],
        'plain-text',
        '',
        'default'
        // Placeholder not supported in Alert.prompt options
      );
    }
  };

  const handleCreateDuesRecord = async (userId: string, memberName: string) => {
    Alert.alert(
      t('duesManagement.modals.createRecord'),
      t('duesManagement.modals.createRecordPrompt'),
      [
        { text: t('duesManagement.actions.cancel') },
        {
          text: t('duesManagement.types.joinFee'),
          onPress: async () => {
            try {
              await duesService.createJoinFeeRecord(
                clubId,
                userId,
                duesSettings.joinFee,
                duesSettings.currency
              );
              Alert.alert(
                t('duesManagement.alerts.added'),
                t('duesManagement.messages.recordCreated')
              );
            } catch (error) {
              console.error('Error creating join fee record:', error);
            }
          },
        },
        {
          text: t('duesManagement.types.monthly'),
          onPress: async () => {
            const now = new Date();
            try {
              await duesService.createPeriodicDuesRecord(
                clubId,
                userId,
                'monthly',
                now.getFullYear(),
                now.getMonth() + 1,
                duesSettings.monthlyFee,
                duesSettings.currency
              );
              Alert.alert(
                t('duesManagement.alerts.added'),
                t('duesManagement.messages.recordCreated')
              );
            } catch (error) {
              console.error('Error creating monthly dues record:', error);
            }
          },
        },
        {
          text: t('duesManagement.types.lateFee'),
          onPress: () => {
            handleAddLateFee(userId, memberName);
          },
        },
      ]
    );
  };

  // Settings Tab
  const SettingsRoute = () => (
    <ScrollView style={styles.tabContent}>
      <Card style={styles.settingsCard}>
        <Card.Content>
          <Text style={styles.cardTitle}>{t('duesManagement.settings.title')}</Text>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>{t('duesManagement.fees.joinFee')}</Text>
            <Text style={styles.settingValue}>{formatCurrency(duesSettings.joinFee)}</Text>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>{t('duesManagement.fees.monthlyFee')}</Text>
            <Text style={styles.settingValue}>{formatCurrency(duesSettings.monthlyFee)}</Text>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>{t('duesManagement.fees.quarterlyFee')}</Text>
            <Text style={styles.settingValue}>{formatCurrency(duesSettings.quarterlyFee)}</Text>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>{t('duesManagement.fees.yearlyFee')}</Text>
            <Text style={styles.settingValue}>{formatCurrency(duesSettings.yearlyFee)}</Text>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>{t('duesManagement.fees.dueDate')}</Text>
            <Text style={styles.settingValue}>
              {t('duesManagement.settings.dayOfMonth')}: {duesSettings.dueDate}
            </Text>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>{t('duesManagement.fees.gracePeriod')}</Text>
            <Text style={styles.settingValue}>
              {duesSettings.gracePeriod} {t('duesManagement.settings.daysLabel')}
            </Text>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>{t('duesManagement.fees.lateFee')}</Text>
            <Text style={styles.settingValue}>{formatCurrency(duesSettings.lateFee)}</Text>
          </View>

          <Button mode='outlined' onPress={openSettingsDialog} style={styles.editButton}>
            {t('duesManagement.fees.editSettings')}
          </Button>
        </Card.Content>
      </Card>

      {/* 🚨 [LEGAL REVIEW] 결제 수단 카드 - 법적 검토 후 SHOW_PAYMENT_METHODS = true로 변경하여 활성화 */}
      {SHOW_PAYMENT_METHODS && (
        <Card style={styles.paymentMethodsCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>{t('duesManagement.settings.paymentMethods')}</Text>

            {duesSettings.paymentMethods.map((method, index) => {
              const hasQRCode = !!duesSettings.paymentQRCodes[method];
              return (
                <View key={index} style={styles.paymentMethodItem}>
                  <Text style={styles.paymentMethodText}>{method}</Text>
                  <View style={styles.paymentMethodActions}>
                    <TouchableOpacity onPress={() => openQRCodeDialog(method)}>
                      <Chip
                        compact
                        icon={hasQRCode ? 'qrcode' : 'qrcode-plus'}
                        style={[styles.activeChip, hasQRCode && styles.qrCodeChip]}
                      >
                        {hasQRCode
                          ? t('duesManagement.settings.qrCode')
                          : t('duesManagement.modals.uploadQrCode')}
                      </Chip>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => removePaymentMethod(method)}
                      style={styles.removeButton}
                    >
                      <Ionicons name='close-circle' size={22} color='#f44336' />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            <Button
              mode='outlined'
              icon='plus'
              style={styles.addPaymentButton}
              onPress={() => setShowAddPaymentMethodDialog(true)}
            >
              {t('duesManagement.settings.addPaymentMethod')}
            </Button>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );

  // Status Tab - 새로운 회비 레코드 기반 UI
  const StatusRoute = () => {
    // 새로운 레코드 기반 통계
    const totalOwed = membersDuesSummary.reduce((sum, m) => sum + m.totalOwed, 0);
    const totalPaid = membersDuesSummary.reduce((sum, m) => sum + m.totalPaid, 0);

    // 회비 레코드 상태별 렌더링
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const renderDuesRecordChip = (record: MemberDuesRecord | null, duesType: string) => {
      if (!record) {
        return (
          <Chip compact style={styles.noRecordChip} textStyle={styles.chipText}>
            {t('duesManagement.settings.none')}
          </Chip>
        );
      }

      const statusColor = getExtendedPaymentStatusColor(record.status);
      let statusText = getExtendedPaymentStatusText(record.status, currentLanguage);

      // 납부 완료 시 실제 납부일 표시
      if (record.status === 'paid' && record.paidAt) {
        let paidDate: Date;
        if (record.paidAt.toDate) {
          paidDate = record.paidAt.toDate();
        } else if ((record.paidAt as { seconds?: number }).seconds) {
          paidDate = new Date((record.paidAt as { seconds: number }).seconds * 1000);
        } else {
          paidDate = new Date(record.paidAt as unknown as string);
        }
        const month = paidDate.getMonth() + 1;
        const day = paidDate.getDate();
        statusText = `${statusText} (${month}/${day})`;
      }

      return (
        <Chip
          compact
          style={[styles.statusChip, { backgroundColor: statusColor + '20' }]}
          textStyle={[styles.chipText, { color: statusColor }]}
        >
          {statusText}
        </Chip>
      );
    };

    return (
      <ScrollView style={styles.tabContent}>
        {/* 요약 통계 카드 */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>{t('duesManagement.overview.title')}</Text>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{membersDuesSummary.length}</Text>
                <Text style={styles.statLabel}>{t('duesManagement.overview.totalMembers')}</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#f44336' }]}>
                  {formatCurrency(totalOwed)}
                </Text>
                <Text style={styles.statLabel}>{t('duesManagement.overview.totalOwed')}</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#4caf50' }]}>
                  {formatCurrency(totalPaid)}
                </Text>
                <Text style={styles.statLabel}>{t('duesManagement.overview.totalPaid')}</Text>
              </View>
            </View>

            {membersDuesSummary.length > 0 && (
              <>
                <ProgressBar
                  progress={totalPaid / (totalPaid + totalOwed || 1)}
                  color={themeColors.colors.primary}
                  style={styles.progressBar}
                />
                <Text style={styles.progressText}>
                  {t('duesManagement.overview.collectionRate')}:{' '}
                  {Math.round((totalPaid / (totalPaid + totalOwed || 1)) * 100)}%
                </Text>
              </>
            )}

            {/* 월회비 자동 생성 안내 */}
            <Text style={styles.duesInfoText}>{t('duesManagement.overview.clickAutoInvoice')}</Text>
          </Card.Content>
        </Card>

        {/* 승인 대기 목록 */}
        {pendingApprovals.length > 0 && (
          <Card style={[styles.membersCard, { borderColor: '#2196f3', borderWidth: 2 }]}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <Text style={[styles.cardTitle, { color: '#2196f3' }]}>
                  {t('duesManagement.overview.pendingApproval')} ({pendingApprovals.length})
                </Text>
              </View>

              {pendingApprovals.map(record => {
                const member = membersDuesSummary.find(m => m.userId === record.userId);
                const hasProofOrNotes = record.paymentProofImageUrl || record.requestNotes;
                return (
                  <TouchableOpacity
                    key={record.id}
                    style={styles.pendingApprovalItem}
                    onPress={() => {
                      setSelectedApprovalDetail(record);
                      setShowApprovalDetailModal(true);
                    }}
                  >
                    <View style={styles.pendingApprovalInfo}>
                      <Text style={styles.memberName}>
                        {member?.displayName || t('common.unknown')}
                      </Text>
                      <Text style={styles.memberSubtext}>
                        {record.requestedPaymentType === 'quarterly'
                          ? t('duesManagement.fees.quarterlyFee')
                          : record.requestedPaymentType === 'custom'
                            ? t('duesManagement.paymentDetails.amount')
                            : getDuesTypeText(record.duesType, currentLanguage)}{' '}
                        - {formatCurrency(record.requestedAmount || record.amount)}
                      </Text>
                      <View style={styles.pendingApprovalMeta}>
                        {record.paymentRequestedMethod && (
                          <Chip compact style={styles.methodChip}>
                            {record.paymentRequestedMethod}
                          </Chip>
                        )}
                        {hasProofOrNotes && (
                          <Chip compact icon='file-document' style={styles.proofChip}>
                            {t('duesManagement.actions.viewAttachment')}
                          </Chip>
                        )}
                      </View>
                    </View>
                    <View style={styles.pendingApprovalActions}>
                      <Button
                        mode='contained'
                        compact
                        onPress={e => {
                          e.stopPropagation();
                          handleApprovePayment(record);
                        }}
                        style={styles.approveButton}
                      >
                        {t('duesManagement.actions.approve')}
                      </Button>
                      <Button
                        mode='outlined'
                        compact
                        onPress={e => {
                          e.stopPropagation();
                          handleRejectPayment(record);
                        }}
                        textColor='#f44336'
                        style={styles.rejectButton}
                      >
                        {t('duesManagement.actions.reject')}
                      </Button>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </Card.Content>
          </Card>
        )}

        {/* 회원별 회비 현황 (새로운 레코드 기반) */}
        <Card style={styles.membersCard}>
          <Card.Content>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>{t('duesManagement.overview.memberDuesStatus')}</Text>
              <View style={styles.autoInvoiceToggle}>
                <Text style={styles.autoInvoiceLabel}>
                  {t('duesManagement.overview.autoInvoiceLabel')}
                </Text>
                <Switch
                  value={autoInvoiceEnabled}
                  onValueChange={handleToggleAutoInvoice}
                  disabled={togglingAutoInvoice}
                  color={themeColors.colors.primary}
                />
              </View>
            </View>

            {isLoading || !isSummaryLoaded ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size='large' color={themeColors.colors.primary} />
                <Text style={[styles.emptySubtitle, { marginTop: 12 }]}>
                  {t('duesManagement.report.loading')}
                </Text>
              </View>
            ) : membersDuesSummary.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>{t('duesManagement.overview.noRecordsYet')}</Text>
                <Text style={styles.emptySubtitle}>
                  {t('duesManagement.overview.clickAutoInvoice')}
                </Text>
              </View>
            ) : (
              membersDuesSummary.map(summary => (
                <View key={summary.userId} style={styles.memberDuesCard}>
                  <View style={styles.memberDuesHeader}>
                    <Avatar.Text
                      size={40}
                      label={summary.displayName.charAt(0)}
                      style={[
                        styles.memberAvatar,
                        summary.isDuesExempt && { backgroundColor: '#9e9e9e' },
                      ]}
                    />
                    <View style={styles.memberDuesInfo}>
                      <View style={styles.memberNameRow}>
                        <Text style={styles.memberName}>{summary.displayName}</Text>
                        {summary.isDuesExempt && (
                          <Chip compact style={styles.exemptChip} textStyle={styles.exemptChipText}>
                            {t('duesManagement.memberCard.exempt')}
                          </Chip>
                        )}
                      </View>
                      <Text style={styles.memberSubtext}>
                        {summary.isDuesExempt
                          ? summary.exemptReason || t('duesManagement.memberCard.duesExempt')
                          : `${t('duesManagement.memberCard.owed')}: ${formatCurrency(summary.totalOwed)}`}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() =>
                        handleToggleDuesExempt(
                          summary.userId,
                          summary.displayName,
                          summary.isDuesExempt || false
                        )
                      }
                      style={styles.exemptToggleButton}
                    >
                      <Ionicons
                        name={summary.isDuesExempt ? 'shield-checkmark' : 'shield-outline'}
                        size={24}
                        color={summary.isDuesExempt ? '#9e9e9e' : themeColors.colors.outline}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleCreateDuesRecord(summary.userId, summary.displayName)}
                      style={styles.addRecordButton}
                    >
                      <Ionicons
                        name='add-circle-outline'
                        size={28}
                        color={themeColors.colors.primary}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* 회비 항목 리스트 (레코드가 있는 항목만 표시) */}
                  <View style={styles.duesItemList}>
                    {/* 가입비 - 레코드가 있을 때만 표시 */}
                    {summary.joinFee && (
                      <TouchableOpacity
                        style={styles.duesItemRow}
                        onPress={() => handleManageJoinFee(summary.displayName, summary.joinFee!)}
                      >
                        <View style={styles.duesItemLeft}>
                          <Text style={styles.duesItemLabel}>
                            {t('duesManagement.memberCard.joinFeeLabel')}
                          </Text>
                        </View>
                        <View style={styles.duesItemRight}>
                          {renderDuesRecordChip(summary.joinFee, 'join')}
                          <Text style={styles.duesItemAmount}>
                            {formatCurrency(summary.joinFee.amount)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}

                    {/* 정기회비 (월회비/연회비/분기회비) - 항상 표시 */}
                    {(() => {
                      const periodicDues = summary.currentYearDues || summary.currentMonthDues;
                      const duesLabel = summary.currentYearDues
                        ? t('duesManagement.fees.yearlyFee')
                        : summary.currentMonthDues?.duesType === 'quarterly'
                          ? t('duesManagement.fees.quarterlyFee')
                          : t('duesManagement.fees.monthlyFee');
                      const duesType = summary.currentYearDues
                        ? 'yearly'
                        : summary.currentMonthDues?.duesType === 'quarterly'
                          ? 'quarterly'
                          : 'monthly';
                      const periodText = periodicDues?.period?.year
                        ? periodicDues.period.month
                          ? `${periodicDues.period.year}.${periodicDues.period.month}`
                          : `${periodicDues.period.year}`
                        : '';

                      return (
                        <TouchableOpacity
                          style={styles.duesItemRow}
                          onPress={() => {
                            if (!periodicDues) return;
                            // 📝 [KIM] 납부 완료된 레코드도 수정/삭제 가능
                            if (periodicDues.status === 'paid') {
                              handlePaidRecordActions(periodicDues, summary.displayName);
                            } else {
                              openPaymentDialog(periodicDues, summary.displayName);
                            }
                          }}
                          disabled={!periodicDues}
                        >
                          <View style={styles.duesItemLeft}>
                            <Text style={styles.duesItemLabel}>{duesLabel}</Text>
                            {periodText && <Text style={styles.duesItemPeriod}>{periodText}</Text>}
                          </View>
                          <View style={styles.duesItemRight}>
                            {renderDuesRecordChip(periodicDues, duesType)}
                            {periodicDues && (
                              <Text style={styles.duesItemAmount}>
                                {formatCurrency(periodicDues.amount)}
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })()}

                    {/* 연체료 - 레코드가 있을 때만 표시 */}
                    {summary.lateFees.length > 0 && (
                      <TouchableOpacity
                        style={styles.duesItemRow}
                        onPress={() =>
                          handleManageLateFees(
                            summary.userId,
                            summary.displayName,
                            summary.lateFees
                          )
                        }
                      >
                        <View style={styles.duesItemLeft}>
                          <Text style={[styles.duesItemLabel, { color: '#f44336' }]}>
                            {t('duesManagement.memberCard.lateFeeLabel')}
                          </Text>
                          <Text style={styles.duesItemPeriod}>
                            {summary.lateFees.length}
                            {t('duesManagement.memberCard.lateFeeItems')}
                          </Text>
                        </View>
                        <View style={styles.duesItemRight}>
                          <Chip
                            compact
                            style={[styles.statusChip, { backgroundColor: '#f4433620' }]}
                            textStyle={[styles.chipText, { color: '#f44336' }]}
                          >
                            {t('duesManagement.memberCard.unpaidLabel')}
                          </Chip>
                          <Text style={[styles.duesItemAmount, { color: '#f44336' }]}>
                            {formatCurrency(summary.lateFees.reduce((sum, f) => sum + f.amount, 0))}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>

                  <Divider style={styles.memberDuesDivider} />
                </View>
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    );
  };

  // Overdue Tab - 실제 데이터 사용
  const OverdueRoute = () => {
    // membersDuesSummary에서 미납자 필터링 (회비 면제자 제외, totalOwed > 0인 회원)
    const overdueMembers = membersDuesSummary.filter(m => !m.isDuesExempt && m.totalOwed > 0);

    return (
      <ScrollView style={styles.tabContent}>
        {!isSummaryLoaded ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <View style={styles.emptyState}>
                <ActivityIndicator size='large' color={themeColors.colors.primary} />
                <Text style={[styles.emptySubtitle, { marginTop: 12 }]}>
                  {t('duesManagement.report.loading')}
                </Text>
              </View>
            </Card.Content>
          </Card>
        ) : overdueMembers.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>✅</Text>
                <Text style={styles.emptyTitle}>{t('duesManagement.memberCard.paidStatus')}</Text>
                <Text style={styles.emptySubtitle}>
                  {t('duesManagement.overview.noRecordsYet')}
                </Text>
              </View>
            </Card.Content>
          </Card>
        ) : (
          overdueMembers.map(member => (
            <Card key={member.userId} style={styles.overdueMemberCard}>
              <Card.Content>
                <View style={styles.overdueMemberHeader}>
                  <View style={styles.memberInfo}>
                    <Avatar.Text
                      size={40}
                      label={member.displayName.charAt(0)}
                      style={styles.overdueMemberAvatar}
                    />
                    <View style={styles.memberDetails}>
                      <Text style={styles.memberName}>{member.displayName}</Text>
                      <Text style={styles.memberSubtext}>
                        {(() => {
                          // 미납 건수 계산 (joinFee, currentMonthDues, currentYearDues, lateFees 중 unpaid 상태)
                          let unpaidCount = 0;
                          if (
                            member.joinFee &&
                            (member.joinFee.status === 'unpaid' ||
                              member.joinFee.status === 'pending_approval')
                          )
                            unpaidCount++;
                          if (
                            member.currentMonthDues &&
                            (member.currentMonthDues.status === 'unpaid' ||
                              member.currentMonthDues.status === 'pending_approval')
                          )
                            unpaidCount++;
                          if (
                            member.currentYearDues &&
                            (member.currentYearDues.status === 'unpaid' ||
                              member.currentYearDues.status === 'pending_approval')
                          )
                            unpaidCount++;
                          unpaidCount += member.lateFees.filter(
                            f => f.status === 'unpaid' || f.status === 'pending_approval'
                          ).length;

                          return unpaidCount > 0
                            ? t('duesManagement.memberCard.unpaidCount', { count: unpaidCount })
                            : t('duesManagement.memberCard.unpaidLabel');
                        })()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.amountOwed}>
                    <Text style={styles.owedAmount}>{formatCurrency(member.totalOwed)}</Text>
                    <Text style={styles.owedLabel}>{t('duesManagement.overdue.amountDue')}</Text>
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <Button
                    mode='outlined'
                    onPress={() => handleSendReminder()}
                    style={styles.reminderButton}
                    compact
                  >
                    {t('duesManagement.overdue.sendReminder')}
                  </Button>
                  <Button
                    mode='contained'
                    onPress={() => handleViewMemberDues(member.userId)}
                    style={styles.markPaidButton}
                    compact
                  >
                    {t('duesManagement.modals.manageDues')}
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
    );
  };

  // Report Tab - 연간 회비 보고서
  const ReportRoute = () => {
    const [reportYear, setReportYear] = useState(new Date().getFullYear());
    const [reportData, setReportData] = useState<{
      members: Array<{
        userId: string;
        displayName: string;
        monthlyPayments: number[];
        total: number;
      }>;
      monthlyTotals: number[];
      grandTotal: number;
    } | null>(null);
    const [isLoadingReport, setIsLoadingReport] = useState(false);

    const monthNames =
      currentLanguage === 'ko'
        ? ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
        : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const loadReportData = async () => {
      setIsLoadingReport(true);
      try {
        const data = await duesService.getAnnualDuesReport(clubId, reportYear);
        setReportData(data);
      } catch (error) {
        console.error('Failed to load report:', error);
        Alert.alert(t('duesManagement.alerts.error'), t('duesManagement.messages.loadError'));
      } finally {
        setIsLoadingReport(false);
      }
    };

    useEffect(() => {
      loadReportData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reportYear]);

    const handleExportToExcel = async () => {
      if (!reportData || reportData.members.length === 0) {
        Alert.alert(t('duesManagement.alerts.notice'), t('duesManagement.messages.noDataToExport'));
        return;
      }

      try {
        // 텍스트 테이블 형식으로 데이터 생성
        let content = `${clubName} - ${reportYear} ${t('duesManagement.report.reportFileName')}\n\n`;

        // 헤더 행
        content += `${t('duesManagement.report.memberColumn')}\t`;
        content += monthNames.join('\t') + '\t';
        content += `${t('duesManagement.report.totalColumn')}\n`;
        content += '─'.repeat(80) + '\n';

        // 데이터 행
        reportData.members.forEach(member => {
          content += `${member.displayName}\t`;
          content +=
            member.monthlyPayments.map(p => (p > 0 ? formatCurrency(p) : '-')).join('\t') + '\t';
          content += `${formatCurrency(member.total)}\n`;
        });

        content += '─'.repeat(80) + '\n';

        // 합계 행
        content += `${t('duesManagement.report.monthlyTotal')}\t`;
        content +=
          reportData.monthlyTotals
            .map(total => (total > 0 ? formatCurrency(total) : '-'))
            .join('\t') + '\t';
        content += `${formatCurrency(reportData.grandTotal)}\n`;

        // React Native Share API 사용
        await Share.share({
          message: content,
          title: `${clubName} ${reportYear} ${t('duesManagement.report.reportFileName')}`,
        });
      } catch (error) {
        console.error('Export error:', error);
        if ((error as Error).message !== 'User did not share') {
          Alert.alert(t('duesManagement.alerts.error'), t('duesManagement.messages.exportFailed'));
        }
      }
    };

    const currentYear = new Date().getFullYear();
    const yearOptions = [currentYear - 2, currentYear - 1, currentYear];

    return (
      <ScrollView style={styles.tabContent}>
        {/* 연도 선택 및 내보내기 버튼 */}
        <Card style={styles.settingsCard}>
          <Card.Content>
            <View style={styles.reportHeader}>
              <Text style={styles.cardTitle}>{t('duesManagement.report.title')}</Text>
              <Button
                mode='contained'
                onPress={handleExportToExcel}
                icon='share-variant'
                compact
                disabled={!reportData || reportData.members.length === 0}
              >
                {t('duesManagement.actions.share')}
              </Button>
            </View>

            {/* 연도 선택 버튼 */}
            <View style={styles.yearSelector}>
              {yearOptions.map(year => (
                <TouchableOpacity
                  key={year}
                  style={[styles.yearButton, reportYear === year && styles.yearButtonActive]}
                  onPress={() => setReportYear(year)}
                >
                  <Text
                    style={[
                      styles.yearButtonText,
                      reportYear === year && styles.yearButtonTextActive,
                    ]}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* 보고서 테이블 */}
        <Card style={styles.settingsCard}>
          <Card.Content>
            {isLoadingReport ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size='large' color={themeColors.colors.primary} />
                <Text style={[styles.emptySubtitle, { marginTop: 12 }]}>
                  {t('duesManagement.report.loading')}
                </Text>
              </View>
            ) : !reportData || reportData.members.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📊</Text>
                <Text style={styles.emptyTitle}>{t('duesManagement.report.noData')}</Text>
                <Text style={styles.emptySubtitle}>
                  {t('duesManagement.report.noRecordsFound', { year: reportYear })}
                </Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator>
                <View>
                  {/* 테이블 헤더 */}
                  <View style={styles.reportTableHeader}>
                    <View style={[styles.reportCell, styles.reportNameCell]}>
                      <Text style={styles.reportHeaderText}>
                        {t('duesManagement.report.memberColumn')}
                      </Text>
                    </View>
                    {monthNames.map((month, idx) => (
                      <View key={idx} style={styles.reportCell}>
                        <Text style={styles.reportHeaderText}>{month}</Text>
                      </View>
                    ))}
                    <View style={[styles.reportCell, styles.reportTotalCell]}>
                      <Text style={styles.reportHeaderText}>
                        {t('duesManagement.report.totalColumn')}
                      </Text>
                    </View>
                  </View>

                  {/* 테이블 데이터 */}
                  {reportData.members.map((member, memberIdx) => (
                    <View
                      key={member.userId}
                      style={[
                        styles.reportTableRow,
                        memberIdx % 2 === 1 && styles.reportTableRowAlt,
                      ]}
                    >
                      <View style={[styles.reportCell, styles.reportNameCell]}>
                        <Text style={styles.reportCellText} numberOfLines={1}>
                          {member.displayName}
                        </Text>
                      </View>
                      {member.monthlyPayments.map((payment, monthIdx) => (
                        <View key={monthIdx} style={styles.reportCell}>
                          <Text
                            style={[
                              styles.reportCellText,
                              payment > 0 && styles.reportCellTextPaid,
                            ]}
                          >
                            {payment > 0 ? formatCurrency(payment) : '-'}
                          </Text>
                        </View>
                      ))}
                      <View style={[styles.reportCell, styles.reportTotalCell]}>
                        <Text style={[styles.reportCellText, styles.reportCellTextTotal]}>
                          {formatCurrency(member.total)}
                        </Text>
                      </View>
                    </View>
                  ))}

                  {/* 합계 행 */}
                  <View style={[styles.reportTableRow, styles.reportTotalRow]}>
                    <View style={[styles.reportCell, styles.reportNameCell]}>
                      <Text style={styles.reportTotalText}>
                        {t('duesManagement.report.monthlyTotal')}
                      </Text>
                    </View>
                    {reportData.monthlyTotals.map((total, idx) => (
                      <View key={idx} style={styles.reportCell}>
                        <Text style={styles.reportTotalText}>
                          {total > 0 ? formatCurrency(total) : '-'}
                        </Text>
                      </View>
                    ))}
                    <View style={[styles.reportCell, styles.reportTotalCell]}>
                      <Text style={[styles.reportTotalText, styles.reportGrandTotal]}>
                        {formatCurrency(reportData.grandTotal)}
                      </Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    );
  };

  const renderScene = SceneMap({
    settings: SettingsRoute,
    status: StatusRoute,
    overdue: OverdueRoute,
    report: ReportRoute,
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Surface style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name='chevron-back' size={24} color='#333' />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('duesManagement.title')}</Text>
          <Text style={styles.headerSubtitle}>{clubName}</Text>
        </View>

        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Ionicons name='refresh-outline' size={24} color='#666' />
        </TouchableOpacity>
      </Surface>

      {/* Tab View */}
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width }}
        renderTabBar={props => (
          <TabBar
            {...props}
            indicatorStyle={styles.tabIndicator}
            style={styles.tabBar}
            activeColor={themeColors.colors.primary}
            inactiveColor='#666'
          />
        )}
      />

      {/* Settings Dialog */}
      <Portal>
        <Dialog visible={showSettingsDialog} onDismiss={() => setShowSettingsDialog(false)}>
          <Dialog.Title>{t('duesManagement.modals.editDuesSettings')}</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <ScrollView>
              <View style={styles.dialogFormContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('duesManagement.fees.joinFee')} ($)</Text>
                  <TextInput
                    value={editJoinFee}
                    onChangeText={setEditJoinFee}
                    keyboardType='numeric'
                    mode='flat'
                    style={styles.dialogInput}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('duesManagement.fees.monthlyFee')} ($)</Text>
                  <TextInput
                    value={editMonthlyFee}
                    onChangeText={setEditMonthlyFee}
                    keyboardType='numeric'
                    mode='flat'
                    style={styles.dialogInput}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('duesManagement.fees.quarterlyFee')} ($)</Text>
                  <TextInput
                    value={editQuarterlyFee}
                    onChangeText={setEditQuarterlyFee}
                    keyboardType='numeric'
                    mode='flat'
                    style={styles.dialogInput}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('duesManagement.fees.yearlyFee')} ($)</Text>
                  <TextInput
                    value={editYearlyFee}
                    onChangeText={setEditYearlyFee}
                    keyboardType='numeric'
                    mode='flat'
                    style={styles.dialogInput}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('duesManagement.fees.dueDate')} (1-31)</Text>
                  <TextInput
                    value={editDueDate}
                    onChangeText={setEditDueDate}
                    keyboardType='numeric'
                    mode='flat'
                    style={styles.dialogInput}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {t('duesManagement.fees.gracePeriod')} ({t('duesManagement.settings.daysLabel')}
                    )
                  </Text>
                  <TextInput
                    value={editGracePeriod}
                    onChangeText={setEditGracePeriod}
                    keyboardType='numeric'
                    mode='flat'
                    style={styles.dialogInput}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('duesManagement.fees.lateFee')} ($)</Text>
                  <TextInput
                    value={editLateFee}
                    onChangeText={setEditLateFee}
                    keyboardType='numeric'
                    mode='flat'
                    style={styles.dialogInput}
                  />
                </View>
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowSettingsDialog(false)} disabled={isSaving}>
              {t('duesManagement.actions.cancel')}
            </Button>
            <Button onPress={handleSaveSettings} loading={isSaving} disabled={isSaving}>
              {t('duesManagement.actions.save')}
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Add Payment Method Dialog */}
        <Dialog
          visible={showAddPaymentMethodDialog}
          onDismiss={() => setShowAddPaymentMethodDialog(false)}
        >
          <Dialog.Title>{t('duesManagement.modals.addPaymentMethodDialog')}</Dialog.Title>
          <Dialog.Content>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('duesManagement.paymentForm.paymentMethod')}</Text>
              <TextInput
                value={newPaymentMethod}
                onChangeText={setNewPaymentMethod}
                mode='flat'
                style={styles.dialogInput}
                placeholder={t('duesManagement.inputs.addPaymentPlaceholder')}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddPaymentMethodDialog(false)}>
              {t('duesManagement.actions.cancel')}
            </Button>
            <Button onPress={addPaymentMethod} disabled={!newPaymentMethod.trim()}>
              {t('duesManagement.actions.add')}
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* QR Code Dialog */}
        <Dialog visible={showQRCodeDialog} onDismiss={() => setShowQRCodeDialog(false)}>
          <Dialog.Title>
            {selectedPaymentMethod} {t('duesManagement.modals.qrCodeDialog')}
          </Dialog.Title>
          <Dialog.Content>
            <View style={styles.qrCodeDialogContent}>
              {duesSettings.paymentQRCodes[selectedPaymentMethod] ? (
                <View style={styles.qrCodePreview}>
                  <Image
                    source={{ uri: duesSettings.paymentQRCodes[selectedPaymentMethod] }}
                    style={styles.qrCodeImage}
                    resizeMode='contain'
                  />
                  <Text style={styles.qrCodeHelperText}>
                    {t('duesManagement.modals.qrCodeHelper')}
                  </Text>
                </View>
              ) : (
                <View style={styles.qrCodePlaceholder}>
                  <Ionicons name='qr-code-outline' size={80} color='#666' />
                  <Text style={styles.qrCodePlaceholderText}>
                    {t('duesManagement.modals.noQrCodeYet')}
                  </Text>
                </View>
              )}

              {/* Payment ID Input */}
              <View style={styles.paymentIdSection}>
                <Text style={styles.paymentIdLabel}>
                  {t('duesManagement.modals.paymentIdLabel')}
                </Text>
                <View style={styles.paymentIdInputRow}>
                  <TextInput
                    value={editPaymentID}
                    onChangeText={setEditPaymentID}
                    placeholder={t('duesManagement.modals.paymentIdPlaceholder')}
                    mode='outlined'
                    style={styles.paymentIdInput}
                    dense
                  />
                  <Button
                    mode='contained'
                    onPress={savePaymentID}
                    loading={isSavingPaymentID}
                    disabled={isSavingPaymentID}
                    compact
                    style={styles.paymentIdSaveButton}
                  >
                    {t('common.save')}
                  </Button>
                </View>
                <Text style={styles.paymentIdHint}>{t('duesManagement.modals.paymentIdHint')}</Text>
              </View>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            {duesSettings.paymentQRCodes[selectedPaymentMethod] && (
              <Button onPress={deleteQRCode} textColor='#f44336'>
                {t('duesManagement.actions.delete')}
              </Button>
            )}
            <Button onPress={() => setShowQRCodeDialog(false)}>
              {t('duesManagement.actions.close')}
            </Button>
            <Button onPress={pickQRCodeImage} loading={isUploadingQR} disabled={isUploadingQR}>
              {duesSettings.paymentQRCodes[selectedPaymentMethod]
                ? t('duesManagement.actions.change')
                : t('duesManagement.modals.uploadQrCode')}
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Payment Processing Dialog - 납부 처리 모달 */}
        <Dialog visible={showPaymentDialog} onDismiss={() => setShowPaymentDialog(false)}>
          <Dialog.Title>{t('duesManagement.modals.processPaymentDialog')}</Dialog.Title>
          <Dialog.Content>
            {selectedRecord && (
              <View>
                <Text style={styles.dialogMemberName}>{selectedMemberName}</Text>
                <Text style={styles.dialogDuesType}>
                  {getDuesTypeText(selectedRecord.duesType, currentLanguage)}
                </Text>

                {/* 💵 [KIM] 금액 수정 필드 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('duesManagement.paymentForm.amount')}</Text>
                  <TextInput
                    value={paymentAmountInput}
                    onChangeText={setPaymentAmountInput}
                    mode='flat'
                    style={styles.dialogInput}
                    keyboardType='decimal-pad'
                    left={<TextInput.Affix text='$' />}
                  />
                </View>

                <Divider style={styles.dialogDivider} />

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {t('duesManagement.paymentForm.paymentMethod')}
                  </Text>
                  <View style={styles.paymentMethodSelector}>
                    {(['venmo', 'paypal', 'zelle', 'cash', 'bank_transfer'] as PaymentMethod[]).map(
                      method => (
                        <Chip
                          key={method}
                          selected={paymentMethodInput === method}
                          onPress={() => setPaymentMethodInput(method)}
                          style={styles.paymentMethodChip}
                        >
                          {method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' ')}
                        </Chip>
                      )
                    )}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {t('duesManagement.paymentForm.transactionId')}
                  </Text>
                  <TextInput
                    value={transactionIdInput}
                    onChangeText={setTransactionIdInput}
                    mode='flat'
                    style={styles.dialogInput}
                    placeholder={t('duesManagement.paymentForm.transactionPlaceholder')}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('duesManagement.paymentForm.notes')}</Text>
                  <TextInput
                    value={paymentNotesInput}
                    onChangeText={setPaymentNotesInput}
                    mode='flat'
                    style={styles.dialogInput}
                    placeholder={t('duesManagement.paymentForm.notesPlaceholder')}
                    multiline
                  />
                </View>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowPaymentDialog(false)} disabled={isProcessingPayment}>
              {t('duesManagement.actions.cancel')}
            </Button>
            {/* 🗑️ [KIM] 삭제 버튼 추가 */}
            <Button
              onPress={handleDeleteRecordFromDialog}
              disabled={isProcessingPayment}
              textColor='#f44336'
            >
              {t('duesManagement.actions.delete')}
            </Button>
            <Button
              onPress={handleMarkRecordAsPaid}
              loading={isProcessingPayment}
              disabled={isProcessingPayment}
            >
              {t('duesManagement.actions.markAsPaid')}
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Approval Detail Dialog */}
        <Dialog
          visible={showApprovalDetailModal}
          onDismiss={() => setShowApprovalDetailModal(false)}
          style={styles.approvalDetailDialog}
        >
          <Dialog.Title>{t('duesManagement.modals.paymentDetails')}</Dialog.Title>
          <Dialog.Content style={styles.approvalDetailContent}>
            {selectedApprovalDetail && (
              <>
                {/* Compact Info Row - 2x2 Grid */}
                <View style={styles.approvalInfoGrid}>
                  <View style={styles.approvalInfoItem}>
                    <Text style={styles.approvalDetailLabelCompact}>
                      {t('duesManagement.paymentDetails.member')}
                    </Text>
                    <Text style={styles.approvalDetailValueCompact}>
                      {membersDuesSummary.find(m => m.userId === selectedApprovalDetail.userId)
                        ?.displayName || t('common.unknown')}
                    </Text>
                  </View>
                  <View style={styles.approvalInfoItem}>
                    <Text style={styles.approvalDetailLabelCompact}>
                      {t('duesManagement.paymentDetails.type')}
                    </Text>
                    <Text style={styles.approvalDetailValueCompact}>
                      {selectedApprovalDetail.requestedPaymentType === 'quarterly'
                        ? t('duesManagement.fees.quarterlyFee')
                        : selectedApprovalDetail.requestedPaymentType === 'custom'
                          ? t('duesManagement.types.custom')
                          : getDuesTypeText(selectedApprovalDetail.duesType, currentLanguage)}
                    </Text>
                  </View>
                  <View style={styles.approvalInfoItem}>
                    <Text style={styles.approvalDetailLabelCompact}>
                      {t('duesManagement.paymentDetails.amount')}
                    </Text>
                    <Text
                      style={[
                        styles.approvalDetailValueCompact,
                        { color: themeColors.colors.primary },
                      ]}
                    >
                      {formatCurrency(
                        selectedApprovalDetail.requestedAmount || selectedApprovalDetail.amount
                      )}
                    </Text>
                  </View>
                  {selectedApprovalDetail.paymentRequestedMethod && (
                    <View style={styles.approvalInfoItem}>
                      <Text style={styles.approvalDetailLabelCompact}>
                        {t('duesManagement.paymentDetails.method')}
                      </Text>
                      <Text style={styles.approvalDetailValueCompact}>
                        {selectedApprovalDetail.paymentRequestedMethod}
                      </Text>
                    </View>
                  )}
                  {selectedApprovalDetail.paymentRequestedAt && (
                    <View style={styles.approvalInfoItem}>
                      <Text style={styles.approvalDetailLabelCompact}>
                        {t('duesManagement.paymentDetails.requested')}
                      </Text>
                      <Text style={styles.approvalDetailValueCompact}>
                        {selectedApprovalDetail.paymentRequestedAt.toDate
                          ? selectedApprovalDetail.paymentRequestedAt
                              .toDate()
                              .toLocaleDateString(currentLanguage === 'ko' ? 'ko-KR' : 'en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                          : new Date((selectedApprovalDetail.paymentRequestedAt as unknown as { toDate: () => Date }).toDate?.() ?? selectedApprovalDetail.paymentRequestedAt).toLocaleDateString(
                              currentLanguage === 'ko' ? 'ko-KR' : 'en-US',
                              {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Notes */}
                {selectedApprovalDetail.requestNotes && (
                  <>
                    <Text style={styles.approvalDetailLabel}>
                      {t('duesManagement.paymentDetails.notes')}
                    </Text>
                    <Text style={styles.approvalDetailNotes}>
                      {selectedApprovalDetail.requestNotes}
                    </Text>
                  </>
                )}

                {/* Proof Image */}
                {selectedApprovalDetail.paymentProofImageUrl && (
                  <>
                    <Text style={styles.approvalDetailLabel}>
                      {t('duesManagement.paymentDetails.paymentProof')}
                    </Text>
                    <Image
                      source={{ uri: selectedApprovalDetail.paymentProofImageUrl }}
                      style={styles.approvalDetailImage}
                      resizeMode='contain'
                    />
                  </>
                )}
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowApprovalDetailModal(false)}>
              {t('duesManagement.actions.close')}
            </Button>
            <Button
              onPress={() => {
                if (selectedApprovalDetail) {
                  handleRejectPayment(selectedApprovalDetail);
                }
                setShowApprovalDetailModal(false);
              }}
              textColor='#f44336'
            >
              {t('duesManagement.actions.reject')}
            </Button>
            <Button
              mode='contained'
              onPress={() => {
                if (selectedApprovalDetail) {
                  handleApprovePayment(selectedApprovalDetail);
                }
                setShowApprovalDetailModal(false);
              }}
            >
              {t('duesManagement.actions.approve')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
      paddingHorizontal: 16,
      paddingVertical: 12,
      elevation: 2,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    backButton: {
      padding: 8,
    },
    headerContent: {
      flex: 1,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.onSurface,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
    },
    refreshButton: {
      padding: 8,
    },
    tabBar: {
      backgroundColor: colors.surface,
    },
    tabIndicator: {
      backgroundColor: colors.primary,
    },
    tabLabel: {
      fontWeight: 'bold',
      fontSize: 14,
    },
    tabContent: {
      flex: 1,
      padding: 16,
    },
    settingsCard: {
      marginBottom: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outline,
      borderRadius: 12,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.onSurface,
      flex: 1,
      flexShrink: 1,
    },
    cardTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      gap: 8,
    },
    autoInvoiceToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 0,
    },
    autoInvoiceLabel: {
      fontSize: 11,
      color: colors.onSurfaceVariant,
      marginRight: 4,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
    },
    settingLabel: {
      fontSize: 16,
      color: colors.onSurfaceVariant,
    },
    settingValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.primary,
    },
    divider: {
      marginVertical: 8,
      backgroundColor: colors.outline,
    },
    editButton: {
      marginTop: 16,
    },
    paymentMethodsCard: {
      marginBottom: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outline,
      borderRadius: 12,
    },
    paymentMethodItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    paymentMethodText: {
      fontSize: 16,
      color: colors.onSurface,
    },
    paymentMethodActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    activeChip: {
      backgroundColor: colors.primaryContainer || colors.surfaceVariant,
    },
    qrCodeChip: {
      backgroundColor: colors.tertiaryContainer || '#4caf5020',
    },
    removeButton: {
      padding: 4,
    },
    addPaymentButton: {
      marginTop: 12,
    },
    statsCard: {
      marginBottom: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outline,
      borderRadius: 12,
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 16,
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.primary,
    },
    statLabel: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginTop: 4,
    },
    progressBar: {
      height: 8,
      borderRadius: 4,
      marginBottom: 8,
    },
    progressText: {
      textAlign: 'center',
      fontSize: 14,
      color: colors.onSurfaceVariant,
    },
    duesInfoText: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      marginTop: 12,
      paddingHorizontal: 8,
      fontStyle: 'italic',
    },
    membersCard: {
      marginBottom: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outline,
      borderRadius: 12,
    },
    memberAvatar: {
      backgroundColor: colors.primary,
    },
    memberStatus: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusChip: {
      marginLeft: 8,
    },
    paidChip: {
      backgroundColor: '#4caf50',
    },
    unpaidChip: {
      backgroundColor: '#f44336',
    },
    emptyCard: {
      marginBottom: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outline,
      borderRadius: 12,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.onSurface,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },
    overdueMemberCard: {
      marginBottom: 12,
      backgroundColor: colors.errorContainer || colors.surface,
      borderWidth: 1,
      borderColor: colors.error || '#f44336',
      borderRadius: 12,
    },
    overdueMemberHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    memberInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    overdueMemberAvatar: {
      backgroundColor: colors.error || '#f44336',
      marginRight: 12,
    },
    memberDetails: {
      flex: 1,
    },
    memberName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.onSurface,
    },
    memberSubtext: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginTop: 2,
    },
    memberNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    exemptChip: {
      backgroundColor: '#9e9e9e50',
      marginLeft: 4,
      paddingHorizontal: 2,
    },
    exemptChipText: {
      fontSize: 11,
      color: '#ffffff',
      fontWeight: '600',
      marginVertical: 0,
      marginHorizontal: 4,
    },
    exemptToggleButton: {
      padding: 4,
      marginRight: 4,
    },
    amountOwed: {
      alignItems: 'flex-end',
    },
    owedAmount: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.error || '#f44336',
    },
    owedLabel: {
      fontSize: 10,
      color: colors.onSurfaceVariant,
      marginTop: 2,
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
    },
    reminderButton: {
      flex: 1,
    },
    markPaidButton: {
      flex: 1,
    },
    dialogScrollArea: {
      maxHeight: 450,
      paddingHorizontal: 0,
    },
    dialogFormContainer: {
      paddingHorizontal: 24,
      paddingVertical: 8,
    },
    inputGroup: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.onSurfaceVariant,
      marginBottom: 4,
    },
    dialogInput: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: 8,
    },
    // QR Code Dialog styles
    qrCodeDialogContent: {
      alignItems: 'center',
      paddingVertical: 16,
    },
    qrCodePreview: {
      alignItems: 'center',
    },
    qrCodeImage: {
      width: 200,
      height: 200,
      borderRadius: 12,
      marginBottom: 12,
    },
    qrCodeHelperText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },
    qrCodePlaceholder: {
      alignItems: 'center',
      padding: 24,
    },
    qrCodePlaceholderText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginTop: 12,
      textAlign: 'center',
    },
    // Payment ID 입력 스타일
    paymentIdSection: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.outline,
    },
    paymentIdLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 8,
    },
    paymentIdInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    paymentIdInput: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    paymentIdSaveButton: {
      marginLeft: 4,
    },
    paymentIdHint: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginTop: 6,
      fontStyle: 'italic',
    },
    // 새로운 회비 현황 스타일
    sectionHeader: {
      marginBottom: 12,
    },
    pendingApprovalItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    pendingApprovalInfo: {
      flex: 1,
      marginRight: 8,
    },
    pendingApprovalActions: {
      flexDirection: 'row',
      gap: 8,
      flexShrink: 0,
      alignItems: 'center',
    },
    approveButton: {
      backgroundColor: '#4caf50',
      borderRadius: 20,
      minWidth: 56,
    },
    rejectButton: {
      borderColor: '#f44336',
      borderRadius: 20,
      minWidth: 56,
    },
    memberDuesCard: {
      paddingVertical: 12,
    },
    memberDuesHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    memberDuesInfo: {
      flex: 1,
      marginLeft: 12,
    },
    addRecordButton: {
      padding: 4,
    },
    duesTypeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginLeft: 52,
    },
    duesTypeItem: {
      width: '47%',
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.surfaceVariant,
      alignItems: 'center',
    },
    duesTypeLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.onSurfaceVariant,
      marginBottom: 4,
    },
    // 새로운 리스트 형태 스타일
    duesItemList: {
      marginLeft: 52,
    },
    duesItemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 8,
      marginBottom: 8,
    },
    duesItemLeft: {
      flex: 1,
    },
    duesItemRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    duesItemLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.onSurface,
    },
    duesItemPeriod: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginTop: 2,
    },
    duesItemAmount: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.onSurface,
      minWidth: 60,
      textAlign: 'right',
    },
    duesPeriod: {
      fontSize: 10,
      color: colors.onSurfaceVariant,
      marginBottom: 2,
    },
    duesAmount: {
      fontSize: 11,
      color: colors.onSurfaceVariant,
      marginTop: 4,
    },
    noRecordChip: {
      backgroundColor: colors.surfaceVariant,
    },
    chipText: {
      fontSize: 11,
    },
    memberDuesDivider: {
      marginTop: 12,
      backgroundColor: colors.outline,
    },
    // Payment Dialog 스타일
    dialogMemberName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.onSurface,
      marginBottom: 4,
    },
    dialogDuesType: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
    },
    dialogDivider: {
      marginVertical: 16,
      backgroundColor: colors.outline,
    },
    paymentMethodSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
    },
    paymentMethodChip: {
      marginBottom: 4,
    },
    // Approval Detail Modal styles
    approvalDetailDialog: {
      maxHeight: '80%',
    },
    approvalDetailContent: {
      paddingHorizontal: 24,
      paddingTop: 0,
      paddingBottom: 8,
    },
    approvalInfoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 8,
    },
    approvalInfoItem: {
      width: '50%',
      paddingVertical: 6,
    },
    approvalDetailLabelCompact: {
      fontSize: 11,
      fontWeight: '500',
      color: colors.onSurfaceVariant,
      marginBottom: 2,
    },
    approvalDetailValueCompact: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.onSurface,
    },
    approvalDetailLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.onSurfaceVariant,
      marginTop: 8,
      marginBottom: 4,
    },
    approvalDetailImage: {
      width: '100%',
      height: 180,
      borderRadius: 8,
      marginTop: 4,
      backgroundColor: colors.surfaceVariant,
    },
    approvalDetailNotes: {
      fontSize: 14,
      color: colors.onSurface,
      backgroundColor: colors.surfaceVariant,
      padding: 12,
      borderRadius: 8,
      marginTop: 4,
    },
    pendingApprovalMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 6,
    },
    methodChip: {
      backgroundColor: colors.primaryContainer || colors.surfaceVariant,
    },
    proofChip: {
      backgroundColor: colors.tertiaryContainer || '#4caf5020',
    },
    // Report Tab 스타일
    reportHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    yearSelector: {
      flexDirection: 'row',
      gap: 8,
    },
    yearButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.surfaceVariant,
    },
    yearButtonActive: {
      backgroundColor: colors.primary,
    },
    yearButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.onSurfaceVariant,
    },
    yearButtonTextActive: {
      color: colors.onPrimary || '#ffffff',
    },
    reportTableHeader: {
      flexDirection: 'row',
      backgroundColor: colors.primaryContainer || colors.surfaceVariant,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
    },
    reportTableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.outline + '30',
    },
    reportTableRowAlt: {
      backgroundColor: colors.surfaceVariant + '30',
    },
    reportTotalRow: {
      backgroundColor: colors.primaryContainer || colors.surfaceVariant,
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
    },
    reportCell: {
      width: 60,
      paddingVertical: 10,
      paddingHorizontal: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    reportNameCell: {
      width: 80,
      alignItems: 'flex-start',
      paddingLeft: 8,
    },
    reportTotalCell: {
      width: 70,
      backgroundColor: colors.surfaceVariant + '50',
    },
    reportHeaderText: {
      fontSize: 11,
      fontWeight: 'bold',
      color: colors.onSurface,
    },
    reportCellText: {
      fontSize: 11,
      color: colors.onSurfaceVariant,
    },
    reportCellTextPaid: {
      color: colors.primary,
      fontWeight: '500',
    },
    reportCellTextTotal: {
      fontWeight: 'bold',
      color: colors.onSurface,
    },
    reportTotalText: {
      fontSize: 11,
      fontWeight: 'bold',
      color: colors.onSurface,
    },
    reportGrandTotal: {
      color: colors.primary,
      fontSize: 12,
    },
  });

export default DuesManagementScreen;
