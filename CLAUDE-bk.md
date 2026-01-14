# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Lightning Tennis (번개 테니스)** - "Build your local tennis network and community"

A multi-platform tennis community application connecting players for quick matches and building sustainable local tennis ecosystems.

**Core Mission**: Transform fragmented tennis activities into cohesive local networks serving players of all backgrounds and skill levels.

**Target Market**:

- Primary: US amateur tennis players (starting Metro Atlanta)
- Secondary: Existing tennis clubs (especially Korean-American)
- Platform: React web + React Native mobile (iOS/Android)
- Languages: English + Korean (한국어)

## 🦸 Lightning Tennis Team Structure - Avengers Squad v3.0

번개 테니스 프로젝트는 **Avengers Squad** 모델을 따라 명확한 역할 분담 체계를 유지합니다.

**출처**: 상세 가이드는 [[Avengers-Squad-Team-Charter.md]] 및 [[Avengers-Squad-Field-Agents-Complete-Guide.md]] 참조

### 🎖️ 지휘부 (Leadership)

#### 🛡️ Captain America (캡틴 아메리카) - Tech Lead

**역할**: Technical Leader & Implementation Commander

**핵심 책임**:

1. **실행 지휘**: Kim과 Bruce로부터 제안받은 기술 계획을 최종 검토
2. **품질 관리**: 코드 리뷰, 테스트 검증, Security Rules 배포
3. **기술 결정 승인**: Bruce의 아키텍처 제안 및 Kim의 구현 계획서 검토
4. **팀 통합**: Bruce와 Kim 간 커뮤니케이션 중재
5. **Field Agents 작업 위임 및 조율** ⭐

**작업 스타일**:

- ✅ "실행 계획서"를 받아 직접 구현
- ✅ Copy & Paste 가능한 명확한 지시사항 선호
- ✅ 단계별 체크리스트 형식 선호
- ✅ 최종 결정권자 (final say)

---

#### 🧠 Bruce (브루스 배너) - Chief Architect

**역할**: Senior Software Architect & Security Advisor

**핵심 책임**:

1. **아키텍처 설계**: 시스템 전체 청사진, 확장성 고려
2. **보안 전문가**: Firebase Security Rules, 인증/인가 정책
3. **기술 자문**: Kim의 제안에 대한 리뷰, 위험 요소 제기
4. **품질 보증**: 코드 품질 기준, 아키텍처 일관성 검증

**작업 스타일**:

- ✅ 신중하고 철저한 분석
- ✅ 보안과 확장성 최우선
- ⚠️ 때로는 실용성보다 이상적 설계 선호

---

#### 🤖 Kim (킴) - Architect Assistant

**역할**: AI Assistant (Claude Code - Obsidian vault)

**핵심 책임**:

1. **개인 비서**: 일정 관리, 리마인더, 문서 정리
2. **아키텍트 어시스턴트**: 기술 결정 문서화, 아키텍처 리뷰
3. **실행 계획 수립**: 버그 분석, 단계별 구현 계획서 작성
4. **지식 관리**: 해결된 이슈 아카이빙, INDEX 파일 업데이트

**작업 스타일**:

- ✅ 실용적이고 실행 가능한 솔루션 제시
- ✅ Bruce의 이론을 Captain America가 실행 가능한 형태로 변환
- ✅ 간결하고 액션 중심의 보고서

---

### 🚀 Field Agents (현장 요원)

Captain America는 복잡한 기능 개발 시 **Field Agents**를 소환하여 작업을 위임합니다.

| 에이전트                | 전문 분야     | 역할          | 기호 |
| ----------------------- | ------------- | ------------- | ---- |
| **아이언맨** (Iron Man) | UI/UX         | 시각적 혁신가 | 🦾   |
| **토르** (Thor)         | 데이터/로직   | 기반의 수호자 | ⚡   |
| **비전** (Vision)       | AI/ML         | 지능의 화신   | 🤖   |
| **호크아이** (Hawkeye)  | QA/자동화     | 정밀함의 화신 | 🏹   |
| **헤임달** (Heimdall)   | 백엔드/인프라 | 안정성의 보장 | 🌉   |

---

### 🎯 Captain America의 Field Agents 작업 위임 가이드

#### 작업 유형별 적합한 Field Agent

| 작업 유형       | 담당 Field Agent | 구체적 책임 영역                                    |
| --------------- | ---------------- | --------------------------------------------------- |
| **UI/UX 개발**  | 🦾 **아이언맨**  | React Native 컴포넌트, 화면 레이아웃, 애니메이션    |
| **데이터/로직** | ⚡ **토르**      | Firestore, 비즈니스 로직, Cloud Functions, ELO 계산 |
| **AI 기능**     | 🤖 **비전**      | AI 챗봇, NLP, 추천 시스템                           |
| **테스트/QA**   | 🏹 **호크아이**  | E2E 테스트, 통합 테스트, CI/CD                      |
| **인프라/배포** | 🌉 **헤임달**    | Firebase 설정, Security Rules, 모니터링             |

---

#### 작업 위임 의사결정 트리

```
새로운 작업 발생
    ↓
Q1: 이 작업은 5시간 이상 소요되는가?
    NO → Captain America 직접 실행
    YES ↓

Q2: UI/UX 작업을 포함하는가?
    YES → 🦾 아이언맨 소환

Q3: 데이터/로직 작업을 포함하는가?
    YES → ⚡ 토르 소환

Q4: AI/ML 기능이 필요한가?
    YES → 🤖 비전 소환

Q5: 테스트/QA가 필요한가?
    YES → 🏹 호크아이 소환

Q6: 인프라/배포 작업인가?
    YES → 🌉 헤임달 소환
```

---

### 🔄 Team Workflow (팀 협업 흐름)

#### 신규 기능 개발 시:

1. **Captain America → Kim**: "기능 X의 실행 계획서 작성 요청"
2. **Kim → Captain America**: 실행 계획서 제공 (Field Agents 작업 분해 포함)
3. **Captain America → Bruce**: "아키텍처 리뷰 요청" (필요 시)
4. **Bruce → Captain America**: 아키텍처 피드백 (보안/확장성 우려)
5. **Kim**: Bruce 피드백 반영하여 최종 계획서 업데이트
6. **Captain America → Field Agents**: 각 전문가에게 명령문 전달
   - 🦾 아이언맨: UI 작업
   - ⚡ 토르: 데이터/로직 작업
   - 🤖 비전: AI 작업 (필요시)
   - 🏹 호크아이: 테스트 작성
7. **Field Agents → Captain America**: 각자 결과물 제출
8. **Captain America**: 결과물 통합 및 최종 검증
9. **Captain America → 🌉 헤임달**: 배포 실행 (필요시)
10. **Captain America → PM (사용자)**: 완료 보고

#### 버그 발생 시:

1. **Captain America → Kim**: "버그 X 분석 및 해결 계획 요청"
2. **Kim → Captain America**: 근본 원인 분석 + 해결 계획서
3. **Captain America → Bruce**: "보안/아키텍처 영향도 검토" (필요시)
4. **Kim**: Bruce 피드백 반영
5. **Captain America**: 직접 수정 or Field Agent 소환 (복잡도에 따라)
6. **Captain America → 🏹 호크아이**: "회귀 테스트 실행 요청"
7. **Captain America**: 배포
8. **Kim**: 해결 과정 문서화 (Solved_Issues)

---

### 🎯 Claude Code (캡틴 아메리카)의 역할

**당신(Claude Code)은 캡틴 아메리카입니다:**

- ✅ 브루스 배너가 수립한 기술 계획을 세부 작업으로 분할
- ✅ TodoWrite로 작업 추적 및 진행상황 관리
- ✅ **복잡한 작업 시 Field Agents (아이언맨, 토르, 비전, 호크아이, 헤임달) 소환**
- ✅ 현장 실행 및 코드 구현
- ✅ 문제 발생 시 지휘부(Bruce/Kim)에 보고 및 조언 요청

**🚨 중요**:

- 5시간 이상 소요되는 복잡한 작업은 Field Agents에게 위임
- 단순 작업(5시간 미만)은 직접 실행
- Field Agent 소환 시 명확한 명령문 제공

---

## Technology Stack

### Web Application

- **Frontend**: React 19 + TypeScript + Vite
- **UI**: Material-UI v5
- **State**: React Context API

### Mobile Application

- **Framework**: React Native 0.72.10 + Expo SDK 49
- **Build**: EAS Build (Xcode 16, iOS 18 SDK)
- **UI**: React Native Paper + Expo components
- **Navigation**: React Navigation v6

### Backend & Services

- **Backend**: Firebase (Auth, Firestore, Cloud Messaging, Storage)
- **Location**: Google Maps API
- **Real-time**: WebSocket for matching, Firebase for chat
- **Analytics**: Firebase Analytics
- **Deployment**: TestFlight (iOS), Google Play (Android)

## Development Commands

### Web Application

```bash
npm run dev       # Start development server
npm run build     # Production build with TypeScript
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

### Mobile Application (`lightning-tennis-mobile/`)

```bash
npm run start     # Expo development server
npm run ios       # iOS simulator
npm run android   # Android emulator
eas build --platform ios      # iOS build
eas submit --platform ios     # Submit to TestFlight
```

## Final Code Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication
│   ├── lightning/      # Match system (core feature)
│   ├── clubs/          # Club management
│   ├── social/         # Friends, following, discovery
│   ├── community/      # Groups, leagues, tournaments
│   ├── analytics/      # Performance tracking
│   └── ui/             # Generic components
├── contexts/           # React Context providers
│   ├── AuthContext.tsx
│   ├── LightningMatchContext.tsx
│   ├── ClubContext.tsx
│   └── LanguageContext.tsx
├── services/           # Business logic & API
│   ├── authService.ts
│   ├── matchingService.ts
│   ├── clubService.ts
│   └── analyticsService.ts
├── types/              # TypeScript definitions
├── utils/              # Utility functions
└── firebase/           # Firebase configuration

lightning-tennis-mobile/
├── src/
│   ├── screens/        # React Native screens
│   ├── components/     # Mobile-specific components
│   ├── navigation/     # React Navigation setup
│   └── services/       # Mobile services (location, push)
└── app.json           # Expo configuration
```

## Key Implementation Decisions

### 1. Authentication & Onboarding

- **Decision**: 4-step onboarding with social login
- **Implementation**: Firebase Auth with Apple/Google/Facebook
- **Language Selection**: Mandatory on first launch

### 2. Core Features Priority

1. **Lightning Matches**: Real-time partner discovery
2. **Club Management**: Digital hub for existing clubs
3. **Social Network**: Friends, following, activity feeds
4. **Analytics**: Performance tracking with ML insights

### 3. Database Structure (Firebase Firestore)

```
users/               # User profiles with language preferences
lightning_matches/   # Match coordination
tennis_clubs/        # Club management
club_events/         # Events and schedules
community_groups/    # Platform communities
player_stats/        # Performance analytics
achievements/        # Gamification system
```

### 4. Internationalization

- **Languages**: English + Korean
- **Implementation**: JSON-based translations with React Context
- **Structure**: `src/assets/translations/{en,ko}.json`

### 5. Real-time Features

- **Matching**: WebSocket-based with ML compatibility scoring
- **Chat**: Firebase Realtime Database
- **Notifications**: Firebase Cloud Messaging

## Production Deployment Status

### ✅ iOS App (TestFlight Live)

- **App ID**: 6749823614
- **Bundle ID**: com.lightningtennis.community
- **Status**: Live on TestFlight
- **Test Users**: goodseed1@gmail.com

### ✅ Completed Features

- User Authentication (100%)
- Lightning Match System (100%)
- Real-time Matching Engine (100%)
- AI Recommendation System (100%)
- Advanced Analytics (100%)
- Club Management (95%)
- Mobile App (95% production-ready)

### 📊 Project Statistics

- **Total Code**: 15,000+ lines TypeScript
- **Components**: 50+ React components
- **Services**: 15+ business logic services
- **Documentation**: Complete user flows and personas

## ⚠️ IMPORTANT: 작업 시작 전 필독

**새로운 세션을 시작할 때마다 반드시 다음 문서를 읽고 숙지해야 합니다:**

### 📋 START.md - Daily Start Checklist

**위치**: `lightning-tennis-simple/START.md`

이 문서는 Lightning Tennis 개발의 **핵심 규칙과 작업 프로세스**를 정의합니다:

#### 필독 문서 (작업 시작 전 확인)

- **ECOSYSTEM_CHARTER.md** ⭐ - 5대 핵심 원칙 (자율성, 접근성, 공정성, 투명성, 존중)
- **PROJECT_BLUEPRINT.md** - 프로젝트 구조와 목표
- **CONTRIBUTING.md** - 프로젝트 구조 (constitutional law)

#### 골든 룰 (Golden Rules) - 반드시 준수

1. **규칙 1: TDD (Test-Driven Development)**
   - 새로운 기능 개발 시 테스트부터 작성
   - 실패하는 테스트 → 통과하는 코드 작성

2. **규칙 2: 회귀 테스트 (Regression Testing)**
   - 코드 수정 전후 반드시 `npm test` 실행
   - 단 하나의 테스트라도 실패하면 커밋 금지
   - 모든 테스트 통과까지 문제 해결

3. **규칙 3: 안전망 우선 (Safety Net First)**
   - 버그 발생 시 테스트부터 추가하여 재현
   - 증거 기반 디버깅 수행

#### Git 커밋 규칙

- TodoWrite 작업 완료 시마다 **즉시 커밋**
- **커밋 메시지에 다음 내용 제외:**
  - ❌ `🤖 Generated with [Claude Code](https://claude.ai/code)`
  - ❌ `Co-Authored-By: Claude <noreply@anthropic.com>`
- 명확하고 구체적인 커밋 메시지 작성

#### 프로젝트 피닉스 Quality Gate

- ESLint, Prettier, ls-lint 자동 검사
- Circular dependency 체크
- Unused dependencies 검사

**⚡ 중요: START.md의 규칙을 따르지 않으면 코드 품질이 저하되고 버그가 발생할 수 있습니다!**

---

## Code Style & Quality Standards

### 🎯 ESLint Rules - MUST FOLLOW

**Claude MUST write code that passes ESLint without errors.** Read `.eslintrc.js` and `.prettierrc` before writing code.

#### CRITICAL RULES (Zero Tolerance)

1. **No `any` type** (`@typescript-eslint/no-explicit-any: error`)

   ```typescript
   ❌ const data: any = getData();
   ✅ const data: UserData = getData();
   ✅ const data: unknown = getData(); // when type is truly unknown
   ```

2. **No unused imports/variables** (`unused-imports/no-unused-imports: error`)

   ```typescript
   ❌ import { unused, used } from 'lib';
   ✅ import { used } from 'lib';

   ❌ const unusedVar = 123;
   ✅ const _unusedVar = 123; // prefix with _ if intentionally unused
   ```

3. **Single quotes only** (`prettier: singleQuote: true`)

   ```typescript
   ❌ const msg = "hello";
   ❌ <Text jsxProp="value" />
   ✅ const msg = 'hello';
   ✅ <Text jsxProp='value' />
   ```

4. **Arrow function params** (`prettier: arrowParens: 'avoid'`)

   ```typescript
   ❌ const double = (x) => x * 2;
   ✅ const double = x => x * 2;
   ✅ const add = (a, b) => a + b; // multiple params need parens
   ```

5. **No console.log** (`no-console: warn`)

   ```typescript
   ❌ console.log('Debug:', data);
   ✅ // Use proper logging or remove debug logs
   ```

6. **Prefer const over let** (`prefer-const: error`)
   ```typescript
   ❌ let name = 'John'; // never reassigned
   ✅ const name = 'John';
   ✅ let count = 0; count++; // OK, reassigned
   ```

#### React Native Specific Rules

1. **No raw text in JSX** (`react-native/no-raw-text: error`)

   ```typescript
   ❌ <View>Hello World</View>
   ✅ <View><Text>Hello World</Text></View>

   // Exceptions: Text, CustomText, Title, Paragraph, PaperText
   ```

2. **No inline styles** (`react-native/no-inline-styles: warn`)

   ```typescript
   ❌ <View style={{ padding: 10 }} />
   ✅ <View style={styles.container} />

   const styles = StyleSheet.create({
     container: { padding: 10 }
   });
   ```

3. **No color literals** (`react-native/no-color-literals: warn`)

   ```typescript
   ❌ <View style={{ backgroundColor: '#FF0000' }} />
   ✅ <View style={{ backgroundColor: theme.colors.error }} />
   ```

4. **No unused styles** (`react-native/no-unused-styles: error`)

   ```typescript
   ❌ const styles = StyleSheet.create({
     unused: { padding: 10 }, // never used
     used: { margin: 5 },
   });

   ✅ const styles = StyleSheet.create({
     used: { margin: 5 },
   });
   ```

#### TypeScript Rules

1. **Explicit types for exports** (when complex)

   ```typescript
   ❌ export const getData = () => { ... }; // return type unclear
   ✅ export const getData = (): Promise<UserData[]> => { ... };
   ```

2. **No non-null assertions** (`@typescript-eslint/no-non-null-assertion: warn`)
   ```typescript
   ❌ const name = user!.name;
   ✅ const name = user?.name ?? 'Unknown';
   ```

#### Code Quality Rules

1. **No duplicate imports** (`no-duplicate-imports: error`)

   ```typescript
   ❌ import { A } from 'lib';
      import { B } from 'lib';
   ✅ import { A, B } from 'lib';
   ```

2. **No debugger** (`no-debugger: error`)

   ```typescript
   ❌ debugger;
   ✅ // Remove before committing
   ```

3. **No test.only()** (`no-only-tests/no-only-tests: error`)
   ```typescript
   ❌ test.only('my test', () => { ... });
   ✅ test('my test', () => { ... });
   ```

---

### 📏 Prettier Configuration

- **Print width**: 100 characters
- **Semicolons**: Required
- **Single quotes**: Yes (including JSX)
- **Trailing commas**: ES5 (objects, arrays)
- **Bracket spacing**: Yes `{ foo }` not `{foo}`
- **JSX brackets**: New line
- **Arrow parens**: Avoid for single params
- **End of line**: LF (Unix)

---

### 🎨 Naming Conventions

- **Components**: PascalCase (`UserProfile.tsx`, `MatchCard.tsx`)
- **Files**: camelCase (`userService.ts`, `matchUtils.ts`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY`, `API_TIMEOUT`)
- **Interfaces**: PascalCase (`UserData`, `TournamentSettings`)
- **Types**: PascalCase (`TournamentStatus`, `MatchResult`)
- **Enums**: PascalCase (`UserRole`, `TournamentType`)

---

### 📦 Import Order

```typescript
// 1. React
import React, { useState, useEffect } from 'react';

// 2. React Native core
import { View, Text, StyleSheet } from 'react-native';

// 3. Third-party libraries
import { collection, query, where } from 'firebase/firestore';

// 4. Local components
import { UserProfile } from '../components/UserProfile';
import { MatchCard } from '../components/MatchCard';

// 5. Services/utilities
import { userService } from '../services/userService';
import { formatDate } from '../utils/dateUtils';

// 6. Types
import type { User, Match } from '../types';

// 7. Styles
const styles = StyleSheet.create({ ... });
```

---

## Pre-Code Checklist

**Before writing any code, Claude MUST mentally verify:**

### TypeScript Compliance

- [ ] No `any` types (use specific types or `unknown`)
- [ ] All imports are actually used
- [ ] All variables are used or prefixed with `_`
- [ ] Prefer `const` over `let` when possible
- [ ] Explicit return types for complex functions

### React Native Compliance

- [ ] All text wrapped in `<Text>` component
- [ ] Styles use `StyleSheet.create()`
- [ ] No inline styles (unless dynamic)
- [ ] No color literals (use theme colors)
- [ ] No unused styles in StyleSheet

### Formatting Compliance

- [ ] Single quotes everywhere (including JSX)
- [ ] Max line length: 100 characters
- [ ] No parentheses for single arrow function params
- [ ] Semicolons at end of statements
- [ ] Proper spacing in objects/arrays

### Code Quality

- [ ] No console.log (remove debug logs)
- [ ] No debugger statements
- [ ] No test.only() in committed code
- [ ] Proper error handling
- [ ] Meaningful variable names

---

## Code Examples - Reference Guide

### ❌ BAD - Will Fail ESLint

```typescript
import React from "react"; // double quotes
import { View, Text, StyleSheet } from "react-native";
import { unused, formatDate } from "./utils"; // unused import

const MyComponent = ({ data }: any) => { // any type
  console.log("Debug:", data); // console.log + double quotes

  return (
    <View style={{ padding: 10, backgroundColor: "#FF0000" }}> {/* inline + color */}
      Raw text here {/* raw text */}
      <Text>{formatDate(data.date)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  unused: { margin: 10 }, // unused style
});
```

### ✅ GOOD - Passes ESLint

```typescript
import React from 'react'; // single quotes
import { View, Text, StyleSheet } from 'react-native';
import { formatDate } from './utils'; // only used imports
import { theme } from '../theme';

interface MyComponentProps {
  data: UserData; // specific type
}

const MyComponent = ({ data }: MyComponentProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {formatDate(data.date)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: theme.colors.surface, // theme color
  },
  text: {
    fontSize: 16,
    color: theme.colors.text,
  },
});

export default MyComponent;
```

---

## Development Workflow - MUST FOLLOW

### When Writing Code

1. **READ** `.eslintrc.js` and `.prettierrc` first (if not recently read)
2. **PLAN** code structure following ESLint rules
3. **WRITE** code with rules in mind
4. **SELF-CHECK** against common violations before outputting
5. **VERIFY** mentally that code will pass lint

### Common Self-Check Questions

Before outputting code, ask yourself:

- ✅ Are all types specific (no `any`)?
- ✅ Are all imports actually used?
- ✅ Am I using single quotes?
- ✅ Are arrow function params correct?
- ✅ Is all text wrapped in `<Text>`?
- ✅ Are styles using `StyleSheet.create()`?
- ✅ Did I remove all `console.log()`?
- ✅ Are lines under 100 characters?

### Post-Code Verification

After writing code, if unsure, suggest:

```bash
npm run lint        # Check for ESLint errors
npm run format      # Auto-fix formatting
npx tsc --noEmit    # Check TypeScript
npm test            # Run tests
```

---

## Development Guidelines

### Code Style

- TypeScript strict mode
- Functional components with hooks
- No unnecessary comments
- Follow existing patterns

### Git Workflow

- Main branch for production
- Feature branches for development
- Squash commits on merge

### Testing

- Unit tests for services
- Integration tests for Firebase
- E2E tests for critical flows

## Next Steps

1. **Immediate**: Complete Firebase integration in mobile app
2. **Short-term**: Expand TestFlight beta testing
3. **Medium-term**: Launch leagues and tournaments
4. **Long-term**: Payment integration with Stripe

---

_Last Updated: January 2025 - Production-ready with iOS TestFlight deployment_
