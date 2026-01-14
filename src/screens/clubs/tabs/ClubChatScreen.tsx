import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text as PaperText } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

interface ClubChatScreenProps {
  clubId: string;
  userRole: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ClubChatScreen: React.FC<ClubChatScreenProps> = ({ clubId, userRole }) => {
  return (
    <View style={styles.container}>
      <View style={styles.emptyState}>
        <Ionicons name='chatbubbles-outline' size={64} color='#ddd' />
        <PaperText variant='titleMedium' style={styles.emptyTitle}>
          클럽 채팅
        </PaperText>
        <PaperText variant='bodyMedium' style={styles.emptyText}>
          클럽 멤버들과 소통할 수 있는 채팅 기능은 개발 예정입니다.
        </PaperText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    marginTop: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 8,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ClubChatScreen;
