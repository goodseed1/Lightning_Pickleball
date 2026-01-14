/**
 * HostedEventCard Storybook Stories
 * Visual testing for different states of hosted event cards
 */

import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import HostedEventCard, { HostedEvent, PendingApplication } from './HostedEventCard';

const meta: Meta<typeof HostedEventCard> = {
  title: 'Cards/HostedEventCard',
  component: HostedEventCard,
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
    currentLanguage: {
      control: 'select',
      options: ['en', 'ko'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data for different states
const baseEvent: HostedEvent = {
  id: '1',
  title: '주말 즐거운 랠리',
  clubName: '서울 테니스 클럽',
  date: new Date('2024-12-15T14:00:00'),
  time: '14:00',
  location: '올림픽공원 테니스장 2코트',
  distance: 5.2,
  participants: 4,
  maxParticipants: 8,
  skillLevel: 'intermediate',
  type: 'practice' as 'lightning' | 'practice' | 'tournament' | 'meetup' | 'match',
  description: '즐겁게 랠리 연습하는 시간입니다. 초보자도 환영!',
};

const pendingApplications: PendingApplication[] = [
  {
    id: 'app1',
    applicantName: '이테니스',
    message: '랠리 연습하고 싶어서 신청합니다!',
    appliedAt: new Date('2024-12-10T10:30:00'),
  },
  {
    id: 'app2',
    applicantName: '박백핸드',
    appliedAt: new Date('2024-12-10T15:20:00'),
  },
];

// Story: 모집 중 상태 (신청자 없음)
export const Recruiting: Story = {
  args: {
    event: {
      ...baseEvent,
    },
    currentLanguage: 'ko',
    onEditEvent: (eventId: string) => console.log('Edit event:', eventId),
    onCancelEvent: (eventId: string) => console.log('Cancel event:', eventId),
    onOpenChat: (eventId: string, title: string) => console.log('Open chat:', eventId, title),
  },
};

// Story: 모집 중 상태 (대기 중인 신청자 있음)
export const RecruitingWithPendingApplications: Story = {
  args: {
    event: {
      ...baseEvent,
      pendingApplications,
    },
    currentLanguage: 'ko',
    onEditEvent: (eventId: string) => console.log('Edit event:', eventId),
    onCancelEvent: (eventId: string) => console.log('Cancel event:', eventId),
    onOpenChat: (eventId: string, title: string) => console.log('Open chat:', eventId, title),
    onApproveApplication: (appId: string, name: string) => {
      console.log('Approve application:', appId, name);
      return Promise.resolve();
    },
    onRejectApplication: (appId: string, name: string) => {
      console.log('Reject application:', appId, name);
      return Promise.resolve();
    },
  },
};

// Story: 정원 마감 상태
export const Full: Story = {
  args: {
    event: {
      ...baseEvent,
      title: '정원 마감된 모임',
      participants: 8,
      maxParticipants: 8,
    },
    currentLanguage: 'ko',
    onEditEvent: (eventId: string) => console.log('Edit event:', eventId),
    onCancelEvent: (eventId: string) => console.log('Cancel event:', eventId),
    onOpenChat: (eventId: string, title: string) => console.log('Open chat:', eventId, title),
  },
};

// Story: 진행 중 상태
export const InProgress: Story = {
  args: {
    event: {
      ...baseEvent,
      title: '진행 중인 모임',
      date: new Date(Date.now() - 30 * 60 * 1000), // 30분 전 시작
      participants: 6,
    },
    currentLanguage: 'ko',
    onEditEvent: (eventId: string) => console.log('Edit event:', eventId),
    onCancelEvent: (eventId: string) => console.log('Cancel event:', eventId),
    onOpenChat: (eventId: string, title: string) => console.log('Open chat:', eventId, title),
  },
};

// Story: 완료된 모임
export const Completed: Story = {
  args: {
    event: {
      ...baseEvent,
      title: '완료된 지난 모임',
      date: new Date('2024-12-08T14:00:00'), // 지난 날짜
      currentParticipants: 8,
    },
    currentLanguage: 'ko',
    onEditEvent: (eventId: string) => console.log('Edit event:', eventId),
    onCancelEvent: (eventId: string) => console.log('Cancel event:', eventId),
    onOpenChat: (eventId: string, title: string) => console.log('Open chat:', eventId, title),
  },
};

// Story: 취소된 모임
export const Cancelled: Story = {
  args: {
    event: {
      ...baseEvent,
      title: '취소된 모임',
      participants: 2,
    },
    currentLanguage: 'ko',
    onEditEvent: (eventId: string) => console.log('Edit event:', eventId),
    onCancelEvent: (eventId: string) => console.log('Cancel event:', eventId),
    onOpenChat: (eventId: string, title: string) => console.log('Open chat:', eventId, title),
  },
};

// Story: English version
export const EnglishVersion: Story = {
  args: {
    event: {
      ...baseEvent,
      title: 'Weekend Rally Practice',
      clubName: 'Seoul Tennis Club',
      description: 'Fun rally practice session. Beginners welcome!',
      location: 'Olympic Park Tennis Court 2',
      pendingApplications: [
        {
          id: 'app1',
          applicantName: 'John Tennis',
          message: 'Would love to join the rally practice!',
          appliedAt: new Date('2024-12-10T10:30:00'),
        },
      ],
    },
    currentLanguage: 'en',
    onEditEvent: (eventId: string) => console.log('Edit event:', eventId),
    onCancelEvent: (eventId: string) => console.log('Cancel event:', eventId),
    onOpenChat: (eventId: string, title: string) => console.log('Open chat:', eventId, title),
    onApproveApplication: (appId: string, name: string) => {
      console.log('Approve application:', appId, name);
      return Promise.resolve();
    },
    onRejectApplication: (appId: string, name: string) => {
      console.log('Reject application:', appId, name);
      return Promise.resolve();
    },
  },
};

// Story: 많은 신청자가 있는 인기 모임
export const PopularMeetupWithManyApplicants: Story = {
  args: {
    event: {
      ...baseEvent,
      title: '인기 모임 (많은 신청자)',
      pendingApplications: [
        {
          id: 'app1',
          applicantName: '이테니스',
          message: '꼭 참여하고 싶습니다!',
          appliedAt: new Date('2024-12-10T10:30:00'),
        },
        {
          id: 'app2',
          applicantName: '박백핸드',
          message: '랠리 실력을 늘리고 싶어요',
          appliedAt: new Date('2024-12-10T11:00:00'),
        },
        {
          id: 'app3',
          applicantName: '김포핸드',
          appliedAt: new Date('2024-12-10T12:30:00'),
        },
        {
          id: 'app4',
          applicantName: '정서브',
          message: '초보인데 괜찮을까요? 열심히 하겠습니다!',
          appliedAt: new Date('2024-12-10T14:00:00'),
        },
      ],
    },
    currentLanguage: 'ko',
    onEditEvent: (eventId: string) => console.log('Edit event:', eventId),
    onCancelEvent: (eventId: string) => console.log('Cancel event:', eventId),
    onOpenChat: (eventId: string, title: string) => console.log('Open chat:', eventId, title),
    onApproveApplication: (appId: string, name: string) => {
      console.log('Approve application:', appId, name);
      return Promise.resolve();
    },
    onRejectApplication: (appId: string, name: string) => {
      console.log('Reject application:', appId, name);
      return Promise.resolve();
    },
  },
};
