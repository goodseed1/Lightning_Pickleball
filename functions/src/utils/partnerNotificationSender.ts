/**
 * ⚡ [OPERATION DUO] Partner Notification Sender
 *
 * Centralized utility for sending partner invitation-related push notifications.
 * Integrates with Expo Push Notification Service for immediate user engagement.
 *
 * Philosophy: Notify users immediately of partner invitation events
 *
 * 🌍 i18n Support: All notifications support 10 languages based on user's preferredLanguage
 * Supported: ko, en, ja, zh, de, fr, es, it, pt, ru
 *
 * @author Kim
 * @date 2025-01-10 (Updated for 10-language support)
 */

import * as admin from 'firebase-admin';

// ============================================================================
// 🌍 i18n Configuration - 10 Languages Support
// ============================================================================

type SupportedLanguage = 'ko' | 'en' | 'ja' | 'zh' | 'de' | 'fr' | 'es' | 'it' | 'pt' | 'ru';

interface UserPushInfo {
  pushToken: string | null;
  notificationSettings: Record<string, boolean | undefined>;
  language: SupportedLanguage;
}

/**
 * 🌍 i18n Push Notification Messages for Partner Invitations
 */
const i18nPushMessages = {
  partnerInvite: {
    title: {
      ko: '🎾 새로운 파트너 초대!',
      en: '🎾 New Partner Invitation!',
      ja: '🎾 新しいパートナー招待！',
      zh: '🎾 新的搭档邀请！',
      de: '🎾 Neue Partner-Einladung!',
      fr: '🎾 Nouvelle invitation partenaire!',
      es: '🎾 ¡Nueva invitación de compañero!',
      it: '🎾 Nuovo invito partner!',
      pt: '🎾 Novo convite de parceiro!',
      ru: '🎾 Новое приглашение партнёра!',
    },
    body: {
      ko: "{inviterName}님이 '{eventTitle}' 번개매치의 파트너로 당신을 초대했습니다.",
      en: "{inviterName} has invited you to be their partner for '{eventTitle}'.",
      ja: '{inviterName}さんが「{eventTitle}」のパートナーとしてあなたを招待しました。',
      zh: '{inviterName} 邀请您作为「{eventTitle}」的搭档。',
      de: "{inviterName} hat Sie als Partner für '{eventTitle}' eingeladen.",
      fr: "{inviterName} vous a invité comme partenaire pour '{eventTitle}'.",
      es: "{inviterName} te ha invitado como compañero para '{eventTitle}'.",
      it: "{inviterName} ti ha invitato come partner per '{eventTitle}'.",
      pt: "{inviterName} convidou você como parceiro para '{eventTitle}'.",
      ru: '{inviterName} пригласил вас быть партнёром для «{eventTitle}».',
    },
  },
  partnerInviteAccepted: {
    title: {
      ko: '🎉 파트너 초대 수락!',
      en: '🎉 Partner Invitation Accepted!',
      ja: '🎉 パートナー招待が承諾されました！',
      zh: '🎉 搭档邀请已接受！',
      de: '🎉 Partner-Einladung angenommen!',
      fr: '🎉 Invitation partenaire acceptée!',
      es: '🎉 ¡Invitación de compañero aceptada!',
      it: '🎉 Invito partner accettato!',
      pt: '🎉 Convite de parceiro aceito!',
      ru: '🎉 Приглашение партнёра принято!',
    },
    body: {
      ko: "{accepterName}님이 '{eventTitle}' 번개매치 파트너 초대를 수락했습니다!",
      en: "{accepterName} has accepted your partner invitation for '{eventTitle}'!",
      ja: '{accepterName}さんが「{eventTitle}」のパートナー招待を承諾しました！',
      zh: '{accepterName} 已接受您的「{eventTitle}」搭档邀请！',
      de: "{accepterName} hat Ihre Partner-Einladung für '{eventTitle}' angenommen!",
      fr: "{accepterName} a accepté votre invitation pour '{eventTitle}'!",
      es: "¡{accepterName} ha aceptado tu invitación para '{eventTitle}'!",
      it: "{accepterName} ha accettato il tuo invito per '{eventTitle}'!",
      pt: "{accepterName} aceitou seu convite para '{eventTitle}'!",
      ru: '{accepterName} принял ваше приглашение для «{eventTitle}»!',
    },
  },
  partnerInviteRejected: {
    title: {
      ko: '😔 파트너 초대 거절',
      en: '😔 Partner Invitation Declined',
      ja: '😔 パートナー招待が辞退されました',
      zh: '😔 搭档邀请被拒绝',
      de: '😔 Partner-Einladung abgelehnt',
      fr: '😔 Invitation partenaire refusée',
      es: '😔 Invitación de compañero rechazada',
      it: '😔 Invito partner rifiutato',
      pt: '😔 Convite de parceiro recusado',
      ru: '😔 Приглашение партнёра отклонено',
    },
    body: {
      ko: "{rejecterName}님이 '{eventTitle}' 번개매치 파트너 초대를 거절했습니다. 다른 파트너를 찾아보세요.",
      en: "{rejecterName} has declined your partner invitation for '{eventTitle}'. Find another partner.",
      ja: '{rejecterName}さんが「{eventTitle}」のパートナー招待を辞退しました。他のパートナーを探してください。',
      zh: '{rejecterName} 拒绝了您的「{eventTitle}」搭档邀请。请寻找其他搭档。',
      de: "{rejecterName} hat Ihre Partner-Einladung für '{eventTitle}' abgelehnt. Suchen Sie einen anderen Partner.",
      fr: "{rejecterName} a refusé votre invitation pour '{eventTitle}'. Trouvez un autre partenaire.",
      es: "{rejecterName} ha rechazado tu invitación para '{eventTitle}'. Busca otro compañero.",
      it: "{rejecterName} ha rifiutato il tuo invito per '{eventTitle}'. Trova un altro partner.",
      pt: "{rejecterName} recusou seu convite para '{eventTitle}'. Encontre outro parceiro.",
      ru: '{rejecterName} отклонил ваше приглашение для «{eventTitle}». Найдите другого партнёра.',
    },
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Replace placeholders in message template
 */
function replacePlaceholders(template: string, values: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

/**
 * Get user's push token, notification settings, and language from Firestore
 * @param userId - User ID
 * @returns Push token, notification settings, and language
 */
async function getUserPushInfo(userId: string): Promise<UserPushInfo> {
  try {
    const db = admin.firestore();
    const userRef = db.doc(`users/${userId}`);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      console.warn(`⚠️ [PARTNER NOTIFICATION] User not found: ${userId}`);
      return { pushToken: null, notificationSettings: {}, language: 'en' };
    }

    const userData = userSnap.data();
    const pushToken = userData?.pushToken || null;
    const notificationSettings = userData?.notificationSettings || {};

    // Get user's preferred language (check all possible field paths, default to 'en')
    const lang =
      userData?.preferredLanguage || userData?.language || userData?.preferences?.language || 'en';
    const supportedLanguages: SupportedLanguage[] = [
      'ko',
      'en',
      'ja',
      'zh',
      'de',
      'fr',
      'es',
      'it',
      'pt',
      'ru',
    ];
    const language: SupportedLanguage = supportedLanguages.includes(lang as SupportedLanguage)
      ? (lang as SupportedLanguage)
      : 'en';

    if (!pushToken) {
      console.log(`⚠️ [PARTNER NOTIFICATION] User ${userId} does not have a push token`);
    }

    return { pushToken, notificationSettings, language };
  } catch (error: unknown) {
    console.error(`❌ [PARTNER NOTIFICATION] Failed to get push info for user ${userId}:`, error);
    return { pushToken: null, notificationSettings: {}, language: 'en' };
  }
}

/**
 * Check if user has invite category notifications enabled
 * @param settings - User's notification settings
 * @returns true if notifications are enabled
 */
function isInviteNotificationEnabled(settings: Record<string, boolean | undefined>): boolean {
  // Check category master toggle (new format)
  if (settings.inviteCategoryEnabled === false) {
    return false;
  }
  // Check legacy partner invite setting
  if (settings.partnerInviteNotifications === false) {
    return false;
  }
  return true;
}

/**
 * Send push notification via Expo Push Notification Service
 * @param pushToken - Expo push token
 * @param title - Notification title
 * @param body - Notification body
 * @param data - Additional data payload
 * @returns Success status
 */
async function sendExpoPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data: Record<string, unknown>
): Promise<{ success: boolean; error?: string; ticketId?: string }> {
  try {
    const message = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
      channelId: 'partner-invitations',
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (result.errors) {
      console.error('❌ [PARTNER NOTIFICATION] Push notification errors:', result.errors);
      return { success: false, error: result.errors[0]?.message };
    }

    return { success: true, ticketId: result.data?.id };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [PARTNER NOTIFICATION] Failed to send push notification:', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Log push notification to Firestore
 * @param userId - User ID
 * @param type - Notification type
 * @param metadata - Additional metadata
 * @param status - Notification status
 */
async function logPushNotification(
  userId: string,
  type: string,
  metadata: Record<string, unknown>,
  status: 'sent' | 'failed'
): Promise<void> {
  try {
    const db = admin.firestore();
    await db.collection('push_notification_logs').add({
      userId,
      type,
      ...metadata,
      status,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error: unknown) {
    console.error('❌ [PARTNER NOTIFICATION] Failed to log push notification:', error);
  }
}

// ============================================================================
// Exported Functions
// ============================================================================

/**
 * Send partner invitation notification to invitee
 * 🌍 Supports 10 languages based on recipient's preferredLanguage
 *
 * @param invitationId - Invitation ID
 * @param inviterId - Inviter user ID
 * @param inviterName - Inviter display name
 * @param inviteeId - Invitee user ID
 * @param inviteeName - Invitee display name
 * @param eventId - Event ID
 * @param eventTitle - Event title
 * @param gameType - Game type (mens_doubles, womens_doubles, mixed_doubles)
 * @returns Success status
 */
export async function sendPartnerInviteNotification(
  invitationId: string,
  inviterId: string,
  inviterName: string,
  inviteeId: string,
  inviteeName: string,
  eventId: string,
  eventTitle: string,
  gameType: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`⚡ [PARTNER NOTIFICATION] Sending partner invite notification:`, {
    invitationId,
    inviter: inviterName,
    invitee: inviteeName,
    event: eventTitle,
  });

  try {
    const { pushToken, notificationSettings, language } = await getUserPushInfo(inviteeId);

    if (!pushToken) {
      return { success: false, error: 'No push token' };
    }

    // 🔔 Check if user has invite notifications enabled
    if (!isInviteNotificationEnabled(notificationSettings)) {
      console.log(`⚙️ [PARTNER NOTIFICATION] User ${inviteeId} has disabled invite notifications`);
      return { success: false, error: 'Notifications disabled by user' };
    }

    // 🌍 Get localized messages
    const title = i18nPushMessages.partnerInvite.title[language];
    const bodyTemplate = i18nPushMessages.partnerInvite.body[language];
    const body = replacePlaceholders(bodyTemplate, { inviterName, eventTitle });

    console.log(`🌍 [PARTNER NOTIFICATION] Sending in language: ${language}`);

    const result = await sendExpoPushNotification(pushToken, title, body, {
      type: 'partner_invite',
      notificationType: 'PARTNER_INVITE',
      invitationId,
      inviterId,
      inviterName,
      inviteeId,
      inviteeName,
      eventId,
      eventTitle,
      gameType,
    });

    await logPushNotification(
      inviteeId,
      'partner_invite',
      { invitationId, inviterId, eventId, gameType, language },
      result.success ? 'sent' : 'failed'
    );

    if (result.success) {
      console.log('✅ [PARTNER NOTIFICATION] Partner invite notification sent successfully');
    }

    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [PARTNER NOTIFICATION] Failed to send partner invite notification:', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send partner invitation accepted notification to inviter
 * 🌍 Supports 10 languages based on recipient's preferredLanguage
 *
 * @param invitationId - Invitation ID
 * @param inviterId - Inviter user ID (will receive notification)
 * @param inviterName - Inviter display name
 * @param accepterId - Accepter user ID
 * @param accepterName - Accepter display name
 * @param eventId - Event ID
 * @param eventTitle - Event title
 * @param gameType - Game type
 * @returns Success status
 */
export async function sendPartnerInviteAcceptedNotification(
  invitationId: string,
  inviterId: string,
  inviterName: string,
  accepterId: string,
  accepterName: string,
  eventId: string,
  eventTitle: string,
  gameType: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`✅ [PARTNER NOTIFICATION] Sending partner invite accepted notification:`, {
    invitationId,
    inviter: inviterName,
    accepter: accepterName,
    event: eventTitle,
  });

  try {
    const { pushToken, notificationSettings, language } = await getUserPushInfo(inviterId);

    if (!pushToken) {
      return { success: false, error: 'No push token' };
    }

    // 🔔 Check if user has invite notifications enabled
    if (!isInviteNotificationEnabled(notificationSettings)) {
      console.log(`⚙️ [PARTNER NOTIFICATION] User ${inviterId} has disabled invite notifications`);
      return { success: false, error: 'Notifications disabled by user' };
    }

    // 🌍 Get localized messages
    const title = i18nPushMessages.partnerInviteAccepted.title[language];
    const bodyTemplate = i18nPushMessages.partnerInviteAccepted.body[language];
    const body = replacePlaceholders(bodyTemplate, { accepterName, eventTitle });

    console.log(`🌍 [PARTNER NOTIFICATION] Sending in language: ${language}`);

    const result = await sendExpoPushNotification(pushToken, title, body, {
      type: 'partner_invite_accepted',
      notificationType: 'PARTNER_INVITE_ACCEPTED',
      invitationId,
      inviterId,
      inviterName,
      accepterId,
      accepterName,
      eventId,
      eventTitle,
      gameType,
    });

    await logPushNotification(
      inviterId,
      'partner_invite_accepted',
      { invitationId, accepterId, eventId, gameType, language },
      result.success ? 'sent' : 'failed'
    );

    if (result.success) {
      console.log(
        '✅ [PARTNER NOTIFICATION] Partner invite accepted notification sent successfully'
      );
    }

    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(
      '❌ [PARTNER NOTIFICATION] Failed to send partner invite accepted notification:',
      error
    );
    return { success: false, error: errorMessage };
  }
}

/**
 * Send partner invitation rejected notification to inviter
 * 🌍 Supports 10 languages based on recipient's preferredLanguage
 *
 * @param invitationId - Invitation ID
 * @param inviterId - Inviter user ID (will receive notification)
 * @param inviterName - Inviter display name
 * @param rejecterId - Rejecter user ID
 * @param rejecterName - Rejecter display name
 * @param eventId - Event ID
 * @param eventTitle - Event title
 * @param gameType - Game type
 * @returns Success status
 */
export async function sendPartnerInviteRejectedNotification(
  invitationId: string,
  inviterId: string,
  inviterName: string,
  rejecterId: string,
  rejecterName: string,
  eventId: string,
  eventTitle: string,
  gameType: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`❌ [PARTNER NOTIFICATION] Sending partner invite rejected notification:`, {
    invitationId,
    inviter: inviterName,
    rejecter: rejecterName,
    event: eventTitle,
  });

  try {
    const { pushToken, notificationSettings, language } = await getUserPushInfo(inviterId);

    if (!pushToken) {
      return { success: false, error: 'No push token' };
    }

    // 🔔 Check if user has invite notifications enabled
    if (!isInviteNotificationEnabled(notificationSettings)) {
      console.log(`⚙️ [PARTNER NOTIFICATION] User ${inviterId} has disabled invite notifications`);
      return { success: false, error: 'Notifications disabled by user' };
    }

    // 🌍 Get localized messages
    const title = i18nPushMessages.partnerInviteRejected.title[language];
    const bodyTemplate = i18nPushMessages.partnerInviteRejected.body[language];
    const body = replacePlaceholders(bodyTemplate, { rejecterName, eventTitle });

    console.log(`🌍 [PARTNER NOTIFICATION] Sending in language: ${language}`);

    const result = await sendExpoPushNotification(pushToken, title, body, {
      type: 'partner_invite_rejected',
      notificationType: 'PARTNER_INVITE_REJECTED',
      invitationId,
      inviterId,
      inviterName,
      rejecterId,
      rejecterName,
      eventId,
      eventTitle,
      gameType,
    });

    await logPushNotification(
      inviterId,
      'partner_invite_rejected',
      { invitationId, rejecterId, eventId, gameType, language },
      result.success ? 'sent' : 'failed'
    );

    if (result.success) {
      console.log(
        '✅ [PARTNER NOTIFICATION] Partner invite rejected notification sent successfully'
      );
    }

    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(
      '❌ [PARTNER NOTIFICATION] Failed to send partner invite rejected notification:',
      error
    );
    return { success: false, error: errorMessage };
  }
}
