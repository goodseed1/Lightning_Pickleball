import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Switch,
  Surface,
  IconButton,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';

import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../hooks/useTheme';
import { getLightningTennisTheme } from '../../theme';
import clubService from '../../services/clubService';

type RootStackParamList = {
  ManageAnnouncement: { clubId: string };
};

type ManageAnnouncementScreenRouteProp = RouteProp<RootStackParamList, 'ManageAnnouncement'>;

interface ClubAnnouncement {
  title: string;
  content: string;
  isImportant: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  authorId?: string;
  authorName?: string;
}

const ManageAnnouncementScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ManageAnnouncementScreenRouteProp>();
  const { clubId } = route.params;
  const { t, currentLanguage } = useLanguage();
  const { theme } = useTheme();
  const themeColors = getLightningTennisTheme(theme);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [existingAnnouncement, setExistingAnnouncement] = useState<ClubAnnouncement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsLoading(true);

    // Load current announcement
    const unsubscribe = clubService.getClubAnnouncementStream(
      clubId,
      (announcement: ClubAnnouncement | null) => {
        if (announcement) {
          setTitle(announcement.title || '');
          setContent(announcement.content || '');
          setIsImportant(announcement.isImportant || false);
          setExistingAnnouncement(announcement);
        } else {
          // No existing announcement
          setTitle('');
          setContent('');
          setIsImportant(false);
          setExistingAnnouncement(null);
        }
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [clubId]);

  const handleSave = useCallback(async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert(t('manageAnnouncement.error'), t('manageAnnouncement.validationError'));
      return;
    }

    setIsSaving(true);
    try {
      await clubService.setClubAnnouncement(clubId, {
        title: title.trim(),
        content: content.trim(),
        isImportant,
      });

      Alert.alert(t('manageAnnouncement.success'), t('manageAnnouncement.savedSuccess'), [
        {
          text: t('manageAnnouncement.ok'),
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error saving announcement:', error);
      Alert.alert(t('manageAnnouncement.error'), t('manageAnnouncement.savingError'));
    } finally {
      setIsSaving(false);
    }
  }, [title, content, isImportant, clubId, currentLanguage, navigation]);

  const handleDelete = useCallback(() => {
    Alert.alert(t('manageAnnouncement.deleteTitle'), t('manageAnnouncement.deleteConfirmMessage'), [
      {
        text: t('manageAnnouncement.cancel'),
        style: 'cancel',
      },
      {
        text: t('manageAnnouncement.delete'),
        style: 'destructive',
        onPress: async () => {
          setIsSaving(true);
          try {
            await clubService.deleteClubAnnouncement(clubId);
            Alert.alert(t('manageAnnouncement.success'), t('manageAnnouncement.deletedSuccess'), [
              {
                text: t('manageAnnouncement.ok'),
                onPress: () => navigation.goBack(),
              },
            ]);
          } catch (error) {
            console.error('Error deleting announcement:', error);
            Alert.alert(t('manageAnnouncement.error'), t('manageAnnouncement.deletingError'));
          } finally {
            setIsSaving(false);
          }
        },
      },
    ]);
  }, [clubId, currentLanguage, navigation]);

  const styles = createStyles(themeColors);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Custom Header with Back Button */}
        <View style={styles.header}>
          <IconButton icon='arrow-left' size={24} onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>{t('manageAnnouncement.title')}</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <Text>{t('manageAnnouncement.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header with Back Button */}
      <View style={styles.header}>
        <IconButton icon='arrow-left' size={24} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>{t('manageAnnouncement.title')}</Text>
        <IconButton
          icon='content-save'
          size={24}
          onPress={handleSave}
          disabled={isSaving || !title.trim() || !content.trim()}
        />
      </View>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Status Card */}
          <Card style={styles.statusCard}>
            <Card.Content>
              <Text style={styles.statusTitle}>
                {existingAnnouncement
                  ? t('manageAnnouncement.editExisting')
                  : t('manageAnnouncement.createNew')}
              </Text>
              {existingAnnouncement && (
                <Text style={styles.statusSubtitle}>
                  {t('manageAnnouncement.lastUpdated')}{' '}
                  {existingAnnouncement.updatedAt
                    ? new Date(existingAnnouncement.updatedAt).toLocaleDateString()
                    : t('manageAnnouncement.unknown')}
                </Text>
              )}
            </Card.Content>
          </Card>

          {/* Form Card */}
          <Card style={styles.formCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>{t('manageAnnouncement.announcementDetails')}</Text>

              {/* Title Input */}
              <TextInput
                label={t('manageAnnouncement.title')}
                value={title}
                onChangeText={setTitle}
                mode='outlined'
                style={styles.input}
                maxLength={100}
                right={<TextInput.Affix text={`${title.length}/100`} />}
              />

              {/* Content Input */}
              <TextInput
                label={t('manageAnnouncement.contentLabel')}
                value={content}
                onChangeText={setContent}
                mode='outlined'
                multiline
                numberOfLines={6}
                style={styles.textArea}
                maxLength={1000}
                right={<TextInput.Affix text={`${content.length}/1000`} />}
              />

              <Divider style={styles.divider} />

              {/* Important Toggle */}
              <Surface style={styles.switchContainer}>
                <View style={styles.switchContent}>
                  <View style={styles.switchLabels}>
                    <Text style={styles.switchTitle}>
                      {t('manageAnnouncement.importantNotice')}
                    </Text>
                    <Text style={styles.switchSubtitle}>
                      {t('manageAnnouncement.importantNoticeDescription')}
                    </Text>
                  </View>
                  <Switch value={isImportant} onValueChange={setIsImportant} />
                </View>
              </Surface>
            </Card.Content>
          </Card>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <Button
              mode='contained'
              onPress={handleSave}
              loading={isSaving}
              disabled={!title.trim() || !content.trim()}
              style={styles.saveButton}
              contentStyle={styles.buttonContent}
            >
              {existingAnnouncement
                ? t('manageAnnouncement.updateButton')
                : t('manageAnnouncement.saveButton')}
            </Button>

            {existingAnnouncement && (
              <Button
                mode='outlined'
                onPress={handleDelete}
                disabled={isSaving}
                style={styles.deleteButton}
                contentStyle={styles.buttonContent}
                textColor={themeColors.colors.error}
              >
                {t('manageAnnouncement.deleteButton')}
              </Button>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createStyles = (themeColors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.colors.outline,
      backgroundColor: themeColors.colors.surface,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.colors.onSurface,
      flex: 1,
      textAlign: 'center',
    },
    headerRight: {
      width: 48,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flex: 1,
      padding: 16,
    },
    statusCard: {
      marginBottom: 16,
      backgroundColor: themeColors.colors.surface,
    },
    statusTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.colors.onSurface,
      marginBottom: 4,
    },
    statusSubtitle: {
      fontSize: 14,
      color: themeColors.colors.onSurfaceVariant,
    },
    formCard: {
      marginBottom: 16,
      backgroundColor: themeColors.colors.surface,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.colors.onSurface,
      marginBottom: 16,
    },
    input: {
      marginBottom: 16,
    },
    textArea: {
      marginBottom: 16,
    },
    divider: {
      marginVertical: 16,
    },
    switchContainer: {
      borderRadius: 8,
      backgroundColor: themeColors.colors.surfaceVariant,
    },
    switchContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    switchLabels: {
      flex: 1,
      marginRight: 16,
    },
    switchTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: themeColors.colors.onSurface,
      marginBottom: 4,
    },
    switchSubtitle: {
      fontSize: 14,
      color: themeColors.colors.onSurfaceVariant,
    },
    buttonContainer: {
      gap: 12,
      marginBottom: 32,
    },
    saveButton: {
      borderRadius: 8,
    },
    deleteButton: {
      borderRadius: 8,
      borderColor: themeColors.colors.error,
    },
    buttonContent: {
      paddingVertical: 8,
    },
  });

export default ManageAnnouncementScreen;
