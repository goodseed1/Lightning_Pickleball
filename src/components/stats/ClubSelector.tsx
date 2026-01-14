/**
 * 🏢 [IRON MAN] Club Selector Component
 *
 * Dynamic club selection UI that adapts based on the number of clubs:
 * - 1 club: Just displays the club name (no selection needed)
 * - 2-3 clubs: SegmentedButtons for quick switching
 * - 4+ clubs: Dropdown menu for space efficiency
 *
 * Used in StatsTabContent when mainScope is 'club'
 */

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Text,
  SegmentedButtons,
  Menu,
  Button,
  useTheme as usePaperTheme,
} from 'react-native-paper';
import { useLanguage } from '../../contexts/LanguageContext';

export interface ClubOption {
  clubId: string;
  clubName: string;
}

interface ClubSelectorProps {
  clubs: ClubOption[];
  selectedClubId: string | null;
  onSelectClub: (clubId: string | null) => void;
}

const ClubSelector: React.FC<ClubSelectorProps> = ({ clubs, selectedClubId, onSelectClub }) => {
  const paperTheme = usePaperTheme();
  const { t } = useLanguage();
  const [menuVisible, setMenuVisible] = useState(false);

  // No clubs - show nothing
  if (clubs.length === 0) {
    return (
      <View style={styles.container}>
        <Text variant='bodyMedium' style={{ color: paperTheme.colors.onSurfaceVariant }}>
          {t('clubSelector.noClubs')}
        </Text>
      </View>
    );
  }

  // 1 club - don't show anything (no selector needed)
  // 🆕 [KIM] Removed "클럽" and club name labels per user request
  if (clubs.length === 1) {
    return null;
  }

  // 2-3 clubs - SegmentedButtons
  // 🆕 [KIM] Removed "클럽 선택" label text per user request
  if (clubs.length <= 3) {
    return (
      <View style={styles.container}>
        <SegmentedButtons
          value={selectedClubId || clubs[0].clubId}
          onValueChange={value => onSelectClub(value)}
          buttons={clubs.map(club => ({
            value: club.clubId,
            label:
              club.clubName.length > 10 ? `${club.clubName.substring(0, 10)}...` : club.clubName,
          }))}
          density='small'
          style={styles.segmentedButtons}
        />
      </View>
    );
  }

  // 4+ clubs - Dropdown menu
  // 🆕 [KIM] Removed "클럽 선택" label text per user request
  const selectedClub = clubs.find(c => c.clubId === selectedClubId) || clubs[0];

  return (
    <View style={styles.container}>
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <Button
            mode='outlined'
            onPress={() => setMenuVisible(true)}
            icon='chevron-down'
            contentStyle={styles.dropdownButtonContent}
            style={styles.dropdownButton}
          >
            {selectedClub.clubName}
          </Button>
        }
        contentStyle={{ backgroundColor: paperTheme.colors.surface }}
      >
        {clubs.map(club => (
          <Menu.Item
            key={club.clubId}
            onPress={() => {
              onSelectClub(club.clubId);
              setMenuVisible(false);
            }}
            title={club.clubName}
            leadingIcon={club.clubId === selectedClubId ? 'check' : undefined}
          />
        ))}
      </Menu>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    marginBottom: 8,
  },
  singleClubContainer: {
    paddingVertical: 4,
  },
  // 🆕 [KIM] Removed 'label' style - no longer used after removing "클럽 선택" text
  segmentedButtons: {
    marginTop: 0,
  },
  dropdownButton: {
    alignSelf: 'flex-start',
  },
  dropdownButtonContent: {
    flexDirection: 'row-reverse',
  },
});

export default ClubSelector;
