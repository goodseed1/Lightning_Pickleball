# 번개 피클볼 데이터 구조 명세서

## 📋 개요

번개 피클볼 앱은 **이중 랭킹 시스템 (Dual Ranking System)**을 기반으로 한 혁신적인 데이터 아키텍처를 사용합니다. 이 시스템은 생태계 헌장의 **"자율성"** 원칙을 구현하여, 사용자가 전체 커뮤니티와 소속 클럽에서 각각 독립적인 랭킹을 유지할 수 있도록 합니다.

---

## 🏗️ 핵심 설계 원칙

### 1. **이중 랭킹 시스템 (Dual Ranking)**

- **Global Ranking**: 전체 커뮤니티 공용 매치 기반
- **Club Ranking**: 클럽별 독립적인 매치 기반

### 2. **주권 모델 (Sovereign Model)**

- 각 클럽은 독립적인 ELO 시스템 운영
- 클럽 간 랭킹은 상호 독립적
- 글로벌 랭킹은 모든 공용 매치 통합

### 3. **확장 가능한 멀티 클럽 지원**

- 사용자는 여러 클럽 동시 가입 가능
- 각 클럽에서 서로 다른 랭킹 유지

---

## 📊 Firestore 데이터 구조

### 사용자 문서 (`users/{userId}`)

```javascript
{
  // === 기본 정보 ===
  uid: "user123",
  displayName: "김피클볼",
  email: "pickleball@example.com",
  photoURL: "https://...",
  createdAt: "2025-09-06T00:00:00Z",
  lastActive: "2025-09-06T12:30:00Z",

  // === 통합 스킬 레벨 ===
  skillLevel: {
    selfAssessed: "3.0-3.5",           // 사용자 자기평가 범위
    calculatedGlobal: 3.2,             // 글로벌 ELO 기반 계산값
    globalConfidence: 0.85,            // 계산값 신뢰도 (0-1)
    lastUpdated: "2025-09-06T10:00:00Z",
    source: "manual"                   // onboarding | manual | migration
  },

  // === 글로벌 통계 (공용 매치) ===
  globalStats: {
    eloRating: 1250,                   // 글로벌 ELO 점수
    matchesPlayed: 15,                 // 총 공용 매치 수
    wins: 10,                          // 승수
    losses: 5,                         // 패수
    winRate: 0.667,                    // 승률 (자동 계산)
    currentStreak: 3,                  // 현재 연승/연패
    longestStreak: 5,                  // 최장 연승 기록
    lastMatchDate: "2025-09-05T18:00:00Z"
  },

  // === 사용자 설정 ===
  preferences: {
    language: "ko",
    notifications: {
      matchReminders: true,
      friendRequests: true,
      clubEvents: true
    }
  }
}
```

### 클럽 멤버십 서브컬렉션 (`users/{userId}/clubMemberships/{clubId}`)

```javascript
{
  clubId: "club123",
  clubName: "서울 피클볼 클럽",
  role: "member",                      // member | admin | owner
  status: "active",                    // active | inactive | pending
  joinedAt: "2025-08-01T00:00:00Z",

  // === 클럽별 독립 통계 ===
  clubStats: {
    eloRating: 1210,                   // 이 클럽에서의 ELO 점수
    matchesPlayed: 6,                  // 이 클럽에서의 매치 수
    wins: 4,                           // 이 클럽에서의 승수
    losses: 2,                         // 이 클럽에서의 패수
    winRate: 0.667,                    // 이 클럽에서의 승률
    currentStreak: 2,                  // 이 클럽에서의 현재 연승
    lastMatchDate: "2025-09-04T19:00:00Z"
  }
}
```

---

## ⚡ 랭킹 계산 시스템

### Global ELO 계산

```javascript
// 공용 매치 (클럽 소속 없는 번개 매치)
const globalMatch = {
  type: 'global',
  players: [userId1, userId2],
  winner: userId1,
  // globalStats 업데이트
};
```

### Club ELO 계산

```javascript
// 클럽 내부 매치
const clubMatch = {
  type: 'club',
  clubId: 'club123',
  players: [userId1, userId2],
  winner: userId1,
  // 해당 클럽의 clubStats 업데이트
};
```

### ELO 업데이트 로직

```javascript
function updateELO(context, winnerId, loserId) {
  if (context.type === 'global') {
    // users/{winnerId}/globalStats 업데이트
    // users/{loserId}/globalStats 업데이트
    // skillLevel.calculatedGlobal 재계산
  } else if (context.type === 'club') {
    // users/{winnerId}/clubMemberships/{clubId}/clubStats 업데이트
    // users/{loserId}/clubMemberships/{clubId}/clubStats 업데이트
  }
}
```

---

## 🎯 매치 타입별 랭킹 영향

| 매치 타입      | Global ELO   | Club ELO     | 설명                     |
| -------------- | ------------ | ------------ | ------------------------ |
| 공용 번개 매치 | ✅ 영향      | ❌ 영향 없음 | 클럽 소속 없는 일반 매치 |
| 클럽 내부 매치 | ❌ 영향 없음 | ✅ 영향      | 특정 클럽 멤버 간 매치   |
| 클럽 대항전    | ✅ 영향      | ✅ 영향      | 클럽 간 공식 대항전      |
| 친선 경기      | ❌ 영향 없음 | ❌ 영향 없음 | 재경기 제한 기간 내 매치 |

---

## 📈 시즌 및 트로피 시스템

### 시즌 데이터 (`seasons/{seasonId}`)

```javascript
{
  seasonId: "2025-Q3",
  year: 2025,
  quarter: 3,
  startDate: "2025-07-01T00:00:00Z",
  endDate: "2025-09-30T23:59:59Z",
  isActive: true
}
```

### 사용자 트로피 서브컬렉션 (`users/{userId}/trophies/{trophyId}`)

```javascript
{
  id: "trophy123",
  type: "rank-up",                     // rank-up | win-rate | participation
  seasonId: "2025-Q3",
  awardedAt: "2025-09-30T12:00:00Z",
  context: "global",                   // global | club
  clubId: null,                        // 클럽 트로피인 경우만
  description: "Q3 시즌 글로벌 랭킹 상승"
}
```

---

## 🔄 데이터 마이그레이션 전략

### 기존 사용자 데이터 변환

#### Before (기존 구조)

```javascript
{
  uid: "user123",
  ntrpLevel: "3.5",
  profile: { skillLevel: "3.0-3.5" },
  stats: { eloRating: 1250, wins: 10, losses: 5 }
}
```

#### After (새로운 구조)

```javascript
{
  uid: "user123",
  skillLevel: {
    selfAssessed: "3.0-3.5",          // profile.skillLevel 우선
    calculatedGlobal: 3.2,            // ELO 변환
    globalConfidence: 0.85,           // 경기 수 기반
    lastUpdated: "2025-09-06T00:00:00Z",
    source: "migration"
  },
  globalStats: {
    eloRating: 1250,                  // 기존 stats 이전
    matchesPlayed: 15,
    wins: 10,
    losses: 5,
    winRate: 0.667,
    currentStreak: 0,
    longestStreak: 0
  }
}
```

### 마이그레이션 단계

1. **Phase 1**: 타입 시스템 업데이트 ✅
2. **Phase 2**: 데이터 구조 문서화 ✅
3. **Phase 3**: 서비스 로직 업데이트 (다음 단계)
4. **Phase 4**: 기존 사용자 데이터 마이그레이션
5. **Phase 5**: UI 컴포넌트 업데이트

---

## 🚀 성능 최적화 고려사항

### 1. **Firestore 쿼리 최적화**

- 글로벌 랭킹: `globalStats.eloRating` 인덱스
- 클럽 랭킹: `clubMemberships.{clubId}.clubStats.eloRating` 인덱스

### 2. **실시간 업데이트**

- ELO 변경 시 실시간 리스너를 통한 UI 업데이트
- 배치 쓰기를 통한 다중 필드 동시 업데이트

### 3. **캐싱 전략**

- 사용자 프로필: 세션 캐시
- 랭킹 데이터: 5분 캐시
- 트로피 데이터: 1시간 캐시

---

**이 데이터 구조는 번개 피클볼 생태계 헌장의 모든 원칙을 기술적으로 구현하며, 확장 가능하고 유지보수가 용이한 아키텍처를 제공합니다.**

_마지막 업데이트: 2025년 9월 6일_
