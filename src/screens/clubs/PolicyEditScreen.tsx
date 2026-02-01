import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Card, Surface, Divider, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { theme } from '../../theme';

type PolicyEditParams = {
  clubId: string;
  clubName: string;
};

type PolicyEditScreenRouteProp = RouteProp<{ PolicyEdit: PolicyEditParams }, 'PolicyEdit'>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ClubPolicy {
  id?: string;
  clubId: string;
  content: string;
  lastUpdatedAt: Date;
  lastUpdatedBy: string;
  version: number;
}

const PolicyEditScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<PolicyEditScreenRouteProp>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useAuth();

  const { t } = useLanguage();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { clubId, clubName } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [policyContent, setPolicyContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPolicy();
  }, []);

  useEffect(() => {
    setHasChanges(policyContent !== originalContent);
  }, [policyContent, originalContent]);

  const loadPolicy = async () => {
    try {
      setIsLoading(true);

      // Mock policy data
      const mockPolicy = {
        content: `## 클럽 정책 및 규정

### 1. 회원 자격 및 가입
- 피클볼에 대한 열정이 있는 모든 분들을 환영합니다.
- 가입 신청 후 관리진의 승인을 받아야 합니다.
- 만 18세 이상이어야 하며, 미성년자는 보호자 동의가 필요합니다.

### 2. 회비 및 결제
- 월회비: 30,000원 (매월 25일까지 납부)
- 가입비: 20,000원 (최초 1회)
- 미납 시 3개월 후 자동 제명됩니다.

### 3. 활동 규칙
- 정기 모임: 매주 토요일 오후 2시
- 코트 예약은 선착순으로 진행됩니다.
- 불참 시 최소 2시간 전에 미리 연락해주세요.

### 4. 매너 및 에티켓
- 상호 존중과 배려를 기본으로 합니다.
- 부적절한 언행이나 비매너 행위 시 경고 후 제명될 수 있습니다.
- 코트와 장비를 깨끗하게 사용해주세요.

### 5. 안전 수칙
- 부상 예방을 위해 충분한 준비운동을 해주세요.
- 안전 장비 착용을 권장합니다.
- 응급상황 발생 시 즉시 관리진에게 연락해주세요.

### 6. 기타
- 정책은 클럽 운영진의 결정에 따라 변경될 수 있습니다.
- 문의사항은 클럽 채팅방이나 관리진에게 직접 연락해주세요.

마지막 업데이트: 2025년 1월 18일`,
        lastUpdatedAt: new Date(),
        lastUpdatedBy: '김관리자',
        version: 1,
      };

      setPolicyContent(mockPolicy.content);
      setOriginalContent(mockPolicy.content);
    } catch (error) {
      console.error('Error loading policy:', error);
      Alert.alert(t('policyEdit.loadFailed'), t('policyEdit.loadFailedMessage'), [
        { text: t('common.ok') },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!hasChanges) {
      navigation.goBack();
      return;
    }

    if (!policyContent.trim()) {
      Alert.alert(t('policyEdit.inputError'), t('policyEdit.emptyContentError'));
      return;
    }

    try {
      setIsSaving(true);

      // In a real app, this would save to the backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay

      Alert.alert(t('policyEdit.saveSuccess'), t('policyEdit.saveSuccessMessage'), [
        {
          text: t('common.ok'),
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error saving policy:', error);
      Alert.alert(t('policyEdit.saveFailed'), t('policyEdit.saveFailedMessage'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(t('policyEdit.saveChanges'), t('policyEdit.unsavedChangesMessage'), [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('policyEdit.dontSave'),
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
        {
          text: t('policyEdit.save'),
          onPress: handleSave,
        },
      ]);
    } else {
      navigation.goBack();
    }
  };

  const insertTemplate = (template: string) => {
    const templates = {
      section: '\n\n### 새 섹션\n내용을 입력하세요...\n',
      rule: '\n- 새 규칙\n',
      notice: '\n> **중요:** 공지사항을 입력하세요.\n',
    };

    setPolicyContent(prev => prev + templates[template as keyof typeof templates]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={styles.loadingText}>{t('policyEdit.loadingPolicy')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Surface style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name='chevron-back' size={24} color='#333' />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('policyEdit.title')}</Text>
          <Text style={styles.headerSubtitle}>{clubName}</Text>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size='small' color={theme.colors.primary} />
          ) : (
            <Text style={[styles.saveButtonText, !hasChanges && styles.saveButtonTextDisabled]}>
              {t('policyEdit.save')}
            </Text>
          )}
        </TouchableOpacity>
      </Surface>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Quick Insert Tools */}
        <Card style={styles.toolsCard}>
          <Card.Content>
            <Text style={styles.toolsTitle}>{t('policyEdit.quickInsert')}</Text>
            <View style={styles.toolsRow}>
              <TouchableOpacity style={styles.toolButton} onPress={() => insertTemplate('section')}>
                <Ionicons name='list-outline' size={16} color={theme.colors.primary} />
                <Text style={styles.toolButtonText}>{t('policyEdit.section')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolButton} onPress={() => insertTemplate('rule')}>
                <Ionicons name='checkmark-outline' size={16} color={theme.colors.primary} />
                <Text style={styles.toolButtonText}>{t('policyEdit.rule')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolButton} onPress={() => insertTemplate('notice')}>
                <Ionicons name='warning-outline' size={16} color={theme.colors.primary} />
                <Text style={styles.toolButtonText}>{t('policyEdit.notice')}</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        {/* Content Editor */}
        <ScrollView style={styles.content}>
          <Card style={styles.editorCard}>
            <Card.Content>
              <Text style={styles.editorLabel}>
                {t('policyEdit.policyContent')}
                <Text style={styles.required}> *</Text>
              </Text>
              <TextInput
                style={styles.textEditor}
                value={policyContent}
                onChangeText={setPolicyContent}
                placeholder={t('policyEdit.placeholder')}
                placeholderTextColor='#999'
                multiline
                textAlignVertical='top'
              />
              <View style={styles.editorFooter}>
                <Text style={styles.characterCount}>
                  {policyContent.length.toLocaleString()} {t('policyEdit.characters')}
                </Text>
                {hasChanges && (
                  <View style={styles.changeIndicator}>
                    <Ionicons name='create-outline' size={16} color='#ff9800' />
                    <Text style={styles.changeText}>{t('policyEdit.modified')}</Text>
                  </View>
                )}
              </View>
            </Card.Content>
          </Card>

          {/* Preview Card */}
          <Card style={styles.previewCard}>
            <Card.Content>
              <Text style={styles.previewTitle}>{t('policyEdit.preview')}</Text>
              <Divider style={styles.previewDivider} />
              <ScrollView style={styles.previewContent} nestedScrollEnabled>
                <Text style={styles.previewText}>
                  {policyContent || t('policyEdit.previewEmpty')}
                </Text>
              </ScrollView>
            </Card.Content>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  saveButtonTextDisabled: {
    color: '#ccc',
  },
  keyboardContainer: {
    flex: 1,
  },
  toolsCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  toolsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  toolsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    gap: 6,
  },
  toolButtonText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  editorCard: {
    marginBottom: 16,
  },
  editorLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  required: {
    color: '#f44336',
  },
  textEditor: {
    fontSize: 14,
    lineHeight: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fafafa',
    minHeight: 300,
    maxHeight: 400,
    textAlignVertical: 'top',
  },
  editorFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: 12,
    color: '#ff9800',
    fontWeight: '500',
  },
  previewCard: {
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  previewDivider: {
    marginBottom: 12,
  },
  previewContent: {
    maxHeight: 200,
  },
  previewText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
});

export default PolicyEditScreen;
