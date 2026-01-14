# E2E Test Scenario: Core Match Flow

> **Lightning Tennis 핵심 매치 플로우 E2E 테스트 시나리오**
>
> 이 문서는 번개매치 생성부터 랭킹 업데이트까지의 완전한 사용자 여정을 단계별로 기술합니다.
> 향후 자동화된 E2E 테스트 (Detox, Maestro 등)의 청사진 역할을 합니다.

---

## 📋 테스트 개요

### 🎯 테스트 목표

- **핵심 매치 플로우**: 생성 → 참가 → 완료 → 랭킹 업데이트 전 과정 검증
- **사용자 간 상호작용**: 두 명의 실제 사용자 시나리오 시뮬레이션
- **데이터 일관성**: UI 변경사항과 백엔드 데이터 동기화 확인

### 👥 테스트 계정

- **Host User (매치 생성자):** `host-tester@lightningtennis.com`
- **Participant User (참가자):** `participant-tester@lightningtennis.com`

### ⏱️ 예상 테스트 시간

- **수동 실행**: 약 8-10분
- **자동화 실행**: 약 3-5분

---

## 🚀 Phase 1: 매치 생성 (Host User)

### 📱 단계별 시나리오

1. **앱 시작 & 로그인**

   ```
   ✓ 앱 실행
   ✓ 로그인 화면에서 host-tester@lightningtennis.com 로그인
   ✓ 메인 피드 화면 진입 확인
   ```

2. **매치 생성 화면 이동**

   ```
   ✓ 하단 탭바에서 '+' (Create) 버튼 탭
   ✓ 'CreateMatchScreen' 진입 확인
   ✓ '번개 매치 생성' 헤더 표시 확인
   ```

3. **매치 정보 입력**

   ```
   매치 유형: 🏆 번개 매치 (랭크드) 선택
   제목: "E2E 자동화 테스트 매치"
   설명: "자동화된 테스트를 위한 매치입니다"
   장소: "테스트 테니스장"
   날짜: 내일 날짜 선택
   시작시간: 오후 3:00 선택
   종료시간: 오후 5:00 선택
   최대참가자: 4명 (슬라이더 조정)
   최소 LTR: 3.0 선택
   최대 LTR: 4.5 선택
   ```

4. **매치 생성 완료**

   ```
   ✓ '매치 생성하기' 버튼 탭
   ✓ 로딩 인디케이터 표시 확인
   ✓ 성공 알림 "이벤트가 성공적으로 생성되었습니다!" 확인
   ✓ 이전 화면으로 자동 이동 확인
   ```

5. **로그아웃**
   ```
   ✓ 프로필 탭 이동
   ✓ 설정 → 로그아웃 실행
   ```

### 🔍 검증 포인트

- [ ] 매치가 Firestore에 정상 저장됨
- [ ] 매치 상태가 'scheduled'로 설정됨
- [ ] 생성자가 자동으로 participants 배열에 추가됨

---

## 🔍 Phase 2: 매치 발견 & 참가 신청 (Participant User)

### 📱 단계별 시나리오

1. **로그인 & 매치 검색**

   ```
   ✓ participant-tester@lightningtennis.com 로그인
   ✓ 메인 피드에서 매치 카드 확인
   ✓ "E2E 자동화 테스트 매치" 제목 확인
   ```

2. **매치 상세 확인**

   ```
   ✓ 매치 카드 탭하여 상세 화면 진입
   ✓ 매치 정보 (시간, 장소, LTR 범위) 표시 확인
   ✓ '참가 신청' 버튼 활성화 상태 확인
   ```

3. **참가 신청**

   ```
   ✓ '참가 신청' 버튼 탭
   ✓ 신청 확인 다이얼로그 표시
   ✓ '확인' 버튼 탭
   ✓ 버튼 텍스트가 '신청 대기중'으로 변경 확인
   ```

4. **로그아웃**
   ```
   ✓ 프로필 탭에서 로그아웃
   ```

### 🔍 검증 포인트

- [ ] 참가 신청이 waitingList에 추가됨
- [ ] 실시간으로 매치 데이터 업데이트됨
- [ ] 알림이 매치 생성자에게 전송됨

---

## ✅ Phase 3: 참가 승인 & 매치 시작 (Host User)

### 📱 단계별 시나리오

1. **재로그인 & 알림 확인**

   ```
   ✓ host-tester@lightningtennis.com 재로그인
   ✓ 새로운 참가 신청 알림 확인
   ✓ 나의 활동 → 생성한 매치 진입
   ```

2. **참가 신청 승인**

   ```
   ✓ 대기 중인 참가자 목록에서 participant-tester 확인
   ✓ '승인' 버튼 탭
   ✓ 참가자가 '확정된 참가자' 목록으로 이동 확인
   ✓ 매치 상태가 'confirmed'로 변경 확인
   ```

3. **매치 완료 & 스코어 입력**
   ```
   ✓ '매치 완료' 버튼 탭
   ✓ 스코어 입력 화면 진입
   ✓ 승자: Host User 선택
   ✓ 세트 스코어: 6-4, 6-2 입력
   ✓ '결과 제출' 버튼 탭
   ✓ 매치 상태가 'completed'로 변경 확인
   ```

### 🔍 검증 포인트

- [ ] 참가자가 waitingList에서 participants로 이동
- [ ] 매치 완료 후 ELO 계산 서비스 자동 실행
- [ ] 활동 피드에 매치 결과 자동 생성

---

## 📊 Phase 4: 랭킹 업데이트 & 최종 검증

### 📱 Host User 검증

1. **승자 스탯 확인**
   ```
   ✓ 프로필 → 나의 통계 진입
   ✓ 승리 횟수 +1 증가 확인
   ✓ ELO 레이팅 증가 확인 (예: 1200 → 1215)
   ✓ 승률 재계산 확인
   ✓ 현재 연승 기록 업데이트 확인
   ```

### 📱 Participant User 검증

2. **패자 스탯 확인**
   ```
   ✓ participant-tester 계정으로 재로그인
   ✓ 프로필 → 나의 통계 진입
   ✓ 패배 횟수 +1 증가 확인
   ✓ ELO 레이팅 감소 확인 (예: 1150 → 1135)
   ✓ 승률 재계산 확인
   ```

### 🌐 피드 & 활동 검증

3. **활동 피드 확인**
   ```
   ✓ 메인 피드에서 새로운 매치 결과 포스트 확인
   ✓ "host-tester님이 participant-tester님을 6-4, 6-2로 이겼습니다" 표시
   ✓ ELO 변동사항 표시 확인
   ✓ 좋아요, 댓글 기능 작동 확인
   ```

### 🔍 최종 검증 포인트

- [ ] 양쪽 사용자의 전체 통계 정확성
- [ ] 리더보드 순위 자동 업데이트
- [ ] 매치 히스토리 정확한 기록
- [ ] 알림 시스템 정상 작동
- [ ] 데이터베이스 일관성 유지

---

## 🤖 자동화 테스트 구현 가이드

### 📋 Detox 설정 예시

```javascript
// e2e/core-match-flow.test.js
describe('Core Match Flow E2E', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should complete full match creation to ranking update flow', async () => {
    // Phase 1: 매치 생성
    await element(by.id('loginEmail')).typeText('host-tester@lightningtennis.com');
    await element(by.id('loginPassword')).typeText('testpassword123');
    await element(by.id('loginButton')).tap();

    await waitFor(element(by.id('createButton')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id('createButton')).tap();

    // 매치 정보 입력 로직...
    await element(by.id('matchTitle')).typeText('E2E 자동화 테스트 매치');
    await element(by.id('submitButton')).tap();

    // Phase 2: 참가 신청 (계정 전환)
    await element(by.id('logoutButton')).tap();
    await element(by.id('loginEmail')).replaceText('participant-tester@lightningtennis.com');
    // ... 참가 신청 로직

    // Phase 3 & 4: 승인 및 검증
    // ... 나머지 시나리오 구현

    // 최종 검증
    await expect(element(by.id('winCount'))).toHaveText('11'); // 기존 10승 + 1
    await expect(element(by.id('eloRating'))).toContain('121'); // ELO 증가 확인
  });
});
```

### 🎯 핵심 테스트 셀렉터

```javascript
// 중요한 UI 요소들에 testID 부여 필요
const testIDs = {
  // 로그인
  loginEmail: 'loginEmail',
  loginPassword: 'loginPassword',
  loginButton: 'loginButton',

  // 매치 생성
  createButton: 'createButton',
  matchTitle: 'matchTitle',
  submitButton: 'submitButton',

  // 매치 참가
  joinButton: 'joinButton',
  approveButton: 'approveButton',

  // 스탯 검증
  winCount: 'winCount',
  lossCount: 'lossCount',
  eloRating: 'eloRating',
};
```

---

## 📈 성공 기준

### ✅ 필수 통과 조건

1. **기능적 완성도**: 모든 단계가 에러 없이 완료
2. **데이터 일관성**: UI와 백엔드 데이터 100% 일치
3. **성능 기준**: 각 단계별 3초 이내 응답
4. **사용자 경험**: 로딩 상태 및 피드백 적절히 표시

### 📊 측정 지표

- **테스트 실행 시간**: 5분 이내
- **성공률**: 95% 이상
- **에러 복구**: 실패 시 명확한 에러 메시지 제공

---

## 🚨 알려진 이슈 & 주의사항

### ⚠️ 테스트 환경 준비사항

1. **Firebase 테스트 프로젝트** 설정 필요
2. **테스트 계정** 사전 생성 및 초기 스탯 설정
3. **네트워크 상태** 안정적인 인터넷 연결 필수
4. **디바이스 설정** 시간대, 언어 설정 통일

### 🔧 트러블슈팅

- **매치를 찾을 수 없는 경우**: Firebase 동기화 대기 (최대 5초)
- **ELO 계산 오류**: eloRatingService 로그 확인
- **알림 미수신**: 푸시 알림 권한 및 토큰 상태 점검

---

**마지막 업데이트**: 2025년 9월 3일  
**작성자**: Lightning Tennis Development Team  
**버전**: 1.0.0

> 💡 **참고**: 이 시나리오는 실제 사용자 행동 패턴을 기반으로 작성되었으며,
> 정기적으로 업데이트하여 새로운 기능과 변경사항을 반영해야 합니다.
