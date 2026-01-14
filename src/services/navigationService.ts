/**
 * NavigationService - 중앙화된 네비게이션 서비스
 * AI 서비스 등 앱 어디서든 네비게이션을 제어할 수 있게 해줌
 */

import {
  createNavigationContainerRef,
  CommonActions,
  StackActions,
} from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';

// Navigation container ref (App.tsx에서 설정)
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * 네비게이션이 준비되었는지 확인
 */
export function isNavigationReady(): boolean {
  return navigationRef.isReady();
}

/**
 * 특정 화면으로 이동
 * @param name 화면 이름
 * @param params 화면 파라미터
 */
export function navigate<T extends keyof RootStackParamList>(
  name: T,
  params?: RootStackParamList[T]
): void {
  if (navigationRef.isReady()) {
    // @ts-expect-error - params type is complex
    navigationRef.navigate(name, params);
  } else {
    console.warn('Navigation is not ready yet');
  }
}

/**
 * 메인 탭의 특정 탭으로 이동
 * @param tabName 탭 이름 (Feed, Discover, Create, MyClubs, MyProfile)
 * @param params 추가 파라미터
 */
export function navigateToTab(
  tabName: 'Feed' | 'Discover' | 'Create' | 'MyClubs' | 'MyProfile',
  params?: Record<string, unknown>
): void {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.navigate({
        name: 'MainTabs',
        params: {
          screen: tabName,
          params: params,
        },
      })
    );
  } else {
    console.warn('Navigation is not ready yet');
  }
}

/**
 * 뒤로 가기
 */
export function goBack(): void {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}

/**
 * 네비게이션 스택 리셋
 * @param routes 새로운 라우트 배열
 */
export function reset(routes: { name: keyof RootStackParamList; params?: object }[]): void {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.reset({
        index: routes.length - 1,
        routes: routes.map(route => ({
          name: route.name as string,
          params: route.params as object | undefined,
        })),
      })
    );
  }
}

/**
 * 스택에 새 화면 푸시
 * @param name 화면 이름
 * @param params 화면 파라미터
 */
export function push<T extends keyof RootStackParamList>(
  name: T,
  params?: RootStackParamList[T]
): void {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(StackActions.push(name as string, params));
  }
}

/**
 * 현재 화면 교체
 * @param name 화면 이름
 * @param params 화면 파라미터
 */
export function replace<T extends keyof RootStackParamList>(
  name: T,
  params?: RootStackParamList[T]
): void {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(StackActions.replace(name as string, params));
  }
}

/**
 * 현재 라우트 정보 가져오기
 */
export function getCurrentRoute(): string | undefined {
  if (navigationRef.isReady()) {
    return navigationRef.getCurrentRoute()?.name;
  }
  return undefined;
}

/**
 * AI 명령 실행 (aiService에서 사용)
 * @param command AI 네비게이션 명령 객체
 * @returns 실행 성공 여부
 */
export function executeAICommand(command: {
  type: 'navigate' | 'goBack' | 'reset';
  screen?: string;
  params?: Record<string, unknown>;
}): boolean {
  if (!navigationRef.isReady()) {
    console.warn('Navigation is not ready for AI command');
    return false;
  }

  try {
    console.log('🤖 Executing AI navigation command:', command);

    switch (command.type) {
      case 'navigate':
        if (command.screen) {
          // 탭 이름인지 확인
          const tabNames = ['Feed', 'Discover', 'Create', 'MyClubs', 'MyProfile'];
          if (tabNames.includes(command.screen)) {
            navigateToTab(
              command.screen as 'Feed' | 'Discover' | 'Create' | 'MyClubs' | 'MyProfile',
              command.params
            );
          } else {
            navigate(command.screen as keyof RootStackParamList, command.params as never);
          }
          console.log(`✅ Navigated to ${command.screen}`);
        }
        break;
      case 'goBack':
        goBack();
        console.log('✅ Navigated back');
        break;
      case 'reset':
        if (command.screen) {
          reset([{ name: command.screen as keyof RootStackParamList, params: command.params }]);
          console.log(`✅ Reset navigation to ${command.screen}`);
        }
        break;
      default:
        console.warn('Unknown AI command type:', command.type);
        return false;
    }
    return true;
  } catch (error) {
    console.error('Error executing AI command:', error);
    return false;
  }
}

// Default export for convenience
const navigationService = {
  navigationRef,
  isNavigationReady,
  navigate,
  navigateToTab,
  goBack,
  reset,
  push,
  replace,
  getCurrentRoute,
  executeAICommand,
};

export default navigationService;
