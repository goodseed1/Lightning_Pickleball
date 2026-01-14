# 🏆 Tournament Statistics Migration Guide

## Overview

This guide provides step-by-step instructions for migrating tournament statistics from ambiguous legacy field names to clear, unambiguous names.

**Problem Fixed:**

- ❌ OLD: `wins` (ambiguous - tournament wins or match wins?)
- ✅ NEW: `championships` (clear - tournament 1st place finishes)
- ❌ OLD: `participations` (ambiguous - tournaments or matches?)
- ✅ NEW: `tournamentsPlayed` (clear - number of tournaments entered)

---

## 📋 Phase Completion Status

### ✅ Phase 1: Data Investigation

- [x] Phase 1.1: Created `scripts/check-tournament-stats.js` - Data inspection script
- [ ] Phase 1.2: Generate data problem report (optional)

### ✅ Phase 2: Code Refactoring

- [x] Phase 2.1: Created `src/types/tournamentStats.ts` - TypeScript type definitions
- [x] Phase 2.2: Updated `src/services/userService.js` - New field names with backward compatibility
- [x] Phase 2.3: Updated `src/services/clubService.js` - New field names with backward compatibility
- [x] Phase 2.4: Updated `src/screens/MyProfileScreen.tsx` - UI labels fixed

### ✅ Phase 3: Auto-Update Logic

- [x] Phase 3: Updated `functions/src/utils/trophyAwarder.ts` - bestFinish auto-update

### ✅ Phase 4: Data Migration & Validation

- [x] Phase 4.1: Created `scripts/migrate-tournament-stats.js` - Migration script
- [x] Phase 4.2: Created `scripts/validate-tournament-stats.js` - Validation script
- [ ] Phase 4.3: Integration testing and deployment (IN PROGRESS - THIS GUIDE)

---

## 🧪 Phase 4.3: Integration Testing & Deployment

### Pre-Deployment Checklist

#### 1️⃣ **Code Quality Checks** (CRITICAL)

```bash
# Run from project root
cd /Volumes/DevSSD/development/Projects/lightning-pickleball-react/lightning-pickleball-simple

# Run ESLint
npm run lint

# Run TypeScript checks
npx tsc --noEmit

# If errors found, fix them before proceeding!
```

#### 2️⃣ **Inspect Current Data**

Check actual Firestore data to understand current state:

```bash
# From project root
node scripts/check-tournament-stats.js <test-user-id>

# Example:
node scripts/check-tournament-stats.js FUXA9xYZJ3cPY6E91fJrOY3Gy4H2
```

**Look for:**

- Do you see legacy field names (`wins`, `participations`)?
- Do values match between Screen 1 and Screen 2?
- Is `bestFinish` showing "없음" (None) despite having wins?

---

### 🔄 Migration Steps

#### **STEP 1: Dry Run Migration (REQUIRED)**

Test migration without making changes:

```bash
# From project root
node scripts/migrate-tournament-stats.js --dry-run

# Or for single user:
node scripts/migrate-tournament-stats.js --user-id=<userId> --dry-run
```

**Review output carefully:**

- Does it find all users?
- Do the "before" and "after" values look correct?
- Are bestFinish values being calculated from trophies?

#### **STEP 2: Test User Migration**

Migrate a single test user first:

```bash
# Migrate test user (without --dry-run)
node scripts/migrate-tournament-stats.js --user-id=<test-user-id>
```

#### **STEP 3: Validate Test User**

Check that migration worked correctly:

```bash
# Validate migrated user
node scripts/validate-tournament-stats.js --user-id=<test-user-id>
```

**Expected result:**

- ✅ Valid: 1 (or more, depending on club memberships)
- ⚠️ Warnings: 0 (or minor warnings)
- ❌ Errors: 0 (MUST be zero!)

#### **STEP 4: Manual Verification**

Open Firebase Console and manually check the test user's data:

1. Navigate to: `users/{test-user-id}/clubMemberships/{clubId}`
2. Look at `clubStats.tournamentStats`
3. **Verify new fields exist:**
   - `championships`
   - `matchWins`
   - `matchLosses`
   - `tournamentsPlayed`
   - `bestFinish`

4. **Verify legacy fields still exist** (for backward compatibility):
   - `wins`
   - `participations`

#### **STEP 5: Test App UI**

Launch the React Native app and check the test user's profile:

```bash
# Start Expo
npx expo start --ios
```

**Screen 1 (경기 통계 - 토너먼트 탭):**

- ✅ Shows correct match wins/losses
- ✅ Win rate matches calculation

**Screen 2 (랭킹 순위 - 클럽 토너먼트 탭):**

- ✅ "경기 승수" (Match Wins) - Updated label
- ✅ "총 경기" (Total Matches) - Updated label
- ✅ "최고 성적" shows actual finish (not "없음")

#### **STEP 6: Full Migration**

If everything looks good, migrate all users:

```bash
# Migrate ALL users (NO --dry-run flag!)
node scripts/migrate-tournament-stats.js
```

⚠️ **WARNING**: This will update all user data in Firestore!

#### **STEP 7: Full Validation**

Validate all migrated data:

```bash
# Validate ALL users
node scripts/validate-tournament-stats.js
```

**Review summary:**

- Errors MUST be 0
- Warnings should be minimal or explained

---

### 🚀 Deployment Steps

#### **STEP 1: Deploy Cloud Functions**

Deploy updated trophy awarder with bestFinish logic:

```bash
# From functions directory
cd functions

# Deploy all functions
npm run deploy

# Or deploy specific function
firebase deploy --only functions:awardTournamentTrophy
```

#### **STEP 2: Deploy Updated Client Code**

Build and deploy web app (if applicable):

```bash
# From project root
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

#### **STEP 3: Update React Native App**

For mobile app updates:

1. **Android:**

   ```bash
   eas build --platform android
   ```

2. **iOS:**

   ```bash
   eas build --platform ios
   ```

3. **OTA Update (for minor changes):**
   ```bash
   eas update --branch production
   ```

---

### ✅ Post-Deployment Verification

#### 1️⃣ **Test New Tournament Completion**

Create a test tournament and complete it:

1. Create a test tournament with 4-8 participants
2. Play through all rounds
3. Complete the tournament
4. **Verify:**
   - Winner's `bestFinish` = 1 ✅
   - Winner's `championships` incremented ✅
   - Runner-up's `bestFinish` = 2 (if no prior wins) ✅
   - Runner-up's `runnerUps` incremented ✅
   - Both nested and flat collections updated ✅

#### 2️⃣ **Monitor Cloud Function Logs**

Check Firebase Console > Functions > Logs:

```bash
# Or via CLI
firebase functions:log
```

**Look for:**

- `[TROPHY AWARDER]` logs showing successful trophy awards
- `bestFinish` being set correctly
- No errors in trophy awarding process

#### 3️⃣ **Check Multiple Users**

Randomly check 3-5 users' profiles in the app:

- Do stats display correctly?
- Are new labels showing?
- Is `bestFinish` accurate?

---

### 🐛 Troubleshooting

#### **Issue: Validation Shows Errors**

**Solution:**

1. Check the error messages
2. If data inconsistency (e.g., wins + losses ≠ total):
   - May indicate pre-existing data corruption
   - Consider manual correction for affected users
3. If missing new fields:
   - Re-run migration for affected users

#### **Issue: bestFinish Still Shows "없음"**

**Possible causes:**

1. User has no trophies (never won/placed in tournaments)
2. Trophies don't have `clubId` matching current club
3. Trophy `position` field is missing

**Solution:**

```bash
# Check user's trophies
node scripts/check-tournament-stats.js <userId>

# Re-run migration to recalculate bestFinish
node scripts/migrate-tournament-stats.js --user-id=<userId>
```

#### **Issue: Nested & Flat Collections Out of Sync**

**Solution:**

```bash
# Re-run migration (updates BOTH collections)
node scripts/migrate-tournament-stats.js --user-id=<userId>

# Verify sync
node scripts/validate-tournament-stats.js --user-id=<userId>
```

---

### 📊 Field Mapping Reference

| Legacy Field         | New Field           | Description                            | Data Type      |
| -------------------- | ------------------- | -------------------------------------- | -------------- |
| `wins`               | `championships`     | Tournament 1st place finishes          | number         |
| `tournamentWins`     | `matchWins`         | Match wins in tournaments              | number         |
| `tournamentLosses`   | `matchLosses`       | Match losses in tournaments            | number         |
| `participations`     | `tournamentsPlayed` | Number of tournaments entered          | number         |
| `bestFinishPosition` | `bestFinish`        | Best placement (1=winner, 2=runner-up) | number \| null |
| `runnerUps`          | `runnerUps`         | (unchanged) 2nd place finishes         | number         |
| `semiFinals`         | `semiFinals`        | (unchanged) 3rd-4th place finishes     | number         |
| `totalMatches`       | `totalMatches`      | (unchanged) Total matches played       | number         |
| `winRate`            | `winRate`           | (unchanged) Win percentage             | number         |

---

### 🎯 Success Criteria

Migration is successful when:

- ✅ All users have new field names (`championships`, `matchWins`, `tournamentsPlayed`)
- ✅ Legacy fields preserved for backward compatibility
- ✅ `bestFinish` accurately reflects trophy data
- ✅ Nested and flat collections are synchronized
- ✅ UI displays correct labels ("경기 승수" instead of "우승")
- ✅ New tournaments automatically update `bestFinish`
- ✅ No validation errors
- ✅ Cloud Functions deploy successfully
- ✅ Mobile app OTA update distributed

---

### 📝 Rollback Plan

If critical issues found after deployment:

#### **STEP 1: Revert Cloud Functions**

```bash
# List recent deployments
firebase functions:log

# Revert to previous version (if needed)
# Contact Firebase support or manually redeploy old version
```

#### **STEP 2: Revert Client Code**

```bash
# Git revert the commits
git revert <commit-hash>

# Redeploy
firebase deploy --only hosting
```

#### **STEP 3: Revert Data Migration (CAREFUL!)**

⚠️ **WARNING**: Only if absolutely necessary!

Legacy fields are still present, so old clients will continue working. New clients may show incorrect data, but functionality will not break.

**Preferred approach:** Fix the issue and re-migrate rather than rolling back data.

---

### 📚 Related Documentation

- **Type Definitions**: `/src/types/tournamentStats.ts`
- **Migration Script**: `/scripts/migrate-tournament-stats.js`
- **Validation Script**: `/scripts/validate-tournament-stats.js`
- **Data Inspection**: `/scripts/check-tournament-stats.js`
- **Trophy Awarder**: `/functions/src/utils/trophyAwarder.ts`

---

### 🙋 Questions & Support

**Before Migration:**

- Review this guide completely
- Test with single user first
- Always run validation after migration

**During Migration:**

- Monitor logs carefully
- Keep backup of critical data
- Have rollback plan ready

**After Migration:**

- Verify multiple users
- Check UI in production
- Monitor for 24-48 hours

---

**Last Updated**: 2025-11-11
**Status**: Ready for Testing
**Owner**: Kim (Chief Project Architect) & Captain America (Tech Lead)

🎉 **Good luck with the migration!**
