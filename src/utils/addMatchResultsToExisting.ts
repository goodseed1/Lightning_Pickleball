/**
 * 기존 이벤트에 매치 결과 추가 유틸리티
 * Firebase 권한 문제로 새 매치 생성이 안 되는 경우, 기존 매치에 결과를 추가하여 테스트
 */

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * 번매12에 호스트 승리 결과 추가
 */
export async function addHostVictoryTo번매12() {
  try {
    console.log('🎯 [TEST] Adding host victory result to 번매12...');

    const eventRef = doc(db, 'events', 'DruVwr7O6lrgd3kHjU4R');

    const updateData = {
      status: 'completed',
      result: {
        winnerId: 'zw9zD7oNhSXsQuhBVEsGrUSbknY2', // Host wins
        loserId: 'Vr5z2suh9TZl3eQZfukPhLW6Ont1',  // Participant loses
        score: '6-2, 6-2',
        recordedAt: new Date(),
        recordedBy: 'zw9zD7oNhSXsQuhBVEsGrUSbknY2',
      },
      completedAt: new Date(),
      updatedAt: new Date(),
    };

    await updateDoc(eventRef, updateData);

    console.log('🎉 [TEST] Host victory result added to 번매12!');
    console.log('📊 [TEST] Host view should show: "승리 6-2, 6-2"');
    console.log('📊 [TEST] Applicant view should show: "패배 6-2, 6-2"');

    return true;
  } catch (error) {
    console.error('❌ [TEST] Error adding host victory result:', error);
    return false;
  }
}

/**
 * 번매11에 신청자 승리 결과 추가
 */
export async function addParticipantVictoryTo번매11() {
  try {
    console.log('🎯 [TEST] Adding participant victory result to 번매11...');

    const eventRef = doc(db, 'events', '843848hFJE4P8Rv1pav7');

    const updateData = {
      status: 'completed',
      result: {
        winnerId: 'Vr5z2suh9TZl3eQZfukPhLW6Ont1', // Participant wins
        loserId: 'zw9zD7oNhSXsQuhBVEsGrUSbknY2',  // Host loses
        score: '7-6(5), 6-4',
        recordedAt: new Date(),
        recordedBy: 'zw9zD7oNhSXsQuhBVEsGrUSbknY2',
      },
      completedAt: new Date(),
      updatedAt: new Date(),
    };

    await updateDoc(eventRef, updateData);

    console.log('🎉 [TEST] Participant victory result added to 번매11!');
    console.log('📊 [TEST] Host view should show: "패배 7-6(5), 6-4"');
    console.log('📊 [TEST] Applicant view should show: "승리 7-6(5), 6-4"');

    return true;
  } catch (error) {
    console.error('❌ [TEST] Error adding participant victory result:', error);
    return false;
  }
}

/**
 * 번매10에 타이브레이크 승부 결과 추가
 */
export async function addTiebreakResultTo번매10() {
  try {
    console.log('🎯 [TEST] Adding tiebreak result to 번매10...');

    const eventRef = doc(db, 'events', '7gxMHRPFcAjGDB4ClWvg');

    const updateData = {
      status: 'completed',
      result: {
        winnerId: 'zw9zD7oNhSXsQuhBVEsGrUSbknY2', // Host wins
        loserId: 'Vr5z2suh9TZl3eQZfukPhLW6Ont1',  // Participant loses
        score: '6-7(4), 6-4, 매치 TB: 10-8',
        recordedAt: new Date(),
        recordedBy: 'zw9zD7oNhSXsQuhBVEsGrUSbknY2',
      },
      completedAt: new Date(),
      updatedAt: new Date(),
    };

    await updateDoc(eventRef, updateData);

    console.log('🎉 [TEST] Tiebreak result added to 번매10!');
    console.log('📊 [TEST] Host view should show: "승리 6-7(4), 6-4, 매치 TB: 10-8"');
    console.log('📊 [TEST] Applicant view should show: "패배 6-7(4), 6-4, 매치 TB: 10-8"');

    return true;
  } catch (error) {
    console.error('❌ [TEST] Error adding tiebreak result:', error);
    return false;
  }
}

/**
 * 모든 테스트 결과를 기존 매치들에 추가
 */
export async function addAllTestResults() {
  try {
    console.log('🧪 [TEST] Adding test results to existing matches...');

    // Test 1: Host victory
    const test1 = await addHostVictoryTo번매12();
    console.log('✅ [TEST] Host victory test:', test1 ? 'SUCCESS' : 'FAILED');

    // Wait between updates
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Participant victory
    const test2 = await addParticipantVictoryTo번매11();
    console.log('✅ [TEST] Participant victory test:', test2 ? 'SUCCESS' : 'FAILED');

    // Wait between updates
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 3: Tiebreak scenario
    const test3 = await addTiebreakResultTo번매10();
    console.log('✅ [TEST] Tiebreak result test:', test3 ? 'SUCCESS' : 'FAILED');

    console.log('🎉 [TEST] All test results added!');
    console.log('📱 [TEST] Check the Activity tab to see match results in both host and applicant views!');

    return {
      hostVictory: test1,
      participantVictory: test2,
      tiebreakResult: test3
    };

  } catch (error) {
    console.error('❌ [TEST] Error adding test results:', error);
    throw error;
  }
}

// Development mode global functions
if (__DEV__) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).addTestResults = {
    addHostVictoryTo번매12,
    addParticipantVictoryTo번매11,
    addTiebreakResultTo번매10,
    addAllTestResults
  };

  console.log('🧪 [DEV] Test result functions available globally:');
  console.log('  - global.addTestResults.addHostVictoryTo번매12()');
  console.log('  - global.addTestResults.addParticipantVictoryTo번매11()');
  console.log('  - global.addTestResults.addTiebreakResultTo번매10()');
  console.log('  - global.addTestResults.addAllTestResults()');
}