import React from 'react';
import { StyleSheet } from 'react-native';
import { TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '../../../hooks/useTheme';
import { getLightningPickleballTheme } from '../../../theme';
import { useLanguage } from '../../../contexts/LanguageContext';
import Section from '../../layout/Section';

interface ClubFormData {
  rules: string;
}

interface RulesSectionProps {
  formData: ClubFormData;
  onFormChange: <K extends keyof ClubFormData>(key: K, value: ClubFormData[K]) => void;
}

export default function RulesSection({ formData, onFormChange }: RulesSectionProps) {
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningPickleballTheme(currentTheme);
  const colors = themeColors.colors;
  const { t } = useLanguage();

  const styles = StyleSheet.create({
    input: {
      marginTop: 8,
    },
  });

  return (
    <Section
      title={t('createClub.rules')}
      icon={<MaterialCommunityIcons name='file-document-outline' size={18} color={colors.error} />}
      tone='rose'
    >
      <TextInput
        dense
        mode='outlined'
        label={t('createClub.fields.rules')}
        value={formData.rules}
        onChangeText={text => onFormChange('rules', text)}
        style={styles.input}
        multiline
        numberOfLines={4}
        placeholder={t('createClub.fields.rules_placeholder')}
        maxLength={500}
        theme={{ colors }}
      />
    </Section>
  );
}
