/**
 * Test utility for submitting match results
 * This helps test the host/participant score synchronization
 */

import eventService from '../services/eventService';
import { db } from '../firebase/config';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export class TestMatchResultUtil {
  /**
   * Submit a test match result for testing score synchronization
   * @param {string} eventId - Event ID to submit result for
   * @param {string} winnerId - Winner user ID
   * @param {string} loserId - Loser user ID
   * @param {string} score - Match score (e.g., "6-2, 6-4")
   */
  static async submitTestResult(eventId, winnerId, loserId, score) {
    try {
      console.log('🧪 [TEST] Submitting test match result:', {
        eventId,
        winnerId,
        loserId,
        score,
      });

      // Use the existing eventService to submit the result
      const resultData = {
        winnerId,
        loserId,
        score,
      };

      const success = await eventService.recordMatchResult(eventId, resultData);

      if (success) {
        console.log('✅ [TEST] Match result submitted successfully');
        return true;
      } else {
        console.error('❌ [TEST] Failed to submit match result');
        return false;
      }
    } catch (error) {
      console.error('❌ [TEST] Error submitting test result:', error);
      throw error;
    }
  }

  /**
   * Direct Firebase update for testing purposes
   * @param {string} eventId - Event ID
   * @param {Object} testResult - Test result data
   */
  static async directFirebaseUpdate(eventId, testResult) {
    try {
      console.log('🔥 [TEST] Direct Firebase update for testing:', {
        eventId,
        testResult,
      });

      const eventRef = doc(db, 'events', eventId);
      const updateData = {
        result: {
          winnerId: testResult.winnerId,
          loserId: testResult.loserId,
          score: testResult.score,
          recordedAt: serverTimestamp(),
          recordedBy: testResult.winnerId, // Assume winner records the result
        },
        status: 'completed',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await updateDoc(eventRef, updateData);

      console.log('✅ [TEST] Direct Firebase update completed');
      return true;
    } catch (error) {
      console.error('❌ [TEST] Direct Firebase update failed:', error);
      throw error;
    }
  }

  /**
   * Create test scenarios for common match results
   */
  static getTestScenarios() {
    return [
      {
        name: 'Standard Win',
        score: '6-2, 6-4',
        description: 'Normal 2-set victory',
      },
      {
        name: 'Close Match',
        score: '7-6, 6-7, 6-4',
        description: '3-set thriller',
      },
      {
        name: 'Dominant Win',
        score: '6-0, 6-1',
        description: 'One-sided match',
      },
      {
        name: 'Tiebreak Finish',
        score: '6-4, 7-6',
        description: 'Match decided by tiebreak',
      },
    ];
  }
}

// Expose to global scope for testing in browser console
if (typeof window !== 'undefined') {
  window.TestMatchResultUtil = TestMatchResultUtil;
}

export default TestMatchResultUtil;