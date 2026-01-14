import { useContext } from 'react';
import DiscoveryContext from '../contexts/DiscoveryContext';

/**
 * Discovery 데이터에 접근하는 커스텀 훅
 * 앱 전체에서 탐색 데이터와 필터 상태를 일관되게 관리할 수 있습니다.
 */
export const useDiscovery = () => {
  const context = useContext(DiscoveryContext);

  if (!context) {
    throw new Error('useDiscovery must be used within a DiscoveryProvider');
  }

  return context;
};
