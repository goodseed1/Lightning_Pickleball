/**
 * Chat Message Component
 * Individual message bubble with AI/User styling
 */

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    language: string;
    relevantKnowledge?: number;
    confidence?: number;
    type: 'message' | 'tip' | 'analysis' | 'advice';
  };
  isLastMessage?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { t } = useLanguage();
  const isUser = message.sender === 'user';
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // Animate message appearance
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageTypeIcon = () => {
    switch (message.type) {
      case 'tip':
        return 'bulb-outline';
      case 'analysis':
        return 'analytics-outline';
      case 'advice':
        return 'person-circle-outline';
      default:
        return null;
    }
  };

  const getMessageTypeColor = () => {
    switch (message.type) {
      case 'tip':
        return '#FF9800';
      case 'analysis':
        return '#9C27B0';
      case 'advice':
        return '#4CAF50';
      default:
        return '#2196F3';
    }
  };

  const renderConfidenceIndicator = () => {
    if (!message.confidence || isUser) return null;

    const confidence = message.confidence;
    let color = '#4CAF50'; // High confidence
    let text = 'High';

    if (confidence < 0.5) {
      color = '#F44336';
      text = 'Low';
    } else if (confidence < 0.8) {
      color = '#FF9800';
      text = 'Medium';
    }

    return (
      <View style={[styles.confidenceIndicator, { borderColor: color }]}>
        <View style={[styles.confidenceDot, { backgroundColor: color }]} />
        <Text style={[styles.confidenceText, { color }]}>{text}</Text>
      </View>
    );
  };

  const renderKnowledgeIndicator = () => {
    if (!message.relevantKnowledge || message.relevantKnowledge === 0 || isUser) return null;

    return (
      <View style={styles.knowledgeIndicator}>
        <Ionicons name='library' size={12} color='#666' />
        <Text style={styles.knowledgeText}>
          {message.relevantKnowledge} source{message.relevantKnowledge !== 1 ? 's' : ''}
        </Text>
      </View>
    );
  };

  return (
    <Animated.View style={[styles.messageContainer, { opacity: fadeAnim }]}>
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
        {/* Message Type Header (AI only) */}
        {!isUser && message.type !== 'message' && (
          <View style={styles.messageTypeHeader}>
            <Ionicons
              name={getMessageTypeIcon() as keyof typeof Ionicons.glyphMap}
              size={16}
              color={getMessageTypeColor()}
            />
            <Text style={[styles.messageTypeText, { color: getMessageTypeColor() }]}>
              {t(`ai.messageTypes.${message.type}`)}
            </Text>
          </View>
        )}

        {/* Message Content */}
        <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
          {message.content}
        </Text>

        {/* Message Footer */}
        <View style={styles.messageFooter}>
          <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.aiTimestamp]}>
            {formatTime(message.timestamp)}
          </Text>

          {/* AI-specific indicators */}
          {!isUser && (
            <View style={styles.aiIndicators}>
              {renderKnowledgeIndicator()}
              {renderConfidenceIndicator()}
            </View>
          )}
        </View>
      </View>

      {/* Avatar (AI only) */}
      {!isUser && (
        <View style={styles.aiAvatarContainer}>
          <View style={styles.aiAvatar}>
            <Ionicons name='basketball' size={16} color='white' />
          </View>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 4,
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 2,
  },
  userBubble: {
    backgroundColor: '#2196F3',
    marginLeft: 'auto',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 'auto',
    borderBottomLeftRadius: 4,
  },
  messageTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  messageTypeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userText: {
    color: 'white',
  },
  aiText: {
    color: '#333',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  timestamp: {
    fontSize: 11,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  aiTimestamp: {
    color: '#999',
  },
  aiIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  confidenceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    marginLeft: 6,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '500',
  },
  knowledgeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  knowledgeText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 4,
  },
  aiAvatarContainer: {
    marginLeft: 8,
    marginBottom: 4,
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatMessage;
