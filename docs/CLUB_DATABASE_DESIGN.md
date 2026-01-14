# Lightning Tennis Club System - Firestore Database Design

## 📊 Database Architecture Overview

Lightning Tennis 클럽 시스템은 개인용 번개 매치와 클럽용 운영 허브를 동시에 지원하는 데이터베이스 구조를 가집니다.

## 🗂️ Core Collections Structure

### 1. `clubs` Collection - 클럽 기본 정보

```javascript
// Document ID: auto-generated unique ID
clubs/{clubId} {
  // 기본 클럽 정보
  name: string,                    // 클럽 이름 (예: "Atlanta Korean Tennis Club")
  description: string,             // 클럽 소개 (최대 500자)
  logoUrl?: string,               // 클럽 로고 이미지 URL
  coverImageUrl?: string,         // 클럽 커버 이미지 URL

  // 지역 정보
  location: {
    address: string,              // 주요 활동 지역 (예: "Atlanta, GA")
    coordinates?: {               // 선택적 GPS 좌표
      lat: number,
      lng: number
    },
    zipCode?: string,             // 우편번호
    region: string                // 지역 구분 (예: "Metro Atlanta")
  },

  // 클럽 설정
  settings: {
    isPublic: boolean,            // 공개 클럽 여부 (기본: true)
    joinRequiresApproval: boolean, // 가입 승인 필요 여부 (기본: true)
    maxMembers?: number,          // 최대 회원 수 (선택적)
    membershipFee?: {             // 회비 정보 (선택적)
      amount: number,
      currency: "USD" | "KRW",
      period: "monthly" | "yearly"
    }
  },

  // 클럽 특성
  tags: string[],                 // 클럽 태그 (예: ["Korean", "Intermediate", "Social"])
  skillLevel?: "mixed" | "beginner" | "intermediate" | "advanced", // 주 실력대
  playingStyle: string[],         // 주요 플레이 스타일
  languages: string[],            // 사용 언어 (예: ["ko", "en"])

  // 연락처 정보
  contact: {
    email?: string,
    phone?: string,
    website?: string,
    socialMedia?: {
      facebook?: string,
      instagram?: string,
      kakaoTalk?: string
    }
  },

  // 통계 정보 (자동 계산)
  stats: {
    totalMembers: number,         // 총 회원 수
    activeMembers: number,        // 활성 회원 수 (30일 기준)
    totalEvents: number,          // 총 이벤트 수
    monthlyEvents: number         // 월간 이벤트 수
  },

  // 메타데이터
  createdBy: string,              // 생성자 userId (첫 번째 Admin)
  createdAt: timestamp,
  updatedAt: timestamp,
  status: "active" | "inactive" | "suspended" // 클럽 상태
}
```

### 2. `clubMembers` Collection - 회원 관리

```javascript
// Document ID: {clubId}_{userId} (복합 키)
clubMembers/{clubId}_{userId} {
  // 기본 정보
  clubId: string,                 // 클럽 ID (참조)
  userId: string,                 // 사용자 ID (참조)

  // 회원 역할 및 상태
  role: "admin" | "manager" | "member", // 역할
  status: "active" | "pending" | "suspended" | "left", // 상태

  // 회원 정보 (사용자 프로필에서 복제, 성능 최적화)
  memberInfo: {
    displayName: string,
    nickname: string,
    photoURL?: string,
    skillLevel: string,
    preferredLanguage: string
  },

  // 클럽 내 활동 정보
  clubActivity: {
    eventsAttended: number,       // 참석한 이벤트 수
    eventsHosted?: number,        // 주최한 이벤트 수 (Manager 이상)
    lastActiveAt: timestamp,      // 마지막 활동 시간
    joinDate: timestamp,          // 가입일
    memberSince: string           // 가입 기간 (예: "3 months")
  },

  // 권한 설정 (역할별 차등)
  permissions: {
    canCreateEvents: boolean,     // 이벤트 생성 권한
    canModerateChat: boolean,     // 채팅 관리 권한
    canInviteMembers: boolean,    // 회원 초대 권한
    canManageMembers?: boolean    // 회원 관리 권한 (Admin만)
  },

  // 알림 설정
  notifications: {
    clubEvents: boolean,          // 클럽 이벤트 알림
    clubChat: boolean,            // 클럽 채팅 알림
    memberUpdates: boolean,       // 회원 소식 알림
    announcements: boolean        // 공지사항 알림
  },

  // 메타데이터
  invitedBy?: string,             // 초대자 (있는 경우)
  joinedAt: timestamp,
  updatedAt: timestamp
}
```

### 3. `clubEvents` Collection - 클럽 이벤트

```javascript
// Document ID: auto-generated unique ID
clubEvents/{eventId} {
  // 기본 이벤트 정보
  clubId: string,                 // 소속 클럽 ID (참조)
  title: string,                  // 이벤트 제목
  description: string,            // 이벤트 설명

  // 이벤트 타입 및 분류
  type: "practice" | "match" | "tournament" | "social" | "meeting" | "lesson",
  category: "regular" | "special" | "championship", // 이벤트 분류
  skillLevel?: string,            // 대상 실력 (선택적 필터링)

  // 일정 정보
  schedule: {
    startTime: timestamp,         // 시작 시간
    endTime: timestamp,           // 종료 시간
    duration: number,             // 소요 시간 (분)
    timezone: string              // 시간대 (예: "America/New_York")
  },

  // 장소 정보
  location: {
    name: string,                 // 장소명
    address: string,              // 주소
    coordinates?: {               // GPS 좌표 (선택적)
      lat: number,
      lng: number
    },
    courtInfo?: {                 // 코트 정보 (선택적)
      courtCount: number,
      surface: string,
      isIndoor: boolean
    }
  },

  // 참가자 관리
  participants: {
    maxParticipants?: number,     // 최대 참가자 수
    currentCount: number,         // 현재 참가자 수
    registeredIds: string[],      // 등록된 사용자 ID들
    waitlistIds?: string[],       // 대기자 목록 (선택적)
    attendedIds?: string[]        // 실제 참석자 (이벤트 후 업데이트)
  },

  // 이벤트 설정
  settings: {
    isPrivate: boolean,           // 클럽 전용 이벤트 (기본: true)
    requiresApproval: boolean,    // 참가 승인 필요 여부
    allowGuests: boolean,         // 게스트 참가 허용 여부
    cost?: {                      // 참가비 (선택적)
      amount: number,
      currency: "USD" | "KRW",
      paymentMethod?: string
    }
  },

  // 반복 이벤트 (정기 모임)
  recurrence?: {
    type: "weekly" | "monthly" | "custom",
    interval: number,             // 간격 (예: 매주 = 1, 격주 = 2)
    daysOfWeek?: number[],        // 요일 (일=0, 월=1, ... 토=6)
    endDate?: timestamp,          // 반복 종료일
    exceptions?: timestamp[]      // 예외 날짜들
  },

  // 이벤트 상태
  status: "draft" | "published" | "ongoing" | "completed" | "cancelled",

  // 추가 정보
  equipment?: string[],           // 필요 장비
  instructions?: string,          // 특별 지시사항
  attachments?: {                 // 첨부 파일 (선택적)
    images: string[],
    documents: string[]
  },

  // 메타데이터
  createdBy: string,              // 생성자 userId
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 4. `clubChat` Collection - 클럽 채팅

```javascript
// Document ID: auto-generated unique ID
clubChat/{messageId} {
  clubId: string,                 // 소속 클럽 ID
  senderId: string,               // 발신자 userId
  senderInfo: {                   // 발신자 정보 (성능 최적화)
    displayName: string,
    nickname: string,
    photoURL?: string,
    role: "admin" | "manager" | "member"
  },

  // 메시지 내용
  content: {
    text?: string,                // 텍스트 메시지
    imageUrls?: string[],         // 이미지 첨부
    attachments?: {               // 기타 첨부
      fileName: string,
      fileUrl: string,
      fileType: string
    }[]
  },

  // 메시지 타입
  type: "message" | "announcement" | "system" | "event_notification",

  // 관련 참조 (선택적)
  relatedEventId?: string,        // 관련 이벤트 (알림 메시지)
  replyTo?: string,               // 답글 대상 메시지 ID

  // 메시지 상태
  isEdited: boolean,
  editedAt?: timestamp,
  isDeleted: boolean,
  deletedAt?: timestamp,

  // 읽음 상태 (성능상 별도 컬렉션 고려)
  readBy: {                       // 읽은 사용자들
    [userId]: timestamp
  },

  // 메타데이터
  createdAt: timestamp,
  updatedAt?: timestamp
}
```

### 5. `clubInvitations` Collection - 클럽 초대장

```javascript
// Document ID: auto-generated unique ID
clubInvitations/{invitationId} {
  clubId: string,                 // 클럽 ID
  clubInfo: {                     // 클럽 정보 (성능 최적화)
    name: string,
    logoUrl?: string
  },

  // 초대 정보
  invitedUserId?: string,         // 초대받은 사용자 ID (등록 사용자)
  invitedEmail?: string,          // 이메일 초대 (미등록 사용자)
  invitedBy: string,              // 초대한 사용자 ID
  inviterInfo: {                  // 초대자 정보
    displayName: string,
    role: string
  },

  // 초대 상태
  status: "pending" | "accepted" | "declined" | "expired",
  message?: string,               // 초대 메시지 (선택적)

  // 메타데이터
  createdAt: timestamp,
  expiresAt: timestamp,           // 초대 만료일
  respondedAt?: timestamp         // 응답일
}
```

## 🔗 Relationship & Query Patterns

### 주요 쿼리 패턴:

#### 1. 사용자의 클럽 목록 조회:

```javascript
// 사용자가 속한 모든 클럽
clubMembers.where('userId', '==', currentUserId).where('status', '==', 'active');
```

#### 2. 클럽의 활성 멤버 목록:

```javascript
// 클럽의 모든 활성 멤버
clubMembers
  .where('clubId', '==', clubId)
  .where('status', '==', 'active')
  .orderBy('role', 'asc')
  .orderBy('joinedAt', 'desc');
```

#### 3. 클럽 이벤트 조회:

```javascript
// 특정 클럽의 향후 이벤트
clubEvents
  .where('clubId', '==', clubId)
  .where('schedule.startTime', '>', new Date())
  .where('status', 'in', ['published', 'ongoing'])
  .orderBy('schedule.startTime', 'asc');
```

#### 4. 클럽 채팅 메시지:

```javascript
// 최근 채팅 메시지 (페이지네이션)
clubChat
  .where('clubId', '==', clubId)
  .where('isDeleted', '==', false)
  .orderBy('createdAt', 'desc')
  .limit(50);
```

## 🛡️ Security Rules Considerations

### Firestore Security Rules 설계:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Clubs collection
    match /clubs/{clubId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.createdBy;
      allow update: if request.auth != null &&
        isClubAdmin(clubId, request.auth.uid);
    }

    // Club members collection
    match /clubMembers/{membershipId} {
      allow read: if request.auth != null &&
        (request.auth.uid == resource.data.userId ||
         isClubMember(resource.data.clubId, request.auth.uid));
      allow create: if request.auth != null;
      allow update: if request.auth != null &&
        (request.auth.uid == resource.data.userId ||
         isClubAdmin(resource.data.clubId, request.auth.uid));
    }

    // Club events collection
    match /clubEvents/{eventId} {
      allow read: if request.auth != null &&
        isClubMember(resource.data.clubId, request.auth.uid);
      allow create, update: if request.auth != null &&
        canCreateEvents(resource.data.clubId, request.auth.uid);
    }

    // Club chat collection
    match /clubChat/{messageId} {
      allow read: if request.auth != null &&
        isClubMember(resource.data.clubId, request.auth.uid);
      allow create: if request.auth != null &&
        isClubMember(resource.data.clubId, request.auth.uid) &&
        request.auth.uid == request.resource.data.senderId;
    }
  }
}
```

## 📈 Performance Optimizations

### 1. 복합 인덱스:

```javascript
// 필요한 Firestore 복합 인덱스들
clubMembers: ['clubId', 'status', 'role'];
clubEvents: ['clubId', 'schedule.startTime', 'status'];
clubChat: ['clubId', 'createdAt'];
clubInvitations: ['clubId', 'status', 'createdAt'];
```

### 2. 데이터 중복화 전략:

- **memberInfo**: 사용자 프로필의 주요 정보를 clubMembers에 복제
- **clubInfo**: 클럽 기본 정보를 초대장에 복제
- **senderInfo**: 발신자 정보를 채팅 메시지에 복제

### 3. 집계 필드:

- **clubs.stats**: 실시간 통계를 위한 집계 필드
- **participants.currentCount**: 이벤트 참가자 수 실시간 업데이트

## 🔄 Data Consistency Strategies

### 1. Cloud Functions 트리거:

```javascript
// 회원 가입/탈퇴 시 클럽 통계 업데이트
exports.updateClubStats = functions.firestore
  .document('clubMembers/{membershipId}')
  .onWrite((change, context) => {
    // clubs.stats.totalMembers 업데이트
  });

// 이벤트 참가자 변경 시 카운트 업데이트
exports.updateEventParticipants = functions.firestore
  .document('clubEvents/{eventId}')
  .onUpdate((change, context) => {
    // participants.currentCount 자동 계산
  });
```

### 2. 트랜잭션 사용:

```javascript
// 클럽 가입 프로세스
await db.runTransaction(async transaction => {
  // 1. clubMembers 문서 생성
  // 2. clubs.stats.totalMembers 증가
  // 3. 초대장 상태 업데이트 (있는 경우)
});
```

## 📱 Integration with Existing Features

### 기존 시스템과의 통합:

#### 1. Users Collection 확장:

```javascript
users/{userId} {
  // 기존 필드들...

  // 클럽 관련 추가 필드
  clubs: {
    memberships: string[],        // 가입한 클럽 ID들
    adminOf: string[],           // 관리자인 클럽 ID들
    favoriteClubs: string[]      // 관심 클럽 ID들
  }
}
```

#### 2. Lightning Matches와 통합:

```javascript
lightning_matches/{matchId} {
  // 기존 필드들...

  // 클럽 매치인 경우
  clubId?: string,               // 클럽 전용 매치
  isClubMatch: boolean,          // 클럽 매치 여부
  clubEventId?: string           // 관련 클럽 이벤트
}
```

이 데이터베이스 설계는 확장성, 성능, 보안을 모두 고려하여 Lightning Tennis의 개인용 번개 매치와 클럽용 운영 허브를 효과적으로 지원합니다.
