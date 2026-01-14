/**
 * ChatBubble Component
 * 채팅 말풍선 컴포넌트 - AI 챗봇과의 대화 메시지 표시
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { format } from 'date-fns';
import EventResultCard from './EventResultCard';
import type { EventData } from '../../types/ai';

export interface ChatBubbleProps {
  /** 메시지 내용 */
  message: string;
  /** 발신자 타입 */
  sender: 'user' | 'ai' | 'system';
  /** 타임스탬프 (선택) */
  timestamp?: Date;
  /** 타이핑 중 상태 (선택) */
  isTyping?: boolean;
  /** 구조화된 데이터 (선택) */
  data?: {
    events?: EventData[];
    navigationTarget?: string;
  };
  /** 언어 */
  language?: 'ko' | 'en';
}

/**
 * ChatBubble - 채팅 말풍선 컴포넌트
 * - 사용자 메시지는 오른쪽 정렬 (primary 색상 배경)
 * - AI 메시지는 왼쪽 정렬 (surface 색상 배경)
 * - isTyping이 true면 "..." 애니메이션 표시
 * - data.events가 있으면 EventResultCard 렌더링
 */
const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  sender,
  timestamp,
  isTyping,
  data,
  language = 'ko',
}) => {
  const { colors } = useTheme();
  const dotAnimation1 = useRef(new Animated.Value(0)).current;
  const dotAnimation2 = useRef(new Animated.Value(0)).current;
  const dotAnimation3 = useRef(new Animated.Value(0)).current;

  // 타이핑 애니메이션
  useEffect(() => {
    if (isTyping) {
      const createAnimation = (animValue: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animValue, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const animation1 = createAnimation(dotAnimation1, 0);
      const animation2 = createAnimation(dotAnimation2, 150);
      const animation3 = createAnimation(dotAnimation3, 300);

      animation1.start();
      animation2.start();
      animation3.start();

      return () => {
        animation1.stop();
        animation2.stop();
        animation3.stop();
      };
    }
  }, [isTyping, dotAnimation1, dotAnimation2, dotAnimation3]);

  const isUser = sender === 'user';
  const isSystem = sender === 'system';

  const containerStyle = [
    styles.container,
    isUser ? styles.userContainer : isSystem ? styles.systemContainer : styles.aiContainer,
  ];

  // 🎨 [DARK GLASS] System message style - theme-aware
  const bubbleStyle = [
    styles.bubble,
    isUser
      ? { backgroundColor: colors.primary }
      : isSystem
        ? {
            backgroundColor: colors.surfaceVariant,
            borderWidth: 1,
            borderColor: colors.primary,
            borderLeftWidth: 3,
          }
        : { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.outline },
  ];

  // 🎨 [DARK GLASS] Text style - system messages use primary color
  const textStyle = [
    styles.text,
    { color: isUser ? '#FFFFFF' : isSystem ? colors.primary : colors.onSurface },
  ];

  // 타이핑 중일 때
  if (isTyping) {
    return (
      <View style={containerStyle}>
        <View style={bubbleStyle}>
          <View style={styles.typingContainer}>
            <Animated.View
              style={[
                styles.typingDot,
                {
                  opacity: dotAnimation1,
                  backgroundColor: colors.onSurface,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.typingDot,
                {
                  opacity: dotAnimation2,
                  backgroundColor: colors.onSurface,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.typingDot,
                {
                  opacity: dotAnimation3,
                  backgroundColor: colors.onSurface,
                },
              ]}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <View style={bubbleStyle}>
        <Text style={textStyle}>{message}</Text>
        {timestamp && (
          <Text
            style={[
              styles.timestamp,
              { color: isUser ? 'rgba(255, 255, 255, 0.7)' : colors.onSurfaceVariant },
            ]}
          >
            {format(timestamp, 'HH:mm')}
          </Text>
        )}
        {/* 검색 결과 카드 렌더링 */}
        {data?.events && data.events.length > 0 && (
          <EventResultCard events={data.events} language={language} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    marginHorizontal: 16,
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  aiContainer: {
    justifyContent: 'flex-start',
  },
  // 🎨 관리팀 응답: 왼쪽에서 약간 들여쓰기 (사용자 피드백 화면처럼)
  systemContainer: {
    justifyContent: 'flex-start',
    marginLeft: 16,
  },
  bubble: {
    // 내 질문과 관리팀 응답 카드 너비 동일하게
    width: '80%',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default ChatBubble;
