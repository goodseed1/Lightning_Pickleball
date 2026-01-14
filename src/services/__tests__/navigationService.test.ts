/**
 * NavigationService 단위 테스트
 */

import { navigationRef, isNavigationReady, executeAICommand } from '../navigationService';

// Mock @react-navigation/native
jest.mock('@react-navigation/native', () => ({
  createNavigationContainerRef: jest.fn(() => ({
    isReady: jest.fn().mockReturnValue(true),
    navigate: jest.fn(),
    dispatch: jest.fn(),
    goBack: jest.fn(),
    canGoBack: jest.fn().mockReturnValue(true),
    getCurrentRoute: jest.fn().mockReturnValue({ name: 'Feed' }),
  })),
  CommonActions: {
    navigate: jest.fn(params => ({ type: 'NAVIGATE', payload: params })),
    reset: jest.fn(params => ({ type: 'RESET', payload: params })),
  },
  StackActions: {
    push: jest.fn((name, params) => ({ type: 'PUSH', payload: { name, params } })),
    replace: jest.fn((name, params) => ({ type: 'REPLACE', payload: { name, params } })),
  },
}));

describe('navigationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isNavigationReady', () => {
    it('네비게이션 준비 상태를 반환해야 함', () => {
      const ready = isNavigationReady();
      expect(typeof ready).toBe('boolean');
    });
  });

  describe('executeAICommand', () => {
    it('navigate 명령을 처리해야 함', () => {
      const result = executeAICommand({
        type: 'navigate',
        screen: 'Discover',
        params: { initialFilter: 'clubs' },
      });
      expect(result).toBe(true);
      expect(navigationRef.dispatch).toHaveBeenCalled();
    });

    it('탭 네비게이션 명령을 처리해야 함', () => {
      const result = executeAICommand({
        type: 'navigate',
        screen: 'Feed',
      });
      expect(result).toBe(true);
      expect(navigationRef.dispatch).toHaveBeenCalled();
    });

    it('goBack 명령을 처리해야 함', () => {
      const result = executeAICommand({ type: 'goBack' });
      expect(result).toBe(true);
      expect(navigationRef.canGoBack).toHaveBeenCalled();
      expect(navigationRef.goBack).toHaveBeenCalled();
    });

    it('알 수 없는 명령 타입은 false 반환', () => {
      const result = executeAICommand({ type: 'unknown' as never });
      expect(result).toBe(false);
    });

    it('screen 없는 navigate 명령은 처리하지만 네비게이션 안함', () => {
      const result = executeAICommand({ type: 'navigate' });
      expect(result).toBe(true);
      expect(navigationRef.navigate).not.toHaveBeenCalled();
      expect(navigationRef.dispatch).not.toHaveBeenCalled();
    });

    it('reset 명령을 처리해야 함', () => {
      const result = executeAICommand({
        type: 'reset',
        screen: 'Feed',
      });
      expect(result).toBe(true);
      expect(navigationRef.dispatch).toHaveBeenCalled();
    });
  });

  describe('AI 온보딩 시나리오', () => {
    it('클럽 가입 명령을 올바르게 처리해야 함', () => {
      const result = executeAICommand({
        type: 'navigate',
        screen: 'Discover',
        params: { initialFilter: 'clubs' },
      });
      expect(result).toBe(true);
      expect(navigationRef.dispatch).toHaveBeenCalled();
    });

    it('클럽 생성 명령을 올바르게 처리해야 함', () => {
      const result = executeAICommand({
        type: 'navigate',
        screen: 'CreateClub',
      });
      expect(result).toBe(true);
      expect(navigationRef.navigate).toHaveBeenCalled();
    });

    it('이벤트 생성 명령을 올바르게 처리해야 함', () => {
      const result = executeAICommand({
        type: 'navigate',
        screen: 'Create',
      });
      expect(result).toBe(true);
      expect(navigationRef.dispatch).toHaveBeenCalled();
    });

    it('Discover 탭으로 필터와 함께 이동', () => {
      const result = executeAICommand({
        type: 'navigate',
        screen: 'Discover',
        params: { initialFilter: 'events' },
      });
      expect(result).toBe(true);
      expect(navigationRef.dispatch).toHaveBeenCalled();
    });

    it('MyClubs 탭으로 이동', () => {
      const result = executeAICommand({
        type: 'navigate',
        screen: 'MyClubs',
      });
      expect(result).toBe(true);
      expect(navigationRef.dispatch).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('네비게이션이 준비되지 않았을 때 false 반환', () => {
      // Mock navigationRef.isReady to return false
      (navigationRef.isReady as jest.Mock).mockReturnValueOnce(false);

      const result = executeAICommand({
        type: 'navigate',
        screen: 'Feed',
      });
      expect(result).toBe(false);
    });

    it('에러 발생 시 false 반환', () => {
      // Mock navigationRef.dispatch to throw error
      (navigationRef.dispatch as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Navigation error');
      });

      const result = executeAICommand({
        type: 'navigate',
        screen: 'Feed',
      });
      expect(result).toBe(false);
    });
  });
});
