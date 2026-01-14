/**
 * AI Chat Page
 * Full-screen AI chat interface
 */

import React from 'react';
import { StyleSheet, View, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AIChatInterface from '../components/ai/AiChatInterface';

const AIChatPage = () => {
  const navigation = useNavigation();

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Apply safe area only to top - bottom handled by AIChatInterface */}
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <AIChatInterface onClose={handleClose} showHeader={true} />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0,
  },
  safeArea: {
    flex: 1,
  },
});

export default AIChatPage;
