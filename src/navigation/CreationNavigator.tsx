/**
 * ⚡ LPR System Migration Complete
 *
 * UI 표시: "LPR" (Lightning Pickleball Rating)
 * 코드/DB: "ltr" - 변수명, 함수명, 새 Firestore 필드명
 *
 * Migration: NTRP → LPR 완료
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CreateEventChoiceScreen from '../screens/CreateEventChoiceScreen';
import CreateEventForm from '../screens/CreateEventForm';
import LocationSearchScreen from '../screens/LocationSearchScreen';
// 🎯 [KIM FIX] CreateClub removed - already registered in AppNavigator
// This prevents duplicate screen registration and potential module loading issues

interface EventData {
  id: string;
  title: string;
  description?: string;
  dateTime: string;
  location?: {
    address: string;
    name?: string;
    placeId?: string;
    coordinates?: { lat: number; lng: number } | null;
    types?: string[];
    formatted_address?: string;
  };
  eventType: 'match' | 'meetup';
  ltrLevel?: string | string[];
  skillLevel?: string;
  gameType?: string;
  languages?: string[];
  autoApproval?: boolean;
  participationFee?: number | string;
  invitedFriends?: string[];
  smsInvites?: string[];
  scheduledTime?: Date | string;
  maxParticipants?: number;
}

interface LocationData {
  address: string;
  name?: string;
  placeId?: string;
  coordinates?: { lat: number; lng: number } | null;
  types?: string[];
  formatted_address?: string;
}

export type CreationStackParamList = {
  CreateEventChoice: undefined;
  CreateEventForm: {
    eventType: 'match' | 'meetup';
    editEvent?: EventData;
    selectedLocation?: LocationData;
  };
  LocationSearch: {
    eventType: 'match' | 'meetup';
  };
  // 🎯 [KIM FIX] CreateClub removed - use AppNavigator's CreateClub instead
};

const Stack = createNativeStackNavigator<CreationStackParamList>();

const CreationNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name='CreateEventChoice' component={CreateEventChoiceScreen} />
      <Stack.Screen name='CreateEventForm' component={CreateEventForm} />
      <Stack.Screen name='LocationSearch' component={LocationSearchScreen} />
      {/* 🎯 [KIM FIX] CreateClub removed - already in AppNavigator */}
    </Stack.Navigator>
  );
};

export default CreationNavigator;
