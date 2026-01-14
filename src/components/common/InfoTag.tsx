import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { getLightningTennisTheme } from '../../theme';

interface InfoTagProps {
  text: string;
  color?: string;
  backgroundColor?: string;
}

const InfoTag: React.FC<InfoTagProps> = ({ text, color, backgroundColor }) => {
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningTennisTheme(currentTheme);

  // Use theme colors as defaults, but allow custom overrides
  const finalBackgroundColor = backgroundColor || themeColors.colors.surfaceVariant;
  const finalTextColor = color || themeColors.colors.onSurfaceVariant;

  return (
    <View style={[styles.container, { backgroundColor: finalBackgroundColor }]}>
      <Text style={[styles.text, { color: finalTextColor }]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default InfoTag;
