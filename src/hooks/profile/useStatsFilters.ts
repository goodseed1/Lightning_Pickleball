import { useState } from 'react';
import { MainScope, ClubFilter } from '../../types/stats';
import { MatchTypeValue } from '../../components/stats/MatchTypeSelector';

export const useStatsFilters = () => {
  // 🆕 [THOR] New unified stats architecture
  const [mainScope, setMainScope] = useState<MainScope>('public');
  const [clubFilter, setClubFilter] = useState<ClubFilter>('all');
  const [matchTypeFilter, setMatchTypeFilter] = useState<MatchTypeValue>('all');

  return {
    mainScope,
    setMainScope,
    clubFilter,
    setClubFilter,
    matchTypeFilter,
    setMatchTypeFilter,
  };
};
