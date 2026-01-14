import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '../../../hooks/useTheme';
import { getLightningTennisTheme } from '../../../theme';
import { useLanguage } from '../../../contexts/LanguageContext';
import Section from '../../layout/Section';

interface ClubFormData {
  joinFee?: number;
  monthlyFee?: number;
  yearlyFee?: number;
}

interface FeesSectionProps {
  formData: ClubFormData;
  onFormChange: <K extends keyof ClubFormData>(key: K, value: ClubFormData[K]) => void;
}

export default function FeesSection({ formData, onFormChange }: FeesSectionProps) {
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningTennisTheme(currentTheme);
  const colors = themeColors.colors;
  const { t } = useLanguage();

  const styles = StyleSheet.create({
    input: {
      marginTop: 8,
    },
    hintText: {
      color: colors.onSurfaceVariant,
      fontSize: 11,
      marginTop: -4,
    },
  });

  const handleNumericInput = (field: keyof ClubFormData, text: string) => {
    const value = text.replace(/[^0-9]/g, '');
    onFormChange(field, value ? parseInt(value) : undefined);
  };

  return (
    <Section
      title={t('createClub.fees')}
      icon={<MaterialCommunityIcons name='currency-usd' size={18} color={colors.tertiary} />}
      tone='yellow'
    >
      {/* 가입비 */}
      <TextInput
        dense
        mode='outlined'
        keyboardType='numeric'
        label={t('createClub.joinFee')}
        value={formData.joinFee ? formData.joinFee.toString() : ''}
        onChangeText={text => handleNumericInput('joinFee', text)}
        placeholder={t('createClub.joinFeePlaceholder')}
        style={styles.input}
        left={<TextInput.Icon icon='account-plus' />}
        theme={{ colors }}
      />

      {/* 월회비 */}
      <TextInput
        dense
        mode='outlined'
        keyboardType='numeric'
        label={t('createClub.monthlyFee')}
        value={formData.monthlyFee ? formData.monthlyFee.toString() : ''}
        onChangeText={text => handleNumericInput('monthlyFee', text)}
        placeholder={t('createClub.monthlyFeePlaceholder')}
        style={styles.input}
        left={<TextInput.Icon icon='calendar-month' />}
        theme={{ colors }}
      />

      {/* 년회비 */}
      <TextInput
        dense
        mode='outlined'
        keyboardType='numeric'
        label={t('createClub.yearlyFee')}
        value={formData.yearlyFee ? formData.yearlyFee.toString() : ''}
        onChangeText={text => handleNumericInput('yearlyFee', text)}
        placeholder={t('createClub.yearlyFeePlaceholder')}
        style={styles.input}
        left={<TextInput.Icon icon='calendar-clock' />}
        theme={{ colors }}
      />

      <Text style={styles.hintText}>{t('createClub.feesHint')}</Text>
    </Section>
  );
}
