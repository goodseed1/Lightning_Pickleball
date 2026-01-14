/**
 * GuideOverlay - AI 가이드 오버레이 컴포넌트
 * AI가 특정 UI 요소를 가리키며 안내할 때 사용
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Modal } from 'react-native';
import { Text, useTheme, Surface, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface GuideOverlayProps {
  /** 가이드 표시 여부 */
  visible: boolean;
  /** 안내 메시지 */
  message: string;
  /** 하이라이트할 영역 (x, y, width, height) */
  targetArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** 툴팁 위치 */
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  /** 닫기 버튼 표시 여부 */
  showCloseButton?: boolean;
  /** 닫기 콜백 */
  onClose?: () => void;
  /** 다음 단계 버튼 텍스트 */
  nextButtonText?: string;
  /** 다음 단계 콜백 */
  onNext?: () => void;
  /** 현재 단계 표시 (예: "1/3") */
  stepIndicator?: string;
}

const GuideOverlay: React.FC<GuideOverlayProps> = ({
  visible,
  message,
  targetArea,
  tooltipPosition = 'bottom',
  showCloseButton = true,
  onClose,
  nextButtonText,
  onNext,
  stepIndicator,
}) => {
  const theme = useTheme();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  if (!visible) return null;

  // 하이라이트 영역 계산
  const renderHighlight = () => {
    if (!targetArea) return null;

    return (
      <View
        style={[
          styles.highlight,
          {
            left: targetArea.x - 4,
            top: targetArea.y - 4,
            width: targetArea.width + 8,
            height: targetArea.height + 8,
            borderColor: theme.colors.primary,
          },
        ]}
      />
    );
  };

  // 툴팁 위치 계산
  const getTooltipStyle = () => {
    if (!targetArea) {
      return { bottom: 100, left: 20, right: 20 };
    }

    const padding = 16;
    switch (tooltipPosition) {
      case 'top':
        return {
          bottom: screenHeight - targetArea.y + padding,
          left: padding,
          right: padding,
        };
      case 'bottom':
        return {
          top: targetArea.y + targetArea.height + padding,
          left: padding,
          right: padding,
        };
      case 'left':
        return {
          top: targetArea.y,
          right: screenWidth - targetArea.x + padding,
          maxWidth: targetArea.x - padding * 2,
        };
      case 'right':
        return {
          top: targetArea.y,
          left: targetArea.x + targetArea.width + padding,
          maxWidth: screenWidth - targetArea.x - targetArea.width - padding * 2,
        };
      default:
        return { bottom: 100, left: 20, right: 20 };
    }
  };

  return (
    <Modal transparent visible={visible} animationType='fade'>
      {/* 반투명 배경 */}
      <View style={styles.overlay}>
        {/* 하이라이트 영역 */}
        {renderHighlight()}

        {/* 툴팁 카드 */}
        <Surface
          style={[styles.tooltip, getTooltipStyle(), { backgroundColor: theme.colors.surface }]}
        >
          {/* 헤더 */}
          <View style={styles.tooltipHeader}>
            {stepIndicator && (
              <Text style={[styles.stepIndicator, { color: theme.colors.primary }]}>
                {stepIndicator}
              </Text>
            )}
            {showCloseButton && (
              <IconButton icon='close' size={20} onPress={onClose} style={styles.closeButton} />
            )}
          </View>

          {/* AI 아이콘과 메시지 */}
          <View style={styles.messageContainer}>
            <MaterialCommunityIcons
              name='robot-happy'
              size={24}
              color={theme.colors.primary}
              style={styles.aiIcon}
            />
            <Text style={[styles.message, { color: theme.colors.onSurface }]}>{message}</Text>
          </View>

          {/* 다음 버튼 */}
          {nextButtonText && onNext && (
            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: theme.colors.primary }]}
              onPress={onNext}
            >
              <Text style={styles.nextButtonText}>{nextButtonText}</Text>
            </TouchableOpacity>
          )}
        </Surface>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  highlight: {
    position: 'absolute',
    borderWidth: 3,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  tooltip: {
    position: 'absolute',
    borderRadius: 16,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepIndicator: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  closeButton: {
    margin: -8,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  aiIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  message: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  nextButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default GuideOverlay;
