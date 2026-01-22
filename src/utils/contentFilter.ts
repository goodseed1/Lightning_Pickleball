/**
 * Content Filter Utility - Apple Guideline 1.2 Compliance
 *
 * 유해 콘텐츠 필터링을 위한 유틸리티
 * - 욕설/비속어 감지
 * - 다국어 지원 (10개 언어: en, ko, ja, zh, de, fr, es, it, pt, ru)
 */

// 🔒 욕설/비속어 목록 (다국어)
// 참고: 이 목록은 일반적인 욕설을 포함합니다. 필요시 확장 가능.
const PROFANITY_LIST: Record<string, string[]> = {
  en: [
    // Common English profanity (case-insensitive matching)
    // Base words + common variations (filter catches derivatives like "fucker", "fucking")
    'fuck',
    'fucker',
    'fucking',
    'fucked',
    'fucks',
    'motherfucker',
    'motherf*cker',
    'shit',
    'shitty',
    'shitting',
    'bullshit',
    'ass',
    'asshole',
    'bitch',
    'bitches',
    'bitchy',
    'bastard',
    'damn',
    'crap',
    'crappy',
    'dick',
    'dickhead',
    'cock',
    'cocksucker',
    'pussy',
    'cunt',
    'whore',
    'slut',
    'slutty',
    'fag',
    'faggot',
    'nigger',
    'nigga',
    'retard',
    'retarded',
    'idiot',
    'moron',
    'stupid',
    // Variations with symbols
    'f*ck',
    'f**k',
    'fu*k',
    'fuk',
    'fuc',
    'sh*t',
    's**t',
    'b*tch',
    'a**hole',
    'a$$hole',
    'd*ck',
    'c*nt',
    // Spam patterns
    'spam',
    'scam',
  ],
  ko: [
    // Korean profanity
    '시발',
    '씨발',
    '씹',
    '좆',
    '병신',
    '지랄',
    '개새끼',
    '개년',
    '년',
    '놈',
    '썅',
    '좃',
    '미친',
    '또라이',
    '찐따',
    '븅신',
    '빡대가리',
    '등신',
    '새끼',
    '개자식',
    '니미',
    '느금마',
    '염병',
    '젠장',
    '엿',
    '꺼져',
    // Variations with spacing
    '시 발',
    '씨 발',
    '병 신',
    // Phonetic variations
    'ㅅㅂ',
    'ㅂㅅ',
    'ㅈㄹ',
    'ㄱㅅㄲ',
    'ㅁㅊ',
  ],
  ja: [
    // Japanese profanity (日本語)
    'くそ',
    'クソ',
    'きもい',
    'キモい',
    'ばか',
    'バカ',
    '馬鹿',
    'あほ',
    'アホ',
    '阿呆',
    'しね',
    'シネ',
    '死ね',
    'ころす',
    '殺す',
    'うざい',
    'ウザい',
    'きちがい',
    'キチガイ',
    '気違い',
    'ちくしょう',
    '畜生',
    'くたばれ',
    'やろう',
    '野郎',
    'ふざけんな',
    'ざけんな',
    'ちんこ',
    'まんこ',
    'おっぱい',
    'エロ',
    'えろ',
    'ぶす',
    'ブス',
    'でぶ',
    'デブ',
    'ハゲ',
    'はげ',
  ],
  zh: [
    // Chinese profanity (中文 - Simplified & Traditional)
    '他妈的',
    '他媽的',
    '妈的',
    '媽的',
    '操',
    '肏',
    '草泥马',
    '草泥馬',
    '傻逼',
    '傻B',
    'SB',
    '煞笔',
    '煞筆',
    '混蛋',
    '王八蛋',
    '狗屎',
    '放屁',
    '滚蛋',
    '滾蛋',
    '去死',
    '贱人',
    '賤人',
    '婊子',
    '妓女',
    '白痴',
    '笨蛋',
    '蠢货',
    '蠢貨',
    '废物',
    '廢物',
    '神经病',
    '神經病',
    '变态',
    '變態',
    '畜生',
    '狗娘养的',
    '狗娘養的',
    '脑残',
    '腦殘',
    '屁',
    '尼玛',
    '尼瑪',
    'NMSL',
    'cnm',
  ],
  de: [
    // German profanity (Deutsch)
    'scheiße',
    'scheisse',
    'scheiß',
    'scheiss',
    'fick',
    'ficken',
    'gefickt',
    'arsch',
    'arschloch',
    'hurensohn',
    'hure',
    'nutte',
    'wichser',
    'wichsen',
    'schwanz',
    'fotze',
    'möse',
    'schwuchtel',
    'schlampe',
    'bastard',
    'idiot',
    'blödmann',
    'depp',
    'trottel',
    'vollidiot',
    'dummkopf',
    'miststück',
    'drecksau',
    'sau',
    'pisser',
    'penner',
    'spast',
    'behindert',
    'missgeburt',
    'kacke',
  ],
  fr: [
    // French profanity (Français)
    'merde',
    'putain',
    'bordel',
    'con',
    'connard',
    'connasse',
    'salaud',
    'salope',
    'enculé',
    'encule',
    'nique',
    'niquer',
    'baiser',
    'foutre',
    'bite',
    'couille',
    'chier',
    'pute',
    'cul',
    'taré',
    'débile',
    'crétin',
    'imbécile',
    'abruti',
    'enfoiré',
    'bâtard',
    'batard',
    'branleur',
    'casse-couilles',
    'chieur',
    'fdp',
    'fils de pute',
    'nique ta mère',
    'ntm',
    'ta gueule',
    'ferme ta gueule',
  ],
  es: [
    // Spanish profanity (Español)
    'mierda',
    'joder',
    'coño',
    'cono',
    'puta',
    'puto',
    'cabrón',
    'cabron',
    'pendejo',
    'gilipollas',
    'hijoputa',
    'hijo de puta',
    'maricón',
    'maricon',
    'culo',
    'carajo',
    'cojones',
    'hostia',
    'ostia',
    'chingar',
    'chingada',
    'verga',
    'mamón',
    'mamon',
    'capullo',
    'imbécil',
    'imbecil',
    'estúpido',
    'estupido',
    'idiota',
    'tonto',
    'zorra',
    'polla',
    'cagar',
    'culero',
    'pinche',
    'ctm',
    'hdp',
  ],
  it: [
    // Italian profanity (Italiano)
    'cazzo',
    'minchia',
    'merda',
    'stronzo',
    'stronza',
    'vaffanculo',
    'fanculo',
    'puttana',
    'troia',
    'bastardo',
    'bastarda',
    'coglione',
    'cretino',
    'idiota',
    'imbecille',
    'deficiente',
    'figa',
    'fica',
    'culo',
    'porco',
    'cagna',
    'figlio di puttana',
    'pezzo di merda',
    'testa di cazzo',
    'rompicoglioni',
    'cornuto',
    'cazzone',
    'stronzata',
    'incazzato',
    'porca miseria',
    'porca puttana',
    'madonna',
    'cazzata',
  ],
  pt: [
    // Portuguese profanity (Português)
    'merda',
    'porra',
    'caralho',
    'foda',
    'foder',
    'fodido',
    'puta',
    'filho da puta',
    'fdp',
    'cu',
    'bunda',
    'buceta',
    'boceta',
    'piroca',
    'pau',
    'viado',
    'veado',
    'bicha',
    'otário',
    'otario',
    'babaca',
    'imbecil',
    'idiota',
    'corno',
    'arrombado',
    'desgraçado',
    'desgraça',
    'cacete',
    'vá se foder',
    'vai se fuder',
    'pqp',
    'puta que pariu',
    'cabeça de rola',
    'burro',
    'cuzão',
    'cuzao',
  ],
  ru: [
    // Russian profanity (Русский)
    'блядь',
    'блять',
    'сука',
    'хуй',
    'пизда',
    'ебать',
    'ёбаный',
    'ебаный',
    'мудак',
    'пиздец',
    'хуйня',
    'залупа',
    'ёб твою мать',
    'еб твою мать',
    'иди нахуй',
    'нахуй',
    'пошёл нахуй',
    'пошел нахуй',
    'дерьмо',
    'говно',
    'жопа',
    'срать',
    'ссать',
    'дебил',
    'идиот',
    'кретин',
    'урод',
    'тварь',
    'пидор',
    'пидорас',
    'гандон',
    'ублюдок',
    'выблядок',
    'хер',
    'херня',
    'чмо',
    'лох',
    'долбоёб',
    'долбоеб',
  ],
};

// 추가 패턴: 스팸/사기 관련
const SPAM_PATTERNS = [
  // URLs in inappropriate contexts
  /(?:https?:\/\/)?(?:www\.)?(?:bit\.ly|tinyurl|goo\.gl)/gi,
  // Phone numbers (too many digits in a row)
  /\d{10,}/g,
  // Repeated characters (e.g., "aaaaaaa")
  /(.)\1{5,}/g,
];

/**
 * 텍스트에 욕설이 포함되어 있는지 확인
 * @param text 검사할 텍스트
 * @returns 욕설 포함 여부
 */
export const containsProfanity = (text: string): boolean => {
  if (!text || typeof text !== 'string') return false;

  const lowerText = text.toLowerCase();

  // Check all languages
  for (const lang of Object.keys(PROFANITY_LIST)) {
    for (const word of PROFANITY_LIST[lang]) {
      // Use word boundary for English, direct match for Korean
      if (lang === 'en') {
        const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i');
        if (regex.test(lowerText)) return true;
      } else {
        if (lowerText.includes(word.toLowerCase())) return true;
      }
    }
  }

  // Check spam patterns
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) return true;
  }

  return false;
};

/**
 * 욕설을 별표(*)로 대체
 * @param text 원본 텍스트
 * @returns 필터링된 텍스트
 */
export const filterProfanity = (text: string): string => {
  if (!text || typeof text !== 'string') return text;

  let filtered = text;

  // Replace profanity with asterisks
  for (const lang of Object.keys(PROFANITY_LIST)) {
    for (const word of PROFANITY_LIST[lang]) {
      const replacement = '*'.repeat(word.length);
      if (lang === 'en') {
        const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'gi');
        filtered = filtered.replace(regex, replacement);
      } else {
        const regex = new RegExp(escapeRegex(word), 'gi');
        filtered = filtered.replace(regex, replacement);
      }
    }
  }

  return filtered;
};

/**
 * 콘텐츠 유효성 검사 (제출 전 검사용)
 * @param text 검사할 텍스트
 * @returns 유효성 검사 결과
 */
export const validateContent = (
  text: string
): {
  isValid: boolean;
  reason?: string;
  filteredText?: string;
} => {
  if (!text || typeof text !== 'string') {
    return { isValid: true };
  }

  // Check for profanity
  if (containsProfanity(text)) {
    return {
      isValid: false,
      reason: 'profanity_detected',
      filteredText: filterProfanity(text),
    };
  }

  return { isValid: true };
};

/**
 * 여러 필드의 콘텐츠 유효성 검사
 * @param fields 검사할 필드들 { fieldName: value }
 * @returns 유효성 검사 결과
 */
export const validateMultipleFields = (
  fields: Record<string, string>
): {
  isValid: boolean;
  invalidFields: string[];
  reason?: string;
} => {
  const invalidFields: string[] = [];

  for (const [fieldName, value] of Object.entries(fields)) {
    if (value && containsProfanity(value)) {
      invalidFields.push(fieldName);
    }
  }

  if (invalidFields.length > 0) {
    return {
      isValid: false,
      invalidFields,
      reason: 'profanity_detected',
    };
  }

  return { isValid: true, invalidFields: [] };
};

/**
 * RegExp 특수문자 이스케이프
 */
const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * 욕설 목록에 단어 추가 (동적 확장용)
 * @param lang 언어 코드
 * @param words 추가할 단어들
 */
export const addProfanityWords = (lang: string, words: string[]): void => {
  if (!PROFANITY_LIST[lang]) {
    PROFANITY_LIST[lang] = [];
  }
  PROFANITY_LIST[lang].push(...words);
};

export default {
  containsProfanity,
  filterProfanity,
  validateContent,
  validateMultipleFields,
  addProfanityWords,
};
