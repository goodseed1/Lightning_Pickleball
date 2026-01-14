/**
 * FeedContext - 피드 데이터 사령부
 * Centralized feed data management for the entire app
 * 사용자의 개인화된 피드를 실시간으로 관리하는 중앙 집중식 Context
 */

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useClub } from './ClubContext';
import { listenToFeed, getFeedItems } from '../services/feedService';
import { ActivityFeedItem } from '../types/social';
import i18n from '../i18n';

interface FeedContextType {
  feedItems: ActivityFeedItem[];
  isLoadingFeed: boolean;
  refreshFeed: () => Promise<void>;
  error: string | null;
}

const FeedContext = createContext<FeedContextType>({
  feedItems: [],
  isLoadingFeed: true,
  refreshFeed: async () => {},
  error: null,
});

interface FeedProviderProps {
  children: ReactNode;
}

export const FeedProvider: React.FC<FeedProviderProps> = ({ children }) => {
  const { currentUser: user } = useAuth();
  const { userClubs } = useClub();
  const [feedItems, setFeedItems] = useState<ActivityFeedItem[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 피드 데이터 새로고침 함수
  const refreshFeed = async () => {
    if (!user?.uid) return;

    try {
      setIsLoadingFeed(true);
      setError(null);

      // 사용자의 클럽 ID 목록 준비 (향후 클럽별 필터링 기능 추가 예정)
      // const myClubIds = userClubs?.map(club => club.id) || [];

      // 피드 데이터 가져오기
      const items = await getFeedItems(user.uid, {
        limitTo: 50,
      });

      setFeedItems(items);
    } catch (err) {
      console.error('❌ Error refreshing feed:', err);
      setError(err instanceof Error ? err.message : i18n.t('contexts.feed.refreshFailed'));
    } finally {
      setIsLoadingFeed(false);
    }
  };

  // 실시간 피드 구독 설정
  useEffect(() => {
    if (!user?.uid) {
      setFeedItems([]);
      setIsLoadingFeed(false);
      return;
    }

    // 클럽 데이터가 로드되지 않았다면 대기
    if (userClubs === null) {
      return;
    }

    console.log('🔄 Setting up feed subscription for user:', user.uid);
    setIsLoadingFeed(true);
    setError(null);

    try {
      // 사용자의 클럽 ID 목록 (향후 클럽별 필터링 기능 추가 예정)
      // const myClubIds = userClubs.map(club => club.id);

      // 실시간 피드 구독
      const unsubscribe = listenToFeed(user.uid, items => {
        console.log('📡 Feed items updated:', items.length, 'items');
        setFeedItems(items);
        setIsLoadingFeed(false);
        setError(null);
      });

      return () => {
        console.log('🔌 Unsubscribing from feed');
        unsubscribe();
      };
    } catch (err) {
      // 🔇 로그아웃 시 permission-denied 에러는 예상된 동작이므로 조용히 처리
      const firebaseError = err as { code?: string };
      if (firebaseError?.code === 'permission-denied') {
        console.log('🔒 Feed subscription ended (user signed out)');
      } else {
        console.error('❌ Error setting up feed subscription:', err);
        setError(err instanceof Error ? err.message : i18n.t('contexts.feed.subscriptionFailed'));
      }
      setIsLoadingFeed(false);
    }
  }, [user?.uid, userClubs]);

  // 사용자가 로그아웃했을 때 피드 데이터 정리
  useEffect(() => {
    if (!user) {
      setFeedItems([]);
      setIsLoadingFeed(false);
      setError(null);
    }
  }, [user]);

  const value: FeedContextType = {
    feedItems,
    isLoadingFeed,
    refreshFeed,
    error,
  };

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
};

// Hook to use the FeedContext
// eslint-disable-next-line react-refresh/only-export-components
export const useFeed = () => {
  const context = React.useContext(FeedContext);
  if (!context) {
    throw new Error('useFeed must be used within a FeedProvider');
  }
  return context;
};

export default FeedContext;
