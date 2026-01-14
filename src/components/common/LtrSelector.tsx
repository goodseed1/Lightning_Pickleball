/**
 * NTRP Level Selector Component
 * NTRP 실력 레벨 선택 공통 컴포넌트
 *
 * 📝 LPR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LPR" (Lightning Pickleball Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LPR로 변경하고 코드는 ntrp를 유지합니다.
 *
 * Features:
 * - Multiple selection support (다중 선택 지원)
 * - Consistent NTRP level definitions (일관된 NTRP 레벨 정의)
 * - Customizable validation logic (커스터마이징 가능한 검증 로직)
 * - Korean/English bilingual support (한국어/영어 지원)
 */

/* eslint-disable react-refresh/only-export-components */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';

// NTRP 레벨 정의 (앱 전체에서 일관성 유지)
export interface NTRPLevel {
  key: string;
  numericValue: number; // 비교용 숫자 값
}

export const NTRP_LEVELS: NTRPLevel[] = [
  { key: 'beginner', numericValue: 2.5 },
  { key: 'intermediate', numericValue: 3.5 },
  { key: 'advanced', numericValue: 4.5 },
  { key: 'expert', numericValue: 5.0 },
  { key: 'any', numericValue: 0 },
];

interface NTRPSelectorProps {
  selectedValues: string[]; // 현재 선택된 값들
  onSelectionChange: (selectedValues: string[]) => void; // 값 변경 시 호출할 함수
  multipleSelection?: boolean; // 다중 선택 허용 여부 (기본값: true)
  isLevelSelectable?: (levelKey: string) => boolean; // 특정 레벨 선택 가능 여부 확인 함수
  showDescriptions?: boolean; // 설명 표시 여부 (기본값: false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  style?: any; // 커스텀 스타일
}

const NTRPSelector: React.FC<NTRPSelectorProps> = ({
  selectedValues,
  onSelectionChange,
  multipleSelection = true,
  isLevelSelectable,
  showDescriptions = false,
  style,
}) => {
  const { t } = useLanguage();

  const handleLevelPress = (levelKey: string) => {
    // 선택 가능 여부 확인
    if (isLevelSelectable && !isLevelSelectable(levelKey)) {
      return;
    }

    if (multipleSelection) {
      // 다중 선택 모드
      const isSelected = selectedValues.includes(levelKey);
      const newValues = isSelected
        ? selectedValues.filter(key => key !== levelKey)
        : [...selectedValues, levelKey];
      onSelectionChange(newValues);
    } else {
      // 단일 선택 모드
      onSelectionChange([levelKey]);
    }
  };

  const getLevelLabel = (level: NTRPLevel): string => {
    return t(`ntrpSelector.levels.${level.key}.label`);
  };

  const getLevelDescription = (level: NTRPLevel): string => {
    return t(`ntrpSelector.levels.${level.key}.description`);
  };

  return (
    <View style={[styles.container, style]}>
      {NTRP_LEVELS.map(level => {
        const isSelected = selectedValues.includes(level.key);
        const isSelectable = isLevelSelectable ? isLevelSelectable(level.key) : true;

        return (
          <TouchableOpacity
            key={level.key}
            style={[
              styles.levelButton,
              isSelected && styles.levelButtonSelected,
              !isSelectable && styles.levelButtonDisabled,
            ]}
            onPress={() => handleLevelPress(level.key)}
            disabled={!isSelectable}
            activeOpacity={0.7}
          >
            <View style={styles.levelButtonContent}>
              <Text
                style={[
                  styles.levelButtonText,
                  isSelected && styles.levelButtonTextSelected,
                  !isSelectable && styles.levelButtonTextDisabled,
                ]}
              >
                {getLevelLabel(level)}
              </Text>
              {showDescriptions && (
                <Text
                  style={[
                    styles.levelDescription,
                    !isSelectable && styles.levelDescriptionDisabled,
                  ]}
                >
                  {getLevelDescription(level)}
                </Text>
              )}
            </View>
            {isSelected && (
              <View style={styles.checkIcon}>
                <Text style={styles.checkIconText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  levelButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelButtonSelected: {
    borderColor: '#1976D2',
    backgroundColor: '#E3F2FD',
  },
  levelButtonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#D0D0D0',
  },
  levelButtonContent: {
    flex: 1,
  },
  levelButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  levelButtonTextSelected: {
    color: '#1976D2',
    fontWeight: '600',
  },
  levelButtonTextDisabled: {
    color: '#999',
  },
  levelDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    lineHeight: 16,
  },
  levelDescriptionDisabled: {
    color: '#AAA',
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1976D2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  checkIconText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default NTRPSelector;

// 유틸리티 함수들
export const getNTRPLevelByKey = (key: string): NTRPLevel | undefined => {
  // 1순위: 정확한 키 매칭
  const level = NTRP_LEVELS.find(level => level.key === key);
  if (level) return level;

  // 2순위: 숫자 형식 키 매칭 (예: '1.0-2.5' -> 'beginner')
  const numericToKeyMapping: { [key: string]: string } = {
    '1.0-2.5': 'beginner',
    '3.0-3.5': 'intermediate',
    '4.0-4.5': 'advanced',
    '5.0+': 'expert',
    any: 'any',
  };

  const mappedKey = numericToKeyMapping[key];
  if (mappedKey) {
    return NTRP_LEVELS.find(level => level.key === mappedKey);
  }

  // 3순위: 부분 매칭 (키 자체가 라벨 문자열인 경우)
  // For backward compatibility with legacy label-based lookups
  const labelToKeyMapping: { [key: string]: string } = {
    '1.0-2.5 (초보자)': 'beginner',
    '1.0-2.5 (Beginner)': 'beginner',
    '3.0-3.5 (초급)': 'intermediate',
    '3.0-3.5 (Intermediate)': 'intermediate',
    '4.0-4.5 (중급)': 'advanced',
    '4.0-4.5 (Advanced)': 'advanced',
    '5.0+ (상급)': 'expert',
    '5.0+ (Expert)': 'expert',
    '실력 무관': 'any',
    'Any Level': 'any',
  };

  const labelMappedKey = labelToKeyMapping[key];
  return labelMappedKey ? NTRP_LEVELS.find(level => level.key === labelMappedKey) : undefined;
};

/**
 * DEPRECATED: Use translation keys directly with t('ntrpSelector.levels.{key}.label')
 * This function is kept for backward compatibility only
 */
export const getNTRPLabelByKey = (key: string, language: 'ko' | 'en' = 'ko'): string => {
  const level = getNTRPLevelByKey(key);
  if (!level) return key;

  // Fallback labels for backward compatibility
  const labels: Record<string, { ko: string; en: string }> = {
    beginner: { ko: '1.0-2.5 (초보자)', en: '1.0-2.5 (Beginner)' },
    intermediate: { ko: '3.0-3.5 (초급)', en: '3.0-3.5 (Intermediate)' },
    advanced: { ko: '4.0-4.5 (중급)', en: '4.0-4.5 (Advanced)' },
    expert: { ko: '5.0+ (상급)', en: '5.0+ (Expert)' },
    any: { ko: '실력 무관', en: 'Any Level' },
  };

  const levelLabels = labels[level.key];
  if (!levelLabels) return key;
  return language === 'ko' ? levelLabels.ko : levelLabels.en;
};

export const parseNTRPLevelsFromString = (ntrpString: string): string[] => {
  if (!ntrpString) return [];
  return ntrpString
    .split(',')
    .map(level => level.trim())
    .filter(Boolean);
};

export const formatNTRPLevelsToString = (
  levels: string[],
  language: 'ko' | 'en' = 'ko'
): string => {
  return levels.map(key => getNTRPLabelByKey(key, language)).join(', ');
};
