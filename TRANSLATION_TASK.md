# Mission Brief: Translate 1135 Remaining Chinese (zh.json) Keys

## Objective

Translate ALL remaining 1135 keys in `/Volumes/DevSSD/development/Projects/lightning-pickleball-react/lightning-pickleball-simple/src/locales/zh.json` where the value currently equals the English (en.json) value.

## Context

- Lightning Pickleball is a pickleball community app
- Target language: Simplified Chinese (zh-CN)
- Translation style: Natural, user-friendly Chinese for mobile app UI

## Data Files

- **Untranslated keys**: `untranslated-keys.json` (1135 items)
- **Target file**: `src/locales/zh.json`
- **Reference**: `src/locales/en.json`

## Top Sections to Translate (by priority)

1. admin (33 keys) - Admin and developer tools
2. createClubTournament (33 keys) - Tournament creation
3. myActivities (32 keys) - User activity feed
4. aiMatching (31 keys) - AI matching system
5. eventCard (30 keys) - Event cards
6. duesManagement (30 keys) - Membership dues
7. discover (29 keys) - Discovery features
8. createEvent (29 keys) - Event creation
9. hostedEventCard (29 keys) - Hosted event displays
10. matches (29 keys) - Match system

...and 59 more sections (total: 1135 keys)

## Translation Guidelines

1. **Pickleball terminology**: Use standard Chinese pickleball terms
2. **UI context**: Translate for mobile app interface (concise)
3. **Consistency**: Match existing translation style in zh.json
4. **Placeholders**: Preserve {{variable}} syntax
5. **Formatting**: Maintain \n for line breaks

## Example Translations

```javascript
'admin.devTools.currentStreak': '当前连续天数'
'admin.devTools.eloRating': 'ELO评分'
'admin.devTools.badges': '🏆 已获得徽章'
'admin.matchManagement.title': '比赛管理'
'admin.matchManagement.inProgress': '进行中'
```

## Execution Steps

1. Read `untranslated-keys.json`
2. Create comprehensive translation mapping
3. Apply translations to `src/locales/zh.json`
4. Verify JSON structure integrity
5. Report completion with counts

## Success Criteria

- [ ] All 1135 keys translated
- [ ] JSON file valid (parseable)
- [ ] Translations natural and contextually appropriate
- [ ] Placeholders preserved
- [ ] File saved with proper formatting

## File to Update

`/Volumes/DevSSD/development/Projects/lightning-pickleball-react/lightning-pickleball-simple/src/locales/zh.json`
