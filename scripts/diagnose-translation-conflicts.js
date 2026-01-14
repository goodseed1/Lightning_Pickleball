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

// 중첩 객체에서 값 가져오기
function getNestedValue(obj, path) {
  return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}

// 타입 체크 함수
function getTypeAtPath(obj, path) {
  const value = getNestedValue(obj, path);
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

const enJson = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'));
const enKeys = getAllKeyPaths(enJson);

console.log('🔍 Diagnosing translation conflicts...\n');
console.log(`en.json has ${enKeys.length} keys\n`);

languages.forEach(lang => {
  const langPath = path.join(localesDir, `${lang}.json`);
  const langJson = JSON.parse(fs.readFileSync(langPath, 'utf8'));
  const langKeys = getAllKeyPaths(langJson);

  const missingKeys = enKeys.filter(k => !langKeys.includes(k));

  console.log(`\n📄 ${lang}.json: ${missingKeys.length} missing keys`);

  if (missingKeys.length > 0) {
    // 구조적 충돌 감지
    const conflicts = [];

    missingKeys.forEach(key => {
      const parts = key.split('.');
      for (let i = 1; i < parts.length; i++) {
        const parentPath = parts.slice(0, i).join('.');
        const enType = getTypeAtPath(enJson, parentPath);
        const langType = getTypeAtPath(langJson, parentPath);

        if (enType === 'object' && langType === 'string') {
          conflicts.push({
            path: parentPath,
            enType,
            langType,
            langValue: getNestedValue(langJson, parentPath),
          });
          break;
        }
      }
    });

    if (conflicts.length > 0) {
      console.log('\n  ⚠️  STRUCTURAL CONFLICTS FOUND:');
      const uniqueConflicts = Array.from(new Set(conflicts.map(c => c.path))).map(path =>
        conflicts.find(c => c.path === path)
      );

      uniqueConflicts.forEach(c => {
        console.log(`    ${c.path}`);
        console.log(`      en: ${c.enType} (nested object)`);
        console.log(`      ${lang}: ${c.langType} = "${c.langValue}"`);
        console.log(`      ❌ Cannot add nested keys to a string value`);
      });
    }

    // 누락된 키 샘플 표시
    console.log('\n  📋 First 10 missing keys:');
    missingKeys.slice(0, 10).forEach(k => {
      console.log(`    - ${k}`);
    });
  }
});

console.log('\n\n✅ Diagnosis complete!');
