import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { MapApp, MapAppSelectorProps } from '../../types/mapTypes';
import {
  getAvailableMapApps,
  checkAppAvailability,
  openInMapApp,
  savePreferredMapApp,
} from '../../services/mapService';

const MapAppSelector: React.FC<MapAppSelectorProps> = ({
  visible,
  onClose,
  location,
  onAppSelect,
}) => {
  const { t } = useLanguage();
  const [mapApps, setMapApps] = useState<MapApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [rememberChoice, setRememberChoice] = useState(false);

  useEffect(() => {
    if (visible) {
      loadAvailableApps();
    }
  }, [visible]);

  const loadAvailableApps = async () => {
    try {
      setLoading(true);
      const apps = getAvailableMapApps();

      // 각 앱의 설치 여부 확인
      const appsWithAvailability = await Promise.all(
        apps.map(async app => ({
          ...app,
          isAvailable: await checkAppAvailability(app),
        }))
      );

      setMapApps(appsWithAvailability);
    } catch (error) {
      console.error('Error loading map apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAppSelect = async (app: MapApp) => {
    try {
      if (!app.isAvailable) {
        // 앱이 설치되지 않은 경우 설치 안내
        Alert.alert(
          t('mapAppSelector.appNotInstalled'),
          t('mapAppSelector.appNotInstalledMessage', { appName: app.name }),
          [
            {
              text: t('common.cancel'),
              style: 'cancel',
            },
            {
              text: t('mapAppSelector.install'),
              onPress: () => {
                if (app.fallbackUrl) {
                  import('react-native').then(({ Linking }) => {
                    Linking.openURL(app.fallbackUrl);
                  });
                }
              },
            },
          ]
        );
        return;
      }

      // 선호 앱으로 저장할지 확인
      if (rememberChoice) {
        await savePreferredMapApp(app.id);
      }

      // 지도 앱에서 위치 열기
      await openInMapApp(app, location);

      // 선택 콜백 호출
      onAppSelect(app);

      // 모달 닫기
      onClose();
    } catch (error) {
      console.error('Error opening map app:', error);
      Alert.alert(t('common.error'), t('mapAppSelector.errorOpeningApp'));
    }
  };

  const renderAppItem = (app: MapApp) => (
    <TouchableOpacity
      key={app.id}
      style={[styles.appItem, !app.isAvailable && styles.appItemDisabled]}
      onPress={() => handleAppSelect(app)}
      disabled={loading}
    >
      <View style={styles.appIconContainer}>
        <Text style={styles.appIcon}>{app.icon}</Text>
        {!app.isAvailable && (
          <View style={styles.unavailableBadge}>
            <Ionicons name='download-outline' size={12} color='#666' />
          </View>
        )}
      </View>

      <View style={styles.appInfo}>
        <Text style={[styles.appName, !app.isAvailable && styles.appNameDisabled]}>{app.name}</Text>
        <Text style={styles.appStatus}>
          {app.isAvailable
            ? t('mapAppSelector.installed')
            : t('mapAppSelector.installationRequired')}
        </Text>
      </View>

      <Ionicons name='chevron-forward' size={20} color={app.isAvailable ? '#666' : '#ccc'} />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent={true} animationType='slide' onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('mapAppSelector.title')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name='close' size={24} color='#666' />
            </TouchableOpacity>
          </View>

          {/* Location Info */}
          <View style={styles.locationInfo}>
            <Ionicons name='location-outline' size={16} color='#666' />
            <Text style={styles.locationText} numberOfLines={2}>
              {location.address}
            </Text>
          </View>

          {/* Apps List */}
          <ScrollView style={styles.appsList} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size='large' color='#1976d2' />
                <Text style={styles.loadingText}>{t('mapAppSelector.checkingApps')}</Text>
              </View>
            ) : (
              mapApps.map(renderAppItem)
            )}
          </ScrollView>

          {/* Remember Choice Option */}
          <View style={styles.rememberChoiceContainer}>
            <View style={styles.rememberChoiceInfo}>
              <Text style={styles.rememberChoiceLabel}>{t('mapAppSelector.setAsDefault')}</Text>
              <Text style={styles.rememberChoiceDescription}>
                {t('mapAppSelector.autoOpenDescription')}
              </Text>
            </View>
            <Switch
              value={rememberChoice}
              onValueChange={setRememberChoice}
              trackColor={{ false: '#e0e0e0', true: '#1976d2' }}
              thumbColor={rememberChoice ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area padding
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  appsList: {
    maxHeight: 300,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  appItemDisabled: {
    opacity: 0.6,
  },
  appIconContainer: {
    position: 'relative',
    marginRight: 16,
  },
  appIcon: {
    fontSize: 32,
  },
  unavailableBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 2,
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  appNameDisabled: {
    color: '#999',
  },
  appStatus: {
    fontSize: 12,
    color: '#666',
  },
  rememberChoiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  rememberChoiceInfo: {
    flex: 1,
  },
  rememberChoiceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  rememberChoiceDescription: {
    fontSize: 12,
    color: '#666',
  },
});

export default MapAppSelector;
