/**
 * FloatingChatButton - AI 채팅 접근용 플로팅 버튼
 * 앱 전역에서 ChatScreen으로 이동할 수 있는 FAB
 *
 * 💬⚡ Chat + Lightning 디자인 (Operation Identity)
 * - 기존 sparkles 아이콘 → AIAssistantIcon으로 교체
 * - 상표권 문제 해결 및 브랜드 일관성 강화
 */

import React from 'react';
import { StyleSheet, TouchableOpacity, Platform, View, Text } from 'react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AIAssistantIcon from './AIAssistantIcon';
import { useAuth } from '../../contexts/AuthContext';
import { useAIChat } from '../../contexts/AiChatContext';

// 🎯 [KIM FIX] 탭 바 높이 + 여유 공간 계산
// Android는 시스템 네비게이션 바가 있어서 추가 여유 필요
const TAB_BAR_HEIGHT = 60;
const FAB_PADDING = 20;

const FloatingChatButton: React.FC = () => {
  const navigation = useNavigation();
  const { isOnboardingComplete } = useAuth();
  const insets = useSafeAreaInsets();
  const { unreadAdminResponseCount } = useAIChat();

  // 현재 화면 이름 가져오기
  const currentRouteName = useNavigationState(state => {
    if (!state || !state.routes || state.routes.length === 0) return '';
    const route = state.routes[state.index];
    return route.name;
  });

  // 🎯 [KIM FIX] 대화방 화면들에서는 FAB 버튼 숨기기
  // Chat 화면에서는 AI FAB가 불필요하고 입력창과 겹쳐서 방해됨
  const CHAT_SCREENS = ['ChatScreen', 'DirectChatRoom', 'ClubChat', 'EventChat'];

  // 온보딩 중이거나 채팅 화면에서는 버튼 숨기기
  if (!isOnboardingComplete || CHAT_SCREENS.includes(currentRouteName)) {
    return null;
  }

  const handlePress = () => {
    // @ts-expect-error - navigation type
    navigation.navigate('ChatScreen');
  };

  // 🎯 [KIM FIX] Android에서 시스템 네비게이션 바를 고려한 bottom 위치 계산
  // iOS: Safe area insets가 이미 home indicator를 처리
  // Android: 시스템 네비게이션 바가 있으면 추가 여유 필요
  const bottomOffset = Platform.select({
    ios: TAB_BAR_HEIGHT + FAB_PADDING + insets.bottom,
    android: TAB_BAR_HEIGHT + FAB_PADDING + Math.max(insets.bottom, 20), // Android는 최소 20px 추가
    default: TAB_BAR_HEIGHT + FAB_PADDING,
  });

  return (
    <TouchableOpacity
      style={[styles.container, { bottom: bottomOffset }]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#8B5CF6', '#06B6D4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <AIAssistantIcon size='large' color='#FFFFFF' />
      </LinearGradient>

      {/* 🔴 빨간 배지 - 읽지 않은 관리팀 응답 */}
      {unreadAdminResponseCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadAdminResponseCount > 9 ? '9+' : unreadAdminResponseCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    // 🎯 [KIM FIX] bottom은 이제 동적으로 계산됨 (Platform.select + SafeAreaInsets)
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    zIndex: 1000,
  },
  gradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 🔴 빨간 배지 스타일
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default FloatingChatButton;
