const fs = require('fs');

const en = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));
const es = JSON.parse(fs.readFileSync('src/locales/es.json', 'utf8'));

function findUntranslated(enObj, esObj, path = '') {
  const untranslated = [];

  for (const key in enObj) {
    const currentPath = path ? path + '.' + key : key;
    const enVal = enObj[key];
    const esVal = esObj ? esObj[key] : undefined;

    if (typeof enVal === 'object' && enVal !== null) {
      untranslated.push(...findUntranslated(enVal, esVal, currentPath));
    } else if (typeof enVal === 'string' && enVal === esVal) {
      // Only flag if it looks like English (contains common English words/patterns)
      const englishPattern =
        /^[A-Z]|\b(the|is|are|and|or|to|for|in|on|at|by|with|from|of|your|you|this|that|it|not|no|yes|have|has|can|will|would|could|should|be|been|being|do|does|did|done|make|made|get|got|go|went|gone|see|saw|seen|take|took|taken|send|message|add|friend|profile|user|match|win|loss|error|success|loading|back|cancel|confirm|delete|edit|save|update|create|join|leave|view|show|hide|search|filter|all|none|select|selected|total|score|rank|level|club|team|player|game|tournament|league|event|activity|notification|setting|help|about|privacy|terms|logout|login|sign|register|email|password|name|nickname|gender|male|female|other|location|distance|time|date|day|week|month|year|today|tomorrow|yesterday|now|later|soon|never|always|sometimes|often|rarely|very|more|less|most|least|best|worst|first|last|next|previous|new|old|start|end|begin|finish|open|close|on|off|enable|disable|allow|deny|accept|reject|approve|pending|complete|incomplete|active|inactive|available|unavailable)\b/i;
      if (englishPattern.test(enVal) && enVal.length > 2) {
        untranslated.push({ path: currentPath, value: enVal });
      }
    }
  }

  return untranslated;
}

const untranslated = findUntranslated(en, es);

console.log(`Found ${untranslated.length} potentially untranslated keys in Spanish:\n`);

// Group by top-level section
const grouped = {};
untranslated.forEach(item => {
  const section = item.path.split('.')[0];
  if (!grouped[section]) {
    grouped[section] = [];
  }
  grouped[section].push(item);
});

Object.keys(grouped)
  .sort()
  .forEach(section => {
    console.log(`\n=== ${section} (${grouped[section].length} keys) ===`);
    grouped[section].slice(0, 20).forEach(item => {
      console.log(`  ${item.path}: "${item.value}"`);
    });
    if (grouped[section].length > 20) {
      console.log(`  ... and ${grouped[section].length - 20} more`);
    }
  });
