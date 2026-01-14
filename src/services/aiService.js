/**
 * AI Service
 * RAG (Retrieval-Augmented Generation) based AI chatbot service
 * Integrates knowledge base search with Gemini API for contextual responses
 */

/**
 * 📝 LPR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LPR" (Lightning Pickleball Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LPR로 변경하고 코드는 ntrp를 유지합니다.
 */

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import knowledgeBaseService from './knowledgeBaseService';

// ========================================
// 🛡️ 3-LAYER DEFENSE SYSTEM
// ========================================

/**
 * Layer 1: System Prompt - AI Identity & Rules
 * Defines the AI's strict role and boundaries
 */
/**
 * SYSTEM_PROMPT - Operation Chronicle Update (2025-12-14)
 * 기반 문서: USER_MANUAL_V2.md, ECOSYSTEM_CHARTER.md
 */
const SYSTEM_PROMPT = {
  ko: `당신은 'Lightning Pickleball' 앱의 공식 AI 도우미 "비전(Vision)"입니다.

## 🎾 앱 핵심 지식

### 앱 구조 (5개 탭)
1. ⚡ 이벤트 - 번개 매치/모임 목록
2. 🔍 탐색 - 플레이어, 클럽, 코치, 서비스 검색
3. ➕ 생성 - 새 이벤트 만들기
4. 🛡️ 내 클럽 - 가입한 클럽 관리
5. 👤 내 활동 - 프로필, 통계, 친구, 설정

### 이벤트 종류
- **번개 매치**: 공식 랭킹 경기 (ELO 반영 O)
- **번개 모임**: 소셜 모임 (ELO 반영 X)

### ELO "분리 독립" 모델
- **전체 ELO**: 공용 번개 매치에만 영향
- **클럽 ELO**: 클럽 리그/토너먼트에만 영향
- 클럽 경기는 전체 ELO에 영향을 주지 않습니다!

### LPR 레벨 제한 규칙 (2025년 1월 업데이트)
- **단식**: 호스트는 같은 레벨(0) 또는 1레벨 높은 상대(+1)만 초대 가능
  - 예: 호스트 LPR 5.0 → 초대 가능 범위: 5.0~6.0 (하위 레벨 초대 불가!)
- **복식/혼복**: ±2 LPR 허용 범위 (팀워크 중시, 유연한 매칭)
  - 예: 호스트 LPR 5.0 → 초대 가능 범위: 3.0~7.0
- 솔로 참가 가능 (자동 매칭)
- 팀 참가 가능 (친구와 함께)

### ELO 재경기 제한
- 동일 상대와 **3개월에 1회**만 ELO 반영
- 단식: 같은 상대 / 복식: **정확히 같은 4명이 같은 팀 구성**일 때만 적용
- 파트너가 1명이라도 다르면 새로운 매칭으로 간주되어 ELO 반영됨
- 그 전에 재경기하면 "친선 경기"로 처리 (기록만 남고 ELO 변동 없음)

### K-Factor 정책 (클럽 ELO)
- 클럽 리그: K=16 (안정적)
- 클럽 토너먼트 (신규): K=32 (빠른 레벨 탐색)
- 클럽 토너먼트 (기존): K=24 (극적인 변동)

### 게시 제한 정책 (코치/서비스 탭)
- 하루 최대 3개
- 총 최대 5개 (활성 상태)
- 기존 게시글 삭제 후 새로 등록 가능

### 연락 방법
- 모든 연락은 **1:1 채팅**으로만 가능
- 연락처 공개 불가 (개인정보 보호)

## 🌐 언어 매칭 (필수!)
**항상 사용자의 질문과 동일한 언어로 응답하세요.**
- 사용자가 영어로 질문하면 → 영어로 응답
- 사용자가 한국어로 질문하면 → 한국어로 응답
- 다른 언어로 질문하면 → 가능하면 해당 언어로, 아니면 영어로 응답
앱 언어 설정과 상관없이 사용자의 메시지 언어를 따르세요!

## 🎯 3원칙 응답 체계 (매우 중요!)

### 원칙 1: 피클볼 관련성 확인
- 질문이 피클볼와 무관하면 (정치, 종교, 금융, 의료, 법률, 날씨, 뉴스 등)
- **응답**: "죄송합니다. 저는 피클볼 전문 도우미라서 그 주제는 도움드리기 어려워요. 피클볼 관련 질문이 있으시면 말씀해주세요! 🎾"

### 원칙 2: 일반 피클볼 지식
- 피클볼 관련이지만 번개 피클볼 앱과 무관한 질문 (피클볼 규칙, 기술, 장비 등)
- **응답**: AI API로 일반 피클볼 지식 기반 답변 제공

### 원칙 3: 번개 피클볼 앱 관련 (가장 중요!)
- 번개 피클볼 앱 기능, 사용법, 정책에 관한 질문
- **응답 규칙**:
  1. 지식 베이스에서 **정확한 답**을 찾으면 → 해당 답변 제공
  2. 지식 베이스에서 **정확한 답을 찾을 수 없으면** → 절대 비슷한 답을 내놓지 말 것!
  3. 정확한 답이 없을 때 응답:
     "죄송합니다. 해당 질문에 대한 정확한 정보를 찾지 못했습니다. 관리팀에 문의하여 확인 후 답변드리겠습니다. 다른 질문이 있으시면 말씀해주세요! 🎾"
  4. 이 경우 반드시 FEEDBACK_REPORT에 "unknown_answer" 카테고리로 리포트

**⚠️ 절대 금지**: 정확한 답을 모를 때 비슷하거나 관련 있어 보이는 다른 답변을 제공하지 마세요!

## 🚨 [프로젝트 센티넬] 부수 임무: 사용자 문제 감지

**중요**: 사용자가 앱 사용 중 문제를 겪고 있다는 신호를 감지하면, 응답 마지막에 특수 마커를 추가하세요.

### 감지 키워드 (문제/불만 표현)
- **에러/오류**: "에러", "오류", "에러가", "오류가", "버그", "작동 안 함", "안 돼요", "안됩니다", "안 돼", "안돼"
- **기능 불만**: "이상해요", "이상하네요", "왜 안", "작동하지 않아", "실행이 안", "클릭해도", "눌러도 안"
- **혼란/어려움**: "모르겠어요", "어떻게 해요", "찾을 수가 없어요", "보이지 않아요", "어디 있어요"
- **반복 시도**: "계속", "여러 번", "다시 해도", "몇 번이나", "자꾸"

### 피드백 리포트 형식
사용자 질문에 위 키워드가 포함되면, 답변 끝에 다음 형식으로 추가하세요:

---FEEDBACK_REPORT---
{"detected": true, "priority": "high|medium|low", "category": "bug|ux|confusion|unknown_answer", "keywords": ["감지된", "키워드들"], "context": "사용자 질문 요약"}
---END_FEEDBACK---

**우선순위 기준**:
- high: 에러, 버그, 작동 안 함 → 즉시 수정 필요
- medium: UX 혼란, 찾기 어려움, **unknown_answer** → 개선 필요, 지식 베이스 업데이트 필요
- low: 일반 질문, 사용법 문의 → 문서화 개선

**unknown_answer 사용 시**:
- 사용자가 번개 피클볼 앱에 관해 물었지만 지식 베이스에 정확한 답이 없을 때
- 반드시 "관리팀에 문의" 응답과 함께 리포트
- 예: {"detected": true, "priority": "medium", "category": "unknown_answer", "keywords": ["레벨", "초대"], "context": "단식 매치 레벨 제한 질문"}

**예시**:
사용자: "이벤트 생성 버튼을 눌러도 아무 반응이 없어요"
AI 응답: "이벤트 생성에 문제가 있으시군요. 다음을 확인해주세요: 1) 네트워크 연결 확인 2) 앱 재시작 후 재시도 3) 여전히 문제가 있다면 저에게 자세히 알려주세요! 개발팀에 전달해드릴게요. 💬

---FEEDBACK_REPORT---
{"detected": true, "priority": "high", "category": "bug", "keywords": ["눌러도", "반응이 없어요"], "context": "이벤트 생성 버튼 무반응"}
---END_FEEDBACK---"

**주의**: 일반 질문(키워드 없음)에는 FEEDBACK_REPORT를 추가하지 마세요.`,

  en: `You are "Vision", the official AI assistant for the 'Lightning Pickleball' app.

## 🎾 APP KNOWLEDGE BASE

### App Structure (5 Main Tabs)
1. ⚡ Events - Lightning Match/Meetup listings
2. 🔍 Discover - Search for Players, Clubs, Coaches, Services
3. ➕ Create - Create new events
4. 🛡️ My Clubs - Manage joined clubs
5. 👤 My Activities - Profile, Stats, Friends, Settings

### Event Types
- **Lightning Match**: Ranked matches (ELO reflected)
- **Lightning Meetup**: Social gatherings (No ELO impact)

### ELO "Separation of Independence" Model
- **Global ELO**: Only affected by public Lightning Matches
- **Club ELO**: Only affected by Club Leagues/Tournaments
- Club matches do NOT affect your Global ELO ranking!

### LPR Level Restriction Rules (January 2025 Update)
- **Singles**: Host can only invite players at same level (0) or 1 level higher (+1)
  - Example: Host LPR 5.0 → Invitable range: 5.0~6.0 (cannot invite lower levels!)
- **Doubles/Mixed**: ±2 LPR tolerance (flexible matching for teamwork)
  - Example: Host LPR 5.0 → Invitable range: 3.0~7.0
- Solo participation allowed (auto-matching)
- Team participation allowed (with friends)

### ELO Rematch Restriction
- Same opponent: ELO reflected only once per **3 months**
- Singles: Same opponent / Doubles: **Exact same 4 players in same team configuration** triggers cooldown
- If even 1 partner is different, it's a NEW matchup and ELO IS updated
- Rematch within 3 months = "Friendly Match" (recorded but no ELO change)

### K-Factor Policy (Club ELO)
- Club League: K=16 (stable growth)
- Club Tournament (new players): K=32 (fast level exploration)
- Club Tournament (existing): K=24 (dramatic changes)

### Posting Limits (Coach/Service Tabs)
- Maximum 3 per day
- Maximum 5 total active posts
- Delete existing posts to create new ones

### Contact Method
- All contact via **1:1 in-app chat** only
- No public contact info (privacy protection)

## 🌐 LANGUAGE MATCHING (CRITICAL)
**ALWAYS respond in the SAME LANGUAGE as the user's question.**
- If the user asks in English → Respond in English
- If the user asks in Korean → Respond in Korean (한국어)
- If the user asks in another language → Try to respond in that language, or fall back to English
This overrides any app language settings. Match the user's message language!

## 🎯 3-Principle Response System (CRITICAL!)

### Principle 1: Pickleball Relevance Check
- If question is unrelated to pickleball (politics, religion, finance, medical, legal, weather, news, etc.)
- **Response**: "I'm sorry, I'm a pickleball-specialized assistant, so I can't help with that topic. Feel free to ask me anything about pickleball! 🎾"

### Principle 2: General Pickleball Knowledge
- Pickleball-related but NOT about Lightning Pickleball app (pickleball rules, techniques, equipment, etc.)
- **Response**: Provide answer based on general pickleball knowledge via AI API

### Principle 3: Lightning Pickleball App Questions (MOST IMPORTANT!)
- Questions about Lightning Pickleball app features, usage, policies
- **Response Rules**:
  1. If **exact answer found** in knowledge base → Provide that answer
  2. If **exact answer NOT found** in knowledge base → NEVER provide similar or related answers!
  3. When no exact answer exists, respond:
     "I'm sorry, I couldn't find the exact information for your question. I'll check with the admin and get back to you. Feel free to ask other questions! 🎾"
  4. In this case, MUST report to FEEDBACK_REPORT with "unknown_answer" category

**⚠️ FORBIDDEN**: When you don't know the exact answer, NEVER provide similar or seemingly related answers!

## 🚨 [Project Sentinel] Secondary Mission: User Issue Detection

**Important**: If you detect signals that the user is experiencing problems with the app, add a special marker at the end of your response.

### Detection Keywords (Problem/Complaint Expressions)
- **Error/Bug**: "error", "bug", "not working", "doesn't work", "won't work", "can't", "unable to"
- **Feature Issues**: "weird", "strange", "won't", "doesn't respond", "not responding", "clicking doesn't", "tapping doesn't"
- **Confusion/Difficulty**: "don't know", "how do I", "can't find", "don't see", "where is"
- **Repeated Attempts**: "keep", "keeps", "multiple times", "tried again", "several times", "always"

### Feedback Report Format
If the user's question contains the above keywords, add the following format at the end of your response:

---FEEDBACK_REPORT---
{"detected": true, "priority": "high|medium|low", "category": "bug|ux|confusion|unknown_answer", "keywords": ["detected", "keywords"], "context": "summary of user question"}
---END_FEEDBACK---

**Priority Criteria**:
- high: Error, bug, not working → Requires immediate fix
- medium: UX confusion, hard to find → Needs improvement
- low: General questions, how-to → Documentation improvement

**When to use unknown_answer**:
- User asked about Lightning Pickleball app but no exact answer exists in knowledge base
- MUST be used together with "I couldn't find exact information" response
- Helps admin identify knowledge base gaps

**Example**:
User: "The event creation button doesn't respond when I tap it"
AI Response: "I see you're having trouble creating events. Please try: 1) Check your network connection 2) Restart the app and try again 3) If the problem persists, please describe the issue to me and I'll report it to the dev team! 💬

---FEEDBACK_REPORT---
{"detected": true, "priority": "high", "category": "bug", "keywords": ["doesn't respond", "tap"], "context": "Event creation button unresponsive"}
---END_FEEDBACK---"

**Note**: Do NOT add FEEDBACK_REPORT for general questions (no keywords detected).`,
};

/**
 * Layer 2: Input Filter - Banned Keywords
 * Blocks dangerous/off-topic queries before API call
 */
const BANNED_KEYWORDS = {
  ko: [
    '정치',
    '대통령',
    '선거',
    '국회',
    '주식',
    '투자',
    '비트코인',
    '암호화폐',
    '코인',
    '종교',
    '의료',
    '법률',
    '변호사',
    '판사',
    '검사',
    '약',
    '처방',
    '병원',
  ],
  en: [
    'politics',
    'president',
    'election',
    'congress',
    'stock',
    'invest',
    'bitcoin',
    'crypto',
    'coin',
    'religion',
    'medical',
    'legal',
    'lawyer',
    'judge',
    'prosecutor',
    'medicine',
    'prescription',
    'hospital',
  ],
};

/**
 * Layer 2: Input Filter - Off-Topic Keywords
 * Blocks general knowledge questions not related to pickleball
 */
const OFF_TOPIC_KEYWORDS = {
  ko: [
    '날씨',
    '뉴스',
    '영화',
    '드라마',
    '맛집',
    '요리',
    '레시피',
    '음악',
    '축구',
    '야구',
    '농구',
    '게임',
    '프로그래밍',
    '코딩',
  ],
  en: [
    'weather',
    'news',
    'movie',
    'drama',
    'restaurant',
    'cooking',
    'recipe',
    'music',
    'soccer',
    'baseball',
    'basketball',
    'game',
    'programming',
    'coding',
  ],
};

/**
 * Layer 3: Output Filter - Forbidden Response Patterns
 * Catches AI responses that mention forbidden topics
 */
const FORBIDDEN_RESPONSE_PATTERNS = {
  ko: [
    /오늘의?\s*날씨/i,
    /주식|투자|비트코인/i,
    /정치|대통령|선거/i,
    /종교|기독교|불교|이슬람/i,
    /의료|병원|약/i,
    /법률|변호사|소송/i,
    /축구|야구|농구/i, // Other sports
  ],
  en: [
    /today'?s?\s+weather/i,
    /stock|invest|bitcoin/i,
    /politic|president|election/i,
    /religion|christian|buddhist|islam/i,
    /medical|hospital|medicine/i,
    /legal|lawyer|lawsuit/i,
    /soccer|baseball|basketball/i, // Other sports
  ],
};

/**
 * AI Service for Lightning Pickleball app
 * Provides RAG-based chatbot functionality
 */
class AIService {
  constructor() {
    // Gemini API configuration
    this.geminiApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
    this.geminiEndpoint =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

    // Knowledge base cache
    this.knowledgeCache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes

    // Verify API key configuration
    console.log('🔑 Gemini API Key configured:', this.geminiApiKey ? 'Yes' : 'No');
    if (this.geminiApiKey) {
      console.log('🤖 AI Service initialized with Gemini API integration');
    } else {
      console.warn('⚠️ No Gemini API key found - using mock responses');
    }
  }

  /**
   * 🌐 Detect the language of user's message
   * Returns 'ko' for Korean, 'en' for English/other
   * @param {string} text - User's message
   * @returns {string} Detected language code ('ko' or 'en')
   */
  detectMessageLanguage(text) {
    // Korean character ranges: Hangul syllables (AC00-D7AF), Jamo (1100-11FF, 3130-318F)
    const koreanRegex = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/g;
    const koreanChars = (text.match(koreanRegex) || []).length;
    const totalChars = text.replace(/\s/g, '').length;

    // If more than 30% Korean characters, consider it Korean
    const koreanRatio = koreanChars / (totalChars || 1);
    const detectedLang = koreanRatio > 0.3 ? 'ko' : 'en';

    console.log(
      `🌐 Language detection: "${text.substring(0, 30)}..." → ${detectedLang} (Korean ratio: ${(koreanRatio * 100).toFixed(1)}%)`
    );
    return detectedLang;
  }

  /**
   * 🛡️ Layer 2: Input Filter - Pre-API Defense
   * Blocks inappropriate queries before API call
   * @param {string} query - User query
   * @param {string} language - Language preference
   * @returns {Object} Filter result { blocked: boolean, reason: string, keyword: string }
   */
  filterInput(query, language) {
    const lowerQuery = query.toLowerCase();
    const bannedList = BANNED_KEYWORDS[language] || BANNED_KEYWORDS.en;
    const offTopicList = OFF_TOPIC_KEYWORDS[language] || OFF_TOPIC_KEYWORDS.en;

    console.log('🛡️ [Layer 2] Filtering input:', query);

    // Check banned keywords (highest priority)
    for (const keyword of bannedList) {
      if (lowerQuery.includes(keyword.toLowerCase())) {
        console.warn(`🚫 Blocked banned keyword: "${keyword}"`);
        return { blocked: true, reason: 'banned', keyword };
      }
    }

    // Check off-topic keywords (only if no pickleball context)
    const pickleballKeywords = [
      '피클볼',
      'pickleball',
      '매치',
      'match',
      '클럽',
      'club',
      '랭킹',
      'ranking',
      'elo',
      'ntrp',
      '번개',
      'lightning',
    ];
    const hasPickleballContext = pickleballKeywords.some(k => lowerQuery.includes(k.toLowerCase()));

    if (!hasPickleballContext) {
      for (const keyword of offTopicList) {
        if (lowerQuery.includes(keyword.toLowerCase())) {
          console.warn(`🚫 Blocked off-topic keyword: "${keyword}"`);
          return { blocked: true, reason: 'off_topic', keyword };
        }
      }
    }

    console.log('✅ [Layer 2] Input passed filter');
    return { blocked: false };
  }

  /**
   * 🛡️ Layer 3: Output Filter - Post-API Defense
   * Validates AI response for forbidden content
   * @param {string} response - AI response text
   * @param {string} language - Language preference
   * @returns {Object} Filter result { filtered: boolean, fallbackResponse: string }
   */
  filterOutput(response, language) {
    console.log('🛡️ [Layer 3] Filtering output');

    const patterns = FORBIDDEN_RESPONSE_PATTERNS[language] || FORBIDDEN_RESPONSE_PATTERNS.en;

    for (const pattern of patterns) {
      if (pattern.test(response)) {
        console.warn(`🚫 Blocked forbidden pattern in response: ${pattern}`);
        return {
          filtered: true,
          fallbackResponse:
            language === 'ko'
              ? '죄송합니다. 저는 피클볼 전문 도우미입니다. 피클볼 관련 질문을 해주시면 기꺼이 도와드릴게요! 🎾'
              : "I'm sorry, I'm a pickleball-specialized assistant. Please ask me about pickleball and I'll be happy to help! 🎾",
        };
      }
    }

    console.log('✅ [Layer 3] Output passed filter');
    return { filtered: false };
  }

  /**
   * Get appropriate decline response
   * @param {string} reason - Reason for decline (banned, off_topic)
   * @param {string} language - Language preference
   * @returns {string} Decline message
   */
  getDeclineResponse(reason, language) {
    const responses = {
      banned: {
        ko: '죄송합니다. 해당 주제는 제가 도움드리기 어려운 영역이에요. 피클볼나 Lightning Pickleball 앱에 관해 궁금한 점이 있으시면 말씀해주세요! 🎾',
        en: "I'm sorry, that topic is outside my area of expertise. Feel free to ask me about pickleball or the Lightning Pickleball app! 🎾",
      },
      off_topic: {
        ko: '저는 피클볼 전문 도우미라서 그 질문에는 답변드리기 어려워요. 대신 피클볼 기술, 규칙, 또는 앱 사용법에 대해 물어봐 주세요! 🎾',
        en: "I'm a pickleball-specialized assistant, so I can't answer that question. Instead, ask me about pickleball techniques, rules, or how to use the app! 🎾",
      },
    };

    return responses[reason]?.[language] || responses[reason]?.en || responses.off_topic.en;
  }

  /**
   * Process user query with RAG pipeline + 3-Layer Defense System
   * @param {string} query - User query
   * @param {Object} context - Additional context
   * @returns {Promise<Object>} AI response with sources
   */
  async processQuery(query, context = {}) {
    try {
      console.log('🤖 Processing query:', query, 'with context:', context);
      const language = context.language || 'ko';

      // 🛡️ LAYER 2: Input Filter (Pre-API)
      const inputFilter = this.filterInput(query, language);
      if (inputFilter.blocked) {
        console.warn(
          `🚫 Query blocked by input filter: reason=${inputFilter.reason}, keyword=${inputFilter.keyword}`
        );
        return {
          answer: this.getDeclineResponse(inputFilter.reason, language),
          sources: [],
          relatedQuestions: this.getRelatedQuestions('general', language),
          confidence: 1.0, // High confidence in blocking
          filtered: true,
          filterReason: inputFilter.reason,
        };
      }

      // Step 1: Search knowledge base for relevant information
      const knowledgeResults = await this.searchKnowledgeBase(query, language);

      // Step 2: Generate response using Gemini API with retrieved knowledge
      // 🛡️ LAYER 1: System Prompt is applied inside generateResponse
      const response = await this.generateResponse(query, knowledgeResults, context);

      // 🛡️ LAYER 3: Output Filter (Post-API)
      const outputFilter = this.filterOutput(response.answer, language);
      if (outputFilter.filtered) {
        console.warn('🚫 Response blocked by output filter');
        return {
          answer: outputFilter.fallbackResponse,
          sources: [],
          relatedQuestions: this.getRelatedQuestions('general', language),
          confidence: 1.0,
          filtered: true,
          filterReason: 'output_filter',
        };
      }

      // Step 3: Log query for analytics (optional)
      await this.logQuery(query, response, context);

      return response;
    } catch (error) {
      console.error('❌ Error processing query:', error);

      // Fallback response
      return {
        answer:
          context.language === 'ko'
            ? '죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해주세요.'
            : 'Sorry, there was a temporary error. Please try again.',
        sources: [],
        relatedQuestions: [],
        confidence: 0,
      };
    }
  }

  /**
   * Search knowledge base using text similarity
   * @param {string} query - Search query
   * @param {string} language - Language preference
   * @returns {Promise<Array>} Relevant knowledge items
   */
  async searchKnowledgeBase(query, language = 'ko') {
    try {
      console.log('🔍 Searching knowledge base for:', query);

      // Check cache first
      const cacheKey = `${query}-${language}`;
      const cached = this.knowledgeCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        console.log('📚 Using cached knowledge results');
        return cached.results;
      }

      // Try Firebase search first
      try {
        const knowledgeRef = collection(db, 'knowledge_base');

        // Simple keyword-based search (can be enhanced with vector embeddings)
        const queryTerms = query
          .toLowerCase()
          .split(' ')
          .filter(term => term.length > 1);

        let results = [];

        // Search by keywords
        for (const term of queryTerms.slice(0, 3)) {
          // Limit to 3 terms for performance
          const q = query(
            knowledgeRef,
            where('keywords', 'array-contains', term),
            orderBy('priority', 'desc'),
            limit(5)
          );

          const snapshot = await getDocs(q);
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (!results.find(item => item.id === doc.id)) {
              results.push({
                id: doc.id,
                ...data,
                relevanceScore: this.calculateRelevanceScore(query, data),
              });
            }
          });
        }

        // Fallback: search by question similarity
        if (results.length === 0) {
          const allDocsQuery = query(knowledgeRef, orderBy('priority', 'desc'), limit(10));
          const snapshot = await getDocs(allDocsQuery);

          snapshot.docs.forEach(doc => {
            const data = doc.data();
            const relevanceScore = this.calculateRelevanceScore(query, data);
            if (relevanceScore > 0.3) {
              // Threshold for relevance
              results.push({
                id: doc.id,
                ...data,
                relevanceScore,
              });
            }
          });
        }

        // Sort by relevance and take top 3
        results = results.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 3);

        // Cache results
        this.knowledgeCache.set(cacheKey, {
          results,
          timestamp: Date.now(),
        });

        console.log(`✅ Found ${results.length} relevant knowledge items`);
        return results;
      } catch (firebaseError) {
        console.warn('⚠️ Firebase unavailable, using mock knowledge base:', firebaseError.message);
        return this.getMockKnowledgeResults(query, language);
      }
    } catch (error) {
      console.error('❌ Error searching knowledge base:', error);
      return this.getMockKnowledgeResults(query, language);
    }
  }

  /**
   * Calculate relevance score between query and knowledge item
   * @param {string} query - User query
   * @param {Object} knowledgeItem - Knowledge base item
   * @returns {number} Relevance score (0-1)
   */
  calculateRelevanceScore(query, knowledgeItem) {
    const queryTerms = query.toLowerCase().split(' ');
    const questionTerms = (knowledgeItem.question || '').toLowerCase().split(' ');
    const answerTerms = (knowledgeItem.answer || '').toLowerCase().split(' ');
    const keywords = knowledgeItem.keywords || [];

    let score = 0;
    let totalTerms = queryTerms.length;

    queryTerms.forEach(term => {
      if (term.length < 2) return;

      // Check in question (higher weight)
      if (questionTerms.some(qTerm => qTerm.includes(term) || term.includes(qTerm))) {
        score += 0.5;
      }

      // Check in keywords (medium weight)
      if (keywords.some(keyword => keyword.includes(term) || term.includes(keyword))) {
        score += 0.3;
      }

      // Check in answer (lower weight)
      if (answerTerms.some(aTerm => aTerm.includes(term) || term.includes(aTerm))) {
        score += 0.2;
      }
    });

    return Math.min(score / totalTerms, 1.0);
  }

  /**
   * Generate response using Gemini API
   * @param {string} query - User query
   * @param {Array} knowledgeResults - Retrieved knowledge
   * @param {Object} context - Additional context
   * @returns {Promise<Object>} Generated response
   */
  async generateResponse(query, knowledgeResults, context) {
    try {
      console.log('🧠 Generating response with Gemini API');

      // If no API key, return mock response
      if (!this.geminiApiKey) {
        console.warn('⚠️ No Gemini API key found, using mock response');
        return this.generateMockResponse(query, knowledgeResults, context);
      }

      // Construct prompt with retrieved knowledge
      const prompt = this.constructPrompt(query, knowledgeResults, context);

      // Call Gemini API
      console.log('🧠 Calling Gemini API with prompt length:', prompt.length);

      const response = await fetch(`${this.geminiEndpoint}?key=${this.geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Gemini API error:', response.status, errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!generatedText) {
        throw new Error('Empty response from Gemini API');
      }

      // Parse response and extract related questions and feedback report
      const { answer, relatedQuestions, feedbackReport } = this.parseResponse(generatedText);

      const result = {
        answer: answer,
        sources: knowledgeResults.map(item => item.question || 'Knowledge Base'),
        relatedQuestions: relatedQuestions,
        confidence: knowledgeResults.length > 0 ? 0.8 : 0.5,
        feedbackReport: feedbackReport, // 🚨 [Sentinel] Include feedback report if detected
      };

      console.log('✅ Generated response successfully');
      return result;
    } catch (error) {
      console.error('❌ Error generating response:', error);
      return this.generateMockResponse(query, knowledgeResults, context);
    }
  }

  /**
   * Construct prompt for Gemini API with Layer 1 Defense (System Prompt)
   * @param {string} query - User query
   * @param {Array} knowledgeResults - Retrieved knowledge
   * @param {Object} context - Additional context
   * @returns {string} Constructed prompt
   */
  constructPrompt(query, knowledgeResults, context) {
    const pageContext = context.pageContext;

    // 🌐 Detect user's message language (overrides app language setting)
    const detectedLanguage = this.detectMessageLanguage(query);
    const language = detectedLanguage; // Use detected language, not context.language

    console.log(
      `🌐 Using detected language: ${language} (app language: ${context.language || 'ko'})`
    );

    // 🛡️ LAYER 1: System Prompt - Define AI Identity & Strict Rules
    let prompt = SYSTEM_PROMPT[language] || SYSTEM_PROMPT.en;

    // Add basic guidelines - CRITICAL: Match the user's message language!
    const guidelines =
      language === 'ko'
        ? `\n\n**⚠️ 필수 지침 (MANDATORY):**
1. **사용자가 한국어로 질문했으므로 한국어로 답변하세요!**
2. 친근하고 도움이 되는 톤을 사용하세요
3. 정확하고 명확한 정보를 제공하세요
4. 아래 제공된 지식 베이스를 우선적으로 참고하세요`
        : `\n\n**⚠️ CRITICAL INSTRUCTION:**
1. **The user asked in ENGLISH, so you MUST respond in ENGLISH!**
2. Use a friendly and helpful tone
3. Provide accurate and clear information
4. Prioritize the knowledge base provided below`;

    prompt += guidelines;

    if (pageContext) {
      const contextInfo =
        language === 'ko'
          ? `\n\n현재 사용자는 ${pageContext} 화면에 있습니다. 이 맥락을 고려하여 답변하세요.`
          : `\n\nThe user is currently on the ${pageContext} screen. Consider this context in your response.`;
      prompt += contextInfo;
    }

    if (knowledgeResults.length > 0) {
      const knowledgeSection =
        language === 'ko'
          ? '\n\n=== 관련 지식 베이스 ===\n'
          : '\n\n=== Relevant Knowledge Base ===\n';

      prompt += knowledgeSection;

      knowledgeResults.forEach((item, index) => {
        prompt += `${index + 1}. Q: ${item.question}\n   A: ${item.answer}\n\n`;
      });
    }

    // 🌐 CRITICAL: Emphasize response language in final instruction
    const querySection =
      language === 'ko'
        ? `\n=== 사용자 질문 ===\n${query}\n\n⚠️ 중요: 사용자가 한국어로 질문했으므로 반드시 한국어로 답변하세요!\n\n답변:`
        : `\n=== User Question ===\n${query}\n\n⚠️ IMPORTANT: The user asked in ENGLISH, so you MUST respond in ENGLISH!\n\nAnswer:`;

    prompt += querySection;

    console.log('🛡️ [Layer 1] System Prompt applied to API call');

    return prompt;
  }

  /**
   * Parse AI response to extract answer, related questions, and feedback report
   * @param {string} responseText - Raw AI response
   * @returns {Object} Parsed response
   */
  parseResponse(responseText) {
    // Simple parsing - can be enhanced with more sophisticated parsing
    let answer = responseText.trim();
    let relatedQuestions = [];
    let feedbackReport = null;

    // 🚨 [Project Sentinel] Extract feedback report if present
    const feedbackMatch = answer.match(/---FEEDBACK_REPORT---([\s\S]*?)---END_FEEDBACK---/);
    if (feedbackMatch) {
      try {
        const jsonText = feedbackMatch[1].trim();
        feedbackReport = JSON.parse(jsonText);
        console.log('🚨 [Sentinel] Issue detected:', feedbackReport);

        // Remove feedback report from main answer (사용자에게는 보이지 않음)
        answer = answer.replace(/---FEEDBACK_REPORT---[\s\S]*?---END_FEEDBACK---/g, '').trim();
      } catch (error) {
        console.error('🚨 [Sentinel] Failed to parse feedback report:', error);
      }
    }

    // Try to extract related questions if they're formatted properly
    const relatedMatch = answer.match(/관련 질문:|Related questions?:(.+)$/is);
    if (relatedMatch) {
      const relatedSection = relatedMatch[1];
      relatedQuestions = relatedSection
        .split(/[•\-\n]/)
        .map(q => q.trim())
        .filter(q => q.length > 0)
        .slice(0, 3);

      // Remove related questions from main answer
      answer = answer.replace(/관련 질문:|Related questions?:.+$/is, '').trim();
    }

    return { answer, relatedQuestions, feedbackReport };
  }

  /**
   * Generate mock response when API is unavailable
   * @param {string} query - User query
   * @param {Array} knowledgeResults - Retrieved knowledge
   * @param {Object} context - Additional context
   * @returns {Object} Mock response
   */
  generateMockResponse(query, knowledgeResults, context) {
    const language = context.language || 'ko';

    // If we have knowledge results, use them
    if (knowledgeResults.length > 0) {
      const bestMatch = knowledgeResults[0];
      return {
        answer: bestMatch.answer,
        sources: [bestMatch.question],
        relatedQuestions: this.getRelatedQuestions(query, language),
        confidence: 0.7,
      };
    }

    // Default responses for common queries
    const mockResponses = this.getMockResponses(language);
    const lowercaseQuery = query.toLowerCase();

    for (const [keywords, response] of Object.entries(mockResponses)) {
      if (keywords.some(keyword => lowercaseQuery.includes(keyword))) {
        return {
          answer: response.answer,
          sources: ['FAQ'],
          relatedQuestions: response.related || [],
          confidence: 0.6,
        };
      }
    }

    // Generic fallback
    return {
      answer:
        language === 'ko'
          ? '죄송합니다. 정확한 답변을 찾지 못했습니다. 더 구체적인 질문을 해주시거나 다른 방식으로 질문해 보세요.'
          : "Sorry, I couldn't find a specific answer. Please try asking a more specific question or rephrase your query.",
      sources: [],
      relatedQuestions: this.getRelatedQuestions('general', language),
      confidence: 0.3,
    };
  }

  /**
   * Get mock responses for common queries
   * @param {string} language - Language preference
   * @returns {Object} Mock responses map
   */
  getMockResponses(language) {
    if (language === 'ko') {
      return {
        match_meetup_difference: {
          keywords: ['매치', '모임', '차이'],
          answer:
            '번개 매치는 1:1 랭킹 경기로 ELO 점수가 변동되며, 번개 모임은 여러 명이 참여하는 친선 경기입니다.',
          related: ['ELO 랭킹은 어떻게 계산되나요?', '매치는 어떻게 만드나요?'],
        },
        elo_ranking_score: {
          keywords: ['elo', '랭킹', '점수'],
          answer:
            'ELO 랭킹은 체스에서 유래된 실력 평가 시스템으로, 승패에 따라 점수가 오르거나 내려갑니다. 강한 상대를 이기면 더 많은 점수를 얻습니다.',
          related: ['매치 결과는 어떻게 기록하나요?', '랭킹은 어디서 볼 수 있나요?'],
        },
        club_create_make: {
          keywords: ['클럽', '만들기', '생성'],
          answer:
            "'내 클럽' 탭에서 '새 클럽 만들기' 버튼을 눌러 클럽 이름, 설명, 위치 등을 입력하면 클럽을 만들 수 있습니다.",
          related: ['클럽에 어떻게 가입하나요?', '클럽 관리는 어떻게 하나요?'],
        },
      };
    } else {
      return {
        match_meetup_difference: {
          keywords: ['match', 'meetup', 'difference'],
          answer:
            'Lightning Match is a 1:1 ranked game where ELO scores change, while Lightning Meetup is a friendly game with multiple participants.',
          related: ['How is ELO ranking calculated?', 'How do I create a match?'],
        },
        elo_ranking_score: {
          keywords: ['elo', 'ranking', 'score'],
          answer:
            'ELO ranking is a skill assessment system derived from chess, where scores go up or down based on wins and losses. You gain more points for beating stronger opponents.',
          related: ['How do I record match results?', 'Where can I view rankings?'],
        },
        club_create_make: {
          keywords: ['club', 'create', 'make'],
          answer:
            "Go to the 'My Clubs' tab and tap 'Create New Club' to enter club name, description, location, and other details.",
          related: ['How do I join a club?', 'How do I manage a club?'],
        },
      };
    }
  }

  /**
   * Get related questions for a query
   * @param {string} query - User query
   * @param {string} language - Language preference
   * @returns {Array} Related questions
   */
  getRelatedQuestions(query, language) {
    const relatedQuestions =
      language === 'ko'
        ? [
            '번개 매치와 번개 모임의 차이점은?',
            'ELO 랭킹은 어떻게 계산되나요?',
            '클럽은 어떻게 만드나요?',
            'NTRP 레벨이 무엇인가요?',
            '친구는 어떻게 추가하나요?',
          ]
        : [
            "What's the difference between Lightning Match and Lightning Meetup?",
            'How is ELO ranking calculated?',
            'How do I create a club?',
            'What is NTRP level?',
            'How do I add friends?',
          ];

    // Return random 2-3 questions
    return relatedQuestions
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 2) + 2);
  }

  /**
   * Get mock knowledge base results
   * @param {string} query - Search query
   * @param {string} language - Language preference
   * @returns {Array} Mock knowledge results
   */
  getMockKnowledgeResults(query, language) {
    const mockKnowledge = this.getMockKnowledgeBase(language);
    const lowercaseQuery = query.toLowerCase();

    return mockKnowledge
      .filter(item => {
        const question = item.question.toLowerCase();
        const keywords = item.keywords.join(' ').toLowerCase();
        return (
          question.includes(lowercaseQuery) ||
          lowercaseQuery.split(' ').some(term => keywords.includes(term))
        );
      })
      .slice(0, 3)
      .map(item => ({ ...item, relevanceScore: 0.8 }));
  }

  /**
   * Get mock knowledge base data
   * @param {string} language - Language preference
   * @returns {Array} Mock knowledge base
   */
  getMockKnowledgeBase(language) {
    // Use the knowledge base service for consistent data
    return knowledgeBaseService.getDefaultKnowledgeData(language);
  }

  /**
   * Log query for analytics (optional)
   * @param {string} query - User query
   * @param {Object} response - AI response
   * @param {Object} context - Additional context
   */
  async logQuery(query, response, context) {
    try {
      // Only log if Firebase is available and user consents
      if (!context.userId) return;

      const logData = {
        userId: context.userId,
        query: query,
        responseConfidence: response.confidence,
        pageContext: context.pageContext,
        language: context.language,
        timestamp: serverTimestamp(),
        sourcesCount: response.sources.length,
      };

      await addDoc(collection(db, 'chatbot_logs'), logData);
    } catch (error) {
      // Silently fail for logging
      console.warn('Failed to log query:', error);
    }
  }

  /**
   * Initialize knowledge base with default data
   * @param {string} language - Language preference
   */
  async initializeKnowledgeBase(language = 'ko') {
    // Delegate to the knowledge base service
    return await knowledgeBaseService.initializeKnowledgeBase(language);
  }

  /**
   * Initialize knowledge base for both languages
   */
  async initializeBothLanguages() {
    return await knowledgeBaseService.initializeBothLanguages();
  }

  /**
   * Test API connection and functionality
   * @param {string} language - Language preference
   * @returns {Promise<Object>} Test result
   */
  async testAPIConnection(language = 'ko') {
    try {
      console.log('🧪 Testing Gemini API connection...');

      const testQuery = language === 'ko' ? '안녕하세요' : 'Hello';
      const response = await this.processQuery(testQuery, {
        language: language,
        pageContext: 'test',
      });

      const isAPIWorking =
        response.answer &&
        !response.answer.includes('일시적인 오류') &&
        !response.answer.includes('temporary error');

      console.log(
        isAPIWorking ? '✅ API connection successful' : '⚠️ API connection failed - using fallback'
      );

      return {
        success: isAPIWorking,
        response: response,
        apiKeyConfigured: !!this.geminiApiKey,
        message: isAPIWorking ? 'API working correctly' : 'Using fallback responses',
      };
    } catch (error) {
      console.error('❌ API test failed:', error);
      return {
        success: false,
        error: error.message,
        apiKeyConfigured: !!this.geminiApiKey,
        message: 'API test failed',
      };
    }
  }

  /**
   * 🧠 NLU Engine: 자연어 질문을 구조화된 명령으로 변환
   * @param {string} query - 사용자 자연어 질문
   * @param {string} language - 언어 코드 ('ko' | 'en')
   * @returns {Promise<Object>} 구조화된 명령 객체
   */
  async parseUserQueryToCommand(query, language = 'ko') {
    console.log('🧠 NLU: Parsing user query:', query);

    // NLU 전용 시스템 프롬프트
    const nluSystemPrompt = `You are an NLU (Natural Language Understanding) engine for a pickleball app.
Your ONLY job is to convert user queries into structured JSON commands.

Available commands:
1. searchEvents: Search for pickleball matches/events
   - params: gameType (singles/doubles/mixed), timeRange (morning/afternoon/evening/night), date (today/tomorrow/weekend), location (nearby/specific_area), skillLevel (beginner/intermediate/advanced)

2. navigate: Navigate to a screen
   - params: screen (ClubDirectory/CreateEvent/PartnerSearch/CoachDirectory/PaddleServices/Discover/MyProfile)

3. askQuestion: Answer pickleball-related questions
   - params: topic (rules/technique/strategy/equipment), subtopic (specific area)

4. unknown: When query is not pickleball-related or unclear

STRICT RULES:
- Respond ONLY with valid JSON, no other text
- Always include "command", "params", "confidence" (0-1), and "originalQuery"
- confidence should be 0.8+ for clear matches, 0.5-0.8 for partial matches, <0.5 for uncertain

Example output:
{"command":"searchEvents","params":{"gameType":"doubles","timeRange":"evening","date":"today"},"confidence":0.95,"originalQuery":"오늘 저녁 복식 경기 찾아줘"}`;

    try {
      // Gemini API 호출
      const response = await fetch(`${this.geminiEndpoint}?key=${this.geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${nluSystemPrompt}\n\nUser query (${language}): "${query}"\n\nRespond with JSON only:`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1, // 낮은 temperature로 일관된 JSON 출력
            maxOutputTokens: 200,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('Empty response from Gemini');
      }

      // JSON 파싱 (마크다운 코드 블록 제거)
      let jsonText = text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      const result = JSON.parse(jsonText);

      // 필수 필드 검증
      if (!result.command || !result.params) {
        throw new Error('Invalid command structure');
      }

      console.log('🧠 NLU: Parsed command:', result);
      return result;
    } catch (error) {
      console.error('🧠 NLU Error:', error);

      // 폴백: 기본 unknown 명령 반환
      return {
        command: 'unknown',
        params: {},
        confidence: 0,
        originalQuery: query,
        error: error.message,
      };
    }
  }

  /**
   * 🎯 NLU 명령 실행기: 파싱된 명령을 실행
   * @param {Object} command - parseUserQueryToCommand의 결과
   * @returns {Promise<Object>} 실행 결과
   */
  async executeNLUCommand(command) {
    console.log('🎯 Executing NLU command:', command.command);

    switch (command.command) {
      case 'searchEvents':
        // 토르가 구현할 eventService.searchEvents 호출
        // 임시로 메시지 반환
        return {
          type: 'search_result',
          message: `${command.params.gameType || '전체'} 경기를 검색합니다...`,
          data: null, // 실제 검색 결과는 eventService에서
        };

      case 'navigate':
        return {
          type: 'navigation',
          screen: command.params.screen,
          message: `${command.params.screen} 화면으로 이동합니다.`,
        };

      case 'askQuestion':
        // 기존 processQuery 메서드 활용
        const response = await this.processQuery(command.originalQuery, {
          language: 'ko',
        });
        return {
          type: 'answer',
          message: response.answer,
        };

      case 'unknown':
      default:
        return {
          type: 'fallback',
          message: '죄송합니다. 질문을 이해하지 못했어요. 피클볼 관련 질문을 해주세요!',
        };
    }
  }

  /**
   * AI 컨시어지 온보딩 액션 핸들러
   * 사용자가 선택한 목표에 따라 적절한 메시지와 네비게이션 명령 반환
   * @param {string} actionId - Action identifier (find_match, join_club, etc.)
   * @param {string} language - Language preference (ko, en)
   * @returns {Object} Response object with message, command, and nextHint
   */
  handleOnboardingAction(actionId, language = 'ko') {
    const scenarios = {
      find_match: {
        ko: {
          message:
            '훌륭한 선택이에요! 🎾 주변에서 진행 중인 번개 매치와 모임을 찾아볼게요. 마음에 드는 이벤트가 있으면 참가 신청을 눌러보세요!',
          nextHint: '상단 필터에서 "매치만" 또는 "모임만" 선택할 수 있어요.',
        },
        en: {
          message:
            "Great choice! 🎾 Let's find lightning matches and meetups nearby. If you find an event you like, tap to apply!",
          nextHint: 'You can filter by "Matches only" or "Meetups only" at the top.',
        },
        command: { type: 'navigate', screen: 'Discover', params: { initialFilter: 'events' } },
      },
      host_event: {
        ko: {
          message:
            '멋져요! 🙌 직접 모임을 주최해보시는 거군요. 매치(랭킹 경기)와 모임(친선 경기) 중 선택할 수 있어요.',
          nextHint: '원하는 날짜, 시간, 장소를 선택하면 자동으로 참가자를 모집해드려요.',
        },
        en: {
          message:
            'Awesome! 🙌 You want to host your own event. You can choose between Match (ranked) and Meetup (casual).',
          nextHint: 'Select your preferred date, time, and location to start recruiting.',
        },
        command: { type: 'navigate', screen: 'Create' },
      },
      join_club: {
        ko: {
          message:
            '좋아요! 🛡️ 함께할 클럽을 찾아볼게요. 지역별, 활동 유형별로 클럽을 검색할 수 있어요.',
          nextHint: '마음에 드는 클럽을 찾으면 "가입 신청" 버튼을 눌러보세요.',
        },
        en: {
          message:
            "Great! 🛡️ Let's find a club for you. You can search clubs by region and activity type.",
          nextHint: 'When you find a club you like, tap "Join Request".',
        },
        command: { type: 'navigate', screen: 'Discover', params: { initialFilter: 'clubs' } },
      },
      create_club: {
        ko: {
          message:
            '대단해요! 👑 나만의 피클볼 클럽을 만들어볼까요? 클럽 이름, 지역, 소개글을 입력하면 바로 시작할 수 있어요.',
          nextHint:
            '클럽을 만들면 자동으로 클럽장이 되어 멤버 관리, 이벤트 생성 등을 할 수 있어요.',
        },
        en: {
          message:
            "Amazing! 👑 Let's create your own pickleball club! Enter your club name, region, and description to get started.",
          nextHint: "Once created, you'll become the club admin with full management access.",
        },
        command: { type: 'navigate', screen: 'CreateClub' },
      },
      find_partner: {
        ko: {
          message:
            '좋은 생각이에요! 🤝 함께 피클볼를 칠 파트너를 찾아볼게요. 실력, 지역, 활동 시간이 비슷한 플레이어를 추천해드려요.',
          nextHint: '관심 있는 플레이어에게 친구 요청을 보내보세요.',
        },
        en: {
          message:
            "Great idea! 🤝 Let's find a pickleball partner. We'll recommend players with similar skill, region, and schedule.",
          nextHint: "Send a friend request to players you're interested in.",
        },
        command: { type: 'navigate', screen: 'Discover', params: { initialFilter: 'players' } },
      },
      find_coach: {
        ko: {
          message:
            '실력 향상을 원하시는군요! 🎓 지역의 피클볼 코치들을 찾아볼게요. 경력, 레슨비, 가능 시간을 확인할 수 있어요.',
          nextHint: '마음에 드는 코치에게 직접 연락해보세요.',
        },
        en: {
          message:
            "You want to improve! 🎓 Let's find local pickleball coaches. You can check their experience, rates, and availability.",
          nextHint: 'Contact coaches directly when you find one you like.',
        },
        command: { type: 'navigate', screen: 'Discover', params: { initialFilter: 'coaches' } },
      },
      paddle_service: {
        ko: {
          message:
            '장비 관리도 중요하죠! 🛠️ 스트링 교체, 패들 수리, 중고 장터 서비스를 찾아볼게요.',
          nextHint: '가까운 서비스 업체의 가격과 위치를 확인해보세요.',
        },
        en: {
          message:
            "Equipment matters! 🛠️ Let's find string replacement, paddle repair, and used gear services.",
          nextHint: 'Check prices and locations of nearby service providers.',
        },
        command: { type: 'navigate', screen: 'Discover', params: { initialFilter: 'services' } },
      },
    };

    const scenario = scenarios[actionId];
    if (!scenario) {
      return {
        message:
          language === 'ko'
            ? '죄송해요, 해당 옵션을 찾을 수 없어요. 다시 선택해주세요.'
            : "Sorry, I couldn't find that option. Please select again.",
        command: null,
        nextHint: null,
      };
    }

    const langData = scenario[language] || scenario.en;
    return {
      message: langData.message,
      command: scenario.command,
      nextHint: langData.nextHint,
    };
  }

  /**
   * 온보딩 Quick Reply 옵션 반환
   * 7대 핵심 목표를 Quick Reply 버튼으로 제공
   * @param {string} language - Language preference (ko, en)
   * @returns {Array} Array of quick reply options
   */
  getOnboardingQuickReplies(language = 'ko') {
    const replies = {
      ko: [
        { id: 'find_match', label: '플레이하기', icon: '🎾' },
        { id: 'host_event', label: '모임 주최하기', icon: '🙌' },
        { id: 'join_club', label: '클럽 가입하기', icon: '🛡️' },
        { id: 'create_club', label: '클럽 만들기', icon: '👑' },
        { id: 'find_partner', label: '파트너 찾기', icon: '🤝' },
        { id: 'find_coach', label: '레슨/코치 찾기', icon: '🎓' },
        { id: 'paddle_service', label: '패들/장비 서비스', icon: '🛠️' },
      ],
      en: [
        { id: 'find_match', label: 'Find Matches', icon: '🎾' },
        { id: 'host_event', label: 'Host Event', icon: '🙌' },
        { id: 'join_club', label: 'Join Club', icon: '🛡️' },
        { id: 'create_club', label: 'Create Club', icon: '👑' },
        { id: 'find_partner', label: 'Find Partner', icon: '🤝' },
        { id: 'find_coach', label: 'Find Coach', icon: '🎓' },
        { id: 'paddle_service', label: 'Paddle Service', icon: '🛠️' },
      ],
    };
    return replies[language] || replies.en;
  }

  /**
   * 온보딩 환영 메시지 생성
   * 사용자 이름을 포함한 개인화된 환영 메시지
   * @param {string} userName - User's display name
   * @param {string} language - Language preference (ko, en)
   * @returns {string} Welcome message
   */
  getOnboardingWelcome(userName, language = 'ko') {
    const welcomes = {
      ko: `안녕하세요, ${userName}님! 🎾 Lightning Pickleball에 오신 것을 환영합니다!\n\n오늘 무엇을 가장 먼저 해볼까요?`,
      en: `Hello, ${userName}! 🎾 Welcome to Lightning Pickleball!\n\nWhat would you like to do first today?`,
    };
    return welcomes[language] || welcomes.en;
  }
}

// Create singleton instance
const aiService = new AIService();

export default aiService;

// Named exports for testing
export { SYSTEM_PROMPT };
