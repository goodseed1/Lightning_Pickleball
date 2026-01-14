/**
 * 🎯 [IRON MAN] Club Filter Selector Component
 *
 * Sub-filter for club scope that allows users to filter between:
 * - League matches only
 * - Tournament matches only
 *
 * 🆕 [KIM] Removed 'all' option - users now see only league or tournament
 *
 * Used in MyProfileScreen when mainScope is 'club'
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';
import { useLanguage } from '../../contexts/LanguageContext';

// 🆕 [KIM] Removed 'all' - only league and tournament options
export type ClubFilterValue = 'league' | 'tournament';

interface ClubFilterSelectorProps {
  value: ClubFilterValue;
  onValueChange: (value: ClubFilterValue) => void;
}

const ClubFilterSelector: React.FC<ClubFilterSelectorProps> = ({ value, onValueChange }) => {
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      <SegmentedButtons
        value={value}
        onValueChange={onValueChange}
        buttons={[
          // 🆕 [KIM] Removed 'all' option
          {
            value: 'league',
            label: t('clubFilterSelector.league'),
            icon: 'account-group',
          },
          {
            value: 'tournament',
            label: t('clubFilterSelector.tournament'),
            icon: 'trophy',
          },
        ]}
        density='small'
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 12,
  },
});

export default ClubFilterSelector;
