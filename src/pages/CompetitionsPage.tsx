/**
 * Competitions Page
 * Unified page for leagues and tournaments
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useNavigation } from '@react-navigation/native';

// Import components
import LeagueListPage from '../components/leagues/LeagueListPage';
import TournamentListPage from '../components/tournaments/TournamentListPage';

const Tab = createMaterialTopTabNavigator();

const CompetitionsPage = () => {
  const navigation = useNavigation();

  // My Competitions Tab
  const MyCompetitionsTab = () => {
    const [activeTab, setActiveTab] = useState<'leagues' | 'tournaments'>('leagues');

    return (
      <View style={styles.myCompetitionsContainer}>
        {/* Sub-tabs */}
        <View style={styles.subTabsContainer}>
          <TouchableOpacity
            style={[styles.subTab, activeTab === 'leagues' && styles.activeSubTab]}
            onPress={() => setActiveTab('leagues')}
          >
            <Text style={[styles.subTabText, activeTab === 'leagues' && styles.activeSubTabText]}>
              My Leagues
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTab, activeTab === 'tournaments' && styles.activeSubTab]}
            onPress={() => setActiveTab('tournaments')}
          >
            <Text
              style={[styles.subTabText, activeTab === 'tournaments' && styles.activeSubTabText]}
            >
              My Tournaments
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.myCompetitionsList}>
          {activeTab === 'leagues' ? (
            <View style={styles.placeholder}>
              <Ionicons name='trophy' size={48} color='#ccc' />
              <Text style={styles.placeholderText}>
                Your league participations will appear here
              </Text>
            </View>
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name='medal' size={48} color='#ccc' />
              <Text style={styles.placeholderText}>Your tournament history will appear here</Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Competitions</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            // @ts-expect-error MyStats screen navigation
            onPress={() => navigation.navigate('MyStats')}
          >
            <Ionicons name='stats-chart' size={24} color='#2196F3' />
          </TouchableOpacity>
        </View>
      </View>

      {/* Competition Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Leagues</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Tournaments</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Wins</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>-</Text>
          <Text style={styles.statLabel}>Best Result</Text>
        </View>
      </View>

      {/* Tab Navigator */}
      <Tab.Navigator
        screenOptions={{
          tabBarLabelStyle: {
            fontSize: 14,
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
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#e0e0e0',
          },
        }}
      >
        <Tab.Screen
          name='MyCompetitions'
          component={MyCompetitionsTab}
          options={{
            title: 'My Competitions',
            tabBarIcon: ({ color }) => <Ionicons name='person' size={18} color={color} />,
          }}
        />

        <Tab.Screen
          name='Leagues'
          component={LeagueListPage}
          options={{
            title: 'Leagues',
            tabBarIcon: ({ color }) => <Ionicons name='trophy' size={18} color={color} />,
          }}
        />

        <Tab.Screen
          name='Tournaments'
          component={TournamentListPage}
          options={{
            title: 'Tournaments',
            tabBarIcon: ({ color }) => <Ionicons name='medal' size={18} color={color} />,
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
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 4,
    marginLeft: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  myCompetitionsContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  subTabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  subTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeSubTab: {
    borderBottomColor: '#2196F3',
  },
  subTabText: {
    fontSize: 14,
    color: '#666',
  },
  activeSubTabText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  myCompetitionsList: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
});

export default CompetitionsPage;
