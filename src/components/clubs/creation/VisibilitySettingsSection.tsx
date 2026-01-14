import React from 'react';
import { StyleSheet } from 'react-native';
import { HelperText } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '../../../hooks/useTheme';
import { getLightningTennisTheme } from '../../../theme';
import { useLanguage } from '../../../contexts/LanguageContext';
import Section from '../../layout/Section';
import TwoColChips from '../../layout/TwoColChips';

interface ClubFormData {
  isPublic: boolean;
}

interface VisibilitySettingsSectionProps {
  formData: ClubFormData;
  onFormChange: <K extends keyof ClubFormData>(key: K, value: ClubFormData[K]) => void;
}

export default function VisibilitySettingsSection({
  formData,
  onFormChange,
}: VisibilitySettingsSectionProps) {
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningTennisTheme(currentTheme);
  const colors = themeColors.colors;
  const { t } = useLanguage();

  const styles = StyleSheet.create({
    hintText: {
      color: colors.onSurfaceVariant,
      fontSize: 11,
      marginTop: -4,
    },
  });

  const visibilityIcon = formData.isPublic ? (
    <MaterialCommunityIcons name='earth' size={18} color={colors.primary} />
  ) : (
    <MaterialCommunityIcons name='lock' size={18} color={colors.onSurfaceVariant} />
  );

  const handleVisibilityChange = (values: string[]) => {
    onFormChange('isPublic', values[0] === 'public');
  };

  return (
    <Section title={t('createClub.visibility')} icon={visibilityIcon} tone='violet'>
      <TwoColChips
        options={[
          { key: 'public', label: t('createClub.visibility_public') },
          { key: 'private', label: t('createClub.visibility_private') },
        ]}
        values={[formData.isPublic ? 'public' : 'private']}
        single
        onChange={handleVisibilityChange}
      />
      <HelperText type='info' style={styles.hintText} theme={{ colors }}>
        {t('createClub.hints.public_club')}
      </HelperText>
    </Section>
  );
}
