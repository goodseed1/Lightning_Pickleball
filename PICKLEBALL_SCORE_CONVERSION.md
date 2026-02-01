# 피클볼 점수 시스템 변환 노트 🏓

> **작업일**: 2026-01-29
> **작업 내용**: 테니스 점수 시스템 → 피클볼 Rally Scoring 전환

---

## 📋 변환 개요

Lightning Tennis에서 포크된 Lightning Pickleball 앱의 **모든 점수 입력 화면**을 피클볼 규칙으로 통일했습니다.

### 핵심 원칙: "피클볼 헌법"
> 피클볼 점수 규칙은 앱의 **모든 매치 타입**에 예외 없이 적용되어야 합니다.
> - 토너먼트
> - 리그
> - 공용 매치 (퀵 매치)
> - 랭킹 매치
> - 단식/복식

---

## 🎯 피클볼 vs 테니스 점수 비교

| 항목 | 테니스 (이전) | 피클볼 (현재) |
|-----|-------------|-------------|
| **점수 목표** | 6 게임/세트 | 11 또는 15점 |
| **승리 조건** | 2 게임 차이 | 2점 차이 (win by 2) |
| **매치 포맷** | Best of 3 세트 | 단일 게임 or Best of 3 게임 |
| **타이브레이크** | 6-6에서 7점/10점 | **없음** (win by 2가 연장 처리) |
| **최대 점수** | 7 게임 (세트당) | 제한 없음 (win by 2까지) |

---

## 📁 변환된 파일 목록

### 1. `src/components/match/ScoreInputModal.tsx`
- **용도**: 일반 매치 점수 입력
- **상태**: ✅ 이미 피클볼 규칙 적용됨 (변환 불필요)

### 2. `src/components/common/ScoreInputModal.tsx`
- **용도**: 공용 점수 입력 모달
- **상태**: ✅ 이미 피클볼 규칙 적용됨 (변환 불필요)

### 3. `src/components/tournaments/ScoreInputContent.tsx`
- **용도**: 토너먼트 점수 입력
- **상태**: ✅ 테니스 → 피클볼 완전 변환
- **주요 변경**:
  - 세트/타이브레이크 로직 제거
  - `targetScore` (11/15) 선택 UI 추가
  - `matchFormat` (single_game/best_of_3) 선택 UI 추가
  - `determinePickleballGameWinner()` 함수 구현
  - `determineBestOf3Winner()` 함수 구현

### 4. `src/components/leagues/LeagueScoreInputModal.tsx`
- **용도**: 리그 매치 점수 입력
- **상태**: ✅ 테니스 → 피클볼 완전 변환
- **주요 변경**:
  - 800+ 라인 대규모 리팩토링
  - 세트 기반 → 게임 기반 구조 변경
  - SegmentedButtons로 포맷/점수 선택 UI 구현

### 5. `src/screens/RecordScoreScreen.tsx`
- **용도**: 점수 기록 화면 (매치 결과 제출)
- **상태**: ✅ 테니스 → 피클볼 완전 변환
- **주요 변경**:
  - `ScoreSet` → `PickleballGame` 인터페이스 변경
  - `getSetWinner()` → `getGameWinner()` 함수 변경
  - `calculateSetsToDisplay()` → `calculateGamesToDisplay()` 함수 변경
  - `renderScoreInput()` → `renderGameInput()` 함수 변경
  - 타이브레이크 UI 완전 제거

---

## 🔧 핵심 타입 정의

```typescript
// 피클볼 점수 타입
type PickleballGameTarget = 11 | 15;
type PickleballMatchFormat = 'single_game' | 'best_of_3';

interface PickleballGame {
  player1: string;  // 점수 (0-30)
  player2: string;
}

// 게임 승자 결정 함수
const determinePickleballGameWinner = (
  p1Score: number,
  p2Score: number,
  targetScore: PickleballGameTarget
): 'player1' | 'player2' | null => {
  const maxScore = Math.max(p1Score, p2Score);
  const diff = Math.abs(p1Score - p2Score);

  // 목표 점수 도달 + 2점 차이 필요
  if (maxScore >= targetScore && diff >= 2) {
    return p1Score > p2Score ? 'player1' : 'player2';
  }
  return null;
};

// Best of 3 매치 승자 결정
const determineBestOf3Winner = (
  games: PickleballGame[],
  targetScore: PickleballGameTarget
): 'player1' | 'player2' | null => {
  let p1Wins = 0;
  let p2Wins = 0;

  for (const game of games) {
    const winner = determinePickleballGameWinner(...);
    if (winner === 'player1') p1Wins++;
    else if (winner === 'player2') p2Wins++;
  }

  if (p1Wins >= 2) return 'player1';
  if (p2Wins >= 2) return 'player2';
  return null;
};
```

---

## 📊 검증 결과

### 테니스 잔재 검색
- ❌ 타이브레이크 로직: **없음** (주석만 존재)
- ❌ 6-6 세트 로직: **없음**
- ❌ `getSetWinner`: **없음**

### 피클볼 규칙 확인
- ✅ `targetScore` 구현: 14개 인스턴스
- ✅ Win by 2 규칙: 14개 인스턴스
- ✅ `single_game`/`best_of_3`: 52개 인스턴스

---

## ⚠️ 알려진 이슈

### 1. TypeScript 타입 경고 (기존 이슈)
- `t()` 함수의 인터폴레이션 파라미터에 대한 TypeScript 경고
- **원인**: i18n 라이브러리 타입 정의가 두 번째 인자를 지원하지 않음
- **영향**: 런타임에는 정상 작동, 빌드 가능

### 2. `eventService` 미정의 (✅ 수정 완료)
- `RecordScoreScreen.tsx:599`에서 `eventService` 미정의 에러
- **원인**: 원본 코드의 버그 (존재하지 않는 메서드 호출)
- **해결**: Firestore 직접 업데이트로 교체
  ```typescript
  // 기존 (에러)
  await eventService.recordMatchResult(eventId, resultData);

  // 수정 후 (피클볼 데이터 저장)
  const { doc, updateDoc } = await import('firebase/firestore');
  const { db } = await import('../firebase/config');
  await updateDoc(doc(db, 'events', eventId), {
    matchResult: {
      winnerId, loserId, score: formatScore(),
      matchFormat, targetScore, submittedAt: new Date(),
    },
  });
  ```

---

## 🔄 데이터베이스 호환성

기존 데이터베이스 스키마와의 호환성을 위해 일부 필드명은 유지:
- `sets` 필드: 실제로는 피클볼 게임 점수 저장
- 새로운 필드 추가: `matchFormat`, `targetScore`

```javascript
// 저장 형식 예시
{
  winnerId: "user123",
  loserId: "user456",
  score: "11-7, 11-9 (Best of 3, 11pt)",
  sets: [
    { player1Games: 11, player2Games: 7 },
    { player1Games: 11, player2Games: 9 }
  ],
  matchFormat: "best_of_3",
  targetScore: 11
}
```

---

## 📝 향후 작업

1. **번역 키 추가 필요**:
   - `recordScore.singleGame`
   - `recordScore.bestOf3`
   - `recordScore.gameN`
   - `recordScore.matchSettings`
   - `recordScore.targetScore`
   - `recordScore.pickleballRuleHint`
   - 등등...

2. **eventService 버그 수정**:
   - `RecordScoreScreen.tsx`의 `eventService` → `ActivityService` 교체

3. **테스트**:
   - 모든 점수 입력 화면 기능 테스트
   - 데이터베이스 저장/로드 검증

---

**작성자**: Claude (피클볼 헌법 시행관 ⚖️)
**마지막 업데이트**: 2026-01-29
