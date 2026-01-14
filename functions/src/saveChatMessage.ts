/**
 * 💬 [CHAT] Event Chat - Save message with unreadCount increment
 *
 * Cloud Function to atomically save chat message and increment unreadCount.
 *
 * Created: 2025-11-22
 * Author: Captain America (via Kim)
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { sendChatNotification } from './utils/notificationSender';

const db = getFirestore();

export interface SaveChatMessageRequest {
  chatRoomId: string;
  eventId: string;
  senderId: string;
  senderName: string;
  message: string;
  type: 'text' | 'system' | 'notification';
}

export const saveChatMessage = onCall(
  {
    region: 'us-central1',
    invoker: 'public',
  },
  async request => {
    try {
      const data = request.data as SaveChatMessageRequest;

      // Validate input
      if (!data.chatRoomId || typeof data.chatRoomId !== 'string') {
        throw new HttpsError('invalid-argument', 'chatRoomId is required and must be a string');
      }

      if (!data.eventId || typeof data.eventId !== 'string') {
        throw new HttpsError('invalid-argument', 'eventId is required and must be a string');
      }

      if (!data.senderId || typeof data.senderId !== 'string') {
        throw new HttpsError('invalid-argument', 'senderId is required and must be a string');
      }

      if (!data.senderName || typeof data.senderName !== 'string') {
        throw new HttpsError('invalid-argument', 'senderName is required and must be a string');
      }

      if (!data.message || typeof data.message !== 'string') {
        throw new HttpsError('invalid-argument', 'message is required and must be a string');
      }

      if (!data.type || !['text', 'system', 'notification'].includes(data.type)) {
        throw new HttpsError('invalid-argument', 'type must be one of: text, system, notification');
      }

      logger.info('[SAVE_CHAT_MESSAGE] Starting message save', {
        chatRoomId: data.chatRoomId,
        eventId: data.eventId,
        senderId: data.senderId,
        type: data.type,
      });

      // Get chat room
      const chatRoomRef = db.collection('event_chat_rooms').doc(data.chatRoomId);
      const chatRoomSnap = await chatRoomRef.get();

      if (!chatRoomSnap.exists) {
        logger.error('[SAVE_CHAT_MESSAGE] Chat room not found', {
          chatRoomId: data.chatRoomId,
        });
        throw new HttpsError('not-found', `Chat room ${data.chatRoomId} not found`);
      }

      // Verify event exists
      const eventRef = db.collection('events').doc(data.eventId);
      const eventSnap = await eventRef.get();

      if (!eventSnap.exists) {
        logger.error('[SAVE_CHAT_MESSAGE] Event not found', {
          eventId: data.eventId,
        });
        throw new HttpsError('not-found', `Event ${data.eventId} not found`);
      }

      const eventData = eventSnap.data();
      if (!eventData) {
        throw new HttpsError('internal', 'Event data is missing');
      }

      // 🎯 [KIM FIX] Get ALL event participants from event document
      // This ensures chat badge works even if user hasn't opened chat room yet
      // Include: hostId, hostPartnerId, applicantId, opponentPartnerId
      const eventParticipants = new Set<string>();

      // Host team
      if (eventData.hostId) {
        eventParticipants.add(eventData.hostId);
      }
      if (eventData.hostPartnerId) {
        eventParticipants.add(eventData.hostPartnerId);
      }

      // Challenger team
      if (eventData.applicantId) {
        eventParticipants.add(eventData.applicantId);
      }
      if (eventData.opponentPartnerId) {
        eventParticipants.add(eventData.opponentPartnerId);
      }

      // Also include participants array if exists (for meetups and approved guests)
      // 🎯 [KIM FIX] Added playerId check - approveApplication uses { playerId, playerName } format
      if (eventData.participants && Array.isArray(eventData.participants)) {
        eventData.participants.forEach(
          (p: string | { id?: string; odUserId?: string; userId?: string; playerId?: string }) => {
            if (typeof p === 'string') {
              eventParticipants.add(p);
            } else if (p.playerId) {
              // 🎯 [KIM FIX] approveApplication uses playerId for approved guests
              eventParticipants.add(p.playerId);
            } else if (p.id) {
              eventParticipants.add(p.id);
            } else if (p.userId) {
              eventParticipants.add(p.userId);
            } else if (p.odUserId) {
              eventParticipants.add(p.odUserId);
            }
          }
        );
      }

      // Get chat room participants (for updating chat room itself)
      const chatRoomData = chatRoomSnap.data();
      if (!chatRoomData) {
        throw new HttpsError('internal', 'Chat room data is missing');
      }

      const chatRoomParticipants: string[] = chatRoomData.participants || [];

      // Use event participants for unread count (more reliable)
      const participants = Array.from(eventParticipants);

      if (participants.length === 0) {
        logger.error('[SAVE_CHAT_MESSAGE] Event has no participants', {
          eventId: data.eventId,
        });
        throw new HttpsError('failed-precondition', 'Event has no participants');
      }

      logger.info('[SAVE_CHAT_MESSAGE] Event participants found', {
        eventId: data.eventId,
        eventParticipantsCount: participants.length,
        chatRoomParticipantsCount: chatRoomParticipants.length,
        eventParticipants: participants,
      });

      // Create batch
      const batch = db.batch();

      // 1. Add message to chat room
      const messageRef = chatRoomRef.collection('messages').doc();
      batch.set(messageRef, {
        senderId: data.senderId,
        senderName: data.senderName,
        message: data.message,
        type: data.type,
        timestamp: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      });

      // 2. Update chat room last activity
      batch.update(chatRoomRef, {
        lastMessage: data.message,
        lastMessageTime: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // 3. Increment unreadCount for all participants except sender
      // 🎯 [KIM FIX] Skip unread count increment for system messages
      // System messages (welcome messages, status updates) should not trigger badge notifications
      if (data.type !== 'system') {
        participants.forEach(participantId => {
          if (participantId !== data.senderId) {
            // Update event document (for Activity tab Badge UI)
            batch.update(eventRef, {
              [`chatUnreadCount.${participantId}`]: FieldValue.increment(1),
            });
          }
        });
      } else {
        logger.info('[SAVE_CHAT_MESSAGE] Skipping unread count for system message');
      }

      // Commit batch atomically
      await batch.commit();

      logger.info('[SAVE_CHAT_MESSAGE] Message saved successfully', {
        chatRoomId: data.chatRoomId,
        eventId: data.eventId,
        senderId: data.senderId,
        messageId: messageRef.id,
        participantsNotified: participants.filter(id => id !== data.senderId).length,
      });

      // Send push notifications to recipients
      const recipientIds = participants.filter(id => id !== data.senderId);
      if (recipientIds.length > 0) {
        const eventData = eventSnap.data();
        const eventTitle = eventData?.title || 'Event Chat';

        // Fire-and-forget notification sending (don't wait for completion)
        sendChatNotification(
          'event',
          data.eventId,
          eventTitle,
          data.senderName,
          data.message.substring(0, 50),
          recipientIds
        ).catch(error => {
          logger.error('[SAVE_CHAT_MESSAGE] Failed to send notifications', {
            error: error.message,
          });
        });
      }

      return {
        success: true,
        messageId: messageRef.id,
        timestamp: Date.now(),
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }

      logger.error('[SAVE_CHAT_MESSAGE] Error saving message', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw new HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to save message'
      );
    }
  }
);
