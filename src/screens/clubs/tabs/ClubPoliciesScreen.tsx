import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Text as PaperText, Card, Chip, Divider, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { db } from '../../../firebase/config';
import { useTheme } from '../../../hooks/useTheme';
import { getLightningTennisTheme } from '../../../theme';
import { useLanguage } from '../../../contexts/LanguageContext';
import { formatPriceByCountry, formatPriceByCurrencyCode } from '../../../utils/currencyUtils';

// 🚨 [LEGAL REVIEW] 결제 수단 기능 비활성화 - 법적 검토 후 활성화 예정
const SHOW_PAYMENT_METHODS = false;

type RootStackParamList = {
  MemberDuesPayment: { clubId: string; clubName: string };
};

interface ClubPoliciesScreenProps {
  clubId: string;
  clubName?: string;
  userRole: string;
}

interface Meeting {
  day: string;
  startTime: string;
  endTime: string;
  recurring?: boolean;
}

interface ClubData {
  profile?: {
    rules?: string[] | string;
    description?: string;
  };
  facilities?: string[];
  settings?: {
    meetings?: Meeting[];
    membershipFee?: number;
    joinFee?: number;
    yearlyFee?: number;
    dueDate?: number;
    lateFee?: number;
    gracePeriod?: number;
    paymentMethods?: string[];
    paymentQRCodes?: Record<string, string>;
    paymentIDs?: Record<string, string>;
  };
  // 💰 Currency code based on court location (e.g., 'USD', 'RUB', 'KRW')
  currency?: string;
  // 📍 Court address with country info
  courtAddress?: {
    country?: string;
  };
}

const ClubPoliciesScreen: React.FC<ClubPoliciesScreenProps> = ({ clubId, clubName, userRole }) => {
  // Check if user is a club member (has any valid role)
  const isMember = userRole !== null && userRole !== 'none' && userRole !== '';
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningTennisTheme(currentTheme);
  const styles = createStyles(themeColors.colors);
  const { t } = useLanguage();

  const [clubData, setClubData] = useState<ClubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [selectedQRMethod, setSelectedQRMethod] = useState<string>('');
  const [selectedQRUrl, setSelectedQRUrl] = useState<string>('');
  const [selectedPaymentID, setSelectedPaymentID] = useState<string>('');

  useEffect(() => {
    const loadClubData = async () => {
      try {
        console.log('🦾 [IRON MAN] Loading club data for policies...', clubId);
        const clubRef = doc(db, 'tennis_clubs', clubId);
        const clubSnap = await getDoc(clubRef);

        if (clubSnap.exists()) {
          setClubData(clubSnap.data() as ClubData);
          console.log('✅ [IRON MAN] Club data loaded successfully');
        }
      } catch (error) {
        console.error('❌ [IRON MAN] Error loading club data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadClubData();
  }, [clubId]);

  // Helper function to format day names
  // Handles multiple formats: "monday", "Mon", "월요일", "월", etc.
  const formatDayName = (day: string): string => {
    if (!day) return '';
    const lowerDay = day.toLowerCase();

    // Map all possible day formats to translation keys
    const dayMap: Record<string, string> = {
      // English full names
      monday: t('clubPolicies.days.monday'),
      tuesday: t('clubPolicies.days.tuesday'),
      wednesday: t('clubPolicies.days.wednesday'),
      thursday: t('clubPolicies.days.thursday'),
      friday: t('clubPolicies.days.friday'),
      saturday: t('clubPolicies.days.saturday'),
      sunday: t('clubPolicies.days.sunday'),
      // English short names
      mon: t('clubPolicies.days.monday'),
      tue: t('clubPolicies.days.tuesday'),
      wed: t('clubPolicies.days.wednesday'),
      thu: t('clubPolicies.days.thursday'),
      fri: t('clubPolicies.days.friday'),
      sat: t('clubPolicies.days.saturday'),
      sun: t('clubPolicies.days.sunday'),
      // Korean full names
      월요일: t('clubPolicies.days.monday'),
      화요일: t('clubPolicies.days.tuesday'),
      수요일: t('clubPolicies.days.wednesday'),
      목요일: t('clubPolicies.days.thursday'),
      금요일: t('clubPolicies.days.friday'),
      토요일: t('clubPolicies.days.saturday'),
      일요일: t('clubPolicies.days.sunday'),
      // Korean short names
      월: t('clubPolicies.days.monday'),
      화: t('clubPolicies.days.tuesday'),
      수: t('clubPolicies.days.wednesday'),
      목: t('clubPolicies.days.thursday'),
      금: t('clubPolicies.days.friday'),
      토: t('clubPolicies.days.saturday'),
      일: t('clubPolicies.days.sunday'),
    };

    // Try lowercase first, then original (for Korean)
    return dayMap[lowerDay] || dayMap[day] || day;
  };

  // 💰 Helper function to format currency based on CLUB's court location
  const formatCurrency = (amount: number): string => {
    // 1st priority: Use club's saved currency code (from Firestore)
    if (clubData?.currency) {
      return formatPriceByCurrencyCode(amount, clubData.currency);
    }
    // 2nd priority: Use club's court address country
    const courtCountry = clubData?.courtAddress?.country;
    if (courtCountry) {
      return formatPriceByCountry(amount, courtCountry);
    }
    // Fallback: USD
    return formatPriceByCountry(amount, 'United States');
  };

  // Helper function to get rules array
  const getRulesArray = (): string[] => {
    const rules = clubData?.profile?.rules;
    if (!rules) return [];
    if (typeof rules === 'string') {
      return rules.split('\n').filter(rule => rule.trim());
    }
    if (Array.isArray(rules)) {
      return rules.filter(rule => rule && String(rule).trim());
    }
    return [];
  };

  // Helper function to get meetings array
  const getMeetingsArray = (): Meeting[] => {
    const meetings = clubData?.settings?.meetings;
    if (!meetings || !Array.isArray(meetings)) return [];
    return meetings.filter(meeting => meeting && meeting.day);
  };

  // Helper function to format meeting time
  const formatMeetingTime = (meeting: Meeting): string => {
    const start = meeting.startTime || '';
    const end = meeting.endTime || '';
    if (start && end && start !== end) {
      return `${start} - ${end}`;
    }
    return start;
  };

  // Helper function to check if payment method has QR code
  const hasQRCode = (method: string): boolean => {
    return Boolean(clubData?.settings?.paymentQRCodes?.[method]);
  };

  // Helper function to check if payment method has payment ID
  const hasPaymentID = (method: string): boolean => {
    return Boolean(clubData?.settings?.paymentIDs?.[method]);
  };

  // Helper function to check if payment method has QR code or payment ID
  const hasQRCodeOrPaymentID = (method: string): boolean => {
    return hasQRCode(method) || hasPaymentID(method);
  };

  // Open QR code dialog
  const openQRDialog = (method: string) => {
    const qrUrl = clubData?.settings?.paymentQRCodes?.[method] || '';
    const paymentID = clubData?.settings?.paymentIDs?.[method] || '';
    if (qrUrl || paymentID) {
      setSelectedQRMethod(method);
      setSelectedQRUrl(qrUrl);
      setSelectedPaymentID(paymentID);
      setShowQRDialog(true);
    }
  };

  // Check if we have any data to show
  const rulesArray = getRulesArray();
  const meetingsArray = getMeetingsArray();
  const hasRules = rulesArray.length > 0;
  const hasMeetings = meetingsArray.length > 0;
  const hasDescription = Boolean(clubData?.profile?.description?.trim());
  const hasFacilities = Boolean(clubData?.facilities && clubData.facilities.length > 0);
  const hasJoinFee = Boolean(clubData?.settings?.joinFee && clubData.settings.joinFee > 0);
  const hasMembershipFee = Boolean(
    clubData?.settings?.membershipFee && clubData.settings.membershipFee > 0
  );
  const hasYearlyFee = Boolean(clubData?.settings?.yearlyFee && clubData.settings.yearlyFee > 0);
  const hasDueDate = Boolean(clubData?.settings?.dueDate && clubData.settings.dueDate > 0);
  const hasLateFee = Boolean(clubData?.settings?.lateFee && clubData.settings.lateFee > 0);
  const hasPaymentMethods = Boolean(
    clubData?.settings?.paymentMethods && clubData.settings.paymentMethods.length > 0
  );
  const hasFees =
    hasJoinFee || hasMembershipFee || hasYearlyFee || hasDueDate || hasLateFee || hasPaymentMethods;
  const hasAnyData = hasRules || hasMeetings || hasFees || hasDescription || hasFacilities;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={themeColors.colors.primary} />
        <PaperText variant='bodyMedium' style={styles.loadingText}>
          {t('clubPolicies.loading')}
        </PaperText>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* 🦾 클럽 소개 섹션 (ClubOverviewScreen에서 이동) */}
      {hasDescription ? (
        <Card style={styles.descriptionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Ionicons name='information-circle' size={18} color={themeColors.colors.primary} />
              <PaperText variant='titleMedium' style={styles.sectionTitle}>
                {t('clubPolicies.sections.introduction')}
              </PaperText>
            </View>
            <PaperText variant='bodyMedium' style={styles.descriptionText}>
              {clubData?.profile?.description}
            </PaperText>
          </Card.Content>
        </Card>
      ) : null}

      {/* 🦾 시설 정보 섹션 (ClubOverviewScreen에서 이동) */}
      {hasFacilities ? (
        <Card style={styles.facilitiesCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Ionicons name='tennisball' size={18} color={themeColors.colors.secondary} />
              <PaperText variant='titleMedium' style={styles.sectionTitle}>
                {t('clubPolicies.sections.facilities')}
              </PaperText>
            </View>
            <View style={styles.facilitiesContainer}>
              {clubData?.facilities?.map((facility, index) => (
                <View key={index} style={styles.facilityTag}>
                  <Ionicons name='checkmark-circle' size={16} color={themeColors.colors.primary} />
                  <PaperText variant='bodyMedium' style={styles.facilityText}>
                    {facility}
                  </PaperText>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>
      ) : null}

      {hasRules ? (
        <Card style={styles.rulesCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Ionicons name='document-text' size={18} color={themeColors.colors.primary} />
              <PaperText variant='titleMedium' style={styles.sectionTitle}>
                {t('clubPolicies.sections.rules')}
              </PaperText>
            </View>
            <View style={styles.rulesContent}>
              {rulesArray.map((rule, index) => (
                <View key={index} style={styles.ruleItem}>
                  <Ionicons name='checkmark-circle' size={16} color={themeColors.colors.primary} />
                  <PaperText variant='bodySmall' style={styles.ruleText}>
                    {String(rule).trim()}
                  </PaperText>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>
      ) : null}

      {hasMeetings ? (
        <Card style={styles.meetingsCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Ionicons name='calendar' size={18} color={themeColors.colors.secondary} />
              <PaperText variant='titleMedium' style={styles.sectionTitle}>
                {t('clubPolicies.sections.meetings')}
              </PaperText>
            </View>
            <View style={styles.meetingsContent}>
              {meetingsArray.map((meeting, index) => (
                <View key={index}>
                  <View style={styles.meetingItem}>
                    <View style={styles.meetingDay}>
                      <Ionicons
                        name='time'
                        size={16}
                        color={themeColors.colors.secondary}
                        style={styles.meetingIcon}
                      />
                      <PaperText variant='bodyMedium' style={styles.meetingDayText}>
                        {formatDayName(meeting.day)}
                      </PaperText>
                    </View>
                    <PaperText variant='bodyMedium' style={styles.meetingTime}>
                      {formatMeetingTime(meeting)}
                    </PaperText>
                    {meeting.recurring ? (
                      <Chip icon='repeat' compact style={styles.recurringChip}>
                        {t('clubPolicies.recurring')}
                      </Chip>
                    ) : null}
                  </View>
                  {index < meetingsArray.length - 1 ? <Divider style={styles.divider} /> : null}
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>
      ) : null}

      {hasFees ? (
        <Card style={styles.feesCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Ionicons name='card' size={18} color={themeColors.colors.tertiary} />
              <PaperText variant='titleMedium' style={styles.sectionTitle}>
                {t('clubPolicies.sections.fees')}
              </PaperText>
            </View>
            <View style={styles.feesContent}>
              {hasJoinFee ? (
                <View style={styles.feeItem}>
                  <View style={styles.feeLabel}>
                    <Ionicons
                      name='enter'
                      size={16}
                      color={themeColors.colors.tertiary}
                      style={styles.feeIcon}
                    />
                    <PaperText variant='bodyMedium' style={styles.feeLabelText}>
                      {t('clubPolicies.fees.joinFee')}
                    </PaperText>
                  </View>
                  <PaperText variant='titleMedium' style={styles.feeAmount}>
                    {formatCurrency(clubData?.settings?.joinFee || 0)}
                  </PaperText>
                </View>
              ) : null}

              {hasMembershipFee ? (
                <View style={styles.feeItem}>
                  <View style={styles.feeLabel}>
                    <Ionicons
                      name='calendar'
                      size={16}
                      color={themeColors.colors.tertiary}
                      style={styles.feeIcon}
                    />
                    <PaperText variant='bodyMedium' style={styles.feeLabelText}>
                      {t('clubPolicies.fees.monthlyFee')}
                    </PaperText>
                  </View>
                  <PaperText variant='titleMedium' style={styles.feeAmount}>
                    {formatCurrency(clubData?.settings?.membershipFee || 0)}
                  </PaperText>
                </View>
              ) : null}

              {hasYearlyFee ? (
                <View style={styles.feeItem}>
                  <View style={styles.feeLabel}>
                    <Ionicons
                      name='calendar-outline'
                      size={16}
                      color={themeColors.colors.tertiary}
                      style={styles.feeIcon}
                    />
                    <PaperText variant='bodyMedium' style={styles.feeLabelText}>
                      {t('clubPolicies.fees.yearlyFee')}
                    </PaperText>
                  </View>
                  <PaperText variant='titleMedium' style={styles.feeAmount}>
                    {formatCurrency(clubData?.settings?.yearlyFee || 0)}
                  </PaperText>
                </View>
              ) : null}

              {hasDueDate ? (
                <View style={styles.feeItem}>
                  <View style={styles.feeLabel}>
                    <Ionicons
                      name='time-outline'
                      size={16}
                      color={themeColors.colors.tertiary}
                      style={styles.feeIcon}
                    />
                    <PaperText variant='bodyMedium' style={styles.feeLabelText}>
                      {t('clubPolicies.fees.dueDate')}
                    </PaperText>
                  </View>
                  <PaperText variant='titleMedium' style={styles.feeAmount}>
                    {t('clubPolicies.fees.dueDateValue', { day: clubData?.settings?.dueDate || 0 })}
                  </PaperText>
                </View>
              ) : null}

              {hasLateFee ? (
                <View style={styles.feeItem}>
                  <View style={styles.feeLabel}>
                    <Ionicons
                      name='warning-outline'
                      size={16}
                      color={themeColors.colors.tertiary}
                      style={styles.feeIcon}
                    />
                    <PaperText variant='bodyMedium' style={styles.feeLabelText}>
                      {t('clubPolicies.fees.lateFee')}
                    </PaperText>
                  </View>
                  <PaperText variant='titleMedium' style={styles.feeAmount}>
                    {formatCurrency(clubData?.settings?.lateFee || 0)}
                  </PaperText>
                </View>
              ) : null}

              {/* 🚨 [LEGAL REVIEW] 결제 수단 카드 - 법적 검토 후 SHOW_PAYMENT_METHODS = true로 변경하여 활성화 */}
              {SHOW_PAYMENT_METHODS && hasPaymentMethods ? (
                <View style={styles.paymentMethodsContainer}>
                  <View style={styles.feeLabel}>
                    <Ionicons
                      name='card-outline'
                      size={16}
                      color={themeColors.colors.tertiary}
                      style={styles.feeIcon}
                    />
                    <PaperText variant='bodyMedium' style={styles.feeLabelText}>
                      {t('clubPolicies.fees.paymentMethods')}
                    </PaperText>
                  </View>
                  <View style={styles.paymentMethodsChips}>
                    {clubData?.settings?.paymentMethods?.map((method, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => hasQRCodeOrPaymentID(method) && openQRDialog(method)}
                        disabled={!hasQRCodeOrPaymentID(method)}
                        activeOpacity={hasQRCodeOrPaymentID(method) ? 0.7 : 1}
                      >
                        <Chip
                          compact
                          style={[
                            styles.paymentMethodChip,
                            hasQRCodeOrPaymentID(method) && styles.paymentMethodChipWithQR,
                          ]}
                          icon={
                            hasQRCode(method)
                              ? 'qrcode'
                              : hasPaymentID(method)
                                ? 'account'
                                : undefined
                          }
                        >
                          {method}
                        </Chip>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {((clubData?.settings?.paymentQRCodes &&
                    Object.keys(clubData.settings.paymentQRCodes).length > 0) ||
                    (clubData?.settings?.paymentIDs &&
                      Object.keys(clubData.settings.paymentIDs).length > 0)) && (
                    <PaperText variant='bodySmall' style={styles.qrHintText}>
                      {t('clubPolicies.fees.qrHint')}
                    </PaperText>
                  )}
                </View>
              ) : null}

              {/* 내 회비 확인 버튼 - 회원 전용 */}
              <Divider style={styles.buttonDivider} />
              {isMember ? (
                <Button
                  mode='contained'
                  icon='wallet-outline'
                  onPress={() =>
                    navigation.navigate('MemberDuesPayment', {
                      clubId,
                      clubName: clubName || t('clubPolicies.defaultClubName'),
                    })
                  }
                  style={styles.myDuesButton}
                  contentStyle={styles.myDuesButtonContent}
                >
                  {t('clubPolicies.buttons.checkDues')}
                </Button>
              ) : (
                <Button
                  mode='outlined'
                  icon='wallet-outline'
                  disabled
                  style={styles.myDuesButton}
                  contentStyle={styles.myDuesButtonContent}
                >
                  {t('clubPolicies.buttons.membersOnly')}
                </Button>
              )}
            </View>
          </Card.Content>
        </Card>
      ) : null}

      {!hasAnyData ? (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <View style={styles.emptyState}>
              <Ionicons
                name='information-circle-outline'
                size={64}
                color={themeColors.colors.onSurfaceVariant}
              />
              <PaperText variant='titleMedium' style={styles.emptyTitle}>
                {t('clubPolicies.empty.title')}
              </PaperText>
              <PaperText variant='bodyMedium' style={styles.emptyText}>
                {t('clubPolicies.empty.description')}
              </PaperText>
            </View>
          </Card.Content>
        </Card>
      ) : null}

      <Modal
        visible={showQRDialog}
        transparent
        animationType='fade'
        onRequestClose={() => setShowQRDialog(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowQRDialog(false)}>
          <View style={styles.qrModalContainer}>
            <PaperText variant='titleMedium' style={styles.qrModalTitle}>
              {t('clubPolicies.qrModal.title', { method: selectedQRMethod })}
            </PaperText>
            {selectedQRUrl ? (
              <Image source={{ uri: selectedQRUrl }} style={styles.qrImage} resizeMode='contain' />
            ) : null}
            {selectedPaymentID ? (
              <View style={styles.paymentIdDisplay}>
                <Ionicons
                  name='person-circle-outline'
                  size={20}
                  color={themeColors.colors.primary}
                />
                <PaperText variant='bodyLarge' style={styles.paymentIdText}>
                  {t('clubPolicies.qrModal.paymentIdLabel')} {selectedPaymentID}
                </PaperText>
              </View>
            ) : null}
            <Button mode='text' onPress={() => setShowQRDialog(false)} style={styles.qrCloseButton}>
              {t('clubPolicies.qrModal.close')}
            </Button>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: 16,
      textAlign: 'center',
      color: colors.onSurfaceVariant,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      marginLeft: 12,
      fontWeight: '600',
      color: colors.onSurface,
    },
    rulesCard: {
      marginBottom: 16,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outline,
      borderRadius: 12,
    },
    rulesContent: {
      gap: 12,
    },
    ruleItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    ruleText: {
      flex: 1,
      lineHeight: 22,
      color: colors.onSurface,
    },
    meetingsCard: {
      marginBottom: 16,
      borderLeftWidth: 4,
      borderLeftColor: colors.secondary,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outline,
      borderRadius: 12,
    },
    meetingsContent: {
      gap: 0,
    },
    meetingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
    },
    meetingDay: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    meetingIcon: {
      marginRight: 8,
    },
    meetingDayText: {
      fontWeight: '600',
      color: colors.onSurface,
    },
    meetingTime: {
      fontWeight: '500',
      color: colors.primary,
      marginRight: 12,
    },
    recurringChip: {
      backgroundColor: colors.secondaryContainer,
    },
    divider: {
      backgroundColor: colors.outline,
    },
    feesCard: {
      marginBottom: 16,
      borderLeftWidth: 4,
      borderLeftColor: colors.tertiary,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outline,
      borderRadius: 12,
    },
    feesContent: {
      gap: 16,
    },
    feeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.tertiaryContainer,
      borderRadius: 12,
    },
    feeLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      flexShrink: 1,
    },
    feeIcon: {
      marginRight: 8,
    },
    feeLabelText: {
      color: colors.onTertiaryContainer,
      fontWeight: '600',
    },
    feeAmount: {
      color: colors.tertiary,
      fontWeight: 'bold',
      flexShrink: 1,
      textAlign: 'right',
      marginLeft: 8,
    },
    paymentMethodsContainer: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.tertiaryContainer,
      borderRadius: 12,
    },
    paymentMethodsChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 12,
    },
    paymentMethodChip: {
      backgroundColor: colors.surface,
    },
    paymentMethodChipWithQR: {
      backgroundColor: colors.primaryContainer,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    qrHintText: {
      marginTop: 12,
      color: colors.onTertiaryContainer,
      fontStyle: 'italic',
      textAlign: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    qrModalContainer: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      maxWidth: 300,
    },
    qrModalTitle: {
      color: colors.onSurface,
      fontWeight: '600',
      marginBottom: 12,
    },
    qrImage: {
      width: 240,
      height: 240,
      borderRadius: 8,
      backgroundColor: colors.surfaceVariant,
    },
    qrCloseButton: {
      marginTop: 8,
    },
    paymentIdDisplay: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
      padding: 12,
      backgroundColor: colors.primaryContainer,
      borderRadius: 8,
      width: '100%',
      justifyContent: 'center',
    },
    paymentIdText: {
      color: colors.onPrimaryContainer,
      fontWeight: '600',
    },
    emptyCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outline,
      borderRadius: 12,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 48,
    },
    emptyTitle: {
      marginTop: 16,
      marginBottom: 8,
      color: colors.onSurface,
      fontWeight: '600',
    },
    emptyText: {
      textAlign: 'center',
      color: colors.onSurfaceVariant,
      lineHeight: 20,
    },
    buttonDivider: {
      marginTop: 16,
      marginBottom: 16,
    },
    myDuesButton: {
      borderRadius: 8,
    },
    myDuesButtonContent: {
      paddingVertical: 4,
    },
    // 🦾 클럽 소개 스타일
    descriptionCard: {
      marginBottom: 16,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outline,
      borderRadius: 12,
    },
    descriptionText: {
      lineHeight: 22,
      color: colors.onSurface,
    },
    // 🦾 시설 정보 스타일
    facilitiesCard: {
      marginBottom: 16,
      borderLeftWidth: 4,
      borderLeftColor: colors.secondary,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outline,
      borderRadius: 12,
    },
    facilitiesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    facilityTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceVariant,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      gap: 6,
    },
    facilityText: {
      color: colors.onSurface,
      fontSize: 14,
    },
  });

export default ClubPoliciesScreen;
