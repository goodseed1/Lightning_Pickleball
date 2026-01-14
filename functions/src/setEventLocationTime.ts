/**
 * ⚡ [QUICK MATCH] Set Event Location & Time Cloud Function
 *
 * Updates event location and scheduled time, changes status from 'recruiting' to 'upcoming'
 * Only callable by event host
 *
 * @author Kim
 * @date 2025-12-11
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;
const Timestamp = admin.firestore.Timestamp;

interface SetEventLocationTimeRequest {
  eventId: string;
  location: string;
  placeDetails: {
    place_id: string;
    formatted_address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    name: string;
  };
  scheduledTime: string; // ISO datetime string
}

/**
 * Set Event Location & Time Cloud Function
 *
 * Updates event location and scheduled time, changes status to 'upcoming'
 */
export const setEventLocationTime = onCall<SetEventLocationTimeRequest>(async request => {
  const { data, auth } = request;

  // 1. Authentication check
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { eventId, location, placeDetails, scheduledTime } = data;
  const userId = auth.uid;

  // 2. Validate input
  if (!eventId) {
    throw new HttpsError('invalid-argument', 'eventId is required');
  }

  if (!location) {
    throw new HttpsError('invalid-argument', 'location is required');
  }

  if (!placeDetails) {
    throw new HttpsError('invalid-argument', 'placeDetails is required');
  }

  if (!scheduledTime) {
    throw new HttpsError('invalid-argument', 'scheduledTime is required');
  }

  // Validate scheduledTime is valid ISO string
  const scheduledDate = new Date(scheduledTime);
  if (isNaN(scheduledDate.getTime())) {
    throw new HttpsError('invalid-argument', 'scheduledTime must be a valid ISO datetime string');
  }

  try {
    logger.info('📍 [SET_LOCATION_TIME] Starting location/time update', {
      eventId,
      userId,
      location,
      scheduledTime,
    });

    // 3. Get event document
    const eventRef = db.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      throw new HttpsError('not-found', 'Event not found');
    }

    const eventData = eventDoc.data()!;

    // 4. Verify caller is the host
    if (eventData.hostId !== userId) {
      throw new HttpsError('permission-denied', 'Only the event host can set location and time');
    }

    // 5. Verify event status is 'recruiting'
    if (eventData.status !== 'recruiting') {
      logger.warn('⚠️ [SET_LOCATION_TIME] Event status is not recruiting', {
        eventId,
        currentStatus: eventData.status,
      });
      // Don't throw error, just log warning - allow updating any status
    }

    logger.info('✅ [SET_LOCATION_TIME] Validation passed', {
      hostId: eventData.hostId,
      currentStatus: eventData.status,
    });

    // 6. Update event document
    await eventRef.update({
      location: location,
      placeDetails: placeDetails,
      scheduledTime: Timestamp.fromDate(scheduledDate),
      status: 'upcoming',
      updatedAt: serverTimestamp(),
    });

    logger.info('✅ [SET_LOCATION_TIME] Event updated successfully', {
      eventId,
      location,
      scheduledTime,
      newStatus: 'upcoming',
    });

    // 7. Send push notifications to participants (excluding host)
    try {
      const participants = eventData.participants || [];
      const invitedFriends = eventData.invitedFriends || [];
      const allRecipients = [...new Set([...participants, ...invitedFriends])].filter(
        id => id !== userId
      );

      logger.info('📤 [SET_LOCATION_TIME] Sending notifications to participants', {
        count: allRecipients.length,
        recipients: allRecipients,
      });

      // Format date/time for notification
      const formattedDate = scheduledDate.toLocaleDateString('ko-KR', {
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      });
      const formattedTime = scheduledDate.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const notificationPromises = allRecipients.map(async recipientId => {
        try {
          const recipientDoc = await db.collection('users').doc(recipientId).get();
          if (!recipientDoc.exists) {
            logger.warn('⚠️ [SET_LOCATION_TIME] Recipient not found', { recipientId });
            return;
          }

          const recipientData = recipientDoc.data()!;
          const pushToken = recipientData.pushToken;

          if (!pushToken) {
            logger.info('⚠️ [SET_LOCATION_TIME] Recipient has no push token', {
              recipientId,
            });
            return;
          }

          // 🎯 [KIM FIX] Get user's preferred language for push notification i18n
          const userLang = recipientData.preferredLanguage || recipientData.language || 'en';

          // 🌍 i18n Push Notification Messages
          const pushMessages: Record<string, { title: string; body: string }> = {
            ko: {
              title: '📍 매치 장소/시간 확정!',
              body: `${eventData.title || '매치'}의 장소와 시간이 설정되었습니다.\n📍 ${location}\n🕐 ${formattedDate} ${formattedTime}`,
            },
            en: {
              title: '📍 Match Location/Time Confirmed!',
              body: `Location and time for "${eventData.title || 'Match'}" has been set.\n📍 ${location}\n🕐 ${formattedDate} ${formattedTime}`,
            },
            ja: {
              title: '📍 マッチの場所・時間が確定!',
              body: `「${eventData.title || 'マッチ'}」の場所と時間が設定されました。\n📍 ${location}\n🕐 ${formattedDate} ${formattedTime}`,
            },
            zh: {
              title: '📍 比赛地点/时间已确认!',
              body: `"${eventData.title || '比赛'}"的地点和时间已设置。\n📍 ${location}\n🕐 ${formattedDate} ${formattedTime}`,
            },
            de: {
              title: '📍 Spielort/Zeit bestätigt!',
              body: `Ort und Zeit für "${eventData.title || 'Spiel'}" wurden festgelegt.\n📍 ${location}\n🕐 ${formattedDate} ${formattedTime}`,
            },
            fr: {
              title: '📍 Lieu/Heure du match confirmés!',
              body: `Le lieu et l'heure de "${eventData.title || 'Match'}" ont été définis.\n📍 ${location}\n🕐 ${formattedDate} ${formattedTime}`,
            },
            es: {
              title: '📍 ¡Lugar/Hora del partido confirmados!',
              body: `El lugar y la hora de "${eventData.title || 'Partido'}" han sido establecidos.\n📍 ${location}\n🕐 ${formattedDate} ${formattedTime}`,
            },
            it: {
              title: '📍 Luogo/Orario partita confermati!',
              body: `Il luogo e l'orario di "${eventData.title || 'Partita'}" sono stati impostati.\n📍 ${location}\n🕐 ${formattedDate} ${formattedTime}`,
            },
            pt: {
              title: '📍 Local/Hora da partida confirmados!',
              body: `O local e horário de "${eventData.title || 'Partida'}" foram definidos.\n📍 ${location}\n🕐 ${formattedDate} ${formattedTime}`,
            },
            ru: {
              title: '📍 Место/Время матча подтверждены!',
              body: `Место и время "${eventData.title || 'Матч'}" установлены.\n📍 ${location}\n🕐 ${formattedDate} ${formattedTime}`,
            },
          };

          const msg = pushMessages[userLang] || pushMessages['en'];
          const message = {
            to: pushToken,
            sound: 'default',
            title: msg.title,
            body: msg.body,
            data: {
              type: 'event_location_time_set',
              notificationType: 'event_location_time_set',
              eventId: eventId,
              eventTitle: eventData.title || '매치',
              location: location,
              scheduledTime: scheduledTime,
            },
            priority: 'high',
            channelId: 'events',
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

          const pushResult = await response.json();

          if (pushResult.errors) {
            logger.warn('⚠️ [SET_LOCATION_TIME] Push notification failed', {
              recipientId,
              errors: pushResult.errors,
            });
          } else {
            logger.info('✅ [SET_LOCATION_TIME] Push notification sent', {
              recipientId,
              ticketId: pushResult.data?.id,
            });
          }
        } catch (error) {
          logger.warn('⚠️ [SET_LOCATION_TIME] Failed to send notification', {
            recipientId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });

      await Promise.all(notificationPromises);

      logger.info('✅ [SET_LOCATION_TIME] All notifications sent', {
        total: allRecipients.length,
      });
    } catch (notifError) {
      logger.warn('⚠️ [SET_LOCATION_TIME] Notification error (non-critical)', {
        error: notifError instanceof Error ? notifError.message : String(notifError),
      });
    }

    return {
      success: true,
      message: 'Location and time have been set!',
      eventId: eventId,
      location: location,
      scheduledTime: scheduledTime,
    };
  } catch (error: unknown) {
    logger.error('❌ [SET_LOCATION_TIME] Error setting location/time', {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof HttpsError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new HttpsError('internal', 'Failed to set event location and time', errorMessage);
  }
});
