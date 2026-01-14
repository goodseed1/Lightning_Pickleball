#!/usr/bin/env node
/**
 * Add league, match, and schedule translations to ko.json and en.json
 */

const fs = require('fs');
const path = require('path');

// Locale files directory
const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');

// Korean translations
const koTranslations = {
  leagues: {
    admin: {
      unknownUser: '알 수 없는 사용자',
      applicant: '신청자',
      leagueOpenedTitle: '🎭 리그 공개 완료',
      leagueOpenedMessage: '리그가 성공적으로 공개되었습니다! 이제 회원들이 참가 신청을 할 수 있습니다.',
      leagueOpenError: '리그 공개 중 오류가 발생했습니다. 다시 시도해 주세요.',
      permissionError: '권한 오류',
      adminRequired: '관리자 권한이 필요합니다.',
      approvalCompleteTitle: '✅ 승인 완료',
      approvalCompleteMessage: '{{name}}님의 참가 신청이 승인되었습니다.',
      approvalFailed: '승인 실패',
      approvalError: '참가 신청 승인 중 오류가 발생했습니다. 다시 시도해 주세요.',
      dashboardTitle: '관리자 대시보드',
      dashboardSubtitle: '리그 시작 전 참가자 관리 및 설정',
      participantStatus: '참가자 현황',
      approved: '승인됨',
      pending: '대기중',
      maxParticipants: '최대인원',
      participantList: '참가자 목록',
      applicationDate: '신청일',
      approve: '승인하기',
      processing: '처리 중...',
      rejected: '거절됨',
      noApplicants: '아직 참가 신청자가 없습니다',
      applicantsWillAppear: '참가자가 신청하면 실시간으로 여기에 표시됩니다',
      leaguePrivateTitle: '리그가 비공개 상태입니다',
      leaguePrivateMessage: '현재 리그는 준비 중이며 회원들에게 보이지 않습니다. 준비가 완료되면 신청 접수를 시작하세요.',
      opening: '공개 중...',
      startAcceptingApplications: '🎭 신청 접수 시작하기'
    },
    match: {
      status: {
        scheduled: '예정됨',
        inProgress: '진행중',
        completed: '완료됨',
        pendingApproval: '승인 대기',
        cancelled: '취소됨',
        postponed: '연기됨',
        walkover: '부전승'
      },
      correctResult: '결과 수정',
      reschedule: '일정 변경',
      walkover: '기권 처리',
      matchNumber: '경기 #{{number}}',
      court: '코트',
      result: '결과',
      winner: '승자',
      submittedResult: '제출된 결과 (승인 대기)',
      submitResult: '결과 입력',
      submitResultAdmin: '결과 입력 (관리자)',
      noMatches: '경기가 없습니다',
      matchesWillAppear: '경기가 생성되면 여기에 표시됩니다.'
    }
  },
  schedules: {
    form: {
      title: '모임 제목 *',
      titlePlaceholder: '예: 수요일 저녁 연습',
      description: '설명',
      descriptionPlaceholder: '모임에 대한 상세 설명을 입력하세요',
      scheduleType: '모임 유형',
      dayOfWeek: '요일 *',
      startTime: '시작 시간 *',
      duration: '소요 시간 (분) *',
      locationInfo: '장소 정보',
      locationName: '장소명 *',
      locationNamePlaceholder: '예: 센트럴 파크 테니스 코트',
      address: '주소 *',
      addressPlaceholder: '전체 주소를 입력하세요',
      directions: '찾아오는 방법',
      directionsPlaceholder: '주차 정보, 입구 위치 등',
      courtType: '코트 유형',
      indoor: '실내',
      outdoor: '실외',
      both: '모두',
      participationInfo: '참가 정보',
      minParticipants: '최소 인원',
      maxParticipants: '최대 인원',
      skillLevel: '필요 실력',
      skillLevelPlaceholder: '예: 3.5+',
      membersOnly: '회원 전용',
      registrationRequired: '사전 등록 필요',
      registrationDeadline: '등록 마감 (시간 전)'
    }
  }
};

// English translations
const enTranslations = {
  leagues: {
    admin: {
      unknownUser: 'Unknown User',
      applicant: 'Applicant',
      leagueOpenedTitle: '🎭 League Opened',
      leagueOpenedMessage: 'League has been successfully opened! Members can now apply to participate.',
      leagueOpenError: 'An error occurred while opening the league. Please try again.',
      permissionError: 'Permission Error',
      adminRequired: 'Admin permission required.',
      approvalCompleteTitle: '✅ Approval Complete',
      approvalCompleteMessage: '{{name}}\'s application has been approved.',
      approvalFailed: 'Approval Failed',
      approvalError: 'An error occurred while approving the application. Please try again.',
      dashboardTitle: 'Admin Dashboard',
      dashboardSubtitle: 'Manage participants and settings before league starts',
      participantStatus: 'Participant Status',
      approved: 'Approved',
      pending: 'Pending',
      maxParticipants: 'Max',
      participantList: 'Participant List',
      applicationDate: 'Applied',
      approve: 'Approve',
      processing: 'Processing...',
      rejected: 'Rejected',
      noApplicants: 'No applicants yet',
      applicantsWillAppear: 'Applicants will appear here in real-time',
      leaguePrivateTitle: 'League is Private',
      leaguePrivateMessage: 'The league is currently being prepared and is not visible to members. Start accepting applications when ready.',
      opening: 'Opening...',
      startAcceptingApplications: '🎭 Start Accepting Applications'
    },
    match: {
      status: {
        scheduled: 'Scheduled',
        inProgress: 'In Progress',
        completed: 'Completed',
        pendingApproval: 'Pending Approval',
        cancelled: 'Cancelled',
        postponed: 'Postponed',
        walkover: 'Walkover'
      },
      correctResult: 'Correct Result',
      reschedule: 'Reschedule',
      walkover: 'Walkover',
      matchNumber: 'Match #{{number}}',
      court: 'Court',
      result: 'Result',
      winner: 'Winner',
      submittedResult: 'Submitted Result (Pending Approval)',
      submitResult: 'Submit Result',
      submitResultAdmin: 'Submit Result (Admin)',
      noMatches: 'No matches yet',
      matchesWillAppear: 'Matches will appear here once created.'
    }
  },
  schedules: {
    form: {
      title: 'Schedule Title *',
      titlePlaceholder: 'e.g., Wednesday Evening Practice',
      description: 'Description',
      descriptionPlaceholder: 'Enter detailed description of the schedule',
      scheduleType: 'Schedule Type',
      dayOfWeek: 'Day of Week *',
      startTime: 'Start Time *',
      duration: 'Duration (minutes) *',
      locationInfo: 'Location Information',
      locationName: 'Location Name *',
      locationNamePlaceholder: 'e.g., Central Park Tennis Courts',
      address: 'Address *',
      addressPlaceholder: 'Enter full address',
      directions: 'Directions',
      directionsPlaceholder: 'Parking info, entrance location, etc.',
      courtType: 'Court Type',
      indoor: 'Indoor',
      outdoor: 'Outdoor',
      both: 'Both',
      participationInfo: 'Participation Information',
      minParticipants: 'Min Participants',
      maxParticipants: 'Max Participants',
      skillLevel: 'Skill Level Required',
      skillLevelPlaceholder: 'e.g., 3.5+',
      membersOnly: 'Members Only',
      registrationRequired: 'Registration Required',
      registrationDeadline: 'Registration Deadline (hours before)'
    }
  }
};

// Helper function to deep merge objects
function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

console.log('🚀 Starting league translation addition...\n');

// Update Korean file
try {
  const koPath = path.join(LOCALES_DIR, 'ko.json');
  const koData = JSON.parse(fs.readFileSync(koPath, 'utf8'));

  deepMerge(koData, koTranslations);

  fs.writeFileSync(koPath, JSON.stringify(koData, null, 2) + '\n', 'utf8');
  console.log('✅ Updated ko.json');
} catch (error) {
  console.error('❌ Error updating ko.json:', error.message);
  process.exit(1);
}

// Update English file
try {
  const enPath = path.join(LOCALES_DIR, 'en.json');
  const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

  deepMerge(enData, enTranslations);

  fs.writeFileSync(enPath, JSON.stringify(enData, null, 2) + '\n', 'utf8');
  console.log('✅ Updated en.json');
} catch (error) {
  console.error('❌ Error updating en.json:', error.message);
  process.exit(1);
}

console.log('\n✨ League translation addition complete!');
