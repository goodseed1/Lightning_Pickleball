# 리그 우승자 보상 Cloud Function 설계

## 개요

`leagues_tournaments` 컬렉션의 문서가 `status: 'completed'`로 변경될 때 자동으로 트리거되는 Cloud Function의 상세 설계입니다.

## 트리거 조건

```javascript
// Firestore 트리거 설정
exports.onLeagueCompleted = functions.firestore
  .document('leagues_tournaments/{leagueId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // status가 'completed'로 변경되었을 때만 실행
    if (before.status !== 'completed' && after.status === 'completed') {
      await processLeagueCompletion(change.after, context.params.leagueId);
    }
  });
```

## 핵심 로직 의사코드

### 1. 데이터 추출 및 검증

```javascript
async function processLeagueCompletion(leagueDoc, leagueId) {
  try {
    // 1. 리그 데이터 추출
    const leagueData = leagueDoc.data();
    const {
      winnerId,
      runnerUpId,
      name: leagueName,
      clubId,
      champion
    } = leagueData;

    // 2. 필수 데이터 검증
    if (!winnerId) {
      console.error('No winner specified for league:', leagueId);
      return;
    }

    if (!clubId) {
      console.error('No club specified for league:', leagueId);
      return;
    }
```

### 2. 사용자 정보 조회

```javascript
// 3. 우승자 정보 조회
const winnerDoc = await admin.firestore().collection('users').doc(winnerId).get();

if (!winnerDoc.exists) {
  console.error('Winner user not found:', winnerId);
  return;
}

const winnerData = winnerDoc.data();
const winnerName = winnerData.displayName || winnerData.name || 'Unknown';

// 4. 준우승자 정보 조회 (선택사항)
let runnerUpName = null;
if (runnerUpId) {
  const runnerUpDoc = await admin.firestore().collection('users').doc(runnerUpId).get();

  if (runnerUpDoc.exists) {
    const runnerUpData = runnerUpDoc.data();
    runnerUpName = runnerUpData.displayName || runnerUpData.name || 'Unknown';
  }
}
```

### 3. 클럽 정보 조회

```javascript
// 5. 클럽 정보 조회
const clubDoc = await admin.firestore().collection('clubs').doc(clubId).get();

if (!clubDoc.exists) {
  console.error('Club not found:', clubId);
  return;
}

const clubData = clubDoc.data();
const clubName = clubData.name || 'Unknown Club';
```

### 4. 배지 수여 시스템

```javascript
// 6. 우승자 배지 수여
const winnerBadge = {
  id: `league_winner_${leagueId}`,
  name: `🏆 ${leagueName} 우승`,
  description: `${clubName}의 ${leagueName}에서 우승을 차지했습니다`,
  type: 'league_winner',
  leagueId: leagueId,
  clubId: clubId,
  earnedAt: admin.firestore.FieldValue.serverTimestamp(),
  rarity: 'gold',
};

// users/{winnerId}/badges 서브컬렉션에 추가
await admin
  .firestore()
  .collection('users')
  .doc(winnerId)
  .collection('badges')
  .doc(winnerBadge.id)
  .set(winnerBadge);

// 또는 users 문서의 badges 배열에 추가
await admin
  .firestore()
  .collection('users')
  .doc(winnerId)
  .update({
    badges: admin.firestore.FieldValue.arrayUnion(winnerBadge),
  });

console.log('✅ Winner badge awarded to:', winnerName);
```

### 5. 준우승자 배지 수여

```javascript
// 7. 준우승자 배지 수여 (존재하는 경우)
if (runnerUpId && runnerUpName) {
  const runnerUpBadge = {
    id: `league_runnerup_${leagueId}`,
    name: `🥈 ${leagueName} 준우승`,
    description: `${clubName}의 ${leagueName}에서 준우승을 차지했습니다`,
    type: 'league_runnerup',
    leagueId: leagueId,
    clubId: clubId,
    earnedAt: admin.firestore.FieldValue.serverTimestamp(),
    rarity: 'silver',
  };

  await admin
    .firestore()
    .collection('users')
    .doc(runnerUpId)
    .collection('badges')
    .doc(runnerUpBadge.id)
    .set(runnerUpBadge);

  console.log('✅ Runner-up badge awarded to:', runnerUpName);
}
```

### 6. 자동 공지 생성

```javascript
// 8. 클럽 공지 생성
const clubAnnouncement = {
  id: `league_result_${leagueId}`,
  clubId: clubId,
  type: 'leagueWinner',
  title: `${leagueName} 결과 발표`,
  text: `🏆 ${leagueName}에서 ${winnerName}님이 최종 우승했습니다!${runnerUpName ? ` 준우승은 ${runnerUpName}님입니다.` : ''}`,
  winnerId: winnerId,
  runnerUpId: runnerUpId,
  leagueId: leagueId,
  leagueName: leagueName,
  timestamp: admin.firestore.FieldValue.serverTimestamp(),
  createdBy: 'system',
  isSystemGenerated: true,
  priority: 'high',
};

// club_announcements 또는 feed_items 컬렉션에 추가
await admin.firestore().collection('club_announcements').add(clubAnnouncement);

console.log('✅ Club announcement created');
```

### 7. 전체 앱 피드 생성 (선택사항)

```javascript
// 9. 전체 앱 피드 아이템 생성 (선택사항)
const globalFeedItem = {
  id: `league_winner_${leagueId}`,
  type: 'leagueResult',
  title: `${clubName} 리그 우승자 발표`,
  content: `${clubName}의 ${leagueName}에서 ${winnerName}님이 우승했습니다! 🏆`,
  clubId: clubId,
  leagueId: leagueId,
  winnerId: winnerId,
  visibility: 'public', // 또는 'club_members_only'
  timestamp: admin.firestore.FieldValue.serverTimestamp(),
  reactions: {
    likes: 0,
    congratulations: 0,
  },
};

await admin.firestore().collection('global_feed').add(globalFeedItem);

console.log('✅ Global feed item created');
```

### 8. 에러 처리 및 로깅

```javascript
    // 10. 성공 로그
    console.log('🎉 League completion processing completed successfully', {
      leagueId,
      leagueName,
      clubId,
      clubName,
      winnerId,
      winnerName,
      runnerUpId,
      runnerUpName,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // 11. 에러 처리
    console.error('❌ Error processing league completion:', error, {
      leagueId,
      error: error.message,
      stack: error.stack
    });

    // 에러 알림 (선택사항)
    await admin.firestore()
      .collection('system_errors')
      .add({
        type: 'league_completion_error',
        leagueId: leagueId,
        error: error.message,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

    // 관리자에게 알림 (이메일, Slack 등)
    // await sendAdminNotification('League completion error', error);
  }
}
```

## 데이터베이스 구조

### 1. users/{userId}/badges 서브컬렉션

```javascript
{
  id: "league_winner_12345",
  name: "🏆 2025년 1분기 클럽 리그 우승",
  description: "서울 중앙 테니스 클럽의 2025년 1분기 클럽 리그에서 우승을 차지했습니다",
  type: "league_winner",
  leagueId: "league_12345",
  clubId: "club_123",
  earnedAt: Timestamp,
  rarity: "gold"
}
```

### 2. club_announcements 컬렉션

```javascript
{
  clubId: "club_123",
  type: "leagueWinner",
  title: "2025년 1분기 클럽 리그 결과 발표",
  text: "🏆 2025년 1분기 클럽 리그에서 김철수님이 최종 우승했습니다! 준우승은 이영희님입니다.",
  winnerId: "user_123",
  runnerUpId: "user_456",
  leagueId: "league_12345",
  timestamp: Timestamp,
  priority: "high"
}
```

### 3. global_feed 컬렉션 (선택사항)

```javascript
{
  type: "leagueResult",
  title: "서울 중앙 테니스 클럽 리그 우승자 발표",
  content: "서울 중앙 테니스 클럽의 2025년 1분기 클럽 리그에서 김철수님이 우승했습니다! 🏆",
  clubId: "club_123",
  leagueId: "league_12345",
  winnerId: "user_123",
  visibility: "public",
  timestamp: Timestamp
}
```

## 핵심 특징

1. **완전 자동화**: 관리자가 우승자를 선정하면 모든 후속 처리가 자동으로 진행
2. **배지 시스템**: 우승자와 준우승자에게 영구적인 배지 수여
3. **다중 공지**: 클럽 내부 공지와 전체 앱 피드 동시 생성
4. **에러 복구**: 실패 시 로깅 및 관리자 알림 시스템
5. **확장성**: 추후 다른 종류의 배지나 보상 시스템 추가 용이

이 설계를 통해 관리자는 단순히 우승자만 선정하면, 배지 수여부터 공지 생성까지 모든 과정이 완전 자동으로 처리됩니다.
