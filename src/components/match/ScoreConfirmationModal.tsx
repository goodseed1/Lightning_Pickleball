/**
 * Score Confirmation Modal Component
 * 경기 점수 확인 및 승인 모달 컴포넌트
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from 'react-native-paper';
import { Match, formatMatchScore } from '../../types/match';
import { useLanguage } from '../../contexts/LanguageContext';

interface ScoreConfirmationModalProps {
  visible: boolean;
  match: Match;
  currentUserId: string;
  onClose: () => void;
  onConfirm: (agreed: boolean, reason?: string) => Promise<void>;
}

const ScoreConfirmationModal: React.FC<ScoreConfirmationModalProps> = ({
  visible,
  match,
  currentUserId,
  onClose,
  onConfirm,
}) => {
  const { t } = useLanguage();
  const [agreed, setAgreed] = useState<boolean | null>(null);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 현재 사용자가 점수를 확인해야 하는 상대방인지 확인
  const isPlayer1 = currentUserId === match.player1.userId;
  const isPlayer2 = currentUserId === match.player2.userId;
  const submittedByPlayer1 = match.scoreSubmittedBy === match.player1.userId;
  const shouldConfirm = (isPlayer1 && !submittedByPlayer1) || (isPlayer2 && submittedByPlayer1);

  if (!shouldConfirm || !match.score) {
    return null;
  }

  const submitterName = submittedByPlayer1 ? match.player1.userName : match.player2.userName;
  const formattedScore = formatMatchScore(match.score);

  const handleSubmit = async () => {
    if (agreed === null) {
      Alert.alert(
        t('scoreConfirmation.alerts.selectionRequired'),
        t('scoreConfirmation.alerts.pleaseSelect')
      );
      return;
    }

    if (agreed === false && !reason.trim()) {
      Alert.alert(
        t('scoreConfirmation.alerts.reasonRequired'),
        t('scoreConfirmation.alerts.pleaseProvideReason')
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirm(agreed, reason.trim());
      onClose();
    } catch (error) {
      console.error('Score confirmation error:', error);
      Alert.alert(
        t('scoreConfirmation.alerts.error'),
        t('scoreConfirmation.alerts.confirmationError')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWinnerDisplay = () => {
    if (!match.score?._winner) return t('scoreConfirmation.matchIncomplete');

    if (match.score._winner === 'player1') {
      return t('scoreConfirmation.winner', { name: match.player1.userName });
    } else {
      return t('scoreConfirmation.winner', { name: match.player2.userName });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='formSheet'
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name='close' size={24} color='#333' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('scoreConfirmation.title')}</Text>
          <View style={styles.headerSpace} />
        </View>

        <ScrollView style={styles.content}>
          {/* Match Info */}
          <View style={styles.matchInfoSection}>
            <Text style={styles.matchTitle}>
              {match.player1.userName} vs {match.player2.userName}
            </Text>
            <Text style={styles.matchSubtitle}>
              {match.type === 'league'
                ? t('scoreConfirmation.matchType.league')
                : match.type === 'tournament'
                  ? t('scoreConfirmation.matchType.tournament')
                  : t('scoreConfirmation.matchType.lightning')}
            </Text>
          </View>

          {/* Submitted Score */}
          <View style={styles.scoreSection}>
            <View style={styles.scoreSectionHeader}>
              <Ionicons name='clipboard' size={20} color='#2196f3' />
              <Text style={styles.scoreSectionTitle}>{t('scoreConfirmation.submittedScore')}</Text>
            </View>

            <View style={styles.submitterInfo}>
              <Text style={styles.submitterText}>
                {t('scoreConfirmation.submittedBy', { name: submitterName })}
              </Text>
              <Text style={styles.submittedTime}>
                {match.scoreSubmittedAt?.toDate().toLocaleString('ko-KR')}
              </Text>
            </View>

            <View style={styles.scoreDisplay}>
              <Text style={styles.scoreText}>{formattedScore}</Text>
              <Text style={styles.winnerText}>{getWinnerDisplay()}</Text>
            </View>

            {/* Special Situations */}
            {match.score?.walkover && (
              <View style={styles.specialSituation}>
                <Ionicons name='flag' size={16} color='#ff9800' />
                <Text style={styles.specialText}>{t('scoreConfirmation.walkover')}</Text>
              </View>
            )}

            {match.score?.retiredAt && (
              <View style={styles.specialSituation}>
                <Ionicons name='exit' size={16} color='#ff9800' />
                <Text style={styles.specialText}>
                  {t('scoreConfirmation.retiredAt', { set: match.score.retiredAt })}
                </Text>
              </View>
            )}
          </View>

          {/* Confirmation Section */}
          <View style={styles.confirmationSection}>
            <Text style={styles.confirmationTitle}>{t('scoreConfirmation.confirmationTitle')}</Text>
            <Text style={styles.confirmationSubtitle}>
              {t('scoreConfirmation.confirmationSubtitle')}
            </Text>

            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[
                  styles.option,
                  agreed === true && styles.optionSelected,
                  styles.agreeOption,
                ]}
                onPress={() => setAgreed(true)}
              >
                <Ionicons
                  name={agreed === true ? 'checkmark-circle' : 'checkmark-circle-outline'}
                  size={24}
                  color={agreed === true ? '#4caf50' : '#666'}
                />
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, agreed === true && styles.optionTitleSelected]}>
                    {t('scoreConfirmation.agree')}
                  </Text>
                  <Text style={styles.optionDescription}>
                    {t('scoreConfirmation.agreeDescription')}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.option,
                  agreed === false && styles.optionSelected,
                  styles.disagreeOption,
                ]}
                onPress={() => setAgreed(false)}
              >
                <Ionicons
                  name={agreed === false ? 'close-circle' : 'close-circle-outline'}
                  size={24}
                  color={agreed === false ? '#f44336' : '#666'}
                />
                <View style={styles.optionContent}>
                  <Text
                    style={[styles.optionTitle, agreed === false && styles.optionTitleSelected]}
                  >
                    {t('scoreConfirmation.disagree')}
                  </Text>
                  <Text style={styles.optionDescription}>
                    {t('scoreConfirmation.disagreeDescription')}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Reason Input for Disagreement */}
            {agreed === false && (
              <View style={styles.reasonSection}>
                <Text style={styles.reasonLabel}>{t('scoreConfirmation.reasonLabel')}</Text>
                <TextInput
                  style={styles.reasonInput}
                  value={reason}
                  onChangeText={setReason}
                  placeholder={t('scoreConfirmation.reasonPlaceholder')}
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                />
                <Text style={styles.reasonHelper}>{t('scoreConfirmation.reasonHelper')}</Text>
              </View>
            )}
          </View>

          {/* Warning Note */}
          <View style={styles.warningSection}>
            <View style={styles.warningHeader}>
              <Ionicons name='information-circle' size={20} color='#ff9800' />
              <Text style={styles.warningTitle}>{t('scoreConfirmation.warningTitle')}</Text>
            </View>
            <Text style={styles.warningText}>{t('scoreConfirmation.warningText')}</Text>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <Button
            mode='contained'
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting || agreed === null}
            style={[
              styles.submitButton,
              agreed === true && styles.submitButtonAgree,
              agreed === false && styles.submitButtonDisagree,
            ]}
          >
            {agreed === true
              ? t('scoreConfirmation.submitAgree')
              : agreed === false
                ? t('scoreConfirmation.submitDisagree')
                : t('scoreConfirmation.submitDefault')}
          </Button>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: 50,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSpace: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  matchInfoSection: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  matchSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  scoreSection: {
    padding: 16,
  },
  scoreSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  submitterInfo: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  submitterText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  submitterName: {
    fontWeight: '600',
    color: '#2196f3',
  },
  submittedTime: {
    fontSize: 12,
    color: '#666',
  },
  scoreDisplay: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  winnerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196f3',
  },
  specialSituation: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  specialText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#ff9800',
    fontWeight: '500',
  },
  confirmationSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  confirmationSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  optionSelected: {
    borderColor: '#2196f3',
    backgroundColor: '#f8f9fa',
  },
  agreeOption: {
    // Additional styles for agree option if needed
  },
  disagreeOption: {
    // Additional styles for disagree option if needed
  },
  optionContent: {
    flex: 1,
    marginLeft: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  optionTitleSelected: {
    color: '#2196f3',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  reasonSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fff5f5',
    borderRadius: 8,
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
  },
  reasonHelper: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  warningSection: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff8e1',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff9800',
    marginLeft: 8,
  },
  warningText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  submitSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  submitButton: {
    // Default button styles
  },
  submitButtonAgree: {
    backgroundColor: '#4caf50',
  },
  submitButtonDisagree: {
    backgroundColor: '#f44336',
  },
});

export default ScoreConfirmationModal;
