# 🏆 Lightning Pickleball 클럽 리그 & 토너먼트 시스템 설계

## 🎯 개요

Lightning Pickleball의 **클럽 리그 & 토너먼트 시스템**은 피클볼 클럽들이 체계적인 경쟁 시스템을 운영할 수 있도록 설계되었습니다. 정기적인 리그전과 토너먼트를 통해 클럽 회원들의 실력 향상과 친목 도모를 동시에 추구합니다.

## 🏅 리그 시스템 (League System)

### 핵심 특징

1. **다양한 리그 형식**
   - Round Robin (풀리그): 모든 참가자가 서로 경기
   - Single Group: 단일 그룹 리그
   - Multiple Groups: 다중 그룹 (조별 리그)
   - Ladder System: 래더 시스템
   - Pyramid System: 피라미드 시스템

2. **유연한 점수 시스템**
   - Standard: 승리 3점, 무승부 1점, 패배 0점
   - Pickleball: 승리 2점, 패배 0점 (무승부 없음)
   - Custom: 사용자 정의 점수 체계

3. **자동 순위 계산**
   - 실시간 순위표 업데이트
   - 다단계 타이브레이크 규칙
   - 게임/세트 득실차 자동 계산

### Firestore 데이터 구조: `leagues` 컬렉션

```typescript
{
  id: string,                      // 자동 생성 ID
  clubId: string,                  // 클럽 ID
  seasonName: string,              // "2025 Spring League"
  seasonNumber?: number,           // 시즌 번호 (예: 5)

  // 기본 정보
  title: string,                   // "Metro Atlanta Pickleball League"
  description?: string,            // 리그 설명
  bannerImage?: string,            // 배너 이미지 URL

  // 리그 설정
  settings: {
    format: 'round_robin',         // 리그 형식
    scoringSystem: 'pickleball',       // 점수 시스템
    pointsForWin: 2,              // 승리 점수
    pointsForLoss: 0,             // 패배 점수

    // 일정 설정
    matchesPerWeek?: 2,           // 주당 경기 수
    preferredDays?: [3, 6],       // 선호 요일 (수, 토)
    preferredTimeSlots?: ["19:00-21:00"],

    // 참가 조건
    minParticipants: 6,           // 최소 참가자
    maxParticipants: 16,          // 최대 참가자
    skillLevelRange?: {
      min: "3.0",
      max: "4.5"
    },

    // 타이브레이크 규칙 (번개 피클볼 공식 규정 v1.0)
    tiebreakRules: [
      { order: 1, type: 'head_to_head', description: '동점자 간 승자승 원칙' },
      { order: 2, type: 'set_win_rate', description: '세트 득실률 (이긴 세트 / 총 세트)' },
      { order: 3, type: 'game_win_rate', description: '게임 득실률 (이긴 게임 / 총 게임)' },
      { order: 4, type: 'registration_order', description: '먼저 등록한 선수 우선' }
    ],

    allowPostponements: true,
    maxPostponements: 2,
    defaultMatchDuration: 120     // 분
  },

  // 참가자 및 순위표
  participants: ["userId1", "userId2", ...],

  standings: [
    {
      playerId: "userId1",
      playerName: "John Doe",
      position: 1,                 // 현재 순위

      // 경기 기록
      played: 10,                  // 경기 수
      won: 7,                      // 승리
      drawn: 1,                    // 무승부
      lost: 2,                     // 패배

      // 게임/세트 기록
      gamesWon: 84,
      gamesLost: 48,
      gameDifference: 36,
      setsWon: 15,
      setsLost: 5,
      setDifference: 10,

      // 포인트
      points: 15,                  // 총 승점

      // 추가 통계
      form: ["W", "W", "L", "W", "D"], // 최근 5경기
      streak: {
        type: 'win',
        count: 2
      },

      lastUpdated: Timestamp
    }
  ],

  // 일정
  startDate: Timestamp,
  endDate: Timestamp,
  registrationDeadline: Timestamp,

  // 상태
  status: 'in_progress',           // 리그 상태
  currentRound: 5,                 // 현재 라운드
  totalRounds: 11,                 // 총 라운드

  // 우승자 정보
  champion?: {
    playerId: "userId1",
    playerName: "John Doe",
    finalPoints: 30,
    finalRecord: "10W-2D-1L"
  },

  // 상금/보상
  prizes?: {
    champion: {
      type: 'trophy',
      description: 'Champion Trophy + $500',
      value: 500,
      currency: 'USD'
    },
    runnerUp: {
      type: 'gift',
      description: 'Pickleball Equipment Package',
      value: 200
    }
  },

  // 참가비
  entryFee?: {
    amount: 50,
    currency: 'USD',
    deadline: Timestamp
  },

  // 메타데이터
  createdBy: "adminUserId",
  createdAt: Timestamp,
  updatedAt: Timestamp,

  // 통계
  stats?: {
    totalMatches: 55,
    completedMatches: 45,
    averageMatchDuration: 95,
    mostWins: {
      playerId: "userId1",
      count: 10
    }
  }
}
```

### 리그 경기 관리: `leagueMatches` 컬렉션

```typescript
{
  id: string,
  leagueId: string,
  round: 5,                        // 라운드 번호

  // 참가자
  player1Id: "userId1",
  player2Id: "userId2",
  player1Name: "John Doe",         // 스냅샷
  player2Name: "Jane Smith",       // 스냅샷

  // 일정
  scheduledDate?: Timestamp,
  actualDate?: Timestamp,
  court?: "Court 1",

  // 결과
  status: 'completed',             // 경기 상태
  winner: "userId1",               // 승자 ID
  score: {
    sets: [
      { player1Games: 6, player2Games: 4 },
      { player1Games: 7, player2Games: 5 }
    ],
    finalScore: "6-4, 7-5",
    duration: 95                   // 분
  },

  // 메타데이터
  createdAt: Timestamp,
  updatedAt: Timestamp,
  notes?: "Great match!",
  referee?: "refereeUserId"
}
```

## 🏆 토너먼트 시스템 (Tournament System)

### 핵심 특징

1. **다양한 토너먼트 형식**
   - Single Elimination: 싱글 엘리미네이션
   - Double Elimination: 더블 엘리미네이션
   - Round Robin: 라운드 로빈
   - Swiss System: 스위스 시스템
   - Group + Knockout: 조별 예선 + 토너먼트

2. **자동 대진표 생성**
   - 시드 기반 대진표
   - 부전승 자동 처리
   - 다음 라운드 자동 진출

3. **유연한 경기 형식**
   - Best of 1/3/5 세트
   - 단축 세트 (4게임)
   - 타이브레이크만
   - 노애드 스코어링

### Firestore 데이터 구조: `tournaments` 컬렉션

```typescript
{
  id: string,
  clubId: string,
  tournamentName: string,          // "2025 Spring Championship"

  // 기본 정보
  title: string,
  description?: string,
  bannerImage?: string,
  logoImage?: string,

  // 형식 및 설정
  format: 'single_elimination',
  settings: {
    format: 'single_elimination',
    matchFormat: 'best_of_3',
    seedingMethod: 'ranking',      // 시드 배정 방식

    // 참가자 설정
    minParticipants: 8,
    maxParticipants: 32,
    allowByes: true,               // 부전승 허용

    // 경기 설정
    scoringFormat: {
      setsToWin: 2,                // 3세트 2선승
      gamesPerSet: 6,
      tiebreakAt: 6,               // 6-6에서 타이브레이크
      noAdScoring: false,
      tiebreakPoints: 7
    },

    // 일정 설정
    matchDuration: 90,             // 예상 경기 시간 (분)
    courtCount: 4,                 // 사용 가능 코트 수
    matchesPerDay: 8,
    restBetweenMatches: 30,        // 경기 간 휴식 (분)

    // 규칙
    thirdPlaceMatch: true,         // 3,4위전
    consolationBpaddle: false,     // 패자부활전
    allowWalkovers: true
  },

  // 참가자
  participants: [
    {
      playerId: "userId1",
      playerName: "John Doe",
      seed: 1,                     // 시드 번호
      skillLevel: "4.0",
      registeredAt: Timestamp,
      checkInStatus: 'checked_in',

      // 성적
      currentRound: 3,             // 8강 진출
      matchesPlayed: 2,
      matchesWon: 2,
      setsWon: 4,
      setsLost: 1,
      gamesWon: 26,
      gamesLost: 13
    }
  ],

  // 대진표 (라운드별)
  bpaddle: [
    {
      roundNumber: 1,
      roundName: "Round of 16",
      matches: [
        {
          id: "match_1",
          tournamentId: "tournamentId",
          roundNumber: 1,
          matchNumber: 1,
          bpaddlePosition: 1,      // 대진표 위치

          // 참가자
          player1: {
            playerId: "userId1",
            playerName: "John Doe",
            seed: 1,
            status: 'filled'
          },
          player2: {
            playerId: "userId16",
            playerName: "Mike Johnson",
            seed: 16,
            status: 'filled'
          },

          // 다음 매치 참조
          nextMatch: {
            matchId: "match_9",
            position: 'player1'
          },

          // 경기 정보
          scheduledTime: Timestamp,
          court: "Court 1",
          status: 'completed',

          // 결과
          winner: "userId1",
          score: {
            sets: [
              { player1Games: 6, player2Games: 2 },
              { player1Games: 6, player2Games: 3 }
            ],
            finalScore: "6-2, 6-3",
            duration: 65
          }
        }
      ],
      startDate: Timestamp,
      endDate: Timestamp,
      isCompleted: true
    },
    {
      roundNumber: 2,
      roundName: "Quarter Finals",
      matches: [...],
      isCompleted: false
    }
  ],

  // 일정
  startDate: Timestamp,
  endDate: Timestamp,
  registrationDeadline: Timestamp,
  drawDate: Timestamp,             // 대진 추첨일

  // 상태
  status: 'in_progress',
  currentRound: 2,
  totalRounds: 4,

  // 결과
  champion?: {
    playerId: "userId1",
    playerName: "John Doe",
    finalOpponent: "userId4",
    finalScore: "6-4, 3-6, 6-2"
  },
  runnerUp?: {
    playerId: "userId4",
    playerName: "Sarah Williams"
  },
  thirdPlace?: {
    playerId: "userId3",
    playerName: "Tom Brown"
  },

  // 상금/보상
  prizes?: {
    champion: {
      type: 'cash',
      description: 'Champion Prize',
      value: 1000,
      currency: 'USD'
    },
    runnerUp: {
      type: 'trophy',
      description: 'Runner-up Trophy',
      value: 500
    },
    thirdPlace: {
      type: 'gift',
      description: 'Bronze Medal + Equipment',
      value: 250
    }
  },

  // 참가비
  entryFee?: {
    amount: 30,
    currency: 'USD',
    deadline: Timestamp,
    refundPolicy: 'No refunds after draw'
  },

  // 메타데이터
  createdBy: "adminUserId",
  createdAt: Timestamp,
  updatedAt: Timestamp,

  // 통계
  stats?: {
    totalMatches: 15,
    completedMatches: 8,
    upsets: 2,                     // 낮은 시드 승리
    walkovers: 0,
    averageMatchDuration: 82,
    longestMatch: {
      matchId: "match_5",
      duration: 145,
      score: "7-6, 6-7, 7-5"
    },
    biggestUpset: {
      matchId: "match_3",
      winnerSeed: 12,
      loserSeed: 5
    }
  }
}
```

## 🔧 서비스 레이어 기능

### LeagueService 주요 메서드

```typescript
// 리그 생성
createLeague(request: CreateLeagueRequest): Promise<string>

// 리그 참가 신청
registerForLeague(leagueId: string, userId: string): Promise<string>

// 라운드 로빈 경기 자동 생성
generateRoundRobinMatches(leagueId: string): Promise<void>

// 경기 결과 입력 및 순위표 자동 업데이트
updateMatchResult(matchId: string, winner: string, score: MatchScore): Promise<void>

// 리그 정보 조회
getLeague(leagueId: string): Promise<League>
getClubLeagues(clubId: string): Promise<League[]>
getLeagueMatches(leagueId: string): Promise<LeagueMatch[]>

// 실시간 구독
subscribeToLeague(leagueId: string, callback: Function): Unsubscribe
```

### TournamentService 주요 메서드

```typescript
// 토너먼트 생성
createTournament(request: CreateTournamentRequest): Promise<string>

// 토너먼트 참가 신청
registerForTournament(tournamentId: string, userId: string): Promise<string>

// 시드 배정
assignSeeds(tournamentId: string, seeds: SeedAssignment[]): Promise<void>

// 싱글 엘리미네이션 대진표 생성
generateSingleEliminationBpaddle(tournamentId: string): Promise<void>

// 경기 결과 입력 및 다음 라운드 자동 진출
updateMatchResult(matchId: string, winner: string, score: TournamentScore): Promise<void>

// 토너먼트 정보 조회
getTournament(tournamentId: string): Promise<Tournament>
getTournamentMatches(tournamentId: string): Promise<BpaddleMatch[]>

// 실시간 구독
subscribeToTournament(tournamentId: string, callback: Function): Unsubscribe
```

## 🎮 대진표 생성 알고리즘

### 싱글 엘리미네이션 대진표 생성

```typescript
1. 참가자 수 확인 (n명)
2. 필요한 라운드 수 계산: rounds = ceil(log2(n))
3. 첫 라운드 매치 수: firstRoundMatches = 2^(rounds-1)
4. 부전승 수 계산: byes = firstRoundMatches * 2 - n
5. 시드 순으로 참가자 정렬
6. 높은 시드에게 부전승 우선 배정
7. 대진표 위치 계산 및 매치 생성
8. 다음 라운드 연결 관계 설정
```

### 순위표 정렬 알고리즘 (번개 피클볼 공식 규정 v1.0)

```typescript
/**
 * 두 명 이상의 선수가 동일한 승점으로 리그를 마쳤을 경우,
 * 다음의 규칙을 순서대로 적용하여 최종 순위를 결정한다.
 */

0. 기본: 승점 (points) 높은 순으로 1차 정렬

// 승점이 같을 때 타이브레이크 규칙 적용:

1. 동점자 간의 승자승 원칙 (Head-to-Head)
   - 동점인 두 선수가 직접 대결한 경기가 있을 경우,
     해당 경기의 승자가 상위 순위를 차지한다.

2. 세트 득실률 (Set Win Rate)
   - 세트 득실률 = 이긴 세트 수 / 총 세트 수
   - 더 높은 세트 득실률을 가진 선수가 상위 순위를 차지한다.
   - 예시: 10세트 승 / 12세트 = 83.3%

3. 게임 득실률 (Game Win Rate)
   - 게임 득실률 = 이긴 게임 수 / 총 게임 수
   - 더 높은 게임 득실률을 가진 선수가 상위 순위를 차지한다.
   - 예시: 60게임 승 / 80게임 = 75%

4. 먼저 리그에 등록한 선수 (Registration Order)
   - 위의 모든 조건이 동일할 경우,
     먼저 리그에 등록한 선수가 상위 순위를 차지한다.
   - 이는 추첨보다 더 공정한 시스템적 규칙이다.

5. 순위 재배정
   - 동점 선수가 여러 명일 경우, 위 규칙을 반복 적용하여
     최종 순위를 결정한다.
```

**중요 사항**:

- ❌ 득실**차** (Difference)가 아님
- ✅ 득실**률** (Win Rate) 사용
- 득실률은 경기 수와 무관하게 공정한 평가 가능

## 📊 통계 및 분석

### 리그 통계

- **개인 통계**: 승률, 평균 게임 득실, 연승/연패
- **리그 통계**: 총 경기 수, 완료율, 평균 경기 시간
- **최고 기록**: 최다 승리, 최장 연승, 최다 득점

### 토너먼트 통계

- **개인 성적**: 진출 라운드, 승패 기록, 세트/게임 기록
- **토너먼트 통계**: 업셋 횟수, 평균 경기 시간
- **하이라이트**: 최장 경기, 최대 업셋, 스코어 기록

## 🔐 권한 관리

### 리그/토너먼트 관리자

- 생성 및 설정 변경
- 시드 배정
- 경기 결과 입력
- 참가자 관리

### 클럽 회원

- 참가 신청
- 자신의 경기 일정 확인
- 순위표/대진표 조회

### 일반 사용자

- 공개 리그/토너먼트 조회
- 결과 확인

## 🚀 향후 확장 계획

### Phase 1 - 기본 기능

- [x] 리그 시스템 구현
- [x] 토너먼트 시스템 구현
- [x] 자동 대진표 생성
- [x] 순위표 자동 계산

### Phase 2 - 고급 기능

- [ ] 더블 엘리미네이션 지원
- [ ] 스위스 시스템 구현
- [ ] 팀 리그/토너먼트
- [ ] 핸디캡 시스템

### Phase 3 - 통합 기능

- [ ] 시즌 통합 관리
- [ ] 마스터즈 시리즈
- [ ] 지역간 대항전
- [ ] 랭킹 포인트 시스템

## 🎯 비즈니스 가치

1. **클럽 활성화**: 정기적인 경쟁으로 회원 참여도 증가
2. **실력 향상**: 체계적인 경쟁을 통한 동기부여
3. **커뮤니티 강화**: 리그/토너먼트를 통한 유대감 형성
4. **수익 창출**: 참가비를 통한 클럽 수익 증대

Lightning Pickleball의 리그 & 토너먼트 시스템은 클럽 운영의 핵심 기능으로, 체계적인 경쟁 시스템을 통해 피클볼 커뮤니티를 더욱 활성화시킵니다. 🎾🏆
