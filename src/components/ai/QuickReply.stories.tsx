/**
 * QuickReply Storybook Stories
 * 빠른 응답 버튼 컴포넌트의 다양한 상태 시각화
 */

import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import QuickReply from './QuickReply';

const meta: Meta<typeof QuickReply> = {
  title: 'AI/QuickReply',
  component: QuickReply,
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
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Story: 기본 빠른 응답 버튼
export const Default: Story = {
  args: {
    label: '테니스 규칙',
    onPress: () => console.log('Quick reply pressed'),
  },
};

// Story: 아이콘 포함 빠른 응답
export const WithIcon: Story = {
  args: {
    label: '기술 팁',
    icon: 'lightbulb-outline',
    onPress: () => console.log('Quick reply with icon pressed'),
  },
};

// Story: 비활성화된 빠른 응답
export const Disabled: Story = {
  args: {
    label: '비활성화됨',
    icon: 'lock',
    onPress: () => console.log('This should not fire'),
    disabled: true,
  },
};

// Story: 여러 아이콘들
export const WithDifferentIcons: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      <QuickReply label='도움말' icon='help-circle' onPress={() => console.log('Help')} />
      <QuickReply label='분석' icon='chart-line' onPress={() => console.log('Analysis')} />
      <QuickReply label='전략' icon='chess-knight' onPress={() => console.log('Strategy')} />
      <QuickReply label='장비' icon='tennis' onPress={() => console.log('Equipment')} />
    </View>
  ),
};

// Story: 다양한 길이의 텍스트
export const VariousLengths: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      <QuickReply label='짧음' onPress={() => console.log('Short')} />
      <QuickReply label='중간 길이 텍스트' onPress={() => console.log('Medium')} />
      <QuickReply label='상당히 긴 빠른 응답 버튼 텍스트' onPress={() => console.log('Long')} />
    </View>
  ),
};

// Story: 한글 빠른 응답 예시
export const KoreanExamples: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      <QuickReply label='기본 규칙' icon='book-open-variant' onPress={() => console.log('Rules')} />
      <QuickReply label='서브 팁' icon='tennis' onPress={() => console.log('Serve tips')} />
      <QuickReply label='경기 전략' icon='strategy' onPress={() => console.log('Strategy')} />
      <QuickReply label='장비 추천' icon='cart' onPress={() => console.log('Equipment')} />
      <QuickReply label='훈련 방법' icon='dumbbell' onPress={() => console.log('Training')} />
    </View>
  ),
};

// Story: 영어 빠른 응답 예시
export const EnglishExamples: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      <QuickReply
        label='Basic Rules'
        icon='book-open-variant'
        onPress={() => console.log('Rules')}
      />
      <QuickReply label='Serve Tips' icon='tennis' onPress={() => console.log('Serve tips')} />
      <QuickReply label='Match Strategy' icon='strategy' onPress={() => console.log('Strategy')} />
      <QuickReply label='Equipment' icon='cart' onPress={() => console.log('Equipment')} />
      <QuickReply label='Training' icon='dumbbell' onPress={() => console.log('Training')} />
    </View>
  ),
};

// Story: 활성/비활성 혼합
export const MixedStates: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      <QuickReply label='활성화됨' icon='check-circle' onPress={() => console.log('Active')} />
      <QuickReply
        label='비활성화됨'
        icon='cancel'
        onPress={() => console.log('Disabled')}
        disabled={true}
      />
      <QuickReply label='활성화됨' icon='check-circle' onPress={() => console.log('Active')} />
      <QuickReply
        label='비활성화됨'
        icon='cancel'
        onPress={() => console.log('Disabled')}
        disabled={true}
      />
    </View>
  ),
};
