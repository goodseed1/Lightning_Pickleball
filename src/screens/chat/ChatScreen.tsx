/**
 * ChatScreen - AI Chatbot Full Screen Experience
 * Connects AiChatContext with ChatUI for complete chat interaction
 */

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useTheme, Appbar, Button } from 'react-native-paper';
import { useNavigation, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ChatUI from '../../components/ai/ChatUI';
import AIAssistantIcon from '../../components/ai/AIAssistantIcon';
import { useAIChat } from '../../contexts/AiChatContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { QuickReplyOption } from '../../components/ai/ChatUI';
import { addUserReply } from '../../services/feedbackService';

// 🎾 Route params type for auto-analyze feature
type ChatScreenRouteParams = {
  ChatScreen: {
    autoAnalyzeEvent?: {
      id: string;
      title: string;
      gameType?: string;
      hostId?: string;
      clubId?: string;
      scheduledTime?: Date;
      matchResult?: unknown;
    };
  };
};

const ChatScreen: React.FC = () => {
  const route = useRoute<RouteProp<ChatScreenRouteParams, 'ChatScreen'>>();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { user } = useAuth();
  const {
    messages,
    isLoading,
    isTyping,
    sendMessage,
    quickActions,
    executeQuickAction,
    clearUnreadAdminResponses,
    analyzeSpecificMatch, // 🎾 특정 경기 분석 함수
  } = useAIChat();

  // 🎾 Auto-analyze flag to prevent duplicate analysis
  const hasAutoAnalyzed = useRef(false);

  // 💬 Reply modal state
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyingToFeedbackId, setReplyingToFeedbackId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Clear unread admin responses when screen is focused
  useFocusEffect(
    useCallback(() => {
      clearUnreadAdminResponses();
    }, [clearUnreadAdminResponses])
  );

  // 🎾 Auto-analyze event when navigated with autoAnalyzeEvent param
  useEffect(() => {
    const autoAnalyzeEvent = route.params?.autoAnalyzeEvent;

    // Only run once per navigation and if event data exists
    if (autoAnalyzeEvent && !hasAutoAnalyzed.current && !isLoading) {
      hasAutoAnalyzed.current = true;
      console.log('🎾 [ChatScreen] Auto-analyzing event:', autoAnalyzeEvent.title);
      analyzeSpecificMatch(autoAnalyzeEvent);
    }

    // Reset flag when navigating away (params change)
    return () => {
      if (!route.params?.autoAnalyzeEvent) {
        hasAutoAnalyzed.current = false;
      }
    };
  }, [route.params?.autoAnalyzeEvent, analyzeSpecificMatch, isLoading]);

  // Message send handler
  const handleSendMessage = useCallback(
    (text: string) => {
      sendMessage(text, 'message');
    },
    [sendMessage]
  );

  // Helper function to get translated label for quick action
  const getQuickActionLabel = useCallback(
    (titleKey: string): string => {
      // Map the titleKey to translation key
      const translationKeyMap: Record<string, string> = {
        'ai.quickActions.contactAdmin': 'chat.quickActions.contactAdmin',
        'ai.quickActions.analyzeMatch': 'chat.quickActions.analyzeMatch',
        'ai.quickActions.rulesHelp': 'chat.quickActions.rulesHelp',
        'ai.quickActions.techniqueTips': 'chat.quickActions.techniqueTips',
        'ai.quickActions.strategyAdvice': 'chat.quickActions.strategyAdvice',
        'ai.quickActions.equipmentHelp': 'chat.quickActions.equipmentHelp',
      };
      const translationKey = translationKeyMap[titleKey];
      return translationKey ? t(translationKey) : titleKey;
    },
    [t]
  );

  // Convert quickActions to QuickReplyOption format (take first 4)
  const quickReplies: QuickReplyOption[] = useMemo(() => {
    return quickActions.slice(0, 4).map(action => ({
      id: action.id,
      label: getQuickActionLabel(action.titleKey),
      icon: action.iconName,
      onPress: () => executeQuickAction(action.id),
    }));
  }, [quickActions, getQuickActionLabel, executeQuickAction]);

  // 💬 Handle reply to admin button press
  const handleReplyToAdmin = useCallback((feedbackId: string) => {
    setReplyingToFeedbackId(feedbackId);
    setReplyText('');
    setReplyModalVisible(true);
  }, []);

  // 💬 Send reply to admin
  const handleSendReply = useCallback(async () => {
    if (!replyText.trim() || !replyingToFeedbackId || !user) return;

    setSending(true);
    try {
      await addUserReply(
        replyingToFeedbackId,
        replyText.trim(),
        user.uid,
        user.displayName || user.email || 'User'
      );
      setReplyModalVisible(false);
      setReplyText('');
      setReplyingToFeedbackId(null);
      Alert.alert(t('myFeedback.reply.success'), t('myFeedback.reply.successMessage'));
    } catch (error) {
      console.error('[ChatScreen] Error sending reply:', error);
      Alert.alert(t('common.error'), t('myFeedback.reply.error'));
    } finally {
      setSending(false);
    }
  }, [replyText, replyingToFeedbackId, user, t]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content
          title={
            <View style={styles.headerTitle}>
              <AIAssistantIcon size='small' color={colors.primary} />
              <Text style={[styles.headerTitleText, { color: colors.onSurface }]}>
                {t('chat.headerTitle')}
              </Text>
            </View>
          }
        />
      </Appbar.Header>

      <ChatUI
        messages={messages as Parameters<typeof ChatUI>[0]['messages']}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        isTyping={isTyping}
        quickReplies={quickReplies}
        onReplyToAdmin={handleReplyToAdmin}
      />

      {/* 💬 Reply Modal */}
      <Modal
        visible={replyModalVisible}
        transparent
        animationType='slide'
        onRequestClose={() => setReplyModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
                {t('myFeedback.reply.title')}
              </Text>
              <TouchableOpacity
                onPress={() => setReplyModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name='close' size={24} color={colors.onSurface} />
              </TouchableOpacity>
            </View>

            {/* Reply Input */}
            <TextInput
              style={[
                styles.replyInput,
                {
                  backgroundColor: colors.surfaceVariant,
                  color: colors.onSurface,
                },
              ]}
              placeholder={t('myFeedback.reply.placeholder')}
              placeholderTextColor={colors.onSurfaceVariant}
              value={replyText}
              onChangeText={setReplyText}
              multiline
              numberOfLines={4}
              maxLength={1000}
            />

            {/* Character Count */}
            <Text style={[styles.charCount, { color: colors.onSurfaceVariant }]}>
              {replyText.length}/1000
            </Text>

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <Button
                mode='outlined'
                onPress={() => setReplyModalVisible(false)}
                style={styles.cancelButton}
              >
                {t('common.cancel')}
              </Button>
              <Button
                mode='contained'
                onPress={handleSendReply}
                loading={sending}
                disabled={!replyText.trim() || sending}
                style={styles.sendButton}
              >
                {t('myFeedback.reply.send')}
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: '500',
  },
  // 💬 Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  replyInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  sendButton: {
    flex: 1,
  },
});

export default ChatScreen;
