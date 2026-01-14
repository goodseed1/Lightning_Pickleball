/**
 * 이벤트 데이터 디버깅 유틸리티
 * Firebase에서 직접 이벤트 데이터를 조회하여 실제 저장된 값을 확인
 */

import { doc, getDoc, collection, query, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * 이벤트 ID로 Firebase에서 직접 데이터 조회
 */
export async function debugEventById(eventId: string) {
  try {
    console.log(`🔍 [DEBUG] Fetching event data for ID: ${eventId}`);

    const eventRef = doc(db, 'events', eventId);
    const eventSnap = await getDoc(eventRef);

    if (eventSnap.exists()) {
      const data = eventSnap.data();
      console.log('🔍 [DEBUG] Raw Firebase data:', JSON.stringify(data, null, 2));

      return {
        id: eventSnap.id,
        raw: data,
        processed: {
          title: data.title,
          type: data.type,
          skillLevel: data.skillLevel,
          status: data.status,
          maxParticipants: data.maxParticipants,
          hostId: data.hostId,
          createdAt: data.createdAt,
          scheduledTime: data.scheduledTime
        }
      };
    } else {
      console.log('🚫 [DEBUG] Event not found');
      return null;
    }
  } catch (error) {
    console.error('❌ [DEBUG] Error fetching event:', error);
    throw error;
  }
}

/**
 * 제목으로 이벤트 검색
 */
export async function debugEventByTitle(title: string) {
  try {
    console.log(`🔍 [DEBUG] Searching events with title containing: ${title}`);

    const eventsRef = collection(db, 'events');
    const q = query(eventsRef);
    const querySnapshot = await getDocs(q);

    const matchingEvents: Array<{
      id: string;
      title: string;
      type: string;
      skillLevel: string;
      raw: Record<string, unknown>;
    }> = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (data.title && data.title.includes(title)) {
        matchingEvents.push({
          id: doc.id,
          title: data.title,
          type: data.type,
          skillLevel: data.skillLevel,
          raw: data
        });
      }
    });

    console.log(`🔍 [DEBUG] Found ${matchingEvents.length} matching events:`, matchingEvents);
    return matchingEvents;
  } catch (error) {
    console.error('❌ [DEBUG] Error searching events:', error);
    throw error;
  }
}

/**
 * 데이터 파이프라인 비교 함수
 */
export async function compareDataPipelines(eventId: string) {
  try {
    console.log(`🔍 [DEBUG] Comparing data pipelines for event: ${eventId}`);

    // 1. Firebase 원본 데이터
    const firebaseData = await debugEventById(eventId);

    // 2. DiscoveryContext 변환 로직 시뮬레이션
    const discoveryTransformed = firebaseData ? {
      skillLevel: firebaseData.raw.skillLevel || 'all',
      type: firebaseData.raw.type || 'practice',
      title: firebaseData.raw.title || 'Untitled Event'
    } : null;

    // 3. ActivityTabContent 변환 로직 시뮬레이션
    const activityTransformed = firebaseData ? {
      skillLevel: firebaseData.raw.skillLevel || 'Any Level',
      type: firebaseData.raw.type || 'lightning',
      title: firebaseData.raw.title || 'Untitled Event'
    } : null;

    const comparison = {
      firebase: firebaseData,
      discoveryPipeline: discoveryTransformed,
      activityPipeline: activityTransformed,
      differences: {
        skillLevel: {
          discovery: discoveryTransformed?.skillLevel,
          activity: activityTransformed?.skillLevel,
          match: discoveryTransformed?.skillLevel === activityTransformed?.skillLevel
        },
        type: {
          discovery: discoveryTransformed?.type,
          activity: activityTransformed?.type,
          match: discoveryTransformed?.type === activityTransformed?.type
        }
      }
    };

    console.log('🔍 [DEBUG] Pipeline comparison:', JSON.stringify(comparison, null, 2));
    return comparison;

  } catch (error) {
    console.error('❌ [DEBUG] Error comparing pipelines:', error);
    throw error;
  }
}

// Development mode global functions
if (__DEV__) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).debugEventData = {
    debugEventById,
    debugEventByTitle,
    compareDataPipelines
  };

  console.log('🔍 [DEV] Event debugging functions available globally:');
  console.log('  - global.debugEventData.debugEventById("EVENT_ID")');
  console.log('  - global.debugEventData.debugEventByTitle("번개13")');
  console.log('  - global.debugEventData.compareDataPipelines("EVENT_ID")');
}