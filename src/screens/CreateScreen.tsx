import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { getLightningPickleballTheme } from '../theme';

// 이 화면은 실제로는 사용되지 않음 (모달로 대체)
// 타입 체크를 위한 placeholder
const CreateScreen = () => {
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningPickleballTheme(currentTheme);
  const colors = themeColors.colors;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    text: {
      color: colors.onBackground,
      fontSize: 16,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Create Screen Placeholder</Text>
    </SafeAreaView>
  );
};

export default CreateScreen;
