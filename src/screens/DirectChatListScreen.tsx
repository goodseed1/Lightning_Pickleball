import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, MD3Theme, Avatar, Badge, ActivityIndicator } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import clubService from '../services/clubService';
import friendshipService from '../services/friendshipService';
import userService from '../services/userService';
import { Friend as FriendshipFriend } from '../types/friendship';
import { useLanguage } from '../contexts/LanguageContext';

interface DirectChatListScreenProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  navigation: {
    navigate: (screen: string, params: Record<string, string>) => void;
  };
}

interface Conversation {
  id: string;
  participants: string[];
  participantNames: { [key: string]: string };
  participantPhotos?: { [key: string]: string };
  lastMessage: string;
  lastMessageTime: Date | { toDate: () => Date } | null;
  lastMessageSenderId: string;
  unreadCount?: { [key: string]: number };
}

interface User {
  uid: string;
  displayName: string;
  photoURL?: string;
  profileImage?: string; // 🎯 [KIM FIX] Firestore uses profileImage, not photoURL
  email?: string;
  // 🎯 [2026-01-12] Firestore nested profile structure
  profile?: {
    photoURL?: string;
    profileImage?: string;
  };
}

// Generate consistent color based on user ID
const getAvatarColor = (userId: string): string => {
  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Light Salmon
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#85C1E2', // Sky Blue
  ];

  // Generate consistent index from userId
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const DirectChatListScreen: React.FC<DirectChatListScreenProps> = ({
  visible,
  onClose,
  userId,
  navigation,
}) => {
  const paperTheme = useTheme();
  const styles = useMemo(() => createStyles(paperTheme), [paperTheme]);
  const { t, currentLanguage } = useLanguage();
  const { t: translate } = useTranslation();

  // States
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<FriendshipFriend[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [activeTab, setActiveTab] = useState<'conversations' | 'newChat'>('conversations');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loadingAllUsers, setLoadingAllUsers] = useState(false);

  // Load all users when "전체 목록 보기" is clicked
  const loadAllUsers = useCallback(async () => {
    if (loadingAllUsers || allUsers.length > 0) {
      setShowAllUsers(true);
      return;
    }

    setLoadingAllUsers(true);
    try {
      // Use userService.getAllUsers() to get all users
      const users = await userService.getAllUsers();
      const filtered = (users as User[]).filter((u: User) => u.uid !== userId);
      setAllUsers(filtered);
      setShowAllUsers(true);
      console.log(`[DirectChatListScreen] Loaded ${filtered.length} all users`);
    } catch (error) {
      console.error('[DirectChatListScreen] Error loading all users:', error);
    } finally {
      setLoadingAllUsers(false);
    }
  }, [userId, loadingAllUsers, allUsers.length]);

  // Subscribe to friends list (same as FriendsScreen)
  useEffect(() => {
    if (!userId || !visible) return;

    const unsubscribe = friendshipService.subscribeToFriends(userId, friendsList => {
      // Limit to first 10 friends for display
      setFriends(friendsList.slice(0, 10));
      console.log(`[DirectChatListScreen] Loaded ${friendsList.length} friends`);
    });

    return () => unsubscribe();
  }, [userId, visible]);

  // Handle inline search
  const handleInlineSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);

      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      try {
        const users = await clubService.searchUsers(query);
        const filtered = (users as User[]).filter((u: User) => u.uid !== userId);
        setSearchResults(filtered);
      } catch (error) {
        console.error('[DirectChatListScreen] Error searching users:', error);
      } finally {
        setSearching(false);
      }
    },
    [userId]
  );

  // Subscribe to conversations
  useEffect(() => {
    if (!userId || !visible) {
      return;
    }

    console.log('[DirectChatListScreen] Setting up conversations subscription');
    setLoading(true);

    const unsubscribe = clubService.subscribeToMyConversations(userId, (convs: Conversation[]) => {
      setConversations(convs);
      setLoading(false);
    });

    return () => {
      console.log('[DirectChatListScreen] Cleaning up conversations subscription');
      unsubscribe();
    };
  }, [userId, visible]);

  // Start new conversation
  // 🎯 [2026-01-12] Check all possible photo locations for compatibility
  const startNewConversation = useCallback(
    (otherUser: User) => {
      const conversationId = clubService.getConversationId(userId, otherUser.uid);
      const profilePhoto =
        otherUser.photoURL ||
        otherUser.profile?.photoURL ||
        otherUser.profileImage ||
        otherUser.profile?.profileImage ||
        '';

      // Close modal and navigate to chat room
      onClose();
      navigation.navigate('DirectChatRoom', {
        conversationId,
        otherUserId: otherUser.uid,
        otherUserName: otherUser.displayName,
        otherUserPhotoURL: profilePhoto,
      });

      setShowSearch(false);
    },
    [userId, navigation, onClose]
  );

  // Get other user info
  // 🎯 [2026-01-12] participantPhotos is now kept in sync by AuthContext
  // when user changes profile photo, it updates all conversations automatically
  const getOtherUser = (conversation: Conversation) => {
    const otherUserId = conversation.participants.find(p => p !== userId);
    if (!otherUserId) return null;

    return {
      uid: otherUserId,
      name: conversation.participantNames[otherUserId] || translate('common.unknown'),
      photoURL: conversation.participantPhotos?.[otherUserId],
    };
  };

  // Format time
  const formatTime = (timestamp: Date | { toDate: () => Date } | null) => {
    if (!timestamp) return '';

    const date =
      typeof timestamp === 'object' && 'toDate' in timestamp
        ? timestamp.toDate()
        : new Date(timestamp as Date);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('directChat.time.justNow');
    if (minutes < 60) return t('directChat.time.minutesAgo', { count: minutes });
    if (hours < 24) return t('directChat.time.hoursAgo', { count: hours });
    if (days < 7) return t('directChat.time.daysAgo', { count: days });

    return date.toLocaleDateString(currentLanguage === 'ko' ? 'ko-KR' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Render conversation item
  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const otherUser = getOtherUser(item);
    if (!otherUser) return null;

    const unreadCount = item.unreadCount?.[userId] || 0;
    const hasUnread = unreadCount > 0;

    const handlePress = () => {
      // Close modal
      onClose();

      // Navigate to DirectChatRoomScreen
      navigation.navigate('DirectChatRoom', {
        conversationId: item.id,
        otherUserId: otherUser.uid,
        otherUserName: otherUser.name,
        otherUserPhotoURL: otherUser.photoURL || '',
      });
    };

    return (
      <TouchableOpacity style={styles.conversationItem} onPress={handlePress}>
        {/* Left: Avatar (40x40) */}
        {otherUser.photoURL ? (
          <Avatar.Image source={{ uri: otherUser.photoURL }} size={40} />
        ) : (
          <Avatar.Text
            size={40}
            label={otherUser.name.charAt(0).toUpperCase()}
            style={{ backgroundColor: getAvatarColor(otherUser.uid) }}
          />
        )}

        {/* Center: Name + Last Message */}
        <View style={styles.conversationContent}>
          <Text
            style={[styles.conversationName, hasUnread && styles.conversationNameUnread]}
            numberOfLines={1}
          >
            {otherUser.name}
          </Text>
          <Text
            style={[styles.lastMessage, hasUnread && styles.lastMessageUnread]}
            numberOfLines={1}
          >
            {item.lastMessage || t('directChat.startConversation')}
          </Text>
        </View>

        {/* Right: Time + Unread Badge */}
        <View style={styles.conversationRight}>
          <Text style={styles.timestamp}>{formatTime(item.lastMessageTime)}</Text>

          {unreadCount > 0 && (
            <Badge size={20} style={styles.unreadBadge}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Render friend item (using friendship.ts Friend type)
  const renderFriendItem = ({ item }: { item: FriendshipFriend }) => {
    // Convert FriendshipFriend to User for startNewConversation
    const userFromFriend: User = {
      uid: item.userId,
      displayName: item.name,
      photoURL: item.profileImage,
    };

    return (
      <TouchableOpacity
        style={styles.suggestedMember}
        onPress={() => startNewConversation(userFromFriend)}
      >
        {item.profileImage ? (
          <Avatar.Image source={{ uri: item.profileImage }} size={40} />
        ) : (
          <Avatar.Text
            size={40}
            label={item.name.charAt(0).toUpperCase()}
            style={{ backgroundColor: getAvatarColor(item.userId) }}
          />
        )}
        <View style={styles.suggestedMemberInfo}>
          <Text style={styles.suggestedMemberName}>{item.name}</Text>
        </View>
        <Ionicons name='chatbubble-outline' size={20} color={paperTheme.colors.primary} />
      </TouchableOpacity>
    );
  };

  // Render search result item
  // 🎯 [2026-01-12] Check all possible photo locations for compatibility
  // Priority: photoURL (root) > profile.photoURL > profileImage > profile.profileImage
  const renderSearchResultItem = ({ item }: { item: User }) => {
    const profilePhoto =
      item.photoURL || item.profile?.photoURL || item.profileImage || item.profile?.profileImage;
    return (
      <TouchableOpacity style={styles.suggestedMember} onPress={() => startNewConversation(item)}>
        {profilePhoto ? (
          <Avatar.Image source={{ uri: profilePhoto }} size={40} />
        ) : (
          <Avatar.Text
            size={40}
            label={item.displayName.charAt(0).toUpperCase()}
            style={{ backgroundColor: getAvatarColor(item.uid) }}
          />
        )}
        <View style={styles.suggestedMemberInfo}>
          <Text style={styles.suggestedMemberName}>{item.displayName}</Text>
        </View>
        <Ionicons name='chatbubble-outline' size={20} color={paperTheme.colors.primary} />
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType='slide' onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name='close' size={28} color={paperTheme.colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('directChat.headerTitle')}</Text>
          <TouchableOpacity
            onPress={() =>
              setActiveTab(activeTab === 'conversations' ? 'newChat' : 'conversations')
            }
            style={styles.headerButton}
          >
            <Ionicons
              name={activeTab === 'conversations' ? 'add-circle-outline' : 'list-outline'}
              size={24}
              color={paperTheme.colors.onSurface}
            />
          </TouchableOpacity>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'conversations' && styles.tabActive]}
            onPress={() => setActiveTab('conversations')}
          >
            <Ionicons
              name='chatbubbles-outline'
              size={18}
              color={
                activeTab === 'conversations'
                  ? paperTheme.colors.primary
                  : paperTheme.colors.onSurfaceVariant
              }
            />
            <Text style={[styles.tabText, activeTab === 'conversations' && styles.tabTextActive]}>
              {t('directChat.tabs.conversations')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'newChat' && styles.tabActive]}
            onPress={() => setActiveTab('newChat')}
          >
            <Ionicons
              name='person-add-outline'
              size={18}
              color={
                activeTab === 'newChat'
                  ? paperTheme.colors.primary
                  : paperTheme.colors.onSurfaceVariant
              }
            />
            <Text style={[styles.tabText, activeTab === 'newChat' && styles.tabTextActive]}>
              {t('directChat.tabs.newChat')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Input (always visible in newChat tab) */}
        {activeTab === 'newChat' && (
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Ionicons name='search' size={20} color={paperTheme.colors.onSurfaceVariant} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('directChat.searchPlaceholder')}
                placeholderTextColor={paperTheme.colors.onSurfaceDisabled}
                value={searchQuery}
                onChangeText={handleInlineSearch}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleInlineSearch('')}>
                  <Ionicons
                    name='close-circle'
                    size={20}
                    color={paperTheme.colors.onSurfaceVariant}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Main Content */}
        <View style={styles.mainContent}>
          {activeTab === 'conversations' ? (
            // Conversations Tab
            loading ? (
              <ActivityIndicator size='large' style={{ marginTop: 20 }} />
            ) : conversations.length === 0 ? (
              <View style={styles.emptyStateCenter}>
                <Ionicons
                  name='chatbubbles-outline'
                  size={64}
                  color={paperTheme.colors.onSurfaceVariant}
                />
                <Text style={styles.emptyStateText}>{t('directChat.noConversations')}</Text>
                <TouchableOpacity
                  style={styles.startChatButton}
                  onPress={() => setActiveTab('newChat')}
                >
                  <Ionicons name='add' size={20} color='#fff' />
                  <Text style={styles.startChatButtonText}>{t('directChat.startNewChat')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={conversations}
                keyExtractor={item => item.id}
                renderItem={renderConversationItem}
              />
            )
          ) : // New Chat Tab
          searching ? (
            <ActivityIndicator size='large' style={{ marginTop: 20 }} />
          ) : searchQuery.trim() ? (
            // Search Results
            <FlatList
              data={searchResults}
              keyExtractor={item => item.uid}
              renderItem={renderSearchResultItem}
              ListEmptyComponent={
                <View style={styles.emptyStateCenter}>
                  <Ionicons name='search' size={48} color={paperTheme.colors.onSurfaceVariant} />
                  <Text style={styles.emptyStateText}>{t('directChat.noSearchResults')}</Text>
                </View>
              }
            />
          ) : (
            // Friends List
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>{t('directChat.friendsList')}</Text>
              <FlatList
                data={friends}
                keyExtractor={item => item.userId}
                renderItem={renderFriendItem}
                contentContainerStyle={styles.suggestedList}
                ListEmptyComponent={
                  <View style={styles.emptyStateCenter}>
                    <Text style={styles.emptyStateText}>{t('directChat.enterNameToSearch')}</Text>
                  </View>
                }
                ListFooterComponent={
                  <>
                    {/* View All Users Link */}
                    {friends.length > 0 && !showAllUsers && (
                      <TouchableOpacity
                        style={styles.viewAllLink}
                        onPress={loadAllUsers}
                        disabled={loadingAllUsers}
                      >
                        {loadingAllUsers ? (
                          <ActivityIndicator size='small' color={paperTheme.colors.primary} />
                        ) : (
                          <>
                            <Text style={styles.viewAllLinkText}>
                              {t('directChat.viewAllUsers')}
                            </Text>
                            <Ionicons
                              name='chevron-forward'
                              size={16}
                              color={paperTheme.colors.primary}
                            />
                          </>
                        )}
                      </TouchableOpacity>
                    )}

                    {/* All Users Section */}
                    {/* 🎯 [2026-01-12] Check all possible photo locations for compatibility */}
                    {showAllUsers && (
                      <View style={styles.allUsersSection}>
                        <Text style={styles.sectionTitle}>{t('directChat.allUsers')}</Text>
                        {allUsers
                          .filter(user => !friends.some(f => f.userId === user.uid))
                          .map(user => {
                            const profilePhoto =
                              user.photoURL ||
                              user.profile?.photoURL ||
                              user.profileImage ||
                              user.profile?.profileImage;
                            const userFromAllUsers: User = {
                              uid: user.uid,
                              displayName: user.displayName,
                              photoURL: user.photoURL,
                              profileImage: user.profileImage,
                              profile: user.profile,
                            };
                            return (
                              <TouchableOpacity
                                key={user.uid}
                                style={styles.suggestedUserItem}
                                onPress={() => startNewConversation(userFromAllUsers)}
                              >
                                {profilePhoto ? (
                                  <Avatar.Image size={40} source={{ uri: profilePhoto }} />
                                ) : (
                                  <Avatar.Text
                                    size={40}
                                    label={(user.displayName || '?')[0].toUpperCase()}
                                    style={{ backgroundColor: getAvatarColor(user.uid) }}
                                  />
                                )}
                                <Text style={styles.suggestedUserName}>{user.displayName}</Text>
                                <Ionicons
                                  name='chatbubble-outline'
                                  size={20}
                                  color={paperTheme.colors.primary}
                                />
                              </TouchableOpacity>
                            );
                          })}
                      </View>
                    )}
                  </>
                }
              />
            </View>
          )}
        </View>

        {/* User Search Modal (legacy, kept for backup) */}
        {showSearch && (
          <UserSearchModal
            visible={showSearch}
            onClose={() => setShowSearch(false)}
            onSelectUser={startNewConversation}
            currentUserId={userId}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

// Create styles
const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    headerButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    mainContent: {
      flex: 1,
    },
    conversationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    conversationContent: {
      flex: 1,
      marginLeft: 12,
      marginRight: 8,
    },
    conversationName: {
      fontSize: 16,
      fontWeight: '400',
      color: theme.colors.onSurface,
      marginBottom: 4,
    },
    conversationNameUnread: {
      fontWeight: '600',
    },
    lastMessage: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      fontWeight: 'normal',
    },
    lastMessageUnread: {
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    conversationRight: {
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      minHeight: 44,
    },
    timestamp: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 4,
    },
    unreadBadge: {
      backgroundColor: '#FF3B30',
      color: '#FFFFFF', // 🎯 White text for visibility
    },
    emptyState: {
      flex: 1,
      padding: 16,
    },
    emptyStateTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      marginBottom: 12,
    },
    suggestedList: {
      paddingBottom: 16,
    },
    suggestedMember: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    suggestedMemberInfo: {
      flex: 1,
      marginLeft: 12,
    },
    suggestedMemberName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    // View all link style
    viewAllLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      gap: 4,
    },
    viewAllLinkText: {
      fontSize: 14,
      color: theme.colors.primary,
    },
    // All users section
    allUsersSection: {
      marginTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      paddingTop: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      marginBottom: 12,
    },
    suggestedUserItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    suggestedUserName: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginLeft: 12,
    },
    // Tab styles
    tabContainer: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      gap: 6,
    },
    tabActive: {
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.primary,
    },
    tabText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    tabTextActive: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    // Search styles
    searchContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    searchInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 12,
      paddingHorizontal: 12,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.colors.onSurface,
    },
    // Empty state center styles
    emptyStateCenter: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    emptyStateText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginTop: 12,
      textAlign: 'center',
    },
    startChatButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 24,
      marginTop: 20,
      gap: 8,
    },
    startChatButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
  });

// Export UserSearchModal component
interface UserSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectUser: (user: User) => void;
  currentUserId: string;
}

const UserSearchModal: React.FC<UserSearchModalProps> = ({
  visible,
  onClose,
  onSelectUser,
  currentUserId,
}) => {
  const paperTheme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  // Search users
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const users = await clubService.searchUsers(query);
      // Filter out current user
      const filtered = (users as User[]).filter((u: User) => u.uid !== currentUserId);
      setSearchResults(filtered);
    } catch (error) {
      console.error('[UserSearchModal] Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  return (
    <Modal visible={visible} animationType='slide' onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: paperTheme.colors.background }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: paperTheme.colors.outlineVariant,
          }}
        >
          <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
            <Ionicons name='arrow-back' size={24} color={paperTheme.colors.onSurface} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '600', marginLeft: 12 }}>Search Users</Text>
        </View>

        {/* Search Input */}
        <View style={{ padding: 16 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: paperTheme.colors.surfaceVariant,
              borderRadius: 12,
              paddingHorizontal: 16,
            }}
          >
            <Ionicons name='search' size={20} color={paperTheme.colors.onSurfaceVariant} />
            <TextInput
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 12,
                fontSize: 16,
                color: paperTheme.colors.onSurface,
              }}
              placeholder='Search by name...'
              placeholderTextColor={paperTheme.colors.onSurfaceDisabled}
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus
            />
          </View>
        </View>

        {/* Search Results */}
        {searching ? (
          <ActivityIndicator size='large' style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={item => item.uid}
            renderItem={({ item }) => {
              // 🎯 [2026-01-12] Check all possible photo locations for compatibility
              const profilePhoto =
                item.photoURL ||
                item.profile?.photoURL ||
                item.profileImage ||
                item.profile?.profileImage;
              return (
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: paperTheme.colors.outlineVariant,
                  }}
                  onPress={() => onSelectUser(item)}
                >
                  {profilePhoto ? (
                    <Avatar.Image source={{ uri: profilePhoto }} size={48} />
                  ) : (
                    <Avatar.Text
                      size={48}
                      label={item.displayName.charAt(0).toUpperCase()}
                      style={{ backgroundColor: getAvatarColor(item.uid) }}
                    />
                  )}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: paperTheme.colors.onSurface,
                      }}
                    >
                      {item.displayName}
                    </Text>
                  </View>
                  <Ionicons name='chatbubble-outline' size={24} color={paperTheme.colors.primary} />
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              searchQuery.trim() ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: paperTheme.colors.onSurfaceVariant }}>
                    No results found
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

export default DirectChatListScreen;
