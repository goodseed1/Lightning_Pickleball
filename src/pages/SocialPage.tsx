/**
 * Social Page - Main social networking hub
 * Integrates activity feed, friends management, and player discovery
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useLanguage } from '../contexts/LanguageContext';
import { useSocial } from '../contexts/SocialContext';

// Components
import ActivityFeed from '../components/social/ActivityFeed';
import FriendsList from '../components/social/FriendsList';
import FriendRequests from '../components/social/FriendRequests';
import ClubDirectory from '../components/discovery/ClubDirectory';

const Tab = createMaterialTopTabNavigator();

interface SocialPageProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation?: any;
}

const SocialPage: React.FC<SocialPageProps> = () => {
  const { t } = useLanguage();
  const { friendRequests, friends, getPlayerRecommendations, sendFriendRequest } = useSocial();

  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    setPendingRequestsCount(friendRequests.length);
  }, [friendRequests]);

  // Activity Feed Tab
  const ActivityFeedTab = () => (
    <View style={styles.tabContainer}>
      <ActivityFeed maxItems={50} showHeader={false} />
    </View>
  );

  // Friends Tab
  const FriendsTab = () => (
    <View style={styles.tabContainer}>
      <FriendsList
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onFriendPress={(friendId, _friendInfo) => {
          // Navigate to friend profile
          console.log('Navigate to friend profile:', friendId);
        }}
        showActions={true}
      />
    </View>
  );

  // Friend Requests Tab
  const RequestsTab = () => (
    <View style={styles.tabContainer}>
      <FriendRequests showHeader={false} />
    </View>
  );

  // Club Discovery Tab
  const DiscoveryTab = () => (
    <View style={styles.tabContainer}>
      <ClubDirectory
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onClubPress={(clubId, _clubData) => {
          // Navigate to club detail
          console.log('Navigate to club:', clubId);
        }}
        maxItems={30}
        showSearch={true}
      />
    </View>
  );

  // Player Recommendations Tab
  const RecommendationsTab = () => {
    const [, setLoading] = useState(true);

    useEffect(() => {
      loadRecommendations();
    }, []);

    const loadRecommendations = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const recs = await getPlayerRecommendations({
          maxDistance: 50,
          skillLevelRange: ['beginner', 'intermediate', 'advanced'],
        });
      } catch (error) {
        console.error('Failed to load recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleSendFriendRequest = async (userId: string, nickname: string) => {
      Alert.alert(t('social.sendFriendRequest'), t('social.sendRequestTo', { name: nickname }), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.send'),
          onPress: async () => {
            try {
              await sendFriendRequest(userId, t('social.defaultFriendMessage'));
              Alert.alert(t('common.success'), t('social.friendRequestSent'));
              loadRecommendations(); // Refresh to remove sent request
            } catch (error) {
              Alert.alert(t('common.error'), error instanceof Error ? error.message : t('common.unknownError'));
            }
          },
        },
      ]);
    };

    return (
      <View style={styles.tabContainer}>
        {/* Player recommendations implementation would go here */}
        <View style={styles.comingSoonContainer}>
          <Ionicons name='people' size={64} color='#ccc' />
          <Text style={styles.comingSoonTitle}>{t('social.playerRecommendations')}</Text>
          <Text style={styles.comingSoonText}>{t('social.findCompatiblePlayers')}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('navigation.social')}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              // Navigate to search players
              console.log('Open player search');
            }}
          >
            <Ionicons name='search' size={24} color='#2196F3' />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              // Navigate to settings
              console.log('Open social settings');
            }}
          >
            <Ionicons name='settings' size={24} color='#2196F3' />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Navigator */}
      <Tab.Navigator
        screenOptions={{
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            textTransform: 'none',
          },
          tabBarActiveTintColor: '#2196F3',
          tabBarInactiveTintColor: '#666',
          tabBarIndicatorStyle: {
            backgroundColor: '#2196F3',
            height: 3,
          },
          tabBarStyle: {
            backgroundColor: 'white',
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          },
          tabBarScrollEnabled: true,
          tabBarItemStyle: {
            width: 'auto',
            minWidth: 80,
          },
        }}
      >
        <Tab.Screen
          name='Feed'
          component={ActivityFeedTab}
          options={{
            title: t('social.activityFeed'),
            tabBarIcon: ({ color }) => <Ionicons name='newspaper' size={18} color={color} />,
          }}
        />

        <Tab.Screen
          name='Friends'
          component={FriendsTab}
          options={{
            title: `${t('social.friends')} (${friends.length})`,
            tabBarIcon: ({ color }) => <Ionicons name='people' size={18} color={color} />,
          }}
        />

        <Tab.Screen
          name='Requests'
          component={RequestsTab}
          options={{
            title:
              pendingRequestsCount > 0
                ? `${t('social.requests')} (${pendingRequestsCount})`
                : t('social.requests'),
            tabBarIcon: ({ color }) => (
              <View>
                <Ionicons name='person-add' size={18} color={color} />
                {pendingRequestsCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                    </Text>
                  </View>
                )}
              </View>
            ),
          }}
        />

        <Tab.Screen
          name='Discovery'
          component={DiscoveryTab}
          options={{
            title: t('social.discover'),
            tabBarIcon: ({ color }) => <Ionicons name='compass' size={18} color={color} />,
          }}
        />

        <Tab.Screen
          name='Recommendations'
          component={RecommendationsTab}
          options={{
            title: t('social.recommended'),
            tabBarIcon: ({ color }) => <Ionicons name='bulb' size={18} color={color} />,
          }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 16,
    padding: 4,
  },
  tabContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default SocialPage;
