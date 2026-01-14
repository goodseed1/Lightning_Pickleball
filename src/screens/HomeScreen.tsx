import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import MapAppSelector from '../components/common/MapAppSelector';
import { LocationData, MapApp } from '../types/mapTypes';
import { getPreferredMapApp, getAvailableMapApps, openInMapApp } from '../services/mapService';

interface LightningMatch {
  id: string;
  title: string;
  location: string;
  time: string;
  skillLevel: string;
  playersNeeded: number;
  currentPlayers: number;
  host: string;
  type: 'singles' | 'doubles';
}

const HomeScreen = () => {
  const { t } = useLanguage();
  const [showMapSelector, setShowMapSelector] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [matches, setMatches] = useState<LightningMatch[]>([
    {
      id: '1',
      title: t('matches.weekendTennisMatch'),
      location: 'Central Park Tennis Courts',
      time: t('matches.todayAfternoon3'),
      skillLevel: t('matches.intermediate3040'),
      playersNeeded: 3,
      currentPlayers: 1,
      host: 'Alex Kim',
      type: 'doubles',
    },
    {
      id: '2',
      title: t('matches.eveningSinglesGame'),
      location: 'Brooklyn Tennis Club',
      time: t('matches.tomorrowEvening6'),
      skillLevel: t('matches.beginner2030'),
      playersNeeded: 1,
      currentPlayers: 1,
      host: 'Maria Lopez',
      type: 'singles',
    },
  ]);

  const createNewMatch = () => {
    Alert.alert(t('matches.createLightningMatch'), t('matches.createNewMatchQuestion'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.create'),
        onPress: () => {
          const newMatch: LightningMatch = {
            id: Date.now().toString(),
            title: t('matches.newTennisMatch'),
            location: t('matches.nearbyTennisCourt'),
            time: t('matches.tomorrowAfternoon2'),
            skillLevel: t('matches.allLevels'),
            playersNeeded: 3,
            currentPlayers: 1,
            host: t('matches.me'),
            type: 'doubles',
          };
          setMatches([newMatch, ...matches]);
          Alert.alert(t('common.success'), t('matches.matchCreatedSuccessfully'));
        },
      },
    ]);
  };

  const joinMatch = (matchId: string) => {
    Alert.alert(t('matches.joinMatch'), t('matches.joinMatchQuestion'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('matches.join'),
        onPress: () => {
          setMatches(
            matches.map(match =>
              match.id === matchId ? { ...match, currentPlayers: match.currentPlayers + 1 } : match
            )
          );
          Alert.alert(t('matches.joinComplete'), t('matches.joinedSuccessfully'));
        },
      },
    ]);
  };

  const handleLocationPress = async (location: string) => {
    const locationData: LocationData = {
      address: location,
      coordinates: null, // 실제 앱에서는 좌표 데이터가 있을 수 있음
    };

    try {
      // 선호 지도 앱이 설정되어 있는지 확인
      const preferredAppId = await getPreferredMapApp();

      if (preferredAppId) {
        // 선호 앱이 있으면 바로 열기
        const availableApps = getAvailableMapApps();
        const preferredApp = availableApps.find(app => app.id === preferredAppId);

        if (preferredApp) {
          await openInMapApp(preferredApp, locationData);
          return;
        }
      }

      // 선호 앱이 없거나 찾을 수 없으면 선택 모달 표시
      setSelectedLocation(locationData);
      setShowMapSelector(true);
    } catch (error) {
      console.error('Error handling location press:', error);
      // 오류 발생 시 모달 표시
      setSelectedLocation(locationData);
      setShowMapSelector(true);
    }
  };

  const handleMapAppSelect = (app: MapApp) => {
    console.log(`Opening ${selectedLocation?.address} in ${app.name}`);
  };

  const MatchCard = ({ match }: { match: LightningMatch }) => (
    <View style={styles.matchCard}>
      <View style={styles.matchHeader}>
        <Text style={styles.matchTitle}>{match.title}</Text>
        <View style={styles.matchTypeTag}>
          <Text style={styles.matchTypeText}>
            {match.type === 'singles' ? t('matches.singles') : t('matches.doubles')}
          </Text>
        </View>
      </View>

      <View style={styles.matchInfo}>
        <TouchableOpacity
          style={styles.infoRow}
          onPress={() => handleLocationPress(match.location)}
        >
          <Ionicons name='location-outline' size={16} color='#1976d2' />
          <Text style={[styles.infoText, styles.locationText]}>{match.location}</Text>
          <Ionicons
            name='chevron-forward'
            size={14}
            color='#1976d2'
            style={styles.locationChevron}
          />
        </TouchableOpacity>

        <View style={styles.infoRow}>
          <Ionicons name='time-outline' size={16} color='#666' />
          <Text style={styles.infoText}>{match.time}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name='trophy-outline' size={16} color='#666' />
          <Text style={styles.infoText}>{match.skillLevel}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name='people-outline' size={16} color='#666' />
          <Text style={styles.infoText}>
            {match.currentPlayers}/{match.currentPlayers + match.playersNeeded}{' '}
            {t('matches.players')}
          </Text>
        </View>
      </View>

      <View style={styles.matchFooter}>
        <Text style={styles.hostText}>
          {t('matches.host')}: {match.host}
        </Text>
        <TouchableOpacity style={styles.joinButton} onPress={() => joinMatch(match.id)}>
          <Text style={styles.joinButtonText}>{t('matches.join')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>{t('home.welcomeTitle')}</Text>
          <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
        </View>

        <TouchableOpacity style={styles.createButton} onPress={createNewMatch}>
          <Ionicons name='add-circle' size={24} color='#fff' />
          <Text style={styles.createButtonText}>{t('home.createNewMatch')}</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔥 {t('home.activeMatches')}</Text>
          {matches.map(match => (
            <MatchCard key={match.id} match={match} />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 {t('home.todayStats')}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>{t('home.activeMatches')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>45</Text>
              <Text style={styles.statLabel}>{t('home.onlinePlayers')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>8</Text>
              <Text style={styles.statLabel}>{t('home.myMatches')}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Map App Selector Modal */}
      {selectedLocation && (
        <MapAppSelector
          visible={showMapSelector}
          onClose={() => {
            setShowMapSelector(false);
            setSelectedLocation(null);
          }}
          location={selectedLocation}
          onAppSelect={handleMapAppSelect}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1976d2',
    padding: 20,
    paddingTop: 60,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#e3f2fd',
    textAlign: 'center',
    marginTop: 5,
  },
  createButton: {
    backgroundColor: '#ff6b35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    margin: 20,
    borderRadius: 10,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  section: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  matchCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  matchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  matchTypeTag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchTypeText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: 'bold',
  },
  matchInfo: {
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  infoText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  locationText: {
    color: '#1976d2',
    fontWeight: '500',
  },
  locationChevron: {
    marginLeft: 'auto',
  },
  matchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hostText: {
    color: '#999',
    fontSize: 12,
  },
  joinButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
});

export default HomeScreen;
