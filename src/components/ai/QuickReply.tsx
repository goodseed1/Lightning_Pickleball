/**
 * QuickReply Component
 * 빠른 응답 버튼 컴포넌트 - AI 챗봇 대화에서 빠른 선택지 제공
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { Chip, useTheme } from 'react-native-paper';

export interface QuickReplyProps {
  /** 버튼 라벨 */
  label: string;
  /** 버튼 클릭 핸들러 */
  onPress: () => void;
  /** 아이콘 이름 (MaterialCommunityIcons) */
  icon?: string;
  /** 비활성화 상태 */
  disabled?: boolean;
}

/**
 * QuickReply - 빠른 응답 버튼 컴포넌트
 * - Chip 스타일 (아웃라인)
 * - 아이콘 지원 (MaterialCommunityIcons)
 * - disabled 상태 지원
 */
const QuickReply: React.FC<QuickReplyProps> = ({ label, onPress, icon, disabled = false }) => {
  const { colors } = useTheme();

  return (
    <Chip
      mode='outlined'
      icon={icon}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.chip,
        {
          borderColor: disabled ? colors.outlineVariant : colors.primary,
          backgroundColor: colors.surface,
        },
      ]}
      textStyle={[
        styles.chipText,
        {
          color: disabled ? colors.onSurfaceVariant : colors.primary,
        },
      ]}
    >
      {label}
    </Chip>
  );
};

const styles = StyleSheet.create({
  chip: {
    marginHorizontal: 4,
    marginVertical: 4,
  },
  chipText: {
    fontSize: 14,
  },
});

export default QuickReply;
