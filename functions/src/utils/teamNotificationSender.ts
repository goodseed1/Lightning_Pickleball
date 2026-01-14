/**
 * 🌉 [HEIMDALL] Team Notification Sender
 *
 * Centralized utility for sending team-related push notifications.
 * Integrates with Expo Push Notification Service for immediate user engagement.
 *
 * Philosophy: Notify users immediately of team invitation events
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
  language: SupportedLanguage;
}

/**
 * 🌍 i18n Push Notification Messages for Team Invitations
 */
const i18nPushMessages = {
  teamInvite: {
    title: {
      ko: '⚡ 새로운 파트너 초대!',
      en: '⚡ New Partner Invitation!',
      ja: '⚡ 新しいパートナー招待！',
      zh: '⚡ 新的搭档邀请！',
      de: '⚡ Neue Partner-Einladung!',
      fr: '⚡ Nouvelle invitation partenaire!',
      es: '⚡ ¡Nueva invitación de compañero!',
      it: '⚡ Nuovo invito partner!',
      pt: '⚡ Novo convite de parceiro!',
      ru: '⚡ Новое приглашение партнёра!',
    },
    body: {
      ko: "{inviterName}님이 '{tournamentName}'의 파트너로 당신을 초대했습니다.",
      en: "{inviterName} has invited you to be their partner for '{tournamentName}'.",
      ja: '{inviterName}さんが「{tournamentName}」のパートナーとしてあなたを招待しました。',
      zh: '{inviterName} 邀请您作为「{tournamentName}」的搭档。',
      de: "{inviterName} hat Sie als Partner für '{tournamentName}' eingeladen.",
      fr: "{inviterName} vous a invité comme partenaire pour '{tournamentName}'.",
      es: "{inviterName} te ha invitado como compañero para '{tournamentName}'.",
      it: "{inviterName} ti ha invitato come partner per '{tournamentName}'.",
      pt: "{inviterName} convidou você como parceiro para '{tournamentName}'.",
      ru: '{inviterName} пригласил вас быть партнёром для «{tournamentName}».',
    },
  },
  teamInviteAccepted: {
    title: {
      ko: '🎉 팀 초대 수락!',
      en: '🎉 Team Invitation Accepted!',
      ja: '🎉 チーム招待が承諾されました！',
      zh: '🎉 团队邀请已接受！',
      de: '🎉 Team-Einladung angenommen!',
      fr: '🎉 Invitation équipe acceptée!',
      es: '🎉 ¡Invitación de equipo aceptada!',
      it: '🎉 Invito squadra accettato!',
      pt: '🎉 Convite de equipe aceito!',
      ru: '🎉 Приглашение в команду принято!',
    },
    body: {
      ko: "{accepterName}님이 '{tournamentName}' 팀 초대를 수락했습니다! 팀명: {teamName}",
      en: "{accepterName} has accepted your team invitation for '{tournamentName}'! Team: {teamName}",
      ja: '{accepterName}さんが「{tournamentName}」のチーム招待を承諾しました！チーム名: {teamName}',
      zh: '{accepterName} 已接受您的「{tournamentName}」团队邀请！团队名: {teamName}',
      de: "{accepterName} hat Ihre Team-Einladung für '{tournamentName}' angenommen! Team: {teamName}",
      fr: "{accepterName} a accepté votre invitation pour '{tournamentName}'! Équipe: {teamName}",
      es: "¡{accepterName} ha aceptado tu invitación para '{tournamentName}'! Equipo: {teamName}",
      it: "{accepterName} ha accettato il tuo invito per '{tournamentName}'! Squadra: {teamName}",
      pt: "{accepterName} aceitou seu convite para '{tournamentName}'! Equipe: {teamName}",
      ru: '{accepterName} принял ваше приглашение для «{tournamentName}»! Команда: {teamName}',
    },
  },
  teamInviteRejected: {
    title: {
      ko: '😔 팀 초대 거절',
      en: '😔 Team Invitation Declined',
      ja: '😔 チーム招待が辞退されました',
      zh: '😔 团队邀请被拒绝',
      de: '😔 Team-Einladung abgelehnt',
      fr: '😔 Invitation équipe refusée',
      es: '😔 Invitación de equipo rechazada',
      it: '😔 Invito squadra rifiutato',
      pt: '😔 Convite de equipe recusado',
      ru: '😔 Приглашение в команду отклонено',
    },
    body: {
      ko: "{rejecterName}님이 '{tournamentName}' 팀 초대를 거절했습니다. 다른 파트너를 찾아보세요.",
      en: "{rejecterName} has declined your team invitation for '{tournamentName}'. Find another partner.",
      ja: '{rejecterName}さんが「{tournamentName}」のチーム招待を辞退しました。他のパートナーを探してください。',
      zh: '{rejecterName} 拒绝了您的「{tournamentName}」团队邀请。请寻找其他搭档。',
      de: "{rejecterName} hat Ihre Team-Einladung für '{tournamentName}' abgelehnt. Suchen Sie einen anderen Partner.",
      fr: "{rejecterName} a refusé votre invitation pour '{tournamentName}'. Trouvez un autre partenaire.",
      es: "{rejecterName} ha rechazado tu invitación para '{tournamentName}'. Busca otro compañero.",
      it: "{rejecterName} ha rifiutato il tuo invito per '{tournamentName}'. Trova un altro partner.",
      pt: "{rejecterName} recusou seu convite para '{tournamentName}'. Encontre outro parceiro.",
      ru: '{rejecterName} отклонил ваше приглашение для «{tournamentName}». Найдите другого партнёра.',
    },
  },
  teamDisbanded: {
    title: {
      ko: '💔 팀 해체',
      en: '💔 Team Disbanded',
      ja: '💔 チーム解散',
      zh: '💔 团队已解散',
      de: '💔 Team aufgelöst',
      fr: '💔 Équipe dissoute',
      es: '💔 Equipo disuelto',
      it: '💔 Squadra sciolta',
      pt: '💔 Equipe desfeita',
      ru: '💔 Команда распущена',
    },
    body: {
      ko: "'{tournamentName}' 팀 '{teamName}'이(가) 해체되었습니다.",
      en: "Team '{teamName}' for '{tournamentName}' has been disbanded.",
      ja: '「{tournamentName}」のチーム「{teamName}」が解散しました。',
      zh: '「{tournamentName}」的团队「{teamName}」已解散。',
      de: "Team '{teamName}' für '{tournamentName}' wurde aufgelöst.",
      fr: "L'équipe '{teamName}' pour '{tournamentName}' a été dissoute.",
      es: "El equipo '{teamName}' para '{tournamentName}' ha sido disuelto.",
      it: "La squadra '{teamName}' per '{tournamentName}' è stata sciolta.",
      pt: "A equipe '{teamName}' para '{tournamentName}' foi desfeita.",
      ru: 'Команда «{teamName}» для «{tournamentName}» была распущена.',
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
 * Get user's push token and language from Firestore
 * @param userId - User ID
 * @returns Push token and language
 */
async function getUserPushInfo(userId: string): Promise<UserPushInfo> {
  try {
    const db = admin.firestore();
    const userRef = db.doc(`users/${userId}`);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      console.warn(`⚠️ [TEAM NOTIFICATION] User not found: ${userId}`);
      return { pushToken: null, language: 'en' };
    }

    const userData = userSnap.data();
    const pushToken = userData?.pushToken || null;

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
      console.log(`⚠️ [TEAM NOTIFICATION] User ${userId} does not have a push token`);
    }

    return { pushToken, language };
  } catch (error: unknown) {
    console.error(`❌ [TEAM NOTIFICATION] Failed to get push token for user ${userId}:`, error);
    return { pushToken: null, language: 'en' };
  }
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
      channelId: 'team-invitations',
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
      console.error('❌ [TEAM NOTIFICATION] Push notification errors:', result.errors);
      return { success: false, error: result.errors[0]?.message };
    }

    return { success: true, ticketId: result.data?.id };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [TEAM NOTIFICATION] Failed to send push notification:', error);
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
    console.error('❌ [TEAM NOTIFICATION] Failed to log push notification:', error);
  }
}

// ============================================================================
// Exported Functions
// ============================================================================

/**
 * Send team invitation notification to invitee
 * 🌍 Supports 10 languages based on recipient's preferredLanguage
 *
 * @param teamId - Team ID
 * @param inviterId - Inviter user ID
 * @param inviterName - Inviter display name
 * @param inviteeId - Invitee user ID
 * @param inviteeName - Invitee display name
 * @param tournamentId - Tournament ID
 * @param tournamentName - Tournament name
 * @param clubId - Club ID
 * @returns Success status
 */
export async function sendTeamInviteNotification(
  teamId: string,
  inviterId: string,
  inviterName: string,
  inviteeId: string,
  inviteeName: string,
  tournamentId: string,
  tournamentName: string,
  clubId: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`⚡ [TEAM NOTIFICATION] Sending team invite notification:`, {
    teamId,
    inviter: inviterName,
    invitee: inviteeName,
    tournament: tournamentName,
  });

  try {
    const { pushToken, language } = await getUserPushInfo(inviteeId);
    if (!pushToken) {
      return { success: false, error: 'No push token' };
    }

    // 🌍 Get localized messages
    const title = i18nPushMessages.teamInvite.title[language];
    const bodyTemplate = i18nPushMessages.teamInvite.body[language];
    const body = replacePlaceholders(bodyTemplate, { inviterName, tournamentName });

    console.log(`🌍 [TEAM NOTIFICATION] Sending in language: ${language}`);

    const result = await sendExpoPushNotification(pushToken, title, body, {
      type: 'team_invite',
      notificationType: 'CLUB_TEAM_INVITE',
      teamId,
      inviterId,
      inviterName,
      inviteeId,
      inviteeName,
      tournamentId,
      tournamentName,
      clubId,
    });

    await logPushNotification(
      inviteeId,
      'team_invite',
      { teamId, inviterId, tournamentId, clubId, language },
      result.success ? 'sent' : 'failed'
    );

    if (result.success) {
      console.log('✅ [TEAM NOTIFICATION] Team invite notification sent successfully');
    }

    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [TEAM NOTIFICATION] Failed to send team invite notification:', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send team invitation accepted notification to inviter
 * 🌍 Supports 10 languages based on recipient's preferredLanguage
 *
 * @param teamId - Team ID
 * @param inviterId - Inviter user ID (will receive notification)
 * @param inviterName - Inviter display name
 * @param accepterId - Accepter user ID
 * @param accepterName - Accepter display name
 * @param tournamentId - Tournament ID
 * @param tournamentName - Tournament name
 * @param clubId - Club ID
 * @param teamName - Team name
 * @returns Success status
 */
export async function sendTeamInviteAcceptedNotification(
  teamId: string,
  inviterId: string,
  inviterName: string,
  accepterId: string,
  accepterName: string,
  tournamentId: string,
  tournamentName: string,
  clubId: string,
  teamName: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`✅ [TEAM NOTIFICATION] Sending team invite accepted notification:`, {
    teamId,
    teamName,
    inviter: inviterName,
    accepter: accepterName,
    tournament: tournamentName,
  });

  try {
    const { pushToken, language } = await getUserPushInfo(inviterId);
    if (!pushToken) {
      return { success: false, error: 'No push token' };
    }

    // 🌍 Get localized messages
    const title = i18nPushMessages.teamInviteAccepted.title[language];
    const bodyTemplate = i18nPushMessages.teamInviteAccepted.body[language];
    const body = replacePlaceholders(bodyTemplate, { accepterName, tournamentName, teamName });

    console.log(`🌍 [TEAM NOTIFICATION] Sending in language: ${language}`);

    const result = await sendExpoPushNotification(pushToken, title, body, {
      type: 'team_invite_accepted',
      notificationType: 'CLUB_TEAM_INVITE_ACCEPTED',
      teamId,
      teamName,
      inviterId,
      inviterName,
      accepterId,
      accepterName,
      tournamentId,
      tournamentName,
      clubId,
    });

    await logPushNotification(
      inviterId,
      'team_invite_accepted',
      { teamId, teamName, accepterId, tournamentId, clubId, language },
      result.success ? 'sent' : 'failed'
    );

    if (result.success) {
      console.log('✅ [TEAM NOTIFICATION] Team invite accepted notification sent successfully');
    }

    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(
      '❌ [TEAM NOTIFICATION] Failed to send team invite accepted notification:',
      error
    );
    return { success: false, error: errorMessage };
  }
}

/**
 * Send team invitation rejected notification to inviter
 * 🌍 Supports 10 languages based on recipient's preferredLanguage
 *
 * @param teamId - Team ID
 * @param inviterId - Inviter user ID (will receive notification)
 * @param inviterName - Inviter display name
 * @param rejecterId - Rejecter user ID
 * @param rejecterName - Rejecter display name
 * @param tournamentId - Tournament ID
 * @param tournamentName - Tournament name
 * @param clubId - Club ID
 * @returns Success status
 */
export async function sendTeamInviteRejectedNotification(
  teamId: string,
  inviterId: string,
  inviterName: string,
  rejecterId: string,
  rejecterName: string,
  tournamentId: string,
  tournamentName: string,
  clubId: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`❌ [TEAM NOTIFICATION] Sending team invite rejected notification:`, {
    teamId,
    inviter: inviterName,
    rejecter: rejecterName,
    tournament: tournamentName,
  });

  try {
    const { pushToken, language } = await getUserPushInfo(inviterId);
    if (!pushToken) {
      return { success: false, error: 'No push token' };
    }

    // 🌍 Get localized messages
    const title = i18nPushMessages.teamInviteRejected.title[language];
    const bodyTemplate = i18nPushMessages.teamInviteRejected.body[language];
    const body = replacePlaceholders(bodyTemplate, { rejecterName, tournamentName });

    console.log(`🌍 [TEAM NOTIFICATION] Sending in language: ${language}`);

    const result = await sendExpoPushNotification(pushToken, title, body, {
      type: 'team_invite_rejected',
      notificationType: 'CLUB_TEAM_INVITE_REJECTED',
      teamId,
      inviterId,
      inviterName,
      rejecterId,
      rejecterName,
      tournamentId,
      tournamentName,
      clubId,
    });

    await logPushNotification(
      inviterId,
      'team_invite_rejected',
      { teamId, rejecterId, tournamentId, clubId, language },
      result.success ? 'sent' : 'failed'
    );

    if (result.success) {
      console.log('✅ [TEAM NOTIFICATION] Team invite rejected notification sent successfully');
    }

    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(
      '❌ [TEAM NOTIFICATION] Failed to send team invite rejected notification:',
      error
    );
    return { success: false, error: errorMessage };
  }
}

/**
 * Send team disbanded notification to both team members
 * 🌍 Supports 10 languages based on recipient's preferredLanguage
 *
 * @param teamId - Team ID
 * @param teamName - Team name
 * @param player1Id - Player 1 user ID
 * @param player1Name - Player 1 display name
 * @param player2Id - Player 2 user ID
 * @param player2Name - Player 2 display name
 * @param tournamentId - Tournament ID
 * @param tournamentName - Tournament name
 * @param clubId - Club ID
 * @returns Success status
 */
export async function sendTeamDisbandedNotification(
  teamId: string,
  teamName: string,
  player1Id: string,
  player1Name: string,
  player2Id: string,
  player2Name: string,
  tournamentId: string,
  tournamentName: string,
  clubId: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`💔 [TEAM NOTIFICATION] Sending team disbanded notifications:`, {
    teamId,
    teamName,
    tournament: tournamentName,
  });

  try {
    const notifications: Promise<{ success: boolean; error?: string }>[] = [];

    // Send to player 1
    const player1Info = await getUserPushInfo(player1Id);
    if (player1Info.pushToken) {
      const title = i18nPushMessages.teamDisbanded.title[player1Info.language];
      const bodyTemplate = i18nPushMessages.teamDisbanded.body[player1Info.language];
      const body = replacePlaceholders(bodyTemplate, { tournamentName, teamName });

      console.log(`🌍 [TEAM NOTIFICATION] Sending to player1 in language: ${player1Info.language}`);

      const player1Notification = sendExpoPushNotification(player1Info.pushToken, title, body, {
        type: 'team_disbanded',
        notificationType: 'TEAM_DISBANDED',
        teamId,
        teamName,
        tournamentId,
        tournamentName,
        clubId,
      }).then(result => {
        logPushNotification(
          player1Id,
          'team_disbanded',
          { teamId, teamName, tournamentId, clubId, language: player1Info.language },
          result.success ? 'sent' : 'failed'
        );
        return result;
      });
      notifications.push(player1Notification);
    }

    // Send to player 2
    const player2Info = await getUserPushInfo(player2Id);
    if (player2Info.pushToken) {
      const title = i18nPushMessages.teamDisbanded.title[player2Info.language];
      const bodyTemplate = i18nPushMessages.teamDisbanded.body[player2Info.language];
      const body = replacePlaceholders(bodyTemplate, { tournamentName, teamName });

      console.log(`🌍 [TEAM NOTIFICATION] Sending to player2 in language: ${player2Info.language}`);

      const player2Notification = sendExpoPushNotification(player2Info.pushToken, title, body, {
        type: 'team_disbanded',
        notificationType: 'TEAM_DISBANDED',
        teamId,
        teamName,
        tournamentId,
        tournamentName,
        clubId,
      }).then(result => {
        logPushNotification(
          player2Id,
          'team_disbanded',
          { teamId, teamName, tournamentId, clubId, language: player2Info.language },
          result.success ? 'sent' : 'failed'
        );
        return result;
      });
      notifications.push(player2Notification);
    }

    await Promise.all(notifications);

    console.log('✅ [TEAM NOTIFICATION] Team disbanded notifications sent successfully');
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [TEAM NOTIFICATION] Failed to send team disbanded notifications:', error);
    return { success: false, error: errorMessage };
  }
}
