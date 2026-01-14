/**
 * 🌉 [HEIMDALL] Email Notification Sender
 *
 * Centralized utility for sending email notifications via SendGrid.
 * Provides professional email templates for tournament and team events.
 *
 * Setup Required:
 * 1. Get SendGrid API key from https://sendgrid.com/
 * 2. Set environment variable: firebase functions:config:set sendgrid.api_key="YOUR_KEY"
 * 3. Verify sender email in SendGrid dashboard
 * 4. Update FROM_EMAIL constant below
 *
 * Philosophy: Keep users informed via email for important events
 */

import * as admin from 'firebase-admin';
import * as sgMail from '@sendgrid/mail';

// Configuration
const FROM_EMAIL = 'noreply@lightning-tennis.com'; // TODO: Update with verified sender email
const APP_NAME = 'Lightning Tennis';

// Initialize SendGrid with API key from environment
const sendgridApiKey = process.env.SENDGRID_API_KEY || '';
if (sendgridApiKey) {
  sgMail.setApiKey(sendgridApiKey);
} else {
  console.warn('⚠️ [EMAIL] SendGrid API key not configured. Email notifications will be skipped.');
}

/**
 * Get user's email from Firestore
 * @param userId - User ID
 * @returns User email or null
 */
async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const db = admin.firestore();
    const userRef = db.doc(`users/${userId}`);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      console.warn(`⚠️ [EMAIL] User not found: ${userId}`);
      return null;
    }

    const userData = userSnap.data();
    const email = userData?.email;

    if (!email) {
      console.log(`⚠️ [EMAIL] User ${userId} does not have an email address`);
      return null;
    }

    return email;
  } catch (error: unknown) {
    console.error(`❌ [EMAIL] Failed to get email for user ${userId}:`, error);
    return null;
  }
}

/**
 * Send email via SendGrid
 * @param to - Recipient email
 * @param subject - Email subject
 * @param html - HTML email body
 * @param text - Plain text email body (fallback)
 * @returns Success status
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  if (!sendgridApiKey) {
    console.warn('⚠️ [EMAIL] SendGrid not configured. Skipping email send.');
    return { success: false, error: 'SendGrid not configured' };
  }

  try {
    const msg = {
      to,
      from: FROM_EMAIL,
      subject,
      text,
      html,
    };

    await sgMail.send(msg);
    console.log(`✅ [EMAIL] Email sent successfully to ${to}`);
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ [EMAIL] Failed to send email to ${to}:`, error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Log email notification to Firestore
 * @param userId - User ID
 * @param type - Email type
 * @param metadata - Additional metadata
 * @param status - Email status
 */
async function logEmailNotification(
  userId: string,
  type: string,
  metadata: Record<string, unknown>,
  status: 'sent' | 'failed'
): Promise<void> {
  try {
    const db = admin.firestore();
    await db.collection('email_notification_logs').add({
      userId,
      type,
      ...metadata,
      status,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error: unknown) {
    console.error('❌ [EMAIL] Failed to log email notification:', error);
  }
}

/**
 * Generate HTML email template
 * @param title - Email title
 * @param body - Email body (supports HTML)
 * @param ctaText - Call-to-action button text (optional)
 * @param ctaLink - Call-to-action button link (optional)
 * @returns HTML string
 */
function generateEmailTemplate(
  title: string,
  body: string,
  ctaText?: string,
  ctaLink?: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 40px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
    .content { padding: 40px 20px; }
    .content h2 { color: #667eea; margin-top: 0; }
    .content p { margin: 16px 0; }
    .cta { text-align: center; margin: 32px 0; }
    .cta a { display: inline-block; padding: 14px 32px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; }
    .footer { background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .footer a { color: #667eea; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚡ ${APP_NAME}</h1>
    </div>
    <div class="content">
      <h2>${title}</h2>
      ${body}
      ${ctaText && ctaLink ? `<div class="cta"><a href="${ctaLink}">${ctaText}</a></div>` : ''}
    </div>
    <div class="footer">
      <p>This email was sent by ${APP_NAME}</p>
      <p>If you have any questions, please contact us at support@lightning-tennis.com</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send tournament invitation email
 * @param userId - User ID
 * @param userName - User name
 * @param tournamentName - Tournament name
 * @param tournamentId - Tournament ID
 * @param clubName - Club name
 * @returns Success status
 */
export async function sendTournamentInvitationEmail(
  userId: string,
  userName: string,
  tournamentName: string,
  tournamentId: string,
  clubName: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`📧 [EMAIL] Sending tournament invitation email to user ${userId}`);

  try {
    const email = await getUserEmail(userId);
    if (!email) {
      return { success: false, error: 'No email address' };
    }

    const subject = `⚡ ${clubName} - ${tournamentName} 토너먼트 초대`;
    const body = `
      <p>안녕하세요, ${userName}님!</p>
      <p><strong>${clubName}</strong>에서 <strong>${tournamentName}</strong> 토너먼트에 초대하셨습니다.</p>
      <p>지금 바로 참가 신청하고 실력을 뽐내보세요!</p>
    `;
    const html = generateEmailTemplate(
      '토너먼트 초대',
      body,
      '토너먼트 확인하기',
      `https://lightning-tennis.com/tournaments/${tournamentId}`
    );
    const text = `${clubName}에서 ${tournamentName} 토너먼트에 초대하셨습니다. 앱에서 확인해주세요!`;

    const result = await sendEmail(email, subject, html, text);
    await logEmailNotification(
      userId,
      'tournament_invitation',
      { tournamentId, tournamentName, clubName },
      result.success ? 'sent' : 'failed'
    );

    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [EMAIL] Failed to send tournament invitation email:', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send team invitation email
 * @param inviteeId - Invitee user ID
 * @param inviteeName - Invitee name
 * @param inviterName - Inviter name
 * @param tournamentName - Tournament name
 * @param teamId - Team ID
 * @returns Success status
 */
export async function sendTeamInvitationEmail(
  inviteeId: string,
  inviteeName: string,
  inviterName: string,
  tournamentName: string,
  teamId: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`📧 [EMAIL] Sending team invitation email to user ${inviteeId}`);

  try {
    const email = await getUserEmail(inviteeId);
    if (!email) {
      return { success: false, error: 'No email address' };
    }

    const subject = `⚡ ${inviterName}님이 팀 파트너로 초대하셨습니다`;
    const body = `
      <p>안녕하세요, ${inviteeName}님!</p>
      <p><strong>${inviterName}</strong>님이 <strong>${tournamentName}</strong> 토너먼트에서 팀 파트너로 당신을 초대하셨습니다.</p>
      <p>함께 우승을 향해 달려보세요! 💪</p>
    `;
    const html = generateEmailTemplate(
      '팀 파트너 초대',
      body,
      '초대 확인하기',
      `https://lightning-tennis.com/teams/${teamId}`
    );
    const text = `${inviterName}님이 ${tournamentName} 토너먼트에서 팀 파트너로 초대하셨습니다. 앱에서 확인해주세요!`;

    const result = await sendEmail(email, subject, html, text);
    await logEmailNotification(
      inviteeId,
      'team_invitation',
      { teamId, tournamentName, inviterName },
      result.success ? 'sent' : 'failed'
    );

    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [EMAIL] Failed to send team invitation email:', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send match reminder email
 * @param userId - User ID
 * @param userName - User name
 * @param opponentName - Opponent name
 * @param matchTime - Match time
 * @param location - Match location
 * @param matchId - Match ID
 * @returns Success status
 */
export async function sendMatchReminderEmail(
  userId: string,
  userName: string,
  opponentName: string,
  matchTime: string,
  location: string,
  matchId: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`📧 [EMAIL] Sending match reminder email to user ${userId}`);

  try {
    const email = await getUserEmail(userId);
    if (!email) {
      return { success: false, error: 'No email address' };
    }

    const subject = `⚡ 경기 리마인더: ${opponentName}님과의 매치`;
    const body = `
      <p>안녕하세요, ${userName}님!</p>
      <p><strong>${opponentName}</strong>님과의 경기가 곧 시작됩니다.</p>
      <p><strong>일시:</strong> ${matchTime}</p>
      <p><strong>장소:</strong> ${location}</p>
      <p>최선을 다해 멋진 경기 펼쳐주세요! 🎾</p>
    `;
    const html = generateEmailTemplate(
      '경기 리마인더',
      body,
      '경기 상세 보기',
      `https://lightning-tennis.com/matches/${matchId}`
    );
    const text = `${opponentName}님과의 경기가 ${matchTime}에 ${location}에서 열립니다. 앱에서 확인해주세요!`;

    const result = await sendEmail(email, subject, html, text);
    await logEmailNotification(
      userId,
      'match_reminder',
      { matchId, opponentName, matchTime, location },
      result.success ? 'sent' : 'failed'
    );

    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [EMAIL] Failed to send match reminder email:', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send tournament completion email with results
 * @param userId - User ID
 * @param userName - User name
 * @param tournamentName - Tournament name
 * @param placement - User's placement (e.g., "1st", "2nd", "3rd")
 * @param eloChange - ELO rating change
 * @param tournamentId - Tournament ID
 * @returns Success status
 */
export async function sendTournamentCompletionEmail(
  userId: string,
  userName: string,
  tournamentName: string,
  placement: string,
  eloChange: number,
  tournamentId: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`📧 [EMAIL] Sending tournament completion email to user ${userId}`);

  try {
    const email = await getUserEmail(userId);
    if (!email) {
      return { success: false, error: 'No email address' };
    }

    const isWinner = placement === '1st' || placement === '우승';
    const emoji = isWinner ? '🏆' : '🎾';
    const congratsText = isWinner ? '축하합니다! 우승하셨습니다!' : '수고하셨습니다!';

    const subject = `${emoji} ${tournamentName} 토너먼트 결과`;
    const body = `
      <p>안녕하세요, ${userName}님!</p>
      <p><strong>${tournamentName}</strong> 토너먼트가 종료되었습니다.</p>
      <p>${congratsText}</p>
      <p><strong>최종 순위:</strong> ${placement}</p>
      <p><strong>ELO 변동:</strong> ${eloChange >= 0 ? '+' : ''}${eloChange}</p>
      ${isWinner ? '<p>🏆 우승 트로피가 Hall of Fame에 추가되었습니다!</p>' : ''}
      <p>다음 토너먼트에서 다시 만나요!</p>
    `;
    const html = generateEmailTemplate(
      '토너먼트 결과',
      body,
      '결과 상세 보기',
      `https://lightning-tennis.com/tournaments/${tournamentId}`
    );
    const text = `${tournamentName} 토너먼트가 종료되었습니다. 최종 순위: ${placement}, ELO 변동: ${eloChange}`;

    const result = await sendEmail(email, subject, html, text);
    await logEmailNotification(
      userId,
      'tournament_completion',
      { tournamentId, tournamentName, placement, eloChange },
      result.success ? 'sent' : 'failed'
    );

    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [EMAIL] Failed to send tournament completion email:', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send weekly activity summary email
 * @param userId - User ID
 * @param userName - User name
 * @param stats - Weekly stats (matches played, wins, losses, etc.)
 * @returns Success status
 */
export async function sendWeeklySummaryEmail(
  userId: string,
  userName: string,
  stats: {
    matchesPlayed: number;
    wins: number;
    losses: number;
    eloChange: number;
    newBadges: number;
    upcomingMatches: number;
  }
): Promise<{ success: boolean; error?: string }> {
  console.log(`📧 [EMAIL] Sending weekly summary email to user ${userId}`);

  try {
    const email = await getUserEmail(userId);
    if (!email) {
      return { success: false, error: 'No email address' };
    }

    const subject = '⚡ 이번 주 활동 요약';
    const body = `
      <p>안녕하세요, ${userName}님!</p>
      <p>이번 주 Lightning Tennis 활동을 정리해드립니다:</p>
      <ul>
        <li><strong>경기 수:</strong> ${stats.matchesPlayed}경기</li>
        <li><strong>전적:</strong> ${stats.wins}승 ${stats.losses}패</li>
        <li><strong>ELO 변동:</strong> ${stats.eloChange >= 0 ? '+' : ''}${stats.eloChange}</li>
        ${stats.newBadges > 0 ? `<li><strong>새로운 배지:</strong> ${stats.newBadges}개 획득! 🏅</li>` : ''}
        ${stats.upcomingMatches > 0 ? `<li><strong>예정된 경기:</strong> ${stats.upcomingMatches}경기</li>` : ''}
      </ul>
      <p>계속해서 멋진 경기 펼쳐주세요! 🎾</p>
    `;
    const html = generateEmailTemplate(
      '주간 활동 요약',
      body,
      '내 프로필 보기',
      'https://lightning-tennis.com/profile'
    );
    const text = `이번 주 ${stats.matchesPlayed}경기를 하셨습니다 (${stats.wins}승 ${stats.losses}패). ELO 변동: ${stats.eloChange}`;

    const result = await sendEmail(email, subject, html, text);
    await logEmailNotification(userId, 'weekly_summary', stats, result.success ? 'sent' : 'failed');

    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [EMAIL] Failed to send weekly summary email:', error);
    return { success: false, error: errorMessage };
  }
}
