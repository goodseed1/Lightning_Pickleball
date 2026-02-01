/**
 * ChatUI Component
 * 전체 채팅 UI 컨테이너 - AI 챗봇 인터페이스 전체 구성
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Text,
  NativeSyntheticEvent, // 🔧 [FLICKER FIX] For scroll event typing
  NativeScrollEvent,    // 🔧 [FLICKER FIX] For scroll event typing
} from 'react-native';
import { IconButton, ActivityIndicator, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ChatBubble from './ChatBubble';
import QuickReply from './QuickReply';
import { useLanguage } from '../../contexts/LanguageContext';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai' | 'system';
  timestamp: Date;
  language: string;
  relevantKnowledge?: number;
  confidence?: number;
  type: 'message' | 'tip' | 'analysis' | 'advice';
}

export interface QuickReplyOption {
  id: string;
  label: string;
  icon?: string;
  onPress: () => void;
}

export interface ChatUIProps {
  /** 채팅 메시지 목록 */
  messages: ChatMessage[];
  /** 메시지 전송 핸들러 */
  onSendMessage: (message: string) => void;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 타이핑 중 상태 */
  isTyping?: boolean;
  /** 빠른 응답 옵션 (선택) */
  quickReplies?: QuickReplyOption[];
  /** 💬 관리자 응답에 답변하기 핸들러 */
  onReplyToAdmin?: (feedbackId: string) => void;
}

/**
 * ChatUI - 전체 채팅 UI 컨테이너
 * - FlatList로 메시지 목록 렌더링
 * - 하단에 TextInput + 전송 버튼
 * - 선택적 QuickReply 영역
 * - 로딩 상태 표시
 * - 새 메시지 시 자동 스크롤
 */
const ChatUI: React.FC<ChatUIProps> = ({
  messages,
  onSendMessage,
  isLoading = false,
  isTyping = false,
  quickReplies = [],
  onReplyToAdmin,
}) => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // 🔧 [FLICKER FIX] Smart scroll state - prevents flickering on new messages
  const [isNearBottom, setIsNearBottom] = useState(true);
  const prevMessageCount = useRef(0);

  // 🔧 [FLICKER FIX] Detect scroll position to enable smart auto-scroll
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 100;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    setIsNearBottom(isCloseToBottom);
  }, []);

  // 🔧 [FLICKER FIX] Only scroll to end when NEW messages are added AND user is near bottom
  useEffect(() => {
    if (messages.length > prevMessageCount.current && isNearBottom) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }
    prevMessageCount.current = messages.length;
  }, [messages.length, isNearBottom]);

  // 메시지 전송 핸들러
  const handleSend = () => {
    if (inputText.trim() && !isLoading) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  // 💬 관리자 응답 메시지인지 확인하고 feedbackId 추출
  // Format: admin-response-{feedbackId}-{index}
  const getAdminResponseFeedbackId = (messageId: string): string | null => {
    const match = messageId.match(/^admin-response-(.+)-\d+$/);
    if (match) {
      return match[1];
    }
    return null;
  };

  // 메시지 렌더링
  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const feedbackId = getAdminResponseFeedbackId(item.id);
    const isAdminResponse = feedbackId !== null;

    return (
      <View>
        <ChatBubble
          message={item.content}
          sender={item.sender}
          timestamp={item.timestamp}
          // @ts-expect-error - data type is complex
          data={item.data}
          language={item.language as 'ko' | 'en'}
        />

        {/* 💬 관리자 응답에 답변하기 버튼 */}
        {isAdminResponse && onReplyToAdmin && (
          <TouchableOpacity
            style={[styles.replyButton, { borderColor: colors.primary }]}
            onPress={() => onReplyToAdmin(feedbackId)}
            activeOpacity={0.7}
          >
            <Ionicons name='arrow-undo' size={16} color={colors.primary} />
            <Text style={[styles.replyButtonText, { color: colors.primary }]}>
              {t('myFeedback.reply.button')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // 빠른 응답 렌더링
  const renderQuickReplies = () => {
    if (quickReplies.length === 0) return null;

    return (
      <View style={styles.quickRepliesContainer}>
        {quickReplies.map(reply => (
          <QuickReply
            key={reply.id}
            label={reply.label}
            icon={reply.icon}
            onPress={reply.onPress}
            disabled={isLoading}
          />
        ))}
      </View>
    );
  };

  // Footer: 타이핑 인디케이터
  const renderFooter = () => {
    if (!isTyping) return null;

    return <ChatBubble message='' sender='ai' isTyping={true} />;
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* 메시지 목록 */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messageList}
        // 🔧 [FLICKER FIX] Removed onContentSizeChange, using smart scroll instead
        onScroll={handleScroll}
        scrollEventThrottle={100}
        ListFooterComponent={renderFooter}
      />

      {/* 빠른 응답 영역 */}
      {renderQuickReplies()}

      {/* 입력 영역 */}
      <View
        style={[
          styles.inputContainer,
          { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, 8) },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surfaceVariant,
              color: colors.onSurface,
            },
          ]}
          placeholder={t('modals.chatUI.inputPlaceholder')}
          placeholderTextColor={colors.onSurfaceVariant}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSend}
          editable={!isLoading}
          multiline
          maxLength={500}
        />

        {isLoading ? (
          <View style={styles.sendButton}>
            <ActivityIndicator size='small' color={colors.primary} />
          </View>
        ) : (
          <TouchableOpacity onPress={handleSend} disabled={!inputText.trim() || isLoading}>
            <IconButton
              icon='send'
              size={24}
              iconColor={inputText.trim() ? colors.primary : colors.onSurfaceVariant}
              disabled={!inputText.trim() || isLoading}
            />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageList: {
    paddingVertical: 8,
  },
  quickRepliesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 💬 관리자 응답 답변 버튼 - 컴팩트 사이즈
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 6,
    paddingHorizontal: 24,
    marginTop: 4,
    marginBottom: 8,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  replyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ChatUI;
