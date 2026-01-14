/**
 * ChatUI Storybook Stories
 * 전체 채팅 UI 컨테이너의 다양한 상태 시각화
 */

import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import ChatUI, { ChatMessage, QuickReplyOption } from './ChatUI';

const meta: Meta<typeof ChatUI> = {
  title: 'AI/ChatUI',
  component: ChatUI,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data: 기본 대화 메시지들
const sampleMessages: ChatMessage[] = [
  {
    id: '1',
    content: '안녕하세요! Lightning Pickleball AI입니다. 🎾 무엇을 도와드릴까요?',
    sender: 'ai',
    timestamp: new Date('2024-12-14T14:00:00'),
    language: 'ko',
    type: 'message',
  },
  {
    id: '2',
    content: '피클볼 서브 잘 치는 방법 알려줘',
    sender: 'user',
    timestamp: new Date('2024-12-14T14:00:30'),
    language: 'ko',
    type: 'message',
  },
  {
    id: '3',
    content:
      '좋은 서브를 위해서는 토스가 가장 중요합니다. 공을 일정한 높이로 던지는 연습을 먼저 해보세요!\n\n추가로:\n1. 토스는 어깨 약간 앞쪽\n2. 패들을 완전히 펼 수 있는 높이\n3. 천천히 스윙하며 연습',
    sender: 'ai',
    timestamp: new Date('2024-12-14T14:00:45'),
    language: 'ko',
    type: 'tip',
  },
];

// Mock data: 빠른 응답 옵션
const sampleQuickReplies: QuickReplyOption[] = [
  {
    id: 'q1',
    label: '기본 규칙',
    icon: 'book-open-variant',
    onPress: () => console.log('Basic rules clicked'),
  },
  {
    id: 'q2',
    label: '서브 팁',
    icon: 'pickleball',
    onPress: () => console.log('Serve tips clicked'),
  },
  {
    id: 'q3',
    label: '경기 전략',
    icon: 'strategy',
    onPress: () => console.log('Strategy clicked'),
  },
  {
    id: 'q4',
    label: '장비 추천',
    icon: 'cart',
    onPress: () => console.log('Equipment clicked'),
  },
];

// Story: 기본 채팅 UI (메시지 있음)
export const Default: Story = {
  args: {
    messages: sampleMessages,
    onSendMessage: (msg: string) => console.log('Send message:', msg),
    isLoading: false,
  },
};

// Story: 빈 채팅 (메시지 없음)
export const Empty: Story = {
  args: {
    messages: [],
    onSendMessage: (msg: string) => console.log('Send message:', msg),
    isLoading: false,
  },
};

// Story: 로딩 중 상태
export const Loading: Story = {
  args: {
    messages: sampleMessages,
    onSendMessage: (msg: string) => console.log('Send message:', msg),
    isLoading: true,
  },
};

// Story: AI 타이핑 중
export const AITyping: Story = {
  args: {
    messages: [
      ...sampleMessages,
      {
        id: '4',
        content: '그립은 어떻게 잡아야 하나요?',
        sender: 'user',
        timestamp: new Date('2024-12-14T14:01:00'),
        language: 'ko',
        type: 'message',
      },
    ],
    onSendMessage: (msg: string) => console.log('Send message:', msg),
    isLoading: false,
    isTyping: true,
  },
};

// Story: 빠른 응답 포함
export const WithQuickReplies: Story = {
  args: {
    messages: sampleMessages,
    onSendMessage: (msg: string) => console.log('Send message:', msg),
    isLoading: false,
    quickReplies: sampleQuickReplies,
  },
};

// Story: 긴 대화 (스크롤 테스트)
export const LongConversation: Story = {
  args: {
    messages: [
      {
        id: '1',
        content: '안녕하세요! Lightning Pickleball AI입니다. 🎾 무엇을 도와드릴까요?',
        sender: 'ai',
        timestamp: new Date('2024-12-14T13:50:00'),
        language: 'ko',
        type: 'message',
      },
      {
        id: '2',
        content: '피클볼 초보자인데 시작하는 방법 알려줘',
        sender: 'user',
        timestamp: new Date('2024-12-14T13:50:30'),
        language: 'ko',
        type: 'message',
      },
      {
        id: '3',
        content:
          '피클볼를 시작하신다니 반갑습니다! 먼저 기본적인 그립과 스탠스를 익히는 것이 중요합니다.',
        sender: 'ai',
        timestamp: new Date('2024-12-14T13:50:45'),
        language: 'ko',
        type: 'tip',
      },
      {
        id: '4',
        content: '그립은 어떻게 잡나요?',
        sender: 'user',
        timestamp: new Date('2024-12-14T13:51:00'),
        language: 'ko',
        type: 'message',
      },
      {
        id: '5',
        content:
          '가장 기본적인 그립은 이스턴 그립입니다:\n\n1. 패들을 땅에 세워놓고\n2. 악수하듯이 잡으세요\n3. 손바닥이 패들 면과 같은 방향',
        sender: 'ai',
        timestamp: new Date('2024-12-14T13:51:15'),
        language: 'ko',
        type: 'tip',
      },
      {
        id: '6',
        content: '서브는 어떻게 쳐요?',
        sender: 'user',
        timestamp: new Date('2024-12-14T13:52:00'),
        language: 'ko',
        type: 'message',
      },
      {
        id: '7',
        content:
          '서브는 토스가 가장 중요합니다:\n\n1. 토스는 어깨 약간 앞쪽\n2. 패들을 완전히 펼 수 있는 높이\n3. 천천히 스윙하며 연습\n4. 일정한 리듬 유지',
        sender: 'ai',
        timestamp: new Date('2024-12-14T13:52:15'),
        language: 'ko',
        type: 'tip',
      },
      {
        id: '8',
        content: '백핸드는 어떻게 치나요?',
        sender: 'user',
        timestamp: new Date('2024-12-14T13:53:00'),
        language: 'ko',
        type: 'message',
      },
      {
        id: '9',
        content:
          '백핸드는 두 가지 방법이 있습니다:\n\n한손 백핸드:\n- 그립을 바꿔서 치는 방식\n- 리치가 길고 파워풀\n\n양손 백핸드:\n- 양손으로 패들을 잡는 방식\n- 안정적이고 초보자에게 추천',
        sender: 'ai',
        timestamp: new Date('2024-12-14T13:53:20'),
        language: 'ko',
        type: 'tip',
      },
    ],
    onSendMessage: (msg: string) => console.log('Send message:', msg),
    isLoading: false,
    quickReplies: sampleQuickReplies,
  },
};

// Story: 영어 대화
export const EnglishConversation: Story = {
  args: {
    messages: [
      {
        id: '1',
        content: "Hello! I'm Lightning Pickleball AI. 🎾 How can I help you today?",
        sender: 'ai',
        timestamp: new Date('2024-12-14T14:00:00'),
        language: 'en',
        type: 'message',
      },
      {
        id: '2',
        content: 'How can I improve my pickleball serve?',
        sender: 'user',
        timestamp: new Date('2024-12-14T14:00:30'),
        language: 'en',
        type: 'message',
      },
      {
        id: '3',
        content:
          'The most important aspect of a good serve is the toss. Practice throwing the ball at a consistent height first!\n\nAdditionally:\n1. Toss slightly in front of your shoulder\n2. At a height where you can fully extend your paddle\n3. Practice with a slow swing',
        sender: 'ai',
        timestamp: new Date('2024-12-14T14:00:45'),
        language: 'en',
        type: 'tip',
      },
    ],
    onSendMessage: (msg: string) => console.log('Send message:', msg),
    isLoading: false,
    quickReplies: [
      {
        id: 'q1',
        label: 'Basic Rules',
        icon: 'book-open-variant',
        onPress: () => console.log('Rules'),
      },
      {
        id: 'q2',
        label: 'Serve Tips',
        icon: 'pickleball',
        onPress: () => console.log('Serve'),
      },
      {
        id: 'q3',
        label: 'Strategy',
        icon: 'strategy',
        onPress: () => console.log('Strategy'),
      },
    ],
  },
};

// Story: Interactive (상태 관리 포함)
// 컴포넌트로 분리하여 React Hooks 규칙 준수
const InteractiveDemo = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(sampleMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = (msg: string) => {
    // 사용자 메시지 추가
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      content: msg,
      sender: 'user',
      timestamp: new Date(),
      language: 'ko',
      type: 'message',
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setIsTyping(true);

    // AI 응답 시뮬레이션
    setTimeout(() => {
      setIsTyping(false);
      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        content: `"${msg}"에 대한 답변입니다. 이것은 테스트 응답입니다!`,
        sender: 'ai',
        timestamp: new Date(),
        language: 'ko',
        type: 'message',
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 2000);
  };

  return (
    <View style={{ flex: 1, height: 600 }}>
      <ChatUI
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        isTyping={isTyping}
        quickReplies={sampleQuickReplies}
      />
    </View>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
};
