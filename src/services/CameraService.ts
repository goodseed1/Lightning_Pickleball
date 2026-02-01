import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import i18n from '../i18n';

export interface CameraOptions {
  mediaTypes: 'images' | 'videos' | 'all';
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  allowsMultipleSelection?: boolean;
  selectionLimit?: number;
}

export interface ImageResult {
  uri: string;
  width: number;
  height: number;
  type: 'image' | 'video';
  fileSize?: number;
  fileName?: string;
  base64?: string;
}

class CameraService {
  private static instance: CameraService;

  public static getInstance(): CameraService {
    if (!CameraService.instance) {
      CameraService.instance = new CameraService();
    }
    return CameraService.instance;
  }

  /**
   * 카메라 권한 요청
   */
  async requestCameraPermission(): Promise<boolean> {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();

      if (cameraPermission.status !== 'granted') {
        Alert.alert(
          i18n.t('services.camera.permissionTitle'),
          i18n.t('services.camera.permissionMessage'),
          [{ text: i18n.t('common.ok'), style: 'default' }]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  }

  /**
   * 갤러리 권한 요청
   */
  async requestMediaLibraryPermission(): Promise<boolean> {
    try {
      // Check current permission status first
      const currentPermission = await ImagePicker.getMediaLibraryPermissionsAsync();

      if (currentPermission.status === 'granted') {
        return true;
      }

      // Request permission if not granted
      const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (mediaPermission.status !== 'granted') {
        // Handle limited access on iOS 14+
        if (mediaPermission.status === 'denied' && Platform.OS === 'ios') {
          Alert.alert(
            i18n.t('services.camera.galleryPermissionTitle'),
            i18n.t('services.camera.galleryPermissionIosMessage'),
            [
              { text: i18n.t('common.ok'), style: 'default' },
              {
                text: i18n.t('services.camera.openSettings'),
                style: 'default',
                onPress: () => {
                  // Linking.openSettings(); // Uncomment if needed
                },
              },
            ]
          );
        } else {
          Alert.alert(
            i18n.t('services.camera.galleryPermissionTitle'),
            i18n.t('services.camera.galleryPermissionMessage'),
            [{ text: i18n.t('common.ok'), style: 'default' }]
          );
        }
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting media library permission:', error);
      Alert.alert(i18n.t('common.error'), i18n.t('services.camera.permissionError'));
      return false;
    }
  }

  /**
   * 사진 저장 권한 요청
   * Note: expo-media-library는 dev client 빌드 필요
   */
  async requestMediaSavePermission(): Promise<boolean> {
    // Simplified: MediaLibrary requires native build
    console.warn('requestMediaSavePermission: expo-media-library requires native build');
    return false;
  }

  /**
   * 카메라로 사진 촬영
   */
  async takePhoto(options: CameraOptions = { mediaTypes: 'images' }): Promise<ImageResult | null> {
    try {
      const hasPermission = await this.requestCameraPermission();
      if (!hasPermission) return null;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes:
          options.mediaTypes === 'images'
            ? ImagePicker.MediaTypeOptions.Images
            : options.mediaTypes === 'videos'
              ? ImagePicker.MediaTypeOptions.Videos
              : ImagePicker.MediaTypeOptions.All,
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect ?? [1, 1],
        quality: options.quality ?? 0.8,
        base64: false, // 파일 크기를 줄이기 위해 base64는 비활성화
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];

      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: asset.type === 'video' ? 'video' : 'image',
        fileSize: asset.fileSize,
        fileName: asset.fileName || `photo_${Date.now()}.jpg`,
      };
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert(i18n.t('common.error'), i18n.t('services.camera.photoError'));
      return null;
    }
  }

  /**
   * 갤러리에서 사진 선택
   */
  async pickFromGallery(options: CameraOptions = { mediaTypes: 'images' }): Promise<ImageResult[]> {
    try {
      const hasPermission = await this.requestMediaLibraryPermission();
      if (!hasPermission) return [];

      // Enhanced configuration for better compatibility
      const pickerOptions = {
        mediaTypes:
          options.mediaTypes === 'images'
            ? ImagePicker.MediaTypeOptions.Images
            : options.mediaTypes === 'videos'
              ? ImagePicker.MediaTypeOptions.Videos
              : ImagePicker.MediaTypeOptions.All,
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect ?? [1, 1],
        quality: options.quality ?? 0.8,
        allowsMultipleSelection: options.allowsMultipleSelection ?? false,
        selectionLimit: options.selectionLimit ?? 1,
        base64: false,
        // Optimize for iOS simulator
        ...(Platform.OS === 'ios' && {
          exif: false, // Reduce metadata processing
          orderedSelection: true,
        }),
      };

      console.log('Launching image picker with options:', pickerOptions);

      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (result.canceled || !result.assets) {
        console.log('Image picker canceled or no assets');
        return [];
      }

      console.log('Image picker result:', result.assets.length, 'assets selected');

      return result.assets.map((asset, index) => {
        // Enhanced URI handling for macOS/iOS simulator
        const processedUri = asset.uri;

        // Handle macOS Photos Library paths
        if (processedUri.includes('Photos Library.photoslibrary')) {
          console.warn(
            'Detected Photos Library path, this may cause issues on simulator:',
            processedUri
          );
          // For development on simulator, copy to app's document directory
          // This would require expo-file-system for actual file copying
        }

        return {
          uri: processedUri,
          width: asset.width,
          height: asset.height,
          type: asset.type === 'video' ? 'video' : 'image',
          fileSize: asset.fileSize,
          fileName: asset.fileName || `image_${Date.now()}_${index}.jpg`,
        };
      });
    } catch (error) {
      console.error('Error picking from gallery:', error);

      // Enhanced error handling for specific cases
      if ((error as Error).message?.includes('Photos Library')) {
        Alert.alert(
          i18n.t('services.camera.galleryAccessError'),
          i18n.t('services.camera.simulatorError'),
          [{ text: i18n.t('common.ok'), style: 'default' }]
        );
      } else {
        Alert.alert(i18n.t('common.error'), i18n.t('services.camera.galleryPickError'));
      }

      return [];
    }
  }

  /**
   * 사진 선택 옵션 표시 (카메라 vs 갤러리)
   */
  async showImagePicker(
    options: CameraOptions = { mediaTypes: 'images' }
  ): Promise<ImageResult | null> {
    return new Promise(resolve => {
      Alert.alert(
        i18n.t('services.camera.selectPhoto'),
        i18n.t('services.camera.selectPhotoMessage'),
        [
          { text: i18n.t('common.cancel'), style: 'cancel', onPress: () => resolve(null) },
          {
            text: i18n.t('services.camera.camera'),
            onPress: async () => {
              const result = await this.takePhoto(options);
              resolve(result);
            },
          },
          {
            text: i18n.t('services.camera.gallery'),
            onPress: async () => {
              const results = await this.pickFromGallery(options);
              resolve(results.length > 0 ? results[0] : null);
            },
          },
        ]
      );
    });
  }

  /**
   * 여러 사진 선택
   */
  async pickMultipleImages(selectionLimit: number = 5): Promise<ImageResult[]> {
    try {
      const hasPermission = await this.requestMediaLibraryPermission();
      if (!hasPermission) return [];

      return await this.pickFromGallery({
        mediaTypes: 'images',
        allowsEditing: false,
        allowsMultipleSelection: true,
        selectionLimit,
        quality: 0.8,
      });
    } catch (error) {
      console.error('Error picking multiple images:', error);
      return [];
    }
  }

  /**
   * 이미지 리사이즈
   */
  async resizeImage(
    uri: string,
    width: number,
    height: number,
    quality: number = 0.8
  ): Promise<string | null> {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [width, height],
        quality,
      });

      return result.canceled ? null : result.assets?.[0]?.uri || null;
    } catch (error) {
      console.error('Error resizing image:', error);
      return null;
    }
  }

  /**
   * 이미지를 갤러리에 저장
   * Note: expo-media-library는 dev client 빌드 필요
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async saveToGallery(uri: string): Promise<boolean> {
    // Simplified: MediaLibrary requires native build
    console.warn('saveToGallery: expo-media-library requires native build');
    Alert.alert(i18n.t('services.camera.notice'), i18n.t('services.camera.gallerySaveNotice'));
    return false;
  }

  /**
   * 이미지 파일 정보 가져오기
   * Note: expo-file-system은 dev client 빌드 필요
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getImageInfo(uri: string): Promise<{
    width: number;
    height: number;
    size: number;
  } | null> {
    // Simplified: FileSystem requires native build
    console.warn('getImageInfo: expo-file-system requires native build');
    return null;
  }

  /**
   * 임시 파일 정리
   * Note: expo-file-system은 dev client 빌드 필요
   */
  async cleanupTempFiles(): Promise<void> {
    // Simplified: FileSystem requires native build
    console.warn('cleanupTempFiles: expo-file-system requires native build');
  }

  /**
   * 이미지 압축
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async compressImage(uri: string, quality: number = 0.7): Promise<string | null> {
    try {
      // expo-image-manipulator를 사용한 압축
      // 실제 구현에서는 해당 라이브러리 설치 필요
      return uri; // 임시로 원본 URI 반환
    } catch (error) {
      console.error('Error compressing image:', error);
      return null;
    }
  }

  /**
   * 프로필 사진용 이미지 선택 (정사각형, 압축)
   */
  async pickProfileImage(): Promise<ImageResult | null> {
    try {
      const result = await this.showImagePicker({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result && result.fileSize && result.fileSize > 5 * 1024 * 1024) {
        Alert.alert(
          i18n.t('services.camera.fileSizeError'),
          i18n.t('services.camera.fileSizeMessage')
        );
        return null;
      }

      return result;
    } catch (error) {
      console.error('Error picking profile image:', error);
      return null;
    }
  }

  /**
   * 매치 인증샷용 이미지 선택
   */
  async pickMatchPhoto(): Promise<ImageResult | null> {
    try {
      return await this.showImagePicker({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.9,
      });
    } catch (error) {
      console.error('Error picking match photo:', error);
      return null;
    }
  }
}

export default CameraService.getInstance();
