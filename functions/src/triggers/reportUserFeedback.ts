/**
 * 🚨 [Project Sentinel] Report User Feedback
 *
 * AI가 감지한 사용자 이슈를 Firestore에 자동 저장
 *
 * Firestore Schema: user_feedback/{feedbackId}
 * {
 *   userId: string,
 *   userName: string,
 *   userMessage: string,
 *   aiResponse: string,
 *   detectedIssue: {
 *     priority: 'high' | 'medium' | 'low',
 *     category: 'bug' | 'ux' | 'confusion',
 *     keywords: string[],
 *     context: string
 *   },
 *   timestamp: Firestore Timestamp,
 *   status: 'new' | 'reviewing' | 'resolved',
 *   adminNotes?: string
 * }
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as nodemailer from 'nodemailer';

interface DetectedIssue {
  priority: 'high' | 'medium' | 'low';
  category: 'bug' | 'ux' | 'confusion';
  keywords: string[];
  context: string;
}

interface ReportUserFeedbackData {
  userId: string;
  userName: string;
  userMessage: string;
  aiResponse: string;
  detectedIssue: DetectedIssue;
}

interface ReportUserFeedbackResponse {
  success: boolean;
  feedbackId: string;
  message: string;
}

/**
 * Callable Function: 사용자 피드백 리포트 저장
 */
export const reportUserFeedback = onCall<
  ReportUserFeedbackData,
  Promise<ReportUserFeedbackResponse>
>(async request => {
  const { data, auth } = request;

  try {
    logger.info('🚨 [Sentinel] Received user feedback report:', data);

    // 인증 확인 (선택사항 - 익명 리포트도 허용 가능)
    if (!auth && !data.userId) {
      logger.warn('⚠️ [Sentinel] Unauthenticated feedback report');
      // 익명 리포트도 허용하려면 여기서 return하지 않음
    }

    // 데이터 검증
    if (!data.userMessage || !data.detectedIssue) {
      throw new HttpsError(
        'invalid-argument',
        'Missing required fields: userMessage, detectedIssue'
      );
    }

    // Firestore에 저장
    const feedbackRef = admin.firestore().collection('user_feedback');
    const feedbackDoc = await feedbackRef.add({
      userId: data.userId || auth?.uid || 'anonymous',
      userName: data.userName || 'Anonymous User',
      userMessage: data.userMessage,
      aiResponse: data.aiResponse || '',
      detectedIssue: {
        priority: data.detectedIssue.priority,
        category: data.detectedIssue.category,
        keywords: data.detectedIssue.keywords || [],
        context: data.detectedIssue.context || '',
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'new',
    });

    logger.info(`✅ [Sentinel] Feedback saved: ${feedbackDoc.id}`);

    // 🔔 고우선순위 이슈일 경우 관리자 알림
    if (data.detectedIssue.priority === 'high') {
      logger.info('🔔 [Sentinel] High priority issue detected - Sending admin notification');
      await sendAdminNotification(feedbackDoc.id, data);
    }

    return {
      success: true,
      feedbackId: feedbackDoc.id,
      message: 'Feedback report saved successfully',
    };
  } catch (error) {
    logger.error('❌ [Sentinel] Error saving feedback:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      'internal',
      'Failed to save feedback report',
      error instanceof Error ? error.message : String(error)
    );
  }
});

/**
 * 관리자에게 이메일 알림 전송
 * 고우선순위 이슈 감지 시 즉시 알림
 */
async function sendAdminNotification(
  feedbackId: string,
  data: ReportUserFeedbackData
): Promise<void> {
  try {
    // 관리자 이메일
    const ADMIN_EMAIL = 'goodseed1@gmail.com';

    // Gmail SMTP 설정
    // 참고: Gmail App Password 필요 (2FA 활성화 후 생성)
    // https://myaccount.google.com/apppasswords
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER || 'your-email@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD || 'your-app-password',
      },
    });

    // 우선순위별 이모지
    const priorityEmoji = {
      high: '🚨',
      medium: '⚠️',
      low: 'ℹ️',
    };

    // 카테고리별 라벨
    const categoryLabel = {
      bug: 'Bug/Error',
      ux: 'UX Issue',
      confusion: 'User Confusion',
    };

    // 이메일 제목
    const subject = `${priorityEmoji[data.detectedIssue.priority]} [Sentinel] ${data.detectedIssue.priority.toUpperCase()} Priority Issue Detected`;

    // 이메일 본문 (HTML)
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f44336; color: white; padding: 15px; border-radius: 5px 5px 0 0; }
          .header.medium { background: #ff9800; }
          .header.low { background: #2196f3; }
          .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
          .section { margin-bottom: 20px; }
          .label { font-weight: bold; color: #555; }
          .value { margin-top: 5px; padding: 10px; background: white; border-left: 3px solid #2196f3; }
          .keywords { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px; }
          .keyword { background: #e3f2fd; padding: 5px 10px; border-radius: 3px; font-size: 12px; }
          .footer { margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 0 0 5px 5px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header ${data.detectedIssue.priority}">
            <h2>${priorityEmoji[data.detectedIssue.priority]} Lightning Pickleball - User Issue Alert</h2>
          </div>

          <div class="content">
            <div class="section">
              <div class="label">📋 Feedback ID:</div>
              <div class="value">${feedbackId}</div>
            </div>

            <div class="section">
              <div class="label">👤 User:</div>
              <div class="value">${data.userName} (${data.userId})</div>
            </div>

            <div class="section">
              <div class="label">💬 User Message:</div>
              <div class="value">${data.userMessage}</div>
            </div>

            <div class="section">
              <div class="label">🤖 AI Response:</div>
              <div class="value">${data.aiResponse}</div>
            </div>

            <div class="section">
              <div class="label">🚨 Issue Details:</div>
              <div class="value">
                <strong>Priority:</strong> ${data.detectedIssue.priority.toUpperCase()}<br>
                <strong>Category:</strong> ${categoryLabel[data.detectedIssue.category]}<br>
                <strong>Context:</strong> ${data.detectedIssue.context}
              </div>
            </div>

            <div class="section">
              <div class="label">🔍 Detected Keywords:</div>
              <div class="keywords">
                ${data.detectedIssue.keywords.map(keyword => `<span class="keyword">${keyword}</span>`).join('')}
              </div>
            </div>
          </div>

          <div class="footer">
            <p>🛡️ This alert was automatically generated by Project Sentinel</p>
            <p><a href="https://console.firebase.google.com/project/lightning-pickleball-community/firestore/databases/-default-/data/~2Fuser_feedback~2F${feedbackId}">View in Firestore Console</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    // 이메일 발송
    const info = await transporter.sendMail({
      from: `"Lightning Pickleball Sentinel" <${process.env.GMAIL_USER || 'noreply@lightningpickleball.app'}>`,
      to: ADMIN_EMAIL,
      subject: subject,
      html: htmlBody,
    });

    logger.info(`📧 [Sentinel] Email sent to admin: ${info.messageId}`);
  } catch (error) {
    logger.error('❌ [Sentinel] Failed to send email notification:', error);
    // 이메일 발송 실패는 전체 프로세스를 중단하지 않음 (silent fail)
  }
}
