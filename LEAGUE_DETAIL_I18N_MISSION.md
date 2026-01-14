# Mission: Convert LeagueDetailScreen to i18n

## Objective

Convert all hardcoded Korean text in `src/screens/LeagueDetailScreen.tsx` to use translation keys from `t('leagueDetail.*')`.

## Context

- File: `src/screens/LeagueDetailScreen.tsx` (3000+ lines)
- Translation keys have been added to `src/locales/ko.json` and `src/locales/en.json`
- `useLanguage` hook with `t()` function is already imported (line 104)

## Translation Key Structure

All keys are under `leagueDetail.*`:

### 1. Tabs

- `tabs.matches` - "경기"
- `tabs.participants` - "참가자"
- `tabs.standings` - "순위"
- `tabs.management` - "관리"

### 2. Empty States

- `emptyStates.noMatches` - "아직 경기가 없습니다"
- `emptyStates.noStandings` - "순위표가 없습니다"
- `emptyStates.noStandingsDescription` - "경기가 진행되면 순위표가 표시됩니다."
- `emptyStates.noParticipants` - "아직 참가 신청자가 없습니다"
- `emptyStates.noParticipantsDescription` - "참가자가 신청하면 실시간으로 여기에 표시됩니다"

### 3. Loading States

- `loading.league` - "리그 정보를 불러오는 중..."
- `loading.generatingBracket` - "대진표 생성 중..."
- `loading.generatingBracketSubtitle` - "리그가 곧 시작됩니다"

### 4. Errors

- `errors.leagueNotFound` - "리그를 찾을 수 없습니다"

### 5. Standings Table Headers

- `standings.rank` - "순위"
- `standings.player` - "선수"
- `standings.matches` - "경기"
- `standings.wins` - "승"
- `standings.losses` - "패"
- `standings.points` - "승점"
- `standings.playoffTitle` - "플레이오프 순위"
- `standings.thirdPlace` - "3위"
- `standings.fourthPlace` - "4위"

### 6. Admin Dashboard

- `adminDashboard.title` - "관리자 대시보드"
- `adminDashboard.description` - "리그 시작 전 참가자 관리 및 설정"
- `adminDashboard.participantsTitle` - "참가자 현황"
- `adminDashboard.participantsTeamTitle` - "참가팀 현황"
- `adminDashboard.approved` - "승인됨"
- `adminDashboard.pending` - "대기중"
- `adminDashboard.maxParticipants` - "최대인원"
- `adminDashboard.maxTeams` - "최대팀"
- `adminDashboard.fillRate` - "충원율"
- `adminDashboard.matchProgress` - "경기 진행률"
- `adminDashboard.fullCapacityNotice` - "신청이 완료되었으니 마감하실 준비가 되었습니다."
- `adminDashboard.addParticipantButton` - "참가자 직접 추가"
- `adminDashboard.participantListTitle` - "참가자 목록"
- `adminDashboard.approvedTeam` - "승인팀"

### 7. League Management

- `leagueManagement.title` - "리그 관리"
- `leagueManagement.generateBracketButton` - "대진표 생성 및 리그 시작"
- `leagueManagement.deleteBracketButton` - "브래킷 삭제"
- `leagueManagement.deleteBracketTitle` - "브래킷 삭제"
- `leagueManagement.deleteBracketDescription` - "모든 경기를 삭제하고 리그를 초기화합니다. 이 작업은 되돌릴 수 없습니다."
- `leagueManagement.dangerZoneTitle` - "위험 구역"
- `leagueManagement.deleteLeagueButton` - "리그 삭제"
- `leagueManagement.minParticipantsDoubles` - "복식 리그는 최소 2팀 (4명)이 필요합니다. 현재: {{count}}명"
- `leagueManagement.minParticipantsSingles` - "리그 시작을 위해 최소 2명의 참가자가 필요합니다. 현재: {{count}}명"

### 8. Playoffs

- `playoffs.inProgress` - "플레이오프 진행 중"
- `playoffs.format` - "대회 형식:"
- `playoffs.winner` - "우승자: "
- `playoffs.tapHint` - "탭하여 대진표 보기"
- `playoffs.seasonComplete` - "정규 시즌 완료!"
- `playoffs.seasonCompleteDescription` - "모든 경기가 끝났습니다. 플레이오프를 시작하여 최종 우승자를 결정하세요."
- `playoffs.startButton` - "플레이오프 시작하기"
- `playoffs.bracketToggle` - "플레이오프 대진표"
- `playoffs.standingsToggle` - "순위표"

### 9. Match Approval

- `matchApproval.pendingTitle` - "승인 대기 중인 경기 ({{count}}개)"
- `matchApproval.pendingDescription` - "제출된 모든 경기 결과를 한번에 승인할 수 있습니다."
- `matchApproval.approveAllButton` - "모든 결과 승인"

### 10. Round Robin

- `roundRobin.inProgress` - "라운드 로빈 진행 중"
- `roundRobin.description` - "모든 참가자가 서로 한 번씩 경기해야 플레이오프를 시작할 수 있습니다."

### 11. Dialogs

- `dialogs.rescheduleTitle` - "경기 일정 변경"
- `dialogs.walkoverTitle` - "기권 처리"
- `dialogs.walkoverQuestion` - "어느 선수를 기권 처리하시겠습니까?"
- `dialogs.bulkApprovalTitle` - "일괄 경기 결과 승인"
- `dialogs.bulkApprovalMessage` - "{{count}}개의 승인 대기 중인 경기 결과를 모두 승인하시겠습니까?"
- `dialogs.bulkApprovalWarning` - "승인된 결과는 순위표에 반영되며, 되돌릴 수 없습니다."
- `dialogs.approveAll` - "모두 승인"
- `dialogs.deleteBracketTitle` - "⚠️ 브래킷 삭제"
- `dialogs.deleteBracketConfirm` - "{{leagueName}}의 모든 경기를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 리그가 참가 신청 상태로 초기화됩니다."
- `dialogs.generateBracketConfirm` - "{{leagueName}}의 대진표를 생성하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 리그가 시작됩니다."
- `dialogs.startPlayoffsConfirm` - "모든 정규 시즌 경기가 완료되었습니다.\n\n{{leagueName}}의 플레이오프를 시작하시겠습니까?"
- `dialogs.deleteLeagueTitle` - "⚠️ 리그 삭제"
- `dialogs.deleteLeagueConfirm` - "정말로 \"{{leagueName}}\" 리그를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 모든 경기 데이터와 참가자 정보가 삭제됩니다."

## Instructions

1. **Search for all Korean text patterns** using the grep output provided
2. **Replace each Korean string** with the corresponding `t('leagueDetail.*')` call
3. **Handle parameterized strings** using `t('key', { variable: value })` format
4. **Preserve all existing translation keys** that are already in the file (e.g., already using `t()`)
5. **DO NOT modify**:
   - Comments in Korean (lines with `//`)
   - Console.log statements
   - Variable names
   - Import statements
6. **Test the changes** by running `npm run lint` and `npx tsc --noEmit`

## Example Replacements

### Simple Text

```tsx
// Before
<Text>경기</Text>

// After
<Text>{t('leagueDetail.tabs.matches')}</Text>
```

### With Variables

```tsx
// Before
`복식 리그는 최소 2팀 (4명)이 필요합니다. 현재: ${participantCount}명`;

// After
t('leagueDetail.leagueManagement.minParticipantsDoubles', { count: participantCount });
```

### Dialog Messages

```tsx
// Before
Alert.alert(
  '⚠️ 브래킷 삭제',
  `${league.name}의 모든 경기를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 리그가 참가 신청 상태로 초기화됩니다.`,
  ...
)

// After
Alert.alert(
  t('leagueDetail.dialogs.deleteBracketTitle'),
  t('leagueDetail.dialogs.deleteBracketConfirm', { leagueName: league.name }),
  ...
)
```

## Success Criteria

- ✅ All Korean strings converted to translation keys
- ✅ File compiles without TypeScript errors (`npx tsc --noEmit`)
- ✅ No linting errors (`npm run lint`)
- ✅ All translations work correctly in both Korean and English

## Korean Strings to Convert

See the grep output in the main conversation for the complete list of Korean strings found in the file.
