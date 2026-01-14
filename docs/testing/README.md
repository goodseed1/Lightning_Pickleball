# 🧪 Lightning Pickleball Testing Strategy

> **다계층 테스트 전략으로 구축된 견고한 테스트 안전망**

## 📋 테스트 아키텍처 개요

Lightning Pickleball는 **3계층 테스트 전략**을 통해 앱의 안정성과 품질을 보장합니다:

```
🏗️ 3-Layer Testing Architecture
┌─────────────────────────────────────┐
│  E2E Layer (종합 테스트)               │  ← 실제 사용자 시나리오 전체 검증
├─────────────────────────────────────┤
│  Service Layer (두뇌 테스트)          │  ← 비즈니스 로직과 계산 정확성 검증
├─────────────────────────────────────┤
│  UI Layer (UI 테스트)                │  ← 컴포넌트 렌더링과 사용자 상호작용
└─────────────────────────────────────┘
```

## 🎯 각 계층의 역할

### 1️⃣ UI Layer (UI 안전망)

- **목적**: React 컴포넌트의 렌더링과 사용자 상호작용 검증
- **도구**: Jest + React Testing Library
- **범위**: 폼 입력, 버튼 클릭, 조건부 렌더링
- **예시**: `CreateMatchScreen.test.tsx`

### 2️⃣ Service Layer (두뇌 안전망)

- **목적**: 핵심 비즈니스 로직과 계산의 수학적 정확성 검증
- **도구**: Jest (단순 단위 테스트)
- **범위**: ELO 계산, 매치 로직, 데이터 변환
- **예시**: `eloRatingService.test.ts`

### 3️⃣ E2E Layer (종합 안전망)

- **목적**: 실제 사용자 시나리오의 전체 플로우 검증
- **도구**: Detox, Maestro (계획)
- **범위**: 매치 생성부터 랭킹 업데이트까지 완전한 사용자 여정
- **문서**: `E2E-Match-Flow.md`

## 🚀 실행 가이드

### 개발 중 빠른 검증

```bash
# UI Layer 테스트 실행
npm test -- CreateMatchScreen.test.tsx

# Service Layer 테스트 실행
npm test -- eloRatingService.test.ts

# 모든 단위 테스트 실행
npm test
```

### 배포 전 전체 검증

```bash
# 전체 테스트 스위트 실행
npm test -- --coverage --watchAll=false

# E2E 테스트 실행 (구현 시)
npm run test:e2e
```

## 📊 현재 테스트 현황

### ✅ 완료된 테스트

| 계층    | 테스트 파일                  | 커버리지    | 상태    |
| ------- | ---------------------------- | ----------- | ------- |
| UI      | `CreateMatchScreen.test.tsx` | 6/6 통과    | ✅ 완료 |
| Service | `eloRatingService.test.ts`   | 10/10 통과  | ✅ 완료 |
| E2E     | `E2E-Match-Flow.md`          | 문서화 완료 | ✅ 완료 |

### 📈 테스트 메트릭

- **총 테스트 수**: 16개
- **성공률**: 100%
- **커버된 핵심 기능**: 매치 생성, ELO 계산, 사용자 플로우
- **검증된 시나리오**: 승/패/무승부, 경계값, 에러 처리

## 🎨 테스트 철학

### "요새를 짓듯 테스트하라"

각 계층은 서로 다른 관점에서 앱을 보호합니다:

- **UI Layer**: 사용자 인터페이스의 견고함
- **Service Layer**: 핵심 로직의 수학적 정확성
- **E2E Layer**: 전체 시스템의 통합된 동작

### 테스트 설계 원칙

1. **격리된 테스트**: 각 테스트는 독립적으로 실행 가능
2. **명확한 의도**: Given-When-Then 패턴 사용
3. **현실적 시나리오**: 실제 사용자 행동 패턴 반영
4. **빠른 피드백**: 개발 중 즉시 검증 가능

## 🔮 향후 계획

### Phase 1: 기반 강화 (완료)

- [x] UI Layer 테스트 구축
- [x] Service Layer 테스트 구축
- [x] E2E 시나리오 문서화

### Phase 2: 확장 (예정)

- [ ] E2E 자동화 테스트 구현 (Detox)
- [ ] 추가 서비스 테스트 (matchService, userService)
- [ ] 통합 테스트 (API 연동)

### Phase 3: 최적화 (예정)

- [ ] 시각적 회귀 테스트 (Storybook)
- [ ] 성능 테스트 (Lighthouse CI)
- [ ] 접근성 테스트 (axe-core)

## 📚 참고 자료

### 개발팀을 위한 가이드

- [Jest 공식 문서](https://jestjs.io/docs/getting-started)
- [React Testing Library 가이드](https://testing-library.com/docs/react-testing-library/intro/)
- [Detox E2E 테스트](https://wix.github.io/Detox/)

### 프로젝트 특화 문서

- [`E2E-Match-Flow.md`](./E2E-Match-Flow.md) - 상세한 E2E 테스트 시나리오
- [`../CLAUDE.md`](../../CLAUDE.md) - 프로젝트 전체 가이드
- [`../CHANGELOG.md`](../../CHANGELOG.md) - 개발 진행 상황

---

**"테스트는 코드의 신뢰성을 보장하는 가장 확실한 방법입니다."**

💡 **팁**: 새로운 기능을 개발할 때는 항상 해당 계층의 테스트를 먼저 작성하거나 업데이트하여 안전망을 유지하세요.
