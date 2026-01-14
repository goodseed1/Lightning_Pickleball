/**
 * 📊 [Conversation Analytics] Save Conversation Analysis
 *
 * 모든 AI 대화를 주제별로 분류하여 Firestore에 저장
 *
 * Firestore Schema: conversation_analytics/{analyticsId}
 * {
 *   userId: string,
 *   userName: string,
 *   userMessage: string,
 *   aiResponse: string,
 *   analysis: {
 *     topic: string,     // app_usage, tennis_rules, tennis_technique, etc.
 *     sentiment: string, // positive, neutral, negative
 *     intent: string,    // question, feedback, complaint, praise, etc.
 *     keywords: string[]
 *   },
 *   language: string,    // ko, en
 *   timestamp: Firestore Timestamp
 * }
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';

interface ConversationAnalysis {
  topic: string;
  sentiment: string;
  intent: string;
  keywords: string[];
}

interface SaveConversationAnalyticsData {
  userId: string;
  userName: string;
  userMessage: string;
  aiResponse: string;
  analysis: ConversationAnalysis;
  language: string;
}

interface SaveConversationAnalyticsResponse {
  success: boolean;
  analyticsId: string;
  message: string;
}

/**
 * Callable Function: 대화 분석 데이터 저장
 */
export const saveConversationAnalytics = onCall<
  SaveConversationAnalyticsData,
  Promise<SaveConversationAnalyticsResponse>
>(async request => {
  const { data, auth } = request;

  try {
    logger.info('📊 [Analytics] Received conversation analysis:', {
      userId: data.userId,
      topic: data.analysis?.topic,
      sentiment: data.analysis?.sentiment,
      intent: data.analysis?.intent,
    });

    // 인증 확인 (익명 리포트도 허용)
    if (!auth && !data.userId) {
      logger.warn('⚠️ [Analytics] Unauthenticated conversation analytics');
    }

    // 데이터 검증
    if (!data.userMessage || !data.analysis) {
      throw new HttpsError('invalid-argument', 'Missing required fields: userMessage, analysis');
    }

    // 유효한 토픽 목록
    const validTopics = [
      'app_usage',
      'tennis_rules',
      'tennis_technique',
      'tennis_equipment',
      'club_features',
      'match_features',
      'ranking_system',
      'tennis_fitness',
      'general_tennis',
      'feedback_positive',
      'feedback_negative',
      'off_topic',
      'greeting',
      'other',
    ];

    // 토픽 검증 (유효하지 않으면 'other'로 설정)
    const topic = validTopics.includes(data.analysis.topic) ? data.analysis.topic : 'other';

    // Firestore에 저장
    const analyticsRef = admin.firestore().collection('conversation_analytics');
    const analyticsDoc = await analyticsRef.add({
      userId: data.userId || auth?.uid || 'anonymous',
      userName: data.userName || 'Anonymous User',
      userMessage: data.userMessage,
      aiResponse: data.aiResponse || '',
      analysis: {
        topic: topic,
        sentiment: data.analysis.sentiment || 'neutral',
        intent: data.analysis.intent || 'other',
        keywords: data.analysis.keywords || [],
      },
      language: data.language || 'ko',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info(`✅ [Analytics] Conversation analytics saved: ${analyticsDoc.id}`);

    // 🎯 [KIM FIX] feedback_positive / feedback_negative 토픽은 user_feedback에도 저장
    if (topic === 'feedback_positive' || topic === 'feedback_negative') {
      await saveToUserFeedback(data, topic);
    }

    // 토픽별 집계 카운터 업데이트 (선택사항 - 성능 최적화용)
    await updateTopicCounter(topic);

    return {
      success: true,
      analyticsId: analyticsDoc.id,
      message: 'Conversation analytics saved successfully',
    };
  } catch (error) {
    logger.error('❌ [Analytics] Error saving conversation analytics:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      'internal',
      'Failed to save conversation analytics',
      error instanceof Error ? error.message : String(error)
    );
  }
});

/**
 * 토픽별 집계 카운터 업데이트
 * conversation_analytics_summary/counters 문서에 토픽별 카운트 저장
 */
async function updateTopicCounter(topic: string): Promise<void> {
  try {
    const summaryRef = admin.firestore().doc('conversation_analytics_summary/counters');

    await admin.firestore().runTransaction(async transaction => {
      const doc = await transaction.get(summaryRef);

      if (!doc.exists) {
        // 첫 번째 문서 생성
        transaction.set(summaryRef, {
          [topic]: 1,
          total: 1,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        // 기존 카운터 업데이트
        const currentCount = doc.data()?.[topic] || 0;
        const totalCount = doc.data()?.total || 0;

        transaction.update(summaryRef, {
          [topic]: currentCount + 1,
          total: totalCount + 1,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    });

    logger.info(`📊 [Analytics] Topic counter updated for: ${topic}`);
  } catch (error) {
    // 카운터 업데이트 실패는 전체 프로세스를 중단하지 않음
    logger.warn('⚠️ [Analytics] Failed to update topic counter:', error);
  }
}

/**
 * 🎯 [KIM FIX] AI 대화에서 감지된 피드백을 user_feedback 컬렉션에 저장
 * feedback_positive / feedback_negative 토픽을 Admin 화면에서 볼 수 있도록 함
 */
async function saveToUserFeedback(
  data: SaveConversationAnalyticsData,
  topic: string
): Promise<void> {
  try {
    const feedbackRef = admin.firestore().collection('user_feedback');

    // 피드백 타입 매핑
    const feedbackType = topic === 'feedback_positive' ? 'praise' : 'complaint';

    // 우선순위 결정 (긍정적 피드백은 낮은 우선순위, 부정적은 중간)
    const priority = topic === 'feedback_positive' ? 'low' : 'medium';

    // 제목 생성 (메시지의 처음 50자)
    const title =
      data.userMessage.length > 50 ? data.userMessage.substring(0, 50) + '...' : data.userMessage;

    const feedbackDoc = await feedbackRef.add({
      userId: data.userId || 'anonymous',
      userEmail: '', // AI 대화에서는 이메일 정보 없음
      userName: data.userName || 'Anonymous User',
      type: feedbackType,
      title: `[AI 챗봇] ${title}`,
      description: data.userMessage,
      status: 'new',
      priority: priority,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      // 추가 메타데이터
      source: 'ai_chatbot',
      aiResponse: data.aiResponse || '',
      language: data.language || 'ko',
      sentiment: data.analysis?.sentiment || 'neutral',
      keywords: data.analysis?.keywords || [],
    });

    logger.info(`✅ [Analytics] Feedback saved to user_feedback: ${feedbackDoc.id}`, {
      type: feedbackType,
      topic: topic,
    });
  } catch (error) {
    // user_feedback 저장 실패는 전체 프로세스를 중단하지 않음
    logger.warn('⚠️ [Analytics] Failed to save to user_feedback:', error);
  }
}
