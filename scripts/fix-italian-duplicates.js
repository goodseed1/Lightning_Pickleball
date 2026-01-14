#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const itPath = path.join(__dirname, '../src/locales/it.json');

console.log('🔧 Fixing Italian translation structure issues...\n');

try {
  const itData = JSON.parse(fs.readFileSync(itPath, 'utf8'));

  // Fix: common.common.* should be at common.*
  if (itData.common && itData.common.common) {
    console.log('   • Fixing common.common.* → common.*');
    delete itData.common.common; // Already have them at the right level
  }

  // Ensure all top-level keys have correct values
  itData.common.error = 'Errore';
  itData.common.no = 'No';
  itData.common.ok = 'OK';

  // Write back
  fs.writeFileSync(itPath, JSON.stringify(itData, null, 2) + '\n', 'utf8');

  console.log('✅ Structure fixed!\n');
  console.log('🎯 Verification: node scripts/find-untranslated.js it\n');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
