import { useContext } from 'react';
import FeedContext from '../contexts/FeedContext';

/**
 * Feed 데이터에 접근하는 커스텀 훅
 * 앱 전체에서 피드 상태를 일관되게 관리할 수 있습니다.
 */
export const useFeed = () => {
  const context = useContext(FeedContext);

  if (!context) {
    throw new Error('useFeed must be used within a FeedProvider');
  }

  return context;
};
