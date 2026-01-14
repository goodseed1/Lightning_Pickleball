# Task: Translate Top 10 Sections (272 keys)

## What to do

Create a comprehensive translation script that translates the remaining 272 keys from the top 10 most important sections in zh.json.

## Files

- Read: `batch1-keys.json` (skip first 33, they're done)
- Update: `src/locales/zh.json`
- Reference: `src/locales/zh.json` (for translation style)

## Sections to translate (in order)

1. createClubTournament (33 keys)
2. myActivities (32 keys)
3. aiMatching (31 keys)
4. eventCard (30 keys)
5. duesManagement (30 keys)
6. discover (29 keys)
7. createEvent (29 keys)
8. hostedEventCard (29 keys)
9. matches (29 keys)

Total: 272 keys

## How to do it

### Step 1: Read batch1-keys.json

```bash
const batch1 = JSON.parse(fs.readFileSync('batch1-keys.json', 'utf8'));
// Skip first 33 (admin section - already done)
const remaining = batch1.slice(33);
```

### Step 2: Create translation mapping

For EACH of the 272 keys, create a Simplified Chinese translation.

Translation style:

- Natural, user-friendly Chinese
- Concise (for mobile UI)
- Professional but friendly tone
- Preserve {{placeholders}}
- Keep \n line breaks
- Don't translate "Lightning Tennis" brand name

### Step 3: Create and run script

File: `scripts/translate-top10-sections.js`

```javascript
const fs = require('fs');
const zh = JSON.parse(fs.readFileSync('src/locales/zh.json', 'utf8'));

const translations = {
  // Add all 272 translations here
  'createClubTournament.loadingMembers': '加载成员中...',
  // ... (continue for all 272 keys)
};

function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

let count = 0;
for (const [key, value] of Object.entries(translations)) {
  setNestedValue(zh, key, value);
  count++;
}

fs.writeFileSync('src/locales/zh.json', JSON.stringify(zh, null, 2) + '\n', 'utf8');
console.log('✅ Applied ' + count + ' translations');
```

Then run:

```bash
node scripts/translate-top10-sections.js
```

## Success Criteria

- [ ] 272 new translations applied to zh.json
- [ ] JSON file valid (parseable)
- [ ] All translations are natural Chinese
- [ ] {{placeholders}} preserved
- [ ] File saved with proper formatting

## Tennis Terminology Reference

- Match → 比赛
- Tournament → 锦标赛
- League → 联赛
- ELO Rating → ELO评分
- Singles → 单打
- Doubles → 双打
- Court → 球场
- Seeding → 排位
- Bracket → 对阵表
- Championship → 冠军赛
- Round → 轮次
- Participant → 参与者
- Host → 主办方
- Due/Dues → 会费
- Member → 会员
- Payment → 缴费
- Status → 状态
- Pending → 待处理
- Confirmed → 已确认
- Compatibility → 匹配度
- Skill Level → 技术水平

## Work Location

`/Volumes/DevSSD/development/Projects/lightning-tennis-react/lightning-tennis-simple/`
