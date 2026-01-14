# 마이그레이션 계획: minNtrp/maxNtrp → minLtr/maxLtr

**작성일**: 2024-12-30
**작성자**: Kim (AI Architect)
**상태**: 계획 수립 완료

---

## 📋 개요

### 목적

- Firestore 필드명과 코드 변수명을 NTRP에서 LTR로 통일
- UI와 코드의 일관성 확보

### 영향 범위

- **Cloud Functions**: 2개 파일
- **클라이언트 코드**: 3개 파일
- **타입 정의**: 2개 파일
- **번역 파일**: 12개 파일 (JSON 키는 유지, 표시만 변경)
- **Firestore 데이터**: `lightning_matches` 컬렉션

---

## 🔧 Phase 1: Cloud Functions 수정

### 1.1 functions/src/utils/matchUtils.ts

| 변경 전                          | 변경 후            | 라인     |
| -------------------------------- | ------------------ | -------- |
| `minNtrp: number`                | `minLtr: number`   | 246, 247 |
| `maxNtrp: number`                | `maxLtr: number`   | 247      |
| 함수명 `validateMatchNtrp`       | `validateMatchLtr` | 242      |
| 모든 로컬 변수 `minNtrp/maxNtrp` | `minLtr/maxLtr`    | 다수     |

### 1.2 functions/src/triggers/createMatchAndInvite.ts

| 변경 전             | 변경 후            | 라인     |
| ------------------- | ------------------ | -------- |
| `minNtrp?: number`  | `minLtr?: number`  | 41       |
| `maxNtrp?: number`  | `maxLtr?: number`  | 42       |
| `matchData.minNtrp` | `matchData.minLtr` | 141, 198 |
| `matchData.maxNtrp` | `matchData.maxLtr` | 142, 199 |

### 1.3 하위 호환성 (Backward Compatibility)

```typescript
// 점진적 마이그레이션: 양쪽 필드 모두 지원
const minLtr = matchData.minLtr ?? matchData.minNtrp ?? 5;
const maxLtr = matchData.maxLtr ?? matchData.maxNtrp ?? 5;
```

---

## 🖥️ Phase 2: 클라이언트 코드 수정

### 2.1 src/screens/CreateEventForm.tsx

| 변경 전           | 변경 후                     |
| ----------------- | --------------------------- |
| `minNtrp: minLtr` | `minLtr: minLtr`            |
| `maxNtrp: maxLtr` | `maxLtr: maxLtr`            |
| 주석 업데이트     | "Server uses minLtr/maxLtr" |

### 2.2 src/components/cards/EventCard.tsx

| 변경 전                       | 변경 후           |
| ----------------------------- | ----------------- |
| `event.minNtrp`               | `event.minLtr`    |
| `event.maxNtrp`               | `event.maxLtr`    |
| 인터페이스 `minNtrp?: number` | `minLtr?: number` |

### 2.3 src/contexts/DiscoveryContext.tsx

| 변경 전            | 변경 후           |
| ------------------ | ----------------- |
| `minNtrp?: number` | `minLtr?: number` |
| `maxNtrp?: number` | `maxLtr?: number` |
| `data.minNtrp`     | `data.minLtr`     |
| `data.maxNtrp`     | `data.maxLtr`     |

---

## 🌐 Phase 3: 번역 파일 (JSON 키는 유지)

번역 파일의 **placeholder 변수명**도 변경:

### 변경할 파일들

- `src/locales/en.json`
- `src/locales/ko.json`
- `src/locales/es.json`
- `src/locales/zh.json`
- `src/locales/ja.json`
- `src/locales/fr.json`
- `src/locales/de.json`
- `src/locales/it.json`
- `src/locales/pt.json`
- `src/locales/ru.json`
- `src/locales/vi.json` (있다면)

### 변경 내용

```json
// Before
"levelMismatch": "Level mismatch (Your LTR: {{userNtrp}}, Allowed: {{minNtrp}}~{{maxNtrp}})"

// After
"levelMismatch": "Level mismatch (Your LTR: {{userLtr}}, Allowed: {{minLtr}}~{{maxLtr}})"
```

---

## 🗄️ Phase 4: Firestore 마이그레이션 스크립트

### 4.1 마이그레이션 스크립트 작성

```javascript
// scripts/migrate-ntrp-to-ltr-fields.js
const admin = require('firebase-admin');

async function migrateMatchFields() {
  const db = admin.firestore();
  const matchesRef = db.collection('lightning_matches');
  const snapshot = await matchesRef.get();

  let migrated = 0;
  const batch = db.batch();

  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.minNtrp !== undefined || data.maxNtrp !== undefined) {
      batch.update(doc.ref, {
        minLtr: data.minNtrp,
        maxLtr: data.maxNtrp,
        // Keep old fields for backward compatibility during transition
      });
      migrated++;
    }
  });

  await batch.commit();
  console.log(`Migrated ${migrated} documents`);
}
```

### 4.2 마이그레이션 순서

1. 새 필드 추가 (minLtr, maxLtr) - 기존 필드 유지
2. 서버 배포 (양쪽 필드 지원)
3. 클라이언트 배포 (새 필드 사용)
4. 일정 기간 후 이전 필드 삭제 (선택)

---

## 📱 Phase 5: 배포 순서

### 5.1 안전한 배포 순서

```
1. Cloud Functions 배포 (하위 호환성 포함)
   └─ minLtr/maxLtr 지원 + minNtrp/maxNtrp 폴백

2. Firestore 마이그레이션 실행
   └─ 기존 문서에 minLtr/maxLtr 필드 추가

3. 클라이언트 배포
   └─ 새 필드명 사용

4. (선택) 정리
   └─ 이전 필드 참조 코드 제거
   └─ Firestore 이전 필드 삭제
```

---

## ✅ 테스트 계획

### 테스트 1: 단식 매치 생성

| 단계              | 예상 결과                          |
| ----------------- | ---------------------------------- |
| 1. 단식 매치 생성 | minLtr/maxLtr 필드로 저장됨        |
| 2. Firestore 확인 | `minLtr: 7, maxLtr: 7` 형태로 저장 |
| 3. 매치 조회      | EventCard에서 정상 표시            |
| 4. 신청 시도      | LTR ±1 범위 외 유저는 거부됨       |

### 테스트 2: 복식 매치 생성

| 단계                           | 예상 결과                   |
| ------------------------------ | --------------------------- |
| 1. 파트너 선택 (LTR 5 + LTR 7) | 갭 2 이내로 허용            |
| 2. 매치 생성                   | minLtr = maxLtr = 6 (평균)  |
| 3. 상대팀 매칭                 | 팀 평균 LTR 5-7 범위만 허용 |

### 테스트 3: 하위 호환성

| 단계                             | 예상 결과             |
| -------------------------------- | --------------------- |
| 1. 기존 매치 조회 (minNtrp 필드) | 정상 표시 (폴백 작동) |
| 2. 기존 매치 신청                | 정상 작동             |

### 테스트 4: 양학 방지

| 단계                                 | 예상 결과               |
| ------------------------------------ | ----------------------- |
| 1. LTR 8 유저가 LTR 3 매치 생성 시도 | 서버에서 거부           |
| 2. 에러 메시지 확인                  | "양학 방지" 메시지 표시 |

### 테스트 5: 번역 확인

| 단계                              | 예상 결과                   |
| --------------------------------- | --------------------------- |
| 1. 영어로 레벨 불일치 메시지 확인 | "Your LTR: 5, Allowed: 7~9" |
| 2. 한국어로 확인                  | "내 LTR: 5, 허용: 7~9"      |

---

## ⚠️ 롤백 계획

### 문제 발생 시

1. Cloud Functions를 이전 버전으로 롤백

   ```bash
   firebase functions:delete createMatchAndInvite
   firebase deploy --only functions:createMatchAndInvite --force
   ```

2. 클라이언트는 이전 빌드로 롤백
   - TestFlight: 이전 빌드 활성화
   - 웹: 이전 커밋으로 체크아웃 후 재배포

---

## 📅 예상 소요 시간

| Phase    | 작업                  | 시간              |
| -------- | --------------------- | ----------------- |
| Phase 1  | Cloud Functions 수정  | 30분              |
| Phase 2  | 클라이언트 코드 수정  | 30분              |
| Phase 3  | 번역 파일 업데이트    | 20분              |
| Phase 4  | 마이그레이션 스크립트 | 20분              |
| Phase 5  | 배포 및 테스트        | 30분              |
| **총합** |                       | **약 2시간 30분** |

---

## 🚀 실행 준비 완료

이 계획이 승인되면 Phase 1부터 순차적으로 진행합니다.

**승인 후 진행할 작업:**

1. ✅ Cloud Functions 수정
2. ✅ 클라이언트 코드 수정
3. ✅ 번역 파일 업데이트
4. ✅ 마이그레이션 스크립트 작성
5. ✅ 배포 및 테스트
