/**
 * AI Chat Context for Lightning Tennis
 * Manages AI chat state, conversation history, and user interactions
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';
import aiChatService from '../services/aiChatService';
import aiService from '../services/aiService';
import { searchEvents, formatSearchResultForAI } from '../services/eventService';
import { executeAICommand } from '../services/navigationService';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import type { EventData } from '../types/ai';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  addDoc,
  serverTimestamp,
  getDocs,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai' | 'system';
  timestamp: Date;
  language: string;
  relevantKnowledge?: number;
  confidence?: number;
  type:
    | 'message'
    | 'tip'
    | 'analysis'
    | 'advice'
    | 'search_result'
    | 'navigation'
    | 'admin_feedback_request'
    | 'admin_feedback_confirm';
  // 구조화된 데이터 (검색 결과 등)
  data?: {
    events?: EventData[];
    navigationTarget?: string;
    command?: string;
  };
}

interface QuickAction {
  id: string;
  titleKey: string;
  iconName: string;
  action: () => void;
}

interface AIChatContextType {
  // Chat State
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  isTyping: boolean;
  unreadAdminResponseCount: number;
  isWaitingForAdminFeedback: boolean;

  // Chat Actions
  sendMessage: (message: string, type?: 'message' | 'tip' | 'analysis' | 'advice') => Promise<void>;
  clearChat: () => void;
  contactAdmin: () => void;
  analyzeLastMatch: () => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  analyzeSpecificMatch: (eventData: any) => Promise<void>; // 🎾 특정 경기 분석
  getPersonalizedAdvice: (query: string) => Promise<void>;
  clearUnreadAdminResponses: () => void;

  // Quick Actions
  quickActions: QuickAction[];
  executeQuickAction: (actionId: string) => void;

  // Conversation Management
  conversationHistory: unknown[];
  saveConversation: () => Promise<void>;
  loadConversation: () => Promise<void>;
}

const AIChatContext = createContext<AIChatContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAIChat = () => {
  const context = useContext(AIChatContext);
  if (context === undefined) {
    throw new Error('useAIChat must be used within an AIChatProvider');
  }
  return context;
};

interface AIChatProviderProps {
  children: ReactNode;
}

export const AIChatProvider: React.FC<AIChatProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const { currentLanguage, t } = useLanguage();

  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<unknown[]>([]);
  const [unreadAdminResponseCount, setUnreadAdminResponseCount] = useState(0);
  const [displayedAdminResponses, setDisplayedAdminResponses] = useState<Set<string>>(new Set());
  const [isWaitingForAdminFeedback, setIsWaitingForAdminFeedback] = useState(false);

  // Generate message ID
  const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // 🚨 [Project Sentinel] Submit feedback report to Cloud Function
  const submitFeedbackReport = async (
    userMessage: string,
    aiResponse: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    feedbackReport: any
  ) => {
    try {
      console.log('🚨 [Sentinel] Submitting feedback report:', feedbackReport);

      const reportUserFeedback = httpsCallable(functions, 'reportUserFeedback');
      await reportUserFeedback({
        userId: currentUser?.uid || 'anonymous',
        userName: currentUser?.displayName || 'Anonymous User',
        userMessage: userMessage,
        aiResponse: aiResponse,
        detectedIssue: {
          priority: feedbackReport.priority,
          category: feedbackReport.category,
          keywords: feedbackReport.keywords || [],
          context: feedbackReport.context || '',
        },
      });

      console.log('✅ [Sentinel] Feedback report submitted successfully');
    } catch (error) {
      console.error('❌ [Sentinel] Failed to submit feedback report:', error);
      // Silent fail - don't interrupt user experience
    }
  };

  // 📊 [Conversation Analytics] Submit conversation analysis to Cloud Function
  const submitConversationAnalytics = async (
    userMessage: string,
    aiResponse: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    conversationAnalysis: any
  ) => {
    try {
      console.log('📊 [Analytics] Submitting conversation analysis:', conversationAnalysis);

      const saveConversationAnalytics = httpsCallable(functions, 'saveConversationAnalytics');
      await saveConversationAnalytics({
        userId: currentUser?.uid || 'anonymous',
        userName: currentUser?.displayName || 'Anonymous User',
        userMessage: userMessage,
        aiResponse: aiResponse,
        analysis: {
          topic: conversationAnalysis.topic || 'other',
          sentiment: conversationAnalysis.sentiment || 'neutral',
          intent: conversationAnalysis.intent || 'other',
          keywords: conversationAnalysis.keywords || [],
        },
        language: currentLanguage,
      });

      console.log('✅ [Analytics] Conversation analysis submitted successfully');
    } catch (error) {
      console.error('❌ [Analytics] Failed to submit conversation analysis:', error);
      // Silent fail - don't interrupt user experience
    }
  };

  // Send message to AI
  const sendMessage = async (
    message: string,
    type: 'message' | 'tip' | 'analysis' | 'advice' = 'message'
  ) => {
    if (!message.trim()) return;

    // 📝 Handle admin feedback submission
    if (isWaitingForAdminFeedback) {
      // Add user message first
      const userMessage: ChatMessage = {
        id: generateMessageId(),
        content: message,
        sender: 'user',
        timestamp: new Date(),
        language: currentLanguage,
        type: 'message',
      };
      setMessages(prev => [...prev, userMessage]);

      // Submit feedback to Firestore
      await submitUserFeedback(message);
      return;
    }

    try {
      setIsLoading(true);
      setIsTyping(true);
      setError(null);

      // Add user message
      const userMessage: ChatMessage = {
        id: generateMessageId(),
        content: message,
        sender: 'user',
        timestamp: new Date(),
        language: currentLanguage,
        type,
      };

      setMessages(prev => [...prev, userMessage]);

      // 🧠 NLU 엔진으로 자연어 파싱
      console.log('🧠 NLU: Parsing user query...');
      const nluResult = await aiService.parseUserQueryToCommand(message, currentLanguage);
      console.log('🧠 NLU Result:', nluResult);

      // 명령에 따른 처리
      let aiResponse: ChatMessage;

      if (nluResult.confidence >= 0.7) {
        // 높은 신뢰도 → 명령 실행
        switch (nluResult.command) {
          case 'searchEvents': {
            // 검색 중 메시지
            const searchingMsg: ChatMessage = {
              id: generateMessageId(),
              content: t('aiChat.searching'),
              sender: 'ai',
              timestamp: new Date(),
              language: currentLanguage,
              type: 'message',
            };
            setMessages(prev => [...prev, searchingMsg]);

            // 실제 검색 실행
            const searchResult = await searchEvents(nluResult.params);
            const resultMessage = formatSearchResultForAI(searchResult, currentLanguage);

            aiResponse = {
              id: generateMessageId(),
              content: resultMessage,
              sender: 'ai',
              timestamp: new Date(),
              language: currentLanguage,
              type: 'search_result',
              data: { events: searchResult.events, command: 'searchEvents' },
            };
            break;
          }

          case 'navigate': {
            const screen = nluResult.params.screen;
            const navMessageKey = `aiChat.navigation.${screen}`;

            // Try to get specific navigation message, fallback to generic
            const navContent = t(navMessageKey, {
              defaultValue: t('aiChat.navigation.default', { screen }),
            });

            aiResponse = {
              id: generateMessageId(),
              content: navContent,
              sender: 'ai',
              timestamp: new Date(),
              language: currentLanguage,
              type: 'navigation',
              data: { navigationTarget: screen, command: 'navigate' },
            };

            // 1.5초 후 실제 네비게이션 실행
            setTimeout(() => {
              executeAICommand({ type: 'navigate', screen });
            }, 1500);
            break;
          }

          case 'askQuestion':
          default: {
            // 일반 질문 → 기존 chat 서비스 사용
            const userProfile = currentUser
              ? {
                  skillLevel: currentUser.skillLevel || 'intermediate',
                  playingStyle: currentUser.playingStyle || 'all-court',
                  recentMatches: currentUser.recentMatches || [],
                  currentGoals: currentUser.goals || null,
                }
              : null;

            const chatResponse = await aiChatService.chat(message, currentLanguage, userProfile);

            // 🚨 [Sentinel] Check for feedback report and submit if detected
            if (chatResponse.feedbackReport && chatResponse.feedbackReport.detected) {
              await submitFeedbackReport(
                message,
                chatResponse.response,
                chatResponse.feedbackReport
              );
            }

            // 📊 [Analytics] Always submit conversation analysis for ALL conversations
            if (chatResponse.conversationAnalysis) {
              await submitConversationAnalytics(
                message,
                chatResponse.response,
                chatResponse.conversationAnalysis
              );
            }

            aiResponse = {
              id: generateMessageId(),
              content: chatResponse.response,
              sender: 'ai',
              timestamp: new Date(),
              language: currentLanguage,
              relevantKnowledge: chatResponse.relevantKnowledge,
              confidence: chatResponse.confidence,
              type: 'message',
            };
            break;
          }
        }
      } else {
        // 낮은 신뢰도 → 기존 chat 서비스로 폴백
        const userProfile = currentUser
          ? {
              skillLevel: currentUser.skillLevel || 'intermediate',
              playingStyle: currentUser.playingStyle || 'all-court',
              recentMatches: currentUser.recentMatches || [],
              currentGoals: currentUser.goals || null,
            }
          : null;

        const chatResponse = await aiChatService.chat(message, currentLanguage, userProfile);

        // 🚨 [Sentinel] Check for feedback report and submit if detected
        if (chatResponse.feedbackReport && chatResponse.feedbackReport.detected) {
          await submitFeedbackReport(message, chatResponse.response, chatResponse.feedbackReport);
        }

        // 📊 [Analytics] Always submit conversation analysis for ALL conversations
        if (chatResponse.conversationAnalysis) {
          await submitConversationAnalytics(
            message,
            chatResponse.response,
            chatResponse.conversationAnalysis
          );
        }

        aiResponse = {
          id: generateMessageId(),
          content: chatResponse.response,
          sender: 'ai',
          timestamp: new Date(),
          language: currentLanguage,
          relevantKnowledge: chatResponse.relevantKnowledge,
          confidence: chatResponse.confidence,
          type: 'message',
        };
      }

      // 타이핑 딜레이 후 AI 응답 추가
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, aiResponse]);
      }, 1000);
    } catch (err: unknown) {
      console.error('❌ Error sending message:', err);
      setError(i18n.t('contexts.aiChat.failedToSendMessage'));
      setIsTyping(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Contact admin - ask user for feedback content
  const contactAdmin = () => {
    // Show AI message asking for feedback content
    const askMessage: ChatMessage = {
      id: generateMessageId(),
      content: t('aiChat.contactAdmin.askContent'),
      sender: 'ai',
      timestamp: new Date(),
      language: currentLanguage,
      type: 'admin_feedback_request',
    };
    setMessages(prev => [...prev, askMessage]);
    setIsWaitingForAdminFeedback(true);
  };

  // Submit user feedback to Firestore
  const submitUserFeedback = async (content: string) => {
    try {
      console.log('📝 [ContactAdmin] Submitting user feedback to Firestore...');

      // Generate auto-title from content (first 30 chars)
      const autoTitle =
        content.length > 30
          ? `[AI 도우미] ${content.substring(0, 30)}...`
          : `[AI 도우미] ${content}`;

      await addDoc(collection(db, 'user_feedback'), {
        userId: currentUser?.uid || 'anonymous',
        userName: currentUser?.displayName || 'Anonymous User',
        userEmail: currentUser?.email || '',
        // Required fields for admin dashboard
        title: autoTitle,
        description: content,
        type: 'other' as const,
        priority: 'medium' as const,
        status: 'new' as const,
        // Additional metadata
        source: 'chatbot_contact_admin',
        createdAt: serverTimestamp(),
        language: currentLanguage,
      });

      console.log('✅ [ContactAdmin] User feedback submitted successfully');

      // Show confirmation message
      const confirmMessage: ChatMessage = {
        id: generateMessageId(),
        content: t('aiChat.contactAdmin.confirmSent'),
        sender: 'ai',
        timestamp: new Date(),
        language: currentLanguage,
        type: 'admin_feedback_confirm',
      };
      setMessages(prev => [...prev, confirmMessage]);
    } catch (error) {
      console.error('❌ [ContactAdmin] Failed to submit feedback:', error);

      // Show error message
      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        content: t('aiChat.contactAdmin.errorSending'),
        sender: 'ai',
        timestamp: new Date(),
        language: currentLanguage,
        type: 'message',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsWaitingForAdminFeedback(false);
    }
  };

  // Analyze last match performance - directly query Firestore for recent completed matches
  const analyzeLastMatch = async () => {
    // 🔄 Show loading indicator while analyzing
    setIsLoading(true);
    setIsTyping(true);

    try {
      if (!currentUser?.uid) {
        const message: ChatMessage = {
          id: generateMessageId(),
          content: t('aiChat.loginRequired'),
          sender: 'ai',
          timestamp: new Date(),
          language: currentLanguage,
          type: 'analysis',
        };
        setMessages(prev => [...prev, message]);
        return;
      }

      // 🔍 Query from 'events' collection (NOT 'matches' - that's unused!)
      // 1. First query: Events where user is host with matchResult
      const eventsRef = collection(db, 'events');
      const hostedMatchesQuery = query(
        eventsRef,
        where('hostId', '==', currentUser.uid),
        orderBy('scheduledTime', 'desc'),
        limit(20)
      );

      const hostedSnapshot = await getDocs(hostedMatchesQuery);

      // 2. Filter for completed matches (both 번개 매치 and 클럽 활동)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const completedHostedMatches = hostedSnapshot.docs.filter((doc: any) => {
        const data = doc.data();
        // Must have matchResult (completed match)
        return data.matchResult || (data.score && data.score._winner);
      });

      // 3. Also search for events where user is a participant (guests in singles matches)
      // Firestore can't query nested arrays, so fetch recent completed events and filter
      const recentEventsQuery = query(
        eventsRef,
        where('status', 'in', ['completed', 'active', 'open']),
        orderBy('scheduledTime', 'desc'),
        limit(50)
      );

      const recentSnapshot = await getDocs(recentEventsQuery);

      // Filter for ALL matches (번개 매치 + 클럽 활동) where user is a participant (not host)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const participatedMatches = recentSnapshot.docs.filter((doc: any) => {
        const data = doc.data();
        // Skip if already in hosted matches or no matchResult
        if (data.hostId === currentUser.uid) return false;
        if (!data.matchResult && !(data.score && data.score._winner)) return false;

        // Check if user is in participants array
        const participants = data.participants || [];
        return participants.some(
          (p: { oduserId?: string; odUserId?: string }) =>
            p.oduserId === currentUser.uid || p.odUserId === currentUser.uid
        );
      });

      // 4. Combine and sort by scheduledTime (most recent first)
      const allCompletedMatches = [...completedHostedMatches, ...participatedMatches].sort(
        (a, b) => {
          const timeA = a.data().scheduledTime?.toDate?.()?.getTime?.() || 0;
          const timeB = b.data().scheduledTime?.toDate?.()?.getTime?.() || 0;
          return timeB - timeA;
        }
      );

      console.log('🎾 [analyzeLastMatch] Found completed matches (번개 + 클럽):', {
        hosted: completedHostedMatches.length,
        participated: participatedMatches.length,
        total: allCompletedMatches.length,
      });

      if (allCompletedMatches.length === 0) {
        const message: ChatMessage = {
          id: generateMessageId(),
          content: t('aiChat.noRecentMatches'),
          sender: 'ai',
          timestamp: new Date(),
          language: currentLanguage,
          type: 'analysis',
        };
        setMessages(prev => [...prev, message]);
        return;
      }

      const lastMatchDoc = allCompletedMatches[0];
      const eventData = lastMatchDoc.data();

      // 🔄 Transform events data to match analyzeMatchPerformance() expected format
      // events 컬렉션 구조 → aiChatService 기대 구조 변환
      const isHost = eventData.hostId === currentUser.uid;
      const matchResult = eventData.matchResult || {};
      const scoreData = matchResult.score || eventData.score || {};

      // Determine winner from user's perspective
      let userWon = false;
      if (isHost) {
        userWon = matchResult.hostResult === 'win' || scoreData._winner === 'player1';
      } else {
        // Guest perspective: opposite of host result
        userWon = matchResult.hostResult === 'loss' || scoreData._winner === 'player2';
      }

      // Format score as readable string
      // Score structure: { sets: [{ player1Games: 6, player2Games: 4 }, ...] }
      const formatScore = (
        score: { sets?: Array<{ player1Games: number; player2Games: number }> } | null
      ) => {
        if (!score?.sets || !Array.isArray(score.sets) || score.sets.length === 0) {
          return currentLanguage === 'ko' ? '점수 정보 없음' : 'No score available';
        }
        return score.sets.map(set => `${set.player1Games}-${set.player2Games}`).join(', ');
      };

      // Determine event category: Lightning Match (public) vs Club Activity (club)
      // 🌐 Language-aware event category
      const isClubEvent = !!eventData.clubId;
      const eventCategory = isClubEvent
        ? currentLanguage === 'ko'
          ? '클럽 활동'
          : 'Club Activity'
        : currentLanguage === 'ko'
          ? '번개 매치'
          : 'Lightning Match';

      const transformedMatch = {
        id: lastMatchDoc.id,
        score: formatScore(scoreData),
        winner: userWon,
        duration: null, // events doesn't track duration
        statistics: null, // events doesn't have detailed statistics
        // Additional context for AI
        title: eventData.title,
        type: eventData.type,
        gameType: eventData.gameType,
        scheduledTime: eventData.scheduledTime?.toDate?.() || eventData.scheduledTime,
        // 🎯 Event category for distinction
        eventCategory, // '번개 매치' or '클럽 활동'
        clubId: eventData.clubId || null,
      };

      console.log('🎾 [analyzeLastMatch] Transformed match data:', transformedMatch);

      const analysis = await aiChatService.analyzeMatchPerformance(
        transformedMatch,
        currentLanguage
      );

      const analysisMessage: ChatMessage = {
        id: generateMessageId(),
        content: analysis,
        sender: 'ai',
        timestamp: new Date(),
        language: currentLanguage,
        type: 'analysis',
      };

      setMessages(prev => [...prev, analysisMessage]);
    } catch (err: unknown) {
      console.error('❌ Error analyzing match:', err);
      setError(i18n.t('contexts.aiChat.failedToAnalyzeMatch'));
    } finally {
      // 🔄 Hide loading indicator
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  // 🎾 Analyze a specific match (called from PastEventCard)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const analyzeSpecificMatch = async (eventData: any) => {
    // 🔄 Show loading indicator while analyzing
    setIsLoading(true);
    setIsTyping(true);

    try {
      if (!currentUser?.uid) {
        const message: ChatMessage = {
          id: generateMessageId(),
          content: t('aiChat.loginRequired'),
          sender: 'ai',
          timestamp: new Date(),
          language: currentLanguage,
          type: 'analysis',
        };
        setMessages(prev => [...prev, message]);
        return;
      }

      // 🔄 Transform event data to match analyzeMatchPerformance() expected format
      const isHost = eventData.hostId === currentUser.uid;
      const matchResult = eventData.matchResult || {};
      const scoreData = matchResult.score || eventData.score || {};

      // Determine winner from user's perspective
      let userWon = false;
      if (isHost) {
        userWon = matchResult.hostResult === 'win' || scoreData._winner === 'player1';
      } else {
        userWon = matchResult.hostResult === 'loss' || scoreData._winner === 'player2';
      }

      // Format score as readable string
      const formatScore = (
        score: { sets?: Array<{ player1Games: number; player2Games: number }> } | null
      ) => {
        if (!score?.sets || !Array.isArray(score.sets) || score.sets.length === 0) {
          return (
            matchResult.score?.finalScore ||
            (currentLanguage === 'ko' ? '점수 정보 없음' : 'No score available')
          );
        }
        return score.sets.map(set => `${set.player1Games}-${set.player2Games}`).join(', ');
      };

      // Determine event category
      // 🌐 Language-aware event category
      const isClubEvent = !!eventData.clubId;
      const eventCategory = isClubEvent
        ? currentLanguage === 'ko'
          ? '클럽 활동'
          : 'Club Activity'
        : currentLanguage === 'ko'
          ? '번개 매치'
          : 'Lightning Match';

      const transformedMatch = {
        id: eventData.id,
        score: formatScore(scoreData),
        winner: userWon,
        duration: null,
        statistics: null,
        title: eventData.title,
        type: eventData.type,
        gameType: eventData.gameType,
        scheduledTime: eventData.date || eventData.scheduledTime,
        eventCategory,
        clubId: eventData.clubId || null,
      };

      console.log('🎾 [analyzeSpecificMatch] Analyzing match:', transformedMatch);

      const analysis = await aiChatService.analyzeMatchPerformance(
        transformedMatch,
        currentLanguage
      );

      const analysisMessage: ChatMessage = {
        id: generateMessageId(),
        content: analysis,
        sender: 'ai',
        timestamp: new Date(),
        language: currentLanguage,
        type: 'analysis',
      };

      setMessages(prev => [...prev, analysisMessage]);
    } catch (err: unknown) {
      console.error('❌ Error analyzing specific match:', err);
      setError(i18n.t('contexts.aiChat.failedToAnalyzeMatch'));
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  // Get personalized advice
  const getPersonalizedAdvice = async (query: string) => {
    if (!currentUser) {
      const message: ChatMessage = {
        id: generateMessageId(),
        content: t('aiChat.loginRequired'),
        sender: 'ai',
        timestamp: new Date(),
        language: currentLanguage,
        type: 'advice',
      };

      setMessages(prev => [...prev, message]);
      return;
    }

    const userProfile = {
      skillLevel: currentUser.skillLevel,
      playingStyle: currentUser.playingStyle,
      recentMatches: currentUser.recentMatches,
      currentGoals: currentUser.goals,
    };

    const advice = await aiChatService.generatePersonalizedAdvice(
      userProfile,
      query,
      currentLanguage
    );

    const adviceMessage: ChatMessage = {
      id: generateMessageId(),
      content: advice,
      sender: 'ai',
      timestamp: new Date(),
      language: currentLanguage,
      type: 'advice',
    };

    setMessages(prev => [...prev, adviceMessage]);
  };

  // Quick actions based on language
  const quickActions: QuickAction[] = [
    {
      id: 'contact_admin',
      titleKey: 'ai.quickActions.contactAdmin',
      iconName: 'headset',
      action: () => contactAdmin(),
    },
    {
      id: 'analyze_match',
      titleKey: 'ai.quickActions.analyzeMatch',
      iconName: 'chart-bar', // MaterialCommunityIcons
      action: () => analyzeLastMatch(),
    },
  ];

  // Execute quick action
  const executeQuickAction = (actionId: string) => {
    const action = quickActions.find(a => a.id === actionId);
    if (action) {
      action.action();
    }
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
    aiChatService.clearConversation();
    setError(null);
  };

  // Clear unread admin responses count
  const clearUnreadAdminResponses = () => {
    setUnreadAdminResponseCount(0);
  };

  // Save conversation (placeholder for future implementation)
  const saveConversation = async () => {
    try {
      // TODO: Save to Firebase
      const history = aiChatService.getConversationHistory();
      setConversationHistory(history);
      console.log('✅ Conversation saved');
    } catch (err: unknown) {
      console.error('❌ Error saving conversation:', err);
    }
  };

  // Load conversation (placeholder for future implementation)
  const loadConversation = async () => {
    try {
      // TODO: Load from Firebase
      console.log('✅ Conversation loaded');
    } catch (err: unknown) {
      console.error('❌ Error loading conversation:', err);
    }
  };

  // Welcome message when chat starts or language changes
  useEffect(() => {
    if (!currentUser) return;

    // Use functional update to avoid infinite loops and ensure latest state
    setMessages(prevMessages => {
      // Check if we need to update welcome message:
      // 1. No messages yet, OR
      // 2. First message is AI welcome and language differs (or language field missing)
      const firstMessage = prevMessages[0];
      const needsWelcomeMessage =
        prevMessages.length === 0 ||
        (firstMessage?.sender === 'ai' &&
          firstMessage?.type === 'message' &&
          (!firstMessage?.language || firstMessage.language !== currentLanguage));

      if (!needsWelcomeMessage) return prevMessages;

      const newWelcomeMessage: ChatMessage = {
        id: generateMessageId(),
        content: t('aiChat.welcome'),
        sender: 'ai',
        timestamp: new Date(),
        language: currentLanguage,
        type: 'message',
      };

      if (prevMessages.length === 0) {
        return [newWelcomeMessage];
      }
      // Replace first message (AI welcome), keep rest of conversation
      return [newWelcomeMessage, ...prevMessages.slice(1)];
    });
  }, [currentUser, currentLanguage, t]);

  // Subscribe to admin feedback responses
  useEffect(() => {
    if (!currentUser?.uid) return;

    console.log(
      '🔔 [AiChatContext] Subscribing to admin feedback responses for user:',
      currentUser.uid
    );

    // Query all user's feedback (not just those with respondedAt)
    // We'll filter for adminResponse in the callback
    const feedbackQuery = query(
      collection(db, 'user_feedback'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      feedbackQuery,
      snapshot => {
        console.log(
          '📥 [AiChatContext] Received feedback snapshot, changes:',
          snapshot.docChanges().length
        );

        snapshot.docChanges().forEach(change => {
          const feedbackData = change.doc.data();
          const feedbackId = change.doc.id;

          // Parse conversation array - includes both admin and user messages
          const conversation = feedbackData.conversation || [];

          console.log(`📋 [AiChatContext] Processing feedback ${feedbackId}:`, {
            type: change.type,
            hasAdminResponse: !!feedbackData.adminResponse,
            conversationLength: conversation.length,
            title: feedbackData.title,
          });

          // First, show the original question if it exists and hasn't been displayed
          if (feedbackData.description) {
            const originalQuestionKey = `original-question-${feedbackId}`;

            if (!displayedAdminResponses.has(originalQuestionKey)) {
              console.log(`📝 [AiChatContext] Adding original question for feedback ${feedbackId}`);

              setDisplayedAdminResponses(prev => new Set([...prev, originalQuestionKey]));

              const originalQuestionMessage: ChatMessage = {
                id: `original-question-${feedbackId}`,
                content: t('aiChat.originalQuestion', {
                  question: feedbackData.description,
                }),
                sender: 'user',
                timestamp: feedbackData.createdAt?.toDate?.() || new Date(),
                language: currentLanguage,
                type: 'message',
              };

              setMessages(prev => [...prev, originalQuestionMessage]);
            }
          }

          // Process ALL messages from conversation array (admin + user)
          conversation.forEach(
            (
              msg: { sender: string; message: string; timestamp: { toDate?: () => Date } },
              index: number
            ) => {
              // Create unique key for this specific message
              const timestamp = msg.timestamp?.toDate?.() || new Date();
              const messageKey = `conv-${feedbackId}-${index}`;

              // Check if this specific message has already been displayed
              if (displayedAdminResponses.has(messageKey)) {
                return;
              }

              console.log(`✅ [AiChatContext] New ${msg.sender} message detected:`, messageKey);

              // Mark as displayed
              setDisplayedAdminResponses(prev => new Set([...prev, messageKey]));

              if (msg.sender === 'admin') {
                // Admin message - show as system message with reply button
                const systemMessage: ChatMessage = {
                  id: `admin-response-${feedbackId}-${index}`,
                  content: t('aiChat.adminResponse', {
                    response: msg.message,
                    title: feedbackData.title,
                  }),
                  sender: 'system',
                  timestamp: timestamp,
                  language: currentLanguage,
                  type: 'message',
                };

                setMessages(prev => [...prev, systemMessage]);
                setUnreadAdminResponseCount(prev => prev + 1);
              } else {
                // User message - show as user's own message
                const userMessage: ChatMessage = {
                  id: `user-reply-${feedbackId}-${index}`,
                  content: t('aiChat.userReply', {
                    message: msg.message,
                    title: feedbackData.title,
                  }),
                  sender: 'user',
                  timestamp: timestamp,
                  language: currentLanguage,
                  type: 'message',
                };

                setMessages(prev => [...prev, userMessage]);
              }
            }
          );

          // Fallback: Handle legacy adminResponse field (if no conversation array)
          if (conversation.length === 0 && feedbackData.adminResponse) {
            const legacyKey = `admin-legacy-${feedbackId}`;

            if (displayedAdminResponses.has(legacyKey)) {
              return;
            }

            console.log('✅ [AiChatContext] Legacy admin response detected:', feedbackId);

            setDisplayedAdminResponses(prev => new Set([...prev, legacyKey]));

            const systemMessage: ChatMessage = {
              id: `admin-response-${feedbackId}`,
              content: t('aiChat.adminResponse', {
                response: feedbackData.adminResponse,
                title: feedbackData.title,
              }),
              sender: 'system',
              timestamp: new Date(),
              language: currentLanguage,
              type: 'message',
            };

            setMessages(prev => [...prev, systemMessage]);
            setUnreadAdminResponseCount(prev => prev + 1);

            console.log('✅ [AiChatContext] System message added for legacy admin response');
          }
        });
      },
      error => {
        console.error('❌ [AiChatContext] Error subscribing to feedback:', error);
      }
    );

    return () => {
      console.log('🔔 [AiChatContext] Unsubscribing from admin feedback responses');
      unsubscribe();
    };
  }, [currentUser?.uid, currentLanguage, displayedAdminResponses]);

  const value: AIChatContextType = {
    // State
    messages,
    isLoading,
    error,
    isTyping,
    unreadAdminResponseCount,
    isWaitingForAdminFeedback,

    // Actions
    sendMessage,
    clearChat,
    contactAdmin,
    analyzeLastMatch,
    analyzeSpecificMatch, // 🎾 특정 경기 분석
    getPersonalizedAdvice,
    clearUnreadAdminResponses,

    // Quick Actions
    quickActions,
    executeQuickAction,

    // Conversation Management
    conversationHistory,
    saveConversation,
    loadConversation,
  };

  return <AIChatContext.Provider value={value}>{children}</AIChatContext.Provider>;
};
