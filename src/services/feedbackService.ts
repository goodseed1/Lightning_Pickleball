/**
 * FeedbackService - User-side Feedback Management
 * Allows users to view their own feedback and admin responses
 * Supports conversation threads between user and admin
 */

import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  Timestamp,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Conversation Message Interface for feedback threads
 */
export interface ConversationMessage {
  sender: 'user' | 'admin';
  senderName: string;
  senderId: string;
  message: string;
  timestamp: Date;
}

/**
 * User Feedback Item Interface (user-side view)
 */
export interface UserFeedbackItem {
  id: string;
  type: 'bug' | 'feature' | 'complaint' | 'praise' | 'other';
  title: string;
  description: string;
  status: 'new' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  // Legacy single response field (for backward compatibility)
  adminResponse?: string;
  respondedAt?: Date;
  // 💬 Conversation thread
  conversation?: ConversationMessage[];
  lastMessageAt?: Date;
  lastMessageBy?: 'user' | 'admin';
}

/**
 * Subscribe to user's own feedback with real-time updates
 * @param userId Current user's ID
 * @param callback Function to call when feedback data changes
 * @returns Unsubscribe function
 */
export const subscribeToMyFeedback = (
  userId: string,
  callback: (feedback: UserFeedbackItem[]) => void
): (() => void) => {
  try {
    const feedbackRef = collection(db, 'user_feedback');
    const q = query(feedbackRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      snapshot => {
        const feedbackList: UserFeedbackItem[] = snapshot.docs.map(docSnapshot => {
          const data = docSnapshot.data();

          // Parse conversation array with timestamps
          const conversation: ConversationMessage[] = (data.conversation || []).map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (msg: any) => ({
              sender: msg.sender,
              senderName: msg.senderName,
              senderId: msg.senderId,
              message: msg.message,
              timestamp: msg.timestamp?.toDate() || new Date(),
            })
          );

          return {
            id: docSnapshot.id,
            type: data.type,
            title: data.title,
            description: data.description,
            status: data.status,
            priority: data.priority,
            createdAt: data.createdAt?.toDate(),
            adminResponse: data.adminResponse,
            respondedAt: data.respondedAt?.toDate(),
            // 💬 Conversation thread
            conversation,
            lastMessageAt: data.lastMessageAt?.toDate(),
            lastMessageBy: data.lastMessageBy,
          };
        });
        callback(feedbackList);
      },
      error => {
        console.error('[feedbackService] Error subscribing to my feedback:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.error('[feedbackService] Error setting up my feedback subscription:', error);
    return () => {};
  }
};

/**
 * Add user reply to existing feedback conversation
 * @param feedbackId Feedback document ID
 * @param message User's reply message
 * @param userId User's ID
 * @param userName User's display name
 */
export const addUserReply = async (
  feedbackId: string,
  message: string,
  userId: string,
  userName: string
): Promise<void> => {
  try {
    const feedbackRef = doc(db, 'user_feedback', feedbackId);
    const now = Timestamp.now();

    // Create new conversation message
    const newMessage = {
      sender: 'user' as const,
      senderName: userName,
      senderId: userId,
      message,
      timestamp: now,
    };

    const updateData = {
      conversation: arrayUnion(newMessage),
      lastMessageAt: now,
      lastMessageBy: 'user',
      // Change status back to new (awaiting admin response)
      status: 'new',
      updatedAt: now,
    };

    await updateDoc(feedbackRef, updateData);
    console.log('[feedbackService] User reply added to conversation:', feedbackId);
  } catch (error) {
    console.error('[feedbackService] Error adding user reply:', error);
    throw error;
  }
};
