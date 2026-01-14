/**
 * 🔧 Fix i18n Variable Syntax Script
 *
 * This script fixes incorrect i18n interpolation syntax in locale files.
 *
 * Problem: i18next requires double curly braces {{variable}}
 * but some translation keys use single curly braces {variable}
 *
 * This script converts: {variable} → {{variable}}
 * Without affecting already correct {{variable}} patterns
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../src/locales');

// List of known variable names that need fixing
const VARIABLE_PATTERNS = [
  'eventTitle',
  'position',
  'min',
  'max',
  'eventType',
  'senderName',
  'message',
  'partnerName',
  'targetNickname',
  'clubName',
  'matchDate',
  'matchTime',
  'matchLocation',
  'opponentName',
  'score',
  'courtName',
  'courtNumber',
  'duration',
  'name',
  'date',
  'time',
  'location',
  'count',
  'level',
  'rating',
  'total',
  'current',
  'remaining',
  'number',
  'nickname',
  'userName',
  'playerName',
  'teamName',
  'leagueName',
  'tournamentName',
  'firstName',
  'lastName',
  'skillLevel',
  'points',
  'rank',
  'wins',
  'losses',
  'title',
  'value',
  'amount',
  'percent',
  'percentage',
  'year',
  'month',
  'day',
  'hour',
  'minute',
  'second',
  'address',
  'city',
  'state',
  'country',
  'zipCode',
  'phone',
  'email',
  'url',
  'link',
  'code',
  'id',
  'index',
  'item',
  'type',
  'status',
  'error',
  'success',
  'warning',
  'info',
];

function fixI18nSyntax(content) {
  let fixed = content;
  let fixCount = 0;

  // Generic regex to find single-brace patterns that are NOT already double-braced
  // Match {word} but not {{word}} or {word}}
  const singleBracePattern = /(?<!\{)\{([a-zA-Z_][a-zA-Z0-9_]*)\}(?!\})/g;

  fixed = content.replace(singleBracePattern, (match, varName) => {
    fixCount++;
    return `{{${varName}}}`;
  });

  return { fixed, fixCount };
}

function processLocaleFile(filePath) {
  console.log(`\n📄 Processing: ${path.basename(filePath)}`);

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { fixed, fixCount } = fixI18nSyntax(content);

    if (fixCount > 0) {
      // Validate JSON before writing
      try {
        JSON.parse(fixed);
        fs.writeFileSync(filePath, fixed, 'utf8');
        console.log(`   ✅ Fixed ${fixCount} patterns`);
        return fixCount;
      } catch (parseError) {
        console.error(`   ❌ JSON parse error after fix: ${parseError.message}`);
        return 0;
      }
    } else {
      console.log('   ✓ No fixes needed');
      return 0;
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return 0;
  }
}

function main() {
  console.log('🔧 i18n Syntax Fixer');
  console.log('====================');
  console.log(`Converting {variable} → {{variable}}\n`);

  const localeFiles = fs
    .readdirSync(LOCALES_DIR)
    .filter(file => file.endsWith('.json') && !file.endsWith('.backup'))
    .map(file => path.join(LOCALES_DIR, file));

  let totalFixes = 0;

  for (const file of localeFiles) {
    totalFixes += processLocaleFile(file);
  }

  console.log('\n====================');
  console.log(`🎉 Total fixes: ${totalFixes}`);
  console.log('✅ All locale files processed!');
}

main();
