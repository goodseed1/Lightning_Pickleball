import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '../../../hooks/useTheme';
import { getLightningPickleballTheme } from '../../../theme';
import { useLanguage } from '../../../contexts/LanguageContext';
import Section from '../../layout/Section';
import TwoColChips from '../../layout/TwoColChips';

interface ClubFormData {
  facilities: string[];
}

interface FacilitiesSectionProps {
  formData: ClubFormData;
  onFormChange: <K extends keyof ClubFormData>(key: K, value: ClubFormData[K]) => void;
}

export default function FacilitiesSection({ formData, onFormChange }: FacilitiesSectionProps) {
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningPickleballTheme(currentTheme);
  const colors = themeColors.colors;
  const { t } = useLanguage();

  // Safe array reference to handle initial/abnormal data
  const facilitiesSafe = Array.isArray(formData?.facilities) ? formData.facilities : [];

  const handleFacilitiesChange = (values: string[]) => {
    onFormChange('facilities', values);
  };

  return (
    <Section
      title={t('createClub.facilities')}
      icon={<MaterialCommunityIcons name='office-building' size={18} color={colors.secondary} />}
      tone='indigo'
    >
      <TwoColChips
        options={[
          { key: 'lights', label: t('createClub.facility.lights') },
          { key: 'indoor', label: t('createClub.facility.indoor') },
          { key: 'parking', label: t('createClub.facility.parking') },
          { key: 'ballmachine', label: t('createClub.facility.ballmachine') },
          { key: 'locker', label: t('createClub.facility.locker') },
          { key: 'proshop', label: t('createClub.facility.proshop') },
        ]}
        values={facilitiesSafe}
        onChange={handleFacilitiesChange}
      />
    </Section>
  );
}
