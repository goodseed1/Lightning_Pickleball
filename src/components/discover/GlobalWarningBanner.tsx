import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface GlobalWarningBannerProps {
  onRequestLocation: () => void;
}

export const GlobalWarningBanner: React.FC<GlobalWarningBannerProps> = ({ onRequestLocation }) => {
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { backgroundColor: '#FFF3E0' }]}>
      <View style={styles.content}>
        <Ionicons name='warning-outline' size={24} color='#F57C00' />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{t('location.globalWarning.title')}</Text>
          <Text style={styles.description}>{t('location.globalWarning.description')}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#F57C00' }]}
        onPress={onRequestLocation}
      >
        <Text style={styles.buttonText}>{t('location.globalWarning.setupButton')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#F57C00',
    lineHeight: 18,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default GlobalWarningBanner;
