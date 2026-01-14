import { Alert } from 'react-native';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase/config';
import { useLanguage } from '../../contexts/LanguageContext';

export interface DeveloperToolsReturn {
  handleDeleteAllUsers: () => void;
  handleDeleteAllActivityData: () => void;
  handleSetAdminClaim: () => void;
}

export const DeveloperToolsMenu = (): DeveloperToolsReturn => {
  const { t } = useLanguage();

  // 🔐 Password prompt utility for developer tools
  const showDeveloperPasswordPrompt = (title: string, message: string, onSuccess: () => void) => {
    Alert.prompt(
      t('developerToolsMenu.passwordPrompt.title'),
      t('developerToolsMenu.passwordPrompt.message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: password => {
            if (password === '6992') {
              onSuccess();
            } else {
              Alert.alert(
                '❌ ' + t('common.error'),
                t('developerToolsMenu.passwordPrompt.incorrectPassword'),
                [{ text: t('common.ok') }]
              );
            }
          },
        },
      ],
      'secure-text'
    );
  };

  // 🔧 Developer Tools: Delete all users handler
  const handleDeleteAllUsers = () => {
    Alert.alert(
      t('developerToolsMenu.deleteAllUsers.title'),
      t('developerToolsMenu.deleteAllUsers.message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('developerToolsMenu.deleteAllUsers.buttonDelete'),
          style: 'destructive',
          onPress: () => {
            showDeveloperPasswordPrompt(
              'Delete All Users',
              'Password required',
              executeDeleteAllUsers
            );
          },
        },
      ]
    );
  };

  const executeDeleteAllUsers = async () => {
    try {
      console.log('🚨 Calling deleteAllUsers function...');

      const deleteAllUsers = httpsCallable(functions, 'deleteAllUsers');
      const result = await deleteAllUsers({
        confirmationToken: 'DELETE_ALL_ACCOUNTS_PERMANENTLY',
      });

      console.log('✅ Delete all users complete:', result.data);

      const data = result.data as {
        success: boolean;
        deletedAuthCount: number;
        deletedFirestoreCount: number;
      };
      Alert.alert(
        t('developerToolsMenu.deleteAllUsers.successTitle'),
        t('developerToolsMenu.deleteAllUsers.successMessage', {
          authCount: data.deletedAuthCount,
          firestoreCount: data.deletedFirestoreCount,
        })
      );
    } catch (error) {
      console.error('❌ Delete all users failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : t('developerToolsMenu.errors.unknown');
      Alert.alert(
        t('developerToolsMenu.deleteAllUsers.errorTitle'),
        t('developerToolsMenu.deleteAllUsers.errorMessage', { error: errorMessage })
      );
    }
  };

  // 🔧 Developer Tools: Delete all activity data handler
  const handleDeleteAllActivityData = () => {
    Alert.alert(
      t('developerToolsMenu.deleteAllActivityData.title'),
      t('developerToolsMenu.deleteAllActivityData.message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('developerToolsMenu.deleteAllActivityData.buttonDelete'),
          style: 'destructive',
          onPress: () => {
            showDeveloperPasswordPrompt(
              'Delete All Activity Data',
              'Password required',
              executeDeleteAllActivityData
            );
          },
        },
      ]
    );
  };

  const executeDeleteAllActivityData = async () => {
    try {
      console.log('🗑️ Calling deleteAllActivityData function...');

      const deleteAllActivityData = httpsCallable(functions, 'deleteAllActivityData');
      const result = await deleteAllActivityData({
        confirmationToken: 'DELETE_ALL_ACTIVITY_DATA',
      });

      console.log('✅ Delete all activity data complete:', result.data);

      const data = result.data as {
        success: boolean;
        totalDeletedDocs: number;
        collectionsProcessed: number;
      };
      Alert.alert(
        t('developerToolsMenu.deleteAllActivityData.successTitle'),
        t('developerToolsMenu.deleteAllActivityData.successMessage', {
          totalDocs: data.totalDeletedDocs,
          collectionsCount: data.collectionsProcessed,
        })
      );
    } catch (error) {
      console.error('❌ Delete all activity data failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : t('developerToolsMenu.errors.unknown');
      Alert.alert(
        t('developerToolsMenu.deleteAllActivityData.errorTitle'),
        t('developerToolsMenu.deleteAllActivityData.errorMessage', { error: errorMessage })
      );
    }
  };

  // 🔒 Admin Tools: Set Admin Claim handler
  const handleSetAdminClaim = () => {
    Alert.alert(
      t('developerToolsMenu.setAdminClaim.title'),
      t('developerToolsMenu.setAdminClaim.message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('developerToolsMenu.setAdminClaim.buttonSet'),
          onPress: executeSetAdminClaim,
        },
      ]
    );
  };

  const executeSetAdminClaim = async () => {
    try {
      console.log('🔒 Calling setAdminClaim function...');

      const setAdminClaim = httpsCallable(functions, 'setAdminClaim');
      const result = await setAdminClaim();

      console.log('✅ Set admin claim complete:', result.data);

      const data = result.data as {
        success: boolean;
        isAdmin: boolean;
        message: string;
      };

      const status = data.isAdmin
        ? t('developerToolsMenu.setAdminClaim.statusAdmin')
        : t('developerToolsMenu.setAdminClaim.statusRegular');

      Alert.alert(
        t('developerToolsMenu.setAdminClaim.successTitle'),
        t('developerToolsMenu.setAdminClaim.successMessage', {
          status,
          message: data.message,
        })
      );
    } catch (error) {
      console.error('❌ Set admin claim failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : t('developerToolsMenu.errors.unknown');
      Alert.alert(
        t('developerToolsMenu.setAdminClaim.errorTitle'),
        t('developerToolsMenu.setAdminClaim.errorMessage', { error: errorMessage })
      );
    }
  };

  return {
    handleDeleteAllUsers,
    handleDeleteAllActivityData,
    handleSetAdminClaim,
  };
};
