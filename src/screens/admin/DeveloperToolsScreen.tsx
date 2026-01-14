/**
 * 🔧 Developer Tools Screen
 * 개발자 전용 도구 모음
 */

import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Alert } from 'react-native';
import { Appbar, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { DeveloperToolsMenu } from '../../components/profile/DeveloperToolsMenu';

const DeveloperToolsScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { user } = useAuth();
  const developerTools = DeveloperToolsMenu();

  const handleCopyUID = async () => {
    if (!user?.uid) {
      Alert.alert(t('developerTools.errorTitle'), t('developerTools.loginRequired'));
      return;
    }

    await Clipboard.setStringAsync(user.uid);
    Alert.alert(
      t('developerTools.copiedTitle'),
      `${t('developerTools.copiedMessage')}\n\n${user.uid}`
    );
  };

  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('developerTools.title')} />
      </Appbar.Header>

      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Button 0: Copy UID */}
        <TouchableOpacity style={styles.infoButton} onPress={handleCopyUID}>
          <Ionicons name='finger-print-outline' size={24} color='#fff' />
          <View style={styles.buttonTextContainer}>
            <Text style={styles.buttonText}>{t('developerTools.copyUid')}</Text>
            <Text style={styles.buttonSubtitle}>
              {user?.uid
                ? `${user.uid.substring(0, 12)}...`
                : t('developerTools.loginRequiredLabel')}
            </Text>
          </View>
          <Ionicons name='copy-outline' size={20} color='#fff' />
        </TouchableOpacity>

        {/* Button 1: Delete All Users */}
        <TouchableOpacity style={styles.dangerButton} onPress={developerTools.handleDeleteAllUsers}>
          <Ionicons name='nuclear-outline' size={24} color='#fff' />
          <View style={styles.buttonTextContainer}>
            <Text style={styles.buttonText}>{t('developerTools.deleteAllAccounts')}</Text>
            <Text style={styles.buttonSubtitle}>
              {t('developerTools.deleteAllAccountsSubtitle')}
            </Text>
          </View>
          <Ionicons name='chevron-forward' size={20} color='#fff' />
        </TouchableOpacity>

        {/* Button 2: Delete All Activity Data */}
        <TouchableOpacity
          style={styles.warningButton}
          onPress={developerTools.handleDeleteAllActivityData}
        >
          <Ionicons name='trash-bin-outline' size={24} color='#fff' />
          <View style={styles.buttonTextContainer}>
            <Text style={styles.buttonText}>{t('developerTools.deleteActivityData')}</Text>
            <Text style={styles.buttonSubtitle}>
              {t('developerTools.deleteActivityDataSubtitle')}
            </Text>
          </View>
          <Ionicons name='chevron-forward' size={20} color='#fff' />
        </TouchableOpacity>

        {/* Button 3: Set Admin Claim */}
        <TouchableOpacity
          style={styles.adminClaimButton}
          onPress={developerTools.handleSetAdminClaim}
        >
          <Ionicons name='shield-checkmark-outline' size={24} color='#fff' />
          <View style={styles.buttonTextContainer}>
            <Text style={styles.buttonText}>{t('developerTools.setAdminClaim')}</Text>
            <Text style={styles.buttonSubtitle}>{t('developerTools.setAdminClaimSubtitle')}</Text>
          </View>
          <Ionicons name='chevron-forward' size={20} color='#fff' />
        </TouchableOpacity>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976D2',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    gap: 12,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d32f2f',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    gap: 12,
  },
  warningButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f57c00',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  adminClaimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
});

export default DeveloperToolsScreen;
