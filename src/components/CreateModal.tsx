import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../hooks/useTheme';
import { getLightningTennisTheme } from '../theme';
import { RootStackParamList } from '../navigation/AppNavigator';

interface CreateModalProps {
  visible: boolean;
  onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CreateModal: React.FC<CreateModalProps> = ({ visible, onClose }) => {
  const { t } = useLanguage();
  const navigation = useNavigation<NavigationProp>();
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningTennisTheme(currentTheme);
  const colors = themeColors.colors;

  const handleCreateMatch = () => {
    console.log('Create Ranked Match');
    onClose();
    navigation.navigate('CreateEventChoice');
  };

  const handleCreateMeetup = () => {
    console.log('Create Casual Meetup');
    onClose();
    navigation.navigate('CreateEventChoice');
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: SCREEN_HEIGHT * 0.7,
    },
    modalContent: {
      paddingBottom: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.onSurface,
    },
    closeButton: {
      padding: 4,
    },
    optionsContainer: {
      padding: 20,
      gap: 16,
    },
    optionCard: {
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    matchCard: {
      backgroundColor: currentTheme === 'dark' ? colors.surfaceVariant : '#fff8e1',
      borderWidth: 2,
      borderColor: '#ffc107',
    },
    meetupCard: {
      backgroundColor: currentTheme === 'dark' ? colors.surfaceVariant : '#e8f5e9',
      borderWidth: 2,
      borderColor: '#4caf50',
    },
    optionIcon: {
      fontSize: 48,
      marginBottom: 12,
    },
    optionTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.onSurface,
      marginBottom: 4,
    },
    optionSubtitle: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginBottom: 12,
    },
    optionDescription: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

  return (
    <Modal visible={visible} transparent animationType='slide' onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <SafeAreaView style={styles.modalContent}>
                <View style={styles.header}>
                  <Text style={styles.title}>{t('createModal.title')}</Text>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Ionicons name='close' size={28} color={colors.onSurface} />
                  </TouchableOpacity>
                </View>

                <View style={styles.optionsContainer}>
                  <TouchableOpacity
                    style={[styles.optionCard, styles.matchCard]}
                    onPress={handleCreateMatch}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.optionIcon}>🏆</Text>
                    <Text style={styles.optionTitle}>{t('createModal.lightningMatch.title')}</Text>
                    <Text style={styles.optionSubtitle}>
                      {t('createModal.lightningMatch.subtitle')}
                    </Text>
                    <Text style={styles.optionDescription}>
                      {t('createModal.lightningMatch.description')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.optionCard, styles.meetupCard]}
                    onPress={handleCreateMeetup}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.optionIcon}>😊</Text>
                    <Text style={styles.optionTitle}>{t('createModal.lightningMeetup.title')}</Text>
                    <Text style={styles.optionSubtitle}>
                      {t('createModal.lightningMeetup.subtitle')}
                    </Text>
                    <Text style={styles.optionDescription}>
                      {t('createModal.lightningMeetup.description')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default CreateModal;
