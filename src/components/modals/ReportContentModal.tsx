/**
 * Report Content Modal - Apple Guideline 1.2 Compliance
 *
 * 콘텐츠 신고 모달
 * - 신고 사유 선택 (라디오 버튼)
 * - 추가 설명 입력 (선택)
 * - 제출 버튼
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../contexts/AuthContext';
import reportService, {
  ReportReason,
  ReportTargetType,
  ContentReport,
} from '../../services/reportService';

interface ReportContentModalProps {
  visible: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetOwnerId: string;
  targetOwnerName: string;
  targetSnapshot?: Record<string, unknown>;
}

interface ReasonOption {
  key: ReportReason;
  labelKey: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const REPORT_REASONS: ReasonOption[] = [
  { key: 'spam', labelKey: 'report.reasons.spam', icon: 'mail-unread-outline' },
  { key: 'harassment', labelKey: 'report.reasons.harassment', icon: 'person-remove-outline' },
  { key: 'inappropriate', labelKey: 'report.reasons.inappropriate', icon: 'warning-outline' },
  { key: 'hate_speech', labelKey: 'report.reasons.hate_speech', icon: 'megaphone-outline' },
  { key: 'violence', labelKey: 'report.reasons.violence', icon: 'flame-outline' },
  { key: 'other', labelKey: 'report.reasons.other', icon: 'ellipsis-horizontal-outline' },
];

export const ReportContentModal: React.FC<ReportContentModalProps> = ({
  visible,
  onClose,
  targetType,
  targetId,
  targetOwnerId,
  targetOwnerName,
  targetSnapshot,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { currentUser } = useAuth();

  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert(
        t('report.error', 'Error'),
        t('report.selectReason', 'Please select a reason for your report.')
      );
      return;
    }

    if (!currentUser) {
      Alert.alert(t('common.error'), t('common.loginRequired', 'Please log in to continue.'));
      return;
    }

    try {
      setIsSubmitting(true);

      // 이미 신고했는지 확인
      const alreadyReported = await reportService.hasUserReported(
        currentUser.uid,
        targetType,
        targetId
      );

      if (alreadyReported) {
        Alert.alert(
          t('report.alreadyReported', 'Already Reported'),
          t('report.alreadyReportedMessage', 'You have already reported this content.')
        );
        onClose();
        return;
      }

      const reportData: Omit<ContentReport, 'id' | 'createdAt' | 'status'> = {
        reporterId: currentUser.uid,
        reporterEmail: currentUser.email || '',
        reporterName: currentUser.displayName || 'Unknown',
        targetType,
        targetId,
        targetOwnerId,
        targetOwnerName,
        reason: selectedReason,
        // Optional fields - only include if defined (Firestore doesn't accept undefined)
        ...(targetSnapshot && { targetSnapshot }),
        ...(description.trim() && { description: description.trim() }),
      };

      await reportService.submitReport(reportData);

      Alert.alert(
        t('report.success', 'Report Submitted'),
        t('report.successMessage', 'Thank you for your report. We will review it within 24 hours.')
      );

      // Reset and close
      setSelectedReason(null);
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert(
        t('common.error'),
        t('report.submitError', 'Failed to submit report. Please try again.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setDescription('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType='slide' transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.overlay}>
          <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surface }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.colors.outline }]}>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name='close' size={24} color={theme.colors.onSurface} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
                {t('report.title', 'Report Content')}
              </Text>
              <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Target Info */}
              <View style={[styles.targetInfo, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Ionicons
                  name='information-circle-outline'
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text style={[styles.targetInfoText, { color: theme.colors.onSurfaceVariant }]}>
                  {t('report.reportingUser', 'Reporting')}: {targetOwnerName}
                </Text>
              </View>

              {/* Reason Selection */}
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                {t('report.selectReasonTitle', 'Why are you reporting this?')}
              </Text>

              <View style={styles.reasonsContainer}>
                {REPORT_REASONS.map(reason => (
                  <TouchableOpacity
                    key={reason.key}
                    style={[
                      styles.reasonOption,
                      { backgroundColor: theme.colors.surfaceVariant },
                      selectedReason === reason.key && {
                        backgroundColor: theme.colors.primaryContainer,
                        borderColor: theme.colors.primary,
                        borderWidth: 2,
                      },
                    ]}
                    onPress={() => setSelectedReason(reason.key)}
                  >
                    <Ionicons
                      name={reason.icon}
                      size={24}
                      color={
                        selectedReason === reason.key
                          ? theme.colors.primary
                          : theme.colors.onSurfaceVariant
                      }
                    />
                    <Text
                      style={[
                        styles.reasonLabel,
                        {
                          color:
                            selectedReason === reason.key
                              ? theme.colors.primary
                              : theme.colors.onSurface,
                        },
                      ]}
                    >
                      {t(reason.labelKey, reason.key)}
                    </Text>
                    {selectedReason === reason.key && (
                      <Ionicons name='checkmark-circle' size={24} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Additional Description */}
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                {t('report.additionalDetails', 'Additional details (optional)')}
              </Text>

              <TextInput
                style={[
                  styles.descriptionInput,
                  {
                    backgroundColor: theme.colors.surfaceVariant,
                    color: theme.colors.onSurface,
                    borderColor: theme.colors.outline,
                  },
                ]}
                placeholder={t(
                  'report.descriptionPlaceholder',
                  'Provide more details about your report...'
                )}
                placeholderTextColor={theme.colors.onSurfaceVariant}
                multiline
                numberOfLines={4}
                maxLength={500}
                value={description}
                onChangeText={setDescription}
                textAlignVertical='top'
              />

              <Text style={[styles.charCount, { color: theme.colors.onSurfaceVariant }]}>
                {description.length}/500
              </Text>
            </ScrollView>

            {/* Submit Button */}
            <View style={[styles.footer, { borderTopColor: theme.colors.outline }]}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: theme.colors.error },
                  (!selectedReason || isSubmitting) && { opacity: 0.5 },
                ]}
                onPress={handleSubmit}
                disabled={!selectedReason || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={theme.colors.onError} />
                ) : (
                  <>
                    <Ionicons name='flag' size={20} color={theme.colors.onError} />
                    <Text style={[styles.submitButtonText, { color: theme.colors.onError }]}>
                      {t('report.submit', 'Submit Report')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    padding: 16,
  },
  targetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  targetInfoText: {
    fontSize: 14,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  reasonsContainer: {
    gap: 8,
    marginBottom: 24,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  reasonLabel: {
    fontSize: 16,
    flex: 1,
  },
  descriptionInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    fontSize: 16,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReportContentModal;
