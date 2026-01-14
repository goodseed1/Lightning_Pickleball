/**
 * AIAssistantIcon - Lightning Tennis AI 챗봇 아이콘
 *
 * 🎾 Tennis Ball + AI 컨셉
 * - 메인: tennis-ball (테니스 앱 아이덴티티)
 * - 배지: "AI" 텍스트 (AI 챗봇 기능)
 *
 * 기존 sparkles 아이콘을 대체하여 상표권 문제 해결
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface AIAssistantIconProps {
  /** 아이콘 크기 프리셋 */
  size?: 'small' | 'medium' | 'large';
  /** 커스텀 크기 (size prop 대신 사용) */
  customSize?: number;
  /** 아이콘 색상 (기본: 흰색) */
  color?: string;
  /** AI 배지 표시 여부 (기본: true) */
  showAIBadge?: boolean;
  /** AI 배지 색상 (기본: 시안 #06B6D4) */
  aiBadgeColor?: string;
}

// 크기 프리셋 매핑
const SIZE_MAP = {
  small: { icon: 20, badge: 10, fontSize: 7 },
  medium: { icon: 24, badge: 12, fontSize: 8 },
  large: { icon: 28, badge: 16, fontSize: 10 },
};

const AIAssistantIcon: React.FC<AIAssistantIconProps> = ({
  size = 'medium',
  customSize,
  color = '#FFFFFF',
  showAIBadge = true,
  aiBadgeColor = '#06B6D4',
}) => {
  // 아이콘 크기 계산
  const iconSize = customSize || SIZE_MAP[size].icon;
  const badgeSize = customSize ? Math.round(customSize * 0.55) : SIZE_MAP[size].badge;
  const fontSize = customSize ? Math.round(customSize * 0.35) : SIZE_MAP[size].fontSize;

  return (
    <View style={styles.container}>
      {/* 메인 아이콘: 테니스 볼 🎾 */}
      <Ionicons name="tennisball" size={iconSize} color={color} />

      {/* AI 배지: 텍스트로 "AI" 표시 */}
      {showAIBadge && (
        <View
          style={[
            styles.aiBadge,
            {
              top: -Math.round(iconSize * 0.1),
              right: -Math.round(iconSize * 0.2),
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              backgroundColor: aiBadgeColor,
            },
          ]}
        >
          <Text style={[styles.aiText, { fontSize, color: '#FFFFFF' }]}>AI</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  aiBadge: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiText: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
});

export default AIAssistantIcon;
