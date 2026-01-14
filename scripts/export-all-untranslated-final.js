#!/usr/bin/env node

const fs = require('fs');

const en = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));
const languages = ['es', 'de', 'pt', 'it'];

function findUntranslated(enObj, targetObj, path = '') {
  const untranslated = [];

  for (const key in enObj) {
    const currentPath = path ? path + '.' + key : key;
    const enVal = enObj[key];
    const targetVal = targetObj ? targetObj[key] : undefined;

    if (typeof enVal === 'object' && enVal !== null) {
      untranslated.push(...findUntranslated(enVal, targetVal, currentPath));
    } else if (typeof enVal === 'string' && enVal === targetVal) {
      // Only flag if it looks like English
      const englishPattern =
        /^[A-Z]|\\b(the|is|are|and|or|to|for|in|on|at|by|with|from|of|your|you|this|that|it|not|no|yes|have|has|can|will|would|could|should|be|been|being|do|does|did|done|make|made|get|got|go|went|gone|see|saw|seen|take|took|taken|send|message|add|friend|profile|user|match|win|loss|error|success|loading|back|cancel|confirm|delete|edit|save|update|create|join|leave|view|show|hide|search|filter|all|none|select|selected|total|score|rank|level|club|team|player|game|tournament|league|event|activity|notification|setting|help|about|privacy|terms|logout|login|sign|register|email|password|name|nickname|gender|male|female|other|location|distance|time|date|day|week|month|year|today|tomorrow|yesterday|now|later|soon|never|always|sometimes|often|rarely|very|more|less|most|least|best|worst|first|last|next|previous|new|old|start|end|begin|finish|open|close|on|off|enable|disable|allow|deny|accept|reject|approve|pending|complete|incomplete|active|inactive|available|unavailable)\\b/i;
      if (englishPattern.test(enVal) && enVal.length > 2) {
        untranslated.push({ path: currentPath, value: enVal });
      }
    }
  }

  return untranslated;
}

const results = {};

languages.forEach(lang => {
  const targetFile = JSON.parse(fs.readFileSync(`src/locales/${lang}.json`, 'utf8'));
  const untranslated = findUntranslated(en, targetFile);

  results[lang] = untranslated.reduce((acc, item) => {
    acc[item.path] = item.value;
    return acc;
  }, {});

  console.log(`${lang.toUpperCase()}: ${untranslated.length} keys`);
});

fs.writeFileSync('scripts/untranslated-all-final.json', JSON.stringify(results, null, 2));
console.log('\n✅ Exported to scripts/untranslated-all-final.json');
