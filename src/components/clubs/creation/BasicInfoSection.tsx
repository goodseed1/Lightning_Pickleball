import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text, Alert, TouchableOpacity, Image } from 'react-native';
import { TextInput, ActivityIndicator, HelperText } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../../hooks/useTheme';
import { getLightningTennisTheme } from '../../../theme';
import { useLanguage } from '../../../contexts/LanguageContext';
import imageUploadService from '../../../services/imageUploadService';
import CameraService from '../../../services/CameraService';
import clubService from '../../../services/clubService';
import { ClubFormData, FormChangeHandler } from './types';

interface BasicInfoSectionProps {
  formData: ClubFormData;
  onFormChange: FormChangeHandler<ClubFormData>;
  clubId?: string;
  validation?: {
    name: { isValid: boolean; message: string };
    description: { isValid: boolean; message: string };
  };
}

export default function BasicInfoSection({
  formData,
  onFormChange,
  clubId,
  validation,
}: BasicInfoSectionProps) {
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningTennisTheme(currentTheme);
  const colors = themeColors.colors;
  const { t } = useLanguage();

  const [isUploading, setIsUploading] = useState(false);

  // 🎯 [KIM FIX] Profile-like styles without card wrapper
  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: 4,
    },
    // 📸 Profile Photo Section (like EditProfileScreen)
    profilePhotoSection: {
      alignItems: 'center',
      marginBottom: 24,
      marginTop: 8,
    },
    profilePhotoContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 2,
      borderColor: colors.outline,
      overflow: 'hidden',
      position: 'relative',
    },
    profilePhoto: {
      width: '100%',
      height: '100%',
    },
    profilePhotoPlaceholder: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surfaceVariant,
    },
    cameraIconOverlay: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#FFFFFF',
      backgroundColor: colors.primary,
    },
    photoHintText: {
      fontSize: 13,
      marginTop: 8,
      fontStyle: 'italic',
      color: colors.onSurfaceVariant,
    },
    fieldContainer: {
      marginBottom: 16,
    },
    fieldLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.surface,
    },
  });

  const pickClubLogo = useCallback(async () => {
    console.log('📸 [BasicInfoSection] pickClubLogo started - using CameraService');
    try {
      // Use CameraService.showImagePicker() for camera/gallery selection
      // Same approach as EditProfileScreen for consistency
      const result = await CameraService.showImagePicker({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('📸 [BasicInfoSection] CameraService result:', result);

      if (!result || !result.uri) {
        console.log('📸 [BasicInfoSection] No image selected');
        return;
      }

      const uri = result.uri;
      console.log('📸 [BasicInfoSection] Selected image URI:', uri);

      // Show local image immediately for better UX
      console.log('📸 [BasicInfoSection] Setting local URI for preview...');
      onFormChange('logoUri', uri);

      // Upload to Firebase Storage in background
      try {
        setIsUploading(true);
        console.log('📤 [BasicInfoSection] Starting Firebase Storage upload...');

        // Generate unique club ID for new clubs or use existing ID for edits
        const tempClubId = clubId || `temp_${Date.now()}`;
        console.log('📤 [BasicInfoSection] Using clubId:', tempClubId);

        const downloadURL = await imageUploadService.uploadClubLogo(uri, tempClubId);
        console.log('✅ [BasicInfoSection] Upload successful! Download URL:', downloadURL);

        // Update form data with Firebase URL
        onFormChange('logoUri', downloadURL);

        // 🎯 [KIM FIX] Immediately save to Firestore in edit mode (like EditProfileScreen)
        // This ensures the logo is saved even if user navigates back before auto-save
        if (clubId) {
          console.log('💾 [BasicInfoSection] Saving logo to Firestore immediately...');
          await clubService.updateClub(clubId, { logoUri: downloadURL });
          console.log('✅ [BasicInfoSection] Logo saved to Firestore!');
        }

        console.log('✅ [BasicInfoSection] Form updated with Firebase URL');
      } catch (uploadError) {
        console.error('❌ [BasicInfoSection] Logo upload failed:', uploadError);
        Alert.alert(t('createClub.uploadError'), t('createClub.uploadErrorMessage'), [
          { text: t('common.ok') },
        ]);
        // Keep the local preview even if upload fails
      } finally {
        setIsUploading(false);
      }
    } catch (e) {
      console.error('📸 [BasicInfoSection] Image picker error:', e);
      setIsUploading(false);
    }
  }, [onFormChange, clubId]);

  // 🎯 [KIM FIX] Profile-like layout without card wrapper
  return (
    <View style={styles.container}>
      {/* 📸 Club Logo Section (like profile photo in EditProfileScreen) */}
      <View style={styles.profilePhotoSection}>
        <TouchableOpacity
          style={styles.profilePhotoContainer}
          onPress={pickClubLogo}
          disabled={isUploading}
        >
          {isUploading ? (
            <View style={styles.profilePhotoPlaceholder}>
              <ActivityIndicator size='large' color={colors.primary} />
            </View>
          ) : formData.logoUri ? (
            <Image source={{ uri: formData.logoUri }} style={styles.profilePhoto} />
          ) : (
            <View style={styles.profilePhotoPlaceholder}>
              <Ionicons name='camera' size={40} color={colors.onSurfaceVariant} />
            </View>
          )}
          {/* Camera Icon Overlay */}
          <View style={styles.cameraIconOverlay}>
            <Ionicons name='camera' size={16} color='#FFFFFF' />
          </View>
        </TouchableOpacity>
        <Text style={styles.photoHintText}>{t('createClub.tapToChangeLogo')}</Text>
      </View>

      {/* Club Name Field */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{t('createClub.fields.name')} *</Text>
        <TextInput
          dense
          mode='outlined'
          value={formData.name}
          onChangeText={text => onFormChange('name', text)}
          placeholder={t('createClub.fields.name_placeholder')}
          maxLength={30}
          style={styles.input}
          theme={{ colors }}
          error={validation?.name && !validation.name.isValid}
        />
        {validation?.name && validation.name.message && (
          <HelperText
            type={validation.name.isValid ? 'info' : 'error'}
            visible={true}
            style={{
              color: validation.name.isValid ? colors.primary : colors.error,
              fontSize: 12,
              marginTop: 4,
            }}
          >
            {validation.name.message}
          </HelperText>
        )}
      </View>

      {/* Club Description Field */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{t('createClub.fields.intro')}</Text>
        <TextInput
          dense
          mode='outlined'
          value={formData.description}
          onChangeText={text => onFormChange('description', text)}
          multiline
          numberOfLines={3}
          placeholder={t('createClub.fields.intro_placeholder')}
          maxLength={200}
          style={styles.input}
          right={<TextInput.Affix text={`${formData.description.length}/200`} />}
          theme={{ colors }}
          error={validation?.description && !validation.description.isValid}
        />
        {validation?.description && validation.description.message && (
          <HelperText
            type={validation.description.isValid ? 'info' : 'error'}
            visible={true}
            style={{
              color: validation.description.isValid ? colors.primary : colors.error,
              fontSize: 12,
              marginTop: 4,
            }}
          >
            {validation.description.message}
          </HelperText>
        )}
      </View>
    </View>
  );
}
