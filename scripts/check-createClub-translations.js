const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');
const languages = ['en', 'ko', 'es', 'de', 'fr', 'it', 'ja', 'pt', 'ru', 'zh'];

// Keys used in CreateClubScreen components
const requiredKeys = [
  'createClub.title',
  'createClub.editTitle',
  'createClub.court_address',
  'createClub.regular_meet',
  'createClub.visibility',
  'createClub.visibility_public',
  'createClub.visibility_private',
  'createClub.fees',
  'createClub.facilities',
  'createClub.rules',
  'createClub.fields.name',
  'createClub.fields.intro',
  'createClub.fields.address_label',
  'createClub.fields.address_placeholder',
  'createClub.errors.address_required',
  'createClub.add_meeting',
  'createClub.hints.public_club',
  'createClub.cta',
  'createClub.tapToChangeLogo',
  'common.required',
];

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current && current[key], obj);
}

console.log('🔍 Checking createClub translations...\n');

const missingByLang = {};

languages.forEach(lang => {
  const filePath = path.join(localesDir, `${lang}.json`);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const missing = [];

  requiredKeys.forEach(key => {
    const value = getNestedValue(content, key);
    if (!value) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    missingByLang[lang] = missing;
    console.log(`❌ ${lang.toUpperCase()}: ${missing.length} missing keys`);
    missing.forEach(key => console.log(`   - ${key}`));
    console.log('');
  } else {
    console.log(`✅ ${lang.toUpperCase()}: All keys present`);
  }
});

console.log('\n📊 Summary:');
Object.keys(missingByLang).forEach(lang => {
  console.log(`   ${lang.toUpperCase()}: ${missingByLang[lang].length} missing`);
});

if (Object.keys(missingByLang).length === 0) {
  console.log('   All languages have complete createClub translations! 🎉');
}
