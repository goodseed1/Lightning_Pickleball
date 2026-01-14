/**
 * 💰 [HEIMDALL] Member Dues Record Trigger
 *
 * Automatically creates notifications and sends push notifications when:
 * 1. A member requests payment approval (status: unpaid → pending_approval)
 * 2. An admin approves payment (status: pending_approval → paid)
 * 3. An admin rejects payment (status: pending_approval → rejected)
 *
 * Trigger: member_dues_records/{recordId} onUpdate
 *
 * 🌍 Supports 10 languages: ko, en, ja, zh, de, fr, es, it, pt, ru
 *
 * Actions:
 *  - Detect status changes
 *  - Send appropriate push notifications
 *  - Create notification documents
 */

import * as admin from 'firebase-admin';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import {
  sendDuesPaymentRequestPushNotification,
  sendDuesPaymentApprovedPushNotification,
  sendDuesPaymentRejectedPushNotification,
} from '../utils/clubNotificationSender';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// 🌍 Supported languages
type SupportedLanguage = 'ko' | 'en' | 'ja' | 'zh' | 'de' | 'fr' | 'es' | 'it' | 'pt' | 'ru';

// 🌍 i18n messages for dues notifications
const i18nMessages = {
  // Payment request messages (for admins) - {memberName}, {period}
  paymentRequest: {
    ko: '{memberName}님이 {period} 회비 납부 승인을 요청했습니다.',
    en: '{memberName} has requested dues payment approval for {period}.',
    ja: '{memberName}さんが{period}の会費納付承認を申請しました。',
    zh: '{memberName}已请求{period}会费支付批准。',
    de: '{memberName} hat eine Genehmigung der Beitragszahlung für {period} beantragt.',
    fr: "{memberName} a demandé l'approbation du paiement des cotisations pour {period}.",
    es: '{memberName} ha solicitado la aprobación del pago de cuotas para {period}.',
    it: "{memberName} ha richiesto l'approvazione del pagamento delle quote per {period}.",
    pt: '{memberName} solicitou a aprovação do pagamento de mensalidades para {period}.',
    ru: '{memberName} запросил(а) подтверждение оплаты взносов за {period}.',
  },
  // Payment approved messages (for members) - {clubName}, {period}
  paymentApproved: {
    ko: '{clubName} {period} 회비 납부가 승인되었습니다.',
    en: 'Your {period} dues payment for {clubName} has been approved.',
    ja: '{clubName}の{period}会費納付が承認されました。',
    zh: '{clubName} {period}会费支付已获批准。',
    de: 'Ihre Beitragszahlung für {period} bei {clubName} wurde genehmigt.',
    fr: 'Votre paiement de cotisation pour {period} chez {clubName} a été approuvé.',
    es: 'Tu pago de cuotas de {period} para {clubName} ha sido aprobado.',
    it: 'Il tuo pagamento delle quote di {period} per {clubName} è stato approvato.',
    pt: 'Seu pagamento de mensalidade de {period} para {clubName} foi aprovado.',
    ru: 'Ваш платеж взносов за {period} для {clubName} был одобрен.',
  },
  // Payment rejected messages (for members) - {clubName}, {period}
  paymentRejected: {
    ko: '{clubName} {period} 회비 납부 요청이 거절되었습니다.',
    en: 'Your {period} dues payment request for {clubName} has been declined.',
    ja: '{clubName}の{period}会費納付申請が却下されました。',
    zh: '{clubName} {period}会费支付请求已被拒绝。',
    de: 'Ihr Antrag auf Beitragszahlung für {period} bei {clubName} wurde abgelehnt.',
    fr: 'Votre demande de paiement de cotisation pour {period} chez {clubName} a été refusée.',
    es: 'Tu solicitud de pago de cuotas de {period} para {clubName} ha sido rechazada.',
    it: 'La tua richiesta di pagamento delle quote di {period} per {clubName} è stata rifiutata.',
    pt: 'Sua solicitação de pagamento de mensalidade de {period} para {clubName} foi recusada.',
    ru: 'Ваш запрос на оплату взносов за {period} для {clubName} был отклонен.',
  },
  // Payment rejected with reason - {clubName}, {period}, {reason}
  paymentRejectedWithReason: {
    ko: '{clubName} {period} 회비 납부 요청이 거절되었습니다. 사유: {reason}',
    en: 'Your {period} dues payment request for {clubName} has been declined. Reason: {reason}',
    ja: '{clubName}の{period}会費納付申請が却下されました。理由: {reason}',
    zh: '{clubName} {period}会费支付请求已被拒绝。原因：{reason}',
    de: 'Ihr Antrag auf Beitragszahlung für {period} bei {clubName} wurde abgelehnt. Grund: {reason}',
    fr: 'Votre demande de paiement de cotisation pour {period} chez {clubName} a été refusée. Raison: {reason}',
    es: 'Tu solicitud de pago de cuotas de {period} para {clubName} ha sido rechazada. Motivo: {reason}',
    it: 'La tua richiesta di pagamento delle quote di {period} per {clubName} è stata rifiutata. Motivo: {reason}',
    pt: 'Sua solicitação de pagamento de mensalidade de {period} para {clubName} foi recusada. Motivo: {reason}',
    ru: 'Ваш запрос на оплату взносов за {period} для {clubName} был отклонен. Причина: {reason}',
  },
  // Default member name
  defaultMemberName: {
    ko: '회원',
    en: 'Member',
    ja: '会員',
    zh: '会员',
    de: 'Mitglied',
    fr: 'Membre',
    es: 'Miembro',
    it: 'Membro',
    pt: 'Membro',
    ru: 'Участник',
  },
};

/**
 * Get user's preferred language
 */
async function getUserLanguage(userId: string): Promise<SupportedLanguage> {
  try {
    const db = admin.firestore();
    const userRef = db.doc(`users/${userId}`);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return 'en';
    }

    const userData = userSnap.data();
    const lang = userData?.preferredLanguage || userData?.language || 'en';

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
    return supportedLanguages.includes(lang as SupportedLanguage)
      ? (lang as SupportedLanguage)
      : 'en';
  } catch (error) {
    console.error('❌ [DUES TRIGGER] Failed to get user language:', error);
    return 'en';
  }
}

/**
 * Get all admin users of a club (owner, admin, manager)
 */
async function getClubAdmins(clubId: string): Promise<string[]> {
  const db = admin.firestore();
  const adminRoles = ['owner', 'admin', 'manager'];
  const adminIds: string[] = [];

  try {
    console.log('🔍 [DUES TRIGGER] Querying club admins for club:', clubId);

    const membersRef = db.collection('clubMembers');
    const q = membersRef.where('clubId', '==', clubId).where('status', '==', 'active');

    const snapshot = await q.get();

    snapshot.forEach(doc => {
      const memberData = doc.data();
      if (adminRoles.includes(memberData.role)) {
        adminIds.push(memberData.userId);
      }
    });

    console.log(`✅ [DUES TRIGGER] Found ${adminIds.length} admins:`, adminIds);
    return adminIds;
  } catch (error) {
    console.error('❌ [DUES TRIGGER] Failed to get club admins:', error);
    return [];
  }
}

/**
 * Get club name from club ID
 */
async function getClubName(clubId: string): Promise<string> {
  try {
    const db = admin.firestore();
    const clubRef = db.doc(`pickleball_clubs/${clubId}`);
    const clubSnap = await clubRef.get();

    if (!clubSnap.exists) {
      return 'Unknown Club';
    }

    const clubData = clubSnap.data();
    return clubData?.profile?.name || clubData?.name || 'Unknown Club';
  } catch (error) {
    console.error('❌ [DUES TRIGGER] Failed to get club name:', error);
    return 'Unknown Club';
  }
}

/**
 * Get user name from user ID
 */
async function getUserName(userId: string, lang: SupportedLanguage = 'en'): Promise<string> {
  try {
    const db = admin.firestore();
    const userRef = db.doc(`users/${userId}`);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return i18nMessages.defaultMemberName[lang];
    }

    const userData = userSnap.data();
    return (
      userData?.displayName ||
      userData?.profile?.nickname ||
      userData?.nickname ||
      i18nMessages.defaultMemberName[lang]
    );
  } catch (error) {
    console.error('❌ [DUES TRIGGER] Failed to get user name:', error);
    return i18nMessages.defaultMemberName[lang];
  }
}

/**
 * Main trigger function for member dues record updates
 */
export const onMemberDuesRecordUpdated = onDocumentUpdated(
  'member_dues_records/{recordId}',
  async event => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();
    const recordId = event.params.recordId;

    if (!beforeData || !afterData) {
      console.log('ℹ️ [DUES TRIGGER] Missing data, skipping');
      return null;
    }

    const beforeStatus = beforeData.status;
    const afterStatus = afterData.status;

    // Only process status changes
    if (beforeStatus === afterStatus) {
      console.log('ℹ️ [DUES TRIGGER] No status change, skipping');
      return null;
    }

    console.log('💰 [DUES TRIGGER] Status changed:', {
      recordId,
      before: beforeStatus,
      after: afterStatus,
      userId: afterData.userId,
      clubId: afterData.clubId,
    });

    const db = admin.firestore();
    const { clubId, userId, amount, duesType, period, userName } = afterData;

    // 🎯 [KIM FIX] Format period for display - check displayName first
    const formatPeriod = (p: unknown): string => {
      if (!p) return '';
      if (typeof p === 'string') return p;
      if (typeof p === 'object' && p !== null) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const periodObj = p as Record<string, any>;
        // 1. Use displayName if available (preferred)
        if (periodObj.displayName && typeof periodObj.displayName === 'string') {
          return periodObj.displayName;
        }
        // 2. Build from year and month
        if (periodObj.year && periodObj.month) {
          return `${periodObj.year}/${periodObj.month}`;
        }
        // 3. Build from year only
        if (periodObj.year) {
          return `${periodObj.year}`;
        }
        // 4. Fallback: try to stringify object keys
        console.warn('⚠️ [DUES TRIGGER] Unknown period format:', JSON.stringify(p));
        return '';
      }
      return String(p);
    };

    const periodStr = formatPeriod(period);

    try {
      // Get club name
      const clubName = await getClubName(clubId);

      // Case 1: Member requested payment approval (unpaid → pending_approval)
      if (
        (beforeStatus === 'unpaid' || beforeStatus === 'overdue') &&
        afterStatus === 'pending_approval'
      ) {
        console.log('💰 [DUES TRIGGER] Payment approval requested');

        const adminIds = await getClubAdmins(clubId);

        if (adminIds.length === 0) {
          console.warn('⚠️ [DUES TRIGGER] No admins found for club, skipping');
          return null;
        }

        // Create notifications for each admin
        const notificationPromises = adminIds.map(async adminId => {
          try {
            // Get admin's preferred language
            const adminLang = await getUserLanguage(adminId);
            const memberName = userName || (await getUserName(userId, adminLang));

            // Get localized message
            const message = i18nMessages.paymentRequest[adminLang]
              .replace('{memberName}', memberName)
              .replace('{period}', periodStr);

            // Create notification document
            const notificationData = {
              recipientId: adminId,
              type: 'DUES_PAYMENT_REQUEST',
              clubId: clubId,
              message: message,
              relatedUserId: userId,
              memberName: memberName,
              amount: amount,
              duesType: duesType,
              period: periodStr,
              status: 'unread',
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              metadata: {
                notificationType: 'dues_payment_request',
                actionRequired: true,
                recordId: recordId,
                deepLink: `club/${clubId}/dues-management`,
              },
            };

            await db.collection('notifications').add(notificationData);
            console.log(
              `✅ [DUES TRIGGER] Notification created for admin ${adminId} (${adminLang})`
            );

            // Send push notification
            await sendDuesPaymentRequestPushNotification(
              adminId,
              memberName,
              clubName,
              duesType,
              amount,
              recordId
            );
          } catch (error) {
            console.error(`❌ [DUES TRIGGER] Failed to notify admin ${adminId}:`, error);
          }
        });

        await Promise.all(notificationPromises);

        console.log('🎉 [DUES TRIGGER] Payment request notifications sent to admins');
        return { success: true, type: 'payment_request' };
      }

      // Case 2: Admin approved payment (pending_approval → paid)
      if (beforeStatus === 'pending_approval' && afterStatus === 'paid') {
        console.log('💰 [DUES TRIGGER] Payment approved');

        // Get user's preferred language
        const userLang = await getUserLanguage(userId);

        // Get localized message
        const message = i18nMessages.paymentApproved[userLang]
          .replace('{clubName}', clubName)
          .replace('{period}', periodStr);

        // Create notification for member
        const notificationData = {
          recipientId: userId,
          type: 'DUES_PAYMENT_APPROVED',
          clubId: clubId,
          message: message,
          amount: amount,
          duesType: duesType,
          period: periodStr,
          status: 'unread',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            notificationType: 'dues_payment_approved',
            recordId: recordId,
            deepLink: `club/${clubId}/my-dues`,
          },
        };

        await db.collection('notifications').add(notificationData);
        console.log(
          `✅ [DUES TRIGGER] Approval notification created for user ${userId} (${userLang})`
        );

        // Send push notification
        await sendDuesPaymentApprovedPushNotification(
          userId,
          clubName,
          duesType,
          amount,
          periodStr
        );

        console.log('🎉 [DUES TRIGGER] Payment approval notification sent to member');
        return { success: true, type: 'payment_approved' };
      }

      // Case 3: Admin rejected payment (pending_approval → rejected)
      if (beforeStatus === 'pending_approval' && afterStatus === 'rejected') {
        console.log('💰 [DUES TRIGGER] Payment rejected');

        const rejectionReason = afterData.rejectionReason || null;

        // Get user's preferred language
        const userLang = await getUserLanguage(userId);

        // Get localized message
        let message: string;
        if (rejectionReason) {
          message = i18nMessages.paymentRejectedWithReason[userLang]
            .replace('{clubName}', clubName)
            .replace('{period}', periodStr)
            .replace('{reason}', rejectionReason);
        } else {
          message = i18nMessages.paymentRejected[userLang]
            .replace('{clubName}', clubName)
            .replace('{period}', periodStr);
        }

        // Create notification for member
        const notificationData = {
          recipientId: userId,
          type: 'DUES_PAYMENT_REJECTED',
          clubId: clubId,
          message: message,
          amount: amount,
          duesType: duesType,
          period: periodStr,
          ...(rejectionReason && { rejectionReason: rejectionReason }),
          status: 'unread',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            notificationType: 'dues_payment_rejected',
            recordId: recordId,
            deepLink: `club/${clubId}/my-dues`,
          },
        };

        await db.collection('notifications').add(notificationData);
        console.log(
          `✅ [DUES TRIGGER] Rejection notification created for user ${userId} (${userLang})`
        );

        // Send push notification
        await sendDuesPaymentRejectedPushNotification(
          userId,
          clubName,
          duesType,
          amount,
          periodStr,
          rejectionReason
        );

        console.log('🎉 [DUES TRIGGER] Payment rejection notification sent to member');
        return { success: true, type: 'payment_rejected' };
      }

      console.log('ℹ️ [DUES TRIGGER] Unhandled status transition, skipping');
      return null;
    } catch (error) {
      console.error('❌ [DUES TRIGGER] Failed to process dues record update:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
);
