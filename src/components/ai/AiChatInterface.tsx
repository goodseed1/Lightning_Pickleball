/**
 * AI Chat Interface Component
 * Main chat interface for Lightning Tennis AI assistant
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAIChat } from '../../contexts/AiChatContext';
import ChatMessage from './ChatMessage';
import QuickActionButtons from './QuickActionButtons';
import TypingIndicator from './TypingIndicator';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  language: string;
  relevantKnowledge?: number;
  confidence?: number;
  type: 'message' | 'tip' | 'analysis' | 'advice';
}

interface AIChatInterfaceProps {
  onClose?: () => void;
  showHeader?: boolean;
}

const AIChatInterface: React.FC<AIChatInterfaceProps> = ({ onClose, showHeader = true }) => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const {
    messages,
    isLoading,
    isTyping,
    error,
    sendMessage,
    clearChat,
    quickActions,
    executeQuickAction,
  } = useAIChat();

  const [inputText, setInputText] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const textInputRef = useRef<TextInput>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isTyping]);

  // Hide quick actions when user starts typing or has messages
  useEffect(() => {
    setShowQuickActions(messages.length <= 1 && inputText.length === 0);
  }, [messages.length, inputText]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const message = inputText.trim();
    setInputText('');

    // Dismiss keyboard
    Keyboard.dismiss();

    await sendMessage(message);
  };

  const handleQuickAction = (actionId: string) => {
    executeQuickAction(actionId);
    setShowQuickActions(false);
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => (
    <ChatMessage message={item} isLastMessage={index === messages.length - 1} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name='chatbubbles' size={64} color='#e0e0e0' />
      <Text style={styles.emptyStateText}>{t('ai.emptyState.title')}</Text>
      <Text style={styles.emptyStateSubtext}>{t('ai.emptyState.subtitle')}</Text>
    </View>
  );

  const renderHeader = () => {
    if (!showHeader) return null;

    return (
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.aiAvatar}>
            <Ionicons name='basketball' size={20} color='white' />
          </View>
          <View>
            <Text style={styles.headerTitle}>{t('chat.headerTitle')}</Text>
            <Text style={styles.headerSubtitle}>
              {isTyping ? t('ai.status.typing') : t('ai.status.online')}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={clearChat}>
            <Ionicons name='refresh' size={20} color='#666' />
          </TouchableOpacity>

          {onClose && (
            <TouchableOpacity style={styles.headerButton} onPress={onClose}>
              <Ionicons name='close' size={20} color='#666' />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {renderHeader()}

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Messages */}
      <View style={styles.messagesContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.messagesList,
            messages.length === 0 && styles.emptyMessagesList,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
        />

        {/* Typing Indicator */}
        {isTyping && <TypingIndicator />}
      </View>

      {/* Quick Actions */}
      {showQuickActions && (
        <QuickActionButtons actions={quickActions} onActionPress={handleQuickAction} />
      )}

      {/* Input Area - with safe area padding for iOS home indicator & Android nav buttons */}
      <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.inputWrapper}>
          <TextInput
            ref={textInputRef}
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder={t('ai.input.placeholder')}
            placeholderTextColor='#999'
            multiline
            maxLength={1000}
            onSubmitEditing={handleSendMessage}
            returnKeyType='send'
            blurOnSubmit={false}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Ionicons
              name={isLoading ? 'hourglass' : 'send'}
              size={20}
              color={!inputText.trim() || isLoading ? '#ccc' : 'white'}
            />
          </TouchableOpacity>
        </View>

        {/* Character Count */}
        <Text style={styles.characterCount}>{inputText.length}/1000</Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ffcdd2',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    paddingVertical: 16,
  },
  emptyMessagesList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingTop: 12,
    // paddingBottom is applied dynamically via style prop with safe area insets
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
});

export default AIChatInterface;
