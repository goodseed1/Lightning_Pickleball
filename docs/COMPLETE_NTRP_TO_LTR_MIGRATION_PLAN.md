# 🎾 완전한 NTRP → LTR 마이그레이션 플랜

**작성일**: 2024-12-30
**작성자**: Kim (AI Architect)
**상태**: 계획 수립 완료 - 승인 대기
**예상 소요 시간**: 2-3일 (약 20-30시간)

---

## 📋 Executive Summary

### 목적

Lightning Tennis 앱에서 **모든 NTRP 용어와 코드를 LTR로 완전히 마이그레이션**합니다.
마이그레이션 완료 후, 코드베이스에서 `ntrp`, `Ntrp`, `NTRP` 문자열이 더 이상 존재하지 않습니다.

### 영향 범위 Summary

| 카테고리         | 파일 수    | 주요 작업                     |
| ---------------- | ---------- | ----------------------------- |
| 클라이언트 코드  | 104개      | 변수/함수명 변경, 임포트 수정 |
| Cloud Functions  | 15개       | 필드명 변경, 로직 수정        |
| 파일명 변경      | 10개       | `*Ntrp*` → `*Ltr*`            |
| i18n 번역 파일   | 10개       | `ntrp.*.json` → `ltr.*.json`  |
| Firestore 데이터 | 3개 컬렉션 | 필드명 마이그레이션           |
| 상수 파일        | 2개        | `ntrp.ts` → `ltr.ts` 통합     |

---

## 🏗️ 마이그레이션 전략

### 접근 방식: Big Bang Migration with Backward Compatibility Window

1. **Phase 1**: Cloud Functions에서 양쪽 필드 지원 (하위 호환성)
2. **Phase 2**: Firestore 데이터 마이그레이션 스크립트 실행
3. **Phase 3**: 클라이언트 코드 전체 수정 (파일명 포함)
4. **Phase 4**: Cloud Functions에서 레거시 필드 지원 제거
5. **Phase 5**: 최종 정리 및 테스트

---

## 📊 상세 파일 분석

### Category 1: 파일명 변경 필요 (10개 파일)

#### A. 화면 파일 (4개)

| 현재 파일명                                  | 변경 후 파일명             |
| -------------------------------------------- | -------------------------- |
| `src/screens/auth/NtrpAssessmentScreen.tsx`  | `LtrAssessmentScreen.tsx`  |
| `src/screens/auth/NtrpResultScreen.tsx`      | `LtrResultScreen.tsx`      |
| `src/screens/auth/NtrpQuestionScreen.tsx`    | `LtrQuestionScreen.tsx`    |
| `src/screens/auth/NtrpLevelSelectScreen.tsx` | `LtrLevelSelectScreen.tsx` |

#### B. 모달/컴포넌트 (2개)

| 현재 파일명                                 | 변경 후 파일명            |
| ------------------------------------------- | ------------------------- |
| `src/screens/auth/NtrpLevelDetailModal.tsx` | `LtrLevelDetailModal.tsx` |
| `src/components/common/NtrpSelector.tsx`    | `LtrSelector.tsx`         |

#### C. 유틸리티/상수 (4개)

| 현재 파일명                      | 변경 후 파일명                   |
| -------------------------------- | -------------------------------- |
| `src/utils/ntrpUtils.ts`         | `ltrUtils.ts` (이미 존재 - 통합) |
| `src/utils/ntrpAssessment.ts`    | `ltrAssessment.ts`               |
| `src/constants/ntrp.ts`          | `ltr.ts` (이미 존재 - 통합)      |
| `src/constants/ntrpQuestions.ts` | `ltrQuestions.ts`                |

### Category 2: i18n 번역 파일 (10개)

| 현재 파일명             | 변경 후 파일명 |
| ----------------------- | -------------- |
| `src/i18n/ntrp.en.json` | `ltr.en.json`  |
| `src/i18n/ntrp.ko.json` | `ltr.ko.json`  |
| `src/i18n/ntrp.es.json` | `ltr.es.json`  |
| `src/i18n/ntrp.zh.json` | `ltr.zh.json`  |
| `src/i18n/ntrp.ja.json` | `ltr.ja.json`  |
| `src/i18n/ntrp.fr.json` | `ltr.fr.json`  |
| `src/i18n/ntrp.de.json` | `ltr.de.json`  |
| `src/i18n/ntrp.it.json` | `ltr.it.json`  |
| `src/i18n/ntrp.pt.json` | `ltr.pt.json`  |
| `src/i18n/ntrp.ru.json` | `ltr.ru.json`  |

### Category 3: 주요 로직 파일 (높은 우선순위)

#### Cloud Functions (15개)

1. `functions/src/triggers/createMatchAndInvite.ts` - minNtrp/maxNtrp 필드
2. `functions/src/utils/matchUtils.ts` - validateMatchNtrp 함수
3. `functions/src/createMatch.ts` - NTRP 검증 로직
4. `functions/src/createQuickMatch.ts` - NTRP 검증 로직
5. `functions/src/utils/rankingUtils.ts` - ELO-NTRP 변환
6. `functions/src/scheduled/finalizeSeasonRankings.ts`
7. `functions/src/scheduled/recordSeasonStartGrades.ts`
8. `functions/src/utils/seasonTrophyAwarder.ts`
9. `functions/src/applyForLeague.ts`
10. `functions/src/applyForLeagueAsTeam.ts`
11. `functions/src/addLeagueParticipant.ts`
12. `functions/src/addLeagueTeam.ts`
13. `functions/src/approveLeagueParticipant.ts`
14. `functions/src/deleteAllActivityData.ts`
15. `functions/src/types/league.ts`

#### 핵심 클라이언트 파일

1. `src/contexts/AuthContext.tsx` - ntrpLevel 상태
2. `src/types/user.ts` - ntrpLevel 타입 정의
3. `src/types/match.ts` - minNtrp/maxNtrp 타입
4. `src/services/authService.js` - 온보딩 NTRP 저장
5. `src/services/userService.js` - 프로필 NTRP 관리
6. `src/services/rankingService.ts` - NTRP 계산
7. `src/screens/CreateEventForm.tsx` - 매치 생성 시 LTR/NTRP
8. `src/contexts/DiscoveryContext.tsx` - 필터링

### Category 4: Firestore 스키마 변경

#### Collection: `users`

| 현재 필드         | 변경 후 필드     | 타입   |
| ----------------- | ---------------- | ------ |
| `ntrpLevel`       | `ltrLevel`       | number |
| `skillLevel.ntrp` | `skillLevel.ltr` | object |

#### Collection: `lightning_matches`

| 현재 필드     | 변경 후 필드 | 타입   |
| ------------- | ------------ | ------ |
| `minNtrp`     | `minLtr`     | number |
| `maxNtrp`     | `maxLtr`     | number |
| `hostNtrp`    | `hostLtr`    | number |
| `partnerNtrp` | `partnerLtr` | number |

#### Collection: `club_events`

| 현재 필드 | 변경 후 필드 | 타입   |
| --------- | ------------ | ------ |
| `minNtrp` | `minLtr`     | number |
| `maxNtrp` | `maxLtr`     | number |

---

## 🔢 값 매핑 전략

### NTRP (1.0-5.0+) → LTR (1-10) 변환

현재 온보딩에서 사용하는 NTRP 값을 LTR로 변환:

| NTRP 값 | 설명         | LTR 값 | 티어     |
| ------- | ------------ | ------ | -------- |
| 1.0     | 완전 초보    | 1      | Bronze   |
| 1.5     | 기초 학습 중 | 2      | Bronze   |
| 2.0     | 초보         | 3      | Silver   |
| 2.5     | 초급         | 4      | Silver   |
| 3.0     | 중급 입문    | 5      | Gold     |
| 3.5     | 중급         | 6      | Gold     |
| 4.0     | 중상급       | 7      | Platinum |
| 4.5     | 상급         | 8      | Diamond  |
| 5.0     | 고급         | 9      | Master   |
| 5.5+    | 프로급       | 10     | Legend   |

### ELO → LTR 변환 (기존 ltrUtils.ts 사용)

```typescript
// 현재 ltrUtils.ts의 convertEloToLtr 함수 사용
export function convertEloToLtr(elo: number): number {
  if (elo <= 1000) return 1;
  if (elo <= 1100) return 2;
  if (elo <= 1200) return 3;
  if (elo <= 1300) return 4;
  if (elo <= 1400) return 5;
  if (elo <= 1500) return 6;
  if (elo <= 1600) return 7;
  if (elo <= 1700) return 8;
  if (elo <= 1800) return 9;
  return 10;
}
```

---

## 📅 Phase별 실행 계획

### Phase 1: 하위 호환성 준비 (Day 1 - 4시간)

#### 1.1 Cloud Functions 수정

**목표**: 새 필드명(ltr)과 기존 필드명(ntrp) 동시 지원

```typescript
// functions/src/utils/matchUtils.ts
// Before
export function validateMatchNtrp(minNtrp: number, maxNtrp: number) { ... }

// After (하위 호환성 유지)
export function validateMatchLtr(minLtr: number, maxLtr: number) { ... }

// 읽기 시 폴백
const minLtr = matchData.minLtr ?? matchData.minNtrp ?? 5;
const maxLtr = matchData.maxLtr ?? matchData.maxNtrp ?? 5;

// 쓰기 시 양쪽 필드 모두 저장 (전환 기간)
{
  minLtr: calculatedMin,
  maxLtr: calculatedMax,
  minNtrp: calculatedMin, // 전환 기간 중 호환성
  maxNtrp: calculatedMax,
}
```

#### 1.2 Cloud Functions 배포

```bash
cd functions
npm run build
firebase deploy --only functions
```

---

### Phase 2: Firestore 데이터 마이그레이션 (Day 1 - 2시간)

#### 2.1 마이그레이션 스크립트 작성

```javascript
// scripts/migrate-ntrp-to-ltr.js
const admin = require('firebase-admin');

// NTRP to LTR 변환 함수
function convertNtrpToLtr(ntrp) {
  if (ntrp <= 1.0) return 1;
  if (ntrp <= 1.5) return 2;
  if (ntrp <= 2.0) return 3;
  if (ntrp <= 2.5) return 4;
  if (ntrp <= 3.0) return 5;
  if (ntrp <= 3.5) return 6;
  if (ntrp <= 4.0) return 7;
  if (ntrp <= 4.5) return 8;
  if (ntrp <= 5.0) return 9;
  return 10;
}

async function migrateUsers() {
  const db = admin.firestore();
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  let migrated = 0;
  const batchSize = 500;
  let batch = db.batch();
  let batchCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const updates = {};

    // ntrpLevel → ltrLevel
    if (data.ntrpLevel !== undefined) {
      updates.ltrLevel = convertNtrpToLtr(data.ntrpLevel);
    }

    // skillLevel.ntrp 처리
    if (data.skillLevel?.ntrp !== undefined) {
      updates['skillLevel.ltr'] = convertNtrpToLtr(data.skillLevel.ntrp);
    }

    if (Object.keys(updates).length > 0) {
      batch.update(doc.ref, updates);
      batchCount++;
      migrated++;

      if (batchCount >= batchSize) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
        console.log(`Committed batch, ${migrated} users migrated so far`);
      }
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`✅ Total ${migrated} users migrated`);
}

async function migrateMatches() {
  const db = admin.firestore();
  const matchesRef = db.collection('lightning_matches');
  const snapshot = await matchesRef.get();

  let migrated = 0;
  const batchSize = 500;
  let batch = db.batch();
  let batchCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const updates = {};

    if (data.minNtrp !== undefined) {
      updates.minLtr = convertNtrpToLtr(data.minNtrp);
    }
    if (data.maxNtrp !== undefined) {
      updates.maxLtr = convertNtrpToLtr(data.maxNtrp);
    }
    if (data.hostNtrp !== undefined) {
      updates.hostLtr = convertNtrpToLtr(data.hostNtrp);
    }
    if (data.partnerNtrp !== undefined) {
      updates.partnerLtr = convertNtrpToLtr(data.partnerNtrp);
    }

    if (Object.keys(updates).length > 0) {
      batch.update(doc.ref, updates);
      batchCount++;
      migrated++;

      if (batchCount >= batchSize) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`✅ Total ${migrated} matches migrated`);
}

async function migrateClubEvents() {
  const db = admin.firestore();
  const eventsRef = db.collection('club_events');
  const snapshot = await eventsRef.get();

  let migrated = 0;
  const batch = db.batch();

  snapshot.forEach(doc => {
    const data = doc.data();
    const updates = {};

    if (data.minNtrp !== undefined) {
      updates.minLtr = convertNtrpToLtr(data.minNtrp);
    }
    if (data.maxNtrp !== undefined) {
      updates.maxLtr = convertNtrpToLtr(data.maxNtrp);
    }

    if (Object.keys(updates).length > 0) {
      batch.update(doc.ref, updates);
      migrated++;
    }
  });

  await batch.commit();
  console.log(`✅ Total ${migrated} club events migrated`);
}

// 실행
async function main() {
  admin.initializeApp();

  console.log('🚀 Starting NTRP to LTR migration...');
  await migrateUsers();
  await migrateMatches();
  await migrateClubEvents();
  console.log('✅ Migration complete!');
}

main().catch(console.error);
```

#### 2.2 마이그레이션 실행

```bash
# 먼저 프로덕션 백업!
firebase firestore:export gs://your-bucket/backup-$(date +%Y%m%d)

# 마이그레이션 실행
node scripts/migrate-ntrp-to-ltr.js
```

---

### Phase 3: 클라이언트 코드 마이그레이션 (Day 1-2 - 12시간)

#### 3.1 파일명 변경 (Git mv 사용)

```bash
# 화면 파일
git mv src/screens/auth/NtrpAssessmentScreen.tsx src/screens/auth/LtrAssessmentScreen.tsx
git mv src/screens/auth/NtrpResultScreen.tsx src/screens/auth/LtrResultScreen.tsx
git mv src/screens/auth/NtrpQuestionScreen.tsx src/screens/auth/LtrQuestionScreen.tsx
git mv src/screens/auth/NtrpLevelSelectScreen.tsx src/screens/auth/LtrLevelSelectScreen.tsx
git mv src/screens/auth/NtrpLevelDetailModal.tsx src/screens/auth/LtrLevelDetailModal.tsx

# 컴포넌트
git mv src/components/common/NtrpSelector.tsx src/components/common/LtrSelector.tsx

# 유틸리티/상수
git mv src/utils/ntrpAssessment.ts src/utils/ltrAssessment.ts
git mv src/constants/ntrpQuestions.ts src/constants/ltrQuestions.ts

# i18n 파일 (10개)
for lang in en ko es zh ja fr de it pt ru; do
  git mv src/i18n/ntrp.$lang.json src/i18n/ltr.$lang.json
done
```

#### 3.2 타입 정의 수정

**src/types/user.ts**

```typescript
// Before
export interface SkillLevel {
  ntrp?: number;
  calculated?: number;
  // ...
}

// After
export interface SkillLevel {
  ltr?: number; // 1-10 scale
  calculated?: number; // ELO-based calculated value
  // ...
}
```

**src/types/match.ts**

```typescript
// Before
export interface LightningMatch {
  minNtrp?: number;
  maxNtrp?: number;
  // ...
}

// After
export interface LightningMatch {
  minLtr?: number;
  maxLtr?: number;
  // ...
}
```

#### 3.3 온보딩 화면 수정

**LtrLevelSelectScreen.tsx (구 NtrpLevelSelectScreen.tsx)**

- NTRP 레벨 (2.0, 2.5, 3.0, 3.5...) → LTR 레벨 (1-10)
- 티어 표시 추가 (Bronze, Silver, Gold, etc.)

**LtrAssessmentScreen.tsx (구 NtrpAssessmentScreen.tsx)**

- 자가 진단 결과를 LTR 스케일로 변환
- UI 텍스트에서 "NTRP" → "LTR" 변경

#### 3.4 네비게이션 수정

**src/navigation/AuthNavigator.tsx**

```typescript
// Before
import NtrpAssessmentScreen from '../screens/auth/NtrpAssessmentScreen';
import NtrpResultScreen from '../screens/auth/NtrpResultScreen';

// After
import LtrAssessmentScreen from '../screens/auth/LtrAssessmentScreen';
import LtrResultScreen from '../screens/auth/LtrResultScreen';

// 스크린 이름도 변경
<Stack.Screen name="LtrAssessment" component={LtrAssessmentScreen} />
<Stack.Screen name="LtrResult" component={LtrResultScreen} />
```

#### 3.5 서비스 파일 수정

**src/services/authService.js**

```javascript
// Before
await userRef.update({ ntrpLevel: ntrpValue });

// After
await userRef.update({ ltrLevel: ltrValue });
```

#### 3.6 컨텍스트 수정

**src/contexts/AuthContext.tsx**

```typescript
// Before
const [ntrpLevel, setNtrpLevel] = useState<number | null>(null);

// After
const [ltrLevel, setLtrLevel] = useState<number | null>(null);
```

#### 3.7 유틸리티 파일 통합

`ntrpUtils.ts` 내용을 `ltrUtils.ts`로 통합 후 `ntrpUtils.ts` 삭제

`ntrp.ts` 내용을 `ltr.ts`로 통합 후 `ntrp.ts` 삭제

---

### Phase 4: Cloud Functions 정리 (Day 2 - 2시간)

하위 호환성 코드 제거:

```typescript
// Before (전환 기간)
const minLtr = matchData.minLtr ?? matchData.minNtrp ?? 5;

// After (정리 완료)
const minLtr = matchData.minLtr ?? 5;
```

---

### Phase 5: 최종 정리 및 검증 (Day 2-3 - 4시간)

#### 5.1 코드베이스 검증

```bash
# 남은 NTRP 참조 확인
grep -rn "ntrp\|Ntrp\|NTRP" src/ functions/src/

# 결과: 0개 (완전 마이그레이션 완료)
```

#### 5.2 레거시 필드 삭제 스크립트 (선택)

```javascript
// scripts/cleanup-legacy-ntrp-fields.js
// 전환 기간 후 실행

async function cleanupLegacyFields() {
  const db = admin.firestore();

  // users 컬렉션
  const users = await db.collection('users').get();
  for (const doc of users.docs) {
    await doc.ref.update({
      ntrpLevel: admin.firestore.FieldValue.delete(),
      'skillLevel.ntrp': admin.firestore.FieldValue.delete(),
    });
  }

  // lightning_matches 컬렉션
  const matches = await db.collection('lightning_matches').get();
  for (const doc of matches.docs) {
    await doc.ref.update({
      minNtrp: admin.firestore.FieldValue.delete(),
      maxNtrp: admin.firestore.FieldValue.delete(),
      hostNtrp: admin.firestore.FieldValue.delete(),
      partnerNtrp: admin.firestore.FieldValue.delete(),
    });
  }

  console.log('✅ Legacy fields cleaned up');
}
```

---

## ✅ 테스트 플랜

### Test Suite 1: 온보딩 플로우 (신규 사용자)

| #   | 테스트 케이스           | 예상 결과                   | 검증 방법      |
| --- | ----------------------- | --------------------------- | -------------- |
| 1.1 | LTR 레벨 선택 화면 표시 | 1-10 레벨 + 티어 표시       | UI 확인        |
| 1.2 | 자가 진단 시작          | LTR 진단 화면 표시          | UI 확인        |
| 1.3 | 진단 완료               | LTR 레벨 결과 표시          | UI 확인        |
| 1.4 | 프로필 저장             | `users/{uid}.ltrLevel` 저장 | Firestore 확인 |
| 1.5 | 레거시 필드 없음        | `ntrpLevel` 필드 없음       | Firestore 확인 |

### Test Suite 2: 매치 생성 (기존 사용자)

| #   | 테스트 케이스    | 예상 결과                 | 검증 방법      |
| --- | ---------------- | ------------------------- | -------------- |
| 2.1 | 단식 매치 생성   | `minLtr`, `maxLtr` 저장   | Firestore 확인 |
| 2.2 | 복식 매치 생성   | 파트너 LTR 평균 계산 정확 | 계산 검증      |
| 2.3 | LTR 범위 표시    | "LTR 5-7" 형식            | UI 확인        |
| 2.4 | 레거시 필드 없음 | `minNtrp`, `maxNtrp` 없음 | Firestore 확인 |

### Test Suite 3: 매치 참가 신청

| #   | 테스트 케이스    | 예상 결과          | 검증 방법    |
| --- | ---------------- | ------------------ | ------------ |
| 3.1 | 적합 LTR 신청    | 신청 성공          | 앱 동작 확인 |
| 3.2 | 부적합 LTR 신청  | 에러 메시지 + 거부 | UI 확인      |
| 3.3 | 에러 메시지 내용 | "LTR 불일치" 표시  | 번역 확인    |

### Test Suite 4: 프로필 화면

| #   | 테스트 케이스      | 예상 결과                     | 검증 방법      |
| --- | ------------------ | ----------------------------- | -------------- |
| 4.1 | 내 프로필 LTR 표시 | "LTR 7" 형식                  | UI 확인        |
| 4.2 | 타 유저 프로필 LTR | "LTR 5" 형식                  | UI 확인        |
| 4.3 | LTR 수정           | Firestore `ltrLevel` 업데이트 | Firestore 확인 |

### Test Suite 5: 발견(Discovery) 화면

| #   | 테스트 케이스      | 예상 결과           | 검증 방법 |
| --- | ------------------ | ------------------- | --------- |
| 5.1 | LTR 필터링         | 범위 내 매치만 표시 | UI 확인   |
| 5.2 | 매치 카드 LTR 표시 | "LTR 4-6" 형식      | UI 확인   |

### Test Suite 6: 하위 호환성 (전환 기간)

| #   | 테스트 케이스                 | 예상 결과       | 검증 방법    |
| --- | ----------------------------- | --------------- | ------------ |
| 6.1 | 기존 매치 조회 (minNtrp 필드) | 정상 표시       | 앱 동작 확인 |
| 6.2 | 기존 유저 프로필 (ntrpLevel)  | LTR로 변환 표시 | UI 확인      |

### Test Suite 7: AI 챗봇

| #   | 테스트 케이스       | 예상 결과          | 검증 방법   |
| --- | ------------------- | ------------------ | ----------- |
| 7.1 | LTR 관련 질문       | LTR 스케일로 응답  | 챗봇 테스트 |
| 7.2 | 파트너 갭 규칙 질문 | "±2 LTR 이내" 응답 | 챗봇 테스트 |

### Test Suite 8: 번역 검증 (10개 언어)

| 언어            | 확인 항목                        |
| --------------- | -------------------------------- |
| 영어 (en)       | "LTR Level", "Your LTR: {{ltr}}" |
| 한국어 (ko)     | "LTR 레벨", "내 LTR: {{ltr}}"    |
| 스페인어 (es)   | "Nivel LTR"                      |
| 중국어 (zh)     | "LTR 等级"                       |
| 일본어 (ja)     | "LTRレベル"                      |
| 프랑스어 (fr)   | "Niveau LTR"                     |
| 독일어 (de)     | "LTR-Stufe"                      |
| 이탈리아어 (it) | "Livello LTR"                    |
| 포르투갈어 (pt) | "Nível LTR"                      |
| 러시아어 (ru)   | "Уровень LTR"                    |

---

## ⚠️ 롤백 플랜

### 시나리오 1: Cloud Functions 문제

```bash
# 이전 버전으로 롤백
firebase functions:delete <function-name>
git checkout HEAD~1 -- functions/
cd functions && npm run build && firebase deploy --only functions
```

### 시나리오 2: 클라이언트 문제

```bash
# TestFlight: 이전 빌드 활성화
# 웹: 이전 커밋으로 체크아웃 후 재배포
git checkout <previous-commit>
npm run build
```

### 시나리오 3: Firestore 데이터 문제

```bash
# 백업에서 복원
firebase firestore:import gs://your-bucket/backup-YYYYMMDD
```

---

## 📊 리스크 분석

| 리스크                | 확률 | 영향도 | 대응 방안                 |
| --------------------- | ---- | ------ | ------------------------- |
| 기존 유저 데이터 손실 | 낮음 | 높음   | 마이그레이션 전 백업 필수 |
| 하위 호환성 실패      | 중간 | 중간   | 양방향 폴백 로직 구현     |
| 번역 누락             | 낮음 | 낮음   | 번역 키 변경 최소화       |
| 빌드 실패             | 중간 | 중간   | 단계별 테스트             |

---

## 📅 예상 일정

| Phase    | 작업                        | 예상 시간           | 담당               |
| -------- | --------------------------- | ------------------- | ------------------ |
| Phase 1  | Cloud Functions 하위 호환성 | 4시간               | 🛡️ Captain America |
| Phase 2  | Firestore 마이그레이션      | 2시간               | 🛡️ Captain America |
| Phase 3  | 클라이언트 코드 수정        | 12시간              | 🛡️ Captain America |
| Phase 4  | Cloud Functions 정리        | 2시간               | 🛡️ Captain America |
| Phase 5  | 테스트 및 검증              | 4시간               | 🛡️ Captain America |
| **총합** |                             | **약 24시간 (3일)** |                    |

---

## ✅ 승인 체크리스트

마이그레이션 시작 전 확인:

- [ ] Firestore 프로덕션 백업 완료
- [ ] 모든 테스트 케이스 준비
- [ ] 롤백 절차 숙지
- [ ] 팀원 공지 완료
- [ ] 유지보수 시간대 확보 (최소 4시간)

---

## 🚀 다음 단계

이 계획이 **승인**되면:

1. Phase 1부터 순차적으로 진행
2. 각 Phase 완료 후 중간 점검
3. 모든 테스트 통과 확인
4. 최종 배포 및 모니터링

**승인 요청**: 위 계획을 검토하시고 승인해 주세요! 🙏

---

**작성**: Kim (AI Architect)
**검토**: 대기 중
**승인**: 대기 중
