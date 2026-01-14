/**
 * 💰 [HEIMDALL] Member Dues Record Created Trigger
 *
 * 회비 레코드가 생성될 때 해당 회원에게 알림을 보냅니다.
 * 10개 언어 지원: ko, en, ja, zh, de, fr, es, it, pt, ru
 *
 * Trigger: member_dues_records/{recordId} onCreate
 *
 * Actions:
 *  - 회원에게 알림 문서 생성
 *  - 푸시 알림 전송
 *  - deepLink: club/${clubId}/my-dues (회비 확인 화면으로 이동)
 */

import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Supported languages
type SupportedLanguage = 'ko' | 'en' | 'ja' | 'zh' | 'de' | 'fr' | 'es' | 'it' | 'pt' | 'ru';

/**
 * 회비 타입별 10개 언어 라벨
 */
const DUES_TYPE_LABELS: Record<string, Record<SupportedLanguage, string>> = {
  join: {
    ko: '가입비',
    en: 'Registration Fee',
    ja: '入会費',
    zh: '入会费',
    de: 'Anmeldegebühr',
    fr: "Frais d'inscription",
    es: 'Cuota de inscripción',
    it: 'Quota di iscrizione',
    pt: 'Taxa de inscrição',
    ru: 'Регистрационный взнос',
  },
  monthly: {
    ko: '월회비',
    en: 'Monthly Dues',
    ja: '月会費',
    zh: '月费',
    de: 'Monatsbeitrag',
    fr: 'Cotisation mensuelle',
    es: 'Cuota mensual',
    it: 'Quota mensile',
    pt: 'Mensalidade',
    ru: 'Ежемесячный взнос',
  },
  quarterly: {
    ko: '분기회비',
    en: 'Quarterly Dues',
    ja: '四半期会費',
    zh: '季度费',
    de: 'Quartalsbeitrag',
    fr: 'Cotisation trimestrielle',
    es: 'Cuota trimestral',
    it: 'Quota trimestrale',
    pt: 'Taxa trimestral',
    ru: 'Квартальный взнос',
  },
  yearly: {
    ko: '연회비',
    en: 'Annual Dues',
    ja: '年会費',
    zh: '年费',
    de: 'Jahresbeitrag',
    fr: 'Cotisation annuelle',
    es: 'Cuota anual',
    it: 'Quota annuale',
    pt: 'Anuidade',
    ru: 'Годовой взнос',
  },
  late_fee: {
    ko: '연체료',
    en: 'Late Fee',
    ja: '延滞料',
    zh: '滞纳金',
    de: 'Säumnisgebühr',
    fr: 'Frais de retard',
    es: 'Recargo por mora',
    it: 'Penale per ritardo',
    pt: 'Multa por atraso',
    ru: 'Пеня за просрочку',
  },
};

/**
 * 다국어 메시지 템플릿 (10개 언어)
 */
const MESSAGES: Record<
  SupportedLanguage,
  {
    withPeriod: (clubName: string, period: string, duesLabel: string, amount: number) => string;
    withoutPeriod: (clubName: string, duesLabel: string, amount: number) => string;
    pushWithPeriod: (period: string, duesLabel: string, amount: number) => string;
    pushWithoutPeriod: (duesLabel: string, amount: number) => string;
  }
> = {
  ko: {
    withPeriod: (clubName, period, duesLabel, amount) =>
      `[${clubName}] ${period} ${duesLabel} $${amount}가 발생했습니다.`,
    withoutPeriod: (clubName, duesLabel, amount) =>
      `[${clubName}] ${duesLabel} $${amount}가 발생했습니다.`,
    pushWithPeriod: (period, duesLabel, amount) =>
      `${period} ${duesLabel} $${amount}가 발생했습니다. 확인해주세요.`,
    pushWithoutPeriod: (duesLabel, amount) =>
      `${duesLabel} $${amount}가 발생했습니다. 확인해주세요.`,
  },
  en: {
    withPeriod: (clubName, period, duesLabel, amount) =>
      `[${clubName}] ${period} ${duesLabel} $${amount} has been charged.`,
    withoutPeriod: (clubName, duesLabel, amount) =>
      `[${clubName}] ${duesLabel} $${amount} has been charged.`,
    pushWithPeriod: (period, duesLabel, amount) =>
      `${period} ${duesLabel} $${amount} has been charged. Please check.`,
    pushWithoutPeriod: (duesLabel, amount) =>
      `${duesLabel} $${amount} has been charged. Please check.`,
  },
  ja: {
    withPeriod: (clubName, period, duesLabel, amount) =>
      `[${clubName}] ${period} ${duesLabel} $${amount}が発生しました。`,
    withoutPeriod: (clubName, duesLabel, amount) =>
      `[${clubName}] ${duesLabel} $${amount}が発生しました。`,
    pushWithPeriod: (period, duesLabel, amount) =>
      `${period} ${duesLabel} $${amount}が発生しました。ご確認ください。`,
    pushWithoutPeriod: (duesLabel, amount) =>
      `${duesLabel} $${amount}が発生しました。ご確認ください。`,
  },
  zh: {
    withPeriod: (clubName, period, duesLabel, amount) =>
      `[${clubName}] ${period} ${duesLabel} $${amount}已产生。`,
    withoutPeriod: (clubName, duesLabel, amount) => `[${clubName}] ${duesLabel} $${amount}已产生。`,
    pushWithPeriod: (period, duesLabel, amount) =>
      `${period} ${duesLabel} $${amount}已产生，请查看。`,
    pushWithoutPeriod: (duesLabel, amount) => `${duesLabel} $${amount}已产生，请查看。`,
  },
  de: {
    withPeriod: (clubName, period, duesLabel, amount) =>
      `[${clubName}] ${period} ${duesLabel} $${amount} wurde berechnet.`,
    withoutPeriod: (clubName, duesLabel, amount) =>
      `[${clubName}] ${duesLabel} $${amount} wurde berechnet.`,
    pushWithPeriod: (period, duesLabel, amount) =>
      `${period} ${duesLabel} $${amount} wurde berechnet. Bitte überprüfen.`,
    pushWithoutPeriod: (duesLabel, amount) =>
      `${duesLabel} $${amount} wurde berechnet. Bitte überprüfen.`,
  },
  fr: {
    withPeriod: (clubName, period, duesLabel, amount) =>
      `[${clubName}] ${period} ${duesLabel} $${amount} a été facturé.`,
    withoutPeriod: (clubName, duesLabel, amount) =>
      `[${clubName}] ${duesLabel} $${amount} a été facturé.`,
    pushWithPeriod: (period, duesLabel, amount) =>
      `${period} ${duesLabel} $${amount} a été facturé. Veuillez vérifier.`,
    pushWithoutPeriod: (duesLabel, amount) =>
      `${duesLabel} $${amount} a été facturé. Veuillez vérifier.`,
  },
  es: {
    withPeriod: (clubName, period, duesLabel, amount) =>
      `[${clubName}] ${period} ${duesLabel} $${amount} ha sido cobrado.`,
    withoutPeriod: (clubName, duesLabel, amount) =>
      `[${clubName}] ${duesLabel} $${amount} ha sido cobrado.`,
    pushWithPeriod: (period, duesLabel, amount) =>
      `${period} ${duesLabel} $${amount} ha sido cobrado. Por favor verifique.`,
    pushWithoutPeriod: (duesLabel, amount) =>
      `${duesLabel} $${amount} ha sido cobrado. Por favor verifique.`,
  },
  it: {
    withPeriod: (clubName, period, duesLabel, amount) =>
      `[${clubName}] ${period} ${duesLabel} $${amount} è stato addebitato.`,
    withoutPeriod: (clubName, duesLabel, amount) =>
      `[${clubName}] ${duesLabel} $${amount} è stato addebitato.`,
    pushWithPeriod: (period, duesLabel, amount) =>
      `${period} ${duesLabel} $${amount} è stato addebitato. Si prega di verificare.`,
    pushWithoutPeriod: (duesLabel, amount) =>
      `${duesLabel} $${amount} è stato addebitato. Si prega di verificare.`,
  },
  pt: {
    withPeriod: (clubName, period, duesLabel, amount) =>
      `[${clubName}] ${period} ${duesLabel} $${amount} foi cobrado.`,
    withoutPeriod: (clubName, duesLabel, amount) =>
      `[${clubName}] ${duesLabel} $${amount} foi cobrado.`,
    pushWithPeriod: (period, duesLabel, amount) =>
      `${period} ${duesLabel} $${amount} foi cobrado. Por favor, verifique.`,
    pushWithoutPeriod: (duesLabel, amount) =>
      `${duesLabel} $${amount} foi cobrado. Por favor, verifique.`,
  },
  ru: {
    withPeriod: (clubName, period, duesLabel, amount) =>
      `[${clubName}] ${period} ${duesLabel} $${amount} был начислен.`,
    withoutPeriod: (clubName, duesLabel, amount) =>
      `[${clubName}] ${duesLabel} $${amount} был начислен.`,
    pushWithPeriod: (period, duesLabel, amount) =>
      `${period} ${duesLabel} $${amount} был начислен. Пожалуйста, проверьте.`,
    pushWithoutPeriod: (duesLabel, amount) =>
      `${duesLabel} $${amount} был начислен. Пожалуйста, проверьте.`,
  },
};

/**
 * 월 이름 (다국어)
 */
const MONTH_NAMES: Record<SupportedLanguage, string[]> = {
  ko: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ja: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  zh: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  de: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
  fr: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
  es: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  it: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
  pt: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  ru: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
};

/**
 * Get club name from club ID
 */
async function getClubName(clubId: string): Promise<string> {
  try {
    const clubRef = db.doc(`pickleball_clubs/${clubId}`);
    const clubSnap = await clubRef.get();

    if (!clubSnap.exists) {
      return 'Unknown Club';
    }

    const clubData = clubSnap.data();
    return clubData?.profile?.name || clubData?.name || 'Unknown Club';
  } catch (error) {
    console.error('❌ [DUES CREATED] Failed to get club name:', error);
    return 'Unknown Club';
  }
}

/**
 * Get user's preferred language and FCM tokens
 */
async function getUserInfo(
  userId: string
): Promise<{ language: SupportedLanguage; tokens: string[] }> {
  try {
    const userRef = db.doc(`users/${userId}`);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return { language: 'en', tokens: [] };
    }

    const userData = userSnap.data();
    const tokens: string[] = [];

    // Get preferred language (default: en)
    const preferredLanguage =
      userData?.preferredLanguage || userData?.profile?.preferredLanguage || 'en';

    // Validate language is supported
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
    const language: SupportedLanguage = supportedLanguages.includes(
      preferredLanguage as SupportedLanguage
    )
      ? (preferredLanguage as SupportedLanguage)
      : 'en';

    // Check for fcmToken (single)
    if (userData?.fcmToken) {
      tokens.push(userData.fcmToken);
    }

    // Check for fcmTokens (array)
    if (userData?.fcmTokens && Array.isArray(userData.fcmTokens)) {
      tokens.push(...userData.fcmTokens);
    }

    return { language, tokens: [...new Set(tokens)] };
  } catch (error) {
    console.error('❌ [DUES CREATED] Failed to get user info:', error);
    return { language: 'en', tokens: [] };
  }
}

/**
 * Format period for display (10개 언어 지원)
 */
function formatPeriod(period: unknown, language: SupportedLanguage): string {
  if (!period) return '';
  if (typeof period === 'string') return period;
  if (typeof period === 'object' && period !== null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const periodObj = period as Record<string, any>;
    // 1. Use displayName if available
    if (periodObj.displayName && typeof periodObj.displayName === 'string') {
      return periodObj.displayName;
    }
    // 2. Build from year and month
    if (periodObj.year && periodObj.month) {
      const monthNames = MONTH_NAMES[language];
      const monthName = monthNames[periodObj.month - 1] || `${periodObj.month}`;

      // Format based on language conventions
      if (['ko', 'ja', 'zh'].includes(language)) {
        return `${periodObj.year}년 ${monthName}`;
      } else {
        return `${monthName} ${periodObj.year}`;
      }
    }
    // 3. Build from year only
    if (periodObj.year) {
      return `${periodObj.year}`;
    }
    return '';
  }
  return String(period);
}

/**
 * Send push notification to member (10개 언어 지원)
 */
async function sendDuesCreatedPushNotification(
  tokens: string[],
  clubName: string,
  duesType: string,
  amount: number,
  periodStr: string,
  recordId: string,
  clubId: string,
  language: SupportedLanguage
): Promise<void> {
  try {
    if (tokens.length === 0) {
      console.log('ℹ️ [DUES CREATED] No FCM tokens');
      return;
    }

    const msg = MESSAGES[language];
    const duesLabel = DUES_TYPE_LABELS[duesType]?.[language] || duesType;
    const title = `💰 ${clubName}`;
    const body = periodStr
      ? msg.pushWithPeriod(periodStr, duesLabel, amount)
      : msg.pushWithoutPeriod(duesLabel, amount);

    const message = {
      notification: {
        title,
        body,
      },
      data: {
        type: 'DUES_CREATED',
        clubId: clubId,
        recordId: recordId,
        deepLink: `club/${clubId}/my-dues`,
      },
      tokens: tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(
      `✅ [DUES CREATED] Push sent (${language}): ${response.successCount}/${tokens.length} success`
    );

    // Log failed tokens
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.warn(`⚠️ [DUES CREATED] Token failed: ${tokens[idx].substring(0, 20)}...`);
        }
      });
    }
  } catch (error) {
    console.error('❌ [DUES CREATED] Push notification failed:', error);
  }
}

/**
 * Main trigger function for member dues record creation
 */
export const onMemberDuesRecordCreated = onDocumentCreated(
  'member_dues_records/{recordId}',
  async event => {
    const data = event.data?.data();
    const recordId = event.params.recordId;

    if (!data) {
      console.log('ℹ️ [DUES CREATED] No data, skipping');
      return null;
    }

    const { clubId, userId, amount, duesType, period, currency } = data;

    console.log('💰 [DUES CREATED] New dues record created:', {
      recordId,
      clubId,
      userId,
      duesType,
      amount,
    });

    // Skip if essential data is missing
    if (!clubId || !userId || !amount || !duesType) {
      console.warn('⚠️ [DUES CREATED] Missing essential data, skipping');
      return null;
    }

    try {
      // Get club name and user info (language, tokens)
      const [clubName, userInfo] = await Promise.all([getClubName(clubId), getUserInfo(userId)]);

      const { language, tokens } = userInfo;

      // Format period and dues type in user's language
      const periodStr = formatPeriod(period, language);
      const duesLabel = DUES_TYPE_LABELS[duesType]?.[language] || duesType;
      const msg = MESSAGES[language];

      // Build notification message
      const message = periodStr
        ? msg.withPeriod(clubName, periodStr, duesLabel, amount)
        : msg.withoutPeriod(clubName, duesLabel, amount);

      // Create notification document for the member
      const notificationData = {
        recipientId: userId,
        type: 'DUES_CREATED',
        clubId: clubId,
        message: message,
        amount: amount,
        currency: currency || 'USD',
        duesType: duesType,
        period: periodStr,
        status: 'unread',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          notificationType: 'dues_created',
          actionRequired: true,
          recordId: recordId,
          deepLink: `club/${clubId}/my-dues`,
        },
      };

      await db.collection('notifications').add(notificationData);
      console.log(`✅ [DUES CREATED] Notification created for member ${userId} (${language})`);

      // Send push notification
      await sendDuesCreatedPushNotification(
        tokens,
        clubName,
        duesType,
        amount,
        periodStr,
        recordId,
        clubId,
        language
      );

      console.log('🎉 [DUES CREATED] Dues creation notification sent successfully');
      return { success: true, recordId, userId, language };
    } catch (error) {
      console.error('❌ [DUES CREATED] Failed to process dues creation:', error);
      return { success: false, error: String(error) };
    }
  }
);
