/**
 * ServiceFormModal - 테니스 서비스 생성/수정 모달
 * 줄 교체, 라켓 수리, 중고 거래 등 서비스 등록
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { TextInput, Button, Text, IconButton, ActivityIndicator, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { getLightningTennisTheme } from '../../theme';
import { getCurrencyByCountry } from '../../utils/currencyUtils';
import {
  TennisService,
  CreateServiceRequest,
  ServiceLocation,
  ServiceCategory,
} from '../../types/tennisService';
import tennisServiceService from '../../services/tennisServiceService';

const MAX_IMAGES = 5;

interface ServiceFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editService?: TennisService;
}

const ServiceFormModal: React.FC<ServiceFormModalProps> = ({
  visible,
  onClose,
  onSuccess,
  editService,
}) => {
  const { theme: currentTheme } = useTheme();
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const themeColors = getLightningTennisTheme(currentTheme);
  const colors = themeColors.colors as unknown as Record<string, string>;

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ServiceCategory | undefined>(undefined);
  const [price, setPrice] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [newImageUris, setNewImageUris] = useState<string[]>([]); // 새로 추가된 로컬 이미지

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const isEditMode = !!editService;

  // 🌍 사용자 국가에 따른 통화 설정 (동적 화폐 코드 사용)
  const userCountry = currentUser?.profile?.location?.country;
  const currency = getCurrencyByCountry(userCountry);
  const currencySymbol = currency.symbol;
  // 💰 동적 라벨: "Price (RUB)", "価格 (JPY)" 등
  const currencyLabel = `${t('serviceForm.price')} (${currency.code})`;

  // 카테고리 옵션
  const categoryOptions: { value: ServiceCategory; labelKey: string }[] = [
    { value: 'stringing', labelKey: 'serviceForm.categoryStringing' },
    { value: 'repair', labelKey: 'serviceForm.categoryRepair' },
    { value: 'used_racket', labelKey: 'serviceForm.categoryUsedRacket' },
    { value: 'used_equipment', labelKey: 'serviceForm.categoryUsedEquipment' },
    { value: 'other', labelKey: 'serviceForm.categoryOther' },
  ];

  // 수정 모드일 때 기존 값 로드
  useEffect(() => {
    if (editService) {
      setTitle(editService.title);
      setDescription(editService.description || '');
      setCategory(editService.category);
      setPrice(editService.price?.toString() || '');
      setImages(editService.images || []);
      setNewImageUris([]);
    } else {
      // 새 게시글: 기본값 초기화
      setTitle('');
      setDescription('');
      setCategory(undefined);
      setPrice('');
      setImages([]);
      setNewImageUris([]);
    }
  }, [editService, visible]);

  // 이미지 선택
  const handlePickImages = async () => {
    const totalImages = images.length + newImageUris.length;
    if (totalImages >= MAX_IMAGES) {
      Alert.alert(
        t('serviceForm.imageLimitTitle'),
        t('serviceForm.imageLimitMessage', { max: MAX_IMAGES })
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: MAX_IMAGES - totalImages,
    });

    if (!result.canceled && result.assets) {
      const newUris = result.assets.map(asset => asset.uri);
      setNewImageUris(prev => [...prev, ...newUris].slice(0, MAX_IMAGES - images.length));
    }
  };

  // 이미지 삭제 (기존 이미지)
  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // 이미지 삭제 (새 이미지)
  const handleRemoveNewImage = (index: number) => {
    setNewImageUris(prev => prev.filter((_, i) => i !== index));
  };

  // 유효성 검사 (제목만 필수)
  const validateForm = (): boolean => {
    if (!title.trim()) return false;
    return true;
  };

  // 제출
  const handleSubmit = async () => {
    if (!validateForm() || !currentUser) return;

    // 🎯 [KIM FIX v2] 위치 정보 필수 체크 - 거리 필터링을 위해 좌표 필수
    const hasValidCoordinates = currentUser.profile?.location?.latitude;
    if (!hasValidCoordinates) {
      Alert.alert(t('serviceForm.locationRequiredTitle'), t('serviceForm.locationRequiredMessage'));
      return;
    }

    setIsSubmitting(true);
    try {
      // 새 이미지 업로드
      let uploadedImageUrls = [...images];
      if (newImageUris.length > 0) {
        setUploadingImages(true);
        const uploadPromises = newImageUris.map(uri =>
          tennisServiceService.uploadImage(uri, currentUser.uid)
        );
        const newUrls = await Promise.all(uploadPromises);
        uploadedImageUrls = [...uploadedImageUrls, ...newUrls];
        setUploadingImages(false);
      }

      // 사용자 위치 정보 가져오기
      const userLocation = currentUser.profile?.location;
      let coordinates: ServiceLocation | undefined;

      if (userLocation?.coordinates) {
        coordinates = {
          latitude: userLocation.coordinates.latitude,
          longitude: userLocation.coordinates.longitude,
          city: userLocation.city,
          country: userLocation.country,
        };
      }

      const request: CreateServiceRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        category: category || undefined,
        images: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
        price: price ? Number(price) : undefined,
        coordinates,
      };

      if (isEditMode && editService) {
        // 수정
        await tennisServiceService.updateService(editService.id, {
          title: request.title,
          description: request.description,
          category: request.category,
          images: request.images,
          price: request.price,
        });
      } else {
        // 생성
        const displayName =
          currentUser.profile?.displayName || currentUser.displayName || 'Unknown';
        const photoURL = currentUser.photoURL || undefined;

        // 🎯 [KIM FIX] Author 좌표 추출 - 거리 기반 필터링을 위해 필요
        const authorCoordinates = currentUser.profile?.location?.latitude
          ? {
              latitude: currentUser.profile.location.latitude,
              longitude: currentUser.profile.location.longitude,
            }
          : undefined;

        await tennisServiceService.createService(
          request,
          currentUser.uid,
          displayName,
          photoURL,
          authorCoordinates
        );
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('❌ [ServiceFormModal] Error:', error);

      // 🛡️ 게시 제한 에러 처리
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.startsWith('DAILY_LIMIT_EXCEEDED')) {
        const limit = errorMessage.split(':')[1];
        Alert.alert(
          t('serviceForm.dailyLimitTitle'),
          t('serviceForm.dailyLimitMessage', { limit })
        );
      } else if (errorMessage.startsWith('MAX_POSTS_EXCEEDED')) {
        const limit = errorMessage.split(':')[1];
        Alert.alert(t('serviceForm.maxPostsTitle'), t('serviceForm.maxPostsMessage', { limit }));
      } else {
        Alert.alert(t('common.error'), t('serviceForm.saveError'));
      }
    } finally {
      setIsSubmitting(false);
      setUploadingImages(false);
    }
  };

  return (
    <Modal visible={visible} animationType='slide' transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          {/* 헤더 */}
          <View style={[styles.header, { borderBottomColor: colors.outline }]}>
            <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
              {isEditMode ? t('serviceForm.editPost') : t('serviceForm.newPost')}
            </Text>
            <IconButton
              icon='close'
              size={24}
              iconColor={colors.onSurfaceVariant}
              onPress={onClose}
            />
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {/* 제목 */}
            <TextInput
              label={t('serviceForm.title')}
              value={title}
              onChangeText={setTitle}
              mode='outlined'
              style={styles.input}
              maxLength={100}
              right={<TextInput.Affix text={`${title.length}/100`} />}
            />

            {/* 카테고리 */}
            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
              {t('serviceForm.category')}
            </Text>
            <View style={styles.categoryRow}>
              {categoryOptions.map(option => (
                <Chip
                  key={option.value}
                  selected={category === option.value}
                  onPress={() => setCategory(category === option.value ? undefined : option.value)}
                  style={[
                    styles.categoryChip,
                    category === option.value && { backgroundColor: colors.primaryContainer },
                  ]}
                  textStyle={{ fontSize: 12 }}
                >
                  {t(option.labelKey)}
                </Chip>
              ))}
            </View>

            {/* 설명 */}
            <TextInput
              label={t('serviceForm.description')}
              value={description}
              onChangeText={setDescription}
              mode='outlined'
              style={styles.input}
              multiline
              numberOfLines={4}
              maxLength={1000}
            />

            {/* 이미지 업로드 */}
            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
              {t('serviceForm.photos', { max: MAX_IMAGES })}
            </Text>
            <View style={styles.imageSection}>
              {/* 기존 이미지 */}
              {images.map((uri, index) => (
                <View key={`existing-${index}`} style={styles.imageContainer}>
                  <Image source={{ uri }} style={styles.thumbnail} />
                  <TouchableOpacity
                    style={[styles.removeButton, { backgroundColor: colors.error }]}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <Ionicons name='close' size={14} color='white' />
                  </TouchableOpacity>
                </View>
              ))}
              {/* 새 이미지 */}
              {newImageUris.map((uri, index) => (
                <View key={`new-${index}`} style={styles.imageContainer}>
                  <Image source={{ uri }} style={styles.thumbnail} />
                  <TouchableOpacity
                    style={[styles.removeButton, { backgroundColor: colors.error }]}
                    onPress={() => handleRemoveNewImage(index)}
                  >
                    <Ionicons name='close' size={14} color='white' />
                  </TouchableOpacity>
                </View>
              ))}
              {/* 추가 버튼 */}
              {images.length + newImageUris.length < MAX_IMAGES && (
                <TouchableOpacity
                  style={[styles.addImageButton, { borderColor: colors.outline }]}
                  onPress={handlePickImages}
                >
                  <Ionicons name='camera-outline' size={24} color={colors.onSurfaceVariant} />
                  <Text style={[styles.addImageText, { color: colors.onSurfaceVariant }]}>
                    {t('serviceForm.addPhoto')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 가격 */}
            <TextInput
              label={currencyLabel}
              value={price}
              onChangeText={setPrice}
              mode='outlined'
              style={styles.input}
              keyboardType='numeric'
              left={<TextInput.Affix text={currencySymbol} />}
            />

            <View style={styles.bottomPadding} />
          </ScrollView>

          {/* 제출 버튼 */}
          <View style={[styles.footer, { borderTopColor: colors.outline }]}>
            <Button
              mode='contained'
              onPress={handleSubmit}
              disabled={!validateForm() || isSubmitting}
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
            >
              {isSubmitting ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={colors.onPrimary} size='small' />
                  <Text style={[styles.loadingText, { color: colors.onPrimary }]}>
                    {uploadingImages ? t('serviceForm.uploadingImages') : t('serviceForm.saving')}
                  </Text>
                </View>
              ) : isEditMode ? (
                t('serviceForm.update')
              ) : (
                t('serviceForm.submit')
              )}
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  form: {
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    marginBottom: 4,
  },
  imageSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    fontSize: 10,
    marginTop: 4,
  },
  bottomPadding: {
    height: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  submitButton: {
    borderRadius: 8,
  },
  submitButtonContent: {
    height: 48,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
  },
});

export default ServiceFormModal;
