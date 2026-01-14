import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button, Switch, useTheme, MD3Theme } from 'react-native-paper';

import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import clubCommsService from '../../services/clubCommsService';
import { validatePost } from '../../types/clubCommunication';

const CreatePostScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useLanguage();
  const { t: translate } = useTranslation();
  const { currentUser } = useAuth();
  const theme = useTheme();

  // Memoize styles with theme
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Get params
  const { clubId } = route.params as { clubId: string };

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!currentUser?.uid) {
      Alert.alert(t('common.error'), t('createPost.loginRequired'));
      return;
    }

    // 유효성 검사
    const validation = validatePost(title, content);
    if (!validation.isValid) {
      Alert.alert(t('createPost.inputError'), validation.errors.join('\n'));
      return;
    }

    try {
      setCreating(true);

      await clubCommsService.createPost(
        {
          clubId,
          title: title.trim(),
          content: content.trim(),
          isAnnouncement,
          isPinned,
        },
        currentUser.uid,
        currentUser.displayName || translate('common.unknownUser'),
        currentUser.photoURL
      );

      Alert.alert(t('createPost.postCreated'), t('createPost.postCreatedSuccess'), [
        {
          text: t('common.ok'),
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert(t('createPost.createFailed'), t('createPost.createFailedMessage'));
    } finally {
      setCreating(false);
    }
  };

  const handleBack = () => {
    if (title.trim() || content.trim()) {
      Alert.alert(t('createPost.discardPost'), t('createPost.discardPostMessage'), [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('createPost.leave'),
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]);
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name='arrow-back' size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('createPost.title')}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Instructions - 🎨 [DARK GLASS] Card Style */}
        <View style={styles.instructionsCard}>
          <View style={styles.instructionsHeader}>
            <Ionicons name='information-circle' size={20} color={theme.colors.primary} />
            <Text style={styles.instructionsTitle}>{t('createPost.writingGuide')}</Text>
          </View>
          <View style={styles.instructionsList}>
            <Text style={styles.instructionItem}>• {t('createPost.instruction1')}</Text>
            <Text style={styles.instructionItem}>• {t('createPost.instruction2')}</Text>
            <Text style={styles.instructionItem}>• {t('createPost.instruction3')}</Text>
          </View>
        </View>

        {/* Title Input - 🎨 [DARK GLASS] Card Style */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>
            {t('createPost.titleLabel')}
            <Text style={styles.required}> *</Text>
          </Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder={t('createPost.titlePlaceholder')}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            maxLength={100}
          />
          <Text style={styles.characterCount}>{title.length} / 100</Text>
        </View>

        {/* Content Input - 🎨 [DARK GLASS] Card Style */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>
            {t('createPost.contentLabel')}
            <Text style={styles.required}> *</Text>
          </Text>
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder={t('club.postContentPlaceholder')}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            multiline
            textAlignVertical='top'
            maxLength={5000}
          />
          <Text
            style={[styles.characterCount, content.length > 5000 && styles.characterCountError]}
          >
            {content.length.toLocaleString()} / 5,000
          </Text>
        </View>

        {/* Post Options - 🎨 [DARK GLASS] Card Style */}
        <View style={styles.optionsCard}>
          <Text style={styles.optionsTitle}>{t('createPost.postOptions')}</Text>

          <View style={styles.optionItem}>
            <View style={styles.optionInfo}>
              <Text style={styles.optionLabel}>{t('createPost.announcement')}</Text>
              <Text style={styles.optionDescription}>{t('createPost.announcementDesc')}</Text>
            </View>
            <Switch value={isAnnouncement} onValueChange={setIsAnnouncement} />
          </View>

          <View style={[styles.optionItem, styles.optionItemLast]}>
            <View style={styles.optionInfo}>
              <Text style={styles.optionLabel}>{t('createPost.pinToTop')}</Text>
              <Text style={styles.optionDescription}>{t('createPost.pinToTopDesc')}</Text>
            </View>
            <Switch value={isPinned} onValueChange={setIsPinned} />
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <Button
          mode='outlined'
          onPress={handleBack}
          style={styles.cancelButton}
          textColor={theme.colors.primary}
          disabled={creating}
        >
          {t('common.cancel')}
        </Button>

        <Button
          mode='contained'
          onPress={handleCreate}
          style={styles.createButton}
          loading={creating}
          disabled={creating || !title.trim() || !content.trim()}
        >
          {t('createPost.createButton')}
        </Button>
      </View>
    </SafeAreaView>
  );
};

// 🎨 [DARK GLASS] Card Style - 테마 색상 사용
const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerContent: {
      flex: 1,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
    },
    headerRight: {
      width: 40,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    // 🎨 [DARK GLASS] Instructions Card - 파란색 계열 유지 (정보 카드)
    instructionsCard: {
      backgroundColor: theme.dark ? '#1a237e20' : '#e3f2fd',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.dark ? '#3949ab40' : '#90caf9',
      padding: 16,
      marginBottom: 16,
    },
    instructionsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    instructionsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primary,
      marginLeft: 8,
    },
    instructionsList: {
      gap: 8,
    },
    instructionItem: {
      fontSize: 14,
      color: theme.colors.primary,
      lineHeight: 20,
    },
    // 🎨 [DARK GLASS] Input Card Style
    inputCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      padding: 16,
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      marginBottom: 12,
    },
    required: {
      color: theme.colors.error,
    },
    titleInput: {
      fontSize: 16,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 8,
      padding: 12,
      backgroundColor: theme.colors.background,
      color: theme.colors.onSurface,
    },
    contentInput: {
      fontSize: 16,
      lineHeight: 24,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 8,
      padding: 12,
      backgroundColor: theme.colors.background,
      color: theme.colors.onSurface,
      minHeight: 200,
    },
    characterCount: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'right',
      marginTop: 8,
    },
    characterCountError: {
      color: theme.colors.error,
    },
    // 🎨 [DARK GLASS] Options Card Style
    optionsCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      padding: 16,
      marginBottom: 16,
    },
    optionsTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 16,
    },
    optionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    optionItemLast: {
      borderBottomWidth: 0,
    },
    optionInfo: {
      flex: 1,
    },
    optionLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.onSurface,
      marginBottom: 4,
    },
    optionDescription: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    actionContainer: {
      flexDirection: 'row',
      gap: 12,
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
    },
    cancelButton: {
      flex: 1,
      borderColor: theme.colors.primary,
    },
    createButton: {
      flex: 2,
    },
  });

export default CreatePostScreen;
