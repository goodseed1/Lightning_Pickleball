# MISSION BRIEF: French Translation - Round 5

## MISSION OBJECTIVE

Translate ALL remaining 1481 untranslated French keys in `fr.json` where French text === English text.

## MISSION PARAMETERS

### Target File

- **Input**: `/Volumes/DevSSD/development/Projects/lightning-pickleball-react/lightning-pickleball-simple/src/locales/fr.json`
- **Reference**: `/Volumes/DevSSD/development/Projects/lightning-pickleball-react/lightning-pickleball-simple/src/locales/en.json`
- **Untranslated Keys Report**: `scripts/untranslated-french-keys.json`

### Priority Sections (Translate First)

1. **services**: 166 keys
2. **duesManagement**: 102 keys
3. **leagueDetail**: 84 keys
4. **createEvent**: 76 keys
5. **clubLeaguesTournaments**: 69 keys
6. **types**: 64 keys
7. **clubTournamentManagement**: 63 keys
8. **matches**: 52 keys
9. **aiMatching**: 46 keys
10. **myActivities**: 44 keys

## TRANSLATION GUIDELINES

### French Translation Standards

1. **Natural French**: Use proper French expressions, not literal translations
2. **Pickleball Terminology**: Use standard French pickleball terms
3. **Formality Level**: Use "vous" (formal) for app UI
4. **Consistency**: Match existing translated keys in fr.json

### Examples

| English         | ❌ Literal      | ✅ Natural French         |
| --------------- | --------------- | ------------------------- |
| "Loading..."    | "Chargement..." | "Chargement en cours..."  |
| "OK"            | "OK"            | "D'accord"                |
| "Delete"        | "Supprimer"     | "Supprimer" (correct)     |
| "Total Matches" | "Total Matchs"  | "Nombre de matchs"        |
| "Email"         | "Email"         | "Adresse e-mail"          |
| "Expert"        | "Expert"        | "Expert" (correct - same) |
| "Parking"       | "Parking"       | "Stationnement"           |
| "Note"          | "Note"          | "Remarque"                |
| "Logo"          | "Logo"          | "Logo" (correct - same)   |

### Context-Aware Translation

- **UI Buttons**: Short, action-oriented (e.g., "Envoyer", "Annuler")
- **Error Messages**: Clear, helpful (e.g., "Une erreur s'est produite")
- **Form Labels**: Descriptive (e.g., "Adresse e-mail")
- **Notifications**: Friendly, informative

## EXECUTION STEPS

### Phase 1: Preparation (5 min)

1. Read `scripts/untranslated-french-keys.json`
2. Read existing `fr.json` to understand translation style
3. Create backup: `cp src/locales/fr.json src/locales/fr.json.backup`

### Phase 2: Translation Strategy (10 min)

1. **Create translation script** (`scripts/translate-french-keys.js`):
   - Load untranslated-french-keys.json
   - Load current fr.json
   - For each untranslated key:
     - Apply translation rules
     - Preserve structure
   - Save updated fr.json

2. **Translation Rules** (implement in script):

   ```javascript
   const translations = {
     // Common UI
     OK: "D'accord",
     'Loading...': 'Chargement en cours...',
     Delete: 'Supprimer',
     Cancel: 'Annuler',
     Save: 'Enregistrer',
     Email: 'Adresse e-mail',
     Parking: 'Stationnement',
     Note: 'Remarque',
     Public: 'Public',
     Social: 'Social',
     Clubs: 'Clubs',
     Services: 'Services',
     Info: 'Info',
     Participants: 'Participants',

     // Distances
     km: 'km',
     mi: 'mi',
     miles: 'miles',

     // Match terminology
     'Total Matches': 'Nombre de matchs',
     Win: 'V',
     Loss: 'D',
     'Score:': 'Score :',
     W: 'V',
     L: 'D',

     // Time
     Weekdays: 'Jours de semaine',
     Weekends: 'Week-ends',
     Brunch: 'Brunch',

     // Profile
     'Playing Style': 'Style de jeu',
     Availability: 'Disponibilité',
     Permissions: 'Autorisations',
     Expert: 'Expert',
     Rec: 'Rec',

     // Forms
     Important: 'Important',
     Notice: 'Avis',
     Club: 'Club',
     'Role Management': 'Gestion des rôles',
     Applications: 'Candidatures',
   };
   ```

### Phase 3: Execute Translation (30 min)

1. Run translation script
2. Verify JSON validity: `node -e "JSON.parse(require('fs').readFileSync('src/locales/fr.json'))"`
3. Compare before/after:
   ```bash
   node scripts/find-untranslated-french.js
   # Should show ~0 untranslated keys (or minimal)
   ```

### Phase 4: Quality Validation (15 min)

1. **Spot check TOP sections**:
   - services (166 keys)
   - duesManagement (102 keys)
   - leagueDetail (84 keys)

2. **Verify translations**:
   - Natural French ✓
   - Consistent with existing ✓
   - Proper capitalization ✓
   - No English remnants ✓

3. **Test JSON integrity**:
   ```bash
   npm run lint
   npx tsc --noEmit
   ```

### Phase 5: Commit (5 min)

```bash
git add src/locales/fr.json
git commit -m "feat(i18n): Translate 1481 French keys to natural French

Round 5 - Mass translation completion

TOP sections translated:
- services: 166 keys
- duesManagement: 102 keys
- leagueDetail: 84 keys
- createEvent: 76 keys
- clubLeaguesTournaments: 69 keys
- types: 64 keys
- clubTournamentManagement: 63 keys
- matches: 52 keys
- aiMatching: 46 keys
- myActivities: 44 keys

Total: 1481 keys translated from English to natural French"
```

## SUCCESS CRITERIA

- [ ] All 1481 keys translated
- [ ] JSON validates successfully
- [ ] Natural French (not literal)
- [ ] Consistent with existing translations
- [ ] `npm run lint` passes
- [ ] `npx tsc --noEmit` passes
- [ ] Git commit completed

## ESTIMATED TIME

- Total: 60-70 minutes
- Preparation: 5 min
- Strategy: 10 min
- Execution: 30 min
- Validation: 15 min
- Commit: 5 min

## DELIVERABLES

1. Updated `src/locales/fr.json` with all translations
2. Validation report showing 0 (or minimal) untranslated keys
3. Git commit with detailed message

---

**Mission Commander**: Kim (킴)
**Assigned Agent**: 🛡️ Captain America
**Priority**: HIGH
**Deadline**: ASAP

🇫🇷 **Allons-y!** Let's make this app speak beautiful French!
