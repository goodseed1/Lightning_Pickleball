/**
 * Match Type Selector
 * Sub-tabs for filtering public match statistics
 * Singles / Doubles / Mixed Doubles
 */

import React from 'react';
import { SegmentedButtons } from 'react-native-paper';
import { useLanguage } from '../../contexts/LanguageContext';

export type MatchTypeValue = 'all' | 'singles' | 'doubles' | 'mixed_doubles';

interface MatchTypeSelectorProps {
  value: MatchTypeValue;
  onValueChange: (value: MatchTypeValue) => void;
}

const MatchTypeSelector: React.FC<MatchTypeSelectorProps> = ({ value, onValueChange }) => {
  const { t } = useLanguage();

  return (
    <SegmentedButtons
      value={value}
      onValueChange={val => onValueChange(val as MatchTypeValue)}
      buttons={[
        {
          value: 'all',
          label: t('matchTypeSelector.all'),
          icon: 'view-grid',
        },
        {
          value: 'singles',
          label: t('matchTypeSelector.singles'),
          icon: 'account',
        },
        {
          value: 'doubles',
          label: t('matchTypeSelector.doubles'),
          icon: 'account-multiple',
        },
        {
          value: 'mixed_doubles',
          label: t('matchTypeSelector.mixed'),
          icon: 'account-group',
        },
      ]}
      density='small'
      style={{ marginTop: 8 }}
    />
  );
};

export default MatchTypeSelector;
