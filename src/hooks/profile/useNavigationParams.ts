import { useState, useEffect } from 'react';
import { MainTabType } from '../../components/profile/ProfileTabNavigation';

export const useNavigationParams = (initialTab?: MainTabType) => {
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('activity');

  // Handle navigation parameters - set initial tab
  useEffect(() => {
    if (initialTab) {
      setActiveMainTab(initialTab);
    }
  }, [initialTab]);

  return { activeMainTab, setActiveMainTab };
};
