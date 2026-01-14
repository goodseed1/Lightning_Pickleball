# Translation Utility Scripts

This directory contains utility scripts for managing translations in Lightning Tennis.

## Spanish Translation Scripts (Production Ready)

### 1. find-untranslated-es.js

**Purpose**: Find all keys in es.json that match en.json (untranslated)

**Usage**:

```bash
node scripts/find-untranslated-es.js
```

**Output**:

- Lists all untranslated keys by section
- Shows total count of untranslated keys
- Useful for identifying missing translations

### 2. spanish-translation-report.js

**Purpose**: Generate comprehensive Spanish translation completion report

**Usage**:

```bash
node scripts/spanish-translation-report.js
```

**Output**:

- Total keys count
- Translated keys count
- Universal/technical terms count
- Completion percentage
- Summary of universal terms kept in English

---

## Other Language Scripts

### German (de)

- `find-untranslated-de.js` - Find untranslated German keys

### Portuguese (pt)

- `find-untranslated-pt.js` - Find untranslated Portuguese keys

### Russian (ru)

- `find-untranslated-ru.js` - Find untranslated Russian keys

### All Languages

- `find-untranslated-all-languages.js` - Scan all language files

---

## Archived/Legacy Scripts

The following scripts were used during development and are kept for reference:

- `complete-spanish-dict.js`
- `complete-spanish-translations.js`
- `final-complete-spanish.js`
- `final-spanish-translation.js`
- `translate-spanish-complete.js`
- `translate-spanish-final.js`
- `ultimate-spanish-translation.js`

---

## How to Add a New Language

1. Create `src/locales/[lang].json` (copy from en.json)
2. Create `scripts/find-untranslated-[lang].js` (copy from find-untranslated-es.js)
3. Translate keys section by section
4. Use find-untranslated script to verify completion
5. Generate final report using spanish-translation-report.js as template

---

**Last Updated**: December 29, 2025
**Maintainer**: Kim (Claude Code)
