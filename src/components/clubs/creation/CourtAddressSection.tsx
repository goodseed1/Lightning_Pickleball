import React from 'react';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import { HelperText } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../../hooks/useTheme';
import { getLightningPickleballTheme } from '../../../theme';
import { useLanguage } from '../../../contexts/LanguageContext';
import Section from '../../layout/Section';

interface LocationData {
  formatted_address?: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  placeId?: string;
}

interface ClubFormData {
  courtAddress?: LocationData;
}

interface CourtAddressSectionProps {
  formData: ClubFormData;
  clubId?: string;
}

type RootStackParamList = {
  LocationSearch: { returnScreen?: string; clubId?: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CourtAddressSection({ formData, clubId }: CourtAddressSectionProps) {
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningPickleballTheme(currentTheme);
  const colors = themeColors.colors;
  const { t } = useLanguage();
  const navigation = useNavigation<NavigationProp>();

  const styles = StyleSheet.create({
    fieldLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 8,
    },
    locationInput: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceVariant,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.outline,
      paddingHorizontal: 12,
      paddingVertical: 14,
      marginBottom: 8,
    },
    locationTextInput: {
      flex: 1,
      fontSize: 16,
      color: colors.onSurface,
      marginHorizontal: 12,
    },
    locationPlaceholder: {
      color: colors.onSurfaceVariant,
    },
  });

  const handleLocationSearch = () => {
    navigation.navigate('LocationSearch', {
      returnScreen: 'CreateClub',
      clubId: clubId,
    });
  };

  return (
    <Section
      title={t('createClub.court_address')}
      requiredBadge={t('common.required')}
      icon={<MaterialCommunityIcons name='map-marker' size={18} color={colors.error} />}
      tone='red'
    >
      <Text style={styles.fieldLabel}>{t('createClub.fields.address_label')}</Text>
      <TouchableOpacity style={styles.locationInput} onPress={handleLocationSearch}>
        <MaterialCommunityIcons
          name='map-marker-outline'
          size={20}
          color={colors.onSurfaceVariant}
        />
        <Text
          style={[
            styles.locationTextInput,
            !formData.courtAddress?.address && styles.locationPlaceholder,
          ]}
        >
          {formData.courtAddress?.address || t('createClub.fields.address_placeholder')}
        </Text>
        <MaterialCommunityIcons name='magnify' size={20} color={colors.onSurfaceVariant} />
      </TouchableOpacity>

      <HelperText
        type={!formData.courtAddress?.address ? 'error' : 'info'}
        visible={!formData.courtAddress?.address}
        theme={{ colors }}
      >
        {t('createClub.errors.address_required')}
      </HelperText>
    </Section>
  );
}
