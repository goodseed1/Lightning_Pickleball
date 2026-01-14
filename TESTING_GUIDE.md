# 스코어 동기화 테스트 가이드

## 📋 테스트 개요

호스트와 참가자 간 스코어 표시 동기화 문제를 해결한 후, 실제로 정상 작동하는지 확인하는 테스트 가이드입니다.

## 🧪 테스트 설정

### 테스트 대상 이벤트
- **Event ID**: `PG4ZjAIqZlVclqmbLzXG` (번매6)
- **Host User ID**: `zw9zD7oNhSXsQuhBVEsGrUSbknY2`
- **Participant User ID**: `Vr5z2suh9TZl3eQZfukPhLW6Ont1`

## 🔧 Firebase 콘솔에서 테스트 데이터 추가

### Step 1: Firebase 콘솔 접속
1. [Firebase Console](https://console.firebase.google.com) 열기
2. 프로젝트 선택
3. Firestore Database 메뉴로 이동

### Step 2: 이벤트 문서 찾기
1. `events` 컬렉션 클릭
2. 문서 ID `PG4ZjAIqZlVclqmbLzXG` 검색
3. 해당 문서 클릭하여 편집 모드 진입

### Step 3: 매치 결과 데이터 추가
문서에 다음 필드들을 추가하거나 수정:

```json
{
  "result": {
    "winnerId": "zw9zD7oNhSXsQuhBVEsGrUSbknY2",
    "loserId": "Vr5z2suh9TZl3eQZfukPhLW6Ont1",
    "score": "6-2, 6-2",
    "recordedAt": [current timestamp],
    "recordedBy": "zw9zD7oNhSXsQuhBVEsGrUSbknY2"
  },
  "status": "completed",
  "completedAt": [current timestamp]
}
```

### Step 4: 문서 저장
- 변경사항 저장 버튼 클릭
- Firestore에 즉시 반영됨

## 📱 앱에서 테스트 검증

### Step 1: 앱 새로고침
- 앱을 다시 시작하거나 해당 화면을 새로고침

### Step 2: 호스트 관점 확인
1. MyProfile 화면으로 이동
2. "Hosted Activities" 탭 선택
3. 번매6 이벤트에서 다음 내용 확인:
   - ✅ **승리 6-2, 6-2** (녹색 배경)
   - ✅ 스코어가 정확히 표시됨

### Step 3: 참가자 관점 확인
1. MyProfile 화면으로 이동
2. "Applied Activities" 탭 선택
3. 번매6 이벤트에서 다음 내용 확인:
   - ✅ **패배 6-2, 6-2** (빨간색 배경)
   - ✅ 호스트와 동일한 스코어 정보 표시

## 🔍 디버깅 로그 확인

앱 실행 중 콘솔에서 다음 로그들을 확인:

### EventCard 디버깅 로그
```
🧪 [EventCard] Test event detected: PG4ZjAIqZlVclqmbLzXG
testData: {
  isTestEvent: true,
  hasResultField: true,
  resultField: { winnerId: "...", score: "6-2, 6-2" }
}
```

### ActivityService 디버깅 로그
```
🧪 [ActivityService.getHostedEvents] Test event detected:
hasResult: true
mappedMatchResult: { score: "6-2, 6-2", hostResult: "win" }

🧪 [subscribeToAppliedEvents] Mapped result field for test event:
hasResult: true
mappedMatchResult: { score: "6-2, 6-2", hostResult: "win" }
```

## ✅ 성공 기준

### 1. 데이터 매핑 성공
- ✅ `result` 필드가 `matchResult`로 정확히 변환
- ✅ 호스트와 참가자 모두 동일한 `matchResult` 접근
- ✅ `hostResult` 필드가 올바르게 계산됨

### 2. UI 표시 성공
- ✅ 호스트: "승리 6-2, 6-2" (녹색)
- ✅ 참가자: "패배 6-2, 6-2" (빨간색)
- ✅ 스코어 정보 일치

### 3. 실시간 동기화 성공
- ✅ Firebase 업데이트 후 즉시 반영
- ✅ 두 사용자 모두 동시에 업데이트 확인

## 🧪 추가 테스트 시나리오

### 시나리오 1: 참가자 승리
```json
{
  "result": {
    "winnerId": "Vr5z2suh9TZl3eQZfukPhLW6Ont1",
    "loserId": "zw9zD7oNhSXsQuhBVEsGrUSbknY2",
    "score": "6-3, 7-5"
  }
}
```
- 호스트: "패배 6-3, 7-5" (빨간색)
- 참가자: "승리 6-3, 7-5" (녹색)

### 시나리오 2: 3세트 경기
```json
{
  "result": {
    "winnerId": "zw9zD7oNhSXsQuhBVEsGrUSbknY2",
    "loserId": "Vr5z2suh9TZl3eQZfukPhLW6Ont1",
    "score": "7-6, 6-7, 6-4"
  }
}
```

## 🚨 문제 발생 시 확인사항

### 1. 스코어가 표시되지 않는 경우
- Firebase 문서의 `result` 필드 확인
- 콘솔 로그에서 `hasResult: true` 여부 확인
- `matchResult` 매핑 성공 로그 확인

### 2. 잘못된 승부 결과 표시
- `hostResult` 계산 로직 확인
- `winnerId`와 `hostId` 비교 결과 확인

### 3. 실시간 업데이트 안됨
- 네트워크 연결 상태 확인
- Firestore 구독 상태 확인
- 앱 재시작 후 재테스트

## 📞 문제 리포팅

테스트 중 문제 발생 시 다음 정보 수집:
1. 콘솔 로그 전체 복사
2. Firebase 문서 스크린샷
3. 앱 UI 스크린샷
4. 사용자 계정 정보