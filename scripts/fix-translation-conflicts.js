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

console.log('🔧 Fixing translation structural conflicts...\n');
console.log(`en.json has ${enKeys.length} keys\n`);

languages.forEach(lang => {
  const langPath = path.join(localesDir, `${lang}.json`);
  const langJson = JSON.parse(fs.readFileSync(langPath, 'utf8'));
  const langKeys = getAllKeyPaths(langJson);

  const missingKeys = enKeys.filter(k => !langKeys.includes(k));

  if (missingKeys.length === 0) {
    console.log(`✅ ${lang}.json: No missing keys`);
    return;
  }

  console.log(`\n📄 ${lang}.json: ${missingKeys.length} missing keys`);

  // 구조적 충돌 감지 및 수정
  const conflicts = new Set();

  missingKeys.forEach(key => {
    const parts = key.split('.');
    for (let i = 1; i < parts.length; i++) {
      const parentPath = parts.slice(0, i).join('.');
      const enType = getTypeAtPath(enJson, parentPath);
      const langType = getTypeAtPath(langJson, parentPath);

      if (enType === 'object' && langType === 'string') {
        conflicts.add(parentPath);
      }
    }
  });

  if (conflicts.size > 0) {
    console.log(`  ⚠️  Found ${conflicts.size} structural conflicts`);

    conflicts.forEach(conflictPath => {
      const oldValue = getNestedValue(langJson, conflictPath);
      const enValue = getNestedValue(enJson, conflictPath);

      console.log(`    Fixing: ${conflictPath}`);
      console.log(`      Old: "${oldValue}" (string)`);
      console.log(`      New: {...} (object with ${Object.keys(enValue).length} keys)`);

      // 문자열 값을 객체로 교체
      setNestedValue(langJson, conflictPath, {});
    });

    console.log(`  ✅ Fixed ${conflicts.size} conflicts`);
  }

  // 이제 누락된 키들을 추가
  console.log(`  📝 Adding ${missingKeys.length} missing keys...`);

  missingKeys.forEach(key => {
    const enValue = getNestedValue(enJson, key);
    if (enValue !== undefined) {
      // Check if parent path is now an object
      const parts = key.split('.');
      let canAdd = true;

      for (let i = 1; i < parts.length; i++) {
        const parentPath = parts.slice(0, i).join('.');
        const parentType = getTypeAtPath(langJson, parentPath);

        if (parentType === 'string') {
          canAdd = false;
          break;
        }
      }

      if (canAdd) {
        setNestedValue(langJson, key, `[${lang.toUpperCase()}] ${enValue}`);
      }
    }
  });

  // 정렬된 JSON 저장
  fs.writeFileSync(langPath, JSON.stringify(langJson, null, 2) + '\n', 'utf8');
  console.log(`  ✅ Updated ${lang}.json`);
});

console.log('\n\n✅ All conflicts fixed! Running verification...\n');

// 검증
languages.forEach(lang => {
  const langPath = path.join(localesDir, `${lang}.json`);
  const langJson = JSON.parse(fs.readFileSync(langPath, 'utf8'));
  const langKeys = getAllKeyPaths(langJson);

  const missingKeys = enKeys.filter(k => !langKeys.includes(k));

  console.log(`${lang}.json: ${missingKeys.length} missing keys`);
});

console.log('\n✅ Complete!');
