import React from 'react';
import { View, StyleSheet } from 'react-native';
import RegularMeetupTab from '../RegularMeetupTab';

interface ClubRegularMeetupsScreenProps {
  clubId: string;
  userRole: 'admin' | 'member' | 'manager';
}

const ClubRegularMeetupsScreen: React.FC<ClubRegularMeetupsScreenProps> = ({
  clubId,
  userRole,
}) => {
  return (
    <View style={styles.container}>
      <RegularMeetupTab
        clubId={clubId}
        userRole={userRole}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
});

export default ClubRegularMeetupsScreen;