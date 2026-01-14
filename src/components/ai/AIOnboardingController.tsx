/**
 * AIOnboardingController
 * 신규 사용자 감지 시 AI 온보딩 플로우를 자동 시작하는 컨트롤러
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Surface, IconButton, useTheme } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import aiService from '../../services/aiService';
import { executeAICommand } from '../../services/navigationService';
import { useTranslation } from 'react-i18next';

interface QuickReply {
  id: string;
  label: string;
  icon: string;
}

export const AIOnboardingController: React.FC = () => {
  const { currentUser, isNewUserForOnboarding, markAIOnboardingComplete, isProfileLoaded } =
    useAuth();
  const { currentLanguage } = useLanguage();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [visible, setVisible] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState('');

  // 신규 사용자 감지 시 온보딩 시작
  useEffect(() => {
    if (isProfileLoaded && isNewUserForOnboarding && currentUser?.displayName) {
      console.log('🤖 AI Onboarding: New user detected, starting onboarding flow...');

      // 환영 메시지 가져오기
      const welcome = aiService.getOnboardingWelcome(
        currentUser.displayName || t('aiOnboarding.defaultName'),
        currentLanguage
      );
      setWelcomeMessage(welcome);

      // Quick Reply 옵션 가져오기
      const replies = aiService.getOnboardingQuickReplies(currentLanguage);
      setQuickReplies(replies);

      // 모달 표시 (약간의 딜레이로 자연스럽게)
      setTimeout(() => setVisible(true), 1000);
    }
  }, [isProfileLoaded, isNewUserForOnboarding, currentUser, currentLanguage]);

  // Quick Reply 선택 처리
  const handleQuickReplySelect = useCallback(
    async (actionId: string) => {
      setSelectedAction(actionId);

      // AI 응답 가져오기
      const result = aiService.handleOnboardingAction(actionId, currentLanguage);
      setResponseMessage(result.message);

      // 2초 후 네비게이션 실행 및 모달 닫기
      setTimeout(async () => {
        if (result.command) {
          executeAICommand(result.command);
        }

        // AI 온보딩 완료 처리
        await markAIOnboardingComplete();
        setVisible(false);

        // 상태 초기화
        setSelectedAction(null);
        setResponseMessage('');
      }, 2000);
    },
    [currentLanguage, markAIOnboardingComplete]
  );

  // 닫기 (나중에 다시 보기)
  const handleDismiss = useCallback(async () => {
    await markAIOnboardingComplete();
    setVisible(false);
  }, [markAIOnboardingComplete]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType='slide' onRequestClose={handleDismiss}>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <Surface style={[styles.container, { backgroundColor: colors.surface }]}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.primary }]}>
              {t('aiOnboarding.headerTitle')}
            </Text>
            <IconButton
              icon='close'
              size={24}
              onPress={handleDismiss}
              iconColor={colors.onSurfaceVariant}
            />
          </View>

          {/* 메시지 영역 */}
          <ScrollView style={styles.messageArea} contentContainerStyle={styles.messageContent}>
            {!selectedAction ? (
              <Text style={[styles.welcomeText, { color: colors.onSurface }]}>
                {welcomeMessage}
              </Text>
            ) : (
              <Text style={[styles.responseText, { color: colors.onSurface }]}>
                {responseMessage}
              </Text>
            )}
          </ScrollView>

          {/* Quick Reply 버튼들 */}
          {!selectedAction && (
            <View style={styles.quickRepliesContainer}>
              {quickReplies.map(reply => (
                <TouchableOpacity
                  key={reply.id}
                  style={[
                    styles.quickReplyButton,
                    {
                      backgroundColor: colors.surfaceVariant,
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => handleQuickReplySelect(reply.id)}
                >
                  <Text style={styles.quickReplyIcon}>{reply.icon}</Text>
                  <Text
                    style={[styles.quickReplyLabel, { color: colors.onSurface }]}
                    numberOfLines={2}
                  >
                    {reply.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* 로딩 표시 */}
          {selectedAction && (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
                {t('aiOnboarding.guiding')}
              </Text>
            </View>
          )}
        </Surface>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  messageArea: {
    maxHeight: 200,
  },
  messageContent: {
    padding: 20,
  },
  welcomeText: {
    fontSize: 16,
    lineHeight: 24,
  },
  responseText: {
    fontSize: 16,
    lineHeight: 24,
  },
  quickRepliesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
    justifyContent: 'center',
  },
  quickReplyButton: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    width: '30%',
    minHeight: 80,
  },
  quickReplyIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickReplyLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
  },
});

export default AIOnboardingController;
