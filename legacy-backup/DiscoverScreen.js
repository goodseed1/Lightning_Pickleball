/**
 * DiscoverScreen - 통합 탐색 화면
 * Lightning Tennis 앱의 통합 발견 허브
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  FlatList,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  Card,
  Title,
  Searchbar,
  Button,
  Chip,
  Avatar,
  FAB,
  ActivityIndicator as PaperActivityIndicator,
} from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import firestoreService from '../services/firestoreService';
import activityService from '../services/activityService';
import eventService from '../services/eventService';
import userService from '../services/userService';
import clubService from '../services/clubService';
import EventCard from '../components/events/EventCard';

// 탭 타입 정의
const TAB_TYPES = {
  EVENTS: 'events',
  PLAYERS: 'players',
  CLUBS: 'clubs',
  COACHES: 'coaches',
  SERVICES: 'services',
};

const DiscoverScreen = () => {
  const { currentLanguage } = useLanguage();
  const { currentUser } = useAuth();
  const navigation = useNavigation();

  const [activeTab, setActiveTab] = useState(TAB_TYPES.EVENTS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 데이터 상태들
  const [events, setEvents] = useState([]);
  const [players, setPlayers] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [filteredClubs, setFilteredClubs] = useState([]);

  // 사용자 신청 상태 관리
  const [userApplicationStatus, setUserApplicationStatus] = useState({});
  const [joinRequestLoading, setJoinRequestLoading] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(0);

  // 화면 포커스 시 데이터 로드
  useFocusEffect(
    useCallback(() => {
      loadTabData(activeTab);
    }, [activeTab])
  );

  // 탭 변경 시에도 데이터 새로고침
  useEffect(() => {
    if (activeTab === TAB_TYPES.CLUBS) {
      loadClubs();
    }
  }, [activeTab, currentUser?.uid]);

  // 검색어 변경 시 필터링
  useEffect(() => {
    if (activeTab === TAB_TYPES.PLAYERS) {
      filterPlayers();
    } else if (activeTab === TAB_TYPES.CLUBS) {
      filterClubs();
    }
  }, [searchQuery, players, clubs]);

  /**
   * 탭별 데이터 로드
   */
  const loadTabData = async tab => {
    setLoading(true);
    try {
      switch (tab) {
        case TAB_TYPES.EVENTS:
          await loadEvents();
          break;
        case TAB_TYPES.PLAYERS:
          await loadPlayers();
          break;
        case TAB_TYPES.CLUBS:
          await loadClubs();
          break;
        case TAB_TYPES.COACHES:
        case TAB_TYPES.SERVICES:
          // 플레이스홀더 탭들은 로딩 불필요
          break;
      }
    } catch (error) {
      console.error(`Error loading ${tab} data:`, error);
      Alert.alert(
        currentLanguage === 'ko' ? '오류' : 'Error',
        currentLanguage === 'ko' ? '데이터를 불러오는데 실패했습니다' : 'Failed to load data'
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * 이벤트 데이터 로드 (기존 MatchFeedScreen 로직 통합)
   */
  const loadEvents = async () => {
    try {
      console.log('📅 Loading events from Firestore...');

      // Firestore에서 실제 이벤트 데이터 가져오기
      const eventsData = await firestoreService.getAllLightningEvents({ status: 'upcoming' });
      console.log('Raw events from Firestore:', eventsData);

      if (eventsData && eventsData.length > 0) {
        // 이벤트 데이터 변환 및 필터링
        const transformedEvents = eventsData.map(event => ({
          id: event.id,
          title: event.title || 'Untitled Event',
          description: event.description || '',
          type: event.type || 'meetup',
          isRanked: event.type === 'match',
          hostId: event.hostId || '',
          hostName: event.hostName || 'Unknown Host',
          location: processLocation(event.location),
          scheduledTime: processTimestamp(event.scheduledTime),
          maxParticipants: event.maxParticipants || 2,
          participantIds: event.participantIds || event.participants || [],
          participantCount:
            event.participantCount || (event.participantIds || event.participants || []).length,
          skillLevel: convertNtrpToSkillLevel(event.ntrpLevel || event.skillLevel),
          ntrpLevel: event.ntrpLevel,
          gameType: event.gameType || 'singles',
          languages: Array.isArray(event.languages) ? event.languages : [],
          autoApproval: Boolean(event.autoApproval),
          participationFee: event.participationFee || 0,
          status: event.status || 'upcoming',
          createdAt: processTimestamp(event.createdAt),
        }));

        // 활성 상태 필터링 및 거리 계산
        const activeEvents = transformedEvents.filter(
          event => event.status === 'active' || event.status === 'upcoming'
        );

        const filteredEvents = filterEventsByDistance(activeEvents);
        setEvents(filteredEvents);

        // 사용자 신청 상태 확인
        if (currentUser?.uid && filteredEvents.length > 0) {
          await loadUserApplicationStatus(filteredEvents);
        }

        console.log(`✅ Loaded ${filteredEvents.length} events`);
      } else {
        setEvents([]);
        console.log('No events found in Firestore');
      }
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);

      if (__DEV__) {
        const isPermissionError =
          error.message.includes('permission') || error.message.includes('insufficient');
        if (!global._firebaseAlertShown) {
          global._firebaseAlertShown = true;
          Alert.alert(
            currentLanguage === 'ko' ? '개발 모드 안내' : 'Development Mode Info',
            isPermissionError
              ? currentLanguage === 'ko'
                ? `Firebase 권한 오류가 감지되었습니다.\n\n현재 mock 데이터로 작동 중입니다.\n\n실제 Firestore 연결을 원하면:\n1. Firebase 프로젝트 설정 확인\n2. .env 파일에 Firebase 키 추가\n3. Firestore 보안 규칙 설정\n\n에러: ${error.message}`
                : `Firebase permission error detected.\n\nCurrently running with mock data.\n\nTo connect to real Firestore:\n1. Check Firebase project setup\n2. Add Firebase keys to .env file\n3. Configure Firestore security rules\n\nError: ${error.message}`
              : currentLanguage === 'ko'
                ? `Firestore 연결 오류: ${error.message}\n\nFirebase 설정을 확인해주세요.`
                : `Firestore connection error: ${error.message}\n\nPlease check Firebase configuration.`
          );
        }
      }
    }
  };

  /**
   * 플레이어 데이터 로드 (신규 구현)
   */
  const loadPlayers = async () => {
    try {
      console.log('👥 Loading players...');

      // 추천 플레이어 조회 (비슷한 NTRP 레벨)
      const recommendedPlayers = await getRecommendedPlayers();
      setPlayers(recommendedPlayers);

      console.log(`✅ Loaded ${recommendedPlayers.length} players`);
    } catch (error) {
      console.error('Error loading players:', error);

      // Mock 데이터 사용
      const mockPlayers = getMockPlayers();
      setPlayers(mockPlayers);
      console.log(`✅ Using ${mockPlayers.length} mock players`);
    }
  };

  /**
   * 클럽 데이터 로드 (기존 FindClubScreen 로직 통합)
   */
  const loadClubs = async () => {
    try {
      console.log('🏢 Loading clubs...');

      const publicClubs = await clubService.searchPublicClubs('');
      console.log(
        '📋 Public clubs found:',
        publicClubs.map(c => ({ name: c.name, id: c.id }))
      );

      // 사용자의 가입 상태 확인
      if (currentUser?.uid) {
        const clubsWithStatus = await Promise.all(
          publicClubs.map(async club => {
            try {
              const userStatus = await clubService.getUserClubStatus(club.id, currentUser.uid);
              console.log(
                `🔍 Club ${club.name} (${club.id}) status for user ${currentUser.uid}:`,
                userStatus
              );
              return { ...club, userStatus };
            } catch (error) {
              console.error(`❌ Error getting status for club ${club.name} (${club.id}):`, error);
              return { ...club, userStatus: 'none' };
            }
          })
        );
        setClubs(clubsWithStatus);
        console.log(
          '✅ Clubs with status:',
          clubsWithStatus.map(c => ({ name: c.name, status: c.userStatus }))
        );
      } else {
        setClubs(publicClubs.map(club => ({ ...club, userStatus: 'none' })));
      }

      console.log(`✅ Loaded ${publicClubs.length} clubs`);
    } catch (error) {
      console.error('Error loading clubs:', error);

      // Mock 데이터 사용
      const mockClubs = getMockClubs();
      setClubs(mockClubs);
      console.log(`✅ Using ${mockClubs.length} mock clubs`);
    }
  };

  /**
   * 새로고침 핸들러
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadTabData(activeTab);
    setRefreshing(false);
  };

  /**
   * 사용자 신청 상태 로드
   */
  const loadUserApplicationStatus = async eventList => {
    if (!currentUser?.uid) return;

    try {
      const statusPromises = eventList.map(async event => {
        const status = await activityService.getUserApplicationStatus(event.id, currentUser.uid);
        return { eventId: event.id, status };
      });

      const statuses = await Promise.all(statusPromises);

      const statusMap = {};
      statuses.forEach(({ eventId, status }) => {
        statusMap[eventId] = status;
      });

      setUserApplicationStatus(statusMap);
    } catch (error) {
      console.error('❌ Error loading user application status:', error);
    }
  };

  /**
   * 추천 플레이어 조회
   */
  const getRecommendedPlayers = async () => {
    if (!currentUser?.uid) return getMockPlayers();

    try {
      // 현재 사용자와 비슷한 NTRP 레벨의 플레이어들 조회
      const userLevel = currentUser.ntrpLevel;
      const maxDistance = currentUser.maxTravelDistance || 50;

      // 실제로는 Firestore에서 쿼리
      // 여기서는 mock 데이터 반환
      return getMockPlayers();
    } catch (error) {
      console.error('Error getting recommended players:', error);
      return getMockPlayers();
    }
  };

  /**
   * 플레이어 필터링
   */
  const filterPlayers = () => {
    if (!searchQuery.trim()) {
      setFilteredPlayers(players);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = players.filter(
      player =>
        player.nickname.toLowerCase().includes(query) ||
        player.location.toLowerCase().includes(query) ||
        player.skillLevel.toLowerCase().includes(query)
    );

    setFilteredPlayers(filtered);
  };

  /**
   * 클럽 필터링
   */
  const filterClubs = () => {
    if (!searchQuery.trim()) {
      setFilteredClubs(clubs);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = clubs.filter(
      club =>
        club.name.toLowerCase().includes(query) ||
        club.location.toLowerCase().includes(query) ||
        club.description.toLowerCase().includes(query) ||
        (club.tags && club.tags.some(tag => tag.toLowerCase().includes(query)))
    );

    setFilteredClubs(filtered);
  };

  /**
   * 이벤트 참가 핸들러
   */
  const handleJoinEvent = async event => {
    const isMatch = event.type === 'match';
    const typeLabel =
      currentLanguage === 'ko'
        ? isMatch
          ? '번개 매치'
          : '번개 모임'
        : isMatch
          ? 'Lightning Match'
          : 'Lightning Meetup';

    Alert.alert(
      currentLanguage === 'ko' ? '참가 확인' : 'Join Confirmation',
      currentLanguage === 'ko'
        ? `"${event.title}" ${typeLabel}에 참가하시겠습니까?`
        : `Would you like to join "${event.title}" ${typeLabel}?`,
      [
        {
          text: currentLanguage === 'ko' ? '취소' : 'Cancel',
          style: 'cancel',
        },
        {
          text: currentLanguage === 'ko' ? '참가' : 'Join',
          onPress: () => confirmJoinEvent(event),
        },
      ]
    );
  };

  /**
   * 이벤트 참가 확인
   */
  const confirmJoinEvent = async event => {
    try {
      if (!currentUser?.uid) {
        Alert.alert(
          currentLanguage === 'ko' ? '오류' : 'Error',
          currentLanguage === 'ko' ? '로그인이 필요합니다.' : 'Please log in first.'
        );
        return;
      }

      const applicantName =
        currentUser.displayName ||
        currentUser.nickname ||
        currentUser.name ||
        currentUser.firstName ||
        (currentUser.email ? currentUser.email.split('@')[0] : null) ||
        `테니스유저${currentUser.uid.substring(0, 4)}`;

      const applicationId = await activityService.applyToEvent(
        event.id,
        currentUser.uid,
        currentLanguage === 'ko' ? '참가하고 싶습니다!' : 'I would like to join!',
        applicantName,
        currentUser
      );

      Alert.alert(
        currentLanguage === 'ko' ? '신청 완료' : 'Application Submitted',
        currentLanguage === 'ko'
          ? '참가 신청이 완료되었습니다. 호스트의 승인을 기다려주세요.'
          : 'Your application has been submitted. Please wait for host approval.'
      );

      // 신청 상태 즉시 업데이트
      setUserApplicationStatus(prev => ({
        ...prev,
        [event.id]: {
          hasApplied: true,
          applicationId: applicationId,
          status: 'pending',
        },
      }));

      // 이벤트 목록 새로고침
      await loadEvents();
    } catch (error) {
      console.error('Error applying to event:', error);
      Alert.alert(
        currentLanguage === 'ko' ? '오류' : 'Error',
        currentLanguage === 'ko'
          ? '참가 신청 중 오류가 발생했습니다. 다시 시도해주세요.'
          : 'Failed to submit application. Please try again.'
      );
    }
  };

  /**
   * 클럽 가입 신청 핸들러
   */
  const handleJoinClub = async club => {
    if (!currentUser?.uid) {
      Alert.alert(
        currentLanguage === 'ko' ? '알림' : 'Notice',
        currentLanguage === 'ko' ? '로그인이 필요합니다.' : 'Please log in first.'
      );
      return;
    }

    if (club.userStatus === 'member') {
      Alert.alert(
        currentLanguage === 'ko' ? '알림' : 'Notice',
        currentLanguage === 'ko' ? '이미 가입된 클럽입니다.' : 'Already a member of this club.'
      );
      return;
    }

    if (club.userStatus === 'pending') {
      Alert.alert(
        currentLanguage === 'ko' ? '알림' : 'Notice',
        currentLanguage === 'ko' ? '이미 가입 신청 중입니다.' : 'Join request already submitted.'
      );
      return;
    }

    Alert.alert(
      currentLanguage === 'ko' ? '클럽 가입 신청' : 'Join Club',
      currentLanguage === 'ko'
        ? `${club.name}에 가입 신청하시겠습니까?`
        : `Would you like to join ${club.name}?`,
      [
        {
          text: currentLanguage === 'ko' ? '취소' : 'Cancel',
          style: 'cancel',
        },
        {
          text: currentLanguage === 'ko' ? '신청하기' : 'Join',
          onPress: async () => {
            // 클럽 상태 업데이트 함수
            const updateClubStatus = status => {
              console.log(`🔄 Updating club ${club.name} status to: ${status}`);

              setClubs(prevClubs => {
                const updated = prevClubs.map(c =>
                  c.id === club.id ? { ...c, userStatus: status } : c
                );
                console.log(
                  '📝 Updated clubs state:',
                  updated.map(c => ({ name: c.name, status: c.userStatus }))
                );
                return updated;
              });

              setFilteredClubs(prevFiltered => {
                const updated = prevFiltered.map(c =>
                  c.id === club.id ? { ...c, userStatus: status } : c
                );
                console.log(
                  '📝 Updated filteredClubs state:',
                  updated.map(c => ({ name: c.name, status: c.userStatus }))
                );
                return updated;
              });
            };

            try {
              setJoinRequestLoading(club.id);

              // 즉시 pending 상태로 변경
              updateClubStatus('pending');

              // 강제 리렌더링
              setForceUpdate(prev => prev + 1);

              // 상태 업데이트 확인
              setTimeout(() => {
                console.log(
                  '🔍 After update - checking club status in state:',
                  clubs.find(c => c.id === club.id)?.userStatus,
                  filteredClubs.find(c => c.id === club.id)?.userStatus
                );
              }, 100);

              console.log('🎯 Submitting join request for club:', {
                clubId: club.id,
                clubName: club.name,
                userId: currentUser.uid,
              });

              await clubService.requestToJoinClub(club.id, currentUser.uid);

              Alert.alert(
                currentLanguage === 'ko' ? '완료' : 'Success',
                currentLanguage === 'ko'
                  ? '가입 신청이 완료되었습니다. 클럽 관리자의 승인을 기다려주세요.'
                  : 'Join request submitted. Please wait for admin approval.'
              );

              console.log(`✅ Successfully updated club ${club.name} status to pending`);
            } catch (error) {
              console.error('Error requesting to join club:', error);

              // 오류 발생 시 상태 롤백
              updateClubStatus('none');

              Alert.alert(
                currentLanguage === 'ko' ? '오류' : 'Error',
                currentLanguage === 'ko'
                  ? '가입 신청 중 오류가 발생했습니다.'
                  : 'Error occurred while submitting join request.'
              );
            } finally {
              setJoinRequestLoading(null);
            }
          },
        },
      ]
    );
  };

  /**
   * 탭 버튼들 렌더링
   */
  const renderTabButtons = () => {
    console.log('🔍 Rendering tab buttons with all 5 tabs'); // Debug log

    const tabs = [
      {
        key: TAB_TYPES.EVENTS,
        emoji: '🎾',
        label: currentLanguage === 'ko' ? '이벤트' : 'Events',
      },
      {
        key: TAB_TYPES.PLAYERS,
        emoji: '👥',
        label: currentLanguage === 'ko' ? '플레이어' : 'Players',
      },
      {
        key: TAB_TYPES.CLUBS,
        emoji: '🏢',
        label: currentLanguage === 'ko' ? '클럽' : 'Clubs',
      },
      {
        key: TAB_TYPES.COACHES,
        emoji: '🎓',
        label: currentLanguage === 'ko' ? '코치' : 'Coaches',
      },
      {
        key: TAB_TYPES.SERVICES,
        emoji: '🛠️',
        label: currentLanguage === 'ko' ? '서비스' : 'Services',
      },
    ];

    console.log('📊 Total tabs to render:', tabs.length); // Debug log

    return (
      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={styles.tabEmoji}>{tab.emoji}</Text>
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  /**
   * 검색바 렌더링
   */
  const renderSearchBar = () => {
    if (
      activeTab === TAB_TYPES.EVENTS ||
      activeTab === TAB_TYPES.COACHES ||
      activeTab === TAB_TYPES.SERVICES
    ) {
      return null;
    }

    const placeholder =
      activeTab === TAB_TYPES.PLAYERS
        ? currentLanguage === 'ko'
          ? '플레이어 닉네임으로 검색...'
          : 'Search players by nickname...'
        : currentLanguage === 'ko'
          ? '클럽 이름, 지역으로 검색...'
          : 'Search clubs by name, location...';

    return (
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder={placeholder}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
        />
      </View>
    );
  };

  /**
   * 탭 컨텐츠 렌더링
   */
  const renderTabContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#1976d2' />
          <Text style={styles.loadingText}>
            {currentLanguage === 'ko' ? '데이터를 불러오는 중...' : 'Loading data...'}
          </Text>
        </View>
      );
    }

    switch (activeTab) {
      case TAB_TYPES.EVENTS:
        return renderEventsTab();
      case TAB_TYPES.PLAYERS:
        return renderPlayersTab();
      case TAB_TYPES.CLUBS:
        return renderClubsTab();
      case TAB_TYPES.COACHES:
        return renderComingSoonTab('🎓', '코치', 'Coaches');
      case TAB_TYPES.SERVICES:
        return renderComingSoonTab('🛠️', '라켓 서비스', 'Racket Services');
      default:
        return null;
    }
  };

  /**
   * 이벤트 탭 렌더링
   */
  const renderEventsTab = () => {
    if (events.length === 0) {
      return renderEmptyState('🎾', '이벤트가 없습니다', 'No events available');
    }

    return <View style={styles.contentContainer}>{events.map(renderEventCard)}</View>;
  };

  /**
   * 플레이어 탭 렌더링
   */
  const renderPlayersTab = () => {
    const playersToShow = filteredPlayers.length > 0 ? filteredPlayers : players;

    if (playersToShow.length === 0) {
      return renderEmptyState('👥', '플레이어가 없습니다', 'No players found');
    }

    return (
      <FlatList
        data={playersToShow}
        renderItem={renderPlayerCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  /**
   * 클럽 탭 렌더링
   */
  const renderClubsTab = () => {
    // 검색어가 있을 때는 필터된 결과, 없을 때는 전체 클럽 목록 사용
    const clubsToShow = searchQuery.trim() ? filteredClubs : clubs;

    console.log('🎯 Clubs to show:', {
      searchQuery: searchQuery,
      clubsCount: clubs.length,
      filteredCount: filteredClubs.length,
      showing: clubsToShow.length,
      clubsWithStatus: clubsToShow.map(c => ({ name: c.name, status: c.userStatus })),
    });

    if (clubsToShow.length === 0) {
      return renderEmptyState('🏢', '클럽이 없습니다', 'No clubs found');
    }

    return (
      <FlatList
        data={clubsToShow}
        renderItem={renderClubCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  /**
   * Coming Soon 탭 렌더링
   */
  const renderComingSoonTab = (icon, titleKo, titleEn) => (
    <View style={styles.comingSoonContainer}>
      <Text style={styles.comingSoonIcon}>{icon}</Text>
      <Text style={styles.comingSoonTitle}>{currentLanguage === 'ko' ? titleKo : titleEn}</Text>
      <Text style={styles.comingSoonText}>
        {currentLanguage === 'ko' ? 'Coming Soon!' : 'Coming Soon!'}
      </Text>
      <Text style={styles.comingSoonDescription}>
        {currentLanguage === 'ko'
          ? '곧 제공될 예정입니다.\n기대해주세요!'
          : 'This feature will be available soon.\nStay tuned!'}
      </Text>
    </View>
  );

  /**
   * 빈 상태 렌더링
   */
  const renderEmptyState = (icon, titleKo, titleEn) => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{currentLanguage === 'ko' ? titleKo : titleEn}</Text>
    </View>
  );

  // 헬퍼 함수들
  const processLocation = location => {
    if (typeof location === 'string') {
      return {
        name: location,
        address: location,
        lat: 0,
        lng: 0,
      };
    } else if (location && typeof location === 'object') {
      return {
        name: location.name || location.address || 'Unknown Location',
        address: location.address || location.name || '',
        lat: location.lat || 0,
        lng: location.lng || 0,
      };
    } else {
      return {
        name: 'Unknown Location',
        address: '',
        lat: 0,
        lng: 0,
      };
    }
  };

  const processTimestamp = timestamp => {
    if (!timestamp) return new Date();

    if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }

    if (timestamp instanceof Date) {
      return timestamp;
    }

    const parsedDate = new Date(timestamp);
    return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  };

  const convertNtrpToSkillLevel = ntrpLevel => {
    if (!ntrpLevel) return 'All Levels';

    const levels = ntrpLevel.split(',').map(level => level.trim());

    if (levels.length === 1) {
      const level = levels[0];
      switch (level) {
        case '1.0-2.5':
          return 'Beginner (1.0-2.5)';
        case '3.0-3.5':
          return 'Intermediate (3.0-3.5)';
        case '4.0-4.5':
          return 'Advanced (4.0-4.5)';
        case '5.0+':
          return 'Expert (5.0+)';
        case 'any':
          return 'All Levels';
        default:
          return level;
      }
    } else {
      return levels
        .map(level => {
          switch (level) {
            case '1.0-2.5':
              return 'Beginner';
            case '3.0-3.5':
              return 'Intermediate';
            case '4.0-4.5':
              return 'Advanced';
            case '5.0+':
              return 'Expert';
            case 'any':
              return 'All Levels';
            default:
              return level;
          }
        })
        .join(', ');
    }
  };

  const filterEventsByDistance = events => {
    if (!currentUser?.location || !currentUser?.maxTravelDistance) {
      return events;
    }

    const { lat: userLat, lng: userLng } = currentUser.location;
    const maxDistance = currentUser.maxTravelDistance;

    return events.filter(event => {
      if (!event.location.lat || !event.location.lng) {
        return true;
      }

      const distance = calculateDistance(userLat, userLng, event.location.lat, event.location.lng);

      event.distance = Math.round(distance * 10) / 10;
      return distance <= maxDistance;
    });
  };

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 3959; // 지구 반지름 (마일)
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Mock 데이터 함수들
  const getMockPlayers = () => [
    {
      id: '1',
      nickname: 'TennisAce',
      skillLevel: 'Intermediate (3.5)',
      location: 'Manhattan',
      distance: '1.2 miles',
      isOnline: true,
      matchesPlayed: 45,
      rating: 4.8,
      profileImage: null,
    },
    {
      id: '2',
      nickname: 'CourtRunner',
      skillLevel: 'Advanced (4.5)',
      location: 'Brooklyn',
      distance: '3.7 miles',
      isOnline: false,
      matchesPlayed: 78,
      rating: 4.6,
      profileImage: null,
    },
  ];

  const getMockClubs = () => [
    {
      id: '1',
      name: 'Manhattan Tennis Club',
      description: '도심 속 테니스 클럽',
      location: 'Manhattan, NY',
      memberCount: 124,
      maxMembers: 200,
      isPublic: true,
      tags: ['초보자환영', '주말활동'],
      userStatus: 'none',
    },
    {
      id: '2',
      name: 'Brooklyn Heights Tennis',
      description: '가족 친화적인 테니스 커뮤니티',
      location: 'Brooklyn Heights, NY',
      memberCount: 89,
      maxMembers: 150,
      isPublic: true,
      tags: ['가족친화', '레슨제공'],
      userStatus: 'none',
    },
  ];

  // 렌더링 함수들은 다음 부분에서 계속...
  const renderEventCard = event => {
    // EventCard 렌더링 로직 (기존 DiscoverScreen.tsx에서 가져옴)
    return (
      <View key={event.id} style={styles.eventCard}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.eventDetails}>
          {event.location.name} • {event.scheduledTime.toLocaleDateString()}
        </Text>
        <Button mode='contained' onPress={() => handleJoinEvent(event)} style={styles.joinButton}>
          {currentLanguage === 'ko' ? '참가하기' : 'Join'}
        </Button>
      </View>
    );
  };

  const renderPlayerCard = ({ item: player }) => (
    <Card style={styles.playerCard}>
      <View style={styles.playerContent}>
        <Avatar.Text size={50} label={player.nickname.charAt(0)} style={styles.playerAvatar} />
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{player.nickname}</Text>
          <Text style={styles.playerSkill}>{player.skillLevel}</Text>
          <Text style={styles.playerLocation}>{player.location}</Text>
          {player.isOnline && (
            <Chip compact style={styles.onlineChip} textStyle={styles.onlineText}>
              {currentLanguage === 'ko' ? '온라인' : 'Online'}
            </Chip>
          )}
        </View>
        <Button
          mode='outlined'
          onPress={() =>
            navigation.navigate('UserProfile', {
              userId: player.id,
              nickname: player.nickname,
            })
          }
          compact
        >
          {currentLanguage === 'ko' ? '프로필' : 'Profile'}
        </Button>
      </View>
    </Card>
  );

  const renderClubCard = ({ item: club }) => {
    // 테스트: K club인 경우 강제로 pending 상태로 설정
    const testClub = club.name === 'K club' ? { ...club, userStatus: 'pending' } : club;

    // 디버깅을 위한 로그 추가
    console.log(`🏢 Rendering club card for ${testClub.name}:`, {
      clubId: testClub.id,
      originalStatus: club.userStatus,
      testStatus: testClub.userStatus,
      currentUserId: currentUser?.uid,
    });

    const getStatusButtonProps = () => {
      console.log(
        `🔍 Getting status button props for club ${testClub.name}, userStatus: ${testClub.userStatus}`
      );

      switch (testClub.userStatus) {
        case 'member':
          return {
            title: currentLanguage === 'ko' ? '가입 완료' : 'Member',
            disabled: true,
            mode: 'outlined',
            buttonColor: '#4caf50',
            textColor: '#4caf50',
          };
        case 'pending':
          return {
            title: currentLanguage === 'ko' ? '승인 대기 중' : 'Pending',
            disabled: true,
            mode: 'outlined',
            buttonColor: '#ff9800',
            textColor: '#ff9800',
          };
        case 'declined':
          return {
            title: currentLanguage === 'ko' ? '가입 거절됨' : 'Declined',
            disabled: true,
            mode: 'outlined',
            buttonColor: '#f44336',
            textColor: '#f44336',
          };
        default:
          console.log(
            `⚠️ Default case for club ${testClub.name}, userStatus: "${testClub.userStatus}" (type: ${typeof testClub.userStatus})`
          );
          return {
            title: currentLanguage === 'ko' ? '가입하기' : 'Join',
            disabled: false,
            mode: 'contained',
            buttonColor: '#1976d2',
            textColor: '#fff',
          };
      }
    };

    const statusProps = getStatusButtonProps();

    return (
      <Card style={styles.clubCard}>
        <TouchableOpacity
          onPress={() => {
            console.log('🔗 Navigating to ClubDetail with clubId:', club.id);
            navigation.navigate('ClubDetail', { clubId: club.id });
          }}
          activeOpacity={0.7}
        >
          <View style={styles.clubContent}>
            <View style={styles.clubLogoPlaceholder}>
              <Ionicons name='basketball' size={28} color='#fff' />
            </View>

            <View style={styles.clubInfo}>
              <Text style={styles.clubName}>{club.name}</Text>
              <Text style={styles.clubDescription}>{club.description}</Text>
              <Text style={styles.clubLocation}>📍 {club.location}</Text>
              <Text style={styles.clubMembers}>
                👥 {club.memberCount}/{club.maxMembers}명
              </Text>

              {club.tags && club.tags.length > 0 && (
                <View style={styles.clubTags}>
                  {club.tags.slice(0, 2).map((tag, index) => (
                    <Chip key={index} compact style={styles.clubTag} textStyle={styles.clubTagText}>
                      {tag}
                    </Chip>
                  ))}
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.clubActions}>
          <Button
            mode={statusProps.mode}
            onPress={() => handleJoinClub(club)}
            disabled={statusProps.disabled || joinRequestLoading === club.id}
            loading={joinRequestLoading === club.id}
            buttonColor={statusProps.mode === 'contained' ? statusProps.buttonColor : 'transparent'}
            textColor={statusProps.textColor}
            compact
          >
            {statusProps.title}
          </Button>
          {/* 디버깅용 텍스트 */}
          <Text style={{ fontSize: 10, color: '#999', marginTop: 4 }}>
            Status: {testClub.userStatus || 'undefined'}{' '}
            {testClub.name === 'K club' ? '(FORCED PENDING)' : ''}
          </Text>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>🔍 {currentLanguage === 'ko' ? '발견' : 'Discover'}</Text>
        <Text style={styles.subtitle}>
          {currentLanguage === 'ko'
            ? '새로운 이벤트, 플레이어, 클럽을 찾아보세요'
            : 'Find new events, players, and clubs'}
        </Text>
      </View>

      {/* 탭 버튼들 */}
      {renderTabButtons()}

      {/* 검색바 */}
      {renderSearchBar()}

      {/* 컨텐츠 */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {renderTabContent()}
      </ScrollView>

      {/* FAB - 이벤트 탭에서만 표시 */}
      {activeTab === TAB_TYPES.EVENTS && (
        <FAB
          icon='plus'
          style={styles.fab}
          onPress={() => navigation.navigate('CreateFlow')}
          label={currentLanguage === 'ko' ? '새 매치' : 'New Match'}
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
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  tabContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabsContent: {
    paddingHorizontal: 8,
  },
  tab: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    marginHorizontal: 2,
    borderRadius: 8,
    minWidth: 70,
  },
  activeTab: {
    backgroundColor: '#e3f2fd',
  },
  tabEmoji: {
    fontSize: 20,
    textAlign: 'center',
  },
  tabText: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#1976d2',
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#f5f5f5',
  },
  searchInput: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  listContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  comingSoonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 100,
  },
  comingSoonIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  comingSoonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 16,
    textAlign: 'center',
  },
  comingSoonDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  // 이벤트 카드 스타일
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  eventDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  joinButton: {
    alignSelf: 'flex-start',
  },
  // 플레이어 카드 스타일
  playerCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  playerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  playerAvatar: {
    backgroundColor: '#1976d2',
    marginRight: 16,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  playerSkill: {
    fontSize: 14,
    color: '#1976d2',
    marginBottom: 2,
  },
  playerLocation: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  onlineChip: {
    backgroundColor: '#4caf50',
    alignSelf: 'flex-start',
  },
  onlineText: {
    color: '#fff',
    fontSize: 10,
  },
  // 클럽 카드 스타일
  clubCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  clubContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  clubLogoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  clubDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  clubLocation: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  clubMembers: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  clubTags: {
    flexDirection: 'row',
    gap: 4,
  },
  clubTag: {
    backgroundColor: '#e3f2fd',
    height: 20,
  },
  clubTagText: {
    fontSize: 10,
    color: '#1976d2',
  },
  clubActions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: 'flex-end',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#1976d2',
  },
});

export default DiscoverScreen;
