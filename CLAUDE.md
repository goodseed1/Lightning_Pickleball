# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Lightning Pickleball (번개 피클볼)** - "Build your local pickleball network and community"

A multi-platform pickleball community application connecting players for quick matches and building sustainable local pickleball ecosystems.

**Core Mission**: Transform fragmented pickleball activities into cohesive local networks serving players of all backgrounds and skill levels.

**Origin**: Forked from Lightning Pickleball and adapted for pickleball-specific features and rules.

---

## ⚠️ Pickleball vs Pickleball: Key Differences

### 1. Scoring System

| Feature | Pickleball | Pickleball |
|---------|--------|------------|
| **Points** | 0, 15, 30, 40, deuce | 0, 1, 2, 3... (rally scoring) |
| **Game Target** | 6 games | **11 or 15 points** (win by 2) |
| **Match Format** | Best of 3 sets | **Single Game (default)** or Best of 3 |
| **Tiebreak** | At 6-6 in set | N/A (win by 2 rule) |

### 2. Equipment Terms

| Pickleball | Pickleball |
|--------|------------|
| Paddle (패들) | Paddle (패들) |
| Pickleball ball | Wiffle ball (피클볼) |
| Stringing service | N/A (no strings!) |

### 3. Rating System

| Pickleball | Pickleball |
|--------|------------|
| LPR (Lightning Pickleball Rating) | **LPR (Lightning Pickleball Rating)** |

### 4. Brand Colors

| Pickleball | Pickleball |
|--------|------------|
| Blue (#1976d2) | **Green (#4CAF50)** |

---

## 🎯 Pickleball Score Types

```typescript
// 피클볼 점수 타입 정의
export type PickleballGameTarget = 11 | 15;
export type MatchFormat = 'single_game' | 'best_of_3';

export interface PickleballGameScore {
  player1Points: number;  // 0-25+
  player2Points: number;
  winner: 'player1' | 'player2' | null;
}

export interface PickleballMatchScore {
  format: MatchFormat;           // 단일 게임 vs Best of 3
  targetScore: PickleballGameTarget;  // 11 (기본) or 15
  games: PickleballGameScore[];  // 최대 3게임
  matchWinner: 'player1' | 'player2' | null;
  isComplete: boolean;
}
```

### 승리 조건

- **단일 게임**: targetScore (11 or 15) 도달 + 2점 차이
- **Best of 3**: 2게임 먼저 승리

### 점수 검증 함수

```typescript
// 단일 게임 승리 검증
export const validateGameScore = (
  p1: number,
  p2: number,
  target: 11 | 15
): boolean => {
  const max = Math.max(p1, p2);
  const diff = Math.abs(p1 - p2);
  return max >= target && diff >= 2;
};

// Best of 3 매치 승자 결정
export const determineBestOf3Winner = (
  games: PickleballGameScore[]
): 'player1' | 'player2' | null => {
  const p1Wins = games.filter(g => g.winner === 'player1').length;
  const p2Wins = games.filter(g => g.winner === 'player2').length;
  if (p1Wins >= 2) return 'player1';
  if (p2Wins >= 2) return 'player2';
  return null;
};
```

---

## 🏆 Pickleball Achievements

| Pickleball Achievement | Pickleball Equivalent | Condition |
|--------------------|----------------------|-----------|
| BAGEL_MASTER (6-0) | SHUTOUT_MASTER | 11-0 또는 15-0 승리 |
| TENNIS_PRODIGY | PICKLEBALL_PRODIGY | 토너먼트 100% 승률 |
| Giant Slayer | Giant Slayer (유지) | 상위 ELO 격파 |

### 새로운 피클볼 전용 업적

- `KITCHEN_MASTER` - 키친(논볼리존) 관련 (추후 구현)
- `RALLY_MACHINE` - 연장 게임 승리 (15점 이상)

---

## 🎾 Service Categories

```typescript
export type ServiceCategory =
  | 'paddle_sales'       // 패들 판매
  | 'paddle_rental'      // 패들 대여
  | 'used_paddle'        // 중고 패들
  | 'used_equipment'     // 중고 장비
  | 'court_rental'       // 코트 대여
  | 'lessons'            // 레슨
  | 'other';

// Note: 'stringing' 제거됨 - 패들에는 줄이 없음!
```

---

## 🎨 Brand Colors

```typescript
export const LightningPickleballBrandColors = {
  primary: '#2E7D32',      // Forest Green
  primaryLight: '#4CAF50', // Material Green
  secondary: '#FFC107',    // Yellow (볼 색상)
  accent: '#81C784',       // Light Green
};
```

---

## 📊 LPR (Lightning Pickleball Rating) System

ELO 기반 레이팅 시스템 (Lightning Pickleball의 LPR과 동일한 로직)

**LPR 스케일**: 1-10 정수

| LPR | 티어 | ELO 범위 |
|-----|------|---------|
| 1-2 | Bronze | 0-1100 |
| 3-4 | Silver | 1100-1300 |
| 5-6 | Gold | 1300-1500 |
| 7 | Platinum | 1500-1600 |
| 8 | Diamond | 1600-1700 |
| 9 | Master | 1700-1800 |
| 10 | Legend | 1800+ |

---

## Technology Stack

### Mobile Application
- **Framework**: React Native + Expo SDK 54
- **Build**: EAS Build
- **UI**: React Native Paper + Expo components
- **Navigation**: React Navigation v6

### Backend & Services
- **Backend**: Firebase (Auth, Firestore, Cloud Messaging, Storage)
- **NEW PROJECT**: Separate Firebase project from Lightning Pickleball
- **Location**: Google Maps API

---

## Development Commands

```bash
npm run start     # Expo development server
npm run ios       # iOS simulator
npm run android   # Android emulator
npm run lint      # ESLint
npx tsc --noEmit  # TypeScript check
```

---

## ⚠️ QUALITY GATE (필수!)

```bash
npm run lint
npx tsc --noEmit
git add -A && git commit -m "type: description"
```

---

## Firestore Collections

| Pickleball | Pickleball |
|--------|------------|
| pickleball_clubs | pickleball_clubs |
| pickleball_matches | pickleball_matches |
| pickleballService | pickleballService |

---

## Key Files to Modify

| Priority | File | Changes |
|----------|------|---------|
| 🔴 필수 | `src/types/match.ts` | 피클볼 점수 타입 |
| 🔴 필수 | `src/components/match/ScoreInputModal.tsx` | Best of 3 UI |
| 🔴 필수 | `src/constants/achievements.ts` | 피클볼 업적 |
| 🔴 필수 | `src/theme/colors.ts` | 그린 테마 |
| 🔴 필수 | `app.json` | 앱 메타데이터 |
| 🟠 높음 | `src/constants/ltr.ts` | → lpr.ts |
| 🟠 높음 | `src/locales/*.json` | 10개 언어 번역 |

---

**Last Updated**: 2026-01-14
**Origin**: Forked from Lightning Pickleball
**Status**: Initial Setup
