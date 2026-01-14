const fs = require('fs');
const en = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));
const de = JSON.parse(fs.readFileSync('src/locales/de.json', 'utf8'));

const wordFreq = {};

function analyze(enObj, deObj) {
  for (const key in enObj) {
    const enValue = enObj[key];
    const deValue = deObj ? deObj[key] : undefined;

    if (enValue && typeof enValue === 'object' && !Array.isArray(enValue)) {
      analyze(enValue, deValue || {});
    } else if (typeof enValue === 'string') {
      if (!deValue || deValue === enValue) {
        const words = enValue.toLowerCase().match(/\b\w+\b/g) || [];
        words.forEach(word => {
          if (word.length > 3) {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
          }
        });
      }
    }
  }
}

analyze(en, de);

const sorted = Object.entries(wordFreq)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 50);

console.log('Top 50 words in untranslated keys:\n');
sorted.forEach(([word, count]) => {
  console.log(`${word.padEnd(20)} ${count}`);
});
