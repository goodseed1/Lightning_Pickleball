/**
 * 🌉 [HEIMDALL] Create League Cloud Function
 * Server-Side Migration Phase 3: League Creation
 *
 * Securely creates a new league with validation and admin SDK
 * Uses Admin SDK to bypass Security Rules
 *
 * @author Kim (Server-Side Migration Phase 3)
 * @date 2025-11-17
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';

const db = admin.firestore();

interface CreateLeagueRequest {
  clubId: string;
  seasonName: string;
  description?: string;
  eventType:
    | 'mens_singles'
    | 'womens_singles'
    | 'mens_doubles'
    | 'womens_doubles'
    | 'mixed_doubles';
  settings: {
    maxParticipants?: number;
    matchFormat?: string;
    pointsPerWin?: number;
    pointsPerDraw?: number;
    [key: string]: unknown;
  };
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  registrationDeadline: string; // ISO date string
  entryFee?: number;
}

interface CreateLeagueResponse {
  success: boolean;
  message: string;
  data: {
    leagueId: string;
  };
}

/**
 * Create League Cloud Function
 *
 * Workflow:
 * 1. Validate authentication
 * 2. Verify club membership (admin/owner/manager only)
 * 3. Verify club exists
 * 4. Validate league dates
 * 5. Create league document
 *
 * @param request - Contains league creation data
 * @returns Success status with league ID
 */
export const createLeague = onCall<CreateLeagueRequest, Promise<CreateLeagueResponse>>(
  async request => {
    const { data, auth } = request;
    const {
      clubId,
      seasonName,
      description,
      eventType,
      settings,
      startDate,
      endDate,
      registrationDeadline,
      entryFee,
    } = data;

    // ==========================================================================
    // Step 1: Authentication
    // ==========================================================================
    if (!auth || !auth.uid) {
      throw new HttpsError('unauthenticated', 'You must be logged in to create a league');
    }

    const userId = auth.uid;

    logger.info('🏆 [CREATE_LEAGUE] Starting league creation', {
      clubId,
      seasonName,
      userId,
    });

    try {
      // ========================================================================
      // Step 2: Verify Club Membership (Admin/Owner/Manager)
      // ========================================================================
      const clubMemberRef = db.collection('clubMembers').doc(`${clubId}_${userId}`);
      const clubMemberSnap = await clubMemberRef.get();

      if (!clubMemberSnap.exists) {
        throw new HttpsError('permission-denied', 'You are not a member of this club');
      }

      const clubMemberData = clubMemberSnap.data();
      const role = clubMemberData?.role;

      if (role !== 'admin' && role !== 'owner' && role !== 'manager') {
        throw new HttpsError(
          'permission-denied',
          'Only club admins, owners, or managers can create leagues'
        );
      }

      logger.info('✅ [CREATE_LEAGUE] User role verified', { role });

      // ========================================================================
      // Step 3: Verify Club Exists
      // ========================================================================
      const clubRef = db.collection('pickleball_clubs').doc(clubId);
      const clubSnap = await clubRef.get();

      if (!clubSnap.exists) {
        throw new HttpsError('not-found', 'Club not found');
      }

      logger.info('✅ [CREATE_LEAGUE] Club verified', { clubId });

      // ========================================================================
      // Step 4: Validate League Dates
      // ========================================================================
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      const registrationDeadlineObj = new Date(registrationDeadline);
      const now = new Date();

      if (
        isNaN(startDateObj.getTime()) ||
        isNaN(endDateObj.getTime()) ||
        isNaN(registrationDeadlineObj.getTime())
      ) {
        throw new HttpsError('invalid-argument', 'Invalid date format');
      }

      if (endDateObj <= startDateObj) {
        throw new HttpsError('invalid-argument', 'End date must be after start date');
      }

      if (registrationDeadlineObj >= startDateObj) {
        throw new HttpsError(
          'invalid-argument',
          'Registration deadline must be before league start date'
        );
      }

      if (registrationDeadlineObj < now) {
        throw new HttpsError('invalid-argument', 'Registration deadline must be in the future');
      }

      // ========================================================================
      // Step 5: Create League Document
      // ========================================================================
      const leagueRef = db.collection('leagues').doc();
      const leagueData: Record<string, unknown> = {
        clubId,
        name: seasonName,
        description: description || '',
        eventType,
        settings,

        participants: [],
        standings: [],

        startDate: admin.firestore.Timestamp.fromDate(startDateObj),
        endDate: admin.firestore.Timestamp.fromDate(endDateObj),
        applicationDeadline: admin.firestore.Timestamp.fromDate(registrationDeadlineObj),

        status: 'open', // 생성 즉시 신청접수 시작
        currentRound: 0,
        openedAt: admin.firestore.FieldValue.serverTimestamp(),

        createdBy: userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Add optional entry fee
      if (entryFee !== undefined) {
        leagueData.entryFee = entryFee;
      }

      await leagueRef.set(leagueData);

      logger.info('✅ [CREATE_LEAGUE] League created successfully', {
        leagueId: leagueRef.id,
        seasonName,
      });

      // ========================================================================
      // Step 6: Create Notifications for Club Members
      // ========================================================================
      try {
        // Get club name for notifications
        const clubData = clubSnap.data();
        const clubName = clubData?.name || 'Club';

        // Get creator's display name
        const creatorDoc = await db.collection('users').doc(userId).get();
        const creatorName = creatorDoc.exists ? creatorDoc.data()?.displayName || 'Admin' : 'Admin';

        // Get all active club members
        const clubMembersSnapshot = await db
          .collection('clubMembers')
          .where('clubId', '==', clubId)
          .where('status', '==', 'active')
          .get();

        const memberIds: string[] = [];
        clubMembersSnapshot.forEach(doc => {
          const memberId = doc.data()?.userId;
          if (memberId) {
            memberIds.push(memberId);
          }
        });

        // ✅ [2026-01-12] RESTORED: League creation feed/push notifications
        // Message style changed: "Registration is open, sign up now!" (not "X created league")
        logger.info('📢 [CREATE_LEAGUE] Creating notifications for members', {
          memberCount: memberIds.length,
          leagueId: leagueRef.id,
          clubName,
          creatorName,
        });

        // Create notifications for each member (클럽홈 알림) + 푸시 알림
        const firestorePromises: Promise<admin.firestore.DocumentReference>[] = [];
        const pushPromises: Promise<void>[] = [];

        for (const memberId of memberIds) {
          // Skip creator
          if (memberId === userId) continue;

          // Firestore notification (클럽 홈에 표시)
          // 🎯 [KIM FIX] Use translation key instead of hardcoded Korean
          firestorePromises.push(
            db.collection('notifications').add({
              type: 'league_registration_open',
              recipientId: memberId,
              clubId,
              clubName,
              leagueId: leagueRef.id,
              leagueName: seasonName,
              title: 'notification.leagueRegistrationOpenTitle',
              message: 'notification.leagueRegistrationOpen',
              status: 'unread',
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              metadata: {
                notificationType: 'league_registration_open',
                leagueName: seasonName,
                clubName,
                eventType,
                startDate,
                endDate,
                registrationDeadline,
                deepLink: `club/${clubId}/league/${leagueRef.id}`,
              },
            })
          );

          // 푸시 알림 (이벤트 알림이 켜져 있는 경우)
          // 🎯 [KIM FIX] Get user's preferred language for push notification i18n
          const memberUserDoc = await db.collection('users').doc(memberId).get();
          if (memberUserDoc.exists) {
            const memberData = memberUserDoc.data();
            const pushToken = memberData?.pushToken;
            const userLang = memberData?.preferredLanguage || memberData?.language || 'en';

            if (pushToken) {
              // 🌍 i18n Push Notification Messages - "Registration open, sign up!" style
              const pushMessages: Record<string, { title: string; body: string }> = {
                ko: {
                  title: '🏆 리그 참가 신청 오픈!',
                  body: `${seasonName} 리그 참가 신청이 시작되었습니다. 지금 바로 신청하세요!`,
                },
                en: {
                  title: '🏆 League Registration Open!',
                  body: `${seasonName} league registration is now open. Sign up today!`,
                },
                ja: {
                  title: '🏆 リーグ参加登録開始！',
                  body: `${seasonName}リーグの参加登録が始まりました。今すぐお申し込みください！`,
                },
                zh: {
                  title: '🏆 联赛报名开放！',
                  body: `${seasonName}联赛报名现已开放。立即报名！`,
                },
                de: {
                  title: '🏆 Liga-Anmeldung geöffnet!',
                  body: `Die Anmeldung für die ${seasonName} Liga ist jetzt offen. Melden Sie sich noch heute an!`,
                },
                fr: {
                  title: '🏆 Inscriptions ouvertes !',
                  body: `Les inscriptions pour la ligue ${seasonName} sont ouvertes. Inscrivez-vous dès maintenant !`,
                },
                es: {
                  title: '🏆 ¡Inscripciones abiertas!',
                  body: `Las inscripciones para la liga ${seasonName} están abiertas. ¡Inscríbete hoy!`,
                },
                it: {
                  title: '🏆 Iscrizioni aperte!',
                  body: `Le iscrizioni per la lega ${seasonName} sono aperte. Iscriviti oggi!`,
                },
                pt: {
                  title: '🏆 Inscrições abertas!',
                  body: `As inscrições para a liga ${seasonName} estão abertas. Inscreva-se hoje!`,
                },
                ru: {
                  title: '🏆 Регистрация открыта!',
                  body: `Регистрация на лигу ${seasonName} открыта. Зарегистрируйтесь сегодня!`,
                },
              };

              const msg = pushMessages[userLang] || pushMessages['en'];

              const pushPromise = fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                  Accept: 'application/json',
                  'Accept-encoding': 'gzip, deflate',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  to: pushToken,
                  sound: 'default',
                  title: msg.title,
                  body: msg.body,
                  data: {
                    type: 'league_registration_open',
                    clubId,
                    leagueId: leagueRef.id,
                    leagueName: seasonName,
                  },
                  priority: 'high',
                  channelId: 'leagues',
                }),
              })
                .then(response => {
                  logger.info(
                    `✅ [CREATE_LEAGUE] Push notification sent to ${memberId} (lang: ${userLang})`
                  );
                  return response.json();
                })
                .catch(err => {
                  logger.warn(`⚠️ [CREATE_LEAGUE] Push notification failed for ${memberId}:`, err);
                });

              pushPromises.push(pushPromise as Promise<void>);
            }
          }
        }

        await Promise.all([...firestorePromises, ...pushPromises]);
        logger.info('✅ [CREATE_LEAGUE] Notifications created', {
          firestore: firestorePromises.length,
          push: pushPromises.length,
        });

        // Create feed item (피드 알림) - "Registration open" style
        await db.collection('feed').add({
          type: 'league_registration_open',
          actorId: userId,
          actorName: creatorName,
          clubId,
          clubName,
          leagueId: leagueRef.id,
          visibility: 'club_members',
          visibleTo: memberIds,
          isActive: true,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            leagueName: seasonName,
            eventType,
            startDate,
            endDate,
            registrationDeadline,
            maxParticipants: settings.maxParticipants || 16,
          },
        });

        logger.info('✅ [CREATE_LEAGUE] Feed item created');
      } catch (notificationError) {
        // Non-critical: Don't fail league creation if notifications fail
        logger.warn('⚠️ [CREATE_LEAGUE] Failed to create notifications (non-critical)', {
          error:
            notificationError instanceof Error
              ? notificationError.message
              : String(notificationError),
        });
      }

      return {
        success: true,
        message: 'League created successfully',
        data: {
          leagueId: leagueRef.id,
        },
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }

      logger.error('❌ [CREATE_LEAGUE] Unexpected error', {
        clubId,
        seasonName,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new HttpsError(
        'internal',
        `Failed to create league: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
);
