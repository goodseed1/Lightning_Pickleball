/**
 * 🌉 [HEIMDALL] Club Notification Sender
 *
 * Centralized utility for sending club-related push notifications.
 * Integrates with Expo Push Notification Service for immediate admin/user engagement.
 *
 * 🌍 Supports 10 languages: ko, en, ja, zh, de, fr, es, it, pt, ru
 *
 * Philosophy: Notify users immediately of club join request events
 */

import * as admin from 'firebase-admin';

// 🌍 Supported languages
type SupportedLanguage = 'ko' | 'en' | 'ja' | 'zh' | 'de' | 'fr' | 'es' | 'it' | 'pt' | 'ru';

interface UserPushInfo {
  pushToken: string | null;
  notificationSettings: Record<string, boolean | undefined>;
  language: SupportedLanguage;
}

// 🌍 i18n messages for push notifications
const i18nPushMessages = {
  // Club Join Request
  joinRequest: {
    title: {
      ko: '📝 새로운 가입 신청',
      en: '📝 New Join Request',
      ja: '📝 新規入会申請',
      zh: '📝 新加入申请',
      de: '📝 Neuer Beitrittsantrag',
      fr: "📝 Nouvelle demande d'adhésion",
      es: '📝 Nueva solicitud de membresía',
      it: '📝 Nuova richiesta di iscrizione',
      pt: '📝 Nova solicitação de adesão',
      ru: '📝 Новая заявка на вступление',
    },
    body: {
      ko: "{applicantName}님이 '{clubName}' 가입을 신청했습니다",
      en: "{applicantName} has requested to join '{clubName}'",
      ja: '{applicantName}さんが「{clubName}」への入会を申請しました',
      zh: '{applicantName}申请加入「{clubName}」',
      de: "{applicantName} hat einen Beitritt zu '{clubName}' beantragt",
      fr: "{applicantName} a demandé à rejoindre '{clubName}'",
      es: "{applicantName} ha solicitado unirse a '{clubName}'",
      it: "{applicantName} ha richiesto di unirsi a '{clubName}'",
      pt: "{applicantName} solicitou adesão ao '{clubName}'",
      ru: '{applicantName} подал(а) заявку на вступление в «{clubName}»',
    },
  },
  // Club Join Approved
  joinApproved: {
    title: {
      ko: '✅ 가입 승인',
      en: '✅ Join Approved',
      ja: '✅ 入会承認',
      zh: '✅ 加入已批准',
      de: '✅ Beitritt genehmigt',
      fr: '✅ Adhésion approuvée',
      es: '✅ Membresía aprobada',
      it: '✅ Iscrizione approvata',
      pt: '✅ Adesão aprovada',
      ru: '✅ Заявка одобрена',
    },
    body: {
      ko: "'{clubName}' 가입이 승인되었습니다! 🎉",
      en: "Your membership to '{clubName}' has been approved! 🎉",
      ja: '「{clubName}」への入会が承認されました！🎉',
      zh: '您加入「{clubName}」的申请已获批准！🎉',
      de: "Ihr Beitritt zu '{clubName}' wurde genehmigt! 🎉",
      fr: "Votre adhésion à '{clubName}' a été approuvée ! 🎉",
      es: "¡Tu membresía en '{clubName}' ha sido aprobada! 🎉",
      it: "La tua iscrizione a '{clubName}' è stata approvata! 🎉",
      pt: "Sua adesão ao '{clubName}' foi aprovada! 🎉",
      ru: 'Ваша заявка на вступление в «{clubName}» одобрена! 🎉',
    },
  },
  // Club Join Rejected
  joinRejected: {
    title: {
      ko: '❌ 가입 거절',
      en: '❌ Join Declined',
      ja: '❌ 入会却下',
      zh: '❌ 加入被拒绝',
      de: '❌ Beitritt abgelehnt',
      fr: '❌ Adhésion refusée',
      es: '❌ Membresía rechazada',
      it: '❌ Iscrizione rifiutata',
      pt: '❌ Adesão recusada',
      ru: '❌ Заявка отклонена',
    },
    body: {
      ko: "'{clubName}' 가입 신청이 거절되었습니다",
      en: "Your membership request to '{clubName}' has been declined",
      ja: '「{clubName}」への入会申請が却下されました',
      zh: '您加入「{clubName}」的申请已被拒绝',
      de: "Ihr Beitrittsantrag zu '{clubName}' wurde abgelehnt",
      fr: "Votre demande d'adhésion à '{clubName}' a été refusée",
      es: "Tu solicitud de membresía en '{clubName}' ha sido rechazada",
      it: "La tua richiesta di iscrizione a '{clubName}' è stata rifiutata",
      pt: "Sua solicitação de adesão ao '{clubName}' foi recusada",
      ru: 'Ваша заявка на вступление в «{clubName}» отклонена',
    },
    bodyWithReason: {
      ko: "'{clubName}' 가입 신청이 거절되었습니다\n사유: {reason}",
      en: "Your membership request to '{clubName}' has been declined\nReason: {reason}",
      ja: '「{clubName}」への入会申請が却下されました\n理由: {reason}',
      zh: '您加入「{clubName}」的申请已被拒绝\n原因：{reason}',
      de: "Ihr Beitrittsantrag zu '{clubName}' wurde abgelehnt\nGrund: {reason}",
      fr: "Votre demande d'adhésion à '{clubName}' a été refusée\nRaison: {reason}",
      es: "Tu solicitud de membresía en '{clubName}' ha sido rechazada\nMotivo: {reason}",
      it: "La tua richiesta di iscrizione a '{clubName}' è stata rifiutata\nMotivo: {reason}",
      pt: "Sua solicitação de adesão ao '{clubName}' foi recusada\nMotivo: {reason}",
      ru: 'Ваша заявка на вступление в «{clubName}» отклонена\nПричина: {reason}',
    },
  },
  // Dues Payment Request (for admins)
  duesPaymentRequest: {
    title: {
      ko: '💰 회비 납부 요청',
      en: '💰 Dues Payment Request',
      ja: '💰 会費支払い申請',
      zh: '💰 会费支付请求',
      de: '💰 Beitragszahlungsanfrage',
      fr: '💰 Demande de paiement de cotisation',
      es: '💰 Solicitud de pago de cuotas',
      it: '💰 Richiesta di pagamento quote',
      pt: '💰 Solicitação de pagamento de mensalidade',
      ru: '💰 Запрос на оплату взносов',
    },
    body: {
      ko: '{memberName}님이 {clubName} {duesType} {amount} 납부 승인을 요청했습니다',
      en: '{memberName} has requested {duesType} dues payment approval ({amount}) for {clubName}',
      ja: '{memberName}さんが{clubName}の{duesType}会費 {amount} の承認を申請しました',
      zh: '{memberName}请求批准{clubName}的{duesType}会费 {amount}',
      de: '{memberName} hat eine Genehmigung für {duesType} Beitrag ({amount}) bei {clubName} beantragt',
      fr: "{memberName} a demandé l'approbation du paiement {duesType} ({amount}) pour {clubName}",
      es: '{memberName} ha solicitado la aprobación del pago de {duesType} ({amount}) para {clubName}',
      it: "{memberName} ha richiesto l'approvazione del pagamento {duesType} ({amount}) per {clubName}",
      pt: '{memberName} solicitou aprovação do pagamento {duesType} ({amount}) para {clubName}',
      ru: '{memberName} запросил(а) подтверждение оплаты {duesType} ({amount}) для {clubName}',
    },
  },
  // Dues Payment Approved (for members)
  duesPaymentApproved: {
    title: {
      ko: '✅ 회비 납부 승인',
      en: '✅ Dues Payment Approved',
      ja: '✅ 会費支払い承認',
      zh: '✅ 会费支付已批准',
      de: '✅ Beitragszahlung genehmigt',
      fr: '✅ Paiement de cotisation approuvé',
      es: '✅ Pago de cuotas aprobado',
      it: '✅ Pagamento quote approvato',
      pt: '✅ Pagamento de mensalidade aprovado',
      ru: '✅ Оплата взносов одобрена',
    },
    body: {
      ko: '{clubName} {period} {duesType} {amount} 납부가 승인되었습니다! 🎉',
      en: 'Your {period} {duesType} dues payment ({amount}) for {clubName} has been approved! 🎉',
      ja: '{clubName}の{period} {duesType}会費 {amount} が承認されました！🎉',
      zh: '{clubName} {period} {duesType}会费 {amount} 已获批准！🎉',
      de: 'Ihre {period} {duesType} Beitragszahlung ({amount}) für {clubName} wurde genehmigt! 🎉',
      fr: 'Votre paiement {duesType} {period} ({amount}) pour {clubName} a été approuvé ! 🎉',
      es: '¡Tu pago de {duesType} {period} ({amount}) para {clubName} ha sido aprobado! 🎉',
      it: 'Il tuo pagamento {duesType} {period} ({amount}) per {clubName} è stato approvato! 🎉',
      pt: 'Seu pagamento {duesType} {period} ({amount}) para {clubName} foi aprovado! 🎉',
      ru: 'Ваш платеж {duesType} за {period} ({amount}) для {clubName} одобрен! 🎉',
    },
  },
  // Dues Payment Rejected (for members)
  duesPaymentRejected: {
    title: {
      ko: '❌ 회비 납부 거절',
      en: '❌ Dues Payment Declined',
      ja: '❌ 会費支払い却下',
      zh: '❌ 会费支付被拒绝',
      de: '❌ Beitragszahlung abgelehnt',
      fr: '❌ Paiement de cotisation refusé',
      es: '❌ Pago de cuotas rechazado',
      it: '❌ Pagamento quote rifiutato',
      pt: '❌ Pagamento de mensalidade recusado',
      ru: '❌ Оплата взносов отклонена',
    },
    body: {
      ko: '{clubName} {period} {duesType} 납부 요청이 거절되었습니다',
      en: 'Your {period} {duesType} dues payment request for {clubName} has been declined',
      ja: '{clubName}の{period} {duesType}会費申請が却下されました',
      zh: '{clubName} {period} {duesType}会费请求已被拒绝',
      de: 'Ihr {period} {duesType} Beitragszahlungsantrag für {clubName} wurde abgelehnt',
      fr: 'Votre demande de paiement {duesType} {period} pour {clubName} a été refusée',
      es: 'Tu solicitud de pago de {duesType} {period} para {clubName} ha sido rechazada',
      it: 'La tua richiesta di pagamento {duesType} {period} per {clubName} è stata rifiutata',
      pt: 'Sua solicitação de pagamento {duesType} {period} para {clubName} foi recusada',
      ru: 'Ваш запрос на оплату {duesType} за {period} для {clubName} отклонен',
    },
    bodyWithReason: {
      ko: '{clubName} {period} {duesType} 납부 요청이 거절되었습니다\n사유: {reason}',
      en: 'Your {period} {duesType} dues payment request for {clubName} has been declined\nReason: {reason}',
      ja: '{clubName}の{period} {duesType}会費申請が却下されました\n理由: {reason}',
      zh: '{clubName} {period} {duesType}会费请求已被拒绝\n原因：{reason}',
      de: 'Ihr {period} {duesType} Beitragszahlungsantrag für {clubName} wurde abgelehnt\nGrund: {reason}',
      fr: 'Votre demande de paiement {duesType} {period} pour {clubName} a été refusée\nRaison: {reason}',
      es: 'Tu solicitud de pago de {duesType} {period} para {clubName} ha sido rechazada\nMotivo: {reason}',
      it: 'La tua richiesta di pagamento {duesType} {period} per {clubName} è stata rifiutata\nMotivo: {reason}',
      pt: 'Sua solicitação de pagamento {duesType} {period} para {clubName} foi recusada\nMotivo: {reason}',
      ru: 'Ваш запрос на оплату {duesType} за {period} для {clubName} отклонен\nПричина: {reason}',
    },
  },
  // Dues type translations
  duesTypes: {
    monthly: {
      ko: '월회비',
      en: 'monthly',
      ja: '月会費',
      zh: '月费',
      de: 'Monatsbeitrag',
      fr: 'mensuel',
      es: 'mensual',
      it: 'mensile',
      pt: 'mensal',
      ru: 'ежемесячный',
    },
    quarterly: {
      ko: '분기회비',
      en: 'quarterly',
      ja: '四半期会費',
      zh: '季度费',
      de: 'Quartalsbeitrag',
      fr: 'trimestriel',
      es: 'trimestral',
      it: 'trimestrale',
      pt: 'trimestral',
      ru: 'ежеквартальный',
    },
    yearly: {
      ko: '연회비',
      en: 'yearly',
      ja: '年会費',
      zh: '年费',
      de: 'Jahresbeitrag',
      fr: 'annuel',
      es: 'anual',
      it: 'annuale',
      pt: 'anual',
      ru: 'ежегодный',
    },
    join: {
      ko: '가입비',
      en: 'joining fee',
      ja: '入会費',
      zh: '入会费',
      de: 'Aufnahmegebühr',
      fr: "frais d'adhésion",
      es: 'cuota de inscripción',
      it: 'quota di iscrizione',
      pt: 'taxa de adesão',
      ru: 'вступительный взнос',
    },
    late_fee: {
      ko: '연체료',
      en: 'late fee',
      ja: '延滞料',
      zh: '滞纳金',
      de: 'Verspätungsgebühr',
      fr: 'frais de retard',
      es: 'cargo por mora',
      it: 'penale di ritardo',
      pt: 'multa por atraso',
      ru: 'пеня',
    },
    one_time: {
      ko: '일시납',
      en: 'one-time',
      ja: '一括払い',
      zh: '一次性',
      de: 'einmalig',
      fr: 'unique',
      es: 'único',
      it: 'una tantum',
      pt: 'único',
      ru: 'разовый',
    },
  },
};

/**
 * Get user's push token from Firestore
 * @param userId - User ID
 * @returns Push token or null
 */
export async function getUserPushToken(userId: string): Promise<string | null> {
  const info = await getUserPushInfo(userId);
  return info.pushToken;
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
      console.warn(`⚠️ [CLUB NOTIFICATION] User not found: ${userId}`);
      return { pushToken: null, notificationSettings: {}, language: 'en' };
    }

    const userData = userSnap.data();
    const pushToken = userData?.pushToken || null;
    const notificationSettings = userData?.notificationSettings || {};

    // Get user's preferred language (check all possible field paths)
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
    const language = supportedLanguages.includes(lang as SupportedLanguage)
      ? (lang as SupportedLanguage)
      : 'en';

    if (!pushToken) {
      console.log(`ℹ️ [CLUB NOTIFICATION] User ${userId} does not have a push token`);
    }

    return { pushToken, notificationSettings, language };
  } catch (error: unknown) {
    console.error(`❌ [CLUB NOTIFICATION] Failed to get push info for user ${userId}:`, error);
    return { pushToken: null, notificationSettings: {}, language: 'en' };
  }
}

/**
 * Get localized dues type
 */
function getLocalizedDuesType(duesType: string, lang: SupportedLanguage): string {
  const types = i18nPushMessages.duesTypes;
  const typeKey = duesType as keyof typeof types;
  if (types[typeKey]) {
    return types[typeKey][lang];
  }
  // Fallback for unknown dues types
  return types.monthly[lang];
}

/**
 * Format amount with currency symbol based on language
 */
function formatAmount(amount: number, lang: SupportedLanguage): string {
  // Use locale-appropriate formatting
  const localeMap: Record<SupportedLanguage, string> = {
    ko: 'ko-KR',
    en: 'en-US',
    ja: 'ja-JP',
    zh: 'zh-CN',
    de: 'de-DE',
    fr: 'fr-FR',
    es: 'es-ES',
    it: 'it-IT',
    pt: 'pt-BR',
    ru: 'ru-RU',
  };

  // Use USD for now (can be extended to support multiple currencies)
  return new Intl.NumberFormat(localeMap[lang], {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Check if user has club category notifications enabled
 * @param settings - User's notification settings
 * @returns true if notifications are enabled
 */
function isClubNotificationEnabled(settings: Record<string, boolean | undefined>): boolean {
  // Check category master toggle (new format)
  if (settings.clubCategoryEnabled === false) {
    return false;
  }
  // Check legacy club notification setting
  if (settings.clubNotifications === false) {
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
export async function sendExpoPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data: Record<string, unknown>,
  channelId?: string, // 🎯 [KIM FIX] 채널 ID를 동적으로 설정 가능하도록
  badge?: number // 🔔 [KIM FIX] 앱 아이콘 배지 숫자
): Promise<{ success: boolean; error?: string; ticketId?: string }> {
  try {
    // 🎯 [KIM FIX] 알림 타입에 따른 채널 ID 결정
    // Android 8.0+ 에서는 채널 ID가 클라이언트에서 생성한 채널과 일치해야 함!
    const notificationType = data?.type as string;
    const resolvedChannelId =
      channelId ||
      (notificationType === 'direct_chat'
        ? 'chat'
        : notificationType?.includes('club')
          ? 'club'
          : 'default');

    const message: Record<string, unknown> = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
      channelId: resolvedChannelId,
      // 🔔 [KIM FIX] iOS 앱 아이콘 배지 - 1로 설정하면 빨간 점 표시
      badge: badge ?? 1,
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

    // 🔧 [KIM FIX] Debug: Log full Expo API response
    console.log('📡 [CLUB NOTIFICATION] Expo API response:', JSON.stringify(result));

    if (result.errors) {
      console.error('❌ [CLUB NOTIFICATION] Expo Push API errors:', result.errors);
      return {
        success: false,
        error: result.errors[0]?.message || 'Unknown Expo API error',
      };
    }

    // 🔧 [KIM FIX] Handle both array and single object response formats
    // Expo API returns { data: [...] } for array or { data: {...} } for single
    const ticketData = Array.isArray(result.data) ? result.data[0] : result.data;

    if (ticketData) {
      if (ticketData.status === 'error') {
        console.error('❌ [CLUB NOTIFICATION] Push notification error:', ticketData.message);
        return {
          success: false,
          error: ticketData.message || 'Push notification failed',
        };
      }

      console.log('✅ [CLUB NOTIFICATION] Push notification sent successfully:', ticketData.id);
      return {
        success: true,
        ticketId: ticketData.id,
      };
    }

    console.error('❌ [CLUB NOTIFICATION] No ticket data in response:', result);
    return { success: false, error: 'Invalid response format' };
  } catch (error: unknown) {
    console.error('❌ [CLUB NOTIFICATION] Failed to send push notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Log push notification attempt for analytics and debugging
 */
async function logPushNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  success: boolean,
  error?: string
): Promise<void> {
  try {
    const db = admin.firestore();
    await db.collection('push_notification_logs').add({
      userId,
      type,
      title,
      body,
      success,
      error: error || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (logError) {
    console.error('❌ [CLUB NOTIFICATION] Failed to log push notification:', logError);
  }
}

/**
 * Send club join request push notification to admin
 * @param adminId - Admin user ID
 * @param applicantName - Name of user requesting to join
 * @param clubName - Name of club
 * @param requestId - Join request ID
 * @returns Success status
 */
export async function sendClubJoinRequestPushNotification(
  adminId: string,
  applicantName: string,
  clubName: string,
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  console.log('📲 [CLUB NOTIFICATION] Sending join request push notification:', {
    adminId,
    applicantName,
    clubName,
    requestId,
  });

  try {
    const { pushToken, notificationSettings, language } = await getUserPushInfo(adminId);

    // Get localized messages
    const title = i18nPushMessages.joinRequest.title[language];
    const body = i18nPushMessages.joinRequest.body[language]
      .replace('{applicantName}', applicantName)
      .replace('{clubName}', clubName);

    if (!pushToken) {
      console.warn(`⚠️ [CLUB NOTIFICATION] Admin ${adminId} has no push token, skipping`);
      await logPushNotification(adminId, 'club_join_request', title, body, false, 'No push token');
      return { success: false, error: 'No push token' };
    }

    // 🔔 Check if user has club notifications enabled
    if (!isClubNotificationEnabled(notificationSettings)) {
      console.log(`⚙️ [CLUB NOTIFICATION] Admin ${adminId} has disabled club notifications`);
      return { success: false, error: 'Notifications disabled by user' };
    }

    const result = await sendExpoPushNotification(pushToken, title, body, {
      type: 'club_join_request',
      notificationType: 'CLUB_JOIN_REQUEST',
      requestId,
      applicantName,
      clubName,
    });

    await logPushNotification(
      adminId,
      'club_join_request',
      title,
      body,
      result.success,
      result.error
    );

    return result;
  } catch (error: unknown) {
    console.error('❌ [CLUB NOTIFICATION] Failed to send join request push:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send club join approved push notification to applicant
 * @param applicantId - Applicant user ID
 * @param clubName - Name of club
 * @returns Success status
 */
export async function sendClubJoinApprovedPushNotification(
  applicantId: string,
  clubName: string
): Promise<{ success: boolean; error?: string }> {
  console.log('📲 [CLUB NOTIFICATION] Sending join approved push notification:', {
    applicantId,
    clubName,
  });

  try {
    const { pushToken, notificationSettings, language } = await getUserPushInfo(applicantId);

    // Get localized messages
    const title = i18nPushMessages.joinApproved.title[language];
    const body = i18nPushMessages.joinApproved.body[language].replace('{clubName}', clubName);

    if (!pushToken) {
      console.warn(`⚠️ [CLUB NOTIFICATION] Applicant ${applicantId} has no push token, skipping`);
      await logPushNotification(
        applicantId,
        'club_join_approved',
        title,
        body,
        false,
        'No push token'
      );
      return { success: false, error: 'No push token' };
    }

    // 🔔 Check if user has club notifications enabled
    if (!isClubNotificationEnabled(notificationSettings)) {
      console.log(`⚙️ [CLUB NOTIFICATION] User ${applicantId} has disabled club notifications`);
      return { success: false, error: 'Notifications disabled by user' };
    }

    const result = await sendExpoPushNotification(pushToken, title, body, {
      type: 'club_join_approved',
      notificationType: 'CLUB_JOIN_APPROVED',
      clubName,
    });

    await logPushNotification(
      applicantId,
      'club_join_approved',
      title,
      body,
      result.success,
      result.error
    );

    return result;
  } catch (error: unknown) {
    console.error('❌ [CLUB NOTIFICATION] Failed to send join approved push:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send club join rejected push notification to applicant
 * @param applicantId - Applicant user ID
 * @param clubName - Name of club
 * @param reason - Optional rejection reason
 * @returns Success status
 */
export async function sendClubJoinRejectedPushNotification(
  applicantId: string,
  clubName: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  console.log('📲 [CLUB NOTIFICATION] Sending join rejected push notification:', {
    applicantId,
    clubName,
    reason,
  });

  try {
    const { pushToken, notificationSettings, language } = await getUserPushInfo(applicantId);

    // Get localized messages
    const title = i18nPushMessages.joinRejected.title[language];
    let body: string;
    if (reason) {
      body = i18nPushMessages.joinRejected.bodyWithReason[language]
        .replace('{clubName}', clubName)
        .replace('{reason}', reason);
    } else {
      body = i18nPushMessages.joinRejected.body[language].replace('{clubName}', clubName);
    }

    if (!pushToken) {
      console.warn(`⚠️ [CLUB NOTIFICATION] Applicant ${applicantId} has no push token, skipping`);
      await logPushNotification(
        applicantId,
        'club_join_rejected',
        title,
        body,
        false,
        'No push token'
      );
      return { success: false, error: 'No push token' };
    }

    // 🔔 Check if user has club notifications enabled
    if (!isClubNotificationEnabled(notificationSettings)) {
      console.log(`⚙️ [CLUB NOTIFICATION] User ${applicantId} has disabled club notifications`);
      return { success: false, error: 'Notifications disabled by user' };
    }

    const result = await sendExpoPushNotification(pushToken, title, body, {
      type: 'club_join_rejected',
      notificationType: 'CLUB_JOIN_REJECTED',
      clubName,
      reason: reason || null,
    });

    await logPushNotification(
      applicantId,
      'club_join_rejected',
      title,
      body,
      result.success,
      result.error
    );

    return result;
  } catch (error: unknown) {
    console.error('❌ [CLUB NOTIFICATION] Failed to send join rejected push:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// 💰 CLUB DUES NOTIFICATIONS
// ============================================================================

/**
 * Send dues payment request push notification to club admins
 * @param adminId - Admin user ID
 * @param memberName - Name of member requesting payment approval
 * @param clubName - Name of club
 * @param duesType - Type of dues (monthly, quarterly, yearly, etc.)
 * @param amount - Amount requested
 * @param recordId - Dues record ID
 * @returns Success status
 */
export async function sendDuesPaymentRequestPushNotification(
  adminId: string,
  memberName: string,
  clubName: string,
  duesType: string,
  amount: number,
  recordId: string
): Promise<{ success: boolean; error?: string }> {
  console.log('📲 [DUES NOTIFICATION] Sending payment request push notification:', {
    adminId,
    memberName,
    clubName,
    duesType,
    amount,
    recordId,
  });

  try {
    const { pushToken, notificationSettings, language } = await getUserPushInfo(adminId);

    // Get localized messages
    const title = i18nPushMessages.duesPaymentRequest.title[language];
    const localizedDuesType = getLocalizedDuesType(duesType, language);
    const formattedAmount = formatAmount(amount, language);
    const body = i18nPushMessages.duesPaymentRequest.body[language]
      .replace('{memberName}', memberName)
      .replace('{clubName}', clubName)
      .replace('{duesType}', localizedDuesType)
      .replace('{amount}', formattedAmount);

    if (!pushToken) {
      console.warn(`⚠️ [DUES NOTIFICATION] Admin ${adminId} has no push token, skipping`);
      await logPushNotification(
        adminId,
        'dues_payment_request',
        title,
        body,
        false,
        'No push token'
      );
      return { success: false, error: 'No push token' };
    }

    // 🔔 Check if user has club notifications enabled
    if (!isClubNotificationEnabled(notificationSettings)) {
      console.log(`⚙️ [DUES NOTIFICATION] Admin ${adminId} has disabled club notifications`);
      return { success: false, error: 'Notifications disabled by user' };
    }

    const result = await sendExpoPushNotification(pushToken, title, body, {
      type: 'dues_payment_request',
      notificationType: 'DUES_PAYMENT_REQUEST',
      clubName,
      memberName,
      duesType,
      amount,
      recordId,
    });

    await logPushNotification(
      adminId,
      'dues_payment_request',
      title,
      body,
      result.success,
      result.error
    );

    return result;
  } catch (error: unknown) {
    console.error('❌ [DUES NOTIFICATION] Failed to send payment request push:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send dues payment approved push notification to member
 * @param memberId - Member user ID
 * @param clubName - Name of club
 * @param duesType - Type of dues
 * @param amount - Amount paid
 * @param period - Period paid for
 * @returns Success status
 */
export async function sendDuesPaymentApprovedPushNotification(
  memberId: string,
  clubName: string,
  duesType: string,
  amount: number,
  period: string
): Promise<{ success: boolean; error?: string }> {
  console.log('📲 [DUES NOTIFICATION] Sending payment approved push notification:', {
    memberId,
    clubName,
    duesType,
    amount,
    period,
  });

  try {
    const { pushToken, notificationSettings, language } = await getUserPushInfo(memberId);

    // Get localized messages
    const title = i18nPushMessages.duesPaymentApproved.title[language];
    const localizedDuesType = getLocalizedDuesType(duesType, language);
    const formattedAmount = formatAmount(amount, language);
    const body = i18nPushMessages.duesPaymentApproved.body[language]
      .replace('{clubName}', clubName)
      .replace('{period}', period)
      .replace('{duesType}', localizedDuesType)
      .replace('{amount}', formattedAmount);

    if (!pushToken) {
      console.warn(`⚠️ [DUES NOTIFICATION] Member ${memberId} has no push token, skipping`);
      await logPushNotification(
        memberId,
        'dues_payment_approved',
        title,
        body,
        false,
        'No push token'
      );
      return { success: false, error: 'No push token' };
    }

    // 🔔 Check if user has club notifications enabled
    if (!isClubNotificationEnabled(notificationSettings)) {
      console.log(`⚙️ [DUES NOTIFICATION] Member ${memberId} has disabled club notifications`);
      return { success: false, error: 'Notifications disabled by user' };
    }

    const result = await sendExpoPushNotification(pushToken, title, body, {
      type: 'dues_payment_approved',
      notificationType: 'DUES_PAYMENT_APPROVED',
      clubName,
      duesType,
      amount,
      period,
    });

    await logPushNotification(
      memberId,
      'dues_payment_approved',
      title,
      body,
      result.success,
      result.error
    );

    return result;
  } catch (error: unknown) {
    console.error('❌ [DUES NOTIFICATION] Failed to send payment approved push:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send dues payment rejected push notification to member
 * @param memberId - Member user ID
 * @param clubName - Name of club
 * @param duesType - Type of dues
 * @param amount - Amount
 * @param period - Period
 * @param reason - Optional rejection reason
 * @returns Success status
 */
export async function sendDuesPaymentRejectedPushNotification(
  memberId: string,
  clubName: string,
  duesType: string,
  amount: number,
  period: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  console.log('📲 [DUES NOTIFICATION] Sending payment rejected push notification:', {
    memberId,
    clubName,
    duesType,
    amount,
    period,
    reason,
  });

  try {
    const { pushToken, notificationSettings, language } = await getUserPushInfo(memberId);

    // Get localized messages
    const title = i18nPushMessages.duesPaymentRejected.title[language];
    const localizedDuesType = getLocalizedDuesType(duesType, language);

    let body: string;
    if (reason) {
      body = i18nPushMessages.duesPaymentRejected.bodyWithReason[language]
        .replace('{clubName}', clubName)
        .replace('{period}', period)
        .replace('{duesType}', localizedDuesType)
        .replace('{reason}', reason);
    } else {
      body = i18nPushMessages.duesPaymentRejected.body[language]
        .replace('{clubName}', clubName)
        .replace('{period}', period)
        .replace('{duesType}', localizedDuesType);
    }

    if (!pushToken) {
      console.warn(`⚠️ [DUES NOTIFICATION] Member ${memberId} has no push token, skipping`);
      await logPushNotification(
        memberId,
        'dues_payment_rejected',
        title,
        body,
        false,
        'No push token'
      );
      return { success: false, error: 'No push token' };
    }

    // 🔔 Check if user has club notifications enabled
    if (!isClubNotificationEnabled(notificationSettings)) {
      console.log(`⚙️ [DUES NOTIFICATION] Member ${memberId} has disabled club notifications`);
      return { success: false, error: 'Notifications disabled by user' };
    }

    const result = await sendExpoPushNotification(pushToken, title, body, {
      type: 'dues_payment_rejected',
      notificationType: 'DUES_PAYMENT_REJECTED',
      clubName,
      duesType,
      amount,
      period,
      reason: reason || null,
    });

    await logPushNotification(
      memberId,
      'dues_payment_rejected',
      title,
      body,
      result.success,
      result.error
    );

    return result;
  } catch (error: unknown) {
    console.error('❌ [DUES NOTIFICATION] Failed to send payment rejected push:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
