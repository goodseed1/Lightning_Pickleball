/**
 * 📝 LPR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LPR" (Lightning Pickleball Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LPR로 변경하고 코드는 ntrp를 유지합니다.
 */
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Create test users in Firebase for player discovery
 * Only run this once to populate the database
 */
export const createTestUsers = async () => {
  console.log('🧪 Creating test users for player discovery...');

  const testUsers = [
    {
      displayName: '김서준',
      email: 'kim.seojun@example.com',
      ltrLevel: '4.0',
      skillLevel: '4.0',
      bio: '매일 저녁 피클볼를 즐기는 직장인입니다.',
      location: {
        lat: 37.5665,
        lng: 126.978,
        address: '서울시 중구',
      },
      maxTravelDistance: 15,
      languages: ['ko'],
      activityRegions: ['서울시 중구'],
      stats: {
        wins: 23,
        losses: 12,
        totalMatches: 35,
        winRate: 65.7,
        eloPoints: 1350,
      },
      isOnboardingComplete: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      preferredTimeSlots: ['저녁 (18-22시)'],
      playingStyle: 'baseline',
    },
    {
      displayName: '이민지',
      email: 'lee.minji@example.com',
      ltrLevel: '3.5',
      skillLevel: '3.5',
      bio: '주말 피클볼 파트너를 찾고 있어요!',
      location: {
        lat: 37.5565,
        lng: 126.968,
        address: '서울시 마포구',
      },
      maxTravelDistance: 12,
      languages: ['ko', 'en'],
      activityRegions: ['서울시 마포구'],
      stats: {
        wins: 15,
        losses: 13,
        totalMatches: 28,
        winRate: 53.6,
        eloPoints: 1250,
      },
      isOnboardingComplete: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      preferredTimeSlots: ['오후 (12-18시)'],
      playingStyle: 'all-court',
    },
    {
      displayName: 'Alex Johnson',
      email: 'alex.johnson@example.com',
      ltrLevel: '4.5',
      skillLevel: '4.5',
      bio: '10 years of pickleball experience, looking for competitive matches.',
      location: {
        lat: 37.5765,
        lng: 126.988,
        address: 'Seoul, Gangnam-gu',
      },
      maxTravelDistance: 20,
      languages: ['en'],
      activityRegions: ['Seoul, Gangnam-gu'],
      stats: {
        wins: 45,
        losses: 18,
        totalMatches: 63,
        winRate: 71.4,
        eloPoints: 1450,
      },
      isOnboardingComplete: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      preferredTimeSlots: ['Morning (6-12 PM)', 'Evening (6-10 PM)'],
      playingStyle: 'aggressive',
    },
    {
      displayName: 'Sarah Kim',
      email: 'sarah.kim@example.com',
      ltrLevel: '3.0',
      skillLevel: '3.0',
      bio: 'Beginner looking for practice partners.',
      location: {
        lat: 37.545,
        lng: 126.95,
        address: 'Seoul, Yongsan-gu',
      },
      maxTravelDistance: 10,
      languages: ['en', 'ko'],
      activityRegions: ['Seoul, Yongsan-gu'],
      stats: {
        wins: 8,
        losses: 12,
        totalMatches: 20,
        winRate: 40.0,
        eloPoints: 1150,
      },
      isOnboardingComplete: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      preferredTimeSlots: ['Afternoon (12-6 PM)'],
      playingStyle: 'baseline',
    },
    {
      displayName: '박준형',
      email: 'park.junhyung@example.com',
      ltrLevel: '5.0',
      skillLevel: '5.0',
      bio: '피클볼 경력 15년, 함께 실력을 키워요.',
      location: {
        lat: 37.52,
        lng: 127.03,
        address: '서울시 강남구',
      },
      maxTravelDistance: 25,
      languages: ['ko'],
      activityRegions: ['서울시 강남구'],
      stats: {
        wins: 78,
        losses: 22,
        totalMatches: 100,
        winRate: 78.0,
        eloPoints: 1650,
      },
      isOnboardingComplete: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      preferredTimeSlots: ['오전 (6-12시)', '저녁 (18-22시)'],
      playingStyle: 'serve-and-volley',
    },
  ];

  try {
    const usersRef = collection(db, 'users');

    for (const user of testUsers) {
      try {
        const docRef = await addDoc(usersRef, user);
        console.log(`✅ Created test user: ${user.displayName} (${docRef.id})`);
      } catch (error) {
        console.error(`❌ Failed to create user ${user.displayName}:`, error);
      }
    }

    console.log('🎉 Test users creation completed!');
    return true;
  } catch (error) {
    console.error('❌ Failed to create test users:', error);
    return false;
  }
};

// Helper function to clear test users (use with caution)
export const clearTestUsers = async () => {
  console.log('🗑️ This function would clear test users...');
  console.log('⚠️ Implement this carefully with proper user ID filtering');
  // Implementation would go here if needed
};
