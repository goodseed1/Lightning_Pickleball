# LeagueDetailScreen - Korean Strings to Convert to i18n

## Summary

**Total Korean Strings Found:** ~90 unique strings across 11 categories

## Categorized List of Strings to Convert

### 1. Tab Labels (4 strings)

- Line ~2048: `경기` → `t('leagueDetail.tabs.matches')`
- Line ~2073: `참가자` → `t('leagueDetail.tabs.participants')`
- Line ~2093: `순위` → `t('leagueDetail.tabs.standings')`
- Line ~2120: `관리` → `t('leagueDetail.tabs.management')`

### 2. Empty States (5 strings)

- Line ~946: `아직 경기가 없습니다` → `t('leagueDetail.emptyStates.noMatches')`
- Line ~1715: `순위표가 없습니다` → `t('leagueDetail.emptyStates.noStandings')`
- Line ~1718: `경기가 진행되면 순위표가 표시됩니다.` → `t('leagueDetail.emptyStates.noStandingsDescription')`
- Line ~2394, ~2686: `아직 참가 신청자가 없습니다` → `t('leagueDetail.emptyStates.noParticipants')`
- Line ~2397: `참가자가 신청하면 실시간으로 여기에 표시됩니다` → `t('leagueDetail.emptyStates.noParticipantsDescription')`

### 3. Loading States (3 strings)

- Line ~1984: `리그 정보를 불러오는 중...` → `t('leagueDetail.loading.league')`
- Line ~3268: `대진표 생성 중...` → `t('leagueDetail.loading.generatingBracket')`
- Line ~3269: `리그가 곧 시작됩니다` → `t('leagueDetail.loading.generatingBracketSubtitle')`

### 4. Errors (1 string)

- Line ~1994: `리그를 찾을 수 없습니다` → `t('leagueDetail.errors.leagueNotFound')`

### 5. Standings Table Headers (9 strings)

- Line ~1734: `순위` → `t('leagueDetail.standings.rank')`
- Line ~1739: `선수` → `t('leagueDetail.standings.player')`
- Line ~1747: `경기` → `t('leagueDetail.standings.matches')`
- Line ~1755: `승` → `t('leagueDetail.standings.wins')`
- Line ~1763: `패` → `t('leagueDetail.standings.losses')`
- Line ~1771: `승점` → `t('leagueDetail.standings.points')`
- Line ~1955: `플레이오프 순위` → `t('leagueDetail.standings.playoffTitle')`
- Line ~1942: `label: '3위'` → `label: t('leagueDetail.standings.thirdPlace')`
- Line ~1948: `label: '4위'` → `label: t('leagueDetail.standings.fourthPlace')`

### 6. Admin Dashboard (13 strings)

- Line ~2817: `관리자 대시보드` → `t('leagueDetail.adminDashboard.title')`
- Line ~2820: `리그 시작 전 참가자 관리 및 설정` → `t('leagueDetail.adminDashboard.description')`
- Line ~2828, ~2291: `참가자 현황` → `t('leagueDetail.adminDashboard.participantsTitle')`
- Line ~2836, ~2300: `승인됨` → `t('leagueDetail.adminDashboard.approved')`
- Line ~2310: `대기중` → `t('leagueDetail.adminDashboard.pending')`
- Line ~2320, ~2844: `최대인원` → `t('leagueDetail.adminDashboard.maxParticipants')`
- Line ~2450: `충원율` → `t('leagueDetail.adminDashboard.fillRate')`
- Line ~2858: `경기 진행률` → `t('leagueDetail.adminDashboard.matchProgress')`
- Line ~2874: `신청이 완료되었으니 마감하실 준비가 되었습니다.` → `t('leagueDetail.adminDashboard.fullCapacityNotice')`
- Line ~2904: `참가자 직접 추가` → `t('leagueDetail.adminDashboard.addParticipantButton')`
- Line ~2330, ~2913: `참가자 목록` → `t('leagueDetail.adminDashboard.participantListTitle')`
- Line ~2369, ~2949: `승인팀` → `t('leagueDetail.adminDashboard.approvedTeam')`

### 7. League Management (8 strings)

- Line ~2988: `리그 관리` → `t('leagueDetail.leagueManagement.title')`
- Line ~3016: `대진표 생성 및 리그 시작` → `t('leagueDetail.leagueManagement.generateBracketButton')`
- Line ~3105: `브래킷 삭제` → `t('leagueDetail.leagueManagement.deleteBracketButton')`
- Line ~3091: `브래킷 삭제` (Title) → `t('leagueDetail.leagueManagement.deleteBracketTitle')`
- Line ~3093: `모든 경기를 삭제하고 리그를 초기화합니다. 이 작업은 되돌릴 수 없습니다.` → `t('leagueDetail.leagueManagement.deleteBracketDescription')`
- Line ~3115: `위험 구역` → `t('leagueDetail.leagueManagement.dangerZoneTitle')`
- Line ~3118: `리그 삭제` → `t('leagueDetail.leagueManagement.deleteLeagueButton')`
- Lines ~3030-3031: Minimum participants warnings (with variables)

### 8. Playoffs (9 strings)

- Line ~2150: `플레이오프 진행 중` → `t('leagueDetail.playoffs.inProgress')`
- Line ~2153: `대회 형식:` → `t('leagueDetail.playoffs.format')`
- Line ~2181: `우승자: ` → `t('leagueDetail.playoffs.winner')`
- Line ~2189: `탭하여 대진표 보기` → `t('leagueDetail.playoffs.tapHint')`
- Line ~2204: `정규 시즌 완료!` → `t('leagueDetail.playoffs.seasonComplete')`
- Line ~2206: `모든 경기가 끝났습니다...` → `t('leagueDetail.playoffs.seasonCompleteDescription')`
- Line ~2218: `플레이오프 시작하기` → `t('leagueDetail.playoffs.startButton')`
- Line ~2757: `플레이오프 대진표` → `t('leagueDetail.playoffs.bracketToggle')`
- Line ~2740: `순위표` → `t('leagueDetail.playoffs.standingsToggle')`

### 9. Match Approval (3 strings)

- Line ~2233: `승인 대기 중인 경기 ({{count}}개)` → `t('leagueDetail.matchApproval.pendingTitle', { count: ... })`
- Line ~2237: `제출된 모든 경기 결과를 한번에 승인할 수 있습니다.` → `t('leagueDetail.matchApproval.pendingDescription')`
- Line ~2248: `모든 결과 승인` → `t('leagueDetail.matchApproval.approveAllButton')`

### 10. Round Robin (2 strings)

- Line ~3048: `라운드 로빈 진행 중` → `t('leagueDetail.roundRobin.inProgress')`
- Line ~3076: `모든 참가자가 서로 한 번씩...` → `t('leagueDetail.roundRobin.description')`

### 11. Dialogs (13 strings)

- Line ~3146: `경기 일정 변경` → `t('leagueDetail.dialogs.rescheduleTitle')`
- Line ~3167: `취소` → `t('common.cancel')` (already exists)
- Line ~3169: `변경` → Keep as is (generic)
- Line ~3176: `기권 처리` → `t('leagueDetail.dialogs.walkoverTitle')`
- Line ~3178: `어느 선수를 기권 처리하시겠습니까?` → `t('leagueDetail.dialogs.walkoverQuestion')`
- Line ~3220: `취소` → `t('common.cancel')`
- Line ~3226: `기권 처리` (button) → Same as title
- Line ~3236: `일괄 경기 결과 승인` → `t('leagueDetail.dialogs.bulkApprovalTitle')`
- Line ~3241-3242: Bulk approval message (with count variable)
- Line ~3245: `승인된 결과는 순위표에 반영되며...` → `t('leagueDetail.dialogs.bulkApprovalWarning')`
- Line ~3254: `취소` → `t('common.cancel')`
- Line ~3257: `모두 승인` → `t('leagueDetail.dialogs.approveAll')`
- Lines 1022-1023, 1068, 1122-1123: Alert dialog messages (with variables)

## Special Cases with Variables

### Minimum Participants Warning

```tsx
// Doubles
`복식 리그는 최소 2팀 (4명)이 필요합니다. 현재: ${participantCount}명`;
// Replace with:
t('leagueDetail.leagueManagement.minParticipantsDoubles', { count: participantCount })
// Singles
`리그 시작을 위해 최소 2명의 참가자가 필요합니다. 현재: ${participantCount}명`;
// Replace with:
t('leagueDetail.leagueManagement.minParticipantsSingles', { count: participantCount });
```

### Alert Dialog Messages

```tsx
// Generate Bracket
Alert.alert('대진표 생성', `${league.name}의 대진표를 생성하시겠습니까?\n\n...`);
// Replace with:
Alert.alert(
  t('leagueDetail.generateBracket'),
  t('leagueDetail.dialogs.generateBracketConfirm', { leagueName: league.name })
);
```

## DO NOT Convert

- Comments (lines starting with `//`)
- Console.log Korean text (for debugging)
- Variable names containing Korean characters
- Already converted strings using `t()`

## Verification

After conversion, verify:

1. ✅ `npx tsc --noEmit` passes
2. ✅ `npm run lint` passes
3. ✅ App runs without errors
4. ✅ All text displays correctly in Korean
5. ✅ All text displays correctly in English (switch language)
