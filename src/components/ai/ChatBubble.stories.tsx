/**
 * ChatBubble Storybook Stories
 * 채팅 말풍선 컴포넌트의 다양한 상태 시각화
 */

import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import ChatBubble from './ChatBubble';

const meta: Meta<typeof ChatBubble> = {
  title: 'AI/ChatBubble',
  component: ChatBubble,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    Story => (
      <View style={{ padding: 16, backgroundColor: '#f5f5f5' }}>
        <Story />
      </View>
    ),
  ],
  argTypes: {
    sender: {
      control: 'select',
      options: ['user', 'ai'],
    },
    isTyping: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Story: 사용자 메시지 (타임스탬프 포함)
export const UserMessage: Story = {
  args: {
    message: '테니스 서브 잘 치는 방법 알려줘',
    sender: 'user',
    timestamp: new Date('2024-12-14T14:30:00'),
  },
};

// Story: AI 메시지 (타임스탬프 포함)
export const AIMessage: Story = {
  args: {
    message:
      '좋은 서브를 위해서는 토스가 가장 중요합니다. 공을 일정한 높이로 던지는 연습을 먼저 해보세요!',
    sender: 'ai',
    timestamp: new Date('2024-12-14T14:30:15'),
  },
};

// Story: 긴 사용자 메시지
export const LongUserMessage: Story = {
  args: {
    message:
      '오늘 경기에서 서브가 계속 실패했어요. 토스는 일정하게 하려고 노력했는데, 공이 네트에 계속 걸리더라고요. 어떻게 하면 서브 성공률을 높일 수 있을까요?',
    sender: 'user',
    timestamp: new Date('2024-12-14T14:35:00'),
  },
};

// Story: 긴 AI 메시지 (상세한 조언)
export const LongAIMessage: Story = {
  args: {
    message:
      '서브가 네트에 걸리는 이유는 여러 가지가 있을 수 있습니다:\n\n1. 토스 위치가 너무 앞쪽에 있을 수 있습니다\n2. 공을 치는 타이밍이 너무 빠를 수 있습니다\n3. 라켓 스윙의 각도를 확인해보세요\n\n특히 토스는 어깨 약간 앞쪽, 라켓을 완전히 펼 수 있는 높이가 이상적입니다. 천천히 연습해보세요!',
    sender: 'ai',
    timestamp: new Date('2024-12-14T14:35:20'),
  },
};

// Story: 타임스탬프 없는 사용자 메시지
export const UserMessageWithoutTimestamp: Story = {
  args: {
    message: '고마워!',
    sender: 'user',
  },
};

// Story: 타임스탬프 없는 AI 메시지
export const AIMessageWithoutTimestamp: Story = {
  args: {
    message: '도움이 되셨다니 기쁩니다! 더 궁금한 점이 있으시면 언제든 물어보세요.',
    sender: 'ai',
  },
};

// Story: AI 타이핑 중 (애니메이션)
export const AITyping: Story = {
  args: {
    message: '',
    sender: 'ai',
    isTyping: true,
  },
};

// Story: 영어 사용자 메시지
export const EnglishUserMessage: Story = {
  args: {
    message: 'How can I improve my tennis serve?',
    sender: 'user',
    timestamp: new Date('2024-12-14T14:30:00'),
  },
};

// Story: 영어 AI 메시지
export const EnglishAIMessage: Story = {
  args: {
    message:
      'The most important aspect of a good serve is the toss. Practice throwing the ball at a consistent height first!',
    sender: 'ai',
    timestamp: new Date('2024-12-14T14:30:15'),
  },
};

// Story: 여러 메시지 대화 (시퀀스)
export const Conversation: Story = {
  render: () => (
    <View style={{ gap: 4 }}>
      <ChatBubble
        message='테니스 초보자인데, 어떻게 시작하면 좋을까요?'
        sender='user'
        timestamp={new Date('2024-12-14T14:00:00')}
      />
      <ChatBubble
        message='테니스를 시작하신다니 반갑습니다! 먼저 기본적인 그립과 스탠스를 익히는 것이 중요합니다.'
        sender='ai'
        timestamp={new Date('2024-12-14T14:00:15')}
      />
      <ChatBubble
        message='그립은 어떻게 잡아야 하나요?'
        sender='user'
        timestamp={new Date('2024-12-14T14:01:00')}
      />
      <ChatBubble message='' sender='ai' isTyping={true} />
    </View>
  ),
};
