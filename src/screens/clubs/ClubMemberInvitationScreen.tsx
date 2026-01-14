/**
 * 📨 Club Member Invitation Screen
 *
 * Allows club admins to invite new members via:
 * 1. In-app message to existing users (using direct chat)
 * 2. SMS to non-users with app download link
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as Localization from 'expo-localization';
import * as SMS from 'expo-sms';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import UserSearchModal from '../../components/modals/UserSearchModal';
import clubService from '../../services/clubService';
import { createFeedItem } from '../../services/feedService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RoutePropType = RouteProp<RootStackParamList, 'ClubMemberInvitation'>;

interface SelectedUser {
  uid: string;
  displayName: string;
  photoURL?: string;
}

const ClubMemberInvitationScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { clubId, clubName } = route.params;

  const { t } = useLanguage();
  const { t: translate } = useTranslation();
  const { paperTheme: theme } = useTheme();
  const { currentUser } = useAuth();

  // State
  const [showUserSearchModal, setShowUserSearchModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [isSendingInvites, setIsSendingInvites] = useState(false);
  const [existingMemberIds, setExistingMemberIds] = useState<string[]>([]);

  // Phone placeholder based on device locale/region
  const phonePlaceholder = useMemo(() => {
    try {
      const locales = Localization.getLocales();
      const regionCode = locales?.[0]?.regionCode?.toUpperCase();
      // Korean region: use Korean phone format
      if (regionCode === 'KR') {
        return t('clubMemberInvitation.phonePlaceholderKR');
      }
      // US/Canada region: use US phone format
      if (regionCode === 'US' || regionCode === 'CA') {
        return t('clubMemberInvitation.phonePlaceholderUS');
      }
      // Default: international format
      return t('clubMemberInvitation.phonePlaceholderIntl');
    } catch {
      return t('clubMemberInvitation.phonePlaceholderIntl');
    }
  }, [t]);

  // Fetch existing club members to exclude from search
  React.useEffect(() => {
    const fetchExistingMembers = async () => {
      try {
        const members = await clubService.getClubMembers(clubId, 'active');
        const memberIds = members
          .map((m: { userId?: string; uid?: string }) => m.userId || m.uid || '')
          .filter(Boolean);
        setExistingMemberIds(memberIds);
      } catch (error) {
        console.error('❌ [ClubMemberInvitation] Error fetching existing members:', error);
      }
    };
    fetchExistingMembers();
  }, [clubId]);

  // Remove user from selection
  const handleRemoveUser = useCallback((userId: string) => {
    setSelectedUsers(prev => prev.filter(u => u.uid !== userId));
  }, []);

  // Handle user selection from modal
  const handleUserSelect = useCallback((users: SelectedUser[]) => {
    // Merge with existing, avoiding duplicates
    setSelectedUsers(prev => {
      const existingIds = new Set(prev.map(u => u.uid));
      const newUsers = users.filter(u => !existingIds.has(u.uid));
      return [...prev, ...newUsers];
    });
  }, []);

  // Send invitation messages via direct chat
  const handleSendInAppInvitations = useCallback(async () => {
    if (!currentUser || selectedUsers.length === 0) return;

    setIsSendingInvites(true);

    try {
      // Send invitation to each selected user
      for (const user of selectedUsers) {
        // 1. Create invitation document in Firestore
        const invitationId = await clubService.createClubInvitation(
          clubId,
          user.uid,
          {
            id: currentUser.uid,
            name: currentUser.displayName || currentUser.email || translate('common.unknown'),
            photoURL: currentUser.photoURL || null,
          },
          {
            name: clubName,
            logoUrl: null, // TODO: Pass club logo URL if available
          }
        );

        // 2. Invitation message template (updated for in-chat acceptance)
        const message = t('clubMemberInvitation.invitationMessage', { clubName });

        // 3. Send invitation card message (type='club_invitation')
        const conversationId = clubService.getConversationId(currentUser.uid, user.uid);

        await clubService.saveDirectChatMessage(conversationId, {
          senderId: currentUser.uid,
          senderName: currentUser.displayName || currentUser.email || translate('common.unknown'),
          senderPhotoURL: currentUser.photoURL || null,
          receiverId: user.uid,
          receiverName: user.displayName,
          receiverPhotoURL: user.photoURL || null,
          message,
          type: 'club_invitation', // New message type for invitation cards
          metadata: {
            invitationId,
            clubId,
            clubName,
            status: 'pending', // pending | accepted | declined | expired
          },
        });

        console.log('📨 [ClubMemberInvitation] Sent invitation to:', user.displayName);

        // 4. Create feed item for the invitation
        try {
          await createFeedItem({
            type: 'club_member_invite_pending',
            actorId: currentUser.uid,
            actorName: currentUser.displayName || currentUser.email || translate('common.unknown'),
            targetId: user.uid,
            targetName: user.displayName,
            clubId,
            clubName,
            visibility: 'targeted',
            visibleTo: [user.uid], // 🎯 피드가 초대받는 사람에게만 보이도록 설정
            metadata: {
              conversationId,
              invitationId,
              targetPhotoURL: user.photoURL || null,
            },
          });
          console.log('📰 [ClubMemberInvitation] Created feed item for invitation');
        } catch (feedError) {
          console.warn('⚠️ [ClubMemberInvitation] Failed to create feed item:', feedError);
          // Don't fail the whole invitation if feed creation fails
        }
      }

      // Success - navigate to first user's chat
      const firstUser = selectedUsers[0];
      const firstConversationId = clubService.getConversationId(currentUser.uid, firstUser.uid);

      Alert.alert(
        t('clubMemberInvitation.invitationsSentTitle'),
        t('clubMemberInvitation.invitationsSentMessage', { count: selectedUsers.length }),
        [
          {
            text: t('clubMemberInvitation.viewChat'),
            onPress: () => {
              navigation.navigate('DirectChatRoom', {
                conversationId: firstConversationId,
                otherUserId: firstUser.uid,
                otherUserName: firstUser.displayName,
                otherUserPhotoURL: firstUser.photoURL,
              });
            },
          },
          {
            text: t('common.ok'),
            onPress: () => {
              setSelectedUsers([]);
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ [ClubMemberInvitation] Error sending invitations:', error);
      Alert.alert(t('common.error'), t('clubMemberInvitation.invitationsSendError'));
    } finally {
      setIsSendingInvites(false);
    }
  }, [currentUser, selectedUsers, clubName, clubId, navigation, t]);

  // Send SMS invitation
  const handleSendSMSInvitation = useCallback(async () => {
    const trimmedNumbers = phoneNumbers.trim();
    if (!trimmedNumbers) {
      Alert.alert(t('clubMemberInvitation.notice'), t('clubMemberInvitation.enterPhoneNumbers'));
      return;
    }

    // Parse phone numbers (comma or newline separated) into array
    const numbersArray = trimmedNumbers
      .split(/[,\n]/)
      .map(n => n.trim())
      .filter(n => n.length > 0);

    if (numbersArray.length === 0) {
      Alert.alert(t('clubMemberInvitation.notice'), t('clubMemberInvitation.enterValidNumbers'));
      return;
    }

    // SMS message template
    const message = t('clubMemberInvitation.smsMessage', { clubName });

    try {
      // Send SMS individually to each number (not as group)
      for (let i = 0; i < numbersArray.length; i++) {
        const number = numbersArray[i];
        const { result } = await SMS.sendSMSAsync([number], message);
        console.log(`📱 [SMS] Sent to ${number}: ${result}`);

        // If user cancelled, ask if they want to continue with remaining numbers
        if (result === 'cancelled' && i < numbersArray.length - 1) {
          const remaining = numbersArray.length - i - 1;
          Alert.alert(
            t('clubMemberInvitation.smsCancelledTitle'),
            t('clubMemberInvitation.smsCancelledMessage', { remaining }),
            [
              {
                text: t('clubMemberInvitation.stop'),
                style: 'cancel',
                onPress: () => {
                  // Keep remaining numbers in the input
                  setPhoneNumbers(numbersArray.slice(i + 1).join(', '));
                },
              },
              {
                text: t('common.continue'),
                onPress: async () => {
                  // Continue with remaining numbers recursively
                  setPhoneNumbers(numbersArray.slice(i + 1).join(', '));
                  // Will be handled on next button press
                },
              },
            ]
          );
          return;
        }
      }

      // All SMS sent successfully
      setPhoneNumbers('');
      Alert.alert(
        t('clubMemberInvitation.completeTitle'),
        t('clubMemberInvitation.completeMessage', { count: numbersArray.length })
      );
    } catch (error) {
      console.error('❌ [ClubMemberInvitation] Error sending SMS:', error);
      Alert.alert(t('common.error'), t('clubMemberInvitation.smsError'));
    }
  }, [phoneNumbers, clubName, t]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.outlineVariant }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name='arrow-back' size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
            {t('clubMemberInvitation.headerTitle')}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
            {clubName}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Section 1: App User Invitation */}
        <View
          style={[
            styles.section,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name='chatbubble-outline' size={24} color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              {t('clubMemberInvitation.inviteAppUsers')}
            </Text>
          </View>
          <Text style={[styles.sectionDescription, { color: theme.colors.onSurfaceVariant }]}>
            {t('clubMemberInvitation.inviteAppUsersDescription')}
          </Text>

          {/* User Search Button */}
          <TouchableOpacity
            style={[styles.searchButton, { backgroundColor: theme.colors.surfaceVariant }]}
            onPress={() => setShowUserSearchModal(true)}
          >
            <Ionicons name='search' size={20} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.searchButtonText, { color: theme.colors.onSurfaceVariant }]}>
              {t('clubMemberInvitation.searchUsers')}
            </Text>
          </TouchableOpacity>

          {/* Selected Users List */}
          {selectedUsers.length > 0 && (
            <View style={styles.selectedUsersContainer}>
              <Text style={[styles.selectedUsersLabel, { color: theme.colors.onSurfaceVariant }]}>
                {t('clubMemberInvitation.selectedUsers', { count: selectedUsers.length })}
              </Text>
              {selectedUsers.map(user => (
                <View
                  key={user.uid}
                  style={[
                    styles.selectedUserItem,
                    { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  {user.photoURL ? (
                    <Image source={{ uri: user.photoURL }} style={styles.userAvatar} />
                  ) : (
                    <View style={[styles.userAvatar, styles.userAvatarPlaceholder]}>
                      <Ionicons name='person' size={16} color={theme.colors.onSurfaceVariant} />
                    </View>
                  )}
                  <Text
                    style={[styles.selectedUserName, { color: theme.colors.onSurface }]}
                    numberOfLines={1}
                  >
                    {user.displayName}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveUser(user.uid)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name='close-circle' size={20} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              ))}

              {/* Send Invitation Button */}
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  { backgroundColor: theme.colors.primary },
                  isSendingInvites && styles.sendButtonDisabled,
                ]}
                onPress={handleSendInAppInvitations}
                disabled={isSendingInvites}
              >
                {isSendingInvites ? (
                  <ActivityIndicator size='small' color='#fff' />
                ) : (
                  <>
                    <Ionicons
                      name='paper-plane'
                      size={18}
                      color='#fff'
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.sendButtonText}>
                      {t('clubMemberInvitation.sendInvitationWithLink')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Section 2: SMS Invitation */}
        <View
          style={[
            styles.section,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name='chatbox-outline' size={24} color='#4CAF50' />
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              {t('clubMemberInvitation.inviteViaSMS')}
            </Text>
          </View>
          <Text style={[styles.sectionDescription, { color: theme.colors.onSurfaceVariant }]}>
            {t('clubMemberInvitation.inviteViaSMSDescription')}
          </Text>

          {/* Phone Number Input */}
          <TextInput
            style={[
              styles.phoneInput,
              {
                backgroundColor: theme.colors.surfaceVariant,
                color: theme.colors.onSurface,
                borderColor: theme.colors.outline,
              },
            ]}
            placeholder={phonePlaceholder}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={phoneNumbers}
            onChangeText={setPhoneNumbers}
            multiline
            numberOfLines={3}
            textAlignVertical='top'
            keyboardType='phone-pad'
            autoCorrect={false}
          />

          {/* Send SMS Button */}
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: '#4CAF50' },
              !phoneNumbers.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSendSMSInvitation}
            disabled={!phoneNumbers.trim()}
          >
            <Ionicons name='chatbox' size={18} color='#fff' style={{ marginRight: 8 }} />
            <Text style={styles.sendButtonText}>{t('clubMemberInvitation.sendSMSInvitation')}</Text>
          </TouchableOpacity>
        </View>

        {/* Info Note */}
        <View style={styles.infoNote}>
          <Ionicons
            name='information-circle-outline'
            size={20}
            color={theme.colors.onSurfaceVariant}
          />
          <Text style={[styles.infoNoteText, { color: theme.colors.onSurfaceVariant }]}>
            {t('clubMemberInvitation.infoNote')}
          </Text>
        </View>
      </ScrollView>

      {/* User Search Modal */}
      <UserSearchModal
        visible={showUserSearchModal}
        onClose={() => setShowUserSearchModal(false)}
        onUserSelect={handleUserSelect}
        excludeUserIds={[...existingMemberIds, ...selectedUsers.map(u => u.uid)]}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
  },
  searchButtonText: {
    fontSize: 16,
    marginLeft: 10,
  },
  selectedUsersContainer: {
    marginTop: 16,
  },
  selectedUsersLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  selectedUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  userAvatarPlaceholder: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedUserName: {
    flex: 1,
    fontSize: 15,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
    marginTop: 12,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  phoneInput: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    fontSize: 15,
    minHeight: 100,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 16,
    marginBottom: 32,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
    lineHeight: 20,
  },
});

export default ClubMemberInvitationScreen;
