/**
 * Club Test Data and Seed Functions
 * Provides sample data for testing the club system
 */

/**
 * Sample club creation data
 */
export const createSampleClubData = () => {
  return {
    name: 'Atlanta Korean Pickleball Club',
    description:
      '한인 피클볼 동호회입니다. 초급부터 고급까지 모든 레벨을 환영합니다. 매주 정기 모임과 월 1회 토너먼트를 개최합니다.',

    location: {
      address: 'Piedmont Park Pickleball Center, Atlanta, GA',
      zipCode: '30309',
      region: 'Metro Atlanta',
      coordinates: {
        lat: 33.7875,
        lng: -84.3733,
      },
    },

    settings: {
      isPublic: true,
      joinRequiresApproval: true,
      maxMembers: 50,
    },

    tags: ['Korean', 'Intermediate', 'Social', 'Weekly'],
    skillLevel: 'mixed',
    playingStyle: ['both_great', 'social_pickleball'],
    languages: ['ko', 'en'],

    contact: {
      email: 'atlantakoreanpickleball@gmail.com',
      phone: '+1-404-555-0123',
      socialMedia: {
        facebook: 'atlantakoreanpickleball',
        instagram: '@atl_korean_pickleball',
      },
    },
  };
};

/**
 * Sample club event data
 */
export const createSampleEventData = () => {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextWeekEnd = new Date(nextWeek.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

  return {
    title: '주간 정기 연습',
    description:
      '매주 토요일 정기 연습입니다. 초급부터 고급까지 모든 레벨 참여 가능합니다. 패들과 공은 클럽에서 제공됩니다.',

    type: 'practice',
    category: 'regular',
    skillLevel: 'mixed',

    schedule: {
      startTime: nextWeek,
      endTime: nextWeekEnd,
      duration: 120, // 2 hours
      timezone: 'America/New_York',
    },

    location: {
      name: 'Piedmont Park Pickleball Center',
      address: '1320 Monroe Dr NE, Atlanta, GA 30309',
      coordinates: {
        lat: 33.7875,
        lng: -84.3733,
      },
      courtInfo: {
        courtCount: 4,
        surface: 'Hard Court',
        isIndoor: false,
      },
    },

    settings: {
      isPrivate: true,
      requiresApproval: false,
      allowGuests: false,
    },

    maxParticipants: 16,
    equipment: ['Pickleball Paddles', 'Pickleball Balls', 'Water'],
    instructions: '토요일 오전 9시에 코트 1번에서 만나요. 운동복과 피클볼화 착용 필수입니다.',
  };
};

/**
 * Sample member invitation data
 */
export const createSampleInvitationData = () => {
  return {
    email: 'newplayer@example.com',
    message:
      '안녕하세요! 저희 애틀랜타 한인 피클볼 클럽에 초대합니다. 함께 즐거운 피클볼 시간을 보내요!',
    role: 'member',
  };
};

/**
 * Sample chat message data
 */
export const createSampleMessageData = () => {
  return {
    text: '안녕하세요! 이번 주 토요일 연습에 참석 가능한 분들 댓글 달아주세요. 🎾',
    type: 'message',
  };
};

/**
 * Generate multiple sample clubs for testing
 */
export const generateSampleClubs = () => {
  const clubs = [
    {
      name: 'Atlanta Korean Pickleball Club',
      description: '한인 피클볼 동호회입니다. 초급부터 고급까지 모든 레벨을 환영합니다.',
      location: { address: 'Piedmont Park, Atlanta, GA', region: 'Metro Atlanta' },
      tags: ['Korean', 'Mixed Level', 'Social'],
      languages: ['ko', 'en'],
    },
    {
      name: 'Buckhead Pickleball Society',
      description: 'Competitive pickleball club for intermediate to advanced players in Buckhead area.',
      location: { address: 'Buckhead, Atlanta, GA', region: 'Buckhead' },
      tags: ['Advanced', 'Competitive', 'Tournaments'],
      languages: ['en'],
    },
    {
      name: 'Decatur Community Pickleball',
      description: 'Family-friendly pickleball club welcoming players of all ages and skill levels.',
      location: { address: 'Decatur, GA', region: 'Decatur' },
      tags: ['Family', 'Beginner', 'Community'],
      languages: ['en'],
    },
    {
      name: 'Midtown Pickleball Meetup',
      description: 'Casual pickleball group for young professionals in Midtown Atlanta.',
      location: { address: 'Midtown, Atlanta, GA', region: 'Midtown' },
      tags: ['Young Professional', 'Casual', 'Networking'],
      languages: ['en'],
    },
    {
      name: 'Marietta Pickleball League',
      description: 'Organized pickleball league with seasonal tournaments and regular matches.',
      location: { address: 'Marietta, GA', region: 'Marietta' },
      tags: ['League', 'Tournament', 'Organized'],
      languages: ['en'],
    },
  ];

  return clubs.map(club => ({
    ...club,
    settings: {
      isPublic: true,
      joinRequiresApproval: Math.random() > 0.5,
      maxMembers: Math.floor(Math.random() * 50) + 20,
    },
    skillLevel: ['mixed', 'beginner', 'intermediate', 'advanced'][Math.floor(Math.random() * 4)],
    playingStyle: ['both_great', 'singles_specialist', 'doubles_specialist'],
    contact: {
      email: `${club.name.toLowerCase().replace(/\s+/g, '')}@example.com`,
    },
    stats: {
      totalMembers: Math.floor(Math.random() * 30) + 5,
      activeMembers: Math.floor(Math.random() * 25) + 3,
      totalEvents: Math.floor(Math.random() * 50) + 10,
      monthlyEvents: Math.floor(Math.random() * 8) + 2,
    },
  }));
};

/**
 * Test club system functionality
 */
export const testClubSystem = async (clubService, authContext) => {
  try {
    console.log('🧪 Starting club system test...');

    // Check if user is authenticated
    if (!authContext.isAuthenticated()) {
      throw new Error('User must be authenticated to test club system');
    }

    // Test 1: Create a club
    console.log('📋 Test 1: Creating a sample club...');
    const sampleClub = createSampleClubData();
    const clubId = await clubService.createClub(sampleClub);
    console.log('✅ Club created with ID:', clubId);

    // Test 2: Get the created club
    console.log('📋 Test 2: Retrieving created club...');
    const retrievedClub = await clubService.getClub(clubId);
    console.log('✅ Club retrieved:', retrievedClub.name);

    // Test 3: Create a club event
    console.log('📋 Test 3: Creating a sample event...');
    const sampleEvent = createSampleEventData();
    const eventId = await clubService.createClubEvent(clubId, sampleEvent);
    console.log('✅ Event created with ID:', eventId);

    // Test 4: Get club events
    console.log('📋 Test 4: Retrieving club events...');
    const events = await clubService.getClubEvents(clubId, { upcoming: true });
    console.log('✅ Retrieved events:', events.length);

    // Test 5: Send a club message
    console.log('📋 Test 5: Sending a club message...');
    const sampleMessage = createSampleMessageData();
    const messageId = await clubService.sendClubMessage(clubId, sampleMessage);
    console.log('✅ Message sent with ID:', messageId);

    // Test 6: Get club messages
    console.log('📋 Test 6: Retrieving club messages...');
    const messages = await clubService.getClubMessages(clubId);
    console.log('✅ Retrieved messages:', messages.length);

    // Test 7: Search clubs
    console.log('📋 Test 7: Searching clubs...');
    const searchResults = await clubService.searchClubs({ location: 'Metro Atlanta' });
    console.log('✅ Search results:', searchResults.length);

    console.log('🎉 All club system tests passed!');

    return {
      success: true,
      clubId,
      eventId,
      messageId,
      testResults: {
        clubCreated: true,
        eventCreated: true,
        messagesSent: true,
        searchWorking: true,
      },
    };
  } catch (error) {
    console.error('❌ Club system test failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Seed database with sample data
 */
export const seedClubDatabase = async (clubService, authContext) => {
  try {
    console.log('🌱 Starting database seeding...');

    if (!authContext.isAuthenticated()) {
      throw new Error('User must be authenticated to seed database');
    }

    const sampleClubs = generateSampleClubs();
    const createdClubs = [];

    for (const club of sampleClubs) {
      try {
        const clubId = await clubService.createClub(club);
        console.log(`✅ Created club: ${club.name}`);
        createdClubs.push(clubId);

        // Add a small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.warn(`⚠️ Failed to create club ${club.name}:`, error.message);
      }
    }

    console.log(`🌱 Database seeding completed. Created ${createdClubs.length} clubs.`);
    return {
      success: true,
      createdClubs,
    };
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Validate club data structure
 */
export const validateClubData = clubData => {
  const required = ['name', 'description', 'location'];
  const missing = required.filter(field => !clubData[field]);

  if (missing.length > 0) {
    return {
      isValid: false,
      errors: [`Missing required fields: ${missing.join(', ')}`],
    };
  }

  if (clubData.name.length < 3) {
    return {
      isValid: false,
      errors: ['Club name must be at least 3 characters long'],
    };
  }

  if (clubData.description.length < 10) {
    return {
      isValid: false,
      errors: ['Club description must be at least 10 characters long'],
    };
  }

  return {
    isValid: true,
    errors: [],
  };
};

/**
 * Log club statistics
 */
export const logClubStatistics = club => {
  console.log('📊 Club Statistics:');
  console.log('├── Name:', club.name);
  console.log('├── Location:', club.location?.address);
  console.log('├── Members:', club.stats?.totalMembers || 0);
  console.log('├── Events:', club.stats?.totalEvents || 0);
  console.log('├── Tags:', club.tags?.join(', ') || 'None');
  console.log('├── Languages:', club.languages?.join(', ') || 'None');
  console.log('└── Status:', club.status || 'Unknown');
};
