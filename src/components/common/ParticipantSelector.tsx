import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../hooks/useTheme';
import { getLightningPickleballTheme } from '../../theme';

interface ParticipantSelectorProps {
  initialValue?: number;
  onParticipantChange: (count: number) => void;
}

const ParticipantSelector: React.FC<ParticipantSelectorProps> = ({
  initialValue = 4,
  onParticipantChange,
}) => {
  const { t } = useLanguage();
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningPickleballTheme(currentTheme);
  const isDark = currentTheme === 'dark';
  const [participants, setParticipants] = useState<number>(initialValue);
  const [customInput, setCustomInput] = useState<string>('');

  const presetOptions = [2, 4, 8, 12];

  useEffect(() => {
    onParticipantChange(participants);
  }, [participants, onParticipantChange]);

  const handlePresetSelect = (count: number) => {
    setParticipants(count);
    setCustomInput(''); // 버튼 선택 시 텍스트 입력 초기화
  };

  const handleCustomInputChange = (text: string) => {
    setCustomInput(text);

    // 숫자만 허용
    const numericValue = parseInt(text, 10);

    if (!isNaN(numericValue) && numericValue >= 2) {
      setParticipants(numericValue);

      // 16 이상일 경우 프리셋 버튼들을 선택 해제 상태로 만듦
      // (participants 상태는 이미 numericValue로 설정되어 있음)
    }
  };

  const isPresetSelected = (count: number) => {
    // 사용자가 직접 입력한 값이 12보다 크면 모든 프리셋 버튼은 선택 해제
    if (customInput && participants > 12) {
      return false;
    }
    // 그렇지 않으면 현재 participants 값과 비교
    return participants === count && !customInput;
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: themeColors.colors.onSurface }]}>
        {t('participantSelector.maxParticipants')}
      </Text>

      {/* 프리셋 버튼들 */}
      <View style={styles.presetButtonsContainer}>
        {presetOptions.map(count => (
          <TouchableOpacity
            key={count}
            style={[
              styles.presetButton,
              {
                backgroundColor: isDark ? themeColors.colors.surfaceVariant : '#fff',
                borderColor: isDark ? themeColors.colors.outline : '#e0e0e0',
              },
              isPresetSelected(count) && styles.presetButtonActive,
            ]}
            onPress={() => handlePresetSelect(count)}
          >
            <Text
              style={[
                styles.presetButtonText,
                { color: isDark ? themeColors.colors.onSurfaceVariant : '#666' },
                isPresetSelected(count) && styles.presetButtonTextActive,
              ]}
            >
              {count}
              {t('participantSelector.peopleSuffix')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 직접 입력 */}
      <View style={styles.customInputContainer}>
        <Text
          style={[
            styles.customInputLabel,
            { color: isDark ? themeColors.colors.onSurfaceVariant : '#666' },
          ]}
        >
          {t('participantSelector.customInput')}
        </Text>
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: isDark ? themeColors.colors.surfaceVariant : '#fff',
              borderColor: isDark ? themeColors.colors.outline : '#e0e0e0',
            },
          ]}
        >
          <TextInput
            style={[styles.customInput, { color: themeColors.colors.onSurface }]}
            value={customInput}
            onChangeText={handleCustomInputChange}
            placeholder={t('participantSelector.placeholder')}
            placeholderTextColor={isDark ? themeColors.colors.onSurfaceVariant : '#999'}
            keyboardType='numeric'
            maxLength={3}
          />
          <Text
            style={[
              styles.inputSuffix,
              { color: isDark ? themeColors.colors.onSurfaceVariant : '#666' },
            ]}
          >
            {t('participantSelector.peopleSuffix')}
          </Text>
        </View>
      </View>

      {/* 현재 선택된 값 표시 */}
      <View
        style={[
          styles.selectedValueContainer,
          { backgroundColor: isDark ? themeColors.colors.surfaceVariant : '#f5f5f5' },
        ]}
      >
        <Text style={[styles.selectedValueText, { color: themeColors.colors.onSurface }]}>
          {t('participantSelector.selected', { count: participants })}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  presetButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    flex: 1,
    minWidth: 70,
  },
  presetButtonActive: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  presetButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  presetButtonTextActive: {
    color: '#fff',
  },
  customInputContainer: {
    marginBottom: 16,
  },
  customInputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
  },
  customInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
  },
  inputSuffix: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  selectedValueContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectedValueText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default ParticipantSelector;
