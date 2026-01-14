/**
 * AI Service - 3중 방어벽 검증 테스트
 * TDD 접근: 테스트 먼저 작성 → 실패 확인 → 구현 → 통과 확인
 *
 * 📝 LPR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LPR" (Lightning Pickleball Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LPR로 변경하고 코드는 ntrp를 유지합니다.
 *
 * 테스트 대상:
 * - 방어벽 1: 시스템 프롬프트 (Gemini API 레벨)
 * - 방어벽 2: 입력 필터 (주제 이탈 차단)
 * - 방어벽 3: 출력 필터 (응답 검증 및 필터링)
 */

import aiService, { SYSTEM_PROMPT } from '../aiService';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  orderBy: jest.fn(),
  limit: jest.fn(),
}));

jest.mock('../../firebase/config', () => ({
  db: {},
}));

// Mock knowledgeBaseService
jest.mock('../knowledgeBaseService', () => ({
  default: {
    getDefaultKnowledgeData: jest.fn().mockReturnValue([
      {
        id: '1',
        question: '포핸드 그립 종류는?',
        answer: '피클볼 그립에는 컨티넨탈, 이스턴, 세미웨스턴, 웨스턴 그립이 있습니다.',
        keywords: ['포핸드', 'grip', '그립'],
        priority: 1,
      },
      {
        id: '2',
        question: 'How do I create a club?',
        answer: 'Go to the My Clubs tab and tap Create New Club button.',
        keywords: ['club', 'create', '클럽'],
        priority: 1,
      },
    ]),
  },
}));

// Mock fetch for Gemini API
global.fetch = jest.fn();

describe('aiService - 3중 방어벽 검증 테스트', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock: Gemini API returns pickleball-related response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: '피클볼 그립에는 여러 종류가 있습니다. 컨티넨탈, 이스턴, 세미웨스턴 그립 등이 있어요.',
                  },
                ],
              },
            },
          ],
        }),
    });
  });

  describe('🛡️ 방어벽 2: 입력 필터 (Input Filter)', () => {
    describe('금지어 차단 - 정치', () => {
      it('정치 관련 질문을 차단해야 함 (Korean)', async () => {
        const result = await aiService.processQuery('대통령 선거에 대해 어떻게 생각해?', {
          language: 'ko',
        });

        // 거절 응답에 피클볼 이모지와 정중한 거절이 포함되어야 함
        expect(result.answer).toContain('🎾');
        expect(result.answer).toMatch(/죄송|어려/);
        // 실제 응답: "피클볼나 Lightning Pickleball 앱에 관해 궁금한 점이 있으시면 말씀해주세요!"
        expect(result.answer).toMatch(/피클볼/);

        // 금지어가 답변에 포함되지 않아야 함
        expect(result.answer).not.toMatch(/대통령|선거|정치/);

        // 차단된 응답임을 표시
        expect(result.filtered).toBe(true);
      });

      it('should block political questions (English)', async () => {
        const result = await aiService.processQuery('What do you think about the election?', {
          language: 'en',
        });

        expect(result.answer).toContain('🎾');
        expect(result.answer).toMatch(/sorry|cannot/i);
        expect(result.answer).toMatch(/pickleball/i);
        expect(result.answer).not.toMatch(/election|politics/i);
        expect(result.filtered).toBe(true);
      });
    });

    describe('금지어 차단 - 금융/투자', () => {
      it('암호화폐 질문을 차단해야 함', async () => {
        const result = await aiService.processQuery('비트코인 투자 어떻게 해?', { language: 'ko' });

        expect(result.answer).toContain('🎾');
        expect(result.answer).toMatch(/죄송|어려워/);
        expect(result.answer).not.toMatch(/비트코인|투자|코인/);
      });

      it('주식 투자 질문을 차단해야 함', async () => {
        const result = await aiService.processQuery('어떤 주식을 사야 할까요?', { language: 'ko' });

        expect(result.answer).toContain('🎾');
        expect(result.answer).toMatch(/죄송|어려워/);
        expect(result.answer).not.toMatch(/주식|투자|삼성전자/);
      });
    });

    describe('주제 이탈 차단', () => {
      it('날씨 질문을 차단해야 함 (피클볼 맥락 없을 때)', async () => {
        const result = await aiService.processQuery('오늘 날씨 어때?', { language: 'ko' });

        expect(result.answer).toContain('🎾');
        expect(result.answer).toMatch(/죄송|어려워/);
        expect(result.answer).toMatch(/피클볼/);
      });

      it('영화 추천 질문을 차단해야 함', async () => {
        const result = await aiService.processQuery('요즘 볼만한 영화 추천해줘', {
          language: 'ko',
        });

        expect(result.answer).toContain('🎾');
        expect(result.answer).toMatch(/죄송|어려워/);
        expect(result.answer).not.toMatch(/영화|드라마/);
      });

      it('음식/맛집 질문을 차단해야 함', async () => {
        const result = await aiService.processQuery('근처 맛집 추천해줘', { language: 'ko' });

        expect(result.answer).toContain('🎾');
        expect(result.answer).toMatch(/죄송|어려워/);
        expect(result.answer).not.toMatch(/맛집|음식점|레스토랑/);
      });

      it('should block off-topic questions (English)', async () => {
        // "weather"는 OFF_TOPIC_KEYWORDS에 포함됨
        const result = await aiService.processQuery("What's the weather like today?", {
          language: 'en',
        });

        expect(result.answer).toContain('🎾');
        expect(result.answer).toMatch(/sorry|cannot|can't/i);
        expect(result.answer).toMatch(/pickleball/i);
        expect(result.filtered).toBe(true);
      });
    });
  });

  describe('✅ 정상 질문 허용', () => {
    beforeEach(() => {
      // Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [{ text: '피클볼 그립에는 여러 종류가 있습니다...' }],
                },
              },
            ],
          }),
      });
    });

    it('피클볼 기술 질문에 정상 응답해야 함', async () => {
      const result = await aiService.processQuery('포핸드 그립 종류가 뭐가 있어?', {
        language: 'ko',
      });

      // 정상 응답은 차단되지 않아야 함
      expect(result.filtered).toBeFalsy();

      // 거절 메시지가 없어야 함
      expect(result.answer).not.toMatch(/죄송합니다.*도움드리기.*어려/);
    });

    it('앱 사용법 질문에 정상 응답해야 함', async () => {
      const result = await aiService.processQuery('클럽은 어떻게 만들어?', { language: 'ko' });

      expect(result.filtered).toBeFalsy();
      expect(result.answer).not.toMatch(/죄송합니다.*도움드리기.*어려/);
    });

    it('ELO 랭킹 질문에 정상 응답해야 함', async () => {
      const result = await aiService.processQuery('ELO 랭킹이 뭐야?', { language: 'ko' });

      expect(result.filtered).toBeFalsy();
      expect(result.answer).not.toMatch(/죄송합니다.*도움드리기.*어려/);
    });

    it('should respond to pickleball technique questions (English)', async () => {
      const result = await aiService.processQuery('How do I improve my serve?', { language: 'en' });

      expect(result.filtered).toBeFalsy();
      expect(result.answer).not.toMatch(/sorry.*outside.*expertise/i);
    });

    it('피클볼 맥락이 있는 날씨 질문은 허용해야 함', async () => {
      const result = await aiService.processQuery('피클볼 치기 좋은 날씨는 어때야 해?', {
        language: 'ko',
      });

      // 피클볼 맥락이 있으므로 차단되지 않아야 함
      expect(result.filtered).toBeFalsy();
      expect(result.answer).not.toMatch(/죄송합니다.*도움드리기.*어려/);
    });
  });

  describe('🛡️ 방어벽 3: 출력 필터 (Output Filter)', () => {
    // Note: 출력 필터(Layer 3)는 실제 Gemini API 응답을 필터링합니다.
    // aiService가 singleton으로 생성될 때 API 키를 캐시하므로,
    // 단위 테스트에서 완벽하게 테스트하기 어렵습니다.
    // 아래 테스트들은 filterOutput 메소드의 로직을 직접 테스트합니다.

    it('filterOutput이 날씨 관련 응답을 감지해야 함', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filterResult = (aiService as any).filterOutput('오늘의 날씨는 맑고 화창합니다.', 'ko');
      expect(filterResult.filtered).toBe(true);
      expect(filterResult.fallbackResponse).toContain('🎾');
      expect(filterResult.fallbackResponse).toContain('피클볼');
    });

    it('filterOutput이 정치 관련 응답을 감지해야 함', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filterResult = (aiService as any).filterOutput('대통령 선거는 중요합니다.', 'ko');
      expect(filterResult.filtered).toBe(true);
      expect(filterResult.fallbackResponse).toContain('🎾');
    });

    it('filterOutput이 금융 관련 응답을 감지해야 함 (English)', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filterResult = (aiService as any).filterOutput('You should invest in Bitcoin.', 'en');
      expect(filterResult.filtered).toBe(true);
      expect(filterResult.fallbackResponse).toContain('🎾');
      expect(filterResult.fallbackResponse).toMatch(/pickleball/i);
    });

    it('filterOutput이 피클볼 관련 응답은 통과시켜야 함', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filterResult = (aiService as any).filterOutput(
        '포핸드 그립에는 여러 종류가 있습니다.',
        'ko'
      );
      expect(filterResult.filtered).toBe(false);
    });

    it('filterOutput이 영어 피클볼 응답은 통과시켜야 함', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filterResult = (aiService as any).filterOutput(
        'The serve is the most important shot in pickleball.',
        'en'
      );
      expect(filterResult.filtered).toBe(false);
    });
  });

  describe('📝 거절 응답 형식 검증', () => {
    it('거절 시 피클볼 이모지(🎾)를 포함해야 함', async () => {
      const result = await aiService.processQuery('정치에 대해 알려줘', { language: 'ko' });
      expect(result.answer).toContain('🎾');
    });

    it('거절 시 정중한 어조를 사용해야 함', async () => {
      const result = await aiService.processQuery('주식 투자 방법', { language: 'ko' });
      expect(result.answer).toMatch(/죄송|어려워/);
    });

    it('거절 시 피클볼 질문으로 유도해야 함', async () => {
      const result = await aiService.processQuery('맛집 추천해줘', { language: 'ko' });
      expect(result.answer).toMatch(/피클볼.*질문|물어/);
    });

    it('should use polite tone in rejection (English)', async () => {
      const result = await aiService.processQuery('Tell me about politics', { language: 'en' });
      expect(result.answer).toMatch(/sorry|cannot|unable/i);
      expect(result.answer).toMatch(/pickleball/i);
      expect(result.filtered).toBe(true);
    });
  });

  describe('🧪 Edge Cases', () => {
    it('빈 질문에 대한 처리', async () => {
      const result = await aiService.processQuery('', { language: 'ko' });

      expect(result.answer).toBeTruthy();
      expect(result.confidence).toBeDefined();
    });

    it('매우 긴 질문에 대한 처리', async () => {
      const longQuery = '피클볼 '.repeat(100) + '어떻게 쳐요?';
      const result = await aiService.processQuery(longQuery, { language: 'ko' });

      expect(result.answer).toBeTruthy();
      // 피클볼 관련 질문이므로 차단되지 않아야 함
      expect(result.filtered).toBeFalsy();
    });

    it('특수문자가 포함된 질문', async () => {
      const result = await aiService.processQuery('포핸드@#$%^&*()', { language: 'ko' });

      expect(result.answer).toBeTruthy();
    });

    it('혼합 언어 질문 (한영 섞임)', async () => {
      const result = await aiService.processQuery('How do I 포핸드를 improve?', { language: 'ko' });

      expect(result.answer).toBeTruthy();
      // 피클볼 관련 질문이므로 차단되지 않아야 함
      expect(result.filtered).toBeFalsy();
    });
  });

  describe('🔧 API 에러 처리', () => {
    it('API 실패 시 fallback 응답 반환', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await aiService.processQuery('포핸드 그립은?', { language: 'ko' });

      expect(result.answer).toBeTruthy();
      expect(result.confidence).toBeDefined();
    });

    it('API가 빈 응답 반환 시 처리', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ candidates: [] }),
      });

      const result = await aiService.processQuery('클럽 만들기', { language: 'ko' });

      expect(result.answer).toBeTruthy();
      expect(result.confidence).toBeDefined();
    });
  });

  describe('🤖 AI 컨시어지 온보딩 시스템', () => {
    describe('handleOnboardingAction', () => {
      it('클럽 가입하기 선택 시 올바른 응답과 네비게이션 명령 반환', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = (aiService as any).handleOnboardingAction('join_club', 'ko');

        expect(result.message).toContain('클럽');
        expect(result.command).toEqual({
          type: 'navigate',
          screen: 'Discover',
          params: { initialFilter: 'clubs' },
        });
        expect(result.nextHint).toBeTruthy();
      });

      it('플레이하기 선택 시 올바른 응답 반환', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = (aiService as any).handleOnboardingAction('find_match', 'ko');

        expect(result.message).toContain('매치');
        expect(result.command).toEqual({
          type: 'navigate',
          screen: 'Discover',
          params: { initialFilter: 'events' },
        });
        expect(result.nextHint).toBeTruthy();
      });

      it('모임 주최하기 선택 시 올바른 응답 반환', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = (aiService as any).handleOnboardingAction('host_event', 'ko');

        expect(result.message).toContain('모임');
        expect(result.command).toEqual({
          type: 'navigate',
          screen: 'Create',
        });
        expect(result.nextHint).toBeTruthy();
      });

      it('클럽 만들기 선택 시 올바른 응답 반환', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = (aiService as any).handleOnboardingAction('create_club', 'ko');

        expect(result.message).toContain('클럽');
        expect(result.command).toEqual({
          type: 'navigate',
          screen: 'CreateClub',
        });
        expect(result.nextHint).toBeTruthy();
      });

      it('파트너 찾기 선택 시 올바른 응답 반환', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = (aiService as any).handleOnboardingAction('find_partner', 'ko');

        expect(result.message).toContain('파트너');
        expect(result.command).toEqual({
          type: 'navigate',
          screen: 'Discover',
          params: { initialFilter: 'players' },
        });
        expect(result.nextHint).toBeTruthy();
      });

      it('레슨/코치 찾기 선택 시 올바른 응답 반환', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = (aiService as any).handleOnboardingAction('find_coach', 'ko');

        expect(result.message).toContain('코치');
        expect(result.command).toEqual({
          type: 'navigate',
          screen: 'Discover',
          params: { initialFilter: 'coaches' },
        });
        expect(result.nextHint).toBeTruthy();
      });

      it('패들/장비 서비스 선택 시 올바른 응답 반환', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = (aiService as any).handleOnboardingAction('paddle_service', 'ko');

        expect(result.message).toContain('장비');
        expect(result.command).toEqual({
          type: 'navigate',
          screen: 'Discover',
          params: { initialFilter: 'services' },
        });
        expect(result.nextHint).toBeTruthy();
      });

      it('영어 버전도 지원해야 함 - 클럽 가입', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = (aiService as any).handleOnboardingAction('join_club', 'en');

        expect(result.message).toMatch(/club/i);
        expect(result.command.screen).toBe('Discover');
        expect(result.nextHint).toBeTruthy();
      });

      it('영어 버전도 지원해야 함 - 플레이하기', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = (aiService as any).handleOnboardingAction('find_match', 'en');

        expect(result.message).toMatch(/match/i);
        expect(result.command.screen).toBe('Discover');
        expect(result.nextHint).toBeTruthy();
      });

      it('잘못된 액션 ID에 대해 에러 응답 반환', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = (aiService as any).handleOnboardingAction('invalid_action', 'ko');

        expect(result.message).toContain('죄송');
        expect(result.command).toBeNull();
        expect(result.nextHint).toBeNull();
      });

      it('언어가 지정되지 않으면 기본값 ko 사용', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = (aiService as any).handleOnboardingAction('find_match');

        expect(result.message).toContain('매치');
      });
    });

    describe('getOnboardingQuickReplies', () => {
      it('7개의 Quick Reply 옵션을 반환해야 함 (Korean)', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const replies = (aiService as any).getOnboardingQuickReplies('ko');

        expect(replies).toHaveLength(7);
        expect(replies[0]).toHaveProperty('id');
        expect(replies[0]).toHaveProperty('label');
        expect(replies[0]).toHaveProperty('icon');
      });

      it('7개의 Quick Reply 옵션을 반환해야 함 (English)', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const replies = (aiService as any).getOnboardingQuickReplies('en');

        expect(replies).toHaveLength(7);
        expect(replies[0]).toHaveProperty('id');
        expect(replies[0]).toHaveProperty('label');
        expect(replies[0]).toHaveProperty('icon');
      });

      it('모든 7대 핵심 목표를 포함해야 함', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const replies = (aiService as any).getOnboardingQuickReplies('ko');

        const actionIds = replies.map((r: { id: string }) => r.id);
        expect(actionIds).toContain('find_match');
        expect(actionIds).toContain('host_event');
        expect(actionIds).toContain('join_club');
        expect(actionIds).toContain('create_club');
        expect(actionIds).toContain('find_partner');
        expect(actionIds).toContain('find_coach');
        expect(actionIds).toContain('paddle_service');
      });

      it('각 옵션은 이모지 icon을 가져야 함', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const replies = (aiService as any).getOnboardingQuickReplies('ko');

        const validEmojis = ['🎾', '🙌', '🛡️', '👑', '🤝', '🎓', '🛠️'];
        replies.forEach((reply: { icon: string }) => {
          // icon 필드가 유효한 이모지인지 확인
          expect(validEmojis).toContain(reply.icon);
        });
      });
    });

    describe('getOnboardingWelcome', () => {
      it('사용자 이름을 포함한 환영 메시지 반환 (Korean)', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const message = (aiService as any).getOnboardingWelcome('퓨리', 'ko');

        expect(message).toContain('퓨리');
        expect(message).toContain('환영');
        expect(message).toContain('🎾');
      });

      it('사용자 이름을 포함한 환영 메시지 반환 (English)', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const message = (aiService as any).getOnboardingWelcome('Nick Fury', 'en');

        expect(message).toContain('Nick Fury');
        expect(message).toContain('Welcome');
        expect(message).toContain('🎾');
      });

      it('오늘 무엇을 할지 묻는 질문이 포함되어야 함 (Korean)', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const message = (aiService as any).getOnboardingWelcome('사용자', 'ko');

        expect(message).toMatch(/오늘.*먼저|무엇을.*해볼까/);
      });

      it('should ask what user wants to do (English)', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const message = (aiService as any).getOnboardingWelcome('User', 'en');

        expect(message).toMatch(/what.*first|what.*like to do/i);
      });
    });
  });

  describe('🧠 NLU Engine (Natural Language Understanding)', () => {
    describe('parseUserQueryToCommand', () => {
      describe('Event Search Commands', () => {
        it('should parse "오늘 저녁 복식 경기 찾아줘" into searchEvents command', async () => {
          // Mock Gemini API to return structured JSON
          (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: () =>
              Promise.resolve({
                candidates: [
                  {
                    content: {
                      parts: [
                        {
                          text: '{"command":"searchEvents","params":{"gameType":"doubles","timeRange":"evening","date":"today"},"confidence":0.95,"originalQuery":"오늘 저녁 복식 경기 찾아줘"}',
                        },
                      ],
                    },
                  },
                ],
              }),
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = await (aiService as any).parseUserQueryToCommand(
            '오늘 저녁 복식 경기 찾아줘',
            'ko'
          );

          expect(result.command).toBe('searchEvents');
          expect(result.params).toEqual({
            gameType: 'doubles',
            timeRange: 'evening',
            date: 'today',
          });
          expect(result.confidence).toBeGreaterThan(0.8);
          expect(result.originalQuery).toBe('오늘 저녁 복식 경기 찾아줘');
        });

        it('should parse "Find singles matches near me" into searchEvents command', async () => {
          (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: () =>
              Promise.resolve({
                candidates: [
                  {
                    content: {
                      parts: [
                        {
                          text: '{"command":"searchEvents","params":{"gameType":"singles","location":"nearby"},"confidence":0.92,"originalQuery":"Find singles matches near me"}',
                        },
                      ],
                    },
                  },
                ],
              }),
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = await (aiService as any).parseUserQueryToCommand(
            'Find singles matches near me',
            'en'
          );

          expect(result.command).toBe('searchEvents');
          expect(result.params).toEqual({
            gameType: 'singles',
            location: 'nearby',
          });
          expect(result.confidence).toBeGreaterThan(0.8);
        });

        it('should parse "내일 아침 초급자 매치 있어?" into searchEvents command', async () => {
          (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: () =>
              Promise.resolve({
                candidates: [
                  {
                    content: {
                      parts: [
                        {
                          text: '{"command":"searchEvents","params":{"date":"tomorrow","timeRange":"morning","skillLevel":"beginner"},"confidence":0.88,"originalQuery":"내일 아침 초급자 매치 있어?"}',
                        },
                      ],
                    },
                  },
                ],
              }),
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = await (aiService as any).parseUserQueryToCommand(
            '내일 아침 초급자 매치 있어?',
            'ko'
          );

          expect(result.command).toBe('searchEvents');
          expect(result.params.date).toBe('tomorrow');
          expect(result.params.timeRange).toBe('morning');
          expect(result.params.skillLevel).toBe('beginner');
        });
      });

      describe('Navigation Commands', () => {
        it('should parse "클럽 가입하고 싶어" into navigate command', async () => {
          (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: () =>
              Promise.resolve({
                candidates: [
                  {
                    content: {
                      parts: [
                        {
                          text: '{"command":"navigate","params":{"screen":"ClubDirectory"},"confidence":0.90,"originalQuery":"클럽 가입하고 싶어"}',
                        },
                      ],
                    },
                  },
                ],
              }),
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = await (aiService as any).parseUserQueryToCommand(
            '클럽 가입하고 싶어',
            'ko'
          );

          expect(result.command).toBe('navigate');
          expect(result.params.screen).toBe('ClubDirectory');
          expect(result.confidence).toBeGreaterThan(0.8);
        });

        it('should parse "Show me my profile" into navigate command', async () => {
          (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: () =>
              Promise.resolve({
                candidates: [
                  {
                    content: {
                      parts: [
                        {
                          text: '{"command":"navigate","params":{"screen":"MyProfile"},"confidence":0.95,"originalQuery":"Show me my profile"}',
                        },
                      ],
                    },
                  },
                ],
              }),
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = await (aiService as any).parseUserQueryToCommand(
            'Show me my profile',
            'en'
          );

          expect(result.command).toBe('navigate');
          expect(result.params.screen).toBe('MyProfile');
        });
      });

      describe('General Pickleball Questions', () => {
        it('should parse "서브 잘 넣는 방법 알려줘" into askQuestion command', async () => {
          (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: () =>
              Promise.resolve({
                candidates: [
                  {
                    content: {
                      parts: [
                        {
                          text: '{"command":"askQuestion","params":{"topic":"technique","subtopic":"serve"},"confidence":0.92,"originalQuery":"서브 잘 넣는 방법 알려줘"}',
                        },
                      ],
                    },
                  },
                ],
              }),
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = await (aiService as any).parseUserQueryToCommand(
            '서브 잘 넣는 방법 알려줘',
            'ko'
          );

          expect(result.command).toBe('askQuestion');
          expect(result.params.topic).toBe('technique');
          expect(result.params.subtopic).toBe('serve');
          expect(result.confidence).toBeGreaterThan(0.8);
        });

        it('should parse "What are pickleball rules?" into askQuestion command', async () => {
          (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: () =>
              Promise.resolve({
                candidates: [
                  {
                    content: {
                      parts: [
                        {
                          text: '{"command":"askQuestion","params":{"topic":"rules"},"confidence":0.90,"originalQuery":"What are pickleball rules?"}',
                        },
                      ],
                    },
                  },
                ],
              }),
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = await (aiService as any).parseUserQueryToCommand(
            'What are pickleball rules?',
            'en'
          );

          expect(result.command).toBe('askQuestion');
          expect(result.params.topic).toBe('rules');
        });
      });

      describe('Error Handling', () => {
        it('should return unknown command for unrecognized queries', async () => {
          (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: () =>
              Promise.resolve({
                candidates: [
                  {
                    content: {
                      parts: [
                        {
                          text: '{"command":"unknown","params":{},"confidence":0.2,"originalQuery":"피자 주문하고 싶어"}',
                        },
                      ],
                    },
                  },
                ],
              }),
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = await (aiService as any).parseUserQueryToCommand(
            '피자 주문하고 싶어',
            'ko'
          );

          expect(result.command).toBe('unknown');
          expect(result.confidence).toBeLessThan(0.5);
        });

        it('should handle API errors gracefully', async () => {
          (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = await (aiService as any).parseUserQueryToCommand(
            '오늘 저녁 복식 경기 찾아줘',
            'ko'
          );

          expect(result.command).toBe('unknown');
          expect(result.confidence).toBe(0);
          expect(result.error).toBeTruthy();
        });

        it('should handle malformed JSON response', async () => {
          (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: () =>
              Promise.resolve({
                candidates: [
                  {
                    content: {
                      parts: [
                        {
                          text: 'This is not valid JSON',
                        },
                      ],
                    },
                  },
                ],
              }),
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = await (aiService as any).parseUserQueryToCommand('클럽 찾기', 'ko');

          expect(result.command).toBe('unknown');
          expect(result.confidence).toBe(0);
        });

        it('should handle JSON wrapped in markdown code blocks', async () => {
          (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: () =>
              Promise.resolve({
                candidates: [
                  {
                    content: {
                      parts: [
                        {
                          text: '```json\n{"command":"navigate","params":{"screen":"ClubDirectory"},"confidence":0.90,"originalQuery":"클럽 찾기"}\n```',
                        },
                      ],
                    },
                  },
                ],
              }),
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = await (aiService as any).parseUserQueryToCommand('클럽 찾기', 'ko');

          expect(result.command).toBe('navigate');
          expect(result.params.screen).toBe('ClubDirectory');
        });
      });
    });

    describe('executeNLUCommand', () => {
      it('should execute searchEvents command', async () => {
        const command = {
          command: 'searchEvents',
          params: { gameType: 'doubles', timeRange: 'evening' },
          confidence: 0.95,
          originalQuery: '오늘 저녁 복식 경기',
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (aiService as any).executeNLUCommand(command);

        expect(result.type).toBe('search_result');
        expect(result.message).toContain('doubles');
      });

      it('should execute navigate command', async () => {
        const command = {
          command: 'navigate',
          params: { screen: 'ClubDirectory' },
          confidence: 0.9,
          originalQuery: '클럽 가입하고 싶어',
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (aiService as any).executeNLUCommand(command);

        expect(result.type).toBe('navigation');
        expect(result.screen).toBe('ClubDirectory');
        expect(result.message).toContain('ClubDirectory');
      });

      it('should execute askQuestion command', async () => {
        const command = {
          command: 'askQuestion',
          params: { topic: 'technique', subtopic: 'serve' },
          confidence: 0.92,
          originalQuery: '서브 잘 넣는 방법 알려줘',
        };

        // Mock processQuery for askQuestion
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              candidates: [
                {
                  content: {
                    parts: [
                      {
                        text: '서브를 잘 넣으려면 토스를 일정하게 하고, 패들 스윙을 부드럽게 해야 합니다.',
                      },
                    ],
                  },
                },
              ],
            }),
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (aiService as any).executeNLUCommand(command);

        expect(result.type).toBe('answer');
        expect(result.message).toBeTruthy();
      });

      it('should handle unknown command', async () => {
        const command = {
          command: 'unknown',
          params: {},
          confidence: 0.2,
          originalQuery: '피자 주문',
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (aiService as any).executeNLUCommand(command);

        expect(result.type).toBe('fallback');
        expect(result.message).toContain('질문을 이해하지 못했어요');
      });
    });
  });

  describe('📚 AI 지식 검증 테스트 (Operation Chronicle Phase 3)', () => {
    /**
     * Operation Chronicle: AI 재교육 졸업 시험
     *
     * 목표: USER_MANUAL_V2.md에 정의된 핵심 지식이 시스템 프롬프트에 올바르게 포함되었는지 검증
     *
     * 검증 방법:
     * generateSystemPrompt() 메소드가 반환하는 시스템 프롬프트의 내용을 직접 검증합니다.
     * 이 방식은 AI가 올바른 지식을 "가르침 받았는지"를 확인하는 가장 정확한 방법입니다.
     *
     * 핵심 검증 항목:
     * 1. 복식 NTRP ±0.5 허용 범위
     * 2. ELO "분리 독립" 모델
     * 3. 게시 제한 정책 (3/일, 5/총)
     * 4. K-Factor 정책
     * 5. ELO 재경기 제한 (4개월)
     * 6. 앱 구조 (5개 탭)
     */

    describe('시스템 프롬프트 - 한국어 버전', () => {
      const systemPromptKo = SYSTEM_PROMPT.ko;

      it('복식 NTRP ±0.5 허용 범위 정보가 포함되어야 함', () => {
        // 핵심 지식: 복식 참가 시 팀 평균 NTRP가 ±0.5 범위 내
        expect(systemPromptKo).toMatch(/±0\.5|0\.5.*범위/);
        expect(systemPromptKo).toMatch(/NTRP/i);
        expect(systemPromptKo).toMatch(/복식|doubles/i);
      });

      it('ELO "분리 독립" 모델 정보가 포함되어야 함', () => {
        // 핵심 지식: 클럽 ELO와 전체 ELO는 분리 독립
        expect(systemPromptKo).toMatch(/분리.*독립|Separation.*Independence/i);
        expect(systemPromptKo).toMatch(/클럽.*ELO|Club.*ELO/i);
        expect(systemPromptKo).toMatch(/전체.*ELO|Global.*ELO/i);
      });

      it('게시 제한 정책 (3/일, 5/총) 정보가 포함되어야 함', () => {
        // 핵심 지식: 하루 3개, 총 5개 제한
        expect(systemPromptKo).toMatch(/3개|3.*하루|하루.*3|3.*per.*day/i);
        expect(systemPromptKo).toMatch(/5개|최대.*5|5.*총|5.*max|5.*total/i);
      });

      it('K-Factor 정책 정보가 포함되어야 함', () => {
        // 핵심 지식: K값 - 리그(16), 토너먼트(24/32)
        expect(systemPromptKo).toMatch(/K.*Factor|K-Factor|K값/i);
        expect(systemPromptKo).toMatch(/16/);
        expect(systemPromptKo).toMatch(/24/);
        expect(systemPromptKo).toMatch(/32/);
      });

      it('ELO 재경기 제한 (4개월) 정보가 포함되어야 함', () => {
        // 핵심 지식: 동일 상대 4개월에 1회만 ELO 반영
        expect(systemPromptKo).toMatch(/4개월|4.*month|four.*month/i);
        expect(systemPromptKo).toMatch(/친선.*경기|friendly.*match/i);
      });

      it('앱 구조 (5개 탭) 정보가 포함되어야 함', () => {
        // 핵심 지식: 5개 메인 탭
        expect(systemPromptKo).toMatch(/5개.*탭|5.*tab|five.*tab/i);
        expect(systemPromptKo).toMatch(/이벤트|Event/i);
        expect(systemPromptKo).toMatch(/탐색|Discover/i);
        expect(systemPromptKo).toMatch(/생성|Create/i);
      });

      it('번개 매치 vs 번개 모임 차이 정보가 포함되어야 함', () => {
        // 핵심 지식: 매치는 ELO 반영, 모임은 소셜
        expect(systemPromptKo).toMatch(/번개.*매치|Lightning.*Match/i);
        expect(systemPromptKo).toMatch(/번개.*모임|Lightning.*Meetup|Social/i);
      });

      it('복식 솔로/팀 참가 방식 정보가 포함되어야 함', () => {
        // 핵심 지식: 솔로 참가 또는 팀 참가 가능
        expect(systemPromptKo).toMatch(/솔로.*참가|solo/i);
        expect(systemPromptKo).toMatch(/팀.*참가|team/i);
      });

      it('1:1 채팅 연락 방식 정보가 포함되어야 함', () => {
        // 핵심 지식: 연락은 1:1 채팅으로만
        expect(systemPromptKo).toMatch(/1:1.*채팅|1:1.*chat|direct.*chat|private.*chat/i);
      });
    });

    describe('시스템 프롬프트 - 영어 버전', () => {
      const systemPromptEn = SYSTEM_PROMPT.en;

      it('should include NTRP ±0.5 doubles requirement', () => {
        expect(systemPromptEn).toMatch(/±0\.5|0\.5.*range/i);
        expect(systemPromptEn).toMatch(/NTRP/i);
        expect(systemPromptEn).toMatch(/doubles/i);
      });

      it('should include "Separation of Independence" ELO model', () => {
        expect(systemPromptEn).toMatch(/Separation.*Independence/i);
        expect(systemPromptEn).toMatch(/Club.*ELO/i);
        expect(systemPromptEn).toMatch(/Global.*ELO/i);
      });

      it('should include posting limits (3/day, 5/total)', () => {
        expect(systemPromptEn).toMatch(/3.*per.*day|3.*day/i);
        expect(systemPromptEn).toMatch(/5.*max|5.*total|maximum.*5/i);
      });

      it('should include K-Factor policy', () => {
        expect(systemPromptEn).toMatch(/K.*Factor|K-Factor/i);
        expect(systemPromptEn).toMatch(/16/);
        expect(systemPromptEn).toMatch(/24/);
        expect(systemPromptEn).toMatch(/32/);
      });

      it('should include 4-month rematch restriction', () => {
        expect(systemPromptEn).toMatch(/4.*month|four.*month/i);
        expect(systemPromptEn).toMatch(/friendly|no.*ELO/i);
      });

      it('should include app structure (5 tabs)', () => {
        expect(systemPromptEn).toMatch(/5.*tab|five.*tab/i);
        expect(systemPromptEn).toMatch(/Event/i);
        expect(systemPromptEn).toMatch(/Discover/i);
        expect(systemPromptEn).toMatch(/Create/i);
      });

      it('should include Match vs Meetup difference', () => {
        expect(systemPromptEn).toMatch(/Match.*ELO|ranked.*match/i);
        expect(systemPromptEn).toMatch(/Meetup|Social/i);
      });

      it('should include solo/team doubles participation', () => {
        expect(systemPromptEn).toMatch(/solo/i);
        expect(systemPromptEn).toMatch(/team/i);
      });

      it('should include 1:1 chat contact method', () => {
        expect(systemPromptEn).toMatch(/1:1.*chat|direct.*chat|private.*chat|in-app.*chat/i);
      });
    });

    describe('시스템 프롬프트 - FAQ 정보 포함 여부', () => {
      const systemPromptKo = SYSTEM_PROMPT.ko;

      it('솔로 복식 참가 FAQ 정보가 포함되어야 함', () => {
        // FAQ: "복식 경기에 솔로로 참가할 수 있나요?"
        expect(systemPromptKo).toMatch(/솔로.*참가.*가능|solo.*possible/i);
      });

      it('클럽 ELO 영향 FAQ 정보가 포함되어야 함', () => {
        // FAQ: "클럽 경기가 제 전체 ELO에 영향을 주나요?"
        expect(systemPromptKo).toMatch(/클럽.*경기.*영향|club.*match.*affect/i);
      });

      it('재경기 ELO 반영 FAQ 정보가 포함되어야 함', () => {
        // FAQ: "같은 상대와 여러 번 경기해도 ELO가 반영되나요?"
        expect(systemPromptKo).toMatch(/4개월|재경기|rematch/i);
      });

      it('게시글 개수 FAQ 정보가 포함되어야 함', () => {
        // FAQ: "코치/서비스 게시글은 몇 개까지 올릴 수 있나요?"
        expect(systemPromptKo).toMatch(/3개|5개|limit/i);
      });
    });
  });
});
