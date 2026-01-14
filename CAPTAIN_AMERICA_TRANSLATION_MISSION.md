# 🛡️ Captain America Translation Mission

## Mission Objective

Translate ALL remaining **1102 untranslated keys** in zh.json from English to Simplified Chinese.

## Current Status

- ✅ **Completed**: admin section (33 keys)
- 🔄 **Remaining**: 1102 keys across 68 sections

## Mission Files

- **Source**: `src/locales/en.json` (reference)
- **Target**: `src/locales/zh.json` (to update)
- **Untranslated list**: `untranslated-keys.json` (1135 total, 33 done)
- **Batch 1 (Top 10 sections)**: `batch1-keys.json` (272 remaining of 305)

## Translation Strategy

### Phase 1: Top Priority Sections (272 keys)

Focus on user-facing features with highest visibility:

1. **createClubTournament** (33 keys) - Tournament creation flows
2. **myActivities** (32 keys) - User activity and profile
3. **aiMatching** (31 keys) - AI matching system
4. **eventCard** (30 keys) - Event display cards
5. **duesManagement** (30 keys) - Membership dues
6. **discover** (29 keys) - Discovery features
7. **createEvent** (29 keys) - Event creation
8. **hostedEventCard** (29 keys) - Hosted events
9. **matches** (29 keys) - Match system

### Phase 2: Secondary Sections (830 keys)

All remaining sections

## Translation Guidelines

### 1. Tennis Terminology

- Match → 比赛
- Tournament → 锦标赛
- League → 联赛
- ELO Rating → ELO评分
- Singles → 单打
- Doubles → 双打
- Court → 球场

### 2. UI Context

- Keep translations concise for mobile UI
- Use natural Chinese phrasing
- Maintain professional but friendly tone

### 3. Technical Requirements

- Preserve `{{variable}}` placeholders exactly
- Keep `\n` for line breaks
- Maintain emojis (🏆, ⚠️, etc.)
- Do NOT translate brand names ("Lightning Tennis")

### 4. Quality Standards

- Natural Chinese (not machine translation feel)
- Contextually appropriate
- Consistent with existing zh.json style

## Execution Instructions

### Step 1: Create Translation Script

Create `scripts/translate-all-zh.js` with translation mappings for ALL 1102 keys.

### Step 2: Apply Translations

```bash
node scripts/translate-all-zh.js
```

### Step 3: Verify

```bash
# Count remaining untranslated
node -e "
const fs = require('fs');
const en = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));
const zh = JSON.parse(fs.readFileSync('src/locales/zh.json', 'utf8'));

function countUntranslated(enObj, zhObj, prefix = '') {
  let count = 0;
  for (const key in enObj) {
    const fullKey = prefix ? \`\${prefix}.\${key}\` : key;
    if (typeof enObj[key] === 'object' && enObj[key] !== null) {
      if (zhObj[key]) count += countUntranslated(enObj[key], zhObj[key], fullKey);
    } else if (enObj[key] === zhObj[key]) count++;
  }
  return count;
}

const remaining = countUntranslated(en, zh);
console.log('Remaining untranslated: ' + remaining);
console.log('Progress: ' + ((1135 - remaining) / 1135 * 100).toFixed(1) + '%');
"
```

## Success Criteria

- [ ] All 1102 keys have Chinese translations
- [ ] No remaining keys where zh.json === en.json (except proper nouns)
- [ ] JSON file is valid and parseable
- [ ] Translations are natural and contextually appropriate
- [ ] Placeholders ({{var}}) preserved
- [ ] Progress: 100% (1135/1135 keys)

## Example Translations

```javascript
// Admin section (already completed)
'admin.devTools.currentStreak': '当前连续天数',
'admin.devTools.badges': '🏆 已获得徽章',

// Pattern examples for remaining sections
'myActivities.profile.earnedBadges': '已获得徽章',
'myActivities.stats.rankedMatchStats': '排名赛统计',
'createClubTournament.matchFormat': '比赛形式',
'aiMatching.compatibility.score': '匹配度',
'eventCard.participants': '参与者',
'duesManagement.paymentStatus': '缴费状态',
```

## Notes

- This is a comprehensive translation task requiring ~2-4 hours
- Focus on quality over speed
- Use existing zh.json translations as style guide
- When uncertain, prioritize naturalness and user-friendliness

## Questions?

Consult:

- Existing `src/locales/zh.json` for translation style
- `src/locales/ko.json` for Korean reference (similar structure)
- Tennis terminology standards in Chinese

---

**Priority**: HIGH  
**Deadline**: ASAP  
**Estimated effort**: 2-4 hours  
**Impact**: 27% → 100% Chinese translation coverage
