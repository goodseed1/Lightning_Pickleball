import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import ClubAdminMenuCard from '../../../components/clubs/ClubAdminMenuCard';

interface ClubAdminScreenProps {
  clubId: string;
  clubName?: string;
  userRole: string;
}

const ClubAdminScreen: React.FC<ClubAdminScreenProps> = ({ clubId, clubName, userRole }) => {
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ClubAdminMenuCard clubId={clubId} clubName={clubName} userRole={userRole} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
});

export default ClubAdminScreen;
