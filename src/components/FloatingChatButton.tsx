/**
 * FloatingChatButton - 전역 플로팅 챗봇 버튼
 * 모든 메인 탭에서 항상 표시되는 AI 도움말 챗봇 접근 버튼
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FAB, Portal } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLanguage } from '../contexts/LanguageContext';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const FloatingChatButton = ({ currentRoute }) => {
  const { t } = useLanguage();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  // 탭바 높이 가져오기 (안전하게 처리)
  let tabBarHeight = 0;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    tabBarHeight = useBottomTabBarHeight();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    tabBarHeight = 60; // 기본 탭바 높이
  }

  // Feed 화면에서는 FAB 위에 위치하도록 추가 오프셋
  const isFeedRoute = route?.name === 'Feed' || currentRoute === 'Feed';
  const extraForFeedFab = isFeedRoute ? 72 : 0;
  const bottomOffset = (insets?.bottom || 0) + tabBarHeight + 16 + extraForFeedFab;

  const [isVisible, setIsVisible] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 펄스 애니메이션 시작
    startPulseAnimation();

    // 3초 후 펄스 중지
    const timer = setTimeout(() => {
      stopPulseAnimation();
    }, 3000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * 펄스 애니메이션 시작
   */
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  /**
   * 펄스 애니메이션 중지
   */
  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  /**
   * 버튼 클릭 핸들러
   */
  const handlePress = () => {
    // 터치 피드백 애니메이션
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // 펄스 애니메이션 중지
    stopPulseAnimation();

    // 채팅봇 화면으로 이동
    navigation.navigate('ChatScreen' as never);
  };

  /**
   * 버튼 숨기기/보이기 토글
   */
  const toggleVisibility = () => {
    const newVisibility = !isVisible;

    Animated.timing(fadeAnim, {
      toValue: newVisibility ? 1 : 0.3,
      duration: 200,
      useNativeDriver: true,
    }).start();

    setIsVisible(newVisibility);
  };

  /**
   * 현재 화면에 따른 버튼 표시 여부 결정
   */
  const shouldShowButton = () => {
    // 메인 탭에서만 표시
    const mainTabs = ['Feed', 'Discover', 'Create', 'MyClubs'];
    return mainTabs.includes(currentRoute) || mainTabs.includes(route?.name);
  };

  if (!shouldShowButton()) {
    return null;
  }

  return (
    <Portal>
      <View
        style={{
          position: 'absolute',
          right: 16,
          bottom: bottomOffset,
          zIndex: 9999,
          elevation: 9999,
        }}
      >
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }],
            },
          ]}
        >
          <FAB
            icon={() => (
              <View style={styles.iconContainer}>
                <Ionicons name='chatbubble-ellipses' size={24} color='#fff' />
                {/* AI 표시 점 */}
                <View style={styles.aiIndicator}>
                  <View style={styles.aiDot} />
                </View>
              </View>
            )}
            style={styles.fab}
            color='#fff'
            onPress={handlePress}
            accessibilityLabel={t('floatingChat.accessibilityLabel')}
            accessibilityHint={t('floatingChat.accessibilityHint')}
          />

          {/* 배경 그라데이션 효과 */}
          <View style={styles.backgroundGlow} />
        </Animated.View>

        {/* 최소화 버튼 (길게 누르면 활성화) */}
        <TouchableOpacity
          style={styles.minimizeHitBox}
          onLongPress={toggleVisibility}
          delayLongPress={1000}
          activeOpacity={1}
        />
      </View>
    </Portal>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    position: 'relative',
  },
  fab: {
    backgroundColor: '#1976d2',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4caf50',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  aiDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  backgroundGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 32,
    backgroundColor: '#1976d2',
    opacity: 0.2,
    zIndex: -1,
  },
  minimizeHitBox: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
  },
});

export default FloatingChatButton;
