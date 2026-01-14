import { Dimensions } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import GuideOverlay from './GuideOverlay';

const { width, height } = Dimensions.get('window');

const meta: Meta<typeof GuideOverlay> = {
  title: 'AI/GuideOverlay',
  component: GuideOverlay,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 스토리: 기본 가이드 (하단 중앙)
export const Default: Story = {
  args: {
    visible: true,
    message:
      '안녕하세요! Lightning Tennis에 오신 것을 환영합니다. 이제 첫 번째 단계를 시작해볼까요?',
    showCloseButton: true,
    onClose: () => console.log('닫기'),
  },
};

// 스토리: 특정 영역 하이라이트 (상단 버튼)
export const HighlightTopButton: Story = {
  args: {
    visible: true,
    message: '이 버튼을 눌러서 새로운 매치를 만들어보세요!',
    targetArea: {
      x: width / 2 - 60,
      y: 100,
      width: 120,
      height: 48,
    },
    tooltipPosition: 'bottom',
    showCloseButton: true,
    nextButtonText: '알겠어요!',
    onNext: () => console.log('다음'),
    stepIndicator: '1/3',
  },
};

// 스토리: 하단 네비게이션 탭 하이라이트
export const HighlightBottomTab: Story = {
  args: {
    visible: true,
    message: '여기서 주변의 클럽을 찾아볼 수 있어요. 탐색 탭을 눌러보세요!',
    targetArea: {
      x: width / 5 - 30,
      y: height - 80,
      width: 60,
      height: 60,
    },
    tooltipPosition: 'top',
    showCloseButton: true,
    nextButtonText: '이동하기',
    onNext: () => console.log('탐색으로 이동'),
  },
};

// 스토리: 단계별 가이드 (Step indicator)
export const WithStepIndicator: Story = {
  args: {
    visible: true,
    message: '프로필 사진을 설정하면 다른 플레이어들이 회원님을 더 쉽게 알아볼 수 있어요.',
    targetArea: {
      x: 20,
      y: 120,
      width: 80,
      height: 80,
    },
    tooltipPosition: 'right',
    showCloseButton: false,
    nextButtonText: '다음 단계',
    onNext: () => console.log('다음 단계'),
    stepIndicator: '2/5',
  },
};

// 스토리: 왼쪽 위치 툴팁
export const TooltipLeft: Story = {
  args: {
    visible: true,
    message: '여기서 알림을 확인할 수 있어요.',
    targetArea: {
      x: width - 60,
      y: 50,
      width: 40,
      height: 40,
    },
    tooltipPosition: 'left',
    showCloseButton: true,
  },
};

// 스토리: 영어 버전
export const EnglishVersion: Story = {
  args: {
    visible: true,
    message: "Welcome to Lightning Tennis! Let's get you started with finding your first match.",
    showCloseButton: true,
    nextButtonText: "Let's go!",
    onNext: () => console.log('Next'),
    stepIndicator: '1/4',
  },
};

// 스토리: 긴 메시지
export const LongMessage: Story = {
  args: {
    visible: true,
    message:
      '클럽에 가입하면 정기 모임에 참여하고, 리그와 토너먼트에 출전하며, 다른 회원들과 소통할 수 있어요. 마음에 드는 클럽을 찾으면 "가입 신청" 버튼을 눌러보세요!',
    targetArea: {
      x: 20,
      y: 200,
      width: width - 40,
      height: 100,
    },
    tooltipPosition: 'bottom',
    showCloseButton: true,
    nextButtonText: '클럽 찾아보기',
    onNext: () => console.log('클럽 검색'),
    stepIndicator: '3/5',
  },
};

// 스토리: 닫기 버튼 없음
export const NoCloseButton: Story = {
  args: {
    visible: true,
    message: '이 단계는 건너뛸 수 없어요. 계속하려면 아래 버튼을 눌러주세요.',
    showCloseButton: false,
    nextButtonText: '계속하기',
    onNext: () => console.log('계속'),
  },
};
