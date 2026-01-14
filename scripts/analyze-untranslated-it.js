#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const untranslatedFile = path.join(__dirname, 'untranslated-it.json');
const data = JSON.parse(fs.readFileSync(untranslatedFile, 'utf8'));

// Group by top-level section
const sections = {};

data.forEach(item => {
  const topLevel = item.key.split('.')[0];
  if (!sections[topLevel]) {
    sections[topLevel] = [];
  }
  sections[topLevel].push(item);
});

// Sort by count
const sorted = Object.entries(sections)
  .map(([name, items]) => ({ name, count: items.length }))
  .sort((a, b) => b.count - a.count);

console.log(`\nTotal untranslated keys: ${data.length}\n`);
console.log('Top sections with untranslated keys:\n');

sorted.forEach(({ name, count }, index) => {
  console.log(`${(index + 1).toString().padStart(2)}. ${name.padEnd(40)} ${count} keys`);
});

console.log('\n\nTop 5 sections detail:\n');

sorted.slice(0, 5).forEach(({ name, count }) => {
  console.log(`\n=== ${name} (${count} keys) ===`);
  const items = sections[name];
  items.slice(0, 10).forEach(item => {
    const displayValue =
      item.enValue.length > 60 ? item.enValue.substring(0, 60) + '...' : item.enValue;
    console.log(`  ${item.key}: "${displayValue}"`);
  });
  if (items.length > 10) {
    console.log(`  ... and ${items.length - 10} more`);
  }
});
