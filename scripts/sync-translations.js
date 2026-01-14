const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');
const languages = ['ja', 'zh', 'de', 'fr', 'es', 'it', 'pt', 'ru'];

// en.json 기준으로 읽기
const enJson = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'));

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

const enKeys = getAllKeyPaths(enJson);
console.log(`en.json has ${enKeys.length} keys`);

// 각 언어별로 누락 키 확인 및 추가
languages.forEach(lang => {
  const langPath = path.join(localesDir, `${lang}.json`);
  const langJson = JSON.parse(fs.readFileSync(langPath, 'utf8'));
  const langKeys = getAllKeyPaths(langJson);

  const missingKeys = enKeys.filter(k => !langKeys.includes(k));
  console.log(`${lang}.json: ${missingKeys.length} missing keys`);

  if (missingKeys.length > 0) {
    console.log(`  Adding missing keys to ${lang}.json...`);

    // 누락된 키에 영어 값을 추가 (placeholder로)
    missingKeys.forEach(key => {
      const enValue = getNestedValue(enJson, key);
      if (enValue !== undefined) {
        setNestedValue(langJson, key, `[${lang.toUpperCase()}] ${enValue}`);
      }
    });

    // 정렬된 JSON 저장
    fs.writeFileSync(langPath, JSON.stringify(langJson, null, 2) + '\n', 'utf8');
    console.log(`  ✅ Updated ${lang}.json`);
  } else {
    console.log(`  ✅ ${lang}.json is complete`);
  }
});

console.log('\n✅ Translation sync complete!');
