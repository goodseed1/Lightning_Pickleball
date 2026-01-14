import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button, TextInput, Switch, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';

import { useLanguage } from '../../contexts/LanguageContext';
import clubService from '../../services/clubService';
import { uploadImage } from '../../services/StorageService';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'text' | 'qr';
  isActive: boolean;
  accountInfo?: string;
  qrCodeUrl?: string;
}

interface ClubPaymentMethods {
  zelle?: PaymentMethod;
  venmo?: PaymentMethod;
  kakaopay?: PaymentMethod;
}

const PaymentMethodsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useLanguage();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { clubId, clubName } = route.params as any;

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'zelle', title: 'Zelle' },
    { key: 'venmo', title: 'Venmo' },
    { key: 'kakaopay', title: 'Kakao Pay' },
  ]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<ClubPaymentMethods>({});

  const { width } = Dimensions.get('window');

  const loadPaymentMethods = async () => {
    try {
      setIsLoading(true);
      const methods = await clubService.getClubPaymentMethods(clubId);
      setPaymentMethods(methods || {});
    } catch (error) {
      console.error('Error loading payment methods:', error);
      Alert.alert(t('common.error'), t('paymentMethods.errors.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentMethods();
  }, [clubId]);

  const savePaymentMethods = async () => {
    try {
      setIsSaving(true);
      await clubService.updateClubPaymentMethods(clubId, paymentMethods);
      Alert.alert(t('paymentMethods.success.saved'), t('paymentMethods.success.savedMessage'));
    } catch (error) {
      console.error('Error saving payment methods:', error);
      Alert.alert(t('common.error'), t('paymentMethods.errors.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const updatePaymentMethod = (methodKey: string, updates: Partial<PaymentMethod>) => {
    setPaymentMethods(prev => ({
      ...prev,
      [methodKey]: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(prev as any)[methodKey],
        id: methodKey,
        name: methodKey,
        type: methodKey === 'zelle' ? 'text' : 'qr',
        isActive: false,
        ...updates,
      },
    }));
  };

  const pickImage = async (methodKey: string) => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('paymentMethods.errors.permissionRequired'),
          t('paymentMethods.errors.galleryPermission')
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;

        // Upload image to Firebase Storage
        const uploadedUrl = await uploadImage(imageUri, `payment-qr/${clubId}/${methodKey}`);

        updatePaymentMethod(methodKey, {
          qrCodeUrl: uploadedUrl,
        });

        Alert.alert(
          t('paymentMethods.success.uploaded'),
          t('paymentMethods.success.uploadedMessage')
        );
      }
    } catch (error) {
      console.error('Error picking/uploading image:', error);
      Alert.alert(t('common.error'), t('paymentMethods.errors.uploadFailed'));
    }
  };

  const renderZelleTab = () => {
    const method = paymentMethods.zelle || {
      id: 'zelle',
      name: 'Zelle',
      type: 'text',
      isActive: false,
    };

    return (
      <ScrollView style={styles.tabContent}>
        <Card style={styles.methodCard}>
          <Card.Content>
            <View style={styles.methodHeader}>
              <View style={styles.methodInfo}>
                <Ionicons name='card-outline' size={32} color='#1976d2' />
                <Text style={styles.methodTitle}>Zelle</Text>
              </View>
              <Switch
                value={method.isActive}
                onValueChange={value => updatePaymentMethod('zelle', { isActive: value })}
              />
            </View>

            <Text style={styles.fieldLabel}>{t('paymentMethods.zelle.fieldLabel')}</Text>
            <TextInput
              value={method.accountInfo || ''}
              onChangeText={text => updatePaymentMethod('zelle', { accountInfo: text })}
              placeholder={t('paymentMethods.zelle.placeholder')}
              mode='outlined'
              style={styles.textInput}
            />

            <Text style={styles.helperText}>{t('paymentMethods.zelle.helper')}</Text>
          </Card.Content>
        </Card>
      </ScrollView>
    );
  };

  const renderVenmoTab = () => {
    const method = paymentMethods.venmo || {
      id: 'venmo',
      name: 'Venmo',
      type: 'qr',
      isActive: false,
    };

    return (
      <ScrollView style={styles.tabContent}>
        <Card style={styles.methodCard}>
          <Card.Content>
            <View style={styles.methodHeader}>
              <View style={styles.methodInfo}>
                <Ionicons name='qr-code-outline' size={32} color='#3D95CE' />
                <Text style={styles.methodTitle}>Venmo</Text>
              </View>
              <Switch
                value={method.isActive}
                onValueChange={value => updatePaymentMethod('venmo', { isActive: value })}
              />
            </View>

            <Text style={styles.fieldLabel}>{t('paymentMethods.venmo.usernameLabel')}</Text>
            <TextInput
              value={method.accountInfo || ''}
              onChangeText={text => updatePaymentMethod('venmo', { accountInfo: text })}
              placeholder={t('paymentMethods.venmo.usernamePlaceholder')}
              mode='outlined'
              style={styles.textInput}
            />

            <Text style={styles.fieldLabel}>{t('paymentMethods.venmo.qrCodeLabel')}</Text>

            {method.qrCodeUrl ? (
              <View style={styles.qrContainer}>
                <Image source={{ uri: method.qrCodeUrl }} style={styles.qrImage} />
                <Button
                  mode='outlined'
                  onPress={() => pickImage('venmo')}
                  style={styles.changeQrButton}
                >
                  {t('paymentMethods.venmo.changeQrCode')}
                </Button>
              </View>
            ) : (
              <Button
                mode='outlined'
                icon='camera'
                onPress={() => pickImage('venmo')}
                style={styles.uploadButton}
              >
                {t('paymentMethods.venmo.uploadQrCode')}
              </Button>
            )}

            <Text style={styles.helperText}>{t('paymentMethods.venmo.helper')}</Text>
          </Card.Content>
        </Card>
      </ScrollView>
    );
  };

  const renderKakaoPayTab = () => {
    const method = paymentMethods.kakaopay || {
      id: 'kakaopay',
      name: 'Kakao Pay',
      type: 'qr',
      isActive: false,
    };

    return (
      <ScrollView style={styles.tabContent}>
        <Card style={styles.methodCard}>
          <Card.Content>
            <View style={styles.methodHeader}>
              <View style={styles.methodInfo}>
                <Ionicons name='qr-code-outline' size={32} color='#FEE500' />
                <Text style={styles.methodTitle}>Kakao Pay</Text>
              </View>
              <Switch
                value={method.isActive}
                onValueChange={value => updatePaymentMethod('kakaopay', { isActive: value })}
              />
            </View>

            <Text style={styles.fieldLabel}>{t('paymentMethods.kakaopay.accountLabel')}</Text>
            <TextInput
              value={method.accountInfo || ''}
              onChangeText={text => updatePaymentMethod('kakaopay', { accountInfo: text })}
              placeholder={t('paymentMethods.kakaopay.accountPlaceholder')}
              mode='outlined'
              style={styles.textInput}
            />

            <Text style={styles.fieldLabel}>{t('paymentMethods.kakaopay.qrCodeLabel')}</Text>

            {method.qrCodeUrl ? (
              <View style={styles.qrContainer}>
                <Image source={{ uri: method.qrCodeUrl }} style={styles.qrImage} />
                <Button
                  mode='outlined'
                  onPress={() => pickImage('kakaopay')}
                  style={styles.changeQrButton}
                >
                  {t('paymentMethods.kakaopay.changeQrCode')}
                </Button>
              </View>
            ) : (
              <Button
                mode='outlined'
                icon='camera'
                onPress={() => pickImage('kakaopay')}
                style={styles.uploadButton}
              >
                {t('paymentMethods.kakaopay.uploadQrCode')}
              </Button>
            )}

            <Text style={styles.helperText}>{t('paymentMethods.kakaopay.helper')}</Text>
          </Card.Content>
        </Card>
      </ScrollView>
    );
  };

  const renderScene = SceneMap({
    zelle: renderZelleTab,
    venmo: renderVenmoTab,
    kakaopay: renderKakaoPayTab,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={styles.tabIndicator}
      style={styles.tabBar}
      labelStyle={styles.tabLabel}
      activeColor='#1976d2'
      inactiveColor='#666'
    />
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#1976d2' />
          <Text style={styles.loadingText}>{t('paymentMethods.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Surface style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name='chevron-back' size={24} color='#333' />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('paymentMethods.title')}</Text>
          <Text style={styles.headerSubtitle}>{clubName}</Text>
        </View>

        <Button
          mode='contained'
          onPress={savePaymentMethods}
          loading={isSaving}
          disabled={isSaving}
          compact
          style={styles.saveButton}
        >
          {t('paymentMethods.save')}
        </Button>
      </Surface>

      {/* Tab View */}
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width }}
        renderTabBar={renderTabBar}
      />
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
    marginTop: 16,
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
    fontSize: 14,
    color: '#666',
  },
  saveButton: {
    borderRadius: 8,
  },
  tabBar: {
    backgroundColor: '#fff',
  },
  tabIndicator: {
    backgroundColor: '#1976d2',
  },
  tabLabel: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  methodCard: {
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  qrImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  changeQrButton: {
    borderRadius: 8,
  },
  uploadButton: {
    marginVertical: 16,
    borderRadius: 8,
  },
});

export default PaymentMethodsScreen;
