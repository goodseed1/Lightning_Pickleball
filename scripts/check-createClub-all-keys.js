const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');
const languages = ['en', 'ko', 'es', 'de', 'fr', 'it', 'ja', 'pt', 'ru', 'zh'];

// All keys used in CreateClubScreen components
const requiredKeys = [
  // CreateClubScreen.tsx
  'createClub.title',
  'createClub.editTitle',
  'createClub.loading',
  'createClub.creating',
  'createClub.cta',

  // Section titles
  'createClub.court_address',
  'createClub.regular_meet',
  'createClub.visibility',
  'createClub.fees',
  'createClub.facilities',
  'createClub.rules',

  // Visibility options
  'createClub.visibility_public',
  'createClub.visibility_private',
  'createClub.hints.public_club',

  // CourtAddressSection.tsx
  'createClub.fields.address_label',
  'createClub.fields.address_placeholder',
  'createClub.errors.address_required',

  // MeetingScheduleSection.tsx
  'createClub.add_meeting',

  // FeesSection.tsx - NEW!
  'createClub.joinFee',
  'createClub.joinFeePlaceholder',
  'createClub.monthlyFee',
  'createClub.monthlyFeePlaceholder',
  'createClub.yearlyFee',
  'createClub.yearlyFeePlaceholder',
  'createClub.feesHint',

  // FacilitiesSection.tsx
  'createClub.facility.lights',
  'createClub.facility.indoor',
  'createClub.facility.parking',
  'createClub.facility.ballmachine',
  'createClub.facility.locker',
  'createClub.facility.proshop',

  // RulesSection.tsx
  'createClub.fields.rules',
  'createClub.fields.rules_placeholder',

  // BasicInfoSection.tsx
  'createClub.tapToChangeLogo',
  'createClub.fields.name',
  'createClub.fields.name_placeholder',
  'createClub.fields.intro',
  'createClub.fields.intro_placeholder',

  // Validation messages
  'createClub.validation.nameRequired',
  'createClub.validation.nameMin',
  'createClub.validation.nameMax',
  'createClub.validation.nameValid',
  'createClub.validation.descRequired',
  'createClub.validation.descMin',
  'createClub.validation.descMax',
  'createClub.validation.descValid',
  'createClub.validation.descShort',
  'createClub.validation.addressRequired',
  'createClub.validation.addressValid',
  'createClub.validation.meetingsRequired',
  'createClub.validation.meetingsValid',

  // Alert messages
  'createClub.alerts.limitTitle',
  'createClub.alerts.limitMessage',
  'createClub.alerts.saveSuccess',
  'createClub.alerts.saveSuccessMessage',
  'createClub.alerts.saveFailed',
  'createClub.alerts.createSuccess',
  'createClub.alerts.createSuccessMessage',
  'createClub.alerts.createFailed',

  // Common keys used in CreateClub
  'common.required',
  'common.error',
  'common.ok',
];

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current && current[key], obj);
}

console.log('🔍 Comprehensive CreateClub translations check...\n');
console.log(`Checking ${requiredKeys.length} keys across ${languages.length} languages\n`);

const missingByLang = {};
let totalMissing = 0;

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
    totalMissing += missing.length;
    console.log(`❌ ${lang.toUpperCase()}: ${missing.length} missing keys`);
    missing.forEach(key => console.log(`   - ${key}`));
    console.log('');
  } else {
    console.log(`✅ ${lang.toUpperCase()}: All ${requiredKeys.length} keys present`);
  }
});

console.log('\n📊 Summary:');
if (totalMissing === 0) {
  console.log('   🎉 All languages have complete CreateClub translations!');
} else {
  console.log(`   ⚠️  Total missing keys: ${totalMissing}`);
  Object.keys(missingByLang).forEach(lang => {
    console.log(`   ${lang.toUpperCase()}: ${missingByLang[lang].length} missing`);
  });
}
