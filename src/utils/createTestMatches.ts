/**
 * 테스트용 번개매치 생성 유틸리티
 * 매치 결과 표시 시스템을 테스트하기 위한 새로운 번개매치들을 생성합니다
 *
 * 📝 LPR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LPR" (Lightning Pickleball Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LPR로 변경하고 코드는 ntrp를 유지합니다.
 */

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * 테스트 매치 #1 생성 - 호스트 승리 케이스 테스트용
 */
export async function createTestMatch1() {
  try {
    console.log('🎯 [TEST] Creating test match #1 (호스트 승리 케이스)...');

    const eventData = {
      title: '번개매치 테스트1 (호스트 승리)',
      description: '매치 결과 표시 시스템 테스트용 - 호스트가 승리하는 케이스',
      location: '피클볼 코트 A',
      // Schedule for tomorrow to make it upcoming
      eventDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // Tomorrow +2 hours
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // Tomorrow +4 hours
      type: 'lightning', // Lightning match type
      maxParticipants: 2,
      participants: 0,
      status: 'scheduled',
      skillLevel: 'intermediate',
      // Host information
      hostId: 'zw9zD7oNhSXsQuhBVEsGrUSbknY2', // Known host ID
      createdBy: 'zw9zD7oNhSXsQuhBVEsGrUSbknY2',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Additional fields for proper event structure
      scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      minNTRP: 3.0,
      maxNTRP: 5.0,
    };

    const eventsRef = collection(db, 'events');
    const docRef = await addDoc(eventsRef, eventData);

    console.log('🎉 [TEST] Test match #1 created successfully!');
    console.log('📊 [TEST] Event ID:', docRef.id);
    console.log('📊 [TEST] Event data:', eventData);

    return {
      eventId: docRef.id,
      eventData,
    };
  } catch (error) {
    console.error('❌ [TEST] Error creating test match #1:', error);
    throw error;
  }
}

/**
 * 테스트 매치 #2 생성 - 신청자 승리 케이스 테스트용
 */
export async function createTestMatch2() {
  try {
    console.log('🎯 [TEST] Creating test match #2 (신청자 승리 케이스)...');

    const eventData = {
      title: '번개매치 테스트2 (신청자 승리)',
      description: '매치 결과 표시 시스템 테스트용 - 신청자가 승리하는 케이스',
      location: '피클볼 코트 B',
      // Schedule for day after tomorrow
      eventDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // Day after tomorrow +3 hours
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000), // Day after tomorrow +5 hours
      type: 'lightning', // Lightning match type
      maxParticipants: 2,
      participants: 0,
      status: 'scheduled',
      skillLevel: 'advanced',
      // Host information
      hostId: 'zw9zD7oNhSXsQuhBVEsGrUSbknY2', // Same host for consistency
      createdBy: 'zw9zD7oNhSXsQuhBVEsGrUSbknY2',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Additional fields for proper event structure
      scheduledTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      minNTRP: 4.0,
      maxNTRP: 6.0,
    };

    const eventsRef = collection(db, 'events');
    const docRef = await addDoc(eventsRef, eventData);

    console.log('🎉 [TEST] Test match #2 created successfully!');
    console.log('📊 [TEST] Event ID:', docRef.id);
    console.log('📊 [TEST] Event data:', eventData);

    return {
      eventId: docRef.id,
      eventData,
    };
  } catch (error) {
    console.error('❌ [TEST] Error creating test match #2:', error);
    throw error;
  }
}

/**
 * 두 테스트 매치를 모두 생성
 */
export async function createAllTestMatches() {
  try {
    console.log('🧪 [TEST] Creating all test matches...');

    const match1 = await createTestMatch1();
    console.log('✅ [TEST] Match 1 created:', match1.eventId);

    // Wait a bit between creations
    await new Promise(resolve => setTimeout(resolve, 1000));

    const match2 = await createTestMatch2();
    console.log('✅ [TEST] Match 2 created:', match2.eventId);

    const results = {
      testMatch1: match1,
      testMatch2: match2,
    };

    console.log('🎉 [TEST] All test matches created successfully!');
    console.log('📋 [TEST] Summary:', {
      match1Id: match1.eventId,
      match1Title: match1.eventData.title,
      match2Id: match2.eventId,
      match2Title: match2.eventData.title,
    });

    return results;
  } catch (error) {
    console.error('❌ [TEST] Error creating test matches:', error);
    throw error;
  }
}

// Development mode global functions
if (__DEV__) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).createTestMatches = {
    createTestMatch1,
    createTestMatch2,
    createAllTestMatches,
  };

  console.log('🧪 [DEV] Test match creation functions available globally:');
  console.log('  - global.createTestMatches.createTestMatch1()');
  console.log('  - global.createTestMatches.createTestMatch2()');
  console.log('  - global.createTestMatches.createAllTestMatches()');
}
