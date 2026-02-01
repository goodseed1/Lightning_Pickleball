/**
 * Firestore 한국어 → 영어 번역 스크립트
 *
 * 사용법:
 *   node scripts/translate-firestore-to-english.js --dry-run    # 미리보기 (변경 없음)
 *   node scripts/translate-firestore-to-english.js              # 실제 번역 실행
 *   node scripts/translate-firestore-to-english.js --collection=users  # 특정 컬렉션만
 *
 * 요구사항:
 *   - Gemini API 키 (.env 파일의 EXPO_PUBLIC_GEMINI_API_KEY)
 *   - serviceAccountKey.json
 */

const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Firebase Admin 초기화
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
});

const db = admin.firestore();

// Gemini AI 초기화
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('❌ EXPO_PUBLIC_GEMINI_API_KEY가 .env 파일에 없습니다!');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
// gemini-2.5-flash (최신 안정 모델)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// ====================
// 설정
// ====================

// 명령줄 인자 파싱
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const SPECIFIC_COLLECTION = args.find(arg => arg.startsWith('--collection='))?.split('=')[1];

// 번역할 컬렉션 및 필드 정의
const TRANSLATION_CONFIG = {
  pickleball_clubs: {
    fields: ['name', 'description', 'rules'],
    nameField: null,
  },
  club_posts: {
    fields: ['title', 'content'],
    nameField: null,
  },
  events: {
    fields: ['title', 'description', 'location'],
    nameField: null,
  },
  tournaments: {
    fields: ['tournamentName', 'description'],
    nameField: null,
  },
  regular_leagues: {
    fields: ['name', 'description'],
    nameField: null,
  },
  users: {
    fields: ['bio'],
    nameField: 'displayName', // 한국어 이름 → 영어 이름 변환
  },
  meetups: {
    fields: ['title', 'description'],
    nameField: null,
  },
};

// 영어 이름 풀 (First + Last 조합)
const FIRST_NAMES = [
  'James',
  'John',
  'Michael',
  'David',
  'Chris',
  'Robert',
  'William',
  'Richard',
  'Joseph',
  'Thomas',
  'Sarah',
  'Emily',
  'Jessica',
  'Ashley',
  'Emma',
  'Olivia',
  'Sophia',
  'Isabella',
  'Mia',
  'Charlotte',
  'Daniel',
  'Matthew',
  'Anthony',
  'Mark',
  'Donald',
  'Steven',
  'Paul',
  'Andrew',
  'Joshua',
  'Kenneth',
  'Jennifer',
  'Elizabeth',
  'Linda',
  'Barbara',
  'Susan',
  'Margaret',
  'Dorothy',
  'Lisa',
  'Nancy',
  'Karen',
  'Brian',
  'Edward',
  'Ronald',
  'Timothy',
  'Jason',
  'Jeffrey',
  'Ryan',
  'Jacob',
  'Gary',
  'Nicholas',
];

const LAST_NAMES = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Davis',
  'Miller',
  'Wilson',
  'Moore',
  'Taylor',
  'Anderson',
  'Thomas',
  'Jackson',
  'White',
  'Harris',
  'Martin',
  'Thompson',
  'Garcia',
  'Martinez',
  'Robinson',
  'Clark',
  'Rodriguez',
  'Lewis',
  'Lee',
  'Walker',
  'Hall',
  'Allen',
  'Young',
  'King',
  'Wright',
  'Scott',
  'Green',
  'Baker',
  'Adams',
  'Nelson',
  'Hill',
  'Ramirez',
  'Campbell',
  'Mitchell',
  'Roberts',
];

// 이름 매핑 저장 (일관성 유지)
const nameMapping = new Map();
let nameIndex = 0;

// ====================
// 유틸리티 함수
// ====================

/**
 * 한글 포함 여부 확인
 */
function containsKorean(text) {
  if (!text || typeof text !== 'string') return false;
  return /[\uAC00-\uD7AF]/.test(text);
}

/**
 * 고유한 영어 이름 생성
 */
function generateUniqueName(koreanName) {
  // 이미 매핑된 이름이 있으면 반환
  if (nameMapping.has(koreanName)) {
    return nameMapping.get(koreanName);
  }

  // 새로운 영어 이름 생성
  const firstNameIndex = Math.floor(nameIndex / LAST_NAMES.length) % FIRST_NAMES.length;
  const lastNameIndex = nameIndex % LAST_NAMES.length;

  const englishName = `${FIRST_NAMES[firstNameIndex]} ${LAST_NAMES[lastNameIndex]}`;

  nameMapping.set(koreanName, englishName);
  nameIndex++;

  return englishName;
}

/**
 * Gemini로 텍스트 번역
 */
async function translateWithGemini(text) {
  if (!text || !containsKorean(text)) {
    return text;
  }

  try {
    const prompt = `Translate the following Korean text to natural English. Keep proper nouns, place names, and technical terms as-is. Only return the translated text, nothing else.

Text: ${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translatedText = response.text().trim();

    return translatedText;
  } catch (error) {
    console.error(`   ⚠️ 번역 실패: ${error.message}`);
    return text; // 실패 시 원본 반환
  }
}

/**
 * Rate limiting을 위한 지연
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ====================
// 컬렉션 번역 함수
// ====================

/**
 * 단일 컬렉션 번역
 */
async function translateCollection(collectionName, config) {
  console.log(`\n📝 ${collectionName} 번역 중...`);

  const snapshot = await db.collection(collectionName).get();
  let translatedCount = 0;
  let skippedCount = 0;

  const batch = db.batch();
  let batchCount = 0;
  const MAX_BATCH_SIZE = 450; // Firestore 제한은 500이지만 여유 확보

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const updates = {};
    let needsUpdate = false;

    // 이름 필드 처리 (한국어 → 영어 이름)
    if (config.nameField && data[config.nameField]) {
      const originalName = data[config.nameField];
      if (containsKorean(originalName)) {
        const newName = generateUniqueName(originalName);
        updates[config.nameField] = newName;
        needsUpdate = true;

        if (DRY_RUN) {
          console.log(`   👤 이름: "${originalName}" → "${newName}"`);
        }
      }
    }

    // 일반 필드 번역
    for (const field of config.fields) {
      if (data[field] && containsKorean(data[field])) {
        const originalText = data[field];
        const translatedText = await translateWithGemini(originalText);

        if (translatedText !== originalText) {
          updates[field] = translatedText;
          needsUpdate = true;

          if (DRY_RUN) {
            const preview = originalText.substring(0, 50) + (originalText.length > 50 ? '...' : '');
            const translatedPreview =
              translatedText.substring(0, 50) + (translatedText.length > 50 ? '...' : '');
            console.log(`   📄 ${field}: "${preview}" → "${translatedPreview}"`);
          }
        }

        // Rate limiting (분당 10개 제한 → 10초 대기, 안전하게 분당 6개)
        await delay(10000);
      }
    }

    if (needsUpdate) {
      if (!DRY_RUN) {
        batch.update(doc.ref, updates);
        batchCount++;

        // 배치 크기 제한 체크
        if (batchCount >= MAX_BATCH_SIZE) {
          await batch.commit();
          console.log(`   💾 ${batchCount}개 문서 저장 완료`);
          batchCount = 0;
        }
      }
      translatedCount++;
    } else {
      skippedCount++;
    }
  }

  // 남은 배치 커밋
  if (!DRY_RUN && batchCount > 0) {
    await batch.commit();
    console.log(`   💾 ${batchCount}개 문서 저장 완료`);
  }

  console.log(`   ✅ ${collectionName}: ${translatedCount}개 번역, ${skippedCount}개 스킵`);
  return { translated: translatedCount, skipped: skippedCount };
}

/**
 * 클럽 채팅 번역 (서브컬렉션)
 */
async function translateClubChats() {
  console.log(`\n💬 club_chats (서브컬렉션) 번역 중...`);

  const clubsSnapshot = await db.collection('pickleball_clubs').get();
  let totalTranslated = 0;
  let totalSkipped = 0;

  for (const clubDoc of clubsSnapshot.docs) {
    const chatsRef = db.collection('pickleball_clubs').doc(clubDoc.id).collection('chats');
    const chatsSnapshot = await chatsRef.get();

    if (chatsSnapshot.empty) continue;

    const batch = db.batch();
    let batchCount = 0;

    for (const chatDoc of chatsSnapshot.docs) {
      const chatData = chatDoc.data();

      // text 필드 번역
      if (chatData.text && containsKorean(chatData.text)) {
        const originalText = chatData.text;
        const translatedText = await translateWithGemini(originalText);

        if (translatedText !== originalText) {
          if (DRY_RUN) {
            const preview = originalText.substring(0, 40) + (originalText.length > 40 ? '...' : '');
            console.log(`   💭 채팅: "${preview}"`);
          } else {
            batch.update(chatDoc.ref, { text: translatedText });
            batchCount++;
          }
          totalTranslated++;
        }

        await delay(10000);
      } else {
        totalSkipped++;
      }
    }

    if (!DRY_RUN && batchCount > 0) {
      await batch.commit();
    }
  }

  console.log(`   ✅ club_chats: ${totalTranslated}개 번역, ${totalSkipped}개 스킵`);
  return { translated: totalTranslated, skipped: totalSkipped };
}

// ====================
// 메인 실행
// ====================

async function main() {
  console.log('\n🚀 Firestore 한→영 번역 시작\n');
  console.log(`   모드: ${DRY_RUN ? '🔍 DRY RUN (미리보기)' : '⚡ 실제 번역'}`);

  if (SPECIFIC_COLLECTION) {
    console.log(`   대상: ${SPECIFIC_COLLECTION} 컬렉션만`);
  }

  console.log('');

  const stats = {
    totalTranslated: 0,
    totalSkipped: 0,
  };

  // 일반 컬렉션 번역
  for (const [collectionName, config] of Object.entries(TRANSLATION_CONFIG)) {
    if (SPECIFIC_COLLECTION && collectionName !== SPECIFIC_COLLECTION) {
      continue;
    }

    try {
      const result = await translateCollection(collectionName, config);
      stats.totalTranslated += result.translated;
      stats.totalSkipped += result.skipped;
    } catch (error) {
      console.error(`   ❌ ${collectionName} 번역 실패: ${error.message}`);
    }
  }

  // 클럽 채팅 번역
  if (!SPECIFIC_COLLECTION || SPECIFIC_COLLECTION === 'club_chats') {
    try {
      const result = await translateClubChats();
      stats.totalTranslated += result.translated;
      stats.totalSkipped += result.skipped;
    } catch (error) {
      console.error(`   ❌ club_chats 번역 실패: ${error.message}`);
    }
  }

  // 이름 매핑 저장
  if (!DRY_RUN && nameMapping.size > 0) {
    const mappingFile = path.join(__dirname, '..', 'backups', `name-mapping-${Date.now()}.json`);
    const mappingData = Object.fromEntries(nameMapping);
    fs.writeFileSync(mappingFile, JSON.stringify(mappingData, null, 2));
    console.log(`\n📋 이름 매핑 저장: ${mappingFile}`);
  }

  // 결과 출력
  console.log('\n' + '='.repeat(50));
  console.log('📊 번역 결과:');
  console.log(`   ✅ 번역됨: ${stats.totalTranslated}개`);
  console.log(`   ⏭️ 스킵됨: ${stats.totalSkipped}개`);
  console.log(`   👤 이름 변환: ${nameMapping.size}개`);

  if (DRY_RUN) {
    console.log('\n💡 실제 번역을 실행하려면:');
    console.log('   node scripts/translate-firestore-to-english.js');
  }

  console.log('\n✅ 완료!\n');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });
