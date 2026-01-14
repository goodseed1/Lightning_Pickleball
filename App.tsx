import 'react-native-get-random-values';
import React, { useEffect } from 'react';
import { LogBox } from 'react-native';
import './src/i18n';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';

// 🔇 Ignore Firestore permission-denied errors during logout
// This happens because snapshot listeners are still active when user logs out
LogBox.ignoreLogs([
  'Uncaught Error in snapshot listener: FirebaseError: [code=permission-denied]',
  '@firebase/firestore: Firestore',
  'FirebaseError: [code=permission-denied]',
]);
import { NavigationContainer } from '@react-navigation/native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { ThemeProvider } from './src/contexts/ThemeContext';
import { useTheme } from './src/hooks/useTheme';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { ClubProvider } from './src/contexts/ClubContext';
import { FeedProvider } from './src/contexts/FeedContext';
import { DiscoveryProvider } from './src/contexts/DiscoveryContext';
import { ActivityProvider } from './src/contexts/ActivityContext';
import { AIChatProvider } from './src/contexts/AiChatContext';
import { LocationProvider } from './src/contexts/LocationContext';
import { ChatNotificationProvider } from './src/contexts/ChatNotificationContext';
import { UpdateCheckProvider } from './src/contexts/UpdateCheckContext';
import AppNavigator from './src/navigation/AppNavigator';
import knowledgeBaseService from './src/services/knowledgeBaseService';
import { navigationRef } from './src/services/navigationService';
import pushNotificationService from './src/services/pushNotificationService';
import './src/utils/testMatchResults'; // Import test utilities for development
import './src/utils/createTestMatches'; // Import test match creation utilities
import './src/utils/addMatchResultsToExisting'; // Import utilities to add results to existing matches
import './src/utils/debugEventData'; // Import event data debugging utilities
import ErrorBoundary from './src/components/common/ErrorBoundary';
import { FloatingChatButton } from './src/components/ai';

// Uncomment this line to enable Storybook
// import StorybookUIRoot from './.storybook/Storybook';
// const enableStorybook = false; // Set to true to view Storybook

// Theme-aware component that provides the main app content
const ThemedAppContent: React.FC = () => {
  const { theme, isThemeReady, paperTheme, navigationTheme } = useTheme();

  // 🛡️ IRON WALL GUARD: Absolutely NO rendering until theme is bulletproof ready
  // This prevents ANY component from accessing unready theme objects during hot reload
  if (!isThemeReady) {
    console.log('🛡️ APP: Iron wall guard active - waiting for theme initialization...');
    return null;
  }

  console.log('✅ APP: Theme ready - proceeding with app rendering');

  return (
    <PaperProvider theme={paperTheme}>
      <SafeAreaProvider>
        <LanguageProvider>
          <UpdateCheckProvider>
            <AuthProvider>
              <ClubProvider>
                <FeedProvider>
                  <DiscoveryProvider>
                    <ActivityProvider>
                      <LocationProvider>
                        <AIChatProvider>
                          <ErrorBoundary>
                            <NavigationContainer ref={navigationRef} theme={navigationTheme}>
                              <ChatNotificationProvider>
                                <AppNavigator />
                                <FloatingChatButton />
                                <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
                              </ChatNotificationProvider>
                            </NavigationContainer>
                          </ErrorBoundary>
                        </AIChatProvider>
                      </LocationProvider>
                    </ActivityProvider>
                  </DiscoveryProvider>
                </FeedProvider>
              </ClubProvider>
            </AuthProvider>
          </UpdateCheckProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </PaperProvider>
  );
};

export default function App() {
  // If Storybook is enabled, show Storybook instead of the main app
  // if (enableStorybook) {
  //   return <StorybookUIRoot />;
  // }

  // Initialize app services on start
  useEffect(() => {
    console.log('🚀 APP: Initializing app services...');
    const initializeApp = async () => {
      try {
        // Configure Google Sign-In
        GoogleSignin.configure({
          webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
          iosClientId: '815594051044-73ah5eiak4klp7ofgj488ih3f4g97kct.apps.googleusercontent.com',
        });
        console.log('✅ APP: Google Sign-In configured');

        // Initialize knowledge base for both languages
        await knowledgeBaseService.initializeBothLanguages();
        console.log('✅ APP: Knowledge base initialized successfully');

        // 🔔 Initialize push notifications (creates Android channels + requests permissions)
        await pushNotificationService.initialize();
        console.log('✅ APP: Push notification service initialized');
      } catch (error) {
        console.warn('❌ APP: Failed to initialize app services:', error);
      }
    };

    initializeApp();
  }, []);

  console.log('🚀 APP: Rendering Lightning Tennis with bulletproof Project Midnight theme system');

  return (
    // Project Midnight Architecture:
    // ThemeProvider (outermost) → ThemedAppContent (all other providers inside)
    // This ensures theme is available to all components and providers
    <ThemeProvider>
      <ThemedAppContent />
    </ThemeProvider>
  );
}
