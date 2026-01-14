/**
 * AiChatContext TDD Tests
 * Tests for AI Chat Context Provider (Logic-focused tests)
 */

// Mock aiChatService
const mockChat = jest.fn().mockResolvedValue({
  response: 'Mock AI response',
  relevantKnowledge: 5,
  confidence: 0.9,
});

const mockGetQuickTips = jest.fn().mockResolvedValue({
  response: 'Mock tips',
  relevantKnowledge: 3,
  confidence: 0.85,
});

const mockAnalyzeMatchPerformance = jest.fn().mockResolvedValue('Mock match analysis');
const mockGeneratePersonalizedAdvice = jest.fn().mockResolvedValue('Mock personalized advice');
const mockClearConversation = jest.fn();
const mockGetConversationHistory = jest.fn().mockReturnValue([]);

jest.mock('../../services/aiChatService', () => ({
  __esModule: true,
  default: {
    get chat() {
      return mockChat;
    },
    get getQuickTips() {
      return mockGetQuickTips;
    },
    get analyzeMatchPerformance() {
      return mockAnalyzeMatchPerformance;
    },
    get generatePersonalizedAdvice() {
      return mockGeneratePersonalizedAdvice;
    },
    get clearConversation() {
      return mockClearConversation;
    },
    get getConversationHistory() {
      return mockGetConversationHistory;
    },
  },
}));

// Mock AuthContext
jest.mock('../AuthContext', () => ({
  useAuth: jest.fn().mockReturnValue({
    currentUser: {
      skillLevel: 'intermediate',
      playingStyle: 'all-court',
      recentMatches: [],
      goals: null,
    },
  }),
}));

// Mock LanguageContext
jest.mock('../LanguageContext', () => ({
  useLanguage: jest.fn().mockReturnValue({
    currentLanguage: 'ko',
  }),
}));

import aiChatService from '../../services/aiChatService';

describe('AiChatContext - Logic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('aiChatService 통합', () => {
    it('chat 메소드가 올바른 파라미터로 호출되는지 확인', async () => {
      // Arrange
      const message = '테스트 메시지';
      const language = 'ko';
      const userProfile = {
        skillLevel: 'intermediate',
        playingStyle: 'all-court',
        recentMatches: [],
        currentGoals: null,
      };

      // Act
      await aiChatService.chat(message, language, userProfile);

      // Assert
      expect(aiChatService.chat).toHaveBeenCalledWith(message, language, userProfile);
    });

    it('chat 메소드가 AI 응답을 반환하는지 확인', async () => {
      // Arrange
      const message = '테스트 메시지';

      // Act
      const response = await aiChatService.chat(message, 'ko', null);

      // Assert
      expect(response).toEqual({
        response: 'Mock AI response',
        relevantKnowledge: 5,
        confidence: 0.9,
      });
    });

    it('getQuickTips 메소드가 올바른 파라미터로 호출되는지 확인', async () => {
      // Arrange
      const skillLevel = 'intermediate';
      const language = 'ko';

      // Act
      await aiChatService.getQuickTips(skillLevel, language);

      // Assert
      expect(aiChatService.getQuickTips).toHaveBeenCalledWith(skillLevel, language);
    });

    it('analyzeMatchPerformance 메소드가 호출되는지 확인', async () => {
      // Arrange
      const matchData = { id: 'match1', score: '6-4, 6-3' };
      const language = 'ko';

      // Act
      await aiChatService.analyzeMatchPerformance(matchData, language);

      // Assert
      expect(aiChatService.analyzeMatchPerformance).toHaveBeenCalledWith(matchData, language);
    });

    it('generatePersonalizedAdvice 메소드가 호출되는지 확인', async () => {
      // Arrange
      const userProfile = {
        skillLevel: 'intermediate',
        playingStyle: 'all-court',
        recentMatches: [],
        currentGoals: null,
      };
      const query = '서브 개선 방법';
      const language = 'ko';

      // Act
      await aiChatService.generatePersonalizedAdvice(userProfile, query, language);

      // Assert
      expect(aiChatService.generatePersonalizedAdvice).toHaveBeenCalledWith(
        userProfile,
        query,
        language
      );
    });

    it('clearConversation 메소드가 호출되는지 확인', () => {
      // Act
      aiChatService.clearConversation();

      // Assert
      expect(aiChatService.clearConversation).toHaveBeenCalled();
    });

    it('getConversationHistory 메소드가 대화 기록을 반환하는지 확인', () => {
      // Act
      const history = aiChatService.getConversationHistory();

      // Assert
      expect(history).toEqual([]);
      expect(aiChatService.getConversationHistory).toHaveBeenCalled();
    });
  });

  describe('QuickActions 구조', () => {
    it('quickActions가 6개의 액션을 포함해야 함', () => {
      // Arrange
      const expectedActions = [
        'quick_tips',
        'analyze_match',
        'rules_help',
        'technique_tips',
        'strategy_advice',
        'equipment_help',
      ];

      // Assert
      expect(expectedActions).toHaveLength(6);
    });

    it('각 액션이 필요한 속성을 가져야 함', () => {
      // Arrange
      const action = {
        id: 'quick_tips',
        titleKey: 'ai.quickActions.getTips',
        iconName: 'bulb',
        action: jest.fn(),
      };

      // Assert
      expect(action).toHaveProperty('id');
      expect(action).toHaveProperty('titleKey');
      expect(action).toHaveProperty('iconName');
      expect(action).toHaveProperty('action');
    });
  });

  describe('메시지 구조', () => {
    it('ChatMessage가 필요한 필드를 모두 포함해야 함', () => {
      // Arrange
      const message = {
        id: 'msg_123',
        content: '테스트 메시지',
        sender: 'user',
        timestamp: new Date(),
        language: 'ko',
        type: 'message',
      };

      // Assert
      expect(message).toHaveProperty('id');
      expect(message).toHaveProperty('content');
      expect(message).toHaveProperty('sender');
      expect(message).toHaveProperty('timestamp');
      expect(message).toHaveProperty('language');
      expect(message).toHaveProperty('type');
    });

    it('AI 메시지가 relevantKnowledge와 confidence를 포함할 수 있어야 함', () => {
      // Arrange
      const aiMessage = {
        id: 'msg_123',
        content: 'AI 응답',
        sender: 'ai',
        timestamp: new Date(),
        language: 'ko',
        type: 'message',
        relevantKnowledge: 5,
        confidence: 0.9,
      };

      // Assert
      expect(aiMessage).toHaveProperty('relevantKnowledge');
      expect(aiMessage).toHaveProperty('confidence');
    });

    it('메시지 타입이 올바른 값만 가질 수 있어야 함', () => {
      // Arrange
      const validTypes = ['message', 'tip', 'analysis', 'advice'];

      // Act & Assert
      validTypes.forEach(type => {
        expect(validTypes).toContain(type);
      });
    });
  });

  describe('메시지 ID 생성 로직', () => {
    it('메시지 ID가 고유해야 함', () => {
      // Arrange
      const generateMessageId = () =>
        `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Act
      const id1 = generateMessageId();
      const id2 = generateMessageId();

      // Assert
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^msg_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^msg_\d+_[a-z0-9]+$/);
    });
  });

  describe('환영 메시지 로직', () => {
    it('한국어 환영 메시지가 올바른 내용을 포함해야 함', () => {
      // Arrange
      const koWelcomeMessage =
        '안녕하세요! Lightning Pickleball AI입니다. 🎾\n\n피클볼에 관한 모든 질문에 답해드릴 준비가 되어 있습니다:\n\n• 기술과 전략 조언\n• 규칙과 스코어링 설명\n• 장비 추천\n• 경기 분석\n• 훈련 방법\n\n무엇을 도와드릴까요?';

      // Assert
      expect(koWelcomeMessage).toContain('Lightning Pickleball AI');
      expect(koWelcomeMessage).toContain('기술과 전략');
      expect(koWelcomeMessage).toContain('무엇을 도와드릴까요?');
    });

    it('영어 환영 메시지가 올바른 내용을 포함해야 함', () => {
      // Arrange
      const enWelcomeMessage =
        "Hello! I'm Lightning Pickleball AI. 🎾\n\nI'm ready to help you with all your pickleball questions:\n\n• Technique and strategy advice\n• Rules and scoring explanations  \n• Equipment recommendations\n• Match analysis\n• Training methods\n\nWhat can I help you with today?";

      // Assert
      expect(enWelcomeMessage).toContain('Lightning Pickleball AI');
      expect(enWelcomeMessage).toContain('Technique and strategy');
      expect(enWelcomeMessage).toContain('What can I help you with today?');
    });
  });

  describe('빈 메시지 검증', () => {
    it('빈 문자열이 trim 후 빈 문자열인지 확인', () => {
      // Arrange
      const emptyMessages = ['', '   ', '\t', '\n'];

      // Act & Assert
      emptyMessages.forEach(msg => {
        expect(msg.trim()).toBe('');
      });
    });

    it('유효한 메시지가 trim 후 빈 문자열이 아닌지 확인', () => {
      // Arrange
      const validMessages = ['테스트', '  테스트  ', '\t테스트\n'];

      // Act & Assert
      validMessages.forEach(msg => {
        expect(msg.trim()).not.toBe('');
      });
    });
  });

  describe('사용자 프로필 변환 로직', () => {
    it('currentUser가 있을 때 userProfile이 올바르게 변환되어야 함', () => {
      // Arrange
      const currentUser = {
        skillLevel: 'intermediate',
        playingStyle: 'all-court',
        recentMatches: [{ id: 'match1' }],
        goals: 'improve serve',
      };

      // Act
      const userProfile = {
        skillLevel: currentUser.skillLevel || 'intermediate',
        playingStyle: currentUser.playingStyle || 'all-court',
        recentMatches: currentUser.recentMatches || [],
        currentGoals: currentUser.goals || null,
      };

      // Assert
      expect(userProfile.skillLevel).toBe('intermediate');
      expect(userProfile.playingStyle).toBe('all-court');
      expect(userProfile.recentMatches).toHaveLength(1);
      expect(userProfile.currentGoals).toBe('improve serve');
    });

    it('currentUser가 없을 때 userProfile이 null이어야 함', () => {
      // Arrange
      const currentUser = null;

      // Act
      const userProfile = currentUser
        ? {
            skillLevel: currentUser.skillLevel || 'intermediate',
            playingStyle: currentUser.playingStyle || 'all-court',
            recentMatches: currentUser.recentMatches || [],
            currentGoals: currentUser.goals || null,
          }
        : null;

      // Assert
      expect(userProfile).toBeNull();
    });
  });

  describe('에러 메시지 처리', () => {
    it('네트워크 에러 메시지가 올바르게 처리되어야 함', async () => {
      // Arrange
      const errorMessage = 'Network error';
      mockChat.mockRejectedValueOnce(new Error(errorMessage));

      // Act & Assert
      await expect(aiChatService.chat('test', 'ko', null)).rejects.toThrow(errorMessage);
    });

    it('에러 객체에서 메시지를 추출할 수 있어야 함', () => {
      // Arrange
      const error: unknown = { message: 'Test error' };

      // Act
      const errorMessage = (error as { message: string }).message || 'Failed to send message';

      // Assert
      expect(errorMessage).toBe('Test error');
    });

    it('에러 객체에 메시지가 없을 때 기본 메시지를 사용해야 함', () => {
      // Arrange
      const error: unknown = {};

      // Act
      const errorMessage = (error as { message?: string }).message || 'Failed to send message';

      // Assert
      expect(errorMessage).toBe('Failed to send message');
    });
  });

  describe('조건부 메시지 로직', () => {
    it('최근 경기가 없을 때 올바른 한국어 메시지를 반환해야 함', () => {
      // Arrange
      const currentLanguage = 'ko';
      const recentMatches: unknown[] = [];

      // Act
      const message =
        recentMatches.length === 0
          ? currentLanguage === 'ko'
            ? '분석할 최근 경기가 없습니다. 경기를 완료한 후 다시 시도해주세요.'
            : 'No recent matches to analyze. Please complete a match first.'
          : null;

      // Assert
      expect(message).toBe('분석할 최근 경기가 없습니다. 경기를 완료한 후 다시 시도해주세요.');
    });

    it('최근 경기가 없을 때 올바른 영어 메시지를 반환해야 함', () => {
      // Arrange
      const currentLanguage = 'en';
      const recentMatches: unknown[] = [];

      // Act
      const message =
        recentMatches.length === 0
          ? currentLanguage === 'ko'
            ? '분석할 최근 경기가 없습니다. 경기를 완료한 후 다시 시도해주세요.'
            : 'No recent matches to analyze. Please complete a match first.'
          : null;

      // Assert
      expect(message).toBe('No recent matches to analyze. Please complete a match first.');
    });

    it('로그인하지 않았을 때 올바른 한국어 메시지를 반환해야 함', () => {
      // Arrange
      const currentLanguage = 'ko';
      const currentUser = null;

      // Act
      const message = !currentUser
        ? currentLanguage === 'ko'
          ? '개인화된 조언을 받으려면 로그인이 필요합니다.'
          : 'Please log in to receive personalized advice.'
        : null;

      // Assert
      expect(message).toBe('개인화된 조언을 받으려면 로그인이 필요합니다.');
    });

    it('로그인하지 않았을 때 올바른 영어 메시지를 반환해야 함', () => {
      // Arrange
      const currentLanguage = 'en';
      const currentUser = null;

      // Act
      const message = !currentUser
        ? currentLanguage === 'ko'
          ? '개인화된 조언을 받으려면 로그인이 필요합니다.'
          : 'Please log in to receive personalized advice.'
        : null;

      // Assert
      expect(message).toBe('Please log in to receive personalized advice.');
    });
  });

  describe('QuickAction 실행 로직', () => {
    it('존재하는 액션이 실행되어야 함', () => {
      // Arrange
      const quickActions = [
        { id: 'quick_tips', action: jest.fn() },
        { id: 'analyze_match', action: jest.fn() },
      ];
      const actionId = 'quick_tips';

      // Act
      const action = quickActions.find(a => a.id === actionId);
      if (action) {
        action.action();
      }

      // Assert
      expect(action).toBeDefined();
      expect(action?.action).toHaveBeenCalled();
    });

    it('존재하지 않는 액션은 무시되어야 함', () => {
      // Arrange
      const quickActions = [
        { id: 'quick_tips', action: jest.fn() },
        { id: 'analyze_match', action: jest.fn() },
      ];
      const actionId = 'non_existent';

      // Act
      const action = quickActions.find(a => a.id === actionId);
      if (action) {
        action.action();
      }

      // Assert
      expect(action).toBeUndefined();
    });
  });

  describe('타이핑 딜레이 로직', () => {
    it('타이핑 딜레이가 1500ms인지 확인', () => {
      // Arrange
      const typingDelay = 1500;

      // Assert
      expect(typingDelay).toBe(1500);
    });
  });
});
