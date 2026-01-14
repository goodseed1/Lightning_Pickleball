const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');
const languages = ['ja', 'zh', 'de', 'fr', 'es', 'it', 'pt', 'ru'];

// 모든 키 경로 추출 함수
function getAllKeyPaths(obj, prefix = '') {
  let keys = [];
  for (const key in obj) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(getAllKeyPaths(obj[key], fullPath));
    } else {
      keys.push(fullPath);
    }
  }
  return keys;
}

// 중첩 객체에 값 설정
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

// 중첩 객체에서 값 가져오기
function getNestedValue(obj, path) {
  return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}

// 동기화 함수
function syncTranslations() {
  const enJson = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'));
  const enKeys = getAllKeyPaths(enJson);

  let totalMissing = 0;

  languages.forEach(lang => {
    const langPath = path.join(localesDir, `${lang}.json`);
    const langJson = JSON.parse(fs.readFileSync(langPath, 'utf8'));
    const langKeys = getAllKeyPaths(langJson);

    const missingKeys = enKeys.filter(k => !langKeys.includes(k));

    if (missingKeys.length > 0) {
      totalMissing += missingKeys.length;
      console.log(`${lang}.json: ${missingKeys.length} missing keys`);

      missingKeys.forEach(key => {
        const enValue = getNestedValue(enJson, key);
        if (enValue !== undefined) {
          setNestedValue(langJson, key, `[${lang.toUpperCase()}] ${enValue}`);
        }
      });

      fs.writeFileSync(langPath, JSON.stringify(langJson, null, 2) + '\n', 'utf8');
    }
  });

  return totalMissing;
}

// 반복 실행
console.log('Starting translation sync...\n');
let iteration = 1;
let totalMissing = 0;

do {
  console.log(`Iteration ${iteration}:`);
  const enJson = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'));
  const enKeys = getAllKeyPaths(enJson);
  console.log(`en.json has ${enKeys.length} keys`);

  totalMissing = syncTranslations();

  if (totalMissing > 0) {
    console.log(`Total missing keys in this iteration: ${totalMissing}\n`);
  }

  iteration++;
} while (totalMissing > 0 && iteration <= 10);

if (totalMissing === 0) {
  console.log('\n✅ All translations are now in sync!');
} else {
  console.log('\n⚠️  Some keys may still be missing after 10 iterations');
}
