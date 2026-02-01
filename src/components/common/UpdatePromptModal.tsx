/**
 * Update Prompt Modal
 *
 * 앱 업데이트가 필요할 때 표시되는 모달입니다.
 * - 선택적 업데이트: "나중에" 버튼으로 건너뛸 수 있음
 * - 강제 업데이트: 건너뛸 수 없음 (isForceUpdate=true)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { getLightningPickleballTheme } from '../../theme';
import { useLanguage } from '../../contexts/LanguageContext';
import type { UpdateInfo } from '../../services/appUpdateService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface UpdatePromptModalProps {
  visible: boolean;
  updateInfo: UpdateInfo | null;
  onUpdate: () => void;
  onDismiss: () => void;
}

const UpdatePromptModal: React.FC<UpdatePromptModalProps> = ({
  visible,
  updateInfo,
  onUpdate,
  onDismiss,
}) => {
  const { theme } = useTheme();
  const { colors } = getLightningPickleballTheme(theme);
  const { currentLanguage, t } = useLanguage();

  if (!updateInfo) return null;

  const isKorean = currentLanguage === 'ko';
  const message = isKorean ? updateInfo.updateMessage.ko : updateInfo.updateMessage.en;

  return (
    <Modal visible={visible} transparent animationType='fade' statusBarTranslucent>
      <View style={styles.overlay}>
        {/* 다크모드에서도 잘 보이도록 밝은 배경 사용 */}
        <View style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryContainer }]}>
            <Ionicons name='rocket' size={48} color={colors.primary} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: '#1C1B1F' }]}>{t('modals.updatePrompt.title')}</Text>

          {/* Version Info */}
          <View style={styles.versionContainer}>
            <Text style={[styles.versionText, { color: '#49454F' }]}>
              {t('modals.updatePrompt.currentVersion')}
              <Text style={{ fontWeight: 'bold' }}>{updateInfo.currentVersion}</Text>
            </Text>
            <Ionicons name='arrow-forward' size={16} color={colors.primary} />
            <Text style={[styles.versionText, { color: colors.primary }]}>
              {t('modals.updatePrompt.latestVersion')}
              <Text style={{ fontWeight: 'bold' }}>{updateInfo.latestVersion}</Text>
            </Text>
          </View>

          {/* Message */}
          <Text style={[styles.message, { color: '#49454F' }]}>{message}</Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {/* Update Button */}
            <TouchableOpacity
              style={[styles.updateButton, { backgroundColor: colors.primary }]}
              onPress={onUpdate}
              activeOpacity={0.8}
            >
              <Ionicons
                name={Platform.OS === 'ios' ? 'logo-apple-appstore' : 'logo-google-playstore'}
                size={20}
                color='#fff'
              />
              <Text style={styles.updateButtonText}>{t('modals.updatePrompt.updateButton')}</Text>
            </TouchableOpacity>

            {/* Dismiss Button - Only show for optional updates */}
            {!updateInfo.isForceUpdate && (
              <TouchableOpacity
                style={[styles.dismissButton, { borderColor: '#79747E' }]}
                onPress={onDismiss}
                activeOpacity={0.7}
              >
                <Text style={[styles.dismissButtonText, { color: '#49454F' }]}>
                  {t('modals.updatePrompt.laterButton')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Force Update Warning */}
          {updateInfo.isForceUpdate && (
            <View style={[styles.warningContainer, { backgroundColor: colors.errorContainer }]}>
              <Ionicons name='warning' size={16} color={colors.error} />
              <Text style={[styles.warningText, { color: colors.onErrorContainer }]}>
                {t('modals.updatePrompt.forceUpdateWarning')}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    // 완전 불투명 검정 배경 - 뒤 콘텐츠 완전 차단
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: SCREEN_WIDTH - 48,
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    // 불투명한 배경 보장
    opacity: 1,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  versionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  versionText: {
    fontSize: 14,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dismissButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  dismissButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
});

export default UpdatePromptModal;
