#!/usr/bin/env node
const fs = require('fs');

const en = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));
const es = JSON.parse(fs.readFileSync('src/locales/es.json', 'utf8'));

function check(section, obj1, obj2, prefix = '') {
  const results = [];
  for (const [key, value] of Object.entries(obj1)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      results.push(...check(section, value, obj2?.[key] || {}, path));
    } else {
      const missing = !obj2 || !(key in obj2);
      const untranslated = obj2?.[key] === value;
      if (missing || untranslated) {
        results.push({ path, value, missing, untranslated });
      }
    }
  }
  return results;
}

const sections = ['clubOverview', 'clubHome', 'members', 'createNew', 'discover'];

console.log('SPANISH (es.json) - DETAILED MISSING TRANSLATIONS');
console.log('='.repeat(80));
console.log('');

for (const section of sections) {
  if (!en[section]) continue;

  console.log(`\n${section.toUpperCase()}:`);
  console.log('-'.repeat(80));

  const results = check(section, en[section], es[section], section);

  if (results.length === 0) {
    console.log('  ✓ All keys translated!');
    continue;
  }

  const missing = results.filter(r => r.missing);
  const untranslated = results.filter(r => r.untranslated);

  if (missing.length > 0) {
    console.log(`\n  MISSING (${missing.length} keys):`);
    missing.forEach(r => console.log(`    ✗ ${r.path}: "${r.value}"`));
  }

  if (untranslated.length > 0) {
    console.log(`\n  UNTRANSLATED (${untranslated.length} keys - still in English):`);
    untranslated.forEach(r => console.log(`    = ${r.path}: "${r.value}"`));
  }
}
