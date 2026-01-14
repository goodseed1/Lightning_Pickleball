/**
 * 🏛️ OLYMPUS MISSION - Phase 1.1: User Search Modal
 * Modal component for searching and selecting users to add as tournament participants
 *
 * 📝 LTR (Lightning Tennis Rating) System
 * - LTR uses integer scale (1-10) for skill matching
 * - Partner filtering uses ±1 tolerance for close skill matching
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';
import { useTheme } from '../../hooks/useTheme';
import clubService from '../../services/clubService';
import userService from '../../services/userService'; // 🎯 [OPERATION DUO - PHASE 4.7] For getAllUsers

interface User {
  uid: string;
  displayName: string;
  photoURL?: string;
  email?: string;
  gender?: string; // 🎯 [OPERATION DUO - PHASE 4.5 PART 2] Gender for filtering
  ltrLevel?: string; // 🔒 [PRIVACY] LTR rating for display instead of email
  // 🎯 [KIM FIX v19] Game-type specific LTR (1-10 scale)
  singlesLtr?: number;
  doublesLtr?: number;
  mixedLtr?: number;
  // 🎯 Distance and location for partner search
  distance?: number; // Distance in km
  location?: { lat: number; lng: number }; // User's location coordinates
}

interface UserSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onUserSelect: (users: User[]) => void; // 🆕 Changed to support multiple users
  excludeUserIds?: string[]; // IDs of users already in the tournament
  clubId?: string; // 🎯 [OPERATION DUO - PHASE 4.7] Optional: Club ID (if undefined, searches all users)
  isLoading?: boolean; // Loading state to disable user selection
  tournamentFormat?: 'singles' | 'doubles'; // 🆕 Tournament format (singles or doubles)
  // 🆕 Callback for doubles team pairing - receives players and auto-generated teams
  onTeamPairingRequired?: (
    players: User[],
    teams: Array<{ id: string; player1: User; player2: User }>
  ) => void;
  genderFilter?: 'male' | 'female' | null; // 🎯 [OPERATION DUO - PHASE 4.5 PART 2] Filter by gender
  // 🎯 [KIM FIX] Match LTR requirements for partner selection
  gameType?: string; // e.g., 'mens_doubles', 'womens_singles', 'mixed_doubles'
  hostLtr?: number; // Host's LTR level for ±2 filtering (LTR scale 1-10)
  isPartnerSelection?: boolean; // 🎯 [LTR FIX] True for partner selection (shows different title)
  hostTeamLtr?: number; // 🎯 [LTR FIX v6] Host team's combined LTR for doubles display (e.g., 6)
}

const UserSearchModal: React.FC<UserSearchModalProps> = ({
  visible,
  onClose,
  onUserSelect,
  excludeUserIds = [],
  clubId,
  isLoading = false,
  tournamentFormat = 'singles', // 🆕 Default to singles
  onTeamPairingRequired, // 🆕 Doubles team pairing callback
  genderFilter = null, // 🎯 [OPERATION DUO - PHASE 4.5 PART 2] Gender filter
  gameType, // 🎯 [KIM FIX] Game type for LTR display
  hostLtr, // 🎯 [KIM FIX] Host LTR for filtering
  isPartnerSelection = false, // 🎯 [LTR FIX] Partner selection shows different title
  hostTeamLtr, // 🎯 [LTR FIX v6] Host team's combined LTR for doubles display
}) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { location: currentLocation } = useLocation(); // Get current user location
  const { paperTheme: theme } = useTheme();

  // 🎯 Check if user's country uses imperial units (miles)
  // US uses miles, rest of the world uses kilometers
  // Note: country can be "US" or "United States" depending on geocoding source
  const countryValue = currentLocation?.country?.toLowerCase() || '';
  const useImperialUnits = countryValue === 'us' || countryValue === 'united states';
  const KM_TO_MILES = 0.621371;

  // 🎯 [2025.01 RULE CHANGE] LTR tolerance varies by game type:
  // - Doubles/Mixed: ±2 (more relaxed for team play)
  // - Singles: 0~+1 only (host can only invite equal or 1 level higher)
  const getLtrTolerance = (): { minDiff: number; maxDiff: number } => {
    const gt = (gameType || '').toLowerCase();
    const isSingles = gt.includes('singles');

    if (isSingles) {
      // Singles: Host can invite players at same level (0) or 1 level higher (+1)
      // Cannot invite lower level players (no negative tolerance)
      return { minDiff: 0, maxDiff: 1 };
    } else {
      // Doubles/Mixed: ±2 tolerance
      return { minDiff: -2, maxDiff: 2 };
    }
  };

  // 🎯 Distance calculation helper - Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // 🎯 [KIM FIX v19] Get game-type-specific LTR for a user
  const getUserLtrForGameType = (user: User): number | undefined => {
    if (!gameType) return undefined;

    const gt = gameType.toLowerCase();
    if (gt.includes('singles')) {
      return user.singlesLtr;
    } else if (gt === 'mixed_doubles' || gt.includes('mixed')) {
      return user.mixedLtr;
    } else if (gt.includes('doubles')) {
      return user.doublesLtr;
    }
    return undefined;
  };

  // 🎯 [2025.01 RULE CHANGE] Check if user is within LTR range
  // - Doubles/Mixed: ±2 tolerance
  // - Singles: 0~+1 only (host can invite equal or higher level only)
  // 🎯 [LTR FIX v7] For partner selection in doubles:
  //    - hostTeamLtr = host team's combined LTR (e.g., 6)
  //    - hostLtr = current user's LTR (e.g., 철수 = 4)
  //    - allowed team range = hostTeamLtr ± 2 (e.g., 4~8)
  //    - partner LTR range = (minTeam - hostLtr) ~ (maxTeam - hostLtr) (e.g., 0~4)
  const isUserWithinLtrRange = (user: User): boolean => {
    const gt = (gameType || '').toLowerCase();
    const isDoubles = gt.includes('doubles');

    // 🎯 [LTR FIX v7] For partner selection in doubles, use team-based filtering
    if (isPartnerSelection && isDoubles && hostTeamLtr !== undefined && hostLtr !== undefined) {
      const userLtr = getUserLtrForGameType(user);
      if (userLtr === undefined) return true; // Allow if no LTR data

      // Calculate allowed team LTR range
      const minTeam = Math.max(2, hostTeamLtr - 2); // Min team LTR is 2 (1+1)
      const maxTeam = Math.min(20, hostTeamLtr + 2); // Max team LTR is 20 (10+10)

      // Calculate partner LTR range based on current user's LTR
      // Team LTR = hostLtr (me) + partnerLtr
      // So partnerLtr must be in range: (minTeam - hostLtr) ~ (maxTeam - hostLtr)
      const minPartnerLtr = Math.max(1, minTeam - hostLtr); // LTR can't be less than 1
      const maxPartnerLtr = Math.min(10, maxTeam - hostLtr); // LTR can't exceed 10

      console.log(
        `🎾 [LTR FIX v7] Partner filter: hostTeamLtr=${hostTeamLtr}, myLtr=${hostLtr}, ` +
          `teamRange=${minTeam}~${maxTeam}, partnerRange=${minPartnerLtr}~${maxPartnerLtr}, ` +
          `candidate=${user.displayName}(LTR ${userLtr})`
      );

      return userLtr >= minPartnerLtr && userLtr <= maxPartnerLtr;
    }

    // Original logic for non-partner-selection cases
    if (hostLtr === undefined) return true; // No filtering if no hostLtr

    const userLtr = getUserLtrForGameType(user);
    if (userLtr === undefined) return true; // Allow if no LTR data

    const { minDiff, maxDiff } = getLtrTolerance();
    const diff = userLtr - hostLtr; // Positive = user is higher level

    // For singles: diff must be >= 0 (equal) and <= 1 (one level higher)
    // For doubles: diff must be >= -2 and <= 2
    return diff >= minDiff && diff <= maxDiff;
  };

  // 🎯 [2025.01 RULE CHANGE] Get LTR range text for display
  // 🎯 [LTR FIX v7] For partner selection in doubles, show team LTR range
  const getLtrRangeText = (): string => {
    const gt = (gameType || '').toLowerCase();
    const isSingles = gt.includes('singles');
    const isDoubles = gt.includes('doubles');

    // 🎯 [LTR FIX v7] For partner selection in doubles, show TEAM LTR range
    if (isPartnerSelection && isDoubles && hostTeamLtr !== undefined) {
      // hostTeamLtr is the host team's combined LTR (e.g., 영철3 + 회장3 = 6)
      // Team range is hostTeamLtr ± 2 (e.g., 6 → 4~8)
      const minTeam = Math.max(2, hostTeamLtr - 2); // Min team LTR is 2 (1+1)
      const maxTeam = Math.min(20, hostTeamLtr + 2); // Max team LTR is 20 (10+10)
      return `${t('eventCard.labels.doublesTeam')} LTR ${minTeam}~${maxTeam}`;
    }

    if (hostLtr === undefined) return '';

    const { minDiff, maxDiff } = getLtrTolerance();

    if (isSingles) {
      // Singles: Show "LTR X~Y" where X = hostLtr, Y = hostLtr + 1
      return `LTR ${Math.round(hostLtr)}~${Math.round(hostLtr + 1)}`;
    } else {
      // Doubles/Mixed: Show "LTR X~Y" where X = hostLtr - 2, Y = hostLtr + 2
      return `LTR ${Math.round(hostLtr + minDiff)}~${Math.round(hostLtr + maxDiff)}`;
    }
  };

  // 🎯 [KIM FIX] Get formatted game type label
  // ⚠️ IMPORTANT: Check 'womens' BEFORE 'mens' because 'womens' contains 'mens'!
  const getGameTypeLabel = (): string => {
    if (!gameType) return '';

    const gt = gameType.toLowerCase();
    // ⚠️ womens first! ('womens' contains 'mens')
    if (gt.includes('womens') && gt.includes('singles'))
      return t('userSearch.gameTypes.womensSingles');
    if (gt.includes('womens') && gt.includes('doubles'))
      return t('userSearch.gameTypes.womensDoubles');
    if (gt.includes('mens') && gt.includes('singles')) return t('userSearch.gameTypes.mensSingles');
    if (gt.includes('mens') && gt.includes('doubles')) return t('userSearch.gameTypes.mensDoubles');
    if (gt.includes('mixed')) return t('userSearch.gameTypes.mixedDoubles');
    if (gt.includes('singles')) return t('userSearch.gameTypes.singles');
    if (gt.includes('doubles')) return t('userSearch.gameTypes.doubles');
    return '';
  };

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]); // 🆕 Track selected users

  // 🎯 [OPERATION DUO - PHASE 4.7] Fetch club members OR all users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);

      // 🔍 [DEBUG] Log gameType for debugging gender filter issue
      console.log(
        '🔍 [UserSearchModal] fetchUsers called with gameType:',
        gameType,
        'genderFilter:',
        genderFilter
      );

      // Determine if searching club members or all users
      const isClubSearch = clubId && clubId.trim() !== '';

      let availableUsers;

      // 🎯 [KIM FIX] Helper to extract game-type specific LTR from user data
      // 클럽 ELO (clubStats.clubEloRating)를 우선 사용, 없으면 공용 ELO 사용
      const extractLtrData = (userData: Record<string, unknown>) => {
        // 🎯 [KIM FIX] Club ELO first (for club leagues/tournaments)
        const clubStats = userData.clubStats as { clubEloRating?: number } | undefined;
        const clubElo = clubStats?.clubEloRating;

        // 🎯 [KIM FIX v25] Use eloRatings only (Single Source of Truth)
        const eloRatings = userData.eloRatings as Record<string, { current?: number }> | undefined;

        // ELO to LTR conversion (1-10 scale)
        // 🎯 [KIM FIX v16] Use LTR scale (1-10) for skill matching
        const eloToLtr = (elo: number): number => {
          if (elo < 1000) return 1;
          if (elo < 1100) return 2;
          if (elo < 1200) return 3;
          if (elo < 1300) return 4;
          if (elo < 1450) return 5;
          if (elo < 1600) return 6;
          if (elo < 1800) return 7;
          if (elo < 2100) return 8;
          if (elo < 2400) return 9;
          return 10;
        };

        // 🎯 [KIM FIX v19] If club ELO exists, use it for all game types (club-specific rating)
        if (clubElo) {
          const clubLtr = eloToLtr(clubElo);
          return {
            singlesLtr: clubLtr,
            doublesLtr: clubLtr,
            mixedLtr: clubLtr,
          };
        }

        // Fallback to public ELO (for users without club-specific ratings)
        const singlesElo = eloRatings?.singles?.current;
        const doublesElo = eloRatings?.doubles?.current;
        const mixedElo = eloRatings?.mixed?.current;

        return {
          singlesLtr: singlesElo ? eloToLtr(singlesElo) : undefined,
          doublesLtr: doublesElo ? eloToLtr(doublesElo) : undefined,
          mixedLtr: mixedElo ? eloToLtr(mixedElo) : undefined,
        };
      };

      if (isClubSearch) {
        // 🏛️ CLUB EVENT: Get club members only
        console.log('🏛️ [UserSearchModal] Fetching club members for clubId:', clubId);
        const clubMembers = await clubService.getClubMembers(clubId, 'active');

        availableUsers = clubMembers
          .filter(member => !excludeUserIds.includes(member.userId || member.uid))
          .map(member => {
            const ltrData = extractLtrData(member as Record<string, unknown>);
            // 🎯 [KIM FIX] Check profile.photoURL FIRST (most common Firestore location)
            const photoURL =
              member.profile?.photoURL ||
              member.photoURL ||
              member.profile?.profileImage ||
              member.profileImage;

            // 🎯 Extract user location from Firestore (profile.location or location field)
            const userLocation = member.profile?.location || member.location;
            let distance: number | undefined;
            let location: { lat: number; lng: number } | undefined;

            if (userLocation?.lat && userLocation?.lng) {
              location = { lat: userLocation.lat, lng: userLocation.lng };
              // Calculate distance if current location is available
              if (currentLocation?.lat && currentLocation?.lng) {
                distance = calculateDistance(
                  currentLocation.lat,
                  currentLocation.lng,
                  userLocation.lat,
                  userLocation.lng
                );
              }
            }

            return {
              uid: member.userId || member.uid,
              // 🎯 [KIM FIX v2] Firestore 사용자 닉네임 우선순위:
              // 1. profile.nickname (프로필 수정 시 여기에 저장됨!)
              // 2. profile.displayName
              // 3. userName/displayName (루트 레벨)
              // 4. name (fallback)
              displayName:
                member.profile?.displayName ||
                member.profile?.displayName ||
                member.userName ||
                member.displayName ||
                member.name,
              photoURL,
              email: member.email,
              gender: member.gender || member.profile?.gender,
              ...ltrData,
              distance,
              location,
            };
          });
      } else {
        // 🌍 PUBLIC EVENT: Get all users
        console.log('🌍 [UserSearchModal] Fetching all users (public event)');
        const allUsers = await userService.getAllUsers();

        availableUsers = allUsers
          .filter(user => !excludeUserIds.includes(user.uid))
          .map(user => {
            const ltrData = extractLtrData(user as Record<string, unknown>);
            // 🎯 [KIM FIX] Check profile.photoURL FIRST (most common Firestore location)
            const photoURL =
              user.profile?.photoURL ||
              user.photoURL ||
              user.profile?.profileImage ||
              user.profileImage;

            // 🎯 Extract user location from Firestore (profile.location or location field)
            const userLocation = user.profile?.location || user.location;
            let distance: number | undefined;
            let location: { lat: number; lng: number } | undefined;

            if (userLocation?.lat && userLocation?.lng) {
              location = { lat: userLocation.lat, lng: userLocation.lng };
              // Calculate distance if current location is available
              if (currentLocation?.lat && currentLocation?.lng) {
                distance = calculateDistance(
                  currentLocation.lat,
                  currentLocation.lng,
                  userLocation.lat,
                  userLocation.lng
                );
              }
            }

            // 🎯 [KIM FIX v2] Firestore 사용자 닉네임 우선순위:
            // 1. profile.nickname (프로필 수정 시 여기에 저장됨!)
            // 2. profile.displayName
            // 3. displayName (루트 레벨)
            // 4. name (fallback)
            const finalDisplayName =
              user.profile?.displayName ||
              user.profile?.displayName ||
              user.displayName ||
              user.name;

            return {
              uid: user.uid,
              displayName: finalDisplayName,
              photoURL,
              email: user.email,
              gender: user.gender || user.profile?.gender,
              ...ltrData,
              distance,
              location,
            };
          });
      }

      // 🎯 [KIM FIX] Apply gender filter - use explicit genderFilter OR auto-extract from gameType
      // Priority: explicit genderFilter > gameType-based gender
      // Inline gender extraction to avoid useCallback dependency issues
      // ⚠️ IMPORTANT: Check 'womens' BEFORE 'mens' because 'womens' contains 'mens'!
      let autoGenderFilter: 'male' | 'female' | null = null;
      if (gameType) {
        const gt = gameType.toLowerCase();
        console.log('🔍 [DEBUG] Extracting gender from gameType:', { gameType, gt });

        // 🎾 [MIXED DOUBLES] Gender filter logic
        if (gt === 'mixed_doubles' || gt.includes('mixed')) {
          // 🎯 [KIM FIX] For partner selection: show opposite gender only
          // 🎯 [KIM FIX] For admin add (not partner selection): show ALL genders (남녀 모두)
          if (isPartnerSelection) {
            // Partner selection: filter to opposite gender
            const myGender = (currentUser?.gender || currentUser?.profile?.gender)?.toLowerCase();
            console.log('🎾 [MIXED DOUBLES] Partner selection - Current user gender:', myGender);
            if (myGender === 'male') {
              autoGenderFilter = 'female'; // Male user sees females
            } else if (myGender === 'female') {
              autoGenderFilter = 'male'; // Female user sees males
            }
            console.log('🎾 [MIXED DOUBLES] Partner filter:', autoGenderFilter);
          } else {
            // Admin add mode: show ALL users (no gender filter)
            // Admin needs to select 남+여 pair manually
            console.log('🎾 [MIXED DOUBLES] Admin add mode - showing ALL genders (남녀 모두)');
            autoGenderFilter = null;
          }
        }
        // ⚠️ womens first! ('womens' contains 'mens')
        else if (gt.includes('womens') || gt.startsWith('women')) autoGenderFilter = 'female';
        else if (gt.includes('mens') || gt.startsWith('men')) autoGenderFilter = 'male';
        console.log('🔍 [DEBUG] autoGenderFilter extracted:', autoGenderFilter);
      } else {
        console.log('🔍 [DEBUG] No gameType provided, skipping auto gender filter');
      }
      const effectiveGenderFilter = genderFilter || autoGenderFilter;
      console.log(
        '🔍 [DEBUG] effectiveGenderFilter:',
        effectiveGenderFilter,
        '(explicit:',
        genderFilter,
        ', auto:',
        autoGenderFilter,
        ')'
      );

      // 🔍 [DEBUG] Check gender data in users BEFORE filtering
      const genderStats = availableUsers.reduce(
        (acc, u) => {
          const g = u.gender || 'undefined';
          acc[g] = (acc[g] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );
      console.log('🔍 [DEBUG] User gender distribution BEFORE filter:', genderStats);

      if (effectiveGenderFilter) {
        const beforeCount = availableUsers.length;
        availableUsers = availableUsers.filter(user => {
          // 🎯 [KIM FIX] Exclude users without gender data for gender-specific events
          // This ensures womens_* events only show women, mens_* events only show men
          if (!user.gender) return false;
          // 🎯 [KIM FIX] Case-insensitive comparison (handle "Male" vs "male")
          return user.gender.toLowerCase() === effectiveGenderFilter.toLowerCase();
        });
        console.log(
          `🎯 [UserSearchModal] Applied gender filter: ${effectiveGenderFilter} (source: ${genderFilter ? 'explicit' : 'gameType'}), ${beforeCount} -> ${availableUsers.length} users`
        );
      } else {
        console.log('🔍 [DEBUG] No effectiveGenderFilter, skipping gender filtering');
      }

      // 🎯 Sort by distance - users without distance go to the end
      availableUsers.sort((a, b) => {
        // Users without distance go to the end
        if (a.distance === undefined && b.distance === undefined) return 0;
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        // Sort by distance ascending (closest first)
        return a.distance - b.distance;
      });

      console.log(
        `📍 [UserSearchModal] Sorted ${availableUsers.length} users by distance (${availableUsers.filter(u => u.distance !== undefined).length} with location)`
      );

      setUsers(availableUsers);
      setFilteredUsers(availableUsers);

      console.log(
        `✅ [UserSearchModal] Loaded ${availableUsers.length} ${isClubSearch ? 'club members' : 'users'} (excluded ${excludeUserIds.length}, gender filter: ${genderFilter || 'none'})`
      );
    } catch (error) {
      const isClubSearch = clubId && clubId.trim() !== '';
      console.error(
        `❌ [UserSearchModal] Error fetching ${isClubSearch ? 'club members' : 'users'}:`,
        error
      );

      // 🚨 Show error details to help debug
      const errorMessage = error instanceof Error ? error.message : String(error);
      const userType = isClubSearch
        ? t('userSearch.failedToLoadClubMembers')
        : t('userSearch.failedToLoadAllUsers');
      Alert.alert(
        t('userSearch.error'),
        t('userSearch.failedToLoadUsers', { type: userType, error: errorMessage }),
        [{ text: t('userSearch.ok') }]
      );

      // Set empty users list
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  }, [
    clubId,
    excludeUserIds,
    genderFilter,
    gameType,
    currentUser,
    currentLocation?.lat,
    currentLocation?.lng,
    t,
    calculateDistance,
  ]);

  // 🎯 [KIM FIX] Track excludeUserIds for refetch when it changes
  const excludeUserIdsKey = excludeUserIds.join(',');

  // Fetch all users when modal opens or excludeUserIds changes
  useEffect(() => {
    if (visible) {
      fetchUsers();
      setSearchTerm(''); // Reset search when modal opens
      setSelectedUsers([]); // 🆕 Reset selected users when modal opens
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, excludeUserIdsKey]); // 🎯 [KIM FIX] Refetch when excludeUserIds changes

  // 🔍 DEBUG: Track modal rendering and visibility
  useEffect(() => {
    console.log('🔍 [UserSearchModal] Component rendered/updated');
    console.log('🔍 [UserSearchModal] visible prop:', visible);
    console.log('🔍 [UserSearchModal] clubId prop:', clubId);
    console.log('🔍 [UserSearchModal] clubId type:', typeof clubId);
    console.log('🔍 [UserSearchModal] clubId isEmpty:', !clubId || clubId.trim() === '');
    console.log('🔍 [UserSearchModal] excludeUserIds:', excludeUserIds);
    console.log('🔍 [UserSearchModal] excludeUserIds length:', excludeUserIds.length);
  }, [visible, excludeUserIds, clubId]);

  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
      return;
    }

    const lowercasedSearch = searchTerm.toLowerCase();
    const filtered = users.filter(user => {
      const displayName = user.displayName?.toLowerCase() || '';
      const email = user.email?.toLowerCase() || '';
      return displayName.includes(lowercasedSearch) || email.includes(lowercasedSearch);
    });

    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  // 🆕 Toggle user selection
  const handleUserToggle = (user: User) => {
    const isMixedDoubles = gameType?.toLowerCase().includes('mixed');

    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.uid === user.uid);
      if (isSelected) {
        // Remove from selection
        console.log('➖ [UserSearchModal] User deselected:', user.displayName);

        // 🎾 [MIXED DOUBLES] Pair deselection: remove the paired partner too
        // Pairing: index 0 ↔ 1, index 2 ↔ 3, etc. (남+여 순서로 선택됨)
        if (isMixedDoubles && !isPartnerSelection && prev.length >= 2) {
          const userIndex = prev.findIndex(u => u.uid === user.uid);
          // Find the pair index: 0↔1, 2↔3, 4↔5, etc.
          const pairIndex = userIndex % 2 === 0 ? userIndex + 1 : userIndex - 1;

          if (pairIndex >= 0 && pairIndex < prev.length) {
            const pairedUser = prev[pairIndex];
            console.log('🎾 [MIXED DOUBLES] Also removing paired user:', pairedUser?.displayName);
            // Remove both the user and their pair
            return prev.filter(u => u.uid !== user.uid && u.uid !== pairedUser?.uid);
          }
        }

        return prev.filter(u => u.uid !== user.uid);
      } else {
        // 🎯 [PARTNER FIX] Single selection mode for partner selection
        if (isPartnerSelection) {
          // Partner selection: replace previous selection (only 1 partner allowed)
          console.log('✅ [UserSearchModal] Partner selected (single):', user.displayName);
          return [user];
        }
        // Add to selection (multi-select mode)
        console.log('✅ [UserSearchModal] User selected:', user.displayName);
        return [...prev, user];
      }
    });
  };

  // 🆕 Add all selected users
  const handleAddSelectedUsers = () => {
    if (selectedUsers.length === 0) {
      console.warn('⚠️ [UserSearchModal] No users selected');
      return;
    }

    // 🆕 DOUBLES TOURNAMENT: Validate even number of players
    // 🎯 [PARTNER FIX] Skip even number validation for partner selection (only 1 partner needed)
    if (tournamentFormat === 'doubles' && !isPartnerSelection) {
      if (selectedUsers.length % 2 !== 0) {
        console.warn('⚠️ [UserSearchModal] Doubles tournament requires even number of players');
        // Show alert to user
        Alert.alert(t('userSearch.selectionError'), t('userSearch.doublesEvenNumberRequired'), [
          { text: t('userSearch.ok') },
        ]);
        return;
      }

      // TEMPORARY FIX: Auto-generate teams instead of showing TeamPairingModal
      // Automatically pair players: [0,1] = Team 1, [2,3] = Team 2, etc.
      console.log('🎾 [UserSearchModal] Doubles tournament - auto-generating teams');
      console.log('🎾 [UserSearchModal] Selected players:', selectedUsers);

      // Create teams automatically in pairs
      const autoGeneratedTeams = [];
      for (let i = 0; i < selectedUsers.length; i += 2) {
        if (i + 1 < selectedUsers.length) {
          autoGeneratedTeams.push({
            id: `team-${i / 2 + 1}`,
            player1: selectedUsers[i],
            player2: selectedUsers[i + 1],
          });
        }
      }

      console.log('🎾 [UserSearchModal] Auto-generated teams:', autoGeneratedTeams);

      // Call onTeamPairingRequired with auto-generated teams
      // This handler will add players with partner information
      if (onTeamPairingRequired) {
        onTeamPairingRequired(selectedUsers, autoGeneratedTeams);
      }

      // Close modal (do NOT call onUserSelect - teams are handled by onTeamPairingRequired)
      onClose();
      return;
    }

    // SINGLES TOURNAMENT: Add selected users directly
    console.log('👥 [UserSearchModal] Adding selected users:', selectedUsers.length);
    console.log(
      '👥 [UserSearchModal] Selected users:',
      selectedUsers.map(u => u.displayName).join(', ')
    );
    onUserSelect(selectedUsers);
    onClose();
  };

  // 🎯 [KIM FIX] Get avatar initial from display name
  const getAvatarInitial = (displayName: string | undefined): string => {
    if (!displayName) return '?';
    // Get first character (handles Korean/English)
    return displayName.charAt(0).toUpperCase();
  };

  // 🎯 [KIM FIX] Get avatar background color based on name
  const getAvatarColor = (displayName: string | undefined): string => {
    if (!displayName) return '#9E9E9E';
    // Generate consistent color based on first character
    const colors = [
      '#F44336',
      '#E91E63',
      '#9C27B0',
      '#673AB7',
      '#3F51B5',
      '#2196F3',
      '#03A9F4',
      '#00BCD4',
      '#009688',
      '#4CAF50',
      '#8BC34A',
      '#CDDC39',
      '#FFC107',
      '#FF9800',
      '#FF5722',
    ];
    const charCode = displayName.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  // 🎯 [KIM FIX] Get gender icon
  const getGenderIcon = (gender: string | undefined): { icon: string; color: string } | null => {
    if (!gender) return null;
    if (gender === 'male') return { icon: '♂', color: '#2196F3' };
    if (gender === 'female') return { icon: '♀', color: '#E91E63' };
    return null;
  };

  // 🎯 [KIM FIX] Get default LTR (use singles as fallback)
  const getDisplayLtr = (user: User): number | undefined => {
    // If gameType is specified, use game-type specific LTR
    if (gameType) {
      return getUserLtrForGameType(user);
    }
    // Otherwise, use singles as default, then doubles, then mixed
    return user.singlesLtr || user.doublesLtr || user.mixedLtr;
  };

  const renderUserItem = ({ item }: { item: User }) => {
    const isSelected = selectedUsers.some(u => u.uid === item.uid);
    // 🎯 [KIM FIX] Check if user is within LTR range (±1)
    const isWithinRange = isUserWithinLtrRange(item);
    const userLtr = gameType ? getUserLtrForGameType(item) : getDisplayLtr(item);

    // 🎾 [MIXED DOUBLES] Alternating gender selection (남→여→남→여)
    // For admin add mode: if last selected was male, only allow female next (and vice versa)
    const isMixedDoubles = gameType?.toLowerCase().includes('mixed');
    const lastSelectedGender =
      selectedUsers.length > 0
        ? selectedUsers[selectedUsers.length - 1]?.gender?.toLowerCase()
        : null;
    const itemGender = item.gender?.toLowerCase();
    const isWrongGenderForMixed =
      isMixedDoubles &&
      !isPartnerSelection &&
      !isSelected && // Allow deselection
      lastSelectedGender !== null &&
      itemGender === lastSelectedGender;

    const isDisabled = isLoading || !isWithinRange || isWrongGenderForMixed;
    const genderInfo = getGenderIcon(item.gender);

    return (
      <TouchableOpacity
        style={[
          styles.userItem,
          // 🎨 [DARK GLASS] Card Style - 테마 색상 사용
          {
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.outline,
          },
          isDisabled && styles.disabledUserItem,
        ]}
        onPress={() => handleUserToggle(item)}
        disabled={isDisabled}
        activeOpacity={isDisabled ? 1 : 0.7}
      >
        <View style={styles.userItemContent}>
          {/* User Avatar - 🎯 [KIM FIX] Show initial letter if no photo */}
          {item.photoURL ? (
            <Image
              source={{ uri: item.photoURL }}
              style={[styles.avatar, isDisabled && { opacity: 0.5 }]}
            />
          ) : (
            <View
              style={[
                styles.avatar,
                styles.avatarPlaceholder,
                { backgroundColor: getAvatarColor(item.displayName) },
                isDisabled && { opacity: 0.5 },
              ]}
            >
              <Text style={styles.avatarInitial}>{getAvatarInitial(item.displayName)}</Text>
            </View>
          )}

          {/* User Info */}
          <View style={styles.userInfo}>
            <View style={styles.userNameRow}>
              <Text
                style={[
                  styles.userName,
                  { color: !isDisabled ? theme.colors.onSurface : theme.colors.onSurfaceVariant },
                ]}
              >
                {item.displayName || t('userSearch.noName')}
              </Text>
              {/* 🎯 [KIM FIX] Gender indicator */}
              {genderInfo && (
                <Text style={[styles.genderIcon, { color: genderInfo.color }]}>
                  {genderInfo.icon}
                </Text>
              )}
            </View>
            {/* 🎯 [KIM FIX] Always show LTR - 클럽 검색일 경우 클럽LTR 표시 (리그/토너먼트 통합) */}
            <Text
              style={[
                styles.userLtr,
                {
                  color: !isDisabled ? theme.colors.primary : theme.colors.error,
                },
              ]}
            >
              {userLtr !== undefined
                ? clubId
                  ? t('userSearch.clubLtr', { value: Math.round(userLtr) })
                  : t('userSearch.ltr', { value: Math.round(userLtr) })
                : t('userSearch.noLtr')}
              {!isWithinRange &&
                hostLtr !== undefined &&
                ` (${t('userSearch.required')}: ${getLtrRangeText()})`}
            </Text>
            {/* 🎯 Distance display - locale-aware (en: miles, others: km) */}
            {item.distance !== undefined && (
              <Text style={[styles.userDistance, { color: theme.colors.onSurfaceVariant }]}>
                📍{' '}
                {useImperialUnits
                  ? // 🇺🇸 Imperial: miles (ft for < 0.1 mi)
                    item.distance * KM_TO_MILES < 0.1
                    ? `${(item.distance * KM_TO_MILES * 5280).toFixed(0)} ft`
                    : `${(item.distance * KM_TO_MILES).toFixed(1)} mi`
                  : // 🌍 Metric: kilometers (m for < 1 km)
                    item.distance < 1
                    ? `${(item.distance * 1000).toFixed(0)}m`
                    : `${item.distance.toFixed(1)}km`}
              </Text>
            )}
          </View>

          {/* 🆕 Checkbox Icon */}
          {!isDisabled ? (
            <Ionicons
              name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={isSelected ? theme.colors.primary : theme.colors.onSurfaceVariant}
            />
          ) : (
            <Ionicons name='close-circle' size={24} color={theme.colors.error} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      transparent={false}
      onRequestClose={onClose}
      onShow={() => {
        console.log('✅ [UserSearchModal] Modal fully displayed and ready for interaction');
      }}
      statusBarTranslucent={false}
    >
      {/* SafeAreaView at top level - wraps ALL content and ensures proper status bar padding */}
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <StatusBar style='light' />
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.outlineVariant }]}>
          <TouchableOpacity
            onPress={() => {
              console.log('❌ [UserSearchModal] Close button pressed');
              onClose();
            }}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name='close' size={28} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
              {isPartnerSelection ? t('userSearch.partnerTitle') : t('userSearch.title')}
            </Text>
            {/* 🎯 [2025.01 RULE CHANGE] Show game type and LTR range */}
            {gameType && (
              <Text style={[styles.headerSubtitle, { color: theme.colors.primary }]}>
                {getGameTypeLabel()}
                {hostLtr !== undefined && ` · ${getLtrRangeText()}`}
              </Text>
            )}
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
          <Ionicons
            name='search'
            size={20}
            color={theme.colors.onSurfaceVariant}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.onSurface }]}
            placeholder={t('userSearch.searchPlaceholder')}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={searchTerm}
            onChangeText={setSearchTerm}
            autoCapitalize='none'
            autoCorrect={false}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Ionicons name='close-circle' size={20} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>

        {/* User List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size='large' color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
              {t('userSearch.loading')}
            </Text>
          </View>
        ) : filteredUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name='people-outline' size={64} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
              {searchTerm ? t('userSearch.noResults') : t('userSearch.noUsers')}
            </Text>
            {searchTerm && (
              <Text style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
                {t('userSearch.tryDifferentSearch')}
              </Text>
            )}
          </View>
        ) : (
          <>
            {/* Result Count */}
            <View style={styles.resultCountContainer}>
              <Text style={[styles.resultCount, { color: theme.colors.onSurfaceVariant }]}>
                {t('userSearch.userCount', { count: filteredUsers.length })}
              </Text>
            </View>

            <FlatList
              data={filteredUsers}
              keyExtractor={item => item.uid}
              renderItem={renderUserItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}

        {/* 🆕 Bottom Action Bar */}
        {!loading && filteredUsers.length > 0 && (
          <SafeAreaView edges={['bottom']} style={{ backgroundColor: theme.colors.surface }}>
            <View
              style={[
                styles.bottomActionBar,
                {
                  backgroundColor: theme.colors.surface,
                  borderTopColor: theme.colors.outlineVariant,
                },
              ]}
            >
              {/* Selection Count */}
              {(() => {
                // 🎯 [KIM FIX] Mixed Doubles validation: must be 남+여 pair
                const isMixedDoubles = gameType?.toLowerCase().includes('mixed');
                const isDoublesMode =
                  tournamentFormat === 'doubles' || gameType?.toLowerCase().includes('doubles');

                // 🎾 [MIXED DOUBLES] Count males and females in selection
                const maleCount = selectedUsers.filter(
                  u => u.gender?.toLowerCase() === 'male'
                ).length;
                const femaleCount = selectedUsers.filter(
                  u => u.gender?.toLowerCase() === 'female'
                ).length;

                // 🎯 [KIM FIX] For Mixed Doubles: valid team = 1 male + 1 female
                // Calculate possible mixed teams (min of male/female count)
                const possibleMixedTeams = Math.min(maleCount, femaleCount);

                // Check if current selection is valid for mixed doubles
                // Valid: 2 selected AND 1 male + 1 female (for 1 team)
                // Valid: 4 selected AND 2 males + 2 females (for 2 teams)
                const isValidMixedSelection =
                  selectedUsers.length > 0 &&
                  selectedUsers.length % 2 === 0 &&
                  maleCount === femaleCount &&
                  maleCount === selectedUsers.length / 2;

                // 🎯 Get hint text for Mixed Doubles
                const getMixedDoublesHintText = () => {
                  if (selectedUsers.length === 0) return '';
                  if (selectedUsers.length % 2 !== 0) {
                    return t('userSearch.selectEvenNumber');
                  }
                  if (maleCount !== femaleCount) {
                    // Need equal males and females
                    return t('userSearch.mixedDoublesRequirePair', {
                      males: maleCount,
                      females: femaleCount,
                    });
                  }
                  // Valid selection
                  return `✓ ${possibleMixedTeams} ${t('userSearch.teamsPossible')}`;
                };

                return (
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.selectionCount, { color: theme.colors.onSurfaceVariant }]}>
                      {selectedUsers.length > 0
                        ? t('userSearch.selected', { count: selectedUsers.length })
                        : t('userSearch.selectParticipants')}
                    </Text>
                    {/* 🎯 [KIM FIX] Mixed Doubles hint - show 남+여 requirement */}
                    {!isPartnerSelection && isMixedDoubles && selectedUsers.length > 0 && (
                      <Text
                        style={[
                          styles.doublesHint,
                          {
                            color: isValidMixedSelection
                              ? theme.colors.primary
                              : theme.colors.error,
                          },
                        ]}
                      >
                        {getMixedDoublesHintText()}
                      </Text>
                    )}
                    {/* 🆕 Regular Doubles hint (not mixed) - check both tournamentFormat AND gameType */}
                    {/* 🎯 [PARTNER FIX] Hide even number hint for partner selection */}
                    {!isPartnerSelection &&
                      isDoublesMode &&
                      !isMixedDoubles &&
                      selectedUsers.length > 0 && (
                        <Text
                          style={[
                            styles.doublesHint,
                            {
                              color:
                                selectedUsers.length % 2 === 0
                                  ? theme.colors.primary
                                  : theme.colors.error,
                            },
                          ]}
                        >
                          {selectedUsers.length % 2 === 0
                            ? t('userSearch.teamsCount', { count: selectedUsers.length / 2 })
                            : t('userSearch.selectEvenNumber')}
                        </Text>
                      )}
                  </View>
                );
              })()}

              {/* Add Button */}
              {(() => {
                // 🎯 Check if doubles mode (either from tournamentFormat or gameType)
                const isDoublesMode =
                  tournamentFormat === 'doubles' || gameType?.toLowerCase().includes('doubles');
                const isMixedDoubles = gameType?.toLowerCase().includes('mixed');

                // 🎯 [KIM FIX] Mixed Doubles validation
                const maleCount = selectedUsers.filter(
                  u => u.gender?.toLowerCase() === 'male'
                ).length;
                const femaleCount = selectedUsers.filter(
                  u => u.gender?.toLowerCase() === 'female'
                ).length;

                // 🎯 For Mixed Doubles: must have equal males and females
                const isInvalidMixedPair =
                  isMixedDoubles &&
                  !isPartnerSelection &&
                  (selectedUsers.length % 2 !== 0 || maleCount !== femaleCount);

                // 🎯 Disable button if doubles mode and odd number selected
                // 🎯 [PARTNER FIX] Skip even number validation for partner selection
                const isOddInDoubles =
                  isDoublesMode &&
                  !isPartnerSelection &&
                  !isMixedDoubles &&
                  selectedUsers.length % 2 !== 0;

                const isButtonDisabled =
                  selectedUsers.length === 0 || isLoading || isOddInDoubles || isInvalidMixedPair;

                return (
                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      {
                        backgroundColor:
                          selectedUsers.length > 0 && !isOddInDoubles && !isInvalidMixedPair
                            ? theme.colors.primary
                            : theme.colors.surfaceVariant,
                      },
                      isButtonDisabled && styles.disabledButton,
                    ]}
                    onPress={handleAddSelectedUsers}
                    disabled={isButtonDisabled}
                    activeOpacity={0.8}
                  >
                    {isLoading ? (
                      <ActivityIndicator size='small' color='#fff' />
                    ) : (
                      <>
                        <Ionicons name='add' size={20} color='#fff' style={{ marginRight: 4 }} />
                        <Text style={styles.addButtonText}>{t('userSearch.add')}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                );
              })()}
            </View>
          </SafeAreaView>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
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
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  headerSpacer: {
    width: 44, // Match close button width for centering
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  resultCountContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  resultCount: {
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  userItem: {
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  disabledUserItem: {
    opacity: 0.6,
  },
  userItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 🎯 [KIM FIX] Avatar initial text style
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  // 🎯 [KIM FIX] User name row with gender indicator
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  // 🎯 [KIM FIX] Gender icon style
  genderIcon: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  // 🎯 [KIM FIX] LTR display style
  userLtr: {
    fontSize: 13,
    fontWeight: '500',
  },
  userDistance: {
    fontSize: 12,
    marginTop: 2,
  },
  userEmail: {
    fontSize: 14,
  },
  // 🆕 Bottom Action Bar Styles
  bottomActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectionCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  doublesHint: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 100,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default UserSearchModal;
