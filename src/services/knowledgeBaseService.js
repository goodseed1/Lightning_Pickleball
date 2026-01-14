/**
 * Knowledge Base Service
 * Manages the knowledge base collection for the AI chatbot
 *
 * 📝 LPR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LPR" (Lightning Pickleball Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LPR로 변경하고 코드는 ntrp를 유지합니다.
 *
 * 🚀 [2025-01-10] 로컬 캐싱 추가
 * - Firestore 데이터를 AsyncStorage에 캐싱
 * - 챗봇 열 때만 로딩 (지연 로딩)
 * - 캐시 만료 시간: 1시간 (서버 업데이트 반영)
 */

import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 캐시 키 상수
const CACHE_KEY_PREFIX = 'knowledge_base_cache_';
const CACHE_VERSION_KEY = 'knowledge_base_version';
const CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1시간

/**
 * Knowledge Base Service for AI Chatbot
 */
class KnowledgeBaseService {
  /**
   * Initialize knowledge base with default Q&A data
   * @param {string} language - Language preference ('ko' or 'en')
   */
  async initializeKnowledgeBase(language = 'ko') {
    try {
      console.log('📚 Initializing knowledge base for language:', language);

      // Try to read from Firebase first
      const existingData = await this.getKnowledgeBase(language);
      if (existingData.length > 0) {
        console.log(`✅ Knowledge base loaded: ${existingData.length} items available`);
        return;
      }

      // If no Firebase data, use in-memory defaults
      const knowledgeData = this.getDefaultKnowledgeData(language);
      console.log(`📝 Using in-memory knowledge base with ${knowledgeData.length} default items`);

      // Store in memory for this session (no Firebase write attempt)
      this.memoryKnowledgeBase = this.memoryKnowledgeBase || {};
      this.memoryKnowledgeBase[language] = knowledgeData;
    } catch (error) {
      console.error('❌ Failed to initialize knowledge base:', error);
      // Fallback to in-memory defaults
      const knowledgeData = this.getDefaultKnowledgeData(language);
      this.memoryKnowledgeBase = this.memoryKnowledgeBase || {};
      this.memoryKnowledgeBase[language] = knowledgeData;
    }
  }

  /**
   * Get knowledge base data with local caching
   * @param {string} language - Language preference
   * @returns {Promise<Array>} Knowledge base items
   *
   * 🚀 로딩 순서:
   * 1. AsyncStorage 로컬 캐시 확인 (즉시)
   * 2. 캐시 유효하면 캐시 사용 (네트워크 없이!)
   * 3. 캐시 만료되었거나 없으면 Firestore에서 로드
   * 4. Firestore 실패 시 기본 데이터 사용
   */
  async getKnowledgeBase(language = 'ko') {
    const cacheKey = `${CACHE_KEY_PREFIX}${language}`;

    try {
      // 1️⃣ 먼저 로컬 캐시 확인 (빠름!)
      const cachedData = await this.getFromCache(cacheKey);
      if (cachedData) {
        console.log(
          `💾 Knowledge base loaded from cache (${language}): ${cachedData.length} items`
        );
        // 백그라운드에서 캐시 갱신 체크 (사용자 체감 없음)
        this.checkAndRefreshCache(language, cacheKey);
        return cachedData;
      }

      // 2️⃣ 캐시 없으면 Firestore에서 로드
      console.log(`🔥 Loading knowledge base from Firestore (${language})...`);
      const knowledgeRef = collection(db, 'knowledge_base');
      const q = query(
        knowledgeRef,
        where('language', '==', language),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(docItem => ({
        id: docItem.id,
        ...docItem.data(),
      }));

      if (data.length > 0) {
        // 캐시에 저장
        await this.saveToCache(cacheKey, data);
        console.log(`✅ Knowledge base cached (${language}): ${data.length} items`);
        return data;
      }

      // Firestore에 데이터 없으면 기본 데이터 사용
      console.log(`📝 No Firestore data, using defaults (${language})`);
      return this.getDefaultKnowledgeData(language);
    } catch (error) {
      console.log('📝 Firebase knowledge base not available, using fallback');
      // 메모리 캐시 확인
      if (this.memoryKnowledgeBase && this.memoryKnowledgeBase[language]) {
        return this.memoryKnowledgeBase[language];
      }
      return this.getDefaultKnowledgeData(language);
    }
  }

  /**
   * 로컬 캐시에서 데이터 가져오기
   * @param {string} cacheKey - 캐시 키
   * @returns {Promise<Array|null>} 캐시된 데이터 또는 null
   */
  async getFromCache(cacheKey) {
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > CACHE_EXPIRY_MS;

      if (isExpired) {
        console.log('⏰ Cache expired, will refresh');
        return null;
      }

      return data;
    } catch (error) {
      console.log('⚠️ Cache read error:', error.message);
      return null;
    }
  }

  /**
   * 로컬 캐시에 데이터 저장
   * @param {string} cacheKey - 캐시 키
   * @param {Array} data - 저장할 데이터
   */
  async saveToCache(cacheKey, data) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.log('⚠️ Cache save error:', error.message);
    }
  }

  /**
   * 백그라운드에서 캐시 갱신 체크
   * 서버 버전이 변경되었으면 캐시 갱신
   */
  async checkAndRefreshCache(language, cacheKey) {
    try {
      // 버전 메타데이터 확인
      const versionDoc = await getDoc(doc(db, 'knowledge_base_meta', 'version'));
      if (!versionDoc.exists()) return;

      const serverVersion = versionDoc.data().version;
      const cachedVersion = await AsyncStorage.getItem(CACHE_VERSION_KEY);

      if (cachedVersion !== String(serverVersion)) {
        console.log('🔄 Server version changed, refreshing cache...');
        // Firestore에서 새 데이터 로드
        const knowledgeRef = collection(db, 'knowledge_base');
        const q = query(
          knowledgeRef,
          where('language', '==', language),
          where('isActive', '==', true)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(docItem => ({
          id: docItem.id,
          ...docItem.data(),
        }));

        if (data.length > 0) {
          await this.saveToCache(cacheKey, data);
          await AsyncStorage.setItem(CACHE_VERSION_KEY, String(serverVersion));
          console.log('✅ Cache refreshed with new server data');
        }
      }
    } catch (error) {
      // 백그라운드 작업이라 실패해도 무시
      console.log('⚠️ Background cache refresh skipped:', error.message);
    }
  }

  /**
   * 캐시 수동 클리어 (디버깅/테스트용)
   */
  async clearCache() {
    try {
      await AsyncStorage.removeItem(`${CACHE_KEY_PREFIX}ko`);
      await AsyncStorage.removeItem(`${CACHE_KEY_PREFIX}en`);
      await AsyncStorage.removeItem(CACHE_VERSION_KEY);
      console.log('🗑️ Knowledge base cache cleared');
    } catch (error) {
      console.log('⚠️ Cache clear error:', error.message);
    }
  }

  /**
   * Add new knowledge item (memory-only for now)
   * @param {Object} knowledgeItem - Knowledge item to add
   * @param {string} language - Language preference
   */
  async addKnowledgeItem(knowledgeItem, language = 'ko') {
    try {
      // For now, only add to memory cache
      // Firebase writes are disabled to prevent permission errors

      if (!this.memoryKnowledgeBase) {
        this.memoryKnowledgeBase = {};
      }

      if (!this.memoryKnowledgeBase[language]) {
        this.memoryKnowledgeBase[language] = this.getDefaultKnowledgeData(language);
      }

      // Add to memory with generated ID
      const newItem = {
        ...knowledgeItem,
        id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        language: language,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      this.memoryKnowledgeBase[language].push(newItem);
      console.log('📝 Added knowledge item to memory cache:', newItem.id);

      return newItem.id;
    } catch (error) {
      console.error('❌ Failed to add knowledge item:', error);
      throw error;
    }
  }

  /**
   * Get default knowledge base data
   * @param {string} language - Language preference
   * @returns {Array} Default knowledge data
   */
  getDefaultKnowledgeData(language = 'ko') {
    if (language === 'ko') {
      return [
        {
          question: '번개 매치와 번개 모임의 차이점은 무엇인가요?',
          answer:
            '번개 매치는 1:1 랭킹 경기로 ELO 점수가 변동되며, 매치 결과가 랭킹에 반영됩니다. 번개 모임은 여러 명이 참여하는 친선 경기로 랭킹에 영향을 주지 않으며, 즐거운 피클볼 교류가 목적입니다.',
          keywords: ['매치', '모임', '차이점', '랭킹', '번개'],
          category: 'basic',
          priority: 1,
        },
        {
          question: 'ELO 랭킹은 어떻게 계산되나요?',
          answer:
            'ELO 랭킹은 체스에서 유래된 실력 평가 시스템입니다. 승패에 따라 점수가 변동되며, 상대방과의 실력 차이가 클수록 변동폭이 달라집니다. 강한 상대를 이기면 더 많은 점수를 얻고, 약한 상대에게 지면 더 많은 점수를 잃습니다.',
          keywords: ['ELO', '랭킹', '점수', '계산', '실력'],
          category: 'ranking',
          priority: 1,
        },
        {
          question: '클럽은 어떻게 만들 수 있나요?',
          answer:
            "'내 클럽' 탭에서 '새 클럽 만들기' 버튼을 누르면 됩니다. 클럽 이름, 설명, 위치, 공개/비공개 설정, 가입 방식 등을 설정할 수 있습니다. 클럽을 만들면 자동으로 관리자가 되어 멤버 관리, 이벤트 생성, 정기 모임 설정 등을 할 수 있습니다. 참고로 한 사용자당 최대 3개까지 클럽을 생성할 수 있습니다.",
          keywords: ['클럽', '생성', '만들기', '관리자'],
          category: 'club',
          priority: 1,
        },
        // 🎾 클럽 생성/가입 제한 Q&A (2025-12-24 추가)
        {
          question: '클럽은 몇 개까지 생성하고 가입할 수 있나요?',
          answer:
            '클럽은 한 사용자당 최대 3개까지 생성할 수 있습니다. 클럽 가입은 최대 5개까지 가능합니다. 만약 더 많은 클럽을 만들거나 가입하고 싶으시다면, 기존 클럽을 탈퇴하거나 삭제하신 후 새로운 클럽에 가입하실 수 있습니다.',
          keywords: ['클럽', '생성', '가입', '제한', '개수', '몇개', '최대'],
          category: 'club',
          priority: 1,
        },
        {
          question: '클럽 생성 제한은 몇 개인가요?',
          answer:
            '한 사용자당 최대 3개까지 클럽을 생성할 수 있습니다. 만약 3개 이상의 클럽을 만들고 싶으시다면 저에게 "클럽을 더 만들고 싶어요" 또는 "I need to create more than 3 clubs"라고 말씀해 주세요! 요청을 관리팀에 전달해 드립니다.',
          keywords: ['클럽', '생성', '제한', '3개', '최대'],
          category: 'club',
          priority: 1,
        },
        {
          question: '클럽 가입 제한은 몇 개인가요?',
          answer:
            '한 사용자당 최대 5개까지 클럽에 가입할 수 있습니다. 이 제한은 여러 클럽에서 활발히 활동하면서도 품질 있는 참여를 유지하기 위해 설정되었습니다. 만약 새로운 클럽에 가입하고 싶으시다면 기존 클럽 중 하나를 탈퇴하신 후 가입하실 수 있습니다.',
          keywords: ['클럽', '가입', '제한', '5개', '최대'],
          category: 'club',
          priority: 1,
        },
        {
          question: '랭킹은 어떻게 정렬되나요?',
          answer:
            '랭킹은 경기 타입에 따라 다르게 계산됩니다:\n\n🎾 **단식/복식/혼합복식 탭**:\n• 해당 타입의 ELO 점수로 정렬됩니다.\n• 경기를 치르지 않은 경우 온보딩에서 선택한 LPR 기반 ELO가 사용됩니다.\n• 경기를 치른 경우 경기 결과가 반영된 ELO가 사용됩니다.\n\n📊 **전체 탭**:\n• 단식, 복식, 혼합복식 ELO의 **평균값**으로 정렬됩니다.\n• 계산법: (단식 ELO + 복식 ELO + 혼복 ELO) ÷ 3\n• 예: (1400 + 1200 + 1200) ÷ 3 = 평균 1267\n• 온보딩을 완료한 모든 사용자가 랭킹에 포함됩니다.\n\n👤 **내 프로필 > 정보 탭의 전체 순위**:\n• 통계 탭의 "전체" 랭킹과 **동일한 기준**입니다.\n• 평균 ELO 기반: (단식 + 복식 + 혼복) ÷ 3\n\n💡 같은 ELO면 같은 순위로 표시됩니다 (스포츠 스타일 동점 처리).',
          keywords: [
            '랭킹',
            '정렬',
            '평균',
            'ELO',
            '순위',
            '기준',
            '전체',
            '단식',
            '복식',
            '프로필',
            '정보',
          ],
          category: 'ranking',
          priority: 1,
        },
        {
          question: '신규 사용자도 랭킹이 있나요?',
          answer:
            '네! 온보딩을 완료하면 경기를 하지 않아도 랭킹이 부여됩니다. 신규 사용자들은 승률이 0%이므로, 온보딩 시 선택한 LPR(예: 2.0, 2.5, 3.0, 3.5)에 따른 ELO 점수로 순위가 결정됩니다. 예를 들어, LPR 3.5를 선택한 신규 사용자는 LPR 2.0을 선택한 신규 사용자보다 높은 랭킹을 받습니다.',
          keywords: ['신규', '사용자', '랭킹', '온보딩', 'LPR', '0%'],
          category: 'ranking',
          priority: 1,
        },
        {
          question: 'LPR 레벨이 무엇인가요?',
          answer:
            'LPR(Lightning Pickleball Rating)은 Lightning Pickleball 앱의 고유한 ELO 기반 실력 평가 시스템입니다. 1(Bronze, 초보자)부터 10(Legend, 최상위)까지 10단계로 나뉩니다. ELO 점수(600-2400+)를 기반으로 자동 계산되며, 실제 경기 결과에 따라 변동됩니다. LPR 1-2: Bronze/Silver (초보), LPR 3-4: Gold (중급 입문), LPR 5-6: Platinum (중급), LPR 7: Diamond (중상급), LPR 8-9: Master (상급), LPR 10: Legend (최상위). 이 시스템으로 비슷한 실력의 상대와 공정한 매칭이 가능합니다.',
          keywords: ['LPR', '레벨', '실력', '평가', '매칭', 'ELO', '랭킹', 'NTRP', '등급'],
          category: 'basic',
          priority: 1,
        },
        {
          question: 'LPR과 NTRP의 차이점은 무엇인가요?',
          answer:
            '📊 LPR vs NTRP 비교표:\n\n' +
            '【LPR (Lightning Pickleball Rating)】\n' +
            '• 범위: 1-10 (정수)\n' +
            '• 기반: ELO 알고리즘 (체스 랭킹 방식)\n' +
            '• 업데이트: 매 경기 후 자동 실시간 반영\n' +
            '• 특징: Lightning Pickleball 앱 전용 시스템\n' +
            '• 평가방식: 경기 결과 기반 객관적 산정\n\n' +
            '【NTRP (National Pickleball Rating Program)】\n' +
            '• 범위: 1.0-7.0 (소수점)\n' +
            '• 기반: USTA 공식 평가 기준\n' +
            '• 업데이트: 자가 평가 또는 공인 코치 평가\n' +
            '• 특징: 미국 피클볼 협회 공식 시스템\n' +
            '• 평가방식: 기술/전술 체크리스트 기반 주관적 평가\n\n' +
            '【LPR ↔ NTRP 변환표】\n' +
            '• LPR 1-2 = NTRP 1.5-2.5 (초보자)\n' +
            '• LPR 3-4 = NTRP 3.0-3.5 (중급 입문)\n' +
            '• LPR 5-6 = NTRP 4.0-4.5 (중급)\n' +
            '• LPR 7 = NTRP 5.0 (중상급)\n' +
            '• LPR 8-9 = NTRP 5.5-6.0 (상급)\n' +
            '• LPR 10 = NTRP 6.5-7.0 (최상위)\n\n' +
            '【주요 차이점】\n' +
            '• LPR은 실제 경기 결과를 기반으로 자동 계산되어 더 정확합니다.\n' +
            '• NTRP는 자가 신고 방식이라 과대/과소 평가될 수 있습니다.\n' +
            '• LPR은 앱 내에서 공정한 매칭을 위해 최적화되었습니다.',
          keywords: [
            'LPR',
            'NTRP',
            '차이점',
            '비교',
            '차이',
            'ELO',
            'USTA',
            '랭킹',
            '실력',
            '평가',
            '변환',
          ],
          category: 'ranking',
          priority: 2,
        },
        {
          question: 'LPR을 NTRP로 변환하면 얼마인가요?',
          answer:
            '🎾 LPR ↔ NTRP 변환표:\n\n' +
            '• LPR 1-2 = NTRP 1.5-2.5 (초보자)\n' +
            '• LPR 3-4 = NTRP 3.0-3.5 (중급 입문)\n' +
            '• LPR 5-6 = NTRP 4.0-4.5 (중급)\n' +
            '• LPR 7 = NTRP 5.0 (중상급)\n' +
            '• LPR 8-9 = NTRP 5.5-6.0 (상급)\n' +
            '• LPR 10 = NTRP 6.5-7.0 (최상위)\n\n' +
            '예시: LPR 5라면 NTRP 4.0 정도입니다!\n\n' +
            '참고: 이 변환은 대략적인 비교이며, LPR은 실제 경기 결과 기반이고 NTRP는 자가 평가 기반이라 정확히 일치하지 않을 수 있습니다.',
          keywords: ['LPR', 'NTRP', '변환', '얼마', '몇', '레벨', '환산', '대응', '같은', '동일'],
          category: 'ranking',
          priority: 2,
        },
        {
          question: '리그와 토너먼트의 차이점은 무엇인가요?',
          answer:
            '리그는 장기간(보통 몇 주~몇 달) 진행되는 정규 시즌 형태의 경기로, 참가자들이 여러 번 경기를 하여 순위를 정합니다. 토너먼트는 단기간에 진행되는 토너먼트 방식으로, 패배하면 탈락하는 elimination 형태입니다. 둘 다 클럽에서 주최할 수 있습니다.',
          keywords: ['리그', '토너먼트', '대회', '차이', '클럽'],
          category: 'competition',
          priority: 1,
        },
        {
          question: '친구는 어떻게 추가하나요?',
          answer:
            "친구를 추가하는 방법은 여러 가지입니다: 1) '발견' 탭의 '플레이어' 에서 검색, 2) 매치나 모임에서 만난 사람의 프로필에서 친구 추가, 3) 클럽 멤버 목록에서 추가. 친구가 되면 서로의 활동을 피드에서 볼 수 있고, 매치 초대를 더 쉽게 할 수 있습니다.",
          keywords: ['친구', '추가', '검색', '프로필'],
          category: 'social',
          priority: 1,
        },
        {
          question: '매치 결과는 어떻게 기록하나요?',
          answer:
            "번개 매치가 끝나면 매치 주최자가 '결과 기록하기' 버튼을 눌러 승자와 점수를 입력합니다. 점수 형식은 6-4, 6-2처럼 입력하면 되고, 결과가 기록되면 양 선수의 ELO 랭킹이 자동으로 업데이트됩니다. 결과 기록 후에는 스포츠맨십 평가도 진행됩니다.",
          keywords: ['매치', '결과', '기록', '점수', '랭킹'],
          category: 'match',
          priority: 1,
        },
        {
          question: '스포츠맨십 평가는 무엇인가요?',
          answer:
            '매치나 모임 종료 후 상대방의 스포츠맨십, 시간 준수, 경기 태도를 별점(1-5점)으로 평가하는 시스템입니다. 평가 결과는 사용자의 프로필에 누적되어 평균 점수로 표시되며, 다른 사용자들이 매치 상대를 선택할 때 참고할 수 있습니다.',
          keywords: ['스포츠맨십', '평가', '별점', '태도'],
          category: 'rating',
          priority: 1,
        },
        {
          question: '클럽에 어떻게 가입하나요?',
          answer:
            "'발견' 탭의 '클럽' 에서 원하는 클럽을 찾아 '가입 신청' 버튼을 누르면 됩니다. 공개 클럽은 즉시 가입되지만, 비공개 클럽은 관리자의 승인이 필요합니다. 가입 신청 상태는 클럽 카드에서 확인할 수 있으며, 승인되면 알림을 받게 됩니다.",
          keywords: ['클럽', '가입', '신청', '승인'],
          category: 'club',
          priority: 1,
        },
        {
          question: '피드에서 무엇을 볼 수 있나요?',
          answer:
            '피드에서는 친구들과 가입한 클럽의 최신 활동을 시간순으로 볼 수 있습니다. 매치 결과, 리그/토너먼트 우승, 클럽 이벤트, 새 멤버 가입 등의 소식이 표시됩니다. 필터 기능으로 특정 종류의 활동만 볼 수도 있습니다.',
          keywords: ['피드', '활동', '친구', '클럽', '필터'],
          category: 'feed',
          priority: 1,
        },
        // 🏅 배지 & 트로피 관련 Q&A (2025-12-22 추가)
        {
          question: '배지는 어떻게 얻나요?',
          answer:
            '배지는 다양한 업적을 달성하면 자동으로 수여됩니다. 연승 배지(3연승, 5연승, 10연승), 경기 마일스톤 배지(10경기, 50경기, 100경기), 소셜 플레이어 배지(5명 이상의 다른 상대와 경기), 리그 챔피언 배지(첫 리그 우승) 등이 있습니다. 배지는 프로필의 Hall of Fame 섹션에서 확인할 수 있습니다.',
          keywords: ['배지', '업적', '연승', '마일스톤', 'badge'],
          category: 'achievements',
          priority: 1,
        },
        {
          question: '트로피는 어떻게 얻나요?',
          answer:
            '트로피는 클럽 리그나 토너먼트에서 우승(1위) 또는 준우승(2위)을 하면 자동으로 수여됩니다. 우승 트로피는 금색, 준우승 트로피는 은색으로 표시됩니다. 트로피는 프로필의 Hall of Fame 섹션에서 확인할 수 있습니다.',
          keywords: ['트로피', '우승', '준우승', '리그', '토너먼트', 'trophy'],
          category: 'achievements',
          priority: 1,
        },
        {
          question: '연승 배지는 무엇인가요?',
          answer:
            '연승 배지는 연속으로 경기에서 이길 때 수여됩니다. 3연승 시 "Hot Streak" (Bronze), 5연승 시 "On Fire" (Silver), 10연승 시 "Unstoppable" (Gold) 배지를 받습니다. 경기에서 패배하면 연승 카운트가 리셋됩니다.',
          keywords: ['연승', '배지', '스트릭', 'streak', '연속'],
          category: 'achievements',
          priority: 1,
        },
        {
          question: 'Hall of Fame이 무엇인가요?',
          answer:
            'Hall of Fame(명예의 전당)은 프로필에서 볼 수 있는 업적 섹션입니다. 획득한 트로피(우승/준우승), 배지(연승, 마일스톤, 소셜 등), 그리고 명예 배지(상대방에게 받은 투표)가 모두 표시됩니다. 다른 플레이어의 프로필에서도 그들의 Hall of Fame을 볼 수 있습니다.',
          keywords: ['Hall of Fame', '명예의 전당', '프로필', '트로피', '배지'],
          category: 'achievements',
          priority: 1,
        },
        {
          question: '명예 배지(Honor Tags)는 무엇인가요?',
          answer:
            '명예 배지는 매치 후 상대방에게 투표하여 부여하는 특별한 태그입니다. 칼같은라인콜(#SharpEyed), 파이팅넘침(#FullOfEnergy), 매너장인(#MrManner), 시간은금이다(#PunctualPro), 강철멘탈(#MentalFortress), 코트의코미디언(#CourtJester) 등이 있습니다. 많이 받은 명예 배지가 프로필에 상위 3개까지 표시됩니다.',
          keywords: ['명예', '배지', 'honor', 'tag', '투표', '매너'],
          category: 'achievements',
          priority: 1,
        },
        // 🎯 온보딩 LPR 제한 관련 Q&A (2025-12-22 추가)
        {
          question: '온보딩에서 선택할 수 있는 최대 LPR은 얼마인가요?',
          answer:
            '온보딩에서 선택할 수 있는 최대 LPR(Lightning Pickleball Rating)은 3.5입니다. 2.0, 2.5, 3.0, 3.5 중에서 선택할 수 있습니다. 4.0 이상의 레벨은 실제 경기를 통해서만 달성할 수 있습니다. 이는 실력을 직접 증명해야 한다는 원칙을 반영한 것입니다.',
          keywords: ['온보딩', 'LPR', '최대', '레벨', '3.5', '선택'],
          category: 'onboarding',
          priority: 1,
        },
        {
          question: 'LPR 4.0 이상은 어떻게 달성하나요?',
          answer:
            'LPR 4.0 이상(4.0, 4.5, 5.0, 5.5)은 온보딩에서 직접 선택할 수 없습니다. 실제 번개 매치에서 승리하여 ELO 점수를 올려야만 달성할 수 있습니다. 강한 상대를 이기면 더 많은 점수를 얻게 되고, 지속적인 승리를 통해 더 높은 LPR 레벨에 도달할 수 있습니다. 실력으로 증명하세요! 💪',
          keywords: ['LPR', '4.0', '달성', '매치', '승리', 'ELO', '높은 레벨'],
          category: 'ranking',
          priority: 1,
        },
        {
          question: '왜 온보딩에서 높은 LPR을 선택할 수 없나요?',
          answer:
            'Lightning Pickleball는 공정한 경쟁을 위해 온보딩에서 LPR 3.5까지만 선택할 수 있도록 제한하고 있습니다. 4.0 이상의 고급 레벨은 실제 경기 실력으로 증명해야 합니다. 이렇게 하면 랭킹 시스템의 신뢰성이 높아지고, 모든 플레이어가 공정하게 경쟁할 수 있습니다.',
          keywords: ['온보딩', 'LPR', '제한', '공정', '실력', '증명'],
          category: 'onboarding',
          priority: 1,
        },
        // 🎯 신규 사용자 랭킹 Q&A (2025-12-22 추가)
        {
          question: '새로 가입하면 바로 랭킹이 표시되나요?',
          answer:
            '네! 온보딩을 완료하고 LPR 레벨을 선택하면 바로 랭킹이 표시됩니다. 경기를 하지 않아도 "#X / Y" 형식으로 현재 순위를 확인할 수 있습니다. 첫날부터 커뮤니티의 일원으로 소속감을 느끼고, 랭킹을 올리기 위한 경쟁에 참여해보세요! 🎯',
          keywords: ['신규', '가입', '랭킹', '표시', '온보딩', '새 사용자'],
          category: 'ranking',
          priority: 1,
        },
        {
          question: '같은 ELO 점수면 랭킹이 어떻게 표시되나요?',
          answer:
            'Lightning Pickleball는 스포츠 스타일의 동점 처리를 사용합니다. 같은 ELO 점수를 가진 사용자들은 같은 순위로 표시됩니다. 예를 들어, ELO 1400인 사용자가 2명이면 둘 다 #1로 표시되고, 그 다음 사용자는 #3이 됩니다 (#2를 건너뜀). 공정하고 명확한 랭킹 시스템입니다!',
          keywords: ['동점', '랭킹', 'ELO', '같은', '순위', '표시'],
          category: 'ranking',
          priority: 1,
        },
        {
          question: '랭킹 표시 형식은 어떻게 되나요?',
          answer:
            '랭킹은 "#X / Y" 형식으로 표시됩니다. X는 현재 순위, Y는 랭킹에 포함된 총 사용자 수입니다. 예를 들어 "#15 / 150"이면 150명 중 15위라는 의미입니다. 전체, 월간, 시즌별로 랭킹을 확인할 수 있습니다.',
          keywords: ['랭킹', '형식', '표시', '순위', '사용자 수'],
          category: 'ranking',
          priority: 1,
        },
        // 🎯 신규 사용자 랭킹 결정 방식 Q&A (2025-12-24 추가)
        {
          question: '기록 경기 경험이 없는 새 사용자의 랭킹은 어떻게 정해 지나요?',
          answer:
            '새로운 사용자의 랭킹은 온보딩 시 직접 선택한 LPR(Lightning Pickleball Rating) 레벨을 기반으로 결정됩니다.\n\n📝 **온보딩 과정:**\n• 2.0, 2.5, 3.0, 3.5 중에서 본인의 실력에 맞는 레벨을 직접 선택합니다.\n• 4.0 이상의 레벨은 실제 경기 결과로만 도달할 수 있습니다.\n\n📊 **랭킹 결정 방식:**\n• 선택한 LPR은 내부적으로 ELO 점수로 변환됩니다 (예: 3.0 → 1200점, 3.5 → 1400점).\n• 모든 사용자의 ELO 점수를 높은 순서대로 정렬하여 순위가 결정됩니다.\n• 같은 ELO 점수를 가진 사용자는 같은 순위로 표시됩니다.\n\n🏆 **랭킹 올리는 방법:**\n경기에서 승리하면 ELO 점수가 올라가고, 패배하면 내려갑니다. 특히 자신보다 높은 ELO의 상대를 이기면 더 많은 점수를 얻습니다!',
          keywords: [
            '새 사용자',
            '신규',
            '랭킹',
            '결정',
            '경기 경험',
            'LPR',
            'ELO',
            '온보딩',
            '순위',
          ],
          category: 'ranking',
          priority: 2,
        },
        // ⚡ 퀵 매치 자격 조건 Q&A (2025-12-24 추가)
        {
          question: '플레이어 목록에서 매치 신청 버튼이 비활성화되어 있는 경우는 언제인가요?',
          answer:
            '매치 신청 버튼이 비활성화되는 경우: 1) LPR 제한 - 단식은 호스트와 같은 레벨(0) 또는 1레벨 높은 상대(+1)만 초대 가능 (예: LPR 5는 5~6 범위). 복식/혼복은 ±2 허용 (예: LPR 5는 3~7 범위). 2) 성별 제한 - 단식은 동성 간에만 신청 가능. 두 조건을 모두 충족해야 매치 신청이 가능합니다. [2025년 1월 업데이트]',
          keywords: [
            '매치 신청',
            '비활성화',
            '버튼',
            'LPR',
            '성별',
            '퀵 매치',
            '조건',
            '단식',
            '복식',
          ],
          category: 'match',
          priority: 1,
        },
        // 🎾 LPR 레벨 초대 제한 Q&A (2025-01-01 추가)
        {
          question: '단식 매치에서 어느 레벨까지 초대할 수 있나요?',
          answer:
            '🎯 **단식 매치 LPR 레벨 제한**\n\n단식에서는 **같은 레벨(0) 또는 1레벨 높은 상대(+1)** 만 초대할 수 있습니다.\n\n📊 **예시:**\n• LPR 5인 호스트 → LPR 5, 6 초대 가능\n• LPR 3인 호스트 → LPR 3, 4 초대 가능\n• ❌ LPR 5인 호스트가 LPR 4(하위) 초대 불가\n• ❌ LPR 5인 호스트가 LPR 7(+2 초과) 초대 불가\n\n🤔 **이유:**\n실력이 낮은 상대를 일부러 초대해서 쉽게 이기는 것을 방지합니다. 하지만 더 강한 상대에게 도전하는 것은 허용됩니다!\n\n💡 **복식/혼합복식은?**\n복식과 혼합복식은 ±2 범위가 허용되어 더 유연한 매칭이 가능합니다. (예: LPR 5 → 3~7 범위)',
          keywords: [
            '단식',
            'LPR',
            '레벨',
            '초대',
            '제한',
            '범위',
            '규칙',
            '누구',
            '어느',
            '몇',
            '싱글스',
          ],
          category: 'match',
          priority: 1,
        },
        {
          question: '복식 매치에서 어느 레벨까지 초대할 수 있나요?',
          answer:
            '🎾 **복식/혼합복식 LPR 레벨 제한**\n\n복식과 혼합복식에서는 **±2 LPR 범위** 내에서 초대가 가능합니다.\n\n📊 **예시:**\n• LPR 5인 호스트 → LPR 3~7 초대 가능\n• LPR 4인 호스트 → LPR 2~6 초대 가능\n• LPR 8인 호스트 → LPR 6~10 초대 가능\n\n🤔 **단식보다 범위가 넓은 이유:**\n• 복식은 팀워크가 중요하므로 더 유연한 매칭 허용\n• 다양한 실력대의 플레이어와 파트너십 형성 가능\n• 초보자와 고급자가 함께 팀을 이룰 수 있음\n\n💡 **단식은?**\n단식은 같은 레벨(0) 또는 +1 레벨만 초대 가능합니다.',
          keywords: [
            '복식',
            '혼합복식',
            '혼복',
            'LPR',
            '레벨',
            '초대',
            '제한',
            '범위',
            '규칙',
            '더블스',
          ],
          category: 'match',
          priority: 1,
        },
        {
          question: '왜 같은 성별끼리만 매치할 수 있나요?',
          answer:
            '단식 번개 매치는 공정한 경쟁을 위해 동성 간에만 신청할 수 있습니다. 남성은 남성끼리, 여성은 여성끼리 매치를 진행합니다. 혼합복식이나 번개 모임의 경우에는 성별 제한이 없으므로, 다양한 조합으로 피클볼를 즐기실 수 있습니다!',
          keywords: ['성별', '동성', '매치', '남성', '여성', '단식', '공정'],
          category: 'match',
          priority: 1,
        },
        // 📧 공식 연락처 Q&A (2025-12-24 추가)
        {
          question: '번개 피클볼 앱 공식 이메일 주소가 무엇인가요?',
          answer:
            '번개 피클볼 앱의 공식 이메일 주소는 lightningpickleballapp@gmail.com 입니다. 문의사항, 피드백, 버그 신고, 제휴 문의 등 모든 문의는 이 이메일로 보내주세요. 빠른 시간 내에 답변 드리겠습니다! ⚡',
          keywords: [
            '이메일',
            '연락처',
            '문의',
            '공식',
            '피드백',
            '버그',
            '제휴',
            'email',
            'contact',
          ],
          category: 'contact',
          priority: 1,
        },
        {
          question: '버그를 발견하면 어디로 신고하나요?',
          answer:
            '버그나 오류를 발견하시면 저(챗봇)에게 바로 말씀해 주세요! 💬 "버그 신고: [문제 설명]" 형식으로 알려주시면 개발팀에게 전달됩니다. 가능하다면 어떤 상황에서 발생했는지, 어떤 화면이었는지 함께 알려주시면 더 빠르게 해결할 수 있어요. 여러분의 피드백이 앱을 더 좋게 만듭니다! 🙏',
          keywords: ['버그', '신고', '오류', '에러', '문의', '피드백', 'bug', 'report'],
          category: 'contact',
          priority: 1,
        },
        // 📊 ELO to LPR 변환 테이블 Q&A (2025-12-31 추가)
        {
          question: 'ELO to LPR 변환 테이블을 보여줘요',
          answer:
            '📊 **ELO → LPR 변환 테이블**\n\nLightning Pickleball는 ELO 점수를 LPR(Lightning Pickleball Rating) 레벨로 변환합니다:\n\n| ELO 범위 | LPR 레벨 | 티어 |\n|----------|---------|------|\n| 0 - 1000 | LPR 1 | 🥉 Bronze |\n| 1000 - 1100 | LPR 2 | 🥈 Silver |\n| 1100 - 1200 | LPR 3 | 🥇 Gold I |\n| 1200 - 1300 | LPR 4 | 🥇 Gold II |\n| 1300 - 1450 | LPR 5 | 💎 Platinum I |\n| 1450 - 1600 | LPR 6 | 💎 Platinum II |\n| 1600 - 1800 | LPR 7 | 💠 Diamond |\n| 1800 - 2100 | LPR 8 | 👑 Master I |\n| 2100 - 2400 | LPR 9 | 👑 Master II |\n| 2400+ | LPR 10 | 🏆 Legend |\n\n💡 **참고**: 강한 상대를 이기면 더 많은 점수를 얻게 되고, 지속적인 승리를 통해 더 높은 LPR 레벨에 도달할 수 있습니다. 실력으로 증명하세요! 💪',
          keywords: [
            'ELO',
            'LPR',
            '변환',
            '테이블',
            'convert',
            'table',
            '점수',
            '레벨',
            '티어',
            '범위',
          ],
          category: 'ranking',
          priority: 1,
        },
        {
          question: 'ELO 점수가 LPR로 어떻게 변환되나요?',
          answer:
            'ELO 점수는 다음과 같이 LPR 레벨로 변환됩니다:\n\n• ELO 0-1000 → LPR 1 (Bronze)\n• ELO 1000-1100 → LPR 2 (Silver)\n• ELO 1100-1200 → LPR 3 (Gold I)\n• ELO 1200-1300 → LPR 4 (Gold II)\n• ELO 1300-1450 → LPR 5 (Platinum I)\n• ELO 1450-1600 → LPR 6 (Platinum II)\n• ELO 1600-1800 → LPR 7 (Diamond)\n• ELO 1800-2100 → LPR 8 (Master I)\n• ELO 2100-2400 → LPR 9 (Master II)\n• ELO 2400+ → LPR 10 (Legend)\n\n예를 들어, ELO가 1400이면 LPR 5 (Platinum I)입니다!',
          keywords: ['ELO', 'LPR', '변환', '어떻게', '점수', '레벨', 'convert', '계산'],
          category: 'ranking',
          priority: 1,
        },
        {
          question: 'LPR 레벨별 ELO 범위가 어떻게 되나요?',
          answer:
            '각 LPR 레벨에 해당하는 ELO 점수 범위입니다:\n\n🥉 **LPR 1 (Bronze)**: 0 - 1000\n🥈 **LPR 2 (Silver)**: 1000 - 1100\n🥇 **LPR 3 (Gold I)**: 1100 - 1200\n🥇 **LPR 4 (Gold II)**: 1200 - 1300\n💎 **LPR 5 (Platinum I)**: 1300 - 1450\n💎 **LPR 6 (Platinum II)**: 1450 - 1600\n💠 **LPR 7 (Diamond)**: 1600 - 1800\n👑 **LPR 8 (Master I)**: 1800 - 2100\n👑 **LPR 9 (Master II)**: 2100 - 2400\n🏆 **LPR 10 (Legend)**: 2400+\n\n경기에서 승리하면 ELO가 올라가고, 더 높은 LPR 레벨에 도달할 수 있습니다! 화이팅! 💪',
          keywords: [
            'LPR',
            'ELO',
            '범위',
            '레벨별',
            '티어',
            'Bronze',
            'Silver',
            'Gold',
            'Platinum',
            'Diamond',
            'Master',
            'Legend',
          ],
          category: 'ranking',
          priority: 1,
        },
        // 🏛️ 클럽 권한 시스템 Q&A (2025-12-25 추가)
        {
          question: '클럽에서 관리자와 운영진의 차이점은 무엇인가요?',
          answer:
            '클럽에는 세 가지 역할이 있습니다:\n\n👑 **관리자 (Admin)**:\n• 클럽의 최고 권한자로, 클럽을 생성한 사람이 자동으로 관리자가 됩니다.\n• 클럽 설정 변경, 삭제, 모든 멤버 관리 권한을 가집니다.\n• 운영진을 임명하거나 해제할 수 있습니다.\n• 클럽당 관리자는 1명만 있을 수 있습니다.\n\n🛡️ **운영진 (Manager)**:\n• 관리자가 임명한 보조 관리자입니다.\n• 가입 신청 승인/거절, 이벤트 생성 등의 권한을 가집니다.\n• 관리자 권한 이전 시 후보가 됩니다.\n\n👤 **회원 (Member)**:\n• 클럽의 일반 참여자입니다.\n• 이벤트 참여, 게시판 글쓰기 등의 기본 활동이 가능합니다.',
          keywords: ['관리자', '운영진', '회원', '역할', '권한', '차이점', 'admin', 'manager'],
          category: 'club',
          priority: 1,
        },
        {
          question: '관리자 권한은 어떻게 이전되나요?',
          answer:
            '관리자 권한 이전은 다음과 같은 상황에서 발생합니다:\n\n1️⃣ **관리자가 계정을 삭제할 때**:\n• 운영진이 있으면 → 가장 오래된 운영진이 자동으로 새 관리자가 됩니다.\n• 운영진이 없으면 → 계정 삭제가 차단됩니다. 먼저 운영진을 임명하거나 클럽을 삭제해야 합니다.\n\n2️⃣ **관리자가 직접 권한을 이전할 때**:\n• 클럽 설정에서 다른 멤버를 새 관리자로 지정할 수 있습니다.\n\n📢 권한 이전 시 모든 클럽 멤버에게 알림이 전송됩니다.',
          keywords: ['관리자', '권한', '이전', '삭제', '계정', '운영진', '자동'],
          category: 'club',
          priority: 1,
        },
        {
          question: '운영진이 여러 명일 때 누가 관리자가 되나요?',
          answer:
            '관리자가 계정을 삭제할 때 운영진이 여러 명이라면, **가장 먼저 클럽에 가입한 운영진**이 자동으로 새 관리자가 됩니다. 이는 선임 우선 원칙을 따르며, 가입일(joinedAt)을 기준으로 결정됩니다.\n\n예시:\n• 운영진 A (2024-01-15 가입) ✅ 새 관리자!\n• 운영진 B (2024-03-20 가입)\n• 운영진 C (2024-06-01 가입)',
          keywords: ['운영진', '여러명', '관리자', '선임', '가입일', '자동', '이전'],
          category: 'club',
          priority: 1,
        },
        {
          question: '클럽 관리자가 계정을 삭제하면 어떻게 되나요?',
          answer:
            '클럽 관리자가 계정을 삭제하려고 할 때:\n\n✅ **운영진이 있는 경우**:\n• 가장 오래된 운영진에게 자동으로 관리자 권한이 이전됩니다.\n• 새 관리자와 모든 클럽 멤버에게 알림이 전송됩니다.\n• 계정 삭제가 정상적으로 진행됩니다.\n\n❌ **운영진이 없는 경우**:\n• 계정 삭제가 차단됩니다.\n• "다음 클럽의 관리자로 등록되어 있어 계정을 삭제할 수 없습니다" 메시지가 표시됩니다.\n• 먼저 운영진을 임명하거나 클럽을 삭제해야 합니다.',
          keywords: ['관리자', '계정', '삭제', '운영진', '이전', '차단', '클럽'],
          category: 'club',
          priority: 1,
        },
        {
          question: '운영진은 어떻게 임명하나요?',
          answer:
            '클럽 관리자는 다음 방법으로 운영진을 임명할 수 있습니다:\n\n1. 클럽 상세 페이지 → 멤버 탭으로 이동\n2. 운영진으로 임명할 회원을 선택\n3. "운영진 임명" 버튼 클릭\n\n운영진으로 임명되면 해당 멤버에게 알림이 전송되며, 가입 승인 등의 관리 권한이 부여됩니다. 관리자가 계정을 삭제할 때를 대비해 최소 1명 이상의 운영진을 두는 것을 권장합니다!',
          keywords: ['운영진', '임명', '관리자', '권한', '멤버', '설정'],
          category: 'club',
          priority: 1,
        },
        // 📊 탐색/클럽 데이터 수집 Q&A (2025-12-25 추가)
        {
          question: '탐색 화면에서 클럽 정보는 어떻게 수집되나요?',
          answer:
            '탐색/클럽 화면의 데이터는 다음과 같이 수집됩니다:\n\n📋 **기본 클럽 정보**:\n• Firestore의 pickleball_clubs 컬렉션에서 실시간으로 구독됩니다.\n• 클럽명, 설명, 위치, 로고 등이 포함됩니다.\n\n👥 **회원 수**:\n• clubMembers 컬렉션에서 status가 active인 멤버를 실시간으로 카운트합니다.\n• 정확한 현재 회원 수를 보장합니다.\n\n🏆 **이벤트 빈번도**:\n• club_events 컬렉션에서 최근 30일 이벤트 수를 계산합니다.\n• "이벤트: X회/월" 형식으로 표시됩니다.\n\n💬 **클럽 소통 활성도**:\n• clubAnnouncements 컬렉션에서 최근 7일 공지사항 수를 기준으로 합니다.\n• 5개 이상: 활발, 2-4개: 보통, 0-1개: 조용\n\n📈 **회원 변동**:\n• clubMembers에서 최근 30일 가입/탈퇴 수를 계산합니다.\n• "+X/-Y" 형식으로 표시됩니다.\n\n💰 **월회비**:\n• pickleball_clubs.settings.monthlyFee 필드에서 가져옵니다.',
          keywords: [
            '탐색',
            '클럽',
            '데이터',
            '수집',
            '회원수',
            '이벤트',
            '소통',
            '회비',
            'Discovery',
          ],
          category: 'club',
          priority: 1,
        },
        {
          question: '클럽 카드에 표시되는 활동 지표는 무엇인가요?',
          answer:
            '클럽 카드에는 4가지 활동 지표가 표시됩니다:\n\n🏆 **이벤트: X회/월**\n• 최근 30일 동안 개최된 클럽 이벤트(토너먼트, 리그, 모임 등)의 수입니다.\n\n💬 **클럽소통: 활발/보통/조용**\n• 최근 7일 동안의 클럽 공지사항 활동을 기준으로 합니다.\n• 5개 이상: 활발 (Active)\n• 2-4개: 보통 (Normal)\n• 0-1개: 조용 (Quiet)\n\n📈 **회원 변동: +X/-Y**\n• 최근 30일 동안 새로 가입한 회원 수(+)와 탈퇴한 회원 수(-)입니다.\n• 클럽의 성장세를 파악할 수 있습니다.\n\n💰 **회비: $X/월 또는 무료**\n• 월별 클럽 회비 금액입니다.\n• 0원이면 "무료"로 표시됩니다.',
          keywords: ['클럽', '카드', '활동', '지표', '이벤트', '소통', '회원', '변동', '회비'],
          category: 'club',
          priority: 1,
        },
        {
          question: '클럽 데이터는 얼마나 자주 업데이트되나요?',
          answer:
            '클럽 데이터는 실시간으로 업데이트됩니다! 🚀\n\n⚡ **실시간 업데이트 항목**:\n• 클럽 기본 정보 (이름, 설명, 로고 등)\n• 회원 수 (clubMembers 컬렉션 기반)\n• 가입 상태 (관리자/운영진/멤버/대기중)\n\n📊 **탐색 화면 진입 시 새로고침**:\n• 이벤트 빈번도 (최근 30일)\n• 클럽 소통 활성도 (최근 7일)\n• 회원 변동 (최근 30일)\n• 월회비 정보\n\n탐색 화면에 들어올 때마다 최신 데이터를 가져오므로 항상 정확한 정보를 확인할 수 있습니다!',
          keywords: ['클럽', '데이터', '업데이트', '실시간', '새로고침', '주기'],
          category: 'club',
          priority: 1,
        },
        {
          question: '비공개 클럽은 탐색 화면에서 어떻게 보이나요?',
          answer:
            '비공개(Private) 클럽의 표시 규칙은 다음과 같습니다:\n\n🔒 **비회원인 경우**:\n• 비공개 클럽은 탐색/클럽 목록에서 보이지 않습니다.\n• 초대 링크나 직접 검색을 통해서만 클럽을 찾을 수 있습니다.\n\n✅ **회원인 경우**:\n• 관리자, 운영진, 멤버 모두 해당 비공개 클럽을 목록에서 볼 수 있습니다.\n• 상태 배지(관리자/운영진/멤버)가 표시됩니다.\n\n📋 **공개 클럽**:\n• 모든 사용자가 목록에서 볼 수 있습니다.\n• "가입가능" 배지가 표시됩니다.',
          keywords: ['비공개', 'Private', '클럽', '표시', '탐색', '회원', '공개'],
          category: 'club',
          priority: 1,
        },
        // 🎛️ 관리자 대시보드 빠른 작업 Q&A (2025-12-25 추가)
        {
          question: '관리자 대시보드의 빠른 작업에는 무엇이 있나요?',
          answer:
            '클럽 관리자 대시보드에는 4가지 빠른 작업 버튼이 있습니다:\n\n👥 **회원 초대**:\n• 새 회원을 클럽에 초대할 수 있습니다.\n• 이메일이나 링크로 초대장을 보낼 수 있습니다.\n\n⚙️ **클럽 설정**:\n• 클럽 정보 및 정책을 수정합니다.\n• 클럽 이름, 소개, 코트 주소, 정기 모임, 비용 정보 등을 변경할 수 있습니다.\n\n🔐 **클럽 공개 설정**:\n• 클럽의 공개 범위를 설정합니다.\n• 공개(누구나 검색/가입 가능) 또는 비공개(초대/승인 필요)를 선택할 수 있습니다.\n\n📸 **클럽 앨범** (준비중):\n• 클럽 사진 및 추억을 공유하는 기능입니다.\n• 현재 개발 중이며 곧 출시 예정입니다!',
          keywords: [
            '관리자',
            '대시보드',
            '빠른 작업',
            '회원 초대',
            '클럽 설정',
            '공개 설정',
            '앨범',
          ],
          category: 'club_admin',
          priority: 1,
        },
        {
          question: '클럽 설정에서 어떤 항목들을 변경할 수 있나요?',
          answer:
            '클럽 설정에서는 다음 항목들을 변경할 수 있습니다:\n\n📝 **필수 항목**:\n• **클럽 이름**: 클럽의 공식 이름 (최대 30자)\n• **코트 주소**: 클럽의 홈코트 위치\n• **정기 모임**: 정기적인 모임 일정 설정\n\n📋 **선택 항목**:\n• **소개**: 클럽에 대한 간단한 설명 (최대 200자)\n• **공개 설정**: 공개/비공개 여부\n• **비용 정보**: 월회비, 코트비 등 비용 관련 정보\n• **시설 정보**: 코트 수, 조명, 주차 등 시설 안내\n• **클럽 규칙**: 클럽 내 규칙 및 에티켓\n\n💡 로고는 이미지를 터치하여 변경할 수 있습니다!',
          keywords: [
            '클럽 설정',
            '항목',
            '변경',
            '클럽 이름',
            '코트 주소',
            '정기 모임',
            '소개',
            '비용',
            '규칙',
          ],
          category: 'club_admin',
          priority: 1,
        },
        {
          question: '클럽 정기 모임은 어떻게 설정하나요?',
          answer:
            '클럽 설정 → 정기 모임에서 설정할 수 있습니다:\n\n📅 **설정 항목**:\n• **요일**: 매주 모이는 요일 선택 (예: 토요일)\n• **시간**: 모임 시작 시간 (예: 오후 7:30)\n• **장소**: 기본 코트 위치\n• **코트 수**: 사용하는 코트 개수\n\n⏰ **정기 모임 일정**:\n• 설정된 정기 모임은 자동으로 일정에 표시됩니다.\n• 멤버들은 참석 여부를 미리 표시할 수 있습니다.\n• 참가자 수와 코트 수를 비교하여 혼잡도를 확인할 수 있습니다.',
          keywords: ['정기 모임', '설정', '요일', '시간', '장소', '코트', '일정'],
          category: 'club_admin',
          priority: 1,
        },
        {
          question: '클럽 역할에는 어떤 것들이 있나요?',
          answer:
            '클럽에는 세 가지 역할이 있습니다:\n\n👑 **관리자 (Admin)** - 1명:\n• 클럽의 최고 권한자\n• 클럽 설정 변경, 삭제, 모든 멤버 관리 권한\n• 운영진 임명/해제 가능\n• 관리자 권한을 다른 운영진에게 이전 가능\n\n🛡️ **운영진 (Manager)** - 여러 명 가능:\n• 관리자가 임명한 보조 관리자\n• 가입 신청 승인/거절 권한\n• 이벤트 생성 권한\n• 클럽 삭제를 제외한 모든 관리 기능 접근 가능\n\n👤 **일반 회원 (Member)**:\n• 클럽의 일반 참여자\n• 이벤트 참여, 게시판 글쓰기 등 기본 활동',
          keywords: ['역할', '관리자', '운영진', '회원', 'Admin', 'Manager', 'Member', '권한'],
          category: 'club_admin',
          priority: 1,
        },
        {
          question: '운영진은 어떻게 임명하나요?',
          answer:
            '운영진 임명은 다음 방법으로 할 수 있습니다:\n\n📱 **방법 1: 멤버 탭에서 임명**\n1. 클럽 상세 페이지 → 멤버 탭 선택\n2. 전체 회원 목록에서 임명할 회원 찾기\n3. 회원 오른쪽의 ⋮ 메뉴 터치\n4. "운영진으로 승진" 선택\n\n📱 **방법 2: 역할 관리에서 임명**\n1. 클럽 상세 페이지 → 멤버 탭 → 역할 관리\n2. 역할 변경 섹션에서 회원 선택\n3. "운영진" 버튼 터치\n\n💡 **팁**: 관리자 계정 삭제 시 운영진 중 한 명이 자동으로 관리자가 됩니다. 최소 1명 이상의 운영진을 두는 것을 권장합니다!',
          keywords: ['운영진', '임명', '승진', '방법', '멤버', '역할 관리'],
          category: 'club_admin',
          priority: 1,
        },
        {
          question: '관리자 권한은 어떻게 이전하나요?',
          answer:
            '관리자 권한 이전은 다음과 같이 할 수 있습니다:\n\n📱 **수동 이전 방법**:\n1. 클럽 상세 페이지 → 멤버 탭 → 역할 관리\n2. "관리자 이전" 섹션 확인\n3. "관리자 이전하기" 버튼 터치\n4. 새 관리자로 지정할 운영진 선택\n5. 확인 후 권한 이전 완료\n\n⚠️ **주의사항**:\n• 관리자 이전은 운영진에게만 가능합니다.\n• 이전 후에는 본인은 일반 회원이 됩니다.\n• 모든 클럽 멤버에게 알림이 전송됩니다.\n\n🔄 **자동 이전**:\n• 관리자가 계정을 삭제하면 가장 오래된 운영진이 자동으로 새 관리자가 됩니다.',
          keywords: ['관리자', '권한', '이전', '양도', '운영진', '방법'],
          category: 'club_admin',
          priority: 1,
        },
        {
          question: '회원을 클럽에서 제명하려면 어떻게 하나요?',
          answer:
            '회원 제명은 관리자 또는 운영진이 할 수 있습니다:\n\n📱 **제명 방법**:\n1. 클럽 상세 페이지 → 멤버 탭\n2. 전체 회원 목록에서 제명할 회원 찾기\n3. 회원 오른쪽의 ⋮ 메뉴 터치\n4. "클럽에서 제명" 선택\n5. 확인 팝업에서 "제명" 버튼 터치\n\n⚠️ **주의사항**:\n• 제명된 회원은 클럽 활동이 즉시 중단됩니다.\n• 제명된 회원에게 알림이 전송됩니다.\n• 관리자/운영진은 제명할 수 없습니다.\n• 제명 취소는 불가능하며, 재가입 신청이 필요합니다.',
          keywords: ['제명', '추방', '삭제', '회원', '멤버', '방법'],
          category: 'club_admin',
          priority: 1,
        },
        {
          question: '운영진을 일반 회원으로 강등하려면 어떻게 하나요?',
          answer:
            '운영진 강등은 관리자만 할 수 있습니다:\n\n📱 **강등 방법**:\n1. 클럽 상세 페이지 → 멤버 탭\n2. 전체 회원 목록에서 강등할 운영진 찾기\n3. 운영진 오른쪽의 ⋮ 메뉴 터치\n4. "일반 회원으로 강등" 선택\n5. 확인 팝업에서 "강등" 버튼 터치\n\n📱 **역할 관리에서 강등**:\n1. 멤버 탭 → 역할 관리\n2. 역할 변경 섹션에서 운영진 선택\n3. "회원" 버튼 터치\n\n💡 강등된 운영진은 일반 회원 권한만 가지게 됩니다.',
          keywords: ['강등', '운영진', '회원', '역할 변경', '방법'],
          category: 'club_admin',
          priority: 1,
        },
        {
          question: '클럽 현황 대시보드에는 어떤 정보가 표시되나요?',
          answer:
            '관리자 대시보드의 클럽 현황에는 다음 정보가 표시됩니다:\n\n📊 **회원 통계**:\n• **총 회원**: 클럽 전체 회원 수\n• **활성 회원**: 최근 활동한 회원 수\n• **이번달 신규**: 이번 달 새로 가입한 회원 수\n\n📈 **활동 지표**:\n• **참여율**: 정기 모임 평균 참석률\n• **월 수익**: 회비 등 월간 수익 (설정된 경우)\n\n🏆 **추가 정보**:\n• **이벤트**: 월별 이벤트 개최 횟수\n• **클럽소통**: 공지사항/게시판 활성도 (활발/보통/조용)\n• **회원 변동**: 최근 30일 가입/탈퇴 현황 (+/-)\n• **회비**: 설정된 월회비 금액',
          keywords: ['대시보드', '현황', '통계', '회원', '참여율', '수익', '활동'],
          category: 'club_admin',
          priority: 1,
        },
        // 📊 ELO 시스템 Q&A (2025-12-25 추가)
        {
          question: '공용 ELO와 클럽 ELO의 차이점은 무엇인가요?',
          answer:
            'Lightning Pickleball에는 두 가지 ELO 시스템이 있습니다:\n\n🌐 **공용 ELO (Public ELO)**:\n• 번개 매치(퀵 매치)에서 사용됩니다.\n• 단식, 복식, 혼합복식이 **각각 별도로** 관리됩니다.\n• 예: 단식 ELO 1500, 복식 ELO 1400, 혼복 ELO 1350\n\n🏛️ **클럽 ELO (Club ELO)**:\n• 클럽 리그/토너먼트에서 사용됩니다.\n• 단식, 복식, 혼합복식이 **하나의 ELO로 통합**됩니다.\n• 리그와 토너먼트 결과도 같은 클럽 ELO에 반영됩니다.\n• 단, K-Factor(점수 변동폭)만 다릅니다.\n\n📋 **요약 표**:\n| 구분 | 공용 ELO | 클럽 ELO |\n|------|---------|----------|\n| 단식/복식/혼복 | ✅ 분리 | ❌ 통합 |\n| 리그/토너먼트 | N/A | ❌ 통합 |',
          keywords: ['ELO', '공용', '클럽', '차이', '단식', '복식', '혼복', '분리', '통합'],
          category: 'ranking',
          priority: 1,
        },
        {
          question: '클럽 ELO에서 리그와 토너먼트의 점수 영향력은 같나요?',
          answer:
            '아니요! 클럽 ELO에서 리그와 토너먼트는 같은 ELO에 반영되지만, **K-Factor(점수 변동폭)**가 다릅니다.\n\n📊 **K-Factor 정책 (High Risk, High Return!)**:\n\n⚔️ **토너먼트 경기**: K = 24~32\n• 점수 변동폭이 큽니다\n• 이기면 더 많이 오르고, 지면 더 많이 내려갑니다\n• 짧은 시간, 높은 집중도의 경기 특성 반영\n\n🏆 **리그 경기**: K = 16\n• 점수 변동폭이 상대적으로 작습니다\n• 장기간 안정적으로 진행되는 리그 특성 반영\n\n💡 **왜 이렇게 설계했나요?**\n토너먼트는 단판 승부의 긴장감이 있으므로 "High Risk, High Return" 정책을 적용했습니다. 한 경기의 결과가 더 큰 영향을 미치므로, 토너먼트에서 강한 상대를 이기면 더 큰 보상을 받습니다!',
          keywords: ['ELO', 'K-Factor', '리그', '토너먼트', '점수', '변동', '영향력'],
          category: 'ranking',
          priority: 1,
        },
        {
          question: '왜 클럽 ELO는 단식/복식/혼복을 통합했나요?',
          answer:
            '클럽 ELO가 단식, 복식, 혼합복식을 하나의 점수로 통합한 이유는 다음과 같습니다:\n\n1️⃣ **클럽 내 종합 실력 평가**:\n• 클럽에서는 다양한 형식의 경기를 진행합니다.\n• 하나의 ELO로 클럽 내 종합적인 실력 순위를 파악할 수 있습니다.\n\n2️⃣ **시스템 단순화**:\n• 클럽마다 3개의 별도 ELO를 관리하면 복잡해집니다.\n• 통합 ELO로 명확한 클럽 내 랭킹을 제공합니다.\n\n3️⃣ **경기 유형별 차별화는 K-Factor로**:\n• 대신 토너먼트(K=24-32)와 리그(K=16)의 K-Factor를 다르게 적용합니다.\n• 경기의 중요도와 긴장감에 따라 점수 영향력이 달라집니다.\n\n💡 **공용 ELO는 분리됨**: 번개 매치에서는 단식, 복식, 혼합복식이 각각 별도의 ELO로 관리됩니다!',
          keywords: ['ELO', '클럽', '통합', '단식', '복식', '혼복', '이유', '설계'],
          category: 'ranking',
          priority: 1,
        },
        {
          question: '공용 리그나 토너먼트가 있나요?',
          answer:
            '현재는 **클럽 내 리그/토너먼트**만 지원됩니다. 클럽에 가입한 후 클럽 관리자가 개최하는 리그나 토너먼트에 참가할 수 있습니다.\n\n🔮 **향후 계획**:\n공용(Public) 리그/토너먼트 기능이 준비 중입니다! 클럽 가입 없이도 Lightning Pickleball 사용자들이 참여할 수 있는 공용 대회가 추가될 예정입니다.\n\n현재 공용 기능:\n• ⚡ 번개 매치 (퀵 매치): 공용 ELO 사용\n• 🎾 번개 모임: 랭킹에 영향 없음\n\n현재 클럽 기능:\n• 🏆 클럽 리그: 클럽 ELO 사용 (K=16)\n• ⚔️ 클럽 토너먼트: 클럽 ELO 사용 (K=24-32)\n\n새로운 기능 소식은 앱 공지사항을 확인해 주세요! 📢',
          keywords: ['공용', '리그', '토너먼트', '대회', '계획', '예정', '클럽', '퍼블릭'],
          category: 'competition',
          priority: 1,
        },
        // 📋 커뮤니티 가이드라인 Q&A (2025-12-25 교체)
        {
          question: '커뮤니티 가이드라인을 알려주세요',
          answer:
            "📋 **번개 피클볼 커뮤니티 가이드라인 (Community Guidelines)**\n\n**목적**: '번개 피클볼'가 즐겁고, 공정하며, 안전한 커뮤니티가 되기 위해 모든 멤버가 지켜야 할 약속을 규정합니다.\n\n---\n\n⭐ **제1장: 핵심 가치**\n• 자율성, 접근성, 공정성, 투명성, 존중\n\n🎾 **제2장: 공식 경기 규칙**\n• USTA The Code 준수, 스코어 기록, 몰수/기권, 비용 분담\n\n📊 **제3장: 랭킹 및 시즌 정책**\n• 전체/클럽 ELO, 분기별 시즌, 공식 랭킹 자격, ELO 재경기 제한\n\n🤝 **제4장: 사용자 행동 강령**\n• 정확성의 의무, 불법 콘텐츠 금지\n\n🌈 **제5장: 다양성 및 포용성 정책**\n• 포용성 원칙, 차별 금지",
          keywords: ['커뮤니티', '가이드라인', '규칙', '정책', '핵심 가치', '행동 강령'],
          category: 'guidelines',
          priority: 1,
        },
        {
          question: '번개 피클볼의 핵심 가치는 무엇인가요?',
          answer:
            '⭐ **핵심 가치 (제1장)**\n\n**자율성**: 모든 경기는 사용자에 의해 자율적으로 생성되고 운영됩니다.\n\n**접근성**: 실력 향상의 기회는 모두에게 평등하며, 참가비 없이 제공됩니다.\n\n**공정성**: 모든 공식 경기 결과는 객관적인 ELO 레이팅 시스템을 통해 실력으로 증명됩니다.\n\n**투명성**: 모든 공식 경기 기록, 랭킹, 트로피는 투명하게 공개되어 커뮤니티의 역사가 됩니다.\n\n**존중**: 온라인과 오프라인 모두에서, 우리는 서로를 존중하는 스포츠맨십을 최우선으로 합니다.',
          keywords: ['핵심 가치', '자율성', '접근성', '공정성', '투명성', '존중', '스포츠맨십'],
          category: 'guidelines',
          priority: 1,
        },
        {
          question: '공식 경기 규칙은 무엇인가요?',
          answer:
            '🎾 **공식 경기 규칙 (제2장)**\n\n📌 **기본 규칙**: 모든 경기는 USTA의 "The Code"를 따릅니다.\n\n📝 **스코어 기록**:\n• 경기 종료 후 **24시간 이내**에 호스트가 기록\n• 다른 참여자는 **72시간 내**에 이의 제기 가능\n\n⚠️ **몰수 및 기권**:\n• 경기 약속 시간 **15분 이상 지각** 시 몰수패 처리 가능\n\n💰 **비용**:\n• 코트 예약 및 공 준비는 **참여자 상호 협의**가 원칙',
          keywords: ['공식', '경기', '규칙', 'The Code', '스코어', '기록', '몰수', '비용'],
          category: 'guidelines',
          priority: 1,
        },
        {
          question: '랭킹 및 시즌 정책을 알려주세요',
          answer:
            "📊 **랭킹 및 시즌 정책 (제3장)**\n\n🏆 **랭킹 시스템**:\n'전체 ELO 랭킹'(공용 경기)과 '클럽 ELO 랭킹'(클럽 경기)은 **완전히 독립적**으로 운영됩니다.\n\n🗓️ **시즌**: 1년에 4회, **분기별**로 진행됩니다.\n• Q1: 1월~3월 | Q2: 4월~6월 | Q3: 7월~9월 | Q4: 10월~12월\n\n✅ **공식 랭킹 자격**:\n한 시즌 동안 **최소 5번**의 '공용 번개 매치'를 완료해야 공식 랭킹에 포함됩니다.\n\n⚠️ **ELO 재경기 제한**:\n동일 상대와의 공식 '공용 번개 매치'는 **3개월에 한 번만** ELO 점수에 반영됩니다.",
          keywords: ['랭킹', '시즌', 'ELO', '공식', '자격', '5번', '3개월', '분기'],
          category: 'guidelines',
          priority: 1,
        },
        {
          question: '사용자 행동 강령이 뭔가요?',
          answer:
            '🤝 **사용자 행동 강령 (제4장)**\n\n✍️ **정확성의 의무**:\n모든 사용자는 자신의 프로필(특히 경기 시작 전의 자체 평가 레벨)과 경기 결과를 **최대한 정확하게 기록**할 의무가 있습니다.\n\n⚠️ 의도적인 실력 속이기(**샌드배깅**)나 스코어 조작은 커뮤니티의 신뢰를 해치는 **심각한 행위**로 간주됩니다.\n\n📊 **LPR(Lightning Pickleball Rating)**은 이 기록된 결과들을 바탕으로 시스템에 의해 **공정하게 자동 계산**됩니다.\n\n🚫 **불법 콘텐츠 금지**:\n불법적이거나 부적절한 콘텐츠(모욕, 차별 등)를 게시하거나 AI 챗봇을 통해 생성하는 것을 금지합니다.',
          keywords: ['행동 강령', '정확성', '샌드배깅', 'LPR', '불법 콘텐츠', '조작'],
          category: 'guidelines',
          priority: 1,
        },
        {
          question: '다양성 및 포용성 정책이 뭔가요?',
          answer:
            '🌈 **다양성 및 포용성 정책 (제5장)**\n\n🤝 **포용성 원칙**:\n성별, 성적 지향, 성 정체성에 관계없이 모든 사용자는 모든 활동에 **동등하게 참여할 권리**를 가집니다.\n\n🚫 **차별 금지**:\n차별적 언행은 금지되며, 발견 시 **서비스 이용이 제한**될 수 있습니다.\n\n💡 번개 피클볼는 모든 피클볼 플레이어가 환영받는 **포용적인 커뮤니티**를 지향합니다!',
          keywords: ['다양성', '포용성', '차별', '금지', '성별', '평등', '정책'],
          category: 'guidelines',
          priority: 1,
        },
        {
          question: '같은 상대와 여러 번 경기하면 ELO가 계속 반영되나요?',
          answer:
            "⚠️ **ELO 재경기 제한 규정 (제3장)**\n\n아니요! 동일 상대와의 공식 '공용 번개 매치'는 **3개월에 한 번만** ELO 점수에 반영됩니다.\n\n📋 **예시**:\n• 1월 15일 A vs B 경기 → ELO 반영 ✅\n• 2월 20일 A vs B 경기 → ELO 반영 ❌ (3개월 미경과)\n• 4월 20일 A vs B 경기 → ELO 반영 ✅ (3개월 경과)\n\n🎾 **복식 경기**:\n완전히 동일한 팀 조합([A,B] vs [C,D])만 3개월 제한이 적용됩니다. 팀 구성원 중 한 명이라도 다르면 기록경기로 인정됩니다!\n\n💡 **이유**:\n특정 상대와 반복 경기를 통해 랭킹을 조작하는 것을 방지하기 위한 정책입니다.\n\n📌 **참고**: 클럽 내 리그/토너먼트 경기는 이 제한이 별도로 적용됩니다.",
          keywords: [
            '같은 상대',
            '여러 번',
            '3개월',
            '재경기',
            'ELO',
            '반영',
            '제한',
            '복식',
            '팀 조합',
          ],
          category: 'guidelines',
          priority: 1,
        },
        {
          question: '경기에 늦으면 어떻게 되나요?',
          answer:
            '⚠️ **몰수 및 기권 규칙 (제2장)**\n\n⏰ **15분 룰**:\n경기 약속 시간 **15분 이상 지각** 시 **몰수패**로 처리될 수 있습니다.\n\n📞 **연락이 안 될 때**:\n상대에게 연락이 안 되면 경기 주최자나 앱 연락처로 문의하세요.\n\n🤝 **예외 상황**:\n상대에게 연락이 되고, **양 당사자가 동의**하면 늦어도 경기 진행 가능합니다.\n\n❌ **무단 불참/취소**:\n연락 없이 불참하면 매너 문제로 기록될 수 있습니다.',
          keywords: ['늦으면', '지각', '몰수', '기권', '15분', '불참', '취소'],
          category: 'guidelines',
          priority: 1,
        },
        {
          question: '스코어는 누가 언제 기록하나요?',
          answer:
            '📝 **스코어 기록 규칙 (제2장)**\n\n**기록 담당**: 경기 호스트(주최자)\n**기록 기한**: 경기 종료 후 **24시간 이내**\n\n📌 **중요 사항**:\n• 다른 참여자는 **72시간 내**에 이의 제기 가능\n• 호스트가 기록하지 않으면 **경기 상대**가 대신 기록 가능\n\n⚠️ **이의제기**: 결과에 이의가 있으면 기록 후 **72시간 이내**에 상대에게 연락하여 조정해야 합니다.',
          keywords: ['스코어', '기록', '누가', '언제', '호스트', '24시간', '72시간'],
          category: 'guidelines',
          priority: 1,
        },
        // 🏆 명예 시스템 Q&A (2025-12-28 추가)
        {
          question: '랭킹 신뢰도는 무엇인가요?',
          answer:
            '📊 **랭킹 신뢰도 (Ranking Confidence)**\n\n랭킹 신뢰도는 시즌 경기 수에 따라 표시되는 지표입니다.\n\n🏅 **공식 랭커가 되려면?**\n• 시즌 내 **최소 5경기** 이상 참여해야 합니다.\n• 5경기 미만은 "비공식 랭커"로 시즌 보상 대상에서 제외됩니다.\n\n📈 **신뢰도 레벨 (0-5)**:\n• 🟩⬜⬜⬜⬜ = 1경기 완료\n• 🟩🟩⬜⬜⬜ = 2경기 완료\n• 🟩🟩🟩🟩🟩 = 5경기 이상 → **공식 랭커!**\n\n💡 **왜 필요한가요?**\n많은 경기를 치른 플레이어의 ELO가 더 정확하다는 것을 시각적으로 보여줍니다.',
          keywords: ['신뢰도', '랭킹', '공식', '5경기', '레벨', 'confidence'],
          category: 'ranking',
          priority: 1,
        },
        {
          question: '공식 랭커란 무엇인가요?',
          answer:
            '🏆 **공식 랭커 (Official Ranker)**\n\n시즌 내 **5경기 이상** 공식 번개 매치에 참여한 플레이어를 공식 랭커라고 합니다.\n\n✅ **공식 랭커 혜택**:\n• 시즌 최종 순위에 공식 기록\n• 시즌 트로피 수여 대상 (챔피언, 아이언맨, 에이스 등)\n• 명예의 전당(Hall of Fame)에 시즌 기록 저장\n\n❌ **5경기 미만 플레이어**:\n• 랭킹은 표시되지만 "비공식"\n• 시즌 보상 및 트로피 대상에서 제외\n\n📅 **시즌 기간**: 분기별 (Q1: 1~3월, Q2: 4~6월, Q3: 7~9월, Q4: 10~12월)',
          keywords: ['공식', '랭커', '5경기', '시즌', '트로피', '보상'],
          category: 'ranking',
          priority: 1,
        },
        {
          question: '시즌 트로피는 어떤 것들이 있나요?',
          answer:
            '🏆 **시즌 트로피 종류**\n\n시즌 종료 시 공식 랭커들에게 자동으로 수여됩니다.\n\n🥇 **시즌 챔피언 (Season Champion)**:\n• 시작 LPR 등급 그룹 내 ELO 1~3위\n• 금/은/동 트로피 수여\n• 예: LPR 3.0 그룹 챔피언, LPR 3.5 그룹 챔피언\n\n🚀 **랭크업 (Rank Up)**:\n• 시즌 중 LPR 등급이 상승한 모든 플레이어\n\n🔥 **아이언맨 (Iron Man)**:\n• 시즌 최다 경기 상위 10%\n• 성실한 참여에 대한 보상!\n\n♠️ **에이스 (Ace)**:\n• 10경기 이상 + 최고 승률 상위 5%\n• 효율성의 달인!',
          keywords: ['시즌', '트로피', '챔피언', '랭크업', '아이언맨', '에이스'],
          category: 'achievements',
          priority: 1,
        },
        {
          question: '시즌 챔피언은 어떻게 결정되나요?',
          answer:
            '👑 **시즌 챔피언 선정 방식**\n\n시즌 챔피언은 **시작 LPR 등급 그룹** 내에서 결정됩니다.\n\n📊 **그룹 분류 기준**:\n• 시즌 첫날의 LPR 등급 스냅샷이 기준\n• 예: LPR 3.0, 3.5, 4.0, 4.5 각각 별도 그룹\n\n🏅 **순위 결정**:\n• 각 그룹 내 공식 랭커 중 ELO 1~3위\n• 🥇 1위: 금 트로피\n• 🥈 2위: 은 트로피  \n• 🥉 3위: 동 트로피\n\n💡 **왜 시작 등급 기준인가요?**\n시즌 중 등급이 올라도 시작 등급 그룹에서 경쟁합니다. 이렇게 하면 실력이 비슷한 플레이어들끼리 공정하게 경쟁할 수 있습니다!',
          keywords: ['챔피언', '시즌', '결정', '등급', '그룹', 'LPR'],
          category: 'achievements',
          priority: 1,
        },
        {
          question: '업적 가이드는 어디서 볼 수 있나요?',
          answer:
            '📖 **업적 가이드 (Achievements Guide)**\n\n프로필의 명예의 전당(Hall of Fame) 섹션에서 "❓" 아이콘을 터치하면 업적 가이드 화면으로 이동합니다.\n\n📋 **확인 가능한 정보**:\n• 모든 시즌 트로피 목록 + 획득 조건\n• 모든 배지 목록 + 획득 조건\n• 카테고리별 필터링 (시즌/토너먼트/경기/커뮤니티)\n\n🎯 **경로**:\n프로필 → Hall of Fame → ❓ 아이콘 → 업적 가이드\n\n어떤 트로피와 배지를 획득할 수 있는지 미리 확인하고, 도전해보세요! 💪',
          keywords: ['업적', '가이드', '트로피', '배지', '확인', 'Hall of Fame'],
          category: 'achievements',
          priority: 1,
        },
        {
          question: '명예의 전당에는 무엇이 기록되나요?',
          answer:
            '🏛️ **명예의 전당 (Hall of Fame)**\n\n명예의 전당에는 다음이 기록됩니다:\n\n🏆 **시즌 기록**:\n• 시즌 최종 순위 (공식 랭커만)\n• 시즌 트로피 (챔피언, 랭크업, 아이언맨, 에이스)\n• 시즌 통계 (경기 수, 승률, 최종 ELO)\n\n🥇 **토너먼트/리그 트로피**:\n• 클럽 리그 우승/준우승\n• 클럽 토너먼트 우승/준우승\n\n🎖️ **배지 (Badges)**:\n• 연승 배지 (3연승, 5연승, 10연승)\n• 마일스톤 배지 (10/50/100 경기)\n• 소셜 배지 등\n\n⭐ **명예 태그 (Honor Tags)**:\n• 상대방에게 받은 투표 (매너장인, 칼같은라인콜 등)',
          keywords: ['명예의 전당', 'Hall of Fame', '기록', '시즌', '트로피', '배지'],
          category: 'achievements',
          priority: 1,
        },
      ];
    } else {
      return [
        {
          question: "What's the difference between Lightning Match and Lightning Meetup?",
          answer:
            "Lightning Match is a 1:1 ranked game where ELO scores change and results affect your ranking. Lightning Meetup is a friendly game with multiple participants that doesn't affect rankings and focuses on enjoyable pickleball social interaction.",
          keywords: ['match', 'meetup', 'difference', 'ranking', 'lightning'],
          category: 'basic',
          priority: 1,
        },
        {
          question: 'How is ELO ranking calculated?',
          answer:
            'ELO ranking is a skill assessment system derived from chess. Scores change based on wins and losses, with the variation depending on the skill difference between opponents. You gain more points for beating stronger opponents and lose more points when losing to weaker opponents.',
          keywords: ['ELO', 'ranking', 'score', 'calculation', 'skill'],
          category: 'ranking',
          priority: 1,
        },
        {
          question: 'How do I create a club?',
          answer:
            "Go to the 'My Clubs' tab and tap 'Create New Club'. You can set the club name, description, location, public/private settings, and joining method. Once created, you become the admin and can manage members, create events, and set up regular meetings.",
          keywords: ['club', 'create', 'make', 'admin'],
          category: 'club',
          priority: 1,
        },
        {
          question: 'What is LPR level?',
          answer:
            'LPR (Lightning Pickleball Rating) is our unique ELO-based skill rating system. It ranges from 1 (Bronze, beginner) to 10 (Legend, elite). Based on ELO scores (600-2400+), it updates automatically after each match. LPR 1-2: Bronze/Silver (beginner), LPR 3-4: Gold (intermediate entry), LPR 5-6: Platinum (intermediate), LPR 7: Diamond (advanced intermediate), LPR 8-9: Master (advanced), LPR 10: Legend (elite). This system ensures fair matching with similarly skilled players.',
          keywords: [
            'LPR',
            'level',
            'skill',
            'rating',
            'matching',
            'ELO',
            'ranking',
            'NTRP',
            'grade',
          ],
          category: 'basic',
          priority: 1,
        },
        {
          question: "What's the difference between league and tournament?",
          answer:
            'A league is a long-term competition (usually weeks to months) where participants play multiple games in a regular season format. A tournament is a short-term elimination-style competition where losing means elimination. Both can be organized by clubs.',
          keywords: ['league', 'tournament', 'competition', 'difference', 'club'],
          category: 'competition',
          priority: 1,
        },
        {
          question: 'How do I add friends?',
          answer:
            "You can add friends in several ways: 1) Search in the 'Discover' tab under 'Players', 2) Add from profiles of people you meet in matches or meetups, 3) Add from club member lists. Friends can see each other's activities in the feed and can invite each other to matches more easily.",
          keywords: ['friends', 'add', 'search', 'profile'],
          category: 'social',
          priority: 1,
        },
        {
          question: 'How do I record match results?',
          answer:
            "After a Lightning Match ends, the match host taps 'Record Result' to enter the winner and score. Enter scores in format like 6-4, 6-2. Once recorded, both players' ELO rankings are automatically updated. After recording results, sportsmanship evaluation follows.",
          keywords: ['match', 'result', 'record', 'score', 'ranking'],
          category: 'match',
          priority: 1,
        },
        {
          question: 'What is sportsmanship evaluation?',
          answer:
            "After matches or meetups, you rate your opponent's sportsmanship, punctuality, and game attitude on a 1-5 star scale. Evaluation results accumulate in user profiles as average scores, which other users can reference when choosing match opponents.",
          keywords: ['sportsmanship', 'evaluation', 'rating', 'stars', 'attitude'],
          category: 'rating',
          priority: 1,
        },
        {
          question: 'How do I join a club?',
          answer:
            "Find your desired club in the 'Discover' tab under 'Clubs' and tap 'Join Request'. Public clubs allow immediate joining, but private clubs require admin approval. You can check your application status on the club card and will receive notifications when approved.",
          keywords: ['club', 'join', 'request', 'approval'],
          category: 'club',
          priority: 1,
        },
        {
          question: 'What can I see in the Feed?',
          answer:
            'The Feed shows chronological latest activities from your friends and joined clubs. You can see match results, league/tournament wins, club events, new member joins, and more. Use filter features to view only specific types of activities.',
          keywords: ['feed', 'activities', 'friends', 'clubs', 'filter'],
          category: 'feed',
          priority: 1,
        },
        // 🏅 Badge & Trophy Q&A (Added 2025-12-22)
        {
          question: 'How do I earn badges?',
          answer:
            'Badges are automatically awarded when you achieve various milestones. There are winning streak badges (3, 5, 10 wins in a row), match milestone badges (10, 50, 100 matches played), social player badge (play with 5+ different opponents), and league champion badge (first league win). View your badges in the Hall of Fame section of your profile.',
          keywords: ['badge', 'achievement', 'streak', 'milestone', 'earn'],
          category: 'achievements',
          priority: 1,
        },
        {
          question: 'How do I earn trophies?',
          answer:
            'Trophies are automatically awarded when you win (1st place) or finish as runner-up (2nd place) in club leagues or tournaments. Winner trophies are displayed in gold, runner-up trophies in silver. View your trophies in the Hall of Fame section of your profile.',
          keywords: ['trophy', 'win', 'runner-up', 'league', 'tournament'],
          category: 'achievements',
          priority: 1,
        },
        {
          question: 'What are winning streak badges?',
          answer:
            'Winning streak badges are awarded when you win consecutive matches. You get "Hot Streak" (Bronze) for 3 wins in a row, "On Fire" (Silver) for 5 wins in a row, and "Unstoppable" (Gold) for 10 wins in a row. Your streak counter resets when you lose a match.',
          keywords: ['streak', 'badge', 'win', 'consecutive', 'row'],
          category: 'achievements',
          priority: 1,
        },
        {
          question: 'What is Hall of Fame?',
          answer:
            "Hall of Fame is the achievements section visible on profiles. It displays earned trophies (winner/runner-up), badges (streak, milestone, social, etc.), and honor badges (votes received from opponents). You can also view other players' Hall of Fame on their profiles.",
          keywords: ['Hall of Fame', 'profile', 'trophy', 'badge', 'achievement'],
          category: 'achievements',
          priority: 1,
        },
        {
          question: 'What are Honor Tags?',
          answer:
            'Honor Tags are special tags awarded by voting from your match opponents. These include #SharpEyed (great line calls), #FullOfEnergy (high energy), #MrManner (excellent sportsmanship), #PunctualPro (always on time), #MentalFortress (strong mental game), and #CourtJester (fun to play with). Your top 3 most received honor tags are displayed on your profile.',
          keywords: ['honor', 'tag', 'vote', 'sportsmanship', 'manner'],
          category: 'achievements',
          priority: 1,
        },
        // 🎯 Onboarding LPR Limit Q&A (Added 2025-12-22)
        {
          question: 'What is the maximum LPR I can select during onboarding?',
          answer:
            'The maximum LPR (Lightning Pickleball Rating) you can select during onboarding is 3.5. You can choose from 2.0, 2.5, 3.0, or 3.5. Levels 4.0 and above can only be achieved through actual matches. This reflects our principle that higher levels must be earned through demonstrated skill.',
          keywords: ['onboarding', 'LPR', 'maximum', 'level', '3.5', 'select'],
          category: 'onboarding',
          priority: 1,
        },
        {
          question: 'How do I reach LPR 4.0 or higher?',
          answer:
            'LPR levels 4.0 and above (4.0, 4.5, 5.0, 5.5) cannot be selected during onboarding. You must earn them by winning Lightning Matches and increasing your ELO score. Beating stronger opponents earns you more points, and consistent victories will help you reach higher LPR levels. Prove your skill on the court! 💪',
          keywords: ['LPR', '4.0', 'achieve', 'match', 'win', 'ELO', 'higher level'],
          category: 'ranking',
          priority: 1,
        },
        {
          question: "Why can't I select a high LPR during onboarding?",
          answer:
            'Lightning Pickleball limits onboarding LPR selection to 3.5 to ensure fair competition. Advanced levels (4.0+) must be proven through actual match performance. This maintains the integrity of the ranking system and ensures all players compete fairly.',
          keywords: ['onboarding', 'LPR', 'limit', 'fair', 'skill', 'prove'],
          category: 'onboarding',
          priority: 1,
        },
        // 🎯 New User Ranking Q&A (Added 2025-12-22)
        {
          question: 'Do I get a ranking immediately after signing up?',
          answer:
            'Yes! Once you complete onboarding and select your LPR level, your ranking is displayed immediately. Even without playing any matches, you can see your current ranking in "#X / Y" format. Feel part of the community from day 1 and start competing to climb the ranks! 🎯',
          keywords: ['new', 'signup', 'ranking', 'display', 'onboarding', 'new user'],
          category: 'ranking',
          priority: 1,
        },
        {
          question: 'How are rankings displayed when players have the same ELO?',
          answer:
            'Lightning Pickleball uses sports-style tiebreaking. Players with the same ELO score share the same rank. For example, if 2 players have ELO 1400, both are ranked #1, and the next player is #3 (skipping #2). This ensures a fair and clear ranking system!',
          keywords: ['tie', 'ranking', 'ELO', 'same', 'rank', 'display'],
          category: 'ranking',
          priority: 1,
        },
        {
          question: 'What is the ranking display format?',
          answer:
            'Rankings are displayed in "#X / Y" format. X is your current rank, Y is the total number of ranked players. For example, "#15 / 150" means you are ranked 15th out of 150 players. You can view rankings for all-time, monthly, or seasonal periods.',
          keywords: ['ranking', 'format', 'display', 'rank', 'total players'],
          category: 'ranking',
          priority: 1,
        },
        // 📊 ELO to LPR Conversion Table Q&A (Added 2025-12-31)
        {
          question: 'Show me the ELO to LPR conversion table',
          answer:
            '📊 **ELO → LPR Conversion Table**\n\nLightning Pickleball converts ELO scores to LPR (Lightning Pickleball Rating) levels:\n\n| ELO Range | LPR Level | Tier |\n|----------|---------|------|\n| 0 - 1000 | LPR 1 | 🥉 Bronze |\n| 1000 - 1100 | LPR 2 | 🥈 Silver |\n| 1100 - 1200 | LPR 3 | 🥇 Gold I |\n| 1200 - 1300 | LPR 4 | 🥇 Gold II |\n| 1300 - 1450 | LPR 5 | 💎 Platinum I |\n| 1450 - 1600 | LPR 6 | 💎 Platinum II |\n| 1600 - 1800 | LPR 7 | 💠 Diamond |\n| 1800 - 2100 | LPR 8 | 👑 Master I |\n| 2100 - 2400 | LPR 9 | 👑 Master II |\n| 2400+ | LPR 10 | 🏆 Legend |\n\n💡 **Note**: Beat stronger opponents to earn more points, and reach higher LPR levels through consistent wins. Prove yourself! 💪',
          keywords: [
            'ELO',
            'LPR',
            'conversion',
            'table',
            'convert',
            'score',
            'level',
            'tier',
            'range',
          ],
          category: 'ranking',
          priority: 1,
        },
        {
          question: 'How is ELO score converted to LPR?',
          answer:
            'ELO scores are converted to LPR levels as follows:\n\n• ELO 0-1000 → LPR 1 (Bronze)\n• ELO 1000-1100 → LPR 2 (Silver)\n• ELO 1100-1200 → LPR 3 (Gold I)\n• ELO 1200-1300 → LPR 4 (Gold II)\n• ELO 1300-1450 → LPR 5 (Platinum I)\n• ELO 1450-1600 → LPR 6 (Platinum II)\n• ELO 1600-1800 → LPR 7 (Diamond)\n• ELO 1800-2100 → LPR 8 (Master I)\n• ELO 2100-2400 → LPR 9 (Master II)\n• ELO 2400+ → LPR 10 (Legend)\n\nFor example, if your ELO is 1400, your LPR is 5 (Platinum I)!',
          keywords: ['ELO', 'LPR', 'convert', 'how', 'score', 'level', 'conversion', 'calculate'],
          category: 'ranking',
          priority: 1,
        },
        {
          question: 'What ELO range corresponds to each LPR level?',
          answer:
            'Here are the ELO ranges for each LPR level:\n\n🥉 **LPR 1 (Bronze)**: 0 - 1000\n🥈 **LPR 2 (Silver)**: 1000 - 1100\n🥇 **LPR 3 (Gold I)**: 1100 - 1200\n🥇 **LPR 4 (Gold II)**: 1200 - 1300\n💎 **LPR 5 (Platinum I)**: 1300 - 1450\n💎 **LPR 6 (Platinum II)**: 1450 - 1600\n💠 **LPR 7 (Diamond)**: 1600 - 1800\n👑 **LPR 8 (Master I)**: 1800 - 2100\n👑 **LPR 9 (Master II)**: 2100 - 2400\n🏆 **LPR 10 (Legend)**: 2400+\n\nWin matches to increase your ELO and reach higher LPR levels! Go get them! 💪',
          keywords: [
            'LPR',
            'ELO',
            'range',
            'level',
            'tier',
            'Bronze',
            'Silver',
            'Gold',
            'Platinum',
            'Diamond',
            'Master',
            'Legend',
          ],
          category: 'ranking',
          priority: 1,
        },
        // 🆕 [KIM] Ranking Sorting Logic Q&A (Added 2025-12-25)
        {
          question: 'How are rankings sorted?',
          answer:
            "Rankings are calculated differently depending on the match type:\n\n🎾 **Singles/Doubles/Mixed Doubles Tabs**:\n• Sorted by the ELO score for that specific match type.\n• If you haven't played any matches, your onboarding LPR-based ELO is used.\n• After playing matches, your updated ELO from match results is used.\n\n📊 **All Tab**:\n• Sorted by the **average** of your Singles, Doubles, and Mixed Doubles ELO scores.\n• Example: Singles 1400 + Doubles 1200 + Mixed 1200 = Average 1267\n• All onboarded users are included in the ranking.\n\n💡 Players with the same ELO share the same rank (sports-style tiebreaking).",
          keywords: [
            'ranking',
            'sort',
            'average',
            'ELO',
            'order',
            'criteria',
            'all',
            'singles',
            'doubles',
          ],
          category: 'ranking',
          priority: 1,
        },
        // 🎯 New User Ranking Determination Q&A (Added 2025-12-24)
        {
          question: 'How is the ranking determined for new users without match experience?',
          answer:
            "A new user's ranking is determined based on the LPR (Lightning Pickleball Rating) level they select during onboarding.\n\n📝 **Onboarding Process:**\n• You directly select your skill level from 2.0, 2.5, 3.0, or 3.5.\n• Levels 4.0 and above can only be achieved through actual match results.\n\n📊 **How Rankings Are Calculated:**\n• Your selected LPR is converted to an internal ELO score (e.g., 3.0 → 1200 points, 3.5 → 1400 points).\n• All users' ELO scores are sorted in descending order to determine rankings.\n• Users with the same ELO score share the same rank.\n\n🏆 **How to Improve Your Ranking:**\nWinning matches increases your ELO score, while losing decreases it. Beating opponents with higher ELO than yours earns you more points!",
          keywords: [
            'new user',
            'ranking',
            'determination',
            'match experience',
            'LPR',
            'ELO',
            'onboarding',
            'rank',
          ],
          category: 'ranking',
          priority: 2,
        },
        // ⚡ Quick Match Eligibility Q&A (Updated 2025-01-01)
        {
          question: 'When is the match request button disabled in the player list?',
          answer:
            'The match request button is disabled when: 1) LPR limit - For singles, host can only invite same level (0) or 1 level higher (+1) (e.g., LPR 5 can invite 5~6). For doubles/mixed, ±2 tolerance (e.g., LPR 5 can invite 3~7). 2) Gender limit - Singles matches require same gender. Both conditions must be met. [January 2025 Update]',
          keywords: [
            'match request',
            'disabled',
            'button',
            'LPR',
            'gender',
            'quick match',
            'eligibility',
            'singles',
            'doubles',
          ],
          category: 'match',
          priority: 1,
        },
        // 🎾 LPR Level Invitation Limit Q&A (Added 2025-01-01)
        {
          question: 'What level can I invite in singles matches?',
          answer:
            '🎯 **Singles Match LPR Level Limits**\n\nIn singles, you can only invite players at **same level (0) or 1 level higher (+1)**.\n\n📊 **Examples:**\n• LPR 5 host → Can invite LPR 5, 6\n• LPR 3 host → Can invite LPR 3, 4\n• ❌ LPR 5 host cannot invite LPR 4 (lower level)\n• ❌ LPR 5 host cannot invite LPR 7 (exceeds +1)\n\n🤔 **Why?**\nThis prevents players from deliberately inviting weaker opponents for easy wins. However, challenging stronger opponents is allowed!\n\n💡 **What about Doubles?**\nDoubles and Mixed Doubles allow ±2 range for more flexible matching. (e.g., LPR 5 → range 3~7)',
          keywords: [
            'singles',
            'LPR',
            'level',
            'invite',
            'limit',
            'range',
            'rule',
            'who',
            'what',
            'which',
          ],
          category: 'match',
          priority: 1,
        },
        {
          question: 'What level can I invite in doubles matches?',
          answer:
            '🎾 **Doubles/Mixed Doubles LPR Level Limits**\n\nIn doubles and mixed doubles, you can invite players within **±2 LPR range**.\n\n📊 **Examples:**\n• LPR 5 host → Can invite LPR 3~7\n• LPR 4 host → Can invite LPR 2~6\n• LPR 8 host → Can invite LPR 6~10\n\n🤔 **Why wider range than singles?**\n• Doubles emphasizes teamwork, so more flexible matching is allowed\n• Enables partnership formation across different skill levels\n• Beginners and advanced players can team up together\n\n💡 **What about Singles?**\nSingles only allows same level (0) or +1 level invitations.',
          keywords: [
            'doubles',
            'mixed doubles',
            'LPR',
            'level',
            'invite',
            'limit',
            'range',
            'rule',
          ],
          category: 'match',
          priority: 1,
        },
        {
          question: 'Why can I only match with the same gender?',
          answer:
            'Singles Lightning Matches are restricted to same-gender matches for fair competition. Men play against men, and women play against women. However, mixed doubles and Lightning Meetups have no gender restrictions, so you can enjoy pickleball in various combinations!',
          keywords: ['gender', 'same', 'match', 'male', 'female', 'singles', 'fair'],
          category: 'match',
          priority: 1,
        },
        // 📧 Official Contact Q&A (Added 2025-12-24)
        {
          question: 'What is the official email address of Lightning Pickleball app?',
          answer:
            'The official email address of Lightning Pickleball app is lightningpickleballapp@gmail.com. For inquiries, feedback, bug reports, partnership opportunities, or any other questions, please reach out to this email. We will respond as quickly as possible! ⚡',
          keywords: ['email', 'contact', 'official', 'feedback', 'bug', 'partnership', 'inquiry'],
          category: 'contact',
          priority: 1,
        },
        {
          question: 'Where do I report bugs?',
          answer:
            'If you find any bugs or errors, just tell me (the chatbot) directly! 💬 Use the format "Bug report: [describe the issue]" and I\'ll pass it on to the development team. If possible, include what screen you were on and what you were doing when it happened. Your feedback helps make the app better! 🙏',
          keywords: ['bug', 'report', 'error', 'issue', 'feedback', 'contact'],
          category: 'contact',
          priority: 1,
        },
        // 🏛️ Club Permission System Q&A (Added 2025-12-25)
        {
          question: "What's the difference between Admin and Manager in a club?",
          answer:
            'Clubs have three roles:\n\n👑 **Admin**:\n• The highest authority in the club. The person who creates the club automatically becomes Admin.\n• Has full control: club settings, deletion, and all member management.\n• Can appoint or remove Managers.\n• There can only be 1 Admin per club.\n\n🛡️ **Manager**:\n• An assistant administrator appointed by the Admin.\n• Can approve/reject join requests, create events, etc.\n• Becomes a candidate for Admin transfer.\n\n👤 **Member**:\n• A regular participant of the club.\n• Can participate in events, post on the board, etc.',
          keywords: ['admin', 'manager', 'member', 'role', 'permission', 'difference'],
          category: 'club',
          priority: 1,
        },
        {
          question: 'How is Admin permission transferred?',
          answer:
            'Admin permission transfer occurs in these situations:\n\n1️⃣ **When Admin deletes their account**:\n• If there are Managers → The oldest Manager automatically becomes the new Admin.\n• If there are no Managers → Account deletion is blocked. You must appoint a Manager or delete the club first.\n\n2️⃣ **When Admin manually transfers**:\n• Admin can designate another member as the new Admin in club settings.\n\n📢 All club members receive a notification when Admin changes.',
          keywords: [
            'admin',
            'permission',
            'transfer',
            'delete',
            'account',
            'manager',
            'automatic',
          ],
          category: 'club',
          priority: 1,
        },
        {
          question: 'Who becomes Admin when there are multiple Managers?',
          answer:
            'When an Admin deletes their account and there are multiple Managers, the **Manager who joined the club first** automatically becomes the new Admin. This follows the seniority principle, determined by the join date (joinedAt).\n\nExample:\n• Manager A (joined Jan 15, 2024) ✅ New Admin!\n• Manager B (joined Mar 20, 2024)\n• Manager C (joined Jun 1, 2024)',
          keywords: [
            'manager',
            'multiple',
            'admin',
            'seniority',
            'join date',
            'automatic',
            'transfer',
          ],
          category: 'club',
          priority: 1,
        },
        {
          question: 'What happens when a club Admin deletes their account?',
          answer:
            'When a club Admin tries to delete their account:\n\n✅ **If there are Managers**:\n• Admin permission is automatically transferred to the oldest Manager.\n• The new Admin and all club members receive notifications.\n• Account deletion proceeds normally.\n\n❌ **If there are no Managers**:\n• Account deletion is blocked.\n• Message: "Cannot delete account because you are the admin of the following clubs."\n• You must appoint a Manager or delete the club first.',
          keywords: ['admin', 'account', 'delete', 'manager', 'transfer', 'blocked', 'club'],
          category: 'club',
          priority: 1,
        },
        {
          question: 'How do I appoint a Manager?',
          answer:
            "Club Admins can appoint Managers as follows:\n\n1. Go to Club Detail Page → Members tab\n2. Select the member to appoint as Manager\n3. Tap 'Appoint Manager' button\n\nOnce appointed, the member receives a notification and gains management permissions like approving join requests. We recommend having at least 1 Manager in case the Admin needs to delete their account!",
          keywords: ['manager', 'appoint', 'admin', 'permission', 'member', 'settings'],
          category: 'club',
          priority: 1,
        },
        // 📊 Discovery/Club Data Collection Q&A (Added 2025-12-25)
        {
          question: 'How is club information collected in the Discovery screen?',
          answer:
            "Club data in the Discovery/Clubs screen is collected as follows:\n\n📋 **Basic Club Info**:\n• Subscribed in real-time from Firestore's pickleball_clubs collection.\n• Includes club name, description, location, logo, etc.\n\n👥 **Member Count**:\n• Real-time count from clubMembers collection where status is 'active'.\n• Ensures accurate current member count.\n\n🏆 **Event Frequency**:\n• Calculated from club_events collection for the last 30 days.\n• Displayed as 'Events: X/mo'.\n\n💬 **Communication Level**:\n• Based on clubAnnouncements count from the last 7 days.\n• 5+: Active, 2-4: Normal, 0-1: Quiet\n\n📈 **Member Trend**:\n• Calculated from clubMembers join/leave data for the last 30 days.\n• Displayed as '+X/-Y'.\n\n💰 **Monthly Fee**:\n• Retrieved from pickleball_clubs.settings.monthlyFee field.",
          keywords: [
            'discovery',
            'club',
            'data',
            'collection',
            'member count',
            'events',
            'communication',
            'fee',
          ],
          category: 'club',
          priority: 1,
        },
        {
          question: 'What activity metrics are shown on club cards?',
          answer:
            "Club cards display 4 activity metrics:\n\n🏆 **Events: X/mo**\n• Number of club events (tournaments, leagues, meetups) held in the last 30 days.\n\n💬 **Chat: Active/Normal/Quiet**\n• Based on club announcement activity in the last 7 days.\n• 5+: Active\n• 2-4: Normal\n• 0-1: Quiet\n\n📈 **Members: +X/-Y**\n• New members (+) and members who left (-) in the last 30 days.\n• Shows the club's growth trend.\n\n💰 **Fee: $X/mo or Free**\n• Monthly club membership fee.\n• Shows 'Free' if $0.",
          keywords: [
            'club',
            'card',
            'activity',
            'metrics',
            'events',
            'chat',
            'members',
            'trend',
            'fee',
          ],
          category: 'club',
          priority: 1,
        },
        {
          question: 'How often is club data updated?',
          answer:
            'Club data is updated in real-time! 🚀\n\n⚡ **Real-time Updates**:\n• Basic club info (name, description, logo, etc.)\n• Member count (based on clubMembers collection)\n• Membership status (Admin/Manager/Member/Pending)\n\n📊 **Refreshed on Discovery Screen Entry**:\n• Event frequency (last 30 days)\n• Communication level (last 7 days)\n• Member trend (last 30 days)\n• Monthly fee info\n\nEvery time you enter the Discovery screen, the latest data is fetched so you always see accurate information!',
          keywords: ['club', 'data', 'update', 'realtime', 'refresh', 'frequency'],
          category: 'club',
          priority: 1,
        },
        {
          question: 'How do private clubs appear in the Discovery screen?',
          answer:
            "Private club visibility rules are as follows:\n\n🔒 **For Non-members**:\n• Private clubs are hidden from the Discovery/Clubs list.\n• Can only find the club through invite links or direct search.\n\n✅ **For Members**:\n• Admins, Managers, and Members can all see the private club in the list.\n• Status badge (Admin/Manager/Member) is displayed.\n\n📋 **Public Clubs**:\n• Visible to all users in the list.\n• Shows 'Available' badge.",
          keywords: ['private', 'club', 'visibility', 'discovery', 'member', 'public'],
          category: 'club',
          priority: 1,
        },
        // 🎛️ Admin Dashboard Quick Actions Q&A (Added 2025-12-25)
        {
          question: 'What quick actions are available in the Admin Dashboard?',
          answer:
            "The Club Admin Dashboard has 4 quick action buttons:\n\n👥 **Invite Members**:\n• Invite new members to your club.\n• Send invitations via email or link.\n\n⚙️ **Club Settings**:\n• Modify club information and policies.\n• Change club name, description, court address, regular meetups, fees, etc.\n\n🔐 **Privacy Settings**:\n• Set the club's visibility.\n• Choose between Public (anyone can search/join) or Private (invite/approval required).\n\n📸 **Club Album** (Coming Soon):\n• Share club photos and memories.\n• Currently in development and coming soon!",
          keywords: [
            'admin',
            'dashboard',
            'quick actions',
            'invite',
            'club settings',
            'privacy',
            'album',
          ],
          category: 'club_admin',
          priority: 1,
        },
        {
          question: 'What items can I change in Club Settings?',
          answer:
            "In Club Settings, you can change the following:\n\n📝 **Required Items**:\n• **Club Name**: Official name of the club (max 30 characters)\n• **Court Address**: Location of the club's home court\n• **Regular Meetups**: Set up regular meeting schedules\n\n📋 **Optional Items**:\n• **Description**: Brief description of the club (max 200 characters)\n• **Privacy Settings**: Public/Private status\n• **Fee Information**: Monthly dues, court fees, etc.\n• **Facility Info**: Number of courts, lighting, parking, etc.\n• **Club Rules**: Club rules and etiquette\n\n💡 Tap the logo image to change it!",
          keywords: [
            'club settings',
            'items',
            'change',
            'club name',
            'court address',
            'meetups',
            'description',
            'fees',
            'rules',
          ],
          category: 'club_admin',
          priority: 1,
        },
        {
          question: 'How do I set up regular meetups?',
          answer:
            'Go to Club Settings → Regular Meetups to configure:\n\n📅 **Settings**:\n• **Day**: Choose which day to meet weekly (e.g., Saturday)\n• **Time**: Meeting start time (e.g., 7:30 PM)\n• **Location**: Default court location\n• **Courts**: Number of courts to use\n\n⏰ **Regular Meetup Schedule**:\n• Configured meetups automatically appear on the calendar.\n• Members can indicate their attendance in advance.\n• View crowd level by comparing participants to court count.',
          keywords: ['regular meetups', 'setup', 'day', 'time', 'location', 'courts', 'schedule'],
          category: 'club_admin',
          priority: 1,
        },
        {
          question: 'What roles are available in a club?',
          answer:
            'Clubs have three roles:\n\n👑 **Admin** - 1 person:\n• Highest authority in the club\n• Can change settings, delete club, manage all members\n• Can appoint/remove Managers\n• Can transfer Admin rights to another Manager\n\n🛡️ **Manager** - Multiple allowed:\n• Assistant admin appointed by the Admin\n• Can approve/reject join requests\n• Can create events\n• Access to all management features except club deletion\n\n👤 **Member**:\n• Regular club participant\n• Can participate in events, post on boards, etc.',
          keywords: ['roles', 'admin', 'manager', 'member', 'permission', 'authority'],
          category: 'club_admin',
          priority: 1,
        },
        {
          question: 'How do I appoint a Manager?',
          answer:
            "You can appoint Managers using these methods:\n\n📱 **Method 1: From Members Tab**\n1. Go to Club Detail Page → Members tab\n2. Find the member to appoint in the member list\n3. Tap the ⋮ menu next to the member\n4. Select 'Promote to Manager'\n\n📱 **Method 2: From Role Management**\n1. Club Detail Page → Members tab → Role Management\n2. In the Role Change section, select the member\n3. Tap the 'Manager' button\n\n💡 **Tip**: When an Admin deletes their account, one of the Managers automatically becomes the new Admin. We recommend having at least 1 Manager!",
          keywords: ['manager', 'appoint', 'promote', 'method', 'member', 'role management'],
          category: 'club_admin',
          priority: 1,
        },
        {
          question: 'How do I transfer Admin rights?',
          answer:
            "Admin rights can be transferred as follows:\n\n📱 **Manual Transfer**:\n1. Go to Club Detail Page → Members tab → Role Management\n2. Find the 'Admin Transfer' section\n3. Tap 'Transfer Admin Rights' button\n4. Select the Manager to become new Admin\n5. Confirm to complete the transfer\n\n⚠️ **Important Notes**:\n• Admin can only be transferred to a Manager.\n• After transfer, you become a regular Member.\n• All club members receive a notification.\n\n🔄 **Automatic Transfer**:\n• When Admin deletes their account, the oldest Manager automatically becomes the new Admin.",
          keywords: ['admin', 'rights', 'transfer', 'manager', 'method'],
          category: 'club_admin',
          priority: 1,
        },
        {
          question: 'How do I remove a member from the club?',
          answer:
            "Admins or Managers can remove members:\n\n📱 **Removal Method**:\n1. Go to Club Detail Page → Members tab\n2. Find the member to remove in the list\n3. Tap the ⋮ menu next to the member\n4. Select 'Remove from Club'\n5. Tap 'Remove' in the confirmation popup\n\n⚠️ **Important Notes**:\n• Removed members immediately lose club access.\n• Removed members receive a notification.\n• Admins/Managers cannot be removed.\n• Removal cannot be undone; they must reapply to join.",
          keywords: ['remove', 'kick', 'member', 'method'],
          category: 'club_admin',
          priority: 1,
        },
        {
          question: 'How do I demote a Manager to regular Member?',
          answer:
            "Only Admins can demote Managers:\n\n📱 **Demotion Method**:\n1. Go to Club Detail Page → Members tab\n2. Find the Manager to demote in the list\n3. Tap the ⋮ menu next to the Manager\n4. Select 'Demote to Member'\n5. Tap 'Demote' in the confirmation popup\n\n📱 **From Role Management**:\n1. Members tab → Role Management\n2. Select the Manager in the Role Change section\n3. Tap the 'Member' button\n\n💡 Demoted Managers will only have regular member permissions.",
          keywords: ['demote', 'manager', 'member', 'role change', 'method'],
          category: 'club_admin',
          priority: 1,
        },
        {
          question: 'What information is shown in the Club Status Dashboard?',
          answer:
            "The Admin Dashboard's Club Status shows:\n\n📊 **Member Statistics**:\n• **Total Members**: Total club member count\n• **Active Members**: Recently active members\n• **New This Month**: Members who joined this month\n\n📈 **Activity Metrics**:\n• **Participation Rate**: Average attendance at regular meetups\n• **Monthly Revenue**: Fee income per month (if configured)\n\n🏆 **Additional Info**:\n• **Events**: Monthly event count\n• **Communication**: Activity level (Active/Normal/Quiet)\n• **Member Trend**: 30-day join/leave stats (+/-)\n• **Dues**: Configured monthly fee amount",
          keywords: [
            'dashboard',
            'status',
            'statistics',
            'members',
            'participation',
            'revenue',
            'activity',
          ],
          category: 'club_admin',
          priority: 1,
        },
        // 📊 ELO System Q&A (Added 2025-12-25)
        {
          question: "What's the difference between Public ELO and Club ELO?",
          answer:
            'Lightning Pickleball has two ELO systems:\n\n🌐 **Public ELO**:\n• Used in Lightning Matches (Quick Matches).\n• Singles, Doubles, and Mixed Doubles are **managed separately**.\n• Example: Singles ELO 1500, Doubles ELO 1400, Mixed ELO 1350\n\n🏛️ **Club ELO**:\n• Used in Club Leagues/Tournaments.\n• Singles, Doubles, and Mixed Doubles are **combined into one ELO**.\n• League and Tournament results both affect the same Club ELO.\n• However, the K-Factor (score change magnitude) differs.\n\n📋 **Summary Table**:\n| Category | Public ELO | Club ELO |\n|----------|-----------|----------|\n| Singles/Doubles/Mixed | ✅ Separate | ❌ Combined |\n| League/Tournament | N/A | ❌ Combined |',
          keywords: [
            'ELO',
            'public',
            'club',
            'difference',
            'singles',
            'doubles',
            'mixed',
            'separate',
            'combined',
          ],
          category: 'ranking',
          priority: 1,
        },
        {
          question: 'Do League and Tournament have the same score impact in Club ELO?',
          answer:
            'No! In Club ELO, both League and Tournament affect the same ELO, but the **K-Factor (score change magnitude)** differs.\n\n📊 **K-Factor Policy (High Risk, High Return!)**:\n\n⚔️ **Tournament Matches**: K = 24-32\n• Large score changes\n• Win more when you win, lose more when you lose\n• Reflects the short-term, high-intensity nature of tournaments\n\n🏆 **League Matches**: K = 16\n• Relatively smaller score changes\n• Reflects the long-term, stable nature of leagues\n\n💡 **Why this design?**\nTournaments have single-elimination tension, so we applied a "High Risk, High Return" policy. Each match has greater impact, so beating a strong opponent in a tournament earns bigger rewards!',
          keywords: ['ELO', 'K-Factor', 'league', 'tournament', 'score', 'change', 'impact'],
          category: 'ranking',
          priority: 1,
        },
        {
          question: 'Why does Club ELO combine Singles/Doubles/Mixed?',
          answer:
            "Here's why Club ELO combines Singles, Doubles, and Mixed Doubles into one score:\n\n1️⃣ **Overall Club Skill Assessment**:\n• Clubs host various match formats.\n• A single ELO provides clear overall ranking within the club.\n\n2️⃣ **System Simplicity**:\n• Managing 3 separate ELOs per club would be complex.\n• Combined ELO provides clear club rankings.\n\n3️⃣ **Match Type Differentiation via K-Factor**:\n• Instead, Tournament (K=24-32) and League (K=16) have different K-Factors.\n• Score impact varies based on match importance and intensity.\n\n💡 **Public ELO is Separate**: In Lightning Matches, Singles, Doubles, and Mixed Doubles each have their own ELO!",
          keywords: ['ELO', 'club', 'combined', 'singles', 'doubles', 'mixed', 'reason', 'design'],
          category: 'ranking',
          priority: 1,
        },
        {
          question: 'Are there public leagues or tournaments?',
          answer:
            'Currently, only **Club Leagues/Tournaments** are supported. You can participate in leagues or tournaments hosted by club admins after joining a club.\n\n🔮 **Future Plans**:\nPublic Leagues/Tournaments are in development! Soon, Lightning Pickleball users will be able to join public competitions without club membership.\n\nCurrent Public Features:\n• ⚡ Lightning Match (Quick Match): Uses Public ELO\n• 🎾 Lightning Meetup: No ranking impact\n\nCurrent Club Features:\n• 🏆 Club League: Uses Club ELO (K=16)\n• ⚔️ Club Tournament: Uses Club ELO (K=24-32)\n\nStay tuned for new feature announcements! 📢',
          keywords: ['public', 'league', 'tournament', 'competition', 'plan', 'future', 'club'],
          category: 'competition',
          priority: 1,
        },
        // 📋 Community Guidelines Q&A (Replaced 2025-12-25)
        {
          question: 'What are the Community Guidelines?',
          answer:
            '📋 **Lightning Pickleball Community Guidelines**\n\n**Purpose**: To define the promises all members must keep for Lightning Pickleball to be a fun, fair, and safe community.\n\n---\n\n⭐ **Chapter 1: Core Values**\n• Autonomy, Accessibility, Fairness, Transparency, Respect\n\n🎾 **Chapter 2: Official Match Rules**\n• Follow USTA The Code, Score recording, Forfeit/withdrawal, Cost sharing\n\n📊 **Chapter 3: Ranking & Season Policies**\n• Public/Club ELO, Quarterly seasons, Official ranking requirements, ELO rematch limit\n\n🤝 **Chapter 4: Code of Conduct**\n• Accuracy obligation, Prohibited content\n\n🌈 **Chapter 5: Diversity & Inclusion Policy**\n• Inclusivity principle, No discrimination',
          keywords: [
            'community',
            'guidelines',
            'rules',
            'policy',
            'core values',
            'code of conduct',
          ],
          category: 'guidelines',
          priority: 1,
        },
        {
          question: 'What are the Core Values of Lightning Pickleball?',
          answer:
            '⭐ **Core Values (Chapter 1)**\n\n**Autonomy**: All matches are created and managed autonomously by users.\n\n**Accessibility**: Opportunities for skill improvement are equal for everyone, provided free of charge.\n\n**Fairness**: All official match results are proven through an objective ELO rating system.\n\n**Transparency**: All official match records, rankings, and trophies are transparently published as community history.\n\n**Respect**: Online and offline, we prioritize sportsmanship and respect for each other above all else.',
          keywords: [
            'core values',
            'autonomy',
            'accessibility',
            'fairness',
            'transparency',
            'respect',
            'sportsmanship',
          ],
          category: 'guidelines',
          priority: 1,
        },
        {
          question: 'What are the Official Match Rules?',
          answer:
            '🎾 **Official Match Rules (Chapter 2)**\n\n📌 **Basic Rules**: All matches follow USTA\'s "The Code."\n\n📝 **Score Recording**:\n• Host records score **within 24 hours** after match\n• Other participants can dispute **within 72 hours**\n\n⚠️ **Forfeit & Withdrawal**:\n• **15+ minutes late** may result in forfeit\n\n💰 **Costs**:\n• Court booking and ball preparation are by **mutual agreement** among participants',
          keywords: [
            'official',
            'match',
            'rules',
            'The Code',
            'score',
            'record',
            'forfeit',
            'cost',
          ],
          category: 'guidelines',
          priority: 1,
        },
        {
          question: 'What are the Ranking & Season Policies?',
          answer:
            "📊 **Ranking & Season Policies (Chapter 3)**\n\n🏆 **Ranking System**:\n'Public ELO Ranking' (public matches) and 'Club ELO Ranking' (club matches) are **completely independent**.\n\n🗓️ **Seasons**: 4 times per year, **quarterly**.\n• Q1: Jan~Mar | Q2: Apr~Jun | Q3: Jul~Sep | Q4: Oct~Dec\n\n✅ **Official Ranking Requirements**:\nComplete **minimum 5** 'Public Lightning Matches' per season to be included in official rankings.\n\n⚠️ **ELO Rematch Limit**:\nOfficial 'Public Lightning Matches' with same opponent count for ELO **only once per 3 months**.",
          keywords: [
            'ranking',
            'season',
            'ELO',
            'official',
            'requirements',
            '5 matches',
            '3 months',
            'quarterly',
          ],
          category: 'guidelines',
          priority: 1,
        },
        {
          question: 'What is the Code of Conduct?',
          answer:
            '🤝 **Code of Conduct (Chapter 4)**\n\n✍️ **Accuracy Obligation**:\nAll users must record their profile (especially self-assessed skill level before matches) and match results **as accurately as possible**.\n\n⚠️ Intentional skill misrepresentation (**sandbagging**) or score manipulation is considered a **serious violation** of community trust.\n\n📊 **LPR (Lightning Pickleball Rating)** is **fairly auto-calculated** by the system based on these recorded results.\n\n🚫 **Prohibited Content**:\nPosting or generating illegal or inappropriate content (insults, discrimination, etc.) through the AI chatbot is prohibited.',
          keywords: [
            'code of conduct',
            'accuracy',
            'sandbagging',
            'LPR',
            'prohibited content',
            'manipulation',
          ],
          category: 'guidelines',
          priority: 1,
        },
        {
          question: 'What is the Diversity & Inclusion Policy?',
          answer:
            '🌈 **Diversity & Inclusion Policy (Chapter 5)**\n\n🤝 **Inclusivity Principle**:\nRegardless of gender, sexual orientation, or gender identity, all users have the right to **participate equally** in all activities.\n\n🚫 **No Discrimination**:\nDiscriminatory speech or behavior is prohibited and may result in **service restrictions** if discovered.\n\n💡 Lightning Pickleball strives to be an **inclusive community** where all pickleball players feel welcome!',
          keywords: [
            'diversity',
            'inclusion',
            'discrimination',
            'prohibited',
            'gender',
            'equality',
            'policy',
          ],
          category: 'guidelines',
          priority: 1,
        },
        {
          question: 'If I play the same opponent multiple times, does it keep affecting my ELO?',
          answer:
            "⚠️ **ELO Rematch Limit Rule (Chapter 3)**\n\nNo! Official 'Public Lightning Matches' with the same opponent only count for ELO **once every 3 months**.\n\n📋 **Example**:\n• Jan 15: A vs B match → ELO counted ✅\n• Feb 20: A vs B match → ELO not counted ❌ (3 months not passed)\n• Apr 20: A vs B match → ELO counted ✅ (3 months passed)\n\n🎾 **Doubles Matches**:\nOnly the exact same team combination ([A,B] vs [C,D]) is subject to the 3-month limit. If even one player is different, it counts as a ranked match!\n\n💡 **Why?**\nThis policy prevents ranking manipulation through repeated matches with specific opponents.\n\n📌 **Note**: Club league/tournament matches have separate rules for this limit.",
          keywords: [
            'same opponent',
            'multiple times',
            '3 months',
            'rematch',
            'ELO',
            'count',
            'limit',
            'doubles',
            'team combination',
          ],
          category: 'guidelines',
          priority: 1,
        },
        {
          question: 'What happens if I arrive late to a match?',
          answer:
            '⚠️ **Forfeit & Withdrawal Rules (Chapter 2)**\n\n⏰ **15-Minute Rule**:\nIf you arrive **15+ minutes late** to the scheduled match time, you may be **forfeited**.\n\n📞 **When opponent is unreachable**:\nContact the match organizer or ask me (the chatbot) for help!\n\n🤝 **Exceptions**:\nIf contact is made and **both parties agree**, the match can proceed despite lateness.\n\n❌ **No-shows/Cancellations**:\nUnexplained no-shows may be recorded as manner issues.',
          keywords: ['late', 'tardy', 'forfeit', 'withdraw', '15 minutes', 'no-show', 'cancel'],
          category: 'guidelines',
          priority: 1,
        },
        {
          question: 'Who records the score and when?',
          answer:
            "📝 **Score Recording Rules (Chapter 2)**\n\n**Who records**: Match Host (organizer)\n**Deadline**: **Within 24 hours** after match ends\n\n📌 **Important Points**:\n• Other participants can dispute **within 72 hours**\n• If host doesn't record, **opponent can record** instead\n\n⚠️ **Disputes**: If you disagree with the result, contact your opponent **within 72 hours** of recording to request an adjustment.",
          keywords: ['score', 'record', 'who', 'when', 'host', '24 hours', '72 hours'],
          category: 'guidelines',
          priority: 1,
        },
        // 🏆 Honor System Q&A (Added 2025-12-28)
        {
          question: 'What is Ranking Confidence?',
          answer:
            '📊 **Ranking Confidence**\n\nRanking Confidence is a visual indicator based on the number of matches played in a season.\n\n🏅 **How to become an Official Ranker?**\n• Play at least **5 matches** in the season.\n• Players with fewer than 5 matches are "Unofficial" and excluded from season rewards.\n\n📈 **Confidence Levels (0-5)**:\n• 🟩⬜⬜⬜⬜ = 1 match completed\n• 🟩🟩⬜⬜⬜ = 2 matches completed\n• 🟩🟩🟩🟩🟩 = 5+ matches → **Official Ranker!**\n\n💡 **Why is this needed?**\nVisually shows that ELO from players with more matches is more accurate.',
          keywords: ['confidence', 'ranking', 'official', '5 matches', 'level', 'bar'],
          category: 'ranking',
          priority: 1,
        },
        {
          question: 'What is an Official Ranker?',
          answer:
            '🏆 **Official Ranker**\n\nA player who has participated in **5 or more** official Lightning Matches during the season.\n\n✅ **Official Ranker Benefits**:\n• Official record in season final rankings\n• Eligible for Season Trophies (Champion, Iron Man, Ace, etc.)\n• Season records saved in Hall of Fame\n\n❌ **Players with fewer than 5 matches**:\n• Ranking is displayed but marked "Unofficial"\n• Excluded from season rewards and trophies\n\n📅 **Season Period**: Quarterly (Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec)',
          keywords: ['official', 'ranker', '5 matches', 'season', 'trophy', 'reward'],
          category: 'ranking',
          priority: 1,
        },
        {
          question: 'What Season Trophies are available?',
          answer:
            '🏆 **Season Trophy Types**\n\nAutomatically awarded to Official Rankers at season end.\n\n🥇 **Season Champion**:\n• Top 1-3 ELO within starting LPR grade group\n• Gold/Silver/Bronze trophies awarded\n• Example: LPR 3.0 group champion, LPR 3.5 group champion\n\n🚀 **Rank Up**:\n• All players whose LPR grade increased during the season\n\n🔥 **Iron Man**:\n• Top 10% in most matches played\n• Reward for consistent participation!\n\n♠️ **Ace**:\n• 10+ matches + Top 5% win rate\n• Master of efficiency!',
          keywords: ['season', 'trophy', 'champion', 'rank up', 'iron man', 'ace'],
          category: 'achievements',
          priority: 1,
        },
        {
          question: 'How is the Season Champion determined?',
          answer:
            '👑 **Season Champion Selection**\n\nSeason Champions are determined within **starting LPR grade groups**.\n\n📊 **Group Classification**:\n• Based on LPR grade snapshot from season first day\n• Example: LPR 3.0, 3.5, 4.0, 4.5 each have separate groups\n\n🏅 **Ranking Determination**:\n• Top 1-3 ELO among official rankers in each group\n• 🥇 1st place: Gold trophy\n• 🥈 2nd place: Silver trophy\n• 🥉 3rd place: Bronze trophy\n\n💡 **Why starting grade?**\nEven if your grade increases during the season, you compete in your starting grade group. This ensures fair competition among players of similar skill!',
          keywords: ['champion', 'season', 'determine', 'grade', 'group', 'LPR'],
          category: 'achievements',
          priority: 1,
        },
        {
          question: 'Where can I see the Achievements Guide?',
          answer:
            '📖 **Achievements Guide**\n\nTap the "❓" icon in the Hall of Fame section of your profile to access the Achievements Guide screen.\n\n📋 **Information Available**:\n• All Season Trophies list + earning conditions\n• All Badges list + earning conditions\n• Category filtering (Season/Tournament/Match/Community)\n\n🎯 **Path**:\nProfile → Hall of Fame → ❓ icon → Achievements Guide\n\nCheck what trophies and badges you can earn, and start your challenge! 💪',
          keywords: ['achievements', 'guide', 'trophy', 'badge', 'check', 'Hall of Fame'],
          category: 'achievements',
          priority: 1,
        },
        {
          question: 'What is recorded in the Hall of Fame?',
          answer:
            '🏛️ **Hall of Fame**\n\nThe Hall of Fame records the following:\n\n🏆 **Season Records**:\n• Season final ranking (Official Rankers only)\n• Season Trophies (Champion, Rank Up, Iron Man, Ace)\n• Season stats (matches, win rate, final ELO)\n\n🥇 **Tournament/League Trophies**:\n• Club league winner/runner-up\n• Club tournament winner/runner-up\n\n🎖️ **Badges**:\n• Winning streak badges (3, 5, 10 wins)\n• Milestone badges (10/50/100 matches)\n• Social badges, etc.\n\n⭐ **Honor Tags**:\n• Votes received from opponents (e.g., #MrManner, #SharpEyed)',
          keywords: ['Hall of Fame', 'record', 'season', 'trophy', 'badge'],
          category: 'achievements',
          priority: 1,
        },
      ];
    }
  }

  /**
   * Initialize both Korean and English knowledge bases
   */
  async initializeBothLanguages() {
    try {
      console.log('🌐 Initializing knowledge base for both languages...');

      await Promise.all([this.initializeKnowledgeBase('ko'), this.initializeKnowledgeBase('en')]);

      console.log('✅ Successfully initialized knowledge base for both languages');
    } catch (error) {
      console.error('❌ Failed to initialize knowledge bases:', error);
    }
  }
}

// Create singleton instance
const knowledgeBaseService = new KnowledgeBaseService();

export default knowledgeBaseService;
