# Italian Translation Mission Brief

## Objective

Complete ALL 1100 remaining Italian translations in `/src/locales/it.json`

## Current Status

- Total untranslated keys: 1100
- Top sections: alerts(228), duesManagement(122), services(98), leaderboard(96), aiMatching(92)

## Files

- **Source**: `scripts/untranslated-italian-keys.json` (contains all keys where it === en)
- **Target**: `src/locales/it.json`
- **Reference**: `src/locales/en.json`

## Strategy

### Phase 1: Create Complete Italian Translation Object

Create a new file `scripts/italian-translations-complete.json` with ALL translations organized by section:

1. **Read** `scripts/untranslated-italian-keys.json` to understand structure
2. **Translate** each English value to natural, native Italian
3. **Maintain** exact same nested structure
4. **Preserve** variables like `{{count}}`, `{{userName}}`, `{{date}}`, etc.

### Phase 2: Apply Translations with Deep Merge

Create a script `scripts/apply-italian-translations.js`:

```javascript
const fs = require('fs');
const path = require('path');

function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      target[key] = target[key] || {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

const it = require('../src/locales/it.json');
const translations = require('./italian-translations-complete.json');

const updated = deepMerge(it, translations);

fs.writeFileSync(path.join(__dirname, '../src/locales/it.json'), JSON.stringify(updated, null, 2));

console.log('✅ Italian translations applied successfully!');
```

### Phase 3: Verify Completeness

Run `node scripts/complete-italian-translations.js` to verify 0 remaining keys.

## Translation Guidelines

### Pickleball-Specific Terms

- "Match" → "Partita" or "Incontro"
- "Court" → "Campo"
- "Club" → "Club" (keep as is)
- "Tournament" → "Torneo"
- "League" → "Lega" or "Campionato"
- "Rating" → "Valutazione" or "Livello"
- "Partner" → "Partner" or "Compagno/a"

### UI Terms

- "OK" → "OK" (universal constant)
- "Cancel" → "Annulla"
- "Confirm" → "Conferma"
- "Delete" → "Elimina"
- "Edit" → "Modifica"
- "Save" → "Salva"

### Formal vs Informal

Use **informal "tu"** form (not formal "Lei") to maintain friendly app tone:

- "Are you sure?" → "Sei sicuro/a?"
- "Your profile" → "Il tuo profilo"

### Gender-Neutral Language

When possible, use gender-neutral forms:

- "removed" → "rimosso/a" or just "rimosso"
- "accepted" → "accettato/a" or just "accettato"

### Preserve Variables

Keep ALL placeholder variables intact:

- `{{count}}` → mantieni così
- `{{userName}}` → mantieni così
- `{{date}}` → mantieni così
- `{{distance}} km` → `{{distance}} km`

## Example Translations

```json
{
  "club": {
    "clubMembers": {
      "loading": "Caricamento membri...",
      "memberCount": "{{count}} membro/i",
      "alerts": {
        "promoteSuccess": "Promosso/a a manager con successo.",
        "removeSuccess": "Il membro è stato rimosso.",
        "permissionDenied": "Permesso negato. Solo gli amministratori possono eseguire questa azione."
      }
    }
  }
}
```

## Success Criteria

1. ✅ All 1100 keys translated to natural Italian
2. ✅ No keys remain where it.json === en.json (except universal constants like "OK", "km")
3. ✅ Proper grammar and natural phrasing
4. ✅ Variables preserved exactly
5. ✅ File structure maintained

## Execution Steps

1. Create `italian-translations-complete.json` with ALL translations
2. Create `apply-italian-translations.js` script
3. Run the script to merge translations
4. Verify with `node scripts/complete-italian-translations.js`
5. Commit with message: "feat(i18n): Complete all 1100 Italian translations"

---

**Priority**: HIGH
**Estimated Time**: 2-3 hours
**Assigned To**: Captain America (general-purpose agent)
